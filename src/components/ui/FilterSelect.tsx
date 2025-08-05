import React, { useState } from 'react';
import { ChevronDown, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterSelectProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
}

const FilterSelect: React.FC<FilterSelectProps> = ({
  options,
  value,
  onChange,
  label,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className={cn("relative", className)}>
      <label className="block text-sm font-medium mb-2 text-foreground flex items-center gap-2">
        <Filter className="w-4 h-4" />
        {label}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full px-4 py-3 border border-input rounded-xl bg-background text-foreground text-left",
            "transition-all duration-200 ease-in-out",
            "hover:border-border/80 focus:border-primary focus:ring-2 focus:ring-primary/20",
            "flex items-center justify-between"
          )}
        >
          <span className="flex items-center gap-2">
            {selectedOption?.label || 'Выберите...'}
            {selectedOption?.count !== undefined && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                {selectedOption.count}
              </span>
            )}
          </span>
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {isOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <div className={cn(
              "absolute top-full left-0 right-0 mt-2 z-20",
              "bg-card border border-border rounded-xl shadow-lg",
              "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
            )}>
              <div className="py-2">
                {options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full px-4 py-2 text-left hover:bg-secondary/50 transition-colors",
                      "flex items-center justify-between",
                      value === option.value && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    <span>{option.label}</span>
                    {option.count !== undefined && (
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        value === option.value
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {option.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FilterSelect;
