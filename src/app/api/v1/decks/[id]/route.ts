import { z } from "zod";
import { deleteDeckUseCase, updateDeckUseCase } from "@/server/modules/deck/application/deck.usecase";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { parseJsonWithSchema } from "@/server/shared/validation/zod-helpers";
import {
  handleRouteError,
  okResponse,
} from "@/server/shared/http/api-response";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const updateDeckSchema = z
  .object({
    name: z.string().min(2, "Nama deck minimal 2 karakter.").max(60),
    description: z.string().max(250).nullable().optional(),
    kingdomFilter: z.enum(["MAJAPAHIT", "PAJAJARAN", "NUSANTARA_UMUM", "MIXED"]).nullable().optional(),
    characterSlugs: z.array(z.string().min(1).max(160)).min(1).max(10),
    instrumentSlugs: z.array(z.string().min(1).max(160)).max(10),
  })
  .refine((data) => data.characterSlugs.length + data.instrumentSlugs.length <= 20, {
    message: "Total kartu dalam satu deck maksimal 20 kartu.",
    path: ["total"],
  });

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const { id } = await context.params;
    const session = await requirePlayerSession();
    await enforceRateLimit(`deck:update:${session.userId}`, { capacity: 10, refillPerSecond: 10 / 60 });
    const parsed = await parseJsonWithSchema(request, updateDeckSchema, 16_384);
    const updated = await updateDeckUseCase(id, {
      name: parsed.name,
      description: parsed.description ?? null,
      kingdomFilter: parsed.kingdomFilter ?? "MIXED",
      characterSlugs: parsed.characterSlugs,
      instrumentSlugs: parsed.instrumentSlugs,
    }, session.userId);
    return okResponse(updated);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const { id } = await context.params;
    const session = await requirePlayerSession();
    await enforceRateLimit(`deck:delete:${session.userId}`, { capacity: 10, refillPerSecond: 10 / 60 });
    await deleteDeckUseCase(id, session.userId);
    return okResponse({ deleted: true, id });
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

