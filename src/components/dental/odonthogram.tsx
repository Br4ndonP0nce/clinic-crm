import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RotateCcw,
  Save,
  Info,
  AlertTriangle,
  CheckCircle,
  X,
  Plus,
} from "lucide-react";

// Tooth condition types
export type ToothCondition =
  | "healthy"
  | "caries"
  | "filling"
  | "crown"
  | "root_canal"
  | "extraction"
  | "implant"
  | "missing"
  | "bridge"
  | "veneer"
  | "sealant"
  | "crack"
  | "fracture"
  | "abscess"
  | "impacted";

// Surface types for teeth
export type ToothSurface =
  | "occlusal"
  | "mesial"
  | "distal"
  | "buccal"
  | "lingual"
  | "incisal";

// Tooth data structure
export interface ToothData {
  number: number;
  condition: ToothCondition;
  surfaces?: ToothSurface[];
  notes?: string;
  dateRecorded?: Date;
  recordedBy?: string;
}

// Odontogram data structure
export interface OdontogramData {
  teeth: Record<number, ToothData>;
  generalNotes?: string;
  lastUpdated?: Date;
  updatedBy?: string;
}

interface OdontogramProps {
  data?: OdontogramData;
  onDataChange?: (data: OdontogramData) => void;
  readOnly?: boolean;
  showNotes?: boolean;
  compact?: boolean;
  recordedBy?: string;
}

// Standard dental chart numbering (1-32 for adults)
const ADULT_TEETH = [
  // Upper jaw (right to left)
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  // Lower jaw (left to right)
  [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17],
];

const CONDITION_COLORS: Record<ToothCondition, string> = {
  healthy: "#10b981", // green
  caries: "#ef4444", // red
  filling: "#3b82f6", // blue
  crown: "#8b5cf6", // purple
  root_canal: "#f59e0b", // amber
  extraction: "#6b7280", // gray
  implant: "#06b6d4", // cyan
  missing: "#ffffff", // white
  bridge: "#ec4899", // pink
  veneer: "#84cc16", // lime
  sealant: "#14b8a6", // teal
  crack: "#f97316", // orange
  fracture: "#dc2626", // red-600
  abscess: "#991b1b", // red-800
  impacted: "#7c3aed", // violet
};

const CONDITION_LABELS: Record<ToothCondition, string> = {
  healthy: "Sano",
  caries: "Caries",
  filling: "Empaste",
  crown: "Corona",
  root_canal: "Endodoncia",
  extraction: "Extracción",
  implant: "Implante",
  missing: "Ausente",
  bridge: "Puente",
  veneer: "Carilla",
  sealant: "Sellador",
  crack: "Fisura",
  fracture: "Fractura",
  abscess: "Absceso",
  impacted: "Impactado",
};

export default function Odontogram({
  data,
  onDataChange,
  readOnly = false,
  showNotes = true,
  compact = false,
  recordedBy,
}: OdontogramProps) {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [selectedCondition, setSelectedCondition] =
    useState<ToothCondition>("healthy");
  const [showLegend, setShowLegend] = useState(true);
  const [generalNotes, setGeneralNotes] = useState(data?.generalNotes || "");

  const currentData = data || { teeth: {}, generalNotes: "" };

  const updateToothCondition = useCallback(
    (toothNumber: number, condition: ToothCondition) => {
      if (readOnly) return;

      const newData: OdontogramData = {
        ...currentData,
        teeth: {
          ...currentData.teeth,
          [toothNumber]: {
            number: toothNumber,
            condition,
            dateRecorded: new Date(),
            recordedBy: recordedBy || "Unknown",
            notes: currentData.teeth[toothNumber]?.notes || "",
          },
        },
        lastUpdated: new Date(),
        updatedBy: recordedBy || "Unknown",
      };

      onDataChange?.(newData);
    },
    [currentData, onDataChange, readOnly, recordedBy]
  );

  const clearTooth = useCallback(
    (toothNumber: number) => {
      if (readOnly) return;

      const newTeeth = { ...currentData.teeth };
      delete newTeeth[toothNumber];

      const newData: OdontogramData = {
        ...currentData,
        teeth: newTeeth,
        lastUpdated: new Date(),
        updatedBy: recordedBy || "Unknown",
      };

      onDataChange?.(newData);
    },
    [currentData, onDataChange, readOnly, recordedBy]
  );

  const updateGeneralNotes = useCallback(
    (notes: string) => {
      if (readOnly) return;

      const newData: OdontogramData = {
        ...currentData,
        generalNotes: notes,
        lastUpdated: new Date(),
        updatedBy: recordedBy || "Unknown",
      };

      setGeneralNotes(notes);
      onDataChange?.(newData);
    },
    [currentData, onDataChange, readOnly, recordedBy]
  );

  const getToothStyle = (toothNumber: number) => {
    const tooth = currentData.teeth[toothNumber];
    const condition = tooth?.condition || "healthy";
    const isSelected = selectedTooth === toothNumber;

    return {
      backgroundColor: CONDITION_COLORS[condition],
      border: isSelected ? "3px solid #1f2937" : "2px solid #d1d5db",
      borderRadius: "8px",
      width: compact ? "24px" : "32px",
      height: compact ? "24px" : "32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: readOnly ? "default" : "pointer",
      fontSize: compact ? "10px" : "12px",
      fontWeight: "bold",
      color: condition === "missing" ? "#374151" : "#ffffff",
      transition: "all 0.2s ease",
      transform: isSelected ? "scale(1.1)" : "scale(1)",
      boxShadow: isSelected
        ? "0 4px 12px rgba(0, 0, 0, 0.15)"
        : "0 2px 4px rgba(0, 0, 0, 0.1)",
    };
  };

  const handleToothClick = (toothNumber: number) => {
    if (readOnly) return;

    if (selectedTooth === toothNumber) {
      // Apply selected condition
      updateToothCondition(toothNumber, selectedCondition);
      setSelectedTooth(null);
    } else {
      // Select tooth
      setSelectedTooth(toothNumber);
    }
  };

  const renderTooth = (toothNumber: number) => {
    const tooth = currentData.teeth[toothNumber];

    return (
      <div
        key={toothNumber}
        style={getToothStyle(toothNumber)}
        onClick={() => handleToothClick(toothNumber)}
        title={
          tooth
            ? `${toothNumber}: ${CONDITION_LABELS[tooth.condition]}`
            : `Diente ${toothNumber}`
        }
        className="relative group"
      >
        {toothNumber}
        {tooth && tooth.notes && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
        )}
      </div>
    );
  };

  const renderConditionSelector = () => (
    <div className="grid grid-cols-4 md:grid-cols-8 gap-2 p-4 bg-gray-50 rounded-lg">
      {Object.entries(CONDITION_LABELS).map(([condition, label]) => (
        <button
          key={condition}
          onClick={() => setSelectedCondition(condition as ToothCondition)}
          className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all ${
            selectedCondition === condition
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
          title={label}
        >
          <div
            className="w-6 h-6 rounded mb-1"
            style={{
              backgroundColor: CONDITION_COLORS[condition as ToothCondition],
            }}
          />
          <span className="text-xs text-center leading-tight">{label}</span>
        </button>
      ))}
    </div>
  );

  const renderLegend = () => (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Leyenda</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLegend(!showLegend)}
          >
            {showLegend ? (
              <X className="h-4 w-4" />
            ) : (
              <Info className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {showLegend && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {Object.entries(CONDITION_LABELS).map(([condition, label]) => (
              <div key={condition} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{
                    backgroundColor:
                      CONDITION_COLORS[condition as ToothCondition],
                  }}
                />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );

  const getStatistics = () => {
    const teeth = Object.values(currentData.teeth);
    const total = teeth.length;
    const healthy = teeth.filter((t) => t.condition === "healthy").length;
    const caries = teeth.filter((t) => t.condition === "caries").length;
    const treated = teeth.filter((t) =>
      ["filling", "crown", "root_canal"].includes(t.condition)
    ).length;
    const missing = teeth.filter((t) =>
      ["extraction", "missing"].includes(t.condition)
    ).length;

    return { total, healthy, caries, treated, missing };
  };

  const stats = getStatistics();

  return (
    <div className="space-y-4">
      {/* Statistics */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <div className="bg-blue-50 p-2 rounded text-center">
            <div className="text-lg font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-blue-800">Total Registrados</div>
          </div>
          <div className="bg-green-50 p-2 rounded text-center">
            <div className="text-lg font-bold text-green-600">
              {stats.healthy}
            </div>
            <div className="text-xs text-green-800">Sanos</div>
          </div>
          <div className="bg-red-50 p-2 rounded text-center">
            <div className="text-lg font-bold text-red-600">{stats.caries}</div>
            <div className="text-xs text-red-800">Caries</div>
          </div>
          <div className="bg-purple-50 p-2 rounded text-center">
            <div className="text-lg font-bold text-purple-600">
              {stats.treated}
            </div>
            <div className="text-xs text-purple-800">Tratados</div>
          </div>
          <div className="bg-gray-50 p-2 rounded text-center">
            <div className="text-lg font-bold text-gray-600">
              {stats.missing}
            </div>
            <div className="text-xs text-gray-800">Ausentes</div>
          </div>
        </div>
      )}

      {/* Condition Selector */}
      {!readOnly && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Seleccionar Condición
              {selectedTooth && (
                <Badge variant="outline" className="ml-2">
                  Diente {selectedTooth} seleccionado
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {renderConditionSelector()}
            {selectedTooth && (
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    updateToothCondition(selectedTooth, selectedCondition)
                  }
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Aplicar {CONDITION_LABELS[selectedCondition]}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => clearTooth(selectedTooth)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpiar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedTooth(null)}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Odontogram Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            Odontograma
            {!readOnly && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newData: OdontogramData = {
                      teeth: {},
                      generalNotes: "",
                    };
                    onDataChange?.(newData);
                    setSelectedTooth(null);
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Limpiar Todo
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Upper Jaw */}
            <div>
              <div className="text-sm font-medium text-gray-600 mb-2 text-center">
                Maxilar Superior
              </div>
              <div className="flex justify-center gap-1">
                {ADULT_TEETH[0].map((toothNumber) => renderTooth(toothNumber))}
              </div>
            </div>

            {/* Jaw Separator */}
            <div className="border-t border-gray-300 my-4"></div>

            {/* Lower Jaw */}
            <div>
              <div className="text-sm font-medium text-gray-600 mb-2 text-center">
                Maxilar Inferior
              </div>
              <div className="flex justify-center gap-1">
                {ADULT_TEETH[1].map((toothNumber) => renderTooth(toothNumber))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* General Notes */}
      {showNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Notas Generales del Odontograma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={generalNotes}
              onChange={(e) => updateGeneralNotes(e.target.value)}
              placeholder="Observaciones generales sobre el estado dental..."
              className="w-full h-24 p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              readOnly={readOnly}
            />
            {currentData.lastUpdated && (
              <div className="mt-2 text-xs text-gray-500">
                Última actualización:{" "}
                {currentData.lastUpdated.toLocaleString("es-MX")}
                {currentData.updatedBy && ` por ${currentData.updatedBy}`}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      {renderLegend()}
    </div>
  );
}
