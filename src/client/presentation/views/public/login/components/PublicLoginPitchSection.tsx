"use client";

import React from "react";
import { ShieldCheck, Sparkles, Swords } from "lucide-react";
import { useTranslator } from "@/core/translator";
import { PUBLIC_LOGIN_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { PUBLIC_LOGIN_TEXT_CONSTANT } from "../constants/TextConstant";

export function PublicLoginPitchSection(): React.ReactElement {
  const { t } = useTranslator();

  return (
    <section
      id={PUBLIC_LOGIN_SEMANTIC_IDS.PITCH_SECTION}
      className="mx-auto max-w-xl text-center lg:mx-0 lg:text-left"
    >
      <div
        id={PUBLIC_LOGIN_SEMANTIC_IDS.PITCH_BADGE}
        className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#FF9F31]/25 bg-[#FF9F31]/[0.08] px-3.5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#FFC16F]"
      >
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        {t(PUBLIC_LOGIN_TEXT_CONSTANT.PITCH_BADGE)}
      </div>

      <h1
        id={PUBLIC_LOGIN_SEMANTIC_IDS.PITCH_HEADING}
        className="nc-type-display font-display font-black tracking-tight"
      >
        {t(PUBLIC_LOGIN_TEXT_CONSTANT.PITCH_TITLE_1)}
        <br />
        <span className="bg-gradient-to-r from-[#A8A7FF] via-[#C5B7FF] to-[#FFC16F] bg-clip-text text-transparent">
          {t(PUBLIC_LOGIN_TEXT_CONSTANT.PITCH_TITLE_2)}
        </span>
      </h1>

      <p
        id={PUBLIC_LOGIN_SEMANTIC_IDS.PITCH_DESCRIPTION}
        className="nc-type-body mx-auto mt-5 max-w-lg text-[#CFCBE2]/80 lg:mx-0"
      >
        {t(PUBLIC_LOGIN_TEXT_CONSTANT.PITCH_DESCRIPTION)}
      </p>

      <div className="mt-8 hidden grid-cols-2 gap-3 sm:grid lg:max-w-lg">
        <div
          id={PUBLIC_LOGIN_SEMANTIC_IDS.PITCH_FEATURE_ARENA}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left backdrop-blur"
        >
          <Swords className="mb-3 h-5 w-5 text-[#A8A7FF]" aria-hidden="true" />
          <p className="text-sm font-bold">
            {t(PUBLIC_LOGIN_TEXT_CONSTANT.FEATURE_ARENA_TITLE)}
          </p>
          <p className="mt-1 text-xs leading-5 text-[#CFCBE2]/65">
            {t(PUBLIC_LOGIN_TEXT_CONSTANT.FEATURE_ARENA_DESC)}
          </p>
        </div>

        <div
          id={PUBLIC_LOGIN_SEMANTIC_IDS.PITCH_FEATURE_SECURITY}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left backdrop-blur"
        >
          <ShieldCheck className="mb-3 h-5 w-5 text-[#FFC16F]" aria-hidden="true" />
          <p className="text-sm font-bold">
            {t(PUBLIC_LOGIN_TEXT_CONSTANT.FEATURE_SECURITY_TITLE)}
          </p>
          <p className="mt-1 text-xs leading-5 text-[#CFCBE2]/65">
            {t(PUBLIC_LOGIN_TEXT_CONSTANT.FEATURE_SECURITY_DESC)}
          </p>
        </div>
      </div>
    </section>
  );
}

