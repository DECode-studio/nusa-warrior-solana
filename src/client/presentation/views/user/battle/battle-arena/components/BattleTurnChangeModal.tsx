"use client";

import React, { useEffect, useRef, useState } from "react";
import { BATTLE_TEXT_CONSTANT } from "../constants/TextConstant";
import { Swords } from "lucide-react";
import { BaseModal } from "@/client/presentation/components/ui";
import { useTranslator } from "@/core/translator";
import { gamelanAudio } from "@/core/utils/audio-synth";
import { BATTLE_SEMANTIC_IDS } from "../constants/SemanticIdConstant";

export interface BattleTurnChangeNotice {
  readonly id: number;
  readonly activePlayer: "PLAYER" | "BOT";
}

interface BattleTurnChangeModalProps {
  readonly notice: BattleTurnChangeNotice | null;
  readonly opponentLabel: string;
  readonly onComplete: (noticeId: number) => void;
}

export function BattleTurnChangeModal({
  notice,
  opponentLabel,
  onComplete,
}: BattleTurnChangeModalProps): React.ReactElement | null {
  const { t } = useTranslator();
  const [isOpen, setIsOpen] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!notice) {
      setIsOpen(false);
      return;
    }

    setIsOpen(true);
    gamelanAudio.playTurnChange();
    const timeoutId = window.setTimeout(() => {
      setIsOpen(false);
      onCompleteRef.current(notice.id);
    }, 1000);
    return () => window.clearTimeout(timeoutId);
  }, [notice?.id]);

  if (!notice) return null;

  const isPlayerTurn = notice.activePlayer === "PLAYER";
  return (
    <BaseModal
      id={BATTLE_SEMANTIC_IDS.TURN_CHANGE_MODAL}
      isOpen={isOpen}
      onClose={() => {}}
      size="sm"
      mobileBehavior="modal"
      closeOnBackdropClick={false}
      showCloseButton={false}
      dragToDismiss={false}
      showDragHandle={false}
      zIndexClassName="z-[90]"
      className="border border-amber/40 bg-surface-elevated text-center"
      ariaLabel={isPlayerTurn ? t(BATTLE_TEXT_CONSTANT.UI_TURN_YOU) : t(BATTLE_TEXT_CONSTANT.UI_TURN_OPPONENT, { opponent: opponentLabel })}
    >
      <div className="flex flex-col items-center gap-3 py-2">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber/15 text-amber-light">
          <Swords className="h-7 w-7" aria-hidden="true" />
        </div>
        <h2 className="font-display text-xl font-extrabold text-amber-light">
          {isPlayerTurn ? t(BATTLE_TEXT_CONSTANT.UI_TURN_YOU) : t(BATTLE_TEXT_CONSTANT.UI_TURN_OPPONENT, { opponent: opponentLabel })}
        </h2>
      </div>
    </BaseModal>
  );
}
