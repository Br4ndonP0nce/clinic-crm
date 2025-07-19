// components/billing/RevenueSummaryCards.tsx
import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, TrendingUp, DollarSign, BarChart3 } from "lucide-react";
import { BillingCard } from "./core/BillingCard";
import { formatCurrency } from "./core/BillingFormatters";
import { BillingReport, Expense } from "@/types/billing";
import { DateFilter } from "./DateFilterSelect";

interface RevenueSummaryCardsProps {
  revenueSummary: any;
  expenses: Expense[];
  reports: BillingReport[];
  dateFilter: DateFilter;
}

export const RevenueSummaryCards: React.FC<RevenueSummaryCardsProps> = ({
  revenueSummary,
  expenses,
  reports,
  dateFilter,
}) => {
  // Calculate expense totals for the current period
  const periodExpenses = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const filterExpensesByPeriod = (startDate: Date) => {
      return expenses
        .filter((expense) => {
          const expenseDate = expense.date.toDate();
          return (
            expenseDate >= startDate &&
            (expense.status === "approved" || expense.status === "paid")
          );
        })
        .reduce((sum, expense) => sum + expense.amount, 0);
    };

    return {
      today: filterExpensesByPeriod(startOfDay),
      thisWeek: filterExpensesByPeriod(startOfWeek),
      thisMonth: filterExpensesByPeriod(startOfMonth),
      thisYear: filterExpensesByPeriod(startOfYear),
    };
  }, [expenses]);

  // Calculate net income
  const netIncome = useMemo(
    () => ({
      today: (revenueSummary?.today || 0) - periodExpenses.today,
      thisWeek: (revenueSummary?.thisWeek || 0) - periodExpenses.thisWeek,
      thisMonth: (revenueSummary?.thisMonth || 0) - periodExpenses.thisMonth,
      thisYear: (revenueSummary?.thisYear || 0) - periodExpenses.thisYear,
    }),
    [revenueSummary, periodExpenses]
  );

  const cards = [
    {
      title: "Ingresos Hoy",
      value: revenueSummary?.today || 0,
      expenses: periodExpenses.today,
      netIncome: netIncome.today,
      icon: Calendar,
      color: "green",
    },
    {
      title: "Ingresos Esta Semana",
      value: revenueSummary?.thisWeek || 0,
      expenses: periodExpenses.thisWeek,
      netIncome: netIncome.thisWeek,
      icon: TrendingUp,
      color: "blue",
    },
    {
      title: "Ingresos Este Mes",
      value: revenueSummary?.thisMonth || 0,
      expenses: periodExpenses.thisMonth,
      netIncome: netIncome.thisMonth,
      icon: DollarSign,
      color: "purple",
    },
    {
      title: "Ingresos Este Año",
      value: revenueSummary?.thisYear || 0,
      expenses: periodExpenses.thisYear,
      netIncome: netIncome.thisYear,
      icon: BarChart3,
      color: "amber",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Revenue vs Expenses Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <BillingCard
            key={index}
            title={card.title}
            value={formatCurrency(card.value)}
            icon={card.icon}
            variant="revenue"
          >
            {/* Expense and Net Income Info */}
            <div className="space-y-1 text-xs mt-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Gastos:</span>
                <span className="text-red-600 font-medium">
                  {formatCurrency(card.expenses)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                <span className="text-gray-600 font-medium">Neto:</span>
                <span
                  className={`font-bold ${
                    card.netIncome >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatCurrency(card.netIncome)}
                </span>
              </div>
            </div>
          </BillingCard>
        ))}
      </div>

      {/* Current Period Summary */}
    </div>
  );
};
