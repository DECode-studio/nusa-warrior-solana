"use client";

import React from "react";
import { AlertCircle, CheckCircle2, Layers, RotateCcw, Save, Wand2 } from "lucide-react";
import { useTranslator } from "@/core/translator";
import { Button, InputField, IntellioCard } from "@/client/presentation/components/ui";
import { DECK_BUILDER_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { DECK_BUILDER_TEXT_CONSTANT } from "../constants/TextConstant";
import type { DeckBuilderFeedback } from "../hooks/useDeckBuilder";

export interface DeckBuilderEditorPanelProps {
  readonly selectedCharCount: number;
  readonly selectedInstCount: number;
  readonly deckName: string;
  readonly onDeckNameChange: (val: string) => void;
  readonly deckDescription: string;
  readonly onDeckDescriptionChange: (val: string) => void;
  readonly isCharCountValid: boolean;
  readonly isEditing: boolean;
  readonly saving: boolean;
  readonly feedbackMessage: DeckBuilderFeedback | null;
  readonly onAutoFill: () => void;
  readonly onClearSelection: () => void;
  readonly onSaveDeck: () => void;
  readonly onCancelEdit: () => void;
}

export function DeckBuilderEditorPanel({
  selectedCharCount,
  selectedInstCount,
  deckName,
  onDeckNameChange,
  deckDescription,
  onDeckDescriptionChange,
  isCharCountValid,
  isEditing,
  saving,
  feedbackMessage,
  onAutoFill,
  onClearSelection,
  onSaveDeck,
  onCancelEdit,
}: DeckBuilderEditorPanelProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <IntellioCard
      id={DECK_BUILDER_SEMANTIC_IDS.EDITOR_PANEL}
      variant="glass"
      padding="sm"
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold text-cream">
          <Layers className="h-4 w-4 text-primary-light" aria-hidden="true" />
          <span>{t(DECK_BUILDER_TEXT_CONSTANT.COMPOSITION_TITLE)}</span>
        </h3>
        <div className="flex items-center gap-1.5">
          <Button
            id={DECK_BUILDER_SEMANTIC_IDS.AUTO_FILL_BTN}
            onClick={onAutoFill}
            variant="secondary"
            size="xs"
            leftIcon={<Wand2 className="h-3.5 w-3.5" />}
          >
            {t(DECK_BUILDER_TEXT_CONSTANT.AUTO_FILL_BTN)}
          </Button>
          <Button
            id={DECK_BUILDER_SEMANTIC_IDS.CLEAR_SELECTION_BTN}
            onClick={onClearSelection}
            variant="secondary"
            size="xs"
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
          >
            {t(DECK_BUILDER_TEXT_CONSTANT.RESET_BTN)}
          </Button>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border-base bg-surface-elevated/40 p-3 text-xs">
        <div
          id={DECK_BUILDER_SEMANTIC_IDS.CHAR_SLOTS_BAR}
          className="flex items-center justify-between"
        >
          <span className="font-semibold text-cream">
            {t(DECK_BUILDER_TEXT_CONSTANT.CHAR_SLOTS_LABEL)}{" "}
            <span className="text-primary-light">
              {t(DECK_BUILDER_TEXT_CONSTANT.CHAR_SLOTS_REQUIRED)}
            </span>
          </span>
          <span
            className={`font-display font-bold ${
              isCharCountValid ? "text-emerald-light" : "text-amber-light"
            }`}
          >
            {selectedCharCount} / 10
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
          <div
            className={`h-full transition-all duration-300 ${
              isCharCountValid ? "bg-emerald" : "bg-amber"
            }`}
            style={{ width: `${Math.min(100, (selectedCharCount / 10) * 100)}%` }}
          />
        </div>

        <div
          id={DECK_BUILDER_SEMANTIC_IDS.INST_SLOTS_BAR}
          className="flex items-center justify-between pt-1"
        >
          <span className="font-semibold text-cream">
            {t(DECK_BUILDER_TEXT_CONSTANT.INST_SLOTS_LABEL)}{" "}
            <span className="text-subtle">
              {t(DECK_BUILDER_TEXT_CONSTANT.INST_SLOTS_OPTIONAL)}
            </span>
          </span>
          <span className="font-display font-bold text-primary-light">
            {selectedInstCount} / 10
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{
              width: `${Math.min(100, (selectedInstCount / 10) * 100)}%`,
            }}
          />
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-border-subtle text-[11px] text-subtle">
            <span>{t(DECK_BUILDER_TEXT_CONSTANT.TOTAL_CARDS_LABEL)}</span>
          <span
            className={`font-display font-bold ${
              selectedCharCount + selectedInstCount <= 20
                ? "text-emerald-light"
                : "text-danger-light"
            }`}
          >
            {selectedCharCount + selectedInstCount} / 20
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <InputField
          id={DECK_BUILDER_SEMANTIC_IDS.DECK_NAME_INPUT}
          label={t(DECK_BUILDER_TEXT_CONSTANT.DECK_NAME_LABEL)}
          required
          value={deckName}
          onChange={(e) => onDeckNameChange(e.target.value)}
          placeholder={t(DECK_BUILDER_TEXT_CONSTANT.DECK_NAME_PLACEHOLDER)}
          sizeVariant="sm"
        />

        <InputField
          id={DECK_BUILDER_SEMANTIC_IDS.DECK_DESC_INPUT}
          label={t(DECK_BUILDER_TEXT_CONSTANT.DECK_DESC_LABEL)}
          value={deckDescription}
          onChange={(e) => onDeckDescriptionChange(e.target.value)}
          placeholder={t(DECK_BUILDER_TEXT_CONSTANT.DECK_DESC_PLACEHOLDER)}
          sizeVariant="sm"
        />

        <Button
          id={DECK_BUILDER_SEMANTIC_IDS.SAVE_DECK_BTN}
          onClick={onSaveDeck}
          disabled={!isCharCountValid || saving}
          isLoading={saving}
          variant="primary"
          size="md"
          className="w-full"
          leftIcon={<Save className="h-4 w-4" />}
        >
          {saving
            ? t(DECK_BUILDER_TEXT_CONSTANT.SAVING_BTN)
            : t(isEditing
                ? DECK_BUILDER_TEXT_CONSTANT.UPDATE_DECK_BTN
                : DECK_BUILDER_TEXT_CONSTANT.SAVE_DECK_BTN)}
        </Button>
        {isEditing && (
          <Button
            onClick={onCancelEdit}
            disabled={saving}
            variant="secondary"
            size="sm"
            className="w-full"
          >
            {t(DECK_BUILDER_TEXT_CONSTANT.CANCEL_EDIT_BTN)}
          </Button>
        )}
      </div>

      {feedbackMessage && (
        <div
          id={DECK_BUILDER_SEMANTIC_IDS.EDITOR_FEEDBACK}
          role={feedbackMessage.type === "error" ? "alert" : "status"}
          className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-semibold ${
            feedbackMessage.type === "success"
              ? "border-emerald/20 bg-emerald/10 text-emerald-light"
              : "border-danger/20 bg-danger/10 text-danger-light"
          }`}
        >
          {feedbackMessage.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>
            {t(feedbackMessage.messageKey, feedbackMessage.values)}
          </span>
        </div>
      )}
    </IntellioCard>
  );
}
