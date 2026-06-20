# Textile Management System — Build Todo

## Stack
- **Database:** PostgreSQL (Cloud / Local)
- **Backend:** Express + TypeScript + pg + dotenv
- **Frontend:** React 18 + TypeScript + Vite + TanStack Query + Recharts + Tailwind + React Router

## Progress: 42 / 42 tasks complete

---

### Phase 0: Prerequisites & Tools to Install
Before writing any code, install these tools on your computer:
- [x] Install Node.js, Git, IDE extensions.
- [x] Install DB tooling (PostgreSQL client / Cloud DB access).

---

### Phase 1: Database Setup (Oracle Cloud / PostgreSQL)
Start here because the backend needs a database to connect to.
- [x] `ai_studio_code.sql` — PostgreSQL DDL: all tables, views, sequences, constraints.
- [x] DB views — `vw_daily_line_summary`, `vw_daily_factory_total`, etc.
- [x] Connect database (verify live cloud connection).
- [x] Seed script (`seed.ts`) — insert branches, default admin user, sample production lines.

---

### Phase 2: Backend Scaffolding (Node + TypeScript)
Set up the server environment.
- [x] `server/package.json` — initialize project.
- [x] Install dependencies (`express`, `pg`, `cors`, `dotenv`) & Dev dependencies (`typescript`, `nodemon`).
- [x] `server/tsconfig.json` — strict mode, ESNext.
- [x] Backend environment config (`.env` file).

---

### Phase 3: Backend File Creation Order
Create these files in this exact order inside your server/ folder.

**Goal Checkpoint:** Start your server (`npm run dev`) and use Postman to successfully POST an hourly production log into your DB.

- [x] `server/src/index.ts` — Express app entry, CORS middleware, all routes mounted, port listen.
- [x] `server/src/config/db.ts` — PostgreSQL connection pool.
- [x] `server/src/controllers/productionController.ts` — Logic for hourly production log.
- [x] `server/src/routes/productionRoutes.ts` — Routes for production entry.
- [x] `server/src/controllers/authController.ts` & `src/routes/auth.ts` — `POST /auth/login`, `GET /auth/me`.
- [x] `server/src/middleware/auth.ts` — JWT check middleware.
- [x] `server/src/routes/customers.ts` — CRUD for customers.
- [x] `server/src/routes/products.ts` — CRUD and status lifecycle for products.
- [x] `server/src/routes/lines.ts` — Line details & product assignment.
- [x] `server/src/routes/workforce.ts` — Daily workforce tracking.
- [x] `server/src/routes/branches.ts` — Branch summaries.
- [x] `server/src/routes/stages.ts` — Cutting / packing / ironing logic.
- [x] `server/src/routes/quality.ts` — Quality control routes.
- [x] `server/src/routes/reports.ts` — Daily, weekly, efficiency exports.
- [x] `server/src/routes/users.ts` — Admin CRUD for supervisors.

---

### Phase 4: Frontend Scaffolding (React + Vite)
Set up the user interface environment.
- [x] `client/package.json` & `vite.config.ts` — React 18, TypeScript, Tailwind, Recharts.
- [x] Tailwind CSS setup (`index.css` & globals).
- [x] `client/src/lib/client.ts` — Axios instance with JWT Authorization interceptor.
- [x] `client/.env.example` / `.env` — Provide explicit `VITE_API_BASE_URL`.

---

### Phase 5: Frontend File Creation Order
Create these files in this exact order inside your client/ folder.

- [x] `client/src/main.tsx` — React root DOM binding.
- [x] `client/src/App.tsx` — React Router wrapper.
- [x] `client/src/layouts/MainLayout.tsx` — Sidebar nav, top bar.
- [x] `client/src/pages/admin/dashboard.tsx` — Dashboard placeholder.
- [x] `client/src/pages/supervisor/HourlyEntry.tsx` — Data entry placeholder.

**API Hooks (`src/api/*`)**:
- [x] `auth.ts`, `customers.ts`, `products.ts`, `lines.ts`, `production.ts`, `reports.ts`.

**Pages (`src/pages/*`)**:
- [x] `Login.tsx` — username/password form.
- [x] `Lines.tsx` — list & assign product modal.
- [x] `Customers.tsx` — customer list & expandable products.
- [x] `Branches.tsx` — branch daily entry table.
- [x] `ProcessStages.tsx` — stage entry.
- [x] `Quality.tsx` — pass rate / faults computation.
- [x] `Reports.tsx` — Charts and tables.
- [x] `Users.tsx` — Account creation and pass resets.

**Shared Components (`src/components/*`)**:
- [x] `LineCard.tsx` — Progress bar, status dot.
- [x] `HourlyGrid.tsx` — Generalized 1–12 column grid.
- [x] `ProgressBar.tsx` — Target vs actual logic.
- [x] `ReportTable.tsx` — Shared table UI.
