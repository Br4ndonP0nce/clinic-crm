// Optimized Billing Dashboard
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Download,
  Plus,
  Eye,
  Edit,
  Receipt,
  CreditCard,
  PieChart,
  BarChart3,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import { getPatient, getUser } from "@/lib/firebase/db";
import {
  useBillingReports,
  useBillingDashboard,
  useExpenses,
} from "@/hooks/useBilling";
import {
  BillingReport,
  Expense,
  getBillingStatusLabel,
  getExpenseCategoryLabel,
} from "@/types/billing";
import { getPaymentMethodLabel } from "@/types/sales";
import {
  exportBillingReportsToExcel,
  exportExpensesToExcel,
  exportFinancialDashboardToExcel,
} from "@/lib/utils/billingExcelExport";
import ReportForm from "@/components/billing/ReportForm";

// Types
type ModalState = {
  type: "report" | "expense" | "create_guide" | null;
  data?: BillingReport | Expense | null;
  mode?: "view" | "edit" | "create";
};

// Utility functions
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(amount || 0);

const formatDate = (date: any) => {
  if (!date) return "N/A";
  const jsDate = date.toDate ? date.toDate() : new Date(date);
  return jsDate.toLocaleDateString("es-MX");
};

const getStatusBadgeVariant = (status: string) => {
  const variants: Record<string, string> = {
    paid: "default",
    completed: "secondary",
    partially_paid: "outline",
    overdue: "destructive",
    draft: "secondary",
    approved: "default",
    pending: "secondary",
    rejected: "destructive",
  };
  return variants[status] || "outline";
};

// Optimized Report Card Component
const ReportCard: React.FC<{
  report: BillingReport;
  onView: (report: BillingReport) => void;
  onEdit: (report: BillingReport) => void;
  onPDF: (report: BillingReport) => void;
  onDelete: (report: BillingReport) => void;
  canManage: boolean;
}> = ({ report, onView, onEdit, onPDF, onDelete, canManage }) => {
  const [patient, setPatient] = useState<any>(null);
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const [patientData, doctorData] = await Promise.all([
          getPatient(report.patientId),
          getUser(report.doctorId),
        ]);
        setPatient(patientData);
        setDoctor(doctorData);
      } catch (error) {
        console.error("Error loading report details:", error);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [report.patientId, report.doctorId]);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-center gap-3">
              <Badge variant={getStatusBadgeVariant(report.status) as any}>
                {getBillingStatusLabel(report.status)}
              </Badge>
              {report.invoiceNumber && (
                <span className="text-sm font-mono text-gray-600">
                  {report.invoiceNumber}
                </span>
              )}
              <span className="text-sm text-gray-500">
                {formatDate(report.createdAt)}
              </span>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Paciente:</span>
                <div className="font-semibold">
                  {loading ? (
                    <Skeleton className="h-4 w-20" />
                  ) : (
                    patient?.fullName || "Cargando..."
                  )}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Doctor:</span>
                <div className="font-semibold">
                  {loading ? (
                    <Skeleton className="h-4 w-16" />
                  ) : (
                    doctor?.displayName || "Dr. Usuario"
                  )}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Total:</span>
                <span className="font-semibold ml-1">
                  {formatCurrency(report.total)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Servicios:</span>
                <span className="font-semibold ml-1">
                  {report.services.length}
                </span>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Pagado:</span>
                <span className="font-semibold ml-1 text-green-600">
                  {formatCurrency(report.paidAmount)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Pendiente:</span>
                <span
                  className={`font-semibold ml-1 ${
                    report.pendingAmount > 0
                      ? "text-amber-600"
                      : "text-green-600"
                  }`}
                >
                  {formatCurrency(report.pendingAmount)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Estado:</span>
                <span className="font-semibold ml-1">
                  {getBillingStatusLabel(report.status)}
                </span>
              </div>
            </div>

            {/* Services Preview */}
            {report.services.length > 0 && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Servicios: </span>
                {report.services
                  .slice(0, 2)
                  .map((s) => s.description)
                  .join(", ")}
                {report.services.length > 2 &&
                  ` y ${report.services.length - 2} más...`}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(report)}
              title="Ver"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {canManage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(report)}
                title="Editar"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {["completed", "paid"].includes(report.status) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPDF(report)}
                title="PDF"
              >
                <Receipt className="h-4 w-4" />
              </Button>
            )}
            {canManage && report.status === "draft" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(report)}
                className="text-red-600 hover:text-red-700"
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Optimized Expense Card Component
const ExpenseCard: React.FC<{
  expense: Expense;
  onView: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  canManage: boolean;
}> = ({ expense, onView, onDelete, canManage }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Badge variant={getStatusBadgeVariant(expense.status) as any}>
              {expense.status === "pending"
                ? "Pendiente"
                : expense.status === "approved"
                ? "Aprobado"
                : expense.status === "paid"
                ? "Pagado"
                : "Rechazado"}
            </Badge>
            <span className="text-sm text-gray-500">
              {formatDate(expense.date)}
            </span>
            {expense.deductible && (
              <Badge variant="outline" className="text-xs">
                Deducible
              </Badge>
            )}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Descripción:</span>
              <div className="font-semibold">{expense.description}</div>
            </div>
            <div>
              <span className="text-gray-600">Categoría:</span>
              <div className="font-semibold">
                {getExpenseCategoryLabel(expense.category)}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Monto:</span>
              <span className="font-semibold ml-1 text-red-600">
                {formatCurrency(expense.amount)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Proveedor:</span>
              <div className="font-semibold">{expense.vendor || "N/A"}</div>
            </div>
          </div>

          {/* Notes */}
          {expense.notes && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Notas: </span>
              {expense.notes}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(expense)}
            title="Ver"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {canManage && expense.status === "pending" && (
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 hover:text-green-700"
              title="Aprobar"
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
          {canManage && expense.status !== "paid" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(expense)}
              className="text-red-600 hover:text-red-700"
              title="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

// Empty State Component
const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}> = ({ icon, title, description, action }) => (
  <Card>
    <CardContent className="p-6 text-center">
      {icon}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      {action && (
        <Button onClick={action.onClick}>
          <Plus className="h-4 w-4 mr-2" />
          {action.label}
        </Button>
      )}
    </CardContent>
  </Card>
);

// Revenue Summary Component
const RevenueSummary: React.FC<{ revenueSummary: any }> = ({
  revenueSummary,
}) => {
  const cards = [
    {
      title: "Hoy",
      value: revenueSummary.today,
      icon: Calendar,
      color: "green",
    },
    {
      title: "Esta Semana",
      value: revenueSummary.thisWeek,
      icon: TrendingUp,
      color: "blue",
    },
    {
      title: "Este Mes",
      value: revenueSummary.thisMonth,
      icon: DollarSign,
      color: "purple",
    },
    {
      title: "Este Año",
      value: revenueSummary.thisYear,
      icon: BarChart3,
      color: "amber",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{card.title}</p>
                <p className={`text-xl font-bold text-${card.color}-600`}>
                  {formatCurrency(card.value)}
                </p>
              </div>
              <card.icon className={`h-8 w-8 text-${card.color}-500`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Main Dashboard Component
export default function BillingDashboard() {
  const router = useRouter();
  const { canViewBilling, canManageBilling } = usePermissions();

  // State management
  const [modalState, setModalState] = useState<ModalState>({ type: null });
  const [showReportForm, setShowReportForm] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [dateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date(),
  });

  // Hooks
  const {
    reports,
    loading: reportsLoading,
    error: reportsError,
    loadReports,
    refreshReports,
  } = useBillingReports();
  const {
    expenses,
    loading: expensesLoading,
    error: expensesError,
    loadExpenses,
  } = useExpenses();
  const {
    dashboard,
    revenueSummary,
    loading: dashboardLoading,
    loadDashboard,
    loadRevenueSummary,
    refreshDashboard,
  } = useBillingDashboard();

  // Load data
  useEffect(() => {
    if (canViewBilling) {
      loadReports({
        startDate: dateRange.start,
        endDate: dateRange.end,
        limit: 50,
      });
      loadExpenses({
        startDate: dateRange.start,
        endDate: dateRange.end,
        limit: 50,
      });
      loadDashboard(dateRange.start, dateRange.end);
      loadRevenueSummary();
    }
  }, [
    canViewBilling,
    dateRange,
    loadReports,
    loadExpenses,
    loadDashboard,
    loadRevenueSummary,
  ]);

  // Event handlers
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
    setModalState({ type: "create_guide", data: null, mode: "create" });
  }, [canManageBilling]);

  const handleNewExpense = useCallback(() => {
    if (!canManageBilling) {
      alert("No tienes permisos para crear gastos");
      return;
    }
    router.push("/admin/billing/expense/new");
  }, [canManageBilling, router]);

  const handlePDF = useCallback(async (report: BillingReport) => {
    console.log("Generating PDF for report:", report.id);
  }, []);

  const handleDeleteReport = useCallback(async (report: BillingReport) => {
    console.log("Deleting report:", report.id);
  }, []);

  const handleDeleteExpense = useCallback(async (expense: Expense) => {
    console.log("Deleting expense:", expense.id);
  }, []);

  const handleViewExpense = useCallback((expense: Expense) => {
    setModalState({ type: "expense", data: expense, mode: "view" });
  }, []);

  // Export handlers
  const exportHandlers = {
    reports: useCallback(async () => {
      try {
        await exportBillingReportsToExcel(
          reports,
          {},
          {},
          `reportes_facturacion_${new Date().toISOString().slice(0, 10)}.xlsx`
        );
      } catch (error) {
        console.error("Error exporting reports:", error);
      }
    }, [reports]),

    expenses: useCallback(async () => {
      try {
        await exportExpensesToExcel(
          expenses,
          {},
          `gastos_${new Date().toISOString().slice(0, 10)}.xlsx`
        );
      } catch (error) {
        console.error("Error exporting expenses:", error);
      }
    }, [expenses]),

    dashboard: useCallback(async () => {
      if (!dashboard) return;
      try {
        await exportFinancialDashboardToExcel(
          dashboard,
          reports,
          expenses,
          `dashboard_financiero_${new Date().toISOString().slice(0, 10)}.xlsx`
        );
      } catch (error) {
        console.error("Error exporting dashboard:", error);
      }
    }, [dashboard, reports, expenses]),
  };

  // Access control
  if (!canViewBilling) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Acceso Restringido
              </h3>
              <p className="text-gray-600">
                No tienes permisos para acceder al módulo de facturación.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Report form mode
  if (showReportForm) {
    return (
      <ReportForm
        reportId={editingReportId || undefined}
        onSave={(reportId) => {
          setShowReportForm(false);
          setEditingReportId(null);
          refreshReports();
        }}
        onCancel={() => {
          setShowReportForm(false);
          setEditingReportId(null);
        }}
      />
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Facturación</h1>
          <p className="text-sm text-gray-600">
            Gestión de reportes, gastos e ingresos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshDashboard}
            disabled={dashboardLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${
                dashboardLoading ? "animate-spin" : ""
              }`}
            />
            Actualizar
          </Button>
          {canManageBilling && (
            <Button size="sm" onClick={handleNewReport}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Reporte
            </Button>
          )}
        </div>
      </div>

      {/* Revenue Summary */}
      {revenueSummary && <RevenueSummary revenueSummary={revenueSummary} />}

      {/* Main Tabs */}
      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reports">Reportes</TabsTrigger>
          <TabsTrigger value="expenses">Gastos</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
          <TabsTrigger value="exports">Exportar</TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Reportes de Facturación</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={exportHandlers.reports}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>

          {reportsLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
            </div>
          ) : reportsError ? (
            <Card>
              <CardContent className="p-6 text-center text-red-600">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Error al cargar reportes: {reportsError}</p>
              </CardContent>
            </Card>
          ) : reports.length === 0 ? (
            <EmptyState
              icon={
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              }
              title="No hay reportes"
              description="No se encontraron reportes de facturación."
              action={
                canManageBilling
                  ? { label: "Crear Primer Reporte", onClick: handleNewReport }
                  : undefined
              }
            />
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onView={handleViewReport}
                  onEdit={handleEditReport}
                  onPDF={handlePDF}
                  onDelete={handleDeleteReport}
                  canManage={canManageBilling}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Gestión de Gastos</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportHandlers.expenses}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              {canManageBilling && (
                <Button size="sm" onClick={handleNewExpense}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Gasto
                </Button>
              )}
            </div>
          </div>

          {expensesLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
            </div>
          ) : expensesError ? (
            <Card>
              <CardContent className="p-6 text-center text-red-600">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Error al cargar gastos: {expensesError}</p>
              </CardContent>
            </Card>
          ) : expenses.length === 0 ? (
            <EmptyState
              icon={
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              }
              title="No hay gastos registrados"
              description="No se encontraron gastos para el período seleccionado."
              action={
                canManageBilling
                  ? {
                      label: "Registrar Primer Gasto",
                      onClick: handleNewExpense,
                    }
                  : undefined
              }
            />
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  onView={handleViewExpense}
                  onDelete={handleDeleteExpense}
                  canManage={canManageBilling}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <h3 className="text-lg font-semibold">Análisis Financiero</h3>
          {dashboard ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Methods */}
              {dashboard.paymentMethodBreakdown?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <PieChart className="h-5 w-5 mr-2" />
                      Métodos de Pago
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboard.paymentMethodBreakdown.map(
                        (method: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center">
                              <div
                                className="w-4 h-4 rounded-full mr-3"
                                style={{
                                  backgroundColor: [
                                    "#3b82f6",
                                    "#ef4444",
                                    "#10b981",
                                    "#f59e0b",
                                  ][index % 4],
                                }}
                              />
                              <span className="text-sm font-medium">
                                {getPaymentMethodLabel(method.method)}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold">
                                {formatCurrency(method.amount)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {method.percentage.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Monthly Trends */}
              {dashboard.monthlyTrends?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Tendencias Mensuales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboard.monthlyTrends
                        .slice(-3)
                        .map((trend: any, index: number) => (
                          <div
                            key={index}
                            className="flex justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <div className="font-medium">{trend.month}</div>
                              <div className="text-sm text-gray-600">
                                {trend.reportCount} reportes
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-green-600">
                                {formatCurrency(trend.revenue)}
                              </div>
                              <div className="text-sm text-red-600">
                                {formatCurrency(trend.expenses)}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <EmptyState
              icon={
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              }
              title="Sin datos para analizar"
              description="No hay suficientes datos para generar análisis financieros."
            />
          )}
        </TabsContent>

        {/* Exports Tab */}
        <TabsContent value="exports" className="space-y-4">
          <h3 className="text-lg font-semibold">Exportar Datos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Reportes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Exporta reportes de facturación completos.
                </p>
                <Button
                  onClick={exportHandlers.reports}
                  disabled={reports.length === 0}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Reportes
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Gastos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Exporta gastos con categorías y estados.
                </p>
                <Button
                  onClick={exportHandlers.expenses}
                  disabled={expenses.length === 0}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Gastos
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Exporta dashboard financiero completo.
                </p>
                <Button
                  onClick={exportHandlers.dashboard}
                  disabled={!dashboard}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal */}
      <Dialog
        open={modalState.type !== null}
        onOpenChange={() => setModalState({ type: null })}
      >
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
            <DialogDescription>
              {modalState.type === "create_guide"
                ? "Selecciona cómo crear el reporte"
                : "Información detallada"}
            </DialogDescription>
          </DialogHeader>

          {modalState.type === "create_guide" && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-800">Recomendación</h3>
                </div>
                <p className="text-blue-700 text-sm">
                  Los reportes deben estar vinculados a citas completadas para
                  mantener un registro adecuado.
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
                          Crea un reporte basado en una cita completada. Vincula
                          automáticamente paciente, doctor y servicios.
                        </p>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            setModalState({ type: null });
                            router.push("/admin/calendar");
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
                          Crea un reporte sin vincular a una cita. Selecciona
                          manualmente paciente y servicios.
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-amber-600 text-amber-700 hover:bg-amber-100"
                          onClick={() => {
                            setModalState({ type: null });
                            router.push("/admin/billing/report/new");
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
                  ¿Cómo crear desde una cita?
                </h4>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                  <li>Ve al calendario y busca la cita completada</li>
                  <li>Haz clic en la cita para ver detalles</li>
                  <li>Ve a la pestaña "Facturación"</li>
                  <li>Haz clic en "Crear Reporte de Facturación"</li>
                </ol>
              </div>
            </div>
          )}

          {modalState.type === "report" && modalState.data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">ID:</label>
                  <p className="text-sm text-gray-600">{modalState.data.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Estado:</label>
                  <Badge
                    variant={
                      getStatusBadgeVariant(
                        (modalState.data as BillingReport).status
                      ) as any
                    }
                  >
                    {getBillingStatusLabel(
                      (modalState.data as BillingReport).status
                    )}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Total:</label>
                  <p className="text-sm font-semibold">
                    {formatCurrency((modalState.data as BillingReport).total)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Fecha:</label>
                  <p className="text-sm text-gray-600">
                    {formatDate((modalState.data as BillingReport).createdAt)}
                  </p>
                </div>
              </div>

              {(modalState.data as BillingReport).services?.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Servicios:</label>
                  <div className="mt-2 space-y-2">
                    {(modalState.data as BillingReport).services.map(
                      (service: any, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                {service.description}
                              </p>
                              <p className="text-sm text-gray-600">
                                {service.quantity} ×{" "}
                                {formatCurrency(service.unitPrice)}
                              </p>
                            </div>
                            <p className="font-semibold">
                              {formatCurrency(service.total)}
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {modalState.type === "expense" && modalState.data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">ID:</label>
                  <p className="text-sm text-gray-600">{modalState.data.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Estado:</label>
                  <Badge
                    variant={
                      getStatusBadgeVariant(
                        (modalState.data as Expense).status
                      ) as any
                    }
                  >
                    {(modalState.data as Expense).status === "pending"
                      ? "Pendiente"
                      : (modalState.data as Expense).status === "approved"
                      ? "Aprobado"
                      : (modalState.data as Expense).status === "paid"
                      ? "Pagado"
                      : "Rechazado"}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Descripción:</label>
                  <p className="text-sm text-gray-600">
                    {(modalState.data as Expense).description}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Monto:</label>
                  <p className="text-sm font-semibold text-red-600">
                    {formatCurrency((modalState.data as Expense).amount)}
                  </p>
                </div>
              </div>

              {(modalState.data as Expense).notes && (
                <div>
                  <label className="text-sm font-medium">Notas:</label>
                  <p className="text-sm text-gray-600 mt-1">
                    {(modalState.data as Expense).notes}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalState({ type: null })}
            >
              {modalState.type === "create_guide" ? "Cancelar" : "Cerrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
