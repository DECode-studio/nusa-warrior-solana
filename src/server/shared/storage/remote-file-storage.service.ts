import "server-only";

export interface RemoteStorageUploadResult {
  url: string;
  path: string;
  format?: string;
  name?: string;
}

interface RemoteStorageApiResponse {
  status?: number;
  message?: string;
  data?: {
    name?: string;
    format?: string;
    path?: string;
    url?: string;
  };
}

export class RemoteFileStorageService {
  private static readonly ROUTE_SEQUENCE: readonly string[] = [
    "/api/storage/upload",
    "/api/storage/unggah",
    "/api/storage/push",
    "/api/storage/send",
    "/api/storage/kirim",
  ];

  private static getConfig(): {
    primaryUrl: string;
    secondaryUrl: string;
    token: string;
  } {
    const primaryUrl = (
      process.env.REMOTE_STORAGE_URL?.trim() || ""
    ).replace(/\/+$/, "");
    const secondaryUrl = (
      process.env.REMOTE_STORAGE_2_URL?.trim() || ""
    ).replace(/\/+$/, "");
    const token =
      process.env.REMOTE_STORAGE_TOKEN?.trim() || "";

    return { primaryUrl, secondaryUrl, token };
  }

  /**
   * Uploads a WebP image buffer to the remote storage API with automatic multi-route fallbacks.
   *
   * @param params.folder Target sub-folder path (e.g. 'cards/custom')
   * @param params.name Filename identifier (without extension)
   * @param params.buffer Raw WebP image buffer
   * @param params.mimeType MIME type of the file (defaults to 'image/webp')
   */
  static async uploadFile(params: {
    folder: string;
    name: string;
    buffer: Buffer;
    mimeType?: string;
  }): Promise<RemoteStorageUploadResult | null> {
    const { primaryUrl, secondaryUrl, token } = this.getConfig();
    const mimeType = params.mimeType ?? "image/webp";
    const extension = mimeType.split("/")[1] ?? "webp";
    const filename = `${params.name}.${extension}`;

    // Target servers to try in sequence: primary base URL then secondary base URL
    const baseUrls = [primaryUrl, secondaryUrl].filter(Boolean);

    for (const baseUrl of baseUrls) {
      for (const route of this.ROUTE_SEQUENCE) {
        const fullEndpoint = `${baseUrl}${route}`;
        try {
          const formData = new FormData();
          formData.append("path", params.folder);
          formData.append("name", params.name);

          // Create Blob from Buffer
          const blob = new Blob([new Uint8Array(params.buffer)], { type: mimeType });
          formData.append("file", blob, filename);

          const response = await fetch(fullEndpoint, {
            method: "POST",
            headers: {
              authorization: token,
            },
            body: formData,
            signal: AbortSignal.timeout(15_000),
          });

          if (!response.ok) {
            continue;
          }

          const payload = (await response.json().catch(() => null)) as RemoteStorageApiResponse | null;
          if (payload && (payload.status === 200 || payload.status === 201) && payload.data?.url) {
            return {
              url: payload.data.url,
              path: payload.data.path ?? `${params.folder}/${filename}`,
              name: payload.data.name ?? filename,
              format: payload.data.format ?? mimeType,
            };
          }
        } catch {
          // Continue to next route on network failure/timeout
          continue;
        }
      }
    }

    return null;
  }
}
