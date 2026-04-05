# Financial Data Management

Full-stack financial management system with role-based access control, analytics dashboard, records management, and Swagger/OpenAPI documentation.

## Monorepo Structure

- [backend](backend): Express + TypeScript + SQLite API
- [frontend](frontend): React + TypeScript (Vite)

## Core Features

- JWT authentication (register/login)
- Role-based authorization: viewer, analyst, admin
- Admin user management (create/update/delete users)
- Financial records CRUD with filters and pagination
- Dashboard summaries and trend analytics
- Interactive Swagger docs + OpenAPI JSON

## Prerequisites

- Node.js 20.19+ (or 22.12+)
- npm

## Quick Start (Local)

1. Start backend

```bash
cd backend
npm install
npm run dev
```

Backend default URL: http://localhost:4000

2. Start frontend in a second terminal

```bash
cd frontend
npm install
npm run dev
```

Frontend default URL: http://localhost:5173

## Backend API Docs

- Swagger UI: http://localhost:4000/api/docs
- OpenAPI JSON: http://localhost:4000/api/openapi.json

For protected endpoints, authorize in Swagger with:

```txt
Bearer <jwt-token>
```

## Environment Setup

### Backend

At minimum configure:

```env
PORT=4000
JWT_SECRET=replace-with-a-strong-secret
```

Optional seed variables:

```env
SEED_DEMO_USERS=true
SEED_USERS_JSON=[{"name":"Admin User","email":"admin@example.com","password":"strong-password","role":"admin"}]
SEED_RECORDS_JSON=[{"amount":1000,"type":"income","category":"Salary","date":"2026-04-01","notes":"Monthly","createdByEmail":"admin@example.com"}]
```

### Frontend

Optional API base override:

```env
VITE_API_BASE=https://your-backend-domain
```

When `VITE_API_BASE` is not set, frontend uses relative API paths (works with Vite proxy in local dev).

## Build Commands

### Backend

```bash
cd backend
npm run build
npm run start
```

### Frontend

```bash
cd frontend
npm run build
npm run preview
```

## Seeding Notes

- `npm run seed` in backend always clears records.
- Demo users and records are created only when `SEED_DEMO_USERS=true` and JSON env variables are provided.

## Auth and Roles

- viewer: dashboard summary access
- analyst: dashboard + records read
- admin: full access (including user management and records write)

## Deployment (Render)

For backend web service:

- Root Directory: `backend`
- Build Command: `npm install && npm run build`
- Start Command: `npm run start`
- Environment Variable: `JWT_SECRET`

Deployed docs URLs:

- `https://<your-backend>.onrender.com/api/docs`
- `https://<your-backend>.onrender.com/api/openapi.json`

## Common API Troubleshooting

- `401 Missing or invalid Authorization header`: missing `Bearer <token>`
- `403 Insufficient permissions`: token user role cannot access endpoint
- `500 NOT NULL constraint failed: users.password`: `/api/users` requires password in create body

## Evaluation Criteria Mapping

### 1. Backend Design

- Clear modular structure under `backend/src`:
	- `routes/` for API handlers
	- `middleware/` for auth, validation, and error handling
	- `services/` for JWT and password utilities
	- `db.ts` for schema initialization and persistence setup
- Routes are grouped by domain: auth, users, records, dashboard.

### 2. Logical Thinking

- Business rules are enforced through role middleware:
	- viewer: dashboard summary
	- analyst: dashboard + records read
	- admin: user management + records write
- Inactive users are blocked at authentication middleware level.

### 3. Functionality

- Authentication: register and login with JWT.
- User lifecycle: list, create, update, delete.
- Records lifecycle: list with filters + create/update/delete.
- Dashboard analytics: totals, category splits, trends, recent activity.
- Interactive API docs available through Swagger.

### 4. Code Quality

- TypeScript with strict typing and consistent naming.
- Reusable helper functions reduce route-level duplication.
- Validation is centralized and route handlers remain focused on business logic.

### 5. Database and Data Modeling

- SQLite schema includes:
	- `users` with role and status constraints
	- `financial_records` with amount/type checks and foreign key to users
- Indexes on record date/type/category support query performance.

### 6. Validation and Reliability

- Zod input validation for request bodies and query parameters.
- Consistent HTTP status handling for auth failures, permission failures, validation errors, and not-found cases.
- Global error middleware normalizes runtime and validation errors.

### 7. Documentation

- Root README: architecture, setup, environment, run/build steps, deployment, troubleshooting.
- Backend README: endpoint behavior, role model, seeding details, and API docs URLs.
- OpenAPI/Swagger docs provide executable API documentation.

### 8. Additional Thoughtfulness

- Deployment-ready Swagger and OpenAPI endpoints.
- Environment-driven seeding strategy for flexible test data setup.
- Render deployment guidance included for quick hosting and verification.

## Assumptions and Tradeoffs

- SQLite is used for simplicity and portability; for larger scale workloads, migration to a managed relational database is recommended.
- JWT tokens are stateless and simple for deployment; token revocation strategy can be added later if required.
- Current architecture prioritizes clarity and assignment fit over advanced patterns like repository abstraction layers.

## Detailed Docs

- Backend details: [backend/README.md](backend/README.md)
- Frontend details: [frontend/README.md](frontend/README.md)
