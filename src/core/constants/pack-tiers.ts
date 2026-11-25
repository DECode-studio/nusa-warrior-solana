import { ALL_CARDS_CATALOG } from "./cards-catalog";

export const HIGH_END_MAJAPAHIT_SLUGS: readonly string[] = [
  "gajah-mada",
  "ranggalawe",
  "lembu-sora",
  "wikramawardhana",
  "suhita",
  "kemanak",
  "gong-ageng",
];

export const HIGH_END_PAJAJARAN_SLUGS: readonly string[] = [
  "sri-baduga-maharaja",
  "surawisesa",
  "niskala-wastu-kancana",
  "prabu-maharaja-linggabuana",
  "susuktunggal",
  "dewa-niskala",
  "ragamulya",
  "nilakendra",
  "goong-renteng",
  "angklung-buhun",
  "jentreng",
  "tarawangsa",
];

export const HIGH_END_INSTRUMENT_SLUGS: readonly string[] = [
  "tuwung",
  "celempung",
  "angklung-buhun",
  "jentreng",
  "kemanak",
  "suling-sunda",
  "cempres",
  "goong-renteng",
  "gong-ageng",
];

export const ALL_HIGH_END_SLUGS: ReadonlySet<string> = new Set<string>([
  ...HIGH_END_MAJAPAHIT_SLUGS,
  ...HIGH_END_PAJAJARAN_SLUGS,
  ...HIGH_END_INSTRUMENT_SLUGS,
]);

export function isCardHighEnd(slug: string): boolean {
  return ALL_HIGH_END_SLUGS.has(slug);
}

export const STARTER_PACK_LOW_END_SLUGS: readonly string[] = [
  // 8 Karakter Low-End (4 Majapahit + 4 Pajajaran)
  "jayanegara",
  "raden-wijaya",
  "mpu-prapanca",
  "mpu-tantular",
  "nyi-subang-larang",
  "bujangga-manik",
  "dyah-pitaloka",
  "ratu-dewata",
  // 12 Instrumen Low-End
  "padahi",
  "regang",
  "kendang",
  "bonang",
  "gambang",
  "kenong",
  "demung",
  "peking",
  "calung",
  "terebang",
  "kecrek",
  "karinding",
];

/**
 * Melakukan simulasi gacha roll 5 kartu untuk Booster Pack:
 * - Slot 1: Wajib kartu High-End (Guaranteed)
 * - Slot 2-5: 4 Kartu acak dari pool kartu pack tersebut
 */
export function rollBoosterPackCards(packCode: string): string[] {
  let highEndPool: readonly string[] = [];
  let generalPool: readonly string[] = [];

  if (packCode.includes("MAJAPAHIT")) {
    highEndPool = HIGH_END_MAJAPAHIT_SLUGS;
    generalPool = ALL_CARDS_CATALOG.filter(
      (c) =>
        c.kingdom === "MAJAPAHIT" ||
        (c.cardType === "INSTRUMENT" && c.kingdom !== "PAJAJARAN")
    ).map((c) => c.slug);
  } else if (packCode.includes("PAJAJARAN")) {
    highEndPool = HIGH_END_PAJAJARAN_SLUGS;
    generalPool = ALL_CARDS_CATALOG.filter(
      (c) =>
        c.kingdom === "PAJAJARAN" ||
        (c.cardType === "INSTRUMENT" && c.kingdom !== "MAJAPAHIT")
    ).map((c) => c.slug);
  } else if (packCode.includes("INSTRUMENT")) {
    highEndPool = HIGH_END_INSTRUMENT_SLUGS;
    generalPool = ALL_CARDS_CATALOG.filter(
      (c) => c.cardType === "INSTRUMENT"
    ).map((c) => c.slug);
  } else {
    // Default fallback (Starter pack / general)
    return [...STARTER_PACK_LOW_END_SLUGS];
  }

  const drawn: string[] = [];

  // Slot 1: Guaranteed High-End
  const guaranteedHigh =
    highEndPool[Math.floor(Math.random() * highEndPool.length)];
  if (guaranteedHigh) {
    drawn.push(guaranteedHigh);
  }

  // Slot 2-5: 4 Random cards from general pool
  const remainingSlots = 4;
  for (let i = 0; i < remainingSlots; i++) {
    const randomCard =
      generalPool[Math.floor(Math.random() * generalPool.length)];
    if (randomCard) {
      drawn.push(randomCard);
    }
  }

  return drawn;
}

