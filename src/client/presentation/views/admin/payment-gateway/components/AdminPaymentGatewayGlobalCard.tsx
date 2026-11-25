"use client";

import React from "react";
import type { PaymentGatewayMode } from "@/client/domain/payment/entity/payment_gateway_entity";
import { useTranslator } from "@/core/translator";
import { ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT } from "../constants/TextConstant";

export interface AdminPaymentGatewayGlobalCardProps {
  readonly globalMode: PaymentGatewayMode;
  readonly disabled: boolean;
  readonly onUpdateMode: (mode: PaymentGatewayMode) => Promise<void>;
}

export function AdminPaymentGatewayGlobalCard({
  globalMode,
  disabled,
  onUpdateMode,
}: AdminPaymentGatewayGlobalCardProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <section
      id={ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS.GLOBAL_CARD}
      className="rounded-[24px] border border-[rgba(103,102,255,0.25)] bg-[#0F0927]/95 p-5 sm:p-6"
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2
            id={ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS.GLOBAL_TITLE}
            className="font-display text-lg font-bold text-white"
          >
            {t(ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT.GLOBAL_TITLE)}
          </h2>
          <p
            id={ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS.GLOBAL_DESCRIPTION}
            className="mt-1 text-xs text-[#CFCBE2] sm:text-sm"
          >
            {t(ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT.GLOBAL_DESCRIPTION)}
          </p>
        </div>

        <label className="flex items-center gap-3 text-xs text-[#CFCBE2]">
          <span className="sr-only">
            {t(ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT.GLOBAL_TITLE)}
          </span>
          <select
            id={ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS.GLOBAL_SELECT}
            aria-label={t(ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT.GLOBAL_TITLE)}
            value={globalMode}
            disabled={disabled}
            onChange={(e) =>
              void onUpdateMode(e.target.value as PaymentGatewayMode)
            }
            className="min-h-11 rounded-xl border border-[rgba(103,102,255,0.3)] bg-[#07011F] px-4 py-2 text-xs font-semibold text-white focus:border-[#6766FF] focus:outline-none focus:ring-1 focus:ring-[#6766FF] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="DEV">
              DEV · {t(ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT.DEV)}
            </option>
            <option value="PROD">
              PROD · {t(ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT.PROD)}
            </option>
          </select>
        </label>
      </div>

      <p
        id={ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS.GLOBAL_WARNING}
        className="mt-4 rounded-xl border border-[rgba(255,159,49,0.35)] bg-[rgba(255,159,49,0.1)] p-3.5 text-xs leading-5 text-[#FFBD70]"
      >
        {t(ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT.MODE_WARNING)}
      </p>
    </section>
  );
}

