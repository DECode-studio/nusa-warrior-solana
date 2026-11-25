"use client";

import React from "react";
import Image from "next/image";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/client/presentation/components/ui";
import { ROUTES } from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";
import { formatKingdomLabel, formatRoleLabel } from "@/core/utils/formatters";
import { useAdminCardRecord } from "./hooks/useAdminCardRecord";
import { ADMIN_CARDS_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { ADMIN_CARDS_TEXT_CONSTANT } from "./constants/TextConstant";

export function AdminCardDetailView({ slug }: { readonly slug: string }): React.ReactElement {
  const { locale, t } = useTranslator();
  const { card, loading, error } = useAdminCardRecord(slug);

  if (loading) return <p id={ADMIN_CARDS_SEMANTIC_IDS.DETAIL_LOADING} className="text-sm text-[#CFCBE2]">{t(ADMIN_CARDS_TEXT_CONSTANT.DETAIL_LOADING)}</p>;
  if (error || !card) {
    return (
      <section id={ADMIN_CARDS_SEMANTIC_IDS.DETAIL_ERROR} className="space-y-4 rounded-3xl border border-rose-400/30 bg-[#0F0927] p-6 text-white">
        <p>{error ? t(error) : t(ADMIN_CARDS_TEXT_CONSTANT.RECORD_NOT_FOUND)}</p>
        <Button href={ROUTES.ADMIN_CARDS(locale)} variant="outline" leftIcon={<ArrowLeft size={16} />}>Kembali ke daftar</Button>
      </section>
    );
  }

  const rows: Array<[string, React.ReactNode]> = [
    ["Kode / slug", `${card.code} · ${card.slug}`],
    ["Jenis kartu", card.cardType],
    ["Kerajaan", formatKingdomLabel(card.kingdom)],
    ["Peran", formatRoleLabel(card.role)],
    ["Peran tambahan", card.secondaryRoles.map(formatRoleLabel).join(", ") || "—"],
    ["Gender", card.gender],
    ["ATK / DEF dasar", `${card.baseAttack} / ${card.baseDefense}`],
    ["Modifikasi ATK / DEF", `${card.attackMod} / ${card.defenseMod}`],
    ["Modifikasi ATK lawan", card.enemyAttackMod],
    ["Pertahanan yang diabaikan", card.ignoreDefenseAmount],
    ["Afinitas peran", card.affinityRole ? formatRoleLabel(card.affinityRole) : "—"],
    ["Afinitas gender", card.affinityGender ?? "—"],
    ["Bonus afinitas ATK / DEF", `${card.affinityBonusAtk} / ${card.affinityBonusDef}`],
    ["Nama efek", card.effectName ?? "—"],
    ["Tipe efek", card.effectType ?? "—"],
    ["Efek (ID)", card.effectDescriptionId ?? "—"],
    ["Efek (EN)", card.effectDescriptionEn ?? "—"],
    ["Efek (ZH)", card.effectDescriptionZh ?? "—"],
    ["Ringkasan sejarah (ID)", card.historicalSummaryId],
    ["Ringkasan sejarah (EN)", card.historicalSummaryEn],
    ["Ringkasan sejarah (ZH)", card.historicalSummaryZh],
    ["Catatan ilustrasi", card.illustrationNote],
    ["Path ilustrasi", card.imagePath],
    ["Sitasi sumber", card.sourceCitation],
    ["URL sumber", card.sourceUrl ? <a className="text-[#A9A8FF] underline" href={card.sourceUrl} target="_blank" rel="noreferrer">{card.sourceUrl}</a> : "—"],
    ["Verifikasi", card.verificationStatus],
    ["Publikasi", card.publicationStatus],
    ["Kreator aset", card.asset?.creator ?? "—"],
    ["Pemegang hak", card.asset?.rightsHolder ?? "—"],
    ["Asal aset", card.asset?.sourceOrigin ?? "—"],
    ["Lisensi", card.asset?.licenseType ?? "—"],
    ["Izin komersial", card.asset ? (card.asset.commercialAllowed ? "Diizinkan" : "Tidak") : "—"],
    ["Kredit", card.asset?.creditText ?? "—"],
    ["Persetujuan aset", card.asset?.approvalStatus ?? "—"],
  ];

  return (
    <div id={ADMIN_CARDS_SEMANTIC_IDS.DETAIL_ROOT} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button id={ADMIN_CARDS_SEMANTIC_IDS.DETAIL_BACK_BUTTON} href={ROUTES.ADMIN_CARDS(locale)} variant="outline" leftIcon={<ArrowLeft size={16} />}>Kembali ke daftar</Button>
        <Button id={ADMIN_CARDS_SEMANTIC_IDS.DETAIL_EDIT_BUTTON} href={ROUTES.ADMIN_CARD_EDIT(locale, card.slug)} leftIcon={<Pencil size={16} />}>Edit detail</Button>
      </div>
      <header className="flex flex-col gap-5 rounded-3xl border border-[rgba(103,102,255,0.25)] bg-[#0F0927] p-6 text-white sm:flex-row sm:items-center">
        <div className="relative h-56 w-40 shrink-0 overflow-hidden rounded-2xl bg-[#07011F]">
          <Image src={card.imagePath} alt={card.name} fill sizes="160px" className="object-contain" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A9A8FF]">{card.code} · {formatKingdomLabel(card.kingdom)}</p>
          <h1 className="mt-2 font-display text-3xl font-bold">{card.name}</h1>
          <p className="mt-2 text-sm text-[#CFCBE2]">{formatRoleLabel(card.role)} · {card.cardType}</p>
        </div>
      </header>
      <section id={ADMIN_CARDS_SEMANTIC_IDS.DETAIL_DATA} className="rounded-3xl border border-[rgba(103,102,255,0.25)] bg-[#0F0927] p-5 text-white">
        <h2 className="mb-4 font-display text-xl font-bold">Data lengkap kartu</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="min-w-0 rounded-xl bg-[#07011F]/70 p-3">
              <dt className="text-xs font-semibold text-[#A9A8FF]">{label}</dt>
              <dd className="mt-1 break-words whitespace-pre-wrap text-sm text-[#F8F5F0]">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
