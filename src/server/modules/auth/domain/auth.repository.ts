import "server-only";
import type { UserRoleValue } from "@/server/shared/auth/session";

export interface ServerUserEntity {
  id: string;
  walletAddress: string | null;
  name: string;
  avatarUrl?: string | null;
  passwordHash: string;
  role: UserRoleValue;
  hasClaimedStarterPack?: boolean;
  lastActiveAt?: Date | string;
}

export interface CreateSolanaUserInput {
  walletAddress: string;
  name: string;
  avatarUrl?: string | null;
  role?: UserRoleValue;
}

export interface AuthRepository {
  findById(id: string): Promise<ServerUserEntity | null>;
  findByWalletAddress(walletAddress: string): Promise<ServerUserEntity | null>;
  createSolanaUser(input: CreateSolanaUserInput): Promise<ServerUserEntity>;
  touchLastActiveAt(userId: string): Promise<void>;
}
