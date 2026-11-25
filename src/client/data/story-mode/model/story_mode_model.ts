export type StoryKingdomModel = "MAJAPAHIT" | "PAJAJARAN";

export interface StoryChoiceModel {
  readonly id: string;
  readonly label: string;
  readonly consequence: string;
  readonly translations?: import("@/client/domain/story-mode/entity/story_mode_entity").StoryChoiceTranslations;
}

export interface StoryDialogueLineModel {
  readonly speaker: string;
  readonly text: string;
  readonly location?: string;
  readonly characterCardSlug?: string | null;
  readonly backgroundUrl?: string | null;
  readonly backgroundAssetId?: string | null;
  readonly soundEffectAssetId?: string | null;
  readonly translations?: import("@/client/domain/story-mode/entity/story_mode_entity").StoryDialogueTranslations;
}

export interface StoryDeckModel {
  readonly characterSlugs: readonly string[];
  readonly instrumentSlugs: readonly string[];
}

export interface StoryMissionModel {
  readonly id: string;
  readonly title: string;
  readonly chapter: number;
  readonly kind: "STORY" | "BATTLE" | "FINAL_BOSS";
  readonly intro: string;
  readonly historicalNote?: string;
  readonly soundtrackUrl?: string;
  readonly soundtrackAssetId?: string | null;
  readonly dialogue: readonly StoryDialogueLineModel[];
  readonly choiceAfterSceneIndex: number | null;
  readonly storyDeck: StoryDeckModel;
  readonly objective: string;
  readonly opponentTitle: string;
  readonly choices: readonly StoryChoiceModel[];
  readonly replayPointBase: number;
  readonly endingTitle?: string;
  readonly ending: string;
  readonly completed: boolean;
  readonly unlocked: boolean;
  readonly replayCount: number;
  readonly previousChoice: string | null;
  readonly translations?: import("@/client/domain/story-mode/entity/story_mode_entity").StoryMissionTranslations;
}

export interface StoryProgressModel {
  readonly kingdom: StoryKingdomModel;
  readonly completedMissionIds: readonly string[];
  readonly replayCounts: Readonly<Record<string, number>>;
  readonly choices: Readonly<Record<string, string>>;
  readonly endingSeen: boolean;
  readonly isComplete: boolean;
}

export interface StoryCampaignModel {
  readonly kingdom: StoryKingdomModel;
  readonly title: string;
  readonly subtitle: string;
  readonly accent: string;
  readonly progress: StoryProgressModel;
  readonly missions: readonly StoryMissionModel[];
  readonly translations?: import("@/client/domain/story-mode/entity/story_mode_entity").StoryCampaignTranslations;
}

export type StoryCampaignContentModel = import("@/client/domain/story-mode/entity/story_mode_entity").StoryCampaignContentEntity;
export type AdminStoryCampaignModel = import("@/client/domain/story-mode/entity/story_mode_entity").AdminStoryCampaignEntity;
export type AdminStoryCampaignActionModel = import("@/client/domain/story-mode/entity/story_mode_entity").AdminStoryCampaignActionEntity;
export type StoryMediaAssetModel = import("@/client/domain/story-mode/entity/story_mode_entity").StoryMediaAssetEntity;

export interface StartStoryMissionInputModel {
  readonly kingdom: StoryKingdomModel;
  readonly missionId: string;
  readonly choiceId: string | null;
  readonly deckId: string;
  readonly idempotencyKey: string;
}

export interface StartStoryMissionResultModel {
  readonly battle: { readonly id: string };
}

export interface CompleteStoryMissionInputModel {
  readonly battleSessionId: string;
}

export interface CompleteStoryMissionResultModel {
  readonly nusaPoints: number;
  readonly rewardCard: { readonly slug: string; readonly name: string; readonly imagePath: string } | null;
  readonly alreadyClaimed: boolean;
}
