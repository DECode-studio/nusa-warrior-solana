import { z } from "zod";
import { requireAdminSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { mintMetaplexCoreCard } from "@/server/modules/solana/card-minting.service";

const mintRareSchema = z.object({
  cardSlug: z.string().min(1),
  recipientWallet: z.string().min(32).max(64),
  editionNumber: z.number().int().min(1).optional(),
});

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    await requireAdminSession();

    const body = mintRareSchema.parse(await request.json());
    const result = await mintMetaplexCoreCard({
      cardSlug: body.cardSlug,
      recipientWallet: body.recipientWallet,
      editionNumber: body.editionNumber,
    });

    return okResponse(result, 201);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
