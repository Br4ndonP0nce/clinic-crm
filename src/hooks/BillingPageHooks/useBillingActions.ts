// hooks/useBillingFilters.ts
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

// hooks/useBillingActions.ts
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BillingReport, Expense } from '@/types/billing';
import {
  exportBillingReportsToExcel,
  exportExpensesToExcel,
  exportFinancialDashboardToExcel,
} from '@/lib/utils/billingExcelExport';
import { 
  deleteExpense,
  updateExpenseStatus 
} from '@/lib/firebase/billing';

interface UseBillingActionsProps {
  canManageBilling: boolean;
  reports: BillingReport[];
  expenses: Expense[];
  dashboard: any;
  onAddExpense: (expenseData: any) => Promise<void>;
  onRefresh: () => void;
}

export const useBillingActions = ({
  canManageBilling,
  reports,
  expenses,
  dashboard,
  onAddExpense,
  onRefresh,
}: UseBillingActionsProps) => {
  const router = useRouter();

  // Navigation actions
  const handleViewReport = useCallback(
    (report: BillingReport) => {
      router.push(`/admin/billing/report/${report.id}`);
    },
    [router]
  );

  const handleEditReport = useCallback(
    (report: BillingReport) => {
      if (!canManageBilling) {
        alert("No tienes permisos para editar reportes");
        return;
      }
      router.push(`/admin/billing/report/${report.id}/edit`);
    },
    [canManageBilling, router]
  );

  const handleNewReport = useCallback(() => {
    if (!canManageBilling) {
      alert("No tienes permisos para crear reportes");
      return;
    }
    // For now, navigate to calendar as suggested in original component
    router.push("/admin/calendar");
  }, [canManageBilling, router]);

  // Export actions
  const handleExport = useCallback(
    async (
      type: "reports" | "expenses" | "dashboard",
      targetDateFilter: DateFilter
    ) => {
      try {
        const dateLabel = targetDateFilter.label
          .toLowerCase()
          .replace(/\s/g, "_");

        switch (type) {
          case "reports":
            await exportBillingReportsToExcel(
              reports,
              {},
              {},
              `reportes_${dateLabel}_${targetDateFilter.start
                .toISOString()
                .slice(0, 7)}.xlsx`
            );
            break;

          case "expenses":
            await exportExpensesToExcel(
              expenses,
              {},
              `gastos_${dateLabel}_${targetDateFilter.start
                .toISOString()
                .slice(0, 7)}.xlsx`
            );
            break;

          case "dashboard":
            if (dashboard) {
              await exportFinancialDashboardToExcel(
                dashboard,
                reports,
                expenses,
                `dashboard_${dateLabel}_${targetDateFilter.start
                  .toISOString()
                  .slice(0, 7)}.xlsx`
              );
            }
            break;
        }

        console.log(`Export completed for ${type} - ${targetDateFilter.label}`);
      } catch (error) {
        console.error(`Error exporting ${type}:`, error);
        alert(
          `Error al exportar ${type}: ${
            error instanceof Error ? error.message : "Error desconocido"
          }`
        );
      }
    },
    [reports, expenses, dashboard]
  );

  // CRUD actions
  const handlePDF = useCallback(async (report: BillingReport) => {
    console.log("Generating PDF for report:", report.id);
    // TODO: Implement PDF generation
  }, []);

  const handleDeleteReport = useCallback(async (report: BillingReport) => {
    if (!canManageBilling) {
      alert("No tienes permisos para eliminar reportes");
      return;
    }
    
    if (confirm("¿Estás seguro de que deseas eliminar este reporte?")) {
      console.log("Deleting report:", report.id);
      // TODO: Implement delete logic
      onRefresh();
    }
  }, [canManageBilling, onRefresh]);

  // ✅ NEW: Delete expense implementation
  const handleDeleteExpense = useCallback(async (expense: Expense) => {
    if (!canManageBilling) {
      alert("No tienes permisos para eliminar gastos");
      return;
    }
    
    // Double confirmation for delete
    const confirmMessage = `¿Estás seguro de que deseas eliminar este gasto?\n\nDescripción: ${expense.description}\nMonto: ${new Intl.NumberFormat("es-MX", {
      style: "currency", 
      currency: "MXN"
    }).format(expense.amount)}\n\nEsta acción no se puede deshacer.`;
    
    if (confirm(confirmMessage)) {
      try {
        await deleteExpense(expense.id!);
        
        // Show success message
        alert("Gasto eliminado exitosamente");
        
        // Refresh data
        onRefresh();
      } catch (error) {
        console.error("Error deleting expense:", error);
        alert(
          `Error al eliminar el gasto: ${
            error instanceof Error ? error.message : "Error desconocido"
          }`
        );
      }
    }
  }, [canManageBilling, onRefresh]);

  // ✅ NEW: Approve expense implementation  
  const handleApproveExpense = useCallback(async (expense: Expense) => {
    if (!canManageBilling) {
      alert("No tienes permisos para aprobar gastos");
      return;
    }
    
    // Confirmation for approval
    const confirmMessage = `¿Aprobar este gasto?\n\nDescripción: ${expense.description}\nMonto: ${new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN" 
    }).format(expense.amount)}\nCategoría: ${expense.category}\n\nUna vez aprobado, el gasto contará para los reportes financieros.`;
    
    if (confirm(confirmMessage)) {
      try {
        // Update status to 'approved' which makes it count in financial reports
        await updateExpenseStatus(
          expense.id!, 
          'approved', 
          'system', // You might want to pass actual user ID here
          'Gasto aprobado desde el dashboard'
        );
        
        // Show success message
        alert("Gasto aprobado exitosamente. Ahora aparecerá en los reportes financieros.");
        
        // Refresh data to show updated status
        onRefresh();
      } catch (error) {
        console.error("Error approving expense:", error);
        alert(
          `Error al aprobar el gasto: ${
            error instanceof Error ? error.message : "Error desconocido"
          }`
        );
      }
    }
  }, [canManageBilling, onRefresh]);

  // Expense management
  const handleAddExpense = useCallback(
    async (expenseData: any) => {
      try {
        await onAddExpense(expenseData);
        onRefresh();
      } catch (error) {
        console.error("Error adding expense:", error);
        throw error;
      }
    },
    [onAddExpense, onRefresh]
  );

  return {
    // Navigation
    handleViewReport,
    handleEditReport,
    handleNewReport,
    
    // Export
    handleExport,
    
    // CRUD
    handlePDF,
    handleDeleteReport,
    handleDeleteExpense,
    handleApproveExpense,
    handleAddExpense,
    
    // Utility
    onRefresh,
  };
};
