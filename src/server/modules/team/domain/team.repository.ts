import "server-only";

export interface TeamMemberDto {
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

export interface CreateTeamMemberInput {
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

export interface UpdateTeamMemberInput {
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

export interface TeamRepository {
  listPublicTeamMembers(): Promise<TeamMemberDto[]>;
  listAllTeamMembers(): Promise<TeamMemberDto[]>;
  findById(id: string): Promise<TeamMemberDto | null>;
  create(input: CreateTeamMemberInput): Promise<TeamMemberDto>;
  update(id: string, input: UpdateTeamMemberInput): Promise<TeamMemberDto>;
  delete(id: string): Promise<boolean>;
}
