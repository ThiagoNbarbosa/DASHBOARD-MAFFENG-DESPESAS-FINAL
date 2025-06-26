import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Calendar, Filter, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReportFilters {
  year: string;
  month: string;
  category: string;
  contractNumber: string;
  paymentMethod: string;
  reportType: 'despesas' | 'faturamento' | 'completo';
}

export default function Relatorios() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<ReportFilters>({
    year: new Date().getFullYear().toString(),
    month: "all",
    category: "",
    contractNumber: "",
    paymentMethod: "",
    reportType: "completo"
  });

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: authApi.getCurrentUser,
  });

  // Buscar dados de despesas com filtros
  const { data: expenses = [], isLoading: isLoadingExpenses } = useQuery({
    queryKey: ['/api/expenses', filters.year, filters.month, filters.category, filters.contractNumber, filters.paymentMethod],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.year && filters.year !== "all") params.append('year', filters.year);
      if (filters.month && filters.month !== "all") params.append('month', filters.month);
      if (filters.category) params.append('category', filters.category);
      if (filters.contractNumber) params.append('contractNumber', filters.contractNumber);
      if (filters.paymentMethod && filters.paymentMethod !== "all") params.append('paymentMethod', filters.paymentMethod);
      
      return apiRequest(`/api/expenses?${params.toString()}`, 'GET');
    },
  });

  // Buscar dados de faturamento com filtros
  const { data: faturamentos = [], isLoading: isLoadingBilling } = useQuery({
    queryKey: ['/api/billing', filters.year, filters.month, filters.contractNumber],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.year && filters.year !== "all") params.append('year', filters.year);
      if (filters.month && filters.month !== "all") params.append('month', filters.month);
      if (filters.contractNumber) params.append('contractNumber', filters.contractNumber);
      
      return apiRequest(`/api/billing?${params.toString()}`, 'GET');
    },
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    );
  }

  // Função segura para downloads
  const safeDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    try {
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      // Verificação segura antes de appendChild
      if (document.body) {
        document.body.appendChild(link);
        link.click();
        
        // Verificação segura antes de removeChild
        if (link.parentNode === document.body) {
          document.body.removeChild(link);
        }
      }
    } finally {
      // Sempre limpar a URL para evitar memory leaks
      URL.revokeObjectURL(url);
    }
  };

  // Função para gerar e baixar CSV
  const generateCSV = (data: any[], type: string) => {
    if (!data || data.length === 0) {
      toast({
        title: "Sem dados",
        description: "Não há dados para exportar com os filtros selecionados.",
        variant: "destructive",
      });
      return;
    }

    let csvContent = '';
    let headers: string[] = [];
    
    if (type === 'despesas') {
      headers = ['ID', 'Item', 'Valor', 'Método Pagamento', 'Categoria', 'Contrato', 'Data Pagamento', 'Criado em'];
      csvContent = headers.join(',') + '\n';
      
      data.forEach((expense: any) => {
        const row = [
          expense.id,
          `"${expense.item}"`,
          expense.value,
          `"${expense.paymentMethod}"`,
          `"${expense.category}"`,
          expense.contractNumber,
          new Date(expense.paymentDate).toLocaleDateString('pt-BR'),
          new Date(expense.createdAt).toLocaleDateString('pt-BR')
        ];
        csvContent += row.join(',') + '\n';
      });
    } else if (type === 'faturamento') {
      headers = ['ID', 'Cliente', 'Descrição', 'Valor', 'Status', 'Contrato', 'Vencimento', 'Data Pagamento', 'Emissão'];
      csvContent = headers.join(',') + '\n';
      
      data.forEach((billing: any) => {
        const row = [
          billing.id,
          `"${billing.clientName}"`,
          `"${billing.description}"`,
          billing.value,
          billing.status,
          billing.contractNumber,
          new Date(billing.dueDate).toLocaleDateString('pt-BR'),
          billing.paymentDate ? new Date(billing.paymentDate).toLocaleDateString('pt-BR') : 'N/A',
          new Date(billing.issueDate).toLocaleDateString('pt-BR')
        ];
        csvContent += row.join(',') + '\n';
      });
    }

    // Usar função segura para download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `relatorio_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    safeDownload(blob, filename);

    toast({
      title: "Download realizado",
      description: `Relatório de ${type} baixado com sucesso.`,
    });
  };

  const handleDownload = () => {
    if (filters.reportType === 'despesas') {
      generateCSV(expenses, 'despesas');
    } else if (filters.reportType === 'faturamento') {
      generateCSV(faturamentos, 'faturamento');
    } else {
      // Relatório completo - criar arquivo combinado
      const combinedData = {
        despesas: expenses,
        faturamento: faturamentos,
        resumo: {
          totalDespesas: expenses.reduce((sum: number, e: any) => sum + parseFloat(e.value || "0"), 0),
          totalFaturamento: faturamentos.reduce((sum: number, f: any) => sum + parseFloat(f.value || "0"), 0),
          periodo: `${filters.month === "all" ? "Todos os meses" : filters.month}/${filters.year}`
        }
      };

      const jsonContent = JSON.stringify(combinedData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const filename = `relatorio_completo_${new Date().toISOString().split('T')[0]}.json`;
      safeDownload(blob, filename);

      toast({
        title: "Download realizado",
        description: "Relatório completo baixado em formato JSON.",
      });
    }
  };

  const isLoading = isLoadingExpenses || isLoadingBilling;

  // Estatísticas dos dados filtrados
  const totalDespesas = expenses.filter((e: any) => !e.category?.startsWith('[CANCELADA]')).length;
  const valorTotalDespesas = expenses
    .filter((e: any) => !e.category?.startsWith('[CANCELADA]'))
    .reduce((sum: number, e: any) => sum + parseFloat(e.value || "0"), 0);

  const totalFaturamento = faturamentos.length;
  const valorTotalFaturamento = faturamentos.reduce((sum: number, f: any) => sum + parseFloat(f.value || "0"), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="lg:pl-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Download className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
                  <p className="text-sm text-gray-600">
                    Exporte dados filtrados em CSV ou JSON
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={handleDownload}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Baixar Relatório
              </Button>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros do Relatório
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      <SelectItem value="completo">Relatório Completo (JSON)</SelectItem>
                      <SelectItem value="despesas">Apenas Despesas (CSV)</SelectItem>
                      <SelectItem value="faturamento">Apenas Faturamento (CSV)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      <SelectItem value="all">Todos os anos</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mês
                  </label>
                  <Select
                    value={filters.month}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, month: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os meses</SelectItem>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria
                  </label>
                  <Input
                    placeholder="Ex: Material, Transporte..."
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número do Contrato
                  </label>
                  <Input
                    placeholder="Ex: 0001, 0002..."
                    value={filters.contractNumber}
                    onChange={(e) => setFilters(prev => ({ ...prev, contractNumber: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Pagamento
                  </label>
                  <Select
                    value={filters.paymentMethod}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, paymentMethod: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Pix">Pix</SelectItem>
                      <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                      <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                      <SelectItem value="Boleto à Vista">Boleto à Vista</SelectItem>
                      <SelectItem value="Transferência">Transferência</SelectItem>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prévia dos Dados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-red-600" />
                  Prévia - Despesas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">Carregando...</div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total de registros:</span>
                      <span className="font-medium">{totalDespesas}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor total:</span>
                      <span className="font-medium text-red-600">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(valorTotalDespesas)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Prévia - Faturamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">Carregando...</div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total de registros:</span>
                      <span className="font-medium">{totalFaturamento}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor total:</span>
                      <span className="font-medium text-green-600">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(valorTotalFaturamento)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Informações sobre formatos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Formatos de Export
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Relatório Completo (JSON)</h3>
                  <p className="text-sm text-blue-700">
                    Inclui despesas, faturamento e resumo financeiro em formato estruturado para análises avançadas.
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <h3 className="font-medium text-red-900 mb-2">Despesas (CSV)</h3>
                  <p className="text-sm text-red-700">
                    Apenas dados de despesas em formato CSV, ideal para importação em planilhas.
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">Faturamento (CSV)</h3>
                  <p className="text-sm text-green-700">
                    Apenas dados de faturamento em formato CSV, perfeito para análise de receitas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}