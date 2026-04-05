import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { requireRole } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

const createUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  role: z.enum(["viewer", "analyst", "admin"]),
  status: z.enum(["active", "inactive"]).optional(),
});

const updateUserSchema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    role: z.enum(["viewer", "analyst", "admin"]).optional(),
    status: z.enum(["active", "inactive"]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export const usersRouter = Router();

const userSelectSql = `SELECT id, name, email, role, status, created_at AS createdAt, updated_at AS updatedAt
                       FROM users`;

function parsePositiveId(rawId: unknown): number | null {
  if (typeof rawId !== "string") {
    return null;
  }

  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function findUserById(id: number) {
  return db.prepare(`${userSelectSql} WHERE id = ?`).get(id);
}

usersRouter.use(requireRole(["admin"]));

usersRouter.get("/", (_req, res) => {
  const users = db.prepare(`${userSelectSql} ORDER BY id ASC`).all();

  res.json({ data: users });
});

usersRouter.post("/", validateBody(createUserSchema), (req, res) => {
  const now = new Date().toISOString();
  const { name, email, role, status = "active" } = req.body;

  const result = db
    .prepare(
      `INSERT INTO users (name, email, role, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(name, email, role, status, now, now);

  const user = findUserById(Number(result.lastInsertRowid));

  res.status(201).json({ data: user });
});

usersRouter.patch("/:id", validateBody(updateUserSchema), (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid user id" });
    return;
  }

  const existing = db.prepare("SELECT id FROM users WHERE id = ?").get(id);
  if (!existing) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  if (req.body.name !== undefined) {
    fields.push("name = ?");
    values.push(req.body.name);
  }
  if (req.body.role !== undefined) {
    fields.push("role = ?");
    values.push(req.body.role);
  }
  if (req.body.status !== undefined) {
    fields.push("status = ?");
    values.push(req.body.status);
  }

  fields.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  db.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`).run(...values);

  const user = findUserById(id);

  res.json({ data: user });
});

usersRouter.delete("/:id", (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid user id" });
    return;
  }

  const result = db.prepare("DELETE FROM users WHERE id = ?").run(id);
  if (result.changes === 0) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.status(204).send();
});
