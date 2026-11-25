import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  ALL_CARDS_CATALOG,
  CHARACTERS_CATALOG,
  INSTRUMENTS_CATALOG,
  STARTER_PACKS_CATALOG,
  type CatalogCardSeed,
} from "@/core/constants/cards-catalog";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import {
  BattleEngine,
  checkInstrumentSynergy,
  MAX_INSTRUMENT_HAND,
} from "@/server/modules/battle/domain/battle_engine";
import { BotAiService } from "@/server/modules/battle/domain/bot_ai_service";
import { buildBotDeckByDifficulty } from "@/server/modules/battle/domain/bot_deck_builder";

function seedToEntity(seed: CatalogCardSeed): CardEntity {
  return {
    id: `test-${seed.slug}`,
    code: seed.code,
    slug: seed.slug,
    name: seed.name,
    cardType: seed.cardType,
    kingdom: seed.kingdom,
    role: seed.role,
    secondaryRoles: [...seed.secondaryRoles],
    gender: seed.gender,
    baseAttack: seed.baseAttack,
    baseDefense: seed.baseDefense,
    effectName: seed.effectName,
    effectType: seed.effectType,
    effectDescriptionId: seed.effectDescriptionId,
    effectDescriptionEn: seed.effectDescriptionEn,
    effectDescriptionZh: seed.effectDescriptionZh,
    attackMod: seed.attackMod,
    strikeAttackBonus: seed.strikeAttackBonus ?? 0,
    defenseMod: seed.defenseMod,
    enemyAttackMod: seed.enemyAttackMod,
    ignoreDefenseAmount: seed.ignoreDefenseAmount,
    affinityRole: seed.affinityRole,
    affinityGender: seed.affinityGender,
    affinityBonusAtk: seed.affinityBonusAtk,
    affinityBonusDef: seed.affinityBonusDef,
    historicalSummaryId: seed.historicalSummaryId,
    historicalSummaryEn: seed.historicalSummaryEn,
    historicalSummaryZh: seed.historicalSummaryZh,
    illustrationNote: seed.illustrationNote,
    sourceCitation: seed.sourceCitation,
    sourceUrl: seed.sourceUrl,
    verificationStatus: seed.verificationStatus,
    publicationStatus: seed.publicationStatus,
    imagePath: seed.imagePath,
    asset: {
      id: `asset-${seed.slug}`,
      cardId: `test-${seed.slug}`,
      creator: seed.assetMetadata.creator,
      rightsHolder: seed.assetMetadata.rightsHolder,
      sourceOrigin: seed.assetMetadata.sourceOrigin,
      licenseType: seed.assetMetadata.licenseType,
      commercialAllowed: seed.assetMetadata.commercialAllowed,
      creditText: seed.assetMetadata.creditText,
      approvalStatus: seed.assetMetadata.approvalStatus,
    },
  };
}

describe("Nusantara Card Catalog & Synergy Integrity", () => {
  it("contains 46 characters and 30 traditional instruments (76 total)", () => {
    expect(CHARACTERS_CATALOG.length).toBe(46);
    expect(INSTRUMENTS_CATALOG.length).toBe(30);
    expect(ALL_CARDS_CATALOG.length).toBe(76);
  });

  it("ensures every Instrument (including Perajin instruments) has at least one matching Character for Affinity Synergy", () => {
    const characters = CHARACTERS_CATALOG.map(seedToEntity);
    const instruments = INSTRUMENTS_CATALOG.map(seedToEntity);

    for (const inst of instruments) {
      const matchingChars = characters.filter((char) =>
        checkInstrumentSynergy(char, inst)
      );
      expect(matchingChars.length).toBeGreaterThan(0);
    }
  });

  it("validates that all Packs in catalog contain valid Character and Instrument cards", () => {
    const bySlug = new Map(ALL_CARDS_CATALOG.map((c) => [c.slug, c]));
    for (const pack of STARTER_PACKS_CATALOG) {
      const chars = pack.cardSlugs.filter(
        (s) => bySlug.get(s)?.cardType === "CHARACTER"
      );
      const insts = pack.cardSlugs.filter(
        (s) => bySlug.get(s)?.cardType === "INSTRUMENT"
      );
      expect(chars.length + insts.length).toBe(pack.cardSlugs.length);
      expect(pack.isFairPlaySafe).toBe(true);
    }
  });
});

describe("BattleEngine 2-Row Tactical Rules", () => {
  const playerCharacters = CHARACTERS_CATALOG.slice(0, 10).map(seedToEntity);
  const botCharacters = CHARACTERS_CATALOG.slice(15, 25).map(seedToEntity);
  const playerInstruments = INSTRUMENTS_CATALOG.slice(0, 8).map(seedToEntity);
  const botInstruments = INSTRUMENTS_CATALOG.slice(8, 16).map(seedToEntity);

  it("sets up 2 Front Row + 3 Second Row characters, 5 reserve characters, and 3 initial Instruments", () => {
    const state = BattleEngine.createInitialState({
      playerDeckName: "Majapahit Test",
      botDifficulty: "MEDIUM",
      playerCharacters,
      playerInstruments,
      botCharacters,
      botInstruments,
      shuffle: false,
    });

    expect(state.playerFrontRow.filter(Boolean).length).toBe(2);
    expect(state.playerSecondRow.filter(Boolean).length).toBe(3);
    expect(state.playerCharacterDeck.length).toBe(5);
    expect(state.playerInstrumentHand.length).toBe(3);

    // Slot cards start unrevealed to the opponent (revealed upon clash/attack)
    expect(state.playerFrontRow[0]?.isRevealed).toBe(false);
    expect(state.botFrontRow[0]?.isRevealed).toBe(false);
  });

  it("enforces max 6 Instrument hand limit and reshuffles discard pile when deck is empty", () => {
    let state = BattleEngine.createInitialState({
      playerDeckName: "Majapahit Test",
      botDifficulty: "MEDIUM",
      playerCharacters,
      playerInstruments,
      botCharacters,
      botInstruments,
      shuffle: false,
    });

    state = BattleEngine.resolveDiceRoll(state, {
      playerRoll: 6,
      botRoll: 2,
    });
    expect(state.activePlayer).toBe("PLAYER");

    // Draw until hand reaches 6, then draw 1 more to verify overflow goes to discard
    for (let i = 0; i < 5; i += 1) {
      state = BattleEngine.drawInstrumentForActivePlayer(state);
    }

    expect(state.playerInstrumentHand.length).toBe(MAX_INSTRUMENT_HAND);
    expect(state.playerInstrumentDiscard.length).toBeGreaterThan(0);

    // Empty the deck and verify reshuffle from discard
    state = {
      ...state,
      playerInstrumentDeck: [],
      playerInstrumentHand: state.playerInstrumentHand.slice(0, 4),
    };
    state = BattleEngine.drawInstrumentForActivePlayer(state);
    expect(state.playerInstrumentHand.length).toBe(5);
  });

  it("applies Instrument card with +100 Affinity Synergy Bonus when role matches", () => {
    let state = BattleEngine.createInitialState({
      playerDeckName: "Majapahit Test",
      botDifficulty: "MEDIUM",
      playerCharacters,
      playerInstruments,
      botCharacters,
      botInstruments,
      shuffle: false,
    });

    // Put Gajah Mada (PRAJURIT, base ATK 1500) in Front Row [0]
    const gajahMada = seedToEntity(
      CHARACTERS_CATALOG.find((c) => c.slug === "gajah-mada")!
    );
    const padahi = seedToEntity(
      INSTRUMENTS_CATALOG.find((c) => c.slug === "padahi")!
    );

    state.playerFrontRow[0] = {
      ...state.playerFrontRow[0]!,
      card: gajahMada,
      currentAttack: gajahMada.baseAttack,
      currentDefense: gajahMada.baseDefense,
    };
    state.playerInstrumentHand = [
      { instanceId: "inst-padahi-test", card: padahi },
    ];

    state = BattleEngine.applyInstrumentToCharacter(
      state,
      "PLAYER",
      "inst-padahi-test",
      "FRONT",
      0
    );

    // Padahi gives +250 ATK + 100 Prajurit Synergy = +350 ATK (1400 -> 1750, DEF stays 1000)
    expect(state.playerFrontRow[0]?.currentAttack).toBe(1750);
    expect(state.playerFrontRow[0]?.currentDefense).toBe(1000);
    expect(
      state.playerFrontRow[0]?.appliedInstruments[0]?.synergyTriggered
    ).toBe(true);
  });

  it("keeps Kendang synergy on Attack and does not add undocumented penetration", () => {
    let state = BattleEngine.createInitialState({
      playerDeckName: "Instrument Rules Test",
      botDifficulty: "MEDIUM",
      playerCharacters,
      playerInstruments,
      botCharacters,
      botInstruments,
      shuffle: false,
    });
    const warrior = seedToEntity(CHARACTERS_CATALOG.find((card) => card.slug === "gajah-mada")!);
    const kendang = seedToEntity(INSTRUMENTS_CATALOG.find((card) => card.slug === "kendang")!);
    state.playerFrontRow[0] = { ...state.playerFrontRow[0]!, card: warrior, currentAttack: warrior.baseAttack, currentDefense: warrior.baseDefense };
    state.playerInstrumentHand = [{ instanceId: "kendang-test", card: kendang }];

    state = BattleEngine.applyInstrumentToCharacter(state, "PLAYER", "kendang-test", "FRONT", 0);

    expect(state.playerFrontRow[0]?.currentAttack).toBe(warrior.baseAttack + 250);
    expect(state.playerFrontRow[0]?.tempIgnoreDefense).toBe(100);
  });

  it("applies Kempul's strike bonus only during a character's attack", () => {
    let state = BattleEngine.createInitialState({
      playerDeckName: "Instrument Rules Test",
      botDifficulty: "MEDIUM",
      playerCharacters,
      playerInstruments,
      botCharacters,
      botInstruments,
      shuffle: false,
    });
    const envoy = seedToEntity(CHARACTERS_CATALOG.find((card) => card.role === "UTUSAN")!);
    const kempul = seedToEntity(INSTRUMENTS_CATALOG.find((card) => card.slug === "kempul")!);
    state.playerFrontRow[0] = { ...state.playerFrontRow[0]!, card: envoy, currentAttack: envoy.baseAttack, currentDefense: envoy.baseDefense };
    state.playerInstrumentHand = [{ instanceId: "kempul-test", card: kempul }];

    state = BattleEngine.applyInstrumentToCharacter(state, "PLAYER", "kempul-test", "FRONT", 0);
    expect(state.playerFrontRow[0]?.currentAttack).toBe(envoy.baseAttack + 300);
    expect(state.playerFrontRow[0]?.appliedInstruments[0]?.strikeAttackBonus).toBe(100);

    state = BattleEngine.declareAttack(state, 0, 0);
    state = BattleEngine.resolvePendingCombat(state);
    expect(state.lastDuelOutcome?.effectiveAttackerAtk).toBe(envoy.baseAttack + 400);
  });

  it("applies Gambang's Perajin synergy only to Attack as described", () => {
    let state = BattleEngine.createInitialState({
      playerDeckName: "Instrument Rules Test",
      botDifficulty: "MEDIUM",
      playerCharacters,
      playerInstruments,
      botCharacters,
      botInstruments,
      shuffle: false,
    });
    const artisan = { ...seedToEntity(CHARACTERS_CATALOG[0]), secondaryRoles: ["PERAJIN"] as CardEntity["secondaryRoles"] };
    const gambang = seedToEntity(INSTRUMENTS_CATALOG.find((card) => card.slug === "gambang")!);
    state.playerFrontRow[0] = { ...state.playerFrontRow[0]!, card: artisan, currentAttack: artisan.baseAttack, currentDefense: artisan.baseDefense };
    state.playerInstrumentHand = [{ instanceId: "gambang-test", card: gambang }];

    state = BattleEngine.applyInstrumentToCharacter(state, "PLAYER", "gambang-test", "FRONT", 0);

    expect(state.playerFrontRow[0]?.currentAttack).toBe(artisan.baseAttack + 100);
    expect(state.playerFrontRow[0]?.currentDefense).toBe(artisan.baseDefense + 250);
  });

  it("targets Kecrek's enemy Attack reduction directly on the selected opponent", () => {
    let state = BattleEngine.createInitialState({
      playerDeckName: "Instrument Rules Test",
      botDifficulty: "MEDIUM",
      playerCharacters,
      playerInstruments,
      botCharacters,
      botInstruments,
      shuffle: false,
    });
    const envoy = seedToEntity(CHARACTERS_CATALOG.find((card) => card.role === "UTUSAN")!);
    const kecrek = seedToEntity(INSTRUMENTS_CATALOG.find((card) => card.slug === "kecrek")!);
    state.botFrontRow[0] = { ...state.botFrontRow[0]!, card: envoy, currentAttack: envoy.baseAttack, currentDefense: envoy.baseDefense };
    state.playerInstrumentHand = [{ instanceId: "kecrek-test", card: kecrek }];

    state = BattleEngine.applyInstrumentToCharacter(state, "PLAYER", "kecrek-test", "FRONT", 0, "OPPONENT");

    expect(state.botFrontRow[0]?.currentAttack).toBe(envoy.baseAttack - 300);
    expect(state.botFrontRow[0]?.tempEnemyAttackMod).toBe(0);
    expect(state.playerFrontRow[0]?.tempEnemyAttackMod).toBe(0);
  });

  it("resolves ATK > DEF (defender defeated), ATK == DEF (tie), and ATK < DEF (automatic Counter-Attack)", () => {
    let state = BattleEngine.createInitialState({
      playerDeckName: "Majapahit Test",
      botDifficulty: "MEDIUM",
      playerCharacters,
      playerInstruments,
      botCharacters,
      botInstruments,
      shuffle: false,
    });
    state = BattleEngine.resolveDiceRoll(state, { playerRoll: 6, botRoll: 1 });
    state = BattleEngine.drawInstrumentForActivePlayer(state);

    // 1. Test TIE (ATK == DEF)
    state.playerFrontRow[0]!.currentAttack = 1400;
    state.botFrontRow[0]!.currentDefense = 1400;
    state = BattleEngine.declareAttack(state, 0, 0);
    state = BattleEngine.resolvePendingCombat(state);
    expect(state.lastDuelOutcome?.resolutionType).toBe("TIE");
    expect(state.playerFrontRow[0]).not.toBeNull();
    expect(state.botFrontRow[0]).not.toBeNull();

    // 2. Test Automatic Counter-Attack where Defender Wins (ATK A < DEF B and ATK B > DEF A)
    state.playerFrontRow[1]!.currentAttack = 900;
    state.playerFrontRow[1]!.currentDefense = 900;
    state.botFrontRow[0]!.currentDefense = 1500;
    state.botFrontRow[0]!.currentAttack = 1300;

    state = BattleEngine.declareAttack(state, 1, 0);
    state = BattleEngine.resolvePendingCombat(state);
    expect(state.lastDuelOutcome?.counterAttackTriggered).toBe(true);
    expect(state.lastDuelOutcome?.resolutionType).toBe("COUNTER_DEFENDER_WINS");
    expect(state.playerFrontRow[1]).toBeNull();
    expect(state.phase).toBe("PROMOTE_CHARACTER");
    expect(state.pendingPromotion).toEqual({
      side: "PLAYER",
      emptyFrontIndex: 1,
    });

    // 3. Test Promotion from Second Row -> Front Row + Auto-Refill from Character Deck
    const deckCountBefore = state.playerCharacterDeck.length;
    state = BattleEngine.promoteSecondRowCharacter(state, 0);
    expect(state.playerFrontRow[1]).not.toBeNull();
    expect(state.playerSecondRow[0]).not.toBeNull();
    expect(state.playerCharacterDeck.length).toBe(deckCountBefore - 1);
  });

  it("supports BotAiService decision making across phases", () => {
    let state = BattleEngine.createInitialState({
      playerDeckName: "Majapahit Test",
      botDifficulty: "HARD",
      playerCharacters,
      playerInstruments,
      botCharacters,
      botInstruments,
      shuffle: false,
    });
    state = BattleEngine.resolveDiceRoll(state, { playerRoll: 1, botRoll: 6 });
    state = BattleEngine.drawInstrumentForActivePlayer(state);

    const attackChoice = BotAiService.chooseAttackDeclaration(state);
    expect(attackChoice === null || typeof attackChoice.attackerFrontIndex === "number").toBe(
      true
    );
  });

  it("builds curated bot decks tailored to EASY, MEDIUM, and HARD difficulty levels", () => {
    const allCards = ALL_CARDS_CATALOG.map(seedToEntity);

    // EASY: characters must not exceed beginner thresholds
    const easyDeck = buildBotDeckByDifficulty(allCards, "EASY");
    expect(easyDeck.botCharacters.length).toBe(10);
    expect(easyDeck.botInstruments.length).toBe(8);
    for (const char of easyDeck.botCharacters) {
      expect(char.baseAttack).toBeLessThanOrEqual(1100);
      expect(char.baseDefense).toBeLessThanOrEqual(1300);
      expect(char.baseAttack + char.baseDefense).toBeLessThanOrEqual(2300);
    }
    for (const inst of easyDeck.botInstruments) {
      expect(inst.attackMod).toBeLessThanOrEqual(200);
      expect(inst.defenseMod).toBeLessThanOrEqual(250);
      expect(inst.ignoreDefenseAmount).toBeLessThanOrEqual(100);
    }

    // MEDIUM: balanced mid-tier
    const medDeck = buildBotDeckByDifficulty(allCards, "MEDIUM");
    expect(medDeck.botCharacters.length).toBe(10);
    expect(medDeck.botInstruments.length).toBe(8);

    // HARD: elite commanders and high-power instruments
    const hardDeck = buildBotDeckByDifficulty(allCards, "HARD");
    expect(hardDeck.botCharacters.length).toBe(10);
    expect(hardDeck.botInstruments.length).toBe(8);
    for (const char of hardDeck.botCharacters) {
      expect(char.baseAttack + char.baseDefense).toBeGreaterThanOrEqual(2300);
    }
  });

  it("ensures BotAiService on EASY provides a forgiving, beginner-friendly experience", () => {
    const easyState = BattleEngine.createInitialState({
      playerDeckName: "Beginner Match",
      botDifficulty: "EASY",
      playerCharacters,
      playerInstruments,
      botCharacters,
      botInstruments,
      shuffle: false,
    });

    // 1. EASY Bot does not pop pre-attack instruments
    const preAttackInst = BotAiService.choosePreAttackInstrument(easyState);
    expect(preAttackInst).toBeNull();

    // 2. EASY Bot attacks directly along lane (first attacker vs opposing or first target)
    const attackDecl = BotAiService.chooseAttackDeclaration(easyState);
    expect(attackDecl).toEqual({
      attackerFrontIndex: 0,
      defenderFrontIndex: 0,
    });

    // 3. EASY Bot does not interrupt player attacks with defensive reactions
    const pendingState = {
      ...easyState,
      pendingAttack: {
        attackerSide: "PLAYER" as const,
        attackerFrontIndex: 0,
        defenderFrontIndex: 0,
      },
    };
    const defResponse = BotAiService.chooseDefensiveInstrument(pendingState);
    expect(defResponse).toBeNull();

    // 4. EASY Bot promotes first available slot naturally
    const promoIdx = BotAiService.chooseSecondRowPromotionIndex(easyState);
    expect(promoIdx).toBe(0);
  });

  it("supports manual hand instrument discard and player surrender (PRD 8.1 & 8.4)", () => {
    let state = BattleEngine.createInitialState({
      playerDeckName: "Majapahit Test",
      botDifficulty: "MEDIUM",
      playerCharacters,
      playerInstruments,
      botCharacters,
      botInstruments,
      shuffle: false,
    });
    const firstHandId = state.playerInstrumentHand[0]!.instanceId;
    state = BattleEngine.discardHandInstrument(state, "PLAYER", firstHandId);
    expect(state.playerInstrumentHand.length).toBe(2);
    expect(state.playerInstrumentDiscard.length).toBe(1);

    state = BattleEngine.surrenderMatch(state, "PLAYER");
    expect(state.winner).toBe("BOT");
    expect(state.phase).toBe("MATCH_OVER");
  });
});
