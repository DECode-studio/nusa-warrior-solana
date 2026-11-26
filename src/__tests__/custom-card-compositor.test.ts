import { describe, it, expect, vi } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

vi.mock("server-only", () => ({}));

import { CustomCardCompositorService } from "@/server/modules/card/application/custom-card-compositor.service";
import * as pinataService from "@/server/modules/solana/pinata-ipfs.service";

describe("CustomCardCompositorService", () => {
  it("harus berhasil me-render kartu dan mengembalikan URL IPFS Pinata jika upload sukses", async () => {
    vi.spyOn(pinataService, "isPinataConfigured").mockReturnValueOnce(true);
    vi.spyOn(pinataService, "pinFileBufferToIpfs").mockResolvedValueOnce({
      cid: "QmTestCustomCardCid",
      url: "https://gateway.pinata.cloud/ipfs/QmTestCustomCardCid",
    });

    const dummyArtwork = await sharp({
      create: {
        width: 800,
        height: 800,
        channels: 4,
        background: { r: 50, g: 70, b: 120, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const result = await CustomCardCompositorService.renderAndSaveCard({
      slug: "test-ksatria-remote",
      kingdom: "MAJAPAHIT",
      name: "Ksatria Remote",
      gender: "LAKI_LAKI",
      role: "PRAJURIT",
      attack: 1100,
      defense: 1000,
      description: "Prajurit pilihan Bhayangkara yang terlatih dalam seni perang panah dan tombak.",
      artworkBuffer: dummyArtwork,
    });

    expect(result.imagePath).toBe(
      "https://gateway.pinata.cloud/ipfs/QmTestCustomCardCid"
    );
  });

  it("harus fallback menyimpan ke disk lokal jika Pinata tidak dikonfigurasi", async () => {
    vi.spyOn(pinataService, "isPinataConfigured").mockReturnValueOnce(false);

    const dummyArtwork = await sharp({
      create: {
        width: 800,
        height: 800,
        channels: 4,
        background: { r: 50, g: 70, b: 120, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const testSlug = "test-ksatria-fallback-local";

    const result = await CustomCardCompositorService.renderAndSaveCard({
      slug: testSlug,
      kingdom: "MAJAPAHIT",
      name: "Ksatria Majapahit",
      gender: "LAKI_LAKI",
      role: "PRAJURIT",
      attack: 1100,
      defense: 1000,
      description: "Prajurit pilihan Bhayangkara yang terlatih dalam seni perang panah dan tombak.",
      artworkBuffer: dummyArtwork,
    });

    expect(result.imagePath).toBe(`/cards/custom/${testSlug}.webp`);

    const filePath = path.resolve(process.cwd(), "public", result.imagePath.replace(/^\//, ""));
    const fileStat = await fs.stat(filePath);
    expect(fileStat.size).toBeGreaterThan(50000);

    const metadata = await sharp(filePath).metadata();
    expect(metadata.width).toBe(1024);
    expect(metadata.height).toBe(1505);
    expect(metadata.format).toBe("webp");

    // Clean up
    await fs.unlink(filePath).catch(() => {});
  });
});
