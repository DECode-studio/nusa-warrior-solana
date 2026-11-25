"use client";

import React, { useState } from "react";
import { Users2, AlertCircle } from "lucide-react";
import type { TeamMemberEntity } from "@/client/domain/team/entity/team_member_entity";
import { PublicContainer, PillButton } from "@/client/presentation/components/ui";
import { useTranslator } from "@/core/translator";
import { TEAM_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { TEAM_TEXT_CONSTANT } from "../constants/TextConstant";
import { TeamMemberCard } from "./TeamMemberCard";
import { TeamMemberDetailModal } from "./TeamMemberDetailModal";

interface TeamGridSectionProps {
  readonly members: TeamMemberEntity[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly onRetry: () => void;
}

export function TeamGridSection({
  members,
  loading,
  error,
  onRetry,
}: TeamGridSectionProps): React.ReactElement {
  const { t } = useTranslator();
  const [selectedMember, setSelectedMember] = useState<TeamMemberEntity | null>(
    null
  );

  return (
    <section id={TEAM_SEMANTIC_IDS.GRID_SECTION} className="mt-12 sm:mt-16">
      <PublicContainer size="wide">
        {/* Loading state */}
        {loading && (
          <div
            id={TEAM_SEMANTIC_IDS.LOADING_STATE}
            className="flex min-h-75 flex-col items-center justify-center gap-3 rounded-2xl border border-border-base bg-surface-elevated/60 p-12 text-center backdrop-blur-sm"
          >
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm font-medium text-muted">
              {t(TEAM_TEXT_CONSTANT.LOADING)}
            </p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div
            id={TEAM_SEMANTIC_IDS.ERROR_ALERT}
            className="flex min-h-65 flex-col items-center justify-center gap-4 rounded-2xl border border-danger/30 bg-danger/10 p-8 text-center backdrop-blur-sm"
          >
            <AlertCircle className="h-10 w-10 text-danger-light" />
            <p className="text-sm text-danger-light">{error}</p>
            <PillButton onClick={onRetry} variant="outline" size="sm">
              Coba Lagi
            </PillButton>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && members.length === 0 && (
          <div
            id={TEAM_SEMANTIC_IDS.EMPTY_STATE}
            className="flex min-h-75 flex-col items-center justify-center gap-3 rounded-2xl border border-border-base bg-surface-elevated/60 p-12 text-center backdrop-blur-sm"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border-subtle bg-primary/10 text-primary-light">
              <Users2 className="h-8 w-8" />
            </div>
            <h3 className="font-display text-lg font-bold text-white">
              {t(TEAM_TEXT_CONSTANT.EMPTY_TITLE)}
            </h3>
            <p className="max-w-md text-sm text-muted">
              {t(TEAM_TEXT_CONSTANT.EMPTY_DESCRIPTION)}
            </p>
          </div>
        )}

        {/* Grid of members */}
        {!loading && !error && members.length > 0 && (
          <div
            id={TEAM_SEMANTIC_IDS.GRID}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {members.map((member) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                onSelect={setSelectedMember}
              />
            ))}
          </div>
        )}

        {/* Member Detail Modal (Desktop: Centered Modal, Mobile: Bottom Sheet via BaseModal) */}
        <TeamMemberDetailModal
          member={selectedMember}
          isOpen={Boolean(selectedMember)}
          onClose={() => setSelectedMember(null)}
        />
      </PublicContainer>
    </section>
  );
}
