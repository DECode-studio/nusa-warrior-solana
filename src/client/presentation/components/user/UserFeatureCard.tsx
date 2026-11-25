import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { IntellioCard } from "@/client/presentation/components/ui";

export interface UserFeatureCardProps {
  readonly href: string;
  readonly title: React.ReactNode;
  readonly description: React.ReactNode;
  readonly icon: React.ReactNode;
  readonly accent?: "primary" | "amber" | "emerald" | "neutral";
  readonly actionLabel?: React.ReactNode;
}

const ACCENT_CLASSES: Record<
  NonNullable<UserFeatureCardProps["accent"]>,
  string
> = {
  primary: "text-[#A8A7FF] bg-[#6766FF]/12",
  amber: "text-[#FFBD70] bg-[#FF9F31]/12",
  emerald: "text-[#46D995] bg-[#0DB561]/12",
  neutral: "text-[#CFCBE2] bg-white/5",
};

export function UserFeatureCard({
  href,
  title,
  description,
  icon,
  accent = "primary",
  actionLabel,
}: UserFeatureCardProps): React.ReactElement {
  return (
    <Link href={href} className="group block h-full rounded-[var(--radius-card)] focus-visible:outline-2 focus-visible:outline-[#6766FF] focus-visible:outline-offset-2">
      <IntellioCard
        variant="interactive"
        padding="sm"
        className="flex h-full min-h-52 flex-col justify-between border-white/[0.08]"
      >
        <div>
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${ACCENT_CLASSES[accent]}`} aria-hidden="true">
            {icon}
          </span>
          <h3 className="nc-type-card-title mt-4 font-display font-bold text-white transition-colors group-hover:text-[#A8A7FF]">
            {title}
          </h3>
          <p className="nc-type-body-sm mt-1.5 text-[#CFCBE2]">{description}</p>
        </div>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#A8A7FF] group-hover:text-white">
          {actionLabel ?? "Buka Menu"}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </IntellioCard>
    </Link>
  );
}
