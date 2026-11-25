import { inject, injectable } from "@needle-di/core";
import type {
  CompleteStoryMissionEntity,
  StartedStoryBattleEntity,
  StartStoryMissionInputEntity,
  StoryCampaignEntity,
  StoryMissionRewardEntity,
  AdminStoryCampaignEntity,
  AdminStoryCampaignActionEntity,
} from "@/client/domain/story-mode/entity/story_mode_entity";
import type { StoryModeRepository } from "@/client/domain/story-mode/repository/story_mode_repository";
import { StoryModeRemoteDataSource } from "../datasource/story_mode_remote_datasource";
import type { StoryCampaignModel } from "../model/story_mode_model";
import type { StoryCampaignContentEntity, StoryMediaAssetEntity } from "@/client/domain/story-mode/entity/story_mode_entity";

function mapCampaignModelToEntity(model: StoryCampaignModel): StoryCampaignEntity {
  return {
    kingdom: model.kingdom,
    title: model.title,
    subtitle: model.subtitle,
    accent: model.accent,
    translations: model.translations,
    progress: {
      kingdom: model.progress.kingdom,
      completedMissionIds: [...model.progress.completedMissionIds],
      replayCounts: { ...model.progress.replayCounts },
      choices: { ...model.progress.choices },
      endingSeen: model.progress.endingSeen,
      isComplete: model.progress.isComplete,
    },
    missions: model.missions.map((mission) => ({
      id: mission.id,
      title: mission.title,
      chapter: mission.chapter,
      kind: mission.kind,
      intro: mission.intro,
      historicalNote: mission.historicalNote,
      soundtrackUrl: mission.soundtrackUrl,
      soundtrackAssetId: mission.soundtrackAssetId,
      dialogue: mission.dialogue.map((line) => ({ ...line })),
      choiceAfterSceneIndex: mission.choiceAfterSceneIndex,
      storyDeck: {
        characterSlugs: [...mission.storyDeck.characterSlugs],
        instrumentSlugs: [...mission.storyDeck.instrumentSlugs],
      },
      objective: mission.objective,
      opponentTitle: mission.opponentTitle,
      choices: mission.choices.map((choice) => ({ ...choice })),
      replayPointBase: mission.replayPointBase,
      endingTitle: mission.endingTitle,
      ending: mission.ending,
      completed: mission.completed,
      unlocked: mission.unlocked,
      replayCount: mission.replayCount,
      previousChoice: mission.previousChoice,
      translations: mission.translations,
    })),
  };
}

@injectable()
export class StoryModeRepositoryImpl implements StoryModeRepository {
  constructor(
    private readonly remoteDataSource: StoryModeRemoteDataSource = inject(StoryModeRemoteDataSource),
  ) {}

  public async getCampaigns(): Promise<StoryCampaignEntity[]> {
    const models = await this.remoteDataSource.getCampaigns();
    return models.map(mapCampaignModelToEntity);
  }

  public async startMission(input: StartStoryMissionInputEntity): Promise<StartedStoryBattleEntity> {
    const result = await this.remoteDataSource.startMission(input);
    return { battleSessionId: result.battle.id };
  }

  public async completeMission(input: CompleteStoryMissionEntity): Promise<StoryMissionRewardEntity> {
    return this.remoteDataSource.completeMission(input);
  }

  public async getAdminCampaigns(): Promise<AdminStoryCampaignEntity[]> { return this.remoteDataSource.getAdminCampaigns(); }
  public async saveAdminCampaign(campaign: StoryCampaignContentEntity, expectedVersion: number): Promise<AdminStoryCampaignEntity> { return this.remoteDataSource.saveAdminCampaign(campaign, expectedVersion); }
  public async updateAdminCampaignPublication(kingdom: "MAJAPAHIT" | "PAJAJARAN", action: AdminStoryCampaignActionEntity, expectedVersion: number): Promise<AdminStoryCampaignEntity> {
    return this.remoteDataSource.updateAdminCampaignPublication(kingdom, action, expectedVersion);
  }
  public async getAdminAssets(): Promise<StoryMediaAssetEntity[]> { return this.remoteDataSource.getAdminAssets(); }
  public async uploadAdminAsset(file: File): Promise<StoryMediaAssetEntity> { return this.remoteDataSource.uploadAdminAsset(file); }
}
