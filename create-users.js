import bcrypt from 'bcrypt';

async function createHashes() {
  const adminPassword = await bcrypt.hash('senha123', 10);
  const userPassword = await bcrypt.hash('senha123', 10);
  
  console.log('Admin password hash:', adminPassword);
  console.log('User password hash:', userPassword);
  
  console.log('\nSQL to run in Supabase:');
  console.log(`INSERT INTO users (email, password, name, role) VALUES`);
  console.log(`  ('admin@empresa.com', '${adminPassword}', 'Administrador', 'admin'),`);
  console.log(`  ('user@empresa.com', '${userPassword}', 'Usuário', 'user')`);
  console.log(`ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;`);
}

createHashes();