import type {
  CompleteStoryMissionEntity,
  StartedStoryBattleEntity,
  StartStoryMissionInputEntity,
  StoryCampaignEntity,
  StoryMissionRewardEntity,
  StoryCampaignContentEntity,
  StoryMediaAssetEntity,
  AdminStoryCampaignEntity,
  AdminStoryCampaignActionEntity,
} from "../entity/story_mode_entity";

export interface StoryModeRepository {
  getCampaigns(): Promise<StoryCampaignEntity[]>;
  startMission(input: StartStoryMissionInputEntity): Promise<StartedStoryBattleEntity>;
  completeMission(input: CompleteStoryMissionEntity): Promise<StoryMissionRewardEntity>;
  getAdminCampaigns(): Promise<AdminStoryCampaignEntity[]>;
  saveAdminCampaign(campaign: StoryCampaignContentEntity, expectedVersion: number): Promise<AdminStoryCampaignEntity>;
  updateAdminCampaignPublication(kingdom: "MAJAPAHIT" | "PAJAJARAN", action: AdminStoryCampaignActionEntity, expectedVersion: number): Promise<AdminStoryCampaignEntity>;
  getAdminAssets(): Promise<StoryMediaAssetEntity[]>;
  uploadAdminAsset(file: File): Promise<StoryMediaAssetEntity>;
}
