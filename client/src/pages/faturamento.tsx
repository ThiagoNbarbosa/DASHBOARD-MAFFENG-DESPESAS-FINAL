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
import { Receipt, FileText, Calendar, DollarSign, Filter, Plus, X, Trash2 } from "lucide-react";

// Interface para dados de faturamento
interface FaturamentoItem {
  id: string;
  contractNumber: string;
  clientName: string;
  description: string;
  value: number;
  dueDate: string;
  status: "pendente" | "pago" | "vencido";
  issueDate: string;
}

export default function Faturamento() {
  const [filters, setFilters] = useState({
    month: "",
    year: new Date().getFullYear().toString(),
    status: "",
    contractNumber: "",
  });
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const queryClient = useQueryClient();

  // Buscar dados do usuário atual
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: authApi.getCurrentUser,
  });

  // Verificar se usuário é admin antes de carregar a página
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  // Mutations para cancelar e deletar faturamento (apenas admin)
  const cancelBillingMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/billing/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'vencido' }),
      });

      if (!response.ok) {
        throw new Error('Erro ao cancelar faturamento');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billing'] });
    },
  });

  const deleteBillingMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/billing/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar faturamento');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billing'] });
    },
  });

  // Query para buscar dados de faturamento
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
        value: parseFloat(item.value),
        dueDate: item.dueDate,
        status: item.status,
        issueDate: item.issueDate
      }));
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pago":
        return "bg-green-100 text-green-800";
      case "pendente":
        return "bg-yellow-100 text-yellow-800";
      case "vencido":
        return "bg-red-100 text-red-800";
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
      default:
        return status;
    }
  };

  // Cálculos de resumo
  const totalPendente = faturamentos
    .filter((f: any) => f.status === "pendente")
    .reduce((sum: number, f: any) => sum + parseFloat(f.value), 0);

  const totalPago = faturamentos
    .filter((f: any) => f.status === "pago")
    .reduce((sum: number, f: any) => sum + parseFloat(f.value), 0);

  const totalVencido = faturamentos
    .filter((f: any) => f.status === "vencido")
    .reduce((sum: number, f: any) => sum + parseFloat(f.value), 0);

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
                        {user?.role === 'admin' && <TableHead>Ações</TableHead>}
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
                          {user?.role === 'admin' && (
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-orange-600 border-orange-600 hover:bg-orange-50"
                                  onClick={() => cancelBillingMutation.mutate(faturamento.id)}
                                  disabled={cancelBillingMutation.isPending}
                                >
                                  <X className="h-4 w-4" />
                                  Cancelar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                  onClick={() => deleteBillingMutation.mutate(faturamento.id)}
                                  disabled={deleteBillingMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Excluir
                                </Button>
                              </div>
                            </TableCell>
                          )}
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
        </main>
      </div>
    </div>
  );
}

// Modal de Adicionar Pagamento
function PaymentModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    clientName: "",
    contractNumber: "",
    description: "",
    value: "",
    dueDate: "",
    issueDate: new Date().toISOString().split('T')[0],
    status: "pendente" as const
  });

  // Função para formatar moeda
  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    const formattedValue = (parseInt(numericValue) / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    });
    return formattedValue;
  };

  // Handler para mudança no valor
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numericValue = inputValue.replace(/\D/g, '');
    const decimalValue = (parseInt(numericValue) / 100).toFixed(2);
    setFormData(prev => ({ ...prev, value: decimalValue }));
  };

  const createPaymentMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/billing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName: data.clientName,
          contractNumber: data.contractNumber,
          description: data.description,
          value: parseFloat(data.value.replace(/[^\d,]/g, '').replace(',', '.')).toFixed(2),
          dueDate: new Date(data.dueDate),
          issueDate: new Date(data.issueDate),
          status: data.status,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar pagamento');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billing'] });
      onOpenChange(false);
      // Reset form
      setFormData({
        clientName: "",
        contractNumber: "",
        description: "",
        value: "",
        dueDate: "",
        issueDate: new Date().toISOString().split('T')[0],
        status: "pendente"
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPaymentMutation.mutate(formData);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Adicionar Pagamento</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onOpenChange(false)}
          >
            ×
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              value={formData.value ? formatCurrency((parseFloat(formData.value) * 100).toString()) : ""}
              onChange={handleValueChange}
              placeholder="R$ 0,00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Vencimento
            </label>
            <Input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
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
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
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
  );
}