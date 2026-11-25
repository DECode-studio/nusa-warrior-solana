"use client";

import React from "react";
import { Mail, Phone, MapPin, Clock, ShieldCheck } from "lucide-react";
import { useTranslator } from "@/core/translator";
import {
  Badge,
  IntellioCard,
  PublicContainer,
} from "@/client/presentation/components/ui";
import { CONTACT_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { CONTACT_TEXT_CONSTANT } from "../constants/TextConstant";

export interface ContactChannelsSectionProps {
  readonly contactEmail: string;
  readonly contactPhone: string;
  readonly officeAddress: string;
}

export function ContactChannelsSection({
  contactEmail,
  contactPhone,
  officeAddress,
}: ContactChannelsSectionProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <section id={CONTACT_SEMANTIC_IDS.CHANNELS_GRID} className="mt-10">
      <PublicContainer
        size="wide"
        className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {/* Curatorial Email */}
        <IntellioCard
          id={CONTACT_SEMANTIC_IDS.CHANNEL_EMAIL_CARD}
          variant="glass"
          padding="sm"
          className="flex h-full min-h-[15rem] min-w-0 flex-col transition duration-300 hover:-translate-y-1 hover:border-[#6766FF]/50"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#6766FF]/20 bg-[#6766FF]/10 text-[#A8A7FF]">
            <Mail className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="nc-type-card-title mt-4 line-clamp-2 min-h-[3rem] break-words font-display font-bold text-white">
            {t(CONTACT_TEXT_CONSTANT.CHANNEL_EMAIL_TITLE)}
          </h2>
          <p className="nc-type-caption mt-2 line-clamp-3 min-h-[3.75rem] break-words text-[#F8F5F0]/70">
            {t(CONTACT_TEXT_CONSTANT.CHANNEL_EMAIL_DESC)}
          </p>
          <p className="nc-type-caption mt-auto min-h-10 break-all pt-3 font-display font-bold text-[#A8A7FF]">
            {contactEmail}
          </p>
        </IntellioCard>

        {/* Studio Phone Hotline */}
        <IntellioCard
          id={CONTACT_SEMANTIC_IDS.CHANNEL_PHONE_CARD}
          variant="glass"
          padding="sm"
          className="flex h-full min-h-[15rem] min-w-0 flex-col transition duration-300 hover:-translate-y-1 hover:border-[#0DB561]/50"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#0DB561]/20 bg-[#0DB561]/10 text-[#46D995]">
            <Phone className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="nc-type-card-title mt-4 line-clamp-2 min-h-[3rem] break-words font-display font-bold text-white">
            {t(CONTACT_TEXT_CONSTANT.CHANNEL_PHONE_TITLE)}
          </h2>
          <p className="nc-type-caption mt-2 line-clamp-3 min-h-[3.75rem] break-words text-[#F8F5F0]/70">
            {t(CONTACT_TEXT_CONSTANT.CHANNEL_PHONE_DESC)}
          </p>
          <p className="nc-type-caption mt-auto min-h-10 break-words pt-3 font-display font-bold text-[#46D995]">
            {contactPhone}
          </p>
        </IntellioCard>

        {/* Studio Location */}
        <IntellioCard
          id={CONTACT_SEMANTIC_IDS.CHANNEL_LOCATION_CARD}
          variant="glass"
          padding="sm"
          className="flex h-full min-h-[15rem] min-w-0 flex-col transition duration-300 hover:-translate-y-1 hover:border-[#FF9F31]/50"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#FF9F31]/20 bg-[#FF9F31]/10 text-[#FFBD70]">
            <MapPin className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="nc-type-card-title mt-4 line-clamp-2 min-h-[3rem] break-words font-display font-bold text-white">
            {t(CONTACT_TEXT_CONSTANT.CHANNEL_LOCATION_TITLE)}
          </h2>
          <p className="nc-type-caption mt-2 line-clamp-3 min-h-[3.75rem] break-words text-[#F8F5F0]/70">
            {officeAddress}
          </p>
          <p className="nc-type-caption mt-auto min-h-10 pt-3 font-display font-bold tracking-wider text-[#FFBD70] uppercase">
            {t(CONTACT_TEXT_CONSTANT.CHANNEL_LOCATION_SUB)}
          </p>
        </IntellioCard>

        {/* Operating Hours */}
        <IntellioCard
          id={CONTACT_SEMANTIC_IDS.CHANNEL_HOURS_CARD}
          variant="glass"
          padding="sm"
          className="flex h-full min-h-[15rem] min-w-0 flex-col transition duration-300 hover:-translate-y-1 hover:border-[#37B884]/50"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#37B884]/20 bg-[#37B884]/10 text-[#65D5A2]">
            <Clock className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="nc-type-card-title mt-4 line-clamp-2 min-h-[3rem] break-words font-display font-bold text-white">
            {t(CONTACT_TEXT_CONSTANT.CHANNEL_HOURS_TITLE)}
          </h2>
          <p className="nc-type-caption mt-2 line-clamp-3 min-h-[3.75rem] break-words text-[#F8F5F0]/70">
            {t(CONTACT_TEXT_CONSTANT.CHANNEL_HOURS_DESC)}
          </p>
          <div className="mt-auto min-h-10 pt-3">
            <Badge
              variant="emerald"
              size="sm"
              icon={<ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />}
            >
              {t(CONTACT_TEXT_CONSTANT.CHANNEL_HOURS_SLA)}
            </Badge>
          </div>
        </IntellioCard>
      </PublicContainer>
    </section>
  );
}

