import React from "react";

export interface SectionHeadingProps {
  readonly title: React.ReactNode;
  readonly description?: React.ReactNode;
  readonly eyebrow?: React.ReactNode;
  readonly eyebrowId?: string;
  readonly titleId?: string;
  readonly as?: "h1" | "h2" | "h3";
  readonly size?: "page" | "section";
  readonly descriptionSize?: "body" | "body-sm";
  readonly align?: "left" | "center";
  readonly className?: string;
  readonly titleClassName?: string;
  readonly descriptionClassName?: string;
}

export function SectionHeading({
  title,
  description,
  eyebrow,
  eyebrowId,
  titleId,
  as: Heading = "h2",
  size = "section",
  descriptionSize = "body-sm",
  align = "left",
  className = "",
  titleClassName = "",
  descriptionClassName = "",
}: SectionHeadingProps): React.ReactElement {
  const alignment = align === "center" ? "mx-auto text-center" : "text-left";

  return (
    <div className={`${alignment} ${className}`}>
      {eyebrow ? (
        <div
          id={eyebrowId}
          className="mb-3 inline-flex max-w-full items-center gap-2 rounded-full border border-border-base bg-surface-muted px-3.5 py-1.5 font-display text-xs font-bold tracking-[0.12em] text-primary-light"
        >
          {eyebrow}
        </div>
      ) : null}
      <Heading
        id={titleId}
        className={`nc-type-${size}-title font-display font-bold text-white ${titleClassName}`}
      >
        {title}
      </Heading>
      {description ? (
        <p
          className={`nc-type-${descriptionSize} mt-3 max-w-3xl text-muted/80 ${align === "center" ? "mx-auto" : ""} ${descriptionClassName}`}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
