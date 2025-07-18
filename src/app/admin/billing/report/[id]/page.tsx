// src/app/admin/billing/report/[id]/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  Plus,
  X,
  Save,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBillingReport } from "@/hooks/useBilling";
import { usePermissions } from "@/hooks/usePermissions";
import {
  BillingReport,
  getBillingStatusLabel,
  getServiceCategoryLabel,
  BillingPaymentInput,
} from "@/types/billing";
import { getPaymentMethodLabel, PaymentMethod } from "@/types/sales";

// Enhanced Payment Management Component
const PaymentManager = ({
  report,
  onAddPayment,
  canManage,
}: {
  report: BillingReport;
  onAddPayment: (payment: BillingPaymentInput) => Promise<void>;
  canManage: boolean;
}) => {
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentForm, setPaymentForm] = useState<BillingPaymentInput>({
    amount: 0,
    method: "cash" as PaymentMethod,
    reference: "",
    notes: "",
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const handleAddPayment = async () => {
    if (paymentForm.amount <= 0) {
      alert("El monto debe ser mayor a 0");
      return;
    }

    if (paymentForm.amount > report.pendingAmount) {
      alert("El monto no puede ser mayor al saldo pendiente");
      return;
    }

    try {
      setLoading(true);
      await onAddPayment(paymentForm);

      // Reset form
      setPaymentForm({
        amount: 0,
        method: "cash" as PaymentMethod,
        reference: "",
        notes: "",
      });
      setShowAddPayment(false);
    } catch (error) {
      console.error("Error adding payment:", error);
      alert("Error al agregar el pago");
    } finally {
      setLoading(false);
    }
  };

  const getQuickPaymentOptions = () => {
    const pending = report.pendingAmount;
    const options = [];

    if (pending > 0) {
      options.push({
        label: "Pagar Total",
        amount: pending,
        description: `Liquidar ${formatCurrency(pending)}`,
      });
    }

    if (pending > 1000) {
      const half = Math.round(pending / 2);
      options.push({
        label: "Pago Parcial (50%)",
        amount: half,
        description: `Pagar ${formatCurrency(half)}`,
      });
    }

    if (pending > 500) {
      options.push({
        label: "Abono de $500",
        amount: 500,
        description: "Abono fijo de $500",
      });
    }

    return options;
  };

  return (
    <div className="space-y-4">
      {/* Quick Payment Actions */}
      {canManage && report.pendingAmount > 0 && (
        <div className="flex flex-wrap gap-2">
          {getQuickPaymentOptions().map((option, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => {
                setPaymentForm((prev) => ({ ...prev, amount: option.amount }));
                setShowAddPayment(true);
              }}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              <DollarSign className="h-4 w-4 mr-1" />
              {option.label}
            </Button>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddPayment(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Otro Monto
          </Button>
        </div>
      )}

      {/* Payment History */}
      <div className="space-y-3">
        {!report.payments || report.payments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No hay pagos registrados</p>
            {canManage && (
              <Button className="mt-2" onClick={() => setShowAddPayment(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Primer Pago
              </Button>
            )}
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
      </div>

      {/* Add Payment Dialog */}
      <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              Saldo pendiente: {formatCurrency(report.pendingAmount)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Monto del Pago *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={report.pendingAmount}
                value={paymentForm.amount || ""}
                onChange={(e) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    amount: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="method">Método de Pago *</Label>
              <Select
                value={paymentForm.method}
                onValueChange={(value) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    method: value as PaymentMethod,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="credit_card">
                    Tarjeta de Crédito
                  </SelectItem>
                  <SelectItem value="debit_card">Tarjeta de Débito</SelectItem>
                  <SelectItem value="bank_transfer">
                    Transferencia Bancaria
                  </SelectItem>
                  <SelectItem value="check">Cheque</SelectItem>
                  <SelectItem value="insurance">Seguro</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reference">Referencia</Label>
              <Input
                id="reference"
                value={paymentForm.reference}
                onChange={(e) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    reference: e.target.value,
                  }))
                }
                placeholder="Número de transacción, cheque, etc."
              />
            </div>

            <div>
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={paymentForm.notes}
                onChange={(e) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Observaciones adicionales..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddPayment(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddPayment}
              disabled={loading || paymentForm.amount <= 0}
            >
              {loading ? "Procesando..." : "Registrar Pago"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Status Manager Component
const StatusManager = ({
  report,
  onComplete,
  canManage,
}: {
  report: BillingReport;
  onComplete: (notes?: string) => Promise<void>;
  canManage: boolean;
}) => {
  const [showComplete, setShowComplete] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    try {
      setLoading(true);
      await onComplete(notes);
      setShowComplete(false);
      setNotes("");
    } catch (error) {
      console.error("Error completing report:", error);
      alert("Error al completar el reporte");
    } finally {
      setLoading(false);
    }
  };

  if (!canManage || report.status !== "draft") {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-amber-600" />
          <div>
            <h4 className="font-medium text-amber-800">Reporte en Borrador</h4>
            <p className="text-sm text-amber-700">
              Este reporte está en borrador. Complétalo para generar factura y
              habilitar pagos.
            </p>
          </div>
        </div>
      </div>

      <AlertDialog open={showComplete} onOpenChange={setShowComplete}>
        <AlertDialogTrigger asChild>
          <Button className="w-full">
            <CheckCircle className="h-4 w-4 mr-2" />
            Completar Reporte
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Completar Reporte de Facturación
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Al completar este reporte se generará un número de factura y se
                habilitarán los pagos. Esta acción no se puede deshacer.
              </p>

              <div className="space-y-2">
                <Label htmlFor="completion-notes">Notas (opcional)</Label>
                <Textarea
                  id="completion-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones sobre la finalización del reporte..."
                  rows={3}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete} disabled={loading}>
              {loading ? "Completando..." : "Completar Reporte"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Enhanced Service Item Component
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

// Enhanced Payment Item Component
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
    className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200"
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

// Main Component
export default function BillingReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const { canViewBilling, canManageBilling, canProcessPaymentsFor } =
    usePermissions();
  const {
    report,
    loading,
    error,
    loadReport,
    addPayment,
    completeReport,
    refreshReport,
  } = useBillingReport();

  useEffect(() => {
    if (reportId && canViewBilling) {
      loadReport(reportId);
    }
  }, [reportId, canViewBilling, loadReport]);

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

  const canManagePayments =
    canProcessPaymentsFor?.(report?.doctorId) || canManageBilling;

  const handleEdit = () => {
    router.push(`/admin/billing/report/${reportId}/edit`);
  };

  const handleBack = () => {
    router.push("/admin/billing/");
  };

  const handleGeneratePDF = () => {
    console.log("Generate PDF for report:", reportId);
  };

  const handleSendEmail = () => {
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
        {/* Loading skeleton would go here */}
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        </div>
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
              <Badge variant={getStatusBadgeVariant(report.status) as any}>
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
            <Button variant="outline" onClick={handleEdit}>
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

          {/* Payments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Gestión de Pagos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentManager
                report={report}
                onAddPayment={addPayment}
                canManage={canManagePayments}
              />
            </CardContent>
          </Card>

          {/* Notes Section */}
          {(report.notes || report.internalNotes) && (
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
          )}
        </div>

        {/* Right Column - Summary and Actions */}
        <div className="space-y-6">
          {/* Status Management */}
          <StatusManager
            report={report}
            onComplete={completeReport}
            canManage={canManageBilling}
          />

          {/* Financial Summary */}
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

                {/* Payment Progress Bar */}
                {report.total > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progreso de Pago</span>
                      <span>
                        {((report.paidAmount / report.total) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            (report.paidAmount / report.total) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Report Information */}
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
                  <span className="font-mono text-xs">{report.patientId}</span>
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

          {/* Quick Actions */}
          {canManagePayments && report.status !== "draft" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Receipt className="h-5 w-5 mr-2" />
                  Acciones Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.pendingAmount > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800">
                        Pago Pendiente
                      </span>
                    </div>
                    <p className="text-xs text-amber-700 mb-2">
                      Hay {formatCurrency(report.pendingAmount)} pendientes de
                      pago
                    </p>
                  </div>
                )}

                {report.status === "paid" && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Completamente Pagado
                      </span>
                    </div>
                    <p className="text-xs text-green-700">
                      Este reporte está totalmente liquidado
                    </p>
                  </div>
                )}

                {report.status === "partially_paid" && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        Pago Parcial
                      </span>
                    </div>
                    <p className="text-xs text-blue-700">
                      {formatCurrency(report.paidAmount)} de{" "}
                      {formatCurrency(report.total)} pagado
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Status History */}
          {report.statusHistory && report.statusHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Historial de Estado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.statusHistory.slice(-5).map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {entry.details}
                        </div>
                        <div className="text-xs text-gray-500">
                          {entry.performedAt &&
                            new Date(
                              entry.performedAt.toDate()
                            ).toLocaleDateString("es-MX", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                        </div>
                      </div>
                      {entry.amount && (
                        <div className="text-sm font-medium">
                          {formatCurrency(entry.amount)}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
