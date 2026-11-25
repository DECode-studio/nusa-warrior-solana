"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2, User } from "lucide-react";
import { useTranslator } from "@/core/translator";
import { ADMIN_TEAM_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { ADMIN_TEAM_TEXT_CONSTANT } from "../constants/TextConstant";
import type { TeamMemberFormData, SelectedTeamMember } from "../types";

interface AdminTeamFormModalProps {
  readonly isOpen: boolean;
  readonly editingMember: SelectedTeamMember;
  readonly formData: TeamMemberFormData;
  readonly isSaving: boolean;
  readonly isUploadingImage: boolean;
  readonly onClose: () => void;
  readonly onFormChange: (
    field: keyof TeamMemberFormData,
    value: string | number | boolean
  ) => void;
  readonly onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  readonly onSubmit: (e: React.FormEvent) => Promise<void>;
}

export function AdminTeamFormModal({
  isOpen,
  editingMember,
  formData,
  isSaving,
  isUploadingImage,
  onClose,
  onFormChange,
  onImageUpload,
  onSubmit,
}: AdminTeamFormModalProps): React.ReactElement | null {
  const { t } = useTranslator();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewImageError, setPreviewImageError] = useState(false);

  useEffect(() => {
    setPreviewImageError(false);
  }, [formData.image]);

  if (!isOpen) return null;

  return (
    <div
      id={ADMIN_TEAM_SEMANTIC_IDS.MODAL_FORM}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[rgba(103,102,255,0.3)] bg-[#07011F] p-6 shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-lg p-1.5 text-[#B9B5D8] hover:bg-[#1A1245] hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <h2
          id={ADMIN_TEAM_SEMANTIC_IDS.MODAL_FORM_TITLE}
          className="font-display text-lg font-bold tracking-tight text-white"
        >
          {editingMember
            ? t(ADMIN_TEAM_TEXT_CONSTANT.MODAL_EDIT_TITLE)
            : t(ADMIN_TEAM_TEXT_CONSTANT.MODAL_CREATE_TITLE)}
        </h2>

        {/* Form Body */}
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          {/* Image & Upload */}
          <div>
            <label className="block text-xs font-semibold text-[#A2A1FF] mb-1.5">
              {t(ADMIN_TEAM_TEXT_CONSTANT.FORM_IMAGE)} *
            </label>
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-32 overflow-hidden rounded-xl border border-[rgba(103,102,255,0.3)] bg-[#140D3A] shrink-0">
                {formData.image && !previewImageError ? (
                  <Image
                    src={formData.image}
                    alt="Preview"
                    fill
                    sizes="64px"
                    className="object-cover"
                    style={{ objectPosition: `${formData.imagePositionX ?? 50}% ${formData.imagePositionY ?? 50}%` }}
                    unoptimized
                    onError={() => setPreviewImageError(true)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#6766FF]">
                    <User className="h-8 w-8" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  id={ADMIN_TEAM_SEMANTIC_IDS.INPUT_IMAGE}
                  type="text"
                  required
                  value={formData.image}
                  onChange={(e) => onFormChange("image", e.target.value)}
                  placeholder="https://... atau klik tombol unggah"
                  className="w-full rounded-xl border border-[rgba(103,102,255,0.25)] bg-[#0E0927] px-3.5 py-2 text-xs text-white placeholder-[#7A749E] focus:border-[#6766FF] focus:outline-none focus:ring-1 focus:ring-[#6766FF]"
                />
                <div>
                  <input
                    ref={fileInputRef}
                    id={ADMIN_TEAM_SEMANTIC_IDS.INPUT_FILE}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={onImageUpload}
                  />
                  <button
                    type="button"
                    disabled={isUploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(103,102,255,0.3)] bg-[#1A1245] px-3 py-1.5 text-[11px] font-semibold text-[#B3B2FF] hover:bg-[#6766FF] hover:text-white transition-colors disabled:opacity-50"
                  >
                    {isUploadingImage ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    <span>{t(ADMIN_TEAM_TEXT_CONSTANT.FORM_UPLOAD_BTN)}</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor={ADMIN_TEAM_SEMANTIC_IDS.INPUT_IMAGE_POSITION_X}
                  className="flex justify-between text-xs font-medium text-[#B9B5D8]"
                >
                  <span>{t(ADMIN_TEAM_TEXT_CONSTANT.FORM_IMAGE_POSITION_X)}</span>
                  <span>{formData.imagePositionX ?? 50}%</span>
                </label>
                <input
                  id={ADMIN_TEAM_SEMANTIC_IDS.INPUT_IMAGE_POSITION_X}
                  type="range"
                  min={0}
                  max={100}
                  value={formData.imagePositionX ?? 50}
                  onChange={(e) => onFormChange("imagePositionX", Number(e.target.value))}
                  aria-label={t(ADMIN_TEAM_TEXT_CONSTANT.FORM_IMAGE_POSITION_X)}
                  className="mt-2 w-full accent-[#6766FF]"
                />
                <p className="text-[10px] text-[#8E88B6]">{t(ADMIN_TEAM_TEXT_CONSTANT.FORM_IMAGE_POSITION_X_HINT)}</p>
              </div>
              <div>
                <label
                  htmlFor={ADMIN_TEAM_SEMANTIC_IDS.INPUT_IMAGE_POSITION_Y}
                  className="flex justify-between text-xs font-medium text-[#B9B5D8]"
                >
                  <span>{t(ADMIN_TEAM_TEXT_CONSTANT.FORM_IMAGE_POSITION_Y)}</span>
                  <span>{formData.imagePositionY ?? 50}%</span>
                </label>
                <input
                  id={ADMIN_TEAM_SEMANTIC_IDS.INPUT_IMAGE_POSITION_Y}
                  type="range"
                  min={0}
                  max={100}
                  value={formData.imagePositionY ?? 50}
                  onChange={(e) => onFormChange("imagePositionY", Number(e.target.value))}
                  aria-label={t(ADMIN_TEAM_TEXT_CONSTANT.FORM_IMAGE_POSITION_Y)}
                  className="mt-2 w-full accent-[#6766FF]"
                />
                <p className="text-[10px] text-[#8E88B6]">{t(ADMIN_TEAM_TEXT_CONSTANT.FORM_IMAGE_POSITION_Y_HINT)}</p>
              </div>
            </div>
            <p className="mt-2 text-[10px] text-[#8E88B6]">{t(ADMIN_TEAM_TEXT_CONSTANT.FORM_IMAGE_POSITION)}</p>
          </div>

          {/* Name & Role */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#A2A1FF] mb-1.5">
                {t(ADMIN_TEAM_TEXT_CONSTANT.FORM_NAME)} *
              </label>
              <input
                id={ADMIN_TEAM_SEMANTIC_IDS.INPUT_NAME}
                type="text"
                required
                value={formData.name}
                onChange={(e) => onFormChange("name", e.target.value)}
                placeholder="Contoh: Raden Wijaya"
                className="w-full rounded-xl border border-[rgba(103,102,255,0.25)] bg-[#0E0927] px-3.5 py-2 text-xs text-white placeholder-[#7A749E] focus:border-[#6766FF] focus:outline-none focus:ring-1 focus:ring-[#6766FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#A2A1FF] mb-1.5">
                {t(ADMIN_TEAM_TEXT_CONSTANT.FORM_ROLE)} *
              </label>
              <input
                id={ADMIN_TEAM_SEMANTIC_IDS.INPUT_ROLE}
                type="text"
                required
                value={formData.role}
                onChange={(e) => onFormChange("role", e.target.value)}
                placeholder="Contoh: Lead Historian & Epigrapher"
                className="w-full rounded-xl border border-[rgba(103,102,255,0.25)] bg-[#0E0927] px-3.5 py-2 text-xs text-white placeholder-[#7A749E] focus:border-[#6766FF] focus:outline-none focus:ring-1 focus:ring-[#6766FF]"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-[#A2A1FF] mb-1.5">
              {t(ADMIN_TEAM_TEXT_CONSTANT.FORM_EMAIL)} *
            </label>
            <input
              id={ADMIN_TEAM_SEMANTIC_IDS.INPUT_EMAIL}
              type="email"
              required
              value={formData.email}
              onChange={(e) => onFormChange("email", e.target.value)}
              placeholder="nama@nusantaracard.id"
              className="w-full rounded-xl border border-[rgba(103,102,255,0.25)] bg-[#0E0927] px-3.5 py-2 text-xs text-white placeholder-[#7A749E] focus:border-[#6766FF] focus:outline-none focus:ring-1 focus:ring-[#6766FF]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#A2A1FF] mb-1.5">
              {t(ADMIN_TEAM_TEXT_CONSTANT.FORM_DESCRIPTION)} *
            </label>
            <textarea
              id={ADMIN_TEAM_SEMANTIC_IDS.INPUT_DESCRIPTION}
              required
              rows={3}
              value={formData.description}
              onChange={(e) => onFormChange("description", e.target.value)}
              placeholder="Tuliskan latar belakang, keahlian, atau kontribusi dalam proyek..."
              className="w-full rounded-xl border border-[rgba(103,102,255,0.25)] bg-[#0E0927] px-3.5 py-2 text-xs text-white placeholder-[#7A749E] focus:border-[#6766FF] focus:outline-none focus:ring-1 focus:ring-[#6766FF]"
            />
          </div>

          {/* Display Order & Active Status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#A2A1FF] mb-1.5">
                {t(ADMIN_TEAM_TEXT_CONSTANT.FORM_DISPLAY_ORDER)}
              </label>
              <input
                id={ADMIN_TEAM_SEMANTIC_IDS.INPUT_DISPLAY_ORDER}
                type="number"
                min={0}
                value={formData.displayOrder}
                onChange={(e) => onFormChange("displayOrder", parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-xl border border-[rgba(103,102,255,0.25)] bg-[#0E0927] px-3.5 py-2 text-xs text-white placeholder-[#7A749E] focus:border-[#6766FF] focus:outline-none focus:ring-1 focus:ring-[#6766FF]"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="relative flex cursor-pointer items-center gap-3">
                <input
                  id={ADMIN_TEAM_SEMANTIC_IDS.INPUT_IS_ACTIVE}
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => onFormChange("isActive", e.target.checked)}
                  className="h-4 w-4 rounded border-[#6766FF] text-[#6766FF] focus:ring-[#6766FF] bg-[#0E0927]"
                />
                <span className="text-xs font-medium text-white">
                  {t(ADMIN_TEAM_TEXT_CONSTANT.FORM_IS_ACTIVE)}
                </span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-[rgba(103,102,255,0.18)]">
            <button
              id={ADMIN_TEAM_SEMANTIC_IDS.CANCEL_BTN}
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-[rgba(103,102,255,0.25)] bg-[#1A1245] px-4 py-2 text-xs font-semibold text-[#B9B5D8] hover:bg-[#251A5A] hover:text-white transition-colors"
            >
              {t(ADMIN_TEAM_TEXT_CONSTANT.FORM_CANCEL)}
            </button>
            <button
              id={ADMIN_TEAM_SEMANTIC_IDS.SUBMIT_BTN}
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#6766FF] px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-[#6766FF]/30 hover:bg-[#5554E6] transition-colors disabled:opacity-50"
            >
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{t(ADMIN_TEAM_TEXT_CONSTANT.FORM_SAVE)}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
