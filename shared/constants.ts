// Constantes padronizadas para o sistema de despesas

export const CONTRATOS = [
  'BB DIVINÓPOLIS',
  'BB MATO GROSSO', 
  'BB MATO GROSSO DO SUL',
  'BB MATO GROSSO LOTE 2',
  'BB SALINAS',
  'BB SÃO PAULO',
  'BB VALADARES',
  'BB VARGINHA',
  'CARRO ENGENHARIA MS',
  'CORREIOS - GO',
  'ESCRITÓRIO',
  'IMPOSTO',
  'SECRETARIA DA ADMINISTRAÇÃO',
  'SECRETARIA DA ECONOMIA',
  'SECRETARIA DA SAÚDE'
] as const;

export const CATEGORIAS = [
  'ADIANTAMENTO',
  'ALIMENTAÇÃO',
  'ALUGUEL DE EQUIPAMENTOS',
  'ALUGUEL DE VEÍCULO',
  'ART',
  'ASSESSORIA JURÍDICA',
  'COMBUSTÍVEL',
  'CONFRATERNIZAÇÃO',
  'CONTABILIDADE',
  'DISTRIBUIÇÃO DE LUCROS',
  'DOAÇÃO',
  'EMPRÉSTIMOS',
  'ENERGIA',
  'ESTACIONAMENTO',
  'FÉRIAS',
  'FRETE',
  'FUNCIONÁRIOS',
  'GRATIFICAÇÃO',
  'HOSPEDAGEM',
  'IMPOSTO - CARRO',
  'IMPOSTOS',
  'IMPOSTOS - FGTS',
  'IMPOSTOS - ISS',
  'IMPRESSORAS',
  'INTERNET',
  'INSUMOS',
  'LAVA-RÁPIDO',
  'MANUTENÇÃO DE VEÍCULOS',
  'MANUTENÇÃO',
  'MATERIAL DE ESCRITÓRIO',
  'MATERIAL DE LIMPEZA',
  'OUTROS',
  'PEDÁGIO',
  'PEÇAS',
  'PRÓ-LABORE',
  'REFEIÇÃO',
  'SEGURO',
  'SERVIÇOS TERCEIRIZADOS',
  'SISTEMA',
  'TÁXI/UBER',
  'TECNOLOGIA',
  'TELEFONE',
  'TRANSPORTE'
] as const;

export const BANCOS = [
  'ALELO',
  'BANCO DO BRASIL', 
  'SICREED'
] as const;

export const FORMAS_PAGAMENTO = [
  'Cartão de Crédito',
  'Débito automático',
  'Transferência Bancária',
  'PIX',
  'Boleto'
] as const;

// Tipos para TypeScript
export type Contrato = typeof CONTRATOS[number];
export type Categoria = typeof CATEGORIAS[number];
export type Banco = typeof BANCOS[number];
export type FormaPagamento = typeof FORMAS_PAGAMENTO[number];