import { pgTable, serial, text, integer, numeric, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { collectorsTable } from "./collectors";

export const customersTable = pgTable("customers", {
  id: serial("id").primaryKey(),
  collectorId: integer("collector_id").notNull().references(() => collectorsTable.id),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  savingsBalance: numeric("savings_balance", { precision: 12, scale: 2 }).notNull().default("0"),
  collectionStatus: text("collection_status").notNull().default("pending"),
  loanStatus: text("loan_status").notNull().default("none"),
  outstandingLoan: numeric("outstanding_loan", { precision: 12, scale: 2 }),
  lastCollectionDate: date("last_collection_date"),
  avatarUrl: text("avatar_url"),
  notes: text("notes"),
  totalCollected: numeric("total_collected", { precision: 12, scale: 2 }).notNull().default("0"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customersTable).omit({ id: true, createdAt: true });
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customersTable.$inferSelect;
