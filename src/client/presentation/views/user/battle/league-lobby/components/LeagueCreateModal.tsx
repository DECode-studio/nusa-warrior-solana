import React from "react";
import type { LeagueRole, LeagueStakeMode } from "@/client/domain/league/entity/league_entity";
import { BaseModal, Button } from "@/client/presentation/components/ui";
import { LEAGUE_LOBBY_SEMANTIC_IDS as IDS } from "../constants/SemanticIdConstant";
import { LEAGUE_TEXT_CONSTANT as TEXT } from "../constants/TextConstant";
import type { useLeagueLobby } from "../hooks/useLeagueLobby";

type LobbyModel = ReturnType<typeof useLeagueLobby>;
const KINGDOMS = ["MAJAPAHIT", "PAJAJARAN", "NUSANTARA_UMUM"] as const;
const CONTROL_CLASS = "mt-1.5 min-h-11 w-full rounded-[var(--radius-control)] border border-border-base bg-surface px-3 py-2 text-sm text-cream outline-none transition-colors placeholder:text-subtle hover:border-border-strong focus-visible:border-amber focus-visible:ring-2 focus-visible:ring-amber/30";

export function LeagueCreateModal({ model }: { model: LobbyModel }): React.ReactElement {
  const {
    t, createModalOpen, setCreateModalOpen, decks, deckId, setDeckId, stakeCardSlug, setStakeCardSlug,
    stakeMode, setStakeMode, targetPower, setTargetPower, kingdom, setKingdom, visibility, setVisibility,
    creatorRole, setCreatorRole, capacity, setCapacity, registrationMinutes, setRegistrationMinutes,
    startMode, setStartMode, startDelayMinutes, setStartDelayMinutes, battleDuration, setBattleDuration,
    busy, error, createRoom, characterCards,
  } = model;
  const stakeCard = characterCards.find((item) => item.slug === stakeCardSlug);
  const showStakeCardSelector = stakeMode === "FIXED_CARD" || creatorRole === "PARTICIPANT";

  return (
    <BaseModal id={IDS.CREATE_MODAL} isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title={t(TEXT.CREATE)} size="lg" className="border border-border-base">
      <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void createRoom(); }}>
        <p className="text-sm text-muted">{t(TEXT.CREATE_HINT)}</p>
        {error && <p role="alert" className="rounded-[var(--radius-control)] border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger-light">{error}</p>}
        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <label className="text-sm text-muted">{t(TEXT.VISIBILITY)}
            <select className={CONTROL_CLASS} value={visibility} onChange={(event) => setVisibility(event.target.value as "PUBLIC" | "PRIVATE")}>
              <option value="PUBLIC">{t(TEXT.PUBLIC)}</option><option value="PRIVATE">{t(TEXT.PRIVATE)}</option>
            </select>
          </label>
          <label className="text-sm text-muted">{t(TEXT.CAPACITY)}
            <select className={CONTROL_CLASS} value={capacity} onChange={(event) => setCapacity(event.target.value)}>
              {["4", "8", "16", "32", "FREE"].map((item) => <option key={item} value={item}>{item === "FREE" ? t(TEXT.FREE_CAPACITY) : item}</option>)}
            </select>
          </label>
          <label className="text-sm text-muted">{t(TEXT.REGISTRATION_MINUTES)}
            <input type="number" min={5} max={1440} step={1} required value={registrationMinutes} onChange={(event) => setRegistrationMinutes(Number(event.target.value))} className={CONTROL_CLASS} />
          </label>
          <label className="text-sm text-muted">{t(TEXT.START_MODE)}
            <select className={CONTROL_CLASS} value={startMode} onChange={(event) => setStartMode(event.target.value as "AUTO" | "MANUAL")}>
              <option value="AUTO">{t(TEXT.AUTO_START)}</option><option value="MANUAL">{t(TEXT.MANUAL_START)}</option>
            </select>
          </label>
          {startMode === "AUTO" && <label className="text-sm text-muted">{t(TEXT.START_DELAY)}
            <select className={CONTROL_CLASS} value={startDelayMinutes} onChange={(event) => setStartDelayMinutes(Number(event.target.value))}>
              {[3, 5, 10].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>}
          <label className="text-sm text-muted">{t(TEXT.CREATOR_ROLE)}
            <select className={CONTROL_CLASS} value={creatorRole} onChange={(event) => setCreatorRole(event.target.value as LeagueRole)}>
              <option value="PARTICIPANT">{t(TEXT.PARTICIPANT)}</option><option value="SPECTATOR">{t(TEXT.SPECTATOR)}</option>
            </select>
          </label>
        </div>
        <div className="grid gap-x-4 gap-y-3 border-t border-border-subtle pt-4 sm:grid-cols-2">
          <label className="text-sm text-muted">{t(TEXT.STAKE_MODE)}
            <select className={CONTROL_CLASS} value={stakeMode} onChange={(event) => setStakeMode(event.target.value as LeagueStakeMode)}>
              <option value="FIXED_CARD">{t(TEXT.FIXED_CARD)}</option><option value="BATTLE_POWER">{t(TEXT.BATTLE_POWER)}</option>
            </select>
          </label>
          {showStakeCardSelector && <label className="text-sm text-muted">{stakeMode === "BATTLE_POWER" ? t(TEXT.PERSONAL_STAKE_CARD) : t(TEXT.STAKE_CARD)}
            <select className={CONTROL_CLASS} value={stakeCardSlug} onChange={(event) => {
              const selectedCard = characterCards.find((item) => item.slug === event.target.value);
              setStakeCardSlug(event.target.value);
              if (selectedCard) setTargetPower(selectedCard.baseAttack + selectedCard.baseDefense);
            }}>
              {characterCards.map((item) => <option key={item.slug} value={item.slug}>{item.name} · {item.baseAttack + item.baseDefense}</option>)}
            </select>
          </label>}
          {stakeMode === "BATTLE_POWER" && <label className="text-sm text-muted">{t(TEXT.POWER_TARGET)}
            <input type="number" min={1} max={2000} step={1} required value={targetPower} onChange={(event) => setTargetPower(Number(event.target.value))} className={CONTROL_CLASS} />
          </label>}
          <label className="text-sm text-muted">{t(TEXT.KINGDOM)}
            <select className={CONTROL_CLASS} value={kingdom} onChange={(event) => setKingdom(event.target.value)}>
              <option value="">{t(TEXT.ANY_KINGDOM)}</option>{KINGDOMS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-sm text-muted">{t(TEXT.BATTLE_DURATION)}
            <input type="number" min={1} max={120} step={1} value={battleDuration} onChange={(event) => setBattleDuration(event.target.value)} placeholder="—" className={CONTROL_CLASS} />
          </label>
          {creatorRole === "PARTICIPANT" && <label className="text-sm text-muted">{t(TEXT.DECK)}
            <select className={CONTROL_CLASS} value={deckId} onChange={(event) => setDeckId(event.target.value)}>
              {decks.map((deck) => <option key={deck.id} value={deck.id}>{deck.name}</option>)}
            </select>
          </label>}
        </div>
        {creatorRole === "PARTICIPANT" && stakeMode === "BATTLE_POWER" && stakeCard && <p className="text-xs text-muted">{stakeCard.name}: {stakeCard.baseAttack + stakeCard.baseDefense} · {t(TEXT.POWER_STAKE_SELECTION_HINT)}</p>}
        <div className="flex justify-end gap-3 border-t border-border-subtle pt-4">
          <Button type="button" variant="secondary" onClick={() => setCreateModalOpen(false)}>{t(TEXT.LEAVE_CANCEL_ACTION)}</Button>
          <Button type="submit" variant="amber" isLoading={busy} disabled={
            registrationMinutes < 5 || registrationMinutes > 1440 || !Number.isInteger(registrationMinutes) ||
            (stakeMode === "FIXED_CARD" && !stakeCardSlug) ||
            (stakeMode === "BATTLE_POWER" && (!Number.isInteger(targetPower) || targetPower < 1 || targetPower > 2000)) ||
            (battleDuration !== "" && (!Number.isInteger(Number(battleDuration)) || Number(battleDuration) < 1 || Number(battleDuration) > 120)) ||
            (creatorRole === "PARTICIPANT" && (!deckId || !stakeCardSlug))
          }>{t(TEXT.CREATE_ACTION)}</Button>
        </div>
      </form>
    </BaseModal>
  );
}
