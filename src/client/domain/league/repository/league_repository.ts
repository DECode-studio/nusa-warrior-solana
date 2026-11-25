import type { LeagueRoomEntity, LeagueRole, LeagueRulesEntity } from "../entity/league_entity";

export interface LeagueRepository {
  listPublicLeagues(): Promise<LeagueRoomEntity[]>;
  listMyLeagues(): Promise<LeagueRoomEntity[]>;
  createLeague(input: {
    visibility: "PUBLIC" | "PRIVATE";
    maxParticipants: number | null;
    registrationDurationMinutes: number;
    startMode: "AUTO" | "MANUAL";
    startDelayMinutes: number;
    creatorRole: LeagueRole;
    deckId: string | null;
    stakeCardSlug: string | null;
    rules: LeagueRulesEntity;
  }): Promise<LeagueRoomEntity>;
  getLeague(id: string): Promise<LeagueRoomEntity>;
  joinLeague(input: {
    id: string;
    joinCode: string | null;
    role: LeagueRole;
    deckId: string | null;
    stakeCardSlug: string | null;
  }): Promise<LeagueRoomEntity>;
  joinLeagueByCode(input: {
    joinCode: string;
    role: LeagueRole;
    deckId: string | null;
    stakeCardSlug: string | null;
  }): Promise<LeagueRoomEntity>;
  closeLeagueRegistration(id: string): Promise<LeagueRoomEntity>;
  startLeague(id: string): Promise<LeagueRoomEntity>;
  cancelLeague(id: string): Promise<LeagueRoomEntity>;
}
