// ============================================================================
// NEW APPOINTMENT MODAL COMPONENT
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
import { Clock, Search, UserPlus, X, Save } from "lucide-react";

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

export const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedTimeSlot,
  selectedDoctor,
  patients,
}) => {
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState<AppointmentFormData>({
    ...initialFormData,
    date: selectedTimeSlot?.date.toISOString().split("T")[0] || "",
    time: selectedTimeSlot?.time || "",
  });
  const [patientSearch, setPatientSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        ...initialFormData,
        date: selectedTimeSlot?.date.toISOString().split("T")[0] || "",
        time: selectedTimeSlot?.time || "",
      });
      setPatientSearch("");
    }
  }, [isOpen, selectedTimeSlot]);

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

      // Success callback
      onSuccess();
    } catch (err) {
      console.error("Error creating appointment:", err);
      // You might want to add error handling here
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setPatientSearch("");
    onClose();
  };

  if (!isOpen) return null;

  return (
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
                disabled={!!selectedTimeSlot}
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
                disabled={!!selectedTimeSlot}
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
            <Button variant="outline" onClick={handleClose}>
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
  );
};
