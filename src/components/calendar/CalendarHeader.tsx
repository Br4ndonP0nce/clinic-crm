import { Button } from "../ui/button";
import { Plus } from "lucide-react";
interface CalendarHeaderProps {
  onNewAppointment: () => void;
  canCreateAppointments: boolean;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  onNewAppointment,
  canCreateAppointments,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold">Calendario de Citas</h1>
        <p className="text-gray-600">Gestión de citas médicas por doctor</p>
      </div>

      {canCreateAppointments && (
        <Button onClick={onNewAppointment}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Cita
        </Button>
      )}
    </div>
  );
};
