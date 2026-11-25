"use client";

import React from "react";
import { Users, ExternalLink } from "lucide-react";
import type { AdminUserRecordEntity, UserRoleValue } from "@/client/domain/auth/entity/user_entity";
import { useTranslator } from "@/core/translator";
import { ADMIN_USERS_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { ADMIN_USERS_TEXT_CONSTANT } from "../constants/TextConstant";

export interface AdminUsersTableProps {
  readonly users: readonly AdminUserRecordEntity[];
  readonly onUpdateRole: (userId: string, role: UserRoleValue) => Promise<void>;
  readonly onOpenDetail: (userId: string) => void;
}

export function AdminUsersTable({
  users,
  onUpdateRole,
  onOpenDetail,
}: AdminUsersTableProps): React.ReactElement {
  const { t } = useTranslator();

  if (users.length === 0) {
    return (
      <div
        id={ADMIN_USERS_SEMANTIC_IDS.EMPTY_SEARCH}
        className="rounded-[24px] border border-[rgba(103,102,255,0.25)] bg-[#0F0927]/95 p-8 text-center text-xs text-[#CFCBE2]"
      >
        <Users
          className="mx-auto mb-2 h-8 w-8 text-[#6766FF]"
          aria-hidden="true"
        />
        {t(ADMIN_USERS_TEXT_CONSTANT.EMPTY_SEARCH)}
      </div>
    );
  }

  return (
    <div
      id={ADMIN_USERS_SEMANTIC_IDS.USERS_TABLE}
      className="overflow-x-auto rounded-[24px] border border-[rgba(103,102,255,0.25)] bg-[#0F0927]/95"
    >
      <table className="w-full text-left text-xs">
        <thead className="border-b border-[rgba(103,102,255,0.22)] bg-[#07011F] text-white">
          <tr>
            <th className="p-4 font-display text-sm">
              {t(ADMIN_USERS_TEXT_CONSTANT.TH_NAME)}
            </th>
            <th className="p-4 font-display text-sm">
              {t(ADMIN_USERS_TEXT_CONSTANT.TH_EMAIL)}
            </th>
            <th className="p-4 font-display text-sm">
              {t(ADMIN_USERS_TEXT_CONSTANT.TH_CURRENT_ROLE)}
            </th>
            <th className="p-4 font-display text-sm">
              {t(ADMIN_USERS_TEXT_CONSTANT.TH_CHANGE_ROLE)}
            </th>
            <th className="p-4 font-display text-sm">{t(ADMIN_USERS_TEXT_CONSTANT.TH_DETAIL)}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[rgba(103,102,255,0.16)]">
          {users.map((user) => (
            <tr
              key={user.id}
              id={`${ADMIN_USERS_SEMANTIC_IDS.USER_ROW_PREFIX}${user.id}`}
              className="transition hover:bg-[#07011F]/60"
            >
              <td className="p-4 font-display text-sm font-bold text-white">
                {user.name}
              </td>
              <td className="p-4 font-mono text-xs text-[#CFCBE2]">{user.walletAddress ?? "-"}</td>
              <td className="p-4">
                <span
                  id={`${ADMIN_USERS_SEMANTIC_IDS.ROLE_BADGE_PREFIX}${user.id}`}
                  className={
                    user.role === "ADMIN"
                      ? "nc-badge-emerald"
                      : user.role === "CURATOR"
                        ? "nc-badge-amber"
                        : "nc-badge-primary"
                  }
                >
                  {user.role}
                </span>
              </td>
              <td className="p-4">
                <select
                  id={`${ADMIN_USERS_SEMANTIC_IDS.ROLE_SELECT_PREFIX}${user.id}`}
                  aria-label={t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_ROLE_SELECT_ARIA, {
                    name: user.name,
                  })}
                  value={user.role}
                  onChange={(e) =>
                    void onUpdateRole(user.id, e.target.value as UserRoleValue)
                  }
                  className="rounded-xl border border-[rgba(103,102,255,0.3)] bg-[#07011F] px-3 py-2 text-xs font-semibold text-white focus:border-[#6766FF] focus:outline-none cursor-pointer"
                >
                  <option value="PLAYER">
                    {t(ADMIN_USERS_TEXT_CONSTANT.OPT_PLAYER)}
                  </option>
                  <option value="CURATOR">
                    {t(ADMIN_USERS_TEXT_CONSTANT.OPT_CURATOR)}
                  </option>
                  <option value="ADMIN">
                    {t(ADMIN_USERS_TEXT_CONSTANT.OPT_ADMIN)}
                  </option>
                </select>
              </td>
              <td className="p-4">
                <button
                  id={`${ADMIN_USERS_SEMANTIC_IDS.USER_DETAIL_BUTTON_PREFIX}${user.id}`}
                  aria-label={t(ADMIN_USERS_TEXT_CONSTANT.VIEW_DETAIL)}
                  type="button"
                  onClick={() => onOpenDetail(user.id)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[rgba(103,102,255,0.3)] px-3 text-xs font-bold text-white hover:bg-white/10"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  {t(ADMIN_USERS_TEXT_CONSTANT.VIEW_DETAIL)}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
