"use client";

import React from "react";
import {
  CheckCircle2,
  Clock,
  Eye,
  Inbox,
  Mail,
  MessageSquare,
  Search,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Button, InputField } from "@/client/presentation/components/ui";
import { useTranslator } from "@/core/translator";
import { ADMIN_CONTACT_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { ADMIN_CONTACT_TEXT_CONSTANT } from "../constants/TextConstant";
import type {
  ContactInquiry,
  ContactInquiryCategory,
  ContactInquiryStatus,
} from "../hooks/useAdminContact";

export interface AdminContactInquiriesListProps {
  readonly inquiries: readonly ContactInquiry[];
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
  readonly activeTab: "ALL" | ContactInquiryStatus;
  readonly onTabChange: (tab: "ALL" | ContactInquiryStatus) => void;
  readonly onOpenReply: (inquiry: ContactInquiry) => void;
  readonly onUpdateStatus: (
    id: string,
    status: ContactInquiryStatus,
    note?: string | null
  ) => void;
}

export function AdminContactInquiriesList({
  inquiries,
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  onOpenReply,
  onUpdateStatus,
}: AdminContactInquiriesListProps): React.ReactElement {
  const { t } = useTranslator();

  const getCategoryBadge = (
    category: ContactInquiryCategory
  ): React.ReactElement => {
    switch (category) {
      case "HISTORY_INQUIRY":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-[#6766FF]/35 bg-[#6766FF]/15 px-2 py-0.5 text-[10px] font-bold text-[#A9A8FF]">
            <Sparkles className="h-3 w-3" />
            <span>{t(ADMIN_CONTACT_TEXT_CONSTANT.CAT_HISTORY)}</span>
          </span>
        );
      case "BUG_REPORT":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/35 bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-300">
            <ShieldAlert className="h-3 w-3" />
            <span>{t(ADMIN_CONTACT_TEXT_CONSTANT.CAT_BUG)}</span>
          </span>
        );
      case "PARTNERSHIP":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-[#0DB561]/35 bg-[#0DB561]/15 px-2 py-0.5 text-[10px] font-bold text-[#3CE089]">
            <CheckCircle2 className="h-3 w-3" />
            <span>{t(ADMIN_CONTACT_TEXT_CONSTANT.CAT_PARTNERSHIP)}</span>
          </span>
        );
      case "ASSET_PERMISSION":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-[#FF9F31]/35 bg-[#FF9F31]/15 px-2 py-0.5 text-[10px] font-bold text-[#FF9F31]">
            <Inbox className="h-3 w-3" />
            <span>{t(ADMIN_CONTACT_TEXT_CONSTANT.CAT_ASSET)}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/90">
            <MessageSquare className="h-3 w-3" />
            <span>{t(ADMIN_CONTACT_TEXT_CONSTANT.CAT_GENERAL)}</span>
          </span>
        );
    }
  };

  const getStatusBadge = (
    status: ContactInquiryStatus
  ): React.ReactElement => {
    switch (status) {
      case "NEW":
        return (
          <span className="rounded-full border border-[#FF9F31]/40 bg-[#FF9F31]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#FF9F31]">
            {t(ADMIN_CONTACT_TEXT_CONSTANT.STATUS_NEW)}
          </span>
        );
      case "REVIEWED":
        return (
          <span className="rounded-full border border-[#6766FF]/40 bg-[#6766FF]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#A9A8FF]">
            {t(ADMIN_CONTACT_TEXT_CONSTANT.STATUS_REVIEWED)}
          </span>
        );
      case "RESOLVED":
        return (
          <span className="rounded-full border border-[#0DB561]/40 bg-[#0DB561]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#3CE089]">
            {t(ADMIN_CONTACT_TEXT_CONSTANT.STATUS_RESOLVED)}
          </span>
        );
    }
  };

  return (
    <section
      id={ADMIN_CONTACT_SEMANTIC_IDS.INQUIRIES_LIST}
      className="space-y-5 rounded-[24px] border border-[rgba(103,102,255,0.25)] bg-[#0F0927]/95 p-6 shadow-xl"
    >
      {/* List Header and Controls */}
      <div className="flex flex-col gap-4 border-b border-[rgba(103,102,255,0.18)] pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-white">
            {t(ADMIN_CONTACT_TEXT_CONSTANT.INQUIRIES_TITLE)}
          </h2>
          <p className="text-xs text-[#CFCBE2]">
            {t(ADMIN_CONTACT_TEXT_CONSTANT.INQUIRIES_SUBTITLE)}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <InputField
            id={ADMIN_CONTACT_SEMANTIC_IDS.SEARCH_INPUT}
            aria-label={t(ADMIN_CONTACT_TEXT_CONSTANT.SEARCH_ARIA)}
            type="text"
            placeholder={t(ADMIN_CONTACT_TEXT_CONSTANT.SEARCH_PLACEHOLDER)}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            leftIcon={<Search className="h-4 w-4 text-[#CFCBE2]" aria-hidden="true" />}
            sizeVariant="sm"
            className="!bg-[#07011F] !pr-3"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(
          [
            [
              "ALL",
              ADMIN_CONTACT_TEXT_CONSTANT.TAB_ALL,
              ADMIN_CONTACT_SEMANTIC_IDS.TAB_ALL,
            ],
            [
              "NEW",
              ADMIN_CONTACT_TEXT_CONSTANT.TAB_NEW,
              ADMIN_CONTACT_SEMANTIC_IDS.TAB_NEW,
            ],
            [
              "REVIEWED",
              ADMIN_CONTACT_TEXT_CONSTANT.TAB_REVIEWED,
              ADMIN_CONTACT_SEMANTIC_IDS.TAB_REVIEWED,
            ],
            [
              "RESOLVED",
              ADMIN_CONTACT_TEXT_CONSTANT.TAB_RESOLVED,
              ADMIN_CONTACT_SEMANTIC_IDS.TAB_RESOLVED,
            ],
          ] as const
        ).map(([tabKey, tabLabelKey, tabId]) => (
          <button
            key={tabKey}
            id={tabId}
            type="button"
            onClick={() => onTabChange(tabKey)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === tabKey
                ? "bg-[#6766FF] text-white shadow-xs"
                : "border border-white/5 bg-[#07011F]/80 text-[#CFCBE2] hover:text-white"
            }`}
          >
            {t(tabLabelKey)}
          </button>
        ))}
      </div>

      {/* Inquiries List */}
      {inquiries.length === 0 ? (
        <div
          id={ADMIN_CONTACT_SEMANTIC_IDS.INQUIRIES_EMPTY}
          className="rounded-2xl border border-[rgba(103,102,255,0.18)] bg-[#07011F]/60 p-12 text-center"
        >
          <Mail className="mx-auto mb-3 h-10 w-10 text-[#6766FF]/60" />
          <p className="font-display text-base font-bold text-white">
            {t(ADMIN_CONTACT_TEXT_CONSTANT.EMPTY_TITLE)}
          </p>
          <p className="mt-1 text-xs text-[#CFCBE2]">
            {t(ADMIN_CONTACT_TEXT_CONSTANT.EMPTY_SUBTITLE)}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {inquiries.map((inquiry) => (
            <div
              key={inquiry.id}
              id={`${ADMIN_CONTACT_SEMANTIC_IDS.INQUIRY_ITEM_PREFIX}${inquiry.id}`}
              className="rounded-2xl border border-[rgba(103,102,255,0.18)] bg-[#07011F]/80 p-5 transition hover:border-[#6766FF]/60"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {getCategoryBadge(inquiry.category)}
                    {getStatusBadge(inquiry.status)}
                    <span className="flex items-center gap-1 text-[11px] text-[#A5A1B9]">
                      <Clock className="h-3 w-3" />
                      {new Date(inquiry.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <h3 className="mt-2 font-display text-base font-bold text-white">
                    {inquiry.subject}
                  </h3>

                  <p className="mt-1 text-xs font-semibold text-[#A9A8FF]">
                    {inquiry.senderName}{" "}
                    <span className="font-normal text-[#CFCBE2]">
                      ({inquiry.senderEmail})
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    id={`${ADMIN_CONTACT_SEMANTIC_IDS.INQUIRY_DETAIL_BTN_PREFIX}${inquiry.id}`}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenReply(inquiry)}
                    leftIcon={<Eye size={14} />}
                  >
                    {t(ADMIN_CONTACT_TEXT_CONSTANT.BTN_DETAIL)}
                  </Button>
                  {inquiry.status === "NEW" && (
                    <Button
                      id={`${ADMIN_CONTACT_SEMANTIC_IDS.INQUIRY_REVIEW_BTN_PREFIX}${inquiry.id}`}
                      type="button"
                      size="sm"
                      onClick={() => onUpdateStatus(inquiry.id, "REVIEWED")}
                    >
                      {t(ADMIN_CONTACT_TEXT_CONSTANT.BTN_MARK_REVIEWED)}
                    </Button>
                  )}
                  {inquiry.status !== "RESOLVED" && (
                    <Button
                      id={`${ADMIN_CONTACT_SEMANTIC_IDS.INQUIRY_RESOLVE_BTN_PREFIX}${inquiry.id}`}
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onUpdateStatus(inquiry.id, "RESOLVED")}
                    >
                      {t(ADMIN_CONTACT_TEXT_CONSTANT.BTN_MARK_RESOLVED)}
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-[#0F0927]/80 p-3.5 border border-white/5">
                <p className="text-xs leading-relaxed text-[#F8F5F0]">
                  {inquiry.message}
                </p>
              </div>

              {inquiry.replyNote && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-[#0DB561]/25 bg-[#0DB561]/10 p-3 text-xs text-[#3CE089]">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">
                      {t(ADMIN_CONTACT_TEXT_CONSTANT.NOTE_LABEL)}
                    </span>{" "}
                    {inquiry.replyNote}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
