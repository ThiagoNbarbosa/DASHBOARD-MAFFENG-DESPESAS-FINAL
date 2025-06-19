import { pgTable, text, serial, uuid, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  authUid: text("auth_uid").unique(), // Supabase Auth UUID
  email: text("email").notNull().unique(),
  password: text("password"), // Opcional para usuários do Supabase Auth
  name: text("name").notNull(),
  role: text("role").notNull().default("user"), // "user" or "admin"
  createdAt: timestamp("created_at").defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: serial("user_id").references(() => users.id),
  item: text("item").notNull(),
  value: numeric("value").notNull(),
  paymentMethod: text("payment_method").notNull(),
  category: text("category").notNull(),
  contractNumber: text("contract_number").notNull(),
  totalValue: numeric("total_value").notNull(),
  imageUrl: text("image_url").notNull(),
  paymentDate: timestamp("payment_date").notNull(),
  status: text("status").notNull().default("active"), // "active" or "cancelled"
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.string().default("user"),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type SignUpData = z.infer<typeof signUpSchema>;
