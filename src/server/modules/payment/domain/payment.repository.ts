import "server-only";
import type { UserRoleValue } from "@/server/shared/auth/session";

export type PaymentMode = "DEV" | "PROD";

export interface PaymentGatewayUserOverride {
  userId: string;
  name: string;
  email: string;
  role: UserRoleValue;
  paymentModeOverride: PaymentMode | null;
}

export interface PaymentGatewayUserQueryFilter {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaymentGatewaySettings {
  globalMode: PaymentMode;
  updatedByUserId: string | null;
  updatedAt: string;
  users: PaymentGatewayUserOverride[];
  totalUsers: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaymentRepository {
  getSettings(filter?: PaymentGatewayUserQueryFilter): Promise<PaymentGatewaySettings>;
  setGlobalMode(mode: PaymentMode, adminUserId: string): Promise<PaymentGatewaySettings>;
  setUserOverride(userId: string, mode: PaymentMode | null): Promise<PaymentGatewayUserOverride>;
  resolveModeForUser(userId: string): Promise<PaymentMode>;
}
