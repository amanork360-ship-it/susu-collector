import { Router } from "express";
import { db } from "@workspace/db";
import { collectionsTable, customersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
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

  let rows = await db
    .select({
      collection: collectionsTable,
      customerName: customersTable.name,
    })
    .from(collectionsTable)
    .innerJoin(customersTable, eq(collectionsTable.customerId, customersTable.id))
    .where(eq(collectionsTable.collectorId, collectorId));

  if (date) {
    rows = rows.filter((r) => r.collection.collectionDate === date);
  }
  if (customerId) {
    rows = rows.filter((r) => r.collection.customerId === parseInt(customerId));
  }

  res.json(
    rows.map(({ collection: c, customerName }) => ({
      id: c.id,
      customerId: c.customerId,
      customerName,
      amount: parseFloat(c.amount),
      collectionDate: c.collectionDate,
      paymentMethod: c.paymentMethod,
      notes: c.notes,
      status: c.status,
      receiptId: c.receiptId,
      createdAt: c.createdAt,
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

  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, customerId)).limit(1);
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const [collection] = await db.insert(collectionsTable).values({
    customerId,
    collectorId,
    amount: amount.toString(),
    collectionDate,
    paymentMethod,
    notes: notes || null,
    status: "completed",
  }).returning();

  // Update customer savings balance and status
  await db
    .update(customersTable)
    .set({
      savingsBalance: (parseFloat(customer.savingsBalance) + parseFloat(amount)).toFixed(2),
      totalCollected: (parseFloat(customer.totalCollected) + parseFloat(amount)).toFixed(2),
      collectionStatus: "collected",
      lastCollectionDate: collectionDate,
    })
    .where(eq(customersTable.id, customerId));

  res.status(201).json({
    id: collection!.id,
    customerId: collection!.customerId,
    customerName: customer.name,
    amount: parseFloat(collection!.amount),
    collectionDate: collection!.collectionDate,
    paymentMethod: collection!.paymentMethod,
    notes: collection!.notes,
    status: collection!.status,
    receiptId: collection!.receiptId,
    createdAt: collection!.createdAt,
  });
});

router.get("/collections/:id", async (req, res) => {
  const id = parseInt(req.params["id"]!);
  const [row] = await db
    .select({ collection: collectionsTable, customerName: customersTable.name })
    .from(collectionsTable)
    .innerJoin(customersTable, eq(collectionsTable.customerId, customersTable.id))
    .where(eq(collectionsTable.id, id))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "Collection not found" });
    return;
  }
  const { collection: c, customerName } = row;
  res.json({
    id: c.id,
    customerId: c.customerId,
    customerName,
    amount: parseFloat(c.amount),
    collectionDate: c.collectionDate,
    paymentMethod: c.paymentMethod,
    notes: c.notes,
    status: c.status,
    receiptId: c.receiptId,
    createdAt: c.createdAt,
  });
});

export default router;
