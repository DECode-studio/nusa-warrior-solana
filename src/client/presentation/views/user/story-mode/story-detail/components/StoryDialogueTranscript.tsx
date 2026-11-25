"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Volume2, VolumeX } from "lucide-react";
import { ALL_CARDS_CATALOG } from "@/core/constants/cards-catalog";
import { API_ROUTES } from "@/core/constants/api-routes";
import { playStoryTransitionSound } from "@/core/utils/story-sound";
import type { StoryMissionEntity } from "@/client/domain/story-mode/entity/story_mode_entity";
import { Button } from "@/client/presentation/components/ui";
import { useTranslator } from "@/core/translator";
import { getStoryLocalizedText } from "@/core/utils/story-localization";
import { STORY_DETAIL_TEXT_CONSTANT } from "../constants/TextConstant";
import { STORY_DETAIL_SEMANTIC_IDS } from "../constants/SemanticIdConstant";

interface StoryDialogueTranscriptProps {
  mission: StoryMissionEntity;
  accent: string;
  sceneIndex: number;
  onSceneChange: (index: number) => void;
  disableNext?: boolean;
  branchConsequence?: string | null;
}

export function StoryDialogueTranscript({ mission, accent, sceneIndex, onSceneChange, disableNext = false, branchConsequence = null }: StoryDialogueTranscriptProps): React.ReactElement {
  const { t, locale } = useTranslator();
  const soundtrackRef = useRef<HTMLAudioElement | null>(null);
  const [soundtrackPlaying, setSoundtrackPlaying] = useState(false);
  const [soundtrackMutedByUser, setSoundtrackMutedByUser] = useState(false);
  const soundtrackUrl = mission.soundtrackAssetId
    ? API_ROUTES.STORY_MODE.media(mission.soundtrackAssetId)
    : mission.soundtrackUrl;
  const line = mission.dialogue[sceneIndex];
  const character = line?.characterCardSlug
    ? ALL_CARDS_CATALOG.find((card) => card.slug === line.characterCardSlug)
    : ALL_CARDS_CATALOG.find((card) => card.cardType === "CHARACTER" && card.name.toLocaleLowerCase("id") === line?.speaker.toLocaleLowerCase("id"));
  const backgroundUrl = line?.backgroundAssetId ? API_ROUTES.STORY_MODE.media(line.backgroundAssetId) : line?.backgroundUrl ?? null;
  useEffect(() => {
    if (!soundtrackUrl) return undefined;

    let disposed = false;
    const soundtrack = new Audio(soundtrackUrl);
    soundtrack.loop = true;
    soundtrackRef.current = soundtrack;
    setSoundtrackPlaying(false);
    setSoundtrackMutedByUser(false);
    void soundtrack.play()
      .then(() => {
        if (!disposed) setSoundtrackPlaying(true);
      })
      .catch(() => {
        if (!disposed) setSoundtrackPlaying(false);
      });

    return () => {
      disposed = true;
      soundtrack.pause();
      if (soundtrackRef.current === soundtrack) soundtrackRef.current = null;
    };
  }, [mission.id, soundtrackUrl]);

  const startSoundtrack = (): void => {
    const soundtrack = soundtrackRef.current;
    if (!soundtrack) return;
    if (soundtrack.ended) soundtrack.currentTime = 0;
    void soundtrack.play().then(() => {
      if (soundtrackRef.current === soundtrack) setSoundtrackPlaying(true);
    }).catch(() => {
      if (soundtrackRef.current === soundtrack) setSoundtrackPlaying(false);
    });
  };

  const toggleSoundtrack = (): void => {
    if (soundtrackPlaying) {
      soundtrackRef.current?.pause();
      setSoundtrackPlaying(false);
      setSoundtrackMutedByUser(true);
      return;
    }
    setSoundtrackMutedByUser(false);
    startSoundtrack();
  };

  const changeScene = (index: number): void => {
    if (soundtrackUrl && !soundtrackPlaying && !soundtrackMutedByUser) startSoundtrack();
    const soundEffectAssetId = mission.dialogue[index]?.soundEffectAssetId;
    if (soundEffectAssetId) {
      const sound = new Audio(API_ROUTES.STORY_MODE.media(soundEffectAssetId));
      void sound.play().catch(() => undefined);
    } else {
      playStoryTransitionSound();
    }
    onSceneChange(index);
  };

  return (
    <section aria-label={t(STORY_DETAIL_TEXT_CONSTANT.TRANSCRIPT)} className="relative isolate min-h-0 flex-1 overflow-hidden bg-[#08070b]">
      {backgroundUrl ? <img key={backgroundUrl} src={backgroundUrl} alt="" className="absolute inset-0 h-full w-full animate-[story-scene-in_900ms_ease-out] object-cover" /> : null}
      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/10 to-black/80" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_18%,rgba(0,0,0,.45)_100%)]" />

      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 px-4 pt-3 sm:px-8 sm:pt-5">
        <div className="min-w-0">
          {line?.location && <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-white/75 sm:text-sm">{getStoryLocalizedText(line.location, line.translations?.location, locale)}</p>}
          <p className="mt-1 text-xs text-white/65">{t(STORY_DETAIL_TEXT_CONSTANT.SCENE_PROGRESS, { current: sceneIndex + 1, total: mission.dialogue.length })}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {soundtrackUrl && <Button variant="secondary" size="sm" shape="rounded" ariaLabel={t(soundtrackPlaying ? STORY_DETAIL_TEXT_CONSTANT.SOUNDTRACK_PAUSE : STORY_DETAIL_TEXT_CONSTANT.SOUNDTRACK_PLAY)} onClick={toggleSoundtrack} leftIcon={soundtrackPlaying ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />} className="min-h-11 border-white/20 bg-black/45 text-white hover:bg-black/65"><span className="sr-only">{t(soundtrackPlaying ? STORY_DETAIL_TEXT_CONSTANT.SOUNDTRACK_PAUSE : STORY_DETAIL_TEXT_CONSTANT.SOUNDTRACK_PLAY)}</span></Button>}
          <Button id={STORY_DETAIL_SEMANTIC_IDS.PREVIOUS} variant="secondary" size="sm" shape="rounded" disabled={sceneIndex === 0} onClick={() => changeScene(sceneIndex - 1)} leftIcon={<ArrowLeft className="h-4 w-4" />} className="min-h-11 border-white/20 bg-black/45 text-white hover:bg-black/65">{t(STORY_DETAIL_TEXT_CONSTANT.PREVIOUS_SCENE)}</Button>
          <Button id={STORY_DETAIL_SEMANTIC_IDS.NEXT} variant="primary" size="sm" shape="rounded" disabled={sceneIndex >= mission.dialogue.length - 1 || disableNext} onClick={() => changeScene(sceneIndex + 1)} rightIcon={<ArrowRight className="h-4 w-4" />} className="min-h-11">{t(STORY_DETAIL_TEXT_CONSTANT.NEXT)}</Button>
        </div>
      </div>

      {character && <img src={character.imagePath} alt={character.name} className="pointer-events-none absolute bottom-0 left-1/2 z-0 max-h-[53%] max-w-[72vw] -translate-x-1/2 object-contain object-bottom drop-shadow-[0_18px_32px_rgba(0,0,0,.65)] sm:left-[12%] sm:max-h-[76%] sm:max-w-[34vw] sm:translate-x-0" />}

      <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-4 sm:px-8 sm:pb-7">
        <article className="mx-auto max-w-5xl rounded-xl border border-white/15 bg-[#08070b]/80 px-4 py-3 shadow-2xl backdrop-blur-md sm:ml-auto sm:mr-0 sm:w-[min(68%,58rem)] sm:px-7 sm:py-5">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.17em] sm:text-sm" style={{ color: accent }}>{getStoryLocalizedText(line?.speaker, line?.translations?.speaker, locale)}</p>
          <p className="max-h-[23vh] overflow-y-auto text-sm leading-relaxed text-white sm:max-h-[28vh] sm:text-lg">{getStoryLocalizedText(line?.text, line?.translations?.text, locale)}</p>
          {branchConsequence && <p className="mt-3 border-t border-white/15 pt-3 text-sm leading-relaxed text-amber-light">{branchConsequence}</p>}
        </article>
      </div>
    </section>
  );
}
