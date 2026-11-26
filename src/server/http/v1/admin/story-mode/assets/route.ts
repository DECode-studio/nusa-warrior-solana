import { listStoryMediaAssetsUseCase, uploadStoryMediaAssetUseCase } from "@/server/modules/story-mode/application/story-media.usecase";
import { requireAdminSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { AppError } from "@/server/shared/errors/app-error";

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await requireAdminSession();
    await enforceRateLimit(`admin:story:assets:${session.userId}`, { capacity: 60, refillPerSecond: 1 });
    return okResponse(await listStoryMediaAssetsUseCase());
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requireAdminSession();
    await enforceRateLimit(`admin:story:asset-upload:${session.userId}`, { capacity: 10, refillPerSecond: 1 / 60 });
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 13 * 1024 * 1024) throw AppError.validation("Ukuran upload melebihi batas 12 MB.");
    const form = await request.formData();
    const item = form.get("file");
    if (!(item instanceof File)) throw AppError.validation("Pilih file media yang akan diunggah.");
    const bytes = new Uint8Array(await item.arrayBuffer());
    const asset = await uploadStoryMediaAssetUseCase({ fileName: item.name, mimeType: item.type, bytes, actorId: session.userId });
    return okResponse(asset, 201);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
