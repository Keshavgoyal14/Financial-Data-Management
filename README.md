# Financial Data Management Workspace

This workspace is now split into two independent projects:

- `backend/` - Finance Data Processing and Access Control API (Express + TypeScript + SQLite)
- `frontend/` - Frontend application (React + TypeScript)

## Run Backend

```bash
cd backend
npm install
npm run seed
npm run dev
```

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

If frontend fails to run due to Node version requirements, use Node 20.19+ (or Node 22.12+).
