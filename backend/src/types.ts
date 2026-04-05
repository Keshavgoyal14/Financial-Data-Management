export type Role = "viewer" | "analyst" | "admin";

export type UserStatus = "active" | "inactive";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialRecord {
  id: number;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  notes: string | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthContext {
  id: number;
  role: Role;
  status: UserStatus;
  name: string;
  email: string;
}
