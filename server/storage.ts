import { users, expenses, billing } from "@shared/schema";
import { eq, desc, and, gte, lte, like, count, sum, countDistinct, or } from "drizzle-orm";
import type { User, InsertUser, Expense, InsertExpense, Billing, InsertBilling } from "@shared/schema";
import { db } from "./database";
import { CATEGORIAS, CONTRATOS, BANCOS, FORMAS_PAGAMENTO } from "@shared/constants";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  createUserWithAuth(user: InsertUser & { authUid: string }): Promise<User>;
  updateUserAuthUid(id: number, authUid: string): Promise<User>;

  // Expense methods
  getExpenses(filters?: {
    userId?: number;
    userIds?: number[];
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

  // Billing methods
  getBilling(filters?: {
    userId?: number;
    userIds?: number[];
    year?: string;
    month?: string;
    status?: string;
    contractNumber?: string;
  }): Promise<Billing[]>;
  getBillingItem(id: string): Promise<Billing | undefined>;
  createBilling(billing: InsertBilling & { userId: number }): Promise<Billing>;
  updateBilling(id: string, billing: Partial<InsertBilling>): Promise<Billing>;
  deleteBilling(id: string): Promise<void>;

  getBillingStats(userId?: number): Promise<{
    totalPendente: number;
    totalPago: number;
    totalVencido: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const result = await db.insert(users).values(user).returning();
      return result[0];
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  }

  async getUsersByRole(role: string): Promise<User[]> {
    try {
      const result = await db.select().from(users).where(eq(users.role, role));
      return result;
    } catch (error) {
      console.error('Erro ao buscar usuários por função:', error);
      return [];
    }
  }

  async createUserWithAuth(user: InsertUser & { authUid: string }): Promise<User> {
    try {
      const result = await db.insert(users).values(user).returning();
      return result[0];
    } catch (error) {
      console.error('Erro ao criar usuário com auth:', error);
      throw error;
    }
  }

  async updateUserAuthUid(id: number, authUid: string): Promise<User> {
    try {
      const result = await db.update(users).set({ authUid }).where(eq(users.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Erro ao atualizar authUid:', error);
      throw error;
    }
  }

  async getExpenses(filters?: {
    userId?: number;
    userIds?: number[];
    year?: string;
    month?: string;
    category?: string;
    contractNumber?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Expense[]> {
    try {
      let query = db.select().from(expenses);
      const conditions = [];

      if (filters?.userId) {
        conditions.push(eq(expenses.userId, filters.userId));
      } else if (filters?.userIds && filters.userIds.length > 0) {
        const userConditions = filters.userIds.map(id => eq(expenses.userId, id));
        conditions.push(or(...userConditions));
      }

      if (filters?.year && filters.year !== "all") {
        const startDate = new Date(`${filters.year}-01-01`);
        const endDate = new Date(`${filters.year}-12-31`);
        conditions.push(gte(expenses.paymentDate, startDate));
        conditions.push(lte(expenses.paymentDate, endDate));
      }

      if (filters?.month && filters.month !== "all") {
        const year = filters.year || new Date().getFullYear().toString();
        const startDate = new Date(`${year}-${filters.month}-01`);
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        conditions.push(gte(expenses.paymentDate, startDate));
        conditions.push(lte(expenses.paymentDate, endDate));
      }

      if (filters?.category && filters.category !== "all") {
        conditions.push(eq(expenses.category, filters.category));
      }

      if (filters?.contractNumber && filters.contractNumber !== "all") {
        conditions.push(eq(expenses.contractNumber, filters.contractNumber));
      }

      if (filters?.paymentMethod && filters.paymentMethod !== "all") {
        conditions.push(eq(expenses.paymentMethod, filters.paymentMethod));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      return await (query as any).orderBy(desc(expenses.paymentDate));
    } catch (error) {
      console.error('Erro na consulta de despesas:', error);
      return [];
    }
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    try {
      const result = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Erro ao buscar despesa:', error);
      return undefined;
    }
  }

  async createExpense(expense: InsertExpense & { userId: number }): Promise<Expense> {
    try {
      const result = await db.insert(expenses).values(expense).returning();
      return result[0];
    } catch (error) {
      console.error('Erro ao criar despesa:', error);
      throw error;
    }
  }

  async updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense> {
    try {
      const result = await db.update(expenses).set(expense).where(eq(expenses.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Erro ao atualizar despesa:', error);
      throw error;
    }
  }

  async deleteExpense(id: string): Promise<void> {
    try {
      await db.delete(expenses).where(eq(expenses.id, id));
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
      throw error;
    }
  }

  async getExpenseStats(userId?: number): Promise<{
    totalAmount: number;
    totalExpenses: number;
    thisMonth: number;
    activeContracts: number;
  }> {
    try {
      let allExpensesQuery = db.select().from(expenses);

      if (userId) {
        allExpensesQuery = allExpensesQuery.where(eq(expenses.userId, userId)) as any;
      }

      const allExpenses = await allExpensesQuery;
      const totalAmount = allExpenses
        .filter(e => !e.category.startsWith('[CANCELADA]'))
        .reduce((sum, e) => sum + parseFloat(e.value), 0);

      const totalExpenses = allExpenses.filter(e => !e.category.startsWith('[CANCELADA]')).length;

      // Calculate this month's total
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const thisMonthExpenses = allExpenses.filter(e => {
        const expenseDate = new Date(e.paymentDate);
        return expenseDate >= startOfMonth && 
               expenseDate <= endOfMonth && 
               !e.category.startsWith('[CANCELADA]');
      });

      const thisMonth = thisMonthExpenses.reduce((sum, e) => sum + parseFloat(e.value), 0);

      // Count active contracts
      const activeContracts = new Set(
        allExpenses
          .filter(e => !e.category.startsWith('[CANCELADA]'))
          .map(e => e.contractNumber)
      ).size;

      return {
        totalAmount,
        totalExpenses,
        thisMonth,
        activeContracts,
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      return { totalAmount: 0, totalExpenses: 0, thisMonth: 0, activeContracts: 0 };
    }
  }

  async getCategoryStats(filters?: {
    month?: string;
    contractNumber?: string;
  }): Promise<Array<{ category: string; total: number; count: number; }>> {
    try {
      let query = db.select().from(expenses);
      const conditions = [];

      if (filters?.month) {
        const startDate = new Date(filters.month + '-01');
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        conditions.push(gte(expenses.paymentDate, startDate));
        conditions.push(lte(expenses.paymentDate, endDate));
      }

      if (filters?.contractNumber) {
        conditions.push(eq(expenses.contractNumber, filters.contractNumber));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const allExpenses = await query;
      const categoryStats = allExpenses.reduce((acc, expense) => {
        if (!expense.category.startsWith('[CANCELADA]')) {
          if (!acc[expense.category]) {
            acc[expense.category] = { total: 0, count: 0 };
          }
          acc[expense.category].total += parseFloat(expense.value);
          acc[expense.category].count += 1;
        }
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

      return Object.entries(categoryStats).map(([category, stats]) => ({
        category,
        total: stats.total,
        count: stats.count,
      }));
    } catch (error) {
      console.error('Erro ao calcular estatísticas de categoria:', error);
      return [];
    }
  }

  async getPaymentMethodStats(filters?: {
    month?: string;
    contractNumber?: string;
  }): Promise<Array<{ paymentMethod: string; count: number; }>> {
    try {
      let query = db.select().from(expenses);
      const conditions = [];

      if (filters?.month) {
        const startDate = new Date(filters.month + '-01');
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        conditions.push(gte(expenses.paymentDate, startDate));
        conditions.push(lte(expenses.paymentDate, endDate));
      }

      if (filters?.contractNumber) {
        conditions.push(eq(expenses.contractNumber, filters.contractNumber));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const allExpenses = await query;
      const methodStats = allExpenses.reduce((acc, expense) => {
        if (!expense.category.startsWith('[CANCELADA]')) {
          if (!acc[expense.paymentMethod]) {
            acc[expense.paymentMethod] = 0;
          }
          acc[expense.paymentMethod] += 1;
        }
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(methodStats).map(([paymentMethod, count]) => ({
        paymentMethod,
        count,
      }));
    } catch (error) {
      console.error('Erro ao calcular estatísticas de método de pagamento:', error);
      return [];
    }
  }

  async getMonthlyTrends(): Promise<Array<{ month: string; total: number; }>> {
    try {
      const allExpenses = await db.select().from(expenses);
      const monthlyTotals = allExpenses.reduce((acc, expense) => {
        if (!expense.category.startsWith('[CANCELADA]')) {
          const date = new Date(expense.paymentDate);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!acc[monthKey]) {
            acc[monthKey] = 0;
          }
          acc[monthKey] += parseFloat(expense.value);
        }
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(monthlyTotals)
        .map(([month, total]) => ({ month, total }))
        .sort((a, b) => a.month.localeCompare(b.month));
    } catch (error) {
      console.error('Erro ao calcular tendências mensais:', error);
      return [];
    }
  }

  async getBilling(filters?: {
    userId?: number;
    userIds?: number[];
    year?: string;
    month?: string;
    status?: string;
    contractNumber?: string;
  }): Promise<Billing[]> {
    try {
      let query = db.select().from(billing);
      const conditions = [];

      if (filters?.userId) {
        conditions.push(eq(billing.userId, filters.userId));
      } else if (filters?.userIds && filters.userIds.length > 0) {
        const userConditions = filters.userIds.map(id => eq(billing.userId, id));
        conditions.push(or(...userConditions));
      }

      if (filters?.year && filters.year !== "all") {
        const startDate = new Date(`${filters.year}-01-01`);
        const endDate = new Date(`${filters.year}-12-31`);
        conditions.push(gte(billing.issueDate, startDate));
        conditions.push(lte(billing.issueDate, endDate));
      }

      if (filters?.month && filters.month !== "all") {
        const year = filters.year || new Date().getFullYear().toString();
        const startDate = new Date(`${year}-${filters.month}-01`);
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        conditions.push(gte(billing.issueDate, startDate));
        conditions.push(lte(billing.issueDate, endDate));
      }

      if (filters?.status && filters.status !== "all") {
        conditions.push(eq(billing.status, filters.status));
      }

      if (filters?.contractNumber && filters.contractNumber !== "all") {
        conditions.push(eq(billing.contractNumber, filters.contractNumber));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      return await (query as any).orderBy(desc(billing.createdAt));
    } catch (error) {
      console.error('Erro na consulta de faturamento:', error);
      return [];
    }
  }

  async getBillingItem(id: string): Promise<Billing | undefined> {
    try {
      const result = await db.select().from(billing).where(eq(billing.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Erro ao buscar item de faturamento:', error);
      return undefined;
    }
  }

  async createBilling(billingData: InsertBilling & { userId: number }): Promise<Billing> {
    try {
      const result = await db.insert(billing).values(billingData).returning();
      return result[0];
    } catch (error) {
      console.error('Erro ao criar faturamento:', error);
      throw error;
    }
  }

  async updateBilling(id: string, updates: Partial<InsertBilling>): Promise<Billing> {
    try {
      const result = await db.update(billing).set(updates).where(eq(billing.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Erro ao atualizar faturamento:', error);
      throw error;
    }
  }

  async deleteBilling(id: string): Promise<void> {
    try {
      await db.delete(billing).where(eq(billing.id, id));
    } catch (error) {
      console.error('Erro ao excluir faturamento:', error);
      throw error;
    }
  }

  async getBillingStats(userId?: number): Promise<{
    totalPendente: number;
    totalPago: number;
    totalVencido: number;
  }> {
    try {
      let query = db.select().from(billing);
      
      if (userId) {
        query = query.where(eq(billing.userId, userId)) as any;
      }

      const allBilling = await query;
      const now = new Date();

      const totalPendente = allBilling
        .filter(b => b.status === 'pendente')
        .reduce((sum, b) => sum + parseFloat(b.value), 0);

      const totalPago = allBilling
        .filter(b => b.status === 'pago')
        .reduce((sum, b) => sum + parseFloat(b.value), 0);

      const totalVencido = allBilling
        .filter(b => b.status === 'pendente' && new Date(b.dueDate) < now)
        .reduce((sum, b) => sum + parseFloat(b.value), 0);

      return {
        totalPendente,
        totalPago,
        totalVencido,
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas de faturamento:', error);
      return { totalPendente: 0, totalPago: 0, totalVencido: 0 };
    }
  }
}

export const storage = new DatabaseStorage();