import "server-only";
import { z } from "zod";
import { AppError } from "@/server/shared/errors/app-error";
import { listAdminStoryCampaignContent, saveStoryCampaignContent, updateStoryCampaignPublication } from "../infrastructure/story-content.repository";

const translatedTextSchema = z.object({ id: z.string().max(8000).optional(), en: z.string().max(8000).optional(), zh: z.string().max(8000).optional() }).strict();
const choiceTranslationsSchema = z.object({ label: translatedTextSchema.optional(), consequence: translatedTextSchema.optional() }).strict();
const dialogueTranslationsSchema = z.object({ speaker: translatedTextSchema.optional(), text: translatedTextSchema.optional(), location: translatedTextSchema.optional() }).strict();
const missionTranslationsSchema = z.object({ title: translatedTextSchema.optional(), intro: translatedTextSchema.optional(), objective: translatedTextSchema.optional(), opponentTitle: translatedTextSchema.optional(), endingTitle: translatedTextSchema.optional(), ending: translatedTextSchema.optional() }).strict();
const campaignTranslationsSchema = z.object({ title: translatedTextSchema.optional(), subtitle: translatedTextSchema.optional() }).strict();
const choiceSchema = z.object({ id: z.string().min(1).max(80), label: z.string().min(1).max(500), consequence: z.string().min(1).max(2000), translations: choiceTranslationsSchema.optional() }).strict();
const dialogueSchema = z.object({
  speaker: z.string().min(1).max(120), text: z.string().min(1).max(4000),
  location: z.string().max(200).optional(), characterCardSlug: z.string().nullable().optional(),
  backgroundUrl: z.string().regex(/^\/story-mode\/scenes\/[a-z0-9-]+\.webp$/).nullable().optional(),
  backgroundAssetId: z.string().nullable().optional(), soundEffectAssetId: z.string().nullable().optional(),
  translations: dialogueTranslationsSchema.optional(),
}).strict().superRefine((scene, context) => {
  if (scene.backgroundAssetId && scene.backgroundUrl) {
    context.addIssue({ code: "custom", path: ["backgroundAssetId"], message: "Choose either a library background asset or a public background." });
  }
});
const missionSchema = z.object({
  id: z.string().min(1).max(100), title: z.string().min(1).max(200), chapter: z.number().int().positive(),
  kind: z.enum(["STORY", "BATTLE", "FINAL_BOSS"]), intro: z.string().min(1).max(8000),
  historicalNote: z.string().max(3000).optional(),
  soundtrackUrl: z.string().regex(/^\/story-mode\/audio\/[a-z0-9-]+\.(?:mp3|wav)$/).optional(),
  soundtrackAssetId: z.string().nullable().optional(),
  dialogue: z.array(dialogueSchema).min(1).max(80),
  choiceAfterSceneIndex: z.number().int().nonnegative().nullable(),
  storyDeck: z.object({ characterSlugs: z.array(z.string().min(1)).min(1).max(10), instrumentSlugs: z.array(z.string().min(1)).max(10) }).strict(),
  opponentDeck: z.object({ characterSlugs: z.array(z.string().min(1)).min(1).max(10), instrumentSlugs: z.array(z.string().min(1)).max(10) }).strict().optional(),
  objective: z.string().min(1).max(1000), opponentTitle: z.string().min(1).max(200), choices: z.array(choiceSchema).max(8),
  replayPointBase: z.number().int().positive().max(10000), endingTitle: z.string().max(200).optional(), ending: z.string().min(1).max(8000),
  translations: missionTranslationsSchema.optional(),
}).strict().superRefine((mission, context) => {
  if (mission.soundtrackAssetId && mission.soundtrackUrl) {
    context.addIssue({ code: "custom", path: ["soundtrackAssetId"], message: "Choose either a library soundtrack asset or a public soundtrack." });
  }
});
export const storyCampaignContentSchema = z.object({
  kingdom: z.enum(["MAJAPAHIT", "PAJAJARAN"]), title: z.string().min(1).max(200), subtitle: z.string().min(1).max(1000),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/), missions: z.array(missionSchema).min(1).max(30), translations: campaignTranslationsSchema.optional(),
}).strict().superRefine((campaign, context) => {
  const missionIds = new Set<string>();
  for (const mission of campaign.missions) {
    if (missionIds.has(mission.id)) context.addIssue({ code: "custom", message: `Mission ID '${mission.id}' is duplicated.` });
    missionIds.add(mission.id);
    if (mission.choiceAfterSceneIndex !== null && mission.choiceAfterSceneIndex >= mission.dialogue.length) {
      context.addIssue({ code: "custom", message: `Choice scene index is outside '${mission.id}'.` });
    }
    if (mission.choices.length > 0 && mission.choiceAfterSceneIndex === null) {
      context.addIssue({ code: "custom", message: `Mission '${mission.id}' needs a decision scene.` });
    }
    const sceneIds = new Set<string>();
    for (const choice of mission.choices) {
      if (sceneIds.has(choice.id)) context.addIssue({ code: "custom", message: `Choice ID '${choice.id}' is duplicated in '${mission.id}'.` });
      sceneIds.add(choice.id);
    }
  }
});
export const saveStoryCampaignDraftSchema = z.object({
  campaign: storyCampaignContentSchema,
  expectedVersion: z.number().int().nonnegative(),
}).strict();
export const updateStoryCampaignPublicationSchema = z.object({
  kingdom: z.enum(["MAJAPAHIT", "PAJAJARAN"]),
  action: z.enum(["PUBLISH", "UNPUBLISH"]),
  expectedVersion: z.number().int().nonnegative(),
}).strict();

export async function getAdminStoryCampaignsUseCase() {
  return listAdminStoryCampaignContent();
}

export async function updateAdminStoryCampaignUseCase(input: unknown, actorId: string) {
  const parsed = saveStoryCampaignDraftSchema.safeParse(input);
  if (!parsed.success) {
    const details = Object.fromEntries(Object.entries(parsed.error.flatten().fieldErrors).filter((entry): entry is [string, string[]] => Array.isArray(entry[1])));
    throw AppError.validation("Konten kampanye tidak valid.", details);
  }
  return saveStoryCampaignContent(parsed.data.campaign, actorId, parsed.data.expectedVersion);
}

export async function updateAdminStoryCampaignPublicationUseCase(input: unknown, actorId: string) {
  const parsed = updateStoryCampaignPublicationSchema.safeParse(input);
  if (!parsed.success) {
    const details = Object.fromEntries(Object.entries(parsed.error.flatten().fieldErrors).filter((entry): entry is [string, string[]] => Array.isArray(entry[1])));
    throw AppError.validation("Status publikasi tidak valid.", details);
  }
  return updateStoryCampaignPublication(parsed.data.kingdom, parsed.data.action, actorId, parsed.data.expectedVersion);
}
