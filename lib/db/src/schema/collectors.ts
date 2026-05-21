import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const collectorsTable = pgTable("collectors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  phone: text("phone"),
  zone: text("zone").notNull().default("General"),
  avatarUrl: text("avatar_url"),
  totalCustomers: integer("total_customers").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCollectorSchema = createInsertSchema(collectorsTable).omit({ id: true, createdAt: true });
export type InsertCollector = z.infer<typeof insertCollectorSchema>;
export type Collector = typeof collectorsTable.$inferSelect;
