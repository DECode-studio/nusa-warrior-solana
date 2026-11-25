import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { parse as parseFont, type Font } from "opentype.js";
import type { Kingdom, CharacterGender, CharacterRole } from "@prisma/client";
import { RemoteFileStorageService } from "@/server/shared/storage/remote-file-storage.service";
import {
  TEMPLATE_THEME_COLORS,
  DEFAULT_TEMPLATE_THEME_COLORS,
} from "@/core/constants/custom-card-theme";

export interface CustomCardRenderInput {
  slug: string;
  kingdom: Kingdom;
  name: string;
  gender: CharacterGender;
  role: CharacterRole;
  attack: number;
  defense: number;
  description: string;
  artworkBuffer: Buffer;
  cropScale?: number;
  cropOffsetX?: number;
  cropOffsetY?: number;
}

const KINGDOM_FOLDER_MAP: Record<Kingdom, string> = {
  MAJAPAHIT: "majapahit",
  PAJAJARAN: "pajajaran",
  DEMAK_CIREBON: "demak",
  BANTEN: "banten",
  DAHA_KADIRI: "daha",
  PORTUGIS: "portugis",
  NUSANTARA_UMUM: "keta",
};

const KINGDOM_LABEL_MAP: Record<Kingdom, string> = {
  MAJAPAHIT: "Majapahit",
  PAJAJARAN: "Pajajaran",
  DEMAK_CIREBON: "Demak",
  BANTEN: "Banten",
  DAHA_KADIRI: "Daha/Kadiri",
  PORTUGIS: "Portugis",
  NUSANTARA_UMUM: "Nusantara",
};

const ROLE_LABEL_MAP: Record<CharacterRole, string> = {
  PEMIMPIN: "Pemimpin",
  PRAJURIT: "Prajurit",
  PEMUKA: "Pemuka",
  PERAJIN: "Perajin",
  UTUSAN: "Utusan",
};

const GENDER_LABEL_MAP: Record<CharacterGender, string> = {
  LAKI_LAKI: "Laki - laki",
  PEREMPUAN: "Perempuan",
};

function wrapText(text: string, maxCharsPerLine = 54): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + " " + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.slice(0, 4);
}

interface ParsedFonts {
  mothproof: Font;
  abril: Font;
  abhaya: Font;
}

let cachedParsedFonts: ParsedFonts | null = null;

async function getParsedFonts(): Promise<ParsedFonts> {
  if (cachedParsedFonts) {
    return cachedParsedFonts;
  }

  const fontsDir = path.resolve(process.cwd(), "public/fonts");
  const [mothproofBuf, abrilBuf, abhayaBuf] = await Promise.all([
    fs.readFile(path.join(fontsDir, "MothproofScript.ttf")),
    fs.readFile(path.join(fontsDir, "AbrilFatface-Regular.ttf")),
    fs.readFile(path.join(fontsDir, "AbhayaLibre-Regular.ttf")),
  ]);

  const toArrayBuffer = (buf: Buffer): ArrayBuffer => {
    const ab = new ArrayBuffer(buf.length);
    const view = new Uint8Array(ab);
    view.set(buf);
    return ab;
  };

  cachedParsedFonts = {
    mothproof: parseFont(toArrayBuffer(mothproofBuf)),
    abril: parseFont(toArrayBuffer(abrilBuf)),
    abhaya: parseFont(toArrayBuffer(abhayaBuf)),
  };

  return cachedParsedFonts;
}

function textToSvgPath(
  font: Font,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  align: "left" | "center" | "right" = "center",
  fill = "#000000"
): string {
  const width = font.getAdvanceWidth(text, fontSize);
  let startX = x;
  if (align === "center") {
    startX = x - width / 2;
  } else if (align === "right") {
    startX = x - width;
  }
  const p = font.getPath(text, startX, y, fontSize);
  p.fill = fill;
  return p.toSVG(2);
}

export class CustomCardCompositorService {
  public static readonly CARD_WIDTH = 1024;
  public static readonly CARD_HEIGHT = 1505;

  static async renderAndSaveCard(input: CustomCardRenderInput): Promise<{ imagePath: string }> {
    const kingdomFolder = KINGDOM_FOLDER_MAP[input.kingdom] ?? "majapahit";
    const templateDir = path.resolve(process.cwd(), "public/assets/card-templates", kingdomFolder);
    const framePath = path.join(templateDir, "frame.png");
    let bgPath = path.join(templateDir, "background.png");

    // Jika background per-kerajaan tidak ada, fallback ke majapahit
    try {
      await fs.access(bgPath);
    } catch {
      bgPath = path.resolve(process.cwd(), "public/assets/card-templates/majapahit/background.png");
    }

    const { CARD_WIDTH, CARD_HEIGHT } = CustomCardCompositorService;

    // 1. Siapkan background (1024 x 1505)
    const bgBuffer = await sharp(bgPath)
      .resize(CARD_WIDTH, CARD_HEIGHT, { fit: "fill" })
      .toBuffer();

    // 2. Siapkan frame border ornamen (1024 x 1505)
    const frameBuffer = await sharp(framePath)
      .resize(CARD_WIDTH, CARD_HEIGHT, { fit: "fill" })
      .toBuffer();

    // 3. Siapkan artwork user dengan transform pan & zoom presisi (Menjaga Rasio Asli)
    const zoom = input.cropScale && input.cropScale > 0 ? input.cropScale : 1;
    const panX = input.cropOffsetX ?? 0;
    const panY = input.cropOffsetY ?? 0;

    const rawArtworkSharp = sharp(input.artworkBuffer);
    const meta = await rawArtworkSharp.metadata();
    const rawArtworkPng = await rawArtworkSharp.png().toBuffer();
    const artworkBase64 = `data:image/png;base64,${rawArtworkPng.toString("base64")}`;

    const imgWidth = meta.width && meta.width > 0 ? meta.width : 1024;
    const imgHeight = meta.height && meta.height > 0 ? meta.height : 860;
    const aspect = imgWidth / imgHeight;

    let baseW: number;
    let baseH: number;
    if (aspect >= 924 / 800) {
      baseH = 900;
      baseW = baseH * aspect;
    } else {
      baseW = 1000;
      baseH = baseW / aspect;
    }

    const cx = 512;
    const cy = 450;
    const x0 = cx - baseW / 2;
    const y0 = cy - baseH / 2;

    const artworkSvg = Buffer.from(`
      <svg width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(${cx + panX}, ${cy + panY}) scale(${zoom}) translate(-${cx}, -${cy})">
          <image href="${artworkBase64}" x="${x0}" y="${y0}" width="${baseW}" height="${baseH}" preserveAspectRatio="none" />
        </g>
      </svg>
    `);

    // 4. Siapkan vector path tipografi asli (MothproofScript, Abril Fatface, Abhaya Libre)
    const { mothproof, abril, abhaya } = await getParsedFonts();
    const colors = TEMPLATE_THEME_COLORS[kingdomFolder] ?? DEFAULT_TEMPLATE_THEME_COLORS;

    const badgeText = `${GENDER_LABEL_MAP[input.gender]} • ${ROLE_LABEL_MAP[input.role]} • ${KINGDOM_LABEL_MAP[input.kingdom]}`;
    const formattedAtk = input.attack.toLocaleString("id-ID");
    const formattedDef = input.defense.toLocaleString("id-ID");

    const descLines = wrapText(input.description, 54);

    const paths: string[] = [];

    // Nama Karakter (Plaque Marmer: x=511, baseline y=904, fontSize=60)
    paths.push(textToSvgPath(mothproof, input.name, 511, 904, 60, "center", colors.name));

    // Badge Info (Pita Emas: x=511, baseline y=974, fontSize=26)
    paths.push(textToSvgPath(abril, badgeText, 511, 974, 26, "center", colors.badge));

    // Attack (Kotak Marmer Merah: label x=288 y=1067 size=26, value x=293 y=1127 size=61)
    paths.push(textToSvgPath(abril, "attack", 288, 1067, 26, "center", colors.stat));
    paths.push(textToSvgPath(abril, formattedAtk, 293, 1127, 61, "center", colors.stat));

    // Defence (Kotak Marmer Biru: label x=746 y=1066 size=26, value x=743 y=1127 size=61)
    paths.push(textToSvgPath(abril, "deffence", 746, 1066, 26, "center", colors.stat));
    paths.push(textToSvgPath(abril, formattedDef, 743, 1127, 61, "center", colors.stat));

    // Label Deskripsi (Kotak Kertas Perkamen: x=512, baseline y=1226, fontSize=26)
    paths.push(textToSvgPath(abril, "Deskripsi", 512, 1226, 26, "center", colors.descLabel));

    // Narasi Deskripsi Sejarah (x=512, baseline y=1284, dy=28 per baris, fontSize=22)
    descLines.forEach((line, idx) => {
      paths.push(
        textToSvgPath(abhaya, line, 512, 1284 + idx * 28, 22, "center", colors.descContent)
      );
    });

    const svgOverlay = Buffer.from(`
      <svg width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        ${paths.join("\n")}
      </svg>
    `);

    // 5. Komposisi Multi-layer ke Buffer WebP di Memori
    const webpBuffer = await sharp(bgBuffer)
      .composite([
        { input: artworkSvg, top: 0, left: 0 },
        { input: frameBuffer, top: 0, left: 0 },
        { input: svgOverlay, top: 0, left: 0 },
      ])
      .webp({ quality: 92, effort: 4 })
      .toBuffer();

    // 6. Upload langsung ke Remote File Storage API (Excitech / Menu Kita Storage)
    const remoteResult = await RemoteFileStorageService.uploadFile({
      folder: "cards/custom",
      name: input.slug,
      buffer: webpBuffer,
      mimeType: "image/webp",
    });

    if (remoteResult?.url) {
      return {
        imagePath: remoteResult.url,
      };
    }

    // Graceful Fallback: Simpan ke disk lokal jika remote storage tidak merespons
    const outputDir = path.resolve(process.cwd(), "public/cards/custom");
    await fs.mkdir(outputDir, { recursive: true });
    const outputFilePath = path.join(outputDir, `${input.slug}.webp`);
    await fs.writeFile(outputFilePath, webpBuffer);

    return {
      imagePath: `/cards/custom/${input.slug}.webp`,
    };
  }
}
