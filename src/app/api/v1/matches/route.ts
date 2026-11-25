import { NextResponse } from "next/server";
import { listMatchesUseCase } from "@/server/modules/battle/application/battle.usecase";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import {
  handleRouteError,
  okResponse,
} from "@/server/shared/http/api-response";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import {
  localizeServerMessage,
  resolveServerLocale,
} from "@/core/translator/server-messages";

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await requirePlayerSession();
    await enforceRateLimit(`matches:read:${session.userId}`, { capacity: 60, refillPerSecond: 1 });
    const matches = await listMatchesUseCase(session.userId);
    return okResponse(matches);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

export async function POST(request: Request): Promise<Response> {
  const locale = resolveServerLocale(
    request.headers.get("x-app-locale"),
    request.headers.get("accept-language")
  );
  const localized = localizeServerMessage(
    "Hasil pertandingan hanya dicatat oleh server saat match authoritative selesai.",
    locale,
    "BAD_REQUEST"
  );
  const response = NextResponse.json(
    {
      success: false,
      error: {
        code: "ENDPOINT_RETIRED",
        messageKey: localized.messageKey,
        message: localized.message,
      },
    },
    { status: 410 }
  );
  response.headers.set("Content-Language", locale);
  return response;
}

