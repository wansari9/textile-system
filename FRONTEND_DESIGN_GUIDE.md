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

- **Admin** — desktop, analytical, whole-factory view: customers, orders,
  assignments, reports.
- **Line manager** — tablet on the floor, in motion, gloved hands: touch-first,
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

A line **score** is attainment capped at 100 (`produced ÷ target × 100`). Render
it as a percentage next to the line; leave it blank rather than showing 0 when
there is no target.

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
  The wrapper scrolls horizontally (`overflow-x-auto`); the table itself is
  `w-full min-w-max` and cells are `whitespace-nowrap`, so wide reports scroll
  instead of clipping figures. Missing values render as `—`.
- **Page** — every route starts with `page.shell` (`w-full min-w-0`) and a
  `page.header` containing a title, a one-line subtitle and at most one date
  control. Tab strips scroll horizontally. Multi-column form grids collapse to
  one column below `sm`.

---

## 6. Page recipes

### Dashboard
Problem-stating serif headline → dark hero with the largest number and the
hourly chart → “Today’s focus” panel → quiet stat row → shift runway → four tabs
(Customers, Orders, Branches, Lines). One overview request feeds every tab; the
line table is sorted by urgency (need first, line number last) and shows each
line’s score. Filters are pills.

### Orders
The order list is the admin’s home for customer work: order number, product,
customer, gender, quantity, daily target, progress and status in one table. The
primary action opens a **combined** modal — pick an existing customer or type a
new one inline, then enter the order details in the same submit. Editing reuses
the same form; cancelling is a ghost action in the risk colour. Customers are
accounts only, so their order history is read-only and points back here.

### Daily production
Five tabs, one per stage: Cutting, Stitching, Ironing, Packing, Quality. Cutting
is a grid of active orders × cutting lines (Cutting 1/2/3) so each line saves
independently. Stitching summarises sewing lines with produced/target/score and
links to hourly entry. Ironing and Packing are one daily total per order. Quality
embeds the same form as `/quality`, so the pass-rate gauge behaves identically.

### Hourly entry
Admins can open Hourly Entry from the sidebar and switch lines; a line manager
sees only their assigned line and the nav collapses to that single task. Line
tabs, then a single horizontally scrollable grid: sticky line/customer/style
columns on the left, twelve hour cells in the middle, sticky total and variance on
the right. Arrow keys and Enter move between cells. A running-total banner states
how many units per hour are still needed.

### Admin CRUD pages
Header with one primary action, then a single table in a card. Deactivation is a
ghost action in the risk colour. Empty and loading states are distinct. The Users
page shows every assigned line in the table and uses an “Assigned Lines”
checklist in the form, because one line manager can own several lines.

### Reports
Tabs for Daily, Weekly, Monthly, All Companies and Orders. Order and Gender are
always visible columns on the Daily, Weekly, Monthly and Orders tabs. Monthly has
its own month picker and aggregates produced, faults, monthly target and
efficiency per line/order. A column header that can be sorted looks and behaves
like a button and shows the current direction; sorting is server-side, so the
page only sends the whitelisted key and direction. Sort state belongs to the tab
and survives date changes. The Orders tab opens sorted by order number ascending,
so the newest generated order numbers stay predictable; clicking Order # toggles
the direction. CSV export stays available on every tab. Reports tolerate a legacy
database: absent view columns come back as `NULL` and render as `—`, and dates are
returned as plain text so a timezone cannot shift them.

### Order lifecycle
1. **Create** on `/orders`: choose an existing customer or type a new one inline,
   then enter order number (optional), product/style, gender, quantity, daily
   target and dates. One submit creates the customer and the order together.
2. **Assign** on `/lines`: pick a sewing line and a daily target. The previous
   active assignment on that line is closed automatically; the order moves from
   `PENDING` to `ACTIVE`.
3. **Enter hourly output** on `/entry` for one of the assigned sewing lines; the
   line manager sees only their own lines (a manager may own several), and admins
   can enter any line.
4. **Record stages** on `/stages`: cutting per cutting line, ironing and packing
   per order, and quality in the embedded form.
5. **Report** on `/reports`: the order appears in Daily/Weekly (once hourly data
   exists) and in the Orders tab regardless of production. Sort by Order # in
   either direction and change the report date without losing that choice.

### Login
Split screen: a dark brand panel stating what the system does, and a quiet form
card. The password field has an eye toggle so the user can check what they typed;
it flips between `password` and `text` and exposes `aria-pressed` for assistive
technology. No marketing illustration. Failed logins show the server’s message;
the role decides the landing page (`/` for admins, `/entry` for line managers).

---

## 7. Checklist before shipping a UI change

1. No hex values, font names, radii or shadows in the component.
2. No percentage compared against a literal — use the status helpers.
3. New styles added to `design.ts`, not to JSX.
4. `src/index.css` and `client/index.html` untouched.
5. `npm run build` passes in `client/`.
6. Checked at desktop and tablet widths, with reduced motion enabled.
7. Sortable table headers send only server-whitelisted `sort` keys; never sort
   report data client-side or trust a free-form column name.
