// src/components/patient/DentalHistoryCard.tsx
import React from "react";
import { EditableCard } from "./EditableCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Patient } from "@/lib/firebase/db";
import { Stethoscope } from "lucide-react";

interface DentalHistoryCardProps {
  patient: Patient;
  isEditing: boolean;
  isSaving: boolean;
  canEdit: boolean;
  editableData: Partial<Patient>;
  validationErrors: Record<string, string>;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onUpdateData: (data: Partial<Patient>) => void;
}

export const DentalHistoryCard: React.FC<DentalHistoryCardProps> = ({
  patient,
  isEditing,
  isSaving,
  canEdit,
  editableData,
  validationErrors,
  onEdit,
  onSave,
  onCancel,
  onUpdateData,
}) => {
  const updateDentalHistory = (
    field: keyof Patient["dentalHistory"],
    value: any
  ) => {
    onUpdateData({
      dentalHistory: {
        ...patient.dentalHistory,
        ...editableData.dentalHistory,
        [field]: value,
      },
    });
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const getHygieneLabel = (hygiene: string) => {
    const labels: Record<string, string> = {
      excellent: "Excelente",
      good: "Buena",
      fair: "Regular",
      poor: "Deficiente",
    };
    return labels[hygiene] || hygiene;
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      twice_daily: "Dos veces al día",
      daily: "Una vez al día",
      few_times_week: "Pocas veces por semana",
      weekly: "Semanalmente",
      rarely: "Raramente",
      never: "Nunca",
    };
    return labels[frequency] || frequency;
  };

  const viewContent = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-500">
            Última Visita Dental
          </label>
          <p className="mt-1">
            {patient.dentalHistory.lastVisit
              ? formatDate(patient.dentalHistory.lastVisit)
              : "No registrada"}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">
            Última Limpieza
          </label>
          <p className="mt-1">
            {patient.dentalHistory.lastCleaning
              ? formatDate(patient.dentalHistory.lastCleaning)
              : "No registrada"}
          </p>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-500">
          Dentista Anterior
        </label>
        <p className="mt-1">
          {patient.dentalHistory.previousDentist || "No especificado"}
        </p>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-500">
          Motivo de Consulta
        </label>
        <p className="mt-1">{patient.dentalHistory.reasonForVisit}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-500">
            Higiene Oral
          </label>
          <p className="mt-1">
            {getHygieneLabel(patient.dentalHistory.oralHygiene)}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">
            Frecuencia de Cepillado
          </label>
          <p className="mt-1">
            {getFrequencyLabel(patient.dentalHistory.brushingFrequency)}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">
            Uso de Hilo Dental
          </label>
          <p className="mt-1">
            {getFrequencyLabel(patient.dentalHistory.flossingFrequency)}
          </p>
        </div>
      </div>

      {patient.dentalHistory.painLevel && (
        <div>
          <label className="text-sm font-medium text-gray-500">
            Nivel de Dolor
          </label>
          <p className="mt-1 text-red-600 font-medium">
            {patient.dentalHistory.painLevel}/10
          </p>
        </div>
      )}
    </div>
  );

  const editContent = (
    <div className="space-y-4">
      <div>
        <Label htmlFor="previousDentist">Dentista Anterior</Label>
        <Input
          id="previousDentist"
          value={
            editableData.dentalHistory?.previousDentist ||
            patient.dentalHistory.previousDentist ||
            ""
          }
          onChange={(e) =>
            updateDentalHistory("previousDentist", e.target.value)
          }
          placeholder="Nombre del dentista anterior"
        />
      </div>

      <div>
        <Label htmlFor="reasonForVisit">Motivo de Consulta</Label>
        <Input
          id="reasonForVisit"
          value={
            editableData.dentalHistory?.reasonForVisit ||
            patient.dentalHistory.reasonForVisit ||
            ""
          }
          onChange={(e) =>
            updateDentalHistory("reasonForVisit", e.target.value)
          }
          placeholder="Motivo principal de la visita"
        />
      </div>

      <div>
        <Label htmlFor="painLevel">Nivel de Dolor (0-10)</Label>
        <Input
          id="painLevel"
          type="number"
          min="0"
          max="10"
          value={
            editableData.dentalHistory?.painLevel ||
            patient.dentalHistory.painLevel ||
            ""
          }
          onChange={(e) =>
            updateDentalHistory("painLevel", parseInt(e.target.value) || 0)
          }
          placeholder="0-10"
        />
      </div>

      <div>
        <Label htmlFor="oralHygiene">Higiene Oral General</Label>
        <Select
          value={
            editableData.dentalHistory?.oralHygiene ||
            patient.dentalHistory.oralHygiene ||
            "good"
          }
          onValueChange={(value) => updateDentalHistory("oralHygiene", value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="excellent">Excelente</SelectItem>
            <SelectItem value="good">Buena</SelectItem>
            <SelectItem value="fair">Regular</SelectItem>
            <SelectItem value="poor">Deficiente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="brushingFrequency">Frecuencia de Cepillado</Label>
          <Select
            value={
              editableData.dentalHistory?.brushingFrequency ||
              patient.dentalHistory.brushingFrequency ||
              "twice_daily"
            }
            onValueChange={(value) =>
              updateDentalHistory("brushingFrequency", value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="twice_daily">Dos veces al día</SelectItem>
              <SelectItem value="daily">Una vez al día</SelectItem>
              <SelectItem value="few_times_week">
                Pocas veces por semana
              </SelectItem>
              <SelectItem value="rarely">Raramente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="flossingFrequency">
            Frecuencia de Uso de Hilo Dental
          </Label>
          <Select
            value={
              editableData.dentalHistory?.flossingFrequency ||
              patient.dentalHistory.flossingFrequency ||
              "daily"
            }
            onValueChange={(value) =>
              updateDentalHistory("flossingFrequency", value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Diariamente</SelectItem>
              <SelectItem value="few_times_week">
                Pocas veces por semana
              </SelectItem>
              <SelectItem value="weekly">Semanalmente</SelectItem>
              <SelectItem value="rarely">Raramente</SelectItem>
              <SelectItem value="never">Nunca</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  return (
    <EditableCard
      title="Historial Dental"
      icon={<Stethoscope className="h-5 w-5" />}
      isEditing={isEditing}
      isSaving={isSaving}
      canEdit={canEdit}
      validationErrors={validationErrors}
      onEdit={onEdit}
      onSave={onSave}
      onCancel={onCancel}
      viewContent={viewContent}
      editContent={editContent}
    />
  );
};
