// Optimized CalendarHeader.tsx
import React from "react";
import { Button } from "../ui/button";
import { Plus, Calendar } from "lucide-react";

interface CalendarHeaderProps {
  onNewAppointment: () => void;
  canCreateAppointments: boolean;
  appointmentCount?: number;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  onNewAppointment,
  canCreateAppointments,
  appointmentCount = 0,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
      <div className="flex items-center space-x-3">
        <Calendar className="h-6 w-6 text-blue-600" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Calendario</h1>
          <p className="text-sm text-gray-600">
            {appointmentCount > 0
              ? `${appointmentCount} cita${
                  appointmentCount !== 1 ? "s" : ""
                } programada${appointmentCount !== 1 ? "s" : ""}`
              : "Gestión de citas médicas"}
          </p>
        </div>
      </div>

      {canCreateAppointments && (
        <Button
          onClick={onNewAppointment}
          className="flex items-center whitespace-nowrap"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Cita
        </Button>
      )}
    </div>
  );
};
