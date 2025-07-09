import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Save,
  FileText,
  Calculator,
  CreditCard,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Receipt,
} from "lucide-react";
import { useBillingReport } from "@/hooks/useBilling";
import { usePermissions } from "@/hooks/usePermissions";
import {
  BillingService,
  BillingPayment,
  BillingPaymentInput,
  DentalServiceCategory,
  getServiceCategoryLabel,
  getBillingStatusLabel,
  MEXICAN_TAX_RATE,
  calculateTax,
  calculateTotal,
} from "@/types/billing";
import { PaymentMethod, getPaymentMethodLabel } from "@/types/sales";

interface BillingReportFormProps {
  reportId?: string;
  appointmentId?: string;
  onSave?: (reportId: string) => void;
  onCancel?: () => void;
}

export default function BillingReportForm({
  reportId,
  appointmentId,
  onSave,
  onCancel,
}: BillingReportFormProps) {
  const { canManageBilling, canViewBilling } = usePermissions();

  const {
    report,
    loading,
    error,
    loadReport,
    loadReportByAppointment,
    updateServices,
    addPayment,
    completeReport,
    updateNotes,
  } = useBillingReport(reportId);

  // Form state
  const [services, setServices] = useState<BillingService[]>([]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Payment form state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState<BillingPaymentInput>({
    amount: 0,
    method: "cash" as PaymentMethod,
    reference: "",
    notes: "",
  });

  // Service form state
  const [newService, setNewService] = useState({
    description: "",
    quantity: 1,
    unitPrice: 0,
    category: "consultation" as DentalServiceCategory,
    procedureCode: "",
    tooth: [] as string[],
  });

  // Load report data
  useEffect(() => {
    if (reportId) {
      loadReport(reportId);
    } else if (appointmentId) {
      loadReportByAppointment(appointmentId);
    }
  }, [reportId, appointmentId]);

  // Update form when report loads
  useEffect(() => {
    if (report) {
      setServices(report.services || []);
      setDiscount(report.discount || 0);
      setNotes(report.notes || "");
      setInternalNotes(report.internalNotes || "");
    }
  }, [report]);

  // Calculate totals
  const subtotal = services.reduce((sum, service) => sum + service.total, 0);
  const tax = calculateTax(subtotal);
  const total = calculateTotal(subtotal, tax, discount);
  const paidAmount = report?.paidAmount || 0;
  const pendingAmount = total - paidAmount;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Add service
  const handleAddService = () => {
    if (!newService.description || newService.unitPrice <= 0) {
      return;
    }

    const service: BillingService = {
      id: `service_${Date.now()}`,
      description: newService.description,
      quantity: newService.quantity,
      unitPrice: newService.unitPrice,
      total: newService.quantity * newService.unitPrice,
      category: newService.category,
      procedureCode: newService.procedureCode || undefined,
      tooth: newService.tooth.length > 0 ? newService.tooth : undefined,
    };

    setServices([...services, service]);

    // Reset form
    setNewService({
      description: "",
      quantity: 1,
      unitPrice: 0,
      category: "consultation",
      procedureCode: "",
      tooth: [],
    });
  };

  // Remove service
  const handleRemoveService = (serviceId: string) => {
    setServices(services.filter((s) => s.id !== serviceId));
  };

  // Update service
  const handleUpdateService = (
    serviceId: string,
    updates: Partial<BillingService>
  ) => {
    setServices(
      services.map((service) =>
        service.id === serviceId
          ? {
              ...service,
              ...updates,
              total:
                (updates.quantity || service.quantity) *
                (updates.unitPrice || service.unitPrice),
            }
          : service
      )
    );
  };

  // Save services
  const handleSaveServices = async () => {
    if (!canManageBilling) return;

    try {
      setIsSaving(true);
      await updateServices(services, discount);
      // Optionally show success message
    } catch (error) {
      console.error("Error saving services:", error);
      // Show error message
    } finally {
      setIsSaving(false);
    }
  };

  // Add payment
  const handleAddPayment = async () => {
    if (!canManageBilling || paymentForm.amount <= 0) return;

    try {
      await addPayment({
        amount: paymentForm.amount,
        method: paymentForm.method,
        reference: paymentForm.reference,
        notes: paymentForm.notes,
      });

      setShowPaymentForm(false);
      setPaymentForm({
        amount: 0,
        method: "cash",
        reference: "",
        notes: "",
      });
    } catch (error) {
      console.error("Error adding payment:", error);
    }
  };

  // Complete report
  const handleCompleteReport = async () => {
    if (!canManageBilling) return;

    try {
      await completeReport(notes);
      if (onSave && report?.id) {
        onSave(report.id);
      }
    } catch (error) {
      console.error("Error completing report:", error);
    }
  };

  // Save notes
  const handleSaveNotes = async () => {
    if (!canManageBilling) return;

    try {
      await updateNotes(notes, internalNotes);
    } catch (error) {
      console.error("Error saving notes:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !appointmentId) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Error al cargar el reporte: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {report ? `Reporte de Facturación` : "Nuevo Reporte"}
            </h1>
            {report && (
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">
                  {getBillingStatusLabel(report.status)}
                </Badge>
                {report.invoiceNumber && (
                  <span className="text-sm font-mono text-gray-600">
                    {report.invoiceNumber}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {report?.status === "draft" && canManageBilling && (
            <Button
              onClick={handleCompleteReport}
              disabled={services.length === 0}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Completar Reporte
            </Button>
          )}
          {(report?.status === "completed" || report?.status === "paid") && (
            <Button variant="outline">
              <Receipt className="h-4 w-4 mr-2" />
              Generar PDF
            </Button>
          )}
        </div>
      </div>

      {/* Services Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Servicios Prestados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Service Form */}
          {canManageBilling && report?.status === "draft" && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-4">
              <h4 className="font-medium text-gray-900">Agregar Servicio</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="service-description">Descripción *</Label>
                  <Input
                    id="service-description"
                    value={newService.description}
                    onChange={(e) =>
                      setNewService({
                        ...newService,
                        description: e.target.value,
                      })
                    }
                    placeholder="Ej: Limpieza dental"
                  />
                </div>

                <div>
                  <Label htmlFor="service-category">Categoría</Label>
                  <Select
                    value={newService.category}
                    onValueChange={(value) =>
                      setNewService({
                        ...newService,
                        category: value as DentalServiceCategory,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultation">Consulta</SelectItem>
                      <SelectItem value="preventive">Preventivo</SelectItem>
                      <SelectItem value="restorative">Restaurativo</SelectItem>
                      <SelectItem value="surgical">Cirugía</SelectItem>
                      <SelectItem value="cosmetic">Estética</SelectItem>
                      <SelectItem value="orthodontic">Ortodoncia</SelectItem>
                      <SelectItem value="periodontal">Periodoncia</SelectItem>
                      <SelectItem value="endodontic">Endodoncia</SelectItem>
                      <SelectItem value="prosthetic">Prótesis</SelectItem>
                      <SelectItem value="pediatric">Odontopediatría</SelectItem>
                      <SelectItem value="emergency">Emergencia</SelectItem>
                      <SelectItem value="other">Otros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="service-quantity">Cantidad</Label>
                  <Input
                    id="service-quantity"
                    type="number"
                    min="1"
                    value={newService.quantity}
                    onChange={(e) =>
                      setNewService({
                        ...newService,
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="service-price">Precio Unitario *</Label>
                  <Input
                    id="service-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newService.unitPrice}
                    onChange={(e) =>
                      setNewService({
                        ...newService,
                        unitPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="service-code">Código de Procedimiento</Label>
                  <Input
                    id="service-code"
                    value={newService.procedureCode}
                    onChange={(e) =>
                      setNewService({
                        ...newService,
                        procedureCode: e.target.value,
                      })
                    }
                    placeholder="Ej: D1110"
                  />
                </div>

                <div>
                  <Label htmlFor="service-tooth">Dientes Afectados</Label>
                  <Input
                    id="service-tooth"
                    value={newService.tooth.join(", ")}
                    onChange={(e) =>
                      setNewService({
                        ...newService,
                        tooth: e.target.value
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Ej: 16, 17, 18"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={handleAddService}
                    disabled={
                      !newService.description || newService.unitPrice <= 0
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Services List */}
          <div className="space-y-3">
            {services.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No hay servicios agregados</p>
              </div>
            ) : (
              services.map((service) => (
                <div
                  key={service.id}
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
                      Cantidad: {service.quantity} | Precio:{" "}
                      {formatCurrency(service.unitPrice)}
                      {service.tooth && service.tooth.length > 0 && (
                        <span className="ml-2">
                          | Dientes: {service.tooth.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrency(service.total)}
                      </div>
                    </div>

                    {canManageBilling && report?.status === "draft" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveService(service.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Discount Section */}
          {canManageBilling &&
            report?.status === "draft" &&
            services.length > 0 && (
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <Label htmlFor="discount">Descuento:</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-32"
                />
                <span className="text-sm text-gray-500">MXN</span>
              </div>
            )}

          {/* Save Services Button */}
          {canManageBilling && report?.status === "draft" && (
            <div className="flex justify-end">
              <Button
                onClick={handleSaveServices}
                disabled={isSaving || services.length === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Guardando..." : "Guardar Servicios"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Totals Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            Resumen Financiero
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Descuento:</span>
                <span className="font-semibold">
                  -{formatCurrency(discount)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>IVA (16%):</span>
              <span className="font-semibold">{formatCurrency(tax)}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
            {report && (
              <>
                <div className="flex justify-between text-green-600">
                  <span>Pagado:</span>
                  <span className="font-semibold">
                    {formatCurrency(paidAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Pendiente:</span>
                  <span
                    className={`font-semibold ${
                      pendingAmount > 0 ? "text-amber-600" : "text-green-600"
                    }`}
                  >
                    {formatCurrency(pendingAmount)}
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payments Section */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Pagos Registrados
              </div>
              {canManageBilling && pendingAmount > 0 && (
                <Button size="sm" onClick={() => setShowPaymentForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Pago
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Payment Form */}
            {showPaymentForm && (
              <div className="p-4 bg-blue-50 rounded-lg space-y-4">
                <h4 className="font-medium text-gray-900">Registrar Pago</h4>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="payment-amount">Monto *</Label>
                    <Input
                      id="payment-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      max={pendingAmount}
                      value={paymentForm.amount}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          amount: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                    />
                    <span className="text-xs text-gray-500">
                      Máximo: {formatCurrency(pendingAmount)}
                    </span>
                  </div>

                  <div>
                    <Label htmlFor="payment-method">Método de Pago</Label>
                    <Select
                      value={paymentForm.method}
                      onValueChange={(value) =>
                        setPaymentForm({
                          ...paymentForm,
                          method: value as PaymentMethod,
                        })
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
                        <SelectItem value="debit_card">
                          Tarjeta de Débito
                        </SelectItem>
                        <SelectItem value="bank_transfer">
                          Transferencia
                        </SelectItem>
                        <SelectItem value="check">Cheque</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="payment-reference">Referencia</Label>
                    <Input
                      id="payment-reference"
                      value={paymentForm.reference}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          reference: e.target.value,
                        })
                      }
                      placeholder="Núm. transacción, cheque, etc."
                    />
                  </div>

                  <div>
                    <Label htmlFor="payment-notes">Notas</Label>
                    <Input
                      id="payment-notes"
                      value={paymentForm.notes}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          notes: e.target.value,
                        })
                      }
                      placeholder="Notas adicionales"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPaymentForm(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAddPayment}
                    disabled={
                      paymentForm.amount <= 0 ||
                      paymentForm.amount > pendingAmount
                    }
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Registrar Pago
                  </Button>
                </div>
              </div>
            )}

            {/* Payments List */}
            <div className="space-y-3">
              {report.payments && report.payments.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <CreditCard className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No hay pagos registrados</p>
                </div>
              ) : (
                report.payments?.map((payment, index) => (
                  <div
                    key={payment.id}
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
                          new Date(payment.date.toDate()).toLocaleDateString(
                            "es-MX"
                          )}
                        {payment.notes && ` | ${payment.notes}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        {formatCurrency(payment.amount)}
                      </div>
                      {payment.verified && (
                        <div className="text-xs text-green-600 flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verificado
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle>Notas y Observaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="notes">Notas para el Cliente</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas que aparecerán en la factura..."
              rows={3}
              disabled={!canManageBilling}
            />
          </div>

          <div>
            <Label htmlFor="internal-notes">Notas Internas</Label>
            <Textarea
              id="internal-notes"
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Notas internas (no visibles para el cliente)..."
              rows={3}
              disabled={!canManageBilling}
            />
          </div>

          {canManageBilling && (
            <div className="flex justify-end">
              <Button onClick={handleSaveNotes}>
                <Save className="h-4 w-4 mr-2" />
                Guardar Notas
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
