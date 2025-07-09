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

export const CalendarControls: React.FC<CalendarControlsProps> = ({
  currentDate,
  view,
  onDateChange,
  onViewChange,
}) => {
  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (view === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else if (view === "month") {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    } else {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    }
    onDateChange(newDate);
  };

  const getDateDisplayText = () => {
    if (view === "week") {
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
    } else if (view === "month") {
      return currentDate.toLocaleDateString("es-MX", {
        month: "long",
        year: "numeric",
      });
    } else {
      return currentDate.toLocaleDateString("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  };

  const appointmentTypes = [
    { value: "consultation", label: "Consulta", color: "bg-blue-500" },
    { value: "cleaning", label: "Limpieza", color: "bg-green-500" },
    { value: "procedure", label: "Procedimiento", color: "bg-purple-500" },
    { value: "followup", label: "Seguimiento", color: "bg-orange-500" },
    { value: "emergency", label: "Emergencia", color: "bg-red-500" },
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <h2 className="text-lg font-semibold">{getDateDisplayText()}</h2>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onDateChange(new Date())}
            >
              Hoy
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={view === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => onViewChange("week")}
            >
              Semana
            </Button>
            <Button
              variant={view === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => onViewChange("month")}
            >
              Mes
            </Button>
            <Button
              variant={view === "day" ? "default" : "outline"}
              size="sm"
              onClick={() => onViewChange("day")}
            >
              Día
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
          <span className="text-sm font-medium text-gray-600">
            Tipos de cita:
          </span>
          {appointmentTypes.map((type) => (
            <div key={type.value} className="flex items-center space-x-1">
              <div className={`w-3 h-3 rounded ${type.color}`}></div>
              <span className="text-xs">{type.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
