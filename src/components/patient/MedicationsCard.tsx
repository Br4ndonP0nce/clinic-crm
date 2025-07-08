// src/components/patient/MedicationsCard.tsx
import React, { useState } from "react";
import { EditableCard } from "./EditableCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Patient } from "@/lib/firebase/db";
import { Pill, Plus, X } from "lucide-react";

interface MedicationsCardProps {
  patient: Patient;
  isEditing: boolean;
  isSaving: boolean;
  canEdit: boolean;
  editableData: Partial<Patient>;
  validationErrors: Record<string, string>;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onAddToArray: (
    field: keyof Patient,
    arrayField: string,
    value: string
  ) => void;
  onRemoveFromArray: (
    field: keyof Patient,
    arrayField: string,
    index: number
  ) => void;
}

export const MedicationsCard: React.FC<MedicationsCardProps> = ({
  patient,
  isEditing,
  isSaving,
  canEdit,
  editableData,
  validationErrors,
  onEdit,
  onSave,
  onCancel,
  onAddToArray,
  onRemoveFromArray,
}) => {
  const [newMedicationInput, setNewMedicationInput] = useState("");

  const handleAddMedication = () => {
    if (newMedicationInput.trim()) {
      onAddToArray("medicalHistory", "medications", newMedicationInput.trim());
      setNewMedicationInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddMedication();
    }
  };

  const currentMedications =
    editableData.medicalHistory?.medications ||
    patient.medicalHistory.medications ||
    [];

  const viewContent = (
    <>
      {patient.medicalHistory.medications.length > 0 ? (
        <div className="space-y-2">
          {patient.medicalHistory.medications.map((medication, index) => (
            <div
              key={index}
              className="p-2 bg-blue-50 rounded border-l-4 border-blue-400"
            >
              {medication}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">Sin medicamentos actuales</p>
      )}
    </>
  );

  const editContent = (
    <div className="space-y-3">
      <div className="flex space-x-2">
        <Input
          placeholder="Agregar nuevo medicamento"
          value={newMedicationInput}
          onChange={(e) => setNewMedicationInput(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <Button
          type="button"
          size="sm"
          onClick={handleAddMedication}
          disabled={!newMedicationInput.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {currentMedications.map((medication, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-2 bg-blue-50 rounded border-l-4 border-blue-400"
          >
            <span>{medication}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                onRemoveFromArray("medicalHistory", "medications", index)
              }
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {currentMedications.length === 0 && (
          <p className="text-gray-500 text-sm">
            No hay medicamentos registrados
          </p>
        )}
      </div>
    </div>
  );

  return (
    <EditableCard
      title="Medicamentos"
      icon={<Pill className="h-5 w-5 text-blue-500" />}
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
