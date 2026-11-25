import fs from "node:fs";
import path from "node:path";
import "ag-psd/initialize-canvas";
import { readPsd, type Layer } from "ag-psd";
import { createCanvas, type Canvas } from "canvas";

const STANDARD_WIDTH = 1024;
const STANDARD_HEIGHT = 1505;

interface TemplateConfig {
  slug: string;
  psdFileName: string;
  kingdom: string;
  backgroundLayerNames: string[];
  frameLayerName: string;
}

const TEMPLATES: TemplateConfig[] = [
  {
    slug: "majapahit",
    psdFileName: "nusantara-card.majapahit-template.psd",
    kingdom: "MAJAPAHIT",
    backgroundLayerNames: ["Lapisan 1"],
    frameLayerName: "Frame",
  },
  {
    slug: "pajajaran",
    psdFileName: "nusantara-card.pajajaran-template.psd",
    kingdom: "PAJAJARAN",
    backgroundLayerNames: ["Background copy", "Background"],
    frameLayerName: "Frame",
  },
  {
    slug: "demak",
    psdFileName: "nusantara-card.demak-template.psd",
    kingdom: "DEMAK_CIREBON",
    backgroundLayerNames: ["Background", "Lapisan 1"],
    frameLayerName: "Frame",
  },
  {
    slug: "banten",
    psdFileName: "nusantara-card.banten-template.psd",
    kingdom: "BANTEN",
    backgroundLayerNames: ["Background"],
    frameLayerName: "Frame",
  },
  {
    slug: "daha",
    psdFileName: "nusantara-card.daha-template.psd",
    kingdom: "DAHA_KADIRI",
    backgroundLayerNames: ["Background"],
    frameLayerName: "Frame",
  },
  {
    slug: "keta",
    psdFileName: "nusantara-card.keta-template.psd",
    kingdom: "NUSANTARA_UMUM",
    backgroundLayerNames: ["Lapisan 1"],
    frameLayerName: "Frame",
  },
  {
    slug: "sadeng",
    psdFileName: "nusantara-card.sadeng-template.psd",
    kingdom: "NUSANTARA_UMUM",
    backgroundLayerNames: ["Background"],
    frameLayerName: "Frame",
  },
  {
    slug: "portugis",
    psdFileName: "nusantara-card.portugis-template.psd",
    kingdom: "PORTUGIS",
    backgroundLayerNames: ["Background"],
    frameLayerName: "Frame",
  },
];

async function main() {
  const templateDir = path.resolve(process.cwd(), "docs/template");
  const outputBaseDir = path.resolve(process.cwd(), "assets/card-templates");

  if (!fs.existsSync(outputBaseDir)) {
    fs.mkdirSync(outputBaseDir, { recursive: true });
  }

  console.log("=== Memulai Ekstraksi Template PSD Nusantara Card ===");

  for (const config of TEMPLATES) {
    const psdPath = path.join(templateDir, config.psdFileName);
    if (!fs.existsSync(psdPath)) {
      console.warn(`[SKIP] File tidak ditemukan: ${psdPath}`);
      continue;
    }

    console.log(`\nMemproses [${config.slug}] (${config.psdFileName})...`);
    const buffer = fs.readFileSync(psdPath);
    const psd = readPsd(buffer);

    const outDir = path.join(outputBaseDir, config.slug);
    fs.mkdirSync(outDir, { recursive: true });

    const metadata: Record<string, unknown> = {
      slug: config.slug,
      kingdom: config.kingdom,
      width: psd.width,
      height: psd.height,
      layers: {},
    };

    // Cari layer Frame dan potong pas ke standard 1024 x 1505 canvas
    const frameLayer = psd.children?.find(
      (c) => (c.name || "").trim().toLowerCase() === config.frameLayerName.toLowerCase(),
    );
    if (frameLayer && frameLayer.canvas) {
      const frameCanvas = createCanvas(STANDARD_WIDTH, STANDARD_HEIGHT);
      const ctx = frameCanvas.getContext("2d");
      ctx.drawImage(frameLayer.canvas as unknown as Canvas, 0, 0);
      const frameBuffer = frameCanvas.toBuffer("image/png");
      const framePath = path.join(outDir, "frame.png");
      fs.writeFileSync(framePath, frameBuffer);

      // Simpan juga ke public/assets/card-templates/{slug}
      const publicOutDir = path.resolve(process.cwd(), "public/assets/card-templates", config.slug);
      fs.mkdirSync(publicOutDir, { recursive: true });
      fs.writeFileSync(path.join(publicOutDir, "frame.png"), frameBuffer);

      console.log(`  ✓ Frame diekstrak (1024x1505): ${framePath}`);
    } else {
      console.error(`  ✗ Layer Frame tidak ditemukan di ${config.slug}`);
    }

    // Cari layer Background dan sesuaikan ke 1024 x 1505
    let bgLayer: Layer | undefined;
    for (const bgName of config.backgroundLayerNames) {
      const found = psd.children?.find(
        (c) => (c.name || "").trim().toLowerCase() === bgName.toLowerCase(),
      );
      if (found && found.canvas) {
        bgLayer = found;
        break;
      }
    }
    if (bgLayer && bgLayer.canvas) {
      const bgCanvas = createCanvas(STANDARD_WIDTH, STANDARD_HEIGHT);
      const ctx = bgCanvas.getContext("2d");
      ctx.drawImage(bgLayer.canvas as unknown as Canvas, 0, 0, STANDARD_WIDTH, STANDARD_HEIGHT);
      const bgBuffer = bgCanvas.toBuffer("image/png");
      const bgPath = path.join(outDir, "background.png");
      fs.writeFileSync(bgPath, bgBuffer);

      const publicOutDir = path.resolve(process.cwd(), "public/assets/card-templates", config.slug);
      fs.writeFileSync(path.join(publicOutDir, "background.png"), bgBuffer);

      console.log(`  ✓ Background diekstrak (1024x1505): ${bgPath}`);
    } else {
      console.warn(`  ! Layer Background tidak ditemukan di ${config.slug}`);
    }

    // Simpan metadata koordinat & text elements
    const contentGroup = psd.children?.find(
      (c) => (c.name || "").trim().toLowerCase() === "content",
    );
    if (contentGroup && contentGroup.children) {
      const textElements: Array<{ name: string; text?: string; bounds: number[] }> = [];
      function collectText(children: Layer[]) {
        for (const child of children) {
          if (child.text) {
            textElements.push({
              name: child.name || "unnamed",
              text: child.text.text,
              bounds: [child.left ?? 0, child.top ?? 0, child.right ?? 0, child.bottom ?? 0],
            });
          }
          if (child.children) {
            collectText(child.children);
          }
        }
      }
      collectText(contentGroup.children);
      metadata.textElements = textElements;
    }

    fs.writeFileSync(path.join(outDir, "metadata.json"), JSON.stringify(metadata, null, 2));
    console.log(`  ✓ Metadata disimpan untuk ${config.slug}`);
  }

  console.log("\n=== Semua Template Berhasil Diekstrak! ===");
}

main().catch((err) => {
  console.error("Gagal mengekstrak template:", err);
  process.exit(1);
});
