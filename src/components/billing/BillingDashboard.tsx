// components/billing/BillingDashboard.tsx
"use client";

import React, { useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  RefreshCw,
  AlertCircle,
  Filter,
  Calendar,
  CheckCircle,
  FileText,
} from "lucide-react";

// Import our new modular components

import { LoadingState } from "./core/LoadingState";
import { ErrorState } from "./core/ErrorState";
import { EmptyState } from "./core/EmptyState";
import { formatCurrency } from "./core/BillingFormatters";
import { formatDate } from "./core/BillingFormatters";
import { PeriodSummary } from "./PeriodSummary";
import { DateFilterSelect } from "./DateFilterSelect";
import { QuickActionsMenu } from "./QuickActionsMenu";
import { RevenueSummaryCards } from "./RevenueSummaryCards";
import { ReportsTab } from "./tabs/ReportsTab";
import { ExpensesTab } from "./tabs/ExpensesTab";
import { AnalyticsTab } from "./tabs/AnalyticsTab";
import { ExportsTab } from "./tabs/ExportsTab";

// Import hooks
import { useBillingFilters } from "@/hooks/BillingPageHooks/useBillingFilters";
import { useBillingData } from "@/hooks/BillingPageHooks/useBillingData";
import { useBillingActions } from "@/hooks/BillingPageHooks/useBillingActions";
import { useBillingModal } from "@/hooks/BillingPageHooks/useBillingModal";

// Import external dependencies
import { usePermissions } from "@/hooks/usePermissions";
import AddExpenseModal from "@/components/billing/AddExpenseModal";

export default function BillingDashboard() {
  const { canViewBilling, canManageBilling } = usePermissions();

  // Custom hooks for state management
  const {
    dateFilter,
    setDateFilter,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    resetFilters,
  } = useBillingFilters();

  const {
    reports,
    expenses,
    dashboard,
    revenueSummary,
    loading,
    reportsLoading,
    expensesLoading,
    reportsError,
    expensesError,
    addExpense,
    refreshAll,
    getFilteredReports,
    getFilteredExpenses,
    isInitialized,
  } = useBillingData({ canViewBilling, dateFilter });

  const {
    modalState,
    showAddExpenseModal,
    closeModal,
    openAddExpenseModal,
    closeAddExpenseModal,
    handleViewReport,
    handleViewExpense,
    handleCreateGuide,
  } = useBillingModal();

  const {
    handleEditReport,
    handleNewReport,
    handleExport,
    handlePDF,
    handleDeleteReport,
    handleDeleteExpense,
    handleApproveExpense,
    handleAddExpense,
  } = useBillingActions({
    canManageBilling,
    reports,
    expenses,
    dashboard,
    onAddExpense: addExpense,
    onRefresh: refreshAll,
  });

  // Memoized filtered data to prevent recalculations
  const currentReports = useMemo(() => {
    return getFilteredReports(statusFilter, typeFilter);
  }, [getFilteredReports, statusFilter, typeFilter]);

  const currentExpenses = useMemo(() => {
    return getFilteredExpenses(statusFilter);
  }, [getFilteredExpenses, statusFilter]);

  // Enhanced expense handling with modal integration
  const handleNewExpense = useCallback(() => {
    if (!canManageBilling) {
      alert("No tienes permisos para crear gastos");
      return;
    }
    openAddExpenseModal();
  }, [canManageBilling, openAddExpenseModal]);

  const handleExpenseSubmit = useCallback(
    async (expenseData: any) => {
      try {
        await handleAddExpense(expenseData);
        closeAddExpenseModal();
      } catch (error) {
        console.error("Error adding expense:", error);
        throw error;
      }
    },
    [handleAddExpense, closeAddExpenseModal]
  );

  // Access control check
  if (!canViewBilling) {
    return (
      <div className="p-6">
        <EmptyState
          icon={AlertCircle}
          title="Acceso Restringido"
          description="No tienes permisos para acceder al módulo de facturación."
        />
      </div>
    );
  }

  // Show loading state while initializing
  if (!isInitialized && loading) {
    return (
      <div className="p-4">
        <LoadingState type="card" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            Dashboard de Facturación
          </h1>
          <p className="text-sm text-gray-600">
            Gestión integral de reportes, gastos e ingresos con soporte
            multi-reporte
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>
          {canManageBilling && (
            <Button size="sm" onClick={handleCreateGuide}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Reporte
            </Button>
          )}
        </div>
      </div>

      {/* Enhanced Filters and Actions Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Filtros y Acciones
            </span>
          </div>

          <div className="flex items-center gap-2">
            <DateFilterSelect
              currentFilter={dateFilter}
              onChange={setDateFilter}
            />
            <QuickActionsMenu
              currentFilter={dateFilter}
              reports={currentReports}
              expenses={currentExpenses}
              dashboard={dashboard}
              onExport={handleExport}
              onNewExpense={handleNewExpense}
              onNewReport={handleCreateGuide}
              canManage={canManageBilling}
            />
          </div>
        </div>

        {/* Enhanced Period Summary with Multi-Report Support */}
        <PeriodSummary
          filter={dateFilter}
          reports={currentReports}
          expenses={currentExpenses}
        />
      </div>

      {/* Global Revenue Summary */}
      {revenueSummary && (
        <RevenueSummaryCards
          revenueSummary={revenueSummary}
          expenses={currentExpenses}
          reports={currentReports}
          dateFilter={dateFilter}
        />
      )}

      {/* Enhanced Main Tabs with Better Organization */}
      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reports">
            Reportes ({currentReports.length})
          </TabsTrigger>
          <TabsTrigger value="expenses">
            Gastos ({currentExpenses.length})
          </TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
          <TabsTrigger value="exports">Exportar</TabsTrigger>
        </TabsList>

        {/* Reports Tab with Enhanced Multi-Report Support */}
        <TabsContent value="reports">
          <ReportsTab
            reports={currentReports}
            dateFilter={dateFilter}
            loading={reportsLoading}
            error={reportsError}
            canManage={canManageBilling}
            onView={handleViewReport}
            onEdit={handleEditReport}
            onPDF={handlePDF}
            onDelete={handleDeleteReport}
            onExport={() => handleExport("reports", dateFilter)}
            onNewReport={handleCreateGuide}
          />
        </TabsContent>

        {/* Enhanced Expenses Tab */}
        <TabsContent value="expenses">
          <ExpensesTab
            expenses={currentExpenses}
            dateFilter={dateFilter}
            loading={expensesLoading}
            error={expensesError}
            canManage={canManageBilling}
            onView={handleViewExpense}
            onDelete={handleDeleteExpense}
            onApprove={handleApproveExpense}
            onExport={() => handleExport("expenses", dateFilter)}
            onNewExpense={handleNewExpense}
          />
        </TabsContent>

        {/* Enhanced Analytics Tab with Multi-Report Analysis */}
        <TabsContent value="analytics">
          <AnalyticsTab
            reports={currentReports}
            expenses={currentExpenses}
            dateFilter={dateFilter}
            dashboard={dashboard}
            onExport={() => handleExport("dashboard", dateFilter)}
          />
        </TabsContent>

        {/* Enhanced Exports Tab */}
        <TabsContent value="exports">
          <ExportsTab
            reports={currentReports}
            expenses={currentExpenses}
            dashboard={dashboard}
            currentFilter={dateFilter}
            onExport={handleExport}
          />
        </TabsContent>
      </Tabs>

      {/* Enhanced Add Expense Modal */}
      <AddExpenseModal
        open={showAddExpenseModal}
        onOpenChange={closeAddExpenseModal}
        onSubmit={handleExpenseSubmit}
        isLoading={expensesLoading}
        triggerRefresh={refreshAll}
        defaultDate={dateFilter.start.toISOString().split("T")[0]}
      />

      {/* Enhanced Modal Dialogs */}
      <Dialog open={modalState.type !== null} onOpenChange={closeModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {modalState.type === "report"
                ? "Detalles del Reporte"
                : modalState.type === "expense"
                ? "Detalles del Gasto"
                : modalState.type === "create_guide"
                ? "Crear Nuevo Reporte"
                : "Información"}
            </DialogTitle>
            {modalState.type === "create_guide" && (
              <DialogDescription>
                Selecciona cómo quieres crear el nuevo reporte. Se recomienda
                crear desde una cita completada.
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="py-4">
            {modalState.type === "create_guide" && (
              <CreateReportGuide onClose={closeModal} />
            )}

            {modalState.type === "report" && modalState.data && (
              <ReportDetailsView report={modalState.data as any} />
            )}

            {modalState.type === "expense" && modalState.data && (
              <ExpenseDetailsView expense={modalState.data as any} />
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper Components for Modal Content (Memoized to prevent re-renders)
const CreateReportGuide = React.memo<{ onClose: () => void }>(({ onClose }) => {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-blue-800">Recomendación</h3>
        </div>
        <p className="text-blue-700 text-sm">
          Los reportes deben estar vinculados a citas completadas para mantener
          un registro adecuado. Ahora puedes crear múltiples reportes por cita
          para casos complejos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-green-800 mb-2">
                  Desde una Cita (Recomendado)
                </h4>
                <p className="text-sm text-green-700 mb-3">
                  Crea reportes basados en citas completadas. Soporte completo
                  para múltiples reportes por cita: consulta principal,
                  tratamientos adicionales, emergencias, etc.
                </p>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    onClose();
                    window.location.href = "/admin/calendar";
                  }}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Ir al Calendario
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="bg-amber-100 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-amber-800 mb-2">
                  Reporte Manual
                </h4>
                <p className="text-sm text-amber-700 mb-3">
                  Crea un reporte sin vincular a una cita. Útil para ventas de
                  productos, servicios adicionales o reportes especiales.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-600 text-amber-700 hover:bg-amber-100"
                  onClick={() => {
                    onClose();
                    window.location.href = "/admin/billing/report/new";
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Manual
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-2">
          Nuevas Características - Múltiples Reportes
        </h4>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li>Crea múltiples reportes por cita para casos complejos</li>
          <li>Reportes parciales para tratamientos específicos</li>
          <li>Reportes de emergencia para servicios adicionales</li>
          <li>Reportes de productos separados de servicios</li>
          <li>Vinculación automática entre reportes relacionados</li>
        </ul>
      </div>
    </div>
  );
});

CreateReportGuide.displayName = "CreateReportGuide";

const ReportDetailsView = React.memo<{ report: any }>(({ report }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-600">Estado:</label>
          <p className="text-lg">{report.status}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Total:</label>
          <p className="text-lg font-semibold">
            {formatCurrency(report.total)}
          </p>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-600">Servicios:</label>
        <div className="mt-2 space-y-2">
          {report.services?.map((service: any, index: number) => (
            <div
              key={`${service.id || index}`}
              className="bg-gray-50 p-3 rounded"
            >
              <p className="font-medium">{service.description}</p>
              <p className="text-sm text-gray-600">
                Cantidad: {service.quantity} | Precio:{" "}
                {formatCurrency(service.unitPrice)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

const ExpenseDetailsView = React.memo<{ expense: any }>(({ expense }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-600">
            Descripción:
          </label>
          <p className="text-lg">{expense.description}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Monto:</label>
          <p className="text-lg font-semibold text-red-600">
            {formatCurrency(expense.amount)}
          </p>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-600">Fecha:</label>
        <p>{formatDate(expense.date)}</p>
      </div>
      {expense.notes && (
        <div>
          <label className="text-sm font-medium text-gray-600">Notas:</label>
          <p className="bg-gray-50 p-3 rounded">{expense.notes}</p>
        </div>
      )}
    </div>
  );
});

ExpenseDetailsView.displayName = "ExpenseDetailsView";

ReportDetailsView.displayName = "ReportDetailsView";

// Helper Components for Modal Content
