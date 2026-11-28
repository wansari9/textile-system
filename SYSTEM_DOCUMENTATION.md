# AmirtexOS — System Documentation

> **Textile Production Line Management System**
> Full codebase reference: architecture, database, API, frontend, and file map.

**Last scanned:** 2026-11-26
**Repo root:** `textile-system/`
**Purpose:** A production management system for textile factories - hourly line production, workforce, cutting/stitching/ironing/packing stages, quality control, branches, customers, orders with gender and line scores, users, and reporting.

---

## Table of Contents

1. [Find It Fast](#1-find-it-fast)
2. [System Overview](#2-system-overview)
3. [Tech Stack](#3-tech-stack)
4. [Repository Map](#4-repository-map)
5. [Architecture & Request Flow](#5-architecture--request-flow)
6. [Database](#6-database)
7. [Backend (server/)](#7-backend-server)
8. [API Reference](#8-api-reference)
9. [Frontend (client/)](#9-frontend-client)
10. [Design System](#10-design-system)
11. [Business Flows](#11-business-flows)
12. [Environment & Setup](#12-environment--setup)
13. [Common Tasks / How to Extend](#13-common-tasks--how-to-extend)
14. [Known Issues & Gotchas](#14-known-issues--gotchas)
15. [Complete File Index](#15-complete-file-index)

---

## 1. Find It Fast

| I want to… | Go to |
|---|---|
| Change the database schema | [`ai_studio_code.sql`](ai_studio_code.sql) — the single setup file (tables, views, triggers, compatibility block) |
| Add/modify an API endpoint | [`server/src/routes/`](server/src/routes/) (most routes contain logic inline) |
| Change server startup / mount a route | [`server/src/index.ts`](server/src/index.ts) |
| Change DB connection | [`server/src/config/db.ts`](server/src/config/db.ts) + [`server/.env`](server/.env) |
| Change login/JWT logic | [`server/src/controllers/authController.ts`](server/src/controllers/authController.ts), [`server/src/middleware/auth.ts`](server/src/middleware/auth.ts) |
| Seed default data | [`server/src/seed.ts`](server/src/seed.ts) |
| Add a frontend page | [`client/src/pages/`](client/src/pages/) + [`client/src/App.tsx`](client/src/App.tsx) |
| Change sidebar/navigation/roles | [`client/src/layouts/MainLayout.tsx`](client/src/layouts/MainLayout.tsx) |
| Change API calls from the UI | [`client/src/api/`](client/src/api/) |
| Change the HTTP client / auth header | [`client/src/lib/client.ts`](client/src/lib/client.ts) |
| Change colors, fonts, design tokens | [`client/src/design.ts`](client/src/design.ts) — the only design source |
| See UI/UX rules and page recipes | [`FRONTEND_DESIGN_GUIDE.md`](FRONTEND_DESIGN_GUIDE.md) |
| Reuse a button/card/modal/input | [`client/src/components/ui/`](client/src/components/ui/) |
| Work on the hourly entry grid | [`client/src/components/HourlyGrid.tsx`](client/src/components/HourlyGrid.tsx) + [`client/src/pages/supervisor/HourlyEntry.tsx`](client/src/pages/supervisor/HourlyEntry.tsx) |
| Work on dashboard charts | [`client/src/pages/admin/Dashboard.tsx`](client/src/pages/admin/Dashboard.tsx) |
| See SQL reporting views | [`ai_studio_code.sql`](ai_studio_code.sql) lines ~168–286 |
| Set up the project from scratch | [`SETUP.md`](SETUP.md) |
| See build progress / task history | [`todo.md`](todo.md) |
| See UI/UX rules | [`FRONTEND_DESIGN_GUIDE.md`](FRONTEND_DESIGN_GUIDE.md) |
---

## 2. System Overview

**AmirtexOS** tracks a textile factory's production in near real time.

Core concepts:

- **Branch** — a factory site (`Main Factory`, satellites).
- **Production Line** — belongs to a branch; `line_type` is `SEWING` or `CUTTING`. Sewing lines run one active order at a time; cutting lines record daily cutting output.
- **Customer** — the buyer account.
- **Order** — stored in `products`: one row is one customer order with `order_no`, `order_date`, `gender`, `order_quantity` and `daily_target`. The UI calls these rows **Orders**.
- **Line Assignment** — links a sewing line to an order with a daily target and date range. A line has at most **one active assignment**; a DB trigger auto-closes the previous one.
- **Hourly Production** — per line, per date, per hour (1–12): produced qty and defects.
- **Daily Workforce** — per line, per date: workers required, present, free-text notes.
- **Process Stages** — daily Cutting (per cutting line) / Stitching / Ironing / Packing quantities per order.
- **Quality Checks** — daily pieces checked and faults per customer.
- **Branch Daily Production** — branch-level target vs produced (separate from line-level hourly data).
- **Line score** — `min(100, produced ÷ target × 100)` per line and day; blank when no target.
- **Reports** — SQL views aggregate daily/weekly/monthly/company/line/efficiency/quality/order data.

Two user roles:

| Role | Access |
|---|---|
| `ADMIN` | Everything: dashboard, orders, lines, daily production, quality, customers, branches, reports, users |
| `LINE_MANAGER` | Hourly Entry for any of their assigned lines (legacy `SUPERVISOR` accounts still work) |

Authentication is enforced on every router. Admin routers require `requireRole('ADMIN')`; hourly production and workforce entry are line-scoped for line managers. See [§7.3 Auth](#73-auth).

---

## 3. Tech Stack

### Frontend (`client/`)

| Package | Version | Use |
|---|---|---|
| React | ^19.2.6 | UI |
| React DOM | ^19.2.6 | Rendering |
| React Router DOM | ^7.18.0 | Client-side routing |
| Vite | ^8.0.12 | Dev server / build |
| TypeScript | ~6.0.2 | Types |
| Tailwind CSS | ^4.3.1 | Styling (via `@tailwindcss/vite`) |
| Axios | ^1.18.0 | HTTP client |
| Recharts | ^3.8.1 | Dashboard charts |
| Lucide React | ^1.21.0 | Icons |

Fonts: **Geist** (UI), **Newsreader** (headlines and hero figures) and **Geist Mono** (all measured values), declared once in [`client/src/design.ts`](client/src/design.ts) and injected into the document by the Vite design plugin.

### Backend (`server/`)

| Package | Version | Use |
|---|---|---|
| Express | ^5.2.1 | HTTP server |
| `pg` | ^8.22.0 | PostgreSQL pool |
| `bcrypt` | ^6.0.0 | Password hashing |
| `jsonwebtoken` | ^9.0.3 | JWT auth |
| `dotenv` | ^17.4.2 | Env loading |
| `xlsx` | ^0.18.5 | Installed but **not used** in `src/` |
| TypeScript | ^6.0.3 | Build |
| `ts-node` | ^10.9.2 | Run/seed TS directly |
| `nodemon` | ^3.1.14 | Dev auto-restart |

### Database

- **PostgreSQL ≥ 14** (schema targets standard Postgres features: `SERIAL`, `CHECK`, partial unique indexes, `plpgsql` triggers, views).

### Not present

- No test framework or test files.
- No ESLint config file (the `lint` script exists but no `eslint.config.*`).
- No ORM or migration framework — one idempotent SQL setup file applied manually.

---

## 4. Repository Map

```
textile-system/
├── ai_studio_code.sql            # Full PostgreSQL schema: tables, indexes, trigger, views
├── SETUP.md                      # Step-by-step install/run guide
├── FRONTEND_DESIGN_GUIDE.md      # Design philosophy + page recipes (no values; points to design.ts)
├── SYSTEM_DOCUMENTATION.md       # ← this file
├── todo.md                       # Build checklist (42/42 marked complete)
├── Untitled spreadsheet(1).xlsx  # Local scratch file (gitignored)
├── .gitignore
│
├── client/                       # React + Vite frontend
│   ├── .env / .env.example       # VITE_API_BASE_URL
│   ├── index.html                # #root only (fonts injected by the Vite plugin)
│   ├── vite.config.ts            # Design plugin (CSS + fonts), React/Tailwind plugins, /api proxy → :5000
│   ├── tsconfig*.json
│   └── src/
│       ├── main.tsx              # React root
│       ├── App.tsx               # Router + ToastProvider
│       ├── design.ts             # ← SINGLE SOURCE OF TRUTH: tokens, status rules, component styles, generated CSS
│       ├── index.css             # Intentionally empty stub; replaced by design.ts at build time
│       ├── api/                  # One module per backend resource (12 files)
│       ├── auth/guards.tsx       # RequireAuth / RequireAdmin
│       ├── domain.ts             # Roles, genders, line types, stage tabs, labels
│       ├── components/
│       │   ├── ui/               # Design system primitives
│       │   ├── production/       # ProductionBar, StatusBadge
│       │   ├── HourlyGrid.tsx    # 12-hour × lines entry grid
│       │   ├── QualityForm.tsx   # Shared quality tally form
│       │   └── ReportTable.tsx   # Table + CSV export + sortable headers
│       ├── layouts/MainLayout.tsx# Sidebar + header shell
│       ├── lib/client.ts         # Axios instance + JWT interceptor + 401 cleanup
│       ├── lib/session.ts        # Stored session read/write/clear
│       └── pages/
│           ├── auth/Login.tsx
│           ├── admin/            # Dashboard, Orders, Lines, Customers, Branches, Reports, Users
│           └── supervisor/       # HourlyEntry, ProcessStages, Quality
│
└── server/                       # Express + TypeScript API
    ├── .env                      # PORT, PG_*, JWT_SECRET
    ├── package.json              # dev / build / start / seed scripts
    ├── tsconfig.json             # strict, CommonJS, src → dist
    └── src/
        ├── index.ts              # App entry: middleware, /api/test-db, route mounts, listen
        ├── seed.ts               # Admin user, branches, lines, demo customer/product
        ├── config/db.ts          # pg Pool + query helper
        ├── middleware/auth.ts    # JWT Bearer verification + role/line guards
        ├── controllers/          # authController, productionController
        └── routes/               # 12 routers (most logic lives here)
```

---

## 5. Architecture & Request Flow

```
┌──────────────────────────┐        HTTP/JSON        ┌──────────────────────────┐
│  React SPA (Vite)        │  ───────────────────►   │  Express API (:5000)     │
│  localhost:5173          │   Authorization: Bearer │  /api/*                  │
│                          │                         │                          │
│  pages → api/*.ts        │                         │  routes → pg Pool        │
│  axios client (JWT)      │  ◄───────────────────   │  SQL / views / triggers  │
└──────────────────────────┘        JSON             └────────────┬─────────────┘
                                                                  │
                                                                  ▼
                                                     ┌──────────────────────────┐
                                                     │  PostgreSQL (textile_db) │
                                                     │  tables + views + trigger│
                                                     └──────────────────────────┘
```

**Request path (example: hourly save):**

1. `HourlyEntry.tsx` calls `logHourlyProduction()` from `client/src/api/production.ts`.
2. Axios instance (`client/src/lib/client.ts`) adds `Authorization: Bearer <token>` from `localStorage`.
3. Request hits `POST /api/production/hourly`.
4. `server/src/routes/production.ts` → `productionController.logHourlyProduction`.
5. Controller runs an `INSERT ... ON CONFLICT (line_id, production_date, hour_number) DO UPDATE`.
6. JSON `{ success: true, data: row }` returns; UI shows a toast.

**API response convention:** almost every endpoint returns `{ success: boolean, data?: ..., message?: ... }`.

**Server entry order** ([`server/src/index.ts`](server/src/index.ts)):
`express.json()` → `GET /api/test-db` → 11 routers → `app.listen(PORT || 5000)`.
No CORS middleware, no static client serving, no global error handler.

**Vite dev proxy** ([`client/vite.config.ts`](client/vite.config.ts)) forwards `/api` → `http://localhost:5000`. If `VITE_API_BASE_URL` is an absolute URL (as in `.env.example`), the browser calls port 5000 directly and the proxy is bypassed — which matters because CORS is disabled server-side.

---

## 6. Database

Schema file: [`ai_studio_code.sql`](ai_studio_code.sql). Database name used in docs: `textile_db`.

### 6.1 Entity-Relationship Diagram

```mermaid
erDiagram
    branches ||--o{ production_lines : has
    branches ||--o{ branch_daily_production : records
    customers ||--o{ products : orders
    production_lines ||--o{ line_assignments : runs
    products ||--o{ line_assignments : assigned_to
    production_lines ||--o{ hourly_production : logs
    products ||--o{ hourly_production : produces
    line_assignments ||--o{ hourly_production : covers
    production_lines ||--o{ daily_workforce : staffs
    products ||--o{ process_stage_daily : processes
    customers ||--o{ quality_checks : checks
    users ||--o{ hourly_production : entered_by
    users ||--o{ daily_workforce : recorded_by
    users ||--o{ process_stage_daily : entered_by
    users ||--o{ quality_checks : entered_by
    users ||--o{ line_assignments : created_by
    users ||--o{ user_lines : owns
    production_lines ||--o{ user_lines : assigned
    users }o--o| production_lines : assigned_to
```

### 6.2 Tables

#### `branches`
| Column | Type | Notes |
|---|---|---|
| `branch_id` | SERIAL PK | |
| `branch_name` | VARCHAR(100) | NOT NULL, UNIQUE |
| `is_main` | SMALLINT | 0/1, default 0 |
| `is_active` | SMALLINT | 0/1, default 1 (soft delete) |
| `created_at` | TIMESTAMP | default now |

#### `users`
| Column | Type | Notes |
|---|---|---|
| `user_id` | SERIAL PK | |
| `username` | VARCHAR(50) | NOT NULL, UNIQUE |
| `password_hash` | VARCHAR(255) | bcrypt hash |
| `full_name` | VARCHAR(100) | NOT NULL |
| `email` | VARCHAR(150) | nullable |
| `role` | VARCHAR(20) | `ADMIN` \| `LINE_MANAGER` (legacy `SUPERVISOR` still accepted) |
| `assigned_line_id` | INTEGER | FK → `production_lines.line_id`; kept as the manager's **primary** line |
| `is_active` | SMALLINT | 0/1, default 1 |
| `created_at` | TIMESTAMP | |

#### `user_lines`
Join table that lets one line manager own several lines. `user_id` + `line_id` is the primary key; both FKs cascade on delete. It is the authoritative set used for scoping, while `users.assigned_line_id` mirrors the first line for older code. [`ai_studio_code.sql`](ai_studio_code.sql) backfills it from the old single-line column.

| Column | Type | Notes |
|---|---|---|
| `user_id` | INTEGER | FK → `users.user_id`, `ON DELETE CASCADE` |
| `line_id` | INTEGER | FK → `production_lines.line_id`, `ON DELETE CASCADE` |
| `created_at` | TIMESTAMP | default now |

#### `branch_daily_production`
Branch-wide target/actual per day. Unique on `(branch_id, production_date)`.

`record_id` PK, `branch_id` FK, `production_date` DATE, `daily_target` INT ≥ 0, `qty_produced` INT ≥ 0, `entered_by` FK users, `entered_at`.

#### `customers`
`customer_id` PK, `customer_name` (required), `contact_person`, `phone`, `email`, `address`, `is_active` (soft delete), `created_at`.

#### `products`
| Column | Type | Notes |
|---|---|---|
| `product_id` | SERIAL PK | |
| `order_no` | VARCHAR(30) | UNIQUE, default `ORD-` + zero-padded `order_no_seq` |
| `order_date` | DATE | Defaults to `CURRENT_DATE` |
| `gender` | VARCHAR(10) | `MEN` \| `WOMEN` \| `BOYS` \| `GIRLS` \| `KIDS` \| `UNISEX` (default) |
| `customer_id` | INTEGER | FK → customers |
| `product_name` | VARCHAR(150) | required |
| `style_code` | VARCHAR(50) | |
| `color` | VARCHAR(50) | |
| `size` | VARCHAR(20) | |
| `order_quantity` | INTEGER | > 0 |
| `daily_target` | INTEGER | > 0 |
| `status` | VARCHAR(20) | `PENDING` \| `ACTIVE` \| `COMPLETED` \| `ON_HOLD` \| `CANCELLED` |
| `start_date`, `due_date` | DATE | |
| `created_at` | TIMESTAMP | |

Indexes: `ix_products_customer (customer_id)`, `ux_products_order_no (order_no)`, `ix_products_order_date (order_date)`.
In this system one product row is one customer order, so the UI labels these rows **Orders**.

#### `production_lines`
`line_id` PK, `branch_id` FK, `line_name` (UNIQUE), `line_type` (`SEWING` \| `CUTTING`, default `SEWING`), `status` (`ACTIVE` \| `MAINTENANCE` \| `INACTIVE`), `created_at`.
Migration `003_line_types.sql` seeds `Cutting 1`, `Cutting 2`, `Cutting 3` under the main branch.

#### `line_assignments`
Links a line to a product for a period.

`assignment_id` PK, `line_id` FK, `product_id` FK, `daily_target` > 0, `start_date` NOT NULL, `end_date`, `status` (`ACTIVE` \| `COMPLETED` \| `CANCELLED`), `created_by` FK users, `created_at`.

Indexes:
- `ix_assign_line (line_id)`, `ix_assign_product (product_id)`
- **`ux_one_active_per_line`** — partial unique index on `(line_id) WHERE status = 'ACTIVE'` → at most one active assignment per line.

**Trigger `trg_close_prev_assignment`** (BEFORE INSERT on `line_assignments`):
sets any existing `ACTIVE` assignment on the same line to `COMPLETED` with `end_date = NEW.start_date - 1`. This is why the API's "assign product" call doesn't need to close the old one manually.

#### `hourly_production`
| Column | Type | Notes |
|---|---|---|
| `log_id` | SERIAL PK | |
| `assignment_id` | INTEGER | FK line_assignments |
| `line_id` | INTEGER | FK production_lines |
| `product_id` | INTEGER | FK products |
| `production_date` | DATE | |
| `hour_number` | SMALLINT | CHECK 1–12 |
| `qty_produced` | INTEGER | ≥ 0 |
| `qty_defect` | INTEGER | ≥ 0 |
| `entered_by`, `updated_by` | INTEGER | FK users |
| `entered_at`, `updated_at` | TIMESTAMP | |

Unique: `uq_hourly (line_id, production_date, hour_number)` → upsert target.
Indexes: `ix_hourly_date`, `ix_hourly_product`.

#### `daily_workforce`
`record_id` PK, `line_id` FK, `production_date`, `workers_required` ≥ 0, `workers_present` ≥ 0 (default 0), `recorded_by` FK users, `recorded_at`. Unique `(line_id, production_date)`.
The `notes TEXT` column is part of [`ai_studio_code.sql`](ai_studio_code.sql).

#### `audit_log`
`audit_id` PK, `table_name`, `record_id`, `action`, `old_value`, `new_value`, `changed_by`, `changed_at`.
**Defined but never written to by application code.**

#### `process_stage_daily`
`record_id` PK, `stage` CHECK (`CUTTING` \| `STITCHING` \| `IRONING` \| `PACKING`), `product_id` FK, `line_id` FK nullable (cutting lines only), `production_date`, `qty_completed` ≥ 0, `entered_by`, `entered_at`.
`line_key` is a generated value (`line_id` or 0) so the unique index `ux_stage_daily_line (stage, product_id, production_date, line_key)` allows one cutting row **per cutting line** while non-cutting stages keep one row per product/date. Index `ix_stage_line (line_id)`.

#### `quality_checks`
`check_id` PK, `customer_id` FK, `production_date`, `pcs_checked` ≥ 0, `pcs_faults` ≥ 0, `entered_by`, `entered_at`.
Unique `(customer_id, production_date)`. Index `ix_quality_date`.

### 6.3 Reporting Views

| View | Grain | Key output |
|---|---|---|
| `vw_daily_line_summary` | date × line × product | `total_produced`, `total_defect`, `daily_target`, `pct_of_target`, `order_no`, `gender`, `line_type` |
| `vw_daily_factory_total` | date | totals + `active_lines` + `efficiency_pct` (has duplicate `total_assigned_target` / `total_target`) |
| `vw_weekly_summary` | week_start × line × product | weekly produced/defect/target + `order_no`, `gender`, `line_type` |
| `vw_product_progress` | product | produced to date, remaining, `pct_complete`, `order_no`, `gender`, `order_date` |
| `vw_line_efficiency` | date × line | `units_per_worker` (produced ÷ workers_present) |
| `vw_line_daily_score` | date × line | `total_produced`, `daily_target`, `score` = `LEAST(100, produced ÷ target × 100)` |
| `vw_branch_daily_summary` | date × branch | target, produced, `difference` |
| `vw_company_daily_total` | date | line totals **UNION ALL** branch daily totals |
| `vw_process_stage_summary` | date × stage × product | `qty_completed` + names |
| `vw_quality_summary` | date × customer | `pcs_ok`, `pass_rate_pct` |
| `vw_orders` | product | order fields + customer, produced-to-date, remaining, `pct_complete`, active line |

> All views are defined in [`ai_studio_code.sql`](ai_studio_code.sql), which recreates them on every run. Edit the file and re-apply it to change a view.

### 6.4 Schema setup and upgrades

[`ai_studio_code.sql`](ai_studio_code.sql) is the single source of truth for the
database. It creates every table, index, trigger and view, and folds in what
used to be eight incremental migrations. It is idempotent and safe to re-run.

How the file is organised:

| Section | Contents |
|---|---|
| 1. Core tables | Tables in dependency order (`branches` → `production_lines` → `users` → `user_lines` → … → `quality_checks`). |
| 2. Compatibility block | `ADD COLUMN IF NOT EXISTS`, constraint swaps, backfills and `user_lines` sync for databases created before a feature existed. |
| 3. Indexes | All indexes and unique indexes, including `ux_one_active_per_line` and `ux_stage_daily_line`. |
| 4. Reporting views | Every view, recreated with `CREATE OR REPLACE VIEW`. |
| 5. Reference data | Seeds `Cutting 1/2/3` when they are missing. |

Apply it with `psql -f` for both a fresh install and an upgrade. There is no
migration runner or tracking table; the file must stay re-runnable, so new DDL
belongs in the relevant section with `IF NOT EXISTS` (or an equivalent guard).

---

## 7. Backend (server/)

### 7.1 Entry point — `server/src/index.ts`

```ts
dotenv.config();
app.use(express.json());
app.get('/api/test-db', ...);        // DB health check
app.use('/api/auth', authRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/lines', lineRoutes);
app.use('/api/workforce', workforceRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/stages', stageRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.listen(process.env.PORT || 5000);
```

### 7.2 Database pool — `server/src/config/db.ts`

Creates a `pg.Pool` from `PG_USER`, `PG_HOST`, `PG_DATABASE`, `PG_PASSWORD`, `PG_PORT` (default `5432`).
Exports:
- `default pool` — used by every route/controller.
- `query(text, params)` — thin helper (`pool.query`).

Logs on connect; exits the process on idle-client errors.

### 7.3 Auth

**Login** — [`authController.ts`](server/src/controllers/authController.ts):
1. Look up user by `username`; inactive accounts are rejected with `403`.
2. Compare password with bcrypt. There is no dev bypass.
3. Sign JWT with `{ id, role, name, line_id }`, expires in **1 day**, secret `JWT_SECRET`.
4. Return `{ token, user: { id, username, name, role, line_id, line_ids } }`. `line_ids` is the full set of lines a manager may work on; `line_id` is the first one, kept for older clients.

**Middleware** — [`middleware/auth.ts`](server/src/middleware/auth.ts):
- Reads `Authorization: Bearer <token>`.
- `401` when the token is missing, malformed, expired, or the user row no longer exists/is inactive.
- Re-reads the user row and attaches `{ id, username, name, role, line_id, line_ids }` to `req.user`, so role/line changes take effect immediately. If `user_lines` does not exist yet (legacy DB), it falls back to `assigned_line_id`.
- `requireRole('ADMIN')` returns `403` for insufficient role; `isAdmin(user)` is the inline check used for line scoping. `lineIdsFor(user)` and `canAccessLine(user, id)` centralize multi-line checks.

**Guards:** every router is authenticated. Admin routers (`orders`, `products`, `customers`, `branches`, `lines` writes, `stages`, `quality`, `reports`, `users`, `production/daily-report`) require `ADMIN`. Hourly production and workforce entry are open to `ADMIN` and `LINE_MANAGER`, with line managers scoped to **any** of their assigned lines. `entered_by` / `created_by` always come from the token, never the body.

### 7.4 Route organization

Two patterns coexist:

1. **Controller pattern** — `routes/production.ts` delegates to `controllers/productionController.ts`; `routes/auth.ts` delegates to `controllers/authController.ts`.
2. **Inline handler pattern** — every other router contains its SQL directly in the route file. When adding features, follow the surrounding file's pattern.

Validation is manual (check required body fields, return 400). SQL is parameterized (`$1`, `$2`, …) throughout.

---

## 8. API Reference

Base URL: `http://localhost:5000/api`
Auth column: ✅ = `authenticateToken` applied; 🔐 = admin-only (`requireRole('ADMIN')`); 👤 = scoped to the signed-in line manager's own line.
All responses are JSON with `success` plus `data` or `message`.

### 8.1 Health & Auth

| Method | Path | Auth | Body / Query | Returns |
|---|---|---|---|---|
| GET | `/test-db` | ❌ | — | `{ success, message, time }` |
| POST | `/auth/login` | ❌ | `{ username, password }` | `{ success, token, user }` |
| GET | `/auth/me` | ✅ | — | `{ success, user: { id, username, name, role, line_id } }` |

### 8.2 Production

| Method | Path | Auth | Body / Query | Notes |
|---|---|---|---|---|
| POST | `/production/hourly` | ✅ 👤 | `{ production_date*, hour_number*, qty_produced*, qty_defect?, line_id?, assignment_id?, product_id? }` | Admin chooses the line; a line manager's token line/active assignment wins over the body |
| GET | `/production/hourly` | ✅ 👤 | `?date=YYYY-MM-DD` (required), `line_id?` | Line managers only receive their own line |
| GET | `/production/daily-report` | 🔐 | `?date=` optional | From `vw_company_daily_total`; no date → latest 30 days |

### 8.3 Customers

| Method | Path | Auth | Body / Query |
|---|---|---|---|
| GET | `/customers` | 🔐 | `?all=true` includes inactive |
| GET | `/customers/:id` | 🔐 | — |
| POST | `/customers` | 🔐 | `{ customer_name*, contact_person?, phone?, email?, address? }` |
| PUT | `/customers/:id` | 🔐 | Any of the above + `is_active` (COALESCE partial update) |
| DELETE | `/customers/:id` | 🔐 | Soft delete (`is_active = 0`) |

### 8.4 Products & Orders

| Method | Path | Auth | Body / Query |
|---|---|---|---|
| GET | `/products` | 🔐 | `?customer_id=&status=` |
| GET | `/products/customer/:customerId` | 🔐 | All products for one customer |
| GET | `/products/:id` | 🔐 | — |
| GET | `/products/:id/progress` | 🔐 | From `vw_product_progress` |
| POST | `/products` | 🔐 | `{ customer_id*, product_name*, order_quantity*, daily_target*, order_no?, gender?, style_code?, color?, size?, status?, start_date?, due_date?, order_date? }` |
| PUT | `/products/:id` | 🔐 | Partial update (customer_id is not editable); accepts `order_no`, `gender`, `order_date` |
| DELETE | `/products/:id` | 🔐 | Sets `status = 'CANCELLED'` (no hard delete) |
| GET | `/orders` | 🔐 | `?status=&customer_id=&line_id=&from=&to=&search=&sort=&dir=` — rows from `vw_orders`, whitelisted sorting |
| GET | `/orders/:id` | 🔐 | One order with customer, progress and active line |
| POST | `/orders` | 🔐 | Combined order creation, see below |

`POST /orders` runs one transaction and accepts either `customer_id` or an inline `customer { customer_name, contact_person?, phone?, email?, address? }`. It also accepts `order_no?`, `product_name*`, `style_code?`, `color?`, `size?`, `gender?`, `order_quantity*`, `daily_target*`, `status?`, `start_date?`, `due_date?`, `order_date?`, and optional `assign { line_id, daily_target?, start_date? }` to assign straight to a sewing line. The order number is generated from `order_no_seq` when omitted; a duplicate explicit number returns `409`. Sorting keys: `order_no`, `order_date`, `customer`, `product`, `gender`, `quantity`, `target`, `produced`, `pct`, `status`.

### 8.5 Lines & Assignments

| Method | Path | Auth | Body / Query | Notes |
|---|---|---|---|---|
| GET | `/lines` | ✅ 👤 | `?branch_id=&status=&line_type=&date=` | Includes `line_type`, active order (`order_no`, `gender`, customer), today's produced/target and `score`; line managers see only their line |
| GET | `/lines/:id` | ✅ 👤 | — | |
| POST | `/lines` | 🔐 | `{ branch_id*, line_name*, line_type?, status? }` | `line_type` is `SEWING` or `CUTTING` |
| PUT | `/lines/:id` | 🔐 | `{ branch_id?, line_name?, line_type?, status? }` | |
| POST | `/lines/:id/assign` | 🔐 | `{ product_id*, daily_target*, start_date* }` | SEWING lines only; transaction; DB trigger closes the previous assignment; sets product PENDING→ACTIVE |
| GET | `/lines/:id/current` | ✅ 👤 | — | Active assignment + product/customer + order number/gender; 404 if none |
| GET | `/lines/:id/history` | ✅ 👤 | — | All assignments for the line |

### 8.6 Workforce

| Method | Path | Auth | Body / Query |
|---|---|---|---|
| POST | `/workforce` | ✅ 👤 | `{ production_date*, workers_present*, workers_required?, notes?, line_id? }` — upsert; `recorded_by` and the line come from the token for line managers |
| GET | `/workforce` | ✅ 👤 | `?line_id=&date=` or `?line_id=&from=&to=`; line managers only receive their own line |

### 8.7 Branches

| Method | Path | Auth | Body / Query | Notes |
|---|---|---|---|---|
| GET | `/branches` | 🔐 | `?all=true` | |
| GET | `/branches/:id` | 🔐 | — | |
| POST | `/branches` | 🔐 | `{ branch_name*, is_main? }` | |
| PUT | `/branches/:id` | 🔐 | `{ branch_name?, is_main?, is_active? }` | |
| DELETE | `/branches/:id` | 🔐 | — | Soft delete |
| POST | `/branches/:id/daily` | 🔐 | `{ production_date*, daily_target?, qty_produced? }` | Upsert branch daily; `entered_by` comes from the token |
| GET | `/branches/:id/daily` | 🔐 | `?date=` or `?from=&to=` | |
| GET | `/branches/:id/summary` | 🔐 | `?date=` optional | From `vw_branch_daily_summary` |

### 8.8 Process Stages

| Method | Path | Auth | Body / Query |
|---|---|---|---|
| POST | `/stages` | 🔐 | `{ stage*, product_id*, production_date*, qty_completed*, line_id? }` — `stage` is `CUTTING`/`STITCHING`/`IRONING`/`PACKING`; `line_id` is only allowed for `CUTTING` and must reference a CUTTING line; upsert |
| GET | `/stages` | 🔐 | `?product_id=&stage=&line_id=&date=` or `?from=&to=` |
| GET | `/stages/summary` | 🔐 | `?date=` or `?from=&to=` — from `vw_process_stage_summary` |

### 8.9 Quality

| Method | Path | Auth | Body / Query |
|---|---|---|---|
| POST | `/quality` | 🔐 | `{ customer_id*, production_date*, pcs_checked*, pcs_faults? }` — upsert |
| GET | `/quality` | 🔐 | `?customer_id=&date=` or `?from=&to=` — from `vw_quality_summary` (includes `pcs_ok`, `pass_rate_pct`) |

### 8.10 Reports

| Method | Path | Auth | Query | Returns |
|---|---|---|---|---|
| GET | `/reports/daily` | 🔐 | `date` (required), `sort?`, `dir?` | `{ total, by_line[] }`; sort keys `order_no`, `customer`, `product`, `gender`, `line`, `produced`, `defects`, `target`, `pct`, `date` |
| GET | `/reports/weekly` | 🔐 | `start`, `end` (required), `sort?`, `dir?` | Weekly rows joined with line/product/customer and the same whitelist |
| GET | `/reports/monthly` | 🔐 | `month=YYYY-MM` (required), `sort?`, `dir?` | One row per month/line/order: produced, faults, monthly target, efficiency; same whitelist |
| GET | `/reports/overview` | 🔐 | `date?` | One payload for the dashboard: `totals`, `by_customer`, `by_order`, `by_branch`, `by_line`, `by_hour`, `stages`, `quality` |
| GET | `/reports/customer/:id` | 🔐 | — | Per-product order progress for a customer |
| GET | `/reports/line/:id` | 🔐 | `from`, `to` (required) | Daily line summary rows |
| GET | `/reports/efficiency` | 🔐 | `line_id?`, `from?`, `to?` | `vw_line_efficiency` rows |
| GET | `/reports/company` | 🔐 | `date?` or `from?&to?` | `vw_company_daily_total` rows |

Sorting is server-side and uses a fixed whitelist; an unknown `sort` key falls back to the default order. Date fields (`week_start`, `month`, `production_date`) are returned as plain `YYYY-MM-DD` / `YYYY-MM` text so timezones cannot shift a report into the wrong day or month.

**Legacy-data compatibility:** newer view columns (`order_no`, `gender`, `line_type`, …) are read through `to_jsonb(row)->>'column'`. A database whose views predate those columns still returns rows, with the missing fields as `NULL`; the client renders them as `—` instead of failing the report.

### 8.11 Users

| Method | Path | Auth | Body / Query | Notes |
|---|---|---|---|---|
| GET | `/users` | 🔐 | `?role=&line_id=&all=true` | Active only by default; never returns `password_hash`; each row includes `line_ids[]` |
| GET | `/users/:id` | 🔐 | — | |
| POST | `/users` | 🔐 | `{ username*, password*, full_name*, role*, email?, assigned_line_ids?: number[], assigned_line_id? }` | `role` is `ADMIN`/`LINE_MANAGER`/`SUPERVISOR`; line-manager roles require at least one existing line; `assigned_line_ids` is preferred and `assigned_line_id` is accepted for older clients; bcrypt cost 10; 409 on duplicate username |
| PUT | `/users/:id` | 🔐 | `{ full_name?, email?, role?, assigned_line_ids?, assigned_line_id?, is_active? }` | Replaces the user's line set and re-validates that a line manager keeps at least one line |
| PUT | `/users/:id/password` | 🔐 | `{ password }` | Minimum 8 characters |
| DELETE | `/users/:id` | 🔐 | — | Soft delete |

---

## 9. Frontend (client/)

### 9.1 Bootstrap

- [`main.tsx`](client/src/main.tsx) mounts `<App />` in `#root` under `StrictMode`, imports `index.css` (which the Vite design plugin replaces with the generated theme from `design.ts`).
- [`App.tsx`](client/src/App.tsx) wraps everything in `ToastProvider` and `BrowserRouter`.

### 9.2 Routes

| Path | Component | Layout | Sidebar label | Access |
|---|---|---|---|---|
| `/login` | `pages/auth/Login.tsx` | none | — | public |
| `/` | `pages/admin/Dashboard.tsx` | MainLayout | Dashboard | admin |
| `/entry` | `pages/supervisor/HourlyEntry.tsx` | MainLayout | Hourly Entry | admin, line manager (own line) |
| `/lines` | `pages/admin/Lines.tsx` | MainLayout | Production Lines | admin |
| `/orders` | `pages/admin/Orders.tsx` | MainLayout | Orders | admin |
| `/products` | redirect → `/orders` | — | — | admin |
| `/customers` | `pages/admin/Customers.tsx` | MainLayout | Customers | admin |
| `/branches` | `pages/admin/Branches.tsx` | MainLayout | Branches | admin |
| `/reports` | `pages/admin/Reports.tsx` | MainLayout | Reports | admin |
| `/users` | `pages/admin/Users.tsx` | MainLayout | Users | admin |
| `/stages` | `pages/supervisor/ProcessStages.tsx` | MainLayout | Daily Production | admin |
| `/quality` | `pages/supervisor/Quality.tsx` | MainLayout | Quality | admin |

Guards live in `client/src/auth/guards.tsx`: unauthenticated users go to `/login`, line managers are kept out of admin routes, and admins land on `/` while line managers land on `/entry`. The 401 interceptor clears the stored session and redirects to `/login`.

### 9.3 Layout — `MainLayout.tsx`

- Fixed sidebar (`w-60` expanded / `w-14` collapsed) + sticky top header.
- Brand: **AmirtexOS** with factory icon.
- Nav items declared in `allNavItems` with an allowed-role list:
  - Admin: Dashboard, Orders, Production Lines, Daily Production, Quality, Customers, Branches, Reports, Users, Hourly Entry.
  - Line manager (and legacy `SUPERVISOR`): Hourly Entry only, scoped to their own line.
- `Hourly Entry` is shared: admins can enter any line, while line managers are locked to their assigned line by the API. The sidebar hides the admin pages from line managers, and route guards reject direct visits.
- Page title map keyed by pathname.
- Mobile drawer with overlay; desktop collapse toggle.
- Reads the signed-in user from `lib/session.ts`; there is no hardcoded/dev user. Logout clears the session and returns to `/login`.

### 9.4 Page behavior summary

| Page | What it does | API modules used |
|---|---|---|
| **Dashboard** | Single `GET /reports/overview` request; hero + “Today’s focus”; tabs Customers / Orders / Branches / Lines (urgency-sorted table with score) | `reports` |
| **HourlyEntry** | Loads lines with current assignments; 12-hour grid per line; workforce required/present/notes; Save All upserts each non-zero hour + workforce | `lines`, `production`, `workforce` |
| **ProcessStages** | Five tabs — Cutting (active orders × Cutting 1/2/3, saved per line), Stitching (sewing lines + hourly totals, links to `/entry`), Ironing, Packing (per-order daily totals), Quality (embedded `QualityForm`) | `orders`, `lines`, `stages`, `customers`, `quality` |
| **Quality** | Customer select + checked/faults inputs; live pass-rate gauge; submits daily QC via the shared `QualityForm` | `customers`, `quality` |
| **Lines** | Sewing and cutting line tables with `line_type`, current order number/gender, produced/target and score; create/edit line modal; assign-order modal shows order number + gender | `lines`, `orders`, `branches` |
| **Orders** | Order table (order #, gender, qty, target, progress, status); combined New Order modal (existing customer or inline new customer) and edit/cancel | `orders`, `customers`, `products` |
| **Customers** | Account CRUD; expandable read-only order history | `customers`, `orders` |
| **Branches** | Date picker; per-branch daily target/produced entry + save; summary table | `branches` |
| **Reports** | Tabs: Daily / Weekly / Monthly / All Companies / Orders; month picker on Monthly; Order + Gender columns; sortable headers via the server whitelist; CSV export | `reports`, `orders` |
| **Users** | User table with role and all assigned lines; multi-select line checklist for line managers; create/edit; password reset via edit; deactivate | `users`, `lines` |
| **Login** | Username/password form with a show/hide password toggle; real errors; stores token + user; validates the session with `getMe`; role-based landing | `auth` |

### 9.5 API client modules (`client/src/api/`)

| File | Exports |
|---|---|
| `auth.ts` | `login`, `getMe` |
| `branches.ts` | `getBranches`, `getBranchSummary`, `upsertBranchDaily` |
| `customers.ts` | `getCustomers`, `getCustomer`, `createCustomer`, `updateCustomer`, `deleteCustomer` |
| `orders.ts` | `getOrders`, `getOrder`, `createOrder` |
| `lines.ts` | `getLines`, `getLine`, `getLineCurrent`, `assignProduct`, `createLine`, `updateLine` |
| `production.ts` | `logHourlyProduction`, `getHourlyProduction` |
| `products.ts` | `getProducts`, `getProduct`, `getProductsByCustomer`, `createProduct`, `updateProduct`, `deleteProduct` |
| `quality.ts` | `postQuality`, `getQuality` |
| `reports.ts` | `getDailyReport`, `getWeeklyReport`, `getOverviewReport`, `getCustomerReport`, `getLineReport`, `getEfficiencyReport`, `getCompanyReport` |
| `stages.ts` | `postStage`, `getStages`, `getStagesSummary` |
| `users.ts` | `getUsers`, `createUser`, `updateUser`, `resetPassword`, `deleteUser` |
| `workforce.ts` | `saveWorkforce`, `getWorkforce` |

Missing client wrappers (backend endpoints exist): `GET /lines/:id/history`, `GET /branches/:id/daily`, `DELETE /lines/:id` (none exists), `GET /products/:id/progress` (no wrapper).

### 9.6 HTTP client — `lib/client.ts`

```ts
axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});
```
Request interceptor adds `Authorization: Bearer <localStorage.token>`.
Response interceptor clears the stored token/user and redirects to `/login` on `401`; `403` is surfaced as an error without destroying a valid session.

### 9.7 Key components

- **`HourlyGrid.tsx`** — the core supervisor grid:
  - Line tabs (All Lines / per line).
  - Sticky columns: Line, Customer, Style/Model, Workers Required, Workers Present, Day Target, Hour Target, Hr 1–12, Total, Diff, Notes.
  - Hour target = `daily_target / 8` (note: 12 columns are shown).
  - Cell background: green ≥100% of hourly target, amber ≥70%, red below.
  - Keyboard navigation: arrows + Enter move between hour cells; worker-required Enter jumps to Hr 1.
  - Running total banner with % and “needs N/hr to meet target”.
- **`ReportTable.tsx`** — card + sticky-header table + CSV export; right-aligns numeric columns detected from data. Columns can opt into sorting with `sortKey`; the page owns the sort state and the server whitelist decides the SQL order.
- **`QualityForm.tsx`** — shared quality tally form used by both `/quality` and the Daily Production → Quality tab.
- **`ProductionBar.tsx`** — horizontal progress bar; `getStatusColor()` implements the 100/70 status rules; overflow chevron.
- **`StatusBadge.tsx`** — `Badge` wrapper for percentage status.
- **`ui/`** — Button, Input, Select, Textarea, Badge, Card, Modal, Spinner, Skeleton (+ table/card variants), Toast provider.

---

## 10. Design System

**Single source of truth: [`client/src/design.ts`](client/src/design.ts).** It holds
every colour, font, radius, shadow, status threshold, chart style and reusable
component style. Nothing else in the app may define design values.

### How it reaches the browser

1. `design.ts` exports `designCss`, a generated stylesheet containing
   `@import "tailwindcss";`, the `@theme` block (fonts, colours, radii, shadows),
   base body styles and keyframes.
2. The `amirtex-design-system` plugin in [`client/vite.config.ts`](client/vite.config.ts)
   replaces the contents of `src/index.css` with `designCss` (`enforce: 'pre'`,
   query strings stripped from the id).
3. The same plugin injects the Google Fonts preconnect and stylesheet links from
   `fonts.googleHref` into `index.html`.
4. [`client/src/index.css`](client/src/index.css) is an intentionally empty stub;
   [`client/index.html`](client/index.html) has no font links.

### Foundations exported

| Group | Exports |
|---|---|
| Palette | `colors` — canvas, paper, surface, cotton, ink, inkSoft, muted, carbon, rule, thread, steel, lime family, green family, amber family, risk family |
| Type | `fonts` — `sans` (Geist), `serif` (Newsreader), `mono` (Geist Mono), plus `googleHref` |
| Shape | `radius`, `shadows` |
| Status | `thresholds`, `tones`, `toneFor`, `statusFor`, `qualityTone` |
| Charts | `chart` — series palette, grid, axis ticks, tooltips, hero bar/cursor, bar radii |
| Components | `button`, `field`, `card`, `modal`, `badge`, `toast`, `table`, `segmented` |
| Composition | `page`, `layout`, `auth` |
| Loading | `skeleton`, `spinner` |

### Status rules

There is one implementation, in `design.ts`:

```ts
toneFor(pct, lineStatus)  // maintenance → idle → onTarget → atRisk → behind
statusFor(pct, lineStatus) // returns { label, text, dot, fill, soft, border }
qualityTone(rate)          // good / warning / behind using thresholds.quality*
```

The cut-offs are `thresholds.onTarget`, `thresholds.atRisk`,
`thresholds.qualityGood` and `thresholds.qualityWarning`. Components call these
helpers; they never compare against a literal. `ProductionBar.getStatusColor()`
and `HourlyGrid` both delegate to `statusFor`, and the dashboard uses `toneFor`
for its trend icons.

### Legacy token aliases

`designCss` maps the pre-redesign names onto the current palette so older markup
keeps rendering: `brand`/`brand-dark`/`brand-light`, `factory-night`,
`muted-steel`, `loom-green`/`loom-green-bg`, `caution-amber`/`amber-bg`,
`defect-red`/`defect-red-bg`, `greige`, `surface-raised`, `raw-cotton`, `slate`,
`cool-gray`, `linen`, `thread`. New code should use the canonical names from
`colors`.

### Typography and motion

- UI: **Geist**; headlines and hero figures: **Newsreader**; measured values:
  **Geist Mono** with tabular numerals.
- Body base is 14px; page titles and hero numbers scale up with the serif.
- Keyframes (`pulse-once`, `flash-green`, `fadeIn`, `slideUp`) live in
  `designCss`. `prefers-reduced-motion` disables animation and transitions.

For the rationale behind these choices and the per-page recipes, see
[`FRONTEND_DESIGN_GUIDE.md`](FRONTEND_DESIGN_GUIDE.md).

### Responsive tables and numeric readability

- `page.shell` uses `w-full min-w-0` and `p-4 lg:p-6`, so pages shrink with the viewport instead of overflowing.
- `page.tabs` scrolls horizontally (`overflow-x-auto`) and each tab is `shrink-0 whitespace-nowrap`.
- `table.wrapper` is `overflow-x-auto`; data tables use `table.base` (`w-full min-w-max`), and cells are `whitespace-nowrap`. Wide tables scroll horizontally rather than clipping figures.
- Numeric cells use `table.numeric` (`text-right font-mono tabular-nums`) and are formatted with `toLocaleString()`.
- Two- and three-column form grids collapse to one column below the `sm` breakpoint (`grid-cols-1 sm:grid-cols-2/3`).

---

## 11. Business Flows

### 11.1 Line assignment

```
Admin opens /lines → Assign Order on a SEWING line
  → GET /orders (non-cancelled orders)
  → modal shows order number, gender, customer and quantity
  → POST /lines/:id/assign { product_id, daily_target, start_date }
    → BEGIN
      → INSERT line_assignments
          → trigger closes any prior ACTIVE assignment (status=COMPLETED, end_date=start-1)
      → UPDATE products SET status='ACTIVE' WHERE status='PENDING'
    → COMMIT
```
One active assignment per line is additionally enforced by partial unique index. Cutting lines never take assignments; they record stage output instead.

### 11.1a Line managers with several lines

A line manager account owns a set of lines in `user_lines` (the first is also mirrored to `users.assigned_line_id`). The login token and every authenticated request carry the full `line_ids` set.

- `/users` create/edit accepts `assigned_line_ids: number[]`; the Users page shows a checklist instead of a single dropdown.
- `GET /lines` returns only the caller's lines; `/lines/:id` and `/lines/:id/current` return `403` for a line outside that set.
- `POST /production/hourly` and `GET /production/hourly` accept any of the manager's lines; any other `line_id` is `403`.
- `POST /workforce` and `GET /workforce` are scoped the same way.
- Admins are never scoped. If `user_lines` is missing on a legacy database, the middleware falls back to `assigned_line_id`.

### 11.2 Hourly production entry

```
Admin/line manager opens /entry (date defaults today)
  → GET /lines (line managers receive only their own line)
  → GET /production/hourly?date=... and GET /workforce?date=...
  → edits 12 hour cells + workforce fields
  → Save All:
      for each line with workforce values → POST /workforce (upsert)
      for each hour with produced>0 or defect>0 → POST /production/hourly (upsert)
  → toast "All data saved successfully"
```
A line manager's write payload cannot target another line: the server uses the token's `line_id` and that line's active assignment.

### 11.3 Daily production (process stages)

`/stages` has five tabs:

- **Cutting** — rows are active orders, columns are the configured cutting lines (Cutting 1/2/3). Each cell saves `POST /stages { stage:'CUTTING', product_id, line_id, production_date, qty_completed }`, so lines are independent.
- **Stitching** — reads sewing lines and their hourly totals from `GET /lines?date=`; shows produced/target/score and links to `/entry` for hourly input.
- **Ironing** and **Packing** — one daily total per active order (`POST /stages` with no `line_id`).
- **Quality** — embeds the same `QualityForm` used by `/quality`.

Cutting upserts on `(stage, product_id, date, line_key)`; other stages upsert on the product/date key with `line_key = 0`.

### 11.4 Quality control

`/quality` and the Daily Production → Quality tab use `QualityForm`: pick a customer, enter checked/faults, see the live pass rate, and post `POST /quality`. Reads come from `vw_quality_summary`, so pass rate/OK counts are precomputed.

### 11.5 Branch daily production

`/branches` loads branches and each branch's summary for the selected date. Entry saves via `POST /branches/:id/daily` (upsert). The summary table shows target, actual, difference.

### 11.6 Reporting

- **Dashboard** — a single `GET /reports/overview?date=` returns totals, hourly output, customers, orders, branches, lines and quality. Tabs switch client-side; there is no per-line/per-branch fan-out.
- **Daily** — factory total + per-line/product breakdown, with Order # and Gender columns.
- **Weekly** — `vw_weekly_summary` filtered by `week_start`, enriched with line/product/customer/order/gender.
- **Monthly** — `GET /reports/monthly?month=YYYY-MM` aggregates `vw_daily_line_summary` per month/line/order, with produced, faults, monthly target and efficiency. The month picker is independent of the daily/weekly date.
- **All Companies** — `vw_company_daily_total`.
- **Orders** — order-level list with Order #, product, customer, gender, quantity, daily target, produced, progress and status. It opens sorted by `order_no` ascending.
- Sortable headers send `sort` + `dir`; the server validates them against a whitelist (`order_no`, `customer`, `product`, `gender`, `line`, `produced`, `defects`, `target`, `pct`, `date` for daily/weekly/monthly; `order_no`, `order_date`, `customer`, `product`, `gender`, `quantity`, `target`, `produced`, `pct`, `status` for orders). Clicking the same header toggles ascending/descending.
- Sort state is stored per tab in `Reports.tsx`, so switching tabs or changing the report date does not reset it. The Orders tab keeps its order-number sort across date changes even though the order list itself is not date-filtered.
- CSV export is client-side in `ReportTable`.

### 11.7 Creating an order (customer + order in one submit)

```
Admin opens /orders → New Order
  → choose Existing customer or New customer (inline name/contact/phone/email)
  → enter order number (optional), product/style, gender, quantity, daily target, dates
  → POST /orders
      → BEGIN
        → INSERT customer when inline details were supplied
        → INSERT product with order_no (sequence default) + gender + order_date
        → optional INSERT line_assignment when assign.line_id is sent
      → COMMIT
  → returns the joined order row, created customer and assignment
```
`/customers` is account management only; its expandable order history is read-only and links staff to `/orders` for changes.

---

## 12. Environment & Setup

Full instructions: [`SETUP.md`](SETUP.md). Condensed:

### Prerequisites
Node ≥ 18, npm ≥ 9, PostgreSQL ≥ 14.

### Database
```bash
psql -U postgres -c "CREATE DATABASE textile_db;"
psql -U postgres -d textile_db -f ai_studio_code.sql
# One idempotent file: tables, compatibility block, indexes and views.
# Re-running it upgrades an existing database without deleting data.
```

### Server
```bash
cd server
npm install
npm run seed     # admin/admin123, branches, lines, demo customer/product
npm run dev      # http://localhost:5000
```
Scripts: `dev` (nodemon), `build` (tsc → `dist/`), `start` (`node dist/index.js`), `seed` (ts-node).

`server/.env` variables:
| Variable | Default / example |
|---|---|
| `PORT` | `5000` |
| `PG_USER` | `postgres` |
| `PG_PASSWORD` | local Postgres password |
| `PG_HOST` | `localhost` |
| `PG_PORT` | `5432` |
| `PG_DATABASE` | `textile_db` |
| `JWT_SECRET` | random string (fallback hardcoded in code) |

### Client
```bash
cd client
npm install
npm run dev      # http://localhost:5173
```
`client/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```
Alternative: set `VITE_API_BASE_URL=/api` to use the Vite proxy (recommended if you hit CORS).

### Default login
`admin` / `admin123`

### Phase 9 verification (2026-11-26)

- **Scratch database:** created `textile_setup_test`, applied the consolidated `ai_studio_code.sql` twice (fresh + re-run), then ran the seed. Result: 13 tables, 11 views, `Cutting 1/2/3` and the demo admin/manager/order present.
- **Real database:** the same file was applied to `textile_db`; all statements are idempotent, and the order/line/stage/`user_lines` columns are present.
- **Builds:** `npm run build` passed in both `server/` (tsc) and `client/` (tsc + Vite).
- **API smoke test:** admin login; every page's primary data source; line-manager login; manager sees only its own line and receives `403` for another line; manager hourly write is forced onto its own line; new-customer order creation; sewing-line assignment; hourly entry; cutting on all three cutting lines; ironing, packing and quality; line score equals capped attainment; daily/weekly/orders sorting by order number in both directions and daily sorting by total faults in both directions.
- **UI smoke test:** admin sidebar navigation across Dashboard, Orders, Production Lines, Daily Production, Quality, Customers, Branches, Reports, Users and Hourly Entry; Reports → Orders tab sorts by Order # ascending/descending and keeps the direction after a date change; line manager lands on `/entry`, sees only the Hourly Entry nav item, and is redirected away from `/orders`.

---

## 13. Common Tasks / How to Extend

### Add a backend endpoint
1. Choose the router in `server/src/routes/` (or create one).
2. Write the handler inline (follow existing style) or add a controller.
3. Validate required fields, return 400 on failure.
4. Use parameterized SQL.
5. Return `{ success: true, data }`.
6. If it's a new router, mount it in `server/src/index.ts`.
7. Add a wrapper in `client/src/api/<resource>.ts`.

### Add a frontend page
1. Create `client/src/pages/<area>/<Page>.tsx`.
2. Add a `<Route>` in `client/src/App.tsx`.
3. Add a nav entry + page title in `client/src/layouts/MainLayout.tsx` (`allNavItems`, `pageTitles`).
4. Add an API module if needed.
5. Use `Card`, `Button`, `Input`, `Badge`, `Modal`, `useToast` from `components/ui`.

### Add a database table or column
1. Edit [`ai_studio_code.sql`](ai_studio_code.sql): add the table to section 1, or the column to the compatibility block with `ADD COLUMN IF NOT EXISTS`.
2. Add any new index to section 3 and views to section 4.
3. Apply the file with `psql -U postgres -d textile_db -f ai_studio_code.sql`; it is idempotent.
4. Update this document's schema section and the file index.

### Change status colors / design tokens
- Everything: [`client/src/design.ts`](client/src/design.ts). Edit the palette,
  `thresholds`, `tones`, `chart` or a component preset there.
- The theme CSS and font links are regenerated automatically by the
  `amirtex-design-system` Vite plugin; do not edit `client/src/index.css` or add
  font tags to `client/index.html`.
- Consumers must call `statusFor` / `toneFor` / `qualityTone`; never re-implement
  a threshold.
- Rationale and page recipes: [`FRONTEND_DESIGN_GUIDE.md`](FRONTEND_DESIGN_GUIDE.md).

### Enforce authentication
Every router already applies `authenticateToken`; admin-only routers add `requireRole('ADMIN')`. For a new router, follow that pattern:
```ts
router.use(authenticateToken, requireRole('ADMIN'));
```
Line-scoped routers should compare `req.user.line_id` instead of trusting a body/query `line_id`, and write `entered_by`/`created_by` from `req.user.id`.

---

## 14. Known Issues & Gotchas

### Security / auth
1. **Tokens live in `localStorage`**, so any XSS can read them; there is no refresh-token rotation.
2. **JWT secret fallback** is hardcoded if `JWT_SECRET` is unset — always set it in production.
3. **No rate limiting** on `/auth/login` or the API.
4. **Legacy `SUPERVISOR` role** is still accepted for hourly entry while accounts migrate to `LINE_MANAGER`.
5. **Password policy inconsistency:** user creation allows any length; reset requires ≥ 8; seed password `admin123` is 6.
6. **`GET /api/test-db` is public** (health check only, but it reveals connectivity).

### CORS / networking
9. **No CORS middleware.** Commit `69cc0a3` says "disable cors and login". With `VITE_API_BASE_URL=http://localhost:5000/api`, the browser makes cross-origin calls and may be blocked. Use the Vite proxy (`VITE_API_BASE_URL=/api`) or serve client and API from one origin.
10. **No static serving of `client/dist`** by Express, despite SETUP.md mentioning it as a CORS workaround.

### Data / behavior
11. **12 hour columns vs 8-hour target.** `HourlyGrid` shows Hr 1–12, but hourly target = `daily_target / 8`; the running-total banner also assumes an 8-hour day.
12. **Cannot clear an hourly value to zero via Save All.** Rows are only submitted when `produced > 0 || defect > 0`; setting a cell back to 0 and saving leaves the old DB value.
13. **Workforce save is conditional.** A row is saved only if present/required/notes are non-zero/non-empty.
14. **`audit_log` is unused** — no writes anywhere.
15. **`xlsx` dependency is unused** in server source; CSV export is client-side.
16. **Duplicate columns in `vw_daily_factory_total`** (`total_assigned_target` and `total_target`).
17. **Weekly report boundary:** client sends `selectedDate - 7 days` to `selectedDate` and the query compares `week_start` (Monday) to those dates; the current partial week can be excluded.
18. **Reports “All Companies” tab** actually shows the company daily total, not per-company data.
19. **Daily report totals can be empty while rows exist** — the total comes from `vw_daily_factory_total` (branch-level), while rows come from `vw_daily_line_summary` (hourly).
20. **Silent error swallowing** — many pages use `.catch(() => {})` or log-only catches, so failures often surface as empty tables.
21. **No loading/empty error distinction** in several tables (empty data and failed request look the same).

### Tooling
22. **No tests.**
23. **`npm run lint` will fail** — no ESLint config file exists in `client/`.
24. **Migrations are manual** — no runner, no schema version tracking.
25. **Node/TS versions are very new** (`@types/node ^26`, TypeScript 6) — ensure toolchain compatibility.
26. **`bcrypt` is a native module** — may need build tools on some machines.

---

## 15. Complete File Index

> Excludes `node_modules/`, `dist/`, `.git/`. Line counts are approximate.

### Root

| File | Lines | Purpose |
|---|---|---|
| `ai_studio_code.sql` | 578 | Single database setup file: 13 tables, indexes, assignment trigger, 11 views, compatibility/backfill block |
| `SETUP.md` | 333 | Install/run guide, API overview, troubleshooting |
| `FRONTEND_DESIGN_GUIDE.md` | 207 | Design philosophy and page recipes; points to `design.ts` for all values |
| `SYSTEM_DOCUMENTATION.md` | — | This document |
| `todo.md` | 95 | Build checklist (all phases marked complete) |
| `Untitled spreadsheet(1).xlsx` | — | Local scratch spreadsheet (gitignored) |
| `.gitignore` | 30 | Ignores deps, builds, env, logs, editor files, the xlsx |

### Server

| File | Lines | Purpose |
|---|---|---|
| `server/package.json` | 35 | Scripts + deps |
| `server/tsconfig.json` | 13 | Strict CommonJS build `src → dist` |
| `server/.env` | — | Local env (PORT, PG_*, JWT_SECRET) |
| `server/src/index.ts` | 48 | Express entry, `/api/test-db`, route mounts |
| `server/src/seed.ts` | 127 | Seeds admin/manager, branches, 3 lines, demo customer/product; syncs `user_lines` |
| `server/src/config/db.ts` | 28 | `pg.Pool` + `query()` helper |
| `server/src/middleware/auth.ts` | 133 | JWT verification, user re-read, multi-line guards |
| `server/src/controllers/authController.ts` | 58 | Login: lookup, bcrypt, JWT with `line_ids` |
| `server/src/controllers/productionController.ts` | 129 | Hourly upsert, hourly fetch, daily report |
| `server/src/routes/auth.ts` | 14 | `POST /login`, `GET /me` |
| `server/src/routes/production.ts` | 15 | Hourly + daily-report routes |
| `server/src/routes/customers.ts` | 104 | Customer CRUD + soft delete |
| `server/src/routes/products.ts` | 180 | Product CRUD, by-customer, progress, cancel; order fields |
| `server/src/routes/orders.ts` | 286 | Combined order creation, list/get, legacy-safe whitelisted sorting |
| `server/src/routes/lines.ts` | 282 | Line CRUD, assign, current/history, type filter + score |
| `server/src/routes/workforce.ts` | 76 | Workforce upsert + query |
| `server/src/routes/branches.ts` | 185 | Branch CRUD, daily production, summary |
| `server/src/routes/stages.ts` | 161 | Stage upsert/list/summary; cutting `line_id` |
| `server/src/routes/quality.ts` | 76 | Quality upsert + view query |
| `server/src/routes/reports.ts` | 441 | Daily, weekly, monthly, overview, customer, line, efficiency, company + legacy-safe sort whitelist |
| `server/src/routes/users.ts` | 279 | User CRUD, multi-line assignment, password reset, soft delete |

### Client

| File | Lines | Purpose |
|---|---|---|
| `client/package.json` | 36 | Scripts + deps |
| `client/vite.config.ts` | 57 | `amirtex-design-system` plugin (injects design CSS + fonts), React/Tailwind plugins, `/api` proxy to :5000 |
| `client/index.html` | 13 | Root div + title (fonts injected by the design plugin) |
| `client/.env.example` | 1 | `VITE_API_BASE_URL` |
| `client/tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` | — | TS project configs |
| `client/src/main.tsx` | 10 | React root |
| `client/src/App.tsx` | 56 | Router, guards, routes, `/products` redirect, ToastProvider |
| `client/src/domain.ts` | 75 | Shared roles, genders, line types, stage tabs and labels |
| `client/src/design.ts` | 520 | ← Single source of truth: palette, type, thresholds, tones, chart, responsive component presets, generated CSS |
| `client/src/index.css` | 7 | Intentionally empty stub; replaced at build time by `design.ts` |
| `client/src/lib/client.ts` | 36 | Axios instance, token interceptor, 401 session cleanup |
| `client/src/lib/session.ts` | 30 | Read/write/clear the stored session |
| `client/src/auth/guards.tsx` | 40 | `RequireAuth` / `RequireAdmin` route guards |
| `client/src/layouts/MainLayout.tsx` | 249 | Sidebar, role nav, header, mobile drawer, logout |
| `client/src/api/auth.ts` | 28 | `login`, `getMe` |
| `client/src/api/branches.ts` | 17 | Branch reads + daily upsert |
| `client/src/api/customers.ts` | 26 | Customer CRUD |
| `client/src/api/orders.ts` | 55 | Orders list/get/create |
| `client/src/api/lines.ts` | 39 | Lines, current, assign, create/update |
| `client/src/api/production.ts` | 19 | Hourly save/fetch |
| `client/src/api/products.ts` | 42 | Product CRUD + by-customer |
| `client/src/api/quality.ts` | 16 | Quality save/fetch |
| `client/src/api/reports.ts` | 77 | All report endpoints, including monthly |
| `client/src/api/stages.ts` | 21 | Stage save/list/summary |
| `client/src/api/users.ts` | 35 | User CRUD + multi-line assignment + password reset |
| `client/src/api/workforce.ts` | 17 | Workforce save/fetch |
| `client/src/components/HourlyGrid.tsx` | 244 | 12-hour grid, tabs, keyboard nav, totals |
| `client/src/components/QualityForm.tsx` | 103 | Shared quality tally form |
| `client/src/components/ReportTable.tsx` | 127 | Table + CSV export + sortable headers + `—` for missing values |
| `client/src/components/production/ProductionBar.tsx` | 58 | Progress bar + status color util |
| `client/src/components/production/StatusBadge.tsx` | 23 | Percentage badge |
| `client/src/components/ui/index.ts` | 9 | Barrel export |
| `client/src/components/ui/Button.tsx` | 45 | Variants: primary/secondary/outline/ghost/danger; sizes; loading |
| `client/src/components/ui/Input.tsx` | 41 | Label, error, helper text, a11y wiring |
| `client/src/components/ui/Select.tsx` | 51 | Label, error, options, placeholder |
| `client/src/components/ui/Textarea.tsx` | 39 | Label, error |
| `client/src/components/ui/Badge.tsx` | 65 | Status pill + critical pulse |
| `client/src/components/ui/Card.tsx` | 45 | Header/footer/padding/hover |
| `client/src/components/ui/Modal.tsx` | 67 | Overlay, Escape close, scroll lock, footer |
| `client/src/components/ui/Spinner.tsx` | 27 | SVG spinner |
| `client/src/components/ui/Skeleton.tsx` | 50 | Text/circle/rect + table/card presets |
| `client/src/components/ui/Toast.tsx` | 75 | Toast context/provider, 4 types, 4s auto-dismiss |
| `client/src/pages/auth/Login.tsx` | 163 | Brand panel + login form with show/hide password + role landing |
| `client/src/pages/admin/Dashboard.tsx` | 715 | Overview hero + tabs: Customers/Orders/Branches/Lines |
| `client/src/pages/admin/Lines.tsx` | 295 | Sewing/cutting tables, create/edit, assign modal with score |
| `client/src/pages/admin/Orders.tsx` | 439 | Order table + combined customer/order modal |
| `client/src/pages/admin/Customers.tsx` | 201 | Account CRUD + read-only order history |
| `client/src/pages/admin/Branches.tsx` | 142 | Branch daily entry + summary table |
| `client/src/pages/admin/Reports.tsx` | 263 | Daily/Weekly/Monthly/Company/Orders tabs + sorting |
| `client/src/pages/admin/Users.tsx` | 218 | User table + multi-line assignment + create/edit/reset/deactivate |
| `client/src/pages/supervisor/HourlyEntry.tsx` | 186 | Loads lines/workforce, saves all entries |
| `client/src/pages/supervisor/ProcessStages.tsx` | 406 | Five-tab daily production entry |
| `client/src/pages/supervisor/Quality.tsx` | 30 | QC page wrapping `QualityForm` |
| `client/public/favicon.svg`, `client/public/icons.svg` | — | Static assets |

---

*End of system documentation. If you add or rename files, update Section 15 and the relevant section above.*
