import { inject, injectable } from "@needle-di/core";
import type { LeagueRepository } from "@/client/domain/league/repository/league_repository";
import type { LeagueRoomEntity, LeagueRole, LeagueRulesEntity } from "@/client/domain/league/entity/league_entity";
import { LeagueRemoteDataSource } from "../datasource/league_remote_datasource";

@injectable()
export class LeagueRepositoryImpl implements LeagueRepository {
  constructor(private readonly remoteDataSource: LeagueRemoteDataSource = inject(LeagueRemoteDataSource)) {}

  public listPublicLeagues(): Promise<LeagueRoomEntity[]> { return this.remoteDataSource.listPublicLeagues(); }
  public listMyLeagues(): Promise<LeagueRoomEntity[]> { return this.remoteDataSource.listMyLeagues(); }
  public createLeague(input: { visibility: "PUBLIC" | "PRIVATE"; maxParticipants: number | null; registrationDurationMinutes: number; startMode: "AUTO" | "MANUAL"; startDelayMinutes: number; creatorRole: LeagueRole; deckId: string | null; stakeCardSlug: string | null; rules: LeagueRulesEntity }): Promise<LeagueRoomEntity> { return this.remoteDataSource.createLeague(input); }
  public getLeague(id: string): Promise<LeagueRoomEntity> { return this.remoteDataSource.getLeague(id); }
  public joinLeague(input: { id: string; joinCode: string | null; role: LeagueRole; deckId: string | null; stakeCardSlug: string | null }): Promise<LeagueRoomEntity> { return this.remoteDataSource.joinLeague(input); }
  public joinLeagueByCode(input: { joinCode: string; role: LeagueRole; deckId: string | null; stakeCardSlug: string | null }): Promise<LeagueRoomEntity> { return this.remoteDataSource.joinLeagueByCode(input); }
  public closeLeagueRegistration(id: string): Promise<LeagueRoomEntity> { return this.remoteDataSource.closeLeagueRegistration(id); }
  public startLeague(id: string): Promise<LeagueRoomEntity> { return this.remoteDataSource.startLeague(id); }
  public cancelLeague(id: string): Promise<LeagueRoomEntity> { return this.remoteDataSource.cancelLeague(id); }
}
