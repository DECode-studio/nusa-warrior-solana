import "server-only";
import { randomUUID } from "node:crypto";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import type {
  ActiveBuffInfo,
  BattleDuelOutcome,
  BattleHandInstrument,
  BattleLogEntry,
  BattleSlotCharacter,
  BattleStateEntity,
  BotDifficulty,
  CombatResolutionType,
} from "@/client/domain/battle/entity/battle_entity";
import { secureBattleRandomInt } from "./auditable-rng";

export const MAX_INSTRUMENT_HAND = 6;
export const INITIAL_INSTRUMENT_HAND = 3;
export const FRONT_ROW_SIZE = 2;
export const SECOND_ROW_SIZE = 3;

export type BattleRandomInt = (min: number, maxExclusive: number, label: string) => number;

export function shuffleCards<T>(
  items: readonly T[],
  rng: BattleRandomInt = secureBattleRandomInt,
  label = "shuffle"
): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = rng(0, i + 1, `${label}:${i}`);
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

export function createBattleSlotCharacter(
  card: CardEntity,
  isRevealed: boolean,
  instanceSuffix: string
): BattleSlotCharacter {
  return {
    instanceId: `char-${card.slug}-${instanceSuffix}`,
    card,
    isRevealed,
    currentAttack: card.baseAttack,
    currentDefense: card.baseDefense,
    tempAttackMod: 0,
    tempDefenseMod: 0,
    tempEnemyAttackMod: 0,
    tempIgnoreDefense: 0,
    appliedInstruments: [],
    hasAttackedThisTurn: false,
  };
}

export function checkInstrumentSynergy(
  character: CardEntity,
  instrument: CardEntity
): boolean {
  const roleMatches =
    !instrument.affinityRole ||
    character.role === instrument.affinityRole ||
    character.secondaryRoles.includes(instrument.affinityRole);

  const genderMatches =
    !instrument.affinityGender ||
    character.gender === instrument.affinityGender;

  return Boolean(
    (instrument.affinityRole || instrument.affinityGender) &&
      roleMatches &&
      genderMatches
  );
}

function appendLog(
  logs: BattleLogEntry[],
  turn: number,
  actor: "PLAYER" | "BOT" | "SYSTEM",
  message: string,
  highlight?: BattleLogEntry["highlight"],
  messageKey?: string,
  messageParams?: Record<string, string | number>
): BattleLogEntry[] {
  const entry: BattleLogEntry = {
    id: `log-${turn}-${logs.length + 1}-${randomUUID()}`,
    turn,
    actor,
    message,
    ...(messageKey ? { messageKey } : {}),
    ...(messageParams ? { messageParams } : {}),
    highlight,
  };
  return [entry, ...logs].slice(0, 60);
}

function sideActor(isPlayer: boolean): "PLAYER" | "BOT" {
  return isPlayer ? "PLAYER" : "BOT";
}

export interface CreateBattleSetupParams {
  playerDeckName: string;
  botDifficulty: BotDifficulty;
  playerCharacters: CardEntity[];
  playerInstruments: CardEntity[];
  botCharacters: CardEntity[];
  botInstruments: CardEntity[];
  shuffle?: boolean;
}

export type InstrumentTargetSide = "OWN" | "OPPONENT";

export class BattleEngine {
  public static createInitialState(
    params: CreateBattleSetupParams,
    rng: BattleRandomInt = secureBattleRandomInt
  ): BattleStateEntity {
    const shouldShuffle = params.shuffle ?? true;
    const pChars = shouldShuffle
      ? shuffleCards(params.playerCharacters, rng, "player-characters")
      : [...params.playerCharacters];
    const bChars = shouldShuffle
      ? shuffleCards(params.botCharacters, rng, "bot-characters")
      : [...params.botCharacters];
    const pInsts = shouldShuffle
      ? shuffleCards(params.playerInstruments, rng, "player-instruments")
      : [...params.playerInstruments];
    const bInsts = shouldShuffle
      ? shuffleCards(params.botInstruments, rng, "bot-instruments")
      : [...params.botInstruments];

    const playerFrontRow: Array<BattleSlotCharacter | null> = [
      pChars[0] ? createBattleSlotCharacter(pChars[0], false, "pf0") : null,
      pChars[1] ? createBattleSlotCharacter(pChars[1], false, "pf1") : null,
    ];
    const playerSecondRow: Array<BattleSlotCharacter | null> = [
      pChars[2] ? createBattleSlotCharacter(pChars[2], false, "ps0") : null,
      pChars[3] ? createBattleSlotCharacter(pChars[3], false, "ps1") : null,
      pChars[4] ? createBattleSlotCharacter(pChars[4], false, "ps2") : null,
    ];
    const playerCharacterDeck = pChars.slice(5);

    const botFrontRow: Array<BattleSlotCharacter | null> = [
      bChars[0] ? createBattleSlotCharacter(bChars[0], false, "bf0") : null,
      bChars[1] ? createBattleSlotCharacter(bChars[1], false, "bf1") : null,
    ];
    const botSecondRow: Array<BattleSlotCharacter | null> = [
      bChars[2] ? createBattleSlotCharacter(bChars[2], false, "bs0") : null,
      bChars[3] ? createBattleSlotCharacter(bChars[3], false, "bs1") : null,
      bChars[4] ? createBattleSlotCharacter(bChars[4], false, "bs2") : null,
    ];
    const botCharacterDeck = bChars.slice(5);

    const playerInitialInst = pInsts.slice(0, INITIAL_INSTRUMENT_HAND);
    const playerInstrumentDeck = pInsts.slice(INITIAL_INSTRUMENT_HAND);
    const playerInstrumentHand: BattleHandInstrument[] = playerInitialInst.map(
      (card, idx) => ({
        instanceId: `p-inst-init-${idx}-${card.slug}`,
        card,
      })
    );

    const botInitialInst = bInsts.slice(0, INITIAL_INSTRUMENT_HAND);
    const botInstrumentDeck = bInsts.slice(INITIAL_INSTRUMENT_HAND);
    const botInstrumentHand: BattleHandInstrument[] = botInitialInst.map(
      (card, idx) => ({
        instanceId: `b-inst-init-${idx}-${card.slug}`,
        card,
      })
    );

    return {
      matchId: `match-${randomUUID()}`,
      turnNumber: 1,
      attacksThisTurn: 0,
      activePlayer: "PLAYER",
      phase: "DICE_ROLL",
      botDifficulty: params.botDifficulty,
      playerDeckName: params.playerDeckName,
      diceRollResult: null,
      playerFrontRow,
      playerSecondRow,
      botFrontRow,
      botSecondRow,
      playerCharacterDeck,
      botCharacterDeck,
      playerInstrumentDeck,
      botInstrumentDeck,
      playerInstrumentHand,
      botInstrumentHand,
      playerInstrumentDiscard: [],
      botInstrumentDiscard: [],
      playerGraveyard: [],
      botGraveyard: [],
      pendingAttack: null,
      pendingPromotion: null,
      lastDuelOutcome: null,
      winner: null,
      battleLogs: [
        {
          id: "log-init",
          turn: 1,
          actor: "SYSTEM",
          message:
            "Medan laga Dwipantara siap! 5 Karakter ditempatkan (2 Baris Depan, 3 Baris Kedua) dan 3 Instrumen awal dibagikan.",
          messageKey: "battle.log.setup",
        },
      ],
      startedAtMs: Date.now(),
    };
  }

  public static resolveDiceRoll(
    state: BattleStateEntity,
    forcedRolls?: { playerRoll: number; botRoll: number },
    rng: BattleRandomInt = secureBattleRandomInt
  ): BattleStateEntity {
    let playerRoll = forcedRolls?.playerRoll ?? rng(1, 7, "dice:player");
    let botRoll = forcedRolls?.botRoll ?? rng(1, 7, "dice:bot");
    if (playerRoll === botRoll) {
      playerRoll = playerRoll === 6 ? 6 : playerRoll + 1;
      botRoll = playerRoll === 6 ? 5 : botRoll;
    }

    const firstPlayer: "PLAYER" | "BOT" =
      playerRoll > botRoll ? "PLAYER" : "BOT";

    const logs = appendLog(
      state.battleLogs,
      state.turnNumber,
      "SYSTEM",
      `Lemparan Dadu: Pemain (${playerRoll}) vs Bot (${botRoll}). ${
        firstPlayer === "PLAYER" ? "Pemain" : "Bot"
      } mendapat giliran pertama!`,
      undefined,
      "battle.log.dice",
      { playerRoll, botRoll, firstPlayer }
    );

    return {
      ...state,
      activePlayer: firstPlayer,
      phase: "DRAW_INSTRUMENT",
      diceRollResult: {
        playerRoll,
        botRoll,
        firstPlayer,
      },
      battleLogs: logs,
    };
  }

  public static drawInstrumentForActivePlayer(
    state: BattleStateEntity,
    rng: BattleRandomInt = secureBattleRandomInt
  ): BattleStateEntity {
    const isPlayer = state.activePlayer === "PLAYER";
    let deck = isPlayer
      ? [...state.playerInstrumentDeck]
      : [...state.botInstrumentDeck];
    let discard = isPlayer
      ? [...state.playerInstrumentDiscard]
      : [...state.botInstrumentDiscard];
    let hand = isPlayer
      ? [...state.playerInstrumentHand]
      : [...state.botInstrumentHand];
    let logs = [...state.battleLogs];

    if (deck.length === 0 && discard.length > 0) {
      deck = shuffleCards(discard, rng, `discard-shuffle:${state.activePlayer}:${state.turnNumber}`);
      discard = [];
      logs = appendLog(
        logs,
        state.turnNumber,
        state.activePlayer,
        `Deck Instrumen habis: mengocok ulang ${deck.length} kartu dari Discard Pile.`,
        "INSTRUMENT",
        "battle.log.reshuffle",
        { count: deck.length }
      );
    }

    if (deck.length > 0) {
      const drawnCard = deck.shift()!;
      if (hand.length >= MAX_INSTRUMENT_HAND) {
        discard.push(drawnCard);
        logs = appendLog(
          logs,
          state.turnNumber,
          state.activePlayer,
          `Tangan penuh (${MAX_INSTRUMENT_HAND} kartu)! Instrumen '${drawnCard.name}' langsung masuk ke Discard Pile.`,
          "INSTRUMENT",
          "battle.log.handFull",
          { limit: MAX_INSTRUMENT_HAND, card: drawnCard.name }
        );
      } else {
        hand = [
          ...hand,
          {
            instanceId: `${isPlayer ? "p" : "b"}-inst-t${state.turnNumber}-${
              hand.length
            }-${drawnCard.slug}`,
            card: drawnCard,
          },
        ];
        logs = appendLog(
          logs,
          state.turnNumber,
          state.activePlayer,
          `${
            isPlayer ? "Pemain" : "Bot"
          } mengambil 1 kartu Instrumen dari deck.`,
          "INSTRUMENT",
          "battle.log.drawInstrument",
          { actor: sideActor(isPlayer) }
        );
      }
    }

    return {
      ...state,
      phase: "PRE_ATTACK_INSTRUMENT",
      playerInstrumentDeck: isPlayer ? deck : state.playerInstrumentDeck,
      botInstrumentDeck: isPlayer ? state.botInstrumentDeck : deck,
      playerInstrumentDiscard: isPlayer
        ? discard
        : state.playerInstrumentDiscard,
      botInstrumentDiscard: isPlayer ? state.botInstrumentDiscard : discard,
      playerInstrumentHand: isPlayer ? hand : state.playerInstrumentHand,
      botInstrumentHand: isPlayer ? state.botInstrumentHand : hand,
      battleLogs: logs,
    };
  }

  public static applyInstrumentToCharacter(
    state: BattleStateEntity,
    side: "PLAYER" | "BOT",
    handInstanceId: string,
    targetRow: "FRONT" | "SECOND",
    targetIndex: number,
    targetSide: InstrumentTargetSide = "OWN"
  ): BattleStateEntity {
    const isActingPlayer = side === "PLAYER";
    const isTargetPlayer = targetSide === "OWN" ? isActingPlayer : !isActingPlayer;
    const hand = isActingPlayer
      ? [...state.playerInstrumentHand]
      : [...state.botInstrumentHand];
    const discard = isActingPlayer
      ? [...state.playerInstrumentDiscard]
      : [...state.botInstrumentDiscard];

    const instIndex = hand.findIndex((h) => h.instanceId === handInstanceId);
    if (instIndex === -1) {
      return state;
    }

    const handItem = hand[instIndex];
    const instrument = handItem.card;
    const isDirectEnemyDebuff = instrument.effectType === "DEBUFF_ENEMY_ATK";
    if ((targetSide === "OPPONENT") !== isDirectEnemyDebuff) return state;

    const frontRow = isTargetPlayer
      ? [...state.playerFrontRow]
      : [...state.botFrontRow];
    const secondRow = isTargetPlayer
      ? [...state.playerSecondRow]
      : [...state.botSecondRow];

    const targetSlot =
      targetRow === "FRONT" ? frontRow[targetIndex] : secondRow[targetIndex];
    if (!targetSlot) {
      return state;
    }

    const synergy = checkInstrumentSynergy(targetSlot.card, instrument);
    const attackDelta = isDirectEnemyDebuff
      ? instrument.enemyAttackMod -
        (synergy ? instrument.affinityBonusAtk : 0)
      : instrument.attackMod +
        (synergy ? instrument.affinityBonusAtk : 0);
    const defenseDelta = isDirectEnemyDebuff
      ? 0
      : instrument.defenseMod +
        (synergy ? instrument.affinityBonusDef : 0);
    const enemyAttackDelta = isDirectEnemyDebuff ? 0 : instrument.enemyAttackMod;
    const ignoreDefenseAmount = instrument.ignoreDefenseAmount;

    const newTempAtk = targetSlot.tempAttackMod + attackDelta;
    const newTempDef = targetSlot.tempDefenseMod + defenseDelta;
    const newEnemyAtkMod = targetSlot.tempEnemyAttackMod + enemyAttackDelta;
    const newIgnoreDef = targetSlot.tempIgnoreDefense + ignoreDefenseAmount;

    const buffInfo: ActiveBuffInfo = {
      instrumentName: instrument.name,
      instrumentSlug: instrument.slug,
      attackDelta,
      defenseDelta,
      enemyAttackDelta,
      ignoreDefenseAmount,
      strikeAttackBonus:
        !isDirectEnemyDebuff && instrument.effectType === "ATTACK_BONUS_ON_STRIKE"
          ? instrument.strikeAttackBonus
          : 0,
      synergyTriggered: synergy,
    };

    const updatedSlot: BattleSlotCharacter = {
      ...targetSlot,
      currentAttack: Math.max(0, targetSlot.card.baseAttack + newTempAtk),
      currentDefense: Math.max(0, targetSlot.card.baseDefense + newTempDef),
      tempAttackMod: newTempAtk,
      tempDefenseMod: newTempDef,
      tempEnemyAttackMod: newEnemyAtkMod,
      tempIgnoreDefense: newIgnoreDef,
      appliedInstruments: [...targetSlot.appliedInstruments, buffInfo],
    };

    if (targetRow === "FRONT") {
      frontRow[targetIndex] = updatedSlot;
    } else {
      secondRow[targetIndex] = updatedSlot;
    }

    hand.splice(instIndex, 1);
    discard.push(instrument);

    const logs = appendLog(
      state.battleLogs,
      state.turnNumber,
      side,
      `${side === "PLAYER" ? "Pemain" : "Bot"} memainkan instrumen '${
        instrument.name
      }' pada ${targetSlot.card.name}${
        synergy ? " [Bonus Sinergi Afinitas Aktif!]" : ""
      }.`,
      synergy ? "SYNERGY" : "INSTRUMENT",
      synergy ? "battle.log.playInstrumentSynergy" : "battle.log.playInstrument",
      { actor: sideActor(isActingPlayer), instrument: instrument.name, target: targetSlot.card.name }
    );

    return {
      ...state,
      playerFrontRow: isTargetPlayer ? frontRow : state.playerFrontRow,
      playerSecondRow: isTargetPlayer ? secondRow : state.playerSecondRow,
      botFrontRow: isTargetPlayer ? state.botFrontRow : frontRow,
      botSecondRow: isTargetPlayer ? state.botSecondRow : secondRow,
      playerInstrumentHand: isActingPlayer ? hand : state.playerInstrumentHand,
      botInstrumentHand: isActingPlayer ? state.botInstrumentHand : hand,
      playerInstrumentDiscard: isActingPlayer
        ? discard
        : state.playerInstrumentDiscard,
      botInstrumentDiscard: isActingPlayer ? state.botInstrumentDiscard : discard,
      battleLogs: logs,
    };
  }

  public static declareAttack(
    state: BattleStateEntity,
    attackerFrontIndex: number,
    defenderFrontIndex: number
  ): BattleStateEntity {
    const attackerSide = state.activePlayer;
    const isPlayerAttacker = attackerSide === "PLAYER";

    const attackerFrontRow = isPlayerAttacker
      ? [...state.playerFrontRow]
      : [...state.botFrontRow];
    const defenderFrontRow = isPlayerAttacker
      ? [...state.botFrontRow]
      : [...state.playerFrontRow];

    const attacker = attackerFrontRow[attackerFrontIndex];
    const defender = defenderFrontRow[defenderFrontIndex];

    if (!attacker || !defender || attacker.hasAttackedThisTurn) {
      return state;
    }

    // Reveal both cards upon attack declaration
    attackerFrontRow[attackerFrontIndex] = { ...attacker, isRevealed: true };
    defenderFrontRow[defenderFrontIndex] = { ...defender, isRevealed: true };

    const logs = appendLog(
      state.battleLogs,
      state.turnNumber,
      attackerSide,
      `${attacker.card.name} menyerang ${defender.card.name} di Baris Depan!`,
      "COMBAT",
      "battle.log.attack",
      { attacker: attacker.card.name, defender: defender.card.name }
    );
    const attacksThisTurn =
      state.attacksThisTurn ??
      state.battleLogs.filter(
        (entry) =>
          entry.turn === state.turnNumber &&
          entry.actor === attackerSide &&
          entry.highlight === "COMBAT" &&
          entry.message.includes(" menyerang ")
      ).length;

    return {
      ...state,
      phase: "DEFENDER_INSTRUMENT_RESPONSE",
      attacksThisTurn: attacksThisTurn + 1,
      playerFrontRow: isPlayerAttacker ? attackerFrontRow : defenderFrontRow,
      botFrontRow: isPlayerAttacker ? defenderFrontRow : attackerFrontRow,
      pendingAttack: {
        attackerSide,
        attackerFrontIndex,
        defenderFrontIndex,
      },
      battleLogs: logs,
    };
  }

  public static resolvePendingCombat(
    state: BattleStateEntity
  ): BattleStateEntity {
    if (!state.pendingAttack) {
      return state;
    }

    const { attackerSide, attackerFrontIndex, defenderFrontIndex } =
      state.pendingAttack;
    const isPlayerAttacker = attackerSide === "PLAYER";
    const defenderSide: "PLAYER" | "BOT" = isPlayerAttacker ? "BOT" : "PLAYER";

    const playerFrontRow = [...state.playerFrontRow];
    const botFrontRow = [...state.botFrontRow];
    const playerSecondRow = [...state.playerSecondRow];
    const botSecondRow = [...state.botSecondRow];
    const playerCharacterDeck = [...state.playerCharacterDeck];
    const botCharacterDeck = [...state.botCharacterDeck];
    const playerGraveyard = [...state.playerGraveyard];
    const botGraveyard = [...state.botGraveyard];

    const attackerRow = isPlayerAttacker ? playerFrontRow : botFrontRow;
    const defenderRow = isPlayerAttacker ? botFrontRow : playerFrontRow;

    const attacker = attackerRow[attackerFrontIndex];
    const defender = defenderRow[defenderFrontIndex];

    if (!attacker || !defender) {
      return {
        ...state,
        pendingAttack: null,
        phase: "PRE_ATTACK_INSTRUMENT",
      };
    }

    const effectiveAttackerAtk = Math.max(
      0,
      attacker.currentAttack +
        defender.tempEnemyAttackMod +
        attacker.appliedInstruments.reduce(
          (total, buff) => total + buff.strikeAttackBonus,
          0
        )
    );
    const effectiveAttackerDef = Math.max(0, attacker.currentDefense);
    const ignoredDefenseAmount = attacker.tempIgnoreDefense;
    const effectiveDefenderDef = Math.max(
      0,
      defender.currentDefense - ignoredDefenseAmount
    );
    const effectiveDefenderAtk = Math.max(
      0,
      defender.currentAttack +
        attacker.tempEnemyAttackMod +
        defender.appliedInstruments.reduce(
          (total, buff) => total + buff.strikeAttackBonus,
          0
        )
    );

    let resolutionType: CombatResolutionType;
    let counterAttackTriggered = false;
    let defeatedSide: "PLAYER" | "BOT" | null = null;
    let defeatedFrontIndex: number | null = null;
    let summaryText = "";
    let summaryMessageKey = "";

    // Mark attacker as having attacked this turn
    attackerRow[attackerFrontIndex] = {
      ...attacker,
      isRevealed: true,
      hasAttackedThisTurn: true,
    };
    defenderRow[defenderFrontIndex] = {
      ...defender,
      isRevealed: true,
    };

    if (effectiveAttackerAtk > effectiveDefenderDef) {
      resolutionType = "ATTACKER_WINS";
      defeatedSide = defenderSide;
      defeatedFrontIndex = defenderFrontIndex;
      defenderRow[defenderFrontIndex] = null;
      if (defenderSide === "PLAYER") {
        playerGraveyard.push(defender.card);
      } else {
        botGraveyard.push(defender.card);
      }
      summaryText = `${attacker.card.name} (ATK ${effectiveAttackerAtk}) menembus pertahanan ${defender.card.name} (DEF ${effectiveDefenderDef})! ${defender.card.name} gugur.`;
      summaryMessageKey = "battle.log.duelAttackerWins";
    } else if (effectiveAttackerAtk === effectiveDefenderDef) {
      resolutionType = "TIE";
      summaryText = `SERI! Serangan ${attacker.card.name} (ATK ${effectiveAttackerAtk}) seimbang dengan pertahanan ${defender.card.name} (DEF ${effectiveDefenderDef}). Tidak ada karakter yang gugur.`;
      summaryMessageKey = "battle.log.duelTie";
    } else {
      counterAttackTriggered = true;
      if (effectiveDefenderAtk > effectiveAttackerDef) {
        resolutionType = "COUNTER_DEFENDER_WINS";
        defeatedSide = attackerSide;
        defeatedFrontIndex = attackerFrontIndex;
        attackerRow[attackerFrontIndex] = null;
        if (attackerSide === "PLAYER") {
          playerGraveyard.push(attacker.card);
        } else {
          botGraveyard.push(attacker.card);
        }
        summaryText = `Serangan gagal (ATK ${effectiveAttackerAtk} < DEF ${effectiveDefenderDef})! ${defender.card.name} melakukan Serangan Balik (ATK ${effectiveDefenderAtk} > DEF ${effectiveAttackerDef}) dan mengalahkan ${attacker.card.name}!`;
        summaryMessageKey = "battle.log.duelCounterWins";
      } else {
        resolutionType = "COUNTER_BOTH_SURVIVE";
        summaryText = `Serangan gagal (ATK ${effectiveAttackerAtk} < DEF ${effectiveDefenderDef})! ${defender.card.name} melakukan Serangan Balik (ATK ${effectiveDefenderAtk} vs DEF ${effectiveAttackerDef}), namun ${attacker.card.name} bertahan!`;
        summaryMessageKey = "battle.log.duelCounterSurvive";
      }
    }

    const duelOutcome: BattleDuelOutcome = {
      id: `duel-${state.turnNumber}-${randomUUID()}`,
      attackerSide,
      attackerFrontIndex,
      defenderFrontIndex,
      attackerCard: attacker.card,
      defenderCard: defender.card,
      effectiveAttackerAtk,
      effectiveAttackerDef,
      effectiveDefenderAtk,
      effectiveDefenderDef,
      ignoredDefenseAmount,
      resolutionType,
      counterAttackTriggered,
      defeatedSide,
      defeatedFrontIndex,
      summaryText,
      summaryMessageKey,
      summaryMessageParams: {
        attacker: attacker.card.name,
        defender: defender.card.name,
        attack: effectiveAttackerAtk,
        defense: effectiveDefenderDef,
        counterAttack: effectiveDefenderAtk,
        counterDefense: effectiveAttackerDef,
      },
    };

    let logs = appendLog(
      state.battleLogs,
      state.turnNumber,
      attackerSide,
      summaryText,
      "COMBAT",
      summaryMessageKey,
      duelOutcome.summaryMessageParams
    );

    let nextPhase: BattleStateEntity["phase"] = "PRE_ATTACK_INSTRUMENT";
    let pendingPromotion: BattleStateEntity["pendingPromotion"] = null;

    if (defeatedSide !== null && defeatedFrontIndex !== null) {
      const targetSecondRow =
        defeatedSide === "PLAYER" ? playerSecondRow : botSecondRow;
      const targetFrontRow =
        defeatedSide === "PLAYER" ? playerFrontRow : botFrontRow;
      const targetCharDeck =
        defeatedSide === "PLAYER" ? playerCharacterDeck : botCharacterDeck;

      const availableSecondRowCount = targetSecondRow.filter(
        (slot) => slot !== null
      ).length;

      if (availableSecondRowCount > 0) {
        pendingPromotion = {
          side: defeatedSide,
          emptyFrontIndex: defeatedFrontIndex,
        };
        nextPhase = "PROMOTE_CHARACTER";
      } else if (targetCharDeck.length > 0) {
        const drawnReserve = targetCharDeck.shift()!;
        targetFrontRow[defeatedFrontIndex] = createBattleSlotCharacter(
          drawnReserve,
          defeatedSide === "PLAYER",
          `${defeatedSide}-direct-${randomUUID()}`
        );
        logs = appendLog(
          logs,
          state.turnNumber,
          defeatedSide,
          `Baris Kedua kosong: 1 karakter cadangan dari Deck langsung mengisi Baris Depan.`,
          "PROMOTION",
          "battle.log.directPromotion"
        );
      }
    }

    const updatedState: BattleStateEntity = {
      ...state,
      phase: nextPhase,
      playerFrontRow,
      botFrontRow,
      playerSecondRow,
      botSecondRow,
      playerCharacterDeck,
      botCharacterDeck,
      playerGraveyard,
      botGraveyard,
      pendingAttack: null,
      pendingPromotion,
      lastDuelOutcome: duelOutcome,
      battleLogs: logs,
    };

    return BattleEngine.evaluateWinner(updatedState);
  }

  public static promoteSecondRowCharacter(
    state: BattleStateEntity,
    secondRowIndex: number
  ): BattleStateEntity {
    if (!state.pendingPromotion) {
      return state;
    }

    const { side, emptyFrontIndex } = state.pendingPromotion;
    const isPlayer = side === "PLAYER";

    const frontRow = isPlayer
      ? [...state.playerFrontRow]
      : [...state.botFrontRow];
    const secondRow = isPlayer
      ? [...state.playerSecondRow]
      : [...state.botSecondRow];
    const charDeck = isPlayer
      ? [...state.playerCharacterDeck]
      : [...state.botCharacterDeck];

    const chosen = secondRow[secondRowIndex];
    if (!chosen) {
      return state;
    }

    // Move chosen Second Row character to the empty Front Row slot
    frontRow[emptyFrontIndex] = {
      ...chosen,
      hasAttackedThisTurn: true,
    };

    // Auto-refill the vacated Second Row slot from Character Deck if available
    if (charDeck.length > 0) {
      const replacement = charDeck.shift()!;
      secondRow[secondRowIndex] = createBattleSlotCharacter(
        replacement,
        false,
        `${side}-refill-${state.turnNumber}-${secondRowIndex}-${randomUUID()}`
      );
    } else {
      secondRow[secondRowIndex] = null;
    }

    const logs = appendLog(
      state.battleLogs,
      state.turnNumber,
      side,
      `${
        isPlayer ? chosen.card.name : "Karakter Baris Kedua Bot"
      } naik mengisi Baris Depan #${emptyFrontIndex + 1}${
        secondRow[secondRowIndex]
          ? " dan slot Baris Kedua diisi ulang dari Deck Karakter."
          : "."
      }`,
      "PROMOTION",
      secondRow[secondRowIndex] ? "battle.log.promotionRefilled" : "battle.log.promotion",
      { character: isPlayer ? chosen.card.name : "Karakter Baris Kedua Bot", slot: emptyFrontIndex + 1 }
    );

    const nextState: BattleStateEntity = {
      ...state,
      phase: "PRE_ATTACK_INSTRUMENT",
      playerFrontRow: isPlayer ? frontRow : state.playerFrontRow,
      playerSecondRow: isPlayer ? secondRow : state.playerSecondRow,
      playerCharacterDeck: isPlayer ? charDeck : state.playerCharacterDeck,
      botFrontRow: isPlayer ? state.botFrontRow : frontRow,
      botSecondRow: isPlayer ? state.botSecondRow : secondRow,
      botCharacterDeck: isPlayer ? state.botCharacterDeck : charDeck,
      pendingPromotion: null,
      battleLogs: logs,
    };

    return BattleEngine.evaluateWinner(nextState);
  }

  public static endTurn(
    state: BattleStateEntity,
    rng: BattleRandomInt = secureBattleRandomInt
  ): BattleStateEntity {
    if (state.phase === "MATCH_OVER" || state.winner !== null) {
      return state;
    }

    const resetRow = (
      row: Array<BattleSlotCharacter | null>
    ): Array<BattleSlotCharacter | null> =>
      row.map((slot) =>
        slot
          ? {
              ...slot,
              currentAttack: slot.card.baseAttack,
              currentDefense: slot.card.baseDefense,
              tempAttackMod: 0,
              tempDefenseMod: 0,
              tempEnemyAttackMod: 0,
              tempIgnoreDefense: 0,
              appliedInstruments: [],
              hasAttackedThisTurn: false,
            }
          : null
      );

    const nextPlayer: "PLAYER" | "BOT" =
      state.activePlayer === "PLAYER" ? "BOT" : "PLAYER";
    const nextTurn = state.turnNumber + 1;

    const logs = appendLog(
      state.battleLogs,
      nextTurn,
      "SYSTEM",
      `Giliran #${nextTurn}: Giliran ${
        nextPlayer === "PLAYER" ? "Pemain" : "Bot"
      }. Efek instrumen sementara telah berakhir.`,
      undefined,
      "battle.log.turn",
      { turn: nextTurn, nextPlayer }
    );

    const transitioned: BattleStateEntity = {
      ...state,
      turnNumber: nextTurn,
      attacksThisTurn: 0,
      activePlayer: nextPlayer,
      phase: "DRAW_INSTRUMENT",
      playerFrontRow: resetRow(state.playerFrontRow),
      playerSecondRow: resetRow(state.playerSecondRow),
      botFrontRow: resetRow(state.botFrontRow),
      botSecondRow: resetRow(state.botSecondRow),
      pendingAttack: null,
      pendingPromotion: null,
      battleLogs: logs,
    };

    return BattleEngine.drawInstrumentForActivePlayer(transitioned, rng);
  }

  public static evaluateWinner(state: BattleStateEntity): BattleStateEntity {
    const playerRemaining =
      state.playerFrontRow.filter(Boolean).length +
      state.playerSecondRow.filter(Boolean).length +
      state.playerCharacterDeck.length;

    const botRemaining =
      state.botFrontRow.filter(Boolean).length +
      state.botSecondRow.filter(Boolean).length +
      state.botCharacterDeck.length;

    if (botRemaining === 0) {
      const logs = appendLog(
        state.battleLogs,
        state.turnNumber,
        "SYSTEM",
        "KEMENANGAN! Seluruh karakter lawan telah dikalahkan!",
        "COMBAT",
        "battle.log.victory"
      );
      return {
        ...state,
        winner: "PLAYER",
        phase: "MATCH_OVER",
        battleLogs: logs,
      };
    }

    if (playerRemaining === 0) {
      const logs = appendLog(
        state.battleLogs,
        state.turnNumber,
        "SYSTEM",
        "KEKALAHAN! Seluruh karakter Anda telah gugur di medan laga.",
        "COMBAT",
        "battle.log.defeat"
      );
      return {
        ...state,
        winner: "BOT",
        phase: "MATCH_OVER",
        battleLogs: logs,
      };
    }

    return state;
  }

  public static discardHandInstrument(
    state: BattleStateEntity,
    side: "PLAYER" | "BOT",
    handInstanceId: string
  ): BattleStateEntity {
    const isPlayer = side === "PLAYER";
    const hand = isPlayer
      ? [...state.playerInstrumentHand]
      : [...state.botInstrumentHand];
    const discard = isPlayer
      ? [...state.playerInstrumentDiscard]
      : [...state.botInstrumentDiscard];

    const idx = hand.findIndex((h) => h.instanceId === handInstanceId);
    if (idx === -1) {
      return state;
    }

    const [removed] = hand.splice(idx, 1);
    discard.push(removed.card);

    const logs = appendLog(
      state.battleLogs,
      state.turnNumber,
      side,
      `${
        isPlayer ? "Pemain" : "Bot"
      } membuang instrumen '${removed.card.name}' dari tangan ke Discard Pile.`,
      "INSTRUMENT",
      "battle.log.discard",
      { actor: sideActor(isPlayer), instrument: removed.card.name }
    );

    return {
      ...state,
      playerInstrumentHand: isPlayer ? hand : state.playerInstrumentHand,
      botInstrumentHand: isPlayer ? state.botInstrumentHand : hand,
      playerInstrumentDiscard: isPlayer
        ? discard
        : state.playerInstrumentDiscard,
      botInstrumentDiscard: isPlayer ? state.botInstrumentDiscard : discard,
      battleLogs: logs,
    };
  }

  public static surrenderMatch(
    state: BattleStateEntity,
    surrenderingSide: "PLAYER" | "BOT" = "PLAYER"
  ): BattleStateEntity {
    if (state.phase === "MATCH_OVER" || state.winner !== null) {
      return state;
    }

    const winnerSide: "PLAYER" | "BOT" =
      surrenderingSide === "PLAYER" ? "BOT" : "PLAYER";
    const logs = appendLog(
      state.battleLogs,
      state.turnNumber,
      surrenderingSide,
      `${
        surrenderingSide === "PLAYER" ? "Pemain" : "Bot"
      } menyatakan menyerah. Pertandingan dimenangkan oleh ${
        winnerSide === "PLAYER" ? "Pemain" : "Bot"
      }.`,
      "COMBAT",
      "battle.log.surrender",
      {
        actor: sideActor(surrenderingSide === "PLAYER"),
        winner: sideActor(winnerSide === "PLAYER"),
      }
    );

    return {
      ...state,
      winner: winnerSide,
      phase: "MATCH_OVER",
      pendingAttack: null,
      pendingPromotion: null,
      battleLogs: logs,
    };
  }
}

