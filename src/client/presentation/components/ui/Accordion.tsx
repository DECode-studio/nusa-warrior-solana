"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface AccordionItemData {
  readonly id: string;
  readonly title: React.ReactNode;
  readonly content: React.ReactNode;
  readonly icon?: React.ReactNode;
}

export interface AccordionProps {
  readonly items: readonly AccordionItemData[];
  readonly openId?: string | null;
  readonly onToggle?: (id: string) => void;
  readonly className?: string;
}

export function Accordion({
  items,
  openId: controlledOpenId,
  onToggle: controlledOnToggle,
  className = "",
}: AccordionProps): React.ReactElement {
  const [internalOpenId, setInternalOpenId] = useState<string | null>(
    items[0]?.id ?? null
  );

  const activeId =
    controlledOpenId !== undefined ? controlledOpenId : internalOpenId;

  const handleToggle = (id: string): void => {
    if (controlledOnToggle) {
      controlledOnToggle(id);
    } else {
      setInternalOpenId((prev) => (prev === id ? null : id));
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item) => {
        const isOpen = activeId === item.id;
        return (
          <div
            key={item.id}
            className="overflow-hidden rounded-[var(--radius-card)] border border-border-base bg-surface transition-all duration-200"
          >
            <button
              type="button"
              onClick={() => handleToggle(item.id)}
              aria-expanded={isOpen}
              className="flex w-full min-w-0 items-center justify-between gap-3 p-5 text-left transition hover:bg-white/5 sm:p-6"
            >
              <div className="flex min-w-0 items-center gap-3 pr-1 sm:pr-4">
                {item.icon && (
                  <span className="shrink-0 text-primary">{item.icon}</span>
                )}
                <span className="min-w-0 break-words font-display text-base font-bold text-white sm:text-lg">
                  {item.title}
                </span>
              </div>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-primary transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>

            {isOpen && (
              <div className="border-t border-primary/15 px-5 pt-3 pb-5 text-sm leading-relaxed text-cream/80 sm:px-6 sm:pb-6">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

