import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ message: "Route not found" });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      message: "Validation failed",
      issues: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (err && typeof err === "object" && "code" in err) {
    const sqliteError = err as { code?: string; message?: string };
    if (sqliteError.code === "SQLITE_CONSTRAINT_UNIQUE") {
      res.status(409).json({ message: "Unique constraint violation" });
      return;
    }
  }

  const message = err instanceof Error ? err.message : "Internal server error";
  res.status(500).json({ message });
}
