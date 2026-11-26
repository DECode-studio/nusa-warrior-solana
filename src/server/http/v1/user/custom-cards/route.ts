import { requireAuthSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import {
  createCustomCardUseCase,
  listUserCustomCardsUseCase,
} from "@/server/modules/card/application/custom-card.usecase";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { AppError } from "@/server/shared/errors/app-error";
import type { Kingdom, CharacterGender, CharacterRole } from "@prisma/client";

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await requireAuthSession();
    const cards = await listUserCustomCardsUseCase(session.userId);
    return okResponse(cards);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const session = await requireAuthSession();
    await enforceRateLimit(`custom-card:create:${session.userId}`, {
      capacity: 5,
      refillPerSecond: 5 / 60,
    });

    const formData = await request.formData();
    const name = String(formData.get("name") || "").trim();
    const kingdom = String(formData.get("kingdom") || "").trim() as Kingdom;
    const role = String(formData.get("role") || "").trim() as CharacterRole;
    const gender = String(formData.get("gender") || "").trim() as CharacterGender;
    const attack = Number(formData.get("attack") || 0);
    const defense = Number(formData.get("defense") || 0);
    const description = String(formData.get("description") || "").trim();
    const disclaimerAccepted = formData.get("disclaimerAccepted") === "true";

    const artworkEntry = formData.get("artwork");
    if (!artworkEntry || !(artworkEntry instanceof Blob)) {
      throw AppError.validation("File ilustrasi karakter wajib diunggah.", {
        artwork: ["Pilih file gambar berformat JPG, PNG, atau WebP."],
      });
    }

    if (artworkEntry.size > 5 * 1024 * 1024) {
      throw AppError.validation("Ukuran gambar maksimal adalah 5 MB.", {
        artwork: ["Ukuran file melebihi batas 5 MB."],
      });
    }

    const artworkArrayBuffer = await artworkEntry.arrayBuffer();
    const artworkBuffer = Buffer.from(artworkArrayBuffer);

    const cropScaleRaw = formData.get("cropScale");
    const cropOffsetXRaw = formData.get("cropOffsetX");
    const cropOffsetYRaw = formData.get("cropOffsetY");

    const cropScale = cropScaleRaw !== null ? Number(cropScaleRaw) : 1;
    const cropOffsetX = cropOffsetXRaw !== null ? Number(cropOffsetXRaw) : 0;
    const cropOffsetY = cropOffsetYRaw !== null ? Number(cropOffsetYRaw) : 0;
    const txSignatureRaw = formData.get("txSignature");
    const txSignature =
      typeof txSignatureRaw === "string" && txSignatureRaw.trim().length > 0
        ? txSignatureRaw.trim()
        : undefined;

    const result = await createCustomCardUseCase(session.userId, {
      name,
      kingdom,
      role,
      gender,
      attack,
      defense,
      description,
      disclaimerAccepted,
      artworkBuffer,
      cropScale: Number.isFinite(cropScale) ? cropScale : 1,
      cropOffsetX: Number.isFinite(cropOffsetX) ? cropOffsetX : 0,
      cropOffsetY: Number.isFinite(cropOffsetY) ? cropOffsetY : 0,
      txSignature,
    });

    return okResponse(result, 201);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
