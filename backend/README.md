# Financial Data Management Backend

Backend API for authentication, role-based access control, financial records, and dashboard analytics.

## Features

- JWT authentication with bcrypt password hashing
- Role-based authorization: viewer, analyst, admin
- User management for admins
- Financial records CRUD with filtering and pagination
- Dashboard summary endpoint (totals, trends, recent activity)
- Zod validation and structured error responses
- Swagger UI and OpenAPI JSON documentation

## Tech Stack

- Node.js
- Express
- TypeScript
- SQLite via better-sqlite3
- Zod
- jsonwebtoken
- bcryptjs
- swagger-ui-express

## Folder Structure

```txt
src/
  app.ts
  db.ts
  seed.ts
  types.ts
  docs/
    openapi.ts
  middleware/
    auth.ts
    error.ts
    validate.ts
  routes/
    auth.ts
    users.ts
    records.ts
    dashboard.ts
  services/
    jwt.ts
    password.ts
```

## Environment Variables

Create a local environment file and configure at least the values below.

```env
PORT=4000
JWT_SECRET=replace-with-a-strong-secret
```

Optional variables for demo seeding:

```env
SEED_DEMO_USERS=true
SEED_USERS_JSON=[{"name":"Admin User","email":"admin@example.com","password":"strong-password","role":"admin"}]
SEED_RECORDS_JSON=[{"amount":1000,"type":"income","category":"Salary","date":"2026-04-01","notes":"Monthly","createdByEmail":"admin@example.com"}]
```

## Install and Run

1. Install dependencies

```bash
npm install
```

2. Start development server

```bash
npm run dev
```

3. Build and run production mode

```bash
npm run build
npm run start
```

Default server URL: http://localhost:4000

## API Docs

- Swagger UI: http://localhost:4000/api/docs
- OpenAPI JSON: http://localhost:4000/api/openapi.json

For protected endpoints, authorize with:

```txt
Bearer <jwt-token>
```

## Scripts

- npm run dev: run backend in watch mode
- npm run build: compile TypeScript
- npm run start: run compiled output
- npm run seed: run seed script
- npm run check: type-check without emit

## Authentication and Roles

JWT is required for all protected endpoints and must be sent in the Authorization header.

Role permissions:

- viewer: dashboard summary read access
- analyst: dashboard + records read access
- admin: full access including user management and records write operations

Inactive users are blocked even with valid credentials.

## Seed Behavior

The seed script is environment-driven.

- Without SEED_DEMO_USERS=true:
  - Clears financial_records only
  - Does not create demo users
- With SEED_DEMO_USERS=true:
  - Expects SEED_USERS_JSON and SEED_RECORDS_JSON
  - Seeds users and records from provided JSON values

PowerShell example:

```powershell
$env:SEED_DEMO_USERS="true"
$env:SEED_USERS_JSON='[{"name":"Admin User","email":"admin@example.com","password":"strong-password","role":"admin"}]'
$env:SEED_RECORDS_JSON='[{"amount":1000,"type":"income","category":"Salary","date":"2026-04-01","notes":"Monthly","createdByEmail":"admin@example.com"}]'
npm run seed
```

## Endpoint Summary

Public:

- GET /health
- POST /api/auth/register
- POST /api/auth/login
- GET /api/openapi.json
- GET /api/docs

Protected:

- Users (admin):
  - GET /api/users
  - POST /api/users
  - PATCH /api/users/:id
  - DELETE /api/users/:id
- Records (analyst/admin read, admin write):
  - GET /api/records
  - POST /api/records
  - PATCH /api/records/:id
  - DELETE /api/records/:id
- Dashboard (viewer/analyst/admin):
  - GET /api/dashboard/summary

## Common Error Responses

- 400: validation failure or invalid request data
- 401: missing or invalid token
- 403: insufficient permission or inactive user
- 404: resource or route not found
- 409: unique constraint conflict
- 500: unexpected server error

## Notes

- SQLite database file is created at backend/data.db
- Use a strong JWT_SECRET in non-local environments
- Keep seed JSON data and secrets out of source control
