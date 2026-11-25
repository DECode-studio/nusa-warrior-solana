import "server-only";
import { Prisma, type Prisma as PrismaTypes } from "@prisma/client";
import { AppError } from "@/server/shared/errors/app-error";
import { getEmbeddedStore } from "@/server/shared/db/embedded-store";

const BATTLE_DATA_LOCK_NAMESPACE = 8813043;
const BATTLE_DATA_LOCK_ID = 1;

async function acquireBattleDataLock(
  tx: PrismaTypes.TransactionClient,
): Promise<void> {
  await tx.$queryRaw<Array<{ locked: number }>>(Prisma.sql`
    WITH battle_data_lock AS MATERIALIZED (
      SELECT pg_advisory_xact_lock(${BATTLE_DATA_LOCK_NAMESPACE}, ${BATTLE_DATA_LOCK_ID})
    )
    SELECT 1::int AS locked FROM battle_data_lock
  `);
}

/** Serializes deck/card mutations with quick-match creation and other guarded writes. */
export async function assertBattleDataUnlocked(
  tx: PrismaTypes.TransactionClient,
  userIds: string[],
): Promise<void> {
  const participants = [...new Set(userIds)].sort();
  await acquireBattleDataLock(tx);

  const [activeSession, waitingEntry] = await Promise.all([
    tx.battleSession.findFirst({
      where: {
        status: "ACTIVE",
        OR: [
          { userId: { in: participants } },
          { opponentUserId: { in: participants } },
        ],
      },
      select: { id: true },
    }),
    tx.quickMatchQueueEntry.findFirst({
      where: { userId: { in: participants }, status: "WAITING" },
      select: { id: true },
    }),
  ]);

  if (activeSession || waitingEntry) {
    throw AppError.conflict(
      "Deck dan kartu tidak dapat diubah selama quick match aktif atau masih dalam antrean.",
    );
  }
}

export function assertEmbeddedBattleDataUnlocked(userIds: string[]): void {
  const participants = new Set(userIds);
  const store = getEmbeddedStore();
  const activeSession = store.battleSessions.some((session) =>
    session.status === "ACTIVE" &&
    (participants.has(session.userId) || Boolean(session.opponentUserId && participants.has(session.opponentUserId)))
  );
  const waitingEntry = store.quickMatchQueue.some((entry) =>
    entry.status === "WAITING" && participants.has(entry.userId)
  );

  if (activeSession || waitingEntry) {
    throw AppError.conflict(
      "Deck dan kartu tidak dapat diubah selama quick match aktif atau masih dalam antrean.",
    );
  }
}

export async function lockBattleDataIntegrity(
  tx: PrismaTypes.TransactionClient,
): Promise<void> {
  await acquireBattleDataLock(tx);
}
