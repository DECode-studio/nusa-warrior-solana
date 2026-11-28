import { inject, injectable } from "@needle-di/core";
import type {
  AuctionListQuery,
  AuctionRepository,
} from "@/client/domain/auction/repository/auction_repository";
import type {
  AuctionDetailEntity,
  AuctionListEntity,
  AuctionListingEntity,
  AuctionTokenStandard,
  PreparedBidEntity,
  PreparedCreateAuctionEntity,
  PreparedFinalizeEntity,
  PreparedManageAuctionEntity,
} from "@/client/domain/auction/entity/auction_entity";
import { AuctionRemoteDataSource } from "../datasource/auction_remote_datasource";
import {
  mapAuctionDetailToEntity,
  mapAuctionListToEntity,
  mapAuctionListingToEntity,
  mapPreparedBidToEntity,
  mapPreparedCreateAuctionToEntity,
  mapPreparedFinalizeToEntity,
  mapPreparedManageAuctionToEntity,
} from "../model/auction_model";

@injectable()
export class AuctionRepositoryImpl implements AuctionRepository {
  constructor(
    private readonly dataSource: AuctionRemoteDataSource = inject(
      AuctionRemoteDataSource
    )
  ) {}

  public async listAuctions(
    query: AuctionListQuery
  ): Promise<AuctionListEntity> {
    const raw = await this.dataSource.listAuctions(query);
    return mapAuctionListToEntity(raw);
  }

  public async getAuctionDetail(
    auctionId: string
  ): Promise<AuctionDetailEntity> {
    const raw = await this.dataSource.getAuctionDetail(auctionId);
    return mapAuctionDetailToEntity(raw);
  }

  public async prepareCreateAuction(input: {
    cardId: string;
    startingPrice: number;
    durationMinutes: number;
  }): Promise<PreparedCreateAuctionEntity> {
    const raw = await this.dataSource.prepareCreateAuction(input);
    return mapPreparedCreateAuctionToEntity(raw);
  }

  public async confirmCreateAuction(input: {
    auctionId: string;
    cardId: string;
    cardMintOrAsset: string;
    tokenStandard: AuctionTokenStandard;
    collectionAddress: string;
    startingPrice: number;
    durationMinutes: number;
    txSignature: string;
  }): Promise<AuctionListingEntity> {
    const raw = await this.dataSource.confirmCreateAuction(input);
    return mapAuctionListingToEntity(raw);
  }

  public async prepareEditAuction(input: {
    auctionId: string;
    startingPrice: number;
    durationMinutes: number;
  }): Promise<PreparedManageAuctionEntity> {
    const raw = await this.dataSource.prepareEditAuction(input);
    return mapPreparedManageAuctionToEntity(raw);
  }

  public async confirmEditAuction(input: {
    auctionId: string;
    startingPrice: number;
    durationMinutes: number;
    txSignature: string;
  }): Promise<AuctionListingEntity> {
    const raw = await this.dataSource.confirmEditAuction(input);
    return mapAuctionListingToEntity(raw);
  }

  public async prepareCancelAuction(
    auctionId: string
  ): Promise<PreparedManageAuctionEntity> {
    const raw = await this.dataSource.prepareCancelAuction(auctionId);
    return mapPreparedManageAuctionToEntity(raw);
  }

  public async confirmCancelAuction(input: {
    auctionId: string;
    txSignature: string;
  }): Promise<AuctionListingEntity> {
    const raw = await this.dataSource.confirmCancelAuction(input);
    return mapAuctionListingToEntity(raw);
  }

  public async preparePlaceBid(input: {
    auctionId: string;
    amount: number;
  }): Promise<PreparedBidEntity> {
    const raw = await this.dataSource.preparePlaceBid(input);
    return mapPreparedBidToEntity(raw);
  }

  public async confirmPlaceBid(input: {
    auctionId: string;
    amount: number;
    deltaAmount: number;
    bidEscrowPda: string;
    txSignature: string;
  }): Promise<AuctionDetailEntity> {
    const raw = await this.dataSource.confirmPlaceBid(input);
    return mapAuctionDetailToEntity(raw);
  }

  public async prepareSettleAuction(
    auctionId: string
  ): Promise<PreparedFinalizeEntity> {
    const raw = await this.dataSource.prepareSettleAuction(auctionId);
    return mapPreparedFinalizeToEntity(raw);
  }

  public async confirmSettleAuction(input: {
    auctionId: string;
    txSignature: string;
  }): Promise<AuctionDetailEntity> {
    const raw = await this.dataSource.confirmSettleAuction(input);
    return mapAuctionDetailToEntity(raw);
  }

  public async prepareRefundBid(
    auctionId: string
  ): Promise<PreparedFinalizeEntity> {
    const raw = await this.dataSource.prepareRefundBid(auctionId);
    return mapPreparedFinalizeToEntity(raw);
  }

  public async confirmRefundBid(input: {
    auctionId: string;
    txSignature: string;
  }): Promise<AuctionDetailEntity> {
    const raw = await this.dataSource.confirmRefundBid(input);
    return mapAuctionDetailToEntity(raw);
  }
}
