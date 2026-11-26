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
} from "../entity/solana_token_entity";

export interface SolanaTokenRepository {
  getWalletBalances(walletAddress: string): Promise<WalletTokenBalancesEntity>;
  getDexPools(): Promise<AmmPoolStateEntity[]>;
  quoteDexSwap(input: {
    poolId: PoolId;
    inputSymbol: TokenSymbol;
    inputUiAmount: number;
    slippageBps?: number;
  }): Promise<AmmQuoteEntity>;
  prepareDexSwap(input: {
    traderWallet: string;
    poolId: PoolId;
    inputSymbol: TokenSymbol;
    inputUiAmount: number;
    slippageBps?: number;
  }): Promise<PreparedAmmSwapEntity>;
  prepareTokenFaucet(input: {
    walletAddress: string;
    symbol: "IDRC" | "USDC";
    amount: number;
  }): Promise<PreparedTokenFaucetEntity>;
  prepareClaimNusa(): Promise<PreparedClaimNusaEntity>;
  confirmClaimNusa(input: {
    claimId: string;
    amount: number;
    txSignature: string;
  }): Promise<ClaimNusaConfirmResultEntity>;
}
