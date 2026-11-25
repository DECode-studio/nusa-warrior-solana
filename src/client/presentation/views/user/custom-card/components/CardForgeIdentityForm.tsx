"use client";

import React from "react";
import { useTranslator } from "@/core/translator";
import { ROLE_OPTIONS } from "../hooks/useCardForge";
import { CARD_FORGE_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { CARD_FORGE_TEXT_CONSTANT } from "../constants/TextConstant";

export interface CardForgeIdentityFormProps {
  readonly name: string;
  readonly onNameChange: (val: string) => void;
  readonly gender: "LAKI_LAKI" | "PEREMPUAN";
  readonly onGenderChange: (val: "LAKI_LAKI" | "PEREMPUAN") => void;
  readonly role: string;
  readonly onRoleChange: (val: string) => void;
  readonly description: string;
  readonly onDescriptionChange: (val: string) => void;
}

export function CardForgeIdentityForm({
  name,
  onNameChange,
  gender,
  onGenderChange,
  role,
  onRoleChange,
  description,
  onDescriptionChange,
}: CardForgeIdentityFormProps): React.ReactElement {
  const { t } = useTranslator();

  const getRoleLabel = (roleId: string, fallback: string) => {
    switch (roleId) {
      case "PEMIMPIN":
        return t(CARD_FORGE_TEXT_CONSTANT.ROLE_PEMIMPIN);
      case "PRAJURIT":
        return t(CARD_FORGE_TEXT_CONSTANT.ROLE_PRAJURIT);
      case "PEMUKA":
        return t(CARD_FORGE_TEXT_CONSTANT.ROLE_PEMUKA);
      case "PERAJIN":
        return t(CARD_FORGE_TEXT_CONSTANT.ROLE_PERAJIN);
      case "UTUSAN":
        return t(CARD_FORGE_TEXT_CONSTANT.ROLE_UTUSAN);
      default:
        return fallback;
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
      <label className="block font-display text-sm font-semibold text-white">
        {t(CARD_FORGE_TEXT_CONSTANT.STEP_IDENTITY)}
      </label>

      <div>
        <label className="text-xs text-[#F8F5F0]/70">
          {t(CARD_FORGE_TEXT_CONSTANT.NAME_LABEL)}
        </label>
        <input
          id={CARD_FORGE_SEMANTIC_IDS.NAME_INPUT}
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          maxLength={35}
          placeholder={t(CARD_FORGE_TEXT_CONSTANT.NAME_PLACEHOLDER)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white focus:border-[#6766FF] focus:outline-none"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs text-[#F8F5F0]/70">
            {t(CARD_FORGE_TEXT_CONSTANT.GENDER_LABEL)}
          </label>
          <div className="mt-1 flex gap-2">
            <button
              id={CARD_FORGE_SEMANTIC_IDS.GENDER_MALE_BTN}
              type="button"
              onClick={() => onGenderChange("LAKI_LAKI")}
              className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition ${
                gender === "LAKI_LAKI"
                  ? "border-[#6766FF] bg-[#6766FF]/20 text-white"
                  : "border-white/10 bg-white/5 text-[#F8F5F0]/70"
              }`}
            >
              {t(CARD_FORGE_TEXT_CONSTANT.GENDER_MALE)}
            </button>
            <button
              id={CARD_FORGE_SEMANTIC_IDS.GENDER_FEMALE_BTN}
              type="button"
              onClick={() => onGenderChange("PEREMPUAN")}
              className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition ${
                gender === "PEREMPUAN"
                  ? "border-[#6766FF] bg-[#6766FF]/20 text-white"
                  : "border-white/10 bg-white/5 text-[#F8F5F0]/70"
              }`}
            >
              {t(CARD_FORGE_TEXT_CONSTANT.GENDER_FEMALE)}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs text-[#F8F5F0]/70">
            {t(CARD_FORGE_TEXT_CONSTANT.ROLE_LABEL)}
          </label>
          <select
            id={CARD_FORGE_SEMANTIC_IDS.ROLE_SELECT}
            value={role}
            onChange={(e) => onRoleChange(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-[#161426] px-3 py-2 text-xs text-white focus:border-[#6766FF] focus:outline-none"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {getRoleLabel(r.id, r.label)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-[#F8F5F0]/70">
          {t(CARD_FORGE_TEXT_CONSTANT.DESC_LABEL)}
        </label>
        <textarea
          id={CARD_FORGE_SEMANTIC_IDS.DESCRIPTION_INPUT}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          maxLength={250}
          rows={3}
          placeholder={t(CARD_FORGE_TEXT_CONSTANT.DESC_PLACEHOLDER)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white focus:border-[#6766FF] focus:outline-none"
          required
        />
      </div>
    </div>
  );
}
