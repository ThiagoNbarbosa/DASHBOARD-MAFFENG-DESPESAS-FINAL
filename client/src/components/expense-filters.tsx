import { useState, useCallback, memo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MobileSelect } from "./mobile-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, Filter, Search } from "lucide-react";
import { FORMAS_PAGAMENTO } from "@shared/constants";
import { useContractsAndCategories } from "@/hooks/use-contracts-categories";
import { useIsMobile } from "@/hooks/use-mobile";
import type { User } from "@shared/schema";

interface ExpenseFiltersProps {
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

export function ExpenseFilters({ filters, setFilters, clearFilters, user }: ExpenseFiltersProps) {
  const { data: contractsCategories, isLoading } = useContractsAndCategories();

  const contracts = (contractsCategories as any)?.contracts || [];
  const categories = (contractsCategories as any)?.categories || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div>
          <Label>Ano</Label>
          <MobileSelect
            value={filters.year}
            onValueChange={(value) => setFilters({ ...filters, year: value })}
            options={[
              {value: "all", label: "Todos os anos"}, 
              {value: "2025", label: "2025"}, 
              {value: "2026", label: "2026"}, 
              {value: "2027", label: "2027"}, 
              {value: "2028", label: "2028"}, 
              {value: "2029", label: "2029"}, 
              {value: "2030", label: "2030"}
            ]}
            placeholder="Selecione o ano"
          />
        </div>

        <div>
          <Label>Mês</Label>
          <MobileSelect
            value={filters.month}
            onValueChange={(value) => setFilters({ ...filters, month: value })}
            options={[
              {value: "all", label: "Todos os meses"}, 
              {value: "01", label: "Janeiro"}, 
              {value: "02", label: "Fevereiro"}, 
              {value: "03", label: "Março"}, 
              {value: "04", label: "Abril"}, 
              {value: "05", label: "Maio"}, 
              {value: "06", label: "Junho"}, 
              {value: "07", label: "Julho"}, 
              {value: "08", label: "Agosto"}, 
              {value: "09", label: "Setembro"}, 
              {value: "10", label: "Outubro"}, 
              {value: "11", label: "Novembro"}, 
              {value: "12", label: "Dezembro"}
            ]}
            placeholder="Todos os meses"
          />
        </div>

        <div>
          <Label>Categoria</Label>
          <MobileSelect
            value={filters.category}
            onValueChange={(value) => setFilters({ ...filters, category: value })}
            options={[
              {value: "all", label: "Todas as categorias"}, 
              {value: "(Sem Categoria)", label: "(Sem Categoria)"}, 
              ...categories.filter((cat: string) => cat !== '(Sem Categoria)').map((cat: string) => ({value: cat, label: cat}))
            ]}
            placeholder="Todas as categorias"
          />
        </div>

        <div>
          <Label>Forma de Pagamento</Label>
          <MobileSelect
            value={filters.paymentMethod}
            onValueChange={(value) => setFilters({ ...filters, paymentMethod: value })}
            options={[
              {value: "all", label: "Todas as formas"}, 
              ...FORMAS_PAGAMENTO.map(method => ({value: method, label: method}))
            ]}
            placeholder="Todas as formas"
          />
        </div>

        <div>
          <Label>Contrato</Label>
          <MobileSelect
            value={filters.contractNumber}
            onValueChange={(value) => setFilters({ ...filters, contractNumber: value })}
            options={[
              {value: "all", label: "Todos os contratos"}, 
              {value: "(Sem Contrato)", label: "(Sem Contrato)"}, 
              ...contracts.filter((cont: string) => cont !== '(Sem Contrato)').map((cont: string) => ({value: cont, label: cont}))
            ]}
            placeholder="Todos os contratos"
          />
        </div>

        <div className="flex items-end">
          <Button variant="outline" onClick={clearFilters} className="w-full">
            <X className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>
        </div>
      </div>

      {/* Barra de Pesquisa */}
      <div className="mt-4">
        <Label>Buscar</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="searchFilter"
            type="text"
            placeholder="Buscar por agência, código ou chamado..."
            value={filters.search || ""}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-10 pr-10"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ ...filters, search: "" })}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <Label>Data Inicial</Label>
          <Input
            id="startDate"
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
        </div>

        <div>
          <Label>Data Final</Label>
          <Input
            id="endDate"
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}