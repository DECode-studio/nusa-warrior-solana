"use client";

import React from "react";
import { Swords, GraduationCap } from "lucide-react";
import { APP_ROUTES } from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";
import {
  IntellioCard,
  Badge,
  PillButton,
  PublicContainer,
} from "@/client/presentation/components/ui";
import { HOME_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { HOME_TEXT_CONSTANT } from "../constants/TextConstant";

export function GatewaySection(): React.ReactElement {
  const { locale, t } = useTranslator();

  return (
    <section
      id={HOME_SEMANTIC_IDS.GATEWAYS_SECTION}
      className="heavy-section-deferred nc-public-section !pt-0"
    >
      <PublicContainer size="wide">
        {/* User / Warrior Console Gateway */}
        <IntellioCard
          id={HOME_SEMANTIC_IDS.GATEWAY_USER_CARD}
          variant="glass"
          padding="md"
          className="flex flex-col justify-between border-[#6766FF]/25 bg-gradient-to-br from-[#151137] to-[#0B0622] transition duration-300 hover:border-[#6766FF]/55"
        >
          <div>
            <Badge
              variant="primary"
              size="sm"
              icon={<Swords className="h-3 w-3 text-[#6766FF]" />}
            >
              {t(HOME_TEXT_CONSTANT.GATEWAY_USER_BADGE)}
            </Badge>
            <h3 className="nc-type-card-title mt-3 font-display font-bold text-white">
              {t(HOME_TEXT_CONSTANT.GATEWAY_USER_TITLE)}
            </h3>
            <p className="nc-type-body-sm mt-2 text-[#CFCBE2]">
              {t(HOME_TEXT_CONSTANT.GATEWAY_USER_DESC)}
            </p>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <PillButton
              id={HOME_SEMANTIC_IDS.GATEWAY_USER_DASHBOARD_BTN}
              href={APP_ROUTES.USER_DASHBOARD(locale)}
              variant="primary"
              size="md"
              showArrow
            >
              {t(HOME_TEXT_CONSTANT.GATEWAY_USER_CTA_DASHBOARD)}
            </PillButton>
            <PillButton
              id={HOME_SEMANTIC_IDS.GATEWAY_USER_TUTORIAL_BTN}
              href={APP_ROUTES.USER_TUTORIAL(locale)}
              variant="outline"
              size="md"
            >
              <GraduationCap className="mr-1.5 inline h-4 w-4" />
              {t(HOME_TEXT_CONSTANT.GATEWAY_USER_CTA_TUTORIAL)}
            </PillButton>
          </div>
        </IntellioCard>
      </PublicContainer>
    </section>
  );
}
