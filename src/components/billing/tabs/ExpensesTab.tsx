// components/billing/tabs/ExpensesTab.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Download, Plus } from "lucide-react";
import { ExpenseCard } from "../core/ExpenseCard";
import { EmptyState } from "../core/EmptyState";
import { LoadingState } from "../core/LoadingState";
import { ErrorState } from "../core/ErrorState";
import { Expense } from "@/types/billing";
import { DateFilter } from "../DateFilterSelect";
import { CreditCard } from "lucide-react";

interface ExpensesTabProps {
  expenses: Expense[];
  dateFilter: DateFilter;
  loading: boolean;
  error: string | null;
  canManage: boolean;
  onView: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  onApprove?: (expense: Expense) => void;
  onExport: () => void;
  onNewExpense: () => void;
}

export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  expenses,
  dateFilter,
  loading,
  error,
  canManage,
  onView,
  onDelete,
  onApprove,
  onExport,
  onNewExpense,
}) => {
  if (loading) {
    return <LoadingState type="table" count={5} />;
  }

  if (error) {
    return <ErrorState message={`Error al cargar gastos: ${error}`} />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Gestión de Gastos - {dateFilter.label}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={expenses.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Gastos
          </Button>
          {canManage && (
            <Button size="sm" onClick={onNewExpense}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Gasto
            </Button>
          )}
        </div>
      </div>

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title={`No hay gastos para ${dateFilter.label}`}
          description="No se encontraron gastos registrados en el período seleccionado."
          actionLabel={canManage ? "Registrar Primer Gasto" : undefined}
          onAction={canManage ? onNewExpense : undefined}
          showAction={canManage}
        />
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onView={onView}
              onDelete={onDelete}
              onApprove={onApprove}
              canManage={canManage}
            />
          ))}

          {/* Summary Footer */}
          {expenses.length > 5 && (
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600">
                Mostrando {expenses.length} gastos para {dateFilter.label}
              </div>
              <div className="text-lg font-semibold text-red-600">
                Total de gastos:{" "}
                {new Intl.NumberFormat("es-MX", {
                  style: "currency",
                  currency: "MXN",
                }).format(expenses.reduce((sum, e) => sum + e.amount, 0))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
