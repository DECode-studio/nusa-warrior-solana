import { createCatchAllHandlers } from "@/server/shared/http/catch-all-router";
import * as root from "@/server/http/v1/user/custom-cards/route";
import * as prepare from "@/server/http/v1/user/custom-cards/prepare/route";
import * as pricing from "@/server/http/v1/user/custom-cards/pricing/route";

export const { GET, POST, PUT, PATCH, DELETE } = createCatchAllHandlers([
  { pattern: "", mod: root },
  { pattern: "prepare", mod: prepare },
  { pattern: "pricing", mod: pricing },
]);
