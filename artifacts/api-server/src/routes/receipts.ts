import { Router, Request, Response } from "express";
import { getSupabaseClient } from "../lib/supabase";
import { requireAuth, AuthRequest } from "../middleware/require-auth";

const router = Router();

router.get("/receipts", requireAuth, async (req: Request, res: Response) => {
  const collectorId = (req as AuthRequest).collectorId;
  const { customerId, collectionId } = req.query as { customerId?: string; collectionId?: string };
  const supabase = getSupabaseClient();

  let query = supabase
    .from("receipts")
    .select("*, customers(name)")
    .eq("collector_id", collectorId)
    .order("uploaded_at", { ascending: false });

  if (customerId) query = query.eq("customer_id", parseInt(customerId));
  if (collectionId) query = query.eq("collection_id", parseInt(collectionId));

  const { data: rows, error } = await query;
  if (error) { res.status(500).json({ error: error.message }); return; }

  res.json(
    (rows ?? []).map((r: any) => ({
      id: r.id,
      customerId: r.customer_id,
      customerName: (r.customers as any)?.name ?? null,
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

router.post("/receipts", requireAuth, async (req: Request, res: Response) => {
  const collectorId = (req as AuthRequest).collectorId;
  const { customerId, collectionId, fileUrl, fileType, fileName, notes } = req.body;

  if (!customerId || !fileUrl || !fileType || !fileName) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const supabase = getSupabaseClient();

  const { data: customers } = await supabase
    .from("customers")
    .select("name")
    .eq("id", customerId)
    .eq("collector_id", collectorId)
    .limit(1);

  if (!customers || customers.length === 0) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const { data: inserted, error: insertErr } = await supabase
    .from("receipts")
    .insert({
      customer_id: customerId,
      collector_id: collectorId,
      collection_id: collectionId ?? null,
      file_url: fileUrl,
      file_type: fileType,
      file_name: fileName,
      status: "pending",
      notes: notes ?? null,
    })
    .select()
    .single();

  if (insertErr || !inserted) {
    res.status(500).json({ error: insertErr?.message ?? "Insert failed" });
    return;
  }

  res.status(201).json({
    id: inserted.id,
    customerId: inserted.customer_id,
    customerName: customers[0].name,
    collectionId: inserted.collection_id,
    fileUrl: inserted.file_url,
    fileType: inserted.file_type,
    fileName: inserted.file_name,
    status: inserted.status,
    notes: inserted.notes,
    uploadedAt: inserted.uploaded_at,
  });
});

router.get("/receipts/:id", requireAuth, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params["id"]));
  const collectorId = (req as AuthRequest).collectorId;
  const supabase = getSupabaseClient();

  const { data: rows, error } = await supabase
    .from("receipts")
    .select("*, customers(name)")
    .eq("id", id)
    .eq("collector_id", collectorId)
    .limit(1);

  if (error || !rows || rows.length === 0) {
    res.status(404).json({ error: "Receipt not found" });
    return;
  }

  const r = rows[0];
  res.json({
    id: r.id,
    customerId: r.customer_id,
    customerName: (r.customers as any)?.name ?? null,
    collectionId: r.collection_id,
    fileUrl: r.file_url,
    fileType: r.file_type,
    fileName: r.file_name,
    status: r.status,
    notes: r.notes,
    uploadedAt: r.uploaded_at,
  });
});

export default router;
