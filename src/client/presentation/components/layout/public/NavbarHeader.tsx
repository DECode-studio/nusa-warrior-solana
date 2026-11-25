import React from "react";
import type { SupportedLocale } from "@/core/constants/routes";
import { IntellioNavbar, type IntellioNavbarProps } from "./IntellioNavbar";

export interface NavbarHeaderProps extends IntellioNavbarProps {
  readonly locale?: SupportedLocale;
}

export function NavbarHeader(props: NavbarHeaderProps): React.ReactElement {
  return <IntellioNavbar {...props} />;
}

