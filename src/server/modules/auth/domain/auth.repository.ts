import "server-only";
import type { UserRoleValue } from "@/server/shared/auth/session";

export interface ServerUserEntity {
  id: string;
  email: string;
  name: string;
  googleId?: string | null;
  avatarUrl?: string | null;
  passwordHash: string;
  role: UserRoleValue;
  isGuest?: boolean;
  hasClaimedStarterPack?: boolean;
  lastActiveAt?: Date | string;
}

export interface UpsertGoogleUserInput {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role?: UserRoleValue;
}

export interface CreateGuestUserInput {
  id?: string;
  email: string;
  name: string;
}

export interface LinkGoogleUserInput {
  userId: string;
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface AuthRepository {
  findByEmail(email: string): Promise<ServerUserEntity | null>;
  findById(id: string): Promise<ServerUserEntity | null>;
  findByGoogleId(googleId: string): Promise<ServerUserEntity | null>;
  createGuestUser(input: CreateGuestUserInput): Promise<ServerUserEntity>;
  touchLastActiveAt(userId: string): Promise<void>;
  deleteInactiveGuestAccounts(cutoffDate: Date): Promise<{ deletedUsers: number; deletedDecks: number }>;
  linkGoogleAccount(input: LinkGoogleUserInput): Promise<ServerUserEntity>;
  upsertGoogleUser(input: UpsertGoogleUserInput): Promise<ServerUserEntity>;
}
