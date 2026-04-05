# Finance Dashboard Frontend

This frontend is a separate project that consumes the backend APIs from the `backend/` folder.

## Features

- Role-based dashboard behavior using demo user switcher
- Multi-page navigation bar (Dashboard, Records, Admin)
- Summary cards: income, expense, net balance
- Record list with filters (type, category, date range)
- Admin-only record creation form
- Admin-only user list section
- Admin can change user role and status directly from dashboard
- Trend table from dashboard summary response

## Local Run

1. Start backend first:

```bash
cd ../backend
npm install
npm run seed
npm run dev
```

2. Start frontend:

```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Backend Connection

The frontend uses Vite dev proxy:

- `/api/*` -> `http://localhost:4000`
- `/health` -> `http://localhost:4000`

No frontend environment variables are required for local development.

## Demo Users

User switching in UI maps to backend mock auth header `x-user-id`:

- `1` admin
- `2` analyst
- `3` viewer

## Build

```bash
npm run build
```
