"use client";

import React from "react";
import {
  BookOpen,
  Gavel,
  GraduationCap,
  Layers,
  LayoutDashboard,
  ShoppingBag,
  ReceiptText,
  Swords,
  Sparkles,
} from "lucide-react";

export interface UserNavIconProps {
  readonly name: string;
  readonly className?: string;
}

export function UserNavIcon({
  name,
  className = "h-5 w-5",
}: UserNavIconProps): React.ReactElement {
  switch (name) {
    case "BookOpen":
      return <BookOpen className={className} />;
    case "LayoutDashboard":
      return <LayoutDashboard className={className} />;
    case "GraduationCap":
      return <GraduationCap className={className} />;
    case "Swords":
      return <Swords className={className} />;
    case "Layers":
      return <Layers className={className} />;
    case "ShoppingBag":
      return <ShoppingBag className={className} />;
    case "Gavel":
      return <Gavel className={className} />;
    case "ReceiptText":
      return <ReceiptText className={className} />;
    case "Sparkles":
      return <Sparkles className={className} />;
    default:
      return <LayoutDashboard className={className} />;
  }
}

