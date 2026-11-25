"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/client/presentation/components/ui";
import { ROUTES } from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";
import { useAdminCardEdit } from "./hooks/useAdminCardEdit";
import { ADMIN_CARDS_TEXT_CONSTANT } from "./constants/TextConstant";
import { AdminCardEditForm } from "./components";
import { ADMIN_CARDS_SEMANTIC_IDS } from "./constants/SemanticIdConstant";

export function AdminCardEditView({ slug }: { readonly slug: string }): React.ReactElement {
  const { locale, t } = useTranslator();
  const { card, loading, error, fields, saving, feedback, change, submit } = useAdminCardEdit(slug);

  if (loading) return <p id={ADMIN_CARDS_SEMANTIC_IDS.DETAIL_LOADING} className="text-sm text-[#CFCBE2]">{t(ADMIN_CARDS_TEXT_CONSTANT.EDIT_LOADING)}</p>;
  if (error || !card || !fields) {
    return <section id={ADMIN_CARDS_SEMANTIC_IDS.DETAIL_ERROR} className="space-y-4 rounded-3xl border border-rose-400/30 bg-[#0F0927] p-6 text-white"><p>{error ? t(error) : t(ADMIN_CARDS_TEXT_CONSTANT.RECORD_NOT_FOUND)}</p><Button href={ROUTES.ADMIN_CARDS(locale)} variant="outline" leftIcon={<ArrowLeft size={16} />}>Kembali ke daftar</Button></section>;
  }

  return (
    <div id={ADMIN_CARDS_SEMANTIC_IDS.EDIT_ROOT} className="space-y-6">
      <Button id={ADMIN_CARDS_SEMANTIC_IDS.EDIT_BACK_BUTTON} href={ROUTES.ADMIN_CARD_DETAIL(locale, card.slug)} variant="outline" leftIcon={<ArrowLeft size={16} />}>Kembali ke detail</Button>
      <header className="rounded-3xl border border-[rgba(103,102,255,0.25)] bg-[#0F0927] p-6 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A9A8FF]">{card.code}</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Edit {card.name}</h1>
        <p className="mt-2 text-sm text-[#CFCBE2]">Perbarui deskripsi sejarah, efek kartu, sumber, lisensi aset, dan status kurasi.</p>
      </header>

      <AdminCardEditForm
        card={card}
        fields={fields}
        saving={saving}
        feedback={feedback}
        cancelHref={ROUTES.ADMIN_CARD_DETAIL(locale, card.slug)}
        onChange={change}
        onSubmit={submit}
      />
    </div>
  );
}
