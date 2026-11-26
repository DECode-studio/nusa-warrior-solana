import type { CardEntity } from "@/client/domain/card/entity/card_entity";

export interface CustomCardPricingEntity {
  balance: number;
  createdCount: number;
  nextCost: number;
  canAfford: boolean;
  battlePointCap: number;
}

export interface CreateCustomCardParams {
  name: string;
  kingdom: string;
  role: string;
  gender: "LAKI_LAKI" | "PEREMPUAN";
  attack: number;
  defense: number;
  description: string;
  disclaimerAccepted: boolean;
  artwork: File;
  cropScale?: number;
  cropOffsetX?: number;
  cropOffsetY?: number;
  txSignature?: string;
}

export interface CreateCustomCardResultEntity {
  card: CardEntity;
  costPaid: number;
  remainingBalance: number;
}

