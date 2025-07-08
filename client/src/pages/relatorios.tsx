import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import { ExpenseFilters } from "@/components/expense-filters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Calendar, Filter, BarChart3, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useResponsive } from "@/hooks/use-responsive";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BANCOS, FORMAS_PAGAMENTO } from "@shared/constants";
import { useContractsAndCategories } from "@/hooks/use-contracts-categories";
import { formatDateForCSV } from "@/lib/date-utils";
import type { Expense } from "@shared/schema";

interface ReportFilters {
  year: string;
  month: string;
  category: string;
  contractNumber: string;
  paymentMethod: string;
  startDate: string;
  endDate: string;
  reportType: 'despesas' | 'faturamento' | 'completo';
}

export default function Relatorios() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: contractsCategories } = useContractsAndCategories();

  const contracts = contractsCategories?.contracts || [];
  const categories = contractsCategories?.categories || [];
  const { isMobile, isTablet } = useResponsive();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [importDate, setImportDate] = useState(new Date().toISOString().split('T')[0]);

  const [filters, setFilters] = useState<ReportFilters>({
    year: new Date().getFullYear().toString(),
    month: "all",
    category: "all",
    contractNumber: "all",
    paymentMethod: "all",
    startDate: "",
    endDate: "",
    reportType: "completo"
  });

  // Import Excel mutation
  const importExcelMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/expenses/import-excel', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro na importação');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      setIsImportModalOpen(false);

      // Toast principal de sucesso
      setTimeout(() => {
        toast({
          title: data.success ? "Importação concluída!" : "Importação com problemas",
          description: data.message,
          variant: data.success ? "default" : "destructive",
        });
      }, 100);

      // Toast com detalhes se houve melhorias
      if (data.enhanced > 0) {
        setTimeout(() => {
          toast({
            title: `${data.enhanced} melhorias aplicadas`,
            description: "Dados foram normalizados automaticamente conforme padrões do sistema.",
          });
        }, 1500);
      }

      // Toast com avisos se houver
      if (data.warnings > 0) {
        setTimeout(() => {
          toast({
            title: `${data.warnings} avisos`,
            description: "Alguns dados foram ajustados automaticamente.",
          });
        }, 3000);
      }

      // Toast com erros se houver
      if (data.errors > 0) {
        setTimeout(() => {
          toast({
            title: `${data.errors} linhas com problemas`,
            description: "Algumas linhas não puderam ser importadas devido a dados inválidos.",
            variant: "destructive",
          });
        }, 4500);
      }
    },
    onError: (error: any) => {
      setIsImportModalOpen(false);
      toast({
        title: "Erro na importação",
        description: error.message || "Falha ao importar planilha Excel",
        variant: "destructive",
      });
    },
  });

  const validateFile = (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'application/octet-stream' // fallback MIME type
    ];

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      throw new Error('Formato de arquivo inválido. Use apenas .xlsx, .xls ou .csv');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('Arquivo muito grande. Limite de 10MB');
    }

    return true;
  };

  const safeDownload = (blob: Blob, filename: string) => {
    try {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;

      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();

      // Clean up
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      throw new Error('Erro ao realizar download do arquivo');
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;

    try {
      validateFile(file);

      toast({
        title: "Arquivo carregado",
        description: `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      });

      const formData = new FormData();
      formData.append('excel', file);
      formData.append('importDate', importDate);
      importExcelMutation.mutate(formData);
    } catch (error: any) {
      toast({
        title: "Erro no arquivo",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: authApi.getCurrentUser,
  });

  // Query para buscar despesas com filtros aplicados
  const { data: filteredExpenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['/api/expenses', filters.year, filters.month, filters.category, filters.contractNumber, filters.paymentMethod, filters.startDate, filters.endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.year !== "all") params.append('year', filters.year);
      if (filters.month !== "all") params.append('month', filters.month);
      if (filters.category !== "all") params.append('category', filters.category);
      if (filters.contractNumber !== "all") params.append('contractNumber', filters.contractNumber);
      if (filters.paymentMethod !== "all") params.append('paymentMethod', filters.paymentMethod);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`/api/expenses?${params.toString()}`);
      if (!response.ok) throw new Error('Erro ao buscar despesas');
      return response.json();
    },
  });

  // Buscar dados de faturamento com filtros
  const { data: faturamentos = [], isLoading: isLoadingBilling } = useQuery({
    queryKey: ['/api/billing', filters.year, filters.month, filters.contractNumber],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.year && filters.year !== "all") params.append('year', filters.year);
      if (filters.month && filters.month !== "all") params.append('month', filters.month);
      if (filters.contractNumber && filters.contractNumber !== "all") params.append('contractNumber', filters.contractNumber);

      return apiRequest(`/api/billing?${params.toString()}`, 'GET');
    },
  });

  // Aliases para manter compatibilidade
  const expenses = filteredExpenses;
  const isLoadingExpenses = expensesLoading;

  const clearFilters = () => {
    setFilters({
      year: new Date().getFullYear().toString(),
      month: "all",
      category: "all",
      contractNumber: "all",
      paymentMethod: "all",
      startDate: "",
      endDate: "",
      reportType: "completo"
    });
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
          formatDateForCSV(expense.paymentDate),
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
          billing.paymentDate ? formatDateForCSV(billing.paymentDate) : 'N/A',
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <div className={`flex-1 ${isMobile ? 'ml-0' : 'ml-64'}`}>
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className={`${isMobile ? 'flex-col gap-4' : 'flex items-center justify-between'}`}>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="h-6 w-6 text-orange-600" />
                  Relatórios
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Gere e baixe relatórios detalhados de despesas e faturamento
                </p>
              </div>

              <div className={`${isMobile ? 'flex flex-col gap-2 w-full' : 'flex items-center gap-3'}`}>
                <Button 
                  onClick={() => setIsImportModalOpen(true)}
                  className={`bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 ${isMobile ? 'w-full justify-center' : ''}`}
                >
                  <Upload className="h-4 w-4" />
                  Importar Excel
                </Button>

                <Button 
                  onClick={handleDownload}
                  disabled={isLoading}
                  className={`bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 ${isMobile ? 'w-full justify-center' : ''}`}
                >
                  <Download className="h-4 w-4" />
                  Baixar Relatório
                </Button>
              </div>
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
              <div className="space-y-4">
                <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
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
                </div>

                <ExpenseFilters
                  filters={filters}
                  setFilters={setFilters}
                  clearFilters={clearFilters}
                  user={user}
                />
              </div>
            </CardContent>
          </Card>

          {/* Prévia dos Dados */}
          <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
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
        </main>

        {/* Modal de Importação */}
        <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
          <DialogContent className={`${isMobile ? 'max-w-[95vw] max-h-[90vh]' : 'max-w-md'}`}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Importar Planilha Excel
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label htmlFor="import-date" className="block text-sm font-medium text-gray-700 mb-2">
                  Data para as despesas importadas
                </label>
                <Input
                  id="import-date"
                  type="date"
                  defaultValue={importDate}
                  className="w-full"
                  onChange={(e) => setImportDate(e.target.value)}
                />
              </div>

              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragOver 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 hover:border-green-400'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <Upload className={`h-8 w-8 mx-auto mb-2 ${isDragOver ? 'text-green-500' : 'text-gray-400'}`} />
                <p className="text-sm text-gray-600 mb-2">
                  Arraste e solte sua planilha aqui ou
                </p>
                <label htmlFor="file-input" className="inline-block">
                  <span className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded cursor-pointer">
                    Selecionar Arquivo
                  </span>
                  <input
                    id="file-input"
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleInputChange}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Formatos aceitos: .xlsx, .xls, .csv (máx. 10MB)
                </p>
              </div>

              {importExcelMutation.isPending && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Processando planilha...</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}