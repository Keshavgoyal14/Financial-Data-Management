import { NextFunction, Request, Response } from "express";
import { z } from "zod";

export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      next(parsed.error);
      return;
    }

    req.body = parsed.data;
    next();
  };
}

export function parseQuery<T extends z.ZodTypeAny>(schema: T, req: Request): z.infer<T> {
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) {
    throw parsed.error;
  }

  return parsed.data;
}
