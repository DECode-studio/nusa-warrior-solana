import { z } from "zod";
import {
  createDeckUseCase,
  listDecksUseCase,
} from "@/server/modules/deck/application/deck.usecase";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { parseJsonWithSchema } from "@/server/shared/validation/zod-helpers";
import {
  handleRouteError,
  okResponse,
} from "@/server/shared/http/api-response";

const createDeckSchema = z
  .object({
    name: z.string().min(2, "Nama deck minimal 2 karakter.").max(60),
    description: z.string().max(250).nullable().optional(),
    kingdomFilter: z
      .enum(["MAJAPAHIT", "PAJAJARAN", "NUSANTARA_UMUM", "MIXED"])
      .nullable()
      .optional(),
    characterSlugs: z
      .array(z.string().min(1).max(160))
      .min(1, "Deck wajib memiliki minimal 1 kartu Karakter.")
      .max(10, "Deck maksimal memiliki 10 kartu Karakter."),
    instrumentSlugs: z
      .array(z.string().min(1).max(160))
      .max(10, "Deck maksimal memiliki 10 kartu Waditra (Instrumen)."),
  })
  .refine(
    (data) => data.characterSlugs.length + data.instrumentSlugs.length <= 20,
    {
      message: "Total kartu dalam satu deck maksimal 20 kartu.",
      path: ["total"],
    }
  );

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await requirePlayerSession();
    const decks = await listDecksUseCase(session.userId);
    return okResponse(decks);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requirePlayerSession();
    await enforceRateLimit(`deck:create:${session.userId}`, { capacity: 10, refillPerSecond: 10 / 60 });
    const parsed = await parseJsonWithSchema(request, createDeckSchema, 16_384);

    const created = await createDeckUseCase({
      name: parsed.name,
      description: parsed.description ?? null,
      kingdomFilter: parsed.kingdomFilter ?? "MIXED",
      userId: session.userId,
      characterSlugs: parsed.characterSlugs,
      instrumentSlugs: parsed.instrumentSlugs,
    });

    return okResponse(created, 201);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

