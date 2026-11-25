"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, Music2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { BaseModal } from "@/client/presentation/components/ui";
import { useTranslator } from "@/core/translator";
import { BATTLE_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { BATTLE_TEXT_CONSTANT } from "../constants/TextConstant";

interface BattleMusicTrack {
  readonly id: string;
  readonly title: string;
  readonly src: string;
}

const BATTLE_MUSIC_TRACKS: readonly BattleMusicTrack[] = [
  { id: "amukti-palapa", title: "Amukti Palapa", src: "/story-mode/audio/amukti-palapa.mp3" },
  { id: "epic-nusantara", title: "Epic Nusantara", src: "/story-mode/audio/epic-nusantara.mp3" },
  { id: "gamelan-melody", title: "Gamelan Melody", src: "/story-mode/audio/gamelan-melody.wav" },
  { id: "seruling-sunda", title: "Seruling Sunda", src: "/story-mode/audio/seruling-sunda.wav" },
  { id: "sundanese-gamelan-flute", title: "Sundanese Gamelan Flute", src: "/story-mode/audio/sundanese-gamelan-flute.mp3" },
  { id: "the-glory-of-majapahit", title: "The Glory of Majapahit", src: "/story-mode/audio/the-glory-of-majapahit.mp3" },
];

const TRACK_PREFERENCE_KEY = "battle-arena.music.track";
const ENABLED_PREFERENCE_KEY = "battle-arena.music.enabled";

function getRandomTrack(): BattleMusicTrack {
  return BATTLE_MUSIC_TRACKS[Math.floor(Math.random() * BATTLE_MUSIC_TRACKS.length)];
}

function getSavedTrack(): BattleMusicTrack | null {
  try {
    const savedTrackId = window.localStorage.getItem(TRACK_PREFERENCE_KEY);
    return BATTLE_MUSIC_TRACKS.find((track) => track.id === savedTrackId) ?? null;
  } catch {
    return null;
  }
}

function getSavedMusicEnabled(): boolean {
  try {
    return window.localStorage.getItem(ENABLED_PREFERENCE_KEY) !== "false";
  } catch {
    return true;
  }
}

export function BattleMusicControl(): React.ReactElement {
  const { t } = useTranslator();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<BattleMusicTrack | null>(null);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  useEffect(() => {
    setSelectedTrack(getSavedTrack() ?? getRandomTrack());
    setMusicEnabled(getSavedMusicEnabled());
    setPreferencesLoaded(true);
  }, []);

  useEffect(() => {
    if (!selectedTrack || !audioRef.current) return;
    const audio = audioRef.current;
    audio.volume = 0.28;
    audio.loop = true;

    if (!musicEnabled) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    void audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [musicEnabled, selectedTrack]);

  useEffect(() => {
    if (!preferencesLoaded) return;
    try {
      window.localStorage.setItem(ENABLED_PREFERENCE_KEY, String(musicEnabled));
    } catch {
      // Audio controls still work for this arena session when storage is unavailable.
    }
  }, [musicEnabled, preferencesLoaded]);

  useEffect(() => () => {
    audioRef.current?.pause();
  }, []);

  const toggleMusic = (): void => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setMusicEnabled(false);
      setIsPlaying(false);
      return;
    }

    setMusicEnabled(true);
    void audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  };

  const selectTrack = (track: BattleMusicTrack): void => {
    const audio = audioRef.current;
    if (audio) {
      audio.src = track.src;
      audio.load();
      audio.volume = 0.28;
      audio.loop = true;
      void audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
    setSelectedTrack(track);
    setMusicEnabled(true);
    try {
      window.localStorage.setItem(TRACK_PREFERENCE_KEY, track.id);
    } catch {
      // Track selection remains active for this arena session when storage is unavailable.
    }
    setIsPickerOpen(false);
  };

  const toggleLabel = t(isPlaying ? BATTLE_TEXT_CONSTANT.MUSIC_PAUSE : BATTLE_TEXT_CONSTANT.MUSIC_PLAY);

  return (
    <>
      <audio
        ref={audioRef}
        src={selectedTrack?.src}
        loop
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => setIsPlaying(false)}
      />
      <div className="flex items-center gap-1">
        <button
          id={BATTLE_SEMANTIC_IDS.MUSIC_TOGGLE_BTN}
          type="button"
          aria-label={toggleLabel}
          title={toggleLabel}
          aria-pressed={isPlaying}
          onClick={toggleMusic}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-black/35 text-white/85 transition hover:border-white/35 hover:bg-white/10 hover:text-white"
        >
          {isPlaying ? <Volume2 className="h-4 w-4" aria-hidden="true" /> : <VolumeX className="h-4 w-4" aria-hidden="true" />}
        </button>
        <button
          type="button"
          aria-label={t(BATTLE_TEXT_CONSTANT.MUSIC_CONTROL)}
          title={t(BATTLE_TEXT_CONSTANT.MUSIC_CONTROL)}
          onClick={() => setIsPickerOpen(true)}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-white/15 bg-black/35 px-2.5 text-xs font-semibold text-white/85 transition hover:border-white/35 hover:bg-white/10 hover:text-white"
        >
          <Music2 className="h-4 w-4" aria-hidden="true" />
          <span className="hidden lg:inline">{selectedTrack?.title ?? t(BATTLE_TEXT_CONSTANT.MUSIC_CONTROL)}</span>
        </button>
      </div>

      <BaseModal
        id={BATTLE_SEMANTIC_IDS.MUSIC_PICKER_MODAL}
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        title={t(BATTLE_TEXT_CONSTANT.MUSIC_PICKER_TITLE)}
        description={t(BATTLE_TEXT_CONSTANT.MUSIC_PICKER_DESCRIPTION)}
        size="sm"
        className="border border-white/10 bg-[#100e18] text-white"
        ariaLabel={t(BATTLE_TEXT_CONSTANT.MUSIC_PICKER_TITLE)}
      >
        <div className="space-y-2">
          <p className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/65">
            {isPlaying ? <Play className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" /> : <Pause className="h-3.5 w-3.5 text-white/45" aria-hidden="true" />}
            {isPlaying ? t(BATTLE_TEXT_CONSTANT.MUSIC_NOW_PLAYING) : t(BATTLE_TEXT_CONSTANT.MUSIC_PAUSED)}
            {selectedTrack ? <span className="font-semibold text-white">{selectedTrack.title}</span> : null}
          </p>
          {BATTLE_MUSIC_TRACKS.map((track) => {
            const isSelected = selectedTrack?.id === track.id;
            return (
              <button
                key={track.id}
                id={`${BATTLE_SEMANTIC_IDS.MUSIC_TRACK_BTN_PREFIX}${track.id}`}
                type="button"
                aria-pressed={isSelected}
                onClick={() => selectTrack(track)}
                className={`flex min-h-12 w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition ${isSelected ? "border-amber/60 bg-amber/10 text-white" : "border-white/10 bg-white/[0.03] text-white/80 hover:border-white/30 hover:bg-white/[0.07]"}`}
              >
                <span className="flex items-center gap-3">
                  <Music2 className="h-4 w-4 shrink-0 text-amber-light" aria-hidden="true" />
                  <span className="font-semibold">{track.title}</span>
                </span>
                {isSelected ? <span className="flex items-center gap-1 text-xs text-amber-light"><Check className="h-4 w-4" aria-hidden="true" />{t(BATTLE_TEXT_CONSTANT.MUSIC_TRACK_SELECTED)}</span> : null}
              </button>
            );
          })}
        </div>
      </BaseModal>
    </>
  );
}
