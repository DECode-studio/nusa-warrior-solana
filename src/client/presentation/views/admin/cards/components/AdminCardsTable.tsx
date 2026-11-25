"use client";

import React from "react";
import { Eye, EyeOff, ExternalLink, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import type { VerificationStatusValue } from "@/core/constants/cards-catalog";
import { useTranslator } from "@/core/translator";
import {
  formatKingdomLabel,
  formatRoleLabel,
} from "@/core/utils/formatters";
import { ADMIN_CARDS_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { ADMIN_CARDS_TEXT_CONSTANT } from "../constants/TextConstant";
import { ROUTES } from "@/core/constants/routes";

export interface AdminCardsTableProps {
  readonly cards: readonly CardEntity[];
  readonly onUpdateVerification: (
    slug: string,
    status: VerificationStatusValue
  ) => Promise<void>;
  readonly onTogglePublication: (
    slug: string,
    status: "ACTIVE" | "WITHDRAWN"
  ) => Promise<void>;
}

export function AdminCardsTable({
  cards,
  onUpdateVerification,
  onTogglePublication,
}: AdminCardsTableProps): React.ReactElement {
  const { t, locale } = useTranslator();
  const router = useRouter();

  return (
    <div
      id={ADMIN_CARDS_SEMANTIC_IDS.CARDS_TABLE}
      className="overflow-x-auto rounded-[24px] border border-[rgba(103,102,255,0.25)] bg-[#0F0927]/95"
    >
      <table className="w-full text-left text-xs">
        <thead className="border-b border-[rgba(103,102,255,0.22)] bg-[#07011F] text-white">
          <tr>
            <th className="p-3.5 font-display text-sm">
              {t(ADMIN_CARDS_TEXT_CONSTANT.TH_ENTITY)}
            </th>
            <th className="p-3.5 font-display text-sm">
              {t(ADMIN_CARDS_TEXT_CONSTANT.TH_SOURCE)}
            </th>
            <th className="p-3.5 font-display text-sm">
              {t(ADMIN_CARDS_TEXT_CONSTANT.TH_VERIFICATION)}
            </th>
            <th className="p-3.5 font-display text-sm">
              {t(ADMIN_CARDS_TEXT_CONSTANT.TH_PUBLICATION)}
            </th>
            <th className="p-3.5 font-display text-sm">{t(ADMIN_CARDS_TEXT_CONSTANT.TH_DETAIL)}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[rgba(103,102,255,0.16)]">
          {cards.map((card) => {
            const isActive = card.publicationStatus === "ACTIVE";

            return (
              <tr
                key={card.slug}
                id={`${ADMIN_CARDS_SEMANTIC_IDS.CARD_ROW_PREFIX}${card.slug}`}
                className="transition hover:bg-[#07011F]/60"
              >
                <td className="p-3.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="nc-badge-amber">{card.code}</span>
                    <span className="nc-badge-primary">
                      {formatKingdomLabel(card.kingdom)}
                    </span>
                    <span className="nc-badge-emerald">
                      {formatRoleLabel(card.role)}
                    </span>
                  </div>
                  <div className="mt-1.5 font-display text-base font-bold text-white">
                    {card.name}
                  </div>
                </td>
                <td className="max-w-xs p-3.5">
                  <div className="truncate font-semibold text-white">
                    {card.sourceCitation}
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#CFCBE2]">
                    {t(ADMIN_CARDS_TEXT_CONSTANT.LICENSE_LABEL)}{" "}
                    {card.asset?.licenseType ?? "Proprietary Demo"} (
                    {card.asset?.approvalStatus ?? "APPROVED"})
                  </div>
                </td>
                <td className="p-3.5">
                  <select
                    id={`${ADMIN_CARDS_SEMANTIC_IDS.VERIFICATION_SELECT_PREFIX}${card.slug}`}
                    aria-label={`Status verifikasi ${card.name}`}
                    value={card.verificationStatus}
                    onChange={(e) =>
                      void onUpdateVerification(
                        card.slug,
                        e.target.value as VerificationStatusValue
                      )
                    }
                    className="rounded-xl border border-[rgba(103,102,255,0.3)] bg-[#07011F] px-3 py-2 text-xs font-semibold text-white cursor-pointer"
                  >
                    <option value="VERIFIED">
                      {t(ADMIN_CARDS_TEXT_CONSTANT.OPT_VERIFIED)}
                    </option>
                    <option value="VISUAL_INTERPRETATION">
                      {t(ADMIN_CARDS_TEXT_CONSTANT.OPT_VISUAL)}
                    </option>
                    <option value="PENDING_REVIEW">
                      {t(ADMIN_CARDS_TEXT_CONSTANT.OPT_PENDING)}
                    </option>
                  </select>
                </td>
                <td className="p-3.5">
                  <button
                    id={`${ADMIN_CARDS_SEMANTIC_IDS.PUBLICATION_TOGGLE_PREFIX}${card.slug}`}
                    type="button"
                    onClick={() =>
                      void onTogglePublication(
                        card.slug,
                        isActive ? "WITHDRAWN" : "ACTIVE"
                      )
                    }
                    className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                      isActive
                        ? "border-[#0DB561]/55 bg-[#0DB561]/15 text-white hover:border-rose-500/55 hover:bg-rose-500/15"
                        : "border-rose-500/55 bg-rose-500/15 text-white hover:border-[#0DB561]/55 hover:bg-[#0DB561]/15"
                    }`}
                  >
                    {isActive ? (
                      <>
                        <Eye
                          className="h-4 w-4 text-[#0DB561]"
                          aria-hidden="true"
                        />
                        <span>{t(ADMIN_CARDS_TEXT_CONSTANT.BTN_ACTIVE)}</span>
                      </>
                    ) : (
                      <>
                        <EyeOff
                          className="h-4 w-4 text-rose-500"
                          aria-hidden="true"
                        />
                        <span>{t(ADMIN_CARDS_TEXT_CONSTANT.BTN_WITHDRAWN)}</span>
                      </>
                    )}
                  </button>
                </td>
                <td className="p-3.5">
                  <div className="flex items-center gap-2">
                    <button
                      id={`${ADMIN_CARDS_SEMANTIC_IDS.CARD_DETAIL_BUTTON_PREFIX}${card.slug}`}
                      type="button"
                      onClick={() => router.push(ROUTES.ADMIN_CARD_DETAIL(locale, card.slug))}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[rgba(103,102,255,0.3)] px-3 text-xs font-bold text-white hover:bg-white/10"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      {t(ADMIN_CARDS_TEXT_CONSTANT.BTN_VIEW)}
                    </button>
                    <button
                      id={`${ADMIN_CARDS_SEMANTIC_IDS.CARD_EDIT_BUTTON_PREFIX}${card.slug}`}
                      type="button"
                      onClick={() => router.push(ROUTES.ADMIN_CARD_EDIT(locale, card.slug))}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[#5856F2] px-3 text-xs font-bold text-white hover:bg-[#6766FF]"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      {t(ADMIN_CARDS_TEXT_CONSTANT.BTN_EDIT)}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

