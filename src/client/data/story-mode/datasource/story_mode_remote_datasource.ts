import { injectable } from "@needle-di/core";
import { API_ROUTES } from "@/core/constants/api-routes";
import { apiClient } from "@/core/http-client/api-client";
import type {
  CompleteStoryMissionInputModel,
  CompleteStoryMissionResultModel,
  StartStoryMissionInputModel,
  StartStoryMissionResultModel,
  StoryCampaignModel,
  StoryCampaignContentModel,
  StoryMediaAssetModel,
  AdminStoryCampaignModel,
  AdminStoryCampaignActionModel,
} from "../model/story_mode_model";

@injectable()
export class StoryModeRemoteDataSource {
  public async getCampaigns(): Promise<StoryCampaignModel[]> {
    return apiClient.get<StoryCampaignModel[]>(API_ROUTES.STORY_MODE.state);
  }

  public async startMission(input: StartStoryMissionInputModel): Promise<StartStoryMissionResultModel> {
    return apiClient.post<StartStoryMissionResultModel>(API_ROUTES.STORY_MODE.start, input);
  }

  public async completeMission(input: CompleteStoryMissionInputModel): Promise<CompleteStoryMissionResultModel> {
    return apiClient.post<CompleteStoryMissionResultModel>(API_ROUTES.STORY_MODE.complete, input);
  }

  public async getAdminCampaigns(): Promise<AdminStoryCampaignModel[]> {
    return apiClient.get<AdminStoryCampaignModel[]>(API_ROUTES.STORY_MODE.admin);
  }

  public async saveAdminCampaign(campaign: StoryCampaignContentModel, expectedVersion: number): Promise<AdminStoryCampaignModel> {
    return apiClient.patch<AdminStoryCampaignModel>(API_ROUTES.STORY_MODE.admin, { campaign, expectedVersion });
  }

  public async updateAdminCampaignPublication(
    kingdom: "MAJAPAHIT" | "PAJAJARAN",
    action: AdminStoryCampaignActionModel,
    expectedVersion: number,
  ): Promise<AdminStoryCampaignModel> {
    return apiClient.post<AdminStoryCampaignModel>(API_ROUTES.STORY_MODE.admin, { kingdom, action, expectedVersion });
  }

  public async getAdminAssets(): Promise<StoryMediaAssetModel[]> {
    return apiClient.get<StoryMediaAssetModel[]>(API_ROUTES.STORY_MODE.adminAssets);
  }

  public async uploadAdminAsset(file: File): Promise<StoryMediaAssetModel & { reused: boolean }> {
    const form = new FormData();
    form.set("file", file);
    const response = await fetch(API_ROUTES.STORY_MODE.adminAssets, { method: "POST", body: form, credentials: "include" });
    if (!response.ok) throw new Error("Media upload failed.");
    const payload = await response.json() as { data?: StoryMediaAssetModel & { reused: boolean } };
    if (!payload.data) throw new Error("Media upload response was invalid.");
    return payload.data;
  }
}
