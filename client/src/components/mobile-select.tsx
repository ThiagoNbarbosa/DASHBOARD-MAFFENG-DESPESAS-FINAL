import { memo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: (string | {value: string, label: string})[];
  placeholder: string;
  label?: string;
  className?: string;
}

export const MobileSelect = memo(function MobileSelect({ 
  value, 
  onValueChange, 
  options, 
  placeholder,
  label,
  className = ""
}: MobileSelectProps) {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return (
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={`w-full min-h-[48px] px-4 py-3 text-base border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 touch-manipulation ${className}`}
        style={{ 
          WebkitAppearance: 'none',
          fontSize: '16px',
          backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          backgroundSize: '16px',
          paddingRight: '40px'
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="z-[99999] max-h-[200px] overflow-y-auto bg-white border shadow-lg">
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          return (
            <SelectItem key={optionValue} value={optionValue}>
              {optionLabel}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
});