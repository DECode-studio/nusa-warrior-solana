import "server-only";
import type {
  StoredMatchLogRecord,
  StoredQuickMatchQueueRecord,
  StoredBattleSessionRecord,
} from "@/server/shared/db/embedded-store";
import type { NusaPointSource } from "@/server/modules/nusa-points/domain/nusa-point-policy";

export interface QuickMatchQueueInput {
  id: string;
  userId: string;
  deckId: string;
  deckName: string;
  battlePower: number;
  characterSlugs: string[];
  instrumentSlugs: string[];
  idempotencyKey: string;
  acceptedAt: Date;
}

export interface QuickMatchSessionInput {
  id: string;
  userId: string;
  opponentUserId: string;
  deckId: string;
  deckName: string;
  opponentDeckId: string;
  opponentDeckName: string;
  playerDeckCardSlugs: string[];
  opponentDeckCardSlugs: string[];
  stateJson: string;
  eventsJson: string;
  rngCommitment: string;
  rngSecret: string;
  rngCounter: number;
  rngDrawsJson: string;
}

export interface QuickMatchQueueResult {
  queue: StoredQuickMatchQueueRecord;
  session: StoredBattleSessionRecord | null;
}

export interface CreateMatchLogInput {
  userId: string | null;
  playerDeckName: string;
  botDifficulty: string;
  winner: "PLAYER" | "BOT";
  totalTurns: number;
  durationSec: number;
  playerScore: number;
  botScore: number;
  quickMatch?: {
    opponentUserId: string;
    opponentDeckName: string;
    winner: "PLAYER" | "BOT";
    playerDeckCardSlugs: string[];
    opponentDeckCardSlugs: string[];
  };
  pointReward?: {
    userId: string;
    amount: number;
    source: Extract<NusaPointSource, "BATTLE_BOT_WIN" | "BATTLE_PVP_WIN" | "LEAGUE_MATCH_WIN">;
    opponentUserId?: string | null;
  };
}

export interface BattleRepository {
  listMatches(userId: string): Promise<StoredMatchLogRecord[]>;
  createBattleSession(input: {
    id: string;
    createRequestKey: string;
    userId: string;
    deckId: string;
    deckName: string;
    botDifficulty: string;
    rulesVersion: string;
    stateJson: string;
    eventsJson: string;
    rngCommitment: string;
    rngSecret: string;
    rngCounter: number;
    rngDrawsJson: string;
    storyKingdom?: "MAJAPAHIT" | "PAJAJARAN";
    storyMissionId?: string;
    storyChoiceId?: string | null;
  }): Promise<import("@/server/shared/db/embedded-store").StoredBattleSessionRecord>;
  getBattleSession(
    id: string,
    userId: string
  ): Promise<import("@/server/shared/db/embedded-store").StoredBattleSessionRecord | null>;
  getBattleSessionByCreateRequestKey(createRequestKey: string): Promise<import("@/server/shared/db/embedded-store").StoredBattleSessionRecord | null>;
  getLatestActiveBattleSession(userId: string): Promise<import("@/server/shared/db/embedded-store").StoredBattleSessionRecord | null>;
  updateBattleSession(input: {
    id: string;
    userId: string;
    expectedSequence: number;
    stateJson: string;
    eventsJson: string;
    status: "ACTIVE" | "COMPLETED";
    rngCounter: number;
    rngDrawsJson: string;
    completion?: CreateMatchLogInput;
  }): Promise<import("@/server/shared/db/embedded-store").StoredBattleSessionRecord | null>;
  reconnectBattleSession(id: string, userId: string, now: Date, staleMs: number, graceMs: number): Promise<import("@/server/shared/db/embedded-store").StoredBattleSessionRecord | null>;
  // Parameter opsional sessionId membatasi sweep ke 1 sesi saat dipanggil dari request user.
  sweepBattleSessions(now: Date, staleBefore: Date, graceMs: number, sessionId?: string): Promise<number>;
  processQuickMatchQueue(input: {
    userId: string;
    enqueue?: QuickMatchQueueInput;
    buildSession: (player: StoredQuickMatchQueueRecord, opponent: StoredQuickMatchQueueRecord, id: string) => QuickMatchSessionInput;
  }): Promise<QuickMatchQueueResult | null>;
  getQuickMatchQueueEntry(userId: string): Promise<StoredQuickMatchQueueRecord | null>;
  cancelQuickMatchQueue(userId: string): Promise<boolean>;
}

