import { STORY_CAMPAIGNS } from "./story-campaigns";

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

export interface StoryChoice {
  id: string;
  label: string;
  consequence: string;
  translations?: StoryChoiceTranslations;
}

export interface StoryDialogueLine {
  speaker: string;
  text: string;
  location?: string;
  characterCardSlug?: string | null;
  backgroundUrl?: string | null;
  backgroundAssetId?: string | null;
  soundEffectAssetId?: string | null;
  translations?: StoryDialogueTranslations;
}

export interface StoryDeck {
  characterSlugs: string[];
  instrumentSlugs: string[];
}

export interface StoryOpponentDeck {
  characterSlugs: string[];
  instrumentSlugs: string[];
}

export interface StoryMission {
  id: string;
  title: string;
  chapter: number;
  kind: "STORY" | "BATTLE" | "FINAL_BOSS";
  intro: string;
  historicalNote?: string;
  soundtrackUrl?: string;
  soundtrackAssetId?: string | null;
  dialogue: readonly StoryDialogueLine[];
  choiceAfterSceneIndex: number | null;
  storyDeck: StoryDeck;
  opponentDeck?: StoryOpponentDeck;
  objective: string;
  opponentTitle: string;
  choices: readonly StoryChoice[];
  replayPointBase: number;
  endingTitle?: string;
  ending: string;
  translations?: StoryMissionTranslations;
}

export interface StoryCampaign {
  kingdom: "MAJAPAHIT" | "PAJAJARAN";
  title: string;
  subtitle: string;
  accent: string;
  missions: readonly StoryMission[];
  translations?: StoryCampaignTranslations;
}

export { STORY_CAMPAIGNS };

export function getStoryCampaign(kingdom: string): StoryCampaign | null {
  return STORY_CAMPAIGNS.find((campaign) => campaign.kingdom === kingdom) ?? null;
}

export function getStoryMission(kingdom: string, missionId: string): StoryMission | null {
  return getStoryCampaign(kingdom)?.missions.find((mission) => mission.id === missionId) ?? null;
}
