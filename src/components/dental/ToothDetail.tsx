import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Save,
  Calendar,
  User,
  Edit2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { ToothData, ToothCondition, ToothSurface } from "./odonthogram";

interface ToothDetailModalProps {
  tooth: ToothData | null;
  toothNumber: number;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (toothData: ToothData) => void;
  onDelete?: (toothNumber: number) => void;
  readOnly?: boolean;
  currentUser?: string;
}

const CONDITION_OPTIONS: {
  value: ToothCondition;
  label: string;
  color: string;
}[] = [
  { value: "healthy", label: "Sano", color: "#10b981" },
  { value: "caries", label: "Caries", color: "#ef4444" },
  { value: "filling", label: "Empaste", color: "#3b82f6" },
  { value: "crown", label: "Corona", color: "#8b5cf6" },
  { value: "root_canal", label: "Endodoncia", color: "#f59e0b" },
  { value: "extraction", label: "Extracción", color: "#6b7280" },
  { value: "implant", label: "Implante", color: "#06b6d4" },
  { value: "missing", label: "Ausente", color: "#ffffff" },
  { value: "bridge", label: "Puente", color: "#ec4899" },
  { value: "veneer", label: "Carilla", color: "#84cc16" },
  { value: "sealant", label: "Sellador", color: "#14b8a6" },
  { value: "crack", label: "Fisura", color: "#f97316" },
  { value: "fracture", label: "Fractura", color: "#dc2626" },
  { value: "abscess", label: "Absceso", color: "#991b1b" },
  { value: "impacted", label: "Impactado", color: "#7c3aed" },
];

const SURFACE_OPTIONS: { value: ToothSurface; label: string }[] = [
  { value: "occlusal", label: "Oclusal" },
  { value: "mesial", label: "Mesial" },
  { value: "distal", label: "Distal" },
  { value: "buccal", label: "Vestibular" },
  { value: "lingual", label: "Lingual" },
  { value: "incisal", label: "Incisal" },
];

export default function ToothDetailModal({
  tooth,
  toothNumber,
  isOpen,
  onClose,
  onSave,
  onDelete,
  readOnly = false,
  currentUser,
}: ToothDetailModalProps) {
  const [isEditing, setIsEditing] = useState(!tooth && !readOnly);
  const [editData, setEditData] = useState<Partial<ToothData>>({
    number: toothNumber,
    condition: tooth?.condition || "healthy",
    surfaces: tooth?.surfaces || [],
    notes: tooth?.notes || "",
    dateRecorded: tooth?.dateRecorded || new Date(),
    recordedBy: tooth?.recordedBy || currentUser || "Unknown",
  });

  if (!isOpen) return null;

  const handleSave = () => {
    if (onSave && editData.condition) {
      const toothData: ToothData = {
        number: toothNumber,
        condition: editData.condition,
        surfaces: editData.surfaces || [],
        notes: editData.notes || "",
        dateRecorded: new Date(),
        recordedBy: currentUser || "Unknown",
      };
      onSave(toothData);
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (
      onDelete &&
      confirm(
        `¿Está seguro de que desea eliminar la información del diente ${toothNumber}?`
      )
    ) {
      onDelete(toothNumber);
      onClose();
    }
  };

  const toggleSurface = (surface: ToothSurface) => {
    const currentSurfaces = editData.surfaces || [];
    if (currentSurfaces.includes(surface)) {
      setEditData({
        ...editData,
        surfaces: currentSurfaces.filter((s) => s !== surface),
      });
    } else {
      setEditData({
        ...editData,
        surfaces: [...currentSurfaces, surface],
      });
    }
  };

  const selectedCondition = CONDITION_OPTIONS.find(
    (opt) => opt.value === editData.condition
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-3"
              style={{
                backgroundColor: selectedCondition?.color || "#10b981",
                color: editData.condition === "missing" ? "#374151" : "#ffffff",
              }}
            >
              {toothNumber}
            </div>
            Diente {toothNumber}
          </CardTitle>

          <div className="flex items-center gap-2">
            {!readOnly && tooth && !isEditing && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}

            {!readOnly && tooth && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}

            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Condition Selection */}
          <div>
            <Label>Condición del Diente</Label>
            {isEditing ? (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {CONDITION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      setEditData({ ...editData, condition: option.value })
                    }
                    className={`flex items-center p-2 rounded-lg border text-sm ${
                      editData.condition === option.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded mr-2"
                      style={{ backgroundColor: option.color }}
                    />
                    {option.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-2">
                <Badge
                  className="text-sm px-3 py-1"
                  style={{
                    backgroundColor: selectedCondition?.color || "#10b981",
                    color:
                      editData.condition === "missing" ? "#374151" : "#ffffff",
                  }}
                >
                  {selectedCondition?.label || "Desconocido"}
                </Badge>
              </div>
            )}
          </div>

          {/* Surface Selection */}
          {editData.condition &&
            !["missing", "extraction"].includes(editData.condition) && (
              <div>
                <Label>Superficies Afectadas</Label>
                {isEditing ? (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {SURFACE_OPTIONS.map((surface) => (
                      <button
                        key={surface.value}
                        onClick={() => toggleSurface(surface.value)}
                        className={`p-2 rounded border text-sm ${
                          editData.surfaces?.includes(surface.value)
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {surface.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2">
                    {editData.surfaces && editData.surfaces.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {editData.surfaces.map((surface, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {SURFACE_OPTIONS.find((s) => s.value === surface)
                              ?.label || surface}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        No se especificaron superficies
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

          {/* Notes */}
          <div>
            <Label htmlFor="toothNotes">Notas del Tratamiento</Label>
            {isEditing ? (
              <Textarea
                id="toothNotes"
                value={editData.notes || ""}
                onChange={(e) =>
                  setEditData({ ...editData, notes: e.target.value })
                }
                placeholder="Observaciones sobre el diente, tratamiento realizado, recomendaciones..."
                rows={3}
                className="mt-1"
              />
            ) : (
              <div className="mt-1 p-3 bg-gray-50 rounded border min-h-[60px]">
                {editData.notes ? (
                  <p className="text-sm whitespace-pre-wrap">
                    {editData.notes}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    Sin notas adicionales
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Record Information */}
          {tooth && (
            <div className="pt-3 border-t">
              <h4 className="font-medium text-sm text-gray-700 mb-2">
                Información del Registro
              </h4>
              <div className="space-y-1 text-sm text-gray-600">
                {tooth.dateRecorded && (
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-2" />
                    Registrado:{" "}
                    {new Date(tooth.dateRecorded).toLocaleString("es-MX")}
                  </div>
                )}
                {tooth.recordedBy && (
                  <div className="flex items-center">
                    <User className="h-3 w-3 mr-2" />
                    Por: {tooth.recordedBy}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Warning for serious conditions */}
          {editData.condition &&
            ["abscess", "fracture", "impacted"].includes(
              editData.condition
            ) && (
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <div className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 mr-2" />
                  <div>
                    <h4 className="font-medium text-red-900 text-sm">
                      Condición que Requiere Atención
                    </h4>
                    <p className="text-red-800 text-xs mt-1">
                      Esta condición puede requerir tratamiento urgente.
                      Asegúrese de programar la cita apropiada.
                    </p>
                  </div>
                </div>
              </div>
            )}
        </CardContent>

        {/* Action Buttons */}
        {isEditing && !readOnly && (
          <div className="flex justify-end gap-2 p-6 pt-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                if (!tooth) onClose();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Guardar
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
