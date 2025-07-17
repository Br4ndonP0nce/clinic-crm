// Optimized CalendarViews.tsx
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar1, Clock, Stethoscope } from "lucide-react";
import { Appointment, Patient } from "@/lib/firebase/db";
import { CalendarView } from "../CalendarPage";

interface CalendarViewsProps {
  view: CalendarView;
  currentDate: Date;
  appointments: Appointment[];
  patients: Patient[];
  selectedDoctor: string;
  onTimeSlotClick: (date: Date, time: string) => void;
  onAppointmentClick: (appointment: Appointment) => void;
  canCreateAppointments: boolean;
}

const APPOINTMENT_TYPES = [
  { value: "consultation", label: "Consulta", color: "bg-blue-500" },
  { value: "cleaning", label: "Limpieza", color: "bg-green-500" },
  { value: "procedure", label: "Procedimiento", color: "bg-purple-500" },
  { value: "followup", label: "Seguimiento", color: "bg-orange-500" },
  { value: "emergency", label: "Emergencia", color: "bg-red-500" },
];

const TIME_SLOTS = Array.from({ length: 20 }, (_, i) => {
  const hour = Math.floor(8 + i / 2);
  const minute = (i % 2) * 30;
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
});

// Utility functions
const getWeekDays = (currentDate: Date) => {
  const start = new Date(currentDate);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return date;
  });
};

const getMonthDays = (currentDate: Date) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  const startDay = firstDay.getDay();
  const daysFromMonday = startDay === 0 ? 6 : startDay - 1;
  startDate.setDate(firstDay.getDate() - daysFromMonday);

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    return date;
  });
};

const getAppointmentForSlot = (
  appointments: Appointment[],
  date: Date,
  time: string
) => {
  const slotDateTime = new Date(`${date.toISOString().split("T")[0]}T${time}`);
  return appointments.find((apt) => {
    const aptDate = apt.appointmentDate.toDate();
    return aptDate.getTime() === slotDateTime.getTime();
  });
};

const getAppointmentsForDay = (appointments: Appointment[], date: Date) => {
  return appointments.filter((apt) => {
    const aptDate = apt.appointmentDate.toDate();
    return aptDate.toDateString() === date.toDateString();
  });
};

// Appointment component
const AppointmentCard: React.FC<{
  appointment: Appointment;
  patient?: Patient;
  compact?: boolean;
  showTooltip?: boolean;
  onClick: (e?: React.MouseEvent) => void;
}> = ({
  appointment,
  patient,
  compact = false,
  showTooltip = false,
  onClick,
}) => {
  const appointmentType = APPOINTMENT_TYPES.find(
    (t) => t.value === appointment.type
  );

  return (
    <div
      className={`p-1 rounded text-white text-xs cursor-pointer transition-opacity hover:opacity-90 ${
        appointmentType?.color || "bg-gray-500"
      } ${appointment.status === "cancelled" ? "opacity-50" : ""} ${
        showTooltip ? "relative group" : ""
      }`}
      onClick={(e) => onClick(e)}
    >
      {compact ? (
        <div className="truncate font-medium">
          {appointment.appointmentDate.toDate().toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      ) : (
        <>
          <div className="font-medium truncate">
            {patient?.fullName || "Paciente"}
          </div>
          <div className="truncate">{appointmentType?.label}</div>
          {!compact && (
            <div className="text-xs opacity-75">{appointment.duration}min</div>
          )}
        </>
      )}

      {showTooltip && (
        <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
          {appointment.reasonForVisit}
        </div>
      )}
    </div>
  );
};

// Time slot component
const TimeSlot: React.FC<{
  date: Date;
  time: string;
  appointment?: Appointment;
  patient?: Patient;
  canCreate: boolean;
  isWeekend?: boolean;
  onTimeSlotClick: (date: Date, time: string) => void;
  onAppointmentClick: (appointment: Appointment) => void;
}> = ({
  date,
  time,
  appointment,
  patient,
  canCreate,
  isWeekend,
  onTimeSlotClick,
  onAppointmentClick,
}) => {
  if (appointment) {
    return (
      <AppointmentCard
        appointment={appointment}
        patient={patient}
        showTooltip
        onClick={() => onAppointmentClick(appointment)}
      />
    );
  }

  if (isWeekend) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400">
        <span className="text-xs">Fin de semana</span>
      </div>
    );
  }

  return canCreate ? (
    <div
      className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer hover:bg-blue-50"
      onClick={() => onTimeSlotClick(date, time)}
    >
      <Plus className="h-4 w-4 text-gray-400" />
    </div>
  ) : null;
};

// Month View
const MonthView: React.FC<CalendarViewsProps> = ({
  currentDate,
  appointments,
  patients,
  onTimeSlotClick,
  onAppointmentClick,
  canCreateAppointments,
}) => {
  const monthDays = useMemo(() => getMonthDays(currentDate), [currentDate]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center">
          <Calendar1 className="mr-2 h-4 w-4" />
          Vista Mensual
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-7 border-b">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
            <div
              key={day}
              className="p-2 border-r bg-gray-50 text-center text-sm font-medium"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {monthDays.map((date, index) => {
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            const isToday = date.toDateString() === new Date().toDateString();
            const dayAppointments = getAppointmentsForDay(appointments, date);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            return (
              <div
                key={index}
                className={`min-h-[100px] p-1 border-r border-b ${
                  !isCurrentMonth
                    ? "bg-gray-50 text-gray-400"
                    : isToday
                    ? "bg-blue-50"
                    : isWeekend
                    ? "bg-gray-100"
                    : "bg-white hover:bg-gray-50"
                } ${
                  canCreateAppointments && isCurrentMonth && !isWeekend
                    ? "cursor-pointer"
                    : ""
                }`}
                onClick={() => {
                  if (canCreateAppointments && isCurrentMonth && !isWeekend) {
                    onTimeSlotClick(date, "09:00");
                  }
                }}
              >
                <div
                  className={`text-sm font-medium mb-1 ${
                    isToday ? "text-blue-600" : ""
                  }`}
                >
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayAppointments.slice(0, 2).map((appointment) => {
                    const patient = patients.find(
                      (p) => p.id === appointment.patientId
                    );
                    return (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        patient={patient}
                        compact
                        onClick={(e) => {
                          e?.stopPropagation();
                          onAppointmentClick(appointment);
                        }}
                      />
                    );
                  })}
                  {dayAppointments.length > 2 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayAppointments.length - 2}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// Week View
const WeekView: React.FC<CalendarViewsProps> = ({
  currentDate,
  appointments,
  patients,
  onTimeSlotClick,
  onAppointmentClick,
  canCreateAppointments,
}) => {
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center">
          <Calendar1 className="mr-2 h-4 w-4" />
          Vista Semanal
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Header */}
            <div className="grid grid-cols-8 border-b">
              <div className="p-2 border-r bg-gray-50 text-sm font-medium">
                Hora
              </div>
              {weekDays.map((day, index) => {
                const isToday =
                  day.toDateString() === new Date().toDateString();
                const dayAppointments = getAppointmentsForDay(
                  appointments,
                  day
                );

                return (
                  <div
                    key={index}
                    className={`p-2 border-r text-center ${
                      isToday ? "bg-blue-50" : "bg-gray-50"
                    }`}
                  >
                    <div className="text-sm font-medium">
                      {day.toLocaleDateString("es-MX", { weekday: "short" })}
                    </div>
                    <div
                      className={`text-lg font-bold ${
                        isToday ? "text-blue-600" : ""
                      }`}
                    >
                      {day.getDate()}
                    </div>
                    {dayAppointments.length > 0 && (
                      <div className="text-xs text-gray-600">
                        {dayAppointments.length}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Time slots */}
            <div className="max-h-[500px] overflow-y-auto">
              {TIME_SLOTS.map((time) => (
                <div
                  key={time}
                  className="grid grid-cols-8 border-b hover:bg-gray-50"
                >
                  <div className="p-2 border-r bg-gray-50 text-center text-sm font-medium">
                    {time}
                  </div>
                  {weekDays.map((day, dayIndex) => {
                    const appointment = getAppointmentForSlot(
                      appointments,
                      day,
                      time
                    );
                    const patient = appointment
                      ? patients.find((p) => p.id === appointment.patientId)
                      : undefined;
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                    return (
                      <div
                        key={dayIndex}
                        className={`p-1 border-r min-h-[50px] ${
                          isWeekend ? "bg-gray-100" : ""
                        }`}
                      >
                        <TimeSlot
                          date={day}
                          time={time}
                          appointment={appointment}
                          patient={patient}
                          canCreate={canCreateAppointments}
                          isWeekend={isWeekend}
                          onTimeSlotClick={onTimeSlotClick}
                          onAppointmentClick={onAppointmentClick}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Day View
const DayView: React.FC<CalendarViewsProps> = ({
  currentDate,
  appointments,
  patients,
  onTimeSlotClick,
  onAppointmentClick,
  canCreateAppointments,
}) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center">
          <Calendar1 className="mr-2 h-4 w-4" />
          {currentDate.toLocaleDateString("es-MX", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[500px] overflow-y-auto">
          {TIME_SLOTS.map((time) => {
            const appointment = getAppointmentForSlot(
              appointments,
              currentDate,
              time
            );
            const patient = appointment
              ? patients.find((p) => p.id === appointment.patientId)
              : undefined;

            return (
              <div key={time} className="flex border-b hover:bg-gray-50">
                <div className="w-16 p-3 border-r bg-gray-50 text-center text-sm font-medium">
                  {time}
                </div>
                <div className="flex-1 p-2 min-h-[60px]">
                  <TimeSlot
                    date={currentDate}
                    time={time}
                    appointment={appointment}
                    patient={patient}
                    canCreate={canCreateAppointments}
                    onTimeSlotClick={onTimeSlotClick}
                    onAppointmentClick={onAppointmentClick}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// Main Views Component
export const CalendarViews: React.FC<CalendarViewsProps> = (props) => {
  const { view } = props;

  return (
    <>
      {view === "month" && <MonthView {...props} />}
      {view === "week" && <WeekView {...props} />}
      {view === "day" && <DayView {...props} />}
    </>
  );
};

// Calendar Stats Component
interface CalendarStatsProps {
  appointments: Appointment[];
  currentDate: Date;
}

export const CalendarStats: React.FC<CalendarStatsProps> = ({
  appointments,
  currentDate,
}) => {
  const stats = useMemo(() => {
    const today = new Date();
    const weekDays = getWeekDays(currentDate);

    return {
      today: appointments.filter(
        (apt) =>
          apt.appointmentDate.toDate().toDateString() === today.toDateString()
      ).length,
      week: appointments.filter((apt) => {
        const aptDate = apt.appointmentDate.toDate();
        return weekDays.some(
          (day) => day.toDateString() === aptDate.toDateString()
        );
      }).length,
      scheduled: appointments.filter((apt) => apt.status === "scheduled")
        .length,
      completed: appointments.filter((apt) => apt.status === "completed")
        .length,
    };
  }, [appointments, currentDate]);

  const statCards = [
    {
      title: "Hoy",
      value: stats.today,
      icon: Calendar1,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Semana",
      value: stats.week,
      icon: Clock,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Programadas",
      value: stats.scheduled,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "Completadas",
      value: stats.completed,
      icon: Stethoscope,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {statCards.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium">
                  {stat.title}
                </p>
                <p className={`text-xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`p-2 rounded-full ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
