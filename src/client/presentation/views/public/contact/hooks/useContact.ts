"use client";

import { useState } from "react";
import { APP_CONFIG } from "@/core/constants/app-config";
import {
  CONTACT_FAQ_ITEMS,
  type ContactFaqItem,
} from "../constants/TextConstant";

export interface UseContactReturn {
  readonly faqItems: readonly ContactFaqItem[];
  readonly openFaqId: string | null;
  readonly toggleFaq: (id: string) => void;
  readonly contactEmail: string;
  readonly contactPhone: string;
  readonly officeAddress: string;
}

export function useContact(): UseContactReturn {
  const [openFaqId, setOpenFaqId] = useState<string | null>(
    CONTACT_FAQ_ITEMS[0]?.id ?? null
  );

  const toggleFaq = (id: string): void => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  return {
    faqItems: CONTACT_FAQ_ITEMS,
    openFaqId,
    toggleFaq,
    contactEmail: APP_CONFIG.contactEmail,
    contactPhone: APP_CONFIG.contactPhone,
    officeAddress: APP_CONFIG.officeAddress,
  };
}

