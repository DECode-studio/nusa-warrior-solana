"use client";

import React, { useMemo, useRef, useState } from "react";
import { Upload, Info, Move } from "lucide-react";
import { useTranslator } from "@/core/translator";
import type { KingdomOption } from "../hooks/useCardForge";
import { ROLE_OPTIONS } from "../hooks/useCardForge";
import { CARD_FORGE_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { CARD_FORGE_TEXT_CONSTANT } from "../constants/TextConstant";
import {
  TEMPLATE_THEME_COLORS,
  DEFAULT_TEMPLATE_THEME_COLORS,
} from "../constants/ThemeConstant";

export interface CardForgeLivePreviewProps {
  readonly selectedKingdom: KingdomOption;
  readonly imagePreviewUrl: string | null;
  readonly imageDimensions?: { width: number; height: number } | null;
  readonly name: string;
  readonly gender: "LAKI_LAKI" | "PEREMPUAN";
  readonly role: string;
  readonly attack: number;
  readonly defense: number;
  readonly description: string;
  readonly cropScale?: number;
  readonly cropOffsetX?: number;
  readonly cropOffsetY?: number;
  readonly onCropChange?: (scale: number, offsetX: number, offsetY: number) => void;
}

function wrapText(text: string, maxCharsPerLine = 56): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + " " + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.slice(0, 4);
}

export function CardForgeLivePreview({
  selectedKingdom,
  imagePreviewUrl,
  imageDimensions,
  name,
  gender,
  role,
  attack,
  defense,
  description,
  cropScale = 1,
  cropOffsetX = 0,
  cropOffsetY = 0,
  onCropChange,
}: CardForgeLivePreviewProps): React.ReactElement {
  const { t } = useTranslator();
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; startOffsetX: number; startOffsetY: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!imagePreviewUrl || !onCropChange) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startOffsetX: cropOffsetX,
      startOffsetY: cropOffsetY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current || !onCropChange || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleFactor = 1024 / (rect.width || 340);
    const dx = (e.clientX - dragStartRef.current.x) * scaleFactor;
    const dy = (e.clientY - dragStartRef.current.y) * scaleFactor;

    const nextX = Math.round(Math.max(-600, Math.min(600, dragStartRef.current.startOffsetX + dx)));
    const nextY = Math.round(Math.max(-600, Math.min(600, dragStartRef.current.startOffsetY + dy)));
    onCropChange(cropScale, nextX, nextY);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!imagePreviewUrl || !onCropChange) return;
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.05 : -0.05;
    const nextScale = Math.max(0.5, Math.min(3, +(cropScale + zoomDelta).toFixed(2)));
    onCropChange(nextScale, cropOffsetX, cropOffsetY);
  };

  const roleLabel = useMemo(
    () => ROLE_OPTIONS.find((r) => r.id === role)?.label ?? "Prajurit",
    [role]
  );
  const genderLabel = gender === "LAKI_LAKI" ? "Laki - laki" : "Perempuan";
  const badgeText = `${genderLabel} • ${roleLabel} • ${selectedKingdom.name}`;
  const formattedAtk = attack.toLocaleString("id-ID");
  const formattedDef = defense.toLocaleString("id-ID");
  const descLines = useMemo(() => wrapText(description || "", 56), [description]);
  const templateKey = (selectedKingdom.template || "").toLowerCase();
  const colors = TEMPLATE_THEME_COLORS[templateKey] ?? DEFAULT_TEMPLATE_THEME_COLORS;

  // Ukuran dasar gambar menjaga rasio aspek asli (tidak dipaksa crop ke persegi/860)
  const aspect =
    imageDimensions && imageDimensions.height > 0
      ? imageDimensions.width / imageDimensions.height
      : 1;

  let baseW: number;
  let baseH: number;
  if (aspect >= 924 / 800) {
    baseH = 900;
    baseW = baseH * aspect;
  } else {
    baseW = 1000;
    baseH = baseW / aspect;
  }

  const cx = 512;
  const cy = 450;
  const x0 = cx - baseW / 2;
  const y0 = cy - baseH / 2;

  return (
    <div
      id={CARD_FORGE_SEMANTIC_IDS.LIVE_PREVIEW}
      className="sticky top-8 space-y-4"
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-sm font-semibold text-white">
          {t(CARD_FORGE_TEXT_CONSTANT.PREVIEW_TITLE)}
        </span>
        <span className="text-xs text-[#F8F5F0]/60">
          {t(CARD_FORGE_TEXT_CONSTANT.PREVIEW_TEMPLATE_PREFIX, { kingdom: selectedKingdom.name })}
        </span>
      </div>

      {/* Card Canvas Simulation (Rasio Asli PSD: 1024 x 1505) */}
      <div className="group relative mx-auto aspect-[1024/1505] w-full max-w-[340px] select-none overflow-hidden rounded-2xl shadow-2xl drop-shadow-[0_0_24px_rgba(0,0,0,0.85)]">
        {/* Floating Pan & Zoom Hint */}
        {imagePreviewUrl ? (
          <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-30 rounded-full border border-white/20 bg-black/60 px-3 py-1 text-[10px] font-medium text-white/90 backdrop-blur-md opacity-0 transition group-hover:opacity-100 flex items-center gap-1.5 shadow-lg">
            <Move className="h-3 w-3 text-amber-400" />
            {t(CARD_FORGE_TEXT_CONSTANT.PREVIEW_DRAG_HINT)}
          </div>
        ) : null}

        {/* SVG Composited Canvas */}
        <svg
          ref={svgRef}
          viewBox="0 0 1024 1505"
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 1. Background Kerajaan */}
          <image
            href={`/assets/card-templates/${selectedKingdom.template}/background.png`}
            x="0"
            y="0"
            width="1024"
            height="1505"
            preserveAspectRatio="none"
          />

          {/* 2. Artwork Pengguna di balik frame dengan Pan & Zoom Transform (Aspek Asli Utuh) */}
          {imagePreviewUrl ? (
            <g
              transform={`translate(${cx + cropOffsetX}, ${cy + cropOffsetY}) scale(${cropScale}) translate(-${cx}, -${cy})`}
            >
              <image
                href={imagePreviewUrl}
                x={x0}
                y={y0}
                width={baseW}
                height={baseH}
                preserveAspectRatio="none"
              />
            </g>
          ) : null}

          {/* 3. Frame Ornamen Kerajaan */}
          <image
            href={`/assets/card-templates/${selectedKingdom.template}/frame.png`}
            x="0"
            y="0"
            width="1024"
            height="1505"
            preserveAspectRatio="none"
          />

          {/* Interactive Drag & Wheel Catcher Rect */}
          {imagePreviewUrl ? (
            <rect
              x="50"
              y="50"
              width="924"
              height="790"
              fill="transparent"
              className="cursor-grab active:cursor-grabbing pointer-events-auto"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onWheel={handleWheel}
            />
          ) : null}

          {/* 4. Tipografi Konten Tepat Koordinat & Warna Sesuai Template PSD */}
          {/* Nama Karakter (Plaque Marmer: x=511, baseline y=904) */}
          <text
            x="511"
            y="904"
            textAnchor="middle"
            style={{
              fontFamily: "'MothproofScript', cursive",
              fontSize: "60px",
              fill: colors.name,
            }}
          >
            {name || "Nama Karakter"}
          </text>

          {/* Badge Info (Pita/Pill: x=511, baseline y=974) */}
          <text
            x="511"
            y="974"
            textAnchor="middle"
            style={{
              fontFamily: "'Abril Fatface', serif",
              fontSize: "26px",
              fill: colors.badge,
            }}
          >
            {badgeText}
          </text>

          {/* Attack Group (Kotak Kiri: label y=1067, val y=1127) */}
          <text
            x="288"
            y="1067"
            textAnchor="middle"
            style={{
              fontFamily: "'Abril Fatface', serif",
              fontSize: "26px",
              fill: colors.stat,
            }}
          >
            attack
          </text>
          <text
            x="293"
            y="1127"
            textAnchor="middle"
            style={{
              fontFamily: "'Abril Fatface', serif",
              fontSize: "61px",
              fill: colors.stat,
            }}
          >
            {formattedAtk}
          </text>

          {/* Defence Group (Kotak Kanan: label y=1066, val y=1127) */}
          <text
            x="746"
            y="1066"
            textAnchor="middle"
            style={{
              fontFamily: "'Abril Fatface', serif",
              fontSize: "26px",
              fill: colors.stat,
            }}
          >
            deffence
          </text>
          <text
            x="743"
            y="1127"
            textAnchor="middle"
            style={{
              fontFamily: "'Abril Fatface', serif",
              fontSize: "61px",
              fill: colors.stat,
            }}
          >
            {formattedDef}
          </text>

          {/* Label Deskripsi (Kotak Kertas Perkamen: x=512, baseline y=1226) */}
          <text
            x="512"
            y="1226"
            textAnchor="middle"
            style={{
              fontFamily: "'Abril Fatface', serif",
              fontSize: "26px",
              fill: colors.descLabel,
            }}
          >
            Deskripsi
          </text>

          {/* Isi Konten Deskripsi (Kotak Kertas Perkamen: x=512, start y=1284) */}
          <text
            x="512"
            y="1284"
            textAnchor="middle"
            style={{
              fontFamily: "'Abhaya Libre', serif",
              fontSize: "22px",
              fill: colors.descContent,
            }}
          >
            {descLines.map((line, idx) => (
              <tspan key={idx} x="512" dy={idx === 0 ? 0 : 28}>
                {line}
              </tspan>
            ))}
          </text>
        </svg>

        {/* Placeholder upload jika belum ada artwork */}
        {!imagePreviewUrl ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[56%] flex flex-col items-center justify-center p-6 text-center text-white/50">
            <Upload className="h-10 w-10 mb-2 opacity-60 text-[#D4AF37]" />
            <span className="text-xs font-medium text-white/70">
              {t(CARD_FORGE_TEXT_CONSTANT.PREVIEW_UPLOAD_PROMPT)}
            </span>
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center text-xs text-[#F8F5F0]/60">
        <Info className="inline h-3.5 w-3.5 mr-1 text-[#6766FF]" />
        {t(CARD_FORGE_TEXT_CONSTANT.PREVIEW_HINT)}
      </div>
    </div>
  );
}

