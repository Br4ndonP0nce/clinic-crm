// src/components/patient/AllergiesCard.tsx
import React, { useState } from "react";
import { EditableCard } from "./EditableCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Patient } from "@/lib/firebase/db";
import { AlertTriangle, Plus, X } from "lucide-react";

interface AllergiesCardProps {
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

export const AllergiesCard: React.FC<AllergiesCardProps> = ({
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
  const [newAllergyInput, setNewAllergyInput] = useState("");

  const handleAddAllergy = () => {
    if (newAllergyInput.trim()) {
      onAddToArray("medicalHistory", "allergies", newAllergyInput.trim());
      setNewAllergyInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddAllergy();
    }
  };

  const currentAllergies =
    editableData.medicalHistory?.allergies ||
    patient.medicalHistory.allergies ||
    [];

  const viewContent = (
    <>
      {patient.medicalHistory.allergies.length > 0 ? (
        <div className="space-y-2">
          {patient.medicalHistory.allergies.map((allergy, index) => (
            <Badge
              key={index}
              variant="outline"
              className="mr-2 mb-2 bg-red-50 text-red-700 border-red-200"
            >
              {allergy}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">Sin alergias conocidas</p>
      )}
    </>
  );

  const editContent = (
    <div className="space-y-3">
      <div className="flex space-x-2">
        <Input
          placeholder="Agregar nueva alergia"
          value={newAllergyInput}
          onChange={(e) => setNewAllergyInput(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <Button
          type="button"
          size="sm"
          onClick={handleAddAllergy}
          disabled={!newAllergyInput.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {currentAllergies.map((allergy, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-2 bg-red-50 rounded border-l-4 border-red-400"
          >
            <span>{allergy}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                onRemoveFromArray("medicalHistory", "allergies", index)
              }
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {currentAllergies.length === 0 && (
          <p className="text-gray-500 text-sm">No hay alergias registradas</p>
        )}
      </div>
    </div>
  );

  return (
    <EditableCard
      title="Alergias"
      icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
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
