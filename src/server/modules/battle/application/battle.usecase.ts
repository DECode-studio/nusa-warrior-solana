import "server-only";
import { createHash, randomUUID } from "node:crypto";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import type {
  BattleStateEntity,
  BotDifficulty,
} from "@/client/domain/battle/entity/battle_entity";
import { listDecksUseCase } from "@/server/modules/deck/application/deck.usecase";
import { cardRepository } from "@/server/modules/card/infrastructure/card.repository.impl";
import { AppError } from "@/server/shared/errors/app-error";
import { isPrismaDriverEnabled } from "@/server/shared/db/prisma";
import { logServerEvent } from "@/server/shared/logging/server-logger";
import type {
  StoredMatchLogRecord,
  StoredQuickMatchQueueRecord,
} from "@/server/shared/db/embedded-store";
import { battleRepository } from "../infrastructure/battle.repository.impl";
import type { QuickMatchQueueInput } from "../domain/battle.repository";
import { BattleEngine, shuffleCards } from "../domain/battle_engine";
import { buildBotDeckByDifficulty } from "../domain/bot_deck_builder";
import {
  AUDIT_RNG_ALGORITHM,
  commitBattleSeed,
  createAuditableRandom,
  createBattleSeed,
  decryptBattleSeed,
  encryptBattleSeed,
  secureBattleRandomInt,
  type RngDraw,
} from "../domain/auditable-rng";
import { BotAiService } from "../domain/bot_ai_service";
import { NUSA_POINT_POLICY } from "@/server/modules/nusa-points/domain/nusa-point-policy";
import { getStoryMission } from "@/server/modules/story-mode/domain/story-catalog";

export type BattleAction =
  | { type: "ROLL_DICE" }
  | { type: "PLAY_INSTRUMENT"; handInstanceId: string; targetRow: "FRONT" | "SECOND"; targetIndex: number; targetSide?: "OWN" | "OPPONENT" }
  | { type: "DECLARE_ATTACK"; attackerFrontIndex: number; defenderFrontIndex: number }
  | { type: "CONFIRM_DEFENDER_RESPONSE" }
  | { type: "CONTINUE_CLASH" }
  | { type: "PROMOTE_CHARACTER"; secondRowIndex: number }
  | { type: "END_TURN" }
  | { type: "DISCARD_INSTRUMENT"; handInstanceId: string }
  | { type: "SURRENDER" };

export interface BattleSessionView {
  id: string;
  sequence: number;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED";
  rulesVersion: string;
  turnDeadlineAt: string | null;
  state: BattleStateEntity;
  isQuickMatch?: boolean;
  opponentName?: string | null;
  rewardCardSlug?: string | null;
  storyKingdom?: "MAJAPAHIT" | "PAJAJARAN" | null;
  storyMissionId?: string | null;
  storyChoiceId?: string | null;
  vaultPda?: string | null;
  playerLockTxSignature?: string | null;
  opponentLockTxSignature?: string | null;
  settleTxSignature?: string | null;
  rngCommitment: string | null;
  rngAudit?: {
    algorithm: string;
    seed: string;
    draws: RngDraw[];
    stateHash: string;
    auditHead: string | null;
  };
}

function hashAuditEvent(previousHash: string | null, event: Record<string, unknown>): string {
  return createHash("sha256")
    .update(JSON.stringify({ previousHash, event }), "utf8")
    .digest("hex");
}

function redactState(state: BattleStateEntity): BattleStateEntity {
  const hiddenCard = (card: CardEntity): CardEntity => ({
    id: "hidden-card",
    code: "HIDDEN",
    slug: "hidden-card",
    name: "Kartu Tertutup",
    cardType: card.cardType,
    kingdom: "NUSANTARA_UMUM",
    role: "PRAJURIT",
    secondaryRoles: [],
    gender: null as CardEntity["gender"],
    baseAttack: 0,
    baseDefense: 0,
    effectName: null,
    effectType: null,
    effectDescriptionId: null,
    effectDescriptionEn: null,
    effectDescriptionZh: null,
    attackMod: 0,
    strikeAttackBonus: 0,
    defenseMod: 0,
    enemyAttackMod: 0,
    ignoreDefenseAmount: 0,
    affinityRole: null,
    affinityGender: null as CardEntity["affinityGender"],
    affinityBonusAtk: 0,
    affinityBonusDef: 0,
    historicalSummaryId: "",
    historicalSummaryEn: "",
    historicalSummaryZh: "",
    illustrationNote: "",
    sourceCitation: "",
    sourceUrl: null,
    verificationStatus: "NEEDS_REVIEW",
    publicationStatus: "ACTIVE",
    imagePath: "",
    asset: null,
  });
  const hideSlot = (slot: BattleStateEntity["botFrontRow"][number], force = false) =>
    slot && (force || !slot.isRevealed)
      ? {
          ...slot,
          isRevealed: false,
          card: hiddenCard(slot.card),
          currentAttack: 0,
          currentDefense: 0,
          tempAttackMod: 0,
          tempDefenseMod: 0,
          tempEnemyAttackMod: 0,
          tempIgnoreDefense: 0,
          appliedInstruments: [],
        }
      : slot;
  return {
    ...state,
    playerCharacterDeck: state.playerCharacterDeck.map(hiddenCard),
    playerInstrumentDeck: state.playerInstrumentDeck.map(hiddenCard),
    botFrontRow: state.botFrontRow.map((slot) => hideSlot(slot)),
    botSecondRow: state.botSecondRow.map((slot) => hideSlot(slot, true)),
    botCharacterDeck: state.botCharacterDeck.map(hiddenCard),
    botInstrumentDeck: state.botInstrumentDeck.map(hiddenCard),
    botInstrumentHand: state.botInstrumentHand.map((item, index) => ({
      // Keep hidden cards anonymous while giving each rendered slot a unique identity.
      instanceId: `hidden-instrument-${index}`,
      card: hiddenCard(item.card),
    })),
  };
}

function swapBattlePerspective(state: BattleStateEntity): BattleStateEntity {
  const side = (value: "PLAYER" | "BOT" | null): "PLAYER" | "BOT" | null =>
    value === "PLAYER" ? "BOT" : value === "BOT" ? "PLAYER" : null;
  return {
    ...state,
    playerDeckName: state.playerDeckName,
    activePlayer: side(state.activePlayer) ?? "PLAYER",
    winner: side(state.winner),
    diceRollResult: state.diceRollResult
      ? {
          playerRoll: state.diceRollResult.botRoll,
          botRoll: state.diceRollResult.playerRoll,
          firstPlayer: side(state.diceRollResult.firstPlayer) ?? "PLAYER",
        }
      : null,
    playerFrontRow: state.botFrontRow,
    playerSecondRow: state.botSecondRow,
    botFrontRow: state.playerFrontRow,
    botSecondRow: state.playerSecondRow,
    playerCharacterDeck: state.botCharacterDeck,
    botCharacterDeck: state.playerCharacterDeck,
    playerInstrumentDeck: state.botInstrumentDeck,
    botInstrumentDeck: state.playerInstrumentDeck,
    playerInstrumentHand: state.botInstrumentHand,
    botInstrumentHand: state.playerInstrumentHand,
    playerInstrumentDiscard: state.botInstrumentDiscard,
    botInstrumentDiscard: state.playerInstrumentDiscard,
    playerGraveyard: state.botGraveyard,
    botGraveyard: state.playerGraveyard,
    pendingAttack: state.pendingAttack
      ? { ...state.pendingAttack, attackerSide: side(state.pendingAttack.attackerSide) ?? "PLAYER" }
      : null,
    pendingPromotion: state.pendingPromotion
      ? { ...state.pendingPromotion, side: side(state.pendingPromotion.side) ?? "PLAYER" }
      : null,
    lastDuelOutcome: state.lastDuelOutcome
      ? {
          ...state.lastDuelOutcome,
          attackerSide: side(state.lastDuelOutcome.attackerSide) ?? "PLAYER",
          defeatedSide: side(state.lastDuelOutcome.defeatedSide),
        }
      : null,
    battleLogs: state.battleLogs.map((entry) => ({
      ...entry,
      actor: entry.actor === "SYSTEM" ? "SYSTEM" : side(entry.actor) ?? "PLAYER",
      ...(entry.messageParams
        ? {
            messageParams: Object.fromEntries(
              Object.entries(entry.messageParams).map(([key, value]) => [
                key,
                ["actor", "firstPlayer", "nextPlayer", "winner"].includes(key)
                  ? side(value === "PLAYER" || value === "BOT" ? value : null) ?? value
                  : value,
              ])
            ),
          }
        : {}),
    })),
  };
}

function toSessionView(record: {
  id: string;
  sequence: number;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED";
  stateJson: string;
  eventsJson: string;
  rulesVersion: string;
  turnDeadlineAt: string | null;
  rngCommitment: string | null;
  rngSecret: string | null;
  rngDrawsJson: string;
  userId?: string;
  opponentUserId?: string | null;
  opponentDeckName?: string | null;
  isQuickMatch?: boolean;
  rewardCardSlug?: string | null;
  storyKingdom?: "MAJAPAHIT" | "PAJAJARAN" | null;
  storyMissionId?: string | null;
  storyChoiceId?: string | null;
  vaultPda?: string | null;
  playerLockTxSignature?: string | null;
  opponentLockTxSignature?: string | null;
  settleTxSignature?: string | null;
}, viewerUserId?: string): BattleSessionView {
  const canonicalState = JSON.parse(record.stateJson) as BattleStateEntity;
  const isSecondPlayer = Boolean(record.isQuickMatch && viewerUserId && record.opponentUserId === viewerUserId);
  const state = isSecondPlayer ? swapBattlePerspective(canonicalState) : canonicalState;
  if (isSecondPlayer && record.opponentDeckName) state.playerDeckName = record.opponentDeckName;
  const events = JSON.parse(record.eventsJson) as Array<Record<string, unknown>>;
  const view: BattleSessionView = {
    id: record.id,
    sequence: record.sequence,
    status: record.status,
    rulesVersion: record.rulesVersion,
    turnDeadlineAt: record.turnDeadlineAt,
    vaultPda: record.vaultPda ?? null,
    playerLockTxSignature: record.playerLockTxSignature ?? null,
    opponentLockTxSignature: record.opponentLockTxSignature ?? null,
    settleTxSignature: record.settleTxSignature ?? null,
    state: record.status === "ACTIVE" || record.isQuickMatch ? redactState(state) : state,
    rngCommitment: record.rngCommitment,
    isQuickMatch: Boolean(record.isQuickMatch),
    opponentName: (record.storyKingdom === "MAJAPAHIT" || record.storyKingdom === "PAJAJARAN") && record.storyMissionId
      ? getStoryMission(record.storyKingdom, record.storyMissionId)?.opponentTitle ?? null
      : null,
    rewardCardSlug: record.rewardCardSlug ?? null,
    storyKingdom: record.storyKingdom ?? null,
    storyMissionId: record.storyMissionId ?? null,
    storyChoiceId: record.storyChoiceId ?? null,
  };
  if (record.status !== "ACTIVE" && record.rngSecret) {
    view.rngAudit = {
      algorithm: AUDIT_RNG_ALGORITHM,
      seed: decryptBattleSeed(record.rngSecret),
      draws: JSON.parse(record.rngDrawsJson) as RngDraw[],
      stateHash: createHash("sha256").update(record.stateJson, "utf8").digest("hex"),
      auditHead: typeof events.at(-1)?.hash === "string" ? String(events.at(-1)?.hash) : null,
    };
  }
  return {
    ...view,
  };
}

export async function listMatchesUseCase(userId: string): Promise<StoredMatchLogRecord[]> {
  return battleRepository.listMatches(userId);
}

export async function createBattleSessionUseCase(input: {
  userId: string;
  requestId?: string;
  createRequestKey: string;
  deckId: string;
  botDifficulty: BotDifficulty;
  story?: {
    kingdom: "MAJAPAHIT" | "PAJAJARAN";
    missionId: string;
    choiceId: string | null;
  };
  storyDeck?: {
    id: string;
    name: string;
    characterSlugs: string[];
    instrumentSlugs: string[];
  };
  storyOpponentDeck?: {
    characterSlugs: string[];
    instrumentSlugs: string[];
  };
}): Promise<BattleSessionView> {
  if (input.story) {
    const existing = await battleRepository.getBattleSessionByCreateRequestKey(input.createRequestKey);
    if (existing) {
      if (existing.userId !== input.userId) throw AppError.conflict("Kunci idempotensi sudah digunakan.");
      return toSessionView(existing, input.userId);
    }
  }
  logServerEvent("info", "battle.session.create_started", {
    requestId: input.requestId,
    userId: input.userId,
    deckId: input.deckId,
    botDifficulty: input.botDifficulty,
    storage: isPrismaDriverEnabled() ? "prisma" : "embedded",
  });
  if (process.env.NODE_ENV === "production" && !isPrismaDriverEnabled()) {
    throw AppError.internal("Battle authoritative memerlukan storage Prisma di production.");
  }
  const decks = input.storyDeck ? [] : await listDecksUseCase(input.userId);
  const deck = input.storyDeck ?? decks.find((item) => item.id === input.deckId);
  if (!deck) throw AppError.notFound("Deck tidak ditemukan atau bukan milik Anda.");

  const catalog = await cardRepository.findMany({ includeWithdrawn: false });
  const cardBySlug = new Map(catalog.map((card) => [card.slug, card]));
  const playerCharacters = deck.characterSlugs.map((slug) => cardBySlug.get(slug));
  const playerInstruments = deck.instrumentSlugs.map((slug) => cardBySlug.get(slug));
  if (playerCharacters.length === 0 || playerCharacters.length > 10 || playerCharacters.some((card) => !card || card.cardType !== "CHARACTER")) {
    throw AppError.validation("Deck harus memiliki antara 1 hingga 10 kartu karakter aktif.");
  }
  if (input.story && input.storyDeck && playerCharacters.some((card) => card?.kingdom !== input.story?.kingdom)) {
    throw AppError.validation("Story Deck hanya dapat memakai karakter dari kerajaan cerita tersebut.");
  }
  if (playerInstruments.length > 10 || playerInstruments.some((card) => !card || card.cardType !== "INSTRUMENT")) {
    throw AppError.validation("Daftar instrumen deck tidak valid.");
  }

  const characters = catalog.filter((card) => card.cardType === "CHARACTER");
  const instruments = catalog.filter((card) => card.cardType === "INSTRUMENT");
  if (characters.length < 20 || instruments.length < 8) {
    throw AppError.internal("Katalog kartu belum cukup untuk membuat match.");
  }
  const rngSeed = createBattleSeed();
  const rng = createAuditableRandom(rngSeed);
  let botCharacters: CardEntity[];
  let botInstruments: CardEntity[];
  if (input.storyOpponentDeck) {
    const storyOpponentCharacters = input.storyOpponentDeck.characterSlugs.map((slug) => cardBySlug.get(slug));
    const storyOpponentInstruments = input.storyOpponentDeck.instrumentSlugs.map((slug) => cardBySlug.get(slug));
    if (
      storyOpponentCharacters.length === 0 ||
      storyOpponentCharacters.length > 10 ||
      storyOpponentCharacters.some((card) => !card || card.cardType !== "CHARACTER") ||
      storyOpponentInstruments.length > 10 ||
      storyOpponentInstruments.some((card) => !card || card.cardType !== "INSTRUMENT")
    ) {
      throw AppError.validation("Story Deck lawan tidak valid.");
    }
    botCharacters = storyOpponentCharacters as CardEntity[];
    botInstruments = storyOpponentInstruments as CardEntity[];
  } else {
    const botDeck = buildBotDeckByDifficulty(catalog as CardEntity[], input.botDifficulty, rng.int);
    botCharacters = botDeck.botCharacters;
    botInstruments = botDeck.botInstruments;
  }
  const sessionId = randomUUID();
  const state = BattleEngine.createInitialState({
    playerDeckName: deck.name,
    botDifficulty: input.botDifficulty,
    playerCharacters: playerCharacters as CardEntity[],
    playerInstruments: playerInstruments as CardEntity[],
    botCharacters,
    botInstruments,
  }, rng.int);
  state.matchId = sessionId;
  const commitment = commitBattleSeed(rngSeed);
  const firstAuditEvent = { sequence: 0, type: "RNG_COMMITMENT", commitment };
  const initialAuditEvents = [{
    ...firstAuditEvent,
    hash: hashAuditEvent(null, firstAuditEvent),
  }];
  if (input.story) await surrenderPendingNonLeagueBattlesUseCase([input.userId]);
  const record = await battleRepository.createBattleSession({
    id: sessionId,
    createRequestKey: input.createRequestKey,
    userId: input.userId,
    deckId: deck.id,
    deckName: deck.name,
    botDifficulty: input.botDifficulty,
    rulesVersion: input.story ? "story-v1" : "rules-v1",
    stateJson: JSON.stringify(state),
    eventsJson: JSON.stringify(initialAuditEvents),
    rngCommitment: commitment,
    rngSecret: encryptBattleSeed(rngSeed),
    rngCounter: rng.counter,
    rngDrawsJson: JSON.stringify(rng.draws),
    storyKingdom: input.story?.kingdom,
    storyMissionId: input.story?.missionId,
    storyChoiceId: input.story?.choiceId,
  });
  logServerEvent("info", "battle.session.created", {
    requestId: input.requestId,
    userId: input.userId,
    matchId: sessionId,
    deckId: deck.id,
    rulesVersion: record.rulesVersion,
    storage: isPrismaDriverEnabled() ? "prisma" : "embedded",
  });
  return toSessionView(record);
}

function validateQuickMatchDeck(
  deck: Awaited<ReturnType<typeof listDecksUseCase>>[number],
  cardBySlug: Map<string, CardEntity>
): { characters: CardEntity[]; instruments: CardEntity[]; battlePower: number } {
  const characters = deck.characterSlugs.map((slug) => cardBySlug.get(slug));
  const instruments = deck.instrumentSlugs.map((slug) => cardBySlug.get(slug));
  if (characters.length === 0 || characters.length > 10 || characters.some((card) => !card || card.cardType !== "CHARACTER")) {
    throw AppError.validation("Deck quick match harus memiliki 1 sampai 10 kartu karakter aktif.");
  }
  const pendingCustom = characters.find(
    (card) => card && (card as { isCustom?: boolean; customStatus?: string | null }).isCustom && (card as { customStatus?: string | null }).customStatus !== "APPROVED"
  );
  if (pendingCustom) {
    throw AppError.validation(
      `Kartu '${pendingCustom.name}' masih dalam proses kurasi (${(pendingCustom as { customStatus?: string | null }).customStatus || "PENDING"}) dan belum dapat digunakan dalam mode Quick Match PvP.`
    );
  }
  if (instruments.length > 10 || instruments.some((card) => !card || card.cardType !== "INSTRUMENT")) {
    throw AppError.validation("Daftar instrumen deck quick match tidak valid.");
  }
  const validCharacters = characters as CardEntity[];
  return {
    characters: validCharacters,
    instruments: instruments as CardEntity[],
    battlePower: validCharacters.reduce((sum, card) => sum + card.baseAttack + card.baseDefense, 0),
  };
}

function makeQuickMatchSessionBuilder(
  catalogBySlug: Map<string, CardEntity>
) {
  return (player: StoredQuickMatchQueueRecord, opponent: StoredQuickMatchQueueRecord, id: string) => {
    const playerCharacters = (JSON.parse(player.characterSlugsJson) as string[]).map((slug) => catalogBySlug.get(slug));
    const playerInstruments = (JSON.parse(player.instrumentSlugsJson) as string[]).map((slug) => catalogBySlug.get(slug));
    const opponentCharacters = (JSON.parse(opponent.characterSlugsJson) as string[]).map((slug) => catalogBySlug.get(slug));
    const opponentInstruments = (JSON.parse(opponent.instrumentSlugsJson) as string[]).map((slug) => catalogBySlug.get(slug));
    if (playerCharacters.some((card) => !card) || playerInstruments.some((card) => !card) || opponentCharacters.some((card) => !card) || opponentInstruments.some((card) => !card)) {
      throw AppError.conflict("Deck salah satu pemain tidak lagi tersedia.");
    }
    const seed = createBattleSeed();
    const rng = createAuditableRandom(seed);
    const state = BattleEngine.createInitialState({
      playerDeckName: player.deckName,
      botDifficulty: "HARD",
      playerCharacters: playerCharacters as CardEntity[],
      playerInstruments: playerInstruments as CardEntity[],
      botCharacters: opponentCharacters as CardEntity[],
      botInstruments: opponentInstruments as CardEntity[],
    }, rng.int);
    state.matchId = id;
    const commitment = commitBattleSeed(seed);
    const firstAuditEvent = { sequence: 0, type: "RNG_COMMITMENT", commitment };
    const events = [{ ...firstAuditEvent, hash: hashAuditEvent(null, firstAuditEvent) }];
    return {
      id,
      userId: player.userId,
      opponentUserId: opponent.userId,
      deckId: player.deckId,
      deckName: player.deckName,
      opponentDeckId: opponent.deckId,
      opponentDeckName: opponent.deckName,
      playerDeckCardSlugs: [
        ...(JSON.parse(player.characterSlugsJson) as string[]),
        ...(JSON.parse(player.instrumentSlugsJson) as string[]),
      ],
      opponentDeckCardSlugs: [
        ...(JSON.parse(opponent.characterSlugsJson) as string[]),
        ...(JSON.parse(opponent.instrumentSlugsJson) as string[]),
      ],
      stateJson: JSON.stringify(state),
      eventsJson: JSON.stringify(events),
      rngCommitment: commitment,
      rngSecret: encryptBattleSeed(seed),
      rngCounter: rng.counter,
      rngDrawsJson: JSON.stringify(rng.draws),
    };
  };
}

async function prepareQuickMatchQueueInput(input: {
  userId: string;
  deckId: string;
  idempotencyKey: string;
}): Promise<{ queue: QuickMatchQueueInput; deckName: string; catalogBySlug: Map<string, CardEntity> }> {
  const decks = await listDecksUseCase(input.userId);
  const deck = decks.find((item) => item.id === input.deckId);
  if (!deck) throw AppError.notFound("Deck tidak ditemukan atau bukan milik Anda.");
  const catalog = await cardRepository.findMany({ includeWithdrawn: false });
  const catalogBySlug = new Map(catalog.map((card) => [card.slug, card]));
  const valid = validateQuickMatchDeck(deck, catalogBySlug);
  return {
    deckName: deck.name,
    catalogBySlug,
    queue: {
      id: randomUUID(),
      userId: input.userId,
      deckId: deck.id,
      deckName: deck.name,
      battlePower: valid.battlePower,
      characterSlugs: deck.characterSlugs,
      instrumentSlugs: deck.instrumentSlugs,
      idempotencyKey: input.idempotencyKey,
      acceptedAt: new Date(),
    },
  };
}

export interface QuickMatchQueueView {
  id: string;
  status: "WAITING" | "MATCHED" | "CANCELLED";
  battlePower: number;
  createdAt: string;
  waitMs: number;
  session: BattleSessionView | null;
}

function mapQueueView(entry: StoredQuickMatchQueueRecord, session: BattleSessionView | null): QuickMatchQueueView {
  return {
    id: entry.id,
    status: entry.status,
    battlePower: entry.battlePower,
    createdAt: entry.createdAt,
    waitMs: Math.max(0, Date.now() - Date.parse(entry.createdAt)),
    session,
  };
}

function isTerminalBattleSession(session: BattleSessionView | null): boolean {
  return Boolean(session && (session.status !== "ACTIVE" || session.state.phase === "MATCH_OVER"));
}

export async function joinQuickMatchQueueUseCase(input: {
  userId: string;
  deckId: string;
  idempotencyKey: string;
  acceptCardStake: true;
}): Promise<QuickMatchQueueView> {
  if (input.acceptCardStake !== true) throw AppError.validation("Persetujuan taruhan kartu diperlukan.");
  if (process.env.NODE_ENV === "production" && !isPrismaDriverEnabled()) {
    throw AppError.internal("Quick match memerlukan storage Prisma di production.");
  }
  const prepared = await prepareQuickMatchQueueInput(input);
  const result = await battleRepository.processQuickMatchQueue({
    userId: input.userId,
    enqueue: prepared.queue,
    buildSession: makeQuickMatchSessionBuilder(prepared.catalogBySlug),
  });
  if (!result) throw AppError.internal("Antrean quick match tidak dapat dibuat.");
  const session = result.session
    ? toSessionView(result.session, input.userId)
    : result.queue.battleSessionId
      ? await getBattleSessionUseCase(result.queue.battleSessionId, input.userId).catch(() => null)
      : null;
  if (isTerminalBattleSession(session)) {
    throw AppError.conflict("Pertandingan quick match sebelumnya sudah selesai. Mulai pencarian baru.");
  }
  return mapQueueView(result.queue, session);
}

export async function getQuickMatchQueueStatusUseCase(userId: string): Promise<QuickMatchQueueView | null> {
  if (process.env.NODE_ENV === "production" && !isPrismaDriverEnabled()) {
    throw AppError.internal("Quick match memerlukan storage Prisma di production.");
  }
  const active = await battleRepository.getLatestActiveBattleSession(userId);
  if (active && !active.isQuickMatch) return null;
  if (active?.isQuickMatch) {
    const session = toSessionView(active, userId);
    if (isTerminalBattleSession(session)) return null;
    return {
      id: active.id,
      status: "MATCHED",
      battlePower: 0,
      createdAt: active.createdAt,
      waitMs: 0,
      session,
    };
  }
  const entry = await battleRepository.getQuickMatchQueueEntry(userId);
  if (!entry) return null;
  const session = entry.battleSessionId
    ? await getBattleSessionUseCase(entry.battleSessionId, userId).catch(() => null)
    : null;
  if (isTerminalBattleSession(session)) return null;
  return mapQueueView(entry, session);
}

export async function searchQuickMatchQueueUseCase(userId: string): Promise<QuickMatchQueueView | null> {
  if (process.env.NODE_ENV === "production" && !isPrismaDriverEnabled()) {
    throw AppError.internal("Quick match memerlukan storage Prisma di production.");
  }
  const active = await battleRepository.getLatestActiveBattleSession(userId);
  if (active && !active.isQuickMatch) throw AppError.conflict("Selesaikan pertandingan aktif sebelum mencari quick match.");
  if (active?.isQuickMatch) {
    const session = toSessionView(active, userId);
    if (isTerminalBattleSession(session)) return null;
    return {
      id: active.id,
      status: "MATCHED",
      battlePower: 0,
      createdAt: active.createdAt,
      waitMs: 0,
      session,
    };
  }
  const catalog = await cardRepository.findMany({ includeWithdrawn: false });
  const catalogBySlug = new Map(catalog.map((card) => [card.slug, card]));
  const result = await battleRepository.processQuickMatchQueue({
    userId,
    buildSession: makeQuickMatchSessionBuilder(catalogBySlug),
  });
  if (!result) return null;
  const session = result.queue.battleSessionId
    ? await getBattleSessionUseCase(result.queue.battleSessionId, userId).catch(() => null)
    : null;
  if (isTerminalBattleSession(session)) return null;
  return mapQueueView(result.queue, session);
}

export async function cancelQuickMatchQueueUseCase(userId: string): Promise<boolean> {
  return battleRepository.cancelQuickMatchQueue(userId);
}

export async function getBattleSessionUseCase(
  id: string,
  userId: string
): Promise<BattleSessionView> {
  const record = await battleRepository.getBattleSession(id, userId);
  if (!record) throw AppError.notFound("Match tidak ditemukan.");
  return toSessionView(record, userId);
}

const BATTLE_HEARTBEAT_STALE_MS = 45_000;
const QUICK_MATCH_HEARTBEAT_STALE_MS = 15_000;
const BATTLE_RECONNECT_GRACE_MS = 90_000;
const QUICK_MATCH_RECONNECT_GRACE_MS = 60_000;
const LEAGUE_RECONNECT_GRACE_MS = 180_000;

export async function reconnectBattleSessionUseCase(
  id: string,
  userId: string
): Promise<BattleSessionView> {
  let current = await battleRepository.getBattleSession(id, userId);
  if (!current) throw AppError.notFound("Match tidak ditemukan.");
  const isQuickMatch = Boolean(current.isQuickMatch);
  const isLeagueSession = current.rulesVersion === "league-v1";
  const reconnectGraceMs = isLeagueSession ? LEAGUE_RECONNECT_GRACE_MS : QUICK_MATCH_RECONNECT_GRACE_MS;
  if (isQuickMatch) {
    const now = Date.now();
    const staleBeforeDeadline = (lastSeen: string) =>
      Date.parse(lastSeen) + (isLeagueSession ? reconnectGraceMs : QUICK_MATCH_HEARTBEAT_STALE_MS + reconnectGraceMs) <= now;
    if (
      staleBeforeDeadline(current.lastSeenAt) ||
      staleBeforeDeadline(current.opponentLastSeenAt ?? current.createdAt) ||
      Boolean(current.reconnectDeadlineAt && Date.parse(current.reconnectDeadlineAt) <= now) ||
      Boolean(current.opponentReconnectDeadlineAt && Date.parse(current.opponentReconnectDeadlineAt) <= now) ||
      Boolean(current.turnDeadlineAt && Date.parse(current.turnDeadlineAt) <= now)
    ) {
      await sweepBattleSessionsUseCase(new Date(now));
      current = await battleRepository.getBattleSession(id, userId) ?? current;
      if (current.status === "COMPLETED") return toSessionView(current, userId);
    }
  }
  const record = await battleRepository.reconnectBattleSession(
    id,
    userId,
    new Date(),
    isQuickMatch ? QUICK_MATCH_HEARTBEAT_STALE_MS : BATTLE_HEARTBEAT_STALE_MS,
    isLeagueSession ? LEAGUE_RECONNECT_GRACE_MS : isQuickMatch ? QUICK_MATCH_RECONNECT_GRACE_MS : BATTLE_RECONNECT_GRACE_MS
  );
  if (!record) {
    current = await battleRepository.getBattleSession(id, userId) ?? current;
    if (current.status === "COMPLETED") return toSessionView(current, userId);
    throw AppError.conflict("Masa reconnect pertandingan telah berakhir.");
  }
  return toSessionView(record, userId);
}

export async function reconnectLatestActiveBattleSessionUseCase(
  userId: string
): Promise<BattleSessionView | null> {
  const record = await battleRepository.getLatestActiveBattleSession(userId);
  if (!record) return null;
  try {
    return await reconnectBattleSessionUseCase(record.id, userId);
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 409) return null;
    throw error;
  }
}

export async function sweepBattleSessionsUseCase(now = new Date()): Promise<number> {
  const expired = await battleRepository.sweepBattleSessions(
    now,
    new Date(now.getTime() - BATTLE_HEARTBEAT_STALE_MS),
    BATTLE_RECONNECT_GRACE_MS
  );
  if (expired > 0) {
    logServerEvent("info", "battle.sessions.timed_out", { count: expired });
  }
  return expired;
}

function applyPlayerAction(
  state: BattleStateEntity,
  action: BattleAction,
  rng = secureBattleRandomInt
): BattleStateEntity {
  switch (action.type) {
    case "ROLL_DICE":
      if (state.phase !== "DICE_ROLL") throw AppError.conflict("Dadu hanya dapat dilempar saat fase awal.");
      if (state.activePlayer !== "PLAYER") throw AppError.conflict("Hanya pemain yang mendapat giliran yang dapat memulai lemparan dadu.");
      return BattleEngine.drawInstrumentForActivePlayer(BattleEngine.resolveDiceRoll(state, undefined, rng), rng);
    case "PLAY_INSTRUMENT": {
      const isDefense = state.phase === "DEFENDER_INSTRUMENT_RESPONSE" && state.pendingAttack?.attackerSide === "BOT";
      const isPreAttack = state.phase === "PRE_ATTACK_INSTRUMENT" && state.activePlayer === "PLAYER";
      if (!isDefense && !isPreAttack) throw AppError.conflict("Instrumen tidak dapat dimainkan pada fase ini.");
      if (action.targetIndex < 0 || action.targetIndex > (action.targetRow === "FRONT" ? 1 : 2)) throw AppError.validation("Target kartu tidak valid.");
      const targetSide = action.targetSide ?? "OWN";
      const handInstrument = state.playerInstrumentHand.find((item) => item.instanceId === action.handInstanceId)?.card;
      const isDirectEnemyDebuff = handInstrument?.effectType === "DEBUFF_ENEMY_ATK";
      if ((targetSide === "OPPONENT") !== isDirectEnemyDebuff) throw AppError.validation("Target instrumen tidak sesuai dengan jenis efek kartu.");
      if (isDefense) {
        const validDefender = targetSide === "OWN" && action.targetRow === "FRONT" && action.targetIndex === state.pendingAttack?.defenderFrontIndex;
        const validAttackerDebuff = targetSide === "OPPONENT" && action.targetRow === "FRONT" && action.targetIndex === state.pendingAttack?.attackerFrontIndex;
        if (!validDefender && !validAttackerDebuff) throw AppError.validation("Instrumen respons harus menargetkan penyerang atau karakter yang diserang.");
      }
      const updated = BattleEngine.applyInstrumentToCharacter(state, "PLAYER", action.handInstanceId, action.targetRow, action.targetIndex, targetSide);
      if (updated === state) throw AppError.validation("Instrumen atau target tidak tersedia.");
      return updated;
    }
    case "DECLARE_ATTACK":
      if (state.activePlayer !== "PLAYER" || state.phase !== "PRE_ATTACK_INSTRUMENT") throw AppError.conflict("Serangan tidak dapat dilakukan pada fase ini.");
      if (action.attackerFrontIndex < 0 || action.attackerFrontIndex > 1 || action.defenderFrontIndex < 0 || action.defenderFrontIndex > 1) throw AppError.validation("Slot serangan tidak valid.");
      {
        const next = BattleEngine.declareAttack(state, action.attackerFrontIndex, action.defenderFrontIndex);
        if (next === state) throw AppError.validation("Penyerang atau target tidak valid.");
        return next;
      }
    case "CONFIRM_DEFENDER_RESPONSE":
      if (state.phase !== "DEFENDER_INSTRUMENT_RESPONSE" || state.pendingAttack?.attackerSide !== "BOT") throw AppError.conflict("Tidak ada respons pertahanan yang menunggu.");
      return BattleEngine.resolvePendingCombat(state);
    case "CONTINUE_CLASH":
      if (state.phase !== "DEFENDER_INSTRUMENT_RESPONSE" || state.pendingAttack?.attackerSide !== "PLAYER") throw AppError.conflict("Bentrok belum siap dilanjutkan.");
      return BattleEngine.resolvePendingCombat(state);
    case "PROMOTE_CHARACTER":
      if (state.phase !== "PROMOTE_CHARACTER" || state.pendingPromotion?.side !== "PLAYER") throw AppError.conflict("Tidak ada promosi pemain yang menunggu.");
      if (action.secondRowIndex < 0 || action.secondRowIndex > 2) throw AppError.validation("Slot promosi tidak valid.");
      {
        const next = BattleEngine.promoteSecondRowCharacter(state, action.secondRowIndex);
        if (next === state) throw AppError.validation("Karakter promosi tidak tersedia.");
        return next;
      }
    case "END_TURN":
      if (state.activePlayer !== "PLAYER" || state.phase !== "PRE_ATTACK_INSTRUMENT") throw AppError.conflict("Giliran tidak dapat diakhiri pada fase ini.");
      return BattleEngine.endTurn(state, rng);
    case "DISCARD_INSTRUMENT":
      if (state.activePlayer !== "PLAYER" || state.phase !== "PRE_ATTACK_INSTRUMENT") throw AppError.conflict("Instrumen tidak dapat dibuang pada fase ini.");
      {
        const next = BattleEngine.discardHandInstrument(state, "PLAYER", action.handInstanceId);
        if (next === state) throw AppError.validation("Instrumen tidak tersedia di tangan.");
        return next;
      }
    case "SURRENDER":
      return BattleEngine.surrenderMatch(state, "PLAYER");
  }
}

const AUTO_END_TURN_ATTACK_LIMIT = 2;

function shouldAutoEndTurnAfterAttacks(state: BattleStateEntity): boolean {
  const attacksThisTurn =
    state.attacksThisTurn ??
    state.battleLogs.filter(
      (entry) =>
        entry.turn === state.turnNumber &&
        entry.actor === state.activePlayer &&
        entry.highlight === "COMBAT" &&
        entry.message.includes(" menyerang ")
    ).length;

  return (
    state.phase === "PRE_ATTACK_INSTRUMENT" &&
    attacksThisTurn >= AUTO_END_TURN_ATTACK_LIMIT
  );
}

function runBotTurns(
  state: BattleStateEntity,
  rng = secureBattleRandomInt
): BattleStateEntity {
  let current = state;
  for (let step = 0; step < 30 && current.winner === null; step += 1) {
    if (shouldAutoEndTurnAfterAttacks(current)) {
      current = BattleEngine.endTurn(current, rng);
      continue;
    }
    if (current.phase === "PROMOTE_CHARACTER" && current.pendingPromotion?.side === "BOT") {
      current = BattleEngine.promoteSecondRowCharacter(current, BotAiService.chooseSecondRowPromotionIndex(current));
      continue;
    }
    if (current.phase === "DEFENDER_INSTRUMENT_RESPONSE" && current.pendingAttack?.attackerSide === "PLAYER") {
      const response = BotAiService.chooseDefensiveInstrument(current);
      if (response) {
        current = BattleEngine.applyInstrumentToCharacter(current, "BOT", response.handInstanceId, response.targetRow, response.targetIndex, response.targetSide);
      } else {
        current = {
          ...current,
          battleLogs: [
            ...current.battleLogs,
            {
              id: `log-${current.turnNumber}-${current.battleLogs.length + 1}-${randomUUID()}`,
              turn: current.turnNumber,
              actor: "BOT",
              message: "Bot memilih tidak memainkan instrumen pertahanan.",
              messageKey: "battle.log.botNoDefense",
              highlight: "INSTRUMENT",
            },
          ],
        };
      }
      break;
    }
    if (current.activePlayer === "BOT" && current.phase === "PRE_ATTACK_INSTRUMENT") {
      const instrument = BotAiService.choosePreAttackInstrument(current);
      if (instrument) {
        const next = BattleEngine.applyInstrumentToCharacter(current, "BOT", instrument.handInstanceId, instrument.targetRow, instrument.targetIndex, instrument.targetSide);
        if (next !== current) { current = next; continue; }
      }
      const attack = BotAiService.chooseAttackDeclaration(current);
      if (attack) {
        current = BattleEngine.declareAttack(current, attack.attackerFrontIndex, attack.defenderFrontIndex);
      } else {
        current = BattleEngine.endTurn(current, rng);
      }
      continue;
    }
    break;
  }
  return current;
}

export async function submitBattleActionUseCase(input: {
  id: string;
  userId: string;
  requestId?: string;
  expectedSequence: number;
  idempotencyKey: string;
  action: BattleAction;
}): Promise<BattleSessionView> {
  const record = await battleRepository.getBattleSession(input.id, input.userId);
  if (!record) throw AppError.notFound("Match tidak ditemukan.");
  const persistedEvents = JSON.parse(record.eventsJson) as Array<Record<string, unknown>>;
  if (persistedEvents.some((event) => event.idempotencyKey === input.idempotencyKey)) {
    return toSessionView(record, input.userId);
  }
  if (record.isQuickMatch) {
    const now = Date.now();
    const isLeagueSession = record.rulesVersion === "league-v1";
    const reconnectGraceMs = isLeagueSession ? LEAGUE_RECONNECT_GRACE_MS : QUICK_MATCH_RECONNECT_GRACE_MS;
    const disconnectExpired = (lastSeen: string) =>
      Date.parse(lastSeen) + (isLeagueSession ? reconnectGraceMs : QUICK_MATCH_HEARTBEAT_STALE_MS + reconnectGraceMs) <= now;
    if (
      disconnectExpired(record.lastSeenAt) ||
      disconnectExpired(record.opponentLastSeenAt ?? record.createdAt) ||
      Boolean(record.reconnectDeadlineAt && Date.parse(record.reconnectDeadlineAt) <= now) ||
      Boolean(record.opponentReconnectDeadlineAt && Date.parse(record.opponentReconnectDeadlineAt) <= now) ||
      Boolean(record.turnDeadlineAt && Date.parse(record.turnDeadlineAt) <= now)
    ) {
      await sweepBattleSessionsUseCase(new Date(now));
      const latest = await battleRepository.getBattleSession(input.id, input.userId);
      if (latest?.status === "COMPLETED") return toSessionView(latest, input.userId);
    }
  }
  if (record.status !== "ACTIVE" || record.sequence !== input.expectedSequence) {
    logServerEvent("warn", "battle.action.rejected_stale_state", {
      requestId: input.requestId,
      userId: input.userId,
      matchId: input.id,
      action: input.action.type,
      expectedSequence: input.expectedSequence,
      currentSequence: record.sequence,
      status: record.status,
    });
    throw AppError.conflict("State match sudah berubah. Muat state terbaru sebelum mengirim aksi.");
  }
  if (record.turnDeadlineAt && Date.parse(record.turnDeadlineAt) <= Date.now()) {
    await sweepBattleSessionsUseCase();
    if (input.action.type === "SURRENDER") {
      const latest = await battleRepository.getBattleSession(input.id, input.userId);
      if (latest && latest.status !== "ACTIVE") return toSessionView(latest, input.userId);
    }
    throw AppError.conflict("Waktu pertandingan habis.");
  }
  const previous = JSON.parse(record.stateJson) as BattleStateEntity;
  const isSecondQuickMatchPlayer = Boolean(record.isQuickMatch && record.opponentUserId === input.userId);
  const playerViewState = isSecondQuickMatchPlayer ? swapBattlePerspective(previous) : previous;
  if (record.isQuickMatch && input.action.type === "CONTINUE_CLASH") {
    throw AppError.conflict("Bentrok hanya dapat dilanjutkan oleh pemain yang sedang bertahan.");
  }
  const auditRng = record.rngSecret
    ? createAuditableRandom(decryptBattleSeed(record.rngSecret), record.rngCounter)
    : null;
  const nextRandomInt = auditRng?.int ?? secureBattleRandomInt;
  const rngFn = (min: number, maxExclusive: number) => nextRandomInt(min, maxExclusive, "battle-action");
  let state: BattleStateEntity;
  try {
    const afterAction = applyPlayerAction(playerViewState, input.action, rngFn);
    const afterOpponent = record.isQuickMatch
      ? shouldAutoEndTurnAfterAttacks(afterAction)
        ? BattleEngine.endTurn(afterAction, rngFn)
        : afterAction
      : runBotTurns(afterAction, rngFn);
    state = isSecondQuickMatchPlayer ? swapBattlePerspective(afterOpponent) : afterOpponent;
  } catch (error) {
    logServerEvent(error instanceof AppError ? "warn" : "error", "battle.action.rejected", {
      requestId: input.requestId,
      userId: input.userId,
      matchId: input.id,
      action: input.action.type,
      sequence: record.sequence,
      turnNumber: previous.turnNumber,
      phase: previous.phase,
      errorName: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown battle engine error",
      stack: error instanceof Error && !(error instanceof AppError) ? error.stack : undefined,
    });
    throw error;
  }
  const events = persistedEvents;
  const event: Record<string, unknown> = {
    sequence: record.sequence + 1,
    idempotencyKey: input.idempotencyKey,
    actorUserId: input.userId,
    action: input.action,
    at: new Date().toISOString(),
    rngCounterStart: record.rngCounter,
    rngCounterEnd: auditRng?.counter ?? record.rngCounter,
    rngDraws: auditRng?.draws ?? [],
  };
  const previousHash = typeof events.at(-1)?.hash === "string" ? String(events.at(-1)?.hash) : null;
  events.push({ ...event, hash: hashAuditEvent(previousHash, event) });
  const allRngDraws = [
    ...(JSON.parse(record.rngDrawsJson || "[]") as RngDraw[]),
    ...(auditRng?.draws ?? []),
  ];
  const status = state.winner ? "COMPLETED" : "ACTIVE";
  const completion = state.winner
    ? {
        userId: record.userId,
        playerDeckName: state.playerDeckName,
        botDifficulty: state.botDifficulty,
        winner: state.winner,
        totalTurns: state.turnNumber,
        durationSec: Math.max(1, Math.round((Date.now() - state.startedAtMs) / 1000)),
        playerScore: state.botGraveyard.length * 100,
        botScore: state.playerGraveyard.length * 100,
        ...(input.action.type !== "SURRENDER"
          ? record.isQuickMatch && record.opponentUserId
            ? {
                pointReward: {
                  userId: state.winner === "PLAYER" ? record.userId : record.opponentUserId,
                  opponentUserId: state.winner === "PLAYER" ? record.opponentUserId : record.userId,
                  amount: record.rulesVersion === "league-v1"
                    ? NUSA_POINT_POLICY.leagueMatchWin
                    : NUSA_POINT_POLICY.quickMatchWin,
                  source: record.rulesVersion === "league-v1" ? "LEAGUE_MATCH_WIN" as const : "BATTLE_PVP_WIN" as const,
                },
              }
            : state.winner === "PLAYER" && !record.storyMissionId
              ? {
                  pointReward: {
                    userId: record.userId,
                    amount: record.botDifficulty === "EASY" ? 25 : record.botDifficulty === "MEDIUM" ? 40 : 60,
                    source: "BATTLE_BOT_WIN" as const,
                  },
                }
              : {}
          : {}),
        ...(record.isQuickMatch && record.opponentUserId
          ? {
              quickMatch: {
                opponentUserId: record.opponentUserId,
                opponentDeckName: record.opponentDeckName ?? "Deck Lawan",
                winner: state.winner,
                playerDeckCardSlugs: JSON.parse(record.playerDeckCardSlugsJson ?? "[]") as string[],
                opponentDeckCardSlugs: JSON.parse(record.opponentDeckCardSlugsJson ?? "[]") as string[],
              },
            }
          : {}),
      }
    : undefined;
  const saved = await battleRepository.updateBattleSession({
    id: input.id,
    userId: input.userId,
    expectedSequence: input.expectedSequence,
    stateJson: JSON.stringify(state),
    eventsJson: JSON.stringify(events),
    status,
    rngCounter: auditRng?.counter ?? record.rngCounter,
    rngDrawsJson: JSON.stringify(allRngDraws),
    completion,
  });
  if (!saved) {
    const latest = await battleRepository.getBattleSession(input.id, input.userId);
    if (latest) {
      const latestEvents = JSON.parse(latest.eventsJson) as Array<Record<string, unknown>>;
      if (latestEvents.some((item) => item.idempotencyKey === input.idempotencyKey)) {
        return toSessionView(latest, input.userId);
      }
    }
    throw AppError.conflict("Aksi bersamaan sudah memperbarui match. Muat state terbaru.");
  }
  logServerEvent("info", state.winner ? "battle.session.completed" : "battle.action.applied", {
    requestId: input.requestId,
    userId: input.userId,
    matchId: input.id,
    action: input.action.type,
    sequence: saved.sequence,
    status: saved.status,
    turnNumber: state.turnNumber,
    phase: state.phase,
  });
  return toSessionView(saved, input.userId);
}

export async function surrenderPendingNonLeagueBattlesUseCase(userIds: string[]): Promise<void> {
  for (const userId of [...new Set(userIds)]) {
    await battleRepository.cancelQuickMatchQueue(userId);
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const active = await battleRepository.getLatestActiveBattleSession(userId);
      if (!active) break;
      if (active.rulesVersion === "league-v1") {
        throw AppError.conflict("Participant masih memiliki duel league aktif.");
      }
      const session = await getBattleSessionUseCase(active.id, userId);
      const completed = await submitBattleActionUseCase({
        id: active.id,
        userId,
        expectedSequence: session.sequence,
        idempotencyKey: randomUUID(),
        action: { type: "SURRENDER" },
      });
      if (completed.status === "ACTIVE") {
        throw AppError.conflict("Battle aktif participant belum berhasil diselesaikan.");
      }
    }
    const remaining = await battleRepository.getLatestActiveBattleSession(userId);
    if (remaining) throw AppError.conflict("Terlalu banyak battle aktif untuk diselesaikan otomatis.");
  }
}

