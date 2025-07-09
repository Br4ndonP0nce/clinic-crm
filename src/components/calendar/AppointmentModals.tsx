// src/components/calendar/AppointmentModals.tsx
"use client";

import React, { useState, useEffect } from "react";
import { SlotInfo } from "react-big-calendar";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
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
} from "lucide-react";

// ============================================================================
// APPOINTMENT DETAILS MODAL WITH DELETE FUNCTIONALITY
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
  const { userProfile, hasPermission } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appointmentData, setAppointmentData] = useState<Partial<Appointment>>(
    {}
  );

  // Check if user can delete appointments (doctor, super_admin, or recepcion)
  const canDelete =
    hasPermission("appointments:delete") &&
    (userProfile?.role === "doctor" ||
      userProfile?.role === "super_admin" ||
      userProfile?.role === "recepcion");

  useEffect(() => {
    if (event?.resource.appointment) {
      setAppointmentData(event.resource.appointment);
    }
  }, [event]);

  if (!event) return null;

  const { appointment, patient } = event.resource;

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

      // Hard delete the appointment from the database
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
                {hasPermission("appointments:write") && (
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
                    Cancelar
                  </Button>
                )}
              </div>
            </DialogTitle>
            <DialogDescription>
              Información completa de la cita programada
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Appointment Status */}
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
                    {patient.dentalHistory.lastVisit
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
                <p className="mt-1">Dr. {appointment.doctorId}</p>
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

            {/* Pre-visit Instructions */}
            {appointment.preVisitInstructions && (
              <div>
                <Label className="text-sm font-medium text-gray-600">
                  Instrucciones Pre-Visita
                </Label>
                <p className="mt-1 p-3 bg-amber-50 rounded border-l-4 border-amber-400">
                  {appointment.preVisitInstructions}
                </p>
              </div>
            )}

            {/* Room and Equipment */}
            {(appointment.room || appointment.equipment) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointment.room && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Sala
                    </Label>
                    <p className="mt-1 flex items-center">
                      <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                      {appointment.room}
                    </p>
                  </div>
                )}
                {appointment.equipment && appointment.equipment.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Equipo
                    </Label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {appointment.equipment.map((item, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions */}
            {hasPermission("appointments:write") &&
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            {hasPermission("appointments:write") && (
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

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar esta cita? Esta acción no se
              puede deshacer y la cita será eliminada permanentemente de la base
              de datos.
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
                  Eliminando...
                </div>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Sí, Eliminar Cita
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
// NEW APPOINTMENT MODAL WITH DISABLED DATE/TIME WHEN FROM SLOT
// ============================================================================

interface NewAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  selectedSlot?: SlotInfo | null;
  onSuccess: () => void;
  prefilledDate?: string;
  prefilledTime?: string;
}

export const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  open,
  onClose,
  selectedSlot,
  onSuccess,
  prefilledDate,
  prefilledTime,
}) => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Determine if date/time should be disabled (when coming from slot selection)
  const isDateTimeDisabled = !!(
    selectedSlot ||
    (prefilledDate && prefilledTime)
  );

  const [appointmentData, setAppointmentData] = useState({
    patientId: "",
    doctorId: userProfile?.uid || "",
    appointmentDate: Timestamp.fromDate(
      selectedSlot?.start ||
        (prefilledDate && prefilledTime
          ? new Date(`${prefilledDate}T${prefilledTime}`)
          : new Date())
    ),
    duration: 60,
    type: "consultation" as Appointment["type"],
    reasonForVisit: "",
    notes: "",
    preVisitInstructions: "",
    room: "",
    equipment: [] as string[],
  });

  // Date and time form fields (separate from appointmentData for form display)
  const [formDate, setFormDate] = useState(
    prefilledDate ||
      selectedSlot?.start.toISOString().split("T")[0] ||
      new Date().toISOString().split("T")[0]
  );

  const [formTime, setFormTime] = useState(
    prefilledTime || selectedSlot?.start.toTimeString().slice(0, 5) || "09:00"
  );

  // Fetch patients on component mount
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const allPatients = await getPatients();
        setPatients(allPatients);
      } catch (error) {
        console.error("Error fetching patients:", error);
      }
    };

    if (open) {
      fetchPatients();
    }
  }, [open]);

  // Update appointment date when form date/time changes
  useEffect(() => {
    if (formDate && formTime) {
      const newDateTime = new Date(`${formDate}T${formTime}`);
      setAppointmentData((prev) => ({
        ...prev,
        appointmentDate: Timestamp.fromDate(newDateTime),
      }));
    }
  }, [formDate, formTime]);

  // Update form when slot changes
  useEffect(() => {
    if (selectedSlot) {
      const slotDate = selectedSlot.start.toISOString().split("T")[0];
      const slotTime = selectedSlot.start.toTimeString().slice(0, 5);
      setFormDate(slotDate);
      setFormTime(slotTime);
      setAppointmentData((prev) => ({
        ...prev,
        appointmentDate: Timestamp.fromDate(selectedSlot.start),
      }));
    }
  }, [selectedSlot]);

  const filteredPatients = patients.filter(
    (patient) =>
      patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !userProfile) return;

    try {
      setLoading(true);

      await addAppointment({
        ...appointmentData,
        patientId: selectedPatient.id!,
        createdBy: userProfile.uid,
        reminders: [],
        status: "scheduled",
      });

      // Reset form
      setAppointmentData({
        patientId: "",
        doctorId: userProfile.uid,
        appointmentDate: Timestamp.now(),
        duration: 60,
        type: "consultation",
        reasonForVisit: "",
        notes: "",
        preVisitInstructions: "",
        room: "",
        equipment: [],
      });
      setSelectedPatient(null);
      setSearchTerm("");
      setFormDate(new Date().toISOString().split("T")[0]);
      setFormTime("09:00");

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating appointment:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Nueva Cita
          </DialogTitle>
          <DialogDescription>
            Programar una nueva cita para un paciente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date and Time Display/Input */}
          {isDateTimeDisabled ? (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium mb-2 flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                Fecha y Hora Seleccionada
              </h3>
              <p className="text-sm">
                {formatDateTime(appointmentData.appointmentDate.toDate())}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Para cambiar la fecha/hora, cierra este modal y selecciona un
                horario diferente en el calendario
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="appointment-date">Fecha *</Label>
                <Input
                  id="appointment-date"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="appointment-time">Hora *</Label>
                <Input
                  id="appointment-time"
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* Patient Selection */}
          <div>
            <Label htmlFor="patient-search">Buscar Paciente</Label>
            <Input
              id="patient-search"
              type="text"
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1"
            />

            {searchTerm && (
              <div className="mt-2 max-h-40 overflow-y-auto border rounded-md">
                {filteredPatients.length > 0 ? (
                  filteredPatients.slice(0, 5).map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => {
                        setSelectedPatient(patient);
                        setSearchTerm(patient.fullName);
                      }}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    >
                      <div className="font-medium">{patient.fullName}</div>
                      <div className="text-sm text-gray-600">
                        {patient.email}
                      </div>
                      <div className="text-sm text-gray-600">
                        {patient.phone}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-gray-500 text-center">
                    No se encontraron pacientes
                  </div>
                )}
              </div>
            )}

            {selectedPatient && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-800">
                      {selectedPatient.fullName}
                    </p>
                    <p className="text-sm text-green-600">
                      {selectedPatient.email}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedPatient(null);
                      setSearchTerm("");
                    }}
                  >
                    Cambiar
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Appointment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Duración (minutos)</Label>
              <Select
                value={appointmentData.duration.toString()}
                onValueChange={(value) =>
                  setAppointmentData((prev) => ({
                    ...prev,
                    duration: parseInt(value),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="60">60 minutos</SelectItem>
                  <SelectItem value="90">90 minutos</SelectItem>
                  <SelectItem value="120">120 minutos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type">Tipo de Cita</Label>
              <Select
                value={appointmentData.type}
                onValueChange={(value) =>
                  setAppointmentData((prev) => ({
                    ...prev,
                    type: value as Appointment["type"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">Consulta</SelectItem>
                  <SelectItem value="cleaning">Limpieza</SelectItem>
                  <SelectItem value="procedure">Procedimiento</SelectItem>
                  <SelectItem value="followup">Seguimiento</SelectItem>
                  <SelectItem value="emergency">Emergencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reason for Visit */}
          <div>
            <Label htmlFor="reason">Motivo de la Consulta *</Label>
            <Textarea
              id="reason"
              value={appointmentData.reasonForVisit}
              onChange={(e) =>
                setAppointmentData((prev) => ({
                  ...prev,
                  reasonForVisit: e.target.value,
                }))
              }
              placeholder="Describe el motivo de la cita..."
              required
              className="mt-1"
            />
          </div>

          {/* Optional Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={appointmentData.notes}
                onChange={(e) =>
                  setAppointmentData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Notas adicionales sobre la cita..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="instructions">
                Instrucciones Pre-Visita (opcional)
              </Label>
              <Textarea
                id="instructions"
                value={appointmentData.preVisitInstructions}
                onChange={(e) =>
                  setAppointmentData((prev) => ({
                    ...prev,
                    preVisitInstructions: e.target.value,
                  }))
                }
                placeholder="Instrucciones para el paciente antes de la cita..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="room">Sala (opcional)</Label>
              <Input
                id="room"
                value={appointmentData.room}
                onChange={(e) =>
                  setAppointmentData((prev) => ({
                    ...prev,
                    room: e.target.value,
                  }))
                }
                placeholder="Ej: Sala 1, Consultorio A..."
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                loading || !selectedPatient || !appointmentData.reasonForVisit
              }
            >
              {loading ? "Programando..." : "Programar Cita"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
