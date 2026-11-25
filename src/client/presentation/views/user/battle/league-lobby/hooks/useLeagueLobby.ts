import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { LeagueRoomEntity, LeagueRole, LeagueStakeMode } from "@/client/domain/league/entity/league_entity";
import type { DeckEntity } from "@/client/domain/deck/entity/deck_entity";
import type { OwnedCardEntity } from "@/client/domain/card/entity/card_entity";
import { getService } from "@/core/di/container";
import { CARD_USECASE_TOKEN, DECK_USECASE_TOKEN, LEAGUE_USECASE_TOKEN } from "@/core/di/tokens";
import { ROUTES } from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";
import { ApiClientError } from "@/core/http-client/api-client";
import { LEAGUE_TEXT_CONSTANT as TEXT } from "../constants/TextConstant";

const ACTIVE_BATTLE_SESSION_KEY = "nusa-active-battle-session";
const ACTIVE_LEAGUE_ROOM_KEY = "nusa-active-league-room";

function getRequestErrorMessage(cause: unknown, fallback: string): string {
  if (!(cause instanceof ApiClientError)) return fallback;
  const details = Object.entries(cause.details ?? {})
    .map(([field, messages]) => `${field}: ${messages.join("; ")}`);
  return details.length > 0 ? `${cause.message} ${details.join(" · ")}` : cause.message;
}

export function useLeagueLobby() {
  const router = useRouter();
  const { locale, t } = useTranslator();
  const [rooms, setRooms] = useState<LeagueRoomEntity[]>([]);
  const [myRooms, setMyRooms] = useState<LeagueRoomEntity[]>([]);
  const [activeSection, setActiveSection] = useState<"PUBLIC" | "MINE" | "JOIN">("PUBLIC");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [selectedJoinRoom, setSelectedJoinRoom] = useState<LeagueRoomEntity | null>(null);
  const [room, setRoom] = useState<LeagueRoomEntity | null>(null);
  const [decks, setDecks] = useState<DeckEntity[]>([]);
  const [ownedCards, setOwnedCards] = useState<OwnedCardEntity[]>([]);
  const [deckId, setDeckId] = useState("");
  const [stakeCardSlug, setStakeCardSlug] = useState("");
  const [joinDeckId, setJoinDeckId] = useState("");
  const [joinStakeCardSlug, setJoinStakeCardSlug] = useState("");
  const [stakeMode, setStakeMode] = useState<LeagueStakeMode>("FIXED_CARD");
  const [targetPower, setTargetPower] = useState(100);
  const [kingdom, setKingdom] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [creatorRole, setCreatorRole] = useState<LeagueRole>("PARTICIPANT");
  const [capacity, setCapacity] = useState("8");
  const [registrationMinutes, setRegistrationMinutes] = useState(30);
  const [startMode, setStartMode] = useState<"AUTO" | "MANUAL">("AUTO");
  const [startDelayMinutes, setStartDelayMinutes] = useState(3);
  const [battleDuration, setBattleDuration] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinRole, setJoinRole] = useState<LeagueRole>("PARTICIPANT");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [leaveConfirmationOpen, setLeaveConfirmationOpen] = useState(false);
  const [cancelConfirmationOpen, setCancelConfirmationOpen] = useState(false);
  const [leaveDestination, setLeaveDestination] = useState<"ROOM_LIST" | "BATTLE_LOBBY">("ROOM_LIST");
  const preferredTabApplied = useRef(false);

  const characterCards = useMemo(() => ownedCards.filter((item) => item.cardType === "CHARACTER" && item.quantity > 0), [ownedCards]);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const [publicRooms, fetchedMyRooms, fetchedDecks, fetchedCards] = await Promise.all([
        getService(LEAGUE_USECASE_TOKEN).listPublicLeagues(),
        getService(LEAGUE_USECASE_TOKEN).listMyLeagues(),
        getService(DECK_USECASE_TOKEN).getDecks(),
        getService(CARD_USECASE_TOKEN).getOwnedCards(),
      ]);
      setRooms(publicRooms);
      setMyRooms(fetchedMyRooms);
      if (!preferredTabApplied.current) {
        preferredTabApplied.current = true;
        if (fetchedMyRooms.some((item) => item.status === "REGISTRATION_OPEN" || item.status === "REGISTRATION_CLOSED" || item.status === "IN_PROGRESS")) {
          setActiveSection("MINE");
        }
      }
      setDecks(fetchedDecks.filter((deck) => !deck.isPreset && !deck.isTemporary));
      setOwnedCards(fetchedCards);
      const firstDeckId = fetchedDecks.find((deck) => !deck.isPreset && !deck.isTemporary)?.id || "";
      setDeckId((current) => current || firstDeckId);
      setJoinDeckId((current) => current || firstDeckId);
      const firstCard = fetchedCards.find((item) => item.cardType === "CHARACTER" && item.quantity > 0);
      setStakeCardSlug((current) => current || firstCard?.slug || "");
      setJoinStakeCardSlug((current) => current || firstCard?.slug || "");
      if (firstCard) setTargetPower(firstCard.baseAttack + firstCard.baseDefense);
    } catch (cause: unknown) {
      setError(getRequestErrorMessage(cause, t(TEXT.ERROR)));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    const roomId = new URLSearchParams(window.location.search).get("roomId");
    const code = new URLSearchParams(window.location.search).get("joinCode");
    if (code) {
      setJoinCode(code.toUpperCase());
      setJoinModalOpen(true);
      setActiveSection("JOIN");
    }
    if (!roomId) return;
    void getService(LEAGUE_USECASE_TOKEN).getLeague(roomId)
      .then(setRoom)
      .catch((cause: unknown) => setError(cause instanceof ApiClientError ? cause.message : t(TEXT.ERROR)));
  }, [t]);

  useEffect(() => {
    if (!room || room.status === "COMPLETED" || room.status === "CANCELLED") return;
    const interval = window.setInterval(() => {
      void getService(LEAGUE_USECASE_TOKEN).getLeague(room.id)
        .then(setRoom)
        .catch((cause: unknown) => setError(cause instanceof ApiClientError ? cause.message : t(TEXT.ERROR)));
    }, 3_000);
    return () => window.clearInterval(interval);
  }, [room, t]);

  const run = async (action: () => Promise<LeagueRoomEntity>): Promise<boolean> => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      setRoom(await action());
      await refresh();
      return true;
    } catch (cause: unknown) {
      setError(getRequestErrorMessage(cause, t(TEXT.ERROR)));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const buildRules = () => ({
    stakeMode,
    fixedCardSlug: stakeMode === "FIXED_CARD" ? stakeCardSlug || null : null,
    battlePowerTarget: stakeMode === "BATTLE_POWER" ? Number(targetPower) : null,
    kingdom: kingdom || null,
    battleDurationMinutes: battleDuration ? Number(battleDuration) : null,
  });

  const createRoom = async (): Promise<void> => {
    const created = await run(() => getService(LEAGUE_USECASE_TOKEN).createLeague({
    visibility,
    maxParticipants: capacity === "FREE" ? null : Number(capacity),
    registrationDurationMinutes: registrationMinutes,
    startMode,
    startDelayMinutes,
    creatorRole,
    deckId: creatorRole === "PARTICIPANT" ? deckId || null : null,
    stakeCardSlug: creatorRole === "PARTICIPANT" ? stakeCardSlug || null : null,
    rules: buildRules(),
    }));
    if (created) setCreateModalOpen(false);
  };

  const joinPublicRoom = async (id: string, role: LeagueRole): Promise<void> => {
    await run(() => getService(LEAGUE_USECASE_TOKEN).joinLeague({
      id, joinCode: null, role,
      deckId: role === "PARTICIPANT" ? deckId || null : null,
      stakeCardSlug: role === "PARTICIPANT" ? stakeCardSlug || null : null,
    }));
  };

  const submitJoin = async (): Promise<void> => {
    const joined = selectedJoinRoom
      ? await run(() => getService(LEAGUE_USECASE_TOKEN).joinLeague({
          id: selectedJoinRoom.id, joinCode: null, role: joinRole,
          deckId: joinRole === "PARTICIPANT" ? joinDeckId || null : null,
          stakeCardSlug: joinRole === "PARTICIPANT" ? joinStakeCardSlug || null : null,
        }))
      : await run(() => getService(LEAGUE_USECASE_TOKEN).joinLeagueByCode({
          joinCode, role: joinRole,
          deckId: joinRole === "PARTICIPANT" ? joinDeckId || null : null,
          stakeCardSlug: joinRole === "PARTICIPANT" ? joinStakeCardSlug || null : null,
        }));
    if (joined) {
      setJoinModalOpen(false);
      setSelectedJoinRoom(null);
    }
  };

  const openJoinByCode = (): void => {
    setSelectedJoinRoom(null);
    setJoinRole("PARTICIPANT");
    setJoinModalOpen(true);
    setActiveSection("JOIN");
  };

  const openJoinRoom = (selected: LeagueRoomEntity): void => {
    setSelectedJoinRoom(selected);
    const full = selected.participants.filter((participant) => participant.role === "PARTICIPANT").length >= (selected.maxParticipants ?? 32);
    setJoinRole(selected.status === "REGISTRATION_OPEN" && !full ? "PARTICIPANT" : "SPECTATOR");
    setJoinModalOpen(true);
  };

  const closeRegistration = async (id: string): Promise<void> => {
    await run(() => getService(LEAGUE_USECASE_TOKEN).closeLeagueRegistration(id));
  };
  const startLeague = async (id: string): Promise<void> => {
    await run(() => getService(LEAGUE_USECASE_TOKEN).startLeague(id));
  };
  const cancelLeague = async (id: string): Promise<void> => {
    const canceled = await run(() => getService(LEAGUE_USECASE_TOKEN).cancelLeague(id));
    if (canceled) setCancelConfirmationOpen(false);
  };

  const openDuel = (): void => {
    if (!room?.viewerBattleSessionId) return;
    window.localStorage.setItem(ACTIVE_BATTLE_SESSION_KEY, room.viewerBattleSessionId);
    window.sessionStorage.setItem(ACTIVE_BATTLE_SESSION_KEY, room.viewerBattleSessionId);
    window.sessionStorage.removeItem(ACTIVE_LEAGUE_ROOM_KEY);
    window.sessionStorage.setItem(ACTIVE_LEAGUE_ROOM_KEY, room.id);
    router.push(`${ROUTES.USER_BATTLE_ARENA(locale)}?leagueId=${encodeURIComponent(room.id)}`);
  };

  const openRoom = async (selected: LeagueRoomEntity): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      const latest = await getService(LEAGUE_USECASE_TOKEN).getLeague(selected.id);
      setRoom(latest);
      router.replace(`${ROUTES.USER_LEAGUES(locale)}?roomId=${encodeURIComponent(selected.id)}`);
    } catch (cause: unknown) {
      setError(getRequestErrorMessage(cause, t(TEXT.ERROR)));
    } finally {
      setBusy(false);
    }
  };

  const requestLeaveRoom = (destination: "ROOM_LIST" | "BATTLE_LOBBY" = "ROOM_LIST"): void => {
    setLeaveDestination(destination);
    setLeaveConfirmationOpen(true);
  };

  const confirmLeaveRoom = (): void => {
    setLeaveConfirmationOpen(false);
    if (leaveDestination === "BATTLE_LOBBY") {
      router.push(ROUTES.USER_BATTLE_LOBBY(locale));
      return;
    }
    setRoom(null);
    setNotice(null);
    router.replace(ROUTES.USER_LEAGUES(locale));
  };

  return {
    router, locale, t, rooms, myRooms, activeSection, setActiveSection, createModalOpen, setCreateModalOpen,
    joinModalOpen, setJoinModalOpen, selectedJoinRoom, setSelectedJoinRoom, room, setRoom, decks, deckId, setDeckId, stakeCardSlug, setStakeCardSlug,
    joinDeckId, setJoinDeckId, joinStakeCardSlug, setJoinStakeCardSlug,
    stakeMode, setStakeMode, targetPower, setTargetPower, kingdom, setKingdom, visibility, setVisibility,
    creatorRole, setCreatorRole, capacity, setCapacity, registrationMinutes, setRegistrationMinutes,
    startMode, setStartMode, startDelayMinutes, setStartDelayMinutes, battleDuration, setBattleDuration,
    joinCode, setJoinCode, joinRole, setJoinRole, loading, busy, error, notice, setNotice,
    characterCards, refresh, run, createRoom, joinPublicRoom, submitJoin, openJoinByCode, openJoinRoom, openRoom, closeRegistration, startLeague, openDuel,
    leaveConfirmationOpen, setLeaveConfirmationOpen, requestLeaveRoom, confirmLeaveRoom,
    cancelConfirmationOpen, setCancelConfirmationOpen, cancelLeague,
  };
}
