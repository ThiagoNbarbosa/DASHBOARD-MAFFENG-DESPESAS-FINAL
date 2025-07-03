/**
 * Função centralizada para formatação segura de datas
 * Trata diferentes formatos de entrada e corrige problemas de timezone
 */
export function formatDateSafely(dateValue: string | Date | null | undefined): string {
  if (!dateValue) return 'Data não informada';

  try {
    // Se é uma string, tenta diferentes formatos
    if (typeof dateValue === 'string') {
      // Remove qualquer parte de timezone que pode estar causando problemas
      const cleanDate = dateValue.replace(/\+\d{2}:\d{2}$/, '');
      
      let date = new Date(cleanDate);
      
      // Se a data é inválida, tenta com formato ISO
      if (isNaN(date.getTime())) {
        const isoDate = new Date(cleanDate + 'T00:00:00.000Z');
        if (isNaN(isoDate.getTime())) {
          return 'Data inválida';
        }
        date = isoDate;
      }
      
      return date.toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo'
      });
    }
    
    // Se é um objeto Date
    if (dateValue instanceof Date) {
      if (isNaN(dateValue.getTime())) {
        return 'Data inválida';
      }
      return dateValue.toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo'
      });
    }
    
    return 'Formato de data inválido';
  } catch (error) {
    console.error('Erro ao formatar data:', error, 'Valor:', dateValue);
    return 'Erro na formatação da data';
  }
}

/**
 * Função para converter data para formato ISO para edição
 */
export function dateToInputValue(dateValue: string | Date | null | undefined): string {
  if (!dateValue) return '';

  try {
    if (typeof dateValue === 'string') {
      const cleanDate = dateValue.replace(/\+\d{2}:\d{2}$/, '');
      let date = new Date(cleanDate);
      
      if (isNaN(date.getTime())) {
        const isoDate = new Date(cleanDate + 'T00:00:00.000Z');
        if (isNaN(isoDate.getTime())) {
          return '';
        }
        date = isoDate;
      }
      
      return date.toISOString().split('T')[0];
    }
    
    if (dateValue instanceof Date) {
      if (isNaN(dateValue.getTime())) {
        return '';
      }
      return dateValue.toISOString().split('T')[0];
    }
    
    return '';
  } catch (error) {
    console.error('Erro ao converter data para input:', error, 'Valor:', dateValue);
    return '';
  }
}

/**
 * Função para usar em exports CSV
 */
export function formatDateForCSV(dateValue: string | Date | null | undefined): string {
  if (!dateValue) return 'N/A';

  try {
    if (typeof dateValue === 'string') {
      const cleanDate = dateValue.replace(/\+\d{2}:\d{2}$/, '');
      let date = new Date(cleanDate);
      
      if (isNaN(date.getTime())) {
        const isoDate = new Date(cleanDate + 'T00:00:00.000Z');
        if (isNaN(isoDate.getTime())) {
          return 'Data inválida';
        }
        date = isoDate;
      }
      
      return date.toLocaleDateString('pt-BR');
    }
    
    if (dateValue instanceof Date) {
      if (isNaN(dateValue.getTime())) {
        return 'Data inválida';
      }
      return dateValue.toLocaleDateString('pt-BR');
    }
    
    return 'Formato inválido';
  } catch (error) {
    console.error('Erro ao formatar data para CSV:', error, 'Valor:', dateValue);
    return 'Erro na formatação';
  }
}