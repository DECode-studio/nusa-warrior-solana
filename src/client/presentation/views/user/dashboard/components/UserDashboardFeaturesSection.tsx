"use client";

import React from "react";
import { BookOpen, Layers, ShoppingBag, Swords } from "lucide-react";
import { ROUTES } from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";
import { UserFeatureCard } from "@/client/presentation/components/user";
import { USER_DASHBOARD_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { USER_DASHBOARD_TEXT_CONSTANT } from "../constants/TextConstant";

export function UserDashboardFeaturesSection(): React.ReactElement {
  const { locale, t } = useTranslator();

  return (
    <section
      id={USER_DASHBOARD_SEMANTIC_IDS.FEATURES_GRID}
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
    >
      <div id={USER_DASHBOARD_SEMANTIC_IDS.FEATURE_TUTORIAL}>
        <UserFeatureCard
          title={t(USER_DASHBOARD_TEXT_CONSTANT.FEATURE_TUTORIAL_TITLE)}
          description={t(USER_DASHBOARD_TEXT_CONSTANT.FEATURE_TUTORIAL_DESC)}
          href={ROUTES.USER_TUTORIAL(locale)}
          icon={<BookOpen className="h-5 w-5" />}
          accent="amber"
        />
      </div>

      <div id={USER_DASHBOARD_SEMANTIC_IDS.FEATURE_BATTLE}>
        <UserFeatureCard
          title={t(USER_DASHBOARD_TEXT_CONSTANT.FEATURE_BATTLE_TITLE)}
          description={t(USER_DASHBOARD_TEXT_CONSTANT.FEATURE_BATTLE_DESC)}
          href={ROUTES.USER_BATTLE(locale)}
          icon={<Swords className="h-5 w-5" />}
          accent="primary"
        />
      </div>

      <div id={USER_DASHBOARD_SEMANTIC_IDS.FEATURE_DECKS}>
        <UserFeatureCard
          title={t(USER_DASHBOARD_TEXT_CONSTANT.FEATURE_DECKS_TITLE)}
          description={t(USER_DASHBOARD_TEXT_CONSTANT.FEATURE_DECKS_DESC)}
          href={ROUTES.USER_DECKS(locale)}
          icon={<Layers className="h-5 w-5" />}
          accent="emerald"
        />
      </div>

      <div id={USER_DASHBOARD_SEMANTIC_IDS.FEATURE_SHOP}>
        <UserFeatureCard
          title={t(USER_DASHBOARD_TEXT_CONSTANT.FEATURE_SHOP_TITLE)}
          description={t(USER_DASHBOARD_TEXT_CONSTANT.FEATURE_SHOP_DESC)}
          href={ROUTES.USER_SHOP(locale)}
          icon={<ShoppingBag className="h-5 w-5" />}
          accent="amber"
        />
      </div>
    </section>
  );
}
