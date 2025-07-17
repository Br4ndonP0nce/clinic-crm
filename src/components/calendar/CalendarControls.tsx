// Optimized CalendarControls.tsx
import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";

export type CalendarView = "month" | "week" | "day";

interface CalendarControlsProps {
  currentDate: Date;
  view: CalendarView;
  onDateChange: (date: Date) => void;
  onViewChange: (view: CalendarView) => void;
}

const APPOINTMENT_TYPES = [
  { value: "consultation", label: "Consulta", color: "bg-blue-500" },
  { value: "cleaning", label: "Limpieza", color: "bg-green-500" },
  { value: "procedure", label: "Procedimiento", color: "bg-purple-500" },
  { value: "followup", label: "Seguimiento", color: "bg-orange-500" },
  { value: "emergency", label: "Emergencia", color: "bg-red-500" },
];

const VIEW_BUTTONS: Array<{ key: CalendarView; label: string }> = [
  { key: "day", label: "Día" },
  { key: "week", label: "Semana" },
  { key: "month", label: "Mes" },
];

export const CalendarControls: React.FC<CalendarControlsProps> = ({
  currentDate,
  view,
  onDateChange,
  onViewChange,
}) => {
  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    const increment = direction === "next" ? 1 : -1;

    switch (view) {
      case "day":
        newDate.setDate(newDate.getDate() + increment);
        break;
      case "week":
        newDate.setDate(newDate.getDate() + 7 * increment);
        break;
      case "month":
        newDate.setMonth(newDate.getMonth() + increment);
        break;
    }
    onDateChange(newDate);
  };

  const dateDisplayText = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = {};

    switch (view) {
      case "week": {
        const start = new Date(currentDate);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);

        return `${start.toLocaleDateString("es-MX", {
          day: "numeric",
          month: "short",
        })} - ${end.toLocaleDateString("es-MX", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}`;
      }
      case "month":
        return currentDate.toLocaleDateString("es-MX", {
          month: "long",
          year: "numeric",
        });
      case "day":
        return currentDate.toLocaleDateString("es-MX", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      default:
        return "";
    }
  }, [currentDate, view]);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Navigation */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate("prev")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate("next")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <h2 className="text-base sm:text-lg font-semibold min-w-0 truncate">
              {dateDisplayText}
            </h2>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onDateChange(new Date())}
              className="whitespace-nowrap"
            >
              Hoy
            </Button>
          </div>

          {/* View Controls */}
          <div className="flex items-center space-x-1">
            {VIEW_BUTTONS.map(({ key, label }) => (
              <Button
                key={key}
                variant={view === key ? "default" : "outline"}
                size="sm"
                onClick={() => onViewChange(key)}
                className="whitespace-nowrap"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Compact Legend */}
        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t">
          <span className="text-xs font-medium text-gray-600">Tipos:</span>
          {APPOINTMENT_TYPES.map((type) => (
            <div key={type.value} className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded ${type.color}`} />
              <span className="text-xs text-gray-600">{type.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
