// components/billing/tabs/AnalyticsTab.tsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  CreditCard,
  TrendingUp,
  PieChart,
  BarChart3,
} from "lucide-react";
import { BillingCard } from "../core/BillingCard";
import { formatCurrency } from "../core/BillingFormatters";
import {
  BillingReport,
  Expense,
  getExpenseCategoryLabel,
} from "@/types/billing";
import { DateFilter } from "../DateFilterSelect";

interface AnalyticsTabProps {
  reports: BillingReport[];
  expenses: Expense[];
  dateFilter: DateFilter;
  dashboard: any;
  onExport: () => void;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  reports,
  expenses,
  dateFilter,
  dashboard,
  onExport,
}) => {
  // Calculate expense category breakdown
  const expenseCategoryBreakdown = React.useMemo(() => {
    return Object.entries(
      expenses
        .filter((e) => e.status === "approved" || e.status === "paid")
        .reduce((acc, expense) => {
          const category = getExpenseCategoryLabel(expense.category);
          acc[category] = (acc[category] || 0) + expense.amount;
          return acc;
        }, {} as Record<string, number>)
    );
  }, [expenses]);

  const totalExpenses = expenses
    .filter((e) => e.status === "approved" || e.status === "paid")
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Análisis Financiero - {dateFilter.label}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={!dashboard}
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar Análisis
        </Button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <BillingCard
          title="Ingresos del Período"
          value={formatCurrency(
            reports.reduce((sum, r) => sum + r.paidAmount, 0)
          )}
          subtitle={`${reports.length} reportes completados`}
          variant="revenue"
        />
        <BillingCard
          title="Gastos del Período"
          value={formatCurrency(totalExpenses)}
          subtitle={`${
            expenses.filter(
              (e) => e.status === "approved" || e.status === "paid"
            ).length
          } gastos aprobados`}
          variant="expense"
        />
        <BillingCard
          title="Ingresos Netos"
          value={formatCurrency(
            reports.reduce((sum, r) => sum + r.paidAmount, 0) - totalExpenses
          )}
          subtitle="Ganancia del período"
          variant="net"
        />
      </div>

      {/* Enhanced Multi-Report Analysis */}
      {reports.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Report Types Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Análisis de Tipos de Reporte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(
                  reports.reduce((acc, report) => {
                    const type = report.reportType || "complete_visit";
                    const typeLabel =
                      type === "complete_visit"
                        ? "Consulta Completa"
                        : type === "partial_treatment"
                        ? "Tratamiento Parcial"
                        : type === "emergency_addon"
                        ? "Emergencia"
                        : type === "product_sale"
                        ? "Venta de Productos"
                        : "Otro";

                    if (!acc[typeLabel]) {
                      acc[typeLabel] = { count: 0, total: 0 };
                    }
                    acc[typeLabel].count += 1;
                    acc[typeLabel].total += report.total;
                    return acc;
                  }, {} as Record<string, { count: number; total: number }>)
                ).map(([type, data], index) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded-full mr-3"
                        style={{
                          backgroundColor: [
                            "#8b5cf6",
                            "#3b82f6",
                            "#ef4444",
                            "#10b981",
                            "#f59e0b",
                            "#06b6d4",
                          ][index % 6],
                        }}
                      />
                      <span className="text-sm font-medium">{type}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {data.count} reportes
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatCurrency(data.total)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Multiple Reports per Appointment Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Reportes Múltiples por Cita
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const appointmentGroups = reports.reduce((acc, report) => {
                  if (!acc[report.appointmentId]) {
                    acc[report.appointmentId] = [];
                  }
                  acc[report.appointmentId].push(report);
                  return acc;
                }, {} as Record<string, BillingReport[]>);

                const multiReportAppointments = Object.values(
                  appointmentGroups
                ).filter((reports) => reports.length > 1);

                const totalAppointments = Object.keys(appointmentGroups).length;

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {totalAppointments}
                        </div>
                        <div className="text-sm text-gray-600">
                          Total de Citas
                        </div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {multiReportAppointments.length}
                        </div>
                        <div className="text-sm text-gray-600">
                          Con Múltiples Reportes
                        </div>
                      </div>
                    </div>

                    {multiReportAppointments.length > 0 && (
                      <div className="text-sm text-gray-600">
                        <div className="font-medium mb-2">Distribución:</div>
                        {multiReportAppointments
                          .slice(0, 3)
                          .map((appointmentReports, index) => (
                            <div
                              key={index}
                              className="flex justify-between py-1"
                            >
                              <span>Cita {index + 1}:</span>
                              <span className="font-medium">
                                {appointmentReports.length} reportes -{" "}
                                {formatCurrency(
                                  appointmentReports.reduce(
                                    (sum, r) => sum + r.total,
                                    0
                                  )
                                )}
                              </span>
                            </div>
                          ))}
                        {multiReportAppointments.length > 3 && (
                          <div className="text-xs text-gray-500 pt-2">
                            Y {multiReportAppointments.length - 3} citas más...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Expense Category Breakdown */}
      {expenses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Gastos por Categoría
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expenseCategoryBreakdown.map(([category, amount], index) => (
                  <div
                    key={category}
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
                      <span className="text-sm font-medium">{category}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {formatCurrency(amount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {((amount / totalExpenses) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trends and Charts Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Tendencias del Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Gráficos de tendencias financieras</p>
                <p className="text-sm mt-2">
                  Próximamente: análisis temporal de ingresos y gastos
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {reports.length === 0 && expenses.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Sin datos para analizar
            </h3>
            <p className="text-gray-600">
              No hay suficientes datos para generar análisis financieros para{" "}
              {dateFilter.label}.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
