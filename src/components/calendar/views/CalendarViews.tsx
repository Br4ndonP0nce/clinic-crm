// src/components/calendar/views/CalendarViews.tsx - UPDATED WITH SCHEDULE INTEGRATION
import React, { useMemo, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar1, Clock, Stethoscope } from "lucide-react";
import { Appointment, Patient } from "@/lib/firebase/db";
import { CalendarView } from "../CalendarPage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Import timezone utilities
import {
  timestampToLocalDate,
  createLocalDateTime,
  formatDateForInput,
  formatTimeForInput,
} from "@/lib/utils/datetime";

// NEW: Import schedule functions
import {
  getDoctorSchedule,
  getDayOfWeekFromDate,
  DoctorSchedule,
} from "@/lib/firebase/doctor-schedule";

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

interface CalendarViewProps extends CalendarViewsProps {
  showDetailedSlots?: boolean;
  onToggleDetailedSlots?: () => void;
}

const APPOINTMENT_TYPES = [
  { value: "consultation", label: "Consulta", color: "bg-blue-500" },
  { value: "cleaning", label: "Limpieza", color: "bg-green-500" },
  { value: "procedure", label: "Procedimiento", color: "bg-purple-500" },
  { value: "followup", label: "Seguimiento", color: "bg-orange-500" },
  { value: "emergency", label: "Emergencia", color: "bg-red-500" },
];

// Default time slots (fallback when no schedule is available)
const TIME_SLOTS_DEFAULT = Array.from({ length: 10 }, (_, i) => {
  const hour = 8 + i; // Start at 8 AM, go to 6 PM (10 hours)
  return `${hour.toString().padStart(2, "0")}:00`;
});

const TIME_SLOTS_DETAILED_DEFAULT = Array.from({ length: 20 }, (_, i) => {
  const hour = Math.floor(8 + i / 2);
  const minute = (i % 2) * 30;
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
});

// NEW: Generate time slots based on doctor's schedule
const generateTimeSlotsForDay = (
  startTime: string,
  endTime: string,
  intervalMinutes: number = 60
): string[] => {
  const slots: string[] = [];

  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);

  let current = new Date(start);

  while (current < end) {
    const timeStr = current.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    slots.push(timeStr);
    current.setMinutes(current.getMinutes() + intervalMinutes);
  }

  return slots;
};

// Utility functions with timezone fixes
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

// FIXED: Timezone-safe appointment slot matching for hourly slots
const getAppointmentForSlot = (
  appointments: Appointment[],
  date: Date,
  time: string
) => {
  // Create local date for the slot using our timezone utilities
  const slotDateTime = createLocalDateTime(formatDateForInput(date), time);

  return appointments.find((apt) => {
    // Convert Firestore timestamp to local date
    const aptDate = timestampToLocalDate(apt.appointmentDate);

    // Compare the times with a small tolerance (within the same minute)
    const timeDiff = Math.abs(aptDate.getTime() - slotDateTime.getTime());
    const withinTolerance = timeDiff < 60000; // 1 minute tolerance

    return withinTolerance;
  });
};

// NEW: For hourly slots, find any appointment that starts within that hour
const getAppointmentForHourSlot = (
  appointments: Appointment[],
  date: Date,
  hourTime: string // e.g., "09:00"
) => {
  const hourStart = createLocalDateTime(formatDateForInput(date), hourTime);
  const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000); // Add 1 hour

  return appointments.find((apt) => {
    const aptDate = timestampToLocalDate(apt.appointmentDate);

    // Check if appointment starts within this hour slot
    return aptDate >= hourStart && aptDate < hourEnd;
  });
};

// FIXED: Timezone-safe day appointment matching
const getAppointmentsForDay = (appointments: Appointment[], date: Date) => {
  const dayAppointments = appointments.filter((apt) => {
    // Convert Firestore timestamp to local date
    const aptDate = timestampToLocalDate(apt.appointmentDate);

    // Compare only the date parts (year, month, day)
    const isSameDay =
      aptDate.getFullYear() === date.getFullYear() &&
      aptDate.getMonth() === date.getMonth() &&
      aptDate.getDate() === date.getDate();

    return isSameDay;
  });

  return dayAppointments;
};

// NEW: Check if doctor is available on a specific day
const isDoctorAvailableOnDay = (
  doctorSchedule: DoctorSchedule | null,
  date: Date
): boolean => {
  if (!doctorSchedule) {
    // Fallback: available on weekdays
    const dayOfWeek = date.getDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6;
  }

  const dayOfWeek = getDayOfWeekFromDate(date);
  return doctorSchedule.schedule[dayOfWeek].isAvailable;
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

  // Use timezone-safe date conversion for display
  const appointmentLocalDate = timestampToLocalDate(
    appointment.appointmentDate
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
          {appointmentLocalDate.toLocaleTimeString("es-MX", {
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

// Time slot component with schedule awareness
const TimeSlot: React.FC<{
  date: Date;
  time: string;
  appointment?: Appointment;
  patient?: Patient;
  canCreate: boolean;
  isUnavailable?: boolean; // NEW: Based on doctor schedule
  onTimeSlotClick: (date: Date, time: string) => void;
  onAppointmentClick: (appointment: Appointment) => void;
}> = ({
  date,
  time,
  appointment,
  patient,
  canCreate,
  isUnavailable,
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

  if (isUnavailable) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
        <span className="text-xs">No disponible</span>
      </div>
    );
  }

  return canCreate ? (
    <div
      className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer hover:bg-blue-50"
      onClick={() => {
        console.log("🎯 Time slot clicked:", {
          date: date.toDateString(),
          time,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        onTimeSlotClick(date, time);
      }}
    >
      <Plus className="h-4 w-4 text-gray-400" />
    </div>
  ) : null;
};

// Hook to load doctor schedule
const useDoctorSchedule = (doctorId: string) => {
  const [schedule, setSchedule] = useState<DoctorSchedule | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSchedule = async () => {
      if (!doctorId) return;

      try {
        setLoading(true);
        const doctorSchedule = await getDoctorSchedule(doctorId);
        setSchedule(doctorSchedule);
      } catch (error) {
        console.error("Error loading doctor schedule:", error);
        setSchedule(null);
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, [doctorId]);

  return { schedule, loading };
};

// Month View with schedule integration
const MonthView: React.FC<CalendarViewsProps> = ({
  currentDate,
  appointments,
  patients,
  selectedDoctor,
  onTimeSlotClick,
  onAppointmentClick,
  canCreateAppointments,
}) => {
  const monthDays = useMemo(() => getMonthDays(currentDate), [currentDate]);
  const { schedule: doctorSchedule } = useDoctorSchedule(selectedDoctor);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center">
          <Calendar1 className="mr-2 h-4 w-4" />
          Vista Mensual
          {doctorSchedule && (
            <Badge variant="outline" className="ml-2 text-xs">
              Horario personalizado activo
            </Badge>
          )}
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
            const isAvailable = isDoctorAvailableOnDay(doctorSchedule, date);

            return (
              <div
                key={index}
                className={`min-h-[100px] p-1 border-r border-b ${
                  !isCurrentMonth
                    ? "bg-gray-50 text-gray-400"
                    : isToday
                    ? "bg-blue-50"
                    : !isAvailable
                    ? "bg-gray-100"
                    : "bg-white hover:bg-gray-50"
                } ${
                  canCreateAppointments && isCurrentMonth && isAvailable
                    ? "cursor-pointer"
                    : ""
                }`}
                onClick={() => {
                  if (canCreateAppointments && isCurrentMonth && isAvailable) {
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

                {!isAvailable && isCurrentMonth && (
                  <div className="text-xs text-gray-500 mb-1">
                    No disponible
                  </div>
                )}

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

// Week View with schedule integration
const WeekView: React.FC<CalendarViewProps> = ({
  currentDate,
  appointments,
  patients,
  selectedDoctor,
  onTimeSlotClick,
  onAppointmentClick,
  canCreateAppointments,
  showDetailedSlots = false,
  onToggleDetailedSlots,
}) => {
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const { schedule: doctorSchedule } = useDoctorSchedule(selectedDoctor);

  // Generate time slots based on doctor's schedule
  const timeSlots = useMemo(() => {
    if (!doctorSchedule) {
      return showDetailedSlots
        ? TIME_SLOTS_DETAILED_DEFAULT
        : TIME_SLOTS_DEFAULT;
    }

    // Find the earliest start and latest end times across all available days
    const availableDays = Object.values(doctorSchedule.schedule).filter(
      (day) => day.isAvailable
    );

    if (availableDays.length === 0) {
      return []; // No available days
    }

    const earliestStart = availableDays.reduce(
      (earliest, day) => (day.startTime < earliest ? day.startTime : earliest),
      availableDays[0].startTime
    );
    const latestEnd = availableDays.reduce(
      (latest, day) => (day.endTime > latest ? day.endTime : latest),
      availableDays[0].endTime
    );

    return generateTimeSlotsForDay(
      earliestStart,
      latestEnd,
      showDetailedSlots ? 30 : 60
    );
  }, [doctorSchedule, showDetailedSlots]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center">
            <Calendar1 className="mr-2 h-4 w-4" />
            Vista Semanal
            {doctorSchedule && (
              <Badge variant="outline" className="ml-2 text-xs">
                Horario personalizado
              </Badge>
            )}
          </CardTitle>
          {/* Optional toggle for detailed view */}
          {onToggleDetailedSlots && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleDetailedSlots}
              className="text-xs"
            >
              {showDetailedSlots ? "Horario 1h" : "Horario 30min"}
            </Button>
          )}
        </div>
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
                const isAvailable = isDoctorAvailableOnDay(doctorSchedule, day);

                return (
                  <div
                    key={index}
                    className={`p-2 border-r text-center ${
                      isToday ? "bg-blue-50" : "bg-gray-50"
                    } ${!isAvailable ? "opacity-50" : ""}`}
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
                    {!isAvailable ? (
                      <div className="text-xs text-red-600">No disponible</div>
                    ) : dayAppointments.length > 0 ? (
                      <div className="text-xs text-gray-600">
                        {dayAppointments.length}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Time slots */}
            <div className="max-h-[500px] overflow-y-auto">
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className={`grid grid-cols-8 border-b hover:bg-gray-50 ${
                    showDetailedSlots ? "min-h-[50px]" : "min-h-[80px]"
                  }`}
                >
                  <div className="p-2 border-r bg-gray-50 text-center text-sm font-medium">
                    {time}
                  </div>
                  {weekDays.map((day, dayIndex) => {
                    // Check if this time slot is within the doctor's schedule for this day
                    let isTimeSlotAvailable = true;
                    if (doctorSchedule) {
                      const dayOfWeek = getDayOfWeekFromDate(day);
                      const daySchedule = doctorSchedule.schedule[dayOfWeek];

                      if (!daySchedule.isAvailable) {
                        isTimeSlotAvailable = false;
                      } else {
                        isTimeSlotAvailable =
                          time >= daySchedule.startTime &&
                          time < daySchedule.endTime;
                      }
                    }

                    const appointment = showDetailedSlots
                      ? getAppointmentForSlot(appointments, day, time)
                      : getAppointmentForHourSlot(appointments, day, time);

                    const patient = appointment
                      ? patients.find((p) => p.id === appointment.patientId)
                      : undefined;

                    return (
                      <div
                        key={dayIndex}
                        className={`p-1 border-r ${
                          showDetailedSlots ? "min-h-[50px]" : "min-h-[80px]"
                        } ${!isTimeSlotAvailable ? "bg-gray-100" : ""}`}
                      >
                        <TimeSlot
                          date={day}
                          time={time}
                          appointment={appointment}
                          patient={patient}
                          canCreate={canCreateAppointments}
                          isUnavailable={!isTimeSlotAvailable}
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

// Day View with schedule integration
const DayView: React.FC<CalendarViewProps> = ({
  currentDate,
  appointments,
  patients,
  selectedDoctor,
  onTimeSlotClick,
  onAppointmentClick,
  canCreateAppointments,
  showDetailedSlots = false,
  onToggleDetailedSlots,
}) => {
  const { schedule: doctorSchedule } = useDoctorSchedule(selectedDoctor);

  // Generate time slots based on doctor's schedule for this specific day
  const timeSlots = useMemo(() => {
    if (!doctorSchedule) {
      return showDetailedSlots
        ? TIME_SLOTS_DETAILED_DEFAULT
        : TIME_SLOTS_DEFAULT;
    }

    const dayOfWeek = getDayOfWeekFromDate(currentDate);
    const daySchedule = doctorSchedule.schedule[dayOfWeek];

    if (!daySchedule.isAvailable) {
      return []; // No slots if doctor not available
    }

    return generateTimeSlotsForDay(
      daySchedule.startTime,
      daySchedule.endTime,
      showDetailedSlots ? 30 : 60
    );
  }, [doctorSchedule, currentDate, showDetailedSlots]);

  const isAvailable = isDoctorAvailableOnDay(doctorSchedule, currentDate);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center">
            <Calendar1 className="mr-2 h-4 w-4" />
            {currentDate.toLocaleDateString("es-MX", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
            {!isAvailable && (
              <Badge variant="destructive" className="ml-2 text-xs">
                Doctor no disponible
              </Badge>
            )}
            {isAvailable && doctorSchedule && (
              <Badge variant="outline" className="ml-2 text-xs">
                {(() => {
                  const dayOfWeek = getDayOfWeekFromDate(currentDate);
                  const daySchedule = doctorSchedule.schedule[dayOfWeek];
                  return `${daySchedule.startTime} - ${daySchedule.endTime}`;
                })()}
              </Badge>
            )}
          </CardTitle>
          {onToggleDetailedSlots && isAvailable && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleDetailedSlots}
              className="text-xs"
            >
              {showDetailedSlots ? "Horario 1h" : "Horario 30min"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {!isAvailable ? (
          <div className="p-8 text-center text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Doctor no disponible</p>
            <p className="text-sm">
              El doctor no tiene horario configurado para este día
            </p>
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto">
            {timeSlots.map((time) => {
              const appointment = showDetailedSlots
                ? getAppointmentForSlot(appointments, currentDate, time)
                : getAppointmentForHourSlot(appointments, currentDate, time);

              const patient = appointment
                ? patients.find((p) => p.id === appointment.patientId)
                : undefined;

              return (
                <div key={time} className="flex border-b hover:bg-gray-50">
                  <div className="w-16 p-3 border-r bg-gray-50 text-center text-sm font-medium">
                    {time}
                  </div>
                  <div
                    className={`flex-1 p-2 ${
                      showDetailedSlots ? "min-h-[60px]" : "min-h-[80px]"
                    }`}
                  >
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
        )}
      </CardContent>
    </Card>
  );
};

// Main Views Component with view density options
export const CalendarViews: React.FC<CalendarViewsProps> = (props) => {
  const { view } = props;

  // State for detailed slot view toggle
  const [showDetailedSlots, setShowDetailedSlots] = React.useState(false);

  const handleToggleDetailedSlots = () => {
    setShowDetailedSlots(!showDetailedSlots);
  };

  const viewProps = {
    ...props,
    showDetailedSlots,
    onToggleDetailedSlots: handleToggleDetailedSlots,
  };

  return (
    <>
      {view === "month" && <MonthView {...props} />}
      {view === "week" && <WeekView {...viewProps} />}
      {view === "day" && <DayView {...viewProps} />}
    </>
  );
};

// Calendar Stats Component (unchanged but exported for completeness)
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
      today: appointments.filter((apt) => {
        const aptDate = timestampToLocalDate(apt.appointmentDate);
        return aptDate.toDateString() === today.toDateString();
      }).length,
      week: appointments.filter((apt) => {
        const aptDate = timestampToLocalDate(apt.appointmentDate);
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
