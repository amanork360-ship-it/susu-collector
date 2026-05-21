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

router.get("/customers", async (req, res) => {
  const collectorId = getCollectorId(req);
  const { search, status } = req.query as { search?: string; status?: string };
  const supabase = getSupabaseClient();

  let query = supabase.from("customers").select("*").eq("collector_id", collectorId);

  if (status && status !== "all") {
    query = query.eq("collection_status", status);
  }

  const { data: customers, error } = await query;
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  let result = customers ?? [];
  if (search) {
    const s = search.toLowerCase();
    result = result.filter(
      (c: any) => c.name.toLowerCase().includes(s) || c.phone.includes(s)
    );
  }

  res.json(
    result.map((c: any) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      address: c.address,
      savingsBalance: parseFloat(c.savings_balance),
      collectionStatus: c.collection_status,
      loanStatus: c.loan_status,
      outstandingLoan: c.outstanding_loan ? parseFloat(c.outstanding_loan) : null,
      lastCollectionDate: c.last_collection_date,
      avatarUrl: c.avatar_url,
    }))
  );
});

router.get("/customers/:id", async (req, res) => {
  const id = parseInt(req.params["id"]!);
  const supabase = getSupabaseClient();

  const { data: customers, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .limit(1);

  if (error || !customers || customers.length === 0) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const c = customers[0];
  res.json({
    id: c.id,
    name: c.name,
    phone: c.phone,
    address: c.address,
    savingsBalance: parseFloat(c.savings_balance),
    collectionStatus: c.collection_status,
    loanStatus: c.loan_status,
    outstandingLoan: c.outstanding_loan ? parseFloat(c.outstanding_loan) : null,
    totalCollected: parseFloat(c.total_collected),
    lastCollectionDate: c.last_collection_date,
    joinedAt: c.joined_at,
    avatarUrl: c.avatar_url,
    notes: c.notes,
  });
});

router.get("/customers/:id/collections", async (req, res) => {
  const customerId = parseInt(req.params["id"]!);
  const supabase = getSupabaseClient();

  const [collectionsRes, customerRes] = await Promise.all([
    supabase.from("collections").select("*").eq("customer_id", customerId).order("created_at", { ascending: false }),
    supabase.from("customers").select("name").eq("id", customerId).limit(1),
  ]);

  const customerName = customerRes.data?.[0]?.name ?? "";

  res.json(
    (collectionsRes.data ?? []).map((c: any) => ({
      id: c.id,
      customerId: c.customer_id,
      customerName,
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

router.get("/customers/:id/loans", async (req, res) => {
  const customerId = parseInt(req.params["id"]!);
  const supabase = getSupabaseClient();

  const { data: rows } = await supabase.from("loans").select("*").eq("customer_id", customerId);

  res.json(
    (rows ?? []).map((l: any) => ({
      id: l.id,
      customerId: l.customer_id,
      principalAmount: parseFloat(l.principal_amount),
      outstandingBalance: parseFloat(l.outstanding_balance),
      interestRate: parseFloat(l.interest_rate),
      status: l.status,
      startDate: l.start_date,
      dueDate: l.due_date,
      totalRepaid: parseFloat(l.total_repaid),
    }))
  );
});

router.get("/customers/:id/receipts", async (req, res) => {
  const customerId = parseInt(req.params["id"]!);
  const supabase = getSupabaseClient();

  const [receiptsRes, customerRes] = await Promise.all([
    supabase.from("receipts").select("*").eq("customer_id", customerId).order("uploaded_at", { ascending: false }),
    supabase.from("customers").select("name").eq("id", customerId).limit(1),
  ]);

  const customerName = customerRes.data?.[0]?.name ?? null;

  res.json(
    (receiptsRes.data ?? []).map((r: any) => ({
      id: r.id,
      customerId: r.customer_id,
      customerName,
      collectionId: r.collection_id,
      fileUrl: r.file_url,
      fileType: r.file_type,
      fileName: r.file_name,
      status: r.status,
      notes: r.notes,
      uploadedAt: r.uploaded_at,
    }))
  );
});

export default router;
