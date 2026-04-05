export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Financial Data Management API",
    version: "1.0.0",
    description:
      "API for authentication, role-based user management, financial records, and dashboard analytics.",
  },
  servers: [
    {
      url: "/",
      description: "Current server",
    },
  ],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Users" },
    { name: "Records" },
    { name: "Dashboard" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
        required: ["message"],
      },
      AuthUser: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["viewer", "analyst", "admin"] },
        },
        required: ["id", "name", "email", "role"],
      },
      RegisterRequest: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 100 },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
          role: { type: "string", enum: ["viewer", "analyst", "admin"], default: "viewer" },
        },
        required: ["name", "email", "password"],
      },
      LoginRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
        required: ["email", "password"],
      },
      AuthResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          token: { type: "string" },
          user: { $ref: "#/components/schemas/AuthUser" },
        },
        required: ["message", "token", "user"],
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["viewer", "analyst", "admin"] },
          status: { type: "string", enum: ["active", "inactive"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "name", "email", "role", "status", "createdAt", "updatedAt"],
      },
      CreateUserRequest: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 2, maxLength: 120 },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["viewer", "analyst", "admin"] },
          status: { type: "string", enum: ["active", "inactive"] },
        },
        required: ["name", "email", "role"],
      },
      UpdateUserRequest: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 2, maxLength: 120 },
          role: { type: "string", enum: ["viewer", "analyst", "admin"] },
          status: { type: "string", enum: ["active", "inactive"] },
        },
      },
      UserListResponse: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/User" },
          },
        },
        required: ["data"],
      },
      UserResponse: {
        type: "object",
        properties: {
          data: { $ref: "#/components/schemas/User" },
        },
        required: ["data"],
      },
      FinancialRecord: {
        type: "object",
        properties: {
          id: { type: "integer" },
          amount: { type: "number" },
          type: { type: "string", enum: ["income", "expense"] },
          category: { type: "string" },
          date: { type: "string", format: "date" },
          notes: { type: "string", nullable: true },
          createdBy: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: [
          "id",
          "amount",
          "type",
          "category",
          "date",
          "notes",
          "createdBy",
          "createdAt",
          "updatedAt"
        ],
      },
      CreateRecordRequest: {
        type: "object",
        properties: {
          amount: { type: "number", minimum: 0 },
          type: { type: "string", enum: ["income", "expense"] },
          category: { type: "string", minLength: 2, maxLength: 100 },
          date: { type: "string", format: "date" },
          notes: { type: "string", maxLength: 500, nullable: true },
        },
        required: ["amount", "type", "category", "date"],
      },
      UpdateRecordRequest: {
        type: "object",
        properties: {
          amount: { type: "number", minimum: 0 },
          type: { type: "string", enum: ["income", "expense"] },
          category: { type: "string", minLength: 2, maxLength: 100 },
          date: { type: "string", format: "date" },
          notes: { type: "string", maxLength: 500, nullable: true },
        },
      },
      RecordsListResponse: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/FinancialRecord" },
          },
          meta: {
            type: "object",
            properties: {
              total: { type: "integer" },
              page: { type: "integer" },
              limit: { type: "integer" },
              pages: { type: "integer" },
            },
            required: ["total", "page", "limit", "pages"],
          },
        },
        required: ["data", "meta"],
      },
      RecordResponse: {
        type: "object",
        properties: {
          data: { $ref: "#/components/schemas/FinancialRecord" },
        },
        required: ["data"],
      },
      DashboardSummaryResponse: {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              totalIncome: { type: "number" },
              totalExpenses: { type: "number" },
              netBalance: { type: "number" },
              categoryTotals: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    category: { type: "string" },
                    total: { type: "number" },
                    type: { type: "string", enum: ["income", "expense"] },
                  },
                  required: ["category", "total", "type"],
                },
              },
              recentActivity: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "integer" },
                    amount: { type: "number" },
                    type: { type: "string", enum: ["income", "expense"] },
                    category: { type: "string" },
                    date: { type: "string", format: "date" },
                    notes: { type: "string", nullable: true },
                    createdBy: { type: "integer" },
                  },
                  required: ["id", "amount", "type", "category", "date", "notes", "createdBy"],
                },
              },
              trends: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    period: { type: "string" },
                    income: { type: "number" },
                    expense: { type: "number" },
                  },
                  required: ["period", "income", "expense"],
                },
              },
            },
            required: [
              "totalIncome",
              "totalExpenses",
              "netBalance",
              "categoryTotals",
              "recentActivity",
              "trends"
            ],
          },
        },
        required: ["data"],
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    timestamp: { type: "string", format: "date-time" },
                  },
                  required: ["status", "timestamp"],
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "User registered",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "400": {
            description: "Validation failed or email exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "401": {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "403": {
            description: "Inactive account",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/users": {
      get: {
        tags: ["Users"],
        summary: "List users",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "User list",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserListResponse" },
              },
            },
          },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
        },
      },
      post: {
        tags: ["Users"],
        summary: "Create user",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateUserRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "User created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserResponse" },
              },
            },
          },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
          "409": { description: "Unique constraint violation" },
        },
      },
    },
    "/api/users/{id}": {
      patch: {
        tags: ["Users"],
        summary: "Update user",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateUserRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "User updated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserResponse" },
              },
            },
          },
          "400": { description: "Invalid payload" },
          "404": { description: "User not found" },
        },
      },
      delete: {
        tags: ["Users"],
        summary: "Delete user",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          "204": { description: "Deleted" },
          "404": { description: "User not found" },
        },
      },
    },
    "/api/records": {
      get: {
        tags: ["Records"],
        summary: "List records",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "type", in: "query", schema: { type: "string", enum: ["income", "expense"] } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "startDate", in: "query", schema: { type: "string", format: "date" } },
          { name: "endDate", in: "query", schema: { type: "string", format: "date" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 25 } },
        ],
        responses: {
          "200": {
            description: "Record list",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RecordsListResponse" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Records"],
        summary: "Create record",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateRecordRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Record created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RecordResponse" },
              },
            },
          },
        },
      },
    },
    "/api/records/{id}": {
      patch: {
        tags: ["Records"],
        summary: "Update record",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateRecordRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Record updated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RecordResponse" },
              },
            },
          },
          "404": { description: "Record not found" },
        },
      },
      delete: {
        tags: ["Records"],
        summary: "Delete record",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          "204": { description: "Deleted" },
          "404": { description: "Record not found" },
        },
      },
    },
    "/api/dashboard/summary": {
      get: {
        tags: ["Dashboard"],
        summary: "Get dashboard summary",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "startDate", in: "query", schema: { type: "string", format: "date" } },
          { name: "endDate", in: "query", schema: { type: "string", format: "date" } },
          { name: "trend", in: "query", schema: { type: "string", enum: ["monthly", "weekly"], default: "monthly" } },
        ],
        responses: {
          "200": {
            description: "Summary payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DashboardSummaryResponse" },
              },
            },
          },
        },
      },
    },
  },
} as const;
