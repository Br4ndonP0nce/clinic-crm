"use client";
import React, { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { getAllUsers, UserProfile } from "@/lib/firebase/rbac";
import {
  getAppointments,
  addAppointment,
  updateAppointment,
  deleteAppointment,
  Appointment,
} from "@/lib/firebase/db";
import { getPatients, addPatient, Patient } from "@/lib/firebase/db";
import { Timestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  User,
  Phone,
  Mail,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  Search,
  UserPlus,
  Calendar1,
  Edit,
  Trash2,
  AlertTriangle,
} from "lucide-react";

// Calendar view types
type CalendarView = "month" | "week" | "day";

// Appointment form data
interface AppointmentFormData {
  patientId?: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  date: string;
  time: string;
  duration: number;
  type: "consultation" | "cleaning" | "procedure" | "followup" | "emergency";
  reasonForVisit: string;
  notes: string;
  isNewPatient: boolean;
}

const initialFormData: AppointmentFormData = {
  patientName: "",
  patientPhone: "",
  patientEmail: "",
  date: "",
  time: "",
  duration: 60,
  type: "consultation",
  reasonForVisit: "",
  notes: "",
  isNewPatient: false,
};

const appointmentTypes = [
  { value: "consultation", label: "Consulta", color: "bg-blue-500" },
  { value: "cleaning", label: "Limpieza", color: "bg-green-500" },
  { value: "procedure", label: "Procedimiento", color: "bg-purple-500" },
  { value: "followup", label: "Seguimiento", color: "bg-orange-500" },
  { value: "emergency", label: "Emergencia", color: "bg-red-500" },
];

// Appointment Details Modal Component
interface AppointmentDetailsModalProps {
  appointment: Appointment | null;
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  canDelete: boolean;
  canEdit: boolean;
}

const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({
  appointment,
  patient,
  isOpen,
  onClose,
  onUpdate,
  canDelete,
  canEdit,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    if (!appointment?.id) return;

    try {
      setIsDeleting(true);
      await deleteAppointment(appointment.id);
      onUpdate();
      onClose();
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Error deleting appointment:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!appointment || !patient) return null;

  const formatDateTime = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5" />
              Detalles de la Cita
            </span>
            <div className="flex gap-2">
              {canEdit && (
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              )}
              {canDelete && appointment.status !== "cancelled" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <Label>Estado:</Label>
            <Badge className={getStatusColor(appointment.status)}>
              {appointment.status === "scheduled" && "Programada"}
              {appointment.status === "confirmed" && "Confirmada"}
              {appointment.status === "completed" && "Completada"}
              {appointment.status === "cancelled" && "Cancelada"}
            </Badge>
          </div>

          {/* Patient Info */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <h3 className="font-medium mb-2 flex items-center">
              <User className="mr-2 h-4 w-4" />
              Información del Paciente
            </h3>
            <div className="space-y-1 text-sm">
              <p>
                <strong>Nombre:</strong> {patient.fullName}
              </p>
              <p>
                <strong>Teléfono:</strong> {patient.phone}
              </p>
              <p>
                <strong>Email:</strong> {patient.email}
              </p>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="space-y-2">
            <div>
              <Label>Fecha y Hora:</Label>
              <p>{formatDateTime(appointment.appointmentDate)}</p>
            </div>
            <div>
              <Label>Duración:</Label>
              <p>{appointment.duration} minutos</p>
            </div>
            <div>
              <Label>Tipo:</Label>
              <p>
                {
                  appointmentTypes.find((t) => t.value === appointment.type)
                    ?.label
                }
              </p>
            </div>
            <div>
              <Label>Motivo:</Label>
              <p>{appointment.reasonForVisit}</p>
            </div>
            {appointment.notes && (
              <div>
                <Label>Notas:</Label>
                <p className="whitespace-pre-wrap">{appointment.notes}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center text-red-600">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Confirmar Cancelación
              </DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que quieres eliminar esta cita? Esta acción no
                se puede deshacer y la cita será eliminada permanentemente.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm">
                <strong>Paciente:</strong> {patient.fullName}
              </p>
              <p className="text-sm">
                <strong>Fecha:</strong>{" "}
                {formatDateTime(appointment.appointmentDate)}
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                No, Mantener Cita
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Eliminando..." : "Sí, Eliminar Cita"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

export default function CalendarPage() {
  const { userProfile, hasPermission } = useAuth();
  const [doctors, setDoctors] = useState<UserProfile[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("week");
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    date: Date;
    time: string;
  } | null>(null);
  const [formData, setFormData] =
    useState<AppointmentFormData>(initialFormData);
  const [patientSearch, setPatientSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Permission checks
  const canDeleteAppointments =
    hasPermission("appointments:delete") &&
    (userProfile?.role === "doctor" ||
      userProfile?.role === "super_admin" ||
      userProfile?.role === "recepcion");
  const canEditAppointments = hasPermission("appointments:write");

  // Load doctors and patients on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load appointments when doctor changes
  useEffect(() => {
    if (selectedDoctor) {
      loadAppointments();
    }
  }, [selectedDoctor, currentDate, view]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [allUsers, allPatients] = await Promise.all([
        getAllUsers(),
        getPatients(),
      ]);

      // Filter doctors
      const doctorUsers = allUsers.filter(
        (user) => user.role === "doctor" && user.isActive
      );
      setDoctors(doctorUsers);
      setPatients(allPatients);

      // Auto-select first doctor or current user if doctor
      if (userProfile?.role === "doctor") {
        setSelectedDoctor(userProfile.uid);
      } else if (doctorUsers.length > 0) {
        setSelectedDoctor(doctorUsers[0].uid);
      }
    } catch (err) {
      console.error("Error loading initial data:", err);
      setError("Error al cargar los datos del calendario");
    } finally {
      setIsLoading(false);
    }
  };

  const loadAppointments = async () => {
    if (!selectedDoctor) return;

    try {
      let startDate: Date, endDate: Date;

      if (view === "month") {
        startDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        );
        endDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0
        );
      } else if (view === "week") {
        const start = new Date(currentDate);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        startDate = start;
        endDate = new Date(start);
        endDate.setDate(start.getDate() + 6);
      } else {
        startDate = new Date(currentDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(currentDate);
        endDate.setHours(23, 59, 59, 999);
      }

      const doctorAppointments = await getAppointments(
        startDate,
        endDate,
        selectedDoctor
      );
      setAppointments(doctorAppointments);
    } catch (err) {
      console.error("Error loading appointments:", err);
      setError("Error al cargar las citas");
    }
  };

  const handleTimeSlotClick = (date: Date, time: string) => {
    setSelectedTimeSlot({ date, time });
    setFormData({
      ...initialFormData,
      date: date.toISOString().split("T")[0],
      time: time,
    });
    setShowAppointmentModal(true);
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    const patient = patients.find((p) => p.id === appointment.patientId);
    if (patient) {
      setSelectedAppointment(appointment);
      setSelectedPatient(patient);
      setShowDetailsModal(true);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setFormData({
      ...formData,
      patientId: patient.id,
      patientName: patient.fullName,
      patientPhone: patient.phone,
      patientEmail: patient.email,
      isNewPatient: false,
    });
    setPatientSearch("");
  };

  const handleCreateNewPatient = () => {
    setFormData({
      ...formData,
      patientId: undefined,
      isNewPatient: true,
    });
  };

  const handleSubmitAppointment = async () => {
    if (!selectedDoctor) return;

    try {
      setIsSaving(true);
      let patientId = formData.patientId;

      // Create new patient if needed
      if (formData.isNewPatient && !patientId) {
        const [firstName, ...lastNameParts] = formData.patientName.split(" ");
        const lastName = lastNameParts.join(" ") || "Apellido";

        const newPatientData = {
          firstName,
          lastName,
          email: formData.patientEmail,
          phone: formData.patientPhone,
          dateOfBirth: Timestamp.fromDate(new Date("1990-01-01")),
          gender: "prefer_not_to_say" as const,
          address: {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: "México",
          },
          emergencyContact: {
            name: "",
            relationship: "",
            phone: "",
          },
          insurance: {
            isActive: false,
          },
          medicalHistory: {
            allergies: [],
            medications: [],
            medicalConditions: [],
            surgeries: [],
          },
          dentalHistory: {
            reasonForVisit: formData.reasonForVisit,
            oralHygiene: "good" as const,
            brushingFrequency: "twice_daily" as const,
            flossingFrequency: "daily" as const,
            currentProblems: [],
          },
          status: "scheduled" as const,
          preferences: {
            preferredTimeSlots: [],
            preferredDays: [],
            communicationMethod: "phone" as const,
            reminderPreferences: {
              email: false,
              sms: true,
              days: 1,
            },
          },
          financial: {
            paymentMethod: "cash" as const,
            balance: 0,
          },
          createdBy: userProfile?.uid || "unknown",
          notes: `Paciente creado desde calendario - ${formData.notes}`,
          statusHistory: [],
          consents: {
            treatmentConsent: false,
            privacyPolicy: false,
            marketingEmails: false,
          },
        };

        patientId = await addPatient(newPatientData);
      }

      // Create appointment
      const appointmentDateTime = new Date(`${formData.date}T${formData.time}`);

      const appointmentData = {
        patientId: patientId!,
        doctorId: selectedDoctor,
        appointmentDate: Timestamp.fromDate(appointmentDateTime),
        duration: formData.duration,
        type: formData.type,
        status: "scheduled" as const,
        reasonForVisit: formData.reasonForVisit,
        notes: formData.notes,
        reminders: [],
        createdBy: userProfile?.uid || "unknown",
      };

      await addAppointment(appointmentData);

      // Refresh appointments and close modal
      await loadAppointments();
      setShowAppointmentModal(false);
      setFormData(initialFormData);
      setPatientSearch("");
    } catch (err) {
      console.error("Error creating appointment:", err);
      setError("Error al crear la cita");
    } finally {
      setIsSaving(false);
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const getWeekDays = () => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Start from the Monday of the week containing the first day
    const startDate = new Date(firstDay);
    const startDay = firstDay.getDay();
    const daysFromMonday = startDay === 0 ? 6 : startDay - 1;
    startDate.setDate(firstDay.getDate() - daysFromMonday);

    // Generate 42 days (6 weeks) to fill the calendar
    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }

    return days;
  };

  const getAppointmentForSlot = (date: Date, time: string) => {
    const slotDateTime = new Date(
      `${date.toISOString().split("T")[0]}T${time}`
    );
    return appointments.find((apt) => {
      const aptDate = apt.appointmentDate.toDate();
      return aptDate.getTime() === slotDateTime.getTime();
    });
  };

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter((apt) => {
      const aptDate = apt.appointmentDate.toDate();
      return aptDate.toDateString() === date.toDateString();
    });
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (view === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else if (view === "month") {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    } else {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const filteredPatients = patients.filter(
    (patient) =>
      patient.fullName.toLowerCase().includes(patientSearch.toLowerCase()) ||
      patient.phone.includes(patientSearch) ||
      patient.email.toLowerCase().includes(patientSearch.toLowerCase())
  );

  if (isLoading && doctors.length === 0) {
    return (
      <ProtectedRoute requiredPermissions={["calendar:read"]}>
        <div className="p-6 flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  const timeSlots = generateTimeSlots();
  const weekDays = getWeekDays();
  const monthDays = getMonthDays();
  const selectedDoctorInfo = doctors.find((d) => d.uid === selectedDoctor);

  return (
    <ProtectedRoute requiredPermissions={["calendar:read"]}>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Calendario de Citas</h1>
            <p className="text-gray-600">Gestión de citas médicas por doctor</p>
          </div>

          {hasPermission("appointments:write") && (
            <Button onClick={() => setShowAppointmentModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Cita
            </Button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Doctor Selection */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="doctorSelect">Seleccionar Doctor</Label>
                <select
                  id="doctorSelect"
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                >
                  <option value="">Seleccione un doctor...</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.uid} value={doctor.uid}>
                      {doctor.displayName || doctor.email}
                    </option>
                  ))}
                </select>
              </div>

              {selectedDoctorInfo && (
                <div className="flex items-center space-x-2">
                  <Stethoscope className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">
                      {selectedDoctorInfo.displayName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedDoctorInfo.email}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedDoctor && (
          <>
            {/* Calendar Controls */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateDate("prev")}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <h2 className="text-lg font-semibold">
                      {view === "week"
                        ? `${weekDays[0].toLocaleDateString("es-MX", {
                            day: "numeric",
                            month: "short",
                          })} - ${weekDays[6].toLocaleDateString("es-MX", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}`
                        : view === "month"
                        ? currentDate.toLocaleDateString("es-MX", {
                            month: "long",
                            year: "numeric",
                          })
                        : currentDate.toLocaleDateString("es-MX", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                    </h2>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateDate("next")}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentDate(new Date())}
                    >
                      Hoy
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant={view === "week" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setView("week")}
                    >
                      Semana
                    </Button>
                    <Button
                      variant={view === "month" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setView("month")}
                    >
                      Mes
                    </Button>
                    <Button
                      variant={view === "day" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setView("day")}
                    >
                      Día
                    </Button>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                  <span className="text-sm font-medium text-gray-600">
                    Tipos de cita:
                  </span>
                  {appointmentTypes.map((type) => (
                    <div
                      key={type.value}
                      className="flex items-center space-x-1"
                    >
                      <div className={`w-3 h-3 rounded ${type.color}`}></div>
                      <span className="text-xs">{type.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Month View Calendar */}
            {view === "month" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar1 className="mr-2 h-5 w-5" />
                    Calendario Mensual - {selectedDoctorInfo?.displayName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-7 border-b">
                    {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(
                      (day) => (
                        <div
                          key={day}
                          className="p-3 border-r bg-gray-50 text-center font-medium"
                        >
                          {day}
                        </div>
                      )
                    )}
                  </div>
                  <div className="grid grid-cols-7">
                    {monthDays.map((date, index) => {
                      const isCurrentMonth =
                        date.getMonth() === currentDate.getMonth();
                      const isToday =
                        date.toDateString() === new Date().toDateString();
                      const dayAppointments = getAppointmentsForDay(date);
                      const isWeekend =
                        date.getDay() === 0 || date.getDay() === 6;

                      return (
                        <div
                          key={index}
                          className={`min-h-[120px] p-2 border-r border-b ${
                            !isCurrentMonth
                              ? "bg-gray-50 text-gray-400"
                              : isToday
                              ? "bg-blue-50"
                              : isWeekend
                              ? "bg-gray-100"
                              : "bg-white hover:bg-gray-50"
                          } ${
                            hasPermission("appointments:write") &&
                            isCurrentMonth &&
                            !isWeekend
                              ? "cursor-pointer"
                              : ""
                          }`}
                          onClick={() => {
                            if (
                              hasPermission("appointments:write") &&
                              isCurrentMonth &&
                              !isWeekend
                            ) {
                              handleTimeSlotClick(date, "09:00");
                            }
                          }}
                        >
                          <div
                            className={`text-sm font-medium mb-1 ${
                              isToday ? "text-blue-600" : ""
                            }`}
                          >
                            {date.getDate()}
                          </div>
                          <div className="space-y-1">
                            {dayAppointments.slice(0, 3).map((appointment) => {
                              const appointmentType = appointmentTypes.find(
                                (t) => t.value === appointment.type
                              );
                              const patient = patients.find(
                                (p) => p.id === appointment.patientId
                              );

                              return (
                                <div
                                  key={appointment.id}
                                  className={`text-xs p-1 rounded text-white cursor-pointer ${
                                    appointmentType?.color || "bg-gray-500"
                                  } ${
                                    appointment.status === "cancelled"
                                      ? "opacity-50"
                                      : ""
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAppointmentClick(appointment);
                                  }}
                                >
                                  <div className="truncate font-medium">
                                    {appointment.appointmentDate
                                      .toDate()
                                      .toLocaleTimeString("es-MX", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                  </div>
                                  <div className="truncate">
                                    {patient?.fullName || "Paciente"}
                                  </div>
                                </div>
                              );
                            })}
                            {dayAppointments.length > 3 && (
                              <div className="text-xs text-gray-500 text-center">
                                +{dayAppointments.length - 3} más
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Week View Calendar */}
            {view === "week" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar1 className="mr-2 h-5 w-5" />
                    Calendario Semanal - {selectedDoctorInfo?.displayName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                      {/* Week Header */}
                      <div className="grid grid-cols-8 border-b">
                        <div className="p-3 border-r bg-gray-50">
                          <span className="text-sm font-medium">Hora</span>
                        </div>
                        {weekDays.map((day, index) => {
                          const isToday =
                            day.toDateString() === new Date().toDateString();
                          const dayAppointments = appointments.filter((apt) => {
                            const aptDate = apt.appointmentDate.toDate();
                            return (
                              aptDate.toDateString() === day.toDateString()
                            );
                          });

                          return (
                            <div
                              key={index}
                              className={`p-3 border-r text-center ${
                                isToday ? "bg-blue-50" : "bg-gray-50"
                              }`}
                            >
                              <div className="text-sm font-medium">
                                {day.toLocaleDateString("es-MX", {
                                  weekday: "short",
                                })}
                              </div>
                              <div
                                className={`text-lg font-bold ${
                                  isToday ? "text-blue-600" : ""
                                }`}
                              >
                                {day.getDate()}
                              </div>
                              {dayAppointments.length > 0 && (
                                <div className="text-xs text-gray-600 mt-1">
                                  {dayAppointments.length} cita
                                  {dayAppointments.length !== 1 ? "s" : ""}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Time Slots */}
                      <div className="max-h-[600px] overflow-y-auto">
                        {timeSlots.map((time) => (
                          <div
                            key={time}
                            className="grid grid-cols-8 border-b hover:bg-gray-50"
                          >
                            <div className="p-2 border-r bg-gray-50 text-center">
                              <span className="text-sm font-medium">
                                {time}
                              </span>
                            </div>
                            {weekDays.map((day, dayIndex) => {
                              const appointment = getAppointmentForSlot(
                                day,
                                time
                              );
                              const appointmentType = appointmentTypes.find(
                                (t) => t.value === appointment?.type
                              );
                              const patientInfo = appointment
                                ? patients.find(
                                    (p) => p.id === appointment.patientId
                                  )
                                : null;
                              const isWeekend =
                                day.getDay() === 0 || day.getDay() === 6;

                              return (
                                <div
                                  key={dayIndex}
                                  className={`p-1 border-r min-h-[60px] ${
                                    isWeekend
                                      ? "bg-gray-100"
                                      : appointment
                                      ? "cursor-pointer"
                                      : hasPermission("appointments:write")
                                      ? "cursor-pointer hover:bg-blue-50"
                                      : ""
                                  }`}
                                  onClick={() => {
                                    if (appointment) {
                                      handleAppointmentClick(appointment);
                                    } else if (
                                      !isWeekend &&
                                      hasPermission("appointments:write")
                                    ) {
                                      handleTimeSlotClick(day, time);
                                    }
                                  }}
                                >
                                  {appointment ? (
                                    <div
                                      className={`p-2 rounded text-white text-xs ${
                                        appointmentType?.color || "bg-gray-500"
                                      } ${
                                        appointment.status === "cancelled"
                                          ? "opacity-50"
                                          : ""
                                      } relative group`}
                                    >
                                      <div className="font-medium truncate">
                                        {patientInfo?.fullName ||
                                          "Paciente Desconocido"}
                                      </div>
                                      <div className="truncate">
                                        {appointmentType?.label}
                                      </div>
                                      <div className="text-xs opacity-75">
                                        {appointment.duration}min
                                      </div>

                                      {/* Tooltip */}
                                      <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                                        {appointment.reasonForVisit}
                                      </div>
                                    </div>
                                  ) : isWeekend ? (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                      <span className="text-xs">
                                        Fin de semana
                                      </span>
                                    </div>
                                  ) : (
                                    hasPermission("appointments:write") && (
                                      <div className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        <Plus className="h-4 w-4 text-gray-400" />
                                      </div>
                                    )
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Day View Calendar */}
            {view === "day" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar1 className="mr-2 h-5 w-5" />
                    Vista Diaria -{" "}
                    {currentDate.toLocaleDateString("es-MX", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[600px] overflow-y-auto">
                    {timeSlots.map((time) => {
                      const appointment = getAppointmentForSlot(
                        currentDate,
                        time
                      );
                      const appointmentType = appointmentTypes.find(
                        (t) => t.value === appointment?.type
                      );
                      const patientInfo = appointment
                        ? patients.find((p) => p.id === appointment.patientId)
                        : null;

                      return (
                        <div
                          key={time}
                          className="flex border-b hover:bg-gray-50"
                        >
                          <div className="w-20 p-4 border-r bg-gray-50 text-center">
                            <span className="text-sm font-medium">{time}</span>
                          </div>
                          <div
                            className={`flex-1 p-2 min-h-[80px] ${
                              appointment
                                ? "cursor-pointer"
                                : hasPermission("appointments:write")
                                ? "cursor-pointer hover:bg-blue-50"
                                : ""
                            }`}
                            onClick={() => {
                              if (appointment) {
                                handleAppointmentClick(appointment);
                              } else if (hasPermission("appointments:write")) {
                                handleTimeSlotClick(currentDate, time);
                              }
                            }}
                          >
                            {appointment ? (
                              <div
                                className={`p-3 rounded text-white ${
                                  appointmentType?.color || "bg-gray-500"
                                } ${
                                  appointment.status === "cancelled"
                                    ? "opacity-50"
                                    : ""
                                }`}
                              >
                                <div className="font-medium">
                                  {patientInfo?.fullName ||
                                    "Paciente Desconocido"}
                                </div>
                                <div className="text-sm opacity-90">
                                  {appointmentType?.label}
                                </div>
                                <div className="text-sm opacity-75">
                                  {appointment.duration} min -{" "}
                                  {appointment.reasonForVisit}
                                </div>
                              </div>
                            ) : (
                              hasPermission("appointments:write") && (
                                <div className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                  <Plus className="h-6 w-6 text-gray-400" />
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Daily Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Citas Hoy</p>
                      <p className="text-2xl font-bold">
                        {
                          appointments.filter(
                            (apt) =>
                              apt.appointmentDate.toDate().toDateString() ===
                              new Date().toDateString()
                          ).length
                        }
                      </p>
                    </div>
                    <Calendar1 className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Esta Semana</p>
                      <p className="text-2xl font-bold">
                        {
                          appointments.filter((apt) => {
                            const aptDate = apt.appointmentDate.toDate();
                            return weekDays.some(
                              (day) =>
                                day.toDateString() === aptDate.toDateString()
                            );
                          }).length
                        }
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Programadas</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {
                          appointments.filter(
                            (apt) => apt.status === "scheduled"
                          ).length
                        }
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Completadas</p>
                      <p className="text-2xl font-bold text-green-600">
                        {
                          appointments.filter(
                            (apt) => apt.status === "completed"
                          ).length
                        }
                      </p>
                    </div>
                    <Stethoscope className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Appointment Modal */}
        {showAppointmentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Nueva Cita</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAppointmentModal(false);
                    setSelectedTimeSlot(null);
                    setFormData(initialFormData);
                    setPatientSearch("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Selected Time Display */}
                {selectedTimeSlot && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h3 className="font-medium mb-1 flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      Horario Seleccionado
                    </h3>
                    <p className="text-sm">
                      {selectedTimeSlot.date.toLocaleDateString("es-MX", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}{" "}
                      a las {selectedTimeSlot.time}
                    </p>
                  </div>
                )}

                {/* Patient Selection */}
                <div>
                  <Label>Seleccionar Paciente</Label>
                  <div className="space-y-2 mt-1">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        type="search"
                        placeholder="Buscar paciente por nombre, teléfono o email..."
                        className="pl-9"
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                      />
                    </div>

                    {patientSearch && filteredPatients.length > 0 && (
                      <div className="border rounded-md max-h-32 overflow-y-auto">
                        {filteredPatients.slice(0, 5).map((patient) => (
                          <div
                            key={patient.id}
                            className="p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                            onClick={() => handlePatientSelect(patient)}
                          >
                            <div className="font-medium">
                              {patient.fullName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {patient.phone} • {patient.email}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <Button
                      variant="outline"
                      onClick={handleCreateNewPatient}
                      className="w-full"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Crear Nuevo Paciente
                    </Button>
                  </div>
                </div>

                {/* Patient Info */}
                {(formData.isNewPatient || formData.patientId) && (
                  <div className="space-y-4 p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Label htmlFor="patientName">Nombre Completo *</Label>
                      <Input
                        id="patientName"
                        value={formData.patientName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            patientName: e.target.value,
                          })
                        }
                        placeholder="Juan Pérez García"
                        disabled={!formData.isNewPatient}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="patientPhone">Teléfono *</Label>
                        <Input
                          id="patientPhone"
                          value={formData.patientPhone}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              patientPhone: e.target.value,
                            })
                          }
                          placeholder="+52 33 1234 5678"
                          disabled={!formData.isNewPatient}
                        />
                      </div>
                      <div>
                        <Label htmlFor="patientEmail">Email</Label>
                        <Input
                          id="patientEmail"
                          type="email"
                          value={formData.patientEmail}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              patientEmail: e.target.value,
                            })
                          }
                          placeholder="juan@email.com"
                          disabled={!formData.isNewPatient}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Appointment Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="appointmentDate">Fecha *</Label>
                    <Input
                      id="appointmentDate"
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      disabled={!!selectedTimeSlot} // Disable if coming from time slot selection
                    />
                  </div>
                  <div>
                    <Label htmlFor="appointmentTime">Hora *</Label>
                    <Input
                      id="appointmentTime"
                      type="time"
                      value={formData.time}
                      onChange={(e) =>
                        setFormData({ ...formData, time: e.target.value })
                      }
                      disabled={!!selectedTimeSlot} // Disable if coming from time slot selection
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="appointmentType">Tipo de Cita</Label>
                    <select
                      id="appointmentType"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {appointmentTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="duration">Duración (min)</Label>
                    <select
                      id="duration"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={30}>30 minutos</option>
                      <option value={60}>1 hora</option>
                      <option value={90}>1.5 horas</option>
                      <option value={120}>2 horas</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="reasonForVisit">Motivo de la Visita *</Label>
                  <Input
                    id="reasonForVisit"
                    value={formData.reasonForVisit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reasonForVisit: e.target.value,
                      })
                    }
                    placeholder="Limpieza dental, dolor en muela, consulta general..."
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notas Adicionales</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Información adicional sobre la cita..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAppointmentModal(false);
                      setSelectedTimeSlot(null);
                      setFormData(initialFormData);
                      setPatientSearch("");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSubmitAppointment}
                    disabled={
                      isSaving ||
                      !formData.patientName ||
                      !formData.date ||
                      !formData.time ||
                      !formData.reasonForVisit
                    }
                  >
                    {isSaving ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </div>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Crear Cita
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Appointment Details Modal */}
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          patient={selectedPatient}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedAppointment(null);
            setSelectedPatient(null);
          }}
          onUpdate={loadAppointments}
          canDelete={canDeleteAppointments}
          canEdit={canEditAppointments}
        />
      </div>
    </ProtectedRoute>
  );
}
