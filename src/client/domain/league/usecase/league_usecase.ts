import { inject, injectable } from "@needle-di/core";
import { LEAGUE_REPOSITORY_TOKEN } from "@/core/di/tokens";
import type { LeagueRepository } from "../repository/league_repository";
import type { LeagueRoomEntity, LeagueRole, LeagueRulesEntity } from "../entity/league_entity";

@injectable()
export class LeagueUseCase {
  constructor(private readonly leagueRepository: LeagueRepository = inject(LEAGUE_REPOSITORY_TOKEN)) {}

  public listPublicLeagues(): Promise<LeagueRoomEntity[]> { return this.leagueRepository.listPublicLeagues(); }
  public listMyLeagues(): Promise<LeagueRoomEntity[]> { return this.leagueRepository.listMyLeagues(); }
  public createLeague(input: { visibility: "PUBLIC" | "PRIVATE"; maxParticipants: number | null; registrationDurationMinutes: number; startMode: "AUTO" | "MANUAL"; startDelayMinutes: number; creatorRole: LeagueRole; deckId: string | null; stakeCardSlug: string | null; rules: LeagueRulesEntity }): Promise<LeagueRoomEntity> { return this.leagueRepository.createLeague(input); }
  public getLeague(id: string): Promise<LeagueRoomEntity> { return this.leagueRepository.getLeague(id); }
  public joinLeague(input: { id: string; joinCode: string | null; role: LeagueRole; deckId: string | null; stakeCardSlug: string | null }): Promise<LeagueRoomEntity> { return this.leagueRepository.joinLeague(input); }
  public joinLeagueByCode(input: { joinCode: string; role: LeagueRole; deckId: string | null; stakeCardSlug: string | null }): Promise<LeagueRoomEntity> { return this.leagueRepository.joinLeagueByCode(input); }
  public closeLeagueRegistration(id: string): Promise<LeagueRoomEntity> { return this.leagueRepository.closeLeagueRegistration(id); }
  public startLeague(id: string): Promise<LeagueRoomEntity> { return this.leagueRepository.startLeague(id); }
  public cancelLeague(id: string): Promise<LeagueRoomEntity> { return this.leagueRepository.cancelLeague(id); }
}
