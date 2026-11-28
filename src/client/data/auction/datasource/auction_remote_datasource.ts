import { injectable } from "@needle-di/core";
import { API_ROUTES } from "@/core/constants/api-routes";
import { apiClient } from "@/core/http-client/api-client";
import type { AuctionListQuery } from "@/client/domain/auction/repository/auction_repository";
import type { AuctionTokenStandard } from "@/client/domain/auction/entity/auction_entity";
import type {
  AuctionDetailApiModel,
  AuctionListApiModel,
  AuctionListingApiModel,
  PreparedBidApiModel,
  PreparedCreateAuctionApiModel,
  PreparedFinalizeApiModel,
  PreparedManageAuctionApiModel,
} from "../model/auction_model";

@injectable()
export class AuctionRemoteDataSource {
  public async listAuctions(
    query: AuctionListQuery
  ): Promise<AuctionListApiModel> {
    return apiClient.get<AuctionListApiModel>(API_ROUTES.AUCTIONS.list, {
      tab: query.tab,
      kingdom: query.kingdom || undefined,
      cardType: query.cardType || undefined,
      search: query.search || undefined,
      sort: query.sort || undefined,
    });
  }

  public async getAuctionDetail(
    auctionId: string
  ): Promise<AuctionDetailApiModel> {
    return apiClient.get<AuctionDetailApiModel>(
      API_ROUTES.AUCTIONS.detail(auctionId)
    );
  }

  public async prepareCreateAuction(input: {
    cardId: string;
    startingPrice: number;
    durationHours: number;
  }): Promise<PreparedCreateAuctionApiModel> {
    return apiClient.post<PreparedCreateAuctionApiModel>(
      API_ROUTES.AUCTIONS.prepareCreate,
      input
    );
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
  }): Promise<AuctionListingApiModel> {
    return apiClient.post<AuctionListingApiModel>(
      API_ROUTES.AUCTIONS.list,
      input
    );
  }

  public async prepareEditAuction(input: {
    auctionId: string;
    startingPrice: number;
    durationHours: number;
  }): Promise<PreparedManageAuctionApiModel> {
    return apiClient.post<PreparedManageAuctionApiModel>(
      API_ROUTES.AUCTIONS.managePrepare(input.auctionId),
      {
        action: "edit",
        startingPrice: input.startingPrice,
        durationHours: input.durationHours,
      }
    );
  }

  public async confirmEditAuction(input: {
    auctionId: string;
    startingPrice: number;
    durationHours: number;
    txSignature: string;
  }): Promise<AuctionListingApiModel> {
    return apiClient.patch<AuctionListingApiModel>(
      API_ROUTES.AUCTIONS.detail(input.auctionId),
      {
        startingPrice: input.startingPrice,
        durationHours: input.durationHours,
        txSignature: input.txSignature,
      }
    );
  }

  public async prepareCancelAuction(
    auctionId: string
  ): Promise<PreparedManageAuctionApiModel> {
    return apiClient.post<PreparedManageAuctionApiModel>(
      API_ROUTES.AUCTIONS.managePrepare(auctionId),
      { action: "cancel" }
    );
  }

  public async confirmCancelAuction(input: {
    auctionId: string;
    txSignature: string;
  }): Promise<AuctionListingApiModel> {
    return apiClient.delete<AuctionListingApiModel>(
      API_ROUTES.AUCTIONS.detail(input.auctionId),
      { txSignature: input.txSignature }
    );
  }

  public async preparePlaceBid(input: {
    auctionId: string;
    amount: number;
  }): Promise<PreparedBidApiModel> {
    return apiClient.post<PreparedBidApiModel>(
      API_ROUTES.AUCTIONS.bids(input.auctionId),
      { mode: "prepare", amount: input.amount }
    );
  }

  public async confirmPlaceBid(input: {
    auctionId: string;
    amount: number;
    deltaAmount: number;
    bidEscrowPda: string;
    txSignature: string;
  }): Promise<AuctionDetailApiModel> {
    return apiClient.post<AuctionDetailApiModel>(
      API_ROUTES.AUCTIONS.bids(input.auctionId),
      {
        mode: "confirm",
        amount: input.amount,
        deltaAmount: input.deltaAmount,
        bidEscrowPda: input.bidEscrowPda,
        txSignature: input.txSignature,
      }
    );
  }

  public async prepareSettleAuction(
    auctionId: string
  ): Promise<PreparedFinalizeApiModel> {
    return apiClient.post<PreparedFinalizeApiModel>(
      API_ROUTES.AUCTIONS.finalize(auctionId),
      { action: "settle_prepare" }
    );
  }

  public async confirmSettleAuction(input: {
    auctionId: string;
    txSignature: string;
  }): Promise<AuctionDetailApiModel> {
    return apiClient.post<AuctionDetailApiModel>(
      API_ROUTES.AUCTIONS.finalize(input.auctionId),
      { action: "settle_confirm", txSignature: input.txSignature }
    );
  }

  public async prepareRefundBid(
    auctionId: string
  ): Promise<PreparedFinalizeApiModel> {
    return apiClient.post<PreparedFinalizeApiModel>(
      API_ROUTES.AUCTIONS.finalize(auctionId),
      { action: "refund_prepare" }
    );
  }

  public async confirmRefundBid(input: {
    auctionId: string;
    txSignature: string;
  }): Promise<AuctionDetailApiModel> {
    return apiClient.post<AuctionDetailApiModel>(
      API_ROUTES.AUCTIONS.finalize(input.auctionId),
      { action: "refund_confirm", txSignature: input.txSignature }
    );
  }
}
