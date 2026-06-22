# Textile Production Line Management System
## Frontend Design Guide — v1.0

---

## 1. Design Philosophy

This is a **factory instrument**, not a web app. Every design decision is judged against one question: *does this help a factory manager or supervisor make a faster, better-informed decision?* No hero sections, no marketing copy, no decoration that doesn't carry information.

The system has two fundamentally different modes of use:

- **The Admin** sits at a desk, manages the full picture — customers, products, assignments, reports. Desktop-first, data-dense, analytical.
- **The Supervisor** stands on the production floor with a tablet, often in motion, sometimes with dirty or gloved hands. Touch-first, large targets, single-task screens, immediate feedback.

These two modes need different interfaces, not just different breakpoints. Design them as separate experiences sharing a design system.

**Design Principle #1 — Numbers first.** Every screen's primary content is a number or a set of numbers. Typography, spacing, and color exist to make those numbers readable, comparable, and actionable. All decoration is subordinate to this.

**Design Principle #2 — Status at a glance.** A factory manager should be able to look at the dashboard for 5 seconds and know which lines are on track, which are falling behind, and where the problems are. Color carries operational meaning (green = on target, amber = warning, red = critical). Never use these colors decoratively.

**Design Principle #3 — Forgive entry errors.** Supervisors enter numbers every hour. The UI must make it easy to correct a mistaken entry without hunting through menus. Edit-in-place everywhere. Undo where possible. No "are you sure?" confirmation dialogs for normal edits.

**Design Principle #4 — Tablet-survivability.** The supervisor entry screen must work at 768px width, with touch targets no smaller than 48×48px, in bright factory lighting (high contrast), and with the keyboard visible (inputs must not be covered by the software keyboard — scroll the page, not the viewport).

---

## 2. Color System

### Palette

| Token | Hex | Name | Use |
|---|---|---|---|
| `--color-surface` | `#FAFAF9` | Greige | Page background (the color of undyed cotton fabric — not pure white, not cream) |
| `--color-surface-raised` | `#FFFFFF` | White | Cards, modals, sidebars |
| `--color-surface-sunken` | `#F1EEE9` | Raw Cotton | Table zebra rows, input backgrounds |
| `--color-brand` | `#0E5FA3` | Indigo | Primary CTA buttons, links, active nav items |
| `--color-brand-light` | `#E8F4FE` | Blueprint | Info backgrounds, selected states |
| `--color-brand-dark` | `#0A4578` | Deep Indigo | Button hover, pressed states |
| `--color-sidebar` | `#12202F` | Factory Night | Left sidebar background |
| `--color-sidebar-text` | `#A8B8C8` | Muted Steel | Inactive sidebar items |
| `--color-on-target` | `#10A661` | Loom Green | Lines meeting or exceeding target |
| `--color-warning` | `#E8A020` | Caution Amber | Lines 70–99% of target |
| `--color-critical` | `#DC3040` | Defect Red | Lines below 70%, high defect rates |
| `--color-on-target-bg` | `#EDFBF4` | Mint | Green status backgrounds |
| `--color-warning-bg` | `#FEF6E8` | Wheat | Amber status backgrounds |
| `--color-critical-bg` | `#FDEEF0` | Blush | Red status backgrounds |
| `--color-text-primary` | `#12202F` | Ink | Primary text |
| `--color-text-secondary` | `#4A5568` | Slate | Labels, secondary info |
| `--color-text-muted` | `#8896A7` | Cool Gray | Placeholders, timestamps |
| `--color-border` | `#DDD8D0` | Linen | Default borders |
| `--color-border-strong` | `#B8B0A5` | Thread | Emphasized borders, dividers |

### Status Color Rules (non-negotiable)

```
pct_of_target >= 100%  →  Loom Green (#10A661)
pct_of_target >= 70%   →  Caution Amber (#E8A020)
pct_of_target < 70%    →  Defect Red (#DC3040)
line.status = MAINTENANCE  →  Cool Gray (#8896A7)
```

These are the only rules for status coloring across the entire system. Never override them for stylistic reasons.

---

## 3. Typography

### Fonts

```
Display / UI:   IBM Plex Sans    (Google Fonts — weights 400, 500, 600)
Numbers / Data: IBM Plex Mono    (Google Fonts — weights 400, 500)
```

IBM Plex was designed for technical, data-forward interfaces. The Mono variant gives production counts and line numbers the quality of measurement-instrument readouts — precise, trustworthy, unambiguous. The pairing is distinctive in the world of factory management software, which defaults to Roboto or Arial.

### Type Scale

| Role | Font | Size | Weight | Line Height | Usage |
|---|---|---|---|---|---|
| `display-xl` | IBM Plex Mono | 48px | 500 | 1.0 | Hero KPI numbers on dashboard |
| `display-lg` | IBM Plex Mono | 32px | 500 | 1.1 | Per-line production counts |
| `display-md` | IBM Plex Mono | 24px | 400 | 1.2 | Hourly entry current value |
| `heading-lg` | IBM Plex Sans | 20px | 600 | 1.3 | Page titles |
| `heading-md` | IBM Plex Sans | 16px | 600 | 1.4 | Card headers, section titles |
| `heading-sm` | IBM Plex Sans | 13px | 600 | 1.4 | Table headers (ALL CAPS, 0.06em tracking) |
| `body` | IBM Plex Sans | 14px | 400 | 1.6 | General text, descriptions |
| `body-sm` | IBM Plex Sans | 13px | 400 | 1.5 | Secondary labels, metadata |
| `mono-lg` | IBM Plex Mono | 18px | 500 | 1.2 | Line assignment display |
| `mono-sm` | IBM Plex Mono | 13px | 400 | 1.4 | Table data cells (numbers), timestamps |

### Critical Rule: All production numbers use IBM Plex Mono
Every quantity — qty_produced, daily_target, pct_of_target, hourly counts — renders in IBM Plex Mono. This creates instant visual hierarchy between numbers (monospaced) and labels (proportional). It also ensures numbers align correctly in table columns without needing fixed widths.

---

## 4. Spacing & Layout

### Grid System

```
Desktop (≥1024px):
  sidebar: 240px fixed
  topbar: 56px fixed
  content: calc(100vw - 240px), max-width 1400px, padding 24px

Tablet (768px–1023px):
  sidebar: collapsed to 56px icon-only rail (or hidden, toggled by hamburger)
  content: full width, padding 16px

Mobile (<768px):
  Supervisor entry only — admin features redirect to desktop
  content: full width, padding 12px
```

### Spacing Scale (base-4)

```
4px   — xs: icon-label gap, badge padding
8px   — sm: input internal padding-x, list item gap
12px  — md: card internal padding, form row gap
16px  — lg: card padding, section internal spacing
24px  — xl: card-to-card gap, section separator
32px  — 2xl: page section gap
48px  — 3xl: hero section padding
```

---

## 5. Signature Element — The Live Line Monitor

This is the single most important UI element in the system. It lives at the top of the admin dashboard and on the supervisor's default view. It's inspired by industrial signal monitoring boards.

### Anatomy (per line cell)

```
┌─────────────────────────────────┐
│  L01  ·  Futbolka 415  ·  KIK4  │  ← Line ID (Mono) · Product · Customer
│                                 │
│  ████████████████░░░░░░  82%    │  ← Progress bar (fill = pct_of_target)
│                                 │
│  1,230 / 1,500                  │  ← Produced / Target (Mono, large)
│  ▲ 18/hr  ·  14 workers         │  ← Last hourly entry · Workforce
└─────────────────────────────────┘
  Border color = status color
```

### Progress Bar Behavior

- Width proportional to pct_of_target, capped at 100% visually
- Fill color = status color (green/amber/red)
- Background = sunken surface
- Animates on data refresh (smooth width transition, 600ms ease-out)
- If pct > 100%: bar shows full with a small overflow indicator (a chevron ❯ at right edge) — don't clip achievement silently

### Cell States

- **Active / On Target**: Green left border (4px), green fill bar
- **Active / Warning**: Amber left border, amber fill bar — gently pulses at 0.5 opacity twice when data updates
- **Active / Critical**: Red left border, red fill bar — static (no animation — animations are for attention, you already have it)
- **Maintenance**: Gray, all counts dimmed, "MAINTENANCE" badge
- **Idle** (no assignment): Gray border, dashed, "Assign a product →" CTA inside

### Grid Layout

```
16 lines: 4 columns × 4 rows
30 lines: 5 columns × 6 rows
```

Use CSS Grid, auto-fill with minmax(280px, 1fr). Cells collapse gracefully on smaller screens.

---

## 6. Component Library

### 6.1 Status Badge

```jsx
<StatusBadge status="on_target" value={92} />

// Renders: [ ● 92% ]
// Colors: background = --color-on-target-bg, text = --color-on-target
// Dot pulses once on mount when status = 'critical'
```

Sizes: `sm` (12px, inline in tables), `md` (13px, default), `lg` (14px, card headers)

### 6.2 Production Progress Bar

```jsx
<ProductionBar
  produced={1230}
  target={1500}
  showLabel         // shows "1,230 / 1,500" below
  showPercent       // shows "82%" at right
  animated          // smooth transition on value change
/>
```

Never use a circular/ring progress indicator for production — it's harder to compare quickly across many lines. Horizontal bars are always the right choice for this data type.

### 6.3 Hourly Entry Grid

The core supervisor interaction. One row of hour slots across the shift (H1–H8), each a large input cell.

```
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│  H1  │ │  H2  │ │  H3  │ │  H4  │ │  H5  │ │  H6  │ │  H7  │ │  H8  │
│ 130  │ │ 145  │ │ 122  │ │  —   │ │  —   │ │  —   │ │  —   │ │  —   │
└──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘
   ✓        ✓        ✓      active
```

Rules:
- Past hours: display value, tap to edit (enters inline edit mode)
- Current hour: large input, auto-focused on page load
- Future hours: grayed out, not interactive
- Min input size: 64×64px on tablet
- Keyboard: Enter confirms and advances to next hour (if available)
- Defects: secondary smaller input below each hour slot (initially collapsed, "Add defects" link expands it)

Running total appears as a live-updating banner below the grid:
`Total today: 397 / 1,500 (26%) — needs 183/hr to meet target`

This banner recomputes immediately on every keystroke in any hour slot.

### 6.4 KPI Cards (Dashboard only)

4-card strip below the Live Line Monitor:

```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Total Produced  │ │  Total Target   │ │  Active Lines   │ │  Defect Rate    │
│                 │ │                 │ │                 │ │                 │
│   24,830        │ │   32,000        │ │   26 / 28       │ │   1.2%          │
│   ▲ today       │ │   today         │ │   running       │ │   ▼ from yest.  │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

- Numbers in IBM Plex Mono 32px
- Labels in IBM Plex Sans 12px uppercase tracking
- Trend indicator (▲/▼) in colored text (green/red)
- Cards are non-interactive (display only) — no hover states
- Background: white, 1px border in --color-border

### 6.5 Data Tables

All tables use this structure:
- Header: IBM Plex Sans 11px, uppercase, 0.08em tracking, --color-text-secondary
- Numbers: IBM Plex Mono 13px, right-aligned within column
- Text cells: IBM Plex Sans 14px, left-aligned
- Row height: 48px (enough for comfortable scanning without wasted space)
- Zebra rows: --color-surface-sunken on odd rows (subtle, not the harsh gray common in Bootstrap tables)
- Sticky header: always — tables with more than 10 rows must have sticky `<thead>`
- Row hover: 2px left border in --color-brand appears on hover (not a full background change — subtler)
- Sort: click column header, sort indicator (↑/↓) appears in place of the tracking marks
- No horizontal scroll on critical columns (line name, product, produced, target, %) — other columns can hide on smaller screens

Columns that must always be visible (never hide, never ellipsis):
- `line_name`, `qty_produced`, `daily_target`, `pct_of_target`

### 6.6 Hourly Breakdown Chart

A bar chart visible in the line detail view. One bar per hour, height = qty_produced. A horizontal dashed line at the hourly target (daily_target ÷ 8). Bars colored by status. Defects shown as a darker hatched segment at the top of each bar.

Use Recharts (already available in your React env):
```jsx
<ComposedChart data={hourlyData}>
  <Bar dataKey="qty_produced" fill={statusColor} radius={[4,4,0,0]} />
  <Bar dataKey="qty_defect" fill="#DC3040" radius={[4,4,0,0]} stackId="a" opacity={0.6} />
  <ReferenceLine y={hourlyTarget} stroke="#8896A7" strokeDasharray="4 4" />
</ComposedChart>
```

### 6.7 Forms

Common fields pattern:
```
[Label, 12px Sans, uppercase, muted, 6px below]
[Input, 40px height, 14px Sans, border --color-border, focus ring 2px --color-brand]
[Helper text or error, 12px, below input, error in --color-critical]
```

Input validation:
- Show errors inline, below the field, not in a toast
- Error state: red border (--color-critical) + red helper text
- Success state: for the hourly entry only, show a brief green checkmark inline — no other form shows success states (saving is assumed to work, errors are surfaced)

### 6.8 Navigation Sidebar

```
┌────────────────────────┐
│  [Logo]  TextileOS     │  ← 56px topbar zone
├────────────────────────┤
│                        │
│  ● Dashboard           │  ← Active: white text, 3px left accent in --color-brand
│  ○ Production          │  ← Inactive: --color-sidebar-text
│    └ Lines             │  ← Sub-item (indented 16px)
│    └ Assignments       │
│  ○ Customers           │
│  ○ Products            │
│  ○ Reports             │  ← Section separator above this
│    └ Daily             │
│    └ Weekly            │
│    └ Customer          │
│    └ Efficiency        │
│  ○ Quality             │
│  ○ Stages              │
│                        │
├────────────────────────┤
│  ○ Users               │  ← Admin only (hidden for SUPERVISOR role)
│  ○ Settings            │
│  [Avatar] Wansa Admin  │  ← User info at bottom
└────────────────────────┘
```

Sidebar background: --color-sidebar (#12202F)
Sidebar width: 240px
Hover: slightly lighter background (rgba white 0.06)
Active: brand-blue left border (3px) + white text

Collapsible to 56px icon-only rail on tablet. Icons required for every nav item (use Lucide React — already in your deps).

---

## 7. Page Breakdown

### Page 1: Admin Dashboard (`/dashboard`)

**Purpose**: Full factory status at a glance.

**Layout**:
```
[Topbar: date selector, refresh indicator, notification bell]
[Live Line Monitor: full-width grid of all line cells]
[KPI Strip: 4 cards in a row]
[Two-column lower section:]
  [Left 60%: Today's Line Table — sortable, all lines]
  [Right 40%: Stage Summary — Cutting / Packing / Ironing totals]
[Quality Summary: horizontal bar cards per customer]
```

**Key behaviors**:
- Date selector defaults to today, allows looking back at any past date
- Refresh: polling every 5 minutes, with a "Last updated 2m ago" indicator. Manual refresh button.
- Line cells open a drawer (not a page navigation) on click — shows hourly breakdown chart + this line's history, without leaving the dashboard

### Page 2: Supervisor Entry (`/entry` or `/lines/:id/entry`)

**Purpose**: The single most-used screen in the system. Used 8× per shift per line.

**Layout** (tablet portrait optimized, 768px):
```
[Topbar: Line name (large), Product name, Customer, Date]
[Current Status Banner: Produced today / Target — big numbers]
[Hourly Entry Grid: 8 large cells across, current hour highlighted]
[Running Total Banner: live updates]
[Worker Count: simple ± buttons, large touch targets]
[Stage Inputs: Cutting / Packing / Ironing — three number inputs]
```

**Interaction rules**:
- Current hour input: auto-focuses on page load
- Tab key: moves to defect input for same hour, then to next hour
- After last hour (H8): Tab focuses the worker count
- Submitting an hour: green flash on the cell for 600ms, then settles
- Editing a past hour: tap the cell → becomes editable inline, shows "Editing H3" in the banner, saves on blur or Enter
- If the page loses focus for >30 minutes: show a "Still there?" prompt before re-submitting, to prevent accidental stale entries

### Page 3: Lines (`/lines`)

**Purpose**: Manage production lines and their current assignments.

**Layout**: Table of all lines with columns: Line, Branch, Status, Current Product, Customer, Assignment Start, Today's Progress. 
Actions: "Assign Product" button per row (opens modal), "Edit Line" button, "History" button (opens drawer).

**Assignment modal**:
- Dropdown: Customer → (loads products under that customer) → Product
- Daily target field (pre-fills from product.daily_target, editable)
- Start date (defaults today)
- Warning if the line already has an active assignment: "This will close the current assignment for [Product]. Continue?"

### Page 4: Customers & Products (`/customers`)

Two-panel layout:
- Left: Customer list (card-based, not table — includes count of active products and latest quality check)
- Right: Selected customer's products (expandable cards with order progress bar per product)

Product card shows:
- Order quantity, daily target
- Progress bar: total_produced_to_date / order_quantity
- Days remaining (due_date - today)
- Color-coded time pressure: green (on track), amber (<10 days left and <80% complete), red (overdue)

### Page 5: Reports (`/reports`)

Sub-navigation: Daily | Weekly | Customer | Line | Efficiency | Company

Each report tab:
- Date/range picker at top
- "Generate" button (reports are on-demand, not pre-loaded)
- Results in a data table
- Export button: CSV download (easy to implement, widely compatible with Excel — don't waste time on PDF for v1)

**Daily Report layout**:
```
[Factory Total Banner: total produced / total target / % / active lines / defect rate]
[Per-Line Table with columns: Line | Product | Customer | Target | Produced | % | Defects | Workers | Efficiency]
[Stage Summary: Cutting / Packing / Ironing totals]
[Quality Section: per customer pass rate]
```

**Weekly Report**: Same structure, numbers aggregated. Week selector (Mon–Sun). Small sparkline per line showing daily trend across the week (7 dots joined by a line — easy with Recharts).

### Page 6: Users (`/users`)

Simple table: Name | Username | Role | Assigned Line | Status | Actions.
Create/edit in a side drawer (not a separate page — keeps context).
Password reset sends a temp password (or just an admin-set field for now).

### Page 7: Quality (`/quality`)

Date picker + per-customer quality entry form.
Displays as a card grid: one card per customer showing pcs_checked, pcs_faults, pcs_ok, pass_rate_pct.
Pass rate shown as a large number with a colored indicator (green ≥95%, amber 85–94%, red <85%).

### Page 8: Stages (`/stages`)

Date picker + product selector + stage (Cutting/Packing/Ironing) entry.
Shows a summary table: rows = products, columns = Cutting / Packing / Ironing / Assembly (from hourly_production).
Gap analysis: visually shows where a product is bottlenecked (e.g. cutting far ahead of assembly).

---

## 8. Supervisor vs Admin Interface Differences

| Element | Admin | Supervisor |
|---|---|---|
| Sidebar | Full 240px | Collapsed to icons or hidden |
| Hourly input size | Standard 40px | 64px minimum touch targets |
| Navigation | Full | Only: Entry, My Line History |
| Reports | Full access | Own line only |
| Customer/Product management | Full CRUD | Read-only (can see what they're making) |
| Dashboard | Full factory view | Own line tile only, large |
| Font size (body) | 14px | 16px (easier in factory lighting) |

Role is set on login from `users.role`. A React context (`AuthContext`) holds the user object and the `isAdmin` boolean. Wrap protected components with a `<RequireAdmin>` gate.

---

## 9. Motion Design

Keep animation minimal and purposeful. Factory workers are not here for delight — they're here for speed.

**Permitted animations**:
- Production bar fill: `transition: width 600ms ease-out` on data update
- Status badge pulse: 2 pulses at 50% opacity when status changes to 'critical' (then stops — don't loop)
- Hour cell submission: background flashes to --color-on-target-bg for 600ms then fades (CSS keyframe)
- Page transitions: fade (opacity 0→1, 150ms) — not slide, not scale
- Drawer open/close: translate Y from below, 200ms ease-out
- Number counters: no (they look impressive but they delay reading the actual value — don't do it)

**Never animate**:
- Table rows appearing on sort
- Any animation that repeats without user interaction (except the line monitor's subtle pulse on critical — that's intentional)
- Anything that moves content around the page after load

**Reduced motion**: Wrap all transitions in `@media (prefers-reduced-motion: no-preference) { ... }`. Users who need this will be using your app on factory computers — respect the setting.

---

## 10. Implementation Guide

### Tech Stack

```
React 18 + TypeScript
Tailwind CSS v3 (utility-first, purge configured)
React Router v6 (BrowserRouter)
Axios (API calls, interceptors for auth headers)
React Query / TanStack Query (server state, caching, background refetch)
Recharts (production charts — already in your package.json)
Lucide React (icons — consistent, lightweight)
React Hook Form + Zod (forms — validation without re-renders)
```

### Project Structure

```
client/
├── src/
│   ├── api/              ← One file per resource (customers.ts, lines.ts, etc.)
│   ├── components/
│   │   ├── ui/           ← Generic: Button, Input, Badge, Card, Table, Modal, Drawer
│   │   ├── production/   ← Domain: LineCell, HourlyGrid, ProductionBar, KPICard
│   │   ├── reports/      ← Domain: DailyReport, WeeklyReport, CustomerReport
│   │   └── layout/       ← Sidebar, Topbar, AdminLayout, SupervisorLayout
│   ├── contexts/         ← AuthContext, ProductionContext
│   ├── hooks/            ← useLines, useProductionToday, useCurrentAssignment
│   ├── pages/            ← One file per route
│   ├── types/            ← TypeScript interfaces matching the DB schema
│   └── utils/            ← formatNumber, getStatusColor, dateHelpers
```

### Tailwind Config (key additions)

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        greige: '#FAFAF9',
        'raw-cotton': '#F1EEE9',
        'factory-night': '#12202F',
        indigo: { DEFAULT: '#0E5FA3', light: '#E8F4FE', dark: '#0A4578' },
        'loom-green': { DEFAULT: '#10A661', bg: '#EDFBF4' },
        amber: { DEFAULT: '#E8A020', bg: '#FEF6E8' },
        'defect-red': { DEFAULT: '#DC3040', bg: '#FDEEF0' },
        linen: '#DDD8D0',
        thread: '#B8B0A5',
        slate: '#4A5568',
        'cool-gray': '#8896A7',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
}
```

### React Query Setup (polling for live data)

```tsx
// hooks/useProductionToday.ts
export function useProductionToday(date: string) {
  return useQuery({
    queryKey: ['production', 'daily', date],
    queryFn: () => api.get(`/reports/daily?date=${date}`).then(r => r.data),
    refetchInterval: 5 * 60 * 1000,  // 5 minutes — matches the live monitor
    staleTime: 4 * 60 * 1000,
  });
}
```

### Status Color Utility (use this everywhere — never inline status colors)

```ts
// utils/statusColor.ts
export function getStatusColor(pct: number, lineStatus?: string) {
  if (lineStatus === 'MAINTENANCE') return { text: 'text-cool-gray', bg: 'bg-raw-cotton', border: 'border-cool-gray' };
  if (pct >= 100) return { text: 'text-loom-green', bg: 'bg-loom-green-bg', border: 'border-loom-green' };
  if (pct >= 70)  return { text: 'text-amber', bg: 'bg-amber-bg', border: 'border-amber' };
  return { text: 'text-defect-red', bg: 'bg-defect-red-bg', border: 'border-defect-red' };
}
```

### API Layer Pattern

```ts
// api/production.ts
import axios from './client';  // axios instance with JWT interceptor

export const productionAPI = {
  getHourly: (lineId: number, date: string) =>
    axios.get(`/production/hourly`, { params: { line_id: lineId, date } }),

  upsertHour: (data: HourlyEntry) =>
    axios.post(`/production/hourly`, data),

  getDailySummary: (date: string) =>
    axios.get(`/reports/daily`, { params: { date } }),
};
```

### JWT Auth Interceptor

```ts
// api/client.ts
const api = axios.create({ baseURL: process.env.REACT_APP_API_URL });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
```

---

## 11. Accessibility Checklist

- All color-coded status indicators also have a text label (never color-only communication)
- All icons used standalone (no visible text) have `aria-label`
- All interactive elements reachable by Tab, activated by Enter/Space
- Focus ring: 2px solid --color-brand, 2px offset — never `outline: none` without an alternative
- Table headers: proper `<th scope="col">` with sort state in `aria-sort`
- Live data updates: use `aria-live="polite"` on the running total banner
- Hourly entry grid: properly labeled with `aria-label="Hour 1 production count"`
- Form errors: linked to their input via `aria-describedby`

---

## 12. What to Build First (Suggested Sequence)

1. **Design system foundation**: Tailwind config, font import, color tokens, StatusBadge, ProductionBar components
2. **Layout shell**: Sidebar + Topbar + route structure, AuthContext, JWT interceptor
3. **Login page**: Simple, clean — username + password, role-aware redirect
4. **Supervisor Entry screen**: This is the highest-usage screen. Get it right first. HourlyGrid + running total banner + worker count.
5. **Live Line Monitor**: The dashboard hero. Query all lines + current assignments + today's production in one combined endpoint if possible.
6. **Dashboard KPI cards + daily table**
7. **Customers + Products pages** (CRUD)
8. **Lines + Assignments** (CRUD + assignment modal)
9. **Reports pages** (Daily → Weekly → Customer → Line → Efficiency)
10. **Quality + Stages entry**
11. **Users management** (admin only)
12. **Polish**: Error states, empty states, loading skeletons, print styles for reports

---

*End of Design Guide — v1.0*
