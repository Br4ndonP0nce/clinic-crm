// components/billing/tabs/ReportsTab.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Download, Plus } from "lucide-react";
import { ReportCard } from "../ReportCard";
import { EmptyState } from "../core/EmptyState";
import { LoadingState } from "../core/LoadingState";
import { ErrorState } from "../core/ErrorState";
import { BillingReport } from "@/types/billing";
import { DateFilter } from "../DateFilterSelect";
import { FileText } from "lucide-react";

interface ReportsTabProps {
  reports: BillingReport[];
  dateFilter: DateFilter;
  loading: boolean;
  error: string | null;
  canManage: boolean;
  onView: (report: BillingReport) => void;
  onEdit: (report: BillingReport) => void;
  onPDF: (report: BillingReport) => void;
  onDelete: (report: BillingReport) => void;
  onExport: () => void;
  onNewReport: () => void;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  reports,
  dateFilter,
  loading,
  error,
  canManage,
  onView,
  onEdit,
  onPDF,
  onDelete,
  onExport,
  onNewReport,
}) => {
  if (loading) {
    return <LoadingState type="table" count={5} />;
  }

  if (error) {
    return <ErrorState message={`Error al cargar reportes: ${error}`} />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Reportes de Facturación - {dateFilter.label}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={reports.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Reportes
          </Button>
          {canManage && (
            <Button size="sm" onClick={onNewReport}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Reporte
            </Button>
          )}
        </div>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={`No hay reportes para ${dateFilter.label}`}
          description="No se encontraron reportes de facturación en el período seleccionado."
          actionLabel={canManage ? "Crear Primer Reporte" : undefined}
          onAction={canManage ? onNewReport : undefined}
          showAction={canManage}
        />
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onView={onView}
              onEdit={onEdit}
              onPDF={onPDF}
              onDelete={onDelete}
              canManage={canManage}
            />
          ))}

          {/* Summary Footer */}
          {reports.length > 5 && (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600">
                Mostrando {reports.length} reportes para {dateFilter.label}
              </div>
              <div className="text-lg font-semibold text-gray-800">
                Total del período:{" "}
                {new Intl.NumberFormat("es-MX", {
                  style: "currency",
                  currency: "MXN",
                }).format(reports.reduce((sum, r) => sum + r.total, 0))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
