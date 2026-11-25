import "server-only";
import type {
  StoredCardRecord,
  StoredCorrectionReportRecord,
} from "@/server/shared/db/embedded-store";
import type {
  AdminCardQueryFilter,
  AdminUserQueryFilter,
  AdminUserSummaryRecord,
  AdminUserDetailRecord,
  UpdateAdminUserRoleInput,
  UpdateCardCurationInput,
  UpdateReportStatusInput,
} from "../domain/admin.repository";
import { adminRepository } from "../infrastructure/admin.repository.impl";
import { revokeAuthSessionsForUser } from "@/server/shared/auth/auth-session-store";

export async function listAdminCardsUseCase(): Promise<StoredCardRecord[]> {
  return adminRepository.listAllCardsForAdmin();
}

export async function listAdminCardsPaginatedUseCase(
  filter: AdminCardQueryFilter
): Promise<{
  items: StoredCardRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  return adminRepository.listPaginatedCardsForAdmin(filter);
}

export async function updateCardCurationUseCase(
  input: UpdateCardCurationInput
): Promise<StoredCardRecord> {
  return adminRepository.updateCardCuration(input);
}

export async function listAdminReportsUseCase(): Promise<
  StoredCorrectionReportRecord[]
> {
  return adminRepository.listAllReports();
}

export async function updateReportStatusUseCase(
  input: UpdateReportStatusInput
): Promise<StoredCorrectionReportRecord> {
  return adminRepository.updateReportStatus(input);
}

export async function listAdminUsersUseCase(): Promise<
  AdminUserSummaryRecord[]
> {
  return adminRepository.listAllUsers();
}

export async function listAdminUsersPaginatedUseCase(
  filter: AdminUserQueryFilter
): Promise<{
  items: AdminUserSummaryRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  return adminRepository.listPaginatedUsers(filter);
}

export async function getAdminUserDetailUseCase(userId: string): Promise<AdminUserDetailRecord> {
  return adminRepository.getUserDetail(userId);
}

export async function updateAdminUserRoleUseCase(
  input: UpdateAdminUserRoleInput
): Promise<AdminUserSummaryRecord> {
  const updated = await adminRepository.updateUserRole(input);
  await revokeAuthSessionsForUser(input.userId);
  return updated;
}
