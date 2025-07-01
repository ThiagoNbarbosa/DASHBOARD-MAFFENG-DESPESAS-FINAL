import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/auth";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Receipt, FileText, Calendar, DollarSign, Filter, Plus, X, Trash2, XCircle, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Interface para dados de faturamento
interface FaturamentoItem {
  id: string;
  contractNumber: string;
  clientName: string;
  description: string;
  value: string;
  dueDate: string;
  status: "pendente" | "pago" | "vencido" | "cancelado";
  issueDate: string;
  createdAt?: string;
}

export default function Faturamento() {
  const [filters, setFilters] = useState({
    month: "",
    year: new Date().getFullYear().toString(),
    status: "",
    contractNumber: "",
  });
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<FaturamentoItem | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Mutation para cancelar pagamento
  const cancelPaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/billing/${id}/cancel`, "PATCH");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billing'] });
      toast({
        title: "Pagamento cancelado",
        description: "O pagamento foi cancelado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao cancelar",
        description: "Não foi possível cancelar o pagamento.",
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir pagamento
  const deletePaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/billing/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billing'] });
      toast({
        title: "Pagamento excluído",
        description: "O pagamento foi excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o pagamento.",
        variant: "destructive",
      });
    },
  });

  // Funções para lidar com as ações
  const handleCancel = (id: string) => {
    if (confirm("Tem certeza que deseja cancelar este pagamento?")) {
      cancelPaymentMutation.mutate(id);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este pagamento? Esta ação não pode ser desfeita.")) {
      deletePaymentMutation.mutate(id);
    }
  };

  const handleViewDetails = (payment: FaturamentoItem) => {
    setSelectedPayment(payment);
    setIsDetailsModalOpen(true);
  };

  // Buscar dados do usuário atual
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: authApi.getCurrentUser,
  });

  // Verificar se usuário está autenticado
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Carregando dados...</p>
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



  // Query para buscar dados de faturamento com otimização
  const { data: faturamentos = [], isLoading } = useQuery({
    queryKey: ['/api/billing', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.year) params.append('year', filters.year);
      if (filters.month && filters.month !== 'all') params.append('month', filters.month);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.contractNumber) params.append('contractNumber', filters.contractNumber);

      const response = await fetch(`/api/billing?${params}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar faturamento');
      }
      
      const data = await response.json();
      return data.map((item: any) => ({
        id: item.id,
        contractNumber: item.contractNumber,
        clientName: item.clientName,
        description: item.description,
        value: item.value,
        dueDate: item.dueDate,
        status: item.status,
        issueDate: item.issueDate,
        createdAt: item.createdAt
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pago":
        return "bg-green-100 text-green-800";
      case "pendente":
        return "bg-yellow-100 text-yellow-800";
      case "vencido":
        return "bg-red-100 text-red-800";
      case "cancelado":
        return "bg-gray-100 text-gray-800 line-through";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pago":
        return "Pago";
      case "pendente":
        return "Pendente";
      case "vencido":
        return "Vencido";
      case "cancelado":
        return "Cancelado";
      default:
        return status;
    }
  };

  // Função para formatar valores monetários
  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  // Cálculos de resumo
  const totalPendente = faturamentos
    .filter((f: any) => f.status === "pendente")
    .reduce((sum: number, f: any) => sum + parseFloat(f.value || "0"), 0);

  const totalPago = faturamentos
    .filter((f: any) => f.status === "pago")
    .reduce((sum: number, f: any) => sum + parseFloat(f.value || "0"), 0);

  const totalVencido = faturamentos
    .filter((f: any) => f.status === "vencido")
    .reduce((sum: number, f: any) => sum + parseFloat(f.value || "0"), 0);

  // Filtrar dados
  const filteredFaturamentos = faturamentos.filter((faturamento: any) => {
    const fatDate = new Date(faturamento.issueDate);
    const fatMonth = (fatDate.getMonth() + 1).toString().padStart(2, '0');
    const fatYear = fatDate.getFullYear().toString();

    return (
      (!filters.month || filters.month === "all" || fatMonth === filters.month) &&
      (!filters.year || fatYear === filters.year) &&
      (!filters.status || filters.status === "all" || faturamento.status === filters.status) &&
      (!filters.contractNumber || faturamento.contractNumber.includes(filters.contractNumber))
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="lg:pl-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <Receipt className="h-8 w-8 text-primary" />
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Faturamento</h1>
                </div>
                <p className="text-xs sm:text-sm text-gray-600">
                  Gerencie e acompanhe o faturamento dos contratos
                </p>
              </div>
              
              {/* Botão Adicionar Pagamento - Responsivo */}
              <Button 
                onClick={() => setShowPaymentModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base"
              >
                <Plus className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Adicionar Pagamento</span>
                <span className="sm:hidden">Adicionar</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Pendente</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(totalPendente)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Recebido</p>
                    <p className="text-2xl font-bold text-green-600">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(totalPago)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Vencido</p>
                    <p className="text-2xl font-bold text-red-600">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(totalVencido)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                    <FileText className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Ano
                  </label>
                  <Select
                    value={filters.year}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, year: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Mês
                  </label>
                  <Select
                    value={filters.month}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, month: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os meses" />
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
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Status
                  </label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="vencido">Vencido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Contrato
                  </label>
                  <Input
                    placeholder="Número do contrato"
                    value={filters.contractNumber}
                    onChange={(e) => setFilters(prev => ({ ...prev, contractNumber: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Faturamento */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Faturamento</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Carregando faturamento...</div>
              ) : filteredFaturamentos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum faturamento encontrado para os filtros selecionados
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Contrato</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Emissão</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFaturamentos.map((faturamento: any) => (
                        <TableRow key={faturamento.id}>
                          <TableCell className="font-medium">
                            {faturamento.id}
                          </TableCell>
                          <TableCell>{faturamento.contractNumber}</TableCell>
                          <TableCell>{faturamento.clientName}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {faturamento.description}
                          </TableCell>
                          <TableCell className="font-medium">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(faturamento.value)}
                          </TableCell>
                          <TableCell>
                            {new Date(faturamento.dueDate).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(faturamento.status)}>
                              {getStatusText(faturamento.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(faturamento.issueDate).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                onClick={() => handleViewDetails(faturamento)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {user?.role === 'admin' && (
                                <>
                                  {faturamento.status !== 'cancelado' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-orange-600 border-orange-600 hover:bg-orange-50"
                                      onClick={() => handleCancel(faturamento.id)}
                                      disabled={cancelPaymentMutation.isPending}
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                    onClick={() => handleDelete(faturamento.id)}
                                    disabled={deletePaymentMutation.isPending}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Modal de Adicionar Pagamento */}
          <PaymentModal 
            open={showPaymentModal} 
            onOpenChange={setShowPaymentModal} 
          />

          {/* Modal de Detalhes do Pagamento */}
          <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
            <DialogContent className="max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle>Detalhes do Pagamento</DialogTitle>
              </DialogHeader>
              
              {selectedPayment && (
                <div className="space-y-4">
                  {/* ID do Pagamento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ID do Pagamento
                    </label>
                    <p className="text-gray-900 font-mono text-sm">{selectedPayment.id}</p>
                  </div>

                  {/* Nome do Cliente */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cliente
                    </label>
                    <p className="text-gray-900">{selectedPayment.clientName}</p>
                  </div>

                  {/* Descrição */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    <p className="text-gray-900">{selectedPayment.description}</p>
                  </div>

                  {/* Informações financeiras */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor
                      </label>
                      <p className="text-gray-900 font-semibold">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(parseFloat(selectedPayment.value))}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contrato
                      </label>
                      <p className="text-gray-900">{selectedPayment.contractNumber}</p>
                    </div>
                  </div>

                  {/* Datas */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Vencimento
                      </label>
                      <p className="text-gray-900">
                        {new Date(selectedPayment.dueDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Emissão
                      </label>
                      <p className="text-gray-900">
                        {new Date(selectedPayment.issueDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="pt-2 border-t">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <Badge className={getStatusColor(selectedPayment.status)}>
                      {getStatusText(selectedPayment.status)}
                    </Badge>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}

// Modal de Adicionar Pagamento
function PaymentModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    clientName: "",
    contractNumber: "",
    description: "",
    value: "",
    dueDate: new Date().toISOString().split('T')[0], // Define automaticamente como hoje
    paymentDate: "",
    issueDate: new Date().toISOString().split('T')[0],
    status: "pago" as const
  });

  // Função para formatar moeda
  const formatCurrency = (value: string) => {
    if (!value) return "";
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return "";
    
    return numericValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    });
  };

  // Handler para mudança no valor
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numericValue = inputValue.replace(/\D/g, '');
    if (numericValue === '') {
      setFormData(prev => ({ ...prev, value: '' }));
    } else {
      const decimalValue = (parseInt(numericValue) / 100).toFixed(2);
      setFormData(prev => ({ ...prev, value: decimalValue }));
    }
  };

  const createPaymentMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest('/api/billing', 'POST', {
        clientName: data.clientName,
        contractNumber: data.contractNumber,
        description: data.description,
        value: parseFloat(data.value),
        dueDate: new Date(data.dueDate).toISOString(),
        paymentDate: data.paymentDate ? new Date(data.paymentDate).toISOString() : null,
        issueDate: new Date(data.issueDate).toISOString(),
        status: data.status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billing'] });
      queryClient.invalidateQueries({ queryKey: ['/api/billing/stats'] });
      
      // Use setTimeout to ensure DOM is stable before showing toast
      setTimeout(() => {
        toast({
          title: "Faturamento criado",
          description: "O faturamento foi criado com sucesso.",
        });
      }, 100);
      
      onOpenChange(false);
      // Reset form
      setFormData({
        clientName: "",
        contractNumber: "",
        description: "",
        value: "",
        dueDate: "",
        paymentDate: "",
        issueDate: new Date().toISOString().split('T')[0],
        status: "pago"
      });
    },
    onError: (error: any) => {
      console.error("Erro ao criar faturamento:", error);
      
      // Use setTimeout to ensure DOM is stable before showing toast
      setTimeout(() => {
        toast({
          title: "Erro ao criar faturamento",
          description: error.message || "Não foi possível criar o faturamento.",
          variant: "destructive",
        });
      }, 100);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPaymentMutation.mutate(formData);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-sm mx-auto max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Adicionar Pagamento</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onOpenChange(false)}
          >
            ×
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Cliente
            </label>
            <Input
              value={formData.clientName}
              onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número do Contrato
            </label>
            <Input
              value={formData.contractNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, contractNumber: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor
            </label>
            <Input
              type="text"
              value={formData.value ? formatCurrency(formData.value) : ""}
              onChange={handleValueChange}
              placeholder="R$ 0,00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Pagamento
            </label>
            <Input
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700 order-1 sm:order-2"
              disabled={createPaymentMutation.isPending}
            >
              {createPaymentMutation.isPending ? "Adicionando..." : "Adicionar Pagamento"}
            </Button>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
}