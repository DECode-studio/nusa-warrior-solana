import React from "react";

export interface PublicContainerProps {
  readonly children: React.ReactNode;
  readonly size?: "narrow" | "standard" | "wide";
  readonly className?: string;
  readonly as?: "div" | "section" | "header" | "footer";
  readonly id?: string;
}

const SIZE_CLASSES: Record<
  NonNullable<PublicContainerProps["size"]>,
  string
> = {
  narrow: "nc-public-container--narrow",
  standard: "nc-public-container--standard",
  wide: "nc-public-container--wide",
};

export function PublicContainer({
  children,
  size = "wide",
  className = "",
  as: Component = "div",
  id,
}: PublicContainerProps): React.ReactElement {
  return (
    <Component
      id={id}
      className={`nc-public-container ${SIZE_CLASSES[size]} ${className}`}
    >
      {children}
    </Component>
  );
}
