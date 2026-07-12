# TransitOps

**Smart Transport Operations Platform** — A full-stack fleet management system built for the Odoo Hackathon.

TransitOps replaces spreadsheets and manual logbooks with a centralized platform for vehicle tracking, driver management, trip dispatching, maintenance scheduling, fuel/expense logging, and analytics — all backed by role-based access control.

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Authentication & RBAC](#authentication--rbac)
- [Default Credentials](#default-credentials)

---

## Architecture

```
┌─────────────────────────────────┐
│         transit-flow            │
│   Next.js 16 (App Router)       │
│   TypeScript + Tailwind CSS     │
│   shadcn/ui + recharts          │
│   http://localhost:3000         │
└───────────────┬─────────────────┘
                │  HTTP/JSON + JWT Bearer
                v
┌─────────────────────────────────┐
│          backend                │
│   FastAPI (Python)              │
│   SQLAlchemy ORM                │
│   PyJWT + bcrypt                │
│   http://localhost:8000         │
└───────────────┬─────────────────┘
                v
┌─────────────────────────────────┐
│       PostgreSQL Database        │
│   9 tables with FK relations    │
└─────────────────────────────────┘
```

---

## Tech Stack

### Backend

| Component        | Technology           | Version   |
|------------------|----------------------|-----------|
| Framework        | FastAPI              | 0.139.0   |
| ASGI Server      | Uvicorn              | >= 0.34.0 |
| ORM              | SQLAlchemy           | 2.0.51    |
| Database         | PostgreSQL           | —         |
| DB Driver        | psycopg2-binary      | 2.9.12    |
| Validation       | Pydantic             | 2.13.4    |
| Authentication   | PyJWT + bcrypt       | 2.10.1    |
| Env Management   | python-dotenv        | 1.2.2     |
| Python           | 3.x                  | —         |

### Frontend

| Component        | Technology           | Version    |
|------------------|----------------------|------------|
| Framework        | Next.js (App Router) | 16.2.10    |
| UI Library       | React                | 19.2.4     |
| Language         | TypeScript           | ^5         |
| CSS              | Tailwind CSS         | ^4         |
| Components       | shadcn/ui            | ^4.13.0    |
| Icons            | lucide-react         | ^1.24.0    |
| Charts           | recharts             | ^3.9.2     |
| Forms            | react-hook-form      | ^7.81.0    |
| Validation       | Zod                  | ^4.4.3     |

---

## Features

### Fleet Management
- Vehicle registry with search, type, and status filters
- Add vehicles with registration, capacity, odometer, and cost tracking
- Status tracking: Available, On Trip, In Shop, Retired

### Driver Management
- Driver profiles with license info, category (LMV/HMV), and contact details
- Trip completion percentage and safety score tracking
- License expiry monitoring — expired licenses block trip assignment

### Trip Dispatching
- Create trips with source, destination, vehicle, driver, cargo weight, and distance
- Real-time live board with 20-second polling
- Trip lifecycle: Draft → Dispatched → In Transit → Completed/Cancelled
- Capacity validation — dispatch blocked if cargo exceeds vehicle capacity
- Auto-assigns vehicle/driver status to "On Trip" on dispatch

### Maintenance
- Log service records (Oil Change, Engine Repair, Brake Service, etc.)
- Status flow: In Shop → Completed
- In-Shop vehicles are automatically removed from the dispatch pool

### Fuel & Expenses
- Fuel log tracking per vehicle
- Other expenses: tolls, miscellaneous costs
- Auto-calculated total operational cost

### Analytics & Reports
- KPIs: fuel efficiency, fleet utilization, operational cost, vehicle ROI
- Monthly revenue bar chart
- Top costliest vehicles ranking
- CSV export

### Settings & RBAC
- General settings: depot name, currency, distance unit
- Role-Based Access Control matrix (read-only view)
- 4 roles with module-level permissions

---

## Project Structure

```
Odoo-Hackathon/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── requirements.txt         # Python dependencies
│   └── src/
│       ├── models.py            # SQLAlchemy ORM models (9 tables)
│       ├── db.py                # Database connection & session
│       ├── auth.py              # JWT auth, login, RBAC seeding
│       ├── vehicles.py          # Vehicle CRUD + filters
│       ├── drivers.py           # Driver CRUD + trip completion %
│       ├── trips.py             # Trip lifecycle management
│       ├── dashboard.py         # Dashboard summary aggregation
│       ├── maintenance.py       # Maintenance records
│       ├── fuel_logs.py         # Fuel log tracking
│       ├── expenses.py          # Expense tracking & summary
│       ├── analytics.py         # KPIs, revenue, cost rankings
│       └── settings.py          # App settings & RBAC matrix
│
└── transit-flow/
    ├── package.json
    ├── next.config.ts
    ├── tsconfig.json
    ├── app/
    │   ├── layout.tsx           # Root layout (Navbar + providers)
    │   ├── globals.css          # Theme variables (light/dark)
    │   ├── page.tsx             # Redirects to /dashboard
    │   ├── login/page.tsx       # Authentication page
    │   ├── dashboard/page.tsx   # KPI cards + recent trips
    │   ├── fleet/page.tsx       # Vehicle registry
    │   ├── drivers/page.tsx     # Driver management
    │   ├── trips/page.tsx       # Trip dispatcher + live board
    │   ├── maintenance/page.tsx # Service records
    │   ├── fuel-expenses/page.tsx # Fuel logs & expenses
    │   ├── analytics/page.tsx   # Reports & charts
    │   └── settings/page.tsx    # Settings & RBAC matrix
    ├── components/
    │   ├── Navbar.tsx           # Sidebar navigation (RBAC-filtered)
    │   ├── topbar.tsx           # Top bar with search
    │   ├── status-badge.tsx     # Color-coded status badges
    │   ├── trip-stepper.tsx     # Trip lifecycle stepper
    │   ├── ToggleTheme.tsx      # Light/dark mode toggle
    │   └── ui/                  # shadcn/ui primitives
    ├── context/
    │   ├── auth-context.tsx     # Auth session management
    │   └── theme-context.tsx    # Theme state (light/dark)
    └── lib/
        ├── api.ts               # Centralized fetch wrapper
        ├── token.ts             # JWT localStorage helpers
        ├── types.ts             # TypeScript interfaces
        ├── utils.ts             # cn() utility
        └── validations.ts       # Zod schemas
```

---

## Prerequisites

- **Python** 3.10+
- **Node.js** 18+
- **PostgreSQL** 12+
- **pnpm** / **npm** / **yarn**

---

## Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/transitops
JWT_SECRET=your-secret-key-here
```

| Variable       | Required | Description                          |
|----------------|----------|--------------------------------------|
| `DATABASE_URL` | Yes      | PostgreSQL connection string         |
| `JWT_SECRET`   | No       | JWT signing key (has default fallback) |

### Frontend (`transit-flow/.env.local`)

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

| Variable                | Required | Description                    |
|-------------------------|----------|--------------------------------|
| `NEXT_PUBLIC_BACKEND_URL` | Yes    | Backend API base URL           |

---

## Getting Started

### 1. Database Setup

```bash
# Create the PostgreSQL database
createdb transitops
```

### 2. Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate   # Linux/macOS
# .venv\Scripts\activate    # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env        # or create manually
# Edit .env with your DATABASE_URL

# Start the server
uvicorn main:app --reload --port 8000
```

Tables are created automatically on first startup. Default users, settings, and RBAC matrix are seeded automatically.

### 3. Frontend

```bash
cd transit-flow

# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_BACKEND_URL=http://localhost:8000" > .env.local

# Start the dev server
npm run dev
```

The app is available at [http://localhost:3000](http://localhost:3000).

---

## API Reference

All endpoints are prefixed with the base URL (default: `http://localhost:8000`).

### Authentication

| Method | Endpoint          | Description                | Auth Required |
|--------|-------------------|----------------------------|---------------|
| POST   | `/auth/login`     | Login, returns JWT token   | No            |
| GET    | `/auth/me`        | Get current user from JWT  | Yes           |
| POST   | `/auth/logout`    | Logout (client-side clear) | No            |

### Vehicles

| Method | Endpoint               | Description                    |
|--------|------------------------|--------------------------------|
| GET    | `/vehicles`            | List vehicles (filter: search, type, status) |
| GET    | `/vehicles/{id}`       | Get vehicle by ID              |
| POST   | `/vehicles`            | Create vehicle                 |
| GET    | `/vehicles/types`      | List distinct vehicle types    |
| GET    | `/vehicles/regions`    | List distinct regions          |
| GET    | `/regions`             | List distinct regions (root)   |

### Drivers

| Method | Endpoint    | Description                        |
|--------|-------------|------------------------------------|
| GET    | `/drivers`  | List drivers (filter: search, status, region, licenseValid) |
| POST   | `/drivers`  | Create driver                      |

### Trips

| Method | Endpoint                      | Description              |
|--------|-------------------------------|--------------------------|
| GET    | `/trips`                      | List trips (filter: status, region) |
| POST   | `/trips`                      | Create & dispatch a trip |
| GET    | `/trips/live`                 | Active trips only        |
| GET    | `/trips/recent`               | Recent N trips           |
| PATCH  | `/trips/{tripId}/dispatch`    | Dispatch a draft trip    |
| PATCH  | `/trips/{tripId}/complete`    | Mark trip as completed   |
| PATCH  | `/trips/{tripId}/cancel`      | Cancel a trip            |

### Dashboard

| Method | Endpoint            | Description                            |
|--------|---------------------|----------------------------------------|
| GET    | `/dashboard/summary` | Aggregated KPIs (filter: vehicleType, status, region) |

### Maintenance

| Method | Endpoint                        | Description              |
|--------|---------------------------------|--------------------------|
| GET    | `/maintenance`                  | List service records     |
| POST   | `/maintenance`                  | Create service record    |
| GET    | `/maintenance/service-types`    | List distinct types      |
| PATCH  | `/maintenance/{id}/close`       | Close a maintenance record |

### Fuel Logs & Expenses

| Method | Endpoint            | Description              |
|--------|---------------------|--------------------------|
| GET    | `/fuel-logs`        | List fuel logs           |
| POST   | `/fuel-logs`        | Create fuel log          |
| GET    | `/expenses`         | List expenses            |
| POST   | `/expenses`         | Create expense           |
| GET    | `/expenses/summary` | Total operational cost   |

### Analytics

| Method | Endpoint                          | Description                |
|--------|-----------------------------------|----------------------------|
| GET    | `/analytics/kpis`                 | Fuel efficiency, utilization, cost, ROI |
| GET    | `/analytics/monthly-revenue`      | Revenue per completed trip |
| GET    | `/analytics/top-costliest-vehicles` | Top 3 costliest vehicles |

### Settings

| Method | Endpoint                | Description              |
|--------|-------------------------|--------------------------|
| GET    | `/settings`             | Get app settings         |
| PATCH  | `/settings`             | Update app settings      |
| GET    | `/settings/rbac-matrix` | Get RBAC permission matrix |

---

## Database Schema

### Tables

| Table                | Description                              |
|----------------------|------------------------------------------|
| `users`              | User accounts (email, password, role)    |
| `vehicles`           | Vehicle registry (regNo, type, capacity, status) |
| `drivers`            | Driver profiles (license, category, safety score) |
| `trips`              | Trip records (source, destination, cargo, status) |
| `maintenance_records`| Service records linked to vehicles       |
| `fuel_logs`          | Fuel entries linked to vehicles          |
| `expenses`           | Toll and miscellaneous expenses          |
| `settings`           | App-wide settings (depot, currency)      |
| `rbac_matrix`        | Role-based access control permissions    |

### Relationships

- `trips` → `vehicles` (FK: `vehicleId`)
- `trips` → `drivers` (FK: `driverId`)
- `maintenance_records` → `vehicles` (FK: `vehicleId`)
- `fuel_logs` → `vehicles` (FK: `vehicleId`)
- `expenses` → `vehicles` (FK: `vehicleId`)

---

## Authentication & RBAC

### Authentication Flow

1. User submits email/password via the login page
2. Backend validates credentials against bcrypt-hashed passwords
3. Backend returns a JWT token (24-hour expiry, HS256)
4. Frontend stores token in `localStorage` and attaches it as `Authorization: Bearer` header on all requests
5. `GET /auth/me` validates the token and returns the current user

### Role-Based Access Control

| Role               | Fleet | Drivers | Trips | Fuel/Expenses | Analytics |
|--------------------|-------|---------|-------|---------------|-----------|
| Fleet Manager      | Full  | Full    | Full  | Full          | Full      |
| Dispatcher         | View  | View    | Full  | None          | None      |
| Safety Officer     | None  | Full    | View  | None          | None      |
| Financial Analyst  | None  | None    | None  | Full          | Full      |

Navigation items in the sidebar are filtered based on the logged-in user's role.

---

## Default Credentials

| Email                      | Password    | Role              |
|----------------------------|-------------|--------------------|
| fleet@transitops.com       | fleet123    | Fleet Manager      |
| dispatch@transitops.com    | dispatch123 | Dispatcher         |
| safety@transitops.com      | safety123   | Safety Officer     |
| finance@transitops.com     | finance123  | Financial Analyst  |

---

## License

This project was built for the **Odoo Hackathon**. Use as you see fit.
