import { injectable } from "@needle-di/core";
import { API_ROUTES } from "@/core/constants/api-routes";
import { apiClient } from "@/core/http-client/api-client";
import type {
  PoolId,
  TokenSymbol,
} from "@/client/domain/solana-token/entity/solana_token_entity";
import type {
  AmmPoolStateApiModel,
  AmmQuoteApiModel,
  ClaimNusaConfirmResultApiModel,
  PreparedAmmSwapApiModel,
  PreparedClaimNusaApiModel,
  PreparedTokenFaucetApiModel,
  WalletTokenBalancesApiModel,
} from "../model/solana_token_model";

@injectable()
export class SolanaTokenRemoteDataSource {
  public async getWalletBalances(
    walletAddress: string
  ): Promise<WalletTokenBalancesApiModel> {
    return apiClient.get<WalletTokenBalancesApiModel>(
      `${API_ROUTES.SOLANA.tokenBalances}?wallet=${encodeURIComponent(walletAddress)}`
    );
  }

  public async getDexPools(): Promise<{ pools: AmmPoolStateApiModel[] }> {
    return apiClient.get<{ pools: AmmPoolStateApiModel[] }>(
      API_ROUTES.SOLANA.dexPools
    );
  }

  public async quoteDexSwap(input: {
    poolId: PoolId;
    inputSymbol: TokenSymbol;
    inputUiAmount: number;
    slippageBps?: number;
  }): Promise<AmmQuoteApiModel> {
    return apiClient.post<AmmQuoteApiModel>(
      API_ROUTES.SOLANA.dexQuote,
      input
    );
  }

  public async prepareDexSwap(input: {
    traderWallet: string;
    poolId: PoolId;
    inputSymbol: TokenSymbol;
    inputUiAmount: number;
    slippageBps?: number;
  }): Promise<PreparedAmmSwapApiModel> {
    return apiClient.post<PreparedAmmSwapApiModel>(
      API_ROUTES.SOLANA.dexSwap,
      input
    );
  }

  public async prepareTokenFaucet(input: {
    walletAddress: string;
    symbol: "IDRC" | "USDC";
    amount: number;
  }): Promise<PreparedTokenFaucetApiModel> {
    return apiClient.post<PreparedTokenFaucetApiModel>(
      API_ROUTES.SOLANA.tokenFaucet,
      input
    );
  }

  public async prepareClaimNusa(): Promise<PreparedClaimNusaApiModel> {
    return apiClient.post<PreparedClaimNusaApiModel>(
      API_ROUTES.SOLANA.claimPrepare,
      {}
    );
  }

  public async confirmClaimNusa(input: {
    claimId: string;
    amount: number;
    txSignature: string;
  }): Promise<ClaimNusaConfirmResultApiModel> {
    return apiClient.post<ClaimNusaConfirmResultApiModel>(
      API_ROUTES.SOLANA.claimConfirm,
      input
    );
  }
}
