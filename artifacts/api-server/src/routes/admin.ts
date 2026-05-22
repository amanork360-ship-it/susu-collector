import { Router, Request, Response } from "express";
import { getSupabaseClient } from "../lib/supabase";
import { createHash, createCipheriv, createDecipheriv, randomBytes } from "crypto";

const router = Router();

const ADMIN_SECRET = process.env["ADMIN_SECRET"] || "susu_admin_2024";

function generateAdminToken(): string {
  const payload = JSON.stringify({ admin: true, ts: Date.now() });
  const key = ADMIN_SECRET.slice(0, 32).padEnd(32, "0");
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", Buffer.from(key), iv);
  let encrypted = cipher.update(payload, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

function verifyAdminToken(token: string): boolean {
  try {
    const [ivHex, encrypted] = token.split(":");
    if (!ivHex || !encrypted) return false;
    const key = ADMIN_SECRET.slice(0, 32).padEnd(32, "0");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = createDecipheriv("aes-256-cbc", Buffer.from(key), iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    const payload = JSON.parse(decrypted);
    return payload.admin === true;
  } catch {
    return false;
  }
}

function requireAdmin(req: Request, res: Response, next: () => void): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.replace("Bearer ", "");
  if (!token || !verifyAdminToken(token)) {
    res.status(401).json({ error: "Admin access required" });
    return;
  }
  next();
}

router.post("/admin/login", async (req, res) => {
  const { password } = req.body;
  if (!password) {
    res.status(400).json({ error: "Password required" });
    return;
  }
  if (password !== ADMIN_SECRET) {
    res.status(401).json({ error: "Invalid admin password" });
    return;
  }
  const token = generateAdminToken();
  res.json({ token });
});

router.get("/admin/stats", requireAdmin, async (_req, res) => {
  const supabase = getSupabaseClient();
  const [collectorsRes, customersRes, collectionsRes] = await Promise.all([
    supabase.from("collectors").select("id", { count: "exact" }),
    supabase.from("customers").select("id", { count: "exact" }),
    supabase.from("collections").select("amount").eq("status", "completed"),
  ]);
  const totalRevenue = (collectionsRes.data ?? []).reduce(
    (s: number, c: any) => s + parseFloat(c.amount), 0
  );
  res.json({
    totalCollectors: collectorsRes.count ?? 0,
    totalCustomers: customersRes.count ?? 0,
    totalCollections: collectionsRes.data?.length ?? 0,
    totalRevenue,
  });
});

router.get("/admin/collectors", requireAdmin, async (_req, res) => {
  const supabase = getSupabaseClient();
  const { data: collectors, error } = await supabase
    .from("collectors")
    .select("*, customers(id)")
    .order("created_at", { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }

  res.json(
    (collectors ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      zone: c.zone,
      avatarUrl: c.avatar_url,
      customerCount: Array.isArray(c.customers) ? c.customers.length : 0,
      createdAt: c.created_at,
    }))
  );
});

router.post("/admin/collectors", requireAdmin, async (req, res) => {
  const { name, email, phone, zone, password } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: "Name, email and password are required" });
    return;
  }

  const supabase = getSupabaseClient();
  const hash = createHash("sha256").update(password + "susu_salt_2024").digest("hex");

  const { data: existing } = await supabase
    .from("collectors").select("id").eq("email", email).limit(1);
  if (existing && existing.length > 0) {
    res.status(409).json({ error: "A collector with this email already exists" });
    return;
  }

  const { data: inserted, error } = await supabase
    .from("collectors")
    .insert({ name, email, password_hash: hash, phone: phone || null, zone: zone || "Unassigned", total_customers: 0 })
    .select().single();

  if (error || !inserted) {
    res.status(500).json({ error: error?.message ?? "Insert failed" });
    return;
  }

  res.status(201).json({
    id: inserted.id, name: inserted.name, email: inserted.email,
    phone: inserted.phone, zone: inserted.zone, customerCount: 0,
    createdAt: inserted.created_at,
  });
});

router.get("/admin/customers", requireAdmin, async (req, res) => {
  const { search, collectorId } = req.query as { search?: string; collectorId?: string };
  const supabase = getSupabaseClient();

  let query = supabase
    .from("customers")
    .select("*, collectors(id, name, zone)")
    .order("name", { ascending: true });

  if (collectorId) query = query.eq("collector_id", parseInt(collectorId));

  const { data: customers, error } = await query;
  if (error) { res.status(500).json({ error: error.message }); return; }

  let result = customers ?? [];
  if (search) {
    const s = search.toLowerCase();
    result = result.filter(
      (c: any) => c.name.toLowerCase().includes(s) || (c.phone ?? "").includes(s)
    );
  }

  res.json(
    result.map((c: any) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      address: c.address,
      zone: c.zone,
      savingsBalance: parseFloat(c.savings_balance),
      collectionStatus: c.collection_status,
      loanStatus: c.loan_status,
      outstandingLoan: c.outstanding_loan ? parseFloat(c.outstanding_loan) : null,
      collectorId: c.collector_id,
      collectorName: (c.collectors as any)?.name ?? null,
      collectorZone: (c.collectors as any)?.zone ?? null,
      joinedAt: c.joined_at,
    }))
  );
});

router.post("/admin/customers", requireAdmin, async (req, res) => {
  const { name, phone, address, collectorId, notes } = req.body;
  if (!name || !phone || !collectorId) {
    res.status(400).json({ error: "Name, phone and collectorId are required" });
    return;
  }

  const supabase = getSupabaseClient();

  const { data: collector } = await supabase
    .from("collectors").select("id, total_customers").eq("id", collectorId).limit(1);
  if (!collector || collector.length === 0) {
    res.status(404).json({ error: "Collector not found" });
    return;
  }

  const { data: inserted, error } = await supabase
    .from("customers")
    .insert({
      name, phone,
      address: address || null,
      collector_id: collectorId,
      savings_balance: "0.00",
      total_collected: "0.00",
      collection_status: "pending",
      loan_status: "none",
      outstanding_loan: null,
      notes: notes || null,
      joined_at: new Date().toISOString(),
    })
    .select().single();

  if (error || !inserted) {
    res.status(500).json({ error: error?.message ?? "Insert failed" });
    return;
  }

  await supabase
    .from("collectors")
    .update({ total_customers: (collector[0].total_customers ?? 0) + 1 })
    .eq("id", collectorId);

  res.status(201).json({
    id: inserted.id, name: inserted.name, phone: inserted.phone,
    address: inserted.address, collectorId: inserted.collector_id,
    collectionStatus: inserted.collection_status, joinedAt: inserted.joined_at,
  });
});

router.patch("/admin/customers/:id/assign", requireAdmin, async (req, res) => {
  const customerId = parseInt(String(req.params["id"]));
  const { collectorId } = req.body;
  if (!collectorId) {
    res.status(400).json({ error: "collectorId is required" });
    return;
  }

  const supabase = getSupabaseClient();

  const { data: customer } = await supabase
    .from("customers").select("collector_id").eq("id", customerId).limit(1);
  if (!customer || customer.length === 0) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const oldCollectorId = customer[0].collector_id;

  const { error } = await supabase
    .from("customers").update({ collector_id: collectorId }).eq("id", customerId);
  if (error) { res.status(500).json({ error: error.message }); return; }

  if (oldCollectorId && oldCollectorId !== collectorId) {
    const { data: oldCount } = await supabase
      .from("customers").select("id", { count: "exact" }).eq("collector_id", oldCollectorId);
    await supabase
      .from("collectors").update({ total_customers: oldCount?.length ?? 0 }).eq("id", oldCollectorId);
  }

  const { data: newCount } = await supabase
    .from("customers").select("id", { count: "exact" }).eq("collector_id", collectorId);
  await supabase
    .from("collectors").update({ total_customers: newCount?.length ?? 0 }).eq("id", collectorId);

  res.json({ success: true });
});

router.delete("/admin/collectors/:id", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params["id"]));
  const supabase = getSupabaseClient();

  const { data: customers } = await supabase
    .from("customers").select("id").eq("collector_id", id).limit(1);
  if (customers && customers.length > 0) {
    res.status(409).json({ error: "Cannot delete a collector who has assigned customers. Reassign their customers first." });
    return;
  }

  const { error } = await supabase.from("collectors").delete().eq("id", id);
  if (error) { res.status(500).json({ error: error.message }); return; }

  res.json({ success: true });
});

export default router;
