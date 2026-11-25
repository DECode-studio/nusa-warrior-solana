"use client";

import React from "react";
import { Calendar, Check, Copy, Layers, Layers3, LibraryBig, Mail, Shield, ShieldCheck, Sparkles, Swords } from "lucide-react";
import type { AdminUserDetailEntity, UserRoleValue } from "@/client/domain/auth/entity/user_entity";
import { formatStatNumber } from "@/core/utils/formatters";
import { ADMIN_USERS_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { useTranslator } from "@/core/translator";
import { ADMIN_USERS_TEXT_CONSTANT } from "../constants/TextConstant";

type RoleStyle = { label: string; bg: string; border: string; text: string; icon: React.ReactNode };

export interface AdminUserDetailProfileProps {
  readonly detail: AdminUserDetailEntity;
  readonly totalCopies: number;
  readonly registeredDateLabel: string;
  readonly isUpdatingRole: boolean;
  readonly copiedEmail: boolean;
  readonly onRoleChange: (role: UserRoleValue) => Promise<void>;
  readonly onCopyEmail: (email: string) => Promise<void>;
}

export function AdminUserDetailProfile({ detail, totalCopies, registeredDateLabel, isUpdatingRole, copiedEmail, onRoleChange, onCopyEmail }: AdminUserDetailProfileProps): React.ReactElement {
  const { t } = useTranslator();
  const roleStyles: Record<UserRoleValue, RoleStyle> = {
    ADMIN: {
      label: t(ADMIN_USERS_TEXT_CONSTANT.OPT_ADMIN),
      bg: "bg-[#6766FF]/15",
      border: "border-[#6766FF]/40",
      text: "text-[#A9A8FF]",
      icon: <Shield className="h-4 w-4" />,
    },
    CURATOR: {
      label: t(ADMIN_USERS_TEXT_CONSTANT.OPT_CURATOR),
      bg: "bg-[#FF9F31]/15",
      border: "border-[#FF9F31]/40",
      text: "text-[#FF9F31]",
      icon: <Sparkles className="h-4 w-4" />,
    },
    PLAYER: {
      label: t(ADMIN_USERS_TEXT_CONSTANT.OPT_PLAYER),
      bg: "bg-[#0DB561]/15",
      border: "border-[#0DB561]/40",
      text: "text-[#3CE089]",
      icon: <Swords className="h-4 w-4" />,
    },
  };
  const roleStyle = roleStyles[detail.user.role];
  return (
    <>
      {/* 3. Hero Profile Card */}
      <section id={ADMIN_USERS_SEMANTIC_IDS.DETAIL_PROFILE} className="relative overflow-hidden rounded-[28px] border border-[rgba(103,102,255,0.25)] bg-gradient-to-br from-[#0F0927] via-[#080220] to-[#160E36] p-6 shadow-2xl sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-[#6766FF]/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-[#0DB561]/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Avatar and Identity */}
          <div className="flex items-start sm:items-center gap-5">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-[rgba(103,102,255,0.4)] bg-gradient-to-tr from-[#5856F2]/30 to-[#6766FF]/20 text-white shadow-[0_0_30px_rgba(103,102,255,0.2)]">
              <span className="font-display text-2xl font-bold uppercase tracking-wider">
                {detail.user.name ? detail.user.name.slice(0, 2) : (detail.user.walletAddress ?? "NW").slice(0, 2)}
              </span>
              <span
                className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#07011F] ring-2 ring-[#080220]"
                title={t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_ACCOUNT_REGISTERED)}
              >
                <span className="h-3 w-3 rounded-full bg-[#0DB561]" />
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 id={ADMIN_USERS_SEMANTIC_IDS.DETAIL_USER_NAME} className="font-display text-2xl font-extrabold text-white sm:text-3xl tracking-tight">
                  {detail.user.name}
                </h1>
                <div
                  id={ADMIN_USERS_SEMANTIC_IDS.DETAIL_ROLE_BADGE}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${roleStyle.bg} ${roleStyle.border} ${roleStyle.text}`}
                >
                  {roleStyle.icon}
                  <span>{roleStyle.label}</span>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#CFCBE2]">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#A9A8FF]" />
                  <span id={ADMIN_USERS_SEMANTIC_IDS.DETAIL_USER_EMAIL} className="font-mono">{detail.user.walletAddress ?? "-"}</span>
                  <button
                    type="button"
                    id={ADMIN_USERS_SEMANTIC_IDS.DETAIL_EMAIL_COPY}
                    onClick={() => onCopyEmail(detail.user.walletAddress ?? "")}
                    aria-label={t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_COPY_EMAIL)}
                    title={t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_COPY_EMAIL)}
                    className="ml-1 inline-flex text-[#CFCBE2] hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedEmail ? (
                      <Check className="h-3.5 w-3.5 text-[#0DB561]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                <div id={ADMIN_USERS_SEMANTIC_IDS.DETAIL_REGISTERED_DATE} className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#A9A8FF]" />
                  <span>
                    {t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_REGISTERED_PREFIX)}{" "}
                    {registeredDateLabel}
                  </span>
                </div>

                <span id={ADMIN_USERS_SEMANTIC_IDS.DETAIL_USER_ID} className="rounded-md bg-[#07011F]/80 px-2 py-0.5 font-mono text-[10px] text-[#A5A1B9] border border-white/5">
                  {t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_USER_ID_PREFIX)} {detail.user.id}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Role Switcher Panel */}
          <div className="shrink-0 rounded-2xl border border-[rgba(103,102,255,0.22)] bg-[#07011F]/70 p-4 backdrop-blur-md">
            <label htmlFor={ADMIN_USERS_SEMANTIC_IDS.DETAIL_ROLE_SELECT} className="block text-xs font-bold text-[#A9A8FF] uppercase tracking-wider mb-2">
              {t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_ROLE_LABEL)}
            </label>
            <div className="flex items-center gap-2">
              <select
                id={ADMIN_USERS_SEMANTIC_IDS.DETAIL_ROLE_SELECT}
                aria-label={t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_ROLE_SELECT_ARIA, {
                  name: detail.user.name,
                })}
                disabled={isUpdatingRole}
                value={detail.user.role}
                onChange={(e) =>
                  void onRoleChange(e.target.value as UserRoleValue)
                }
                className="rounded-xl border border-[rgba(103,102,255,0.35)] bg-[#0F0927] px-3.5 py-2 text-xs font-semibold text-white outline-none focus:border-[#A9A8FF] cursor-pointer disabled:opacity-50"
              >
                <option value="PLAYER">{t(ADMIN_USERS_TEXT_CONSTANT.OPT_PLAYER)}</option>
                <option value="CURATOR">{t(ADMIN_USERS_TEXT_CONSTANT.OPT_CURATOR)}</option>
                <option value="ADMIN">{t(ADMIN_USERS_TEXT_CONSTANT.OPT_ADMIN)}</option>
              </select>
              {isUpdatingRole && (
                <span className="text-xs text-[#6766FF] animate-pulse">
                  {t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_ROLE_SAVING)}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. KPI Inventory Summary Cards */}
      <section id={ADMIN_USERS_SEMANTIC_IDS.DETAIL_KPI_GRID} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div id={ADMIN_USERS_SEMANTIC_IDS.DETAIL_KPI_UNIQUE_CARDS} className="flex items-center gap-4 rounded-2xl border border-[rgba(103,102,255,0.2)] bg-[#0F0927]/90 p-5 shadow-lg">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#6766FF]/15 text-[#A9A8FF]">
            <LibraryBig className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-[#CFCBE2] font-medium">{t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_KPI_UNIQUE_CARDS)}</p>
            <p className="mt-1 font-display text-2xl font-bold text-white">
              {formatStatNumber(detail.ownedCards.length)}
            </p>
          </div>
        </div>

        <div id={ADMIN_USERS_SEMANTIC_IDS.DETAIL_KPI_CARD_COPIES} className="flex items-center gap-4 rounded-2xl border border-[rgba(103,102,255,0.2)] bg-[#0F0927]/90 p-5 shadow-lg">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FF9F31]/15 text-[#FF9F31]">
            <Layers3 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-[#CFCBE2] font-medium">{t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_KPI_CARD_COPIES)}</p>
            <p className="mt-1 font-display text-2xl font-bold text-white">
              {formatStatNumber(totalCopies)}
            </p>
          </div>
        </div>

        <div id={ADMIN_USERS_SEMANTIC_IDS.DETAIL_KPI_DECKS} className="flex items-center gap-4 rounded-2xl border border-[rgba(103,102,255,0.2)] bg-[#0F0927]/90 p-5 shadow-lg">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0DB561]/15 text-[#0DB561]">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-[#CFCBE2] font-medium">{t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_KPI_DECKS)}</p>
            <p className="mt-1 font-display text-2xl font-bold text-white">
              {formatStatNumber(detail.decks.length)}
            </p>
          </div>
        </div>

        <div id={ADMIN_USERS_SEMANTIC_IDS.DETAIL_KPI_ROLE} className="flex items-center gap-4 rounded-2xl border border-[rgba(103,102,255,0.2)] bg-[#0F0927]/90 p-5 shadow-lg">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#5856F2]/15 text-[#A9A8FF]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-[#CFCBE2] font-medium">{t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_KPI_ROLE)}</p>
            <p className="mt-1 font-display text-xl font-bold text-white uppercase">
              {detail.user.role}
            </p>
          </div>
        </div>
      </section>

    </>
  );
}
