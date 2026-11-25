"use client";

import React from "react";
import type { PaymentOrderEntity } from "@/client/domain/shop/entity/shop_entity";
import { useTranslator } from "@/core/translator";
import { formatIdrCurrency } from "@/core/utils/formatters";
import { Badge, BaseModal, Button } from "@/client/presentation/components/ui";
import { TRANSACTION_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { TRANSACTION_TEXT } from "../constants/TextConstant";

function statusVariant(status: PaymentOrderEntity["paymentStatus"]): "emerald" | "amber" | "danger" | "neutral" {
  if (status === "PAID") return "emerald";
  if (status === "PENDING") return "amber";
  if (status === "FAILED") return "danger";
  return "neutral";
}

function statusText(status: PaymentOrderEntity["paymentStatus"]): string {
  return `shop.transactionStatus.${status.toLowerCase()}`;
}

export interface TransactionDetailModalProps {
  readonly transaction: PaymentOrderEntity | null;
  readonly onClose: () => void;
}

export function TransactionDetailModal({ transaction, onClose }: TransactionDetailModalProps): React.ReactElement {
  const { t, locale } = useTranslator();
  const formatDate = (value: string): string =>
    new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  const instructions = transaction?.paymentInstructions ?? {};
  const paymentUrlValue = transaction?.paymentUrl
    ?? instructions.PaymentUrl
    ?? instructions.paymentUrl
    ?? instructions.Url
    ?? instructions.url
    ?? instructions.payment_url;
  const paymentUrl = typeof paymentUrlValue === "string"
    && /^https:\/\//i.test(paymentUrlValue)
    ? paymentUrlValue
    : null;
  const paymentNumber = ["PaymentNo", "payment_no", "va", "codeTransaction"]
    .map((key) => instructions[key])
    .find((value) => typeof value === "string" && value.trim());
  const paymentName = ["PaymentName", "payment_name"]
    .map((key) => instructions[key])
    .find((value) => typeof value === "string" && value.trim());
  const field = (label: string, value: React.ReactNode): React.ReactElement => (
    <div className="flex flex-col gap-1 border-b border-border-base py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs text-subtle">{label}</span>
      <span className="break-all text-sm font-semibold text-cream sm:text-right">{value}</span>
    </div>
  );

  const isTopup = transaction?.orderType === "TOPUP" || transaction?.starterPackCode === "TOPUP_NUSA_POINT";

  return (
    <BaseModal
      id={TRANSACTION_SEMANTIC_IDS.DETAIL_MODAL}
      isOpen={transaction !== null}
      onClose={onClose}
      title={t(TRANSACTION_TEXT.DETAILS)}
      size="lg"
      ariaLabel={t(TRANSACTION_TEXT.DETAILS)}
    >
      {transaction && (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-muted">{transaction.orderNumber}</span>
              {isTopup && <Badge variant="amber" size="sm">TOP UP</Badge>}
            </div>
            <Badge variant={statusVariant(transaction.paymentStatus)}>{t(statusText(transaction.paymentStatus))}</Badge>
          </div>
          {field(isTopup ? "Item Transaksi" : t(TRANSACTION_TEXT.PACK), transaction.starterPackName || transaction.starterPackCode)}
          {isTopup && field("Biaya Admin", formatIdrCurrency(500))}
          {isTopup && field("Nusa Point Didapat", `${Math.max(0, transaction.amountIdr - 500).toLocaleString("id-ID")} NP`)}
          {field(t(TRANSACTION_TEXT.AMOUNT), transaction.amountIdr === 0
            ? transaction.paymentProvider === "NUSA_POINTS" ? "Lunas dengan Nusa Point" : "GRATIS"
            : formatIdrCurrency(transaction.amountIdr))}
          {Boolean(transaction.pointsSpent) && field("Nusa Point", `${transaction.pointsSpent?.toLocaleString("id-ID")} poin`)}
          {Boolean(transaction.pointsSpent) && transaction.originalAmountIdr !== undefined &&
            field("Harga sebelum poin", formatIdrCurrency(transaction.originalAmountIdr))}
          {field(t(TRANSACTION_TEXT.PAYMENT_METHOD), transaction.paymentMethod)}
          {field(t(TRANSACTION_TEXT.BUYER), `${transaction.buyerName} · ${transaction.buyerEmail}`)}
          {field(t(TRANSACTION_TEXT.CREATED_AT), formatDate(transaction.createdAt))}
          {transaction.paidAt && field(t(TRANSACTION_TEXT.PAID_AT), formatDate(transaction.paidAt))}
          {transaction.gatewayReference && field(t(TRANSACTION_TEXT.PAYMENT_REFERENCE), transaction.gatewayReference)}
          {transaction.paymentStatus === "PENDING" && (
            <div className="mt-5 space-y-3 rounded-xl border border-amber/20 bg-amber/10 p-4">
              {typeof paymentName === "string" && (
                <p className="text-sm font-semibold text-cream">{paymentName}</p>
              )}
              {typeof paymentNumber === "string" && (
                <div>
                  <span className="block text-xs text-subtle">{t(TRANSACTION_TEXT.PAYMENT_NUMBER)}</span>
                  <code className="break-all font-mono text-base text-cream">{paymentNumber}</code>
                </div>
              )}
              {paymentUrl && (
                <Button
                  href={paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="primary"
                  size="md"
                >
                  {t(TRANSACTION_TEXT.CONTINUE_PAYMENT)}
                </Button>
              )}
            </div>
          )}
          {transaction.drawnCards && transaction.drawnCards.length > 0 ? (
            <div className="pt-4">
              <h4 className="mb-3 font-display text-sm font-bold text-cream">{t(TRANSACTION_TEXT.DRAWN_CARDS)}</h4>
              <ul className="grid gap-2 sm:grid-cols-2">
                {transaction.drawnCards.map((card) => (
                  <li key={card.slug} className="rounded-xl border border-border-base bg-surface-elevated/40 p-3">
                    <span className="block text-sm font-semibold text-cream">{card.name}</span>
                    <span className="mt-1 block text-xs text-subtle">{card.cardType} · {card.kingdom}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : transaction.paymentStatus === "PAID" ? (
            <p className="pt-4 text-sm text-subtle">{t(TRANSACTION_TEXT.NO_CARDS)}</p>
          ) : null}
          <div className="mt-5 flex justify-end">
            <Button variant="secondary" onClick={onClose}>{t(TRANSACTION_TEXT.CLOSE)}</Button>
          </div>
        </div>
      )}
    </BaseModal>
  );
}
