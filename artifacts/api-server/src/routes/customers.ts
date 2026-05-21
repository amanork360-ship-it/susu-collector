import { Router } from "express";
import { db } from "@workspace/db";
import { customersTable, collectionsTable, loansTable, receiptsTable } from "@workspace/db";
import { eq, and, ilike, or } from "drizzle-orm";
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

  let customers = await db.select().from(customersTable).where(eq(customersTable.collectorId, collectorId));

  if (search) {
    const s = search.toLowerCase();
    customers = customers.filter(
      (c) => c.name.toLowerCase().includes(s) || c.phone.includes(s)
    );
  }

  if (status && status !== "all") {
    customers = customers.filter((c) => c.collectionStatus === status);
  }

  res.json(
    customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      address: c.address,
      savingsBalance: parseFloat(c.savingsBalance),
      collectionStatus: c.collectionStatus,
      loanStatus: c.loanStatus,
      outstandingLoan: c.outstandingLoan ? parseFloat(c.outstandingLoan) : null,
      lastCollectionDate: c.lastCollectionDate,
      avatarUrl: c.avatarUrl,
    }))
  );
});

router.get("/customers/:id", async (req, res) => {
  const id = parseInt(req.params["id"]!);
  const [c] = await db.select().from(customersTable).where(eq(customersTable.id, id)).limit(1);
  if (!c) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  res.json({
    id: c.id,
    name: c.name,
    phone: c.phone,
    address: c.address,
    savingsBalance: parseFloat(c.savingsBalance),
    collectionStatus: c.collectionStatus,
    loanStatus: c.loanStatus,
    outstandingLoan: c.outstandingLoan ? parseFloat(c.outstandingLoan) : null,
    totalCollected: parseFloat(c.totalCollected),
    lastCollectionDate: c.lastCollectionDate,
    joinedAt: c.joinedAt,
    avatarUrl: c.avatarUrl,
    notes: c.notes,
  });
});

router.get("/customers/:id/collections", async (req, res) => {
  const customerId = parseInt(req.params["id"]!);
  const rows = await db
    .select()
    .from(collectionsTable)
    .where(eq(collectionsTable.customerId, customerId))
    .orderBy(collectionsTable.createdAt);

  const [customer] = await db.select({ name: customersTable.name }).from(customersTable).where(eq(customersTable.id, customerId)).limit(1);

  res.json(
    rows.map((c) => ({
      id: c.id,
      customerId: c.customerId,
      customerName: customer?.name ?? "",
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

router.get("/customers/:id/loans", async (req, res) => {
  const customerId = parseInt(req.params["id"]!);
  const rows = await db.select().from(loansTable).where(eq(loansTable.customerId, customerId));
  res.json(
    rows.map((l) => ({
      id: l.id,
      customerId: l.customerId,
      principalAmount: parseFloat(l.principalAmount),
      outstandingBalance: parseFloat(l.outstandingBalance),
      interestRate: parseFloat(l.interestRate),
      status: l.status,
      startDate: l.startDate,
      dueDate: l.dueDate,
      totalRepaid: parseFloat(l.totalRepaid),
    }))
  );
});

router.get("/customers/:id/receipts", async (req, res) => {
  const customerId = parseInt(req.params["id"]!);
  const [customer] = await db.select({ name: customersTable.name }).from(customersTable).where(eq(customersTable.id, customerId)).limit(1);
  const rows = await db.select().from(receiptsTable).where(eq(receiptsTable.customerId, customerId));
  res.json(
    rows.map((r) => ({
      id: r.id,
      customerId: r.customerId,
      customerName: customer?.name ?? null,
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

export default router;
