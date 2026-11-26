import { z } from "zod";
import { createCardReportUseCase } from "@/server/modules/card/application/card.usecase";
import {
  handleRouteError,
  okResponse,
} from "@/server/shared/http/api-response";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { getClientIp } from "@/server/shared/http/client-ip";
import { parseJsonWithSchema } from "@/server/shared/validation/zod-helpers";
import { httpUrlSchema } from "@/server/shared/validation/url-schemas";

const createReportSchema = z.object({
  reporterName: z.string().min(2, "Nama pelapor minimal 2 karakter.").max(120),
  reporterEmail: z.string().email().max(254).nullable().optional(),
  category: z.enum([
    "HISTORICAL_SOURCE",
    "VISUAL_INTERPRETATION",
    "TERMINOLOGY_TRANSLATION",
    "CULTURAL_SENSITIVITY",
  ]),
  description: z.string().min(10, "Deskripsi koreksi minimal 10 karakter.").max(4000),
  referenceUrl: httpUrlSchema.nullable().optional(),
});

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function POST(
  request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    await enforceRateLimit(`card-report:ip:${getClientIp(request)}`, {
      capacity: 5,
      refillPerSecond: 1 / 3600,
    });
    const { slug } = await context.params;
    const parsed = await parseJsonWithSchema(request, createReportSchema, 16_384);

    const created = await createCardReportUseCase({
      cardSlug: slug,
      reporterName: parsed.reporterName,
      reporterEmail: parsed.reporterEmail ?? null,
      category: parsed.category,
      description: parsed.description,
      referenceUrl: parsed.referenceUrl ?? null,
    });

    return okResponse(created, 201);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

