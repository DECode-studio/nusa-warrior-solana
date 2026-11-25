"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Shield, Sword, EyeOff, Info } from "lucide-react";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import { useTranslator } from "@/core/translator";
const CARD_BACK_IMAGE = "/cards/nusantara-card.back-card.png";

export interface CardVisualProps {
  card: CardEntity;
  isFaceDown?: boolean;
  animateFlip?: boolean;
  priority?: "high" | "low" | "lazy";
  size?: "sm" | "md" | "lg";
  currentAttack?: number;
  currentDefense?: number;
  tempAttackMod?: number;
  tempDefenseMod?: number;
  synergyBadge?: boolean;
  showName?: boolean;
  showDescription?: boolean;
  showOverlay?: boolean;
  badgeContent?: "code" | "role";
  selected?: boolean;
  disabled?: boolean;
  badgeText?: string;
  onClick?: () => void;
  onInspect?: (card: CardEntity) => void;
  semanticId?: string;
  className?: string;
  flipClassName?: string;
  appliedInstruments?: readonly CardEntity[];
}

export function CardVisual({
  card,
  isFaceDown = false,
  animateFlip = false,
  priority = "lazy",
  size = "md",
  currentAttack,
  currentDefense,
  tempAttackMod = 0,
  tempDefenseMod = 0,
  synergyBadge = false,
  showName = true,
  showDescription,
  showOverlay = true,
  badgeContent = "code",
  selected = false,
  disabled = false,
  badgeText,
  onClick,
  onInspect,
  semanticId,
  className = "",
  flipClassName = "",
  appliedInstruments = [],
}: CardVisualProps): React.ReactElement {
  const { t } = useTranslator();
  const wasFaceDown = useRef(isFaceDown);
  const [isFlipAnimating, setIsFlipAnimating] = useState(false);

  useEffect(() => {
    if (animateFlip && wasFaceDown.current && !isFaceDown) {
      setIsFlipAnimating(true);
      const timeoutId = window.setTimeout(() => setIsFlipAnimating(false), 650);
      wasFaceDown.current = isFaceDown;
      return () => window.clearTimeout(timeoutId);
    }
    wasFaceDown.current = isFaceDown;
  }, [animateFlip, isFaceDown]);

  const sizeClasses = {
    sm: "w-32 sm:w-36 max-w-full aspect-[1024/1505]",
    md: "w-40 sm:w-44 max-w-full aspect-[1024/1505]",
    lg: "w-48 sm:w-56 max-w-full aspect-[1024/1505]",
  }[size];

  const effectiveAtk = currentAttack ?? card.baseAttack;
  const effectiveDef = currentDefense ?? card.baseDefense;
  const effectiveShowDescription = showDescription ?? showName;
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
    ? t("card.kingdom.majapahit")
    : card.kingdom === "PAJAJARAN"
      ? t("card.kingdom.pajajaran")
      : t("card.kingdom.general");
  const badgeLabel =
    badgeContent === "role"
      ? card.cardType === "CHARACTER"
        ? roleLabel(card.role)
        : card.affinityRole
          ? roleLabel(card.affinityRole)
          : t("battle.ui.affinityGeneral")
      : card.code;

  return (
    <div
      id={semanticId}
      role={onClick ? "button" : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      aria-pressed={onClick ? selected : undefined}
      aria-disabled={disabled ? true : undefined}
      onClick={() => {
        if (!disabled && onClick) {
          onClick();
        }
      }}
      onKeyDown={(e) => {
        if (!disabled && onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`nusantara-card-interactive nc-card-container group relative select-none ${sizeClasses} ${
        selected
          ? "filter drop-shadow-[0_0_12px_rgba(240,173,73,0.95)] drop-shadow-[0_0_24px_rgba(103,102,255,0.7)]"
          : ""
      } ${onClick && !disabled ? "cursor-pointer" : ""} ${
        disabled ? "opacity-55 cursor-not-allowed" : ""
      } ${isFlipAnimating ? flipClassName : ""} ${className}`}
    >
      {isFaceDown ? (
        <div className="relative h-full w-full">
          <Image
            src={CARD_BACK_IMAGE}
            alt={t("card.faceDownAlt")}
            width={400}
            height={588}
            className="h-full w-full object-contain"
            priority={priority === "high"}
            fetchPriority={priority === "low" ? "low" : undefined}
            unoptimized
          />
          <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-1.5 border-y border-[var(--theme-color4)] bg-[#000000] py-1.5 text-xs font-bold text-[#F8F5F0]">
            <EyeOff className="h-3.5 w-3.5 text-[var(--theme-color4)]" />
            <span>{t("battle.ui.faceDown")}</span>
          </div>
        </div>
      ) : (
        <>
          <Image
            src={card.imagePath}
            alt={`${card.name} (${kingdomLabel})`}
            width={400}
            height={588}
            className="h-full w-full object-contain"
            priority={priority === "high"}
            loading={priority === "lazy" ? "lazy" : "eager"}
            fetchPriority={priority === "low" ? "low" : undefined}
            unoptimized
          />

          {showOverlay && (
            <div className="pointer-events-none absolute inset-x-1.5 top-1.5 z-10 hidden items-center justify-between gap-1 md:flex">
              <span className="font-display rounded-md border border-amber bg-black px-1.5 py-0.5 text-xs font-bold text-cream">
                {badgeLabel}
              </span>

              <div className="flex items-center gap-1.5">
                {synergyBadge && (
                  <span className="font-display rounded-md border border-black bg-amber px-1.5 py-0.5 text-xs font-extrabold text-black">
                    {t("card.synergyBadge")}
                  </span>
                )}

                {badgeText && !synergyBadge && (
                  <span className="font-display rounded-md border border-black bg-emerald px-1.5 py-0.5 text-xs font-extrabold text-black">
                    {badgeText}
                  </span>
                )}

                {onInspect && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onInspect(card);
                    }}
                    title={t("card.inspectHistory", { name: card.name })}
                    aria-label={t("card.inspectHistory", { name: card.name })}
                    className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border-2 border-amber bg-black text-cream transition hover:bg-amber hover:text-black"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {showOverlay && card.cardType === "CHARACTER" && (
            <div
              className={`pointer-events-none absolute inset-x-1 bottom-1 hidden rounded-xl border border-amber bg-black px-2 ${
                showName ? "py-1.5" : "py-1"
              } md:block`}
            >
              {showName && (
                <div className="nc-card-title font-display truncate font-bold text-cream">
                  {card.name}
                </div>
              )}
              <div
                className={`font-display flex items-center justify-between text-xs font-extrabold ${
                  showName ? "mt-0.5" : ""
                }`}
              >
                <span
                  className={`flex items-center gap-1 ${
                    tempAttackMod > 0
                      ? "text-emerald-light"
                      : tempAttackMod < 0
                        ? "text-danger-light"
                        : "text-amber"
                  }`}
                >
                  <Sword className="h-3 w-3 shrink-0" />
                  <span>{effectiveAtk}</span>
                </span>
                <span
                  className={`flex items-center gap-1 ${
                    tempDefenseMod > 0
                      ? "text-emerald-light"
                      : tempDefenseMod < 0
                        ? "text-danger-light"
                        : "text-cream"
                  }`}
                >
                  <Shield className="h-3 w-3 shrink-0" />
                  <span>{effectiveDef}</span>
                </span>
              </div>
            </div>
          )}

          {showOverlay &&
            card.cardType === "INSTRUMENT" &&
            (showName || effectiveShowDescription) && (
              <div
                className={`pointer-events-none absolute inset-x-1 bottom-1 hidden rounded-xl border border-emerald bg-black px-2 ${
                  showName && effectiveShowDescription ? "py-1.5" : "py-1"
                } md:block`}
              >
                {showName && (
                  <div className="nc-card-title font-display truncate font-bold text-cream">
                    {card.name}
                  </div>
                )}
                {effectiveShowDescription && (
                  <div className="truncate text-xs font-semibold text-emerald-light">
                    {card.effectName} (
                    {card.affinityRole
                      ? roleLabel(card.affinityRole)
                      : t("battle.ui.affinityGeneral")}
                    )
                  </div>
                )}
              </div>
            )}
        </>
      )}
      {appliedInstruments.length > 0 && (
        <div className="pointer-events-none absolute right-1 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-1">
          {appliedInstruments.map((instrument, index) => (
            <Image
              key={`${instrument.slug}-${index}`}
              src={instrument.imagePath}
              alt=""
              width={72}
              height={96}
              title={`Waditra aktif: ${instrument.name}`}
              className="h-9 w-7 rounded border border-[#ffcf78] object-cover shadow-[0_2px_8px_rgba(0,0,0,0.8)] sm:h-12 sm:w-9"
              unoptimized
            />
          ))}
        </div>
      )}
    </div>
  );
}
