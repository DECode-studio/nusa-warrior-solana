import { timingSafeEqual } from "node:crypto";
import { sweepBattleSessionsUseCase } from "@/server/modules/battle/application/battle.usecase";
import { sweepLeagueRoomsUseCase } from "@/server/modules/league/application/league.usecase";
import { releaseExpiredCardEscrows } from "@/server/modules/collection/infrastructure/card-escrow.repository";
import { pruneExpiredRateLimitBuckets } from "@/server/shared/http/distributed-rate-limit";
import { pruneExpiredAuthSessions } from "@/server/shared/auth/auth-session-store";
import { cleanupInactiveGuestsUseCase } from "@/server/modules/auth/application/auth.usecase";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";

export async function POST(request: Request): Promise<Response> {
  try {
    const secret = process.env.BATTLE_SWEEP_SECRET;
    if (!secret || secret.length < 32) return new Response(null, { status: 404 });
    const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    const expectedBytes = Buffer.from(secret);
    const suppliedBytes = Buffer.from(supplied);
    if (
      suppliedBytes.length !== expectedBytes.length ||
      !timingSafeEqual(suppliedBytes, expectedBytes)
    ) {
      return new Response(null, { status: 404 });
    }
    const [abandonedCount, leagueSweepResult, releasedEscrows, prunedRateLimitBuckets, prunedAuthSessions, cleanedGuests] = await Promise.all([
      sweepBattleSessionsUseCase(),
      sweepLeagueRoomsUseCase(),
      releaseExpiredCardEscrows(),
      pruneExpiredRateLimitBuckets(),
      pruneExpiredAuthSessions(),
      cleanupInactiveGuestsUseCase(),
    ]);
    return okResponse({
      abandonedCount,
      leagueRoomsProcessed: leagueSweepResult.processedRooms,
      leagueRoomsDeleted: leagueSweepResult.deletedRooms,
      releasedEscrows,
      prunedRateLimitBuckets,
      prunedAuthSessions,
      cleanedGuests,
    });
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
