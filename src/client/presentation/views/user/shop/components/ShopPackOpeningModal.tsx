"use client";

import React from "react";
import Image from "next/image";
import { Sparkles, Trophy } from "lucide-react";
import type { PaymentOrderEntity } from "@/client/domain/shop/entity/shop_entity";
import { Badge, BaseModal, Button } from "@/client/presentation/components/ui";

export interface ShopPackOpeningModalProps {
  readonly receipt: PaymentOrderEntity | null;
  readonly onClose: () => void;
}

export function ShopPackOpeningModal({
  receipt,
  onClose,
}: ShopPackOpeningModalProps): React.ReactElement | null {
  if (!receipt || !receipt.drawnCards || receipt.drawnCards.length === 0) {
    return null;
  }

  const { drawnCards, starterPackName } = receipt;
  const highEndCount = drawnCards.filter((c) => c.isHighEnd).length;

  const modalTitle = (
    <div className="w-full text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber/15 text-amber-light">
        <Trophy className="h-6 w-6" />
      </div>
      <h2
        id="pack-opening-title"
        className="mt-3 font-display text-2xl font-bold tracking-tight text-cream sm:text-3xl"
      >
        Selamat! Paket Berhasil Dibuka
      </h2>
      <p className="mt-1 text-sm text-muted">
        Kartu dari{" "}
        <span className="font-semibold text-amber-light">{starterPackName}</span>{" "}
        telah ditambahkan ke koleksi akun Anda.
      </p>

      <div className="mt-3 flex items-center justify-center gap-2">
        <Badge variant="primary" size="sm">
          {drawnCards.length} Kartu Diperoleh
        </Badge>
        {highEndCount > 0 && (
          <Badge
            variant="amber"
            size="sm"
            icon={<Sparkles className="h-3 w-3" />}
          >
            {highEndCount} Kartu High-End
          </Badge>
        )}
      </div>
    </div>
  );

  const modalFooter = (
    <div className="flex w-full justify-center">
      <Button
        onClick={onClose}
        variant="primary"
        size="md"
        className="w-full sm:w-auto sm:px-8"
      >
        Lihat di Koleksi Deck
      </Button>
    </div>
  );

  return (
    <BaseModal
      isOpen={Boolean(receipt && drawnCards.length > 0)}
      onClose={onClose}
      title={modalTitle}
      size="xl"
      footer={modalFooter}
      className="border-amber/30"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {drawnCards.map((card, idx) => {
          const isHigh = card.isHighEnd;
          return (
            <div
              key={`${card.slug}-${idx}`}
              className={`group relative flex flex-col overflow-hidden rounded-xl border p-2.5 transition-all duration-200 hover:-translate-y-1 ${
                isHigh
                  ? "border-amber/40 bg-amber/10"
                  : "border-border-base bg-surface-elevated/40 hover:border-border-strong"
              }`}
            >
              {isHigh && (
                <div className="absolute -right-8 top-2 rotate-45 bg-amber px-8 py-0.5 text-[9px] font-bold text-surface-base shadow">
                  High-End
                </div>
              )}

              {/* Thumbnail / Visual */}
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-surface-base/60">
                <Image
                  src={card.imagePath}
                  alt={card.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 20vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-surface-base/90 via-surface-base/40 to-transparent p-1.5 text-[10px]">
                  <span className="font-semibold text-amber-light">
                    {card.cardType === "CHARACTER" ? "Karakter" : "Instrumen"}
                  </span>
                </div>
              </div>

              {/* Card Info */}
              <div className="mt-2 flex flex-1 flex-col justify-between">
                <div className="truncate font-display text-xs font-bold text-cream group-hover:text-amber-light">
                  {card.name}
                </div>

                <div className="mt-1 flex items-center justify-between text-[11px] text-muted">
                  {card.cardType === "CHARACTER" ? (
                    <>
                      <span className="font-medium text-emerald-light">
                        ATK {card.baseAttack}
                      </span>
                      <span className="font-medium text-primary-light">
                        DEF {card.baseDefense}
                      </span>
                    </>
                  ) : (
                    <span className="truncate font-medium text-amber-light">
                      {card.effectName ?? "Efek Khusus"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </BaseModal>
  );
}
