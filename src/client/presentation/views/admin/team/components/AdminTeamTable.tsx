"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Edit2, Trash2, User, Eye, EyeOff } from "lucide-react";
import type { TeamMemberEntity } from "@/client/domain/team/entity/team_member_entity";
import { useTranslator } from "@/core/translator";
import { ADMIN_TEAM_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { ADMIN_TEAM_TEXT_CONSTANT } from "../constants/TextConstant";

interface AdminTeamTableProps {
  readonly members: TeamMemberEntity[];
  readonly onEdit: (member: TeamMemberEntity) => void;
  readonly onDelete: (member: TeamMemberEntity) => void;
  readonly onToggleStatus: (member: TeamMemberEntity) => void;
}

function TeamImageThumbnail({ src, alt, positionX, positionY }: {
  src: string;
  alt: string;
  positionX: number;
  positionY: number;
}): React.ReactElement {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1D1743] text-[#6766FF]">
        <User className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-[rgba(103,102,255,0.25)] bg-[#1D1743]">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="40px"
        className="object-cover"
        style={{ objectPosition: `${positionX}% ${positionY}%` }}
        onError={() => setError(true)}
        unoptimized
      />
    </div>
  );
}

export function AdminTeamTable({
  members,
  onEdit,
  onDelete,
  onToggleStatus,
}: AdminTeamTableProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <div
      id={ADMIN_TEAM_SEMANTIC_IDS.TABLE}
      className="overflow-hidden rounded-2xl border border-[rgba(103,102,255,0.22)] bg-[#07011F]/90 shadow-2xl backdrop-blur-xl"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-[rgba(103,102,255,0.18)] bg-[#0E0927]/90 text-[11px] font-semibold tracking-wider text-[#A2A1FF] uppercase">
            <tr>
              <th scope="col" className="px-5 py-3.5">
                {t(ADMIN_TEAM_TEXT_CONSTANT.TABLE_IMAGE)}
              </th>
              <th scope="col" className="px-5 py-3.5">
                {t(ADMIN_TEAM_TEXT_CONSTANT.TABLE_NAME)}
              </th>
              <th scope="col" className="px-5 py-3.5">
                {t(ADMIN_TEAM_TEXT_CONSTANT.TABLE_ROLE)}
              </th>
              <th scope="col" className="px-5 py-3.5">
                {t(ADMIN_TEAM_TEXT_CONSTANT.TABLE_EMAIL)}
              </th>
              <th scope="col" className="px-5 py-3.5 text-center">
                {t(ADMIN_TEAM_TEXT_CONSTANT.TABLE_ORDER)}
              </th>
              <th scope="col" className="px-5 py-3.5 text-center">
                {t(ADMIN_TEAM_TEXT_CONSTANT.TABLE_STATUS)}
              </th>
              <th scope="col" className="px-5 py-3.5 text-right">
                {t(ADMIN_TEAM_TEXT_CONSTANT.TABLE_ACTIONS)}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(103,102,255,0.12)]">
            {members.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-xs text-[#B9B5D8]"
                >
                  Tidak ada data anggota tim yang cocok.
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr
                  key={member.id}
                  id={ADMIN_TEAM_SEMANTIC_IDS.TABLE_ROW(member.id)}
                  className="transition-colors hover:bg-[#130B35]/60"
                >
                  {/* Photo */}
                  <td className="px-5 py-3.5">
                    <TeamImageThumbnail
                      src={member.image}
                      alt={member.name}
                      positionX={member.imagePositionX}
                      positionY={member.imagePositionY}
                    />
                  </td>

                  {/* Name & Bio Preview */}
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-white">{member.name}</div>
                    <div className="max-w-xs truncate text-[11px] text-[#8E88B6]">
                      {member.description}
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-5 py-3.5">
                    <span className="inline-block rounded-md bg-[#6766FF]/15 px-2.5 py-1 text-[11px] font-medium text-[#B3B2FF] border border-[#6766FF]/30">
                      {member.role}
                    </span>
                  </td>

                  {/* Email */}
                  <td className="px-5 py-3.5 text-[#CFCBE2]">
                    {member.email}
                  </td>

                  {/* Display Order */}
                  <td className="px-5 py-3.5 text-center font-mono text-white">
                    {member.displayOrder}
                  </td>

                  {/* Status Toggle */}
                  <td className="px-5 py-3.5 text-center">
                    <button
                      id={ADMIN_TEAM_SEMANTIC_IDS.STATUS_TOGGLE(member.id)}
                      type="button"
                      onClick={() => onToggleStatus(member)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-all ${
                        member.isActive
                          ? "bg-[#0DB561]/20 text-[#0DB561] border border-[#0DB561]/40 hover:bg-[#0DB561]/30"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
                      }`}
                    >
                      {member.isActive ? (
                        <>
                          <Eye className="h-3 w-3" />
                          <span>{t(ADMIN_TEAM_TEXT_CONSTANT.STATUS_ACTIVE)}</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" />
                          <span>{t(ADMIN_TEAM_TEXT_CONSTANT.STATUS_INACTIVE)}</span>
                        </>
                      )}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        id={ADMIN_TEAM_SEMANTIC_IDS.EDIT_BTN(member.id)}
                        type="button"
                        onClick={() => onEdit(member)}
                        className="rounded-lg border border-[rgba(103,102,255,0.3)] bg-[#1A1245] p-2 text-[#A2A1FF] transition-all hover:border-[#6766FF] hover:bg-[#6766FF] hover:text-white"
                        title="Edit Anggota Tim"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        id={ADMIN_TEAM_SEMANTIC_IDS.DELETE_BTN(member.id)}
                        type="button"
                        onClick={() => onDelete(member)}
                        className="rounded-lg border border-rose-500/30 bg-rose-950/40 p-2 text-rose-300 transition-all hover:border-rose-500 hover:bg-rose-600 hover:text-white"
                        title="Hapus Anggota Tim"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
