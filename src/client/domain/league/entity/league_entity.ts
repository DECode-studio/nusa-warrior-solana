export type LeagueVisibility = "PUBLIC" | "PRIVATE";
export type LeagueRole = "PARTICIPANT" | "SPECTATOR";
export type LeagueRoomStatus =
  | "REGISTRATION_OPEN"
  | "REGISTRATION_CLOSED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";
export type LeagueStakeMode = "FIXED_CARD" | "BATTLE_POWER";
export type LeagueCardRule = "ANY_KINGDOM" | "ONE_KINGDOM";

export interface LeagueRulesEntity {
  stakeMode: LeagueStakeMode;
  fixedCardSlug: string | null;
  battlePowerTarget: number | null;
  kingdom: string | null;
  battleDurationMinutes: number | null;
}

export interface LeagueParticipantEntity {
  id: string;
  userId: string;
  displayName: string;
  role: LeagueRole;
  status: string;
  stakeCardSlug: string | null;
  joinedAt: string;
}

export interface LeagueMatchEntity {
  id: string;
  roundNumber: number;
  playerOne: LeagueParticipantEntity;
  playerTwo: LeagueParticipantEntity | null;
  winnerId: string | null;
  status: string;
  battleSessionId: string | null;
  durationDeadlineAt: string | null;
  spectatorView: LeagueSpectatorViewEntity | null;
}

export interface LeagueBracketPreviewEntity {
  playerOne: LeagueParticipantEntity;
  playerTwo: LeagueParticipantEntity | null;
}

export interface LeagueSpectatorViewEntity {
  turnNumber: number;
  phase: LeagueBattlePhase;
  activePlayer: "PLAYER" | "BOT";
  playerFrontRow: Array<CardEntity | null>;
  playerSecondRow: Array<CardEntity | null>;
  opponentFrontRow: Array<CardEntity | null>;
  opponentSecondRow: Array<CardEntity | null>;
  usedInstruments: Array<{ name: string; slug: string }>;
  recentLogs: string[];
}

export interface LeagueRoomEntity {
  id: string;
  joinCode: string;
  visibility: LeagueVisibility;
  status: LeagueRoomStatus;
  creatorId: string;
  isCreator: boolean;
  viewerBattleSessionId: string | null;
  maxParticipants: number | null;
  registrationClosesAt: string;
  startMode: "AUTO" | "MANUAL";
  startDelayMinutes: number;
  scheduledStartAt: string | null;
  manualStartDeadlineAt: string | null;
  rules: LeagueRulesEntity;
  participants: LeagueParticipantEntity[];
  matches: LeagueMatchEntity[];
  bracketPreview: LeagueBracketPreviewEntity[];
  championId: string | null;
  createdAt: string;
}
import type { CardEntity } from "@/client/domain/card/entity/card_entity";

export type LeagueBattlePhase = "DICE_ROLL" | "DRAW_INSTRUMENT" | "PRE_ATTACK_INSTRUMENT" | "DECLARE_ATTACK" | "DEFENDER_INSTRUMENT_RESPONSE" | "RESOLVE_COMBAT" | "PROMOTE_CHARACTER" | "MATCH_OVER";

