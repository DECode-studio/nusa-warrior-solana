import { z } from "zod";
import { readStoryMediaAssetUseCase } from "@/server/modules/story-mode/application/story-media.usecase";
import { AppError } from "@/server/shared/errors/app-error";
import { handleRouteError } from "@/server/shared/http/api-response";

export async function GET(request: Request, context: { params: Promise<{ assetId: string }> }): Promise<Response> {
  try {
    const { assetId } = await context.params;
    const parsedId = z.string().uuid().safeParse(assetId);
    if (!parsedId.success) throw AppError.validation("ID media cerita tidak valid.");
    const asset = await readStoryMediaAssetUseCase(parsedId.data);
    if (!asset) throw AppError.notFound("Media cerita tidak ditemukan.");
    return new Response(new Uint8Array(asset.fileBytes), {
      headers: {
        "Content-Type": asset.mimeType,
        "Content-Length": String(asset.fileBytes.byteLength),
        "Cache-Control": "public, max-age=86400, immutable",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(asset.fileName)}`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
