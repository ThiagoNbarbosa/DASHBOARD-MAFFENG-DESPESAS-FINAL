import { useQuery } from "@tanstack/react-query";

export interface ContractsAndCategories {
  contracts: string[];
  categories: string[];
}

export function useContractsAndCategories() {
  return useQuery<ContractsAndCategories>({
    queryKey: ['/api/contracts-and-categories'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useContracts() {
  return useQuery({
    queryKey: ['/api/contracts'],
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['/api/categories'],
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
}