import type {
  AuctionDetailEntity,
  AuctionListEntity,
  AuctionListingEntity,
  PreparedBidEntity,
  PreparedCreateAuctionEntity,
  PreparedFinalizeEntity,
  PreparedManageAuctionEntity,
} from "@/client/domain/auction/entity/auction_entity";

export type AuctionListApiModel = AuctionListEntity;
export type AuctionListingApiModel = AuctionListingEntity;
export type AuctionDetailApiModel = AuctionDetailEntity;
export type PreparedCreateAuctionApiModel = PreparedCreateAuctionEntity;
export type PreparedManageAuctionApiModel = PreparedManageAuctionEntity;
export type PreparedBidApiModel = PreparedBidEntity;
export type PreparedFinalizeApiModel = PreparedFinalizeEntity;

export function mapAuctionListToEntity(
  raw: AuctionListApiModel
): AuctionListEntity {
  return { ...raw };
}

export function mapAuctionListingToEntity(
  raw: AuctionListingApiModel
): AuctionListingEntity {
  return { ...raw };
}

export function mapAuctionDetailToEntity(
  raw: AuctionDetailApiModel
): AuctionDetailEntity {
  return { ...raw };
}
