export interface TopupTier {
  amountIdr: number;
  feeIdr: number;
  pointsAwarded: number;
}

export const NUSA_POINT_TOPUP_FEE = 500;

export const NUSA_POINT_TOPUP_TIERS: readonly TopupTier[] = [
  { amountIdr: 5_000, feeIdr: 500, pointsAwarded: 4_500 },
  { amountIdr: 10_000, feeIdr: 500, pointsAwarded: 9_500 },
  { amountIdr: 15_000, feeIdr: 500, pointsAwarded: 14_500 },
  { amountIdr: 20_000, feeIdr: 500, pointsAwarded: 19_500 },
  { amountIdr: 30_000, feeIdr: 500, pointsAwarded: 29_500 },
  { amountIdr: 50_000, feeIdr: 500, pointsAwarded: 49_500 },
  { amountIdr: 100_000, feeIdr: 500, pointsAwarded: 99_500 },
  { amountIdr: 150_000, feeIdr: 500, pointsAwarded: 149_500 },
  { amountIdr: 200_000, feeIdr: 500, pointsAwarded: 199_500 },
] as const;

export function getTopupTierByAmount(amountIdr: number): TopupTier | undefined {
  return NUSA_POINT_TOPUP_TIERS.find((tier) => tier.amountIdr === amountIdr);
}

export function isValidTopupAmount(amountIdr: number): boolean {
  return NUSA_POINT_TOPUP_TIERS.some((tier) => tier.amountIdr === amountIdr);
}

