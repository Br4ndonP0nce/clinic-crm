"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
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

export default function BillingDashboard() {
  const {
    canViewBilling,
    canManageBilling,
    canViewTreatments,
    isDoctor,
    role,
    displayName,
  } = usePermissions();

  // State for date filtering
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of current month
    end: new Date(), // Today
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
            <Button size="sm">
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
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Primer Reporte
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {reports.map((report) => (
                    <Card
                      key={report.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge
                                variant={getStatusBadgeVariant(report.status)}
                              >
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

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Total:</span>
                                <span className="font-semibold ml-1">
                                  {formatCurrency(report.total)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Pagado:</span>
                                <span className="font-semibold ml-1 text-green-600">
                                  {formatCurrency(report.paidAmount)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">
                                  Pendiente:
                                </span>
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
                                <span className="text-gray-600">
                                  Servicios:
                                </span>
                                <span className="font-semibold ml-1">
                                  {report.services.length}
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
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canManageBilling && (
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {report.status === "completed" ||
                            report.status === "paid" ? (
                              <Button variant="outline" size="sm">
                                <Receipt className="h-4 w-4" />
                              </Button>
                            ) : null}
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
                <Button size="sm">
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
                      <Button>
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
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canManageBilling &&
                              expense.status === "pending" && (
                                <Button variant="outline" size="sm">
                                  <CheckCircle className="h-4 w-4" />
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
    </div>
  );
}
