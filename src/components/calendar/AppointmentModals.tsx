// src/components/calendar/AppointmentModals.tsx - ENHANCED VERSION WITH FIXED PERMISSIONS
"use client";
import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import { SlotInfo } from "react-big-calendar";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useBillingReport, useBillingReports } from "@/hooks/useBilling";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@radix-ui/react-tabs";
import {
  addAppointment,
  updateAppointment,
  deleteAppointment,
  getPatients,
  Patient,
  Appointment,
} from "@/lib/firebase/db";
import {
  CalendarEvent,
  getAppointmentStatusStyle,
  getAppointmentStatusLabel,
  getAppointmentTypeLabel,
} from "@/types/calendar";
import { BillingReport } from "@/types/billing";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Stethoscope,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit3,
  Trash2,
  AlertTriangle,
  Receipt,
  Plus,
  CreditCard,
  Download,
  DollarSign,
} from "lucide-react";

// ============================================================================
// ENHANCED APPOINTMENT DETAILS MODAL WITH FIXED PERMISSIONS
// ============================================================================

interface AppointmentDetailsModalProps {
  event: CalendarEvent | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export const AppointmentDetailsModal: React.FC<
  AppointmentDetailsModalProps
> = ({ event, open, onClose, onUpdate }) => {
  const { userProfile } = useAuth();
  const {
    canViewBilling,
    canManageBilling,
    isDoctor,
    isSuperAdmin,
    canEditAppointments,
    canDeleteAppointments,
  } = usePermissions();

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showQuickPayment, setShowQuickPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  // 🆕 BILLING INTEGRATION
  const {
    report,
    loading: reportLoading,
    loadReportByAppointment,
  } = useBillingReport();

  const { createReport } = useBillingReports();

  // 🔧 ENHANCED PERMISSION LOGIC
  const canDelete = React.useMemo(() => {
    if (!event?.resource.appointment) return false;

    const appointment = event.resource.appointment;

    // Super admin can delete any appointment
    if (isSuperAdmin) return true;

    // Doctors can delete their own appointments (unless completed/cancelled)
    if (isDoctor && appointment.doctorId === userProfile?.uid) {
      return (
        appointment.status !== "completed" && appointment.status !== "cancelled"
      );
    }

    // Reception can delete any appointment (unless completed)
    if (userProfile?.role === "recepcion") {
      return appointment.status !== "completed";
    }

    // Fallback to general permission
    return canDeleteAppointments;
  }, [event, userProfile, isSuperAdmin, isDoctor, canDeleteAppointments]);

  const canEdit = React.useMemo(() => {
    if (!event?.resource.appointment) return false;

    const appointment = event.resource.appointment;

    // Super admin can edit any appointment
    if (isSuperAdmin) return true;

    // Doctors can edit their own appointments
    if (isDoctor && appointment.doctorId === userProfile?.uid) {
      return true;
    }

    // Reception can edit most appointments
    if (userProfile?.role === "recepcion") {
      return true;
    }

    return canEditAppointments;
  }, [event, userProfile, isSuperAdmin, isDoctor, canEditAppointments]);

  const canCreateBillingReport = React.useMemo(() => {
    if (!event?.resource.appointment) return false;

    const appointment = event.resource.appointment;

    // Super admin can create any billing report
    if (isSuperAdmin) return true;

    // Doctors can create billing reports for their own appointments
    if (isDoctor && appointment.doctorId === userProfile?.uid) {
      return true;
    }

    // Reception can create billing reports
    if (userProfile?.role === "recepcion") {
      return true;
    }

    return canManageBilling;
  }, [event, userProfile, isSuperAdmin, isDoctor, canManageBilling]);

  const canViewBillingData = React.useMemo(() => {
    if (!event?.resource.appointment) return false;

    const appointment = event.resource.appointment;

    // Super admin can view any billing data
    if (isSuperAdmin) return true;

    // Doctors can view billing for their own appointments
    if (isDoctor && appointment.doctorId === userProfile?.uid) {
      return true;
    }

    // Reception can view billing data
    if (userProfile?.role === "recepcion") {
      return true;
    }

    return canViewBilling;
  }, [event, userProfile, isSuperAdmin, isDoctor, canViewBilling]);

  useEffect(() => {
    if (event?.resource.appointment && canViewBillingData) {
      if (event.resource.appointment.id) {
        loadReportByAppointment(event.resource.appointment.id);
      }
    }
  }, [event, canViewBillingData]);

  if (!event) return null;

  const { appointment, patient, doctor } = event.resource;

  // BILLING HELPER FUNCTIONS
  const formatCurrency = (amount: number, currency: "MXN" | "USD" = "MXN") => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const getBillingStatus = () => {
    if (!report)
      return {
        status: "no_report",
        label: "Sin Facturar",
        color: "bg-gray-100 text-gray-800",
      };

    switch (report.status) {
      case "draft":
        return {
          status: "draft",
          label: "Borrador",
          color: "bg-yellow-100 text-yellow-800",
        };
      case "completed":
        return {
          status: "completed",
          label: "Completado",
          color: "bg-blue-100 text-blue-800",
        };
      case "paid":
        return {
          status: "paid",
          label: "Pagado",
          color: "bg-green-100 text-green-800",
        };
      case "partially_paid":
        return {
          status: "partially_paid",
          label: "Pago Parcial",
          color: "bg-amber-100 text-amber-800",
        };
      case "overdue":
        return {
          status: "overdue",
          label: "Vencido",
          color: "bg-red-100 text-red-800",
        };
      default:
        return {
          status: "unknown",
          label: "Desconocido",
          color: "bg-gray-100 text-gray-800",
        };
    }
  };

  const handleCreateBillingReport = async () => {
    if (!appointment?.id || !canCreateBillingReport) return;

    try {
      setLoading(true);
      const reportId = await createReport(appointment.id);
      window.open(`/admin/billing/report/${reportId}`, "_blank");
    } catch (error) {
      console.error("Error creating billing report:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewBillingReport = () => {
    if (report?.id) {
      window.open(`/admin/billing/report/${report.id}`, "_blank");
    }
  };

  const handleEditBillingReport = () => {
    if (report?.id) {
      window.open(`/admin/billing/report/${report.id}/edit`, "_blank");
    }
  };

  const handleGeneratePDF = async () => {
    if (!report?.id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/billing/pdf/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: report.id }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `factura-${report.invoiceNumber || report.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setLoading(false);
    }
  };

  // HELPER FUNCTIONS
  const getStatusIcon = (status: Appointment["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      case "no_show":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleStatusUpdate = async (newStatus: Appointment["status"]) => {
    if (!appointment.id || !userProfile) return;

    try {
      setLoading(true);
      await updateAppointment(appointment.id, {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });
      onUpdate?.();
      onClose();
    } catch (error) {
      console.error("Error updating appointment status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAppointment = async () => {
    if (!appointment.id || !userProfile) return;

    try {
      setIsDeleting(true);
      await deleteAppointment(appointment.id);
      onUpdate?.();
      onClose();
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Error deleting appointment:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDateTime = (date: Date | Timestamp) => {
    const jsDate = date instanceof Date ? date : date.toDate();
    return new Intl.DateTimeFormat("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(jsDate);
  };

  const statusStyle = getAppointmentStatusStyle(appointment.status);
  const billingStatus = getBillingStatus();
  const canCreateReport = canCreateBillingReport && !report;
  const canAddPayment =
    canCreateBillingReport && report && report.pendingAmount > 0;
  const canGeneratePDF =
    report &&
    (report.status === "completed" ||
      report.status === "paid" ||
      report.status === "partially_paid");

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Detalles de la Cita
              </span>
              <div className="flex space-x-2">
                {canEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                )}
                {canDelete && appointment.status !== "cancelled" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {appointment.status === "completed"
                      ? "Eliminar"
                      : "Cancelar"}
                  </Button>
                )}
              </div>
            </DialogTitle>
            <DialogDescription>
              Información completa de la cita programada
            </DialogDescription>
          </DialogHeader>

          {/* 🆕 TABBED CONTENT */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="relative">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 relative">
                {/* Animated background indicator */}
                <motion.div
                  className="absolute top-0 left-0 h-full bg-white rounded-md shadow-sm z-0"
                  initial={false}
                  animate={{
                    x: activeTab === "details" ? "0%" : "100%",
                    width: canViewBillingData ? "50%" : "100%",
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                />

                <TabsTrigger
                  value="details"
                  className="flex items-center relative z-10 data-[state=active]:bg-transparent data-[state=active]:text-blue-600"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Detalles de la Cita
                </TabsTrigger>

                {canViewBillingData && (
                  <TabsTrigger
                    value="billing"
                    className="flex items-center relative z-10 data-[state=active]:bg-transparent data-[state=active]:text-blue-600"
                  >
                    <Receipt className="mr-2 h-4 w-4" />
                    Facturación
                    {report && (
                      <Badge className={`ml-2 text-xs ${billingStatus.color}`}>
                        {billingStatus.label}
                      </Badge>
                    )}
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            {/* APPOINTMENT DETAILS TAB */}
            <TabsContent value="details" className="space-y-6 mt-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(appointment.status)}
                    <Badge className={statusStyle.className}>
                      {getAppointmentStatusLabel(appointment.status)}
                    </Badge>
                  </div>
                </div>

                {/* Patient Information */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold flex items-center mb-3">
                    <User className="mr-2 h-4 w-4" />
                    Información del Paciente
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center">
                      <User className="mr-2 h-3 w-3 text-gray-500" />
                      <span className="font-medium">{patient.fullName}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="mr-2 h-3 w-3 text-gray-500" />
                      <a
                        href={`mailto:${patient.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {patient.email}
                      </a>
                    </div>
                    <div className="flex items-center">
                      <Phone className="mr-2 h-3 w-3 text-gray-500" />
                      <a
                        href={`tel:${patient.phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {patient.phone}
                      </a>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-3 w-3 text-gray-500" />
                      <span>
                        Última visita:{" "}
                        {patient.dentalHistory?.lastVisit
                          ? patient.dentalHistory.lastVisit
                              .toDate()
                              .toLocaleDateString("es-MX")
                          : "Primera visita"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Fecha y Hora
                    </Label>
                    <p className="mt-1">
                      {formatDateTime(appointment.appointmentDate)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Duración
                    </Label>
                    <p className="mt-1">{appointment.duration} minutos</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Tipo de Cita
                    </Label>
                    <p className="mt-1">
                      {getAppointmentTypeLabel(appointment.type)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Doctor
                    </Label>
                    <p className="mt-1">Dr. {doctor.name}</p>
                  </div>
                </div>

                {/* Reason for Visit */}
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Motivo de la Consulta
                  </Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded">
                    {appointment.reasonForVisit}
                  </p>
                </div>

                {/* Notes */}
                {appointment.notes && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Notas
                    </Label>
                    <p className="mt-1 p-3 bg-gray-50 rounded whitespace-pre-wrap">
                      {appointment.notes}
                    </p>
                  </div>
                )}

                {/* Quick Actions */}
                {canEdit &&
                  appointment.status !== "completed" &&
                  appointment.status !== "cancelled" && (
                    <div className="border-t pt-4">
                      <Label className="text-sm font-medium text-gray-600 mb-3 block">
                        Acciones Rápidas
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {appointment.status === "scheduled" && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate("confirmed")}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Confirmar
                          </Button>
                        )}
                        {(appointment.status === "scheduled" ||
                          appointment.status === "confirmed") && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate("in_progress")}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Clock className="mr-1 h-3 w-3" />
                            Iniciar
                          </Button>
                        )}
                        {appointment.status === "in_progress" && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate("completed")}
                            disabled={loading}
                            className="bg-gray-600 hover:bg-gray-700"
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Completar
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
              </motion.div>
            </TabsContent>

            {/* BILLING TAB */}
            {canViewBillingData && (
              <TabsContent value="billing" className="space-y-6 mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="space-y-6"
                >
                  <div className="bg-white border rounded-lg">
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold flex items-center">
                          <Receipt className="mr-2 h-4 w-4" />
                          Estado de Facturación
                        </h3>
                        <Badge className={billingStatus.color}>
                          {billingStatus.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Billing Status & Summary */}
                      {reportLoading ? (
                        <div className="flex items-center justify-center h-20">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                      ) : report ? (
                        <div className="space-y-4">
                          {/* Financial Summary */}
                          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                            <div className="flex justify-between">
                              <span className="font-medium">Total:</span>
                              <span className="font-semibold text-lg">
                                {formatCurrency(report.total)}
                              </span>
                            </div>
                            <div className="flex justify-between text-green-600">
                              <span>Pagado:</span>
                              <span className="font-semibold">
                                {formatCurrency(report.paidAmount)}
                              </span>
                            </div>
                            {report.pendingAmount > 0 && (
                              <div className="flex justify-between text-amber-600">
                                <span>Pendiente:</span>
                                <span className="font-semibold">
                                  {formatCurrency(report.pendingAmount)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Services Summary */}
                          {report.services.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2">Servicios:</h4>
                              <div className="space-y-2">
                                {report.services.map((service, index) => (
                                  <div
                                    key={index}
                                    className="flex justify-between text-sm bg-white p-2 rounded border"
                                  >
                                    <span>{service.description}</span>
                                    <span className="font-medium">
                                      {formatCurrency(service.total)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Invoice Number */}
                          {report.invoiceNumber && (
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">
                                Número de Factura:
                              </span>
                              <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                {report.invoiceNumber}
                              </span>
                            </div>
                          )}

                          {/* Payment History */}
                          {report.payments && report.payments.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2">
                                Historial de Pagos:
                              </h4>
                              <div className="space-y-2">
                                {report.payments.map((payment, index) => (
                                  <div
                                    key={index}
                                    className="flex justify-between text-sm bg-green-50 p-2 rounded"
                                  >
                                    <span>{payment.method}</span>
                                    <span className="font-medium">
                                      {formatCurrency(payment.amount)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium mb-2">
                            No se ha creado un reporte de facturación
                          </p>
                          <p className="text-sm">
                            Crea un reporte para gestionar la facturación de
                            esta cita
                          </p>
                        </div>
                      )}

                      <Separator />

                      {/* Billing Actions */}
                      <div className="space-y-3">
                        {canCreateReport && (
                          <Button
                            onClick={handleCreateBillingReport}
                            className="w-full"
                            disabled={loading}
                          >
                            {loading ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                Creando...
                              </div>
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-2" />
                                Crear Reporte de Facturación
                              </>
                            )}
                          </Button>
                        )}

                        {report && (
                          <div className="grid grid-cols-1 gap-2">
                            <Button
                              onClick={handleViewBillingReport}
                              variant="outline"
                              className="w-full"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Ver Reporte Completo
                            </Button>

                            {canCreateBillingReport && (
                              <Button
                                onClick={handleEditBillingReport}
                                variant="outline"
                                className="w-full"
                              >
                                <Edit3 className="h-4 w-4 mr-2" />
                                Editar Reporte
                              </Button>
                            )}

                            {canAddPayment && (
                              <Button
                                onClick={() => setShowQuickPayment(true)}
                                variant="outline"
                                className="w-full"
                              >
                                <CreditCard className="h-4 w-4 mr-2" />
                                Registrar Pago
                              </Button>
                            )}

                            {canGeneratePDF && (
                              <Button
                                onClick={handleGeneratePDF}
                                variant="outline"
                                className="w-full"
                                disabled={loading}
                              >
                                {loading ? (
                                  <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-500 mr-2"></div>
                                    Generando...
                                  </div>
                                ) : (
                                  <>
                                    <Download className="h-4 w-4 mr-2" />
                                    Generar PDF
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>
            )}
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            {canEdit && (
              <Button
                onClick={() => {
                  window.location.href = `/admin/patients/${patient.id}`;
                }}
              >
                <User className="mr-2 h-4 w-4" />
                Ver Perfil del Paciente
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Payment Modal */}
      {showQuickPayment && (
        <QuickPaymentModal
          isOpen={showQuickPayment}
          onClose={() => setShowQuickPayment(false)}
          reportId={report?.id}
          pendingAmount={report?.pendingAmount || 0}
          onPaymentAdded={() => {
            setShowQuickPayment(false);
            if (appointment.id) {
              loadReportByAppointment(appointment.id);
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Confirmar{" "}
              {appointment.status === "completed"
                ? "Eliminación"
                : "Cancelación"}
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres{" "}
              {appointment.status === "completed" ? "eliminar" : "cancelar"}{" "}
              esta cita?
              {appointment.status === "completed"
                ? " Esta acción no se puede deshacer y la cita será eliminada permanentemente."
                : " La cita será marcada como cancelada."}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-red-50 p-3 rounded-lg">
            <div className="space-y-1 text-sm">
              <p>
                <strong>Paciente:</strong> {patient.fullName}
              </p>
              <p>
                <strong>Fecha:</strong>{" "}
                {formatDateTime(appointment.appointmentDate)}
              </p>
              <p>
                <strong>Tipo:</strong>{" "}
                {getAppointmentTypeLabel(appointment.type)}
              </p>
              <p>
                <strong>Motivo:</strong> {appointment.reasonForVisit}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              No, Mantener Cita
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAppointment}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {appointment.status === "completed"
                    ? "Eliminando..."
                    : "Cancelando..."}
                </div>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Sí,{" "}
                  {appointment.status === "completed"
                    ? "Eliminar"
                    : "Cancelar"}{" "}
                  Cita
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Quick Payment Modal
function QuickPaymentModal({
  isOpen,
  onClose,
  reportId,
  pendingAmount,
  onPaymentAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  reportId?: string;
  pendingAmount: number;
  onPaymentAdded: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CreditCard className="mr-2 h-5 w-5" />
            Registrar Pago Rápido
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded">
            <p className="text-sm">
              <strong>Monto pendiente:</strong> ${pendingAmount.toFixed(2)}
            </p>
          </div>
          <p className="text-sm text-gray-500">
            Para registrar pagos completos, utiliza el reporte de facturación
            completo.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (reportId) {
                window.open(`/admin/billing/report/${reportId}`, "_blank");
              }
              onClose();
            }}
          >
            Ir al Reporte Completo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
