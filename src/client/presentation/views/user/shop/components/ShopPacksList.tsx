"use client";

import React from "react";
import type { StarterPackEntity } from "@/client/domain/shop/entity/shop_entity";
import { useTranslator } from "@/core/translator";
import { UserFeedback } from "@/client/presentation/components/user";
import { SHOP_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { SHOP_TEXT_CONSTANT } from "../constants/TextConstant";
import { ShopPackCard } from "./ShopPackCard";

export interface ShopPacksListProps {
  readonly packs: readonly StarterPackEntity[];
  readonly selectedPack: StarterPackEntity | null;
  readonly onSelectPack: (pack: StarterPackEntity) => void;
}

export function ShopPacksList({
  packs,
  selectedPack,
  onSelectPack,
}: ShopPacksListProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <section
      id={SHOP_SEMANTIC_IDS.PACKS_GRID}
      className="space-y-4 lg:col-span-7"
    >
      {packs.length === 0 ? (
        <UserFeedback
          kind="empty"
          title={t(SHOP_TEXT_CONSTANT.PACKS_EMPTY_TITLE)}
          description={t(SHOP_TEXT_CONSTANT.PACKS_EMPTY_DESC)}
        />
      ) : (
        packs.map((pack) => (
          <ShopPackCard
            key={pack.code}
            pack={pack}
            isSelected={selectedPack?.code === pack.code}
            onSelect={onSelectPack}
          />
        ))
      )}
    </section>
  );
}

