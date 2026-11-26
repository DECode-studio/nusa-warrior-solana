import { createCatchAllHandlers } from "@/server/shared/http/catch-all-router";
import * as assets from "@/server/http/v1/admin/assets/route";
import * as cardLedgerAudit from "@/server/http/v1/admin/card-ledger/audit/route";
import * as cards from "@/server/http/v1/admin/cards/route";
import * as customCards from "@/server/http/v1/admin/custom-cards/route";
import * as customCardById from "@/server/http/v1/admin/custom-cards/[id]/route";
import * as paymentGateway from "@/server/http/v1/admin/payment-gateway/route";
import * as reports from "@/server/http/v1/admin/reports/route";
import * as solanaMintRare from "@/server/http/v1/admin/solana/mint-rare/route";
import * as solanaRpc from "@/server/http/v1/admin/solana/rpc/route";
import * as storyMode from "@/server/http/v1/admin/story-mode/route";
import * as storyModeAssets from "@/server/http/v1/admin/story-mode/assets/route";
import * as team from "@/server/http/v1/admin/team/route";
import * as teamById from "@/server/http/v1/admin/team/[id]/route";
import * as teamUpload from "@/server/http/v1/admin/team/upload/route";
import * as users from "@/server/http/v1/admin/users/route";
import * as userById from "@/server/http/v1/admin/users/[userId]/route";

export const { GET, POST, PUT, PATCH, DELETE } = createCatchAllHandlers([
  { pattern: "assets", mod: assets },
  { pattern: "card-ledger/audit", mod: cardLedgerAudit },
  { pattern: "cards", mod: cards },
  { pattern: "custom-cards", mod: customCards },
  { pattern: "custom-cards/[id]", mod: customCardById },
  { pattern: "payment-gateway", mod: paymentGateway },
  { pattern: "reports", mod: reports },
  { pattern: "solana/mint-rare", mod: solanaMintRare },
  { pattern: "solana/rpc", mod: solanaRpc },
  { pattern: "story-mode", mod: storyMode },
  { pattern: "story-mode/assets", mod: storyModeAssets },
  { pattern: "team", mod: team },
  { pattern: "team/upload", mod: teamUpload },
  { pattern: "team/[id]", mod: teamById },
  { pattern: "users", mod: users },
  { pattern: "users/[userId]", mod: userById },
]);
