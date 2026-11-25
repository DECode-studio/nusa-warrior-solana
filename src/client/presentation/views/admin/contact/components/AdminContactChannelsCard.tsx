"use client";

import React from "react";
import {
  Clock,
  Edit3,
  Mail,
  MapPin,
  Phone,
  Save,
  X,
} from "lucide-react";
import { Button, InputField } from "@/client/presentation/components/ui";
import { useTranslator } from "@/core/translator";
import { ADMIN_CONTACT_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { ADMIN_CONTACT_TEXT_CONSTANT } from "../constants/TextConstant";
import type { ContactChannels } from "../hooks/useAdminContact";

export interface AdminContactChannelsCardProps {
  readonly channels: ContactChannels;
  readonly isEditing: boolean;
  readonly onToggleEdit: () => void;
  readonly formData: ContactChannels;
  readonly onFormChange: (data: ContactChannels) => void;
  readonly onSave: () => void;
  readonly onCancel: () => void;
}

export function AdminContactChannelsCard({
  channels,
  isEditing,
  onToggleEdit,
  formData,
  onFormChange,
  onSave,
  onCancel,
}: AdminContactChannelsCardProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <section
      id={ADMIN_CONTACT_SEMANTIC_IDS.CHANNELS_CARD}
      className="rounded-[24px] border border-[rgba(103,102,255,0.25)] bg-[#0F0927]/95 p-6 shadow-xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(103,102,255,0.18)] pb-4">
        <div>
          <h2 className="font-display text-lg font-bold text-white">
            {t(ADMIN_CONTACT_TEXT_CONSTANT.CHANNELS_TITLE)}
          </h2>
          <p className="text-xs text-[#CFCBE2]">
            {t(ADMIN_CONTACT_TEXT_CONSTANT.CHANNELS_SUBTITLE)}
          </p>
        </div>

        {!isEditing ? (
          <Button
            id={ADMIN_CONTACT_SEMANTIC_IDS.CHANNELS_EDIT_BTN}
            type="button"
            variant="outline"
            size="sm"
            onClick={onToggleEdit}
            leftIcon={<Edit3 size={14} />}
          >
            {t(ADMIN_CONTACT_TEXT_CONSTANT.BTN_EDIT_CHANNELS)}
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              id={ADMIN_CONTACT_SEMANTIC_IDS.CHANNELS_CANCEL_BTN}
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              leftIcon={<X size={14} />}
            >
              {t(ADMIN_CONTACT_TEXT_CONSTANT.BTN_CANCEL)}
            </Button>
            <Button
              id={ADMIN_CONTACT_SEMANTIC_IDS.CHANNELS_SAVE_BTN}
              type="button"
              size="sm"
              onClick={onSave}
              leftIcon={<Save size={14} />}
            >
              {t(ADMIN_CONTACT_TEXT_CONSTANT.BTN_SAVE_CHANNELS)}
            </Button>
          </div>
        )}
      </div>

      {!isEditing ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div
            id={ADMIN_CONTACT_SEMANTIC_IDS.CHANNELS_EMAIL_DISPLAY}
            className="flex items-start gap-3.5 rounded-2xl bg-[#07011F]/70 p-4 border border-white/5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6766FF]/20 text-[#A9A8FF]">
              <Mail className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-[#A9A8FF] uppercase tracking-wider">
                {t(ADMIN_CONTACT_TEXT_CONSTANT.CHANNELS_EMAIL_LABEL)}
              </p>
              <p className="mt-1 truncate text-xs font-bold text-white">
                {channels.email}
              </p>
            </div>
          </div>

          <div
            id={ADMIN_CONTACT_SEMANTIC_IDS.CHANNELS_PHONE_DISPLAY}
            className="flex items-start gap-3.5 rounded-2xl bg-[#07011F]/70 p-4 border border-white/5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0DB561]/20 text-[#0DB561]">
              <Phone className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-[#0DB561] uppercase tracking-wider">
                {t(ADMIN_CONTACT_TEXT_CONSTANT.CHANNELS_PHONE_LABEL)}
              </p>
              <p className="mt-1 truncate text-xs font-bold text-white">
                {channels.phone}
              </p>
            </div>
          </div>

          <div
            id={ADMIN_CONTACT_SEMANTIC_IDS.CHANNELS_HOURS_DISPLAY}
            className="flex items-start gap-3.5 rounded-2xl bg-[#07011F]/70 p-4 border border-white/5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF9F31]/20 text-[#FF9F31]">
              <Clock className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-[#FF9F31] uppercase tracking-wider">
                {t(ADMIN_CONTACT_TEXT_CONSTANT.CHANNELS_HOURS_LABEL)}
              </p>
              <p className="mt-1 truncate text-xs font-bold text-white">
                {channels.hours}
              </p>
            </div>
          </div>

          <div
            id={ADMIN_CONTACT_SEMANTIC_IDS.CHANNELS_ADDRESS_DISPLAY}
            className="flex items-start gap-3.5 rounded-2xl bg-[#07011F]/70 p-4 border border-white/5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5856F2]/20 text-[#A9A8FF]">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-[#A9A8FF] uppercase tracking-wider">
                {t(ADMIN_CONTACT_TEXT_CONSTANT.CHANNELS_ADDRESS_LABEL)}
              </p>
              <p className="mt-1 text-xs font-medium text-[#CFCBE2] line-clamp-2">
                {channels.address}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <InputField
              id={ADMIN_CONTACT_SEMANTIC_IDS.CHANNELS_EMAIL_INPUT}
              label={t(ADMIN_CONTACT_TEXT_CONSTANT.CHANNELS_EMAIL_LABEL)}
              type="email"
              value={formData.email}
              onChange={(e) =>
                onFormChange({ ...formData, email: e.target.value })
              }
              sizeVariant="sm"
              className="!bg-[#07011F] !font-medium"
          />

          <InputField
              id={ADMIN_CONTACT_SEMANTIC_IDS.CHANNELS_PHONE_INPUT}
              label={t(ADMIN_CONTACT_TEXT_CONSTANT.CHANNELS_PHONE_LABEL)}
              type="text"
              value={formData.phone}
              onChange={(e) =>
                onFormChange({ ...formData, phone: e.target.value })
              }
              sizeVariant="sm"
              className="!bg-[#07011F] !font-medium"
          />

          <InputField
              id={ADMIN_CONTACT_SEMANTIC_IDS.CHANNELS_HOURS_INPUT}
              label={t(ADMIN_CONTACT_TEXT_CONSTANT.CHANNELS_HOURS_LABEL)}
              type="text"
              value={formData.hours}
              onChange={(e) =>
                onFormChange({ ...formData, hours: e.target.value })
              }
              sizeVariant="sm"
              className="!bg-[#07011F] !font-medium"
          />

          <InputField
              id={ADMIN_CONTACT_SEMANTIC_IDS.CHANNELS_ADDRESS_INPUT}
              label={t(ADMIN_CONTACT_TEXT_CONSTANT.CHANNELS_ADDRESS_LABEL)}
              type="text"
              value={formData.address}
              onChange={(e) =>
                onFormChange({ ...formData, address: e.target.value })
              }
              sizeVariant="sm"
              className="!bg-[#07011F] !font-medium"
          />
        </div>
      )}
    </section>
  );
}
