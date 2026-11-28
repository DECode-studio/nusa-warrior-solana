import "server-only";
import { z } from "zod";
import { CardType, Kingdom } from "@prisma/client";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import {
  confirmCreateAuctionUseCase,
  listAuctionsUseCase,
} from "@/server/modules/auction/application/auction.usecase";

const listQuerySchema = z.object({
  tab: z.enum(["explore", "selling", "bidding", "history"]).default("explore"),
  kingdom: z.nativeEnum(Kingdom).optional(),
  cardType: z.nativeEnum(CardType).optional(),
  search: z.string().trim().max(80).optional(),
  sort: z
    .enum(["ending_soon", "price_asc", "price_desc", "most_bids", "newest"])
    .default("ending_soon"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(10).default(10),
});

const confirmCreateSchema = z.object({
  auctionId: z.string().trim().min(4).max(48),
  cardId: z.string().trim().min(1),
  cardMintOrAsset: z.string().trim().min(32).max(64),
  tokenStandard: z.enum(["TOKEN_2022", "MPL_CORE"]),
  collectionAddress: z.string().trim().default(""),
  startingPrice: z.number().int().min(50),
  durationHours: z.number().int().min(1).max(24),
  txSignature: z.string().trim().min(32).max(128),
});

export async function GET(request: Request) {
  try {
    const session = await requirePlayerSession();
    const url = new URL(request.url);
    const parsed = listQuerySchema.parse({
      tab: url.searchParams.get("tab") ?? undefined,
      kingdom: url.searchParams.get("kingdom") || undefined,
      cardType: url.searchParams.get("cardType") || undefined,
      search: url.searchParams.get("search") || undefined,
      sort: url.searchParams.get("sort") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
    });

    const data = await listAuctionsUseCase({
      userId: session.userId,
      sessionWallet: session.walletAddress,
      ...parsed,
    });
    return okResponse(data);
  } catch (error) {
    return handleRouteError(error, request);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requirePlayerSession();
    const body = confirmCreateSchema.parse(await request.json());
    const data = await confirmCreateAuctionUseCase({
      userId: session.userId,
      sessionWallet: session.walletAddress,
      ...body,
    });
    return okResponse(data, 201);
  } catch (error) {
    return handleRouteError(error, request);
  }
}
