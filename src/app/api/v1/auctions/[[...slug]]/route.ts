import { createCatchAllHandlers } from "@/server/shared/http/catch-all-router";
import * as root from "@/server/http/v1/auctions/route";
import * as prepare from "@/server/http/v1/auctions/prepare/route";
import * as sweep from "@/server/http/v1/auctions/sweep/route";
import * as byId from "@/server/http/v1/auctions/[id]/route";
import * as managePrepare from "@/server/http/v1/auctions/[id]/manage-prepare/route";
import * as bids from "@/server/http/v1/auctions/[id]/bids/route";
import * as finalize from "@/server/http/v1/auctions/[id]/finalize/route";

export const { GET, POST, PUT, PATCH, DELETE } = createCatchAllHandlers([
  { pattern: "", mod: root },
  { pattern: "prepare", mod: prepare },
  { pattern: "sweep", mod: sweep },
  { pattern: "[id]", mod: byId },
  { pattern: "[id]/manage-prepare", mod: managePrepare },
  { pattern: "[id]/bids", mod: bids },
  { pattern: "[id]/finalize", mod: finalize },
]);
