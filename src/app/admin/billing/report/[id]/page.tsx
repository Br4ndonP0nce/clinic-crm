// src/app/admin/billing/report/[id]/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  FileText,
  Edit,
  Download,
  Receipt,
  Calendar,
  User,
  DollarSign,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Printer,
  Mail,
  Share2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useBillingReport } from "@/hooks/useBilling";
import { usePermissions } from "@/hooks/usePermissions";
import {
  BillingReport,
  getBillingStatusLabel,
  getServiceCategoryLabel,
} from "@/types/billing";
import { getPaymentMethodLabel } from "@/types/sales";

// Skeleton Components
const ReportDetailSkeleton = () => (
  <div className="space-y-6">
    {/* Header Skeleton */}
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>

    {/* Content Skeletons */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

// Service Item Component
const ServiceItem = ({
  service,
  currency,
}: {
  service: any;
  currency: (amount: number) => string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center justify-between p-4 border rounded-lg"
  >
    <div className="flex-1">
      <div className="flex items-center gap-3 mb-2">
        <h5 className="font-medium">{service.description}</h5>
        <Badge variant="outline">
          {getServiceCategoryLabel(service.category)}
        </Badge>
        {service.procedureCode && (
          <span className="text-xs text-gray-500 font-mono">
            {service.procedureCode}
          </span>
        )}
      </div>
      <div className="text-sm text-gray-600">
        Cantidad: {service.quantity} | Precio: {currency(service.unitPrice)}
        {service.tooth && service.tooth.length > 0 && (
          <span className="ml-2">| Dientes: {service.tooth.join(", ")}</span>
        )}
      </div>
    </div>
    <div className="text-right">
      <div className="font-semibold">{currency(service.total)}</div>
    </div>
  </motion.div>
);

// Payment Item Component
const PaymentItem = ({
  payment,
  currency,
}: {
  payment: any;
  currency: (amount: number) => string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center justify-between p-3 border rounded-lg"
  >
    <div>
      <div className="flex items-center gap-3 mb-1">
        <span className="font-medium">
          {getPaymentMethodLabel(payment.method)}
        </span>
        {payment.reference && (
          <span className="text-sm text-gray-500 font-mono">
            {payment.reference}
          </span>
        )}
      </div>
      <div className="text-sm text-gray-600">
        {payment.date &&
          new Date(payment.date.toDate()).toLocaleDateString("es-MX")}
        {payment.notes && ` | ${payment.notes}`}
      </div>
    </div>
    <div className="text-right">
      <div className="font-semibold text-green-600">
        {currency(payment.amount)}
      </div>
      {payment.verified && (
        <div className="text-xs text-green-600 flex items-center">
          <CheckCircle className="h-3 w-3 mr-1" />
          Verificado
        </div>
      )}
    </div>
  </motion.div>
);

// Status History Component
const StatusHistory = ({ history }: { history: any[] }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center">
        <Clock className="h-5 w-5 mr-2" />
        Historial de Estado
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {history.map((entry, index) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
          >
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
            <div className="flex-1">
              <div className="font-medium text-sm">{entry.details}</div>
              <div className="text-xs text-gray-500">
                {entry.performedAt &&
                  new Date(entry.performedAt.toDate()).toLocaleDateString(
                    "es-MX",
                    {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
              </div>
            </div>
            {entry.amount && (
              <div className="text-sm font-medium">
                ${entry.amount.toFixed(2)}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Main Component
export default function BillingReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const { canViewBilling, canManageBilling } = usePermissions();
  const { report, loading, error, loadReport } = useBillingReport();

  useEffect(() => {
    if (reportId && canViewBilling) {
      loadReport(reportId);
    }
  }, [reportId, canViewBilling]);

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

  const handleEdit = () => {
    router.push(`/admin/billing/report/${reportId}/edit`);
  };

  const handleBack = () => {
    router.push("/admin/billing/");
  };

  const handleGeneratePDF = () => {
    // Implement PDF generation
    console.log("Generate PDF for report:", reportId);
  };

  const handleSendEmail = () => {
    // Implement email sending
    console.log("Send email for report:", reportId);
  };

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
                No tienes permisos para ver este reporte de facturación.
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
        <ReportDetailSkeleton />
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
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Reportes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Reporte de Facturación
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={getStatusBadgeVariant(report.status)}>
                {getBillingStatusLabel(report.status)}
              </Badge>
              {report.invoiceNumber && (
                <span className="text-sm font-mono text-gray-600">
                  {report.invoiceNumber}
                </span>
              )}
              <span className="text-sm text-gray-500">
                Creado: {formatDate(report.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canManageBilling && (
            <Button
              variant="outline"
              onClick={handleEdit} // This should now work!
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}

          {(report.status === "completed" ||
            report.status === "paid" ||
            report.status === "partially_paid") && (
            <>
              <Button variant="outline" onClick={handleGeneratePDF}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" onClick={handleSendEmail}>
                <Mail className="h-4 w-4 mr-2" />
                Enviar
              </Button>
            </>
          )}

          <Button variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            Compartir
          </Button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Services and Payments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Services Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Servicios Prestados ({report.services.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.services.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No hay servicios registrados</p>
                  </div>
                ) : (
                  report.services.map((service) => (
                    <ServiceItem
                      key={service.id}
                      service={service}
                      currency={formatCurrency}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Payments Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Pagos Registrados ({report.payments?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!report.payments || report.payments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No hay pagos registrados</p>
                  </div>
                ) : (
                  report.payments.map((payment) => (
                    <PaymentItem
                      key={payment.id}
                      payment={payment}
                      currency={formatCurrency}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Notes Section */}
          {(report.notes || report.internalNotes) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Notas y Observaciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {report.notes && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">
                        Notas para el Cliente:
                      </h4>
                      <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {report.notes}
                      </p>
                    </div>
                  )}
                  {report.internalNotes && canManageBilling && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">
                        Notas Internas:
                      </h4>
                      <p className="text-gray-600 bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-200">
                        {report.internalNotes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Right Column - Summary and Info */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Resumen Financiero
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">
                      {formatCurrency(report.subtotal)}
                    </span>
                  </div>
                  {report.discount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Descuento:</span>
                      <span className="font-semibold">
                        -{formatCurrency(report.discount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">IVA (16%):</span>
                    <span className="font-semibold">
                      {formatCurrency(report.tax)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(report.total)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-green-600">
                    <span>Pagado:</span>
                    <span className="font-semibold">
                      {formatCurrency(report.paidAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pendiente:</span>
                    <span
                      className={`font-semibold ${
                        report.pendingAmount > 0
                          ? "text-amber-600"
                          : "text-green-600"
                      }`}
                    >
                      {formatCurrency(report.pendingAmount)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Report Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Información del Reporte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID del Reporte:</span>
                    <span className="font-mono text-xs">{report.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cita ID:</span>
                    <span className="font-mono text-xs">
                      {report.appointmentId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paciente ID:</span>
                    <span className="font-mono text-xs">
                      {report.patientId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Doctor ID:</span>
                    <span className="font-mono text-xs">{report.doctorId}</span>
                  </div>
                  {report.invoiceDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha Factura:</span>
                      <span>{formatDate(report.invoiceDate)}</span>
                    </div>
                  )}
                  {report.dueDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha Vencimiento:</span>
                      <span
                        className={
                          report.dueDate.toDate() < new Date() &&
                          report.pendingAmount > 0
                            ? "text-red-600 font-semibold"
                            : ""
                        }
                      >
                        {formatDate(report.dueDate)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Creado:</span>
                    <span>{formatDate(report.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Actualizado:</span>
                    <span>{formatDate(report.updatedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">PDF Generado:</span>
                    <span className="flex items-center">
                      {report.pdfGenerated ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                          Sí
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4 text-gray-400 mr-1" />
                          No
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Status History */}
          {report.statusHistory && report.statusHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <StatusHistory history={report.statusHistory} />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
