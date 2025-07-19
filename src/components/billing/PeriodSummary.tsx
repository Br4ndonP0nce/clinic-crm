import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "lucide-react";
import { BillingCard } from "./core/BillingCard";
import { formatCurrency, formatDateRange } from "./core/BillingFormatters";
import { BillingReport, Expense } from "@/types/billing";

interface DateFilter {
  start: Date;
  end: Date;
  label: string;
  key: string;
}

interface PeriodSummaryProps {
  filter: DateFilter;
  reports: BillingReport[];
  expenses: Expense[];
}

export const PeriodSummary: React.FC<PeriodSummaryProps> = ({
  filter,
  reports,
  expenses,
}) => {
  const summaryData = useMemo(() => {
    const totalReports = reports.length;
    const totalRevenue = reports.reduce((sum, r) => sum + r.total, 0);
    const paidRevenue = reports.reduce((sum, r) => sum + r.paidAmount, 0);
    const pendingRevenue = reports.reduce((sum, r) => sum + r.pendingAmount, 0);

    const totalExpenses = expenses
      .filter((e) => e.status === "approved" || e.status === "paid")
      .reduce((sum, e) => sum + e.amount, 0);

    const netIncome = paidRevenue - totalExpenses;

    // NEW: Multi-report analysis
    const appointmentGroups = reports.reduce((acc, report) => {
      if (!acc[report.appointmentId]) {
        acc[report.appointmentId] = [];
      }
      acc[report.appointmentId].push(report);
      return acc;
    }, {} as Record<string, BillingReport[]>);

    const appointmentsWithMultipleReports = Object.values(
      appointmentGroups
    ).filter((reports) => reports.length > 1).length;

    const reportTypes = reports.reduce((acc, report) => {
      const type = report.reportType || "complete_visit";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalReports,
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      totalExpenses,
      netIncome,
      appointmentsWithMultipleReports,
      totalAppointments: Object.keys(appointmentGroups).length,
      reportTypes,
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
            {formatDateRange(filter.start, filter.end)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Main Financial Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
          <BillingCard
            title="Reportes"
            value={summaryData.totalReports}
            variant="default"
            subtitle={`${summaryData.totalAppointments} citas`}
            className="text-center p-3 bg-blue-50 rounded-lg border-0"
          />
          <BillingCard
            title="Ingresos Totales"
            value={formatCurrency(summaryData.totalRevenue)}
            variant="revenue"
            className="text-center p-3 rounded-lg border-0"
          />
          <BillingCard
            title="Ingresos Pagados"
            value={formatCurrency(summaryData.paidRevenue)}
            variant="revenue"
            className="text-center p-3 bg-emerald-50 rounded-lg border-0"
          />
          <BillingCard
            title="Pendientes"
            value={formatCurrency(summaryData.pendingRevenue)}
            className="text-center p-3 bg-amber-50 rounded-lg border-0"
          />
          <BillingCard
            title="Gastos"
            value={formatCurrency(summaryData.totalExpenses)}
            variant="expense"
            className="text-center p-3 rounded-lg border-0"
          />
          <BillingCard
            title="Ingresos Netos"
            value={formatCurrency(summaryData.netIncome)}
            variant="net"
            className="text-center p-3 rounded-lg border-0"
          />
        </div>

        {/* NEW: Multi-Report Summary */}
        {summaryData.appointmentsWithMultipleReports > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-gray-800 mb-2">
              Análisis de Reportes Múltiples
            </h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-blue-600">
                  {summaryData.appointmentsWithMultipleReports}
                </div>
                <div className="text-gray-600">
                  Citas con múltiples reportes
                </div>
              </div>
              {Object.entries(summaryData.reportTypes).map(([type, count]) => (
                <div key={type} className="text-center">
                  <div className="font-semibold text-purple-600">{count}</div>
                  <div className="text-gray-600">
                    {type === "complete_visit"
                      ? "Completos"
                      : type === "partial_treatment"
                      ? "Parciales"
                      : type === "emergency_addon"
                      ? "Emergencia"
                      : type === "product_sale"
                      ? "Productos"
                      : "Otros"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
