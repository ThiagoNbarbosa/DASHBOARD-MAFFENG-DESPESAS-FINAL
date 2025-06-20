import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt, FileText, Calendar, DollarSign, Filter } from "lucide-react";

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

  // Query para buscar dados de faturamento (implementação futura com endpoint real)
  const { data: faturamentos = [], isLoading } = useQuery({
    queryKey: ['/api/faturamento', filters],
    queryFn: async () => {
      // Dados mockados para demonstração do layout
      const mockData: FaturamentoItem[] = [
        {
          id: "FAT001",
          contractNumber: "0001",
          clientName: "Cliente Exemplo A",
          description: "Serviços de consultoria - Janeiro 2025",
          value: 5000.00,
          dueDate: "2025-01-31",
          status: "pendente",
          issueDate: "2025-01-01"
        },
        {
          id: "FAT002",
          contractNumber: "0002",
          clientName: "Cliente Exemplo B",
          description: "Manutenção sistema - Janeiro 2025",
          value: 3500.00,
          dueDate: "2025-02-15",
          status: "pago",
          issueDate: "2025-01-15"
        },
        {
          id: "FAT003",
          contractNumber: "0001",
          clientName: "Cliente Exemplo A",
          description: "Serviços adicionais - Dezembro 2024",
          value: 2800.00,
          dueDate: "2024-12-31",
          status: "vencido",
          issueDate: "2024-12-01"
        }
      ];
      return mockData;
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
    .filter(f => f.status === "pendente")
    .reduce((sum, f) => sum + f.value, 0);

  const totalPago = faturamentos
    .filter(f => f.status === "pago")
    .reduce((sum, f) => sum + f.value, 0);

  const totalVencido = faturamentos
    .filter(f => f.status === "vencido")
    .reduce((sum, f) => sum + f.value, 0);

  // Filtrar dados
  const filteredFaturamentos = faturamentos.filter(faturamento => {
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center gap-3">
              <Receipt className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-gray-900">Faturamento</h1>
            </div>
            <p className="mt-2 text-gray-600">
              Gerencie e acompanhe o faturamento dos contratos
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFaturamentos.map((faturamento) => (
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}