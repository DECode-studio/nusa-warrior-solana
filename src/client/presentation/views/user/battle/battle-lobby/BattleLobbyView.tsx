"use client";

import React, { useState } from "react";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import { CardDetailModal } from "@/client/presentation/components/CardDetailModal";
import { useTranslator } from "@/core/translator";
import { BattleLobbyContent, QuickMatchModal } from "./components";
import { useBattleLobby } from "./hooks/useBattleLobby";

export function BattleLobbyView(): React.ReactElement {
  const { t } = useTranslator();
  const [inspectedCard, setInspectedCard] = useState<CardEntity | null>(null);
  const lobby = useBattleLobby();

  return (
    <div className="space-y-6">
      <BattleLobbyContent
        decks={lobby.decks}
        selectedDeckId={lobby.selectedDeckId}
        onSelectDeckId={lobby.selectDeck}
        botDifficulty={lobby.botDifficulty}
        onSelectDifficulty={lobby.selectDifficulty}
        previewDeckCards={lobby.previewDeckCards}
        activeLobbyDeck={lobby.activeLobbyDeck}
        matchHistory={lobby.matchHistory}
        onStartBattle={() => void lobby.enterArena()}
        onQuickMatch={() => lobby.setQuickMatchAgreementOpen(true)}
        hasSavedBattleSession={lobby.hasSavedBattleSession}
        onInspectCard={setInspectedCard}
        loading={lobby.loading}
        error={lobby.error ? t(lobby.error) : null}
        onRetry={() => void lobby.retry()}
      />
      <QuickMatchModal
        agreementOpen={lobby.quickMatchAgreementOpen}
        queue={lobby.quickMatchQueue}
        error={lobby.quickMatchError}
        activeBattle={lobby.activeBattleSession}
        endingActiveBattle={lobby.endingActiveBattle}
        joiningQuickMatch={lobby.joiningQuickMatch}
        cancellingQuickMatch={lobby.cancellingQuickMatch}
        onAgree={() => { void lobby.startQuickMatch(); }}
        onDecline={() => { if (!lobby.joiningQuickMatch) lobby.setQuickMatchAgreementOpen(false); }}
        onCancelSearch={() => void lobby.cancelQuickMatch()}
        onPlayBot={() => {
          void lobby.cancelQuickMatch().then((cancelled) => {
            if (cancelled) void lobby.enterArena();
          });
        }}
        onBrowseLeagues={() => void lobby.browsePublicLeagues()}
        onContinueActiveBattle={lobby.continueActiveBattle}
        onSurrenderActiveBattle={() => void lobby.surrenderActiveBattle()}
      />
      <CardDetailModal card={inspectedCard} onClose={() => setInspectedCard(null)} />
    </div>
  );
}
