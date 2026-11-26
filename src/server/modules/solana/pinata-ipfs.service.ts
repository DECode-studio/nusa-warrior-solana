import "server-only";
import fs from "node:fs";
import path from "node:path";

export interface PinataCardMetadataInput {
  id: string;
  code: string;
  slug: string;
  name: string;
  cardType: string;
  kingdom: string;
  role: string;
  gender?: string | null;
  baseAttack: number;
  baseDefense: number;
  effectName?: string | null;
  effectType?: string | null;
  effectDescriptionEn?: string | null;
  effectDescriptionId?: string | null;
  historicalSummaryEn: string;
  historicalSummaryId: string;
  imagePath: string;
  isCustom?: boolean;
  isRareEdition?: boolean;
  tokenStandard?: string;
}

export function isPinataConfigured(): boolean {
  return Boolean(process.env.PINATA_JWT?.trim());
}

function getPinataJwt(): string {
  const jwt = process.env.PINATA_JWT?.trim();
  if (!jwt) {
    throw new Error("PINATA_JWT belum dikonfigurasi di .env.");
  }
  return jwt;
}

function getPinataGatewayBase(): string {
  const raw =
    process.env.PINATA_GATEWAY_URL?.trim() || "https://gateway.pinata.cloud";
  return raw.replace(/\/+$/, "");
}

export async function pinFileBufferToIpfs(input: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}): Promise<{ cid: string; url: string }> {
  const jwt = getPinataJwt();
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(input.buffer)], {
    type: input.mimeType,
  });
  formData.append("file", blob, input.fileName);
  formData.append(
    "pinataMetadata",
    JSON.stringify({ name: `nusa-card-${input.fileName}` })
  );

  const response = await fetch(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}` },
      body: formData,
      signal: AbortSignal.timeout(30_000),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Pinata pinFileToIPFS failed (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as { IpfsHash: string };
  return {
    cid: data.IpfsHash,
    url: `${getPinataGatewayBase()}/ipfs/${data.IpfsHash}`,
  };
}

export async function pinJsonToIpfs(input: {
  name: string;
  content: Record<string, unknown>;
}): Promise<{ cid: string; url: string }> {
  const jwt = getPinataJwt();
  const response = await fetch(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pinataMetadata: { name: input.name },
        pinataContent: input.content,
      }),
      signal: AbortSignal.timeout(30_000),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Pinata pinJSONToIPFS failed (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as { IpfsHash: string };
  return {
    cid: data.IpfsHash,
    url: `${getPinataGatewayBase()}/ipfs/${data.IpfsHash}`,
  };
}

async function resolveCardImageBuffer(
  imagePath: string
): Promise<{ buffer: Buffer; fileName: string; mimeType: string } | null> {
  if (/^https?:\/\//i.test(imagePath)) {
    const res = await fetch(imagePath, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const ext = imagePath.toLowerCase().endsWith(".png") ? "png" : "webp";
    return {
      buffer: Buffer.from(arrayBuffer),
      fileName: `card.${ext}`,
      mimeType: ext === "png" ? "image/png" : "image/webp",
    };
  }

  const cleanRelative = imagePath.replace(/^\/+/, "");
  const fullPath = path.join(process.cwd(), "public", cleanRelative);
  if (!fs.existsSync(fullPath)) return null;
  const ext = fullPath.toLowerCase().endsWith(".png") ? "png" : "webp";
  return {
    buffer: fs.readFileSync(fullPath),
    fileName: path.basename(fullPath),
    mimeType: ext === "png" ? "image/png" : "image/webp",
  };
}

export async function buildAndPinCardMetadata(
  card: PinataCardMetadataInput
): Promise<string> {
  const imageData = await resolveCardImageBuffer(card.imagePath);
  const imageUrl = imageData
    ? (
        await pinFileBufferToIpfs({
          buffer: imageData.buffer,
          fileName: `${card.slug}.${imageData.mimeType === "image/png" ? "png" : "webp"}`,
          mimeType: imageData.mimeType,
        })
      ).url
    : card.imagePath;

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
  if (card.gender) attributes.push({ trait_type: "Gender", value: card.gender });
  if (card.effectName)
    attributes.push({ trait_type: "Effect", value: card.effectName });
  if (card.effectType)
    attributes.push({ trait_type: "Effect Type", value: card.effectType });

  const pinnedJson = await pinJsonToIpfs({
    name: `nusa-metadata-${card.slug}.json`,
    content: {
      name: card.name,
      symbol: "NUSA",
      description,
      image: imageUrl,
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
    },
  });

  return pinnedJson.url;
}
