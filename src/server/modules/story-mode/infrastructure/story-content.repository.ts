import "server-only";
import { createHash } from "node:crypto";
import { randomUUID } from "node:crypto";
import { Prisma, type Prisma as PrismaNamespace } from "@prisma/client";
import type { StoryCampaign } from "../domain/story-catalog";
import { AMUKTI_PALAPA_SOUNDTRACK_URL, DEFAULT_STORY_CAMPAIGNS, DEFAULT_STORY_CONTENT_VERSION, ensureStoryCampaignTroopCompositions, getStorySceneBackground, LEGACY_STORY_SOUNDTRACK_URL } from "../domain/story-campaigns";
import { isPrismaDriverEnabled, prisma } from "@/server/shared/db/prisma";
import { AppError } from "@/server/shared/errors/app-error";
import { cardRepository } from "@/server/modules/card/infrastructure/card.repository.impl";

const MAX_ASSET_BYTES = 12 * 1024 * 1024;
const ALLOWED_ASSET_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "audio/mpeg", "audio/ogg", "audio/wav"]);

export interface AdminStoryCampaignRecord {
  campaign: StoryCampaign;
  publishedCampaign: StoryCampaign;
  published: boolean;
  version: number;
  hasDraft: boolean;
  updatedAt: string | null;
}

function toInputJson(value: StoryCampaign): PrismaNamespace.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function campaignFromContent(content: Prisma.JsonValue): StoryCampaign {
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    throw AppError.internal("Konten kampanye cerita di database tidak valid.");
  }
  const data = content as unknown as StoryCampaign;
  if ((data.kingdom !== "MAJAPAHIT" && data.kingdom !== "PAJAJARAN") || !Array.isArray(data.missions)) {
    throw AppError.internal("Konten kampanye cerita di database tidak valid.");
  }
  return data;
}

function ensureStorySoundtracks(campaign: StoryCampaign): StoryCampaign {
  let changed = false;
  const defaultMissions = DEFAULT_STORY_CAMPAIGNS.find((item) => item.kingdom === campaign.kingdom)?.missions ?? [];
  const defaultSoundtracks = new Map(defaultMissions.map((mission) => [mission.id, mission.soundtrackUrl]));
  const missions = campaign.missions.map((mission) => {
    if (mission.soundtrackAssetId) return mission;
    const defaultSoundtrackUrl = defaultSoundtracks.get(mission.id);
    const soundtrackUrl = mission.id === "majapahit-amukti-palapa"
      ? AMUKTI_PALAPA_SOUNDTRACK_URL
      : !mission.soundtrackUrl || mission.soundtrackUrl === LEGACY_STORY_SOUNDTRACK_URL
        ? defaultSoundtrackUrl
        : mission.soundtrackUrl;
    if (mission.soundtrackUrl === soundtrackUrl) return mission;
    changed = true;
    return { ...mission, soundtrackUrl };
  });
  return changed ? { ...campaign, missions } : campaign;
}

function mergeTextTranslations<T extends { translations?: object }>(
  content: T,
  defaults: T | undefined,
): T {
  if (!defaults?.translations) return content;
  const defaultTranslations = defaults.translations as Record<string, unknown>;
  const currentTranslations = content.translations as Record<string, unknown> | undefined;
  const translations = { ...defaultTranslations, ...currentTranslations };
  for (const [field, value] of Object.entries(defaultTranslations)) {
    const currentValue = currentTranslations?.[field];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      translations[field] = { ...value, ...(currentValue && typeof currentValue === "object" ? currentValue : {}) };
    }
  }
  return { ...content, translations };
}

function ensureStoryTranslations(campaign: StoryCampaign): StoryCampaign {
  const defaultCampaign = DEFAULT_STORY_CAMPAIGNS.find((item) => item.kingdom === campaign.kingdom);
  if (!defaultCampaign) return campaign;
  const defaultMissions = new Map(defaultCampaign.missions.map((mission) => [mission.id, mission]));
  let changed = false;
  const missions = campaign.missions.map((mission) => {
    const defaultMission = defaultMissions.get(mission.id);
    if (!defaultMission) return mission;
    let missionChanged = false;
    const dialogue = mission.dialogue.map((line, index) => {
      const defaults = defaultMission.dialogue[index];
      const translated = mergeTextTranslations(line, defaults);
      if (translated !== line && JSON.stringify(translated.translations) !== JSON.stringify(line.translations)) missionChanged = true;
      return translated;
    });
    const defaultChoices = new Map(defaultMission.choices.map((choice) => [choice.id, choice]));
    const choices = mission.choices.map((choice) => {
      const translated = mergeTextTranslations(choice, defaultChoices.get(choice.id));
      if (translated !== choice && JSON.stringify(translated.translations) !== JSON.stringify(choice.translations)) missionChanged = true;
      return translated;
    });
    const withMissionTranslations = mergeTextTranslations(mission, defaultMission);
    if (JSON.stringify(withMissionTranslations.translations) !== JSON.stringify(mission.translations)) missionChanged = true;
    if (!missionChanged) return mission;
    changed = true;
    return { ...withMissionTranslations, dialogue, choices };
  });
  const updated = mergeTextTranslations({ ...campaign, missions }, defaultCampaign);
  if (JSON.stringify(updated.translations) !== JSON.stringify(campaign.translations)) changed = true;
  return changed ? updated : campaign;
}

const LEGACY_SCENE_BACKGROUNDS = new Set([
  "/story-mode/scenes/nusantara-sea.webp",
  "/story-mode/scenes/trowulan-hall.webp",
  "/story-mode/scenes/pakuan-border.webp",
  "/story-mode/scenes/pakuan-archive.webp",
  "/story-mode/scenes/pakuan-hall.webp",
]);

function ensureStorySceneBackgrounds(campaign: StoryCampaign): StoryCampaign {
  let changed = false;
  const missions = campaign.missions.map((mission) => {
    let missionChanged = false;
    const dialogue = mission.dialogue.map((line) => {
      const expectedBackground = getStorySceneBackground(line.location);
      const hasStoryMediaAsset = Boolean(line.backgroundAssetId);
      const usesLegacyBackground = !line.backgroundUrl || LEGACY_SCENE_BACKGROUNDS.has(line.backgroundUrl);
      if (!expectedBackground || hasStoryMediaAsset || !usesLegacyBackground || line.backgroundUrl === expectedBackground) return line;
      missionChanged = true;
      return { ...line, backgroundUrl: expectedBackground };
    });
    if (!missionChanged) return mission;
    changed = true;
    return { ...mission, dialogue };
  });
  return changed ? { ...campaign, missions } : campaign;
}

export async function listStoryCampaignContent(includeUnpublished = false): Promise<StoryCampaign[]> {
  if (!isPrismaDriverEnabled()) return [...DEFAULT_STORY_CAMPAIGNS];
  let rows = await prisma.storyCampaignContent.findMany({ orderBy: { kingdom: "asc" } });
  if (rows.length === 0) {
    await prisma.storyCampaignContent.createMany({
      data: DEFAULT_STORY_CAMPAIGNS.map((campaign) => ({
        kingdom: campaign.kingdom,
        content: toInputJson(campaign),
        defaultContentVersion: DEFAULT_STORY_CONTENT_VERSION,
      })),
      skipDuplicates: true,
    });
    rows = await prisma.storyCampaignContent.findMany({ orderBy: { kingdom: "asc" } });
  }

  const existingKingdoms = new Set(rows.map((row) => row.kingdom));
  const missingCampaigns = DEFAULT_STORY_CAMPAIGNS.filter((campaign) => !existingKingdoms.has(campaign.kingdom));
  if (missingCampaigns.length > 0) {
    await prisma.storyCampaignContent.createMany({
      data: missingCampaigns.map((campaign) => ({
        kingdom: campaign.kingdom,
        content: toInputJson(campaign),
        defaultContentVersion: DEFAULT_STORY_CONTENT_VERSION,
      })),
      skipDuplicates: true,
    });
  }

  const staleUnedited = DEFAULT_STORY_CAMPAIGNS.filter((campaign) => {
    const row = rows.find((item) => item.kingdom === campaign.kingdom);
    return row && row.updatedById === null && row.defaultContentVersion < DEFAULT_STORY_CONTENT_VERSION;
  });
  for (const campaign of staleUnedited) {
    await prisma.storyCampaignContent.updateMany({
      where: {
        kingdom: campaign.kingdom,
        updatedById: null,
        defaultContentVersion: { lt: DEFAULT_STORY_CONTENT_VERSION },
      },
      data: {
        content: toInputJson(campaign),
        defaultContentVersion: DEFAULT_STORY_CONTENT_VERSION,
        version: { increment: 1 },
      },
    });
  }

  if (missingCampaigns.length > 0 || staleUnedited.length > 0) {
    rows = await prisma.storyCampaignContent.findMany({ orderBy: { kingdom: "asc" } });
  }

  let contentPatched = false;
  for (const row of rows) {
    const campaign = campaignFromContent(row.content);
    const updated = ensureStoryTranslations(
      ensureStoryCampaignTroopCompositions(ensureStorySceneBackgrounds(ensureStorySoundtracks(campaign))),
    );
    if (updated !== campaign) {
      await prisma.storyCampaignContent.updateMany({
        where: { id: row.id, version: row.version },
        data: { content: toInputJson(updated), version: { increment: 1 } },
      });
      contentPatched = true;
    }
  }
  if (contentPatched) rows = await prisma.storyCampaignContent.findMany({ orderBy: { kingdom: "asc" } });
  return rows.filter((row) => includeUnpublished || row.published).map((row) => campaignFromContent(row.content));
}

export async function listAdminStoryCampaignContent(): Promise<AdminStoryCampaignRecord[]> {
  if (!isPrismaDriverEnabled()) {
    return DEFAULT_STORY_CAMPAIGNS.map((campaign) => ({ campaign, publishedCampaign: campaign, published: true, version: 0, hasDraft: false, updatedAt: null }));
  }
  await listStoryCampaignContent(true);
  const rows = await prisma.storyCampaignContent.findMany({ orderBy: { kingdom: "asc" } });
  return rows.map((row) => ({
    campaign: campaignFromContent(row.draftContent ?? row.content),
    publishedCampaign: campaignFromContent(row.content),
    published: row.published,
    version: row.version,
    hasDraft: row.draftContent !== null,
    updatedAt: row.updatedAt.toISOString(),
  }));
}

function toAdminStoryCampaignRecord(row: {
  content: Prisma.JsonValue;
  draftContent: Prisma.JsonValue | null;
  published: boolean;
  version: number;
  updatedAt: Date;
}): AdminStoryCampaignRecord {
  return {
    campaign: campaignFromContent(row.draftContent ?? row.content),
    publishedCampaign: campaignFromContent(row.content),
    published: row.published,
    version: row.version,
    hasDraft: row.draftContent !== null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function saveStoryCampaignContent(
  campaign: StoryCampaign,
  actorId: string,
  expectedVersion: number,
): Promise<AdminStoryCampaignRecord> {
  if (!isPrismaDriverEnabled()) throw AppError.internal("Story CMS memerlukan database PostgreSQL.");
  const cards = await cardRepository.findMany({ includeWithdrawn: false });
  const cardBySlug = new Map(cards.map((card) => [card.slug, card]));
  const referencedAssets = new Map<string, Set<"image" | "audio">>();
  const referenceAsset = (id: string, type: "image" | "audio"): void => {
    const types = referencedAssets.get(id) ?? new Set<"image" | "audio">();
    types.add(type);
    referencedAssets.set(id, types);
  };
  for (const mission of campaign.missions) {
    if (mission.soundtrackAssetId) referenceAsset(mission.soundtrackAssetId, "audio");
    for (const slug of mission.storyDeck.characterSlugs) {
      const card = cardBySlug.get(slug);
      if (!card || card.cardType !== "CHARACTER" || card.kingdom !== campaign.kingdom) {
        throw AppError.validation(`Story Deck ${mission.id} hanya boleh memakai karakter aktif dari kerajaan kampanye.`);
      }
    }
    for (const slug of mission.storyDeck.instrumentSlugs) {
      if (cardBySlug.get(slug)?.cardType !== "INSTRUMENT") throw AppError.validation(`Instrumen '${slug}' tidak aktif atau tidak ditemukan.`);
    }
    for (const slug of mission.opponentDeck?.characterSlugs ?? []) {
      const card = cardBySlug.get(slug);
      if (!card || card.cardType !== "CHARACTER") throw AppError.validation(`Karakter lawan '${slug}' tidak aktif atau tidak ditemukan.`);
    }
    for (const slug of mission.opponentDeck?.instrumentSlugs ?? []) {
      if (cardBySlug.get(slug)?.cardType !== "INSTRUMENT") throw AppError.validation(`Instrumen lawan '${slug}' tidak aktif atau tidak ditemukan.`);
    }
    for (const scene of mission.dialogue) {
      if (scene.characterCardSlug) {
        const card = cardBySlug.get(scene.characterCardSlug);
        if (!card || card.cardType !== "CHARACTER" || card.kingdom !== campaign.kingdom) {
          throw AppError.validation(`Tokoh adegan '${scene.speaker}' harus memakai kartu kerajaan kampanye.`);
        }
      }
      if (scene.backgroundAssetId) referenceAsset(scene.backgroundAssetId, "image");
      if (scene.soundEffectAssetId) referenceAsset(scene.soundEffectAssetId, "audio");
    }
  }
  if (referencedAssets.size > 0) {
    const foundAssets = await prisma.storyMediaAsset.findMany({
      where: { id: { in: [...referencedAssets.keys()] } },
      select: { id: true, mimeType: true },
    });
    if (foundAssets.length !== referencedAssets.size) throw AppError.validation("Salah satu aset cerita tidak ditemukan di library.");
    const invalidAsset = foundAssets.find((asset) => {
      const expectedTypes = referencedAssets.get(asset.id);
      return !expectedTypes?.has(asset.mimeType.startsWith("image/") ? "image" : "audio") || expectedTypes.size > 1;
    });
    if (invalidAsset) throw AppError.validation("Gunakan aset gambar untuk latar dan aset audio untuk musik atau efek suara.");
  }
  const existing = await prisma.storyCampaignContent.findUnique({ where: { kingdom: campaign.kingdom } });
  if (!existing) {
    if (expectedVersion !== 0) throw AppError.conflict("Kampanye berubah sejak terakhir dimuat. Muat ulang sebelum menyimpan.");
    try {
      const created = await prisma.storyCampaignContent.create({
        data: {
          kingdom: campaign.kingdom,
          content: toInputJson(campaign),
          draftContent: toInputJson(campaign),
          published: false,
          updatedById: actorId,
          version: 1,
        },
      });
      return toAdminStoryCampaignRecord(created);
    } catch (cause) {
      if (cause instanceof Prisma.PrismaClientKnownRequestError && cause.code === "P2002") {
        throw AppError.conflict("Kampanye baru saja dibuat admin lain. Muat ulang sebelum menyimpan.");
      }
      throw cause;
    }
  }

  if (existing.version !== expectedVersion) throw AppError.conflict("Kampanye berubah sejak terakhir dimuat. Muat ulang sebelum menyimpan.");
  const updated = await prisma.storyCampaignContent.updateMany({
    where: { id: existing.id, version: expectedVersion },
    data: { draftContent: toInputJson(campaign), updatedById: actorId, version: { increment: 1 } },
  });
  if (updated.count !== 1) throw AppError.conflict("Kampanye berubah saat Anda menyimpan. Muat ulang dan gabungkan perubahan terbaru.");
  const saved = await prisma.storyCampaignContent.findUnique({ where: { id: existing.id } });
  if (!saved) throw AppError.internal("Kampanye yang baru disimpan tidak ditemukan.");
  return toAdminStoryCampaignRecord(saved);
}

export async function updateStoryCampaignPublication(
  kingdom: "MAJAPAHIT" | "PAJAJARAN",
  action: "PUBLISH" | "UNPUBLISH",
  actorId: string,
  expectedVersion: number,
): Promise<AdminStoryCampaignRecord> {
  if (!isPrismaDriverEnabled()) throw AppError.internal("Story CMS memerlukan database PostgreSQL.");
  const existing = await prisma.storyCampaignContent.findUnique({ where: { kingdom } });
  if (!existing) throw AppError.notFound("Kampanye cerita tidak ditemukan.");
  if (existing.version !== expectedVersion) throw AppError.conflict("Kampanye berubah sejak terakhir dimuat. Muat ulang sebelum mengubah publikasi.");

  const updated = await prisma.storyCampaignContent.updateMany({
    where: { id: existing.id, version: expectedVersion },
    data: action === "PUBLISH"
      ? {
          content: toInputJson(campaignFromContent(existing.draftContent ?? existing.content)),
          draftContent: Prisma.DbNull,
          published: true,
          updatedById: actorId,
          version: { increment: 1 },
        }
      : { published: false, updatedById: actorId, version: { increment: 1 } },
  });
  if (updated.count !== 1) throw AppError.conflict("Kampanye berubah saat status publikasi diperbarui. Muat ulang dulu.");
  const saved = await prisma.storyCampaignContent.findUnique({ where: { id: existing.id } });
  if (!saved) throw AppError.internal("Kampanye yang baru diperbarui tidak ditemukan.");
  return toAdminStoryCampaignRecord(saved);
}

export async function listStoryMediaAssets() {
  if (!isPrismaDriverEnabled()) return [];
  return prisma.storyMediaAsset.findMany({
    select: { id: true, sha256: true, fileName: true, mimeType: true, byteSize: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function uploadStoryMediaAsset(input: {
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
  actorId: string;
}) {
  if (!isPrismaDriverEnabled()) throw AppError.internal("Story media memerlukan database PostgreSQL.");
  if (!ALLOWED_ASSET_TYPES.has(input.mimeType)) throw AppError.validation("Tipe file tidak didukung.");
  if (input.bytes.byteLength === 0 || input.bytes.byteLength > MAX_ASSET_BYTES) {
    throw AppError.validation("Ukuran file harus di antara 1 byte dan 12 MB.");
  }
  const sha256 = createHash("sha256").update(input.bytes).digest("hex");
  const existing = await prisma.storyMediaAsset.findUnique({ where: { sha256 } });
  if (existing) return { id: existing.id, fileName: existing.fileName, mimeType: existing.mimeType, byteSize: existing.byteSize, reused: true };
  const id = randomUUID();
  let created: { id: string; fileName: string; mimeType: string; byteSize: number };
  try {
    created = await prisma.storyMediaAsset.create({
      data: { id, sha256, fileName: input.fileName.slice(0, 180), mimeType: input.mimeType, byteSize: input.bytes.byteLength, fileBytes: Buffer.from(input.bytes), uploadedById: input.actorId },
      select: { id: true, fileName: true, mimeType: true, byteSize: true },
    });
  } catch (cause) {
    if (!(cause instanceof Prisma.PrismaClientKnownRequestError) || cause.code !== "P2002") throw cause;
    const duplicate = await prisma.storyMediaAsset.findUnique({ where: { sha256 }, select: { id: true, fileName: true, mimeType: true, byteSize: true } });
    if (!duplicate) throw cause;
    return { ...duplicate, reused: true };
  }
  return { ...created, reused: false };
}

export async function readStoryMediaAsset(id: string) {
  if (!isPrismaDriverEnabled()) return null;
  return prisma.storyMediaAsset.findUnique({ where: { id }, select: { fileName: true, mimeType: true, fileBytes: true } });
}
