import "server-only";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import type { BotDifficulty } from "@/client/domain/battle/entity/battle_entity";
import { shuffleCards, type BattleRandomInt } from "./battle_engine";
import { secureBattleRandomInt } from "./auditable-rng";

export interface BotDeckComposition {
  botCharacters: CardEntity[];
  botInstruments: CardEntity[];
}

/**
 * Builds a balanced bot deck curated according to the selected BotDifficulty.
 *
 * - EASY (Pemula / Latihan Dasar):
 *   Uses starter/novice-tier cards with moderate stats (total <= 2300, baseAttack <= 1100, baseDefense <= 1300)
 *   and gentle instruments without heavy piercing or extreme buffs.
 *
 * - MEDIUM (Menengah / Taktis Seimbang):
 *   Uses a balanced mid-tier character pool (total stats between 2100 and 2400)
 *   and standard diverse instruments.
 *
 * - HARD (Sulit / Sinergi Mahir):
 *   Uses elite legendary commanders & prajurit (total stats >= 2300 with high ATK/DEF)
 *   and powerful synergy instruments.
 */
export function buildBotDeckByDifficulty(
  catalog: readonly CardEntity[],
  difficulty: BotDifficulty,
  rng: BattleRandomInt = secureBattleRandomInt
): BotDeckComposition {
  const characters = catalog.filter((card) => card.cardType === "CHARACTER");
  const instruments = catalog.filter((card) => card.cardType === "INSTRUMENT");

  let candidateChars: CardEntity[];
  let candidateInsts: CardEntity[];

  switch (difficulty) {
    case "EASY": {
      const easyChars = characters.filter(
        (c) =>
          c.baseAttack + c.baseDefense <= 2300 &&
          c.baseAttack <= 1100 &&
          c.baseDefense <= 1300
      );
      candidateChars = easyChars.length >= 10 ? easyChars : characters;

      const easyInsts = instruments.filter(
        (i) =>
          i.attackMod <= 200 &&
          i.defenseMod <= 250 &&
          i.ignoreDefenseAmount <= 100
      );
      candidateInsts = easyInsts.length >= 8 ? easyInsts : instruments;
      break;
    }

    case "MEDIUM": {
      const medChars = characters.filter((c) => {
        const total = c.baseAttack + c.baseDefense;
        return total >= 2100 && total <= 2400;
      });
      candidateChars = medChars.length >= 10 ? medChars : characters;
      candidateInsts = instruments;
      break;
    }

    case "HARD": {
      const hardChars = characters.filter((c) => {
        const total = c.baseAttack + c.baseDefense;
        return (
          total >= 2300 &&
          (c.baseAttack >= 1200 || c.baseDefense >= 1400 || total >= 2400)
        );
      });
      candidateChars = hardChars.length >= 10 ? hardChars : characters;

      const hardInsts = instruments.filter(
        (i) =>
          i.attackMod >= 200 ||
          i.defenseMod >= 250 ||
          i.ignoreDefenseAmount > 0 ||
          i.affinityBonusAtk > 0 ||
          i.affinityBonusDef > 0
      );
      candidateInsts = hardInsts.length >= 8 ? hardInsts : instruments;
      break;
    }
  }

  const botCharacters = shuffleCards(
    candidateChars,
    rng,
    `bot-characters-${difficulty.toLowerCase()}`
  ).slice(0, 10);

  const botInstruments = shuffleCards(
    candidateInsts,
    rng,
    `bot-instruments-${difficulty.toLowerCase()}`
  ).slice(0, 8);

  return { botCharacters, botInstruments };
}

