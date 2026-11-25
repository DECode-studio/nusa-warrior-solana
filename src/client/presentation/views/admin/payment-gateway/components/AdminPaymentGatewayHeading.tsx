"use client";

import React from "react";
import { useTranslator } from "@/core/translator";
import { ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT } from "../constants/TextConstant";

export function AdminPaymentGatewayHeading(): React.ReactElement {
  const { t } = useTranslator();

  return (
    <header
      id={ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS.HEADING}
      className="rounded-[24px] border border-[rgba(103,102,255,0.25)] bg-[#0F0927]/95 p-6"
    >
      <p
        id={ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS.EYEBROW}
        className="text-xs font-bold uppercase tracking-[0.18em] text-[#6766FF]"
      >
        {t(ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT.EYEBROW)}
      </p>
      <h1
        id={ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS.TITLE}
        className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl"
      >
        {t(ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT.TITLE)}
      </h1>
      <p
        id={ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS.DESCRIPTION}
        className="mt-2 max-w-3xl text-xs leading-5 text-[#CFCBE2] sm:text-sm"
      >
        {t(ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT.DESCRIPTION)}
      </p>
    </header>
  );
}

