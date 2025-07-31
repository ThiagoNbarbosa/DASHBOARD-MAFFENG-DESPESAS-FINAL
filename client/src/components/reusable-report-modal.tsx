import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Download, Printer } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatDateSafely } from "@/lib/date-utils";
import type { Expense } from "@shared/schema";

interface ReusableReportModalProps {
  triggerButton?: React.ReactNode;
  title: string;
  data: any[];
  filters?: any;
  companyName?: string;
  reportType?: string;
  customContent?: (data: any[], filters: any) => React.ReactNode;
  customCalculations?: (data: any[]) => React.ReactNode;
  tableConfig?: {
    columns: Array<{
      key: string;
      label: string;
      align?: 'left' | 'center' | 'right';
      formatter?: (value: any) => string;
    }>;
  };
}

export function ReusableReportModal({
  triggerButton,
  title,
  data,
  filters = {},
  companyName = "MAFFENG",
  reportType = "RELATÓRIO DE DESPESAS",
  customContent,
  customCalculations,
  tableConfig
}: ReusableReportModalProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  const defaultTrigger = (
    <Button variant="outline" className="rounded-xl">
      <FileText className="w-4 h-4 mr-2" />
      Relatório Visual
    </Button>
  );

  // Função para imprimir
  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `${title}_${format(new Date(), 'dd-MM-yyyy')}`,
  });

  // Função para salvar em PDF
  const handleSavePDF = async () => {
    if (!reportRef.current) return;

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${title}_${format(new Date(), 'dd-MM-yyyy')}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    }
  };

  const formatFiltersText = () => {
    if (!filters || Object.keys(filters).length === 0) return 'Todos os registros';

    const activeFilters: string[] = [];
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        let label = '';
        switch(key) {
          case 'year': label = 'Ano'; break;
          case 'month': label = 'Mês'; break;
          case 'category': label = 'Categoria'; break;
          case 'contractNumber': label = 'Contrato'; break;
          case 'paymentMethod': label = 'Forma de Pagamento'; break;
          case 'startDate': label = 'Data Inicial'; break;
          case 'endDate': label = 'Data Final'; break;
          default: label = key;
        }
        activeFilters.push(`${label}: ${value}`);
      }
    });

    return activeFilters.length > 0 ? activeFilters.join(' | ') : 'Todos os registros';
  };

  const renderDefaultTable = () => {
    if (!tableConfig || !tableConfig.columns) return null;

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-xs">
          <thead>
            <tr className="bg-gray-100">
              {tableConfig.columns.map((column) => (
                <th 
                  key={column.key} 
                  className={`border border-gray-300 p-2 text-${column.align || 'left'}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                {tableConfig.columns.map((column) => (
                  <td 
                    key={column.key} 
                    className={`border border-gray-300 p-2 text-${column.align || 'left'}`}
                  >
                    {column.formatter 
                      ? column.formatter(item[column.key]) 
                      : item[column.key]
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {triggerButton || defaultTrigger}
      </DialogTrigger>

      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <div className="flex gap-2 mt-4">
            <Button onClick={handlePrint} variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            <Button onClick={handleSavePDF} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Salvar PDF
            </Button>
          </div>
        </DialogHeader>

        <div ref={reportRef} className="bg-white p-8 print:p-4">
          {/* Cabeçalho estilo nota fiscal */}
          <div className="border-b-2 border-gray-800 pb-6 mb-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                {reportType}
              </h1>
              <h2 className="text-lg text-gray-600">
                {companyName} - {new Date().getFullYear()}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-8 mt-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">DADOS DO RELATÓRIO</h3>
                <p className="text-sm"><strong>Data de Geração:</strong> {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                <p className="text-sm"><strong>Filtros Aplicados:</strong> {formatFiltersText()}</p>
                <p className="text-sm"><strong>Total de Registros:</strong> {data.length}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">RESUMO FINANCEIRO</h3>
                {customCalculations ? customCalculations(data) : (
                  <p className="text-sm">Total de registros: {data.length}</p>
                )}
              </div>
            </div>
          </div>

          {/* Conteúdo customizado ou tabela padrão */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b border-gray-300 pb-2">
              DETALHAMENTO DAS DESPESAS
            </h3>
            {customContent ? customContent(data, filters) : renderDefaultTable()}
          </div>

          {/* Rodapé */}
          <div className="border-t-2 border-gray-800 pt-4 mt-8">
            <div className="text-center text-xs text-gray-600">
              <p>Este relatório foi gerado automaticamente pelo Sistema MAFFENG</p>
              <p>Data/Hora: {format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}