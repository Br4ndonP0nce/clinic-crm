// src/app/admin/billing/expenses/page.tsx - Updated to use reusable modal
"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Receipt,
  Calendar,
  DollarSign,
  RefreshCw,
  Upload,
  FileText,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useExpenses } from "@/hooks/useBilling";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Expense,
  getExpenseCategoryLabel,
  ExpenseCategory,
} from "@/types/billing";
import AddExpenseModal from "@/components/billing/AddExpenseModal";

// Skeleton Components
const ExpenseCardSkeleton = () => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const ExpensesListSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <ExpenseCardSkeleton key={i} />
    ))}
  </div>
);

// Expense Card Component
const ExpenseCard = ({
  expense,
  onView,
  onApprove,
  onReject,
  canManage,
}: {
  expense: Expense;
  onView: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  canManage: boolean;
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    const jsDate = date.toDate ? date.toDate() : new Date(date);
    return jsDate.toLocaleDateString("es-MX");
  };

  const getStatusBadgeVariant = (status: Expense["status"]) => {
    switch (status) {
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "paid":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: Expense["status"]) => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "approved":
        return "Aprobado";
      case "paid":
        return "Pagado";
      case "rejected":
        return "Rechazado";
      default:
        return status;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant={getStatusBadgeVariant(expense.status)}>
                  {getStatusLabel(expense.status)}
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
                onClick={() => onView(expense.id!)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {canManage && expense.status === "pending" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onApprove(expense.id!)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReject(expense.id!)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Main Component
export default function BillingExpensesPage() {
  const { canViewBilling, canManageBilling } = usePermissions();

  // State
  const [filters, setFilters] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Hooks
  const {
    expenses,
    loading,
    error,
    loadExpenses,
    addExpense,
    updateStatus,
    refreshExpenses,
  } = useExpenses();

  // Load initial data
  useEffect(() => {
    if (canViewBilling) {
      handleLoadExpenses();
    }
  }, [canViewBilling, filters]);

  const handleLoadExpenses = () => {
    const queryFilters: any = { limit: 50 };

    if (filters.category) queryFilters.category = filters.category;
    if (filters.status) queryFilters.status = filters.status;
    if (filters.startDate) queryFilters.startDate = new Date(filters.startDate);
    if (filters.endDate) queryFilters.endDate = new Date(filters.endDate);

    loadExpenses(queryFilters);
  };

  const handleAddExpense = async (expenseData: any) => {
    try {
      await addExpense(expenseData);
      // Modal will close automatically via the component
    } catch (error) {
      console.error("Error adding expense:", error);
      throw error; // Re-throw to let modal handle the error
    }
  };

  const handleApproveExpense = async (expenseId: string) => {
    try {
      await updateStatus(expenseId, "approved");
    } catch (error) {
      console.error("Error approving expense:", error);
    }
  };

  const handleRejectExpense = async (expenseId: string) => {
    try {
      await updateStatus(expenseId, "rejected");
    } catch (error) {
      console.error("Error rejecting expense:", error);
    }
  };

  const handleViewExpense = (expenseId: string) => {
    // Implement view expense detail
    console.log("View expense:", expenseId);
  };

  const filteredExpenses = expenses.filter((expense) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      expense.description.toLowerCase().includes(searchLower) ||
      expense.vendor?.toLowerCase().includes(searchLower) ||
      expense.receiptNumber?.toLowerCase().includes(searchLower) ||
      getExpenseCategoryLabel(expense.category)
        .toLowerCase()
        .includes(searchLower)
    );
  });

  const calculateTotalExpenses = () => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(amount || 0);
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
                No tienes permisos para acceder a la gestión de gastos.
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
            Gestión de Gastos
          </h1>
          <p className="text-gray-600">
            Registro y seguimiento de gastos del consultorio
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshExpenses}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>

          {canManageBilling && (
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Gasto
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Descripción, proveedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Estado</label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    status: value === "all" ? undefined : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="approved">Aprobado</SelectItem>
                  <SelectItem value="paid">Pagado</SelectItem>
                  <SelectItem value="rejected">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Categoría
              </label>
              <Select
                value={filters.category || "all"}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    category: value === "all" ? undefined : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  <SelectItem value="office_supplies">
                    Material de Oficina
                  </SelectItem>
                  <SelectItem value="dental_supplies">
                    Material Dental
                  </SelectItem>
                  <SelectItem value="equipment">Equipo</SelectItem>
                  <SelectItem value="laboratory">Laboratorio</SelectItem>
                  <SelectItem value="utilities">Servicios Públicos</SelectItem>
                  <SelectItem value="rent">Renta</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="other">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Fecha Desde
              </label>
              <Input
                type="date"
                value={filters.startDate || ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    startDate: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Fecha Hasta
              </label>
              <Input
                type="date"
                value={filters.endDate || ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    endDate: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Gastos</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(calculateTotalExpenses())}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-xl font-bold text-amber-600">
                  {
                    filteredExpenses.filter((e) => e.status === "pending")
                      .length
                  }
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aprobados</p>
                <p className="text-xl font-bold text-green-600">
                  {
                    filteredExpenses.filter((e) => e.status === "approved")
                      .length
                  }
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Deducibles</p>
                <p className="text-xl font-bold text-blue-600">
                  {filteredExpenses.filter((e) => e.deductible).length}
                </p>
              </div>
              <Receipt className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-gray-500" />
                <span className="font-medium">
                  {filteredExpenses.length} gastos encontrados
                </span>
              </div>
              {searchTerm && (
                <Badge variant="outline">Filtrado por: "{searchTerm}"</Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <div className="space-y-4">
        {loading && <ExpensesListSkeleton />}

        {error && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-red-600">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Error al cargar los gastos: {error}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleLoadExpenses}
                >
                  Reintentar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && !error && filteredExpenses.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay gastos registrados
              </h3>
              <p className="text-gray-600 mb-4">
                No se encontraron gastos que coincidan con los filtros
                seleccionados.
              </p>
              {canManageBilling && (
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Primer Gasto
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {!loading && !error && filteredExpenses.length > 0 && (
          <AnimatePresence>
            {filteredExpenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                onView={handleViewExpense}
                onApprove={handleApproveExpense}
                onReject={handleRejectExpense}
                canManage={canManageBilling}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Reusable Add Expense Modal */}
      <AddExpenseModal
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSubmit={handleAddExpense}
        isLoading={loading}
        triggerRefresh={refreshExpenses}
      />
    </div>
  );
}
