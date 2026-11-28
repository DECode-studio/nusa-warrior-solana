import "server-only";
import { z } from "zod";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import {
  prepareCancelAuctionUseCase,
  prepareUpdateAuctionUseCase,
} from "@/server/modules/auction/application/auction.usecase";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const prepareEditSchema = z.object({
  action: z.literal("edit"),
  startingPrice: z.number().int().min(50),
  durationMinutes: z.number().int().min(5).max(1440),
});

const prepareCancelSchema = z.object({
  action: z.literal("cancel"),
});

const prepareManageSchema = z.discriminatedUnion("action", [
  prepareEditSchema,
  prepareCancelSchema,
]);

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requirePlayerSession();
    const { id } = await context.params;
    const body = prepareManageSchema.parse(await request.json());

    if (body.action === "edit") {
      const data = await prepareUpdateAuctionUseCase({
        userId: session.userId,
        sessionWallet: session.walletAddress,
        auctionId: id,
        startingPrice: body.startingPrice,
        durationMinutes: body.durationMinutes,
      });
      return okResponse(data);
    }

    const data = await prepareCancelAuctionUseCase({
      userId: session.userId,
      sessionWallet: session.walletAddress,
      auctionId: id,
    });
    return okResponse(data);
  } catch (error) {
    return handleRouteError(error, request);
  }
}
