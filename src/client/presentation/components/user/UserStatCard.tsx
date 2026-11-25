import React from "react";
import { IntellioCard } from "@/client/presentation/components/ui";

export interface UserStatCardProps {
  readonly label: React.ReactNode;
  readonly value: React.ReactNode;
  readonly description?: React.ReactNode;
  readonly icon?: React.ReactNode;
  readonly accent?: "primary" | "amber" | "emerald" | "neutral";
}

const ACCENT_CLASSES: Record<
  NonNullable<UserStatCardProps["accent"]>,
  string
> = {
  primary: "text-[#A8A7FF] bg-[#6766FF]/12",
  amber: "text-[#FFBD70] bg-[#FF9F31]/12",
  emerald: "text-[#46D995] bg-[#0DB561]/12",
  neutral: "text-[#CFCBE2] bg-white/5",
};

export function UserStatCard({
  label,
  value,
  description,
  icon,
  accent = "primary",
}: UserStatCardProps): React.ReactElement {
  return (
    <IntellioCard
      variant="elevated"
      padding="sm"
      className="flex h-full min-h-36 flex-col justify-between border-white/[0.08]"
    >
      <div className="flex min-w-0 items-center justify-between gap-3">
        <span className="nc-type-body-sm min-w-0 text-[#CFCBE2]">{label}</span>
        {icon ? (
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${ACCENT_CLASSES[accent]}`}
            aria-hidden="true"
          >
            {icon}
          </span>
        ) : null}
      </div>
      <div>
        <div className="mt-3 font-display text-2xl font-bold leading-tight text-white sm:text-[1.75rem]">
          {value}
        </div>
        {description ? (
          <p className="nc-type-caption mt-1.5 text-[#CFCBE2]/75">
            {description}
          </p>
        ) : null}
      </div>
    </IntellioCard>
  );
}
