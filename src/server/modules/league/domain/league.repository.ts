import "server-only";

export interface LeagueRoomRecord {
  id: string;
  creatorId: string;
  joinCode: string;
  isPublic: boolean;
  status: string;
  maxParticipants: number | null;
  registrationClosesAt: Date;
  startMode: string;
  startDelayMinutes: number;
  scheduledStartAt: Date | null;
  manualStartDeadlineAt: Date | null;
  rulesJson: string;
  createdAt: Date;
  terminalAt: Date | null;
  participants: Array<{
    id: string;
    userId: string;
    role: string;
    status: string;
    deckId: string | null;
    stakeCardSlug: string | null;
    joinedAt: Date;
    user: { name: string };
  }>;
  rounds: Array<{
    id: string;
    roundNumber: number;
    status: string;
    matches: Array<{
      id: string;
      playerOneId: string;
      playerTwoId: string | null;
      winnerId: string | null;
      status: string;
      battleSessionId: string | null;
      durationDeadlineAt: Date | null;
      battleSession: { status: string; stateJson: string } | null;
    }>;
  }>;
}

export interface LeagueBattleSessionInput {
  id: string;
  userId: string;
  opponentUserId: string;
  deckId: string;
  deckName: string;
  opponentDeckId: string;
  opponentDeckName: string;
  playerStakeCardSlug: string;
  opponentStakeCardSlug: string;
  stateJson: string;
  eventsJson: string;
  rngCommitment: string;
  rngSecret: string;
  rngCounter: number;
  rngDrawsJson: string;
}

export interface LeagueRoundMatchInput {
  id: string;
  playerOneId: string;
  playerTwoId: string | null;
  winnerId: string | null;
  session: LeagueBattleSessionInput | null;
  durationMinutes: number | null;
}

export interface CreateLeagueRoomRecordInput {
  id: string;
  creatorId: string;
  joinCode: string;
  isPublic: boolean;
  maxParticipants: number | null;
  registrationClosesAt: Date;
  startMode: "AUTO" | "MANUAL";
  startDelayMinutes: number;
  scheduledStartAt: Date | null;
  manualStartDeadlineAt: Date | null;
  rulesJson: string;
  creatorDeckId: string | null;
  creatorStakeCardSlug: string | null;
  creatorRole: "PARTICIPANT" | "SPECTATOR";
}

export interface LeagueRepository {
  createRoom(input: CreateLeagueRoomRecordInput): Promise<LeagueRoomRecord>;
  findRoom(id: string, includePrivate: boolean, userId?: string): Promise<LeagueRoomRecord | null>;
  findRoomByCode(joinCode: string): Promise<LeagueRoomRecord | null>;
  listPublicRooms(): Promise<LeagueRoomRecord[]>;
  listRoomsForUser(userId: string): Promise<LeagueRoomRecord[]>;
  listDueRooms(now: Date): Promise<LeagueRoomRecord[]>;
  cancelStalledRoom(leagueId: string, now: Date): Promise<void>;
  deleteExpiredPublicRooms(input: { cancelledBefore: Date; completedBefore: Date; limit: number }): Promise<number>;
  joinRoom(input: {
    leagueId: string;
    joinCode: string | null;
    userId: string;
    role: "PARTICIPANT" | "SPECTATOR";
    deckId: string | null;
    stakeCardSlug: string | null;
  }): Promise<LeagueRoomRecord>;
  closeRegistration(leagueId: string, userId: string, now: Date): Promise<LeagueRoomRecord>;
  cancelRoom(leagueId: string, userId: string): Promise<void>;
  startRound(input: { leagueId: string; roundNumber: number; matches: LeagueRoundMatchInput[] }): Promise<LeagueRoomRecord>;
  resolveRound(input: { leagueId: string; roundNumber: number; matches: Array<{ matchId: string; winnerId: string }> ; nextRound?: { roundNumber: number; matches: LeagueRoundMatchInput[] } }): Promise<void>;
}
