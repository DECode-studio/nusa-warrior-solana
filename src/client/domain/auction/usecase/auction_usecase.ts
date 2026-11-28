import { inject, injectable } from "@needle-di/core";
import { AUCTION_REPOSITORY_TOKEN } from "@/core/di/tokens";
import type {
  AuctionListQuery,
  AuctionRepository,
} from "../repository/auction_repository";
import type {
  AuctionDetailEntity,
  AuctionListEntity,
  AuctionListingEntity,
  AuctionTokenStandard,
  PreparedBidEntity,
  PreparedCreateAuctionEntity,
  PreparedFinalizeEntity,
  PreparedManageAuctionEntity,
} from "../entity/auction_entity";

@injectable()
export class AuctionUseCase {
  constructor(
    private readonly repository: AuctionRepository = inject(
      AUCTION_REPOSITORY_TOKEN
    )
  ) {}

  public listAuctions(query: AuctionListQuery): Promise<AuctionListEntity> {
    return this.repository.listAuctions(query);
  }

  public getAuctionDetail(auctionId: string): Promise<AuctionDetailEntity> {
    return this.repository.getAuctionDetail(auctionId);
  }

  public prepareCreateAuction(input: {
    cardId: string;
    startingPrice: number;
    durationMinutes: number;
  }): Promise<PreparedCreateAuctionEntity> {
    return this.repository.prepareCreateAuction(input);
  }

  public confirmCreateAuction(input: {
    auctionId: string;
    cardId: string;
    cardMintOrAsset: string;
    tokenStandard: AuctionTokenStandard;
    collectionAddress: string;
    startingPrice: number;
    durationMinutes: number;
    txSignature: string;
  }): Promise<AuctionListingEntity> {
    return this.repository.confirmCreateAuction(input);
  }

  public prepareEditAuction(input: {
    auctionId: string;
    startingPrice: number;
    durationMinutes: number;
  }): Promise<PreparedManageAuctionEntity> {
    return this.repository.prepareEditAuction(input);
  }

  public confirmEditAuction(input: {
    auctionId: string;
    startingPrice: number;
    durationMinutes: number;
    txSignature: string;
  }): Promise<AuctionListingEntity> {
    return this.repository.confirmEditAuction(input);
  }

  public prepareCancelAuction(
    auctionId: string
  ): Promise<PreparedManageAuctionEntity> {
    return this.repository.prepareCancelAuction(auctionId);
  }

  public confirmCancelAuction(input: {
    auctionId: string;
    txSignature: string;
  }): Promise<AuctionListingEntity> {
    return this.repository.confirmCancelAuction(input);
  }

  public preparePlaceBid(input: {
    auctionId: string;
    amount: number;
  }): Promise<PreparedBidEntity> {
    return this.repository.preparePlaceBid(input);
  }

  public confirmPlaceBid(input: {
    auctionId: string;
    amount: number;
    deltaAmount: number;
    bidEscrowPda: string;
    txSignature: string;
  }): Promise<AuctionDetailEntity> {
    return this.repository.confirmPlaceBid(input);
  }

  public prepareSettleAuction(
    auctionId: string
  ): Promise<PreparedFinalizeEntity> {
    return this.repository.prepareSettleAuction(auctionId);
  }

  public confirmSettleAuction(input: {
    auctionId: string;
    txSignature: string;
  }): Promise<AuctionDetailEntity> {
    return this.repository.confirmSettleAuction(input);
  }

  public prepareRefundBid(auctionId: string): Promise<PreparedFinalizeEntity> {
    return this.repository.prepareRefundBid(auctionId);
  }

  public confirmRefundBid(input: {
    auctionId: string;
    txSignature: string;
  }): Promise<AuctionDetailEntity> {
    return this.repository.confirmRefundBid(input);
  }
}
