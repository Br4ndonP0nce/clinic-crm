"use client";
import React, { useState, useEffect } from "react";
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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Plus,
  Filter,
  Eye,
  Edit,
  Receipt,
  CreditCard,
  Calculator,
  PieChart,
  BarChart3,
  RefreshCw,
  Search,
  Trash2,
  X,
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

// Types for modal states
type ModalState = {
  type: "report" | "expense" | "pdf" | "create_guide" | null;
  data?: BillingReport | Expense | null;
  mode?: "view" | "edit" | "create";
};

export default function BillingDashboard() {
  const router = useRouter();
  const {
    canViewBilling,
    canManageBilling,
    canViewTreatments,
    isDoctor,
    role,
    displayName,
  } = usePermissions();

  // Modal state management
  const [modalState, setModalState] = useState<ModalState>({ type: null });
  const [showReportForm, setShowReportForm] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);

  // State for date filtering
  const [dateRange, setDateRange] = useState({
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
    refreshExpenses,
  } = useExpenses();

  const {
    dashboard,
    revenueSummary,
    loading: dashboardLoading,
    error: dashboardError,
    loadDashboard,
    loadRevenueSummary,
    refreshDashboard,
  } = useBillingDashboard();

  // Load initial data
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
  }, [canViewBilling, dateRange]);
  const ReportCard = ({ report }: { report: BillingReport }) => {
    const [patient, setPatient] = useState<any>(null);
    const [doctor, setDoctor] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const loadReportDetails = async () => {
        try {
          setLoading(true);

          // Load patient and doctor data in parallel
          const [patientData, doctorData] = await Promise.all([
            getPatient(report.patientId),
            getUser(report.doctorId), // You'll need a getUser function or similar
          ]);

          setPatient(patientData);
          setDoctor(doctorData);
        } catch (error) {
          console.error("Error loading report details:", error);
        } finally {
          setLoading(false);
        }
      };

      loadReportDetails();
    }, [report.patientId, report.doctorId]);

    return (
      <Card key={report.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant={getStatusBadgeVariant(report.status)}>
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

              {/* 🆕 Enhanced info with names */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-3">
                <div>
                  <span className="text-gray-600">Paciente:</span>
                  <div className="font-semibold">
                    {loading ? (
                      <Skeleton className="h-4 w-24" />
                    ) : (
                      patient?.fullName || "Cargando..."
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Doctor:</span>
                  <div className="font-semibold">
                    {loading ? (
                      <Skeleton className="h-4 w-20" />
                    ) : (
                      doctor?.displayName || doctor?.name || "Dr. Usuario"
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

              {/* Financial summary row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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

              {report.services.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">Servicios: </span>
                  {report.services
                    .slice(0, 2)
                    .map((service) => service.description)
                    .join(", ")}
                  {report.services.length > 2 &&
                    ` y ${report.services.length - 2} más...`}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("View button clicked for report:", report.id);
                  handleViewReport(report);
                }}
                title="Ver detalles"
              >
                <Eye className="h-4 w-4" />
              </Button>
              {canManageBilling && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Edit button clicked for report:", report.id);
                    handleEditReport(report);
                  }}
                  title="Editar reporte"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {(report.status === "completed" || report.status === "paid") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("PDF button clicked for report:", report.id);
                    handleGeneratePDF(report);
                  }}
                  title="Generar PDF"
                >
                  <Receipt className="h-4 w-4" />
                </Button>
              )}
              {canManageBilling && report.status === "draft" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Delete button clicked for report:", report.id);
                    handleDeleteReport(report);
                  }}
                  className="text-red-600 hover:text-red-700"
                  title="Eliminar reporte"
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
  // Helper function to get billing status label
  const getBillingStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      draft: "Borrador",
      completed: "Completado",
      paid: "Pagado",
      partially_paid: "Parcialmente Pagado",
      overdue: "Vencido",
      cancelled: "Cancelado",
    };

    return labels[status] || status;
  };

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Format date for display
  const formatDate = (date: any) => {
    if (!date) return "N/A";
    const jsDate = date.toDate ? date.toDate() : new Date(date);
    return jsDate.toLocaleDateString("es-MX");
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: BillingReport["status"]) => {
    switch (status) {
      case "paid":
        return "default";
      case "completed":
        return "secondary";
      case "partially_paid":
        return "outline";
      case "overdue":
        return "destructive";
      case "draft":
        return "secondary";
      default:
        return "outline";
    }
  };

  // 🚀 NAVIGATION AND ACTION HANDLERS

  const handleViewReport = (report: BillingReport) => {
    console.log("Viewing report:", report.id);
    // Navigate to view page based on your route structure
    router.push(`/admin/billing/report/${report.id}`);
  };

  const handleEditReport = (report: BillingReport) => {
    console.log("Editing report:", report.id);

    // Check permissions
    if (!canManageBilling) {
      alert("No tienes permisos para editar reportes");
      return;
    }

    // Navigate to edit page based on your route structure
    router.push(`/admin/billing/report/${report.id}/edit`);
  };

  const handleGeneratePDF = async (report: BillingReport) => {
    console.log("Generating PDF for report:", report.id);
  };

  const handleNewReport = () => {
    console.log("Creating new report");

    if (!canManageBilling) {
      alert("No tienes permisos para crear reportes");
      return;
    }

    // Show a modal to guide users to the proper workflow
    setModalState({ type: "create_guide", data: null, mode: "create" });
  };

  const handleNewExpense = () => {
    console.log("Creating new expense");

    if (!canManageBilling) {
      alert("No tienes permisos para crear gastos");
      return;
    }

    // Navigate to create page based on your route structure
    router.push("/admin/billing/expense/new");
  };

  const handleViewExpense = (expense: Expense) => {
    console.log("Viewing expense:", expense.id);
  };

  const handleDeleteReport = async (report: BillingReport) => {
    console.log("Deleting report:", report.id);
  };

  const handleDeleteExpense = async (expense: Expense) => {
    console.log("Deleting expense:", expense.id);
  };

  // Close modal handler
  const closeModal = () => {
    setModalState({ type: null });
  };

  // Report form handlers
  const handleReportSaved = (reportId: string) => {
    setShowReportForm(false);
    setEditingReportId(null);
    refreshReports();
    console.log("Report saved:", reportId);
  };

  const handleReportFormCancel = () => {
    setShowReportForm(false);
    setEditingReportId(null);
  };

  // Export functions
  const handleExportReports = async () => {
    try {
      await exportBillingReportsToExcel(
        reports,
        {}, // Would need to fetch patient data
        {}, // Would need to fetch doctor data
        `reportes_facturacion_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch (error) {
      console.error("Error exporting reports:", error);
    }
  };

  const handleExportExpenses = async () => {
    try {
      await exportExpensesToExcel(
        expenses,
        {}, // Would need to fetch user data
        `gastos_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch (error) {
      console.error("Error exporting expenses:", error);
    }
  };

  const handleExportDashboard = async () => {
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
  };

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

  // Show report form if editing
  if (showReportForm) {
    return (
      <ReportForm
        reportId={editingReportId || undefined}
        onSave={handleReportSaved}
        onCancel={handleReportFormCancel}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Facturación y Finanzas
          </h1>
          <p className="text-gray-600">
            Gestión de reportes de facturación, gastos e ingresos
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
            <Button
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("New report button clicked");
                handleNewReport();
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Reporte
            </Button>
          )}
        </div>
      </div>

      {/* Quick Revenue Summary */}
      {revenueSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Hoy</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(revenueSummary.today)}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Esta Semana</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(revenueSummary.thisWeek)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Este Mes</p>
                  <p className="text-xl font-bold text-purple-600">
                    {formatCurrency(revenueSummary.thisMonth)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Este Año</p>
                  <p className="text-xl font-bold text-amber-600">
                    {formatCurrency(revenueSummary.thisYear)}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reports">Reportes de Facturación</TabsTrigger>
          <TabsTrigger value="expenses">Gastos</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
          <TabsTrigger value="exports">Exportar</TabsTrigger>
        </TabsList>

        {/* Billing Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Reportes de Facturación</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportReports}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          {reportsLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : reportsError ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-red-600">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Error al cargar los reportes: {reportsError}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reports.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay reportes
                    </h3>
                    <p className="text-gray-600 mb-4">
                      No se encontraron reportes de facturación para el período
                      seleccionado.
                    </p>
                    {canManageBilling && (
                      <Button onClick={handleNewReport}>
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Primer Reporte
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {reports.map((report) => (
                    <ReportCard key={report.id} report={report} />
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Gestión de Gastos</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExpenses}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              {canManageBilling && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("New expense button clicked");
                    handleNewExpense();
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Gasto
                </Button>
              )}
            </div>
          </div>

          {expensesLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : expensesError ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-red-600">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Error al cargar los gastos: {expensesError}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {expenses.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay gastos registrados
                    </h3>
                    <p className="text-gray-600 mb-4">
                      No se encontraron gastos para el período seleccionado.
                    </p>
                    {canManageBilling && (
                      <Button onClick={handleNewExpense}>
                        <Plus className="h-4 w-4 mr-2" />
                        Registrar Primer Gasto
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {expenses.map((expense) => (
                    <Card
                      key={expense.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge
                                variant={
                                  expense.status === "approved"
                                    ? "default"
                                    : expense.status === "pending"
                                    ? "secondary"
                                    : expense.status === "paid"
                                    ? "default"
                                    : "destructive"
                                }
                              >
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

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">
                                  Descripción:
                                </span>
                                <div className="font-semibold">
                                  {expense.description}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-600">
                                  Categoría:
                                </span>
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
                                <span className="text-gray-600">
                                  Proveedor:
                                </span>
                                <div className="font-semibold">
                                  {expense.vendor || "N/A"}
                                </div>
                              </div>
                            </div>

                            {expense.notes && (
                              <div className="mt-2 text-sm text-gray-600">
                                <span className="font-medium">Notas: </span>
                                {expense.notes}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log(
                                  "View expense button clicked:",
                                  expense.id
                                );
                                handleViewExpense(expense);
                              }}
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canManageBilling &&
                              expense.status === "pending" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log(
                                      "Approve expense button clicked:",
                                      expense.id
                                    );
                                    //handleApproveExpense(expense);
                                  }}
                                  title="Aprobar gasto"
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                            {canManageBilling && expense.status !== "paid" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log(
                                    "Delete expense button clicked:",
                                    expense.id
                                  );
                                  handleDeleteExpense(expense);
                                }}
                                className="text-red-600 hover:text-red-700"
                                title="Eliminar gasto"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <h3 className="text-lg font-semibold">Análisis Financiero</h3>

          {dashboard ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Methods Breakdown */}
              {dashboard.paymentMethodBreakdown.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <PieChart className="h-5 w-5 mr-2" />
                      Métodos de Pago
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboard.paymentMethodBreakdown.map((method, index) => (
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
                                  "#8b5cf6",
                                  "#06b6d4",
                                  "#84cc16",
                                  "#f97316",
                                ][index % 8],
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
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Service Categories Breakdown */}
              {dashboard.serviceCategoryBreakdown.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Categorías de Servicios
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboard.serviceCategoryBreakdown
                        .slice(0, 6)
                        .map((category, index) => (
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
                                    "#8b5cf6",
                                    "#06b6d4",
                                  ][index % 6],
                                }}
                              />
                              <span className="text-sm font-medium">
                                {category.category}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold">
                                {formatCurrency(category.revenue)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {category.count} servicios
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Monthly Trends */}
              {dashboard.monthlyTrends.length > 0 && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Tendencias Mensuales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboard.monthlyTrends.slice(-6).map((trend, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{trend.month}</div>
                            <div className="text-sm text-gray-600">
                              {trend.reportCount} reportes
                            </div>
                          </div>
                          <div className="flex-1 text-center">
                            <div className="text-sm text-gray-600">
                              Ingresos
                            </div>
                            <div className="font-semibold text-green-600">
                              {formatCurrency(trend.revenue)}
                            </div>
                          </div>
                          <div className="flex-1 text-center">
                            <div className="text-sm text-gray-600">Gastos</div>
                            <div className="font-semibold text-red-600">
                              {formatCurrency(trend.expenses)}
                            </div>
                          </div>
                          <div className="flex-1 text-right">
                            <div className="text-sm text-gray-600">Neto</div>
                            <div
                              className={`font-semibold ${
                                trend.netIncome >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {formatCurrency(trend.netIncome)}
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
            <Card>
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Sin datos para analizar
                </h3>
                <p className="text-gray-600">
                  No hay suficientes datos para generar análisis financieros.
                </p>
              </CardContent>
            </Card>
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
                  Reportes de Facturación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Exporta todos los reportes de facturación con detalles
                  completos.
                </p>
                <Button
                  onClick={handleExportReports}
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
                  Exporta todos los gastos registrados con categorías y estados.
                </p>
                <Button
                  onClick={handleExportExpenses}
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
                  Dashboard Completo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Exporta el dashboard financiero completo con análisis y
                  tendencias.
                </p>
                <Button
                  onClick={handleExportDashboard}
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

      {/* Modal for viewing reports/expenses and creation guidance */}
      <Dialog open={modalState.type !== null} onOpenChange={closeModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {modalState.type === "report"
                ? "Detalles del Reporte"
                : modalState.type === "expense"
                ? "Detalles del Gasto"
                : modalState.type === "create_guide"
                ? "Crear Nuevo Reporte de Facturación"
                : "Información"}
            </DialogTitle>
            <DialogDescription>
              {modalState.mode === "view"
                ? "Información detallada"
                : modalState.mode === "edit"
                ? "Editar información"
                : modalState.type === "create_guide"
                ? "Selecciona cómo quieres crear el reporte"
                : "Información"}
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
                  Los reportes de facturación deben estar vinculados a citas
                  completadas para mantener un registro adecuado y facilitar el
                  seguimiento de pagos.
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
                          Crea un reporte basado en una cita completada. Esto
                          vincula automáticamente el paciente, doctor y
                          servicios.
                        </p>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            closeModal();
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
                          Crea un reporte sin vincular a una cita específica.
                          Tendrás que seleccionar manualmente el paciente y
                          servicios.
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-amber-600 text-amber-700 hover:bg-amber-100"
                          onClick={() => {
                            closeModal();
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
                  ¿Cómo crear un reporte desde una cita?
                </h4>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                  <li>Ve al calendario y busca la cita completada</li>
                  <li>Haz clic en la cita para ver los detalles</li>
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
                  <label className="text-sm font-medium">ID del Reporte:</label>
                  <p className="text-sm text-gray-600">{modalState.data.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Estado:</label>
                  <Badge
                    variant={getStatusBadgeVariant(
                      (modalState.data as BillingReport).status
                    )}
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

              {(modalState.data as BillingReport).services.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Serviciosss:</label>
                  <div className="mt-2 space-y-2">
                    {(modalState.data as BillingReport).services.map(
                      (service, index) => (
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
                  <label className="text-sm font-medium">ID del Gasto:</label>
                  <p className="text-sm text-gray-600">{modalState.data.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Estado:</label>
                  <Badge>
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
                <div>
                  <label className="text-sm font-medium">Categoría:</label>
                  <p className="text-sm text-gray-600">
                    {getExpenseCategoryLabel(
                      (modalState.data as Expense).category
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Fecha:</label>
                  <p className="text-sm text-gray-600">
                    {formatDate((modalState.data as Expense).date)}
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
            <Button variant="outline" onClick={closeModal}>
              {modalState.type === "create_guide" ? "Cancelar" : "Cerrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
