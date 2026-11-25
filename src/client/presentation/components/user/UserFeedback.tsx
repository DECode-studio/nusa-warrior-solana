import React from "react";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { IntellioCard } from "@/client/presentation/components/ui";

export interface UserFeedbackProps {
  readonly title: React.ReactNode;
  readonly description?: React.ReactNode;
  readonly action?: React.ReactNode;
  readonly kind?: "loading" | "error" | "empty";
  readonly className?: string;
}

export function UserFeedback({
  title,
  description,
  action,
  kind = "empty",
  className = "",
}: UserFeedbackProps): React.ReactElement {
  const isError = kind === "error";
  const isLoading = kind === "loading";
  const Icon = isLoading ? LoaderCircle : AlertCircle;
  const role = isError ? "alert" : isLoading ? "status" : undefined;

  return (
    <IntellioCard
      variant="glass"
      padding="md"
      role={role}
      className={`flex min-h-36 flex-col items-center justify-center text-center ${isError ? "border-danger/30" : ""} ${className}`}
    >
      <Icon
        className={`h-6 w-6 ${isLoading ? "animate-spin text-primary-light" : isError ? "text-danger-light" : "text-amber-light"}`}
        aria-hidden="true"
      />
      <h3 className="nc-type-card-title mt-3 font-display font-bold text-cream">
        {title}
      </h3>
      {description ? (
        <p className="nc-type-body-sm mt-1.5 max-w-xl text-subtle">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </IntellioCard>
  );
}
