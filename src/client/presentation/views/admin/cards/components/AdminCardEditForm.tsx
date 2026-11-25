"use client";

import React from "react";
import { Save } from "lucide-react";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import {
  Button,
  InputField,
  TextareaField,
} from "@/client/presentation/components/ui";
import { useTranslator } from "@/core/translator";
import type { EditableCardFields } from "../hooks/useAdminCardEdit";
import { ADMIN_CARDS_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { ADMIN_CARDS_TEXT_CONSTANT } from "../constants/TextConstant";

const fieldClassName =
  "mt-1 w-full rounded-xl border border-[rgba(103,102,255,0.3)] bg-[#07011F] px-3 py-2.5 text-sm text-white outline-none focus:border-[#A9A8FF]";

export interface AdminCardEditFormProps {
  readonly card: CardEntity;
  readonly fields: EditableCardFields;
  readonly saving: boolean;
  readonly feedback: string | null;
  readonly cancelHref: string;
  readonly onChange: <K extends keyof EditableCardFields>(
    key: K,
    value: EditableCardFields[K]
  ) => void;
  readonly onSubmit: (
    event: React.FormEvent<HTMLFormElement>
  ) => Promise<void>;
}

export function AdminCardEditForm({
  card,
  fields,
  saving,
  feedback,
  cancelHref,
  onChange,
  onSubmit,
}: AdminCardEditFormProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <form
      id={ADMIN_CARDS_SEMANTIC_IDS.EDIT_FORM}
      onSubmit={(event) => void onSubmit(event)}
      className="space-y-6 rounded-3xl border border-[rgba(103,102,255,0.25)] bg-[#0F0927] p-6 text-white"
    >
      <section
        id={ADMIN_CARDS_SEMANTIC_IDS.EDIT_SECTION_HISTORY}
        className="space-y-4 rounded-2xl border border-[rgba(103,102,255,0.2)] bg-[#07011F]/50 p-5"
      >
        <div className="border-b border-[rgba(103,102,255,0.15)] pb-2">
          <h2 className="font-display text-base font-bold text-[#A9A8FF]">
            {t(ADMIN_CARDS_TEXT_CONSTANT.EDIT_HISTORY_TITLE)}
          </h2>
          <p className="text-xs text-[#CFCBE2]">
            {t(ADMIN_CARDS_TEXT_CONSTANT.EDIT_HISTORY_DESCRIPTION)}
          </p>
        </div>
        <TextareaField
            id={ADMIN_CARDS_SEMANTIC_IDS.EDIT_FIELD_HISTORY_ID}
            label={t(ADMIN_CARDS_TEXT_CONSTANT.EDIT_HISTORY_ID_LABEL)}
            required
            minLength={2}
            maxLength={4000}
            rows={3}
            value={fields.historicalSummaryId}
            onChange={(event) => onChange("historicalSummaryId", event.target.value)}
            className="!mt-0 !bg-[#07011F] !px-3 !py-2.5 !text-sm"
            placeholder={t(ADMIN_CARDS_TEXT_CONSTANT.EDIT_HISTORY_ID_PLACEHOLDER)}
        />
        <TextareaField
            id={ADMIN_CARDS_SEMANTIC_IDS.EDIT_FIELD_HISTORY_EN}
            label={t(ADMIN_CARDS_TEXT_CONSTANT.EDIT_HISTORY_EN_LABEL)}
            required
            minLength={2}
            maxLength={4000}
            rows={3}
            value={fields.historicalSummaryEn}
            onChange={(event) => onChange("historicalSummaryEn", event.target.value)}
            className="!mt-0 !bg-[#07011F] !px-3 !py-2.5 !text-sm"
            placeholder={t(ADMIN_CARDS_TEXT_CONSTANT.EDIT_HISTORY_EN_PLACEHOLDER)}
        />
        <TextareaField
            id={ADMIN_CARDS_SEMANTIC_IDS.EDIT_FIELD_HISTORY_ZH}
            label={t(ADMIN_CARDS_TEXT_CONSTANT.EDIT_HISTORY_ZH_LABEL)}
            required
            minLength={2}
            maxLength={4000}
            rows={3}
            value={fields.historicalSummaryZh}
            onChange={(event) => onChange("historicalSummaryZh", event.target.value)}
            className="!mt-0 !bg-[#07011F] !px-3 !py-2.5 !text-sm"
            placeholder={t(ADMIN_CARDS_TEXT_CONSTANT.EDIT_HISTORY_ZH_PLACEHOLDER)}
        />
      </section>

      <section
        id={ADMIN_CARDS_SEMANTIC_IDS.EDIT_SECTION_EFFECT}
        className="space-y-4 rounded-2xl border border-[rgba(103,102,255,0.2)] bg-[#07011F]/50 p-5"
      >
        <div className="border-b border-[rgba(103,102,255,0.15)] pb-2">
          <h2 className="font-display text-base font-bold text-[#A9A8FF]">
            {t(ADMIN_CARDS_TEXT_CONSTANT.EDIT_EFFECT_TITLE)}
          </h2>
          <p className="text-xs text-[#CFCBE2]">
            {t(ADMIN_CARDS_TEXT_CONSTANT.EDIT_EFFECT_DESCRIPTION)}
          </p>
        </div>
        <InputField
            id={ADMIN_CARDS_SEMANTIC_IDS.EDIT_FIELD_EFFECT_NAME}
            label={t(ADMIN_CARDS_TEXT_CONSTANT.EDIT_EFFECT_NAME_LABEL)}
            type="text"
            maxLength={100}
            value={fields.effectName}
            onChange={(event) => onChange("effectName", event.target.value)}
            className="!mt-0 !bg-[#07011F] !px-3 !py-2.5 !text-sm"
            placeholder={t(ADMIN_CARDS_TEXT_CONSTANT.EDIT_EFFECT_NAME_PLACEHOLDER)}
        />
        <div className="grid gap-4 md:grid-cols-3">
          <TextareaField
              id={ADMIN_CARDS_SEMANTIC_IDS.EDIT_FIELD_EFFECT_ID}
              label={t(ADMIN_CARDS_TEXT_CONSTANT.EDIT_EFFECT_ID_LABEL)}
              maxLength={4000}
              rows={3}
              value={fields.effectDescriptionId}
              onChange={(event) => onChange("effectDescriptionId", event.target.value)}
              className="!mt-0 !bg-[#07011F] !px-3 !py-2.5 !text-sm"
              placeholder={t(ADMIN_CARDS_TEXT_CONSTANT.EDIT_EFFECT_ID_PLACEHOLDER)}
          />
          <TextareaField
              id={ADMIN_CARDS_SEMANTIC_IDS.EDIT_FIELD_EFFECT_EN}
              label={t(ADMIN_CARDS_TEXT_CONSTANT.EDIT_EFFECT_EN_LABEL)}
              maxLength={4000}
              rows={3}
              value={fields.effectDescriptionEn}
              onChange={(event) => onChange("effectDescriptionEn", event.target.value)}
              className="!mt-0 !bg-[#07011F] !px-3 !py-2.5 !text-sm"
              placeholder={t(ADMIN_CARDS_TEXT_CONSTANT.EDIT_EFFECT_EN_PLACEHOLDER)}
          />
          <TextareaField
              id={ADMIN_CARDS_SEMANTIC_IDS.EDIT_FIELD_EFFECT_ZH}
              label={t(ADMIN_CARDS_TEXT_CONSTANT.EDIT_EFFECT_ZH_LABEL)}
              maxLength={4000}
              rows={3}
              value={fields.effectDescriptionZh}
              onChange={(event) => onChange("effectDescriptionZh", event.target.value)}
              className="!mt-0 !bg-[#07011F] !px-3 !py-2.5 !text-sm"
              placeholder={t(ADMIN_CARDS_TEXT_CONSTANT.EDIT_EFFECT_ZH_PLACEHOLDER)}
          />
        </div>
      </section>

      <section
        id={ADMIN_CARDS_SEMANTIC_IDS.EDIT_SECTION_SOURCE}
        className="space-y-4 rounded-2xl border border-[rgba(103,102,255,0.2)] bg-[#07011F]/50 p-5"
      >
        <div className="border-b border-[rgba(103,102,255,0.15)] pb-2">
          <h2 className="font-display text-base font-bold text-[#A9A8FF]">
            {t(ADMIN_CARDS_TEXT_CONSTANT.EDIT_SOURCE_TITLE)}
          </h2>
          <p className="text-xs text-[#CFCBE2]">
            {t(ADMIN_CARDS_TEXT_CONSTANT.EDIT_SOURCE_DESCRIPTION)}
          </p>
        </div>
        <TextareaField
            id={ADMIN_CARDS_SEMANTIC_IDS.EDIT_FIELD_SOURCE_CITATION}
            label={t(ADMIN_CARDS_TEXT_CONSTANT.EDIT_SOURCE_CITATION_LABEL)}
            required
            minLength={2}
            maxLength={4000}
            rows={3}
            value={fields.sourceCitation}
            onChange={(event) => onChange("sourceCitation", event.target.value)}
            className="!mt-0 !bg-[#07011F] !px-3 !py-2.5 !text-sm"
            placeholder={t(ADMIN_CARDS_TEXT_CONSTANT.EDIT_SOURCE_CITATION_PLACEHOLDER)}
        />
        <InputField
            id={ADMIN_CARDS_SEMANTIC_IDS.EDIT_FIELD_SOURCE_URL}
            label={t(ADMIN_CARDS_TEXT_CONSTANT.EDIT_SOURCE_URL_LABEL)}
            type="url"
            value={fields.sourceUrl}
            onChange={(event) => onChange("sourceUrl", event.target.value)}
            className="!mt-0 !bg-[#07011F] !px-3 !py-2.5 !text-sm"
            placeholder={t(ADMIN_CARDS_TEXT_CONSTANT.EDIT_SOURCE_URL_PLACEHOLDER)}
        />
      </section>

      <section
        id={ADMIN_CARDS_SEMANTIC_IDS.EDIT_SECTION_CURATION}
        className="space-y-4 rounded-2xl border border-[rgba(103,102,255,0.2)] bg-[#07011F]/50 p-5"
      >
        <div className="border-b border-[rgba(103,102,255,0.15)] pb-2">
          <h2 className="font-display text-base font-bold text-[#A9A8FF]">
            {t(ADMIN_CARDS_TEXT_CONSTANT.EDIT_CURATION_TITLE)}
          </h2>
          <p className="text-xs text-[#CFCBE2]">
            {t(ADMIN_CARDS_TEXT_CONSTANT.EDIT_CURATION_DESCRIPTION)}
          </p>
        </div>
        {card.asset && (
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
                id={ADMIN_CARDS_SEMANTIC_IDS.EDIT_FIELD_ASSET_CREATOR}
                label={t(ADMIN_CARDS_TEXT_CONSTANT.EDIT_ASSET_CREATOR_LABEL)}
                required
                minLength={2}
                value={fields.creator}
                onChange={(event) => onChange("creator", event.target.value)}
                className="!mt-0 !bg-[#07011F] !px-3 !py-2.5 !text-sm"
            />
            <InputField
                id={ADMIN_CARDS_SEMANTIC_IDS.EDIT_FIELD_ASSET_LICENSE}
                label={t(ADMIN_CARDS_TEXT_CONSTANT.EDIT_ASSET_LICENSE_LABEL)}
                required
                minLength={2}
                value={fields.licenseType}
                onChange={(event) => onChange("licenseType", event.target.value)}
                className="!mt-0 !bg-[#07011F] !px-3 !py-2.5 !text-sm"
            />
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <label
            htmlFor={ADMIN_CARDS_SEMANTIC_IDS.EDIT_FIELD_VERIFICATION}
            className="block text-sm font-semibold"
          >
            {t(ADMIN_CARDS_TEXT_CONSTANT.EDIT_VERIFICATION_LABEL)}
            <select
              id={ADMIN_CARDS_SEMANTIC_IDS.EDIT_FIELD_VERIFICATION}
              value={fields.verificationStatus}
              onChange={(event) => onChange("verificationStatus", event.target.value as EditableCardFields["verificationStatus"])}
              className={fieldClassName}
            >
              <option value="VERIFIED">{t(ADMIN_CARDS_TEXT_CONSTANT.OPT_VERIFIED)}</option>
              <option value="VISUAL_INTERPRETATION">{t(ADMIN_CARDS_TEXT_CONSTANT.OPT_VISUAL)}</option>
              <option value="PENDING_REVIEW">{t(ADMIN_CARDS_TEXT_CONSTANT.OPT_PENDING)}</option>
            </select>
          </label>
          <label
            htmlFor={ADMIN_CARDS_SEMANTIC_IDS.EDIT_FIELD_PUBLICATION}
            className="block text-sm font-semibold"
          >
            {t(ADMIN_CARDS_TEXT_CONSTANT.EDIT_PUBLICATION_LABEL)}
            <select
              id={ADMIN_CARDS_SEMANTIC_IDS.EDIT_FIELD_PUBLICATION}
              value={fields.publicationStatus}
              onChange={(event) => onChange("publicationStatus", event.target.value as EditableCardFields["publicationStatus"])}
              className={fieldClassName}
            >
              <option value="ACTIVE">{t(ADMIN_CARDS_TEXT_CONSTANT.OPT_ACTIVE)}</option>
              <option value="WITHDRAWN">{t(ADMIN_CARDS_TEXT_CONSTANT.OPT_WITHDRAWN)}</option>
            </select>
          </label>
          {card.asset && (
            <label
              htmlFor={ADMIN_CARDS_SEMANTIC_IDS.EDIT_FIELD_APPROVAL}
              className="block text-sm font-semibold"
            >
              {t(ADMIN_CARDS_TEXT_CONSTANT.EDIT_APPROVAL_LABEL)}
              <select
                id={ADMIN_CARDS_SEMANTIC_IDS.EDIT_FIELD_APPROVAL}
                value={fields.approvalStatus}
                onChange={(event) => onChange("approvalStatus", event.target.value as EditableCardFields["approvalStatus"])}
                className={fieldClassName}
              >
                <option value="APPROVED">{t(ADMIN_CARDS_TEXT_CONSTANT.OPT_APPROVED)}</option>
                <option value="PENDING">{t(ADMIN_CARDS_TEXT_CONSTANT.OPT_APPROVAL_PENDING)}</option>
                <option value="WITHDRAWN">{t(ADMIN_CARDS_TEXT_CONSTANT.OPT_WITHDRAWN)}</option>
              </select>
            </label>
          )}
        </div>
      </section>

      {feedback && (
        <p
          id={ADMIN_CARDS_SEMANTIC_IDS.EDIT_FEEDBACK}
          role="alert"
          className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200"
        >
          {t(feedback)}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button
          id={ADMIN_CARDS_SEMANTIC_IDS.EDIT_CANCEL_BUTTON}
          href={cancelHref}
          variant="outline"
        >
          {t(ADMIN_CARDS_TEXT_CONSTANT.BTN_CANCEL)}
        </Button>
        <Button
          id={ADMIN_CARDS_SEMANTIC_IDS.EDIT_SAVE_BUTTON}
          type="submit"
          isLoading={saving}
          disabled={saving}
          leftIcon={<Save size={16} />}
        >
          {t(ADMIN_CARDS_TEXT_CONSTANT.BTN_SAVE)}
        </Button>
      </div>
    </form>
  );
}
