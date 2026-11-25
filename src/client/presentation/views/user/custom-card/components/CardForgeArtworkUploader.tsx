"use client";

import React from "react";
import { Upload, ZoomIn, ZoomOut, MoveVertical, MoveHorizontal, RotateCcw } from "lucide-react";
import { useTranslator } from "@/core/translator";
import { CARD_FORGE_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { CARD_FORGE_TEXT_CONSTANT } from "../constants/TextConstant";

export interface CardForgeArtworkUploaderProps {
  readonly imagePreviewUrl: string | null;
  readonly onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly cropScale?: number;
  readonly onCropScaleChange?: (scale: number) => void;
  readonly cropOffsetX?: number;
  readonly onCropOffsetXChange?: (offset: number) => void;
  readonly cropOffsetY?: number;
  readonly onCropOffsetYChange?: (offset: number) => void;
  readonly onResetCrop?: () => void;
}

export function CardForgeArtworkUploader({
  imagePreviewUrl,
  onImageChange,
  cropScale = 1,
  onCropScaleChange,
  cropOffsetX = 0,
  onCropOffsetXChange,
  cropOffsetY = 0,
  onCropOffsetYChange,
  onResetCrop,
}: CardForgeArtworkUploaderProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <div
      id={CARD_FORGE_SEMANTIC_IDS.ARTWORK_UPLOADER}
      className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5"
    >
      <div className="flex items-center justify-between">
        <label className="block font-display text-sm font-semibold text-white">
          {t(CARD_FORGE_TEXT_CONSTANT.STEP_ARTWORK)}
        </label>
        {imagePreviewUrl && onResetCrop ? (
          <button
            type="button"
            onClick={onResetCrop}
            className="inline-flex items-center gap-1.5 text-xs text-[#F8F5F0]/60 hover:text-amber-400 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t(CARD_FORGE_TEXT_CONSTANT.UPLOAD_RESET_POS)}
          </button>
        ) : null}
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-white/[0.01] p-6 text-center transition hover:border-[#6766FF]">
        {imagePreviewUrl ? (
          <div className="relative flex flex-col items-center">
            <img
              src={imagePreviewUrl}
              alt="Preview"
              className="h-28 w-28 rounded-xl object-cover shadow-md border border-white/20"
            />
            <label
              htmlFor={CARD_FORGE_SEMANTIC_IDS.ARTWORK_INPUT}
              className="mt-3 cursor-pointer rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition"
            >
              {t(CARD_FORGE_TEXT_CONSTANT.UPLOAD_CHANGE)}
            </label>
          </div>
        ) : (
          <label htmlFor={CARD_FORGE_SEMANTIC_IDS.ARTWORK_INPUT} className="cursor-pointer">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-[#F8F5F0]/60">
              <Upload className="h-6 w-6" />
            </div>
            <span className="mt-2 block text-xs font-medium text-white">
              {t(CARD_FORGE_TEXT_CONSTANT.UPLOAD_PROMPT)}
            </span>
            <span className="mt-1 block text-[11px] text-[#F8F5F0]/50">
              {t(CARD_FORGE_TEXT_CONSTANT.UPLOAD_HINT)}
            </span>
          </label>
        )}
        <input
          id={CARD_FORGE_SEMANTIC_IDS.ARTWORK_INPUT}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onImageChange}
          className="hidden"
        />
      </div>

      {/* Kontrol Penyesuaian Pan & Zoom */}
      {imagePreviewUrl ? (
        <div className="space-y-3.5 rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-[#F8F5F0]/80">
            <span>{t(CARD_FORGE_TEXT_CONSTANT.UPLOAD_ADJUST_TITLE)}</span>
            <span className="text-[11px] font-normal text-amber-400">
              {t(CARD_FORGE_TEXT_CONSTANT.UPLOAD_ADJUST_HINT)}
            </span>
          </div>

          {/* Slider Zoom */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[#F8F5F0]/70">
              <span className="flex items-center gap-1.5">
                <ZoomIn className="h-3.5 w-3.5 text-amber-400" />
                {t(CARD_FORGE_TEXT_CONSTANT.UPLOAD_ZOOM_LABEL)}
              </span>
              <span className="font-mono text-[11px] font-bold text-white">
                {Math.round(cropScale * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onCropScaleChange?.(Math.max(0.5, +(cropScale - 0.1).toFixed(2)))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.05"
                value={cropScale}
                onChange={(e) => onCropScaleChange?.(Number(e.target.value))}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-white/20 accent-[#6766FF]"
              />
              <button
                type="button"
                onClick={() => onCropScaleChange?.(Math.min(3, +(cropScale + 0.1).toFixed(2)))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Slider Geser Vertikal (Atas - Bawah) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[#F8F5F0]/70">
              <span className="flex items-center gap-1.5">
                <MoveVertical className="h-3.5 w-3.5 text-emerald-400" />
                {t(CARD_FORGE_TEXT_CONSTANT.UPLOAD_PAN_Y_LABEL)}
              </span>
              <span className="font-mono text-[11px] font-bold text-white">
                {cropOffsetY > 0 ? `+${cropOffsetY}` : cropOffsetY} px
              </span>
            </div>
            <input
              type="range"
              min="-600"
              max="600"
              step="5"
              value={cropOffsetY}
              onChange={(e) => onCropOffsetYChange?.(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/20 accent-emerald-500"
            />
          </div>

          {/* Slider Geser Horisontal (Kiri - Kanan) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[#F8F5F0]/70">
              <span className="flex items-center gap-1.5">
                <MoveHorizontal className="h-3.5 w-3.5 text-sky-400" />
                {t(CARD_FORGE_TEXT_CONSTANT.UPLOAD_PAN_X_LABEL)}
              </span>
              <span className="font-mono text-[11px] font-bold text-white">
                {cropOffsetX > 0 ? `+${cropOffsetX}` : cropOffsetX} px
              </span>
            </div>
            <input
              type="range"
              min="-600"
              max="600"
              step="5"
              value={cropOffsetX}
              onChange={(e) => onCropOffsetXChange?.(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/20 accent-sky-500"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
