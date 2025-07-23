import { useQuery } from "@tanstack/react-query";

export interface ContractsAndCategories {
  contracts: string[];
  categories: string[];
}

export function useContractsAndCategories() {
  return useQuery<ContractsAndCategories>({
    queryKey: ['/api/contracts-and-categories'],
    staleTime: 2 * 60 * 1000, // 2 minutes - dados atualizados mais frequentemente
    gcTime: 30 * 60 * 1000, // 30 minutes - manter em cache por mais tempo
    refetchOnWindowFocus: false, // Não refetch automaticamente
    retry: 3, // Tentar novamente em caso de erro
  });
}

export function useContracts() {
  return useQuery({
    queryKey: ['/api/contracts'],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['/api/categories'],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}