import "server-only";
import { AppError } from "@/server/shared/errors/app-error";
import {
  NUSA_POINT_TOPUP_FEE,
  NUSA_POINT_TOPUP_TIERS,
  getTopupTierByAmount,
} from "../domain/topup-policy";
import type { PaymentMode } from "../domain/payment.repository";
import { resolvePaymentModeForUserUseCase } from "./payment.usecase";
import {
  createGatewayPayment,
  getGatewayPaymentChannels,
} from "../infrastructure/menu-kita-payment-gateway";
import { topupRepository } from "../infrastructure/topup.repository.impl";

export interface CheckoutTopupInput {
  userId: string;
  buyerName: string;
  buyerEmail: string;
  amountIdr: number;
  paymentMethod: "QRIS" | "VIRTUAL_ACCOUNT";
  paymentChannel: string;
}

export function getTopupTiersUseCase() {
  return {
    feeIdr: NUSA_POINT_TOPUP_FEE,
    tiers: NUSA_POINT_TOPUP_TIERS,
  };
}

export async function checkoutTopupOrderUseCase(input: CheckoutTopupInput) {
  if (!input.userId) throw AppError.unauthorized();

  const tier = getTopupTierByAmount(input.amountIdr);
  if (!tier) {
    throw AppError.badRequest("Nominal top up tidak sesuai dengan segmentasi yang tersedia.");
  }

  const mode = await resolvePaymentModeForUserUseCase(input.userId);
  const channels = await getGatewayPaymentChannels(mode);
  const validChannel = channels.some(
    (c) => c.paymentMethod === input.paymentMethod && c.code === input.paymentChannel
  );
  if (!validChannel) {
    throw AppError.badRequest("Kanal pembayaran tidak tersedia untuk metode yang dipilih.");
  }

  const order = await topupRepository.createTopupOrder({
    ...input,
    paymentMode: mode,
  });

  try {
    const gatewayPayment = await createGatewayPayment({
      mode,
      referenceCode: order.orderNumber,
      amountIdr: order.amountIdr,
      productName: `Top Up ${order.pointsAwarded.toLocaleString("id-ID")} Nusa Point`,
      buyerName: order.buyerName,
      buyerEmail: order.buyerEmail,
      paymentMethod: input.paymentMethod,
      paymentChannel: input.paymentChannel,
    });

    const updated = await topupRepository.attachGatewayPayment({
      orderId: order.id,
      ...gatewayPayment,
    });
    return updated;
  } catch (error: unknown) {
    await topupRepository.failPendingOrder(order.id);
    throw error;
  }
}

export async function getTopupOrderUseCase(orderId: string, userId: string) {
  const order = await topupRepository.getOrderById(orderId, userId);
  if (!order) throw AppError.notFound("Order top up tidak ditemukan.");
  return order;
}

export async function settleTopupPaymentUseCase(input: {
  referenceCode: string;
  amountIdr: number | null;
  paymentMode: PaymentMode;
  status: "PAID" | "FAILED" | "EXPIRED";
}) {
  return topupRepository.settleTopupOrder(input);
}

