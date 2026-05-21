import { Router } from "express";
import { db } from "@workspace/db";
import { collectionsTable, customersTable, receiptsTable } from "@workspace/db";
import { eq, sql, gte, and } from "drizzle-orm";
import { verifyToken } from "./auth";

const router = Router();

function getCollectorId(req: any): number | null {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.id ?? null;
}

router.get("/dashboard/summary", async (req, res) => {
  const collectorId = getCollectorId(req) ?? 1;

  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

  const [todayCollections] = await db
    .select({ total: sql<string>`COALESCE(SUM(amount::numeric), 0)`, count: sql<number>`COUNT(*)` })
    .from(collectionsTable)
    .where(and(eq(collectionsTable.collectorId, collectorId), eq(collectionsTable.collectionDate, today!), eq(collectionsTable.status, "completed")));

  const [monthCollections] = await db
    .select({ total: sql<string>`COALESCE(SUM(amount::numeric), 0)` })
    .from(collectionsTable)
    .where(and(eq(collectionsTable.collectorId, collectorId), gte(collectionsTable.collectionDate, firstOfMonth!), eq(collectionsTable.status, "completed")));

  const customers = await db.select({ status: customersTable.collectionStatus }).from(customersTable).where(eq(customersTable.collectorId, collectorId));

  const totalCustomers = customers.length;
  const pendingCount = customers.filter((c) => c.status === "pending" || c.status === "overdue").length;
  const collectedToday = customers.filter((c) => c.status === "collected").length;

  const loanRepayments = await db
    .select({ total: sql<string>`COALESCE(SUM(amount::numeric), 0)` })
    .from(collectionsTable)
    .where(and(eq(collectionsTable.collectorId, collectorId), eq(collectionsTable.collectionDate, today!), eq(collectionsTable.paymentMethod, "bank_transfer")));

  res.json({
    totalCollectedToday: parseFloat(todayCollections?.total ?? "0"),
    assignedCustomers: totalCustomers,
    pendingCollections: pendingCount,
    loanRepaymentsToday: parseFloat(loanRepayments[0]?.total ?? "0"),
    totalCollectedMonth: parseFloat(monthCollections?.total ?? "0"),
    collectionRate: totalCustomers > 0 ? Math.round((collectedToday / totalCustomers) * 100) : 0,
  });
});

router.get("/dashboard/collections-trend", async (req, res) => {
  const collectorId = getCollectorId(req) ?? 1;

  const rows = await db
    .select({
      date: collectionsTable.collectionDate,
      total: sql<string>`SUM(amount::numeric)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(collectionsTable)
    .where(and(eq(collectionsTable.collectorId, collectorId), eq(collectionsTable.status, "completed"), gte(collectionsTable.collectionDate, sql`CURRENT_DATE - INTERVAL '6 days'`)))
    .groupBy(collectionsTable.collectionDate)
    .orderBy(collectionsTable.collectionDate);

  const last7: { date: string; amount: number; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split("T")[0]!;
    const row = rows.find((r) => r.date === ds);
    last7.push({ date: ds, amount: parseFloat(row?.total ?? "0"), count: row?.count ?? 0 });
  }
  res.json(last7);
});

router.get("/dashboard/recent-activity", async (req, res) => {
  const collectorId = getCollectorId(req) ?? 1;

  const recentCollections = await db
    .select({
      id: collectionsTable.id,
      amount: collectionsTable.amount,
      createdAt: collectionsTable.createdAt,
      customerName: customersTable.name,
      paymentMethod: collectionsTable.paymentMethod,
    })
    .from(collectionsTable)
    .innerJoin(customersTable, eq(collectionsTable.customerId, customersTable.id))
    .where(eq(collectionsTable.collectorId, collectorId))
    .orderBy(sql`${collectionsTable.createdAt} DESC`)
    .limit(5);

  const recentReceipts = await db
    .select({
      id: receiptsTable.id,
      uploadedAt: receiptsTable.uploadedAt,
      customerName: customersTable.name,
      fileName: receiptsTable.fileName,
    })
    .from(receiptsTable)
    .innerJoin(customersTable, eq(receiptsTable.customerId, customersTable.id))
    .where(eq(receiptsTable.collectorId, collectorId))
    .orderBy(sql`${receiptsTable.uploadedAt} DESC`)
    .limit(5);

  const activity = [
    ...recentCollections.map((c) => ({
      id: c.id,
      type: "collection",
      description: `Collection recorded for ${c.customerName} via ${c.paymentMethod.replace("_", " ")}`,
      amount: parseFloat(c.amount),
      customerName: c.customerName,
      timestamp: c.createdAt,
    })),
    ...recentReceipts.map((r) => ({
      id: r.id + 10000,
      type: "receipt_upload",
      description: `Receipt uploaded for ${r.customerName}: ${r.fileName}`,
      amount: null,
      customerName: r.customerName,
      timestamp: r.uploadedAt,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8);

  res.json(activity);
});

export default router;
