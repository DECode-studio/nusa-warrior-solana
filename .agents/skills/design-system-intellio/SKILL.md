---
name: design-system-intellio
description: >
  Apply the Intellio design system when building or updating UI.
  Use when creating components, choosing colors or typography,
  or reviewing designs for marketing interfaces.
---

# Intellio — Design System Skill

## When to Use

- Building new UI components for Intellio.
- Reviewing or updating existing component styles.
- Choosing colors, typography, or spacing for marketing pages.
- Checking designs against the extracted token set.

## Context

- **Product:** Intellio — https://intellio-psi.vercel.app/
- **Surface:** marketing
- **Audience:** Business decision-makers and potential customers
- **Character:** Conversion-focused marketing presence with a rich, diverse color palette and 3 typefaces.

## Tokens

### Colors (Tailwind v4 Theme Tokens)

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

### Typography

**Font stack:** Rajdhani, Nunito Sans, Font Awesome 6 Pro

| Level | Size | Usage |
|-------|------|-------|
| text-xs | 13px | Captions, metadata |
| text-sm | 16px | Labels, secondary text |
| text-base | 18px | Body text (default) |
| text-lg | 20px | Subheadings, emphasis |
| text-xl | 50px | Section headings |
| text-2xl | 60px | Section headings |
| text-3xl | 66px | Section headings |
| text-4xl | 80px | Section headings |

**Weight scale:** 300 · 400 · 600 · 700 · 900
**Line heights:** 28px · 80px · 25.2px · 56px · 79.2px · 8px · 30px · 26px · 46px

### Spacing

**Base unit:** 4px

`space-1: 2px` · `space-2: 5px` · `space-3: 6px` · `space-4: 7px` · `space-5: 8px` · `space-6: 10px` · `space-7: 12px` · `space-8: 14px` · `space-9: 15px` · `space-10: 16px` · `space-11: 20px` · `space-12: 25px` · `space-13: 28px` · `space-14: 30px` · `space-15: 32px` · `space-16: 35px` · `space-17: 37px` · `space-18: 40px` · `space-19: 45px` · `space-20: 46px` · `space-21: 50px` · `space-22: 55px` · `space-23: 100px` · `space-24: 110px` · `space-25: 115px` · `space-26: 190px` · `space-27: 203px` · `space-28: 330px`

### Shapes

**Border radius:** `radius-sm: 40px` · `radius-full: 50%`

### Elevation

_None detected._

### Motion

- **duration-fast:** `all`
- **duration-fast:** `transform`
- **duration-fast:** `none`
- **duration-base:** `0.3s`
- **duration-slow:** `0.5s`
- **duration-slow:** `1.6s ease-in-out 1.6s infinite alternate forwards upDown`

## Component Inventory

- **Buttons:** 9 detected
- **Links:** 83 detected
- **Inputs:** 1 detected
- **Navigation:** 1 elements
- **Lists:** 27 detected
- **Forms:** 1 detected
- **Images:** 112 detected

## Constraints

### Always

- Use tokens from the tables above — do not introduce new values.
- Include hover, focus-visible, and disabled states for interactive elements.
- Follow the 4px spacing grid.
- Meet WCAG 2.2 AA contrast minimums.

### Never

- Do not introduce colors outside the extracted palette.
- Do not use arbitrary spacing values — stick to the scale.
- Do not mix border-radius values. Pin to the detected set (40px, 50%).
- Do not use full-uppercase text for body or paragraph content.
- Do not nest interactive elements (e.g. buttons inside links).
- Do not ship components without defining hover, focus-visible, and disabled states.

## Tone

Concise, confident, implementation-focused. Avoid filler preambles.

## Authoring Workflow

When creating or documenting a component for this system:

1. State intent — one sentence on purpose.
2. Map tokens — list every token the component uses.
3. Define anatomy — named parts with token assignments.
4. Specify states — default, hover, focus-visible, active, disabled, loading, error, empty.
5. Describe interactions — keyboard, pointer, touch, edge cases.
6. Add a11y criteria — testable pass/fail checks.
7. List anti-patterns — concrete misuse examples.
8. Close with the Definition of Done checklist.

## Output Structure

Component guidelines must contain, in order:

1. Overview (purpose, when to use, when not to use)
2. Tokens and foundations
3. Anatomy, variants, responsive behavior
4. States and interactions
5. Accessibility (ARIA, contrast, focus, screen reader)
6. Content guidelines (copy rules, tone)
7. Anti-patterns with reasoning

## Component Requirements

- Reference only tokens from the tables above.
- Define all states: default, hover, focus-visible, active, disabled, loading, error.
- Handle edge cases: empty, overflow, truncation, max content.
- Include keyboard navigation behavior.
- Document ARIA roles and labels.

## Definition of Done

- Default state renders (smoke test).
- All states visually verified.
- Zero hardcoded visual values — tokens only.
- Keyboard navigation works without pointer.
- No critical a11y violations.
- Tested at min and max breakpoint.
- At least one anti-pattern documented.
- Purpose, usage, and limitations documented.
