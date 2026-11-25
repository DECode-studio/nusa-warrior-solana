"use client";

import React from "react";
import { BATTLE_TEXT_CONSTANT } from "../constants/TextConstant";
import Image from "next/image";
import {
  Sword,
  Shield,
  Swords,
  Sparkles,
  ArrowUp,
  X,
  Music,
  EyeOff,
} from "lucide-react";
import type { BattleSlotCharacter } from "@/client/domain/battle/entity/battle_entity";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import { useTranslator } from "@/core/translator";
const CARD_BACK_IMAGE = "/cards/nusantara-card.back-card.png";
import { BaseModal } from "@/client/presentation/components/ui/BaseModal";
import { Badge } from "@/client/presentation/components/ui/Badge";
import { Button } from "@/client/presentation/components/ui/Button";
import { formatKingdomLabel } from "@/core/utils/formatters";
import { InstrumentEffectDescription } from "@/client/presentation/components/InstrumentEffectDescription";

export interface MobileCardTarget {
  type: "PLAYER_FRONT" | "PLAYER_SECOND" | "BOT_FRONT" | "BOT_SECOND" | "PLAYER_HAND";
  slotIndex?: number;
  instanceId?: string;
  card: CardEntity;
  slot?: BattleSlotCharacter;
  appliedInstruments?: CardEntity[];
}

export interface BattleCardActionBottomSheetProps {
  readonly target: MobileCardTarget | null;
  readonly onClose: () => void;
  readonly isPlayerTurn: boolean;
  readonly phase: string;
  readonly selectedAttackerFrontIndex: number | null;
  readonly selectedHandInstanceId: string | null;
  readonly canTargetOpponent?: boolean;
  readonly canApplyInstrumentToOwn?: boolean;
  readonly canRespond?: boolean;
  readonly isPlayerPromotionNeeded: boolean;
  readonly onSelectAttacker?: (slotIndex: number) => void;
  readonly onDeselectAttacker?: () => void;
  readonly onAttackTarget?: (defenderFrontIndex: number) => void;
  readonly onApplyInstrumentToOpponent?: (defenderFrontIndex: number) => void;
  readonly onSelectHandInstrument?: (instanceId: string) => void;
  readonly onDeselectHandInstrument?: () => void;
  readonly onApplyInstrumentToSlot?: (row: "FRONT" | "SECOND", slotIndex: number) => void;
  readonly onPromoteCharacter?: (slotIndex: number) => void;
}

export function BattleCardActionBottomSheet({
  target,
  onClose,
  isPlayerTurn,
  phase,
  selectedAttackerFrontIndex,
  selectedHandInstanceId,
  canTargetOpponent = false,
  canApplyInstrumentToOwn = true,
  canRespond = false,
  isPlayerPromotionNeeded,
  onSelectAttacker,
  onDeselectAttacker,
  onAttackTarget,
  onApplyInstrumentToOpponent,
  onSelectHandInstrument,
  onDeselectHandInstrument,
  onApplyInstrumentToSlot,
  onPromoteCharacter,
}: BattleCardActionBottomSheetProps): React.ReactElement | null {
  const { t, locale } = useTranslator();
  if (!target) return null;

  const { card, slot, type, slotIndex = 0, instanceId = "", appliedInstruments = [] } = target;
  const canTakeInstrumentAction = isPlayerTurn || canRespond;
  const isFaceDown = slot ? !slot.isRevealed : card.code === "HIDDEN" || !card.imagePath;

  const effectiveAtk = slot?.currentAttack ?? card.baseAttack;
  const effectiveDef = slot?.currentDefense ?? card.baseDefense;
  const effectDescription = locale === "en"
    ? card.effectDescriptionEn
    : locale === "zh"
      ? card.effectDescriptionZh
      : card.effectDescriptionId;
  const historicalSummary = locale === "en"
    ? card.historicalSummaryEn
    : locale === "zh"
      ? card.historicalSummaryZh
      : card.historicalSummaryId;
  const roleLabel = (role: CardEntity["role"]): string => {
    const roleKeys = {
      PEMIMPIN: "card.role.leader",
      PRAJURIT: "card.role.warrior",
      PEMUKA: "card.role.sage",
      UTUSAN: "card.role.envoy",
      PERAJIN: "card.role.artisan",
    } as const;
    return t(roleKeys[role]);
  };
  const kingdomLabel = card.kingdom === "MAJAPAHIT"
    ? t(BATTLE_TEXT_CONSTANT.CARD_KINGDOM_MAJAPAHIT)
    : card.kingdom === "PAJAJARAN"
      ? t(BATTLE_TEXT_CONSTANT.CARD_KINGDOM_PAJAJARAN)
      : card.kingdom === "NUSANTARA_UMUM"
        ? t(BATTLE_TEXT_CONSTANT.CARD_KINGDOM_GENERAL)
        : formatKingdomLabel(card.kingdom);

  // Determine available primary action
  let primaryAction: {
    label: string;
    icon: React.ReactNode;
    variant: "primary" | "danger" | "outline";
    onClick: () => void;
  } | null = null;

  let statusNote: string | null = null;

  if (type === "PLAYER_FRONT") {
    // If an instrument from hand is currently selected, option to apply it
    if (
      selectedHandInstanceId &&
      canApplyInstrumentToOwn &&
      canTakeInstrumentAction &&
      (phase === "PRE_ATTACK_INSTRUMENT" || phase === "DEFENDER_INSTRUMENT_RESPONSE")
    ) {
      primaryAction = {
        label: t(BATTLE_TEXT_CONSTANT.UI_ACTION_INSTALL_INSTRUMENT, { card: card.name }),
        icon: <Sparkles className="h-4 w-4" />,
        variant: "primary",
        onClick: () => {
          onApplyInstrumentToSlot?.("FRONT", slotIndex);
          onClose();
        },
      };
    } else if (!selectedHandInstanceId && isPlayerTurn && phase === "PRE_ATTACK_INSTRUMENT") {
      if (slot?.hasAttackedThisTurn) {
        statusNote = t(BATTLE_TEXT_CONSTANT.UI_STATUS_ALREADY_ATTACKED);
      } else if (selectedAttackerFrontIndex === slotIndex) {
        primaryAction = {
          label: t(BATTLE_TEXT_CONSTANT.UI_ACTION_CANCEL_ATTACKER),
          icon: <X className="h-4 w-4" />,
          variant: "outline",
          onClick: () => {
            onDeselectAttacker?.();
            onClose();
          },
        };
      } else {
        primaryAction = {
          label: t(BATTLE_TEXT_CONSTANT.UI_ACTION_SELECT_ATTACK),
          icon: <Swords className="h-4 w-4" />,
          variant: "primary",
          onClick: () => {
            onSelectAttacker?.(slotIndex);
            onClose();
          },
        };
      }
    }
  } else if (type === "BOT_FRONT") {
    if (
      canTargetOpponent &&
      selectedHandInstanceId &&
      canTakeInstrumentAction &&
      (phase === "PRE_ATTACK_INSTRUMENT" || phase === "DEFENDER_INSTRUMENT_RESPONSE")
    ) {
      primaryAction = {
        label: t(BATTLE_TEXT_CONSTANT.UI_ACTION_INSTALL_INSTRUMENT, { card: card.name }),
        icon: <Sparkles className="h-4 w-4" />,
        variant: "primary",
        onClick: () => {
          onApplyInstrumentToOpponent?.(slotIndex);
          onClose();
        },
      };
    }
    const isTargetable =
      canTakeInstrumentAction &&
      phase === "PRE_ATTACK_INSTRUMENT" &&
      selectedAttackerFrontIndex !== null;

    if (!primaryAction && isTargetable) {
      primaryAction = {
        label: t(BATTLE_TEXT_CONSTANT.UI_ACTION_ATTACK_CARD, { card: card.name }),
        icon: <Swords className="h-4 w-4" />,
        variant: "danger",
        onClick: () => {
          onAttackTarget?.(slotIndex);
          onClose();
        },
      };
    }
  } else if (type === "PLAYER_HAND") {
    const isSelected = selectedHandInstanceId === instanceId;
    if (isSelected) {
      primaryAction = {
        label: t(BATTLE_TEXT_CONSTANT.UI_ACTION_CANCEL_INSTRUMENT),
        icon: <X className="h-4 w-4" />,
        variant: "outline",
        onClick: () => {
          onDeselectHandInstrument?.();
          onClose();
        },
      };
    } else if (
      canTakeInstrumentAction &&
      (phase === "PRE_ATTACK_INSTRUMENT" || phase === "DEFENDER_INSTRUMENT_RESPONSE")
    ) {
      primaryAction = {
        label: t(BATTLE_TEXT_CONSTANT.UI_ACTION_SELECT_INSTRUMENT),
        icon: <Music className="h-4 w-4" />,
        variant: "primary",
        onClick: () => {
          onSelectHandInstrument?.(instanceId);
          onClose();
        },
      };
    }
  } else if (type === "PLAYER_SECOND") {
    if (isPlayerPromotionNeeded) {
      primaryAction = {
        label: t(BATTLE_TEXT_CONSTANT.UI_ACTION_PROMOTE),
        icon: <ArrowUp className="h-4 w-4" />,
        variant: "primary",
        onClick: () => {
          onPromoteCharacter?.(slotIndex);
          onClose();
        },
      };
    } else if (
      selectedHandInstanceId &&
      canApplyInstrumentToOwn &&
      canTakeInstrumentAction &&
      (phase === "PRE_ATTACK_INSTRUMENT" || phase === "DEFENDER_INSTRUMENT_RESPONSE")
    ) {
      primaryAction = {
        label: t(BATTLE_TEXT_CONSTANT.UI_ACTION_INSTALL_INSTRUMENT, { card: card.name }),
        icon: <Sparkles className="h-4 w-4" />,
        variant: "primary",
        onClick: () => {
          onApplyInstrumentToSlot?.("SECOND", slotIndex);
          onClose();
        },
      };
    }
  }

  const modalTitle = (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-1.5">
        {isFaceDown ? (
          <Badge variant="amber" size="sm">
            {t(BATTLE_TEXT_CONSTANT.UI_FACE_DOWN)}
          </Badge>
        ) : (
          <>
            <Badge variant="amber" size="sm">
              {card.code}
            </Badge>
            <Badge variant="neutral" size="sm">
              {kingdomLabel}
            </Badge>
            <Badge variant="primary" size="sm">
              {roleLabel(card.role)}
            </Badge>
            {card.cardType === "INSTRUMENT" && (
              <Badge variant="emerald" size="sm">
                {t(BATTLE_TEXT_CONSTANT.INSTRUMENT_HAND)}
              </Badge>
            )}
          </>
        )}
      </div>
      <h3 className="font-display text-lg font-bold text-white">
        {isFaceDown ? t(BATTLE_TEXT_CONSTANT.UI_FACE_DOWN_CARD) : card.name}
      </h3>
    </div>
  );

  return (
    <BaseModal
      isOpen={Boolean(target)}
      onClose={onClose}
      title={modalTitle}
      size="md"
      mobileBehavior="bottomsheet"
      showDragHandle
      dragToDismiss
      ariaLabel={t(BATTLE_TEXT_CONSTANT.UI_CARD_ACTION, { card: isFaceDown ? t(BATTLE_TEXT_CONSTANT.UI_FACE_DOWN_CARD) : card.name })}
    >
      <div className="space-y-4 px-1 pb-2">
        {/* Main visual & stats */}
        <div className="flex items-start gap-4">
          <div className="w-24 shrink-0 sm:w-28">
            <div className="relative aspect-[1024/1505] overflow-hidden rounded-lg shadow-md">
              <Image
                src={isFaceDown ? CARD_BACK_IMAGE : card.imagePath}
                alt={isFaceDown ? t(BATTLE_TEXT_CONSTANT.UI_CARD_BACK_ALT) : card.name}
                width={256}
                height={376}
                className="h-full w-full object-contain"
                unoptimized
              />
              {isFaceDown && (
                <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-1.5 border-y border-amber/40 bg-surface-base py-1 text-[10px] font-bold text-cream">
                  <EyeOff className="h-3 w-3 text-amber-light" />
                  <span>{t(BATTLE_TEXT_CONSTANT.UI_FACE_DOWN)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-2.5">
            {card.cardType === "CHARACTER" ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-amber/20 bg-amber/10 p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-amber-light">
                    <Sword className="h-3 w-3" />
                    <span>{t(BATTLE_TEXT_CONSTANT.UI_STAT_ATTACK)}</span>
                  </div>
                  <div className="mt-0.5 font-display text-lg font-black text-amber-light">
                    {isFaceDown ? "?" : effectiveAtk}
                    {!isFaceDown && slot && slot.tempAttackMod !== 0 && (
                      <span className="ml-1 text-xs text-amber-light">
                        ({slot.tempAttackMod > 0 ? `+${slot.tempAttackMod}` : slot.tempAttackMod})
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-primary/20 bg-primary/10 p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-primary-light">
                    <Shield className="h-3 w-3" />
                    <span>{t(BATTLE_TEXT_CONSTANT.UI_STAT_DEFENSE)}</span>
                  </div>
                  <div className="mt-0.5 font-display text-lg font-black text-primary-light">
                    {isFaceDown ? "?" : effectiveDef}
                    {!isFaceDown && slot && slot.tempDefenseMod !== 0 && (
                      <span className="ml-1 text-xs text-primary-light">
                        ({slot.tempDefenseMod > 0 ? `+${slot.tempDefenseMod}` : slot.tempDefenseMod})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald/20 bg-emerald/10 p-2.5">
                <div className="text-xs font-bold text-emerald-light">
                  {card.effectName}
                </div>
                <div className="mt-1 text-xs text-muted">
                  {effectDescription ? (
                    <InstrumentEffectDescription text={effectDescription} />
                  ) : null}
                </div>
                <div className="mt-1.5 text-[11px] text-emerald-light/80">
                  {t(BATTLE_TEXT_CONSTANT.UI_AFFINITY)} {card.affinityRole ? roleLabel(card.affinityRole) : t(BATTLE_TEXT_CONSTANT.UI_AFFINITY_GENERAL)}
                </div>
              </div>
            )}

            {appliedInstruments.length > 0 && (
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-stone-400">
                  {t(BATTLE_TEXT_CONSTANT.UI_EQUIPPED_INSTRUMENTS, { count: appliedInstruments.length })}
                </div>
                <div className="flex flex-wrap gap-1">
                  {appliedInstruments.map((inst, i) => (
                    <span
                      key={`${inst.slug}-${i}`}
                      className="inline-flex items-center gap-1 rounded-md border border-purple-500/30 bg-purple-950/40 px-1.5 py-0.5 text-[10px] text-purple-200"
                    >
                      <Sparkles className="h-2.5 w-2.5 text-purple-400" />
                      {inst.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {statusNote && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-950/30 p-2 text-xs text-amber-200">
                {statusNote}
              </div>
            )}
          </div>
        </div>

        {/* Historical Lore Preview */}
        {historicalSummary && (
          <div className="border-t border-white/10 pt-2.5">
            <p className="line-clamp-2 text-[11px] text-stone-400 italic">
              &ldquo;{historicalSummary}&rdquo;
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          {primaryAction && (
            <Button
              variant={primaryAction.variant}
              onClick={primaryAction.onClick}
              className="w-full justify-center py-2.5 text-sm font-bold"
            >
              <span className="flex items-center gap-2">
                {primaryAction.icon}
                <span>{primaryAction.label}</span>
              </span>
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full justify-center text-xs text-stone-400 hover:text-white"
          >
            {t(BATTLE_TEXT_CONSTANT.UI_CANCEL)}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}

