import { NextFunction, Request, Response } from "express";
import { db } from "../db";
import { AuthContext, Role } from "../types";
import { verifyToken } from "../services/jwt";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export function jwtAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      message: "Missing or invalid Authorization header",
    });
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ message: "Invalid or expired token" });
    return;
  }

  const row = db
    .prepare(
      `SELECT id, name, email, role, status
       FROM users
       WHERE id = ?`
    )
    .get(payload.userId) as AuthContext | undefined;

  if (!row) {
    res.status(401).json({ message: "User not found" });
    return;
  }

  if (row.status === "inactive") {
    res.status(403).json({ message: "User account is inactive" });
    return;
  }

  req.auth = row;
  next();
}

export function requireRole(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (!allowedRoles.includes(req.auth.role)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }

    next();
  };
}
