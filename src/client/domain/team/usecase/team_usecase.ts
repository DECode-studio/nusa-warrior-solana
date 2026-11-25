import { inject, injectable } from "@needle-di/core";
import { TEAM_REPOSITORY_TOKEN } from "@/core/di/tokens";
import type { TeamRepository } from "../repository/team_repository";
import type {
  TeamMemberEntity,
  CreateTeamMemberParams,
  UpdateTeamMemberParams,
} from "../entity/team_member_entity";

@injectable()
export class TeamUseCase {
  constructor(
    private readonly teamRepository: TeamRepository = inject(
      TEAM_REPOSITORY_TOKEN
    )
  ) {}

  public async getPublicTeamMembers(): Promise<TeamMemberEntity[]> {
    return this.teamRepository.getPublicTeamMembers();
  }

  public async getAdminTeamMembers(): Promise<TeamMemberEntity[]> {
    return this.teamRepository.getAdminTeamMembers();
  }

  public async getTeamMemberById(id: string): Promise<TeamMemberEntity> {
    return this.teamRepository.getTeamMemberById(id);
  }

  public async createTeamMember(
    params: CreateTeamMemberParams
  ): Promise<TeamMemberEntity> {
    return this.teamRepository.createTeamMember(params);
  }

  public async updateTeamMember(
    id: string,
    params: UpdateTeamMemberParams
  ): Promise<TeamMemberEntity> {
    return this.teamRepository.updateTeamMember(id, params);
  }

  public async deleteTeamMember(id: string): Promise<boolean> {
    return this.teamRepository.deleteTeamMember(id);
  }

  public async uploadTeamImage(file: File): Promise<string> {
    return this.teamRepository.uploadTeamImage(file);
  }
}
