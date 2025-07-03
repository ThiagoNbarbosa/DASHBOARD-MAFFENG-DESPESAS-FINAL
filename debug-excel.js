import XLSX from 'xlsx';
import path from 'path';

// Constantes do sistema
const CONTRATOS = [
  'BB DIVINÓPOLIS',
  'BB MATO GROSSO',
  'BB MATO GROSSO DO SUL',
  'BB MATO GROSSO LOTE 2',
  'BB SALINAS',
  'BB SÃO PAULO',
  'BB VALADARES',
  'BB VARGINHA',
  'CARRO ENGENHARIA MS',
  'CARRO ENGENHARIA MS - ELDORADO',
  'CARRO ENGENHARIA MS - NOVA ALVORADA',
  'CARRO ENGENHARIA MS - RIO BRILHANTE',
  'CORREIOS - GO',
  'ESCRITÓRIO',
  'GALPÃO 2',
  'IMPOSTO',
  'SECRETARIA DA ADMINISTRAÇÃO',
  'SECRETARIA DA ECONOMIA',
  'SECRETARIA DA SAÚDE'
];

const CATEGORIAS = [
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
  'MATERIAL',
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
];

const BANCOS = [
  'ALELO',
  'BANCO DO BRASIL', 
  'SICREED'
];

const FORMAS_PAGAMENTO = [
  'Cartão de Crédito',
  'Débito automático',
  'Transferência Bancária',
  'PIX',
  'Boleto'
];

// Função para normalizar texto
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

// Função para verificar correspondência flexível com mapeamentos específicos
function hasFlexibleMatch(inputValue, validValues) {
  const normalizedInput = normalizeText(inputValue);
  
  // Mapeamentos específicos para contratos
  const contractMappings = {
    'secretaria de administração': 'SECRETARIA DA ADMINISTRAÇÃO',
    'secretaria de administracao': 'SECRETARIA DA ADMINISTRAÇÃO',
    'secretaria administração': 'SECRETARIA DA ADMINISTRAÇÃO',
    'secretaria administracao': 'SECRETARIA DA ADMINISTRAÇÃO',
    'administração': 'SECRETARIA DA ADMINISTRAÇÃO',
    'administracao': 'SECRETARIA DA ADMINISTRAÇÃO',
    
    'secretaria de economia': 'SECRETARIA DA ECONOMIA',
    'secretaria economia': 'SECRETARIA DA ECONOMIA',
    'economia': 'SECRETARIA DA ECONOMIA',
    
    'secretaria de saude': 'SECRETARIA DA SAÚDE',
    'secretaria saude': 'SECRETARIA DA SAÚDE',
    'secretaria da saude': 'SECRETARIA DA SAÚDE',
    'saude': 'SECRETARIA DA SAÚDE',
    'saúde': 'SECRETARIA DA SAÚDE',
  };

  // Verificar se está nos mapeamentos específicos
  if (contractMappings[normalizedInput]) {
    return validValues.includes(contractMappings[normalizedInput]);
  }
  
  // Verificar correspondência exata normalizada
  for (const validValue of validValues) {
    const normalizedValid = normalizeText(validValue);
    if (normalizedInput === normalizedValid) {
      return true;
    }
  }
  
  // Verificar correspondência parcial
  for (const validValue of validValues) {
    const normalizedValid = normalizeText(validValue);
    
    if (normalizedInput.length >= 3 && normalizedValid.length >= 3) {
      if (normalizedInput.includes(normalizedValid) || normalizedValid.includes(normalizedInput)) {
        return true;
      }
    }
  }
  
  return false;
}

// Função principal para analisar planilha
function analyzeExcel(filePath) {
  try {
    console.log(`\n🔍 Analisando planilha: ${filePath}`);
    
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Converter para JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length === 0) {
      console.log('❌ Planilha vazia');
      return;
    }
    
    console.log(`\n📊 Dados encontrados: ${jsonData.length} linhas`);
    
    // Exibir cabeçalhos
    const headers = jsonData[0];
    console.log('\n📋 Cabeçalhos detectados:');
    headers.forEach((header, index) => {
      console.log(`  Coluna ${index + 1}: "${header}"`);
    });
    
    // Analisar dados linha por linha
    console.log('\n🔍 Análise detalhada dos dados:');
    
    const problemas = [];
    
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      const lineNumber = i + 1;
      
      console.log(`\n--- Linha ${lineNumber} ---`);
      
      // Mostrar todos os dados da linha
      row.forEach((cell, index) => {
        console.log(`  ${headers[index] || `Coluna ${index + 1}`}: "${cell}"`);
      });
      
      // Identificar possíveis campos
      let categoria = '';
      let contrato = '';
      let pagamento = '';
      let banco = '';
      
      // Tentar mapear campos baseado no nome dos cabeçalhos
      headers.forEach((header, index) => {
        const headerNorm = normalizeText(header);
        const cellValue = row[index] || '';
        
        if (headerNorm.includes('categoria')) {
          categoria = cellValue;
        } else if (headerNorm.includes('contrato')) {
          contrato = cellValue;
        } else if (headerNorm.includes('pagamento') || headerNorm.includes('forma')) {
          pagamento = cellValue;
        } else if (headerNorm.includes('banco') || headerNorm.includes('emissor')) {
          banco = cellValue;
        }
      });
      
      // Validar dados
      if (categoria && !hasFlexibleMatch(categoria, CATEGORIAS)) {
        problemas.push(`❌ Linha ${lineNumber}: Categoria "${categoria}" não reconhecida`);
        console.log(`  ❌ PROBLEMA: Categoria "${categoria}" não encontrada nas ${CATEGORIAS.length} categorias oficiais`);
      }
      
      if (contrato && !hasFlexibleMatch(contrato, CONTRATOS)) {
        problemas.push(`❌ Linha ${lineNumber}: Contrato "${contrato}" não reconhecido`);
        console.log(`  ❌ PROBLEMA: Contrato "${contrato}" não encontrado nos ${CONTRATOS.length} contratos oficiais`);
      }
      
      if (pagamento && !hasFlexibleMatch(pagamento, FORMAS_PAGAMENTO)) {
        problemas.push(`❌ Linha ${lineNumber}: Pagamento "${pagamento}" não reconhecido`);
        console.log(`  ❌ PROBLEMA: Forma de pagamento "${pagamento}" não encontrada nas ${FORMAS_PAGAMENTO.length} formas oficiais`);
      }
      
      if (banco && !hasFlexibleMatch(banco, BANCOS)) {
        problemas.push(`❌ Linha ${lineNumber}: Banco "${banco}" não reconhecido`);
        console.log(`  ❌ PROBLEMA: Banco "${banco}" não encontrado nos ${BANCOS.length} bancos oficiais`);
      }
    }
    
    // Resumo dos problemas
    console.log('\n📊 RESUMO DA ANÁLISE:');
    console.log(`✅ Total de linhas: ${jsonData.length - 1}`);
    console.log(`❌ Problemas encontrados: ${problemas.length}`);
    
    if (problemas.length > 0) {
      console.log('\n🚫 PROBLEMAS IDENTIFICADOS:');
      problemas.forEach(problema => console.log(`  ${problema}`));
      
      console.log('\n💡 SOLUÇÕES RECOMENDADAS:');
      console.log('1. Verifique se as categorias estão na lista oficial:');
      console.log('   ', CATEGORIAS.slice(0, 10).join(', '), '...');
      
      console.log('\n2. Verifique se os contratos estão na lista oficial:');
      console.log('   ', CONTRATOS.slice(0, 5).join(', '), '...');
      
      console.log('\n3. Verifique se as formas de pagamento estão corretas:');
      console.log('   ', FORMAS_PAGAMENTO.join(', '));
      
      console.log('\n4. Verifique se os bancos estão corretos:');
      console.log('   ', BANCOS.join(', '));
    } else {
      console.log('✅ Nenhum problema encontrado - planilha pronta para importação!');
    }
    
  } catch (error) {
    console.error('❌ Erro ao analisar planilha:', error.message);
  }
}

// Executar análise da nova planilha
const excelFile = 'attached_assets/PLANILHA APP MAFFENG - JULHO - 01-07_1751563823739.xlsx';
analyzeExcel(excelFile);