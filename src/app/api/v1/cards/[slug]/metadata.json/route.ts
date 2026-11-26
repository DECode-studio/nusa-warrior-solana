import { NextResponse } from "next/server";
import { getCardDetailUseCase } from "@/server/modules/card/application/card.usecase";
import { handleRouteError } from "@/server/shared/http/api-response";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

function resolveBaseUrl(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function resolveAbsoluteAssetUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalized}`;
}

export async function GET(
  request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const { slug } = await context.params;
    const card = await getCardDetailUseCase(slug);
    const baseUrl = resolveBaseUrl(request);
    const imageUrl = resolveAbsoluteAssetUrl(baseUrl, card.imagePath);
    const externalUrl = `${baseUrl}/id/cards/${card.slug}`;

    const tokenStandard =
      card.tokenStandard ??
      (card.isCustom || card.isRareEdition ? "MPL_CORE" : "TOKEN_2022");

    const edition = card.isCustom
      ? "Custom Forge"
      : card.isRareEdition
        ? "Rare Edition"
        : "Regular";

    const description =
      card.cardType === "INSTRUMENT"
        ? (card.effectDescriptionEn ??
          card.effectDescriptionId ??
          card.historicalSummaryEn)
        : card.historicalSummaryEn || card.historicalSummaryId;

    const attributes: Array<{ trait_type: string; value: string | number }> = [
      { trait_type: "Card Type", value: card.cardType },
      { trait_type: "Kingdom", value: card.kingdom },
      { trait_type: "Role", value: card.role },
      { trait_type: "Edition", value: edition },
      { trait_type: "Token Standard", value: tokenStandard },
      { trait_type: "Base Attack", value: card.baseAttack },
      { trait_type: "Base Defense", value: card.baseDefense },
    ];

    if (card.gender) {
      attributes.push({ trait_type: "Gender", value: card.gender });
    }
    if (card.effectName) {
      attributes.push({ trait_type: "Effect", value: card.effectName });
    }
    if (card.effectType) {
      attributes.push({ trait_type: "Effect Type", value: card.effectType });
    }

    const metadata = {
      name: card.name,
      symbol: "NUSA",
      description,
      image: imageUrl,
      external_url: externalUrl,
      attributes,
      properties: {
        files: [
          {
            uri: imageUrl,
            type: imageUrl.endsWith(".png") ? "image/png" : "image/webp",
          },
        ],
        category: "image",
        nusa: {
          id: card.id,
          code: card.code,
          slug: card.slug,
          cardType: card.cardType,
          kingdom: card.kingdom,
          role: card.role,
          baseAttack: card.baseAttack,
          baseDefense: card.baseDefense,
          isCustom: Boolean(card.isCustom),
          isRareEdition: Boolean(card.isRareEdition),
          tokenStandard,
        },
      },
    };

    return NextResponse.json(metadata, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
