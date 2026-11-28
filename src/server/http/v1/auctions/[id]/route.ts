import "server-only";
import { z } from "zod";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import {
  confirmCancelAuctionUseCase,
  confirmUpdateAuctionUseCase,
  getAuctionDetailUseCase,
} from "@/server/modules/auction/application/auction.usecase";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const confirmUpdateSchema = z.object({
  startingPrice: z.number().int().min(50),
  durationHours: z.number().int().min(1).max(24),
  txSignature: z.string().trim().min(32).max(128),
});

const confirmCancelSchema = z.object({
  txSignature: z.string().trim().min(32).max(128),
});

export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await requirePlayerSession();
    const { id } = await context.params;
    const data = await getAuctionDetailUseCase({
      auctionId: id,
      userId: session.userId,
    });
    return okResponse(data);
  } catch (error) {
    return handleRouteError(error, request);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requirePlayerSession();
    const { id } = await context.params;
    const body = confirmUpdateSchema.parse(await request.json());
    const data = await confirmUpdateAuctionUseCase({
      userId: session.userId,
      sessionWallet: session.walletAddress,
      auctionId: id,
      ...body,
    });
    return okResponse(data);
  } catch (error) {
    return handleRouteError(error, request);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await requirePlayerSession();
    const { id } = await context.params;
    const body = confirmCancelSchema.parse(await request.json());
    const data = await confirmCancelAuctionUseCase({
      userId: session.userId,
      sessionWallet: session.walletAddress,
      auctionId: id,
      txSignature: body.txSignature,
    });
    return okResponse(data);
  } catch (error) {
    return handleRouteError(error, request);
  }
}
