import { createCatchAllHandlers } from "@/server/shared/http/catch-all-router";
import * as collection from "@/server/http/v1/collection/route";
import * as team from "@/server/http/v1/team/route";
import * as decks from "@/server/http/v1/decks/route";
import * as deckById from "@/server/http/v1/decks/[id]/route";
import * as matches from "@/server/http/v1/matches/route";
import * as matchById from "@/server/http/v1/matches/[id]/route";
import * as internalBattlesSweep from "@/server/http/v1/internal/battles/sweep/route";

export const { GET, POST, PUT, PATCH, DELETE } = createCatchAllHandlers([
  { pattern: "collection", mod: collection },
  { pattern: "team", mod: team },
  { pattern: "decks", mod: decks },
  { pattern: "decks/[id]", mod: deckById },
  { pattern: "matches", mod: matches },
  { pattern: "matches/[id]", mod: matchById },
  { pattern: "internal/battles/sweep", mod: internalBattlesSweep },
]);
