// src/components/patient/AddressCard.tsx
import React from "react";
import { EditableCard } from "./EditableCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Patient } from "@/lib/firebase/db";
import { MapPin } from "lucide-react";

interface AddressCardProps {
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

export const AddressCard: React.FC<AddressCardProps> = ({
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
  const updateAddress = (field: keyof Patient["address"], value: string) => {
    onUpdateData({
      address: {
        ...patient.address, // Always include the original address
        ...editableData.address, // Then overlay any existing edits
        [field]: value, // Finally set the specific field
      },
    });
  };

  const viewContent = (
    <div className="space-y-2">
      <p>{patient.address.street}</p>
      <p>
        {patient.address.city}, {patient.address.state}{" "}
        {patient.address.zipCode}
      </p>
      <p>{patient.address.country}</p>
    </div>
  );

  const editContent = (
    <div className="space-y-4">
      <div>
        <Label htmlFor="street">Calle y Número *</Label>
        <Input
          id="street"
          value={editableData.address?.street || patient.address.street || ""}
          onChange={(e) => updateAddress("street", e.target.value)}
          className={validationErrors.street ? "border-red-500" : ""}
          placeholder="Calle y número"
        />
        {validationErrors.street && (
          <p className="text-sm text-red-600 mt-1">{validationErrors.street}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">Ciudad *</Label>
          <Input
            id="city"
            value={editableData.address?.city || patient.address.city || ""}
            onChange={(e) => updateAddress("city", e.target.value)}
            className={validationErrors.city ? "border-red-500" : ""}
            placeholder="Ciudad"
          />
          {validationErrors.city && (
            <p className="text-sm text-red-600 mt-1">{validationErrors.city}</p>
          )}
        </div>

        <div>
          <Label htmlFor="state">Estado *</Label>
          <Input
            id="state"
            value={editableData.address?.state || patient.address.state || ""}
            onChange={(e) => updateAddress("state", e.target.value)}
            className={validationErrors.state ? "border-red-500" : ""}
            placeholder="Estado"
          />
          {validationErrors.state && (
            <p className="text-sm text-red-600 mt-1">
              {validationErrors.state}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="zipCode">Código Postal *</Label>
          <Input
            id="zipCode"
            value={
              editableData.address?.zipCode || patient.address.zipCode || ""
            }
            onChange={(e) => updateAddress("zipCode", e.target.value)}
            className={validationErrors.zipCode ? "border-red-500" : ""}
            placeholder="45000"
          />
          {validationErrors.zipCode && (
            <p className="text-sm text-red-600 mt-1">
              {validationErrors.zipCode}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="country">País</Label>
          <Input
            id="country"
            value={
              editableData.address?.country || patient.address.country || ""
            }
            onChange={(e) => updateAddress("country", e.target.value)}
            placeholder="México"
          />
        </div>
      </div>
    </div>
  );

  return (
    <EditableCard
      title="Dirección"
      icon={<MapPin className="h-5 w-5" />}
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
