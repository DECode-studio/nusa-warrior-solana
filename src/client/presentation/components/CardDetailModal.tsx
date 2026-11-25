"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  BookOpen,
  ExternalLink,
  Flag,
  Shield,
  Sword,
  AlertCircle,
} from "lucide-react";
import type {
  CardEntity,
  CorrectionCategory,
} from "@/client/domain/card/entity/card_entity";
import { CARD_USECASE_TOKEN } from "@/core/di/tokens";
import { getService } from "@/core/di/container";
import { useTranslator } from "@/core/translator";
import { ApiClientError } from "@/core/http-client/api-client";
import {
  formatKingdomLabel,
  formatRoleLabel,
  formatVerificationBadge,
} from "@/core/utils/formatters";
import { BaseModal } from "./ui/BaseModal";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { InputField } from "./ui/InputField";
import { SelectField } from "./ui/SelectField";
import { TextareaField } from "./ui/TextareaField";
import { InstrumentEffectDescription } from "./InstrumentEffectDescription";

export interface CardDetailModalProps {
  readonly card: CardEntity | null;
  readonly onClose: () => void;
  readonly zIndexClassName?: string;
}

export function CardDetailModal({
  card,
  onClose,
  zIndexClassName = "z-[70]",
}: CardDetailModalProps): React.ReactElement | null {
  const { locale, t } = useTranslator();

  const [showReportForm, setShowReportForm] = useState<boolean>(false);
  const [reporterName, setReporterName] = useState<string>("");
  const [reporterEmail, setReporterEmail] = useState<string>("");
  const [category, setCategory] =
    useState<CorrectionCategory>("HISTORICAL_SOURCE");
  const [description, setDescription] = useState<string>("");
  const [referenceUrl, setReferenceUrl] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  if (!card) {
    return null;
  }

  const historicalSummary =
    locale === "en"
      ? card.historicalSummaryEn
      : locale === "zh"
        ? card.historicalSummaryZh
        : card.historicalSummaryId;

  const effectDescription =
    locale === "en"
      ? card.effectDescriptionEn
      : locale === "zh"
        ? card.effectDescriptionZh
        : card.effectDescriptionId;

  const handleSubmitReport = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    setSubmitting(true);
    setReportError(null);
    try {
      const cardUseCase = getService(CARD_USECASE_TOKEN);
      await cardUseCase.submitCorrectionReport({
        cardSlug: card.slug,
        reporterName,
        reporterEmail: reporterEmail.trim() || null,
        category,
        description,
        referenceUrl: referenceUrl.trim() || null,
      });
      setReportSuccess(t("catalog.detailReportSuccess"));
      setReporterName("");
      setDescription("");
      setReferenceUrl("");
    } catch (err: unknown) {
      setReportError(
        err instanceof ApiClientError ? err.message : t("catalog.detailReportError")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const modalTitle = (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="amber" size="sm">
          {card.code}
        </Badge>
        <Badge variant="neutral" size="sm">
          {formatKingdomLabel(card.kingdom)}
        </Badge>
        <Badge variant="primary" size="sm">
          {formatRoleLabel(card.role)}
        </Badge>
        {card.secondaryRoles.map((sec) => (
          <Badge key={sec} variant="emerald" size="sm">
            +{formatRoleLabel(sec)}
          </Badge>
        ))}
      </div>
      {card.cardType === "INSTRUMENT" && (
        <div className="mt-2 font-display text-lg font-bold text-[#FF9F31] sm:text-xl">
          Detail Waditra
        </div>
      )}
    </div>
  );

  return (
    <BaseModal
      isOpen={Boolean(card)}
      onClose={onClose}
      title={modalTitle}
      size="xl"
      ariaLabel={`Detail Kartu ${card.name}`}
      zIndexClassName={zIndexClassName}
    >
      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        {/* Left Column: Visual & Stats */}
        <div className="flex flex-col items-center md:col-span-5">
          <div className="w-56 overflow-hidden rounded-2xl border border-[#6766FF]/35 bg-[#080220] shadow-[0_12px_32px_rgba(103,102,255,0.15)] sm:w-64">
            <Image
              src={card.imagePath}
              alt={card.name}
              width={512}
              height={720}
              className="h-auto w-full object-cover"
              unoptimized
            />
          </div>

          {card.cardType === "CHARACTER" && (
            <div className="mt-4 flex w-full justify-center gap-6 rounded-xl border border-[#6766FF]/20 bg-[#0F0927] p-3 font-display text-base font-bold">
              <div className="flex items-center gap-2 text-[#FF9F31]">
                <Sword className="h-4 w-4" aria-hidden="true" />
                <span>ATK: {card.baseAttack}</span>
              </div>
              <div className="flex items-center gap-2 text-[#6766FF]">
                <Shield className="h-4 w-4" aria-hidden="true" />
                <span>DEF: {card.baseDefense}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Historical notes & metadata */}
        <div className="space-y-4 md:col-span-7">
          {card.cardType === "INSTRUMENT" && (
            <div className="rounded-xl border border-[#D9AD5D]/35 bg-gradient-to-br from-[#1B1730] to-[#0F0927] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.3)]">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9AD5D]">
                Efek Waditra
              </div>
              <h4 className="mt-2 font-display text-xl font-bold text-white sm:text-2xl">
                {card.effectName ?? "Efek Waditra"}
              </h4>
              <p className="mt-3 text-sm leading-relaxed text-[#F8F5F0]/85">
                {effectDescription ? (
                  <InstrumentEffectDescription text={effectDescription} />
                ) : "Tidak ada deskripsi efek."}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-xl border border-[#0DB561]/35 bg-[#0DB561]/10 px-4 py-3 text-xs text-[#0DB561]">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Status Kurasi Sejarah:{" "}
              <strong className="text-white">
                {formatVerificationBadge(card.verificationStatus)}
              </strong>
            </span>
          </div>

          <div className="rounded-xl border border-[#6766FF]/25 bg-[#0F0927] p-5">
            <h4 className="flex items-center gap-2 font-display text-base font-bold text-[#FF9F31]">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              <span>{t("catalog.historicalNote")}</span>
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-[#F8F5F0]/85">
              {historicalSummary}
            </p>
            <p className="mt-3 border-t border-[#6766FF]/20 pt-2 text-xs italic text-[#F8F5F0]/60">
              Catatan Visual: {card.illustrationNote}
            </p>
          </div>

          <div className="space-y-2.5 rounded-xl border border-white/10 bg-[#0F0927]/60 p-4 text-xs">
            <div>
              <strong className="text-[#F8F5F0]">{t("catalog.source")}: </strong>
              <span className="text-[#F8F5F0]/80">{card.sourceCitation}</span>
            </div>
            {card.sourceUrl && (
              <div>
                <a
                  href={card.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-bold text-[#6766FF] hover:underline"
                >
                  <span>Rujukan Digital Resmi</span>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            )}
            {card.asset && (
              <div className="border-t border-white/10 pt-2 text-xs text-[#F8F5F0]/70">
                <div>
                  <strong className="text-white">Kreator / Ilustrasi:</strong>{" "}
                  {card.asset.creator} ({card.asset.sourceOrigin})
                </div>
                <div>
                  <strong className="text-white">Lisensi Aset:</strong>{" "}
                  {card.asset.licenseType}, Status: {card.asset.approvalStatus}
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Flag className="h-4 w-4 text-[#FF9F31]" />}
              onClick={() => setShowReportForm((prev) => !prev)}
            >
              {t("catalog.reportButton")}
            </Button>

            {showReportForm && (
              <form
                onSubmit={handleSubmitReport}
                className="mt-4 space-y-4 rounded-2xl border border-[#6766FF]/35 bg-[#0F0927] p-5 text-xs"
              >
                <div className="font-display text-base font-bold text-white">
                  Formulir Masukan / Koreksi Sejarah &amp; Budaya
                </div>

                {reportSuccess && (
                  <div
                    role="status"
                    className="flex items-center gap-2 rounded-xl border border-[#0DB561]/40 bg-[#0DB561]/20 p-3 text-xs font-semibold text-[#0DB561]"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{reportSuccess}</span>
                  </div>
                )}
                {reportError && (
                  <div
                    role="alert"
                    className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/20 p-3 text-xs font-semibold text-red-400"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{reportError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InputField
                    label="Nama Pelapor / Komunitas"
                    required
                    minLength={2}
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="Nama Anda atau Komunitas"
                    sizeVariant="sm"
                  />
                  <InputField
                    label="Email (Opsional)"
                    type="email"
                    value={reporterEmail}
                    onChange={(e) => setReporterEmail(e.target.value)}
                    placeholder="email@contoh.id"
                    sizeVariant="sm"
                  />
                </div>

                <SelectField
                  label="Kategori Koreksi"
                  required
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as CorrectionCategory)
                  }
                  sizeVariant="sm"
                  options={[
                    {
                      value: "HISTORICAL_SOURCE",
                      label: "Sumber Prasasti / Naskah Sejarah",
                    },
                    {
                      value: "VISUAL_INTERPRETATION",
                      label: "Interpretasi Visual / Busana / Atribut",
                    },
                    {
                      value: "TERMINOLOGY_TRANSLATION",
                      label: "Istilah Bahasa / Terjemahan (ID/EN/ZH)",
                    },
                    {
                      value: "CULTURAL_SENSITIVITY",
                      label: "Sensitivitas Budaya / Etika Representasi",
                    },
                  ]}
                />

                <TextareaField
                  label="Uraian Koreksi / Masukan"
                  required
                  minLength={10}
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan rujukan prasasti, naskah, atau koreksi budaya..."
                />

                <InputField
                  label="Tautan Referensi Pendukung (Opsional)"
                  type="url"
                  value={referenceUrl}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                  placeholder="https://kebudayaan.kemdikbud.go.id/..."
                  sizeVariant="sm"
                />

                <div className="pt-1">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={submitting}
                  >
                    Kirim Laporan Kuratorial
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
