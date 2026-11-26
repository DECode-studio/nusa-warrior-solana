import { createCatchAllHandlers } from "@/server/shared/http/catch-all-router";
import * as checkout from "@/server/http/v1/shop/checkout/route";
import * as checkoutPrepare from "@/server/http/v1/shop/checkout/prepare/route";
import * as claimStarter from "@/server/http/v1/shop/claim-starter/route";
import * as claimStarterPrepare from "@/server/http/v1/shop/claim-starter/prepare/route";
import * as decks from "@/server/http/v1/shop/decks/route";
import * as orderById from "@/server/http/v1/shop/orders/[orderId]/route";
import * as paymentMethods from "@/server/http/v1/shop/payment-methods/route";
import * as menuKitaCallback from "@/server/http/v1/shop/payments/menu-kita/callback/route";
import * as topupCheckout from "@/server/http/v1/shop/topup/checkout/route";
import * as topupOrderById from "@/server/http/v1/shop/topup/orders/[orderId]/route";
import * as topupTiers from "@/server/http/v1/shop/topup/tiers/route";
import * as transactions from "@/server/http/v1/shop/transactions/route";

export const { GET, POST, PUT, PATCH, DELETE } = createCatchAllHandlers([
  { pattern: "checkout", mod: checkout },
  { pattern: "checkout/prepare", mod: checkoutPrepare },
  { pattern: "claim-starter", mod: claimStarter },
  { pattern: "claim-starter/prepare", mod: claimStarterPrepare },
  { pattern: "decks", mod: decks },
  { pattern: "orders/[orderId]", mod: orderById },
  { pattern: "payment-methods", mod: paymentMethods },
  { pattern: "payments/menu-kita/callback", mod: menuKitaCallback },
  { pattern: "topup/checkout", mod: topupCheckout },
  { pattern: "topup/orders/[orderId]", mod: topupOrderById },
  { pattern: "topup/tiers", mod: topupTiers },
  { pattern: "transactions", mod: transactions },
]);
