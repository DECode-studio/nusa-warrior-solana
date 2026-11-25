import React from "react";
import { Inbox } from "lucide-react";

export interface EmptyStateProps {
  readonly icon?: React.ReactNode;
  readonly title: string;
  readonly description?: string;
  readonly action?: React.ReactNode;
  readonly className?: string;
  readonly id?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
  id,
}: EmptyStateProps): React.ReactElement {
  return (
    <div
      id={id}
      className={`flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-border-base bg-surface p-6 text-center sm:p-8 ${className}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/35 bg-primary/15 text-primary">
        {icon || <Inbox className="h-7 w-7" aria-hidden="true" />}
      </div>

      <h3 className="nc-type-section-title mt-4 font-display font-bold text-white">
        {title}
      </h3>

      {description && (
        <p className="nc-type-body-sm mt-2 max-w-md text-cream/75">
          {description}
        </p>
      )}

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

