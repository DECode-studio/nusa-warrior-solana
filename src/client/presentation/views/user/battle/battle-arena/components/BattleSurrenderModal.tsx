"use client";

import React from "react";
import { Flag, Loader2 } from "lucide-react";
import { useTranslator } from "@/core/translator";
import { BaseModal, Button } from "@/client/presentation/components/ui";
import { BATTLE_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { BATTLE_TEXT_CONSTANT } from "../constants/TextConstant";

export interface BattleSurrenderModalProps {
  readonly isOpen: boolean;
  readonly isSubmitting?: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

export function BattleSurrenderModal({
  isOpen,
  isSubmitting = false,
  onCancel,
  onConfirm,
}: BattleSurrenderModalProps): React.ReactElement | null {
  const { t } = useTranslator();

  return (
    <BaseModal
      id={BATTLE_SEMANTIC_IDS.SURRENDER_MODAL}
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onCancel}
      closeOnBackdropClick={!isSubmitting}
      size="sm"
      className="border-danger/30 bg-surface-elevated"
      showCloseButton={false}
    >
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-danger/20 text-danger-light">
          <Flag className="h-6 w-6" />
        </div>
        <h3 className="font-display text-lg font-bold text-cream">
          {t(BATTLE_TEXT_CONSTANT.SURRENDER_CONFIRM_TITLE)}
        </h3>
        <p className="nc-type-body-sm text-muted">
          {t(BATTLE_TEXT_CONSTANT.SURRENDER_CONFIRM_DESC)}
        </p>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            onClick={onCancel}
            variant="secondary"
            size="sm"
            disabled={isSubmitting}
          >
            {t(BATTLE_TEXT_CONSTANT.SURRENDER_CANCEL)}
          </Button>
          <Button
            onClick={onConfirm}
            variant="danger"
            size="sm"
            disabled={isSubmitting}
            leftIcon={
              isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : undefined
            }
          >
            {isSubmitting
              ? t(BATTLE_TEXT_CONSTANT.SURRENDER_PROCESSING)
              : t(BATTLE_TEXT_CONSTANT.SURRENDER_YES)}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
