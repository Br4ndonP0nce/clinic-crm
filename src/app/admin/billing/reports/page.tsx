// src/app/admin/billing/reports/page.tsx
"use client";
import React, { useState, useEffect, Suspense } from "react";
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
  FileText,
  Search,
  Filter,
  Plus,
  Eye,
  Download,
  Calendar,
  DollarSign,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useBillingReports } from "@/hooks/useBilling";
import { usePermissions } from "@/hooks/usePermissions";
import { BillingReport, getBillingStatusLabel } from "@/types/billing";

// Skeleton Components
const ReportCardSkeleton = () => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-1">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-4 w-8" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
      </div>
    </CardContent>
  </Card>
);

const ReportsListSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <ReportCardSkeleton key={i} />
    ))}
  </div>
);

// Filters Component
const ReportsFilters = ({
  filters,
  onFiltersChange,
  onSearch,
  searchTerm,
}: {
  filters: any;
  onFiltersChange: (filters: any) => void;
  searchTerm: string;
  onSearch: (term: string) => void;
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Buscar</label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Paciente, doctor, invoice..."
                value={searchTerm}
                onChange={(e) => onSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Estado</label>
            <Select
              value={filters.status || "all"}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  status: value === "all" ? undefined : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
                <SelectItem value="partially_paid">Pago Parcial</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
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
                onFiltersChange({
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
                onFiltersChange({
                  ...filters,
                  endDate: e.target.value,
                })
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Individual Report Card Component
const ReportCard = ({
  report,
  onView,
  onEdit,
}: {
  report: BillingReport;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
}) => {
  const { canManageBilling } = usePermissions();

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
                {report.status === "overdue" && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
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
                  <span className="text-gray-600">Servicios:</span>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(report.id!)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {canManageBilling && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(report.id!)}
                >
                  <FileText className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Main Component
export default function BillingReportsPage() {
  const router = useRouter();
  const { canViewBilling, canManageBilling } = usePermissions();

  // State
  const [filters, setFilters] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Hooks
  const {
    reports,
    loading,
    error,
    hasMore,
    loadReports,
    loadMore,
    refreshReports,
  } = useBillingReports();

  // Load initial data
  useEffect(() => {
    if (canViewBilling) {
      handleLoadReports();
    }
  }, [canViewBilling, filters]);

  const handleLoadReports = () => {
    const queryFilters: any = { limit: 20 };

    if (filters.status) queryFilters.status = filters.status;
    if (filters.startDate) queryFilters.startDate = new Date(filters.startDate);
    if (filters.endDate) queryFilters.endDate = new Date(filters.endDate);

    loadReports(queryFilters);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    // Implement search logic here
    // For now, this would need to be handled on the backend
  };

  const handleViewReport = (reportId: string) => {
    router.push(`/admin/billing/report/${reportId}`);
  };

  const handleEditReport = (reportId: string) => {
    router.push(`/admin/billing/report/${reportId}/edit`);
  };

  const handleNewReport = () => {
    router.push("/admin/billing/report/new");
  };

  const filteredReports = reports.filter((report) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      report.invoiceNumber?.toLowerCase().includes(searchLower) ||
      report.patientId.toLowerCase().includes(searchLower) ||
      report.doctorId.toLowerCase().includes(searchLower) ||
      report.services.some((service) =>
        service.description.toLowerCase().includes(searchLower)
      )
    );
  });

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
                No tienes permisos para acceder a los reportes de facturación.
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
            Reportes de Facturación
          </h1>
          <p className="text-gray-600">
            Gestión y seguimiento de reportes de facturación
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshReports}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>

          {canManageBilling && (
            <Button onClick={handleNewReport}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Reporte
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <ReportsFilters
        filters={filters}
        onFiltersChange={setFilters}
        searchTerm={searchTerm}
        onSearch={handleSearch}
      />

      {/* Results Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                <span className="font-medium">
                  {filteredReports.length} reportes encontrados
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

      {/* Reports List */}
      <div className="space-y-4">
        {loading && <ReportsListSkeleton />}

        {error && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-red-600">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Error al cargar los reportes: {error}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleLoadReports}
                >
                  Reintentar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && !error && filteredReports.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay reportes
              </h3>
              <p className="text-gray-600 mb-4">
                No se encontraron reportes de facturación que coincidan con los
                filtros seleccionados.
              </p>
              {canManageBilling && (
                <Button onClick={handleNewReport}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Reporte
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {!loading && !error && filteredReports.length > 0 && (
          <AnimatePresence>
            {filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onView={handleViewReport}
                onEdit={handleEditReport}
              />
            ))}
          </AnimatePresence>
        )}

        {/* Load More Button */}
        {hasMore && !loading && (
          <div className="text-center">
            <Button variant="outline" onClick={loadMore}>
              Cargar Más Reportes
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
