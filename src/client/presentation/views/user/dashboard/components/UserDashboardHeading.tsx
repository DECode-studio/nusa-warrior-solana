"use client";

import React from "react";
import { Layers, Sparkles, Swords } from "lucide-react";
import { ROUTES } from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";
import { Button } from "@/client/presentation/components/ui";
import { UserPageHeading } from "@/client/presentation/components/user";
import { USER_DASHBOARD_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { USER_DASHBOARD_TEXT_CONSTANT } from "../constants/TextConstant";

export interface UserDashboardHeadingProps {
  readonly userName?: string;
}

export function UserDashboardHeading({
  userName,
}: UserDashboardHeadingProps): React.ReactElement {
  const { locale, t } = useTranslator();
  const displayName = userName ?? t(USER_DASHBOARD_TEXT_CONSTANT.DEFAULT_WARRIOR_NAME);

  return (
    <div id={USER_DASHBOARD_SEMANTIC_IDS.HEADING}>
      <UserPageHeading
        variant="hero"
        eyebrowVariant="amber"
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-light" aria-hidden="true" />
            <span>
              {t(USER_DASHBOARD_TEXT_CONSTANT.WELCOME_PREFIX)} {displayName}
            </span>
          </span>
        }
        title={t(USER_DASHBOARD_TEXT_CONSTANT.TITLE_KEY)}
        description={t(USER_DASHBOARD_TEXT_CONSTANT.SUBTITLE_KEY)}
        actions={
          <div
            id={USER_DASHBOARD_SEMANTIC_IDS.QUICK_ACTIONS}
            className="flex flex-wrap gap-2.5"
          >
            <Button
              id={USER_DASHBOARD_SEMANTIC_IDS.BATTLE_LOBBY_BTN}
              href={ROUTES.USER_BATTLE(locale)}
              size="sm"
              leftIcon={<Swords className="h-4 w-4" />}
            >
              {t(USER_DASHBOARD_TEXT_CONSTANT.ACTION_BATTLE_LOBBY)}
            </Button>
            <Button
              id={USER_DASHBOARD_SEMANTIC_IDS.BUILD_DECK_BTN}
              href={ROUTES.USER_DECKS(locale)}
              variant="secondary"
              size="sm"
              leftIcon={<Layers className="h-4 w-4" />}
            >
              {t(USER_DASHBOARD_TEXT_CONSTANT.ACTION_BUILD_DECK)}
            </Button>
          </div>
        }
      />
    </div>
  );
}

