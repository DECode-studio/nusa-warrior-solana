"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowUpRight, ChevronRight, Mail, User } from "lucide-react";
import type { TeamMemberEntity } from "@/client/domain/team/entity/team_member_entity";
import { Badge, IntellioCard } from "@/client/presentation/components/ui";
import { TEAM_SEMANTIC_IDS } from "../constants/SemanticIdConstant";

interface TeamMemberCardProps {
  readonly member: TeamMemberEntity;
  readonly onSelect?: (member: TeamMemberEntity) => void;
}

export function TeamMemberCard({
  member,
  onSelect,
}: TeamMemberCardProps): React.ReactElement {
  const [imageError, setImageError] = useState(false);

  const handleClick = (): void => {
    onSelect?.(member);
  };

  return (
    <IntellioCard
      id={TEAM_SEMANTIC_IDS.MEMBER_CARD(member.id)}
      variant="interactive"
      padding="none"
      onClick={handleClick}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border-base bg-surface-elevated/85 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-border-strong hover:shadow-[0_16px_40px_rgba(103,102,255,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
    >
      {/* Member Avatar / Image Container */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-surface-base">
        {member.image && !imageError ? (
          <Image
            id={TEAM_SEMANTIC_IDS.MEMBER_IMAGE(member.id)}
            src={member.image}
            alt={member.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-108"
            style={{
              objectPosition: `${member.imagePositionX}% ${member.imagePositionY}%`,
            }}
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-muted text-primary-light">
            <User className="h-16 w-16 opacity-75" />
          </div>
        )}

        {/* Ambient Gradient Overlay */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-surface-elevated via-surface-elevated/20 to-transparent" />

        {/* Hover Action Pill Indicator */}
        <div className="pointer-events-none absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle bg-surface-base/80 text-primary-light backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:border-primary/60 group-hover:bg-primary/25 group-hover:text-white">
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>

      {/* Member Info */}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex-1">
          <Badge
            id={TEAM_SEMANTIC_IDS.MEMBER_ROLE(member.id)}
            variant="primary"
            shape="pill"
            size="sm"
            className="border border-border-base font-mono text-[11px] font-semibold uppercase tracking-wider text-primary-light"
          >
            {member.role}
          </Badge>

          <h3
            id={TEAM_SEMANTIC_IDS.MEMBER_NAME(member.id)}
            className="mt-3 font-display text-xl font-bold tracking-tight text-white transition-colors duration-200 group-hover:text-primary-light"
          >
            {member.name}
          </h3>

          <p
            id={TEAM_SEMANTIC_IDS.MEMBER_DESC(member.id)}
            className="mt-2.5 text-sm leading-relaxed text-muted line-clamp-3"
          >
            {member.description}
          </p>
        </div>

        {/* Footer Area: Email link & View Detail Trigger */}
        <div className="mt-5 flex items-center justify-between border-t border-border-subtle pt-4">
          {member.email ? (
            <a
              id={TEAM_SEMANTIC_IDS.MEMBER_EMAIL(member.id)}
              href={`mailto:${member.email}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex max-w-[65%] items-center gap-2 truncate text-xs font-medium text-muted transition-colors hover:text-emerald"
              title={member.email}
            >
              <Mail className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="truncate">{member.email}</span>
            </a>
          ) : (
            <span />
          )}

          <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-primary-light transition-colors group-hover:text-white">
            Detail
            <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </IntellioCard>
  );
}
