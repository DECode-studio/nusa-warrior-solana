"use client";

import React from "react";
import { Search, Users } from "lucide-react";
import type {
  PaymentGatewayMode,
  PaymentGatewayUserEntity,
} from "@/client/domain/payment/entity/payment_gateway_entity";
import { InputField, Pagination } from "@/client/presentation/components/ui";
import { useTranslator } from "@/core/translator";
import { ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT } from "../constants/TextConstant";

export interface AdminPaymentGatewayUserListProps {
  readonly users: readonly PaymentGatewayUserEntity[];
  readonly globalMode: PaymentGatewayMode;
  readonly searchQuery: string;
  readonly onSearchChange: (val: string) => void;
  readonly disabled: boolean;
  readonly currentPage: number;
  readonly totalPages: number;
  readonly totalUsers: number;
  readonly pageSize: number;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (size: number) => void;
  readonly onUpdateOverride: (
    userId: string,
    mode: PaymentGatewayMode | null
  ) => Promise<void>;
}

export function AdminPaymentGatewayUserList({
  users,
  globalMode,
  searchQuery,
  onSearchChange,
  disabled,
  currentPage,
  totalPages,
  totalUsers,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onUpdateOverride,
}: AdminPaymentGatewayUserListProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <section
      id={ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS.USERS_CARD}
      className="overflow-hidden rounded-[24px] border border-[rgba(103,102,255,0.25)] bg-[#0F0927]/95"
    >
      <div className="flex flex-col gap-4 border-b border-[rgba(103,102,255,0.22)] p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div>
          <h2
            id={ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS.USERS_TITLE}
            className="font-display text-lg font-bold text-white"
          >
            {t(ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT.USERS_TITLE)}
          </h2>
          <p
            id={ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS.USERS_DESCRIPTION}
            className="mt-1 text-xs text-[#CFCBE2] sm:text-sm"
          >
            {t(ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT.USERS_DESCRIPTION)}
          </p>
        </div>

        <div className="w-full sm:w-72">
          <InputField
            id={ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS.SEARCH_INPUT}
            aria-label={t(
              ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT.SEARCH_PLACEHOLDER
            )}
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t(
              ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT.SEARCH_PLACEHOLDER
            )}
            leftIcon={
              <Search className="h-4 w-4 text-[#CFCBE2]" aria-hidden="true" />
            }
            sizeVariant="sm"
            className="!bg-[#07011F] !pr-4"
          />
        </div>
      </div>

      {users.length === 0 ? (
        <div
          id={ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS.NO_USERS}
          className="p-8 text-center text-xs text-[#CFCBE2]"
        >
          <Users
            className="mx-auto mb-2 h-8 w-8 text-[#6766FF]"
            aria-hidden="true"
          />
          <p>{t(ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT.NO_USERS)}</p>
        </div>
      ) : (
        <>
          <div
            id={ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS.USERS_LIST}
            className="divide-y divide-[rgba(103,102,255,0.16)]"
          >
            {users.map((user) => (
              <div
                key={user.userId}
                id={`${ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS.USER_ROW_PREFIX}${user.userId}`}
                className="flex flex-col gap-3 p-4 transition hover:bg-[#07011F]/60 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-bold text-white">
                    {user.name}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[#CFCBE2]">
                    <span className="truncate">{user.email}</span>
                    <span
                      id={`${ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS.USER_ROLE_BADGE_PREFIX}${user.userId}`}
                      className={
                        user.role === "ADMIN"
                          ? "nc-badge-emerald px-2 py-0.5 text-[11px]"
                          : user.role === "CURATOR"
                            ? "nc-badge-amber px-2 py-0.5 text-[11px]"
                            : "nc-badge-primary px-2 py-0.5 text-[11px]"
                      }
                    >
                      {user.role}
                    </span>
                  </p>
                </div>

                <label className="flex shrink-0 items-center gap-3 text-xs text-[#CFCBE2]">
                  <span className="font-semibold">
                    {t(ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT.OVERRIDE_LABEL)}
                  </span>
                  <select
                    id={`${ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS.USER_OVERRIDE_SELECT_PREFIX}${user.userId}`}
                    aria-label={`${t(
                      ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT.OVERRIDE_LABEL
                    )}: ${user.name}`}
                    value={user.paymentModeOverride ?? "GLOBAL"}
                    disabled={disabled}
                    onChange={(e) =>
                      void onUpdateOverride(
                        user.userId,
                        e.target.value === "GLOBAL"
                          ? null
                          : (e.target.value as PaymentGatewayMode)
                      )
                    }
                    className="min-h-10 rounded-xl border border-[rgba(103,102,255,0.3)] bg-[#07011F] px-3 py-1.5 text-xs font-semibold text-white focus:border-[#6766FF] focus:outline-none focus:ring-1 focus:ring-[#6766FF] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="GLOBAL">
                      {t(ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT.FOLLOW_GLOBAL, {
                        mode: globalMode,
                      })}
                    </option>
                    <option value="DEV">
                      DEV · {t(ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT.DEV)}
                    </option>
                    <option value="PROD">
                      PROD · {t(ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT.PROD)}
                    </option>
                  </select>
                </label>
              </div>
            ))}
          </div>

          <div className="border-t border-[rgba(103,102,255,0.22)] p-4 sm:p-5">
            <Pagination
              id={ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS.PAGINATION}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalUsers}
              pageSize={pageSize}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              pageSizeOptions={[10, 20, 50]}
              itemLabel={t("common.pagination.defaultLabel")}
            />
          </div>
        </>
      )}
    </section>
  );
}
