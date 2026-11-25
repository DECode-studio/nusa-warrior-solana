"use client";

import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useTranslator } from "@/core/translator";
import { ADMIN_TEAM_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { ADMIN_TEAM_TEXT_CONSTANT } from "../constants/TextConstant";
import type { SelectedTeamMember } from "../types";

interface AdminTeamDeleteModalProps {
  readonly isOpen: boolean;
  readonly deletingMember: SelectedTeamMember;
  readonly isDeleting: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => Promise<void>;
}

export function AdminTeamDeleteModal({
  isOpen,
  deletingMember,
  isDeleting,
  onClose,
  onConfirm,
}: AdminTeamDeleteModalProps): React.ReactElement | null {
  const { t } = useTranslator();

  if (!isOpen || !deletingMember) return null;

  return (
    <div
      id={ADMIN_TEAM_SEMANTIC_IDS.DELETE_MODAL}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
      role="alertdialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-rose-500/30 bg-[#07011F] p-6 shadow-2xl">
        <div className="flex items-center gap-3 text-rose-400">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h2 className="font-display text-base font-bold text-white">
            {t(ADMIN_TEAM_TEXT_CONSTANT.DELETE_TITLE)}
          </h2>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-[#B9B5D8]">
          {t(ADMIN_TEAM_TEXT_CONSTANT.DELETE_CONFIRM)}
        </p>

        <div className="mt-3 rounded-xl border border-[rgba(103,102,255,0.2)] bg-[#0E0927] p-3 text-xs">
          <div className="font-semibold text-white">{deletingMember.name}</div>
          <div className="text-[#8E88B6]">{deletingMember.role} • {deletingMember.email}</div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            id={ADMIN_TEAM_SEMANTIC_IDS.DELETE_CANCEL_BTN}
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl border border-[rgba(103,102,255,0.25)] bg-[#1A1245] px-4 py-2 text-xs font-semibold text-[#B9B5D8] hover:bg-[#251A5A] hover:text-white transition-colors"
          >
            {t(ADMIN_TEAM_TEXT_CONSTANT.FORM_CANCEL)}
          </button>
          <button
            id={ADMIN_TEAM_SEMANTIC_IDS.DELETE_CONFIRM_BTN}
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-700 transition-colors disabled:opacity-50"
          >
            {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{t(ADMIN_TEAM_TEXT_CONSTANT.DELETE_BTN)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
