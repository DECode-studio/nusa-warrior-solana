import { createCatchAllHandlers } from "@/server/shared/http/catch-all-router";
import * as root from "@/server/http/v1/battles/route";
import * as active from "@/server/http/v1/battles/active/route";
import * as quickMatch from "@/server/http/v1/battles/quick-match/route";
import * as quickMatchSearch from "@/server/http/v1/battles/quick-match/search/route";
import * as byId from "@/server/http/v1/battles/[id]/route";
import * as actions from "@/server/http/v1/battles/[id]/actions/route";
import * as reconnect from "@/server/http/v1/battles/[id]/reconnect/route";
import * as vaultPrepare from "@/server/http/v1/battles/[id]/vault/prepare/route";
import * as vaultConfirm from "@/server/http/v1/battles/[id]/vault/confirm/route";

export const { GET, POST, PUT, PATCH, DELETE } = createCatchAllHandlers([
  { pattern: "", mod: root },
  { pattern: "active", mod: active },
  { pattern: "quick-match", mod: quickMatch },
  { pattern: "quick-match/search", mod: quickMatchSearch },
  { pattern: "[id]", mod: byId },
  { pattern: "[id]/actions", mod: actions },
  { pattern: "[id]/reconnect", mod: reconnect },
  { pattern: "[id]/vault/prepare", mod: vaultPrepare },
  { pattern: "[id]/vault/confirm", mod: vaultConfirm },
]);
