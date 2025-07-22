import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, Check } from 'lucide-react';
import { useResponsive } from '@/hooks/use-responsive';

interface Option {
  value: string;
  label: string;
}

interface MobileSafeSelectProps {
  options: Option[];
  value?: string;
  placeholder?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

// Componente Select específico para mobile que evita problemas de tela branca
export function MobileSafeSelect({ 
  options, 
  value, 
  placeholder, 
  onValueChange, 
  disabled 
}: MobileSafeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isMobile } = useResponsive();
  const selectRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setIsOpen(false);
  };

  if (!isMobile) {
    // Para desktop, use o Select normal do Radix
    return (
      <select 
        value={value || ''}
        onChange={(e) => onValueChange(e.target.value)}
        disabled={disabled}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div ref={selectRef} className="relative w-full">
      <Button
        variant="outline"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full justify-between h-10"
      >
        <span className="truncate">
          {selectedOption?.label || placeholder || 'Selecionar...'}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1">
          <Card>
            <CardContent className="p-0">
              <div className="max-h-60 overflow-y-auto">
                {options.map((option, index) => (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2 ${
                      index > 0 ? 'border-t border-border' : ''
                    } ${value === option.value ? 'bg-accent text-accent-foreground' : ''}`}
                  >
                    <span className="flex-1 truncate">{option.label}</span>
                    {value === option.value && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default MobileSafeSelect;