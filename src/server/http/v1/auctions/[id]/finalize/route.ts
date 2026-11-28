import "server-only";
import { z } from "zod";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import {
  confirmRefundBidUseCase,
  confirmSettleAuctionUseCase,
  prepareRefundBidUseCase,
  prepareSettleAuctionUseCase,
} from "@/server/modules/auction/application/auction.usecase";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const finalizeBodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("settle_prepare") }),
  z.object({
    action: z.literal("settle_confirm"),
    txSignature: z.string().trim().min(32).max(128),
  }),
  z.object({ action: z.literal("refund_prepare") }),
  z.object({
    action: z.literal("refund_confirm"),
    txSignature: z.string().trim().min(32).max(128),
  }),
]);

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requirePlayerSession();
    const { id } = await context.params;
    const body = finalizeBodySchema.parse(await request.json());

    if (body.action === "settle_prepare") {
      const data = await prepareSettleAuctionUseCase({
        userId: session.userId,
        sessionWallet: session.walletAddress,
        auctionId: id,
      });
      return okResponse(data);
    }
    if (body.action === "settle_confirm") {
      const data = await confirmSettleAuctionUseCase({
        userId: session.userId,
        sessionWallet: session.walletAddress,
        auctionId: id,
        txSignature: body.txSignature,
      });
      return okResponse(data);
    }
    if (body.action === "refund_prepare") {
      const data = await prepareRefundBidUseCase({
        userId: session.userId,
        sessionWallet: session.walletAddress,
        auctionId: id,
      });
      return okResponse(data);
    }
    const data = await confirmRefundBidUseCase({
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
