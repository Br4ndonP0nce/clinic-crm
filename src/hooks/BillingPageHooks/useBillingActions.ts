// hooks/useBillingFilters.ts
import { useState, useMemo } from 'react';
import { generateBillingPDF } from '@/lib/utils/pdf';
import { toast } from 'sonner';
import { deleteBillingReport,softDeleteBillingReport } from '@/lib/firebase/billing';
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
    const typeLabels = {
      reports: "reportes",
      expenses: "gastos", 
      dashboard: "dashboard"
    };

    const exportPromise = (async () => {
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
          if (!dashboard) {
            throw new Error("No hay datos del dashboard para exportar");
          }
          await exportFinancialDashboardToExcel(
            dashboard,
            reports,
            expenses,
            `dashboard_${dateLabel}_${targetDateFilter.start
              .toISOString()
              .slice(0, 7)}.xlsx`
          );
          break;
      }
    })();

    toast.promise(exportPromise, {
      loading: `Exportando ${typeLabels[type]} para ${targetDateFilter.label}...`,
      success: `${typeLabels[type].charAt(0).toUpperCase() + typeLabels[type].slice(1)} exportados exitosamente`,
      error: (error) => `Error al exportar ${typeLabels[type]}: ${error instanceof Error ? error.message : 'Error desconocido'}`,
    });
  },
  [reports, expenses, dashboard]
);

  // CRUD actions
  const handlePDF = useCallback(async (report: BillingReport) => {
    if (!report.id) {
      toast.error('ID de reporte no válido');
      return;
    }

    if (report.status === 'draft') {
      toast.error('No se puede generar PDF de un reporte en borrador');
      return;
    }

    try {
      await generateBillingPDF(report.id);
      // Success toast is handled by generateBillingPDF function
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Error toast is handled by generateBillingPDF function
    }
  }, []);

  const handleDeleteReport = useCallback(async (report: BillingReport) => {
  if (!canManageBilling) {
    toast.error("Sin permisos", {
      description: "No tienes permisos para eliminar reportes",
      action: {
        label: "Entendido",
        onClick: () => toast.dismiss(),
      },
    });
    return;
  }
  
  // Custom confirmation with detailed info
  const confirmMessage = `¿Eliminar reporte definitivamente?\n\n` +
    `📄 Factura: ${report.invoiceNumber || 'Sin número'}\n` +
    `💰 Total: ${new Intl.NumberFormat("es-MX", {
      style: "currency", 
      currency: "MXN"
    }).format(report.total)}\n` +
    `📊 Estado: ${report.status}\n` +
    `📅 Fecha: ${report.createdAt?.toDate?.()?.toLocaleDateString('es-MX') || 'N/A'}\n\n` +
    `⚠️ ADVERTENCIA: Esta acción es irreversible`;
  
  if (!confirm(confirmMessage)) {
    toast.info("Eliminación cancelada");
    return;
  }

  // Use toast.promise for better UX
  toast.promise(
    deleteBillingReport(report.id!).then(() => onRefresh()),
    {
      loading: "Eliminando reporte...",
      success: (data) => {
        return `Reporte ${report.invoiceNumber || report.id} eliminado exitosamente`;
      },
      error: (error) => {
        return `Error al eliminar: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      },
    }
  );
}, [canManageBilling, onRefresh]);

const handleDeleteExpense = useCallback(async (expense: Expense) => {
  if (!canManageBilling) {
    toast.error("Sin permisos para eliminar gastos");
    return;
  }
  
  const confirmMessage = `¿Eliminar este gasto?\n\n` +
    `📝 ${expense.description}\n` +
    `💰 ${new Intl.NumberFormat("es-MX", {
      style: "currency", 
      currency: "MXN"
    }).format(expense.amount)}\n` +
    `📂 Categoría: ${expense.category}\n\n` +
    `Esta acción no se puede deshacer.`;
  
  if (!confirm(confirmMessage)) {
    toast.info("Eliminación cancelada");
    return;
  }

  toast.promise(
    deleteExpense(expense.id!).then(() => onRefresh()),
    {
      loading: "Eliminando gasto...",
      success: `Gasto "${expense.description}" eliminado exitosamente`,
      error: (error) => `Error al eliminar: ${error instanceof Error ? error.message : 'Error desconocido'}`,
    }
  );
}, [canManageBilling, onRefresh]);

  // ✅ NEW: Approve expense implementation  
const handleApproveExpense = useCallback(async (expense: Expense) => {
  if (!canManageBilling) {
    toast.error("Sin permisos para aprobar gastos");
    return;
  }
  
  const confirmMessage = `¿Aprobar este gasto?\n\n` +
    `📝 ${expense.description}\n` +
    `💰 ${new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN" 
    }).format(expense.amount)}\n` +
    `📂 ${expense.category}\n\n` +
    `Una vez aprobado, aparecerá en reportes financieros.`;
  
  if (!confirm(confirmMessage)) {
    toast.info("Aprobación cancelada");
    return;
  }

  toast.promise(
    updateExpenseStatus(
      expense.id!, 
      'approved', 
      'system',
      'Aprobado desde dashboard administrativo'
    ).then(() => onRefresh()),
    {
      loading: "Aprobando gasto...",
      success: (data) => {
        return `Gasto "${expense.description}" aprobado y agregado a reportes financieros`;
      },
      error: (error) => `Error al aprobar: ${error instanceof Error ? error.message : 'Error desconocido'}`,
    }
  );
}, [canManageBilling, onRefresh]);

  // Expense management
const handleAddExpense = useCallback(
  async (expenseData: any) => {
    toast.promise(
      onAddExpense(expenseData).then(() => onRefresh()),
      {
        loading: `Agregando gasto: ${expenseData.description || 'Nuevo gasto'}...`,
        success: (data) => {
          return `Gasto "${expenseData.description}" agregado exitosamente`;
        },
        error: (error) => {
          return `Error al agregar gasto: ${error instanceof Error ? error.message : 'Error desconocido'}`;
        },
      }
    );
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
