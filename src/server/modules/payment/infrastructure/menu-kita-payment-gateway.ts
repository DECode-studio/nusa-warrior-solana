import "server-only";
import type { PaymentMode } from "../domain/payment.repository";
import { AppError } from "@/server/shared/errors/app-error";

export interface PaymentChannelOption {
  code: string;
  name: string;
  paymentMethod: "QRIS" | "VIRTUAL_ACCOUNT";
}

export interface CreatedGatewayPayment {
  gatewayReference: string | null;
  paymentUrl: string | null;
  paymentInstructions: Record<string, unknown> | null;
  expiresAt: string | null;
}

interface BridgeResponse {
  Status?: number;
  Success?: boolean;
  Message?: string;
  Data?: unknown;
  data?: unknown;
}

function getBridgeConfig(): { baseUrl: string; apiKey: string } {
  const baseUrl = process.env.MENU_KITA_PAYMENT_BRIDGE_URL?.trim().replace(/\/+$/, "");
  const apiKey = process.env.NUSA_WARRIOR_PAYMENT_BRIDGE_KEY?.trim();
  if (!baseUrl || !apiKey) {
    throw AppError.internal("Konfigurasi payment bridge Menu Kita belum lengkap.");
  }
  return { baseUrl, apiKey };
}

async function callBridge<T>(path: string, mode: PaymentMode, body?: Record<string, unknown>): Promise<T> {
  const { baseUrl, apiKey } = getBridgeConfig();
  const url = new URL(path, `${baseUrl}/`);
  url.searchParams.set("mode", mode.toLowerCase());
  let response: Response;
  try {
    response = await fetch(url, {
      method: body ? "POST" : "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Nusa-Warrior-Bridge-Key": apiKey,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw AppError.internal("Menu Kita payment gateway tidak dapat dihubungi.");
  }

  const payload = (await response.json().catch(() => null)) as BridgeResponse | null;
  if (!response.ok || payload?.Success === false) {
    throw AppError.internal("Menu Kita gagal membuat pembayaran. Coba lagi beberapa saat.");
  }
  return (payload?.Data ?? payload?.data ?? payload) as T;
}

export async function getGatewayPaymentChannels(mode: PaymentMode): Promise<PaymentChannelOption[]> {
  const data = await callBridge<{
    qris?: boolean;
    qrisChannel?: string | null;
    virtualAccountChannels?: PaymentChannelOption[];
  }>("api/external/nusa-warrior/payment-methods", mode);
  const channels = Array.isArray(data.virtualAccountChannels)
    ? data.virtualAccountChannels
        .filter((item) => item.code && item.name)
        .map((item) => ({ ...item, paymentMethod: "VIRTUAL_ACCOUNT" as const }))
    : [];
  return [
    ...(data.qris && data.qrisChannel ? [{ code: data.qrisChannel, name: "QRIS", paymentMethod: "QRIS" as const }] : []),
    ...channels,
  ];
}

export async function createGatewayPayment(input: {
  mode: PaymentMode;
  referenceCode: string;
  amountIdr: number;
  productName: string;
  buyerName: string;
  buyerEmail: string;
  paymentMethod: "QRIS" | "VIRTUAL_ACCOUNT";
  paymentChannel: string;
}): Promise<CreatedGatewayPayment> {
  const response = await callBridge<BridgeResponse>(
    "api/external/nusa-warrior/payment/create",
    input.mode,
    {
      referenceCode: input.referenceCode,
      amount: input.amountIdr,
      productName: input.productName,
      buyerName: input.buyerName,
      buyerEmail: input.buyerEmail,
      paymentMethod: input.paymentMethod === "QRIS" ? "qris" : "va",
      paymentChannel: input.paymentChannel,
    },
  );

  const root = response && typeof response === "object" ? response : {};
  const candidate = "Data" in root && root.Data && typeof root.Data === "object"
    ? root.Data as Record<string, unknown>
    : root as Record<string, unknown>;
  const reference = candidate.ReferenceId ?? candidate.TransactionId ?? candidate.PaymentNo;
  const paymentUrl = candidate.PaymentUrl ?? candidate.Url;
  const expires = candidate.Expired ?? candidate.expiresAt;
  return {
    gatewayReference: typeof reference === "string" ? reference : null,
    paymentUrl: typeof paymentUrl === "string" ? paymentUrl : null,
    paymentInstructions: candidate,
    expiresAt: typeof expires === "string" && !Number.isNaN(Date.parse(expires))
      ? new Date(expires).toISOString()
      : null,
  };
}
