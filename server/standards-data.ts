// Dados padrões para contratos, categorias e bancos
export const STANDARD_CONTRACTS = [
  'CONT-0001',
  'CONT-0002', 
  'CONT-0003',
  'CONT-0004',
  'CONT-0005',
  'CONT-MAFF-001',
  'CONT-MAFF-002',
  'CONT-MAFF-003'
];

export const STANDARD_CATEGORIES = [
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

export const STANDARD_BANKS = [
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

export function validateContract(contract: string): boolean {
  return STANDARD_CONTRACTS.includes(contract);
}

export function validateCategory(category: string): boolean {
  return STANDARD_CATEGORIES.includes(category);
}

export function validateBank(bank: string): boolean {
  return STANDARD_BANKS.includes(bank);
}

export function normalizeContract(rawContract: string): string | null {
  const contract = String(rawContract).trim();
  
  // Verificar se já é válido
  if (validateContract(contract)) {
    return contract;
  }
  
  // Se for um número, adicionar prefixo padrão
  if (/^\d+$/.test(contract)) {
    const formatted = `CONT-${contract.padStart(4, '0')}`;
    if (validateContract(formatted)) {
      return formatted;
    }
  }
  
  // Buscar correspondência parcial
  const upperContract = contract.toUpperCase();
  const match = STANDARD_CONTRACTS.find(c => 
    c.toUpperCase().includes(upperContract) || upperContract.includes(c.toUpperCase())
  );
  
  return match || null;
}

export function normalizeCategory(rawCategory: string): string | null {
  const category = String(rawCategory).trim();
  
  // Verificar se já é válido
  if (validateCategory(category)) {
    return category;
  }
  
  // Buscar correspondência case-insensitive
  const lowerCategory = category.toLowerCase();
  const match = STANDARD_CATEGORIES.find(c => 
    c.toLowerCase() === lowerCategory ||
    c.toLowerCase().includes(lowerCategory) ||
    lowerCategory.includes(c.toLowerCase())
  );
  
  return match || null;
}

export function normalizeBank(rawBank: string): string | null {
  const bank = String(rawBank).trim();
  
  // Verificar se já é válido
  if (validateBank(bank)) {
    return bank;
  }
  
  // Buscar correspondência case-insensitive e parcial
  const lowerBank = bank.toLowerCase();
  const match = STANDARD_BANKS.find(b => 
    b.toLowerCase() === lowerBank ||
    b.toLowerCase().includes(lowerBank) ||
    lowerBank.includes(b.toLowerCase())
  );
  
  return match || null;
}