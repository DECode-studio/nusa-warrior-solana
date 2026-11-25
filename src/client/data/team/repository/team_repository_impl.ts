import { inject, injectable } from "@needle-di/core";
import type { TeamRepository } from "@/client/domain/team/repository/team_repository";
import type {
  TeamMemberEntity,
  CreateTeamMemberParams,
  UpdateTeamMemberParams,
} from "@/client/domain/team/entity/team_member_entity";
import { TeamRemoteDataSource } from "../datasource/team_remote_datasource";
import type { TeamMemberApiModel } from "../model/team_member_model";

function mapToEntity(model: TeamMemberApiModel): TeamMemberEntity {
  return {
    id: model.id,
    name: model.name,
    email: model.email,
    role: model.role,
    description: model.description,
    image: model.image,
    imagePositionX: model.imagePositionX ?? 50,
    imagePositionY: model.imagePositionY ?? 50,
    displayOrder: model.displayOrder,
    isActive: model.isActive,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
}

@injectable()
export class TeamRepositoryImpl implements TeamRepository {
  constructor(
    private readonly remoteDataSource: TeamRemoteDataSource = inject(
      TeamRemoteDataSource
    )
  ) {}

  public async getPublicTeamMembers(): Promise<TeamMemberEntity[]> {
    const models = await this.remoteDataSource.getPublicTeamMembers();
    return models.map(mapToEntity);
  }

  public async getAdminTeamMembers(): Promise<TeamMemberEntity[]> {
    const models = await this.remoteDataSource.getAdminTeamMembers();
    return models.map(mapToEntity);
  }

  public async getTeamMemberById(id: string): Promise<TeamMemberEntity> {
    const model = await this.remoteDataSource.getTeamMemberById(id);
    return mapToEntity(model);
  }

  public async createTeamMember(
    params: CreateTeamMemberParams
  ): Promise<TeamMemberEntity> {
    const model = await this.remoteDataSource.createTeamMember({
      name: params.name,
      email: params.email,
      role: params.role,
      description: params.description,
      image: params.image,
      imagePositionX: params.imagePositionX,
      imagePositionY: params.imagePositionY,
      displayOrder: params.displayOrder,
      isActive: params.isActive,
    });
    return mapToEntity(model);
  }

  public async updateTeamMember(
    id: string,
    params: UpdateTeamMemberParams
  ): Promise<TeamMemberEntity> {
    const model = await this.remoteDataSource.updateTeamMember(id, {
      name: params.name,
      email: params.email,
      role: params.role,
      description: params.description,
      image: params.image,
      imagePositionX: params.imagePositionX,
      imagePositionY: params.imagePositionY,
      displayOrder: params.displayOrder,
      isActive: params.isActive,
    });
    return mapToEntity(model);
  }

  public async deleteTeamMember(id: string): Promise<boolean> {
    return this.remoteDataSource.deleteTeamMember(id);
  }

  public async uploadTeamImage(file: File): Promise<string> {
    return this.remoteDataSource.uploadTeamImage(file);
  }
}
