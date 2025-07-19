// components/billing/DateFilterSelect.tsx
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";

export interface DateFilter {
  start: Date;
  end: Date;
  label: string;
  key: string;
}

// Generate month options for the last 12 months and next 3 months
export const generateMonthOptions = (): DateFilter[] => {
  const options: DateFilter[] = [];
  const today = new Date();

  // Add "Current Month" option
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const currentMonthEnd = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  );
  options.push({
    start: currentMonthStart,
    end: currentMonthEnd,
    label: "Este Mes",
    key: "current",
  });

  // Add "Last Month" option
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  options.push({
    start: lastMonthStart,
    end: lastMonthEnd,
    label: "Mes Pasado",
    key: "last",
  });

  // Add last 10 months
  for (let i = 2; i <= 11; i++) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthStart = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth(),
      1
    );
    const monthEnd = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + 1,
      0
    );

    options.push({
      start: monthStart,
      end: monthEnd,
      label: monthDate.toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
      }),
      key: `month-${i}`,
    });
  }

  // Add next 3 months
  for (let i = 1; i <= 3; i++) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const monthStart = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth(),
      1
    );
    const monthEnd = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + 1,
      0
    );

    options.push({
      start: monthStart,
      end: monthEnd,
      label: `${monthDate.toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
      })} (Futuro)`,
      key: `future-${i}`,
    });
  }

  return options;
};

interface DateFilterSelectProps {
  currentFilter: DateFilter;
  onChange: (filter: DateFilter) => void;
  className?: string;
}

export const DateFilterSelect: React.FC<DateFilterSelectProps> = ({
  currentFilter,
  onChange,
  className = "w-48",
}) => {
  const monthOptions = generateMonthOptions();

  return (
    <Select
      value={currentFilter.key}
      onValueChange={(value) => {
        const selectedFilter = monthOptions.find(
          (option) => option.key === value
        );
        if (selectedFilter) {
          onChange(selectedFilter);
        }
      }}
    >
      <SelectTrigger className={className}>
        <CalendarIcon className="h-4 w-4 mr-2" />
        <SelectValue placeholder="Seleccionar período" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="current">Este Mes</SelectItem>
        <SelectItem value="last">Mes Pasado</SelectItem>
        {monthOptions.slice(2).map((option) => (
          <SelectItem key={option.key} value={option.key}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
