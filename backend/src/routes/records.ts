import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { requireRole } from "../middleware/auth";
import { parseQuery, validateBody } from "../middleware/validate";

const recordSchema = z.object({
  amount: z.number().nonnegative(),
  type: z.enum(["income", "expense"]),
  category: z.string().min(2).max(100),
  date: z.string().date(),
  notes: z.string().max(500).optional().nullable(),
});

const updateRecordSchema = z
  .object({
    amount: z.number().nonnegative().optional(),
    type: z.enum(["income", "expense"]).optional(),
    category: z.string().min(2).max(100).optional(),
    date: z.string().date().optional(),
    notes: z.string().max(500).optional().nullable(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

const querySchema = z.object({
  type: z.enum(["income", "expense"]).optional(),
  category: z.string().min(1).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  page: z.coerce.number().int().min(1).default(1),
});

export const recordsRouter = Router();

const recordSelectSql = `SELECT id, amount, type, category, date, notes, created_by AS createdBy, created_at AS createdAt, updated_at AS updatedAt
                         FROM financial_records`;

function parsePositiveId(rawId: unknown): number | null {
  if (typeof rawId !== "string") {
    return null;
  }

  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function buildRecordWhereClause(query: z.infer<typeof querySchema>) {
  const where: string[] = [];
  const values: unknown[] = [];

  if (query.type) {
    where.push("type = ?");
    values.push(query.type);
  }
  if (query.category) {
    where.push("category = ?");
    values.push(query.category);
  }
  if (query.startDate) {
    where.push("date >= ?");
    values.push(query.startDate);
  }
  if (query.endDate) {
    where.push("date <= ?");
    values.push(query.endDate);
  }

  return {
    whereClause: where.length ? `WHERE ${where.join(" AND ")}` : "",
    values,
  };
}

function findRecordById(id: number) {
  return db.prepare(`${recordSelectSql} WHERE id = ?`).get(id);
}

recordsRouter.get("/", requireRole(["analyst", "admin"]), (req, res) => {
  const query = parseQuery(querySchema, req);
  const { whereClause, values } = buildRecordWhereClause(query);
  const offset = (query.page - 1) * query.limit;

  const total = db
    .prepare(`SELECT COUNT(*) AS count FROM financial_records ${whereClause}`)
    .get(...values) as { count: number };

  const rows = db
    .prepare(
      `${recordSelectSql}
       ${whereClause}
       ORDER BY date DESC, id DESC
       LIMIT ? OFFSET ?`
    )
    .all(...values, query.limit, offset);

  res.json({
    data: rows,
    meta: {
      total: total.count,
      page: query.page,
      limit: query.limit,
      pages: Math.ceil(total.count / query.limit) || 1,
    },
  });
});

recordsRouter.post("/", requireRole(["admin"]), validateBody(recordSchema), (req, res) => {
  const now = new Date().toISOString();
  const { amount, type, category, date, notes = null } = req.body;

  const result = db
    .prepare(
      `INSERT INTO financial_records (amount, type, category, date, notes, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(amount, type, category, date, notes, req.auth!.id, now, now);

  const record = findRecordById(Number(result.lastInsertRowid));

  res.status(201).json({ data: record });
});

recordsRouter.patch("/:id", requireRole(["admin"]), validateBody(updateRecordSchema), (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid record id" });
    return;
  }

  const existing = db.prepare("SELECT id FROM financial_records WHERE id = ?").get(id);
  if (!existing) {
    res.status(404).json({ message: "Record not found" });
    return;
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  if (req.body.amount !== undefined) {
    fields.push("amount = ?");
    values.push(req.body.amount);
  }
  if (req.body.type !== undefined) {
    fields.push("type = ?");
    values.push(req.body.type);
  }
  if (req.body.category !== undefined) {
    fields.push("category = ?");
    values.push(req.body.category);
  }
  if (req.body.date !== undefined) {
    fields.push("date = ?");
    values.push(req.body.date);
  }
  if (req.body.notes !== undefined) {
    fields.push("notes = ?");
    values.push(req.body.notes);
  }

  fields.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  db.prepare(`UPDATE financial_records SET ${fields.join(", ")} WHERE id = ?`).run(...values);

  const record = findRecordById(id);

  res.json({ data: record });
});

recordsRouter.delete("/:id", requireRole(["admin"]), (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid record id" });
    return;
  }

  const result = db.prepare("DELETE FROM financial_records WHERE id = ?").run(id);
  if (result.changes === 0) {
    res.status(404).json({ message: "Record not found" });
    return;
  }

  res.status(204).send();
});
