import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { generateToken, JwtPayload } from "../services/jwt";
import { hashPassword, verifyPassword } from "../services/password";
import { validateBody } from "../middleware/validate";
import { Role, UserStatus } from "../types";

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["viewer", "analyst", "admin"]).default("viewer"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

type DbAuthUser = {
  id: number;
  name: string;
  email: string;
  password: string;
  role: Role;
  status: UserStatus;
};

function findUserByEmail(email: string): DbAuthUser | undefined {
  return db
    .prepare(
      `SELECT id, name, email, password, role, status
       FROM users
       WHERE email = ?`
    )
    .get(email) as DbAuthUser | undefined;
}

function createAuthPayload(user: Pick<DbAuthUser, "id" | "email" | "role">): JwtPayload {
  return {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
}

export const authRouter = Router();

authRouter.post(
  "/register",
  validateBody(registerSchema),
  async (req, res) => {
    try {
      const { name, email, password, role } = req.body;

      const existingUser = db.prepare("SELECT id FROM users WHERE email = ?").get(email);

      if (existingUser) {
        res.status(400).json({ message: "Email already registered" });
        return;
      }

      const hashedPassword = await hashPassword(password);
      const now = new Date().toISOString();

      const result = db
        .prepare(
          `INSERT INTO users (name, email, password, role, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'active', ?, ?)`
        )
        .run(name, email, hashedPassword, role, now, now);

      const userId = (result.lastInsertRowid as number) || 0;

      const token = generateToken(createAuthPayload({ id: userId, email, role }));

      res.status(201).json({
        message: "User registered successfully",
        token,
        user: {
          id: userId,
          name,
          email,
          role,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Registration failed" });
    }
  }
);

authRouter.post("/login", validateBody(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = findUserByEmail(email);

    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    if (user.status === "inactive") {
      res.status(403).json({ message: "User account is inactive" });
      return;
    }

    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const token = generateToken(createAuthPayload(user));

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
});
