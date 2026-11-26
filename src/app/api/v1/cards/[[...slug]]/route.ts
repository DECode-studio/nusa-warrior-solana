import { createCatchAllHandlers } from "@/server/shared/http/catch-all-router";
import * as root from "@/server/http/v1/cards/route";
import * as bySlug from "@/server/http/v1/cards/[slug]/route";
import * as metadataJson from "@/server/http/v1/cards/[slug]/metadata.json/route";
import * as reports from "@/server/http/v1/cards/[slug]/reports/route";

export const { GET, POST, PUT, PATCH, DELETE } = createCatchAllHandlers([
  { pattern: "", mod: root },
  { pattern: "[slug]", mod: bySlug },
  { pattern: "[slug]/metadata.json", mod: metadataJson },
  { pattern: "[slug]/reports", mod: reports },
]);
