# Role-Based Access Control (RBAC) Guide

## Role Permissions

### 👤 Viewer Role
**Access Level:** Read-only dashboard viewer

**Allowed:**
- ✅ View dashboard summary (`GET /api/dashboard/summary`)
- ✅ View total income, expenses, net balance
- ✅ View trends and category breakdown
- ✅ View recent financial activity

**Denied:**
- ❌ View individual records list
- ❌ Create/Edit/Delete records
- ❌ Access user management
- ❌ Create accounts

**Use Case:** Executive, stakeholder, or investor viewing high-level financial overview

---

### 📊 Analyst Role  
**Access Level:** Records viewer and insights analyzer

**Allowed:**
- ✅ View dashboard summary (same as viewer)
- ✅ View financial records list (`GET /api/records`)
- ✅ Filter records by type, category, date range
- ✅ Paginate through records
- ✅ Access historical analysis and trends

**Denied:**
- ❌ Create new records
- ❌ Edit/Update existing records
- ❌ Delete records
- ❌ Access user management
- ❌ Change user roles or status

**Use Case:** Financial analyst, auditor, or accountant reviewing transactions

---

### 🔧 Admin Role
**Access Level:** Full administrative access

**Allowed:**
- ✅ All permissions from Viewer and Analyst
- ✅ Create financial records (`POST /api/records`)
- ✅ Edit/Update financial records (`PATCH /api/records/:id`)
- ✅ Delete financial records (`DELETE /api/records/:id`)
- ✅ View all users (`GET /api/users`)
- ✅ Create new users (`POST /api/users`)
- ✅ Update user roles and status (`PATCH /api/users/:id`)
- ✅ Deactivate/Delete users (`DELETE /api/users/:id`)
- ✅ Manage user permissions and access control

**Use Case:** System administrator, financial manager, or operations lead

---

## Frontend Access Control

### Login Page (`/login`, `/register`)
- Accessible to: All unauthenticated users
- Purpose: Authentication entry point

### Dashboard (`/`)
- **Accessible to:** Viewer, Analyst, Admin
- **Features:**
  - Income/Expense overview (all roles)
  - Trend charts (all roles)
  - Category breakdown (all roles)
  - Recent activity (all roles)
  - Insights and analytics (all roles)

### Records Page (`/records`)
- **Accessible to:** Analyst, Admin
- **Admin features:**
  - ✅ Create new financial record form (visible)
  - ✅ Submit form enabled
- **Analyst features:**
  - ✅ View all records
  - ✅ Filter by type, category, date
  - ✅ Paginate through records
  - ❌ Create record form (hidden)
  - ❌ Delete records
  - ℹ️ Info message: "Record creation is restricted to Administrators only"

### Admin Panel (`/admin`)
- **Accessible to:** Admin only
- **Features:**
  - Create new users
  - View all users
  - Edit user roles (viewer ↔ analyst ↔ admin)
  - Edit user status (active ↔ inactive)
  - Delete users
  - Reset passwords

### Protected Routes
- Dashboard: Protected by `ProtectedRoute` (requires authentication)
- Records: Protected by `RecordsRoute` (requires analyst or admin)
- Admin: Protected by `AdminRoute` (requires admin only)
- Fallback: Redirect to `/` (home page)

---

## Test Credentials

### Default Seeded Users

| Email | Password | Role | Full Access |
|-------|----------|------|-------------|
| `admin@finance.local` | `admin123456` | Admin | ✅ Full |
| `analyst@finance.local` | `analyst123456` | Analyst | 📊 Records + Insights |
| `viewer@finance.local` | `viewer123456` | Viewer | 👁️ Dashboard only |

---

## API Endpoint Access Matrix

| Endpoint | Viewer | Analyst | Admin |
|----------|--------|---------|-------|
| `GET /health` | ✅ | ✅ | ✅ |
| `POST /auth/login` | ✅ | ✅ | ✅ |
| `POST /auth/register` | ✅ | ✅ | ✅ |
| `GET /api/dashboard/summary` | ✅ | ✅ | ✅ |
| `GET /api/records` | ❌ | ✅ | ✅ |
| `POST /api/records` | ❌ | ❌ | ✅ |
| `PATCH /api/records/:id` | ❌ | ❌ | ✅ |
| `DELETE /api/records/:id` | ❌ | ❌ | ✅ |
| `GET /api/users` | ❌ | ❌ | ✅ |
| `POST /api/users` | ❌ | ❌ | ✅ |
| `PATCH /api/users/:id` | ❌ | ❌ | ✅ |
| `DELETE /api/users/:id` | ❌ | ❌ | ✅ |

---

## Implementation Details

### Backend (Express.js)
- `requireRole()` middleware enforces permissions on routes
- Invalid roles return `403 Forbidden`
- Inactive users return `403 Forbidden`

### Frontend (React)
- Route guards check user role before rendering pages
- Components conditionally show/hide features based on role
- Info messages inform analysts why certain features are unavailable
- LocalStorage persists JWT token across sessions

---

## Important Notes

1. **Token Expiration:** JWT tokens expire after 7 days
2. **Session Persistence:** Tokens are stored in browser localStorage
3. **Inactive Users:** Cannot access any protected endpoint
4. **Role Changes:** Require user logout/login for immediate effect
5. **Records History:** Records maintain `created_by` and `created_at` for audit
6. **Soft Delete:** Currently not implemented; use status deactivation for record archiving
