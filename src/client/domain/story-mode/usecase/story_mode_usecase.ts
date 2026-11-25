import { inject, injectable } from "@needle-di/core";
import { STORY_MODE_REPOSITORY_TOKEN } from "@/core/di/tokens";
import type {
  CompleteStoryMissionEntity,
  StoryCampaignEntity,
  StoryMissionRewardEntity,
  StartedStoryBattleEntity,
  StartStoryMissionInputEntity,
  AdminStoryCampaignEntity,
  AdminStoryCampaignActionEntity,
  StoryCampaignContentEntity,
} from "../entity/story_mode_entity";
import type { StoryModeRepository } from "../repository/story_mode_repository";
import type { StoryMediaAssetEntity } from "../entity/story_mode_entity";

@injectable()
export class StoryModeUseCase {
  constructor(
    private readonly storyModeRepository: StoryModeRepository = inject(STORY_MODE_REPOSITORY_TOKEN),
  ) {}

  public async getCampaigns(): Promise<StoryCampaignEntity[]> {
    return this.storyModeRepository.getCampaigns();
  }

  public async startMission(input: StartStoryMissionInputEntity): Promise<StartedStoryBattleEntity> {
    return this.storyModeRepository.startMission(input);
  }

  public async completeMission(input: CompleteStoryMissionEntity): Promise<StoryMissionRewardEntity> {
    return this.storyModeRepository.completeMission(input);
  }

  public async getAdminCampaigns(): Promise<AdminStoryCampaignEntity[]> {
    return this.storyModeRepository.getAdminCampaigns();
  }

  public async saveAdminCampaign(campaign: StoryCampaignContentEntity, expectedVersion: number): Promise<AdminStoryCampaignEntity> {
    return this.storyModeRepository.saveAdminCampaign(campaign, expectedVersion);
  }

  public async updateAdminCampaignPublication(
    kingdom: "MAJAPAHIT" | "PAJAJARAN",
    action: AdminStoryCampaignActionEntity,
    expectedVersion: number,
  ): Promise<AdminStoryCampaignEntity> {
    return this.storyModeRepository.updateAdminCampaignPublication(kingdom, action, expectedVersion);
  }

  public async getAdminAssets(): Promise<StoryMediaAssetEntity[]> {
    return this.storyModeRepository.getAdminAssets();
  }

  public async uploadAdminAsset(file: File): Promise<StoryMediaAssetEntity> {
    return this.storyModeRepository.uploadAdminAsset(file);
  }
}
