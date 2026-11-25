export interface TeamMemberApiModel {
  id: string;
  name: string;
  email: string;
  role: string;
  description: string;
  image: string;
  imagePositionX: number;
  imagePositionY: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamMemberApiRequest {
  name: string;
  email: string;
  role: string;
  description: string;
  image: string;
  imagePositionX?: number;
  imagePositionY?: number;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateTeamMemberApiRequest {
  name?: string;
  email?: string;
  role?: string;
  description?: string;
  image?: string;
  imagePositionX?: number;
  imagePositionY?: number;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UploadTeamImageApiResponse {
  url: string;
}
