export type StoryKingdomEntity = "MAJAPAHIT" | "PAJAJARAN";

export type StoryTextTranslations = Partial<Record<"id" | "en" | "zh", string>>;

export interface StoryChoiceTranslations {
  label?: StoryTextTranslations;
  consequence?: StoryTextTranslations;
}

export interface StoryDialogueTranslations {
  speaker?: StoryTextTranslations;
  text?: StoryTextTranslations;
  location?: StoryTextTranslations;
}

export interface StoryMissionTranslations {
  title?: StoryTextTranslations;
  intro?: StoryTextTranslations;
  objective?: StoryTextTranslations;
  opponentTitle?: StoryTextTranslations;
  endingTitle?: StoryTextTranslations;
  ending?: StoryTextTranslations;
}

export interface StoryCampaignTranslations {
  title?: StoryTextTranslations;
  subtitle?: StoryTextTranslations;
}

export interface StoryChoiceEntity {
  id: string;
  label: string;
  consequence: string;
  translations?: StoryChoiceTranslations;
}

export interface StoryDialogueLineEntity {
  speaker: string;
  text: string;
  location?: string;
  characterCardSlug?: string | null;
  backgroundUrl?: string | null;
  backgroundAssetId?: string | null;
  soundEffectAssetId?: string | null;
  translations?: StoryDialogueTranslations;
}

export interface StoryDeckEntity {
  characterSlugs: string[];
  instrumentSlugs: string[];
}

export interface StoryMissionEntity {
  id: string;
  title: string;
  chapter: number;
  kind: "STORY" | "BATTLE" | "FINAL_BOSS";
  intro: string;
  historicalNote?: string;
  soundtrackUrl?: string;
  soundtrackAssetId?: string | null;
  dialogue: StoryDialogueLineEntity[];
  choiceAfterSceneIndex: number | null;
  storyDeck: StoryDeckEntity;
  opponentDeck?: StoryDeckEntity;
  objective: string;
  opponentTitle: string;
  choices: StoryChoiceEntity[];
  replayPointBase: number;
  endingTitle?: string;
  ending: string;
  completed: boolean;
  unlocked: boolean;
  replayCount: number;
  previousChoice: string | null;
  translations?: StoryMissionTranslations;
}

export interface StoryProgressEntity {
  kingdom: StoryKingdomEntity;
  completedMissionIds: string[];
  replayCounts: Record<string, number>;
  choices: Record<string, string>;
  endingSeen: boolean;
  isComplete: boolean;
}

export interface StoryCampaignEntity {
  kingdom: StoryKingdomEntity;
  title: string;
  subtitle: string;
  accent: string;
  progress: StoryProgressEntity;
  missions: StoryMissionEntity[];
  translations?: StoryCampaignTranslations;
}

export type StoryMissionContentEntity = Omit<StoryMissionEntity, "completed" | "unlocked" | "replayCount" | "previousChoice">;
export type StoryCampaignContentEntity = Omit<StoryCampaignEntity, "progress" | "missions"> & { missions: StoryMissionContentEntity[] };

export interface AdminStoryCampaignEntity {
  campaign: StoryCampaignContentEntity;
  publishedCampaign: StoryCampaignContentEntity;
  published: boolean;
  version: number;
  hasDraft: boolean;
  updatedAt: string | null;
}

export type AdminStoryCampaignActionEntity = "PUBLISH" | "UNPUBLISH";

export interface StoryMediaAssetEntity {
  id: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
  sha256?: string;
  createdAt?: string;
  reused?: boolean;
}

export interface StartStoryMissionInputEntity {
  kingdom: StoryKingdomEntity;
  missionId: string;
  choiceId: string | null;
  deckId: string;
  idempotencyKey: string;
}

export interface StartedStoryBattleEntity {
  battleSessionId: string;
}

export interface CompleteStoryMissionEntity {
  battleSessionId: string;
}

export interface StoryMissionRewardEntity {
  nusaPoints: number;
  rewardCard: { slug: string; name: string; imagePath: string } | null;
  alreadyClaimed: boolean;
}
