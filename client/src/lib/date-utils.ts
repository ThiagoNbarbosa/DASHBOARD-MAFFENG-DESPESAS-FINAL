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
      
      // Se já tem hora (formato datetime), trata como UTC para evitar problemas de timezone
      if (cleanDate.includes('T') || cleanDate.includes(' ')) {
        // Para datetime strings, extrair apenas a data e criar uma nova data local
        const datePart = cleanDate.split('T')[0] || cleanDate.split(' ')[0];
        const [year, month, day] = datePart.split('-');
        if (year && month && day) {
          const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          return localDate.toLocaleDateString('pt-BR');
        }
      }
      
      let date = new Date(cleanDate);
      
      // Se a data é inválida, tenta com formato ISO
      if (isNaN(date.getTime())) {
        const isoDate = new Date(cleanDate + 'T00:00:00');
        if (isNaN(isoDate.getTime())) {
          return 'Data inválida';
        }
        date = isoDate;
      }
      
      return date.toLocaleDateString('pt-BR');
    }
    
    // Se é um objeto Date
    if (dateValue instanceof Date) {
      if (isNaN(dateValue.getTime())) {
        return 'Data inválida';
      }
      return dateValue.toLocaleDateString('pt-BR');
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
      
      // Se já tem hora (formato datetime), extrair apenas a data
      if (cleanDate.includes('T') || cleanDate.includes(' ')) {
        const datePart = cleanDate.split('T')[0] || cleanDate.split(' ')[0];
        const [year, month, day] = datePart.split('-');
        if (year && month && day) {
          // Retorna no formato YYYY-MM-DD para inputs de data
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
      
      let date = new Date(cleanDate);
      
      if (isNaN(date.getTime())) {
        const isoDate = new Date(cleanDate + 'T00:00:00');
        if (isNaN(isoDate.getTime())) {
          return '';
        }
        date = isoDate;
      }
      
      // Usar getFullYear, getMonth, getDate para evitar problemas de timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    if (dateValue instanceof Date) {
      if (isNaN(dateValue.getTime())) {
        return '';
      }
      const year = dateValue.getFullYear();
      const month = String(dateValue.getMonth() + 1).padStart(2, '0');
      const day = String(dateValue.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
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
      
      // Se já tem hora (formato datetime), extrair apenas a data e criar uma nova data local
      if (cleanDate.includes('T') || cleanDate.includes(' ')) {
        const datePart = cleanDate.split('T')[0] || cleanDate.split(' ')[0];
        const [year, month, day] = datePart.split('-');
        if (year && month && day) {
          const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          return localDate.toLocaleDateString('pt-BR');
        }
      }
      
      let date = new Date(cleanDate);
      
      if (isNaN(date.getTime())) {
        const isoDate = new Date(cleanDate + 'T00:00:00');
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