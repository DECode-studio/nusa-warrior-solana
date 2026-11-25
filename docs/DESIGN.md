# Intellio

## Overview

**Product:** Intellio
**URL:** https://intellio-psi.vercel.app/
**Surface type:** marketing
**Audience:** Business decision-makers and potential customers
**Brand character:** Conversion-focused marketing presence with a rich, diverse color palette and 3 typefaces.

### Design Principles

- Consistency over novelty — reuse existing patterns before inventing new ones.
- Token-driven — every visual decision references a token, not a magic number.
- Accessible by default — compliance is a baseline, not a feature.

## Colors (Tailwind v4 Theme Tokens)

Every visual style must reference the semantic tokens defined in `@theme` inside `src/app/globals.css`. Never use arbitrary hex codes (e.g. `bg-[#0F0927]`, `text-[#6766FF]`).

| Token Class | Variable | Value | Role / Usage |
|-------------|----------|-------|--------------|
| `primary` | `--color-primary` | `#6766FF` | Primary Brand, focus rings, interactive accents |
| `primary-solid` / `primary-hover` | `--color-primary-solid` | `#5856F2` | Primary button backgrounds, active hover states |
| `primary-light` | `--color-primary-light` | `#A9A8FF` | Lavender text accents, badge foregrounds, icons |
| `amber` | `--color-amber` | `#FF9F31` | Amber accent, gold rarity, warnings, highlights |
| `amber-light` | `--color-amber-light` | `#FFBD70` | Amber badge text, subtle highlights |
| `amber-hover` | `--color-amber-hover` | `#F69408` | Amber button hover state |
| `emerald` | `--color-emerald` | `#0DB561` | Emerald accent, success state, nature elements, HP |
| `emerald-light` | `--color-emerald-light` | `#46D995` | Emerald badge text, positive indicators |
| `emerald-hover` | `--color-emerald-hover` | `#37B884` | Emerald button hover state |
| `cyan` | `--color-cyan` | `#00F0FF` | Tech / sci-fi highlight accent |
| `danger` | `--color-danger` | `#EF4444` | Errors, destruction, combat damage |
| `danger-light` | `--color-danger-light` | `#FF8F8F` | Error badge text, alert captions |
| `surface-base` | `--color-surface-base` | `#080220` | Canvas base background |
| `surface` | `--color-surface` | `#07011F` | Default container / section surface |
| `surface-elevated` | `--color-surface-elevated` | `#0F0927` | Elevated cards, modals, popovers, dropdowns |
| `surface-muted` | `--color-surface-muted` | `rgba(18, 11, 48, 0.7)` | Semi-transparent badges, secondary panels |
| `fg` | `--color-fg` | `#FFFFFF` | Default high-contrast foreground text |
| `cream` | `--color-cream` | `#F8F5F0` | Warm light text, input labels, headings |
| `muted` | `--color-muted` | `#CFCBE2` | Secondary body text, descriptions, footnotes |
| `subtle` | `--color-subtle` | `#A5A1B9` | Timestamps, inactive text, metadata |
| `border-subtle` | `--color-border-subtle` | `rgba(103, 102, 255, 0.18)` | Subtle separators, table borders |
| `border-base` | `--color-border-base` | `rgba(103, 102, 255, 0.28)` | Default card & container borders |
| `border-strong` | `--color-border-strong` | `rgba(103, 102, 255, 0.55)` | Active borders, hover glows, focus indicators |

## Typography

**Font stack:** Rajdhani, Nunito Sans, Font Awesome 6 Pro

| Level | Size | Usage |
|-------|------|-------|
| text-xs | 12px | Dense metadata |
| text-sm | 14px | Labels, supporting text |
| text-base | 16px | Body text |
| text-lg | 18px | Emphasis, card headings |
| text-xl | 20px | Compact headings |
| text-2xl | 24px | Section headings |
| text-3xl | 30px | Large section headings |
| text-4xl | 36px | Page headings |
| nc-type-display | 40–64px | Hero headline |

**Weight scale:** 300 · 400 · 600 · 700 · 900
**Line heights:** body copy 1.6–1.65 · card headings 1.35 · page and section headings 1.12–1.2 · hero 1.04

## Spacing

**Base unit:** 4px

Use the Tailwind spacing scale in 4px increments: `1: 4px`, `2: 8px`, `3: 12px`, `4: 16px`, `6: 24px`, `8: 32px`, `12: 48px`, `16: 64px`, and `20: 80px`. Use semantic public layout classes for section rhythm and content width.

## Shapes

**Border radius:** `radius-control: 12px` · `radius-card: 20px` · `radius-sm: 40px` (pill controls) · `radius-full: 9999px` / circular elements

## Elevation

_None detected._

## Motion

- **duration-fast:** `all`
- **duration-fast:** `transform`
- **duration-fast:** `none`
- **duration-base:** `0.3s`
- **duration-slow:** `0.5s`
- **duration-slow:** `1.6s ease-in-out 1.6s infinite alternate forwards upDown`

## Components

- **Buttons:** 9 detected
- **Links:** 83 detected
- **Inputs:** 1 detected
- **Navigation:** 1 elements
- **Lists:** 27 detected
- **Forms:** 1 detected
- **Images:** 112 detected

## Do's and Don'ts

### Do

- Reference tokens by name, not raw values — agents and developers should use `color.text.primary`, not `#171717`.
- Define all interactive states: default, hover, focus-visible, active, disabled.
- Use the spacing scale for all padding, margin, and gap values.
- Write content in sentence case. Reserve ALL CAPS for acronyms only.
- Test every component at the smallest and largest breakpoint before shipping.

### Don't

- Do not introduce colors outside the extracted palette.
- Do not use arbitrary spacing values — stick to the scale.
- Do not mix border-radius values. Pin to the detected set (40px, 50%).
- Do not use full-uppercase text for body or paragraph content.
- Do not nest interactive elements (e.g. buttons inside links).
- Do not ship components without defining hover, focus-visible, and disabled states.

## Writing Tone

Concise, confident, implementation-focused. Avoid filler preambles.

## Authoring Workflow

When creating or updating a component guideline for this system, follow this sequence:

1. **State the intent** — one sentence on what the component does and why it exists.
2. **Map tokens** — list every color, spacing, typography, and radius token the component uses. No raw values.
3. **Define anatomy** — break the component into named parts (container, label, icon, etc.) with their token assignments.
4. **Specify states** — document every state: default, hover, focus-visible, active, disabled, loading, error, empty.
5. **Describe interactions** — keyboard, pointer, and touch behavior, including edge cases (long content, overflow, truncation).
6. **Add accessibility criteria** — write testable pass/fail checks (e.g. "focus ring must be visible at 3:1 contrast").
7. **List anti-patterns** — concrete examples of misuse with a brief explanation of why each is wrong.
8. **Close with a QA checklist** — a mechanical list of verifiable items (see Definition of Done below).

## Required Output Structure

Every component guideline produced from this system must contain these sections, in order:

1. Overview — purpose, when to use, when not to use.
2. Tokens and foundations — all referenced tokens from the tables above.
3. Anatomy and variants — named parts, variant matrix, responsive behavior.
4. States and interactions — full state table, keyboard/pointer/touch behavior.
5. Accessibility — ARIA attributes, contrast requirements, focus management, screen reader behavior.
6. Content guidelines — copy length, tone, capitalisation, placeholder text rules.
7. Anti-patterns — explicit examples of what not to build, with reasoning.

## Component Requirements

Every component built against this system must:

- Reference only tokens defined in the tables above — no hardcoded hex, px, or font values.
- Define all interactive states: default, hover, focus-visible, active, disabled, loading, error.
- Specify responsive behavior at the smallest and largest supported breakpoint.
- Handle edge cases: empty state, overflow / truncation, maximum content length.
- Include keyboard navigation (Tab, Enter, Escape, Arrow keys where applicable).
- Document ARIA roles, labels, and live-region behavior where relevant.
- Include known page component density: - **Buttons:** 9 detected
- **Links:** 83 detected
- **Inputs:** 1 detected
- **Navigation:** 1 elements
- **Lists:** 27 detected
- **Forms:** 1 detected
- **Images:** 112 detected

## Definition of Done

A component is not complete until every item below is checked:

- Renders correctly in its default state (smoke test).
- All states documented and visually verified (hover, focus, disabled, loading, error, empty).
- All visual values use design tokens — zero hardcoded values.
- Keyboard navigation works without a pointer.
- No critical accessibility violations (contrast, ARIA, focus order).
- Tested at smallest and largest breakpoint.
- Anti-patterns section lists at least one concrete misuse example.
- Documentation covers purpose, usage, props/API, and limitations.
