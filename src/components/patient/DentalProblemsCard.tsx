// src/components/patient/DentalProblemsCard.tsx
import React, { useState } from "react";
import { EditableCard } from "./EditableCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Patient } from "@/lib/firebase/db";
import { AlertTriangle, Plus, X } from "lucide-react";

interface DentalProblemsCardProps {
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

export const DentalProblemsCard: React.FC<DentalProblemsCardProps> = ({
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
  const [newProblemInput, setNewProblemInput] = useState("");

  const handleAddProblem = () => {
    if (newProblemInput.trim()) {
      onAddToArray("dentalHistory", "currentProblems", newProblemInput.trim());
      setNewProblemInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddProblem();
    }
  };

  const currentProblems =
    editableData.dentalHistory?.currentProblems ||
    patient.dentalHistory.currentProblems ||
    [];

  const viewContent = (
    <>
      {patient.dentalHistory.currentProblems.length > 0 ? (
        <div className="space-y-2">
          {patient.dentalHistory.currentProblems.map((problem, index) => (
            <div
              key={index}
              className="p-3 bg-orange-50 rounded border-l-4 border-orange-400"
            >
              {problem}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">
          Sin problemas dentales actuales reportados
        </p>
      )}
    </>
  );

  const editContent = (
    <div className="space-y-3">
      <div className="flex space-x-2">
        <Input
          placeholder="Agregar nuevo problema dental"
          value={newProblemInput}
          onChange={(e) => setNewProblemInput(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <Button
          type="button"
          size="sm"
          onClick={handleAddProblem}
          disabled={!newProblemInput.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {currentProblems.map((problem, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-orange-50 rounded border-l-4 border-orange-400"
          >
            <span>{problem}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                onRemoveFromArray("dentalHistory", "currentProblems", index)
              }
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {currentProblems.length === 0 && (
          <p className="text-gray-500 text-sm">
            No hay problemas dentales registrados
          </p>
        )}
      </div>
    </div>
  );

  return (
    <EditableCard
      title="Problemas Actuales"
      icon={<AlertTriangle className="h-5 w-5 text-orange-500" />}
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
