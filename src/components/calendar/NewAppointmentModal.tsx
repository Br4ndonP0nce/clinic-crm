// ============================================================================
// NEW APPOINTMENT MODAL COMPONENT - WITH SMART CALENDAR PICKER
// ============================================================================

"use client";
import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { addAppointment, addPatient, Patient } from "@/lib/firebase/db";
import { Timestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Clock,
  Search,
  UserPlus,
  X,
  Save,
  Calendar,
  CalendarCheck,
  User,
} from "lucide-react";

// Import our datetime utilities and the smart calendar picker
import {
  formatDateForInput,
  formatTimeForInput,
  getCurrentLocalDateTime,
  isFutureDateTime,
} from "@/lib/utils/datetime";

import { SmartCalendarPicker } from "./SmatCalendarPicker";

// Types
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

interface SelectedTimeSlot {
  date: Date;
  time: string;
}

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedTimeSlot: SelectedTimeSlot | null;
  selectedDoctor: string;
  patients: Patient[];
  // Add these new props for smart scheduling
  appointments: any[]; // All appointments for conflict checking
  // NEW: Optional pre-selected patient (for patient page)
  preSelectedPatient?: Patient;
}

const appointmentTypes = [
  {
    value: "consultation",
    label: "Consulta",
    color: "bg-blue-500",
    duration: 60,
  },
  { value: "cleaning", label: "Limpieza", color: "bg-green-500", duration: 90 },
  {
    value: "procedure",
    label: "Procedimiento",
    color: "bg-purple-500",
    duration: 120,
  },
  {
    value: "followup",
    label: "Seguimiento",
    color: "bg-orange-500",
    duration: 30,
  },
  {
    value: "emergency",
    label: "Emergencia",
    color: "bg-red-500",
    duration: 60,
  },
];

export const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedTimeSlot,
  selectedDoctor,
  patients,
  appointments = [],
  preSelectedPatient, // NEW: Pre-selected patient
}) => {
  const { userProfile } = useAuth();

  // Create initial form data with better timezone handling
  const getInitialFormData = (): AppointmentFormData => {
    let dateValue = "";
    let timeValue = "";

    if (selectedTimeSlot) {
      // Use the selected time slot from calendar
      dateValue = formatDateForInput(selectedTimeSlot.date);
      timeValue = selectedTimeSlot.time;
    } else {
      // Default to current date/time when opening from "Nueva Cita" button
      const currentDateTime = getCurrentLocalDateTime();
      dateValue = currentDateTime.date;
      // Round to next hour for better UX
      const nextHour = new Date();
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      timeValue = formatTimeForInput(nextHour);
    }

    // Pre-fill patient data if provided
    const patientData = preSelectedPatient
      ? {
          patientId: preSelectedPatient.id,
          patientName: preSelectedPatient.fullName,
          patientPhone: preSelectedPatient.phone,
          patientEmail: preSelectedPatient.email,
          isNewPatient: false,
        }
      : {
          patientName: "",
          patientPhone: "",
          patientEmail: "",
          isNewPatient: false,
        };

    return {
      ...patientData,
      date: dateValue,
      time: timeValue,
      duration: 60,
      type: "consultation",
      reasonForVisit: "",
      notes: "",
    };
  };

  const [formData, setFormData] = useState<AppointmentFormData>(
    getInitialFormData()
  );
  const [patientSearch, setPatientSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData());
      setPatientSearch("");
      setValidationErrors({});
    }
  }, [isOpen, selectedTimeSlot, preSelectedPatient]); // Add preSelectedPatient to dependencies

  // Update duration when appointment type changes
  React.useEffect(() => {
    const selectedType = appointmentTypes.find(
      (type) => type.value === formData.type
    );
    if (selectedType) {
      setFormData((prev) => ({ ...prev, duration: selectedType.duration }));
    }
  }, [formData.type]);

  const filteredPatients = patients.filter(
    (patient) =>
      patient.fullName.toLowerCase().includes(patientSearch.toLowerCase()) ||
      patient.phone.includes(patientSearch) ||
      patient.email.toLowerCase().includes(patientSearch.toLowerCase())
  );

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

  // Handle smart calendar picker selection
  const handleCalendarSelection = (
    selectedDate: Date,
    selectedTime: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      date: formatDateForInput(selectedDate),
      time: selectedTime,
    }));
    setShowCalendarPicker(false);
    // Clear any date/time validation errors
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.date;
      delete newErrors.time;
      delete newErrors.datetime;
      return newErrors;
    });
  };

  // Validation function
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.patientName.trim()) {
      errors.patientName = "Nombre del paciente es requerido";
    }

    if (!formData.patientPhone.trim()) {
      errors.patientPhone = "Teléfono es requerido";
    }

    if (!formData.date) {
      errors.date = "Fecha es requerida";
    }

    if (!formData.time) {
      errors.time = "Hora es requerida";
    }

    if (
      formData.date &&
      formData.time &&
      !isFutureDateTime(formData.date, formData.time)
    ) {
      errors.datetime = "La cita debe ser en el futuro";
    }

    if (!formData.reasonForVisit.trim()) {
      errors.reasonForVisit = "Motivo de la visita es requerido";
    }

    if (
      formData.isNewPatient &&
      formData.patientEmail &&
      !/\S+@\S+\.\S+/.test(formData.patientEmail)
    ) {
      errors.patientEmail = "Email inválido";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitAppointment = async () => {
    if (!selectedDoctor || !validateForm()) return;

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

      // Create appointment timestamp from date and time
      const [year, month, day] = formData.date.split("-").map(Number);
      const [hours, minutes] = formData.time.split(":").map(Number);
      const appointmentDateTime = new Date(
        year,
        month - 1,
        day,
        hours,
        minutes
      );

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

      // Success callback
      onSuccess();
    } catch (err) {
      console.error("Error creating appointment:", err);
      setValidationErrors({
        submit: "Error al crear la cita. Intente nuevamente.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setFormData(getInitialFormData());
    setPatientSearch("");
    setValidationErrors({});
    onClose();
  };

  if (!isOpen) return null;

  const hasSelectedDateTime = formData.date && formData.time;
  const selectedDateTime = hasSelectedDateTime
    ? new Date(`${formData.date}T${formData.time}`)
    : null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Nueva Cita</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selected Time Display */}
            {selectedTimeSlot ? (
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
            ) : (
              <div className="bg-orange-50 p-3 rounded-lg">
                <h3 className="font-medium mb-1 flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  Nueva Cita
                </h3>
                <p className="text-sm text-orange-700">
                  Seleccione fecha y hora para la cita
                </p>
              </div>
            )}

            {/* Error Display */}
            {validationErrors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">
                  {validationErrors.submit}
                </p>
              </div>
            )}

            {validationErrors.datetime && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">
                  {validationErrors.datetime}
                </p>
              </div>
            )}

            {/* Patient Selection - Hide if patient is pre-selected */}
            {!preSelectedPatient && (
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
                          <div className="font-medium">{patient.fullName}</div>
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
            )}

            {/* Pre-selected Patient Display */}
            {preSelectedPatient && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <h3 className="font-medium mb-1 flex items-center text-blue-900">
                  <User className="mr-2 h-4 w-4" />
                  Paciente Seleccionado
                </h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <p>
                    <strong>Nombre:</strong> {preSelectedPatient.fullName}
                  </p>
                  <p>
                    <strong>Teléfono:</strong> {preSelectedPatient.phone}
                  </p>
                  <p>
                    <strong>Email:</strong> {preSelectedPatient.email}
                  </p>
                </div>
              </div>
            )}

            {/* Patient Info - Only show if patient is selected or it's a new patient */}
            {(formData.isNewPatient || formData.patientId) &&
              !preSelectedPatient && (
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
                      className={
                        validationErrors.patientName ? "border-red-500" : ""
                      }
                    />
                    {validationErrors.patientName && (
                      <p className="text-red-500 text-xs mt-1">
                        {validationErrors.patientName}
                      </p>
                    )}
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
                        className={
                          validationErrors.patientPhone ? "border-red-500" : ""
                        }
                      />
                      {validationErrors.patientPhone && (
                        <p className="text-red-500 text-xs mt-1">
                          {validationErrors.patientPhone}
                        </p>
                      )}
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
                        className={
                          validationErrors.patientEmail ? "border-red-500" : ""
                        }
                      />
                      {validationErrors.patientEmail && (
                        <p className="text-red-500 text-xs mt-1">
                          {validationErrors.patientEmail}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

            {/* Appointment Type Selection */}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
              >
                {appointmentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label} ({type.duration} min)
                  </option>
                ))}
              </select>
            </div>

            {/* Smart Date/Time Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Fecha y Hora de la Cita</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCalendarPicker(true)}
                  className="flex items-center"
                >
                  <CalendarCheck className="mr-2 h-4 w-4" />
                  Seleccionar Horario
                </Button>
              </div>

              {/* Current Selection Display */}
              {hasSelectedDateTime ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-green-900 mb-1">
                        Horario Seleccionado:
                      </h4>
                      <div className="text-sm text-green-800">
                        <div className="flex items-center mb-1">
                          <Calendar className="h-4 w-4 mr-2" />
                          {selectedDateTime!.toLocaleDateString("es-MX", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          {formData.time} ({formData.duration} minutos)
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCalendarPicker(true)}
                      className="text-green-700 hover:text-green-800"
                    >
                      Cambiar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500 mb-3">
                    Usa el calendario inteligente para seleccionar una fecha y
                    hora disponible
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCalendarPicker(true)}
                  >
                    <CalendarCheck className="mr-2 h-4 w-4" />
                    Abrir Calendario
                  </Button>
                </div>
              )}

              {/* Manual Input Fallback (hidden by default, can be shown with a toggle) */}
              <div className="text-xs text-gray-500">
                <details className="cursor-pointer">
                  <summary className="hover:text-gray-700">
                    ¿Prefieres introducir la fecha manualmente?
                  </summary>
                  <div className="mt-2 space-y-2">
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
                          disabled={!!selectedTimeSlot}
                          className={
                            validationErrors.date ? "border-red-500" : ""
                          }
                        />
                        {validationErrors.date && (
                          <p className="text-red-500 text-xs mt-1">
                            {validationErrors.date}
                          </p>
                        )}
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
                          disabled={!!selectedTimeSlot}
                          className={
                            validationErrors.time ? "border-red-500" : ""
                          }
                        />
                        {validationErrors.time && (
                          <p className="text-red-500 text-xs mt-1">
                            {validationErrors.time}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </details>
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
                className={
                  validationErrors.reasonForVisit ? "border-red-500" : ""
                }
              />
              {validationErrors.reasonForVisit && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.reasonForVisit}
                </p>
              )}
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
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleSubmitAppointment} disabled={isSaving}>
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

      {/* Smart Calendar Picker Modal */}
      <SmartCalendarPicker
        isOpen={showCalendarPicker}
        onClose={() => setShowCalendarPicker(false)}
        onSelectDateTime={handleCalendarSelection}
        appointments={appointments}
        patients={patients}
        selectedDoctor={selectedDoctor}
        appointmentDuration={formData.duration}
        initialDate={hasSelectedDateTime ? selectedDateTime! : new Date()}
      />
    </>
  );
};
