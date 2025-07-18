// Enhanced Billing Dashboard with Integrated Add Expense Modal
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Filter,
  ChevronDown,
  CalendarIcon,
  Settings,
  MoreHorizontal,
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
import AddExpenseModal from "@/components/billing/AddExpenseModal";

// Types for filters
interface DateFilter {
  start: Date;
  end: Date;
  label: string;
  key: string;
}

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

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
// Generate month options for the last 12 months and next 3 months
const generateMonthOptions = (): DateFilter[] => {
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

// Quick Actions Menu Component
const QuickActionsMenu: React.FC<{
  currentFilter: DateFilter;
  reports: BillingReport[];
  expenses: Expense[];
  dashboard: any;
  onExport: (
    type: "reports" | "expenses" | "dashboard",
    dateFilter: DateFilter
  ) => void;
  onFilterChange: (filter: DateFilter) => void;
  onNewExpense: () => void;
  canManage: boolean;
}> = ({
  currentFilter,
  reports,
  expenses,
  dashboard,
  onExport,
  onFilterChange,
  onNewExpense,
  canManage,
}) => {
  const monthOptions = generateMonthOptions();

  const quickActions: QuickAction[] = [
    {
      label: "Nuevo Gasto",
      icon: <Plus className="h-4 w-4" />,
      onClick: onNewExpense,
      disabled: !canManage,
    },
    {
      label: "Exportar Reportes",
      icon: <FileText className="h-4 w-4" />,
      onClick: () => onExport("reports", currentFilter),
      disabled: reports.length === 0,
    },
    {
      label: "Exportar Gastos",
      icon: <CreditCard className="h-4 w-4" />,
      onClick: () => onExport("expenses", currentFilter),
      disabled: expenses.length === 0,
    },
    {
      label: "Exportar Dashboard",
      icon: <BarChart3 className="h-4 w-4" />,
      onClick: () => onExport("dashboard", currentFilter),
      disabled: !dashboard,
    },
  ];

  return (
    <div className="flex items-center gap-2">
      {/* Month Filter Selector */}
      <Select
        value={currentFilter.key}
        onValueChange={(value) => {
          const selectedFilter = monthOptions.find(
            (option) => option.key === value
          );
          if (selectedFilter) {
            onFilterChange(selectedFilter);
          }
        }}
      >
        <SelectTrigger className="w-48">
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

      {/* Quick Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Acciones Rápidas
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Gestión Rápida</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Quick New Expense Button */}
          {canManage && (
            <>
              <DropdownMenuItem
                onClick={onNewExpense}
                className="flex items-center gap-2 text-green-600"
              >
                <Plus className="h-4 w-4" />
                Nuevo Gasto
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Export Options */}
          <DropdownMenuLabel>Exportar Datos del Período</DropdownMenuLabel>
          {quickActions.slice(1).map((action, index) => (
            <DropdownMenuItem
              key={index}
              onClick={action.onClick}
              disabled={action.disabled}
              className="flex items-center gap-2"
            >
              {action.icon}
              {action.label}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          {/* Export All Data Submenu */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar Todo
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {monthOptions.slice(0, 6).map((option) => (
                <DropdownMenuItem
                  key={option.key}
                  onClick={() => onExport("dashboard", option)}
                  className="text-sm"
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// Period Summary Component
const PeriodSummary: React.FC<{
  filter: DateFilter;
  reports: BillingReport[];
  expenses: Expense[];
}> = ({ filter, reports, expenses }) => {
  const summaryData = useMemo(() => {
    const totalReports = reports.length;
    const totalRevenue = reports.reduce((sum, r) => sum + r.total, 0);
    const paidRevenue = reports.reduce((sum, r) => sum + r.paidAmount, 0);
    const pendingRevenue = reports.reduce((sum, r) => sum + r.pendingAmount, 0);

    const totalExpenses = expenses
      .filter((e) => e.status === "approved" || e.status === "paid")
      .reduce((sum, e) => sum + e.amount, 0);

    const netIncome = paidRevenue - totalExpenses;

    return {
      totalReports,
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      totalExpenses,
      netIncome,
    };
  }, [reports, expenses]);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Resumen del Período: {filter.label}
          </span>
          <Badge variant="outline" className="text-xs">
            {filter.start.toLocaleDateString("es-MX", {
              day: "2-digit",
              month: "2-digit",
            })}{" "}
            -{" "}
            {filter.end.toLocaleDateString("es-MX", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 text-sm">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="font-semibold text-blue-800">Reportes</div>
            <div className="text-2xl font-bold text-blue-600">
              {summaryData.totalReports}
            </div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="font-semibold text-green-800">Ingresos Totales</div>
            <div className="text-lg font-bold text-green-600">
              {formatCurrency(summaryData.totalRevenue)}
            </div>
          </div>
          <div className="text-center p-3 bg-emerald-50 rounded-lg">
            <div className="font-semibold text-emerald-800">
              Ingresos Pagados
            </div>
            <div className="text-lg font-bold text-emerald-600">
              {formatCurrency(summaryData.paidRevenue)}
            </div>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-lg">
            <div className="font-semibold text-amber-800">Pendientes</div>
            <div className="text-lg font-bold text-amber-600">
              {formatCurrency(summaryData.pendingRevenue)}
            </div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="font-semibold text-red-800">Gastos</div>
            <div className="text-lg font-bold text-red-600">
              {formatCurrency(summaryData.totalExpenses)}
            </div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="font-semibold text-purple-800">Ingresos Netos</div>
            <div
              className={`text-lg font-bold ${
                summaryData.netIncome >= 0 ? "text-purple-600" : "text-red-600"
              }`}
            >
              {formatCurrency(summaryData.netIncome)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Enhanced Expense Card Component with better design
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

// Main Dashboard Component
export default function BillingDashboard() {
  const router = useRouter();
  const { canViewBilling, canManageBilling } = usePermissions();

  // Enhanced state management
  const [modalState, setModalState] = useState<{
    type: "report" | "expense" | "create_guide" | null;
    data?: BillingReport | Expense | null;
    mode?: "view" | "edit" | "create";
  }>({ type: null });
  const [showReportForm, setShowReportForm] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);

  // Add Expense Modal State
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);

  // Enhanced date filtering
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
    addExpense,
    refreshExpenses,
  } = useExpenses();
  const {
    dashboard,
    revenueSummary,
    loading: dashboardLoading,
    loadDashboard,
    loadRevenueSummary,
    refreshDashboard,
  } = useBillingDashboard();

  // Load data when date filter changes
  useEffect(() => {
    if (canViewBilling) {
      loadReports({
        startDate: dateFilter.start,
        endDate: dateFilter.end,
        limit: 100,
      });
      loadExpenses({
        startDate: dateFilter.start,
        endDate: dateFilter.end,
        limit: 100,
      });
      loadDashboard(dateFilter.start, dateFilter.end);
      loadRevenueSummary();
    }
  }, [
    canViewBilling,
    dateFilter,
    loadReports,
    loadExpenses,
    loadDashboard,
    loadRevenueSummary,
  ]);

  // Enhanced export handlers
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

  // Enhanced expense handling
  const handleAddExpense = useCallback(
    async (expenseData: any) => {
      try {
        await addExpense(expenseData);
        // Modal will close automatically
        refreshExpenses();
      } catch (error) {
        console.error("Error adding expense:", error);
        throw error; // Re-throw to let modal handle the error
      }
    },
    [addExpense, refreshExpenses]
  );

  const handleNewExpense = useCallback(() => {
    if (!canManageBilling) {
      alert("No tienes permisos para crear gastos");
      return;
    }
    setShowAddExpenseModal(true);
  }, [canManageBilling]);

  // Event handlers (existing ones)
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

  const handleRefreshAll = useCallback(() => {
    loadReports({
      startDate: dateFilter.start,
      endDate: dateFilter.end,
      limit: 100,
    });
    loadExpenses({
      startDate: dateFilter.start,
      endDate: dateFilter.end,
      limit: 100,
    });
    loadDashboard(dateFilter.start, dateFilter.end);
    loadRevenueSummary();
  }, [
    dateFilter,
    loadReports,
    loadExpenses,
    loadDashboard,
    loadRevenueSummary,
  ]);

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
      <div>
        <div className="p-6">
          <Button onClick={() => setShowReportForm(false)}>
            Volver al Dashboard
          </Button>
        </div>
      </div>
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
            onClick={handleRefreshAll}
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

      {/* Enhanced Period Summary and Quick Actions */}
      <div className="space-y-4">
        {/* Quick Actions Menu */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Filtros y Acciones
            </span>
          </div>

          <QuickActionsMenu
            currentFilter={dateFilter}
            reports={reports}
            expenses={expenses}
            dashboard={dashboard}
            onExport={handleExport}
            onFilterChange={setDateFilter}
            onNewExpense={handleNewExpense}
            canManage={canManageBilling}
          />
        </div>

        {/* Period Summary */}
        <PeriodSummary
          filter={dateFilter}
          reports={reports}
          expenses={expenses}
        />
      </div>

      {/* Revenue Summary (Global) */}
      {revenueSummary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
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
          ].map((card, index) => (
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
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reports">Reportes ({reports.length})</TabsTrigger>
          <TabsTrigger value="expenses">Gastos ({expenses.length})</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
          <TabsTrigger value="exports">Exportar</TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Reportes de Facturación - {dateFilter.label}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("reports", dateFilter)}
              disabled={reports.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Reportes
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
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay reportes para {dateFilter.label}
                </h3>
                <p className="text-gray-600 mb-4">
                  No se encontraron reportes de facturación en el período
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

              {reports.length > 5 && (
                <Card className="bg-gray-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-gray-600">
                      Mostrando {reports.length} reportes para{" "}
                      {dateFilter.label}
                    </div>
                    <div className="text-lg font-semibold text-gray-800">
                      Total del período:{" "}
                      {formatCurrency(
                        reports.reduce((sum, r) => sum + r.total, 0)
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Enhanced Expenses Tab with Modal Integration */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Gestión de Gastos - {dateFilter.label}
            </h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("expenses", dateFilter)}
                disabled={expenses.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Gastos
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
            <Card>
              <CardContent className="p-6 text-center">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay gastos para {dateFilter.label}
                </h3>
                <p className="text-gray-600 mb-4">
                  No se encontraron gastos registrados en el período
                  seleccionado.
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

              {expenses.length > 5 && (
                <Card className="bg-red-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-gray-600">
                      Mostrando {expenses.length} gastos para {dateFilter.label}
                    </div>
                    <div className="text-lg font-semibold text-red-600">
                      Total de gastos:{" "}
                      {formatCurrency(
                        expenses.reduce((sum, e) => sum + e.amount, 0)
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Análisis Financiero - {dateFilter.label}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("dashboard", dateFilter)}
              disabled={!dashboard}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Análisis
            </Button>
          </div>

          {dashboard ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="h-5 w-5 mr-2" />
                    Métodos de Pago
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-gray-500 py-8">
                    Gráficos de análisis financiero
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Tendencias Mensuales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-gray-500 py-8">
                    Tendencias y métricas
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Sin datos para analizar
                </h3>
                <p className="text-gray-600">
                  No hay suficientes datos para generar análisis financieros
                  para {dateFilter.label}.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Enhanced Exports Tab */}
        <TabsContent value="exports" className="space-y-4">
          <h3 className="text-lg font-semibold">Exportar Datos</h3>

          <div className="mb-6">
            <h4 className="text-md font-medium mb-4">
              Exportar para {dateFilter.label}
            </h4>
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
                    Exporta {reports.length} reportes de facturación.
                  </p>
                  <Button
                    onClick={() => handleExport("reports", dateFilter)}
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
                    Exporta {expenses.length} gastos con categorías.
                  </p>
                  <Button
                    onClick={() => handleExport("expenses", dateFilter)}
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
                    Exporta dashboard financiero completo.
                  </p>
                  <Button
                    onClick={() => handleExport("dashboard", dateFilter)}
                    disabled={!dashboard}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Dashboard
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium mb-4">
              Exportación Rápida - Otros Períodos
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {generateMonthOptions()
                .slice(0, 8)
                .map((option) => (
                  <Button
                    key={option.key}
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport("dashboard", option)}
                    className="text-left justify-start"
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {option.label}
                  </Button>
                ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Reusable Add Expense Modal */}
      <AddExpenseModal
        open={showAddExpenseModal}
        onOpenChange={setShowAddExpenseModal}
        onSubmit={handleAddExpense}
        isLoading={expensesLoading}
        triggerRefresh={refreshExpenses}
        defaultDate={dateFilter.start.toISOString().split("T")[0]}
      />

      {/* Other Modal Dialogs */}
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
          </DialogHeader>

          <div className="text-center text-gray-500 py-8">
            {modalState.type === "create_guide" && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-800">
                      Recomendación
                    </h3>
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
                            Crea un reporte basado en una cita completada.
                            Vincula automáticamente paciente, doctor y
                            servicios.
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
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalState({ type: null })}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
