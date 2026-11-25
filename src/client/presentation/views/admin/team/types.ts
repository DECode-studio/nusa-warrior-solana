import type { TeamMemberEntity } from "@/client/domain/team/entity/team_member_entity";

export interface TeamMemberFormData {
  name: string;
  email: string;
  role: string;
  description: string;
  image: string;
  imagePositionX: number;
  imagePositionY: number;
  displayOrder: number;
  isActive: boolean;
}

export interface AdminTeamFeedback {
  messageKey: string;
  variant: "success" | "error";
}

export type SelectedTeamMember = TeamMemberEntity | null;
