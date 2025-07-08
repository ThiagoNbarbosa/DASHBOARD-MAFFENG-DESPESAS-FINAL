
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfGeneratorOptions {
  filename?: string;
  quality?: number;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
}

export const generatePDF = async (
  element: HTMLElement, 
  options: PdfGeneratorOptions = {}
): Promise<void> => {
  const {
    filename = `relatorio-executivo-${new Date().toISOString().split('T')[0]}.pdf`,
    quality = 0.95,
    format = 'a4',
    orientation = 'portrait'
  } = options;

  try {
    // Mostrar elemento temporariamente para captura
    const originalDisplay = element.style.display;
    element.style.display = 'block';
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.top = '0';

    // Configurações do canvas
    const canvas = await html2canvas(element, {
      scale: 2, // Maior resolução
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: element.scrollWidth,
      height: element.scrollHeight,
      onclone: (clonedDoc) => {
        // Garantir que fontes e estilos sejam aplicados no clone
        const clonedElement = clonedDoc.querySelector('[data-pdf-content]') as HTMLElement;
        if (clonedElement) {
          clonedElement.style.transform = 'scale(1)';
          clonedElement.style.transformOrigin = 'top left';
        }
      }
    });

    // Restaurar elemento original
    element.style.display = originalDisplay;
    element.style.position = '';
    element.style.left = '';
    element.style.top = '';

    // Dimensões do PDF (A4 em mm)
    const pdfWidth = format === 'a4' ? 210 : 216; // A4 ou Letter
    const pdfHeight = format === 'a4' ? 297 : 279;
    
    // Calcular dimensões proporcionais
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    
    const scaledWidth = imgWidth * ratio;
    const scaledHeight = imgHeight * ratio;

    // Criar PDF
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: format === 'a4' ? 'a4' : 'letter',
      compress: true
    });

    // Converter canvas para imagem
    const imgData = canvas.toDataURL('image/jpeg', quality);
    
    // Calcular posição para centralizar
    const x = (pdfWidth - scaledWidth) / 2;
    const y = (pdfHeight - scaledHeight) / 2;

    // Adicionar imagem ao PDF (simplificado para evitar problemas assíncronos)
    pdf.addImage(imgData, 'JPEG', x, y, scaledWidth, scaledHeight);

    // Adicionar metadados
    pdf.setProperties({
      title: 'Relatório Financeiro Executivo - MAFFENG',
      subject: 'Relatório Financeiro',
      author: 'Sistema MAFFENG',
      creator: 'MAFFENG Dashboard',
      producer: 'MAFFENG PDF Generator'
    });

    // Salvar PDF
    pdf.save(filename);

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw new Error('Falha na geração do PDF. Tente novamente.');
  }
};

export const generatePDFFromData = async (
  reportData: any,
  options: PdfGeneratorOptions = {}
): Promise<void> => {
  // Esta função será usada quando quisermos gerar PDF sem renderizar o componente na tela
  return new Promise((resolve, reject) => {
    try {
      // Criar elemento temporário
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '210mm';
      tempDiv.style.backgroundColor = 'white';
      
      document.body.appendChild(tempDiv);

      // Aqui seria necessário renderizar o React component no elemento
      // Por enquanto, vamos usar a função principal
      setTimeout(() => {
        document.body.removeChild(tempDiv);
        resolve();
      }, 100);

    } catch (error) {
      reject(error);
    }
  });
};
