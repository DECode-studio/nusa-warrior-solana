"use client";

import React from "react";
import { AlertTriangle, RefreshCw, Sparkles, Link2 } from "lucide-react";
import { API_ROUTES } from "@/core/constants/api-routes";
import { useTranslator } from "@/core/translator";
import { useCardForge } from "./hooks/useCardForge";
import {
  CardForgeHeader,
  CardForgeKingdomSelector,
  CardForgeArtworkUploader,
  CardForgeIdentityForm,
  CardForgeBattlePointSlider,
  CardForgeDisclaimerBox,
  CardForgeLivePreview,
  CardForgeSuccessBanner,
} from "./components";
import { CARD_FORGE_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { CARD_FORGE_TEXT_CONSTANT } from "./constants/TextConstant";

export interface CardForgeViewProps {
  readonly isGuest?: boolean;
}

export function CardForgeView({ isGuest = false }: CardForgeViewProps): React.ReactElement {
  const { locale, t } = useTranslator();
  const forge = useCardForge({ isGuest });

  return (
    <div id={CARD_FORGE_SEMANTIC_IDS.PAGE_ROOT} className="space-y-8">
      {/* Header & Status Widget */}
      <CardForgeHeader pricing={forge.pricing} isGuest={forge.isGuest} />

      {/* Success Modal / Banner */}
      {forge.successCard ? (
        <CardForgeSuccessBanner
          card={forge.successCard}
          onCreateAnother={forge.handleCreateAnother}
        />
      ) : (
        <form onSubmit={forge.submitCard} className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Sisi Kiri: Form Editor (7 Kolom) */}
          <div className="space-y-6 lg:col-span-7">
            {forge.errorMsg ? (
              <div className="flex items-center gap-3 rounded-2xl border border-rose-500/40 bg-rose-950/40 p-4 text-sm text-rose-200">
                <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
                <span>{forge.errorMsg}</span>
              </div>
            ) : null}

            {/* Step 1: Pilihan Kerajaan */}
            <CardForgeKingdomSelector
              selectedKingdomId={forge.kingdom}
              onSelectKingdom={forge.setKingdom}
            />

            {/* Step 2: Upload Artwork */}
            <CardForgeArtworkUploader
              imagePreviewUrl={forge.imagePreviewUrl}
              onImageChange={forge.handleImageChange}
              cropScale={forge.cropScale}
              onCropScaleChange={forge.setCropScale}
              cropOffsetX={forge.cropOffsetX}
              onCropOffsetXChange={forge.setCropOffsetX}
              cropOffsetY={forge.cropOffsetY}
              onCropOffsetYChange={forge.setCropOffsetY}
              onResetCrop={forge.handleResetCrop}
            />

            {/* Step 3: Identitas Karakter */}
            <CardForgeIdentityForm
              name={forge.name}
              onNameChange={forge.setName}
              gender={forge.gender}
              onGenderChange={forge.setGender}
              role={forge.role}
              onRoleChange={forge.setRole}
              description={forge.description}
              onDescriptionChange={forge.setDescription}
            />

            {/* Step 4: Alokasi Battle Point */}
            <CardForgeBattlePointSlider
              attack={forge.attack}
              defense={forge.defense}
              totalBp={forge.totalBp}
              maxBp={forge.maxBp}
              isBpOver={forge.isBpOver}
              onAttackChange={forge.handleAttackChange}
              onDefenseChange={forge.handleDefenseChange}
              onApplyPreset={forge.applyPreset}
            />

            {/* Disclaimer & Peraturan Kurasi */}
            <CardForgeDisclaimerBox
              disclaimerAccepted={forge.disclaimerAccepted}
              onDisclaimerChange={forge.setDisclaimerAccepted}
            />

            {/* Tombol Cetak Kartu / Tautkan Akun */}
            {forge.isGuest ? (
              <a
                id={CARD_FORGE_SEMANTIC_IDS.GUEST_LINK_BTN}
                href={`${API_ROUTES.AUTH.GOOGLE}?action=link&lang=${encodeURIComponent(locale)}`}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 font-display text-sm font-bold text-white shadow-xl shadow-amber-500/30 transition hover:from-amber-400 hover:to-amber-500 active:scale-[0.99]"
              >
                <Link2 className="h-4 w-4" />
                {t(CARD_FORGE_TEXT_CONSTANT.LINK_CTA_BTN)}
              </a>
            ) : (
              <button
                id={CARD_FORGE_SEMANTIC_IDS.SUBMIT_BTN}
                type="submit"
                disabled={
                  forge.isSubmitting ||
                  forge.isBpOver ||
                  !forge.disclaimerAccepted ||
                  !forge.imageFile ||
                  (forge.pricing !== null && !forge.pricing.canAfford)
                }
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-display text-sm font-bold text-white shadow-xl transition ${
                  forge.isSubmitting ||
                  forge.isBpOver ||
                  !forge.disclaimerAccepted ||
                  !forge.imageFile ||
                  (forge.pricing !== null && !forge.pricing.canAfford)
                    ? "bg-white/10 text-white/40 cursor-not-allowed"
                    : "bg-[#6766FF] hover:bg-[#5554e6] shadow-[#6766FF]/30 active:scale-[0.99]"
                }`}
              >
                {forge.isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    {t(CARD_FORGE_TEXT_CONSTANT.SUBMIT_PROCESSING)}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {forge.pricing && forge.pricing.nextCost === 0
                      ? t(CARD_FORGE_TEXT_CONSTANT.SUBMIT_FREE)
                      : t(CARD_FORGE_TEXT_CONSTANT.SUBMIT_PAID_WITH_COST, {
                          cost: forge.pricing?.nextCost.toLocaleString("id-ID") ?? 0,
                        })}
                  </>
                )}
              </button>
            )}
          </div>

          {/* Sisi Kanan: Live Preview Visual (5 Kolom) */}
          <div className="lg:col-span-5">
            <CardForgeLivePreview
              selectedKingdom={forge.selectedKingdom}
              imagePreviewUrl={forge.imagePreviewUrl}
              imageDimensions={forge.imageDimensions}
              name={forge.name}
              gender={forge.gender}
              role={forge.role}
              attack={forge.attack}
              defense={forge.defense}
              description={forge.description}
              cropScale={forge.cropScale}
              cropOffsetX={forge.cropOffsetX}
              cropOffsetY={forge.cropOffsetY}
              onCropChange={(scale, offsetX, offsetY) => {
                forge.setCropScale(scale);
                forge.setCropOffsetX(offsetX);
                forge.setCropOffsetY(offsetY);
              }}
            />
          </div>
        </form>
      )}
    </div>
  );
}
