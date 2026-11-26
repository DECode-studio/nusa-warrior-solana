import "server-only";
import {
  getCatalogCardBySlug,
  type KingdomValue,
} from "@/core/constants/cards-catalog";
import { isCardHighEnd } from "@/core/constants/pack-tiers";
import type {
  StoredPaymentOrderRecord,
  StoredStarterPackRecord,
} from "@/server/shared/db/embedded-store";
import type { CreatePaymentOrderInput } from "../domain/shop.repository";
import { shopRepository } from "../infrastructure/shop.repository.impl";
import { resolvePaymentModeForUserUseCase } from "@/server/modules/payment/application/payment.usecase";
import { settleTopupPaymentUseCase } from "@/server/modules/payment/application/topup.usecase";
import {
  createGatewayPayment,
  getGatewayPaymentChannels,
} from "@/server/modules/payment/infrastructure/menu-kita-payment-gateway";
import type { PaymentMode } from "@/server/modules/payment/domain/payment.repository";
import { AppError } from "@/server/shared/errors/app-error";
import { isPrismaDriverEnabled, prisma } from "@/server/shared/db/prisma";
import {
  buildBurnNusaTransaction,
  getWalletTokenBalances,
  verifyNusaBurnTransaction,
} from "@/server/modules/solana/nusa-token.service";
import { getUnclaimedNusaBalance } from "@/server/modules/nusa-points/infrastructure/nusa-point.repository.impl";

export interface DrawnCardSummaryDto {
  slug: string;
  name: string;
  cardType: "CHARACTER" | "INSTRUMENT";
  kingdom: KingdomValue;
  isHighEnd: boolean;
  imagePath: string;
  baseAttack?: number;
  baseDefense?: number;
  effectName?: string | null;
}

export interface PaymentOrderWithCardsDto extends StoredPaymentOrderRecord {
  drawnCards?: DrawnCardSummaryDto[];
}

export interface ShopCatalogDto {
  packs: StoredStarterPackRecord[];
  recentOrders: PaymentOrderWithCardsDto[];
  hasClaimedStarterPack: boolean;
  nusaPointBalance: number;
  unclaimedNusa: number;
}

function enrichOrderWithCards(
  order: StoredPaymentOrderRecord
): PaymentOrderWithCardsDto {
  const slugs = order.paymentStatus === "PAID" ? order.drawnCardSlugs ?? [] : [];
  const drawnCards: DrawnCardSummaryDto[] = slugs.flatMap((slug) => {
    const card = getCatalogCardBySlug(slug);
    if (!card) return [];
    return [
      {
        slug: card.slug,
        name: card.name,
        cardType: card.cardType,
        kingdom: card.kingdom,
        isHighEnd: isCardHighEnd(card.slug),
        imagePath: card.imagePath,
        baseAttack: card.baseAttack,
        baseDefense: card.baseDefense,
        effectName: card.effectName,
      },
    ];
  });

  return {
    ...order,
    drawnCardSlugs: slugs,
    drawnCards,
  };
}

async function resolveUserWalletAddress(userId: string): Promise<string | null> {
  if (!isPrismaDriverEnabled()) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { walletAddress: true },
  });
  return user?.walletAddress ?? null;
}

export async function getShopCatalogUseCase(
  userId?: string
): Promise<ShopCatalogDto> {
  const hasClaimed = userId
    ? await shopRepository.hasUserClaimedStarter(userId)
    : false;
  const walletAddress = userId ? await resolveUserWalletAddress(userId) : null;
  const [packs, rawOrders, tokenBalances, unclaimedNusa] = await Promise.all([
    shopRepository.listStarterPacks(userId),
    shopRepository.listOrders(userId),
    walletAddress
      ? getWalletTokenBalances(walletAddress).catch(() => null)
      : Promise.resolve(null),
    userId ? getUnclaimedNusaBalance(userId) : Promise.resolve(0),
  ]);
  const recentOrders = rawOrders.map(enrichOrderWithCards);
  return {
    packs,
    recentOrders,
    hasClaimedStarterPack: hasClaimed,
    nusaPointBalance: tokenBalances ? tokenBalances.nusa : 0,
    unclaimedNusa,
  };
}

export async function getShopTransactionHistoryUseCase(
  userId: string,
  options: { page: number; pageSize: number; search: string }
): Promise<{
  items: PaymentOrderWithCardsDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}> {
  const { orders, total } = await shopRepository.listTransactionOrders(userId, options);
  const totalPages = Math.max(1, Math.ceil(total / options.pageSize));
  return {
    items: orders.map(enrichOrderWithCards),
    page: Math.min(options.page, totalPages),
    pageSize: options.pageSize,
    total,
    totalPages,
  };
}

export async function claimFreeStarterPackUseCase(
  userId: string
): Promise<PaymentOrderWithCardsDto> {
  const order = await shopRepository.claimFreeStarterPack(userId);
  return enrichOrderWithCards(order);
}

export async function getShopPaymentChannelsUseCase(userId: string) {
  const mode = await resolvePaymentModeForUserUseCase(userId);
  const channels = await getGatewayPaymentChannels(mode);
  return { mode, channels };
}

export async function prepareShopNusaCheckoutUseCase(input: {
  userId: string;
  starterPackCode: string;
}) {
  if (!input.userId) throw AppError.unauthorized();
  const packs = await shopRepository.listStarterPacks(input.userId);
  const pack = packs.find((item) => item.code === input.starterPackCode);
  if (!pack) {
    throw AppError.notFound(`Paket '${input.starterPackCode}' tidak ditemukan.`);
  }
  if (pack.priceIdr < 1) {
    throw AppError.badRequest(
      "Klaim Starter Pack gratis melalui tombol klaim awal."
    );
  }

  const walletAddress = await resolveUserWalletAddress(input.userId);
  if (!walletAddress) {
    throw AppError.badRequest(
      "Hubungkan dompet Solana terlebih dahulu untuk membeli paket menggunakan Nusa Token (NUSA)."
    );
  }

  const balances = await getWalletTokenBalances(walletAddress);
  if (balances.nusa < pack.priceIdr) {
    throw AppError.badRequest(
      `Saldo Nusa Token tidak mencukupi (${balances.nusa.toLocaleString("id-ID")} NUSA). Butuh ${pack.priceIdr.toLocaleString("id-ID")} NUSA.`
    );
  }

  const burnTx = await buildBurnNusaTransaction({
    ownerWallet: walletAddress,
    uiAmount: pack.priceIdr,
  });

  return {
    starterPackCode: pack.code,
    starterPackName: pack.nameId,
    amountNusa: pack.priceIdr,
    walletAddress,
    ...burnTx,
  };
}

export async function confirmShopNusaCheckoutUseCase(input: {
  userId: string;
  starterPackCode: string;
  txSignature: string;
  buyerName?: string;
  buyerEmail?: string;
}): Promise<PaymentOrderWithCardsDto> {
  if (!input.userId) throw AppError.unauthorized();
  const packs = await shopRepository.listStarterPacks(input.userId);
  const pack = packs.find((item) => item.code === input.starterPackCode);
  if (!pack) {
    throw AppError.notFound(`Paket '${input.starterPackCode}' tidak ditemukan.`);
  }
  if (pack.priceIdr < 1) {
    throw AppError.badRequest(
      "Klaim Starter Pack gratis melalui tombol klaim awal."
    );
  }

  const walletAddress = await resolveUserWalletAddress(input.userId);
  if (!walletAddress) {
    throw AppError.badRequest("Dompet Solana belum terhubung.");
  }

  await verifyNusaBurnTransaction({
    txSignature: input.txSignature,
    expectedOwnerWallet: walletAddress,
    minUiAmount: pack.priceIdr,
  });

  const order = await shopRepository.createNusaBurnOrder({
    userId: input.userId,
    buyerName: input.buyerName?.trim() || "Solana Warrior",
    buyerEmail: input.buyerEmail?.trim() || "warrior@nusawarrior.id",
    starterPackCode: pack.code,
    amountNusa: pack.priceIdr,
    txSignature: input.txSignature,
  });

  return enrichOrderWithCards(order);
}

export async function checkoutPaymentOrderUseCase(
  input: Omit<CreatePaymentOrderInput, "paymentMode">
): Promise<PaymentOrderWithCardsDto> {
  if (!input.userId) throw AppError.unauthorized();
  const packs = await shopRepository.listStarterPacks(input.userId);
  const pack = packs.find((item) => item.code === input.starterPackCode);
  if (!pack) throw AppError.notFound(`Paket '${input.starterPackCode}' tidak ditemukan.`);
  if (pack.priceIdr < 1) throw AppError.badRequest("Klaim Starter Pack gratis melalui tombol klaim awal.");
  const pointsToUse = input.pointsToUse ?? 0;
  if (!Number.isSafeInteger(pointsToUse) || pointsToUse < 0) throw AppError.badRequest("Jumlah Nusa Point tidak valid.");
  const isBooster = pack.packType === "BOOSTER" || pack.code.includes("BOOSTER");
  const isStarter = pack.isStarter || pack.code.includes("STARTER");
  const maxPoints = isBooster ? Math.floor(pack.priceIdr * 0.6) : isStarter ? pack.priceIdr : 0;
  if (pointsToUse > maxPoints) throw AppError.badRequest("Penggunaan poin melebihi batas diskon paket.");
  if (pointsToUse > await shopRepository.getPointBalance(input.userId)) {
    throw AppError.badRequest("Saldo Nusa Point tidak mencukupi.");
  }
  const amountIdr = pack.priceIdr - pointsToUse;
  const mode = amountIdr > 0 ? await resolvePaymentModeForUserUseCase(input.userId) : "DEV";
  if (amountIdr > 0) {
    if (!input.paymentMethod || !input.paymentChannel) throw AppError.badRequest("Metode pembayaran diperlukan untuk sisa tagihan.");
    const channels = await getGatewayPaymentChannels(mode);
    if (!channels.some((channel) => channel.paymentMethod === input.paymentMethod && channel.code === input.paymentChannel)) {
      throw AppError.badRequest("Kanal pembayaran tidak tersedia untuk metode yang dipilih.");
    }
  }
  const order = await shopRepository.createPaymentOrder({ ...input, pointsToUse, paymentMode: mode });
  if (order.amountIdr === 0) return enrichOrderWithCards(order);
  try {
    const gatewayPayment = await createGatewayPayment({
      mode,
      referenceCode: order.orderNumber,
      amountIdr: order.amountIdr,
      productName: order.starterPackName,
      buyerName: order.buyerName,
      buyerEmail: order.buyerEmail,
      paymentMethod: input.paymentMethod!,
      paymentChannel: input.paymentChannel!,
    });
    const updated = await shopRepository.attachGatewayPayment({
      orderId: order.id,
      ...gatewayPayment,
    });
    return enrichOrderWithCards(updated);
  } catch (error: unknown) {
    await shopRepository.failPendingOrder(order.id);
    throw error;
  }
}

export async function getShopOrderUseCase(orderId: string, userId: string) {
  const order = await shopRepository.getOrderById(orderId, userId);
  return enrichOrderWithCards(order);
}

export async function handleMenuKitaPaymentCallbackUseCase(input: {
  mode: PaymentMode;
  payload: Record<string, unknown>;
}) {
  const referenceValue = input.payload.reference_id ?? input.payload.referenceId;
  const referenceCode = typeof referenceValue === "string" ? referenceValue.trim() : "";
  if (!referenceCode) throw AppError.badRequest("Callback tidak memiliki referensi order.");

  const statusCode = Number(input.payload.status_code);
  const transactionStatusCode = Number(input.payload.transaction_status_code);
  const statusText = String(input.payload.status ?? "").toLowerCase();
  const status = statusCode === 1 || transactionStatusCode === 1 || transactionStatusCode === 6 || statusText === "berhasil" || statusText === "success"
    ? "PAID"
    : statusCode === -2 || transactionStatusCode === -2 || statusText === "expired"
      ? "EXPIRED"
      : statusCode === 0 || statusText === "pending"
        ? null
        : ["failed", "gagal", "cancelled", "canceled"].includes(statusText)
          ? "FAILED"
          : null;
  if (status === null && statusCode !== 0 && statusText !== "pending") {
    throw AppError.badRequest("Status callback pembayaran tidak dikenali.");
  }
  if (!status) return { accepted: true, duplicate: false, status: "PENDING" };

  const amountValue = input.payload.sub_total ?? input.payload.amount ?? input.payload.total;
  const amountIdr = amountValue === undefined || amountValue === null
    ? null
    : Number(amountValue);
  if (status === "PAID" && amountIdr === null) {
    throw AppError.badRequest("Callback pembayaran tidak memiliki nominal transaksi.");
  }
  if (amountIdr !== null && (!Number.isInteger(amountIdr) || amountIdr < 0)) {
    throw AppError.badRequest("Nominal callback tidak valid.");
  }

  const result = referenceCode.startsWith("NPT-")
    ? await settleTopupPaymentUseCase({
        referenceCode,
        amountIdr,
        paymentMode: input.mode,
        status,
      })
    : await shopRepository.settleGatewayOrder({
        referenceCode,
        amountIdr,
        paymentMode: input.mode,
        status,
      });
  if (result === "amount_mismatch") throw AppError.badRequest("Nominal callback tidak sesuai dengan order.");
  if (result === "not_found") throw AppError.notFound("Order callback tidak ditemukan.");
  return { accepted: true, duplicate: result === "duplicate", status };
}
