// src/app/admin/billing/analytics/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  PieChart,
  Download,
  RefreshCw,
  Target,
  CreditCard,
  Receipt,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";
import { useBillingDashboard } from "@/hooks/useBilling";
import { usePermissions } from "@/hooks/usePermissions";
import { getPaymentMethodLabel } from "@/types/sales";
import { getServiceCategoryLabel } from "@/types/billing";

// Skeleton Components
const MetricCardSkeleton = () => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </CardContent>
  </Card>
);

const ChartCardSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-40" />
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const AnalyticsSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <MetricCardSkeleton key={i} />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <ChartCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

// Metric Card Component
const MetricCard = ({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string;
  value: string;
  change?: string;
  changeType?: "increase" | "decrease" | "neutral";
  icon: any;
  color: string;
  subtitle?: string;
}) => {
  const getChangeIcon = () => {
    switch (changeType) {
      case "increase":
        return <ArrowUpRight className="h-3 w-3" />;
      case "decrease":
        return <ArrowDownRight className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case "increase":
        return "text-green-600";
      case "decrease":
        return "text-red-600";
      default:
        return "text-gray-500";
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
            <div>
              <p className="text-sm text-gray-600">{title}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              {change && (
                <div
                  className={`flex items-center gap-1 text-sm ${getChangeColor()}`}
                >
                  {getChangeIcon()}
                  <span>{change}</span>
                </div>
              )}
              {subtitle && (
                <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
            <Icon
              className={`h-8 w-8 ${color
                .replace("text-", "text-")
                .replace("-600", "-500")}`}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Payment Methods Chart Component
const PaymentMethodsChart = ({ data }: { data: any[] }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-red-500",
    "bg-indigo-500",
    "bg-pink-500",
    "bg-gray-500",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Métodos de Pago
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.slice(0, 6).map((method, index) => (
              <div
                key={method.method}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full ${
                      colors[index % colors.length]
                    }`}
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
                    {method.percentage.toFixed(1)}% • {method.count} pagos
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Service Categories Chart Component
const ServiceCategoriesChart = ({ data }: { data: any[] }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const colors = [
    "bg-emerald-500",
    "bg-blue-500",
    "bg-orange-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-cyan-500",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Categorías de Servicios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.slice(0, 6).map((category, index) => (
              <div
                key={category.category}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full ${
                      colors[index % colors.length]
                    }`}
                  />
                  <span className="text-sm font-medium">
                    {getServiceCategoryLabel(category.category)}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">
                    {formatCurrency(category.revenue)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {category.count} servicios • Prom:{" "}
                    {formatCurrency(category.averagePrice)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Monthly Trends Chart Component
const MonthlyTrendsChart = ({ data }: { data: any[] }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Tendencias Mensuales (Últimos 6 meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.slice(-6).map((trend, index) => (
              <motion.div
                key={trend.month}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium">{trend.month}</div>
                  <div className="text-sm text-gray-600">
                    {trend.reportCount} reportes
                  </div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-sm text-gray-600">Ingresos</div>
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
                      trend.netIncome >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(trend.netIncome)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Period Selector Component
const PeriodSelector = ({
  selectedPeriod,
  onPeriodChange,
}: {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Período de Análisis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { value: "7d", label: "Últimos 7 días" },
            { value: "30d", label: "Últimos 30 días" },
            { value: "90d", label: "Últimos 3 meses" },
            { value: "1y", label: "Último año" },
          ].map((period) => (
            <Button
              key={period.value}
              variant={selectedPeriod === period.value ? "default" : "outline"}
              size="sm"
              onClick={() => onPeriodChange(period.value)}
              className="text-xs"
            >
              {period.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Main Component
export default function BillingAnalyticsPage() {
  const { canViewBilling } = usePermissions();

  // State
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date(),
  });

  // Hooks
  const { dashboard, loading, error, loadDashboard, refreshDashboard } =
    useBillingDashboard();

  // Load initial data
  useEffect(() => {
    if (canViewBilling) {
      loadDashboard(dateRange.start, dateRange.end);
    }
  }, [canViewBilling, dateRange]);

  // Handle period change
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const end = new Date();
    let start = new Date();

    switch (period) {
      case "7d":
        start.setDate(end.getDate() - 7);
        break;
      case "30d":
        start.setDate(end.getDate() - 30);
        break;
      case "90d":
        start.setDate(end.getDate() - 90);
        break;
      case "1y":
        start.setFullYear(end.getFullYear() - 1);
        break;
    }

    setDateRange({ start, end });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  if (!canViewBilling) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Acceso Restringido
              </h3>
              <p className="text-gray-600">
                No tienes permisos para acceder a los análisis financieros.
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
            Análisis Financiero
          </h1>
          <p className="text-gray-600">
            Métricas y tendencias financieras del consultorio
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshDashboard}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>

          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar Reporte
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <PeriodSelector
        selectedPeriod={selectedPeriod}
        onPeriodChange={handlePeriodChange}
      />

      {loading && <AnalyticsSkeleton />}

      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p>Error al cargar los análisis: {error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={refreshDashboard}
              >
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {dashboard && !loading && !error && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Ingresos Totales"
              value={formatCurrency(dashboard.totalRevenue)}
              change={
                dashboard.grossMargin > 0
                  ? formatPercentage(dashboard.grossMargin)
                  : undefined
              }
              changeType={dashboard.grossMargin > 0 ? "increase" : "neutral"}
              icon={DollarSign}
              color="text-green-600"
              subtitle="Período seleccionado"
            />

            <MetricCard
              title="Ingresos Cobrados"
              value={formatCurrency(dashboard.paidRevenue)}
              change={
                dashboard.paidRevenue > 0 && dashboard.totalRevenue > 0
                  ? formatPercentage(
                      (dashboard.paidRevenue / dashboard.totalRevenue) * 100
                    )
                  : undefined
              }
              changeType="increase"
              icon={CheckCircle}
              color="text-blue-600"
              subtitle={`${dashboard.completedReports} reportes completados`}
            />

            <MetricCard
              title="Gastos Totales"
              value={formatCurrency(dashboard.totalExpenses)}
              change={
                dashboard.pendingExpenses > 0
                  ? `${formatCurrency(dashboard.pendingExpenses)} pendientes`
                  : undefined
              }
              changeType="neutral"
              icon={Receipt}
              color="text-red-600"
              subtitle="Gastos aprobados y pagados"
            />

            <MetricCard
              title="Ganancia Neta"
              value={formatCurrency(dashboard.netIncome)}
              change={
                dashboard.grossMargin > 0
                  ? `Margen: ${dashboard.grossMargin.toFixed(1)}%`
                  : undefined
              }
              changeType={dashboard.netIncome > 0 ? "increase" : "decrease"}
              icon={TrendingUp}
              color={
                dashboard.netIncome > 0 ? "text-green-600" : "text-red-600"
              }
              subtitle="Ingresos - Gastos"
            />
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Reportes Pendientes"
              value={dashboard.pendingRevenue.toString()}
              change={formatCurrency(dashboard.pendingRevenue)}
              changeType="neutral"
              icon={Clock}
              color="text-amber-600"
              subtitle={`${dashboard.draftReports} borradores`}
            />

            <MetricCard
              title="Facturas Vencidas"
              value={dashboard.overdueReports.toString()}
              change={formatCurrency(dashboard.overdueRevenue)}
              changeType={dashboard.overdueReports > 0 ? "decrease" : "neutral"}
              icon={AlertTriangle}
              color="text-red-600"
              subtitle="Requieren seguimiento"
            />

            <MetricCard
              title="Total Reportes"
              value={dashboard.totalReports.toString()}
              change={`${dashboard.completedReports} completados`}
              changeType="increase"
              icon={BarChart3}
              color="text-purple-600"
              subtitle="En el período"
            />

            <MetricCard
              title="Gastos Pendientes"
              value={formatCurrency(dashboard.pendingExpenses)}
              changeType="neutral"
              icon={Clock}
              color="text-orange-600"
              subtitle="Esperando aprobación"
            />
          </div>

          {/* Charts and Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Methods */}
            {dashboard.paymentMethodBreakdown.length > 0 && (
              <PaymentMethodsChart data={dashboard.paymentMethodBreakdown} />
            )}

            {/* Service Categories */}
            {dashboard.serviceCategoryBreakdown.length > 0 && (
              <ServiceCategoriesChart
                data={dashboard.serviceCategoryBreakdown}
              />
            )}
          </div>

          {/* Monthly Trends */}
          {dashboard.monthlyTrends.length > 0 && (
            <MonthlyTrendsChart data={dashboard.monthlyTrends} />
          )}

          {/* Additional Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Composition */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Composición de Ingresos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Cobrado</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{
                            width: `${
                              dashboard.totalRevenue > 0
                                ? (dashboard.paidRevenue /
                                    dashboard.totalRevenue) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {formatCurrency(dashboard.paidRevenue)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pendiente</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500"
                          style={{
                            width: `${
                              dashboard.totalRevenue > 0
                                ? (dashboard.pendingRevenue /
                                    dashboard.totalRevenue) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {formatCurrency(dashboard.pendingRevenue)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Vencido</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500"
                          style={{
                            width: `${
                              dashboard.totalRevenue > 0
                                ? (dashboard.overdueRevenue /
                                    dashboard.totalRevenue) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {formatCurrency(dashboard.overdueRevenue)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Indicators */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Indicadores Clave
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">
                        Tasa de Cobro
                      </span>
                      <span className="text-sm font-medium">
                        {dashboard.totalRevenue > 0
                          ? (
                              (dashboard.paidRevenue / dashboard.totalRevenue) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{
                          width: `${
                            dashboard.totalRevenue > 0
                              ? (dashboard.paidRevenue /
                                  dashboard.totalRevenue) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">
                        Eficiencia Operativa
                      </span>
                      <span className="text-sm font-medium">
                        {dashboard.totalReports > 0
                          ? (
                              (dashboard.completedReports /
                                dashboard.totalReports) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{
                          width: `${
                            dashboard.totalReports > 0
                              ? (dashboard.completedReports /
                                  dashboard.totalReports) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">
                        Margen de Ganancia
                      </span>
                      <span className="text-sm font-medium">
                        {dashboard.grossMargin.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          dashboard.grossMargin > 50
                            ? "bg-green-500"
                            : dashboard.grossMargin > 25
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{
                          width: `${Math.min(dashboard.grossMargin, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Recomendadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboard.overdueReports > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-200">
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800">
                          Facturas Vencidas
                        </p>
                        <p className="text-xs text-red-600">
                          {dashboard.overdueReports} facturas requieren
                          seguimiento
                        </p>
                      </div>
                    </div>
                  )}

                  {dashboard.pendingExpenses > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border-l-4 border-amber-200">
                      <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">
                          Gastos Pendientes
                        </p>
                        <p className="text-xs text-amber-600">
                          {formatCurrency(dashboard.pendingExpenses)} esperando
                          aprobación
                        </p>
                      </div>
                    </div>
                  )}

                  {dashboard.draftReports > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-200">
                      <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">
                          Reportes Incompletos
                        </p>
                        <p className="text-xs text-blue-600">
                          {dashboard.draftReports} reportes en borrador
                        </p>
                      </div>
                    </div>
                  )}

                  {dashboard.grossMargin > 50 &&
                    dashboard.overdueReports === 0 && (
                      <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-200">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            Excelente Rendimiento
                          </p>
                          <p className="text-xs text-green-600">
                            Margen saludable y cobros al día
                          </p>
                        </div>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!dashboard && !loading && !error && (
        <Card>
          <CardContent className="p-6 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Sin datos para analizar
            </h3>
            <p className="text-gray-600">
              No hay suficientes datos para generar análisis financieros en el
              período seleccionado.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
