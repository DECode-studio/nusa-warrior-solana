"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Mail, User } from "lucide-react";
import type { TeamMemberEntity } from "@/client/domain/team/entity/team_member_entity";
import { BaseModal, Badge, Button } from "@/client/presentation/components/ui";
import { TEAM_SEMANTIC_IDS } from "../constants/SemanticIdConstant";

export interface TeamMemberDetailModalProps {
  readonly member: TeamMemberEntity | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function TeamMemberDetailModal({
  member,
  isOpen,
  onClose,
}: TeamMemberDetailModalProps): React.ReactElement | null {
  const [imageError, setImageError] = useState<boolean>(false);

  if (!member) {
    return null;
  }

  return (
    <BaseModal
      id={TEAM_SEMANTIC_IDS.MEMBER_MODAL}
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      mobileBehavior="bottomsheet"
      dragToDismiss={true}
      showDragHandle={true}
      title={
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge
            id={TEAM_SEMANTIC_IDS.MEMBER_MODAL_ROLE}
            variant="primary"
            shape="pill"
            size="sm"
            className="border border-border-base font-mono uppercase tracking-wider text-[11px]"
          >
            {member.role}
          </Badge>
        </div>
      }
      description={
        <span className="font-mono text-xs text-subtle">
          Profil Anggota Nusa Warriors
        </span>
      }
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-end">
          {member.email && (
            <Button
              id={TEAM_SEMANTIC_IDS.MEMBER_MODAL_EMAIL_BTN}
              href={`mailto:${member.email}`}
              variant="primary"
              size="sm"
              leftIcon={<Mail className="h-4 w-4" />}
            >
              Kirim Email
            </Button>
          )}
          <Button
            id={TEAM_SEMANTIC_IDS.MEMBER_MODAL_CLOSE_BTN}
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Tutup
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        {/* Avatar Container */}
        <div className="relative aspect-4/3 w-full sm:aspect-square sm:w-60 sm:shrink-0 overflow-hidden rounded-2xl border border-border-base bg-surface-base shadow-[0_12px_36px_rgba(0,0,0,0.6)]">
          {member.image && !imageError ? (
            <Image
              id={TEAM_SEMANTIC_IDS.MEMBER_MODAL_IMAGE}
              src={member.image}
              alt={member.name}
              fill
              sizes="(max-width: 640px) 100vw, 240px"
              className="object-cover transition-transform duration-500 hover:scale-105"
              style={{
                objectPosition: `${member.imagePositionX}% ${member.imagePositionY}%`,
              }}
              onError={() => setImageError(true)}
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface-muted text-primary-light">
              <User className="h-20 w-20 opacity-70" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-surface-elevated/70 via-transparent to-transparent" />
        </div>

        {/* Member Details */}
        <div className="flex flex-1 flex-col justify-between">
          <div>
            <h3
              id={TEAM_SEMANTIC_IDS.MEMBER_MODAL_NAME}
              className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl"
            >
              {member.name}
            </h3>

            <div className="mt-4 border-t border-border-subtle pt-4">
              <h4 className="font-mono text-xs font-semibold tracking-wider text-primary-light uppercase">
                Biografi & Peran
              </h4>
              <p
                id={TEAM_SEMANTIC_IDS.MEMBER_MODAL_DESC}
                className="mt-2.5 text-sm sm:text-base leading-relaxed text-muted whitespace-pre-line"
              >
                {member.description}
              </p>
            </div>
          </div>

          {/* Email row in content for quick copy/view */}
          {member.email && (
            <div className="mt-6 rounded-xl border border-border-subtle bg-surface-muted/50 p-3.5 backdrop-blur-xs">
              <span className="block font-mono text-[11px] font-semibold tracking-wider text-subtle uppercase">
                Kontak Langsung
              </span>
              <a
                href={`mailto:${member.email}`}
                className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-cream hover:text-primary-light transition-colors"
              >
                <Mail className="h-4 w-4 text-primary" />
                <span className="break-all">{member.email}</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
}

