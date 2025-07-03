import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Calendar, Filter, BarChart3, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CATEGORIAS, CONTRATOS, BANCOS, FORMAS_PAGAMENTO } from "@shared/constants";

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
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ReportFilters>({
    year: new Date().getFullYear().toString(),
    month: "all",
    category: "",
    contractNumber: "",
    paymentMethod: "",
    reportType: "completo"
  });

  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importDate, setImportDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Mutation para importar Excel
  const importExcelMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/expenses/import-excel", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro na importação");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setShowImportModal(false);
      setSelectedFile(null);

      // 🛑 TRATAR IMPORTAÇÃO BLOQUEADA
      if (data.blocked) {
        toast({
          title: "🚫 Importação Bloqueada",
          description: "A planilha contém dados inválidos que não estão nas listas oficiais do sistema.",
          variant: "destructive",
          className: "border-red-500 bg-red-50",
        });

        // Toast detalhado com instruções
        setTimeout(() => {
          toast({
            title: "📋 Dados que precisam ser corrigidos",
            description: `Categorias inválidas: ${data.blockingReasons?.invalidCategories || 0} | Contratos: ${data.blockingReasons?.invalidContracts || 0} | Formas de pagamento: ${data.blockingReasons?.invalidPaymentMethods || 0}`,
            className: "bg-orange-50 border-orange-200",
          });
        }, 2000);

        // Log detalhado dos dados inválidos
        console.log("🚫 IMPORTAÇÃO BLOQUEADA - Detalhes:", {
          "Motivos do Bloqueio": data.blockingReasons,
          "Dados Inválidos": data.validation,
          "Valores Permitidos": data.allowedValues,
          "Instruções": data.instructions
        });

        return;
      }

      // Continuar com importação bem-sucedida
      refetch();

      // Toast com informações mais detalhadas
      if (data.success) {
        toast({
          title: "🎉 Importação concluída!",
          description: `${data.imported} despesas importadas com sucesso. ${data.enhanced > 0 ? `${data.enhanced} dados foram melhorados automaticamente.` : ''}`,
          className: "bg-green-50 border-green-200",
        });

        // Toast adicional com estatísticas se houver melhorias
        if (data.enhanced > 0) {
          setTimeout(() => {
            toast({
              title: "✨ Melhorias aplicadas",
              description: `${data.enhanced} linhas tiveram dados normalizados automaticamente para o padrão do sistema.`,
              className: "bg-blue-50 border-blue-200",
            });
          }, 2000);
        }

        // Toast com avisos se houver
        if (data.feedback?.warnings?.length > 0) {
          setTimeout(() => {
            toast({
              title: "⚠️ Avisos detectados",
              description: `${data.feedback.warnings.length} avisos foram encontrados. Verifique os dados no console.`,
              className: "bg-yellow-50 border-yellow-200",
            });
          }, 3500);
        }
      }

      // Log detalhado no console para desenvolvimento
      console.log("📋 Relatório Completo da Importação:", {
        "✅ Importadas": data.imported,
        "✨ Melhoradas": data.enhanced,
        "📈 Taxa de Sucesso": data.statistics?.successRate,
        "🔍 Qualidade": data.statistics?.dataQuality,
        "🚫 Erros": data.feedback?.errors?.length || 0,
        "⚠️ Avisos": data.feedback?.warnings?.length || 0,
        "❌ Validações": data.feedback?.validationIssues?.length || 0,
        "💡 Insights": data.feedback?.insights?.length || 0,
        "Detalhes Completos": data
      });
    },
    onError: (error) => {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const validateFile = (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/excel',
      'text/csv'
    ];

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

    return validTypes.includes(file.type) || validExtensions.includes(fileExtension);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (validateFile(file)) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione um arquivo Excel (.xlsx ou .xls).",
          variant: "destructive",
        });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) {
      toast({
        title: "Nenhum arquivo detectado",
        description: "Tente arrastar um arquivo novamente.",
        variant: "destructive",
      });
      return;
    }

    if (files.length > 1) {
      toast({
        title: "Múltiplos arquivos detectados",
        description: "Por favor, arraste apenas um arquivo por vez.",
        variant: "destructive",
      });
      return;
    }

    const file = files[0];

    // Verificar tamanho do arquivo (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB.",
        variant: "destructive",
      });
      return;
    }

    if (validateFile(file)) {
      setSelectedFile(file);
      toast({
        title: "✅ Arquivo carregado com sucesso",
        description: `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) pronto para importação inteligente.`,
      });
    } else {
      toast({
        title: "Formato não suportado",
        description: "Por favor, arraste um arquivo Excel (.xlsx, .xls) ou CSV.",
        variant: "destructive",
      });
    }
  };

  const handleImportExcel = () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append('excel', selectedFile);
      formData.append('importDate', importDate);
      importExcelMutation.mutate(formData);
    }
  };

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

    const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
    queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
  };


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

              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowImportModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Importar Excel
                </Button>

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
                  <Select
                    value={filters.category}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {CATEGORIAS.map((categoria) => (
                        <SelectItem key={categoria} value={categoria}>
                          {categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número do Contrato
                  </label>
                  <Select
                    value={filters.contractNumber}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, contractNumber: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os contratos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os contratos</SelectItem>
                      {CONTRATOS.map((contrato) => (
                        <SelectItem key={contrato} value={contrato}>
                          {contrato}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      {FORMAS_PAGAMENTO.map((metodo) => (
                        <SelectItem key={metodo} value={metodo}>
                          {metodo}
                        </SelectItem>
                      ))}
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

      {/* Modal de Importação de Excel */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Importar Despesas do Excel</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <div className="bg-blue-50 p-3 rounded-lg mb-3">
                <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                  <span>🧠</span> Importação Inteligente
                </h4>
                <p className="text-xs text-blue-700">
                  O sistema detecta automaticamente as colunas, normaliza categorias 
                  e métodos de pagamento, e corrige formatos de dados!
                </p>
              </div>

              <p className="mb-2">Formatos aceitos (ordem flexível):</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>Item/Descrição:</strong> Nome do produto/serviço</li>
                <li><strong>Valor:</strong> R$ 100,00 ou 100.50 (múltiplos formatos)</li>
                <li><strong>Pagamento:</strong> Cartão, PIX, Dinheiro, etc.</li>
                <li><strong>Categoria:</strong> Alimentação, Transporte, etc.</li>
                <li><strong>Contrato:</strong> Número ou código do contrato</li>
                <li><strong>Data:</strong> DD/MM/AAAA ou outros formatos</li>
              </ul>
              <p className="mt-2 text-xs text-green-600">
                ✅ Cabeçalhos são detectados automaticamente
              </p>
            </div>

            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <FileText className="h-8 w-8 text-green-600 mx-auto" />
                  <p className="text-sm font-medium text-green-600">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedFile(null)}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remover
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {isDragging ? (
                    <div className="animate-bounce">
                      <Upload className="h-10 w-10 text-blue-500 mx-auto" />
                    </div>
                  ) : (
                    <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                  )}

                  <div>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <span className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        Clique para selecionar arquivo
                      </span>
                    </label>

                    {isDragging ? (
                      <div className="mt-2 p-2 bg-blue-100 rounded-lg">
                        <p className="text-sm font-medium text-blue-700">
                          📂 Solte o arquivo aqui!
                        </p>
                        <p className="text-xs text-blue-600">
                          Excel (.xlsx, .xls) ou CSV aceitos
                        </p>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">
                          ou <span className="font-medium">arraste e solte</span> um arquivo Excel aqui
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Máximo: 10MB • Formatos: .xlsx, .xls, .csv
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Seletor de Data para Importação */}
            <div className="space-y-2 pt-4 border-t">
              <label className="text-sm font-medium text-gray-700">
                Data para aplicar às despesas:
              </label>
              <Input
                type="date"
                value={importDate}
                onChange={(e) => setImportDate(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Esta data será aplicada a todas as despesas importadas da planilha
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowImportModal(false);
                  setSelectedFile(null);
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleImportExcel}
                disabled={!selectedFile || importExcelMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {importExcelMutation.isPending ? "Importando..." : "Importar"}              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}