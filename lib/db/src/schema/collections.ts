import { pgTable, serial, integer, numeric, text, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { customersTable } from "./customers";
import { collectorsTable } from "./collectors";

export const collectionsTable = pgTable("collections", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customersTable.id),
  collectorId: integer("collector_id").notNull().references(() => collectorsTable.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  collectionDate: date("collection_date").notNull(),
  paymentMethod: text("payment_method").notNull().default("cash"),
  notes: text("notes"),
  status: text("status").notNull().default("completed"),
  receiptId: integer("receipt_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCollectionSchema = createInsertSchema(collectionsTable).omit({ id: true, createdAt: true });
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collectionsTable.$inferSelect;
