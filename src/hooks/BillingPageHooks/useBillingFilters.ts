import { useState, useMemo } from 'react';

export interface DateFilter {
  start: Date;
  end: Date;
  label: string;
  key: string;
}

export const useBillingFilters = () => {
  // Initialize with current month
  const [dateFilter, setDateFilter] = useState<DateFilter>(() => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
      start: monthStart,
      end: monthEnd,
      label: "Este Mes",
      key: "current",
    };
  });

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Generate filter options
  const generateMonthOptions = useMemo(() => {
    const options: DateFilter[] = [];
    const today = new Date();

    // Current month
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    options.push({
      start: currentMonthStart,
      end: currentMonthEnd,
      label: "Este Mes",
      key: "current",
    });

    // Last month
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    options.push({
      start: lastMonthStart,
      end: lastMonthEnd,
      label: "Mes Pasado",
      key: "last",
    });

    // Last 10 months
    for (let i = 2; i <= 11; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

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

    // Next 3 months
    for (let i = 1; i <= 3; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

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
  }, []);

  const resetFilters = () => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setDateFilter({
      start: monthStart,
      end: monthEnd,
      label: "Este Mes",
      key: "current",
    });
    setStatusFilter('all');
    setTypeFilter('all');
  };

  return {
    dateFilter,
    setDateFilter,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    monthOptions: generateMonthOptions,
    resetFilters,
  };
};
