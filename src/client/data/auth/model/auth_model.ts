import type {
  AdminUserRecordEntity,
  UserEntity,
  UserRole,
} from "@/client/domain/auth/entity/user_entity";

export interface UserApiModel {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  isGuest?: boolean;
  hasClaimedStarterPack?: boolean;
  avatarUrl?: string | null;
  nusaPoints?: number;
}

export interface AdminUserApiModel {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isGuest?: boolean;
  hasClaimedStarterPack?: boolean;
  createdAt: string;
}

export function mapUserModelToEntity(model: UserApiModel): UserEntity {
  return {
    userId: model.userId,
    email: model.email,
    name: model.name,
    role: model.role,
    isGuest: model.isGuest,
    hasClaimedStarterPack: model.hasClaimedStarterPack,
    avatarUrl: model.avatarUrl ?? null,
    nusaPoints: model.nusaPoints ?? 0,
  };
}

export function mapAdminUserModelToEntity(
  model: AdminUserApiModel
): AdminUserRecordEntity {
  return {
    id: model.id,
    email: model.email,
    name: model.name,
    role: model.role,
    isGuest: model.isGuest,
    createdAt: model.createdAt,
  };
}
