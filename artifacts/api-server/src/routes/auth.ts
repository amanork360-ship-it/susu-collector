import { Router } from "express";
import { db } from "@workspace/db";
import { collectorsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

const router = Router();

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "susu_salt_2024").digest("hex");
}

function generateToken(collectorId: number): string {
  const payload = JSON.stringify({ id: collectorId, ts: Date.now() });
  const key = (process.env["SESSION_SECRET"] || "susu_secret_key_2024").slice(0, 32).padEnd(32, "0");
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", Buffer.from(key), iv);
  let encrypted = cipher.update(payload, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

export function verifyToken(token: string): { id: number } | null {
  try {
    const [ivHex, encrypted] = token.split(":");
    if (!ivHex || !encrypted) return null;
    const key = (process.env["SESSION_SECRET"] || "susu_secret_key_2024").slice(0, 32).padEnd(32, "0");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = createDecipheriv("aes-256-cbc", Buffer.from(key), iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }
  const [collector] = await db.select().from(collectorsTable).where(eq(collectorsTable.email, email)).limit(1);
  if (!collector) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const hash = hashPassword(password);
  if (collector.passwordHash !== hash) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = generateToken(collector.id);
  res.json({
    token,
    collector: {
      id: collector.id,
      name: collector.name,
      email: collector.email,
      phone: collector.phone,
      zone: collector.zone,
      avatarUrl: collector.avatarUrl,
      totalCustomers: collector.totalCustomers,
      createdAt: collector.createdAt,
    },
  });
});

router.get("/auth/me", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
  const [collector] = await db.select().from(collectorsTable).where(eq(collectorsTable.id, payload.id)).limit(1);
  if (!collector) {
    res.status(404).json({ error: "Collector not found" });
    return;
  }
  res.json({
    id: collector.id,
    name: collector.name,
    email: collector.email,
    phone: collector.phone,
    zone: collector.zone,
    avatarUrl: collector.avatarUrl,
    totalCustomers: collector.totalCustomers,
    createdAt: collector.createdAt,
  });
});

export default router;
