import { requireAdminSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { RemoteFileStorageService } from "@/server/shared/storage/remote-file-storage.service";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { AppError } from "@/server/shared/errors/app-error";

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requireAdminSession();
    await enforceRateLimit(`admin:team:upload:${session.userId}`, {
      capacity: 20,
      refillPerSecond: 1 / 3,
    });

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      throw AppError.validation("File gambar anggota tim wajib diunggah.");
    }

    if (file.size > 1 * 1024 * 1024) {
      throw AppError.validation("Ukuran file maksimal adalah 1 MB.");
    }

    const mimeType = file.type || "image/jpeg";
    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
      throw AppError.validation("Format file harus JPG, PNG, atau WebP.");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const uniqueName = `team-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const remoteResult = await RemoteFileStorageService.uploadFile({
      folder: "team",
      name: uniqueName,
      buffer,
      mimeType,
    });

    if (remoteResult?.url) {
      return okResponse({ url: remoteResult.url }, 201);
    }

    // Fallback if remote storage server is not configured in local environment
    const base64Url = `data:${mimeType};base64,${buffer.toString("base64")}`;
    return okResponse({ url: base64Url }, 201);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
