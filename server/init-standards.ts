import { standards } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL não está configurada');
  process.exit(1);
}

const neonSql = neon(databaseUrl);
const db = drizzle(neonSql);

export async function initStandardsData() {
  try {
    // Contratos padrões
    const defaultContracts = [
      'CONT-0001',
      'CONT-0002', 
      'CONT-0003',
      'CONT-0004',
      'CONT-0005',
      'CONT-MAFF-001',
      'CONT-MAFF-002',
      'CONT-MAFF-003'
    ];

    // Categorias padrões
    const defaultCategories = [
      'Alimentação',
      'Transporte',
      'Material',
      'Serviços',
      'Tecnologia',
      'Marketing',
      'Combustível',
      'Manutenção',
      'Escritório',
      'Consultoria',
      'Energia',
      'Telecomunicações',
      'Seguros',
      'Outros'
    ];

    // Bancos padrões
    const defaultBanks = [
      'Banco do Brasil',
      'Bradesco',
      'Itaú',
      'Santander',
      'Caixa Econômica',
      'Nubank',
      'Inter',
      'C6 Bank',
      'BTG Pactual',
      'Sicredi',
      'Banrisul',
      'Safra',
      'PicPay',
      'Mercado Pago',
      'PayPal'
    ];

    // Inserir contratos
    for (const contract of defaultContracts) {
      await db.insert(standards).values({
        type: 'contract',
        value: contract,
        description: `Contrato padrão ${contract}`,
        isActive: true
      }).onConflictDoNothing();
    }

    // Inserir categorias
    for (const category of defaultCategories) {
      await db.insert(standards).values({
        type: 'category',
        value: category,
        description: `Categoria padrão ${category}`,
        isActive: true
      }).onConflictDoNothing();
    }

    // Inserir bancos
    for (const bank of defaultBanks) {
      await db.insert(standards).values({
        type: 'bank',
        value: bank,
        description: `Banco ${bank}`,
        isActive: true
      }).onConflictDoNothing();
    }

    console.log('✅ Padrões inicializados com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar padrões:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initStandardsData().then(() => process.exit(0));
}