// src/components/calendar/AppointmentModals.tsx - ENHANCED for Multiple Reports
"use client";
import { motion, AnimatePresence } from "framer-motion";
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
  getBillingReportsByAppointment,
  getAppointmentBillingSummary,
  createBillingReport,
  duplicateBillingReport,
  archiveBillingReport,
  createPartialReport,
  createEmergencyAddonReport,
  createProductSaleReport,
  getReportTypeLabel,
  BillingReportSummary,
  BillingReportType,
} from "@/lib/firebase/billing";
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
  Copy,
  Archive,
  Link,
  ShoppingCart,
  Zap,
  Heart,
  Eye,
  TrendingUp,
} from "lucide-react";

// ============================================================================
// ENHANCED APPOINTMENT DETAILS MODAL WITH MULTIPLE REPORTS SUPPORT
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
  const [showCreateReportModal, setShowCreateReportModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  // 🆕 MULTIPLE REPORTS STATE
  const [billingReports, setBillingReports] = useState<BillingReportSummary[]>(
    []
  );
  const [billingSummary, setBillingSummary] = useState<any>(null);
  const [reportsLoading, setReportsLoading] = useState(false);

  // 🔧 ENHANCED PERMISSION LOGIC
  const canDelete = React.useMemo(() => {
    if (!event?.resource.appointment) return false;
    const appointment = event.resource.appointment;
    if (isSuperAdmin) return true;
    if (isDoctor && appointment.doctorId === userProfile?.uid) {
      return (
        appointment.status !== "completed" && appointment.status !== "cancelled"
      );
    }
    if (userProfile?.role === "recepcion") {
      return appointment.status !== "completed";
    }
    return canDeleteAppointments;
  }, [event, userProfile, isSuperAdmin, isDoctor, canDeleteAppointments]);

  const canEdit = React.useMemo(() => {
    if (!event?.resource.appointment) return false;
    const appointment = event.resource.appointment;
    if (isSuperAdmin) return true;
    if (isDoctor && appointment.doctorId === userProfile?.uid) return true;
    if (userProfile?.role === "recepcion") return true;
    return canEditAppointments;
  }, [event, userProfile, isSuperAdmin, isDoctor, canEditAppointments]);

  const canCreateBillingReport = React.useMemo(() => {
    if (!event?.resource.appointment) return false;
    const appointment = event.resource.appointment;
    if (isSuperAdmin) return true;
    if (isDoctor && appointment.doctorId === userProfile?.uid) return true;
    if (userProfile?.role === "recepcion") return true;
    return canManageBilling;
  }, [event, userProfile, isSuperAdmin, isDoctor, canManageBilling]);

  const canViewBillingData = React.useMemo(() => {
    if (!event?.resource.appointment) return false;
    const appointment = event.resource.appointment;
    if (isSuperAdmin) return true;
    if (isDoctor && appointment.doctorId === userProfile?.uid) return true;
    if (userProfile?.role === "recepcion") return true;
    return canViewBilling;
  }, [event, userProfile, isSuperAdmin, isDoctor, canViewBilling]);

  // 🆕 LOAD MULTIPLE BILLING REPORTS
  useEffect(() => {
    const loadBillingData = async () => {
      if (!event?.resource.appointment || !canViewBillingData) return;

      try {
        setReportsLoading(true);
        const appointmentId = event.resource.appointment.id;

        if (appointmentId) {
          const [reports, summary] = await Promise.all([
            getBillingReportsByAppointment(appointmentId),
            getAppointmentBillingSummary(appointmentId),
          ]);

          setBillingReports(reports);
          setBillingSummary(summary);
        }
      } catch (error) {
        console.error("Error loading billing data:", error);
      } finally {
        setReportsLoading(false);
      }
    };

    if (open) {
      loadBillingData();
    }
  }, [event, canViewBillingData, open]);

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

  const getOverallBillingStatus = () => {
    if (!billingSummary || billingSummary.totalReports === 0) {
      return {
        status: "no_reports",
        label: "Sin Facturar",
        color: "bg-gray-100 text-gray-800",
      };
    }

    if (billingSummary.totalPending === 0) {
      return {
        status: "fully_paid",
        label: "Totalmente Pagado",
        color: "bg-green-100 text-green-800",
      };
    }

    if (billingSummary.totalPaid > 0) {
      return {
        status: "partially_paid",
        label: "Pago Parcial",
        color: "bg-amber-100 text-amber-800",
      };
    }

    if (billingSummary.hasCompletedReports) {
      return {
        status: "completed",
        label: "Completado",
        color: "bg-blue-100 text-blue-800",
      };
    }

    return {
      status: "draft",
      label: "Borrador",
      color: "bg-yellow-100 text-yellow-800",
    };
  };

  // REPORT MANAGEMENT FUNCTIONS
  const handleCreateReport = async (
    reportType: BillingReportType,
    title: string
  ) => {
    if (!appointment?.id || !canCreateBillingReport) return;

    try {
      setLoading(true);
      const reportId = await createBillingReport(
        appointment.id,
        userProfile?.uid || "",
        {
          reportType,
          title,
          description: `${getReportTypeLabel(reportType)} for appointment`,
          isPartialReport: reportType !== "complete_visit",
        }
      );

      // Reload billing data
      const [reports, summary] = await Promise.all([
        getBillingReportsByAppointment(appointment.id),
        getAppointmentBillingSummary(appointment.id),
      ]);
      setBillingReports(reports);
      setBillingSummary(summary);

      setShowCreateReportModal(false);

      // Open the new report for editing
      window.open(`/admin/billing/report/${reportId}/edit`, "_blank");
    } catch (error) {
      console.error("Error creating billing report:", error);
      alert("Error al crear el reporte de facturación");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickReport = async (
    type: "emergency" | "product" | "partial"
  ) => {
    if (!appointment?.id || !canCreateBillingReport) return;

    try {
      setLoading(true);
      let reportId: string;

      switch (type) {
        case "emergency":
          reportId = await createEmergencyAddonReport(
            appointment.id,
            [], // Empty services - user will add them in edit mode
            userProfile?.uid || ""
          );
          break;
        case "product":
          reportId = await createProductSaleReport(
            appointment.id,
            [], // Empty products - user will add them
            userProfile?.uid || ""
          );
          break;
        case "partial":
          reportId = await createPartialReport(
            appointment.id,
            "Tratamiento Adicional",
            [], // Empty services
            userProfile?.uid || ""
          );
          break;
      }

      // Reload billing data
      const [reports, summary] = await Promise.all([
        getBillingReportsByAppointment(appointment.id),
        getAppointmentBillingSummary(appointment.id),
      ]);
      setBillingReports(reports);
      setBillingSummary(summary);

      // Open for editing
      window.open(`/admin/billing/report/${reportId}/edit`, "_blank");
    } catch (error) {
      console.error("Error creating quick report:", error);
      alert("Error al crear el reporte rápido");
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateReport = async (sourceReportId: string) => {
    try {
      setLoading(true);
      const reportId = await duplicateBillingReport(
        sourceReportId,
        userProfile?.uid || "",
        {
          newTitle: `Copia - ${new Date().toLocaleDateString()}`,
          newDescription: "Reporte duplicado",
          reportType: "partial_treatment",
          includeServices: true,
          includePayments: false,
        }
      );

      // Reload billing data
      if (appointment?.id) {
        const [reports, summary] = await Promise.all([
          getBillingReportsByAppointment(appointment.id),
          getAppointmentBillingSummary(appointment.id),
        ]);
        setBillingReports(reports);
        setBillingSummary(summary);
      }

      window.open(`/admin/billing/report/${reportId}/edit`, "_blank");
    } catch (error) {
      console.error("Error duplicating report:", error);
      alert("Error al duplicar el reporte");
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveReport = async (reportId: string) => {
    if (!confirm("¿Estás seguro de que quieres archivar este reporte?")) return;

    try {
      setLoading(true);
      await archiveBillingReport(
        reportId,
        userProfile?.uid || "",
        "Archived from appointment modal"
      );

      // Reload billing data
      if (appointment?.id) {
        const [reports, summary] = await Promise.all([
          getBillingReportsByAppointment(appointment.id),
          getAppointmentBillingSummary(appointment.id),
        ]);
        setBillingReports(reports);
        setBillingSummary(summary);
      }
    } catch (error) {
      console.error("Error archiving report:", error);
      alert("Error al archivar el reporte");
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (reportId: string) => {
    window.open(`/admin/billing/report/${reportId}`, "_blank");
  };

  const handleEditReport = (reportId: string) => {
    window.open(`/admin/billing/report/${reportId}/edit`, "_blank");
  };

  const handleGeneratePDF = async (reportId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/billing/pdf/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `factura-${reportId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error al generar el PDF");
    } finally {
      setLoading(false);
    }
  };

  // OTHER HELPER FUNCTIONS
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
  const billingStatus = getOverallBillingStatus();

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

          {/* 🆕 ENHANCED TABBED CONTENT */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="relative">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 relative">
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
                    {billingSummary && billingSummary.totalReports > 0 && (
                      <Badge className={`ml-2 text-xs ${billingStatus.color}`}>
                        {billingSummary.totalReports} reporte
                        {billingSummary.totalReports !== 1 ? "s" : ""}
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

            {/* 🆕 ENHANCED BILLING TAB WITH MULTIPLE REPORTS */}
            {canViewBillingData && (
              <TabsContent value="billing" className="space-y-6 mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="space-y-6"
                >
                  {/* Overall Billing Summary */}
                  <div className="bg-white border rounded-lg">
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold flex items-center">
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Resumen de Facturación
                        </h3>
                        <Badge className={billingStatus.color}>
                          {billingStatus.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-4">
                      {reportsLoading ? (
                        <div className="flex items-center justify-center h-20">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                      ) : billingSummary && billingSummary.totalReports > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">
                              {billingSummary.totalReports}
                            </div>
                            <div className="text-sm text-gray-600">
                              Reportes
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {formatCurrency(billingSummary.totalAmount)}
                            </div>
                            <div className="text-sm text-gray-600">Total</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {formatCurrency(billingSummary.totalPaid)}
                            </div>
                            <div className="text-sm text-gray-600">Pagado</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-amber-600">
                              {formatCurrency(billingSummary.totalPending)}
                            </div>
                            <div className="text-sm text-gray-600">
                              Pendiente
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium mb-2">
                            No hay reportes de facturación
                          </p>
                          <p className="text-sm">
                            Crea un reporte para gestionar la facturación de
                            esta cita
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Individual Reports List */}
                  {billingReports.length > 0 && (
                    <div className="bg-white border rounded-lg">
                      <div className="p-4 border-b">
                        <h3 className="font-semibold flex items-center">
                          <FileText className="mr-2 h-4 w-4" />
                          Reportes de Facturación ({billingReports.length})
                        </h3>
                      </div>

                      <div className="divide-y">
                        <AnimatePresence>
                          {billingReports.map((report, index) => (
                            <motion.div
                              key={report.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ delay: index * 0.1 }}
                              className="p-4 hover:bg-gray-50"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h4 className="font-medium">
                                      {report.title}
                                    </h4>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {getReportTypeLabel(report.reportType)}
                                    </Badge>
                                    <Badge
                                      className={`text-xs ${
                                        report.status === "paid"
                                          ? "bg-green-100 text-green-800"
                                          : report.status === "completed"
                                          ? "bg-blue-100 text-blue-800"
                                          : report.status === "draft"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-gray-100 text-gray-800"
                                      }`}
                                    >
                                      {report.status}
                                    </Badge>
                                    {report.isPartialReport && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        Parcial
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-600">
                                        Total:
                                      </span>
                                      <span className="font-medium ml-1">
                                        {formatCurrency(report.total)}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">
                                        Pagado:
                                      </span>
                                      <span className="font-medium ml-1 text-green-600">
                                        {formatCurrency(report.paidAmount)}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">
                                        Pendiente:
                                      </span>
                                      <span className="font-medium ml-1 text-amber-600">
                                        {formatCurrency(report.pendingAmount)}
                                      </span>
                                    </div>
                                  </div>

                                  {report.invoiceNumber && (
                                    <div className="mt-2">
                                      <span className="text-xs text-gray-500">
                                        Factura: {report.invoiceNumber}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewReport(report.id)}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>

                                  {canCreateBillingReport && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleEditReport(report.id)
                                      }
                                    >
                                      <Edit3 className="h-3 w-3" />
                                    </Button>
                                  )}

                                  {canCreateBillingReport && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleDuplicateReport(report.id)
                                      }
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  )}

                                  {(report.status === "completed" ||
                                    report.status === "paid") && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleGeneratePDF(report.id)
                                      }
                                      disabled={loading}
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  {/* Create New Report Actions */}
                  {canCreateBillingReport && (
                    <div className="bg-white border rounded-lg">
                      <div className="p-4 border-b">
                        <h3 className="font-semibold flex items-center">
                          <Plus className="mr-2 h-4 w-4" />
                          Crear Nuevo Reporte
                        </h3>
                      </div>

                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          {billingSummary?.totalReports === 0 && (
                            <Button
                              onClick={() =>
                                handleCreateReport(
                                  "complete_visit",
                                  "Consulta Completa"
                                )
                              }
                              className="h-20 flex flex-col items-center justify-center"
                              disabled={loading}
                            >
                              <Receipt className="h-6 w-6 mb-2" />
                              <span className="text-xs">Consulta Completa</span>
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            onClick={() => handleQuickReport("partial")}
                            className="h-20 flex flex-col items-center justify-center"
                            disabled={loading}
                          >
                            <FileText className="h-6 w-6 mb-2" />
                            <span className="text-xs">
                              Tratamiento Adicional
                            </span>
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() => handleQuickReport("emergency")}
                            className="h-20 flex flex-col items-center justify-center"
                            disabled={loading}
                          >
                            <Zap className="h-6 w-6 mb-2" />
                            <span className="text-xs">Servicio Emergencia</span>
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() => handleQuickReport("product")}
                            className="h-20 flex flex-col items-center justify-center"
                            disabled={loading}
                          >
                            <ShoppingCart className="h-6 w-6 mb-2" />
                            <span className="text-xs">Venta Productos</span>
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() => setShowCreateReportModal(true)}
                            className="h-20 flex flex-col items-center justify-center"
                            disabled={loading}
                          >
                            <Plus className="h-6 w-6 mb-2" />
                            <span className="text-xs">
                              Reporte Personalizado
                            </span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </TabsContent>
            )}
          </Tabs>

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

// ============================================================================
// CREATE CUSTOM REPORT MODAL
// ============================================================================

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateReport: (
    reportType: BillingReportType,
    title: string
  ) => Promise<void>;
  loading: boolean;
}

const CreateReportModal: React.FC<CreateReportModalProps> = ({
  isOpen,
  onClose,
  onCreateReport,
  loading,
}) => {
  const [reportType, setReportType] =
    useState<BillingReportType>("partial_treatment");
  const [title, setTitle] = useState("");

  const reportTypeOptions: {
    value: BillingReportType;
    label: string;
    description: string;
  }[] = [
    {
      value: "complete_visit",
      label: "Consulta Completa",
      description: "Reporte completo de toda la visita del paciente",
    },
    {
      value: "partial_treatment",
      label: "Tratamiento Parcial",
      description: "Reporte para tratamientos específicos dentro de la visita",
    },
    {
      value: "additional_service",
      label: "Servicio Adicional",
      description: "Servicios adicionales no planificados originalmente",
    },
    {
      value: "emergency_addon",
      label: "Servicio de Emergencia",
      description: "Servicios de emergencia añadidos durante la cita",
    },
    {
      value: "product_sale",
      label: "Venta de Productos",
      description: "Productos dentales vendidos al paciente",
    },
    {
      value: "insurance_claim",
      label: "Reclamo de Seguro",
      description: "Reporte específico para reclamos de seguros",
    },
  ];

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert("Por favor ingresa un título para el reporte");
      return;
    }

    await onCreateReport(reportType, title.trim());
    setTitle("");
    setReportType("partial_treatment");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Plus className="mr-2 h-5 w-5" />
            Crear Reporte Personalizado
          </DialogTitle>
          <DialogDescription>
            Configura los detalles del nuevo reporte de facturación
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="reportType">Tipo de Reporte</Label>
            <Select
              value={reportType}
              onValueChange={(value: BillingReportType) => setReportType(value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reportTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-gray-500">
                        {option.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">Título del Reporte</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Limpieza dental adicional"
              className="mt-1"
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Después de crear el reporte, podrás agregar
              servicios, productos y configurar los precios en la página de
              edición.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !title.trim()}>
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creando...
              </div>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Crear Reporte
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
