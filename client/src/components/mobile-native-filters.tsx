import { useState, useCallback, memo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, Search } from "lucide-react";
import { FORMAS_PAGAMENTO } from "@shared/constants";
import { useContractsAndCategories } from "@/hooks/use-contracts-categories";

interface MobileNativeFiltersProps {
  filters: {
    year: string;
    month: string;
    category: string;
    contractNumber: string;
    paymentMethod: string;
    startDate: string;
    endDate: string;
    search?: string;
  };
  setFilters: (filters: any) => void;
  clearFilters: () => void;
  user: any;
}

export const MobileNativeFilters = memo(function MobileNativeFilters({ 
  filters, 
  setFilters, 
  clearFilters, 
  user 
}: MobileNativeFiltersProps) {
  const { data: contractsCategories, isLoading } = useContractsAndCategories();

  const contracts = (contractsCategories as any)?.contracts || [];
  const categories = (contractsCategories as any)?.categories || [];

  return (
    <div className="space-y-6 p-1">
      {/* Ano */}
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-2">Ano</Label>
        <select
          value={filters.year}
          onChange={(e) => setFilters({ ...filters, year: e.target.value })}
          className="w-full min-h-[48px] px-4 py-3 text-base border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none"
          style={{ fontSize: '16px', WebkitAppearance: 'none' }}
        >
          <option value="all">Todos os anos</option>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
          <option value="2027">2027</option>
          <option value="2028">2028</option>
          <option value="2029">2029</option>
          <option value="2030">2030</option>
        </select>
      </div>

      {/* Mês */}
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-2">Mês</Label>
        <select
          value={filters.month}
          onChange={(e) => setFilters({ ...filters, month: e.target.value })}
          className="w-full min-h-[48px] px-4 py-3 text-base border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none"
          style={{ fontSize: '16px', WebkitAppearance: 'none' }}
        >
          <option value="all">Todos os meses</option>
          {Array.from({ length: 12 }, (_, i) => {
            const monthNumber = String(i + 1).padStart(2, '0');
            const monthName = new Date(2024, i, 1).toLocaleDateString('pt-BR', { month: 'long' });
            return (
              <option key={monthNumber} value={monthNumber}>
                {monthName}
              </option>
            );
          })}
        </select>
      </div>

      {/* Categoria */}
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-2">Categoria</Label>
        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          className="w-full min-h-[48px] px-4 py-3 text-base border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none"
          style={{ fontSize: '16px', WebkitAppearance: 'none' }}
        >
          <option value="all">Todas as categorias</option>
          <option value="(Sem Categoria)">(Sem Categoria)</option>
          {categories.filter((cat: string) => cat !== '(Sem Categoria)').map((category: string) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Forma de Pagamento */}
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</Label>
        <select
          value={filters.paymentMethod}
          onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
          className="w-full min-h-[48px] px-4 py-3 text-base border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none"
          style={{ fontSize: '16px', WebkitAppearance: 'none' }}
        >
          <option value="all">Todas as formas</option>
          {FORMAS_PAGAMENTO.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>
      </div>

      {/* Contrato */}
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-2">Contrato</Label>
        <select
          value={filters.contractNumber}
          onChange={(e) => setFilters({ ...filters, contractNumber: e.target.value })}
          className="w-full min-h-[48px] px-4 py-3 text-base border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none"
          style={{ fontSize: '16px', WebkitAppearance: 'none' }}
        >
          <option value="all">Todos os contratos</option>
          <option value="(Sem Contrato)">(Sem Contrato)</option>
          {contracts.filter((cont: string) => cont !== '(Sem Contrato)').map((contract: string) => (
            <option key={contract} value={contract}>
              {contract}
            </option>
          ))}
        </select>
      </div>

      {/* Busca */}
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-2">Buscar</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por descrição, agência, código..."
            value={filters.search || ""}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full min-h-[48px] pl-10 pr-10 py-3 text-base border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            style={{ fontSize: '16px' }}
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => setFilters({ ...filters, search: "" })}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Datas */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">Data Inicial</Label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="w-full min-h-[48px] px-4 py-3 text-base border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            style={{ fontSize: '16px' }}
          />
        </div>

        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">Data Final</Label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="w-full min-h-[48px] px-4 py-3 text-base border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            style={{ fontSize: '16px' }}
          />
        </div>
      </div>

      {/* Botão Limpar */}
      <div className="pt-4">
        <Button 
          variant="outline" 
          onClick={clearFilters} 
          className="w-full min-h-[48px] text-base"
          style={{ fontSize: '16px' }}
        >
          <X className="h-5 w-5 mr-2" />
          Limpar Todos os Filtros
        </Button>
      </div>
    </div>
  );
});