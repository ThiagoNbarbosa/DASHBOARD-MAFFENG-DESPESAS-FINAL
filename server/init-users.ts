import bcrypt from "bcrypt";
import { testConnection, executeQuery } from "./database";

export async function initUsersTable() {
  try {
    if (!process.env.DATABASE_URL) {
      console.log('DATABASE_URL não configurada - usuários não serão criados no banco');
      return;
    }

    console.log('Inicializando tabela de usuários...');
    
    // Testar conexão primeiro
    const isConnected = await testConnection();
    if (!isConnected) {
      console.log('Não foi possível conectar ao banco - usuários não serão criados');
      return;
    }
    
    // Criar tabela users se não existir
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id serial PRIMARY KEY,
        auth_uid text UNIQUE,
        email text UNIQUE NOT NULL,
        password text,
        name text NOT NULL,
        role text NOT NULL DEFAULT 'user',
        created_at timestamp DEFAULT now()
      )
    `);

    // Verificar se já existem usuários
    const existing = await executeQuery('SELECT COUNT(*) as count FROM users');
    const count = existing.rows[0]?.count || 0;

    // Criar usuários padrão se não existirem
    if (Number(count) === 0) {
      const adminPassword = await bcrypt.hash('senha123', 10);
      const userPassword = await bcrypt.hash('senha123', 10);

      await executeQuery(`
        INSERT INTO users (email, password, name, role) 
        VALUES 
          ($1, $2, $3, $4),
          ($5, $6, $7, $8)
      `, ['admin@empresa.com', adminPassword, 'Administrador', 'admin',
          'user@empresa.com', userPassword, 'Usuário', 'user']);
      
      console.log('✓ Usuários padrão criados no banco');
    } else {
      console.log('✓ Usuários já existem no banco');
    }
  } catch (error) {
    console.log('Erro ao inicializar usuários - sistema funcionará com dados locais');
    console.error('Detalhes do erro:', error);
  }
}