import { z } from "zod";
import { checkoutTopupOrderUseCase } from "@/server/modules/payment/application/topup.usecase";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { parseJsonWithSchema } from "@/server/shared/validation/zod-helpers";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { AppError } from "@/server/shared/errors/app-error";

const topupCheckoutSchema = z.object({
  buyerName: z.string().trim().min(2).max(120),
  buyerEmail: z.string().trim().email().max(254),
  amountIdr: z.number().int().positive(),
  paymentMethod: z.enum(["QRIS", "VIRTUAL_ACCOUNT"]),
  paymentChannel: z.string().min(2).max(40),
});

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requirePlayerSession();

    if (session.isGuest) {
      throw AppError.forbidden("Fitur Top Up Nusa Point hanya tersedia untuk akun terdaftar. Silakan masuk atau buat akun.");
    }

    await enforceRateLimit(`shop:topup:${session.userId}`, { capacity: 3, refillPerSecond: 3 / 300 });
    const parsed = await parseJsonWithSchema(request, topupCheckoutSchema, 16_384);

    const order = await checkoutTopupOrderUseCase({
      userId: session.userId,
      buyerName: parsed.buyerName,
      buyerEmail: parsed.buyerEmail,
      amountIdr: parsed.amountIdr,
      paymentMethod: parsed.paymentMethod,
      paymentChannel: parsed.paymentChannel,
    });

    return okResponse(order, 201);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

