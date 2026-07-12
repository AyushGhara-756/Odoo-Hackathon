# TransitOps — Frontend Build Spec

Stack: **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui (base-ui primitives) + lucide-react**

## Global rules (apply to every page below)

1. **Never hardcode data.** Every table, stat, chart, or list on every screen below must be fetched from the backend — no inline arrays of fake drivers/vehicles/trips in the components. Use the values shown in the template only as a reference for shape/fields, not as literal content.
2. **Backend base URL** comes from an environment variable:
   ```
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   ```
   - Use `NEXT_PUBLIC_BACKEND_URL` for anything fetched client-side (`"use client"` components).
   - If a fetch happens in a Server Component or Route Handler, you can use a non-public `BACKEND_URL` env var instead (no need to expose it to the browser).
   - Construct every request as `${process.env.NEXT_PUBLIC_BACKEND_URL}/<route>` — never a bare path, never a hardcoded host.
   - Centralize this in a single `lib/api.ts` fetch wrapper (see bottom of this doc) instead of repeating `fetch()` calls with manual base URLs in every component.
3. **Loading & error states are mandatory.** Every data-fetching component needs a skeleton/spinner state and an error state (toast or inline message) — don't assume the request always succeeds.
4. **Theming**: use the CSS variables already defined in `globals.css` (`bg-background`, `text-foreground`, `bg-card`, `border-border`, etc.) — never hardcode hex/oklch colors in components. Status badge colors (green/blue/orange/red) can be defined once as a small `statusColor` map (see shared components section) and reused everywhere instead of repeated per-page.
5. **Icons**: `lucide-react` throughout, matching the icon-per-nav-item convention already used in `Navbar`.
6. **Tables**: use shadcn `Table` primitives (`Table`, `TableHeader`, `TableRow`, `TableHead`, `TableBody`, `TableCell`), not raw `<table>`.
7. **Forms**: use shadcn `Input`, `Select`, `Checkbox`, `Button` — validate with `zod` + `react-hook-form` rather than manual `useState` per field, since multiple screens (Dispatcher, Maintenance, Vehicle Registry) have multi-field forms with validation rules (capacity checks, expiry checks, uniqueness checks).
8. **Charts**: use `recharts` (already common in shadcn ecosystem) for the bar chart on Reports & Analytics.
9. **Auth/session**: role (`Fleet Manager` / `Dispatcher` / `Safety Officer` / `Financial Analyst`) and user name shown in the top-right badge on every page comes from the authenticated session, not a prop you set manually per page — pull it from a shared `useAuth()`/`useSession()` hook backed by the `/auth/me` (or equivalent) route.

---

## Shared layout components (build these first)

### `components/navbar.tsx`
Already built — fixed vertical sidebar, `w-56 h-screen`, nav items: Dashboard, Fleet, Drivers, Trips, Maintenance, Fuel & Expenses, Analytics, Settings. Active route highlighted via `usePathname()`.

**RBAC note**: which items are visible/enabled depends on role (see Screen 8 permission matrix). Filter `navItems` by the current user's role before rendering, don't just hide via CSS.

### `components/topbar.tsx` (new — appears on every screen except Auth)
- Left: search input (`Input` with a `Search` icon, debounced, fetches from a route like `/search?q=`)
- Right: user name (e.g. "Ravan K.") + role badge (e.g. "Dispatcher")
- Fetch the user's name/role from session/auth context — never hardcode "Ravan K."

### `components/status-badge.tsx`
A single reusable badge component that takes a `status` string and maps it to a color:
- `Available`, `Completed`, `On Trip` → green/blue family
- `In Shop`, `Dispatched`, `Draft` → orange/blue (in-progress family)
- `Retired`, `Suspended`, `Cancelled` → red

Keep this as one shared component — every screen (Dashboard, Vehicle Registry, Drivers, Trips, Maintenance, Fuel) reuses it instead of each page defining its own color logic.

### `lib/api.ts`
Shared fetch wrapper — see full code at the bottom of this document.

---

## Screen 0 — Authentication (RBAC)

**Route**: `/login` (or `/auth`)
**Layout**: two-column — left panel is a solid off-white/dark decorative panel with logo + tagline + role bullet list ("Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst" with access notes); right panel has the actual form. On small screens, collapse to single column (hide left panel or stack above).

**Fields**:
- Email (`Input type="email"`)
- Password (`Input type="password"`)
- Role select (`Select` — Fleet Manager / Dispatcher / Safety Officer / Financial Analyst) — this likely just informs which dashboard view to redirect to post-login, but the actual role authorization must come from what the backend returns for that user, not from trusting the client-selected value.
- "Remember me" checkbox
- "Forgot password?" link
- Sign In button (`Button`, full width)

**Behavior**:
- On submit, `POST` to `${BACKEND_URL}/auth/login` with `{ email, password }`.
- Show the error panel (as in the template — "Invalid credentials", "Account locked after 5 failed attempts") when the backend returns 401/423. Don't hardcode a client-side attempt counter as the source of truth — reflect whatever the backend reports.
- On success, store the session (httpOnly cookie set by backend is preferred over localStorage token) and redirect to `/dashboard`.
- Footer: "TransitOps © 2026 · RBAC enabled" — static text, fine to hardcode since it's not data.

---

## Screen 1 — Dashboard

**Route**: `/dashboard`

**Top filter bar**: Vehicle Type / Status / Region — three `Select` dropdowns. Options for each should be fetched (e.g. `/vehicles/types`, `/vehicles/statuses`, `/regions`) rather than hardcoded enums, since regions/types may change per fleet.

**Stat cards row** (7 cards): Active Vehicles, Available Vehicles, Vehicles in Maintenance, Active Trips, Pending Trips, Drivers on Duty, Fleet Utilization %.
- Fetch from a single aggregate endpoint, e.g. `GET /dashboard/summary`, returning all 7 numbers in one payload — avoid 7 separate requests.
- Re-fetch when filters change (pass filters as query params).

**Recent Trips table**: Trip ID, Vehicle, Driver, Status (badge), ETA. Fetch from `GET /trips/recent` (paginated or limited to last N).

**Vehicle Status panel**: horizontal bar breakdown (Available / On Trip / In Shop / Retired) with counts — derive proportional bar widths from the same `/dashboard/summary` payload or a dedicated `/vehicles/status-breakdown` route.

---

## Screen 2 — Vehicle Registry

**Route**: `/fleet`

**Top bar**: search input, filters (Type / Status), "+ Add Vehicle" button (opens a modal/drawer form).

**Table columns**: Reg No. (unique), Make/Model, Type, Capacity (kg), Odometer, Avg. Cost, Status (badge).

- Fetch: `GET /vehicles?search=&type=&status=`
- "+ Add Vehicle" form: submits `POST /vehicles`. Validate registration number uniqueness — surface the backend's uniqueness error inline under the field (as shown in the template's red validation note) rather than trying to pre-validate uniqueness client-side against a full vehicle list.
- Business rule to encode in the UI (disable/hide, not just visual): vehicles with status `Retired` or `In Shop` should not be selectable in any "assign vehicle" dropdown elsewhere in the app (Trip Dispatcher). Enforce this by filtering the dropdown's fetched options (`GET /vehicles?status=Available`), not by fetching everything and filtering client-side after the fact — let the backend be the source of truth for which vehicles are eligible.

---

## Screen 3 — Drivers & Safety Profiles

**Route**: `/drivers`

**Table columns**: Driver, License No., Category (e.g. LMV/HMV), Expiry date, Contact, Trip Completion %, Safety score %, Status (badge: Available/On Trip/Off Duty/Suspended).

**Totals/status strip** below the table: counts per status (Available, On Trip, Off Duty, Suspended) — derive from the same fetched driver list, or a dedicated `/drivers/status-summary` endpoint if the list is paginated.

**Business rule** (shown as a footnote in the template): expired license or `Suspended` status blocks trip assignment. This should be enforced server-side (the backend should reject the assignment), and the frontend should reflect that by disabling the driver in the Trip Dispatcher's driver-select and showing why (tooltip: "License expired" / "Suspended").

- Fetch: `GET /drivers?search=`
- "+ Add Driver" form → `POST /drivers`.

---

## Screen 4 — Trip Dispatcher

**Route**: `/trips`

**Trip lifecycle stepper**: Draft → Dispatched → Completed → Cancelled. Build as a small horizontal stepper component (`components/trip-stepper.tsx`) that takes a `currentStatus` prop and highlights the matching step — reusable for both the create-form header and any trip detail view.

**Create Trip form** (left panel):
- Source (text/autocomplete — depot names, fetch from `/depots`)
- Destination (same pattern)
- "Vehicle (available only)" select → `GET /vehicles?status=Available`
- Driver select → `GET /drivers?status=Available&licenseValid=true`
- Cargo weight (kg) input
- Planned distance (km) input
- Inline capacity validation banner (red box in template: "Vehicle Capacity 500 kg / Cargo Weight 700 kg — Capacity exceeded by 200 kg — dispatch blocked"). This check can be done client-side for instant feedback (compare selected vehicle's capacity field to entered cargo weight) AND must be re-validated server-side on submit — don't rely on the client check alone, since it's a safety-relevant business rule.
- "Dispatch (disabled)" / active dispatch button + "Cancel" button.
- Submit → `POST /trips`.

**Live Board panel** (right side): list of trip cards (Trip ID, route, vehicle/driver, current status badge, ETA or note like "Awaiting vehicle"/"Awaiting driver"/"Vehicle sent to shop").
- Fetch: `GET /trips/live` — consider polling (e.g. every 15–30s) or a websocket/SSE connection if the backend supports it, since this is meant to be "live."

**Footnote rule**: "On complete: odometer → fuel log → expenses → Vehicle & Driver Available" — this is a backend-side state transition; the frontend just needs to reflect updated statuses after a trip is marked complete (re-fetch or optimistically update the relevant vehicle/driver records).

---

## Screen 5 — Maintenance

**Route**: `/maintenance`

**Log Service Record form** (left): Vehicle (select, fetch from `/vehicles`), Service Type (select — Oil Change/Engine Repair/Tyre Replace/etc., fetch from `/maintenance/service-types` or a fixed backend-defined enum route), Cost, Date, Status (select). Submit → `POST /maintenance`.

**Service Log table** (right): Vehicle, Service, Cost, Status (badge). Fetch: `GET /maintenance?search=`.

**Status flow diagram**: small visual (Available ↔ In Shop) — can be a static illustrative component since it's explaining a rule, not displaying data, but the actual status transition happens server-side when a maintenance record is created/completed.

**Footnote rule**: "In Shop vehicles are removed from the dispatch pool" — again, this needs to be true in the `/vehicles?status=Available` filter used on Screen 4, not a separate frontend-only filter.

---

## Screen 6 — Fuel & Expense Management

**Route**: `/fuel-expenses`

**Fuel Logs table**: Vehicle, Date, Liters, Cost. "+ Log Fuel" button opens a form → `POST /fuel-logs`.

**Other Expenses (Toll/Misc) table**: Trip, Vehicle, Toll, Other, Maint. (linked), Total, Status (badge). "+ Add Expense" → `POST /expenses`.

**Total Operational Cost (Auto)** footer row: "Fuel + Maintenance" — **do not compute and hardcode this in the frontend from partial data**; fetch the computed total from the backend (e.g. `GET /expenses/summary` returning `{ totalOperationalCost }`) so it always matches whatever aggregation logic the backend uses (including any records not shown on the current page).

---

## Screen 7 — Reports & Analytics

**Route**: `/analytics`

**KPI cards**: Fuel Efficiency (km/l), Fleet Utilization %, Operational Cost, Vehicle ROI %. Fetch: `GET /analytics/kpis`.

**Monthly Revenue bar chart**: use `recharts` `BarChart`. Fetch: `GET /analytics/monthly-revenue` → array of `{ month, revenue }`.

**Top Costliest Vehicles**: horizontal bar list (vehicle id + proportional bar). Fetch: `GET /analytics/top-costliest-vehicles`.

**ROI formula note** shown in template ("ROI = Revenue − (Maintenance + Fuel / Acquisition Cost)") — this is documentation of backend logic, not something to reimplement in the frontend; just display whatever the backend returns for ROI per vehicle/fleet.

---

## Screen 8 — Settings & RBAC

**Route**: `/settings`

**General section**: Depot Name (input), Currency (select), Distance Unit (select). Fetch current values: `GET /settings`. Submit changes: `PATCH /settings` (or `PUT`), triggered by the "Save changes" button — don't auto-save on every keystroke.

**Role-Based Access (RBAC) matrix**: table with roles as rows (Fleet Manager, Dispatcher, Safety Officer, Financial Analyst) and modules as columns (Fleet, Drivers, Trips, Fuel/Exp, Analytics), cells showing ✓ (full access) / view / — (no access).
- Fetch: `GET /settings/rbac-matrix` — this table must reflect the backend's actual permission config, since it's also what the frontend uses to decide which nav items/actions to show per role elsewhere in the app. Treat this as the single source of truth, don't duplicate a separate hardcoded permissions object in the frontend.
- If editable (depends on whether Settings allows changing permissions), changes submit via `PATCH /settings/rbac-matrix`.

---

## `lib/api.ts` — shared fetch wrapper

```ts
const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!BASE_URL) {
  throw new Error("NEXT_PUBLIC_BACKEND_URL is not set");
}

interface ApiOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiFetch<T>(route: string, options: ApiOptions = {}): Promise<T> {
  const { params, ...init } = options;

  const url = new URL(`${BASE_URL}${route.startsWith("/") ? route : `/${route}`}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(key, String(value));
    });
  }

  const res = await fetch(url.toString(), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
    credentials: "include", // send auth cookies
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${route} failed: ${res.status} ${body}`);
  }

  return res.json() as Promise<T>;
}
```

Usage example:

```ts
const summary = await apiFetch<DashboardSummary>("/dashboard/summary", {
  params: { vehicleType, status, region },
});
```

**Rule**: no component should call `fetch(...)` directly with a manually concatenated URL — always go through `apiFetch` so the base URL, error handling, and auth cookie behavior stay consistent across all 9 screens.

---

## `.env.local` (example — not committed)

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

Swap this per environment (dev/staging/prod) — never hardcode a backend host string anywhere in component code.
