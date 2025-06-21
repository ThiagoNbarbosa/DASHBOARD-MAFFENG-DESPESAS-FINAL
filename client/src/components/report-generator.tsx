
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ReportFilters {
  year: string;
  month: string;
  reportType: 'executive' | 'financial' | 'operational' | 'complete';
}

export default function ReportGenerator() {
  const [filters, setFilters] = useState<ReportFilters>({
    year: new Date().getFullYear().toString(),
    month: "all",
    reportType: 'executive'
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const response = await apiRequest('/api/reports/generate', 'POST', filters);
      
      // Criar link de download
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-${filters.reportType}-${filters.year}-${filters.month}.pdf`;
      link.click();
      
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Gerar Relatório
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Tipo de Relatório
          </label>
          <Select
            value={filters.reportType}
            onValueChange={(value) => setFilters(prev => ({ ...prev, reportType: value as any }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="executive">Executivo</SelectItem>
              <SelectItem value="financial">Financeiro</SelectItem>
              <SelectItem value="operational">Operacional</SelectItem>
              <SelectItem value="complete">Completo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Ano
          </label>
          <Select
            value={filters.year}
            onValueChange={(value) => setFilters(prev => ({ ...prev, year: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Período
          </label>
          <Select
            value={filters.month}
            onValueChange={(value) => setFilters(prev => ({ ...prev, month: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Ano completo</SelectItem>
              <SelectItem value="01">Janeiro</SelectItem>
              <SelectItem value="02">Fevereiro</SelectItem>
              <SelectItem value="03">Março</SelectItem>
              <SelectItem value="04">Abril</SelectItem>
              <SelectItem value="05">Maio</SelectItem>
              <SelectItem value="06">Junho</SelectItem>
              <SelectItem value="07">Julho</SelectItem>
              <SelectItem value="08">Agosto</SelectItem>
              <SelectItem value="09">Setembro</SelectItem>
              <SelectItem value="10">Outubro</SelectItem>
              <SelectItem value="11">Novembro</SelectItem>
              <SelectItem value="12">Dezembro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={generateReport}
          disabled={isGenerating}
          className="w-full"
        >
          <Download className="h-4 w-4 mr-2" />
          {isGenerating ? 'Gerando...' : 'Gerar Relatório PDF'}
        </Button>
      </CardContent>
    </Card>
  );
}
