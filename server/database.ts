import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const connectionString = process.env.DATABASE_URL || "";

// Pool compartilhado para toda a aplicação
export const pool = new Pool({ 
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Instância do Drizzle
export const db = drizzle(pool);

// Função para testar conexão
export async function testConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✓ Conexão com banco de dados estabelecida');
    return true;
  } catch (error) {
    console.log('✗ Falha na conexão com banco de dados');
    console.error('Erro:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

// Função para executar queries simples
export async function executeQuery(query: string, params: any[] = []) {
  try {
    const client = await pool.connect();
    const result = await client.query(query, params);
    client.release();
    return result;
  } catch (error) {
    console.error('Erro na query:', error);
    throw error;
  }
}