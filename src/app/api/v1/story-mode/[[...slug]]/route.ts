import { createCatchAllHandlers } from "@/server/shared/http/catch-all-router";
import * as root from "@/server/http/v1/story-mode/route";
import * as start from "@/server/http/v1/story-mode/start/route";
import * as complete from "@/server/http/v1/story-mode/complete/route";
import * as assetById from "@/server/http/v1/story-mode/assets/[assetId]/route";

export const { GET, POST, PUT, PATCH, DELETE } = createCatchAllHandlers([
  { pattern: "", mod: root },
  { pattern: "start", mod: start },
  { pattern: "complete", mod: complete },
  { pattern: "assets/[assetId]", mod: assetById },
]);
