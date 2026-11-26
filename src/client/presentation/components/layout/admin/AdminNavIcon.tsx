"use client";

import React from "react";
import {
  LayoutDashboard,
  Users,
  Users2,
  ShieldCheck,
  Layers,
  Mail,
  Settings,
  CreditCard,
  BookOpen,
  Globe,
} from "lucide-react";

interface AdminNavIconProps {
  name: string;
  className?: string;
}

export function AdminNavIcon({
  name,
  className = "h-5 w-5",
}: AdminNavIconProps): React.ReactElement {
  switch (name) {
    case "LayoutDashboard":
    case "dashboard":
      return <LayoutDashboard className={className} aria-hidden="true" />;
    case "Users":
    case "users":
      return <Users className={className} aria-hidden="true" />;
    case "Users2":
    case "team":
      return <Users2 className={className} aria-hidden="true" />;
    case "ShieldCheck":
      return <ShieldCheck className={className} aria-hidden="true" />;
    case "Mail":
    case "contact":
      return <Mail className={className} aria-hidden="true" />;
    case "Settings":
    case "settings":
      return <Settings className={className} aria-hidden="true" />;
    case "CreditCard":
      return <CreditCard className={className} aria-hidden="true" />;
    case "BookOpen":
      return <BookOpen className={className} aria-hidden="true" />;
    case "Globe":
      return <Globe className={className} aria-hidden="true" />;
    case "Layers":
    case "cards":
    default:
      return <Layers className={className} aria-hidden="true" />;
  }
}

