# LoneStar WFM (bare minimum)

Mobile-first workforce check-in web app with worker photo/GPS upload and admin map dashboard.

## Stack

- **API**: Node.js + Express + SQLite + JWT
- **Web**: Vite + React (responsive), MapLibre GL (`react-map-gl`) with keyless [OpenFreeMap](https://openfreemap.org) vector tiles
- Later: same API for Android/iOS apps

## Quick start

Requires [pnpm](https://pnpm.io/installation) (or enable via Corepack: `corepack enable`).

Run from **`lonestarwfm/`**, or from the parent **`lone-star-projects/`** folder (root `package.json` forwards the same scripts).

```bash
cd lonestarwfm   # skip if already here
pnpm install
pnpm seed:fresh  # recommended: admin, WRK001, and 20 demo workers with map data
pnpm dev
```

- Web: http://localhost:5173
- API: http://localhost:4000

Login uses **Employee ID** + password (not email).

### Accounts (after `pnpm seed:fresh`)

| Role   | Employee ID | Password    | Display name (username)   |
|--------|-------------|-------------|---------------------------|
| Admin  | `ADMIN001`  | `admin123`  | Admin                     |
| Worker | `WRK001`    | `worker123` | Demo Worker               |

**Demo workers** (all password **`worker123`**):

| Employee ID | Display name | Zone (Medina) |
|-------------|--------------|---------------|
| `DEMO001`   | Haram Worker 1 | Al-Masjid an-Nabawi |
| `DEMO002`   | Haram Worker 2 | Al-Masjid an-Nabawi |
| `DEMO003`   | Haram Worker 3 | Al-Masjid an-Nabawi |
| `DEMO004`   | Haram Worker 4 | Al-Masjid an-Nabawi |
| `DEMO005`   | Haram Worker 5 | Al-Masjid an-Nabawi |
| `DEMO006`   | Quba Worker 1 | Quba Mosque |
| `DEMO007`   | Quba Worker 2 | Quba Mosque |
| `DEMO008`   | Quba Worker 3 | Quba Mosque |
| `DEMO009`   | Quba Worker 4 | Quba Mosque |
| `DEMO010`   | Quba Worker 5 | Quba Mosque |
| `DEMO011`   | Uhud Worker 1 | Mount Uhud |
| `DEMO012`   | Uhud Worker 2 | Mount Uhud |
| `DEMO013`   | Uhud Worker 3 | Mount Uhud |
| `DEMO014`   | Uhud Worker 4 | Mount Uhud |
| `DEMO015`   | Uhud Worker 5 | Mount Uhud |
| `DEMO016`   | Airport Worker 1 | Prince Mohammad bin Abdulaziz Airport |
| `DEMO017`   | Airport Worker 2 | Prince Mohammad bin Abdulaziz Airport |
| `DEMO018`   | Airport Worker 3 | Prince Mohammad bin Abdulaziz Airport |
| `DEMO019`   | Airport Worker 4 | Prince Mohammad bin Abdulaziz Airport |
| `DEMO020`   | Airport Worker 5 | Prince Mohammad bin Abdulaziz Airport |

Workers can also self-register from the Register screen.

### Seeding demo map data

Creates **20 workers** in four zones of **Medina (Al-Madinah, Saudi Arabia)** with photo check-ins and GPS trails around each zone. All uploads share one image: `server/uploads/seed-demo-checkin.jpg`.

Per zone (5 workers each), seed **scenarios**:

| Slot | Scenario | Behavior |
|------|----------|----------|
| 1–2 | **stationary** | Photos/GPS stay at site (± few meters) — movement history shows no real travel |
| 3–4 | **onsite** | Small steps **5–25 m** between check-ins |
| 5 | **away** | Mostly onsite, then latest photos/GPS **~4–7 km** from site |

Admin dashboard defaults to **All of Medina**; the **Region** dropdown narrows the map and the right-hand feed to one zone (Haram, Quba, Uhud, Airport).

| Command | What it does |
|---------|----------------|
| `pnpm seed:fresh` | Truncate users/photos/locations → admin + WRK001 → 20 demo workers |
| `pnpm seed` | Admin + WRK001 only (if missing) |
| `pnpm seed:demo` | Demo workers only |
| `pnpm seed:demo -- --clean` | Remove existing DEMO users, then re-seed demo |
| `pnpm seed:truncate` | Wipe users, photos, locations (keeps settings) |

From parent folder:

```bash
cd lone-star-projects
pnpm seed:fresh
```

## Features (MVP)

1. Register / login with **Employee ID**
2. Worker opens camera, captures photo + lat/long + comment, uploads
3. While the worker tab is **open and visible**, the browser sends GPS pings on the configured interval (default **10 minutes**); pings stop on logout, navigation away, or tab close
4. Admin dashboard: **70%** live worker map + **30%** recent uploads feed; auto-refresh (default **5 minutes**, admin-configurable)
5. Worker detail (`/admin/worker/:userId`): photo check-in trail (dotted line), toggle for GPS **movement history**
6. Admin can change worker GPS ping interval and dashboard refresh interval (profile avatar menu → **Settings**)

## API (summary)

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/auth/register` | Create user |
| POST | `/api/auth/login` | `{ employee_id, password }` |
| GET | `/api/auth/me` | Current user |
| POST | `/api/photos` | multipart: `photo`, `latitude`, `longitude`, `comment` |
| GET | `/api/photos/mine` | Worker photos |
| GET | `/api/photos/recent` | Admin/manager — recent uploads (all users) |
| GET | `/api/photos/user/:userId` | Admin/manager — `{ worker, photos }` |
| POST | `/api/locations` | GPS ping |
| GET | `/api/locations/latest` | Admin/manager — map markers |
| GET | `/api/locations/user/:userId/history` | Admin/manager — GPS trail (`?days=1`) |
| GET/PUT | `/api/locations/settings` | `gps_interval_minutes`, `dashboard_refresh_minutes` |

Photos are stored in `server/uploads/` and served at `/uploads/<filename>`.

## Notes

- Camera + location require HTTPS or `localhost`
- Background GPS when the app is closed requires a native app; the web worker view only pings with an active, visible tab
- Server logs: `[GPS]` on location ping, `[NOTIFY]` on photo upload
- Manager role shares the admin map view for now
