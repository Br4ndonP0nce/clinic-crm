"use client";
import React, { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { getAllUsers, UserProfile } from "@/lib/firebase/rbac";
import {
  getAppointments,
  addAppointment,
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

export default function CalendarPage() {
  const { userProfile, hasPermission } = useAuth();
  const [doctors, setDoctors] = useState<UserProfile[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("week");
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    date: Date;
    time: string;
  } | null>(null);
  const [formData, setFormData] =
    useState<AppointmentFormData>(initialFormData);
  const [patientSearch, setPatientSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load doctors and patients on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load appointments when doctor changes
  useEffect(() => {
    if (selectedDoctor) {
      loadAppointments();
    }
  }, [selectedDoctor, currentDate]);

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
      // Get appointments for the selected doctor and current month
      const startOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const endOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );

      const doctorAppointments = await getAppointments(
        startOfMonth,
        endOfMonth,
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
      setIsLoading(true);
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
          dateOfBirth: Timestamp.fromDate(new Date("1990-01-01")), // Default date
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
      setIsLoading(false);
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
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
    start.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
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
                        : currentDate.toLocaleDateString("es-MX", {
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
                                      ? "cursor-default"
                                      : hasPermission("appointments:write")
                                      ? "cursor-pointer hover:bg-blue-50"
                                      : ""
                                  }`}
                                  onClick={() =>
                                    !appointment &&
                                    !isWeekend &&
                                    hasPermission("appointments:write") &&
                                    handleTimeSlotClick(day, time)
                                  }
                                >
                                  {appointment ? (
                                    <div
                                      className={`p-2 rounded text-white text-xs ${
                                        appointmentType?.color || "bg-gray-500"
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

            {/* Month View Calendar */}
            {view === "month" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar1 className="mr-2 h-5 w-5" />
                    Calendario Mensual - {selectedDoctorInfo?.displayName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Calendar1 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                      Vista Mensual
                    </h3>
                    <p className="text-gray-500">
                      La vista mensual estará disponible en una próxima
                      actualización
                    </p>
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
                  onClick={() => setShowAppointmentModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    onClick={() => setShowAppointmentModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSubmitAppointment}
                    disabled={
                      isLoading ||
                      !formData.patientName ||
                      !formData.date ||
                      !formData.time ||
                      !formData.reasonForVisit
                    }
                  >
                    {isLoading ? (
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
      </div>
    </ProtectedRoute>
  );
}
