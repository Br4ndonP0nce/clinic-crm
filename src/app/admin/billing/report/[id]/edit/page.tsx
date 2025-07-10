"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle,
  FileText,
  Lock,
  Edit,
} from "lucide-react";
import { motion } from "framer-motion";
import { useBillingReport } from "@/hooks/useBilling";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";
import { getBillingStatusLabel } from "@/types/billing";
import ReportForm from "@/components/billing/ReportForm";

// Loading Skeleton
const EditReportSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-4">
      <Skeleton className="h-8 w-20" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
    <Skeleton className="h-96 w-full" />
  </div>
);

export default function EditBillingReportPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const { canManageBilling, isDoctor, isSuperAdmin, role } = usePermissions();

  const { userProfile } = useAuth();

  const { report, loading, error, loadReport } = useBillingReport();

  useEffect(() => {
    if (reportId && canManageBilling) {
      loadReport(reportId);
    }
  }, [reportId, canManageBilling]);

  // 🆕 Enhanced permission logic
  const canEditReport = React.useMemo(() => {
    if (!report || !userProfile) return false;

    // Super admin can edit any report
    if (isSuperAdmin) return true;

    // Reception can edit most reports (except paid ones for safety)
    if (role === "recepcion") {
      return report.status !== "paid";
    }

    // Doctors can edit their own reports (except paid ones)
    if (isDoctor && report.doctorId === userProfile.uid) {
      return report.status !== "paid";
    }

    // Fallback to general billing permission for draft reports only
    return canManageBilling && report.status === "draft";
  }, [report, userProfile, isSuperAdmin, role, isDoctor, canManageBilling]);

  const getEditRestrictionReason = () => {
    if (!report) return "Reporte no encontrado";

    if (report.status === "paid") {
      return "Los reportes pagados no pueden ser modificados por seguridad";
    }

    if (isDoctor && report.doctorId !== userProfile?.uid) {
      return "Solo puedes editar tus propios reportes";
    }

    if (!canManageBilling) {
      return "No tienes permisos para editar reportes de facturación";
    }

    return "No se puede editar este reporte";
  };

  const handleSave = (savedReportId: string) => {
    router.push(`/admin/billing/report/${savedReportId}`);
  };

  const handleCancel = () => {
    router.push(`/admin/billing/report/${reportId}`);
  };

  if (!canManageBilling) {
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
                No tienes permisos para editar reportes de facturación.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <EditReportSkeleton />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Error al cargar reporte
              </h3>
              <p className="text-gray-600 mb-4">
                {error || "No se pudo encontrar el reporte solicitado."}
              </p>
              <Button variant="outline" onClick={handleCancel}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 🆕 Enhanced restriction check
  if (!canEditReport) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Lock className="h-12 w-12 text-amber-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se puede editar
              </h3>
              <p className="text-gray-600 mb-4 max-w-md mx-auto">
                {getEditRestrictionReason()}
              </p>

              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-sm text-gray-600">Estado actual:</span>
                <Badge
                  variant={
                    report.status === "paid"
                      ? "default"
                      : report.status === "completed"
                      ? "secondary"
                      : report.status === "draft"
                      ? "outline"
                      : "destructive"
                  }
                >
                  {getBillingStatusLabel(report.status)}
                </Badge>
              </div>

              {/* 🆕 Show what actions are available */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 max-w-md mx-auto">
                <h4 className="font-medium text-blue-800 mb-2">
                  Acciones disponibles:
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  {report.status !== "paid" && (
                    <li>• Agregar pagos al reporte</li>
                  )}
                  <li>• Ver detalles completos</li>
                  <li>• Generar PDF (si está completado)</li>
                  {isSuperAdmin && <li>• Cambiar estado (como Super Admin)</li>}
                </ul>
              </div>

              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={handleCancel}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Ver Reporte
                </Button>
                {report.status !== "paid" && canManageBilling && (
                  <Button
                    onClick={() =>
                      router.push(`/admin/billing/report/${reportId}/payments`)
                    }
                  >
                    Gestionar Pagos
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6"
    >
      {/* 🆕 Edit context header */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-center gap-3">
          <Edit className="h-5 w-5 text-amber-600" />
          <div>
            <h4 className="font-medium text-amber-800">Editando Reporte</h4>
            <p className="text-sm text-amber-700">
              {report.status === "completed"
                ? "Puedes modificar servicios y agregar pagos a este reporte completado."
                : report.status === "partially_paid"
                ? "Este reporte tiene pagos parciales. Ten cuidado al modificar los servicios."
                : "Reporte en borrador - puedes hacer cualquier modificación."}
            </p>
          </div>
        </div>
      </div>

      <ReportForm
        reportId={reportId}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </motion.div>
  );
}
