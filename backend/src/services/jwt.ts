import jwt from "jsonwebtoken";

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
}

const SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, {
    expiresIn: "30d",
  });
}
