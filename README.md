# LoneStar WFM (bare minimum)

Mobile-first workforce check-in web app with worker photo/GPS upload and admin map dashboard.

## Stack

- **API**: Node.js + Express + SQLite + JWT
- **Web**: Vite + React (responsive), Leaflet map
- Later: same API for Android/iOS apps

## Quick start

Requires [pnpm](https://pnpm.io/installation) (or enable via Corepack: `corepack enable`).

```bash
pnpm install
pnpm seed
pnpm dev
```

- Web: http://localhost:5173
- API: http://localhost:4000

### Demo accounts

| Role   | Employee ID | Password  |
|--------|-------------|-----------|
| Admin  | `ADMIN001`  | `admin123` |
| Worker | `WRK001`    | `worker123` |

Workers can also self-register from the Register screen.

## Features (MVP)

1. Register / login with **Employee ID**
2. Worker opens camera, captures photo + lat/long + comment, uploads
3. While the worker tab is **open and visible**, the browser sends GPS pings on the configured interval (default **10 minutes**); pings stop on logout, navigation away, or tab close
4. Admin dashboard: 70% live worker map + 30% recent uploads feed; refreshes on a configurable interval (default **5 minutes**)
5. Worker detail page: photo check-in trail (dotted line), optional GPS movement history toggle
6. Admin can change worker GPS ping interval and dashboard refresh interval

## API (summary)

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/auth/register` | Create user |
| POST | `/api/auth/login` | `{ employee_id, password }` |
| GET | `/api/auth/me` | Current user |
| POST | `/api/photos` | multipart: `photo`, `latitude`, `longitude`, `comment` |
| GET | `/api/photos/mine` | Worker photos |
| GET | `/api/photos/user/:userId` | Admin/manager |
| POST | `/api/locations` | GPS ping |
| GET | `/api/locations/latest` | Map markers |
| GET/PUT | `/api/locations/settings` | GPS interval |

Photos are stored in `server/uploads/` and served at `/uploads/<filename>`.

## Notes

- Camera + location require HTTPS or `localhost`
- Background GPS when the app is closed requires a native app; the web worker view only pings with an active, visible tab
- Admin “notification” on upload is currently a server log (`[NOTIFY]`) — easy to swap for email/push later
- Manager role shares the admin map view for now
