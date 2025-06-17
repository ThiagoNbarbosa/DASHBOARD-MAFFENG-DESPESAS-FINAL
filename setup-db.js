import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';

const sql = neon(process.env.DATABASE_URL);

async function setupDatabase() {
  try {
    console.log('Setting up database tables...');
    
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    // Create expenses table
    await sql`
      CREATE TABLE IF NOT EXISTS expenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER REFERENCES users(id),
        item TEXT NOT NULL,
        value NUMERIC NOT NULL,
        payment_method TEXT NOT NULL,
        category TEXT NOT NULL,
        contract_number TEXT NOT NULL,
        total_value NUMERIC NOT NULL,
        image_url TEXT NOT NULL,
        payment_date TIMESTAMP NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    console.log('Tables created successfully!');
    
    // Create demo users
    const adminPassword = await bcrypt.hash('senha123', 10);
    const userPassword = await bcrypt.hash('senha123', 10);
    
    await sql`
      INSERT INTO users (email, password, name, role) 
      VALUES 
        ('admin@empresa.com', ${adminPassword}, 'Administrador', 'admin'),
        ('user@empresa.com', ${userPassword}, 'Usuário', 'user')
      ON CONFLICT (email) DO NOTHING;
    `;
    
    console.log('Demo users created successfully!');
    console.log('Admin: admin@empresa.com / senha123');
    console.log('User: user@empresa.com / senha123');
    
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();