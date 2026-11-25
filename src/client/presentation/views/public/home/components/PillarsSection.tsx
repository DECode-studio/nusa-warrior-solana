"use client";

import React from "react";
import { Crown, Music, ShieldCheck } from "lucide-react";
import { useTranslator } from "@/core/translator";
import {
  IntellioCard,
  PublicContainer,
  SectionHeading,
} from "@/client/presentation/components/ui";
import { HOME_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { HOME_TEXT_CONSTANT } from "../constants/TextConstant";

export function PillarsSection(): React.ReactElement {
  const { t } = useTranslator();

  return (
    <section
      id={HOME_SEMANTIC_IDS.PILLARS_SECTION}
      className="heavy-section-deferred nc-public-section"
    >
      <PublicContainer size="wide">
        <SectionHeading
          eyebrowId={HOME_SEMANTIC_IDS.PILLARS_BADGE}
          titleId={HOME_SEMANTIC_IDS.PILLARS_HEADING}
          eyebrow={t(HOME_TEXT_CONSTANT.PILLARS_BADGE)}
          title={t(HOME_TEXT_CONSTANT.PILLARS_TITLE)}
          description={t(HOME_TEXT_CONSTANT.PILLARS_SUBTITLE)}
          align="center"
        />

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
        {/* Pillar 1: 2-Row Formation */}
        <IntellioCard
          id={HOME_SEMANTIC_IDS.PILLAR_FORMATION_CARD}
          variant="glass"
          padding="sm"
          className="group min-h-48 transition duration-300 hover:-translate-y-1 hover:border-[#6766FF]/55"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#6766FF]/20 bg-[#6766FF]/10 text-[#A8A7FF] transition group-hover:bg-[#6766FF]/20">
            <Crown className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="nc-type-card-title mt-3 font-display font-bold text-white">
            {t(HOME_TEXT_CONSTANT.PILLAR_1_TITLE)}
          </h3>
          <p className="nc-type-body-sm mt-2 text-[#CFCBE2]">
            {t(HOME_TEXT_CONSTANT.PILLAR_1_DESC)}
          </p>
        </IntellioCard>

        {/* Pillar 2: Traditional Instruments */}
        <IntellioCard
          id={HOME_SEMANTIC_IDS.PILLAR_WADITRA_CARD}
          variant="glass"
          padding="sm"
          className="group min-h-48 transition duration-300 hover:-translate-y-1 hover:border-[#0DB561]/50"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#0DB561]/20 bg-[#0DB561]/10 text-[#46D995] transition group-hover:bg-[#0DB561]/20">
            <Music className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="nc-type-card-title mt-3 font-display font-bold text-white">
            {t(HOME_TEXT_CONSTANT.PILLAR_2_TITLE)}
          </h3>
          <p className="nc-type-body-sm mt-2 text-[#CFCBE2]">
            {t(HOME_TEXT_CONSTANT.PILLAR_2_DESC)}
          </p>
        </IntellioCard>

        {/* Pillar 3: Curation & Zero Gacha */}
        <IntellioCard
          id={HOME_SEMANTIC_IDS.PILLAR_CURATION_CARD}
          variant="glass"
          padding="sm"
          className="group min-h-48 transition duration-300 hover:-translate-y-1 hover:border-[#FF9F31]/50"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#FF9F31]/20 bg-[#FF9F31]/10 text-[#FFBD70] transition group-hover:bg-[#FF9F31]/20">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="nc-type-card-title mt-3 font-display font-bold text-white">
            {t(HOME_TEXT_CONSTANT.PILLAR_3_TITLE)}
          </h3>
          <p className="nc-type-body-sm mt-2 text-[#CFCBE2]">
            {t(HOME_TEXT_CONSTANT.PILLAR_3_DESC)}
          </p>
        </IntellioCard>
        </div>
      </PublicContainer>
    </section>
  );
}

