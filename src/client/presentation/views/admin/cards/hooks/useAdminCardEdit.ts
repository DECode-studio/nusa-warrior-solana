"use client";

import { useCallback, useEffect, useState } from "react";
import type { UpdateCardCurationRequest } from "@/client/domain/auth/entity/user_entity";
import { getService } from "@/core/di/container";
import { AUTH_USECASE_TOKEN } from "@/core/di/tokens";
import { ROUTES } from "@/core/constants/routes";
import { useRouter } from "next/navigation";
import { useTranslator } from "@/core/translator";
import { useAdminCardRecord } from "./useAdminCardRecord";
import { ADMIN_CARDS_TEXT_CONSTANT } from "../constants/TextConstant";

export type EditableCardFields = {
  sourceCitation: string;
  sourceUrl: string;
  creator: string;
  licenseType: string;
  verificationStatus: "VERIFIED" | "VISUAL_INTERPRETATION" | "PENDING_REVIEW";
  publicationStatus: "ACTIVE" | "WITHDRAWN";
  approvalStatus: "APPROVED" | "PENDING" | "WITHDRAWN";
  historicalSummaryId: string;
  historicalSummaryEn: string;
  historicalSummaryZh: string;
  effectName: string;
  effectDescriptionId: string;
  effectDescriptionEn: string;
  effectDescriptionZh: string;
};

export function useAdminCardEdit(slug: string) {
  const { locale } = useTranslator();
  const router = useRouter();
  const record = useAdminCardRecord(slug);
  const [fields, setFields] = useState<EditableCardFields | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const { card } = record;
    if (!card) return;
    setFields({
      sourceCitation: card.sourceCitation,
      sourceUrl: card.sourceUrl ?? "",
      creator: card.asset?.creator ?? "",
      licenseType: card.asset?.licenseType ?? "",
      verificationStatus: card.verificationStatus === "NEEDS_REVIEW" ? "PENDING_REVIEW" : card.verificationStatus,
      publicationStatus: card.publicationStatus === "WITHDRAWN" ? "WITHDRAWN" : "ACTIVE",
      approvalStatus: card.asset?.approvalStatus === "PLACEHOLDER" || card.asset?.approvalStatus === "NEEDS_PERMISSION"
        ? "PENDING"
        : card.asset?.approvalStatus ?? "APPROVED",
      historicalSummaryId: card.historicalSummaryId ?? "",
      historicalSummaryEn: card.historicalSummaryEn ?? "",
      historicalSummaryZh: card.historicalSummaryZh ?? "",
      effectName: card.effectName ?? "",
      effectDescriptionId: card.effectDescriptionId ?? "",
      effectDescriptionEn: card.effectDescriptionEn ?? "",
      effectDescriptionZh: card.effectDescriptionZh ?? "",
    });
  }, [record.card]);

  const change = useCallback(<K extends keyof EditableCardFields>(
    key: K,
    value: EditableCardFields[K]
  ): void => {
    setFields((current) => current ? { ...current, [key]: value } : current);
  }, []);

  const submit = useCallback(async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const { card } = record;
    if (!card || !fields) return;
    setSaving(true);
    setFeedback(null);
    try {
      const request: UpdateCardCurationRequest = {
        cardSlug: card.slug,
        sourceCitation: fields.sourceCitation.trim(),
        sourceUrl: fields.sourceUrl.trim() || null,
        verificationStatus: fields.verificationStatus,
        publicationStatus: fields.publicationStatus,
        historicalSummaryId: fields.historicalSummaryId.trim(),
        historicalSummaryEn: fields.historicalSummaryEn.trim(),
        historicalSummaryZh: fields.historicalSummaryZh.trim(),
        effectName: fields.effectName.trim() || null,
        effectDescriptionId: fields.effectDescriptionId.trim() || null,
        effectDescriptionEn: fields.effectDescriptionEn.trim() || null,
        effectDescriptionZh: fields.effectDescriptionZh.trim() || null,
        ...(card.asset ? {
          creator: fields.creator.trim(),
          licenseType: fields.licenseType.trim(),
          approvalStatus: fields.approvalStatus,
        } : {}),
      };
      await getService(AUTH_USECASE_TOKEN).updateCardCuration(request);
      router.push(ROUTES.ADMIN_CARD_DETAIL(locale, card.slug));
    } catch (cause: unknown) {
      setFeedback(cause instanceof Error ? cause.message : ADMIN_CARDS_TEXT_CONSTANT.SAVE_ERROR);
    } finally {
      setSaving(false);
    }
  }, [fields, locale, record, router]);

  return { ...record, fields, saving, feedback, change, submit };
}
