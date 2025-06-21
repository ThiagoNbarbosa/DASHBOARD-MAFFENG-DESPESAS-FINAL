import { neon } from "@neondatabase/serverless";
import bcrypt from "bcrypt";

export async function initUsersTable() {
  try {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.log('DATABASE_URL não configurada - usuários não serão criados no banco');
      return;
    }

    console.log('Inicializando tabela de usuários...');
    const sql = neon(connectionString);
    
    // Criar tabela users se não existir
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id serial PRIMARY KEY,
        email text UNIQUE NOT NULL,
        password text NOT NULL,
        name text NOT NULL,
        role text NOT NULL DEFAULT 'user',
        "createdAt" timestamp DEFAULT now()
      )
    `;

    // Verificar se já existem usuários
    const existing = await sql`SELECT COUNT(*) as count FROM users`;
    const count = existing[0]?.count || 0;

    // Criar usuários padrão se não existirem
    if (Number(count) === 0) {
      const adminPassword = await bcrypt.hash('senha123', 10);
      const userPassword = await bcrypt.hash('senha123', 10);

      await sql`
        INSERT INTO users (email, password, name, role) 
        VALUES 
          ('admin@empresa.com', ${adminPassword}, 'Administrador', 'admin'),
          ('user@empresa.com', ${userPassword}, 'Usuário', 'user')
      `;
      console.log('✓ Usuários padrão criados no banco');
    } else {
      console.log('✓ Usuários já existem no banco');
    }
  } catch (error) {
    console.log('Erro ao inicializar usuários - sistema funcionará com dados locais');
  }
}