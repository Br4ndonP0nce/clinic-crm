// src/components/patient/ContactInfoCard.tsx
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
import { Badge } from "@/components/ui/badge";
import { Patient } from "@/lib/firebase/db";
import { User, Mail, Phone } from "lucide-react";

interface ContactInfoCardProps {
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

const getStatusColor = (status: Patient["status"]) => {
  switch (status) {
    case "inquiry":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "scheduled":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "active":
      return "bg-green-100 text-green-800 border-green-200";
    case "treatment":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "maintenance":
      return "bg-teal-100 text-teal-800 border-teal-200";
    case "inactive":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getStatusLabel = (status: Patient["status"]) => {
  switch (status) {
    case "inquiry":
      return "Consulta";
    case "scheduled":
      return "Programado";
    case "active":
      return "Activo";
    case "treatment":
      return "En Tratamiento";
    case "maintenance":
      return "Mantenimiento";
    case "inactive":
      return "Inactivo";
    case "transferred":
      return "Transferido";
    default:
      return "Desconocido";
  }
};

export const ContactInfoCard: React.FC<ContactInfoCardProps> = ({
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
  const viewContent = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-500">Nombre</label>
          <p className="mt-1">{patient.firstName}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Apellido</label>
          <p className="mt-1">{patient.lastName}</p>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-500">
          Estado del Paciente
        </label>
        <div className="mt-1">
          <Badge className={getStatusColor(patient.status)}>
            {getStatusLabel(patient.status)}
          </Badge>
        </div>
      </div>

      <div className="flex items-center">
        <Mail className="h-4 w-4 text-gray-500 mr-2" />
        <a
          href={`mailto:${patient.email}`}
          className="text-blue-600 hover:underline"
        >
          {patient.email}
        </a>
      </div>

      <div className="flex items-center">
        <Phone className="h-4 w-4 text-gray-500 mr-2" />
        <a href={`tel:${patient.phone}`} className="hover:underline">
          {patient.phone}
        </a>
      </div>

      {patient.alternatePhone && (
        <div className="flex items-center">
          <Phone className="h-4 w-4 text-gray-500 mr-2" />
          <span className="text-sm">
            Teléfono alternativo: {patient.alternatePhone}
          </span>
        </div>
      )}
    </div>
  );

  const editContent = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">Nombre *</Label>
          <Input
            id="firstName"
            value={editableData.firstName || ""}
            onChange={(e) => onUpdateData({ firstName: e.target.value })}
            className={validationErrors.firstName ? "border-red-500" : ""}
            placeholder="Nombre"
          />
          {validationErrors.firstName && (
            <p className="text-sm text-red-600 mt-1">
              {validationErrors.firstName}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="lastName">Apellido *</Label>
          <Input
            id="lastName"
            value={editableData.lastName || ""}
            onChange={(e) => onUpdateData({ lastName: e.target.value })}
            className={validationErrors.lastName ? "border-red-500" : ""}
            placeholder="Apellido"
          />
          {validationErrors.lastName && (
            <p className="text-sm text-red-600 mt-1">
              {validationErrors.lastName}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="status">Estado del Paciente</Label>
        <Select
          value={editableData.status || patient.status}
          onValueChange={(value: Patient["status"]) =>
            onUpdateData({ status: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inquiry">Consulta</SelectItem>
            <SelectItem value="scheduled">Programado</SelectItem>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="treatment">En Tratamiento</SelectItem>
            <SelectItem value="maintenance">Mantenimiento</SelectItem>
            <SelectItem value="inactive">Inactivo</SelectItem>
            <SelectItem value="transferred">Transferido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={editableData.email || ""}
          onChange={(e) => onUpdateData({ email: e.target.value })}
          className={validationErrors.email ? "border-red-500" : ""}
          placeholder="email@ejemplo.com"
        />
        {validationErrors.email && (
          <p className="text-sm text-red-600 mt-1">{validationErrors.email}</p>
        )}
      </div>

      <div>
        <Label htmlFor="phone">Teléfono *</Label>
        <Input
          id="phone"
          type="tel"
          value={editableData.phone || ""}
          onChange={(e) => onUpdateData({ phone: e.target.value })}
          className={validationErrors.phone ? "border-red-500" : ""}
          placeholder="+52 33 1234 5678"
        />
        {validationErrors.phone && (
          <p className="text-sm text-red-600 mt-1">{validationErrors.phone}</p>
        )}
      </div>

      <div>
        <Label htmlFor="alternatePhone">Teléfono Alternativo</Label>
        <Input
          id="alternatePhone"
          type="tel"
          value={editableData.alternatePhone || ""}
          onChange={(e) => onUpdateData({ alternatePhone: e.target.value })}
          placeholder="Teléfono alternativo (opcional)"
        />
      </div>
    </div>
  );

  return (
    <EditableCard
      title="Información de Contacto"
      icon={<User className="h-5 w-5" />}
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
