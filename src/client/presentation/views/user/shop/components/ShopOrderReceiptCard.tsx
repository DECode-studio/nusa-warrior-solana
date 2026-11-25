"use client";

import React from "react";
import { CheckCircle2, Clock3, ExternalLink } from "lucide-react";
import type { PaymentOrderEntity } from "@/client/domain/shop/entity/shop_entity";
import { useTranslator } from "@/core/translator";
import { formatIdrCurrency } from "@/core/utils/formatters";
import { Badge, Button, IntellioCard } from "@/client/presentation/components/ui";
import { SHOP_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { SHOP_TEXT_CONSTANT } from "../constants/TextConstant";

export interface ShopOrderReceiptCardProps {
  readonly receipt: PaymentOrderEntity;
}

export function ShopOrderReceiptCard({
  receipt,
}: ShopOrderReceiptCardProps): React.ReactElement {
  const { t } = useTranslator();
  const statusVariant = receipt.paymentStatus === "PAID"
    ? "emerald"
    : receipt.paymentStatus === "PENDING"
      ? "amber"
      : receipt.paymentStatus === "FAILED"
        ? "danger"
        : "neutral";
  const instructions = receipt.paymentInstructions ?? {};
  const paymentNumber = ["PaymentNo", "payment_no", "va", "codeTransaction"]
    .map((key) => instructions[key])
    .find((value) => typeof value === "string" && value.trim());
  const paymentName = ["PaymentName", "payment_name"]
    .map((key) => instructions[key])
    .find((value) => typeof value === "string" && value.trim());
  const paymentUrlValue = receipt.paymentUrl ?? instructions.Url ?? instructions.url;
  const paymentUrl = typeof paymentUrlValue === "string" && paymentUrlValue.startsWith("https://")
    ? paymentUrlValue
    : null;
  const statusDescription = receipt.paymentStatus === "PENDING"
    ? "Selesaikan pembayaran. Pack diberikan setelah pembayaran dikonfirmasi."
    : receipt.paymentStatus === "PAID"
      ? receipt.paymentProvider === "LEGACY_SANDBOX"
        ? "Transaksi simulasi lama. Pack sudah tercatat pada koleksi."
        : receipt.paymentProvider === "NUSA_POINTS"
          ? "Pack dibayar penuh dengan Nusa Point dan sudah siap dibuka."
        : "Pembayaran telah dikonfirmasi. Pack siap dibuka."
      : receipt.paymentStatus === "EXPIRED"
        ? "Waktu pembayaran habis. Buat order baru untuk mencoba kembali."
        : "Pembayaran gagal. Buat order baru untuk mencoba kembali.";

  return (
    <IntellioCard
      id={SHOP_SEMANTIC_IDS.RECEIPT_CARD}
      variant="elevated"
      padding="md"
      className={receipt.paymentStatus === "PAID" ? "border-emerald/30 bg-emerald/10 text-cream" : "text-cream"}
    >
      <div className="flex items-center gap-2">
        {receipt.paymentStatus === "PENDING"
          ? <Clock3 className="h-5 w-5 text-amber-light" />
          : <CheckCircle2 className={`h-5 w-5 ${receipt.paymentStatus === "PAID" ? "text-emerald-light" : "text-muted"}`} />}
        <h3 className="font-display text-base font-bold text-cream">
          {t(SHOP_TEXT_CONSTANT.RECEIPT_TITLE)}
        </h3>
        <Badge variant={statusVariant} size="sm" className="ml-auto">
          {receipt.paymentStatus}
        </Badge>
        {receipt.paymentMode && receipt.amountIdr > 0 && (
          <Badge variant="neutral" size="sm">
            {receipt.paymentMode === "DEV" ? t("shop.modeDev") : t("shop.modeProd")}
          </Badge>
        )}
      </div>

      <p className="nc-type-caption mt-1 text-muted">{statusDescription}</p>

      {receipt.paymentStatus === "PENDING" && (paymentName || paymentNumber || paymentUrl) && (
        <div className="mt-4 space-y-2 rounded-xl border border-border-base bg-surface-elevated/40 p-3 text-sm">
          {typeof paymentName === "string" && <p className="font-semibold text-cream">{paymentName}</p>}
          {typeof paymentNumber === "string" && (
            <div>
              <span className="block text-xs text-subtle">Nomor pembayaran</span>
              <code className="break-all font-mono text-base text-cream">{paymentNumber}</code>
            </div>
          )}
          {paymentUrl && (
            <Button
              href={paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
              size="sm"
              rightIcon={<ExternalLink className="h-4 w-4" aria-hidden="true" />}
            >
              Lihat instruksi pembayaran
            </Button>
          )}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border-base pt-3 text-xs sm:grid-cols-4">
        <div>
          <span className="text-subtle">
            {t(SHOP_TEXT_CONSTANT.ORDER_ID_LABEL)}
          </span>
          <div className="font-mono font-bold text-cream truncate">
            {receipt.orderNumber}
          </div>
        </div>
        <div>
          <span className="text-subtle">Paket:</span>
          <div className="font-bold text-cream truncate">
            {receipt.starterPackCode}
          </div>
        </div>
        <div>
          <span className="text-subtle">
            {t(SHOP_TEXT_CONSTANT.ORDER_TOTAL_LABEL)}
          </span>
          <div className="font-bold text-emerald-light">
            {receipt.amountIdr === 0 ? "LUNAS" : formatIdrCurrency(receipt.amountIdr)}
          </div>
          {Boolean(receipt.pointsSpent) && (
            <div className="mt-1 text-[11px] text-emerald-light">
              {receipt.pointsSpent?.toLocaleString("id-ID")} poin
              {receipt.originalAmountIdr !== undefined && ` · harga ${formatIdrCurrency(receipt.originalAmountIdr)}`}
            </div>
          )}
        </div>
        <div>
          <span className="text-subtle">Metode:</span>
          <div className="font-bold text-cream truncate">
            {receipt.paymentMethod}
          </div>
        </div>
      </div>
    </IntellioCard>
  );
}

