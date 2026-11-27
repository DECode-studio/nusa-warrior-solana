import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import type {
  LeagueParticipantEntity,
  LeagueBracketPreviewEntity,
  LeagueRoomEntity,
  LeagueRulesEntity,
  LeagueRole,
  LeagueStakeMode,
} from "@/client/domain/league/entity/league_entity";
import type { BattleStateEntity } from "@/client/domain/battle/entity/battle_entity";
import { listDecksUseCase } from "@/server/modules/deck/application/deck.usecase";
import { listOwnedCards } from "@/server/modules/collection/infrastructure/collection.repository";
import { cardRepository } from "@/server/modules/card/infrastructure/card.repository.impl";
import { AppError } from "@/server/shared/errors/app-error";
import { logServerEvent } from "@/server/shared/logging/server-logger";
import { BattleEngine } from "@/server/modules/battle/domain/battle_engine";
import {
  commitBattleSeed,
  createAuditableRandom,
  createBattleSeed,
  decryptBattleSeed,
  encryptBattleSeed,
} from "@/server/modules/battle/domain/auditable-rng";
import { battleRepository } from "@/server/modules/battle/infrastructure/battle.repository.impl";
import { surrenderPendingNonLeagueBattlesUseCase } from "@/server/modules/battle/application/battle.usecase";
import { settleCompletedBattleVaultOnChain } from "@/server/modules/solana/battle-vault-orchestrator.service";
import { leagueRepository } from "../infrastructure/league.repository.impl";
import type { LeagueBattleSessionInput, LeagueRoomRecord, LeagueRoundMatchInput } from "../domain/league.repository";

const SYSTEM_PARTICIPANT_LIMIT = 32;

function hashAuditEvent(previousHash: string | null, event: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify({ previousHash, event }), "utf8").digest("hex");
}

function getPairingOrder(roomId: string, participantUserIds: string[]): string[] {
  return [...participantUserIds].sort((left, right) => {
    const leftHash = createHash("sha256").update(`${roomId}:${left}`, "utf8").digest("hex");
    const rightHash = createHash("sha256").update(`${roomId}:${right}`, "utf8").digest("hex");
    return leftHash.localeCompare(rightHash) || left.localeCompare(right);
  });
}

function getBracketPreview(roomId: string, participants: LeagueParticipantEntity[]): LeagueBracketPreviewEntity[] {
  const participantById = new Map(participants.map((participant) => [participant.userId, participant]));
  const ordered = getPairingOrder(
    roomId,
    participants.filter((participant) => participant.role === "PARTICIPANT").map((participant) => participant.userId),
  ).map((userId) => participantById.get(userId)).filter((participant): participant is LeagueParticipantEntity => Boolean(participant));
  const pairings: LeagueBracketPreviewEntity[] = [];
  if (ordered.length % 2 === 1) {
    const byePlayer = ordered.pop();
    if (byePlayer) pairings.push({ playerOne: byePlayer, playerTwo: null });
  }
  for (let index = 0; index < ordered.length; index += 2) {
    const playerOne = ordered[index];
    const playerTwo = ordered[index + 1];
    if (playerOne && playerTwo) pairings.push({ playerOne, playerTwo });
  }
  return pairings;
}

function mapRoom(record: LeagueRoomRecord, viewerUserId?: string): LeagueRoomEntity {
  const participants: LeagueParticipantEntity[] = record.participants.map((participant) => ({
    id: participant.id,
    userId: participant.userId,
    displayName: participant.user.name,
    role: participant.role as LeagueRole,
    status: participant.status,
    stakeCardSlug: participant.stakeCardSlug,
    joinedAt: participant.joinedAt.toISOString(),
  }));
  const participantById = new Map(participants.map((participant) => [participant.userId, participant]));
  const matches = record.rounds.flatMap((round) => round.matches.map((match) => {
    const battleState = match.battleSession
      ? JSON.parse(match.battleSession.stateJson) as Pick<BattleStateEntity, "phase" | "winner">
      : null;
    const battleFinished = Boolean(match.battleSession && (
      match.battleSession.status === "COMPLETED" || battleState?.phase === "MATCH_OVER" || battleState?.winner
    ));
    const winnerId = match.winnerId ?? (battleState?.winner === "PLAYER"
      ? match.playerOneId
      : battleState?.winner === "BOT" ? match.playerTwoId ?? null : null);
    return {
      id: match.id,
      roundNumber: round.roundNumber,
      playerOne: participantById.get(match.playerOneId) ?? null,
      playerTwo: match.playerTwoId ? participantById.get(match.playerTwoId) ?? null : null,
      winnerId,
      status: battleFinished ? "COMPLETED" : match.status,
      battleSessionId: match.battleSessionId,
      durationDeadlineAt: match.durationDeadlineAt?.toISOString() ?? null,
      spectatorView: match.battleSession ? buildSpectatorView(match.battleSession.stateJson) : null,
    };
  })).filter((match) => match.playerOne !== null).map((match) => ({
    ...match,
    playerOne: match.playerOne as LeagueParticipantEntity,
  }));
  const finalRound = record.rounds.at(-1);
  const final = finalRound?.matches.length === 1 ? finalRound.matches[0] : undefined;
  const bracketPreview = matches.length === 0 && record.status === "REGISTRATION_CLOSED"
    ? getBracketPreview(record.id, participants)
    : [];
  return {
    id: record.id,
    joinCode: record.joinCode,
    visibility: record.isPublic ? "PUBLIC" : "PRIVATE",
    status: record.status as LeagueRoomEntity["status"],
    creatorId: record.creatorId,
    isCreator: record.creatorId === viewerUserId,
    viewerBattleSessionId: viewerUserId
      ? record.rounds.flatMap((round) => round.matches)
        .find((match) => {
          if (match.status !== "ACTIVE" || match.battleSession?.status !== "ACTIVE" ||
            (match.playerOneId !== viewerUserId && match.playerTwoId !== viewerUserId)) return false;
          const state = JSON.parse(match.battleSession.stateJson) as Pick<BattleStateEntity, "phase" | "winner">;
          return state.phase !== "MATCH_OVER" && state.winner === null;
        })
        ?.battleSessionId ?? null
      : null,
    maxParticipants: record.maxParticipants,
    registrationClosesAt: record.registrationClosesAt.toISOString(),
    startMode: record.startMode as "AUTO" | "MANUAL",
    startDelayMinutes: record.startDelayMinutes,
  scheduledStartAt: record.scheduledStartAt?.toISOString() ?? null,
    manualStartDeadlineAt: record.manualStartDeadlineAt?.toISOString() ?? null,
    rules: JSON.parse(record.rulesJson) as LeagueRulesEntity,
    participants,
    matches,
    bracketPreview,
    championId: final?.status === "COMPLETED" ? final.winnerId : null,
    createdAt: record.createdAt.toISOString(),
  };
}

function buildSpectatorView(stateJson: string): LeagueRoomEntity["matches"][number]["spectatorView"] {
  const state = JSON.parse(stateJson) as BattleStateEntity;
  const visibleRow = (row: BattleStateEntity["playerFrontRow"]) =>
    row.map((slot) => slot?.isRevealed ? slot.card : null);
  const usedInstruments = new Map<string, { name: string; slug: string }>();
  const playedInstrumentNames = new Set(state.battleLogs.flatMap((entry) => {
    if (entry.messageKey !== "battle.log.playInstrument" && entry.messageKey !== "battle.log.playInstrumentSynergy") return [];
    const name = entry.messageParams?.instrument;
    return typeof name === "string" ? [name] : [];
  }));
  for (const card of [...state.playerInstrumentDiscard, ...state.botInstrumentDiscard]) {
    if (playedInstrumentNames.has(card.name)) usedInstruments.set(card.slug, { name: card.name, slug: card.slug });
  }
  for (const slot of [...state.playerFrontRow, ...state.playerSecondRow, ...state.botFrontRow, ...state.botSecondRow]) {
    for (const instrument of slot?.appliedInstruments ?? []) {
      usedInstruments.set(instrument.instrumentSlug, { name: instrument.instrumentName, slug: instrument.instrumentSlug });
    }
  }
  return {
    turnNumber: state.turnNumber,
    phase: state.phase,
    activePlayer: state.activePlayer,
    playerFrontRow: visibleRow(state.playerFrontRow),
    playerSecondRow: visibleRow(state.playerSecondRow),
    opponentFrontRow: visibleRow(state.botFrontRow),
    opponentSecondRow: visibleRow(state.botSecondRow),
    usedInstruments: [...usedInstruments.values()],
    recentLogs: state.battleLogs
      .filter((entry) => entry.highlight === "COMBAT" || entry.highlight === "PROMOTION" ||
        entry.messageKey === "battle.log.playInstrument" || entry.messageKey === "battle.log.playInstrumentSynergy")
      .slice(-12)
      .map((entry) => entry.message),
  };
}

async function validateParticipantLoadout(input: {
  userId: string;
  deckId: string;
  rules: LeagueRulesEntity;
  stakeCardSlug: string;
}): Promise<void> {
  const decks = await listDecksUseCase(input.userId);
  const deck = decks.find((item) => item.id === input.deckId);
  if (!deck) throw AppError.notFound("Deck tidak ditemukan atau bukan milik Anda.");
  const cards = await cardRepository.findMany({ includeWithdrawn: false });
  const cardBySlug = new Map(cards.map((card) => [card.slug, card]));
  const characters = deck.characterSlugs.map((slug) => cardBySlug.get(slug));
  if (characters.length === 0 || characters.length > 10 || characters.some((card) => !card || card.cardType !== "CHARACTER")) {
    throw AppError.validation("Deck harus memiliki 1 sampai 10 kartu karakter aktif.");
  }
  if (input.rules.kingdom && characters.some((card) => card?.kingdom !== input.rules.kingdom)) {
    throw AppError.validation("Semua karakter deck harus berasal dari kerajaan yang ditentukan league.");
  }
  const stakeCard = cardBySlug.get(input.stakeCardSlug);
  if (!stakeCard || stakeCard.cardType !== "CHARACTER") throw AppError.validation("Kartu taruhan harus berupa kartu karakter aktif.");
  if (input.rules.kingdom && stakeCard.kingdom !== input.rules.kingdom) throw AppError.validation("Kartu taruhan harus berasal dari kerajaan yang ditentukan.");
  if (input.rules.stakeMode === "FIXED_CARD" && stakeCard.slug !== input.rules.fixedCardSlug) {
    throw AppError.validation("Kartu taruhan tidak sesuai dengan kartu tetap league.");
  }
  if (input.rules.stakeMode === "BATTLE_POWER") {
    const target = input.rules.battlePowerTarget;
    const power = stakeCard.baseAttack + stakeCard.baseDefense;
    if (target === null || Math.abs(power - target) > target * 0.1) {
      throw AppError.validation("Battle power kartu taruhan harus berada dalam toleransi 10% dari target.");
    }
  }
  const owned = await listOwnedCards(input.userId);
  if (!owned.some((item) => item.card.slug === stakeCard.slug && item.quantity > 0)) {
    throw AppError.validation("Anda tidak memiliki kartu taruhan yang dipilih.");
  }
}

async function buildLeagueSession(
  room: LeagueRoomRecord,
  player: LeagueRoomRecord["participants"][number],
  opponent: LeagueRoomRecord["participants"][number],
): Promise<LeagueBattleSessionInput> {
  if (!player.deckId || !opponent.deckId || !player.stakeCardSlug || !opponent.stakeCardSlug) {
    throw AppError.conflict("Participant belum memiliki deck atau kartu taruhan yang valid.");
  }
  const [playerDecks, opponentDecks, catalog] = await Promise.all([
    listDecksUseCase(player.userId),
    listDecksUseCase(opponent.userId),
    cardRepository.findMany({ includeWithdrawn: false }),
  ]);
  const playerDeck = playerDecks.find((deck) => deck.id === player.deckId);
  const opponentDeck = opponentDecks.find((deck) => deck.id === opponent.deckId);
  if (!playerDeck || !opponentDeck) throw AppError.conflict("Deck participant tidak lagi tersedia.");
  const cardBySlug = new Map(catalog.map((card) => [card.slug, card]));
  const playerCharacters = playerDeck.characterSlugs.map((slug) => cardBySlug.get(slug));
  const playerInstruments = playerDeck.instrumentSlugs.map((slug) => cardBySlug.get(slug));
  const opponentCharacters = opponentDeck.characterSlugs.map((slug) => cardBySlug.get(slug));
  const opponentInstruments = opponentDeck.instrumentSlugs.map((slug) => cardBySlug.get(slug));
  if ([...playerCharacters, ...playerInstruments, ...opponentCharacters, ...opponentInstruments].some((card) => !card)) {
    throw AppError.conflict("Kartu di deck participant sudah tidak tersedia.");
  }
  if (
    playerCharacters.length < 1 || playerCharacters.length > 10 ||
    opponentCharacters.length < 1 || opponentCharacters.length > 10 ||
    playerInstruments.length > 10 || opponentInstruments.length > 10 ||
    playerInstruments.some((card) => card?.cardType !== "INSTRUMENT") ||
    opponentInstruments.some((card) => card?.cardType !== "INSTRUMENT")
  ) {
    throw AppError.conflict("Komposisi deck participant tidak lagi valid.");
  }
  const rules = JSON.parse(room.rulesJson) as LeagueRulesEntity;
  await validateParticipantLoadout({ userId: player.userId, deckId: player.deckId, rules, stakeCardSlug: player.stakeCardSlug });
  await validateParticipantLoadout({ userId: opponent.userId, deckId: opponent.deckId, rules, stakeCardSlug: opponent.stakeCardSlug });
  const id = randomUUID();
  const seed = createBattleSeed();
  const rng = createAuditableRandom(seed);
  const state = BattleEngine.createInitialState({
    playerDeckName: playerDeck.name,
    botDifficulty: "HARD",
    playerCharacters: playerCharacters as CardEntity[],
    playerInstruments: playerInstruments as CardEntity[],
    botCharacters: opponentCharacters as CardEntity[],
    botInstruments: opponentInstruments as CardEntity[],
  }, rng.int);
  state.matchId = id;
  const commitment = commitBattleSeed(seed);
  const firstEvent = { sequence: 0, type: "RNG_COMMITMENT", commitment };
  const events = [{ ...firstEvent, hash: hashAuditEvent(null, firstEvent) }];
  return {
    id,
    userId: player.userId,
    opponentUserId: opponent.userId,
    deckId: playerDeck.id,
    deckName: playerDeck.name,
    opponentDeckId: opponentDeck.id,
    opponentDeckName: opponentDeck.name,
    playerStakeCardSlug: player.stakeCardSlug,
    opponentStakeCardSlug: opponent.stakeCardSlug,
    stateJson: JSON.stringify(state),
    eventsJson: JSON.stringify(events),
    rngCommitment: commitment,
    rngSecret: encryptBattleSeed(seed),
    rngCounter: rng.counter,
    rngDrawsJson: JSON.stringify(rng.draws),
  };
}

async function buildRoundMatches(room: LeagueRoomRecord, userIds: string[], roundNumber: number): Promise<LeagueRoundMatchInput[]> {
  const shuffled = getPairingOrder(room.id, userIds);
  const participantById = new Map(room.participants.map((participant) => [participant.userId, participant]));
  const matches: LeagueRoundMatchInput[] = [];
  const durationMinutes = (JSON.parse(room.rulesJson) as LeagueRulesEntity).battleDurationMinutes;
  if (shuffled.length % 2 === 1) {
    const byeId = shuffled.pop();
    if (byeId) matches.push({ id: randomUUID(), playerOneId: byeId, playerTwoId: null, winnerId: byeId, session: null, durationMinutes });
  }
  for (let index = 0; index < shuffled.length; index += 2) {
    const playerOneId = shuffled[index];
    const playerTwoId = shuffled[index + 1];
    if (!playerOneId || !playerTwoId) continue;
    const playerOne = participantById.get(playerOneId);
    const playerTwo = participantById.get(playerTwoId);
    if (!playerOne || !playerTwo) throw AppError.conflict("Pairing participant league tidak valid.");
    matches.push({
      id: randomUUID(),
      playerOneId,
      playerTwoId,
      winnerId: null,
      session: await buildLeagueSession(room, playerOne, playerTwo),
      durationMinutes,
    });
  }
  return matches;
}

export async function createLeagueRoomUseCase(input: {
  userId: string;
  visibility: "PUBLIC" | "PRIVATE";
  maxParticipants: number | null;
  registrationDurationMinutes: number;
  startMode: "AUTO" | "MANUAL";
  startDelayMinutes: number;
  creatorRole: LeagueRole;
  deckId: string | null;
  stakeCardSlug: string | null;
  rules: LeagueRulesEntity;
}): Promise<LeagueRoomEntity> {
  if (input.maxParticipants !== null && (input.maxParticipants < 2 || input.maxParticipants > SYSTEM_PARTICIPANT_LIMIT)) {
    throw AppError.validation("Kapasitas league harus antara 2 sampai 32 participant.");
  }
  if (!Number.isInteger(input.registrationDurationMinutes) || input.registrationDurationMinutes < 5 || input.registrationDurationMinutes > 1_440) {
    throw AppError.validation("Durasi pendaftaran harus antara 5 menit hingga 24 jam.");
  }
  if (![3, 5, 10].includes(input.startDelayMinutes)) throw AppError.validation("Jeda mulai otomatis harus 3, 5, atau 10 menit.");
  if (input.rules.stakeMode === "FIXED_CARD" && !input.rules.fixedCardSlug) throw AppError.validation("Kartu taruhan tetap wajib dipilih.");
  if (input.rules.stakeMode === "BATTLE_POWER" && (!input.rules.battlePowerTarget || input.rules.battlePowerTarget < 1)) {
    throw AppError.validation("Target battle power kartu taruhan wajib diisi.");
  }
  if (input.creatorRole === "PARTICIPANT") {
    if (!input.deckId || !input.stakeCardSlug) throw AppError.validation("Creator participant wajib memilih deck dan kartu taruhan.");
    await validateParticipantLoadout({ userId: input.userId, deckId: input.deckId, rules: input.rules, stakeCardSlug: input.stakeCardSlug });
  }
  const now = new Date();
  const closeAt = new Date(now.getTime() + input.registrationDurationMinutes * 60_000);
  const record = await leagueRepository.createRoom({
    id: randomUUID(),
    creatorId: input.userId,
    joinCode: randomBytes(5).toString("hex").toUpperCase(),
    isPublic: input.visibility === "PUBLIC",
    maxParticipants: input.maxParticipants,
    registrationClosesAt: closeAt,
    startMode: input.startMode,
    startDelayMinutes: input.startDelayMinutes,
    scheduledStartAt: input.startMode === "AUTO" ? new Date(closeAt.getTime() + input.startDelayMinutes * 60_000) : null,
    manualStartDeadlineAt: null,
    rulesJson: JSON.stringify(input.rules),
    creatorDeckId: input.deckId,
    creatorStakeCardSlug: input.stakeCardSlug,
    creatorRole: input.creatorRole,
  });
  return mapRoom(record, input.userId);
}

export async function listPublicLeagueRoomsUseCase(userId: string): Promise<LeagueRoomEntity[]> {
  return (await leagueRepository.listPublicRooms()).map((record) => mapRoom(record, userId));
}

export async function listMyLeagueRoomsUseCase(userId: string): Promise<LeagueRoomEntity[]> {
  return (await leagueRepository.listRoomsForUser(userId)).map((record) => mapRoom(record, userId));
}

export async function getLeagueRoomUseCase(input: { id: string; userId: string }): Promise<LeagueRoomEntity> {
  let record = await leagueRepository.findRoom(input.id, false, input.userId);
  if (!record) throw AppError.notFound("League tidak ditemukan.");
  if (record.status === "IN_PROGRESS" &&
    record.participants.filter((participant) => participant.role === "PARTICIPANT").length < 2) {
    await leagueRepository.cancelStalledRoom(record.id, new Date());
    record = await leagueRepository.findRoom(input.id, false, input.userId);
    if (!record) throw AppError.notFound("League tidak ditemukan.");
  }
  const currentRound = record.rounds.at(-1);
  if (record.status === "IN_PROGRESS" && currentRound?.matches.some((match) => match.battleSession?.status === "COMPLETED")) {
    await settleLeagueRound(record);
    record = await leagueRepository.findRoom(input.id, false, input.userId);
    if (!record) throw AppError.notFound("League tidak ditemukan.");
  }
  return mapRoom(record, input.userId);
}

async function processLeagueRoomLifecycleUseCase(input: { id: string; userId: string; now: Date }): Promise<void> {
  let record = await leagueRepository.findRoom(input.id, true, input.userId);
  if (!record) return;
  const now = input.now;
  if (record.status === "IN_PROGRESS" &&
    record.participants.filter((participant) => participant.role === "PARTICIPANT").length < 2) {
    await leagueRepository.cancelStalledRoom(record.id, now);
    return;
  }
  if (record.status === "REGISTRATION_OPEN" && record.registrationClosesAt <= now) {
    await leagueRepository.closeRegistration(record.id, record.creatorId, now);
    const updated = await leagueRepository.findRoom(input.id, true, input.userId);
    if (!updated) return;
    record = updated;
  }
  if (record.status === "REGISTRATION_CLOSED" &&
    ((record.scheduledStartAt && record.scheduledStartAt <= now) ||
      (record.manualStartDeadlineAt && record.manualStartDeadlineAt <= now))) {
    await launchLeague(record);
    const updated = await leagueRepository.findRoom(input.id, true, input.userId);
    if (!updated) return;
    record = updated;
  }
  record = await resolveLeagueBattleDurations(record);
  await settleLeagueRound(record);
}

export async function joinLeagueRoomUseCase(input: {
  id: string;
  userId: string;
  joinCode: string | null;
  role: LeagueRole;
  deckId: string | null;
  stakeCardSlug: string | null;
}): Promise<LeagueRoomEntity> {
  const record = await leagueRepository.findRoom(input.id, true, input.userId);
  if (!record) throw AppError.notFound("League tidak ditemukan.");
  if (!record.isPublic && record.joinCode !== input.joinCode) throw AppError.notFound("Kode league tidak valid.");
  const rules = JSON.parse(record.rulesJson) as LeagueRulesEntity;
  if (input.role === "PARTICIPANT") {
    if (!input.deckId || !input.stakeCardSlug) throw AppError.validation("Participant wajib memilih deck dan kartu taruhan.");
    await validateParticipantLoadout({ userId: input.userId, deckId: input.deckId, rules, stakeCardSlug: input.stakeCardSlug });
  }
  return mapRoom(await leagueRepository.joinRoom({
    leagueId: input.id,
    joinCode: input.joinCode,
    userId: input.userId,
    role: input.role,
    deckId: input.deckId,
    stakeCardSlug: input.stakeCardSlug,
  }), input.userId);
}

export async function joinLeagueByCodeUseCase(input: {
  joinCode: string;
  userId: string;
  role: LeagueRole;
  deckId: string | null;
  stakeCardSlug: string | null;
}): Promise<LeagueRoomEntity> {
  const record = await leagueRepository.findRoomByCode(input.joinCode);
  if (!record || record.isPublic) throw AppError.notFound("Kode private league tidak ditemukan.");
  const rules = JSON.parse(record.rulesJson) as LeagueRulesEntity;
  if (input.role === "PARTICIPANT") {
    if (!input.deckId || !input.stakeCardSlug) throw AppError.validation("Participant wajib memilih deck dan kartu taruhan.");
    await validateParticipantLoadout({ userId: input.userId, deckId: input.deckId, rules, stakeCardSlug: input.stakeCardSlug });
  }
  return mapRoom(await leagueRepository.joinRoom({
    leagueId: record.id,
    joinCode: input.joinCode,
    userId: input.userId,
    role: input.role,
    deckId: input.deckId,
    stakeCardSlug: input.stakeCardSlug,
  }), input.userId);
}

export async function closeLeagueRegistrationUseCase(input: { id: string; userId: string }): Promise<LeagueRoomEntity> {
  return mapRoom(await leagueRepository.closeRegistration(input.id, input.userId, new Date()), input.userId);
}

export async function cancelLeagueUseCase(input: { id: string; userId: string }): Promise<LeagueRoomEntity> {
  await leagueRepository.cancelRoom(input.id, input.userId);
  const record = await leagueRepository.findRoom(input.id, true, input.userId);
  if (!record) throw AppError.notFound("League tidak ditemukan.");
  return mapRoom(record, input.userId);
}

export async function sweepLeagueRoomsUseCase(now = new Date()): Promise<{ processedRooms: number; deletedRooms: number }> {
  const dueRooms = await leagueRepository.listDueRooms(now);
  const results = await Promise.allSettled(dueRooms.map((room) => processLeagueRoomLifecycleUseCase({
    id: room.id,
    userId: room.creatorId,
    now,
  })));
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      logServerEvent("warn", "league.lifecycle.processing_failed", {
        leagueId: dueRooms[index]?.id,
        errorName: result.reason instanceof Error ? result.reason.name : "UnknownError",
        message: result.reason instanceof Error ? result.reason.message : "League lifecycle processing failed.",
      });
    }
  });
  const deletedRooms = await leagueRepository.deleteExpiredPublicRooms({
    cancelledBefore: new Date(now.getTime() - 24 * 60 * 60_000),
    completedBefore: new Date(now.getTime() - 7 * 24 * 60 * 60_000),
    limit: 100,
  });
  return { processedRooms: results.filter((result) => result.status === "fulfilled").length, deletedRooms };
}

async function launchLeague(record: LeagueRoomRecord): Promise<void> {
  if (record.status !== "REGISTRATION_CLOSED") return;
  const playerIds = record.participants
    .filter((participant) => participant.role === "PARTICIPANT" && participant.status === "REGISTERED")
    .map((participant) => participant.userId);
  if (playerIds.length < 2) {
    await leagueRepository.cancelRoom(record.id, record.creatorId);
    return;
  }
  await surrenderPendingNonLeagueBattlesUseCase(playerIds);
  const matches = await buildRoundMatches(record, playerIds, 1);
  await leagueRepository.startRound({ leagueId: record.id, roundNumber: 1, matches });
}

export async function startLeagueUseCase(input: { id: string; userId: string }): Promise<LeagueRoomEntity> {
  let record = await leagueRepository.findRoom(input.id, true, input.userId);
  if (!record) throw AppError.notFound("League tidak ditemukan.");
  if (record.creatorId !== input.userId) throw AppError.forbidden("Hanya creator yang dapat memulai league.");
  if (record.status === "REGISTRATION_OPEN") {
    record = await leagueRepository.closeRegistration(record.id, input.userId, new Date());
  }
  if (record.status !== "REGISTRATION_CLOSED") throw AppError.conflict("League belum siap dimulai.");
  const playerCount = record.participants.filter((participant) => participant.role === "PARTICIPANT").length;
  if (playerCount < 2) {
    await leagueRepository.cancelRoom(record.id, input.userId);
    throw AppError.conflict("League dibatalkan karena membutuhkan minimal dua participant.");
  }
  await launchLeague(record);
  const updated = await leagueRepository.findRoom(input.id, true, input.userId);
  if (!updated) throw AppError.notFound("League tidak ditemukan.");
  return mapRoom(updated, input.userId);
}

async function settleLeagueRound(record: LeagueRoomRecord): Promise<LeagueRoomRecord> {
  if (record.status !== "IN_PROGRESS") return record;
  const round = record.rounds.at(-1);
  if (!round || round.matches.length === 0) return record;
  const resolved: Array<{ matchId: string; winnerId: string }> = [];
  for (const match of round.matches) {
    if (match.winnerId) {
      resolved.push({ matchId: match.id, winnerId: match.winnerId });
      continue;
    }
    if (match.battleSession?.status !== "COMPLETED") return record;
    const state = JSON.parse(match.battleSession.stateJson) as { winner: "PLAYER" | "BOT" | null };
    if (!state.winner) return record;
    resolved.push({ matchId: match.id, winnerId: state.winner === "PLAYER" ? match.playerOneId : match.playerTwoId ?? match.playerOneId });
  }
  const winners = resolved.map((item) => item.winnerId);
  if (winners.length > 1) await surrenderPendingNonLeagueBattlesUseCase(winners);
  const nextRound = winners.length > 1
    ? { roundNumber: round.roundNumber + 1, matches: await buildRoundMatches(record, winners, round.roundNumber + 1) }
    : undefined;
  await leagueRepository.resolveRound({ leagueId: record.id, roundNumber: round.roundNumber, matches: resolved, nextRound });
  const updated = await leagueRepository.findRoom(record.id, true, record.creatorId);
  return updated ?? record;
}

async function resolveLeagueBattleDurations(record: LeagueRoomRecord): Promise<LeagueRoomRecord> {
  if (record.status !== "IN_PROGRESS") return record;
  const now = Date.now();
  const currentRound = record.rounds.at(-1);
  if (!currentRound) return record;
  for (const match of currentRound.matches) {
    if (!match.durationDeadlineAt || match.durationDeadlineAt.getTime() > now || match.battleSession?.status !== "ACTIVE" || !match.battleSessionId) continue;
    const participant = record.participants.find((item) => item.userId === match.playerOneId);
    if (!participant) continue;
    const session = await battleRepository.getBattleSession(match.battleSessionId, match.playerOneId);
    if (!session || session.status !== "ACTIVE" || !session.rngSecret) continue;
    const state = JSON.parse(session.stateJson) as BattleStateEntity;
    const charactersLeft = (side: "PLAYER" | "BOT") => side === "PLAYER"
      ? state.playerFrontRow.filter(Boolean).length + state.playerSecondRow.filter(Boolean).length + state.playerCharacterDeck.length
      : state.botFrontRow.filter(Boolean).length + state.botSecondRow.filter(Boolean).length + state.botCharacterDeck.length;
    const playerLeft = charactersLeft("PLAYER");
    const opponentLeft = charactersLeft("BOT");
    const rng = createAuditableRandom(decryptBattleSeed(session.rngSecret), session.rngCounter);
    let winner: "PLAYER" | "BOT";
    let dice: Array<[number, number]> = [];
    if (playerLeft !== opponentLeft) {
      winner = playerLeft > opponentLeft ? "PLAYER" : "BOT";
    } else {
      for (;;) {
        dice = Array.from({ length: 3 }, () => [rng.int(1, 7, "league-timeout-player-die"), rng.int(1, 7, "league-timeout-opponent-die")] as [number, number]);
        const playerWins = dice.filter(([player, opponent]) => player > opponent).length;
        const opponentWins = dice.filter(([player, opponent]) => opponent > player).length;
        if (playerWins !== opponentWins) {
          winner = playerWins > opponentWins ? "PLAYER" : "BOT";
          break;
        }
      }
    }
    const completedState: BattleStateEntity = {
      ...state,
      phase: "MATCH_OVER",
      winner,
      battleLogs: [...state.battleLogs, {
        id: `league-timeout-${randomUUID()}`,
        turn: state.turnNumber,
        actor: "SYSTEM",
        message: `Batas waktu habis. Sisa karakter: ${playerLeft}–${opponentLeft}.${dice.length ? ` Adu dadu: ${dice.map(([player, opponent]) => `${player}:${opponent}`).join(", ")}.` : ""} Pemenang: ${winner === "PLAYER" ? session.deckName : session.opponentDeckName ?? "Lawan"}.`,
      }],
    };
    const event = {
      sequence: session.sequence + 1,
      type: "LEAGUE_DURATION_TIMEOUT",
      at: new Date(now).toISOString(),
      playerCharactersLeft: playerLeft,
      opponentCharactersLeft: opponentLeft,
      dice,
      winner,
    };
    const audit = JSON.parse(session.eventsJson || "[]") as Array<Record<string, unknown>>;
    const previousHash = typeof audit.at(-1)?.hash === "string" ? String(audit.at(-1)?.hash) : null;
    audit.push({ ...event, hash: hashAuditEvent(previousHash, event) });
    if (!session.opponentUserId) continue;
    const completion = {
      userId: session.userId,
      playerDeckName: session.deckName,
      botDifficulty: "HARD",
      winner,
      totalTurns: state.turnNumber,
      durationSec: Math.max(1, Math.round((now - state.startedAtMs) / 1000)),
      playerScore: playerLeft,
      botScore: opponentLeft,
      quickMatch: {
        opponentUserId: session.opponentUserId,
        opponentDeckName: session.opponentDeckName ?? "Deck Lawan",
        winner,
        playerDeckCardSlugs: JSON.parse(session.playerDeckCardSlugsJson ?? "[]") as string[],
        opponentDeckCardSlugs: JSON.parse(session.opponentDeckCardSlugsJson ?? "[]") as string[],
      },
    };
    await battleRepository.updateBattleSession({
      id: session.id,
      userId: session.userId,
      expectedSequence: session.sequence,
      stateJson: JSON.stringify(completedState),
      eventsJson: JSON.stringify(audit),
      status: "COMPLETED",
      rngCounter: rng.counter,
      rngDrawsJson: JSON.stringify([...JSON.parse(session.rngDrawsJson || "[]") as unknown[], ...rng.draws]),
      completion,
    });
    if (session.vaultPda) {
      await settleCompletedBattleVaultOnChain({ matchId: session.id });
    }
  }
  return await leagueRepository.findRoom(record.id, true, record.creatorId) ?? record;
}
