import "server-only";
import type { PaymentMode } from "./payment.repository";
import type { StoredTopupOrderRecord } from "@/server/shared/db/embedded-store";

export interface CreateTopupOrderInput {
  userId: string;
  buyerName: string;
  buyerEmail: string;
  amountIdr: number;
  paymentMethod: "QRIS" | "VIRTUAL_ACCOUNT";
  paymentChannel: string;
  paymentMode: PaymentMode;
}

export interface TopupRepository {
  createTopupOrder(input: CreateTopupOrderInput): Promise<StoredTopupOrderRecord>;
  attachGatewayPayment(input: {
    orderId: string;
    gatewayReference: string | null;
    paymentUrl: string | null;
    paymentInstructions: Record<string, unknown> | null;
    expiresAt: string | null;
  }): Promise<StoredTopupOrderRecord>;
  failPendingOrder(orderId: string): Promise<void>;
  getOrderById(orderId: string, userId?: string): Promise<StoredTopupOrderRecord | null>;
  settleTopupOrder(input: {
    referenceCode: string;
    amountIdr: number | null;
    paymentMode: PaymentMode;
    status: "PAID" | "FAILED" | "EXPIRED";
  }): Promise<"updated" | "duplicate" | "not_found" | "amount_mismatch">;
  listUserTopupOrders(userId: string): Promise<StoredTopupOrderRecord[]>;
}

