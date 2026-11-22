# AmirtexOS — Frontend Design Guide

> **Implementation lives in [`client/src/design.ts`](client/src/design.ts).**
> This document explains *why* the interface looks the way it does. It deliberately
> contains **no colour, font, size, or threshold values** — those exist once, in
> `design.ts`. If this guide and the code ever disagree, the code wins.

---

## 1. Design philosophy

This is a **factory instrument**, not a marketing site. Every decision is judged
against one question: *does this help a manager or supervisor make a faster,
better-informed decision?* Decoration that carries no information is removed.

Two modes of use share one system:

- **Admin** — desktop, analytical, whole-factory view: customers, products,
  assignments, reports.
- **Supervisor** — tablet on the floor, in motion, gloved hands: touch-first,
  large targets, one task per screen, immediate feedback.

### Principles

1. **Numbers first.** The primary content of every screen is a number. Type,
   spacing and colour exist to make numbers readable and comparable.
2. **Status at a glance.** Five seconds on the dashboard must reveal what is on
   track, what is at risk, and what is behind. Status colour is operational
   meaning, never decoration.
3. **Forgive entry errors.** Numbers are entered hourly by hand. Edit in place,
   keep corrections cheap, avoid confirmation dialogs for ordinary edits.
4. **Tablet survivability.** The supervisor flow must work at tablet widths, in
   bright light, with the software keyboard open.

---

## 2. The single source of truth

`client/src/design.ts` exports everything:

| Export | What it owns |
|---|---|
| `colors`, `fonts`, `radius`, `shadows` | The palette, typefaces, corners and elevation |
| `thresholds`, `tones`, `toneFor`, `statusFor`, `qualityTone` | Every status rule in the app |
| `chart` | Recharts palette, grid, axes, tooltips, bar radius |
| `button`, `field`, `card`, `modal`, `badge`, `toast`, `table`, `segmented` | Reusable component styles |
| `page`, `layout`, `auth` | Page headers, sidebar shell, login composition |
| `skeleton`, `spinner` | Loading states |
| `designCss` | Generated `@theme` tokens, base styles and keyframes |

The Vite plugin `amirtex-design-system` in `client/vite.config.ts`:

1. Replaces `src/index.css` with `designCss` at build time, and
2. Injects the Google Fonts `<link>` tags from `fonts.googleHref`.

`src/index.css` is an intentionally empty stub and `client/index.html` contains no
font links. **Never edit those two files to change design.**

### How components consume it

```tsx
import { page, table, tones, statusFor } from '../../design';

<div className={page.shell}>
  <h1 className={page.title}>Production Lines</h1>
  <span className={statusFor(pct).text}>{pct}%</span>
</div>
```

Rules:

- Import a preset instead of retyping Tailwind classes.
- Never write a hex value in a component. If a colour is missing, add it to
  `colors` and regenerate the theme.
- Never compare a percentage to a literal. Call `statusFor(pct, lineStatus)` or
  `qualityTone(rate)`.
- Keep class names as complete literal strings inside `design.ts` so Tailwind's
  scanner can see them.

### Legacy token aliases

`designCss` maps the old names (`brand`, `loom-green`, `caution-amber`,
`defect-red`, `factory-night`, `greige`, `linen`, `cool-gray`, `slate`, …) onto
the current palette. Old class names therefore keep working, but new code should
use the canonical names.

---

## 3. Visual language

- **Canvas and ink.** A warm off-white page, near-black text, and paper-coloured
  cards. The interface reads like a printed production report, not a SaaS demo.
- **One accent.** A single lime accent marks the number that matters and the one
  primary action. Everything else is neutral.
- **Red means risk only.** Amber means at risk. Neither is ever used for
  decoration, branding, or emphasis.
- **Three typefaces with three jobs.** A grotesque for UI, a serif for headlines
  and hero figures, a monospaced face for anything measured. Do not mix jobs.
- **Rules instead of boxes.** Tables use hairline rules and whitespace; cards are
  reserved for genuinely contained objects.
- **Broken grid.** The dashboard opens with a dark hero that spans the width,
  then deliberately steps down into a narrow focus column and a quiet stat row —
  not a uniform card grid.
- **Motion is feedback.** Animation confirms an entry or a status change; it is
  never ambient. Reduced-motion users get none of it.

---

## 4. Status semantics

There are exactly three operational states plus two neutral ones:

| State | Meaning | Where it comes from |
|---|---|---|
| On target | At or above the daily target | `toneFor` |
| At risk | Behind, but recoverable | `toneFor` |
| Behind | Materially short of target | `toneFor` |
| Unassigned | No product or no target | `toneFor` |
| Maintenance | Line deliberately stopped | `toneFor` (line status) |

Quality uses its own two cut-offs via `qualityTone`. The numbers behind every
state are in `thresholds`; never restate them in a page.

Each tone exposes `label`, `text`, `dot`, `fill`, `soft` and `border`, so the same
state renders consistently as text, a dot, a bar fill, a soft panel, or a border.

---

## 5. Component conventions

- **Button** — `primary` for the single main action, `outline`/`secondary` for
  supporting actions, `ghost` for row-level actions, `danger` only for
  destructive ones.
- **Card** — optional header and footer; `padding="none"` when the child is a
  full-bleed table.
- **Field** — label above, error below, helper text only when there is no error.
  Compact variant for in-grid numeric entry.
- **Badge** — status pill with an optional dot; sizes `sm`/`md`/`lg`.
- **Modal** — overlay plus panel; closes on Escape and backdrop click; sizes
  `sm`/`md`/`lg`.
- **Toast** — transient confirmation in the bottom-right; one message, one icon.
- **Table** — hairline header, hover row, right-aligned tabular numerics.
- **Page** — every route starts with `page.shell` and a `page.header` containing
  a title, a one-line subtitle and at most one date control.

---

## 6. Page recipes

### Dashboard
Problem-stating serif headline → dark hero with the largest number and the
hourly chart → “Today’s focus” panel → quiet stat row → shift runway → urgency-
sorted line table → plain branch / quality / stage lists. Filters are pills; the
table is sorted by need, not by line number.

### Hourly entry
Line tabs, then a single horizontally scrollable grid: sticky line/customer/style
columns on the left, twelve hour cells in the middle, sticky total and variance on
the right. Arrow keys and Enter move between cells. A running-total banner states
how many units per hour are still needed.

### Admin CRUD pages
Header with one primary action, then a single table in a card. Deactivation is a
ghost action in the risk colour. Empty and loading states are distinct.

### Login
Split screen: a dark brand panel stating what the system does, and a quiet form
card. No marketing illustration.

---

## 7. Checklist before shipping a UI change

1. No hex values, font names, radii or shadows in the component.
2. No percentage compared against a literal — use the status helpers.
3. New styles added to `design.ts`, not to JSX.
4. `src/index.css` and `client/index.html` untouched.
5. `npm run build` passes in `client/`.
6. Checked at desktop and tablet widths, with reduced motion enabled.
