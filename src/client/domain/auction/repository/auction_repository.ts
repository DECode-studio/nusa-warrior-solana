import type {
  AuctionDetailEntity,
  AuctionListEntity,
  AuctionListingEntity,
  AuctionSort,
  AuctionTab,
  AuctionTokenStandard,
  PreparedBidEntity,
  PreparedCreateAuctionEntity,
  PreparedFinalizeEntity,
  PreparedManageAuctionEntity,
} from "../entity/auction_entity";

export interface AuctionListQuery {
  tab: AuctionTab;
  kingdom?: string;
  cardType?: string;
  search?: string;
  sort?: AuctionSort;
  page?: number;
  pageSize?: number;
}

export interface AuctionRepository {
  listAuctions(query: AuctionListQuery): Promise<AuctionListEntity>;
  getAuctionDetail(auctionId: string): Promise<AuctionDetailEntity>;
  prepareCreateAuction(input: {
    cardId: string;
    startingPrice: number;
    durationMinutes: number;
  }): Promise<PreparedCreateAuctionEntity>;
  confirmCreateAuction(input: {
    auctionId: string;
    cardId: string;
    cardMintOrAsset: string;
    tokenStandard: AuctionTokenStandard;
    collectionAddress: string;
    startingPrice: number;
    durationMinutes: number;
    txSignature: string;
  }): Promise<AuctionListingEntity>;
  prepareEditAuction(input: {
    auctionId: string;
    startingPrice: number;
    durationMinutes: number;
  }): Promise<PreparedManageAuctionEntity>;
  confirmEditAuction(input: {
    auctionId: string;
    startingPrice: number;
    durationMinutes: number;
    txSignature: string;
  }): Promise<AuctionListingEntity>;
  prepareCancelAuction(auctionId: string): Promise<PreparedManageAuctionEntity>;
  confirmCancelAuction(input: {
    auctionId: string;
    txSignature: string;
  }): Promise<AuctionListingEntity>;
  preparePlaceBid(input: {
    auctionId: string;
    amount: number;
  }): Promise<PreparedBidEntity>;
  confirmPlaceBid(input: {
    auctionId: string;
    amount: number;
    deltaAmount: number;
    bidEscrowPda: string;
    txSignature: string;
  }): Promise<AuctionDetailEntity>;
  prepareSettleAuction(auctionId: string): Promise<PreparedFinalizeEntity>;
  confirmSettleAuction(input: {
    auctionId: string;
    txSignature: string;
  }): Promise<AuctionDetailEntity>;
  prepareRefundBid(auctionId: string): Promise<PreparedFinalizeEntity>;
  confirmRefundBid(input: {
    auctionId: string;
    txSignature: string;
  }): Promise<AuctionDetailEntity>;
}
