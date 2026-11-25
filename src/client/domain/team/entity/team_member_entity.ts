export interface TeamMemberEntity {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: string;
  readonly description: string;
  readonly image: string;
  readonly imagePositionX: number;
  readonly imagePositionY: number;
  readonly displayOrder: number;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateTeamMemberParams {
  readonly name: string;
  readonly email: string;
  readonly role: string;
  readonly description: string;
  readonly image: string;
  readonly imagePositionX?: number;
  readonly imagePositionY?: number;
  readonly displayOrder?: number;
  readonly isActive?: boolean;
}

export interface UpdateTeamMemberParams {
  readonly name?: string;
  readonly email?: string;
  readonly role?: string;
  readonly description?: string;
  readonly image?: string;
  readonly imagePositionX?: number;
  readonly imagePositionY?: number;
  readonly displayOrder?: number;
  readonly isActive?: boolean;
}
