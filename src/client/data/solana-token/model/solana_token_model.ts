import type {
  AmmPoolStateEntity,
  AmmQuoteEntity,
  ClaimNusaConfirmResultEntity,
  PoolId,
  PreparedAmmSwapEntity,
  PreparedClaimNusaEntity,
  PreparedTokenFaucetEntity,
  TokenSymbol,
  WalletTokenBalancesEntity,
} from "@/client/domain/solana-token/entity/solana_token_entity";

export interface WalletTokenBalancesApiModel {
  walletAddress: string;
  nusa: number;
  idrc: number;
  usdc: number;
  unclaimedNusa: number;
}

export interface AmmPoolStateApiModel {
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

export interface AmmQuoteApiModel {
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

export interface PreparedTokenFaucetApiModel {
  symbol: "IDRC" | "USDC";
  amount: number;
  walletAddress: string;
  serializedTransaction: string;
}

export interface PreparedClaimNusaApiModel {
  claimId: string;
  amount: number;
  walletAddress: string;
  serializedTransaction: string;
}

export interface ClaimNusaConfirmResultApiModel {
  claimedAmount: number;
  remainingUnclaimed: number;
  txSignature: string;
  explorerUrl: string;
  onChainNusa: number;
}

export interface PreparedAmmSwapApiModel {
  serializedTransaction: string;
  quote: AmmQuoteApiModel;
  poolOwner: string;
}

export function mapWalletBalancesToEntity(
  model: WalletTokenBalancesApiModel
): WalletTokenBalancesEntity {
  return { ...model };
}

export function mapPoolStateToEntity(
  model: AmmPoolStateApiModel
): AmmPoolStateEntity {
  return { ...model };
}

export function mapQuoteToEntity(model: AmmQuoteApiModel): AmmQuoteEntity {
  return { ...model };
}

export function mapFaucetToEntity(
  model: PreparedTokenFaucetApiModel
): PreparedTokenFaucetEntity {
  return { ...model };
}

export function mapClaimPrepareToEntity(
  model: PreparedClaimNusaApiModel
): PreparedClaimNusaEntity {
  return { ...model };
}

export function mapClaimConfirmToEntity(
  model: ClaimNusaConfirmResultApiModel
): ClaimNusaConfirmResultEntity {
  return { ...model };
}

export function mapPreparedSwapToEntity(
  model: PreparedAmmSwapApiModel
): PreparedAmmSwapEntity {
  return {
    serializedTransaction: model.serializedTransaction,
    quote: mapQuoteToEntity(model.quote),
    poolOwner: model.poolOwner,
  };
}
