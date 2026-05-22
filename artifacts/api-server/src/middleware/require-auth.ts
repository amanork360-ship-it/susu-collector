import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../routes/auth";

export interface AuthRequest extends Request {
  collectorId: number;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const payload = verifyToken(token);
  if (!payload || !payload.id) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  (req as AuthRequest).collectorId = payload.id;
  next();
}
