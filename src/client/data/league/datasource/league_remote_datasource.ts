import { injectable } from "@needle-di/core";
import { API_ROUTES } from "@/core/constants/api-routes";
import { apiClient } from "@/core/http-client/api-client";
import type { LeagueRole, LeagueRulesEntity } from "@/client/domain/league/entity/league_entity";
import type { LeagueRoomApiModel } from "../model/league_model";

@injectable()
export class LeagueRemoteDataSource {
  public listPublicLeagues(): Promise<LeagueRoomApiModel[]> {
    return apiClient.get<LeagueRoomApiModel[]>(API_ROUTES.LEAGUES.list);
  }

  public listMyLeagues(): Promise<LeagueRoomApiModel[]> {
    return apiClient.get<LeagueRoomApiModel[]>(API_ROUTES.LEAGUES.mine);
  }

  public createLeague(input: { visibility: "PUBLIC" | "PRIVATE"; maxParticipants: number | null; registrationDurationMinutes: number; startMode: "AUTO" | "MANUAL"; startDelayMinutes: number; creatorRole: LeagueRole; deckId: string | null; stakeCardSlug: string | null; rules: LeagueRulesEntity }): Promise<LeagueRoomApiModel> {
    return apiClient.post<LeagueRoomApiModel>(API_ROUTES.LEAGUES.create, input);
  }

  public getLeague(id: string): Promise<LeagueRoomApiModel> {
    return apiClient.get<LeagueRoomApiModel>(API_ROUTES.LEAGUES.detail(id));
  }

  public joinLeague(input: { id: string; joinCode: string | null; role: LeagueRole; deckId: string | null; stakeCardSlug: string | null }): Promise<LeagueRoomApiModel> {
    return apiClient.post<LeagueRoomApiModel>(API_ROUTES.LEAGUES.join(input.id), {
      joinCode: input.joinCode,
      role: input.role,
      deckId: input.deckId,
      stakeCardSlug: input.stakeCardSlug,
    });
  }

  public joinLeagueByCode(input: { joinCode: string; role: LeagueRole; deckId: string | null; stakeCardSlug: string | null }): Promise<LeagueRoomApiModel> {
    return apiClient.post<LeagueRoomApiModel>(API_ROUTES.LEAGUES.joinByCode, input);
  }

  public closeLeagueRegistration(id: string): Promise<LeagueRoomApiModel> {
    return apiClient.post<LeagueRoomApiModel>(API_ROUTES.LEAGUES.registration(id), {});
  }

  public startLeague(id: string): Promise<LeagueRoomApiModel> {
    return apiClient.post<LeagueRoomApiModel>(API_ROUTES.LEAGUES.start(id), {});
  }

  public cancelLeague(id: string): Promise<LeagueRoomApiModel> {
    return apiClient.post<LeagueRoomApiModel>(API_ROUTES.LEAGUES.cancel(id), {});
  }
}
