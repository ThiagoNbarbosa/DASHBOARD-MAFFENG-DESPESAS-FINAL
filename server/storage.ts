import { users, expenses, type User, type InsertUser, type Expense, type InsertExpense } from "@shared/schema";
import { eq, and, like, gte, lte, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Expense methods
  getExpenses(filters?: {
    userId?: number;
    year?: string;
    month?: string;
    category?: string;
    contractNumber?: string;
    paymentMethod?: string;
  }): Promise<Expense[]>;
  getExpense(id: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense & { userId: number }): Promise<Expense>;
  updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense>;
  cancelExpense(id: string): Promise<Expense>;
  deleteExpense(id: string): Promise<void>;
  
  // Stats methods
  getExpenseStats(userId?: number): Promise<{
    totalAmount: number;
    totalExpenses: number;
    thisMonth: number;
    activeContracts: number;
  }>;
  
  getCategoryStats(filters?: {
    month?: string;
    contractNumber?: string;
  }): Promise<Array<{ category: string; total: number; count: number; }>>;
  
  getPaymentMethodStats(filters?: {
    month?: string;
    contractNumber?: string;
  }): Promise<Array<{ paymentMethod: string; count: number; }>>;
  
  getMonthlyTrends(): Promise<Array<{ month: string; total: number; }>>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getExpenses(filters?: {
    userId?: number;
    month?: string;
    category?: string;
    contractNumber?: string;
  }): Promise<Expense[]> {
    let query = db.select().from(expenses);
    
    const conditions = [];
    
    if (filters?.userId) {
      conditions.push(eq(expenses.userId, filters.userId));
    }
    
    if (filters?.month) {
      const startDate = new Date(filters.month + '-01');
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      conditions.push(gte(expenses.paymentDate, startDate));
      conditions.push(lte(expenses.paymentDate, endDate));
    }
    
    if (filters?.category) {
      conditions.push(eq(expenses.category, filters.category));
    }
    
    if (filters?.contractNumber) {
      conditions.push(like(expenses.contractNumber, `%${filters.contractNumber}%`));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(expenses.createdAt));
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    const result = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
    return result[0];
  }

  async createExpense(expense: InsertExpense & { userId: number }): Promise<Expense> {
    const result = await db.insert(expenses).values(expense).returning();
    return result[0];
  }

  async updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense> {
    const result = await db.update(expenses).set(expense).where(eq(expenses.id, id)).returning();
    return result[0];
  }

  async cancelExpense(id: string): Promise<Expense> {
    // Mark expense as cancelled by adding a special prefix to category
    const expense = await this.getExpense(id);
    if (!expense) {
      throw new Error("Expense not found");
    }
    
    const updatedCategory = expense.category.startsWith('[CANCELADA]') 
      ? expense.category 
      : `[CANCELADA] ${expense.category}`;
    
    const result = await db.update(expenses)
      .set({ category: updatedCategory })
      .where(eq(expenses.id, id))
      .returning();
    return result[0];
  }

  async deleteExpense(id: string): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  async getExpenseStats(userId?: number): Promise<{
    totalAmount: number;
    totalExpenses: number;
    thisMonth: number;
    activeContracts: number;
  }> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const startOfMonth = new Date(currentMonth + '-01');
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
    
    let allExpensesQuery = db.select().from(expenses);
    let monthExpensesQuery = db.select().from(expenses)
      .where(and(
        gte(expenses.paymentDate, startOfMonth),
        lte(expenses.paymentDate, endOfMonth)
      ));
    
    if (userId) {
      allExpensesQuery = allExpensesQuery.where(eq(expenses.userId, userId));
      monthExpensesQuery = monthExpensesQuery.where(and(
        eq(expenses.userId, userId),
        gte(expenses.paymentDate, startOfMonth),
        lte(expenses.paymentDate, endOfMonth)
      ));
    }
    
    const allExpenses = await allExpensesQuery;
    const monthExpenses = await monthExpensesQuery;
    
    const totalAmount = allExpenses.reduce((sum, exp) => sum + parseFloat(exp.totalValue), 0);
    const thisMonth = monthExpenses.reduce((sum, exp) => sum + parseFloat(exp.totalValue), 0);
    const activeContracts = new Set(allExpenses.map(exp => exp.contractNumber)).size;
    
    return {
      totalAmount,
      totalExpenses: allExpenses.length,
      thisMonth,
      activeContracts,
    };
  }

  async getCategoryStats(filters?: {
    month?: string;
    contractNumber?: string;
  }): Promise<Array<{ category: string; total: number; count: number; }>> {
    let query = db.select().from(expenses);
    
    const conditions = [];
    
    if (filters?.month) {
      const startDate = new Date(filters.month + '-01');
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      conditions.push(gte(expenses.paymentDate, startDate));
      conditions.push(lte(expenses.paymentDate, endDate));
    }
    
    if (filters?.contractNumber) {
      conditions.push(like(expenses.contractNumber, `%${filters.contractNumber}%`));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const results = await query;
    
    const categoryMap = new Map<string, { total: number; count: number; }>();
    
    results.forEach(expense => {
      const existing = categoryMap.get(expense.category) || { total: 0, count: 0 };
      categoryMap.set(expense.category, {
        total: existing.total + parseFloat(expense.totalValue),
        count: existing.count + 1,
      });
    });
    
    return Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      ...stats,
    }));
  }

  async getPaymentMethodStats(filters?: {
    month?: string;
    contractNumber?: string;
  }): Promise<Array<{ paymentMethod: string; count: number; }>> {
    let query = db.select().from(expenses);
    
    const conditions = [];
    
    if (filters?.month) {
      const startDate = new Date(filters.month + '-01');
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      conditions.push(gte(expenses.paymentDate, startDate));
      conditions.push(lte(expenses.paymentDate, endDate));
    }
    
    if (filters?.contractNumber) {
      conditions.push(like(expenses.contractNumber, `%${filters.contractNumber}%`));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const results = await query;
    
    const paymentMap = new Map<string, number>();
    
    results.forEach(expense => {
      const existing = paymentMap.get(expense.paymentMethod) || 0;
      paymentMap.set(expense.paymentMethod, existing + 1);
    });
    
    return Array.from(paymentMap.entries()).map(([paymentMethod, count]) => ({
      paymentMethod,
      count,
    }));
  }

  async getMonthlyTrends(): Promise<Array<{ month: string; total: number; }>> {
    const results = await db.select().from(expenses).orderBy(expenses.paymentDate);
    
    const monthlyMap = new Map<string, number>();
    
    results.forEach(expense => {
      const month = expense.paymentDate.toISOString().slice(0, 7);
      const existing = monthlyMap.get(month) || 0;
      monthlyMap.set(month, existing + parseFloat(expense.totalValue));
    });
    
    return Array.from(monthlyMap.entries()).map(([month, total]) => ({
      month,
      total,
    }));
  }
}

export const storage = new DatabaseStorage();
