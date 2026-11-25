import { injectable } from "@needle-di/core";
import { API_ROUTES } from "@/core/constants/api-routes";
import { apiClient } from "@/core/http-client/api-client";
import type {
  TeamMemberApiModel,
  CreateTeamMemberApiRequest,
  UpdateTeamMemberApiRequest,
  UploadTeamImageApiResponse,
} from "../model/team_member_model";

@injectable()
export class TeamRemoteDataSource {
  public async getPublicTeamMembers(): Promise<TeamMemberApiModel[]> {
    return apiClient.get<TeamMemberApiModel[]>(API_ROUTES.TEAM.list);
  }

  public async getAdminTeamMembers(): Promise<TeamMemberApiModel[]> {
    return apiClient.get<TeamMemberApiModel[]>(API_ROUTES.ADMIN.TEAM);
  }

  public async getTeamMemberById(id: string): Promise<TeamMemberApiModel> {
    return apiClient.get<TeamMemberApiModel>(API_ROUTES.ADMIN.TEAM_MEMBER(id));
  }

  public async createTeamMember(
    body: CreateTeamMemberApiRequest
  ): Promise<TeamMemberApiModel> {
    return apiClient.post<TeamMemberApiModel, CreateTeamMemberApiRequest>(
      API_ROUTES.ADMIN.TEAM,
      body
    );
  }

  public async updateTeamMember(
    id: string,
    body: UpdateTeamMemberApiRequest
  ): Promise<TeamMemberApiModel> {
    return apiClient.patch<TeamMemberApiModel, UpdateTeamMemberApiRequest>(
      API_ROUTES.ADMIN.TEAM_MEMBER(id),
      body
    );
  }

  public async deleteTeamMember(id: string): Promise<boolean> {
    await apiClient.delete<{ success: boolean }>(
      API_ROUTES.ADMIN.TEAM_MEMBER(id)
    );
    return true;
  }

  public async uploadTeamImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.postFormData<UploadTeamImageApiResponse>(
      API_ROUTES.ADMIN.TEAM_UPLOAD,
      formData
    );
    return response.url;
  }
}
