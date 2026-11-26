import { inject, injectable } from "@needle-di/core";
import type { SolanaTokenRepository } from "@/client/domain/solana-token/repository/solana_token_repository";
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
import { SolanaTokenRemoteDataSource } from "../datasource/solana_token_remote_datasource";
import {
  mapClaimConfirmToEntity,
  mapClaimPrepareToEntity,
  mapFaucetToEntity,
  mapPoolStateToEntity,
  mapPreparedSwapToEntity,
  mapQuoteToEntity,
  mapWalletBalancesToEntity,
} from "../model/solana_token_model";

@injectable()
export class SolanaTokenRepositoryImpl implements SolanaTokenRepository {
  constructor(
    private readonly dataSource: SolanaTokenRemoteDataSource = inject(
      SolanaTokenRemoteDataSource
    )
  ) {}

  public async getWalletBalances(
    walletAddress: string
  ): Promise<WalletTokenBalancesEntity> {
    const raw = await this.dataSource.getWalletBalances(walletAddress);
    return mapWalletBalancesToEntity(raw);
  }

  public async getDexPools(): Promise<AmmPoolStateEntity[]> {
    const raw = await this.dataSource.getDexPools();
    return raw.pools.map(mapPoolStateToEntity);
  }

  public async quoteDexSwap(input: {
    poolId: PoolId;
    inputSymbol: TokenSymbol;
    inputUiAmount: number;
    slippageBps?: number;
  }): Promise<AmmQuoteEntity> {
    const raw = await this.dataSource.quoteDexSwap(input);
    return mapQuoteToEntity(raw);
  }

  public async prepareDexSwap(input: {
    traderWallet: string;
    poolId: PoolId;
    inputSymbol: TokenSymbol;
    inputUiAmount: number;
    slippageBps?: number;
  }): Promise<PreparedAmmSwapEntity> {
    const raw = await this.dataSource.prepareDexSwap(input);
    return mapPreparedSwapToEntity(raw);
  }

  public async prepareTokenFaucet(input: {
    walletAddress: string;
    symbol: "IDRC" | "USDC";
    amount: number;
  }): Promise<PreparedTokenFaucetEntity> {
    const raw = await this.dataSource.prepareTokenFaucet(input);
    return mapFaucetToEntity(raw);
  }

  public async prepareClaimNusa(): Promise<PreparedClaimNusaEntity> {
    const raw = await this.dataSource.prepareClaimNusa();
    return mapClaimPrepareToEntity(raw);
  }

  public async confirmClaimNusa(input: {
    claimId: string;
    amount: number;
    txSignature: string;
  }): Promise<ClaimNusaConfirmResultEntity> {
    const raw = await this.dataSource.confirmClaimNusa(input);
    return mapClaimConfirmToEntity(raw);
  }
}
