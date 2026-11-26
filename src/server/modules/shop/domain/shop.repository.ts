import "server-only";
import type {
  StoredPaymentOrderRecord,
  StoredStarterPackRecord,
} from "@/server/shared/db/embedded-store";
import type { PaymentMode } from "@/server/modules/payment/domain/payment.repository";

export interface CreatePaymentOrderInput {
  userId: string | null;
  buyerName: string;
  buyerEmail: string;
  starterPackCode: string;
  paymentMethod?: "QRIS" | "VIRTUAL_ACCOUNT";
  paymentChannel?: string;
  paymentMode: PaymentMode;
  pointsToUse: number;
}

export interface ShopRepository {
  listStarterPacks(userId?: string): Promise<StoredStarterPackRecord[]>;
  listOrders(userId?: string, limit?: number): Promise<StoredPaymentOrderRecord[]>;
  listTransactionOrders(
    userId: string,
    options: { page: number; pageSize: number; search: string }
  ): Promise<{ orders: StoredPaymentOrderRecord[]; total: number }>;
  hasUserClaimedStarter(userId: string): Promise<boolean>;
  getPointBalance(userId: string): Promise<number>;
  claimFreeStarterPack(userId: string): Promise<StoredPaymentOrderRecord>;
  createPaymentOrder(
    input: CreatePaymentOrderInput
  ): Promise<StoredPaymentOrderRecord>;
  createNusaBurnOrder(input: {
    userId: string;
    buyerName: string;
    buyerEmail: string;
    starterPackCode: string;
    amountNusa: number;
    txSignature: string;
  }): Promise<StoredPaymentOrderRecord>;
  attachGatewayPayment(input: {
    orderId: string;
    gatewayReference: string | null;
    paymentUrl: string | null;
    paymentInstructions: Record<string, unknown> | null;
    expiresAt: string | null;
  }): Promise<StoredPaymentOrderRecord>;
  failPendingOrder(orderId: string): Promise<void>;
  getOrderById(orderId: string, userId: string): Promise<StoredPaymentOrderRecord>;
  settleGatewayOrder(input: {
    referenceCode: string;
    amountIdr: number | null;
    paymentMode: PaymentMode;
    status: "PAID" | "FAILED" | "EXPIRED";
  }): Promise<"updated" | "duplicate" | "not_found" | "amount_mismatch">;
}

