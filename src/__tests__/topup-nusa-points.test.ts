import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import {
  NUSA_POINT_TOPUP_FEE,
  NUSA_POINT_TOPUP_TIERS,
  getTopupTierByAmount,
  isValidTopupAmount,
} from "@/server/modules/payment/domain/topup-policy";
import { topupRepository } from "@/server/modules/payment/infrastructure/topup.repository.impl";
import {
  getEmbeddedStore,
  persistEmbeddedStore,
} from "@/server/shared/db/embedded-store";
import { getNusaPointBalance } from "@/server/modules/nusa-points/infrastructure/nusa-point.repository.impl";
import { shopRepository } from "@/server/modules/shop/infrastructure/shop.repository.impl";

describe("Nusa Point Top Up Feature", () => {
  const testUserId = "user-test-registered-1";
  const testGuestUserId = "user-test-guest-1";

  beforeEach(() => {
    const store = getEmbeddedStore();
    store.users = [
      {
        id: testUserId,
        email: "warrior@nusantara.id",
        name: "Pendekar Nusantara",
        isGuest: false,
        passwordHash: "hash",
        role: "PLAYER",
        hasClaimedStarterPack: true,
        lastActiveAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        id: testGuestUserId,
        email: "tamu@nusantara.id",
        name: "Tamu Sementara",
        isGuest: true,
        passwordHash: "",
        role: "PLAYER",
        hasClaimedStarterPack: false,
        lastActiveAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    ];
    store.topupOrders = [];
    store.nusaPointTransactions = [];
    store.paymentOrders = [];
    persistEmbeddedStore(store);
  });

  describe("Domain Policy & Segmentation", () => {
    it("should have exactly 9 segmented nominal tiers", () => {
      expect(NUSA_POINT_TOPUP_TIERS).toHaveLength(9);
    });

    it("should have fixed fee of 500 IDR across all tiers", () => {
      expect(NUSA_POINT_TOPUP_FEE).toBe(500);
      for (const tier of NUSA_POINT_TOPUP_TIERS) {
        expect(tier.feeIdr).toBe(500);
        expect(tier.pointsAwarded).toBe(tier.amountIdr - 500);
      }
    });

    it("should calculate exact point rewards as specified", () => {
      const expectedTiers = [
        { amountIdr: 5_000, pointsAwarded: 4_500 },
        { amountIdr: 10_000, pointsAwarded: 9_500 },
        { amountIdr: 15_000, pointsAwarded: 14_500 },
        { amountIdr: 20_000, pointsAwarded: 19_500 },
        { amountIdr: 30_000, pointsAwarded: 29_500 },
        { amountIdr: 50_000, pointsAwarded: 49_500 },
        { amountIdr: 100_000, pointsAwarded: 99_500 },
        { amountIdr: 150_000, pointsAwarded: 149_500 },
        { amountIdr: 200_000, pointsAwarded: 199_500 },
      ];

      for (const expected of expectedTiers) {
        const tier = getTopupTierByAmount(expected.amountIdr);
        expect(tier).toBeDefined();
        expect(tier?.pointsAwarded).toBe(expected.pointsAwarded);
        expect(isValidTopupAmount(expected.amountIdr)).toBe(true);
      }
    });

    it("should reject non-segmented amounts", () => {
      expect(isValidTopupAmount(7000)).toBe(false);
      expect(isValidTopupAmount(25000)).toBe(false);
      expect(isValidTopupAmount(500)).toBe(false);
      expect(getTopupTierByAmount(7000)).toBeUndefined();
    });
  });

  describe("Topup Order Creation & Guest Restriction", () => {
    it("should successfully create top up order for registered user", async () => {
      const order = await topupRepository.createTopupOrder({
        userId: testUserId,
        buyerName: "Pendekar Nusantara",
        buyerEmail: "warrior@nusantara.id",
        amountIdr: 5000,
        paymentMethod: "QRIS",
        paymentChannel: "QRIS",
        paymentMode: "DEV",
      });

      expect(order).toBeDefined();
      expect(order.orderNumber).toMatch(/^NPT-\d{8}-[A-F0-9]+$/);
      expect(order.amountIdr).toBe(5000);
      expect(order.feeIdr).toBe(500);
      expect(order.pointsAwarded).toBe(4500);
      expect(order.paymentStatus).toBe("PENDING");
    });

    it("should reject top up order creation for guest user", async () => {
      await expect(
        topupRepository.createTopupOrder({
          userId: testGuestUserId,
          buyerName: "Tamu Sementara",
          buyerEmail: "tamu@nusantara.id",
          amountIdr: 10000,
          paymentMethod: "QRIS",
          paymentChannel: "QRIS",
          paymentMode: "DEV",
        })
      ).rejects.toThrow("Fitur Top Up Nusa Point hanya tersedia untuk akun terdaftar.");
    });

    it("should reject invalid amount upon order creation", async () => {
      await expect(
        topupRepository.createTopupOrder({
          userId: testUserId,
          buyerName: "Pendekar Nusantara",
          buyerEmail: "warrior@nusantara.id",
          amountIdr: 7777,
          paymentMethod: "QRIS",
          paymentChannel: "QRIS",
          paymentMode: "DEV",
        })
      ).rejects.toThrow("Nominal top up tidak sesuai dengan segmentasi yang tersedia.");
    });
  });

  describe("Payment Settlement & Nusa Point Balance", () => {
    it("should settle paid topup order and credit Nusa Points to user balance", async () => {
      const initialBalance = await getNusaPointBalance(testUserId);
      expect(initialBalance).toBe(0);

      const order = await topupRepository.createTopupOrder({
        userId: testUserId,
        buyerName: "Pendekar Nusantara",
        buyerEmail: "warrior@nusantara.id",
        amountIdr: 10000,
        paymentMethod: "QRIS",
        paymentChannel: "QRIS",
        paymentMode: "DEV",
      });

      const result = await topupRepository.settleTopupOrder({
        referenceCode: order.orderNumber,
        amountIdr: 10000,
        paymentMode: "DEV",
        status: "PAID",
      });

      expect(result).toBe("updated");

      // Balance should be exactly 9500 (10.000 - fee 500)
      const newBalance = await getNusaPointBalance(testUserId);
      expect(newBalance).toBe(9500);

      // Verify transaction ledger
      const store = getEmbeddedStore();
      const tx = store.nusaPointTransactions.find((entry) => entry.sourceId === order.id);
      expect(tx).toBeDefined();
      expect(tx?.source).toBe("TOPUP");
      expect(tx?.amount).toBe(9500);
    });

    it("should prevent duplicate settlement and balance inflation", async () => {
      const order = await topupRepository.createTopupOrder({
        userId: testUserId,
        buyerName: "Pendekar Nusantara",
        buyerEmail: "warrior@nusantara.id",
        amountIdr: 5000,
        paymentMethod: "QRIS",
        paymentChannel: "QRIS",
        paymentMode: "DEV",
      });

      const firstSettle = await topupRepository.settleTopupOrder({
        referenceCode: order.orderNumber,
        amountIdr: 5000,
        paymentMode: "DEV",
        status: "PAID",
      });
      expect(firstSettle).toBe("updated");

      const secondSettle = await topupRepository.settleTopupOrder({
        referenceCode: order.orderNumber,
        amountIdr: 5000,
        paymentMode: "DEV",
        status: "PAID",
      });
      expect(secondSettle).toBe("duplicate");

      // Balance should remain 4500, not 9000
      const balance = await getNusaPointBalance(testUserId);
      expect(balance).toBe(4500);
    });

    it("should reject settlement if callback amount does not match", async () => {
      const order = await topupRepository.createTopupOrder({
        userId: testUserId,
        buyerName: "Pendekar Nusantara",
        buyerEmail: "warrior@nusantara.id",
        amountIdr: 15000,
        paymentMethod: "QRIS",
        paymentChannel: "QRIS",
        paymentMode: "DEV",
      });

      const result = await topupRepository.settleTopupOrder({
        referenceCode: order.orderNumber,
        amountIdr: 10000, // Mismatch
        paymentMode: "DEV",
        status: "PAID",
      });
      expect(result).toBe("amount_mismatch");
    });
  });

  describe("Transaction History Integration", () => {
    it("should return topup orders alongside shop orders in transaction history", async () => {
      // 1. Create a topup order
      const topup = await topupRepository.createTopupOrder({
        userId: testUserId,
        buyerName: "Pendekar Nusantara",
        buyerEmail: "warrior@nusantara.id",
        amountIdr: 20000,
        paymentMethod: "QRIS",
        paymentChannel: "QRIS",
        paymentMode: "DEV",
      });

      // 2. Query transaction orders through shopRepository.listTransactionOrders
      const history = await shopRepository.listTransactionOrders(testUserId, {
        page: 1,
        pageSize: 10,
        search: "",
      });

      expect(history.total).toBe(1);
      expect(history.orders).toHaveLength(1);
      expect(history.orders[0].orderNumber).toBe(topup.orderNumber);
      expect(history.orders[0].starterPackCode).toBe("TOPUP_NUSA_POINT");
      expect(history.orders[0].starterPackName).toBe("Top Up 19.500 Nusa Point");
      expect(history.orders[0].amountIdr).toBe(20000);
    });
  });
});
