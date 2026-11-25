"use client";

import { useCallback, useEffect, useState } from "react";
import type { TeamMemberEntity } from "@/client/domain/team/entity/team_member_entity";
import { getService } from "@/core/di/container";
import { TEAM_USECASE_TOKEN } from "@/core/di/tokens";

export interface UseTeamReturn {
  members: TeamMemberEntity[];
  loading: boolean;
  error: string | null;
  retryLoad: () => void;
}

export function useTeam(): UseTeamReturn {
  const [members, setMembers] = useState<TeamMemberEntity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadTeamMembers = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const teamUseCase = getService(TEAM_USECASE_TOKEN);
      const data = await teamUseCase.getPublicTeamMembers();
      setMembers(data);
    } catch {
      setError("Gagal memuat data anggota tim.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTeamMembers();
  }, [loadTeamMembers]);

  return {
    members,
    loading,
    error,
    retryLoad: loadTeamMembers,
  };
}
