import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { requireRole } from "../middleware/auth";
import { parseQuery } from "../middleware/validate";

const querySchema = z.object({
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  trend: z.enum(["monthly", "weekly"]).default("monthly"),
});

type SummaryQuery = z.infer<typeof querySchema>;

function buildDateWhereClause(query: SummaryQuery) {
  const where: string[] = [];
  const values: unknown[] = [];

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

export const dashboardRouter = Router();

dashboardRouter.get("/summary", requireRole(["viewer", "analyst", "admin"]), (req, res) => {
  const query = parseQuery(querySchema, req);
  const { whereClause, values } = buildDateWhereClause(query);

  const totals = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0) AS totalIncome,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) AS totalExpense
       FROM financial_records
       ${whereClause}`
    )
    .get(...values) as { totalIncome: number; totalExpense: number };

  const categoryTotals = db
    .prepare(
      `SELECT category,
              COALESCE(SUM(amount), 0) AS total,
              type
       FROM financial_records
       ${whereClause}
       GROUP BY category, type
       ORDER BY total DESC`
    )
    .all(...values);

  const recentActivity = db
    .prepare(
      `SELECT id, amount, type, category, date, notes, created_by AS createdBy
       FROM financial_records
       ${whereClause}
       ORDER BY date DESC, id DESC
       LIMIT 5`
    )
    .all(...values);

  const trendExpression =
    query.trend === "weekly"
      ? "strftime('%Y-W%W', date)"
      : "strftime('%Y-%m', date)";

  const trends = db
    .prepare(
      `SELECT ${trendExpression} AS period,
              COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0) AS income,
              COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) AS expense
       FROM financial_records
       ${whereClause}
       GROUP BY period
       ORDER BY period ASC`
    )
    .all(...values);

  res.json({
    data: {
      totalIncome: totals.totalIncome,
      totalExpenses: totals.totalExpense,
      netBalance: totals.totalIncome - totals.totalExpense,
      categoryTotals,
      recentActivity,
      trends,
    },
  });
});
