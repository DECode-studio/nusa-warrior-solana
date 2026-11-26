export type TokenSymbol = "NUSA" | "IDRC" | "USDC";
export type PoolId = "IDRC_NUSA" | "USDC_NUSA" | "IDRC_USDC";

export interface WalletTokenBalancesEntity {
  walletAddress: string;
  nusa: number;
  idrc: number;
  usdc: number;
  unclaimedNusa: number;
}

export interface AmmPoolStateEntity {
  poolId: PoolId;
  poolOwner: string;
  tokenA: TokenSymbol;
  tokenB: TokenSymbol;
  reserveA: number;
  reserveB: number;
  spotPriceAInB: number;
  spotPriceBInA: number;
  feeBps: number;
}

export interface AmmQuoteEntity {
  poolId: PoolId;
  inputSymbol: TokenSymbol;
  outputSymbol: TokenSymbol;
  inputUiAmount: number;
  outputUiAmount: number;
  minimumOutputUiAmount: number;
  feeUiAmount: number;
  executionPrice: number;
  spotPrice: number;
  priceImpactPct: number;
}

export interface PreparedTokenFaucetEntity {
  symbol: "IDRC" | "USDC";
  amount: number;
  walletAddress: string;
  serializedTransaction: string;
}

export interface PreparedClaimNusaEntity {
  claimId: string;
  amount: number;
  walletAddress: string;
  serializedTransaction: string;
}

export interface ClaimNusaConfirmResultEntity {
  claimedAmount: number;
  remainingUnclaimed: number;
  txSignature: string;
  explorerUrl: string;
  onChainNusa: number;
}

export interface PreparedAmmSwapEntity {
  serializedTransaction: string;
  quote: AmmQuoteEntity;
  poolOwner: string;
}
