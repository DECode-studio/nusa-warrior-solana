import "server-only";
import { z } from "zod";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import {
  confirmPlaceBidUseCase,
  preparePlaceBidUseCase,
} from "@/server/modules/auction/application/auction.usecase";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const prepareBidSchema = z.object({
  mode: z.literal("prepare"),
  amount: z.number().int().min(50),
});

const confirmBidSchema = z.object({
  mode: z.literal("confirm"),
  amount: z.number().int().min(50),
  deltaAmount: z.number().int().min(1),
  bidEscrowPda: z.string().trim().min(32).max(64),
  txSignature: z.string().trim().min(32).max(128),
});

const bidBodySchema = z.discriminatedUnion("mode", [
  prepareBidSchema,
  confirmBidSchema,
]);

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requirePlayerSession();
    const { id } = await context.params;
    const body = bidBodySchema.parse(await request.json());

    if (body.mode === "prepare") {
      const data = await preparePlaceBidUseCase({
        userId: session.userId,
        sessionWallet: session.walletAddress,
        auctionId: id,
        amount: body.amount,
      });
      return okResponse(data);
    }

    const data = await confirmPlaceBidUseCase({
      userId: session.userId,
      sessionWallet: session.walletAddress,
      auctionId: id,
      amount: body.amount,
      deltaAmount: body.deltaAmount,
      bidEscrowPda: body.bidEscrowPda,
      txSignature: body.txSignature,
    });
    return okResponse(data, 201);
  } catch (error) {
    return handleRouteError(error, request);
  }
}
