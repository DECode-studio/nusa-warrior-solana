import "server-only";
import { listStoryMediaAssets, readStoryMediaAsset, uploadStoryMediaAsset } from "../infrastructure/story-content.repository";

export async function listStoryMediaAssetsUseCase() {
  return listStoryMediaAssets();
}

export async function uploadStoryMediaAssetUseCase(input: { fileName: string; mimeType: string; bytes: Uint8Array; actorId: string }) {
  return uploadStoryMediaAsset(input);
}

export async function readStoryMediaAssetUseCase(id: string) {
  return readStoryMediaAsset(id);
}
