import { Router } from "express";
import { db } from "@workspace/db";
import { receiptsTable, customersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifyToken } from "./auth";

const router = Router();

function getCollectorId(req: any): number {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return 1;
  const payload = verifyToken(token);
  return payload?.id ?? 1;
}

router.get("/receipts", async (req, res) => {
  const collectorId = getCollectorId(req);
  const { customerId, collectionId } = req.query as { customerId?: string; collectionId?: string };

  let rows = await db
    .select({ receipt: receiptsTable, customerName: customersTable.name })
    .from(receiptsTable)
    .innerJoin(customersTable, eq(receiptsTable.customerId, customersTable.id))
    .where(eq(receiptsTable.collectorId, collectorId));

  if (customerId) rows = rows.filter((r) => r.receipt.customerId === parseInt(customerId));
  if (collectionId) rows = rows.filter((r) => r.receipt.collectionId === parseInt(collectionId));

  res.json(
    rows.map(({ receipt: r, customerName }) => ({
      id: r.id,
      customerId: r.customerId,
      customerName,
      collectionId: r.collectionId,
      fileUrl: r.fileUrl,
      fileType: r.fileType,
      fileName: r.fileName,
      status: r.status,
      notes: r.notes,
      uploadedAt: r.uploadedAt,
    }))
  );
});

router.post("/receipts", async (req, res) => {
  const collectorId = getCollectorId(req);
  const { customerId, collectionId, fileUrl, fileType, fileName, notes } = req.body;

  if (!customerId || !fileUrl || !fileType || !fileName) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const [customer] = await db.select({ name: customersTable.name }).from(customersTable).where(eq(customersTable.id, customerId)).limit(1);
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const [receipt] = await db.insert(receiptsTable).values({
    customerId,
    collectorId,
    collectionId: collectionId ?? null,
    fileUrl,
    fileType,
    fileName,
    status: "pending",
    notes: notes ?? null,
  }).returning();

  res.status(201).json({
    id: receipt!.id,
    customerId: receipt!.customerId,
    customerName: customer.name,
    collectionId: receipt!.collectionId,
    fileUrl: receipt!.fileUrl,
    fileType: receipt!.fileType,
    fileName: receipt!.fileName,
    status: receipt!.status,
    notes: receipt!.notes,
    uploadedAt: receipt!.uploadedAt,
  });
});

router.get("/receipts/:id", async (req, res) => {
  const id = parseInt(req.params["id"]!);
  const [row] = await db
    .select({ receipt: receiptsTable, customerName: customersTable.name })
    .from(receiptsTable)
    .innerJoin(customersTable, eq(receiptsTable.customerId, customersTable.id))
    .where(eq(receiptsTable.id, id))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "Receipt not found" });
    return;
  }
  const { receipt: r, customerName } = row;
  res.json({
    id: r.id,
    customerId: r.customerId,
    customerName,
    collectionId: r.collectionId,
    fileUrl: r.fileUrl,
    fileType: r.fileType,
    fileName: r.fileName,
    status: r.status,
    notes: r.notes,
    uploadedAt: r.uploadedAt,
  });
});

export default router;
