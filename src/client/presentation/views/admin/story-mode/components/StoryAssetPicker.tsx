"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";
import { BaseModal } from "@/client/presentation/components/ui";
import type { StoryMediaAssetEntity } from "@/client/domain/story-mode/entity/story_mode_entity";
import { API_ROUTES } from "@/core/constants/api-routes";
import { useTranslator } from "@/core/translator";
import { ADMIN_STORY_MODE_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { ADMIN_STORY_MODE_TEXT_CONSTANT } from "../constants/TextConstant";

interface StoryAssetPickerProps {
  readonly assetType: "image" | "audio";
  readonly assets: readonly StoryMediaAssetEntity[];
  readonly selectedAssetId?: string | null;
  readonly onSelect: (asset: StoryMediaAssetEntity | null) => void;
  readonly onUpload: (file: File) => Promise<void>;
}

export function StoryAssetPicker({ assetType, assets, selectedAssetId, onSelect, onUpload }: StoryAssetPickerProps): React.ReactElement {
  const { t } = useTranslator();
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const visibleAssets = assets.filter((asset) => assetType === "image" ? asset.mimeType.startsWith("image/") : asset.mimeType.startsWith("audio/"));
  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId);

  const uploadFile = async (file: File): Promise<void> => {
    setUploading(true);
    try {
      await onUpload(file);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setIsOpen(true)} className="min-h-10 rounded-lg border border-primary/30 bg-primary/10 px-3 text-xs font-bold text-primary-light hover:bg-primary/20">
          {t(ADMIN_STORY_MODE_TEXT_CONSTANT.SELECT_ASSET)}
        </button>
        {selectedAsset ? <span className="min-w-0 truncate text-xs text-subtle">{selectedAsset.fileName}</span> : <span className="text-xs text-subtle">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.NO_ASSET)}</span>}
        {selectedAssetId && <button type="button" onClick={() => onSelect(null)} className="shrink-0 text-xs font-semibold text-danger-light hover:text-white">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.REMOVE_ASSET)}</button>}
      </div>
      <BaseModal
        id={`${ADMIN_STORY_MODE_SEMANTIC_IDS.ASSET_PICKER}-${assetType}`}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={t(ADMIN_STORY_MODE_TEXT_CONSTANT.MEDIA_LIBRARY)}
        description={t(assetType === "image" ? ADMIN_STORY_MODE_TEXT_CONSTANT.ASSET_IMAGE : ADMIN_STORY_MODE_TEXT_CONSTANT.ASSET_AUDIO)}
        size="lg"
        className="border border-white/10 bg-[#100e18] text-white"
        ariaLabel={t(ADMIN_STORY_MODE_TEXT_CONSTANT.MEDIA_LIBRARY)}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xs text-white/60">{t(assetType === "image" ? ADMIN_STORY_MODE_TEXT_CONSTANT.ASSET_IMAGE : ADMIN_STORY_MODE_TEXT_CONSTANT.ASSET_AUDIO)} · {visibleAssets.length}</p>
          <label className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg bg-primary px-3 text-xs font-bold text-white ${uploading ? "pointer-events-none opacity-60" : "hover:bg-primary/80"}`}>
            <Upload className="h-4 w-4" aria-hidden="true" />
            {uploading ? t(ADMIN_STORY_MODE_TEXT_CONSTANT.SAVING) : t(ADMIN_STORY_MODE_TEXT_CONSTANT.UPLOAD)}
            <input
              className="sr-only"
              type="file"
              accept={assetType === "image" ? "image/png,image/jpeg,image/webp" : "audio/mpeg,audio/ogg,audio/wav"}
              disabled={uploading}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (file) void uploadFile(file);
                event.currentTarget.value = "";
              }}
            />
          </label>
        </div>
        {visibleAssets.length === 0 ? <p className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-center text-sm text-white/60">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.ASSET_EMPTY)}</p> : (
          <ul className="max-h-[55dvh] space-y-2 overflow-y-auto pr-1">
            {visibleAssets.map((asset) => {
              const isSelected = asset.id === selectedAssetId;
              const url = API_ROUTES.STORY_MODE.media(asset.id);
              return (
                <li key={asset.id} className={`flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center ${isSelected ? "border-amber/60 bg-amber/10" : "border-white/10 bg-white/[0.03]"}`}>
                  {asset.mimeType.startsWith("image/") ? (
                    <div className="relative h-20 w-full shrink-0 overflow-hidden rounded-lg bg-black/30 sm:w-32">
                      <Image src={url} alt={asset.fileName} fill unoptimized sizes="128px" className="object-cover" />
                    </div>
                  ) : <audio controls preload="none" src={url} className="w-full shrink-0 sm:w-48" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{asset.fileName}</p>
                    <p className="mt-1 text-xs text-white/55">{asset.mimeType} · {(asset.byteSize / 1024).toFixed(0)} KB</p>
                  </div>
                  <button type="button" onClick={() => { onSelect(asset); setIsOpen(false); }} className="min-h-10 shrink-0 rounded-lg border border-amber/45 bg-amber/10 px-3 text-xs font-bold text-amber-light hover:bg-amber/20">
                    {t(ADMIN_STORY_MODE_TEXT_CONSTANT.USE_ASSET)}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </BaseModal>
    </>
  );
}
