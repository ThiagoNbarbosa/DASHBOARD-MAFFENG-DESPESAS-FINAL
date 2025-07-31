import { Search, X, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

interface FilterOption {
  key: string;
  label: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
}

interface ModernFiltersProps {
  filters: Record<string, string>;
  onFilterChange: (filters: Partial<Record<string, string>>) => void;
  filterOptions: FilterOption[];
  searchPlaceholder?: string;
  showExport?: boolean;
  onExport?: () => void;
  title?: string;
}

export function ModernFilters({
  filters,
  onFilterChange,
  filterOptions,
  searchPlaceholder = "Buscar...",
  showExport = true,
  onExport,
  title = "Filtros"
}: ModernFiltersProps) {
  const handleClearFilters = () => {
    const clearedFilters: Record<string, string> = {};
    filterOptions.forEach(option => {
      clearedFilters[option.key] = "all";
    });
    if (filters.search !== undefined) {
      clearedFilters.search = "";
    }
    onFilterChange(clearedFilters);
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      console.log("Export functionality not implemented yet");
    }
  };

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Filter className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filterOptions.map((option, index) => (
            <motion.div
              key={option.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                {option.label}
              </label>
              <Select 
                value={filters[option.key]} 
                onValueChange={(value) => onFilterChange({ [option.key]: value })}
              >
                <SelectTrigger className="rounded-xl border-gray-200 hover:border-gray-300">
                  <SelectValue placeholder={option.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {option.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          ))}
        </div>

        {filters.search !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: filterOptions.length * 0.1 }}
            className="flex flex-col sm:flex-row sm:items-center gap-4"
          >
            <div className="flex-1">
              <div className="relative">
                <Input
                  placeholder={searchPlaceholder}
                  value={filters.search || ""}
                  onChange={(e) => onFilterChange({ search: e.target.value })}
                  className="pl-10 rounded-xl border-gray-200 hover:border-gray-300"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleClearFilters} className="rounded-xl">
                <X className="w-4 h-4 mr-2" />
                Limpar
              </Button>
              {showExport && (
                <Button variant="outline" onClick={handleExport} className="rounded-xl">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {filters.search === undefined && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: filterOptions.length * 0.1 }}
            className="flex justify-end"
          >
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleClearFilters} className="rounded-xl">
                <X className="w-4 h-4 mr-2" />
                Limpar
              </Button>
              {showExport && (
                <Button variant="outline" onClick={handleExport} className="rounded-xl">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}