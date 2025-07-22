import { useState, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Filter, X } from "lucide-react";
import { ExpenseFilters } from "./expense-filters";
import { useIsMobile } from "@/hooks/use-mobile";
import type { User } from "@shared/schema";

interface MobileFilterPanelProps {
  filters: {
    year: string;
    month: string;
    category: string;
    paymentMethod: string;
    contractNumber: string;
    startDate: string;
    endDate: string;
  };
  setFilters: (filters: any) => void;
  clearFilters: () => void;
  user: any;
  totalFiltersActive?: number;
}

const MobileFilterPanel = memo(function MobileFilterPanel({
  filters,
  setFilters,
  clearFilters,
  user,
  totalFiltersActive = 0
}: MobileFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleFiltersChange = useCallback((newFilters: any) => {
    try {
      setFilters(newFilters);
    } catch (error) {
      console.error('Error updating filters:', error);
    }
  }, [setFilters]);

  const handleClearFilters = useCallback(() => {
    try {
      clearFilters();
      setIsOpen(false);
    } catch (error) {
      console.error('Error clearing filters:', error);
    }
  }, [clearFilters]);

  if (!isMobile) {
    // On desktop, show the regular filters
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <ExpenseFilters
          filters={filters}
          setFilters={handleFiltersChange}
          clearFilters={handleClearFilters}
          user={user}
        />
      </div>
    );
  }

  return (
    <div className="mb-4">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between bg-white border-gray-200 hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Filtros</span>
            </div>
            {totalFiltersActive > 0 && (
              <div className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                {totalFiltersActive}
              </div>
            )}
          </Button>
        </SheetTrigger>
        
        <SheetContent 
          side="bottom" 
          className="h-[80vh] overflow-y-auto"
          aria-describedby="mobile-filters-description"
        >
          <SheetHeader className="pb-4">
            <SheetTitle className="text-left">Filtros de Pesquisa</SheetTitle>
            <p id="mobile-filters-description" className="text-sm text-gray-600 text-left">
              Use os filtros abaixo para encontrar despesas específicas
            </p>
          </SheetHeader>
          
          <div className="space-y-6">
            <ExpenseFilters
              filters={filters}
              setFilters={handleFiltersChange}
              clearFilters={handleClearFilters}
              user={user}
            />
            
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
});

export default MobileFilterPanel;