import { inject, injectable } from "@needle-di/core";
import { SOLANA_TOKEN_REPOSITORY_TOKEN } from "@/core/di/tokens";
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
import type { SolanaTokenRepository } from "../repository/solana_token_repository";

@injectable()
export class SolanaTokenUseCase {
  constructor(
    private readonly repository: SolanaTokenRepository = inject(
      SOLANA_TOKEN_REPOSITORY_TOKEN
    )
  ) {}

  public async getWalletBalances(
    walletAddress: string
  ): Promise<WalletTokenBalancesEntity> {
    return this.repository.getWalletBalances(walletAddress);
  }

  public async getDexPools(): Promise<AmmPoolStateEntity[]> {
    return this.repository.getDexPools();
  }

  public async quoteDexSwap(input: {
    poolId: PoolId;
    inputSymbol: TokenSymbol;
    inputUiAmount: number;
    slippageBps?: number;
  }): Promise<AmmQuoteEntity> {
    return this.repository.quoteDexSwap(input);
  }

  public async prepareDexSwap(input: {
    traderWallet: string;
    poolId: PoolId;
    inputSymbol: TokenSymbol;
    inputUiAmount: number;
    slippageBps?: number;
  }): Promise<PreparedAmmSwapEntity> {
    return this.repository.prepareDexSwap(input);
  }

  public async prepareTokenFaucet(input: {
    walletAddress: string;
    symbol: "IDRC" | "USDC";
    amount: number;
  }): Promise<PreparedTokenFaucetEntity> {
    return this.repository.prepareTokenFaucet(input);
  }

  public async prepareClaimNusa(): Promise<PreparedClaimNusaEntity> {
    return this.repository.prepareClaimNusa();
  }

  public async confirmClaimNusa(input: {
    claimId: string;
    amount: number;
    txSignature: string;
  }): Promise<ClaimNusaConfirmResultEntity> {
    return this.repository.confirmClaimNusa(input);
  }
}
