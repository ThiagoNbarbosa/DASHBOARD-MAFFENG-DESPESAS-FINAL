import { users, expenses, type User, type InsertUser, type Expense, type InsertExpense } from "@shared/schema";
import { eq, and, like, gte, lte, desc, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Use the pooler connection string directly
const connectionString = "postgresql://postgres.inukzizxxsvnlydkitle:TMS123456@aws-0-sa-east-1.pooler.supabase.com:6543/postgres";
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const db = drizzle(pool);

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
    startDate?: string;
    endDate?: string;
  }): Promise<Expense[]>;
  getExpense(id: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense & { userId: number }): Promise<Expense>;
  updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense>;
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

    getBilling(filters?: {
    year?: string;
    month?: string;
    status?: string;
    contractNumber?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any[]> ;
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

  async getUserByAuthUid(authUid: string) {
    const result = await db.select().from(users).where(eq(users.authUid, authUid)).limit(1);
    return result[0];
  }

  async createUserWithAuth(userData: { authUid: string; email: string; name: string; role?: string }) {
    const result = await db.insert(users).values({
      authUid: userData.authUid,
      email: userData.email,
      name: userData.name,
      role: userData.role || 'user',
    }).returning();
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUserAuthUid(userId: number, authUid: string): Promise<void> {
    await db.update(users).set({ authUid }).where(eq(users.id, userId));
  }

  async getTraditionalUsers(): Promise<User[]> {
    return await db.select().from(users).where(isNull(users.authUid));
  }

  async clearAllUsers(): Promise<void> {
    await db.delete(users);
  }

  async clearAllExpenses(): Promise<void> {
    await db.delete(expenses);
  }

  async getExpenses(filters?: {
    userId?: number;
    year?: string;
    month?: string;
    category?: string;
    contractNumber?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Expense[]> {
    let query = db.select().from(expenses);

    const conditions = [];

    if (filters?.userId) {
      conditions.push(eq(expenses.userId, filters.userId));
    }

    if (filters?.year) {
       const startDate = new Date(`${filters.year}-01-01`);
       const endDate = new Date(`${filters.year}-12-31`);
       conditions.push(gte(expenses.paymentDate, startDate));
       conditions.push(lte(expenses.paymentDate, endDate));
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

    if (filters?.paymentMethod) {
      conditions.push(eq(expenses.paymentMethod, filters.paymentMethod));
    }

    if (filters?.startDate) {
      const startDate = new Date(filters.startDate);
      conditions.push(gte(expenses.paymentDate, startDate));
    }

    if (filters?.endDate) {
      const endDate = new Date(filters.endDate);
      // Adicionar 23:59:59 para incluir todo o dia final
      endDate.setHours(23, 59, 59, 999);
      conditions.push(lte(expenses.paymentDate, endDate));
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
      monthExpensesQuery = monthExpensesQuery.where(eq(expenses.userId, userId));
    }

    const allExpenses = await allExpensesQuery;
    const monthExpenses = await monthExpensesQuery;

    const totalAmount = allExpenses.reduce((sum, expense) => sum + parseFloat(expense.value), 0);
    const thisMonth = monthExpenses.reduce((sum, expense) => sum + parseFloat(expense.value), 0);

    const activeContracts = new Set(allExpenses.map(expense => expense.contractNumber)).size;

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

    const categoryMap = new Map<string, { total: number; count: number }>();

    results.forEach(expense => {
      const existing = categoryMap.get(expense.category) || { total: 0, count: 0 };
      categoryMap.set(expense.category, {
        total: existing.total + parseFloat(expense.value),
        count: existing.count + 1
      });
    });

    return Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      total: stats.total,
      count: stats.count
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

    const paymentMethodMap = new Map<string, number>();

    results.forEach(expense => {
      const count = paymentMethodMap.get(expense.paymentMethod) || 0;
      paymentMethodMap.set(expense.paymentMethod, count + 1);
    });

    return Array.from(paymentMethodMap.entries()).map(([paymentMethod, count]) => ({
      paymentMethod,
      count
    }));
  }

  async getMonthlyTrends(): Promise<Array<{ month: string; total: number; }>> {
    const results = await db.select().from(expenses);

    const monthlyMap = new Map<string, number>();

    results.forEach(expense => {
      const month = expense.paymentDate.toISOString().slice(0, 7);
      const total = monthlyMap.get(month) || 0;
      monthlyMap.set(month, total + parseFloat(expense.value));
    });

    return Array.from(monthlyMap.entries())
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  async getBilling(filters?: {
    year?: string;
    month?: string;
    status?: string;
    contractNumber?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any[]> {
    try {
      let query = db.select().from(billing);

      const conditions = [];

      if (filters?.year) {
        const startDate = new Date(`${filters.year}-01-01`);
        const endDate = new Date(`${filters.year}-12-31`);
        conditions.push(gte(billing.issueDate, startDate));
        conditions.push(lte(billing.issueDate, endDate));
      }

      if (filters?.month) {
        const [year, month] = filters.month.split('-');
        const startDate = new Date(`${year}-${month}-01`);
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        conditions.push(gte(billing.issueDate, startDate));
        conditions.push(lte(billing.issueDate, endDate));
      }

      if (filters?.status) {
        conditions.push(eq(billing.status, filters.status));
      }

      if (filters?.contractNumber) {
        conditions.push(like(billing.contractNumber, `%${filters.contractNumber}%`));
      }

      if (filters?.startDate) {
        const startDate = new Date(filters.startDate);
        conditions.push(gte(billing.issueDate, startDate));
      }

      if (filters?.endDate) {
        const endDate = new Date(filters.endDate);
        // Adicionar 23:59:59 para incluir todo o dia final
        endDate.setHours(23, 59, 59, 999);
        conditions.push(lte(billing.issueDate, endDate));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      return await query;
    } catch (error) {
      console.error('Erro ao buscar billing:', error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();