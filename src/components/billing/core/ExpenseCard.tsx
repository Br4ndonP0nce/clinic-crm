import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./BillingCard";
import { ActionButtons } from "./ActionButtons";
import { formatCurrency, formatDate } from "./BillingFormatters";
import { Expense, getExpenseCategoryLabel } from "@/types/billing";

interface ExpenseCardProps {
  expense: Expense;
  onView: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  onApprove?: (expense: Expense) => void;
  canManage: boolean;
}

export const ExpenseCard: React.FC<ExpenseCardProps> = React.memo(
  ({ expense, onView, onDelete, onApprove, canManage }) => {
    // Memoize the expense ID to prevent unnecessary re-renders
    const expenseId = useMemo(
      () => expense.id || `temp-${Date.now()}`,
      [expense.id]
    );

    // Memoize handlers to prevent unnecessary re-renders
    const handleView = useMemo(() => () => onView(expense), [onView, expense]);
    const handleDelete = useMemo(
      () => () => onDelete(expense),
      [onDelete, expense]
    );
    const handleApprove = useMemo(
      () => (onApprove ? () => onApprove(expense) : undefined),
      [onApprove, expense]
    );

    return (
      <Card
        className="hover:shadow-md transition-shadow"
        data-expense-id={expenseId}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-3">
              {/* Header */}
              <div className="flex items-center gap-3">
                <StatusBadge status={expense.status} type="expense" />
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
            <div className="ml-4">
              <ActionButtons
                onView={handleView}
                onApprove={handleApprove}
                onDelete={
                  canManage && expense.status !== "paid"
                    ? handleDelete
                    : undefined
                }
                canApprove={canManage && expense.status === "pending"}
                canDelete={canManage && expense.status !== "paid"}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);
