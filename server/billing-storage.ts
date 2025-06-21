import { neon } from "@neondatabase/serverless";
import type { Billing, InsertBilling } from "@shared/schema";

const sql = neon(process.env.DATABASE_URL!);

export class BillingStorage {
  async initTable() {
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS billing (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          "contractNumber" text NOT NULL,
          "clientName" text NOT NULL,
          description text NOT NULL,
          value text NOT NULL,
          "dueDate" date NOT NULL,
          "issueDate" date NOT NULL,
          status text NOT NULL DEFAULT 'pendente',
          "userId" integer NOT NULL,
          "createdAt" timestamp DEFAULT now()
        )
      `;

      const existing = await sql`SELECT COUNT(*) as count FROM billing`;
      const count = Number(existing[0]?.count || 0);

      if (count === 0) {
        await sql`
          INSERT INTO billing ("contractNumber", "clientName", description, value, "dueDate", "issueDate", status, "userId") 
          VALUES 
            ('0001', 'Cliente Exemplo A', 'Serviços de consultoria - Janeiro 2025', '15000.00', '2025-01-31', '2025-01-01', 'pago', 1),
            ('0002', 'Cliente Exemplo B', 'Manutenção sistema - Janeiro 2025', '8500.00', '2025-02-15', '2025-01-15', 'pago', 1),
            ('0003', 'Cliente Exemplo C', 'Desenvolvimento - Janeiro 2025', '12000.00', '2025-02-28', '2025-01-20', 'pago', 1),
            ('0004', 'Cliente Exemplo D', 'Consultoria pendente - Junho 2025', '5000.00', '2025-06-30', '2025-06-01', 'pendente', 1),
            ('0005', 'Cliente Exemplo E', 'Projeto vencido - Maio 2025', '2800.00', '2025-05-15', '2025-05-01', 'vencido', 1)
        `;
        console.log('✓ Tabela billing criada e dados inseridos');
      }
    } catch (error) {
      console.error('Erro ao inicializar billing:', error);
    }
  }

  async getBilling(filters?: {
    year?: string;
    month?: string;
    status?: string;
    contractNumber?: string;
  }): Promise<Billing[]> {
    try {
      let query = `SELECT * FROM billing WHERE 1=1`;
      const params: any[] = [];

      if (filters?.year) {
        query += ` AND EXTRACT(YEAR FROM "issueDate") = $${params.length + 1}`;
        params.push(filters.year);
      }

      if (filters?.month) {
        query += ` AND EXTRACT(MONTH FROM "issueDate") = $${params.length + 1}`;
        params.push(filters.month);
      }

      if (filters?.status) {
        query += ` AND status = $${params.length + 1}`;
        params.push(filters.status);
      }

      if (filters?.contractNumber) {
        query += ` AND "contractNumber" = $${params.length + 1}`;
        params.push(filters.contractNumber);
      }

      query += ` ORDER BY "createdAt" DESC`;

      const result = await sql(query, params);
      return result as Billing[];
    } catch (error) {
      console.error('Erro ao buscar billing:', error);
      return [];
    }
  }

  async createBilling(data: InsertBilling & { userId: number }): Promise<Billing> {
    try {
      const result = await sql`
        INSERT INTO billing ("contractNumber", "clientName", description, value, "dueDate", "issueDate", status, "userId")
        VALUES (${data.contractNumber}, ${data.clientName}, ${data.description}, ${data.value}, ${data.dueDate}, ${data.issueDate}, ${data.status || 'pendente'}, ${data.userId})
        RETURNING *
      `;
      return result[0] as Billing;
    } catch (error) {
      console.error('Erro ao criar billing:', error);
      throw new Error('Erro ao criar faturamento');
    }
  }

  async updateBilling(id: string, updates: Partial<InsertBilling>): Promise<Billing> {
    try {
      const setParts: string[] = [];
      const params: any[] = [];

      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          setParts.push(`"${key}" = $${params.length + 1}`);
          params.push(value);
        }
      });

      if (setParts.length === 0) {
        throw new Error('Nenhum campo para atualizar');
      }

      params.push(id);
      const query = `UPDATE billing SET ${setParts.join(', ')} WHERE id = $${params.length} RETURNING *`;

      const result = await sql(query, params);
      if (result.length === 0) {
        throw new Error('Faturamento não encontrado');
      }
      return result[0] as Billing;
    } catch (error) {
      console.error('Erro ao atualizar billing:', error);
      throw new Error('Erro ao atualizar faturamento');
    }
  }

  async deleteBilling(id: string): Promise<void> {
    try {
      await sql`DELETE FROM billing WHERE id = ${id}`;
    } catch (error) {
      console.error('Erro ao deletar billing:', error);
      throw new Error('Erro ao deletar faturamento');
    }
  }

  async getBillingStats(): Promise<{
    totalPendente: number;
    totalPago: number;
    totalVencido: number;
  }> {
    try {
      const result = await sql`
        SELECT 
          status,
          SUM(CAST(value AS DECIMAL)) as total
        FROM billing 
        GROUP BY status
      `;

      const stats = {
        totalPendente: 0,
        totalPago: 0,
        totalVencido: 0,
      };

      result.forEach((row: any) => {
        if (row.status === 'pendente') stats.totalPendente = Number(row.total) || 0;
        if (row.status === 'pago') stats.totalPago = Number(row.total) || 0;
        if (row.status === 'vencido') stats.totalVencido = Number(row.total) || 0;
      });

      return stats;
    } catch (error) {
      console.error('Erro ao buscar stats:', error);
      return {
        totalPendente: 0,
        totalPago: 0,
        totalVencido: 0,
      };
    }
  }
}

export const billingStorage = new BillingStorage();