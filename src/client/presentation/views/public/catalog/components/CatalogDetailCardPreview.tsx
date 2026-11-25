"use client";

import React from "react";
import Image from "next/image";
import { Shield, Sword } from "lucide-react";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import { CATALOG_SEMANTIC_IDS } from "../constants/SemanticIdConstant";

export interface CatalogDetailCardPreviewProps {
  readonly card: CardEntity;
}

export function CatalogDetailCardPreview({
  card,
}: CatalogDetailCardPreviewProps): React.ReactElement {
  return (
    <div
      id={CATALOG_SEMANTIC_IDS.DETAIL_CARD_PREVIEW}
      className="flex flex-col items-center md:col-span-5"
    >
      <div className="w-full max-w-64 overflow-hidden rounded-[var(--radius-card)] border border-[#6766FF]/50 shadow-[0_12px_32px_rgba(103,102,255,0.2)]">
        <Image
          src={card.imagePath}
          alt={card.name}
          width={512}
          height={720}
          priority
          className="h-auto w-full object-cover"
          unoptimized
        />
      </div>

      {card.cardType === "CHARACTER" && (
        <div
          id={CATALOG_SEMANTIC_IDS.DETAIL_CARD_STATS}
          className="mt-4 flex w-full justify-center gap-6 rounded-xl border border-[#6766FF]/20 bg-[#0F0927] p-3.5 text-sm font-bold text-white"
        >
          <span className="flex items-center gap-1.5 text-[#FF9F31]">
            <Sword className="h-4 w-4" aria-hidden="true" />
            ATK {card.baseAttack}
          </span>
          <span className="flex items-center gap-1.5 text-[#0DB561]">
            <Shield className="h-4 w-4" aria-hidden="true" />
            DEF {card.baseDefense}
          </span>
        </div>
      )}
    </div>
  );
}

