"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { BaseModal } from "@/client/presentation/components/ui";
import type { StoryCampaignContentEntity } from "@/client/domain/story-mode/entity/story_mode_entity";
import { ALL_CARDS_CATALOG } from "@/core/constants/cards-catalog";
import { API_ROUTES } from "@/core/constants/api-routes";
import { useTranslator } from "@/core/translator";
import { getStoryLocalizedText } from "@/core/utils/story-localization";
import { ADMIN_STORY_MODE_TEXT_CONSTANT } from "../constants/TextConstant";

interface StoryPreviewModalProps {
  readonly campaign: StoryCampaignContentEntity;
  readonly title: string;
  readonly isOpen: boolean;
  readonly locale: "id" | "en" | "zh";
  readonly onClose: () => void;
}

export function StoryPreviewModal({ campaign, title, isOpen, locale, onClose }: StoryPreviewModalProps): React.ReactElement {
  const { t } = useTranslator();
  const [missionId, setMissionId] = useState(campaign.missions[0]?.id ?? "");
  const [sceneIndex, setSceneIndex] = useState(0);
  const mission = campaign.missions.find((item) => item.id === missionId) ?? campaign.missions[0];
  const scene = mission?.dialogue[sceneIndex];
  const character = useMemo(() => scene?.characterCardSlug ? ALL_CARDS_CATALOG.find((card) => card.slug === scene.characterCardSlug) : null, [scene?.characterCardSlug]);
  const backgroundUrl = scene?.backgroundAssetId
    ? API_ROUTES.STORY_MODE.media(scene.backgroundAssetId)
    : scene?.backgroundUrl ?? null;
  const soundtrackUrl = mission?.soundtrackAssetId
    ? API_ROUTES.STORY_MODE.media(mission.soundtrackAssetId)
    : mission?.soundtrackUrl;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="full"
      mobileBehavior="modal"
      className="border border-white/10 bg-[#08070b] p-0 text-white"
      containerClassName="p-2 sm:p-4"
      ariaLabel={title}
    >
      <div className="flex h-[min(78dvh,52rem)] min-h-[26rem] flex-col overflow-hidden rounded-xl border border-white/10 bg-black">
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-[#100e18] p-3 sm:px-5">
          <label className="min-w-0 flex-1">
            <span className="sr-only">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.MISSION_LIST)}</span>
            <select value={mission?.id ?? ""} onChange={(event) => { setMissionId(event.currentTarget.value); setSceneIndex(0); }} className="h-10 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm text-white outline-none focus:border-amber">
              {campaign.missions.map((item) => <option key={item.id} value={item.id}>{item.chapter}. {getStoryLocalizedText(item.title, item.translations?.title, locale)}</option>)}
            </select>
          </label>
          <span className="min-w-20 text-center text-xs text-white/60">{scene ? `${sceneIndex + 1} / ${mission?.dialogue.length ?? 0}` : "—"}</span>
          {soundtrackUrl && <audio controls preload="none" src={soundtrackUrl} aria-label={t(ADMIN_STORY_MODE_TEXT_CONSTANT.SOUNDTRACK)} className="h-9 w-36" />}
          <button type="button" disabled={sceneIndex === 0} onClick={() => setSceneIndex((index) => Math.max(0, index - 1))} aria-label={t(ADMIN_STORY_MODE_TEXT_CONSTANT.MOVE_UP)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white hover:bg-white/10 disabled:opacity-40"><ArrowLeft className="h-4 w-4" /></button>
          <button type="button" disabled={sceneIndex >= (mission?.dialogue.length ?? 1) - 1} onClick={() => setSceneIndex((index) => Math.min((mission?.dialogue.length ?? 1) - 1, index + 1))} aria-label={t(ADMIN_STORY_MODE_TEXT_CONSTANT.MOVE_DOWN)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white hover:bg-white/10 disabled:opacity-40"><ArrowRight className="h-4 w-4" /></button>
          <button type="button" onClick={onClose} aria-label={t(ADMIN_STORY_MODE_TEXT_CONSTANT.REMOVE)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white hover:bg-white/10"><X className="h-4 w-4" /></button>
        </div>
        <div className="relative isolate min-h-0 flex-1 overflow-hidden bg-[#08070b]">
          {backgroundUrl ? <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${backgroundUrl}")` }} /> : null}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-black/85" />
          {scene?.location && <p className="absolute left-4 top-4 z-10 max-w-[65%] truncate text-xs font-semibold uppercase tracking-[0.16em] text-white/75 sm:left-7 sm:top-6 sm:text-sm">{getStoryLocalizedText(scene.location, scene.translations?.location, locale)}</p>}
          {character && <Image src={character.imagePath} alt={character.name} width={680} height={900} unoptimized className="pointer-events-none absolute bottom-0 left-1/2 z-0 max-h-[65%] w-auto max-w-[58vw] -translate-x-1/2 object-contain object-bottom drop-shadow-2xl sm:left-[12%] sm:max-h-[82%] sm:max-w-[32vw] sm:translate-x-0" />}
          <article className="absolute inset-x-3 bottom-3 z-10 rounded-xl border border-white/15 bg-[#08070b]/85 p-4 shadow-2xl backdrop-blur-md sm:inset-x-auto sm:bottom-7 sm:right-7 sm:w-[min(65%,58rem)] sm:p-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em]" style={{ color: campaign.accent }}>{getStoryLocalizedText(scene?.speaker, scene?.translations?.speaker, locale)}</p>
            <p className="max-h-[24dvh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-white sm:max-h-[28dvh] sm:text-lg">{getStoryLocalizedText(scene?.text, scene?.translations?.text, locale)}</p>
          </article>
        </div>
      </div>
    </BaseModal>
  );
}
