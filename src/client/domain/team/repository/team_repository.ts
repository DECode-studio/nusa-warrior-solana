import type {
  TeamMemberEntity,
  CreateTeamMemberParams,
  UpdateTeamMemberParams,
} from "../entity/team_member_entity";

export interface TeamRepository {
  getPublicTeamMembers(): Promise<TeamMemberEntity[]>;
  getAdminTeamMembers(): Promise<TeamMemberEntity[]>;
  getTeamMemberById(id: string): Promise<TeamMemberEntity>;
  createTeamMember(params: CreateTeamMemberParams): Promise<TeamMemberEntity>;
  updateTeamMember(
    id: string,
    params: UpdateTeamMemberParams
  ): Promise<TeamMemberEntity>;
  deleteTeamMember(id: string): Promise<boolean>;
  uploadTeamImage(file: File): Promise<string>;
}
