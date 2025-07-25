// Updated ReportCard.tsx - WITH NAVIGATION AND PDF LOADING
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "./core/BillingCard";
import { ActionButtons } from "./core/ActionButtons";
import { formatCurrency, formatDate } from "./core/BillingFormatters";
import { BillingReport } from "@/types/billing";
import { getPatient, getUser } from "@/lib/firebase/db";
import { generateBillingPDF } from "@/lib/utils/pdf"; // 🆕 NEW IMPORT

interface ReportCardProps {
  report: BillingReport;
  onView: (report: BillingReport) => void;
  onEdit: (report: BillingReport) => void;
  onPDF: (report: BillingReport) => void;
  onDelete: (report: BillingReport) => void;
  canManage: boolean;
}

export const ReportCard: React.FC<ReportCardProps> = React.memo(
  ({ report, onView, onEdit, onPDF, onDelete, canManage }) => {
    const router = useRouter(); // 🆕 NEW
    const [patient, setPatient] = useState<any>(null);
    const [doctor, setDoctor] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isPDFGenerating, setIsPDFGenerating] = useState(false); // 🆕 NEW

    // Memoize the report ID to prevent unnecessary re-renders
    const reportId = useMemo(
      () => report.id || `temp-${Date.now()}`,
      [report.id]
    );

    useEffect(() => {
      let isMounted = true;

      const loadDetails = async () => {
        try {
          const [patientData, doctorData] = await Promise.all([
            getPatient(report.patientId),
            getUser(report.doctorId),
          ]);

          if (isMounted) {
            setPatient(patientData);
            setDoctor(doctorData);
          }
        } catch (error) {
          console.error("Error loading report details:", error);
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };

      loadDetails();

      return () => {
        isMounted = false;
      };
    }, [report.patientId, report.doctorId]);

    // 🆕 UPDATED: Navigate to report detail page instead of modal
    const handleView = useMemo(
      () => () => {
        router.push(`/admin/billing/report/${report.id}`);
      },
      [router, report.id]
    );

    const handleEdit = useMemo(() => () => onEdit(report), [onEdit, report]);

    // 🆕 UPDATED: Enhanced PDF generation with loading state
    const handlePDF = useMemo(
      () => async () => {
        if (!report.id || isPDFGenerating) return;

        try {
          setIsPDFGenerating(true);
          await generateBillingPDF(report.id);
          // Note: The generateBillingPDF function handles success/error toasts
        } catch (error) {
          console.error("Error generating PDF:", error);
          // Error toast is handled by generateBillingPDF
        } finally {
          setIsPDFGenerating(false);
        }
      },
      [report.id, isPDFGenerating]
    );

    const handleDelete = useMemo(
      () => () => onDelete(report),
      [onDelete, report]
    );

    return (
      <Card
        className="hover:shadow-md transition-shadow"
        data-report-id={reportId}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-3">
              {/* Header */}
              <div className="flex items-center gap-3">
                <StatusBadge status={report.status} type="billing" />

                {/* Report Type Badge */}
                {report.reportType && (
                  <Badge variant="outline" className="text-xs">
                    {report.reportType === "complete_visit"
                      ? "Completa"
                      : report.reportType === "partial_treatment"
                      ? "Parcial"
                      : report.reportType === "emergency_addon"
                      ? "Emergencia"
                      : report.reportType === "product_sale"
                      ? "Productos"
                      : "Otro"}
                  </Badge>
                )}

                {report.invoiceNumber && (
                  <span className="text-sm font-mono text-gray-600">
                    {report.invoiceNumber}
                  </span>
                )}

                <span className="text-sm text-gray-500">
                  {formatDate(report.createdAt)}
                </span>

                {/* Sequence Number for Multiple Reports */}
                {report.reportSequence && report.reportSequence > 1 && (
                  <Badge variant="outline" className="text-xs bg-blue-50">
                    #{report.reportSequence}
                  </Badge>
                )}

                {/* 🆕 NEW: PDF Generating Indicator */}
                {isPDFGenerating && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-blue-50 text-blue-700"
                  >
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-1" />
                    Generando PDF...
                  </Badge>
                )}
              </div>

              {/* Enhanced Title Display */}
              {report.reportTitle && (
                <div className="text-sm font-medium text-gray-800">
                  {report.reportTitle}
                </div>
              )}

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
                    <StatusBadge status={report.status} type="billing" />
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

              {/* Report Relationships */}
              {report.parentReportId && (
                <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  Relacionado con reporte padre
                </div>
              )}

              {report.linkedReports && report.linkedReports.length > 0 && (
                <div className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                  {report.linkedReports.length} reportes vinculados
                </div>
              )}
            </div>

            {/* 🆕 UPDATED: Actions with PDF loading state */}
            <div className="ml-4">
              <ActionButtons
                onView={handleView}
                onEdit={canManage ? handleEdit : undefined}
                onPDF={
                  ["completed", "paid", "partially_paid"].includes(
                    report.status
                  )
                    ? handlePDF
                    : undefined
                }
                onDelete={
                  canManage && report.status === "draft"
                    ? handleDelete
                    : undefined
                }
                canEdit={canManage}
                canDelete={canManage && report.status === "draft"}
                showPDF={["completed", "paid", "partially_paid"].includes(
                  report.status
                )}
                isPDFGenerating={isPDFGenerating} // 🆕 NEW
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

ReportCard.displayName = "ReportCard";
