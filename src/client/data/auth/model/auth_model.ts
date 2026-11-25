import type {
  AdminUserRecordEntity,
  UserEntity,
  UserRole,
} from "@/client/domain/auth/entity/user_entity";

export interface UserApiModel {
  userId: string;
  walletAddress: string | null;
  name: string;
  role: UserRole;
  hasClaimedStarterPack?: boolean;
  avatarUrl?: string | null;
  nusaPoints?: number;
}

export interface AdminUserApiModel {
  id: string;
  walletAddress: string | null;
  name: string;
  role: UserRole;
  hasClaimedStarterPack?: boolean;
  createdAt: string;
}

export function mapUserModelToEntity(model: UserApiModel): UserEntity {
  return {
    userId: model.userId,
    walletAddress: model.walletAddress ?? null,
    name: model.name,
    role: model.role,
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
    walletAddress: model.walletAddress ?? null,
    name: model.name,
    role: model.role,
    createdAt: model.createdAt,
  };
}
