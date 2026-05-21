import { Router } from "express";
import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";
import { getSupabaseClient } from "../lib/supabase";

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

  const supabase = getSupabaseClient();
  const { data: collectors, error } = await supabase
    .from("collectors")
    .select("*")
    .eq("email", email)
    .limit(1);

  if (error || !collectors || collectors.length === 0) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const collector = collectors[0];
  const hash = hashPassword(password);
  if (collector.password_hash !== hash) {
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
      avatarUrl: collector.avatar_url,
      totalCustomers: collector.total_customers,
      createdAt: collector.created_at,
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

  const supabase = getSupabaseClient();
  const { data: collectors, error } = await supabase
    .from("collectors")
    .select("*")
    .eq("id", payload.id)
    .limit(1);

  if (error || !collectors || collectors.length === 0) {
    res.status(404).json({ error: "Collector not found" });
    return;
  }

  const collector = collectors[0];
  res.json({
    id: collector.id,
    name: collector.name,
    email: collector.email,
    phone: collector.phone,
    zone: collector.zone,
    avatarUrl: collector.avatar_url,
    totalCustomers: collector.total_customers,
    createdAt: collector.created_at,
  });
});

export default router;
