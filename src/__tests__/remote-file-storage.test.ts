import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

import { RemoteFileStorageService } from "@/server/shared/storage/remote-file-storage.service";

describe("RemoteFileStorageService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("harus berhasil mengupload file ke remote storage API dan mengembalikan public URL", async () => {
    const mockSuccessResponse = {
      status: 200,
      message: "File sukses terupload",
      data: {
        name: "test-card.webp",
        format: "image/webp",
        path: "files/cards/custom/test-card.webp",
        url: "https://excitech-id.my.id/files/cards/custom/test-card.webp",
      },
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse,
    } as Response);

    const dummyBuffer = Buffer.from("fake-webp-image-data");

    const result = await RemoteFileStorageService.uploadFile({
      folder: "cards/custom",
      name: "test-card",
      buffer: dummyBuffer,
      mimeType: "image/webp",
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(result).not.toBeNull();
    expect(result?.url).toBe("https://excitech-id.my.id/files/cards/custom/test-card.webp");
  });

  it("harus mencoba fallback route jika route pertama merespons error", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 200,
          data: {
            url: "https://excitech-id.my.id/files/cards/custom/fallback-card.webp",
          },
        }),
      } as Response);

    const dummyBuffer = Buffer.from("fake-webp-image-data");

    const result = await RemoteFileStorageService.uploadFile({
      folder: "cards/custom",
      name: "fallback-card",
      buffer: dummyBuffer,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(result?.url).toBe("https://excitech-id.my.id/files/cards/custom/fallback-card.webp");
  });

  it("harus mengembalikan null jika seluruh route dan base URL gagal", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network offline"));

    const dummyBuffer = Buffer.from("fake-webp-image-data");

    const result = await RemoteFileStorageService.uploadFile({
      folder: "cards/custom",
      name: "fail-card",
      buffer: dummyBuffer,
    });

    expect(result).toBeNull();
  });
});
