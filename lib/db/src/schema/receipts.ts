import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { customersTable } from "./customers";
import { collectorsTable } from "./collectors";

export const receiptsTable = pgTable("receipts", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customersTable.id),
  collectorId: integer("collector_id").notNull().references(() => collectorsTable.id),
  collectionId: integer("collection_id"),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull().default("image"),
  fileName: text("file_name").notNull(),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReceiptSchema = createInsertSchema(receiptsTable).omit({ id: true, createdAt: true });
export type InsertReceipt = z.infer<typeof insertReceiptSchema>;
export type Receipt = typeof receiptsTable.$inferSelect;
