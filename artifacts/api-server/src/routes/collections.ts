import { Router } from "express";
import { getSupabaseClient } from "../lib/supabase";
import { verifyToken } from "./auth";

const router = Router();

function getCollectorId(req: any): number {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return 1;
  const payload = verifyToken(token);
  return payload?.id ?? 1;
}

router.get("/collections", async (req, res) => {
  const collectorId = getCollectorId(req);
  const { date, customerId } = req.query as { date?: string; customerId?: string };
  const supabase = getSupabaseClient();

  let query = supabase
    .from("collections")
    .select("*, customers(name)")
    .eq("collector_id", collectorId)
    .order("created_at", { ascending: false });

  if (date) query = query.eq("collection_date", date);
  if (customerId) query = query.eq("customer_id", parseInt(customerId));

  const { data: rows, error } = await query;
  if (error) { res.status(500).json({ error: error.message }); return; }

  res.json(
    (rows ?? []).map((c: any) => ({
      id: c.id,
      customerId: c.customer_id,
      customerName: (c.customers as any)?.name ?? "",
      amount: parseFloat(c.amount),
      collectionDate: c.collection_date,
      paymentMethod: c.payment_method,
      notes: c.notes,
      status: c.status,
      receiptId: c.receipt_id,
      createdAt: c.created_at,
    }))
  );
});

router.post("/collections", async (req, res) => {
  const collectorId = getCollectorId(req);
  const { customerId, amount, collectionDate, paymentMethod, notes } = req.body;

  if (!customerId || !amount || !collectionDate || !paymentMethod) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  if (parseFloat(amount) <= 0) {
    res.status(400).json({ error: "Amount must be positive" });
    return;
  }

  const supabase = getSupabaseClient();

  const { data: customers } = await supabase.from("customers").select("*").eq("id", customerId).limit(1);
  if (!customers || customers.length === 0) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  const customer = customers[0];

  const { data: inserted, error: insertErr } = await supabase
    .from("collections")
    .insert({
      customer_id: customerId,
      collector_id: collectorId,
      amount: parseFloat(amount).toFixed(2),
      collection_date: collectionDate,
      payment_method: paymentMethod,
      notes: notes || null,
      status: "completed",
    })
    .select()
    .single();

  if (insertErr || !inserted) {
    res.status(500).json({ error: insertErr?.message ?? "Insert failed" });
    return;
  }

  // Update customer savings balance and collection status
  await supabase
    .from("customers")
    .update({
      savings_balance: (parseFloat(customer.savings_balance) + parseFloat(amount)).toFixed(2),
      total_collected: (parseFloat(customer.total_collected) + parseFloat(amount)).toFixed(2),
      collection_status: "collected",
      last_collection_date: collectionDate,
    })
    .eq("id", customerId);

  res.status(201).json({
    id: inserted.id,
    customerId: inserted.customer_id,
    customerName: customer.name,
    amount: parseFloat(inserted.amount),
    collectionDate: inserted.collection_date,
    paymentMethod: inserted.payment_method,
    notes: inserted.notes,
    status: inserted.status,
    receiptId: inserted.receipt_id,
    createdAt: inserted.created_at,
  });
});

router.get("/collections/:id", async (req, res) => {
  const id = parseInt(req.params["id"]!);
  const supabase = getSupabaseClient();

  const { data: rows, error } = await supabase
    .from("collections")
    .select("*, customers(name)")
    .eq("id", id)
    .limit(1);

  if (error || !rows || rows.length === 0) {
    res.status(404).json({ error: "Collection not found" });
    return;
  }

  const c = rows[0];
  res.json({
    id: c.id,
    customerId: c.customer_id,
    customerName: (c.customers as any)?.name ?? "",
    amount: parseFloat(c.amount),
    collectionDate: c.collection_date,
    paymentMethod: c.payment_method,
    notes: c.notes,
    status: c.status,
    receiptId: c.receipt_id,
    createdAt: c.created_at,
  });
});

export default router;
