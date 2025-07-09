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
} from "lucide-react";
import { motion } from "framer-motion";
import { useBillingReport } from "@/hooks/useBilling";
import { usePermissions } from "@/hooks/usePermissions";
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

  const { canManageBilling } = usePermissions();
  const { report, loading, error, loadReport } = useBillingReport();

  useEffect(() => {
    if (reportId && canManageBilling) {
      loadReport(reportId);
    }
  }, [reportId, canManageBilling]);

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

  if (report.status !== "draft") {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se puede editar
              </h3>
              <p className="text-gray-600 mb-4">
                Solo los reportes en estado "Borrador" pueden ser editados.
              </p>
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-sm text-gray-600">Estado actual:</span>
                <Badge>{getBillingStatusLabel(report.status)}</Badge>
              </div>
              <Button variant="outline" onClick={handleCancel}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ver Reporte
              </Button>
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
      <ReportForm
        reportId={reportId}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </motion.div>
  );
}
