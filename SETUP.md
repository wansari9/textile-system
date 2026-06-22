# AmirtexOS — Setup Guide

Production management system with hourly tracking, quality control, process stages, branch management, and reporting.

---

## Prerequisites

| Dependency | Version | Notes |
|---|---|---|
| **Node.js** | >= 18 | Download from [nodejs.org](https://nodejs.org/) |
| **npm** | >= 9 | Ships with Node.js |
| **PostgreSQL** | >= 14 | [Download](https://www.postgresql.org/download/) |
| **Git** | any | [Download](https://git-scm.com/downloads) |

Verify your environment:

```bash
node --version    # e.g. v18.20.0
npm --version     # e.g. 10.8.0
psql --version    # e.g. psql (PostgreSQL) 16.4
```

---

## 1. Clone the Repository

```bash
git clone <repository-url> textile-system
cd textile-system
```

---

## 2. Create the PostgreSQL Database

### macOS (via Homebrew or Postgres.app)

```bash
# Connect to the default postgres database
psql -U postgres

# Inside psql:
CREATE DATABASE textile_db;
\q
```

If `psql` gives a "role postgres does not exist" error:

```bash
# Create your user as a superuser, then connect:
psql -d postgres
CREATE DATABASE textile_db;
\q
```

### Windows

```powershell
# Open SQL Shell (psql) as postgres user, or:
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres
```

Inside psql:

```sql
CREATE DATABASE textile_db;
\q
```

> **Troubleshooting:** If you see `FATAL: password authentication failed`, edit
> `pg_hba.conf` and change `METHOD` from `scram-sha-256` to `md5` for local
> connections, then restart the PostgreSQL service.

---

## 3. Run the Schema & Seed

Apply the full schema (tables, indexes, views, triggers):

```bash
# macOS / Linux
psql -U postgres -d textile_db -f ai_studio_code.sql

# Windows PowerShell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d textile_db -f ai_studio_code.sql
```

Apply the migration (adds `notes` column to `daily_workforce`):

```bash
psql -U postgres -d textile_db -f server/migrations/001_add_workforce_notes.sql
```

Seed the database with default admin user, branches, lines, and a dummy customer/product:

```bash
cd server
npm install
npm run seed
```

Default credentials after seeding:

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `admin123` |

---

## 4. Configure Server Environment

```bash
cd server
```

Create `.env` (or copy the existing one — it has safe dev defaults):

```env
PORT=5000
PG_USER=postgres
PG_PASSWORD=postgres
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=textile_db
JWT_SECRET=<a-random-64-char-hex-string>
```

> - **`PG_PASSWORD`** — must match the password you set for your PostgreSQL
>   `postgres` user. On macOS with Homebrew it's often blank; leave it empty
>   or use `PG_PASSWORD=` (no value). On Windows you likely set a password
>   during installation.
> - **`JWT_SECRET`** — generate one: `openssl rand -hex 32` (macOS / Linux) or
>   use [randomkeygen.com](https://randomkeygen.com/).
> - **`PORT`** — use any free port; the client expects `5000` by default.

Install dependencies and build once:

```bash
npm install
npm run build
```

Start the server in development mode (auto-restarts on changes):

```bash
npm run dev
```

Verify the server is running and the database is connected:

```bash
curl http://localhost:5000/api/test-db
# {"success":true,"message":"Database is connected!","time":"2026-06-21T..."}
```

---

## 5. Configure Client Environment

Open a **second terminal** window.

```bash
cd client
```

Create `.env` (or rename `.env.example`):

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

---

## 6. Login

1. Navigate to `http://localhost:5173/login`
2. Sign in with:
   - **Username:** `admin`
   - **Password:** `admin123`
3. You should see the Admin Dashboard.

---

## 7. Creating Additional Users

Once logged in as admin:

1. Go to **Users** in the sidebar
2. Click **Add User**
3. Choose role:
   - **Admin** — full access to all pages
   - **Supervisor** — limited to Hourly Entry, Cutting/Packing, Quality Control
4. The new user can sign in at `/login` with their credentials

---

## 8. Project Structure

```
textile-system/
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── api/                # API client modules (one per route group)
│   │   ├── components/         # Reusable UI components
│   │   │   └── ui/             # Design system (Button, Card, Modal, etc.)
│   │   ├── layouts/            # App shell with sidebar + top header
│   │   ├── lib/                # Axios client with auth interceptor
│   │   └── pages/
│   │       ├── admin/          # Dashboard, Lines, Products, Customers, etc.
│   │       ├── auth/           # Login page
│   │       └── supervisor/     # HourlyEntry, ProcessStages, Quality
│   ├── .env.example
│   ├── index.html
│   └── vite.config.ts
│
├── server/                     # Express + TypeScript backend
│   ├── migrations/             # Incremental SQL migrations
│   ├── src/
│   │   ├── config/db.ts        # PostgreSQL connection pool
│   │   ├── controllers/        # Route handlers
│   │   ├── middleware/         # JWT auth middleware
│   │   ├── routes/             # Express routers (11 route groups)
│   │   ├── seed.ts             # DB seeder script
│   │   └── index.ts            # App entry point (CORS, routes, listen)
│   ├── .env
│   └── tsconfig.json
│
├── ai_studio_code.sql          # Full schema (tables, views, triggers)
├── SETUP.md                    # This file
└── .gitignore
```

---

## 9. API Overview

All authenticated routes require a `Bearer` token in the `Authorization` header.
The client Axios interceptor handles this automatically after login.

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/auth/login` | POST | No | Login, returns JWT + user |
| `/api/test-db` | GET | No | Verify DB connection |
| `/api/production/hourly` | GET/POST | Yes | Read/write hourly production |
| `/api/customers` | GET/POST/PUT/DELETE | Yes | Customer CRUD |
| `/api/products` | GET/POST/PUT/DELETE | Yes | Product CRUD |
| `/api/lines` | GET/POST/PUT | Yes | Line CRUD + product assignment |
| `/api/workforce` | GET/POST | Yes | Workforce (required/present/notes) |
| `/api/branches` | GET | Yes | Branch list + daily input + summary |
| `/api/stages` | GET/POST | Yes | Process stages (cutting/packing/ironing) |
| `/api/quality` | GET/POST | Yes | Quality check logs |
| `/api/reports` | GET | Yes | Daily/weekly/company reports |
| `/api/users` | GET/POST/PUT/DELETE | Yes | User management |

---

## 10. Platform-Specific Notes

### macOS

| Item | Note |
|---|---|
| **PostgreSQL install** | `brew install postgresql@16` then `brew services start postgresql@16` |
| **psql password** | Often blank — leave `PG_PASSWORD=` empty or omit it |
| **Path to psql** | `/opt/homebrew/bin/psql` (Apple Silicon) or `/usr/local/bin/psql` (Intel) |
| **File paths** | Forward slashes work out of the box |

### Windows

| Item | Note |
|---|---|
| **PostgreSQL install** | Use the [EnterpriseDB installer](https://www.postgresql.org/download/windows/) — it sets up a windows service automatically |
| **psql path** | `"C:\Program Files\PostgreSQL\16\bin\psql.exe"` (adjust version number) |
| **Service management** | `net start postgresql-x64-16` / `net stop postgresql-x64-16` |
| **pg_hba.conf** | Usually at `C:\Program Files\PostgreSQL\16\data\pg_hba.conf` |
| **PowerShell note** | Use `;` to chain commands (not `&&`), but prefer `cd dir; npm install` |
| **File paths** | Use backslashes or forward slashes — Node.js accepts both |

---

## 12. Common Issues & Fixes

| Symptom | Likely Cause | Fix |
|---|---|---|
| `curl: failed to connect` | Server not running | Run `npm run dev` in `server/` |
| `Database connection failed` at `/api/test-db` | Wrong PG credentials | Check `.env` values match your PostgreSQL setup |
| `relation "users" does not exist` | Schema not applied | Run `psql ... -f ai_studio_code.sql` |
| `401 Unauthorized` when logged in | Token expired | Log out and log in again at `/login` |
| Login says "Invalid credentials" | Wrong password or user | Run `npm run seed` again, or check the `users` table |
| CORS error in browser | Client on different port | Serve the built client from Express (`client/dist` as static files) or use a reverse proxy to serve both on the same origin |
| `Cannot find module` | Dependencies not installed | Run `npm install` in both `client/` and `server/` |
| Port `5000` already in use | Another process on that port | Change `PORT` in `server/.env` and `VITE_API_BASE_URL` in `client/.env` |
| `password authentication failed` in psql | pg_hba.conf method mismatch | Change `scram-sha-256` to `md5` in `pg_hba.conf`, restart PostgreSQL |
| `npm run dev` exits immediately | PostgreSQL not running | Start PostgreSQL service (`brew services start postgresql` / `net start postgresql-x64-16`) |

---

## 13. Quick Start (30 Seconds)

```bash
# Terminal 1 — Database
psql -U postgres -c "CREATE DATABASE textile_db;"
psql -U postgres -d textile_db -f ai_studio_code.sql

# Terminal 1 — Server
cd server
npm install
npm run seed
npm run dev

# Terminal 2 — Client
cd client
npm install
npm run dev
```

Then open **http://localhost:5173** and log in with `admin` / `admin123`.
