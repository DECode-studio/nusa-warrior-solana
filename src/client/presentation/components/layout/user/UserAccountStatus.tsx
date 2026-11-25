import React from "react";
import { Shield } from "lucide-react";
import { useTranslator } from "@/core/translator";
import { USER_LAYOUT_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { USER_LAYOUT_TEXT_CONSTANT } from "./constants/TextConstant";
import { USER_DASHBOARD_TEXT_CONSTANT } from "@/client/presentation/views/user/dashboard/constants/TextConstant";

export function UserAccountStatus({
  userName,
  isGuest = false,
}: {
  readonly userName: string | null;
  readonly isGuest?: boolean;
}): React.ReactElement {
  const { t } = useTranslator();

  return (
    <div
      id={USER_LAYOUT_SEMANTIC_IDS.ACCOUNT_STATUS}
      className={`mt-4 flex min-w-0 items-center justify-between gap-2 rounded-full border px-3.5 py-2 ${
        isGuest
          ? "border-amber-400/30 bg-amber-500/10"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <Shield
          className={`h-4 w-4 shrink-0 ${isGuest ? "text-amber-400" : "text-[#0DB561]"}`}
          aria-hidden="true"
        />
        <span className="truncate text-xs font-semibold text-[#F8F5F0]/85">
          {userName ?? t(USER_DASHBOARD_TEXT_CONSTANT.DEFAULT_WARRIOR_NAME)}
        </span>
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-0.5 font-display text-[10px] font-bold tracking-wide ${
          isGuest
            ? "bg-amber-400/20 text-amber-300"
            : "bg-[#0DB561]/20 text-[#0DB561]"
        }`}
      >
        {isGuest ? "TAMU (2 HARI)" : t(USER_LAYOUT_TEXT_CONSTANT.WARRIOR_ACTIVE)}
      </span>
    </div>
  );
}
