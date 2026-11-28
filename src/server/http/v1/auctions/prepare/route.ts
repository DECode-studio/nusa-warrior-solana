import "server-only";
import { z } from "zod";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { prepareCreateAuctionUseCase } from "@/server/modules/auction/application/auction.usecase";

const prepareCreateSchema = z.object({
  cardId: z.string().trim().min(1),
  startingPrice: z.number().int().min(50),
  durationMinutes: z.number().int().min(5).max(1440),
});

export async function POST(request: Request) {
  try {
    const session = await requirePlayerSession();
    const body = prepareCreateSchema.parse(await request.json());
    const data = await prepareCreateAuctionUseCase({
      userId: session.userId,
      sessionWallet: session.walletAddress,
      ...body,
    });
    return okResponse(data);
  } catch (error) {
    return handleRouteError(error, request);
  }
}
