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
import { MobileSelect } from "@/components/mobile-select";
import { Download, FileText, Calendar, Filter, BarChart3, Upload, X, Eye, Edit, Ban, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useResponsive } from "@/hooks/use-responsive";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BANCOS, FORMAS_PAGAMENTO } from "@shared/constants";
import { useContractsAndCategories } from "@/hooks/use-contracts-categories";
import { formatDateForCSV, formatDateSafely } from "@/lib/date-utils";
import type { Expense } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ReusableReportModal } from "@/components/reusable-report-modal";

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
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className={`transition-all duration-300 ${isMobile ? 'ml-0' : 'ml-64'}`}>
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-orange-100 p-1.5 sm:p-2 rounded-lg">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Relatórios</h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  Gere e baixe relatórios detalhados de despesas e faturamento
                </p>
              </div>
            </div>

            
            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 mt-4">
              <Button 
                onClick={() => setIsImportModalOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {isMobile ? 'Import' : 'Importar Excel'}
              </Button>

              {filters.reportType === "visual" ? (
                <ReusableReportModal
                  title="Relatório de Despesas MAFFENG"
                  data={filteredExpenses}
                  filters={filters}
                  companyName="MAFFENG"
                  reportType="RELATÓRIO FINANCEIRO DE DESPESAS"
                  triggerButton={
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {isMobile ? 'Visual' : 'Relatório Visual'}
                    </Button>
                  }
                    tableConfig={{
                      columns: [
                        { key: 'item', label: 'Item', align: 'left' },
                        { 
                          key: 'category', 
                          label: 'Categoria', 
                          align: 'left',
                          formatter: (value) => value?.replace('[CANCELADA] ', '') || 'Sem categoria'
                        },
                        { 
                          key: 'value', 
                          label: 'Valor', 
                          align: 'right',
                          formatter: (value) => new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(parseFloat(value) || 0)
                        },
                        { key: 'paymentMethod', label: 'Forma Pagamento', align: 'center' },
                        { key: 'contractNumber', label: 'Contrato', align: 'left' },
                        { 
                          key: 'paymentDate', 
                          label: 'Data Pagamento', 
                          align: 'center',
                          formatter: (value) => formatDateSafely(value)
                        },
                        { 
                          key: 'category', 
                          label: 'Status', 
                          align: 'center',
                          formatter: (value) => value?.includes('[CANCELADA]') ? 'CANCELADA' : 'ATIVA'
                        }
                      ]
                    }}
                    customCalculations={(data) => {
                      const totalGeral = data.reduce((sum, item) => {
                        const value = parseFloat(item.value) || 0;
                        return sum + value;
                      }, 0);
                      
                      const despesasAtivas = data.filter(item => !item.category?.includes('[CANCELADA]'));
                      const despesasCanceladas = data.filter(item => item.category?.includes('[CANCELADA]'));
                      
                      const valorMedio = data.length > 0 ? totalGeral / data.length : 0;
                      
                      return (
                        <div className="space-y-1">
                          <p className="text-sm">
                            <strong>Total Geral:</strong> {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(totalGeral)}
                          </p>
                          <p className="text-sm">
                            <strong>Despesas Ativas:</strong> {despesasAtivas.length}
                          </p>
                          <p className="text-sm">
                            <strong>Despesas Canceladas:</strong> {despesasCanceladas.length}
                          </p>
                          <p className="text-sm">
                            <strong>Valor Médio:</strong> {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(valorMedio)}
                          </p>
                        </div>
                      );
                    }}
                  />
                ) : (
                  <Button 
                    onClick={() => handleDownload("download")}
                    disabled={filteredExpenses.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="h-4 w-4" />
                    {isMobile ? 'Download' : 'Baixar Relatório'}
                  </Button>
                )}
            </div>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6">
          {/* Filtros */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros do Relatório
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Relatório
                    </label>
                    <MobileSelect
                      value={filters.reportType}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, reportType: value as any }))}
                      options={[
                        {value: "completo", label: "Relatório Completo (JSON)"}, 
                        {value: "despesas", label: "Apenas Despesas (CSV)"}, 
                        {value: "faturamento", label: "Apenas Faturamento (CSV)"}, 
                        {value: "visual", label: "Relatório Visual (PDF/Impressão)"}
                      ]}
                      placeholder="Selecione o tipo de relatório"
                    />
                  </div>
                </div>

                {/* Filtros idênticos à página de despesas */}
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
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
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

            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
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

          {/* Lista de Despesas Filtradas */}
          {filteredExpenses.length > 0 && (
            <Card className="mt-6 rounded-2xl shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Lista de Despesas para Relatório ({filteredExpenses.length} itens)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isMobile ? (
                  // Layout de cards para mobile
                  <div className="space-y-3">
                    {filteredExpenses.slice(0, 10).map((expense: Expense) => (
                      <div key={expense.id} className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm truncate">{expense.item}</h4>
                            <p className="text-xs text-gray-600">{formatDateSafely(expense.paymentDate)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(expense.value)}
                            </p>
                            {expense.category.includes('[CANCELADA]') ? (
                              <Badge variant="destructive" className="text-xs">Cancelada</Badge>
                            ) : (
                              <Badge variant="default" className="bg-green-100 text-green-800 text-xs">Ativa</Badge>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Categoria: </span>
                            <span className="font-medium">{expense.category.replace('[CANCELADA] ', '')}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Pagamento: </span>
                            <span className="font-medium">{expense.paymentMethod}</span>
                          </div>
                        </div>
                        {expense.contractNumber && (
                          <div className="text-xs">
                            <span className="text-gray-500">Contrato: </span>
                            <span className="font-medium">{expense.contractNumber}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  // Tabela para desktop
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Forma de Pagamento</TableHead>
                          <TableHead>Contrato</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                    <TableBody>
                      {filteredExpenses.slice(0, 10).map((expense: Expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="font-medium">
                            {expense.item}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary"
                              className={expense.category.includes('[CANCELADA]') ? 'bg-red-100 text-red-800' : ''}
                            >
                              {expense.category.replace('[CANCELADA] ', '')}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(expense.value)}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {expense.paymentMethod === "Pix" && "🟢"}
                              {expense.paymentMethod === "Cartão de Crédito" && "💳"}
                              {expense.paymentMethod === "Boleto à Vista" && "🟠"}
                              {expense.paymentMethod === "Boleto a Prazo" && "🔴"}
                              {!["Pix", "Cartão de Crédito", "Boleto à Vista", "Boleto a Prazo"].includes(expense.paymentMethod) && "💰"}
                              {" "}{expense.paymentMethod}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {expense.contractNumber || "Sem contrato"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDateSafely(expense.paymentDate)}
                          </TableCell>
                          <TableCell>
                            {expense.category.includes('[CANCELADA]') ? (
                              <Badge variant="destructive">Cancelada</Badge>
                            ) : (
                              <Badge variant="default" className="bg-green-100 text-green-800">Ativa</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                {filteredExpenses.length > 10 && (
                  <div className="mt-4 text-center">
                    <p className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      Mostrando 10 de {filteredExpenses.length} despesas. 
                      <span className="font-medium"> Todas serão incluídas no relatório.</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Mensagem quando não há despesas */}
          {filteredExpenses.length === 0 && !expensesLoading && (
            <Card className="mt-6 rounded-2xl shadow-sm">
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma despesa encontrada
                </h3>
                <p className="text-gray-500">
                  Ajuste os filtros para ver as despesas que serão incluídas no relatório.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Modal de Importação */}
        <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
          <DialogContent className={`${isMobile ? 'max-w-[95vw] max-h-[85vh] mx-2' : 'max-w-2xl max-h-[90vh]'} overflow-y-auto`}>
            <DialogHeader className={isMobile ? 'pb-2' : ''}>
              <DialogTitle className={`flex items-center gap-2 ${isMobile ? 'text-lg' : ''}`}>
                <Upload className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-green-600`} />
                Importar Planilha Excel
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label htmlFor="import-date" className={`block text-sm font-medium text-gray-700 mb-2 ${isMobile ? 'text-xs' : ''}`}>
                  Data para as despesas importadas
                </label>
                <Input
                  id="import-date"
                  type="date"
                  defaultValue={importDate}
                  className={`w-full ${isMobile ? 'h-10 text-sm' : ''}`}
                  onChange={(e) => setImportDate(e.target.value)}
                />
              </div>

              <div 
                className={`border-2 border-dashed rounded-lg ${isMobile ? 'p-4' : 'p-6'} text-center transition-colors ${
                  isDragOver 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 hover:border-green-400'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <Upload className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} mx-auto mb-2 ${isDragOver ? 'text-green-500' : 'text-gray-400'}`} />
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mb-2`}>
                  {isMobile ? 'Toque para selecionar' : 'Arraste e solte sua planilha aqui ou'}
                </p>
                <label htmlFor="file-input" className="inline-block">
                  <span className={`bg-green-600 hover:bg-green-700 text-white ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'} rounded cursor-pointer`}>
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
                <p className={`text-xs text-gray-500 mt-2 ${isMobile ? 'text-[10px]' : ''}`}>
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