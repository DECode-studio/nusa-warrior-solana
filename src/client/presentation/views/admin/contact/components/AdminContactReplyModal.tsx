"use client";

import React from "react";
import { Mail, Send } from "lucide-react";
import { BaseModal, Button, TextareaField } from "@/client/presentation/components/ui";
import { useTranslator } from "@/core/translator";
import { ADMIN_CONTACT_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { ADMIN_CONTACT_TEXT_CONSTANT } from "../constants/TextConstant";
import type { ContactInquiry } from "../hooks/useAdminContact";

export interface AdminContactReplyModalProps {
  readonly inquiry: ContactInquiry | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly replyText: string;
  readonly onReplyChange: (text: string) => void;
  readonly onSubmitReply: () => void;
}

export function AdminContactReplyModal({
  inquiry,
  isOpen,
  onClose,
  replyText,
  onReplyChange,
  onSubmitReply,
}: AdminContactReplyModalProps): React.ReactElement | null {
  const { t } = useTranslator();

  if (!inquiry) return null;

  const modalTitle = (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6766FF]/20 text-[#A9A8FF]">
        <Mail className="h-5 w-5" />
      </div>
      <div>
        <h3 className="font-display text-lg font-bold text-white">
          {t(ADMIN_CONTACT_TEXT_CONSTANT.REPLY_TITLE)}
        </h3>
        <p className="text-xs text-[#CFCBE2]">
          {t(ADMIN_CONTACT_TEXT_CONSTANT.REPLY_FROM_LABEL)}{" "}
          <span className="font-semibold text-white">
            {inquiry.senderName}
          </span>{" "}
          ({inquiry.senderEmail})
        </p>
      </div>
    </div>
  );

  const modalFooter = (
    <>
      <Button
        id={ADMIN_CONTACT_SEMANTIC_IDS.REPLY_MODAL_CANCEL_BTN}
        type="button"
        variant="outline"
        size="sm"
        onClick={onClose}
      >
        {t(ADMIN_CONTACT_TEXT_CONSTANT.BTN_CANCEL)}
      </Button>
      <Button
        id={ADMIN_CONTACT_SEMANTIC_IDS.REPLY_SUBMIT_BTN}
        type="button"
        size="sm"
        onClick={onSubmitReply}
        leftIcon={<Send size={14} />}
      >
        {t(ADMIN_CONTACT_TEXT_CONSTANT.REPLY_SUBMIT)}
      </Button>
    </>
  );

  return (
    <BaseModal
      id={ADMIN_CONTACT_SEMANTIC_IDS.REPLY_MODAL}
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="md"
      footer={modalFooter}
    >
      <div className="space-y-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#A9A8FF]">
            {t(ADMIN_CONTACT_TEXT_CONSTANT.SUBJECT_LABEL)}
          </span>
          <p className="mt-0.5 text-sm font-semibold text-white">
            {inquiry.subject}
          </p>
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#A9A8FF]">
            {t(ADMIN_CONTACT_TEXT_CONSTANT.MESSAGE_CONTENT_LABEL)}
          </span>
          <div className="mt-1 max-h-48 overflow-y-auto rounded-xl bg-[#07011F] p-3 text-xs leading-relaxed text-[#F8F5F0] border border-white/5">
            {inquiry.message}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#A9A8FF]">
            {t(ADMIN_CONTACT_TEXT_CONSTANT.REPLY_NOTE_LABEL)}
          </label>
          <TextareaField
            id={ADMIN_CONTACT_SEMANTIC_IDS.REPLY_TEXTAREA}
            aria-label={t(ADMIN_CONTACT_TEXT_CONSTANT.REPLY_NOTE_LABEL)}
            rows={4}
            value={replyText}
            onChange={(e) => onReplyChange(e.target.value)}
            placeholder={t(ADMIN_CONTACT_TEXT_CONSTANT.REPLY_PLACEHOLDER)}
            className="!mt-1.5 !bg-[#07011F] !p-3 !text-xs"
          />
        </div>
      </div>
    </BaseModal>
  );
}
