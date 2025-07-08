import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info, X, Calendar, User, FileText } from "lucide-react";
import { OdontogramData, ToothCondition, ToothData } from "./odonthogram";

interface OdontogramViewerProps {
  data: OdontogramData;
  showLegend?: boolean;
  compact?: boolean;
  showStatistics?: boolean;
  showNotes?: boolean;
  onToothClick?: (toothNumber: number, toothData?: ToothData) => void;
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

export default function OdontogramViewer({
  data,
  showLegend = true,
  compact = false,
  showStatistics = true,
  showNotes = true,
  onToothClick,
}: OdontogramViewerProps) {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [showLegendPanel, setShowLegendPanel] = useState(showLegend);

  const getToothStyle = (toothNumber: number) => {
    const tooth = data.teeth[toothNumber];
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
      cursor: onToothClick ? "pointer" : "default",
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
    const tooth = data.teeth[toothNumber];
    setSelectedTooth(selectedTooth === toothNumber ? null : toothNumber);
    onToothClick?.(toothNumber, tooth);
  };

  const renderTooth = (toothNumber: number) => {
    const tooth = data.teeth[toothNumber];

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

        {/* Tooltip on hover */}
        {tooth && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
            {CONDITION_LABELS[tooth.condition]}
            {tooth.dateRecorded && (
              <div className="text-xs text-gray-300">
                {new Date(tooth.dateRecorded).toLocaleDateString("es-MX")}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const getStatistics = () => {
    const teeth = Object.values(data.teeth);
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
      {showStatistics && stats.total > 0 && (
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

      {/* Odontogram Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            Odontograma
            {showLegend && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowLegendPanel(!showLegendPanel)}
              >
                <Info className="h-4 w-4 mr-1" />
                {showLegendPanel ? "Ocultar" : "Mostrar"} Leyenda
              </Button>
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

      {/* Selected Tooth Details */}
      {selectedTooth && data.teeth[selectedTooth] && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              Detalles del Diente {selectedTooth}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedTooth(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ToothDetailDisplay tooth={data.teeth[selectedTooth]} />
          </CardContent>
        </Card>
      )}

      {/* General Notes */}
      {showNotes && data.generalNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Notas Generales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {data.generalNotes}
            </p>
            {data.lastUpdated && (
              <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                Última actualización:{" "}
                {new Date(data.lastUpdated).toLocaleString("es-MX")}
                {data.updatedBy && ` por ${data.updatedBy}`}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      {showLegendPanel && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Leyenda de Condiciones</CardTitle>
          </CardHeader>
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
        </Card>
      )}

      {/* Empty State */}
      {stats.total === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <FileText className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              No hay historial dental registrado
            </h3>
            <p className="text-gray-500">
              El odontograma se completará durante la consulta inicial.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Component to display individual tooth details
function ToothDetailDisplay({ tooth }: { tooth: ToothData }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Badge
            className="mb-2"
            style={{
              backgroundColor: CONDITION_COLORS[tooth.condition],
              color: tooth.condition === "missing" ? "#374151" : "#ffffff",
            }}
          >
            {CONDITION_LABELS[tooth.condition]}
          </Badge>
        </div>
        <div className="text-right text-sm text-gray-600">
          Diente #{tooth.number}
        </div>
      </div>

      {tooth.surfaces && tooth.surfaces.length > 0 && (
        <div>
          <label className="text-sm font-medium text-gray-700">
            Superficies Afectadas:
          </label>
          <div className="flex flex-wrap gap-1 mt-1">
            {tooth.surfaces.map((surface, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {surface}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {tooth.notes && (
        <div>
          <label className="text-sm font-medium text-gray-700">Notas:</label>
          <p className="text-sm text-gray-600 mt-1 p-2 bg-gray-50 rounded">
            {tooth.notes}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
        {tooth.dateRecorded && (
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            {new Date(tooth.dateRecorded).toLocaleDateString("es-MX")}
          </div>
        )}
        {tooth.recordedBy && (
          <div className="flex items-center">
            <User className="h-3 w-3 mr-1" />
            {tooth.recordedBy}
          </div>
        )}
      </div>
    </div>
  );
}
