import { createCatchAllHandlers } from "@/server/shared/http/catch-all-router";
import * as root from "@/server/http/v1/leagues/route";
import * as join from "@/server/http/v1/leagues/join/route";
import * as mine from "@/server/http/v1/leagues/mine/route";
import * as byId from "@/server/http/v1/leagues/[id]/route";
import * as cancel from "@/server/http/v1/leagues/[id]/cancel/route";
import * as joinById from "@/server/http/v1/leagues/[id]/join/route";
import * as registration from "@/server/http/v1/leagues/[id]/registration/route";
import * as start from "@/server/http/v1/leagues/[id]/start/route";

export const { GET, POST, PUT, PATCH, DELETE } = createCatchAllHandlers([
  { pattern: "", mod: root },
  { pattern: "join", mod: join },
  { pattern: "mine", mod: mine },
  { pattern: "[id]", mod: byId },
  { pattern: "[id]/cancel", mod: cancel },
  { pattern: "[id]/join", mod: joinById },
  { pattern: "[id]/registration", mod: registration },
  { pattern: "[id]/start", mod: start },
]);
