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

  public prepareCreateAuction(input: {
    cardId: string;
    startingPrice: number;
    durationHours: number;
  }): Promise<PreparedCreateAuctionEntity> {
    return this.dataSource.prepareCreateAuction(input);
  }

  public async confirmCreateAuction(input: {
    auctionId: string;
    cardId: string;
    cardMintOrAsset: string;
    tokenStandard: AuctionTokenStandard;
    collectionAddress?: string | null;
    startingPrice: number;
    durationHours: number;
    txSignature: string;
  }): Promise<AuctionListingEntity> {
    const raw = await this.dataSource.confirmCreateAuction(input);
    return mapAuctionListingToEntity(raw);
  }

  public prepareEditAuction(input: {
    auctionId: string;
    startingPrice: number;
    durationHours: number;
  }): Promise<PreparedManageAuctionEntity> {
    return this.dataSource.prepareEditAuction(input);
  }

  public async confirmEditAuction(input: {
    auctionId: string;
    startingPrice: number;
    durationHours: number;
    txSignature: string;
  }): Promise<AuctionListingEntity> {
    const raw = await this.dataSource.confirmEditAuction(input);
    return mapAuctionListingToEntity(raw);
  }

  public prepareCancelAuction(
    auctionId: string
  ): Promise<PreparedManageAuctionEntity> {
    return this.dataSource.prepareCancelAuction(auctionId);
  }

  public async confirmCancelAuction(input: {
    auctionId: string;
    txSignature: string;
  }): Promise<AuctionListingEntity> {
    const raw = await this.dataSource.confirmCancelAuction(input);
    return mapAuctionListingToEntity(raw);
  }

  public preparePlaceBid(input: {
    auctionId: string;
    amount: number;
  }): Promise<PreparedBidEntity> {
    return this.dataSource.preparePlaceBid(input);
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

  public prepareSettleAuction(
    auctionId: string
  ): Promise<PreparedFinalizeEntity> {
    return this.dataSource.prepareSettleAuction(auctionId);
  }

  public async confirmSettleAuction(input: {
    auctionId: string;
    txSignature: string;
  }): Promise<AuctionDetailEntity> {
    const raw = await this.dataSource.confirmSettleAuction(input);
    return mapAuctionDetailToEntity(raw);
  }

  public prepareRefundBid(
    auctionId: string
  ): Promise<PreparedFinalizeEntity> {
    return this.dataSource.prepareRefundBid(auctionId);
  }

  public async confirmRefundBid(input: {
    auctionId: string;
    txSignature: string;
  }): Promise<AuctionDetailEntity> {
    const raw = await this.dataSource.confirmRefundBid(input);
    return mapAuctionDetailToEntity(raw);
  }
}
