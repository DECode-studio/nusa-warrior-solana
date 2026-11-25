import { z } from "zod";
import {
  getPaymentGatewaySettingsUseCase,
  setPaymentGatewayModeUseCase,
  setUserPaymentModeOverrideUseCase,
} from "@/server/modules/payment/application/payment.usecase";
import { requireAdminSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { AppError } from "@/server/shared/errors/app-error";
import { parseJsonWithSchema } from "@/server/shared/validation/zod-helpers";

const updateGatewaySchema = z.discriminatedUnion("scope", [
  z.object({ scope: z.literal("global"), mode: z.enum(["DEV", "PROD"]) }),
  z.object({ scope: z.literal("user"), userId: z.string().min(1).max(160), mode: z.enum(["DEV", "PROD"]).nullable() }),
]);

async function requirePaymentAdmin() {
  const session = await requireAdminSession();
  if (session.role !== "ADMIN") throw AppError.forbidden("Hanya akun ADMIN yang dapat mengatur payment gateway.");
  return session;
}

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await requirePaymentAdmin();
    await enforceRateLimit(`admin:payment-gateway:read:${session.userId}`, { capacity: 30, refillPerSecond: 1 / 2 });
    const url = new URL(request.url);
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");
    const search = url.searchParams.get("search") ?? undefined;
    const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10)) : 10;
    return okResponse(await getPaymentGatewaySettingsUseCase({ page, limit, search }));
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requirePaymentAdmin();
    await enforceRateLimit(`admin:payment-gateway:update:${session.userId}`, { capacity: 30, refillPerSecond: 1 / 2 });
    const data = await parseJsonWithSchema(request, updateGatewaySchema, 8_192);
    const settings = data.scope === "global"
      ? await setPaymentGatewayModeUseCase(data.mode, session.userId)
      : await setUserPaymentModeOverrideUseCase(data.userId, data.mode);
    return okResponse(settings);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
