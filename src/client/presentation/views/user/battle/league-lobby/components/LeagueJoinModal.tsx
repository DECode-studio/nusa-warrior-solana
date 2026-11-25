"use client";

import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { Camera, ScanLine } from "lucide-react";
import { BaseModal, Button } from "@/client/presentation/components/ui";
import { LEAGUE_LOBBY_SEMANTIC_IDS as IDS } from "../constants/SemanticIdConstant";
import { LEAGUE_TEXT_CONSTANT as TEXT } from "../constants/TextConstant";
import type { useLeagueLobby } from "../hooks/useLeagueLobby";

type LobbyModel = ReturnType<typeof useLeagueLobby>;
const CONTROL_CLASS = "mt-1.5 min-h-11 w-full rounded-[var(--radius-control)] border border-border-base bg-surface px-3 py-2 text-sm text-cream outline-none transition-colors placeholder:text-subtle hover:border-border-strong focus-visible:border-amber focus-visible:ring-2 focus-visible:ring-amber/30";

function extractRoomCode(rawValue: string): string | null {
  try {
    const url = new URL(rawValue);
    const queryCode = url.searchParams.get("joinCode") ?? url.searchParams.get("code");
    if (queryCode) return queryCode.toUpperCase();
  } catch {
    // The QR may contain the room code directly instead of a URL.
  }
  return rawValue.match(/[A-Z0-9]{8,16}/i)?.[0]?.toUpperCase() ?? null;
}

export function LeagueJoinModal({ model }: { model: LobbyModel }): React.ReactElement {
  const {
    t, joinModalOpen, setJoinModalOpen, selectedJoinRoom, joinCode, setJoinCode, joinRole, setJoinRole,
    decks, joinDeckId, setJoinDeckId, joinStakeCardSlug, setJoinStakeCardSlug, characterCards,
    busy, loading, submitJoin,
  } = model;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const scanGenerationRef = useRef(0);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const registrationClosed = selectedJoinRoom?.status !== "REGISTRATION_OPEN";
  const roomAtCapacity = Boolean(selectedJoinRoom && selectedJoinRoom.participants.filter((participant) => participant.role === "PARTICIPANT").length >= (selectedJoinRoom.maxParticipants ?? 32));
  const canSubmit = !loading && !busy && (Boolean(selectedJoinRoom) || joinCode.length >= 8) &&
    (joinRole !== "PARTICIPANT" || (Boolean(joinDeckId) && Boolean(joinStakeCardSlug))) &&
    !(selectedJoinRoom && (registrationClosed || roomAtCapacity) && joinRole === "PARTICIPANT");

  const stopScanner = (): void => {
    scanGenerationRef.current += 1;
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScannerActive(false);
  };

  useEffect(() => {
    if (!joinModalOpen) stopScanner();
    return () => controlsRef.current?.stop();
  }, [joinModalOpen]);

  const startScanner = async (): Promise<void> => {
    setScannerError(null);
    if (!videoRef.current || !navigator.mediaDevices?.getUserMedia) {
      setScannerError(t(TEXT.QR_UNSUPPORTED));
      return;
    }
    const scanGeneration = scanGenerationRef.current + 1;
    scanGenerationRef.current = scanGeneration;
    setScannerActive(true);
    try {
      const reader = new BrowserMultiFormatReader();
      const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result, _error, controls) => {
        if (scanGeneration !== scanGenerationRef.current) return;
        if (!result) return;
        const code = extractRoomCode(result.getText());
        if (!code) {
          setScannerError(t(TEXT.QR_INVALID));
          controls.stop();
          controlsRef.current = null;
          scanGenerationRef.current += 1;
          setScannerActive(false);
          return;
        }
        setJoinCode(code);
        controls.stop();
        controlsRef.current = null;
        scanGenerationRef.current += 1;
        setScannerActive(false);
      });
      if (scanGeneration !== scanGenerationRef.current) {
        controls.stop();
        return;
      }
      controlsRef.current = controls;
    } catch {
      setScannerError(t(TEXT.QR_CAMERA_ERROR));
      stopScanner();
    }
  };

  return (
    <BaseModal
      id={IDS.JOIN_MODAL}
      isOpen={joinModalOpen}
      onClose={() => setJoinModalOpen(false)}
      title={t(selectedJoinRoom ? TEXT.JOIN_ROOM_TITLE : TEXT.JOIN_CODE)}
      description={t(TEXT.JOIN_CODE_HINT)}
      size="md"
      className="border border-border-base"
    >
      <div className="space-y-4">
        {!selectedJoinRoom && <>
          <label className="block text-sm text-muted">{t(TEXT.CODE)}
            <input autoComplete="off" value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase().replace(/\s/g, ""))} maxLength={16} placeholder={t(TEXT.CODE)} className={`${CONTROL_CLASS} font-mono tracking-widest`} />
          </label>
          <video ref={videoRef} className={`aspect-video w-full rounded-[var(--radius-control)] bg-surface ${scannerActive ? "block" : "hidden"}`} muted playsInline aria-label={t(TEXT.QR_SCAN)} />
          {scannerError && <p role="status" className="text-sm text-danger-light">{scannerError}</p>}
          <Button type="button" variant="secondary" aria-pressed={scannerActive} onClick={() => scannerActive ? stopScanner() : void startScanner()} leftIcon={scannerActive ? <ScanLine className="h-4 w-4" /> : <Camera className="h-4 w-4" />}>
            {t(scannerActive ? TEXT.QR_STOP : TEXT.QR_SCAN)}
          </Button>
        </>}
        {selectedJoinRoom && <div className="rounded-[var(--radius-control)] border border-border-subtle bg-surface px-4 py-3">
          <p className="font-semibold text-cream">{selectedJoinRoom.participants.find((participant) => participant.userId === selectedJoinRoom.creatorId)?.displayName}</p>
          <p className="mt-1 text-sm text-muted">{selectedJoinRoom.visibility === "PUBLIC" ? t(TEXT.PUBLIC) : t(TEXT.PRIVATE)} · {selectedJoinRoom.participants.filter((item) => item.role === "PARTICIPANT").length}/{selectedJoinRoom.maxParticipants ?? 32}</p>
        </div>}
        <label className="block text-sm text-muted">{t(TEXT.JOIN_AS)}
          <select className={CONTROL_CLASS} value={joinRole} onChange={(event) => setJoinRole(event.target.value as "PARTICIPANT" | "SPECTATOR")}>
            <option value="PARTICIPANT" disabled={Boolean(selectedJoinRoom && registrationClosed)}>{t(TEXT.PARTICIPANT)}</option>
            <option value="SPECTATOR">{t(TEXT.SPECTATOR)}</option>
          </select>
        </label>
        {joinRole === "PARTICIPANT" && <>
          <label className="block text-sm text-muted">{t(TEXT.DECK)}
            <select className={CONTROL_CLASS} value={joinDeckId} onChange={(event) => setJoinDeckId(event.target.value)}>
              <option value="">{t(TEXT.SELECT_DECK)}</option>
              {decks.map((deck) => <option key={deck.id} value={deck.id}>{deck.name}</option>)}
            </select>
          </label>
          <label className="block text-sm text-muted">{t(TEXT.PERSONAL_STAKE_CARD)}
            <select className={CONTROL_CLASS} value={joinStakeCardSlug} onChange={(event) => setJoinStakeCardSlug(event.target.value)}>
              <option value="">{t(TEXT.SELECT_STAKE_CARD)}</option>
              {characterCards.map((card) => <option key={card.slug} value={card.slug}>{card.name} · {card.baseAttack + card.baseDefense}</option>)}
            </select>
          </label>
        </>}
        <div className="flex justify-end gap-3 border-t border-border-subtle pt-4">
          <Button type="button" variant="secondary" onClick={() => setJoinModalOpen(false)}>{t(TEXT.LEAVE_CANCEL_ACTION)}</Button>
          <Button type="button" variant="amber" isLoading={busy} disabled={!canSubmit} onClick={() => void submitJoin()}>{t(joinRole === "SPECTATOR" ? TEXT.WATCH_ACTION : TEXT.JOIN_ACTION)}</Button>
        </div>
      </div>
    </BaseModal>
  );
}
