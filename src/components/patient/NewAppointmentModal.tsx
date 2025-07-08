// src/components/patient/NewAppointmentModal.tsx
import React, { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserProfile } from "@/lib/firebase/rbac";
import { CalendarPlus, Loader2 } from "lucide-react";

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (appointmentData: NewAppointmentData) => Promise<void>;
  doctors: UserProfile[];
  patientName: string;
  isLoading?: boolean;
}

export interface NewAppointmentData {
  doctorId: string;
  date: string;
  time: string;
  duration: number;
  type: "consultation" | "cleaning" | "procedure" | "followup" | "emergency";
  reasonForVisit: string;
  notes: string;
}

export const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  doctors,
  patientName,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<NewAppointmentData>({
    doctorId: "",
    date: "",
    time: "",
    duration: 60,
    type: "consultation",
    reasonForVisit: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({
      doctorId: "",
      date: "",
      time: "",
      duration: 60,
      type: "consultation",
      reasonForVisit: "",
      notes: "",
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.doctorId) {
      newErrors.doctorId = "Selecciona un doctor";
    }
    if (!formData.date) {
      newErrors.date = "Selecciona una fecha";
    }
    if (!formData.time) {
      newErrors.time = "Selecciona una hora";
    }
    if (!formData.reasonForVisit.trim()) {
      newErrors.reasonForVisit = "Ingresa el motivo de la visita";
    }

    // Validate date is not in the past
    if (formData.date) {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.date = "La fecha no puede ser en el pasado";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error creating appointment:", error);
      setErrors({ submit: "Error al crear la cita. Inténtalo de nuevo." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  const updateFormData = (field: keyof NewAppointmentData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      consultation: "Consulta",
      cleaning: "Limpieza",
      procedure: "Procedimiento",
      followup: "Seguimiento",
      emergency: "Emergencia",
    };
    return labels[type] || type;
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CalendarPlus className="mr-2 h-5 w-5" />
            Nueva Cita para {patientName}
          </DialogTitle>
          <DialogDescription>Programar una nueva cita médica</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          )}

          {/* Doctor Selection */}
          <div>
            <Label htmlFor="appointmentDoctor">Doctor *</Label>
            <Select
              value={formData.doctorId}
              onValueChange={(value) => updateFormData("doctorId", value)}
            >
              <SelectTrigger
                className={errors.doctorId ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Seleccionar doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.uid} value={doctor.uid}>
                    Dr. {doctor.displayName || doctor.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.doctorId && (
              <p className="text-sm text-red-600 mt-1">{errors.doctorId}</p>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="appointmentDate">Fecha *</Label>
              <Input
                id="appointmentDate"
                type="date"
                min={today}
                value={formData.date}
                onChange={(e) => updateFormData("date", e.target.value)}
                className={errors.date ? "border-red-500" : ""}
              />
              {errors.date && (
                <p className="text-sm text-red-600 mt-1">{errors.date}</p>
              )}
            </div>
            <div>
              <Label htmlFor="appointmentTime">Hora *</Label>
              <Input
                id="appointmentTime"
                type="time"
                value={formData.time}
                onChange={(e) => updateFormData("time", e.target.value)}
                className={errors.time ? "border-red-500" : ""}
              />
              {errors.time && (
                <p className="text-sm text-red-600 mt-1">{errors.time}</p>
              )}
            </div>
          </div>

          {/* Type and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="appointmentType">Tipo de Cita</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => updateFormData("type", value)}
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
            <div>
              <Label htmlFor="appointmentDuration">Duración</Label>
              <Select
                value={formData.duration.toString()}
                onValueChange={(value) =>
                  updateFormData("duration", parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="90">1.5 horas</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reason for Visit */}
          <div>
            <Label htmlFor="appointmentReason">Motivo de la visita *</Label>
            <Input
              id="appointmentReason"
              value={formData.reasonForVisit}
              onChange={(e) => updateFormData("reasonForVisit", e.target.value)}
              placeholder="Motivo de la cita"
              className={errors.reasonForVisit ? "border-red-500" : ""}
            />
            {errors.reasonForVisit && (
              <p className="text-sm text-red-600 mt-1">
                {errors.reasonForVisit}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="appointmentNotes">Notas adicionales</Label>
            <Textarea
              id="appointmentNotes"
              value={formData.notes}
              onChange={(e) => updateFormData("notes", e.target.value)}
              placeholder="Notas sobre la cita (opcional)"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !formData.doctorId ||
              !formData.date ||
              !formData.time ||
              !formData.reasonForVisit.trim()
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              "Crear Cita"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
