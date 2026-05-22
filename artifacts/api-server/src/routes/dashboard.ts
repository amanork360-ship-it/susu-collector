import { Router, Request, Response } from "express";
import { getSupabaseClient } from "../lib/supabase";
import { requireAuth, AuthRequest } from "../middleware/require-auth";

const router = Router();

router.get("/dashboard/summary", requireAuth, async (req: Request, res: Response) => {
  const collectorId = (req as AuthRequest).collectorId;
  const supabase = getSupabaseClient();

  const today = new Date().toISOString().split("T")[0]!;
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0]!;

  const [todayRes, monthRes, customersRes, loanRepaymentsRes] = await Promise.all([
    supabase
      .from("collections")
      .select("amount")
      .eq("collector_id", collectorId)
      .eq("collection_date", today)
      .eq("status", "completed"),
    supabase
      .from("collections")
      .select("amount")
      .eq("collector_id", collectorId)
      .gte("collection_date", firstOfMonth)
      .eq("status", "completed"),
    supabase
      .from("customers")
      .select("collection_status")
      .eq("collector_id", collectorId),
    supabase
      .from("collections")
      .select("amount")
      .eq("collector_id", collectorId)
      .eq("collection_date", today)
      .eq("payment_method", "bank_transfer"),
  ]);

  const totalCollectedToday = (todayRes.data ?? []).reduce((s: number, r: any) => s + parseFloat(r.amount), 0);
  const totalCollectedMonth = (monthRes.data ?? []).reduce((s: number, r: any) => s + parseFloat(r.amount), 0);
  const customers = customersRes.data ?? [];
  const totalCustomers = customers.length;
  const pendingCount = customers.filter((c: any) => c.collection_status === "pending" || c.collection_status === "overdue").length;
  const collectedToday = customers.filter((c: any) => c.collection_status === "collected").length;
  const loanRepaymentsToday = (loanRepaymentsRes.data ?? []).reduce((s: number, r: any) => s + parseFloat(r.amount), 0);

  res.json({
    totalCollectedToday,
    assignedCustomers: totalCustomers,
    pendingCollections: pendingCount,
    loanRepaymentsToday,
    totalCollectedMonth,
    collectionRate: totalCustomers > 0 ? Math.round((collectedToday / totalCustomers) * 100) : 0,
  });
});

router.get("/dashboard/collections-trend", requireAuth, async (req: Request, res: Response) => {
  const collectorId = (req as AuthRequest).collectorId;
  const supabase = getSupabaseClient();

  const sixDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0]!;

  const { data: rows } = await supabase
    .from("collections")
    .select("collection_date, amount")
    .eq("collector_id", collectorId)
    .eq("status", "completed")
    .gte("collection_date", sixDaysAgo);

  const last7: { date: string; amount: number; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split("T")[0]!;
    const dayRows = (rows ?? []).filter((r: any) => r.collection_date === ds);
    last7.push({
      date: ds,
      amount: dayRows.reduce((s: number, r: any) => s + parseFloat(r.amount), 0),
      count: dayRows.length,
    });
  }

  res.json(last7);
});

router.get("/dashboard/recent-activity", requireAuth, async (req: Request, res: Response) => {
  const collectorId = (req as AuthRequest).collectorId;
  const supabase = getSupabaseClient();

  const [collectionsRes, receiptsRes] = await Promise.all([
    supabase
      .from("collections")
      .select("id, amount, created_at, payment_method, customers(name)")
      .eq("collector_id", collectorId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("receipts")
      .select("id, uploaded_at, file_name, customers(name)")
      .eq("collector_id", collectorId)
      .order("uploaded_at", { ascending: false })
      .limit(5),
  ]);

  const collections = (collectionsRes.data ?? []).map((c: any) => ({
    id: c.id,
    type: "collection",
    description: `Collection recorded for ${(c.customers as any)?.name ?? "Unknown"} via ${c.payment_method.replace(/_/g, " ")}`,
    amount: parseFloat(c.amount),
    customerName: (c.customers as any)?.name ?? null,
    timestamp: c.created_at,
  }));

  const receipts = (receiptsRes.data ?? []).map((r: any) => ({
    id: r.id + 10000,
    type: "receipt_upload",
    description: `Receipt uploaded for ${(r.customers as any)?.name ?? "Unknown"}: ${r.file_name}`,
    amount: null,
    customerName: (r.customers as any)?.name ?? null,
    timestamp: r.uploaded_at,
  }));

  const activity = [...collections, ...receipts]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);

  res.json(activity);
});

export default router;
