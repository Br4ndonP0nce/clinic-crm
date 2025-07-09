// ============================================================================
// CALENDAR VIEWS COMPONENT
// ============================================================================

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar1, Clock } from "lucide-react";
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

const appointmentTypes = [
  { value: "consultation", label: "Consulta", color: "bg-blue-500" },
  { value: "cleaning", label: "Limpieza", color: "bg-green-500" },
  { value: "procedure", label: "Procedimiento", color: "bg-purple-500" },
  { value: "followup", label: "Seguimiento", color: "bg-orange-500" },
  { value: "emergency", label: "Emergencia", color: "bg-red-500" },
];

export const CalendarViews: React.FC<CalendarViewsProps> = ({
  view,
  currentDate,
  appointments,
  patients,
  selectedDoctor,
  onTimeSlotClick,
  onAppointmentClick,
  canCreateAppointments,
}) => {
  const selectedDoctorInfo = { displayName: "Doctor" }; // You can pass this as prop

  return (
    <>
      {view === "month" && (
        <MonthView
          currentDate={currentDate}
          appointments={appointments}
          patients={patients}
          selectedDoctorInfo={selectedDoctorInfo}
          onTimeSlotClick={onTimeSlotClick}
          onAppointmentClick={onAppointmentClick}
          canCreateAppointments={canCreateAppointments}
        />
      )}

      {view === "week" && (
        <WeekView
          currentDate={currentDate}
          appointments={appointments}
          patients={patients}
          selectedDoctorInfo={selectedDoctorInfo}
          onTimeSlotClick={onTimeSlotClick}
          onAppointmentClick={onAppointmentClick}
          canCreateAppointments={canCreateAppointments}
        />
      )}

      {view === "day" && (
        <DayView
          currentDate={currentDate}
          appointments={appointments}
          patients={patients}
          selectedDoctorInfo={selectedDoctorInfo}
          onTimeSlotClick={onTimeSlotClick}
          onAppointmentClick={onAppointmentClick}
          canCreateAppointments={canCreateAppointments}
        />
      )}
    </>
  );
};

// ============================================================================
// MONTH VIEW COMPONENT
// ============================================================================

interface MonthViewProps {
  currentDate: Date;
  appointments: Appointment[];
  patients: Patient[];
  selectedDoctorInfo: any;
  onTimeSlotClick: (date: Date, time: string) => void;
  onAppointmentClick: (appointment: Appointment) => void;
  canCreateAppointments: boolean;
}

const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  appointments,
  patients,
  selectedDoctorInfo,
  onTimeSlotClick,
  onAppointmentClick,
  canCreateAppointments,
}) => {
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    const startDay = firstDay.getDay();
    const daysFromMonday = startDay === 0 ? 6 : startDay - 1;
    startDate.setDate(firstDay.getDate() - daysFromMonday);

    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter((apt) => {
      const aptDate = apt.appointmentDate.toDate();
      return aptDate.toDateString() === date.toDateString();
    });
  };

  const monthDays = getMonthDays();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar1 className="mr-2 h-5 w-5" />
          Calendario Mensual - {selectedDoctorInfo?.displayName}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-7 border-b">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
            <div
              key={day}
              className="p-3 border-r bg-gray-50 text-center font-medium"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {monthDays.map((date, index) => {
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            const isToday = date.toDateString() === new Date().toDateString();
            const dayAppointments = getAppointmentsForDay(date);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border-r border-b ${
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
                  {dayAppointments.slice(0, 3).map((appointment) => {
                    const appointmentType = appointmentTypes.find(
                      (t) => t.value === appointment.type
                    );
                    const patient = patients.find(
                      (p) => p.id === appointment.patientId
                    );

                    return (
                      <div
                        key={appointment.id}
                        className={`text-xs p-1 rounded text-white cursor-pointer ${
                          appointmentType?.color || "bg-gray-500"
                        } ${
                          appointment.status === "cancelled" ? "opacity-50" : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppointmentClick(appointment);
                        }}
                      >
                        <div className="truncate font-medium">
                          {appointment.appointmentDate
                            .toDate()
                            .toLocaleTimeString("es-MX", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                        </div>
                        <div className="truncate">
                          {patient?.fullName || "Paciente"}
                        </div>
                      </div>
                    );
                  })}
                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayAppointments.length - 3} más
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

// ============================================================================
// WEEK VIEW COMPONENT
// ============================================================================

interface WeekViewProps {
  currentDate: Date;
  appointments: Appointment[];
  patients: Patient[];
  selectedDoctorInfo: any;
  onTimeSlotClick: (date: Date, time: string) => void;
  onAppointmentClick: (appointment: Appointment) => void;
  canCreateAppointments: boolean;
}

const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  appointments,
  patients,
  selectedDoctorInfo,
  onTimeSlotClick,
  onAppointmentClick,
  canCreateAppointments,
}) => {
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const getWeekDays = () => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getAppointmentForSlot = (date: Date, time: string) => {
    const slotDateTime = new Date(
      `${date.toISOString().split("T")[0]}T${time}`
    );
    return appointments.find((apt) => {
      const aptDate = apt.appointmentDate.toDate();
      return aptDate.getTime() === slotDateTime.getTime();
    });
  };

  const timeSlots = generateTimeSlots();
  const weekDays = getWeekDays();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar1 className="mr-2 h-5 w-5" />
          Calendario Semanal - {selectedDoctorInfo?.displayName}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Week Header */}
            <div className="grid grid-cols-8 border-b">
              <div className="p-3 border-r bg-gray-50">
                <span className="text-sm font-medium">Hora</span>
              </div>
              {weekDays.map((day, index) => {
                const isToday =
                  day.toDateString() === new Date().toDateString();
                const dayAppointments = appointments.filter((apt) => {
                  const aptDate = apt.appointmentDate.toDate();
                  return aptDate.toDateString() === day.toDateString();
                });

                return (
                  <div
                    key={index}
                    className={`p-3 border-r text-center ${
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
                      <div className="text-xs text-gray-600 mt-1">
                        {dayAppointments.length} cita
                        {dayAppointments.length !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Time Slots */}
            <div className="max-h-[600px] overflow-y-auto">
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className="grid grid-cols-8 border-b hover:bg-gray-50"
                >
                  <div className="p-2 border-r bg-gray-50 text-center">
                    <span className="text-sm font-medium">{time}</span>
                  </div>
                  {weekDays.map((day, dayIndex) => {
                    const appointment = getAppointmentForSlot(day, time);
                    const appointmentType = appointmentTypes.find(
                      (t) => t.value === appointment?.type
                    );
                    const patientInfo = appointment
                      ? patients.find((p) => p.id === appointment.patientId)
                      : null;
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                    return (
                      <div
                        key={dayIndex}
                        className={`p-1 border-r min-h-[60px] ${
                          isWeekend
                            ? "bg-gray-100"
                            : appointment
                            ? "cursor-pointer"
                            : canCreateAppointments
                            ? "cursor-pointer hover:bg-blue-50"
                            : ""
                        }`}
                        onClick={() => {
                          if (appointment) {
                            onAppointmentClick(appointment);
                          } else if (!isWeekend && canCreateAppointments) {
                            onTimeSlotClick(day, time);
                          }
                        }}
                      >
                        {appointment ? (
                          <div
                            className={`p-2 rounded text-white text-xs ${
                              appointmentType?.color || "bg-gray-500"
                            } ${
                              appointment.status === "cancelled"
                                ? "opacity-50"
                                : ""
                            } relative group`}
                          >
                            <div className="font-medium truncate">
                              {patientInfo?.fullName || "Paciente Desconocido"}
                            </div>
                            <div className="truncate">
                              {appointmentType?.label}
                            </div>
                            <div className="text-xs opacity-75">
                              {appointment.duration}min
                            </div>

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                              {appointment.reasonForVisit}
                            </div>
                          </div>
                        ) : isWeekend ? (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <span className="text-xs">Fin de semana</span>
                          </div>
                        ) : (
                          canCreateAppointments && (
                            <div className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <Plus className="h-4 w-4 text-gray-400" />
                            </div>
                          )
                        )}
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

// ============================================================================
// DAY VIEW COMPONENT
// ============================================================================

interface DayViewProps {
  currentDate: Date;
  appointments: Appointment[];
  patients: Patient[];
  selectedDoctorInfo: any;
  onTimeSlotClick: (date: Date, time: string) => void;
  onAppointmentClick: (appointment: Appointment) => void;
  canCreateAppointments: boolean;
}

const DayView: React.FC<DayViewProps> = ({
  currentDate,
  appointments,
  patients,
  selectedDoctorInfo,
  onTimeSlotClick,
  onAppointmentClick,
  canCreateAppointments,
}) => {
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const getAppointmentForSlot = (date: Date, time: string) => {
    const slotDateTime = new Date(
      `${date.toISOString().split("T")[0]}T${time}`
    );
    return appointments.find((apt) => {
      const aptDate = apt.appointmentDate.toDate();
      return aptDate.getTime() === slotDateTime.getTime();
    });
  };

  const timeSlots = generateTimeSlots();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar1 className="mr-2 h-5 w-5" />
          Vista Diaria -{" "}
          {currentDate.toLocaleDateString("es-MX", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[600px] overflow-y-auto">
          {timeSlots.map((time) => {
            const appointment = getAppointmentForSlot(currentDate, time);
            const appointmentType = appointmentTypes.find(
              (t) => t.value === appointment?.type
            );
            const patientInfo = appointment
              ? patients.find((p) => p.id === appointment.patientId)
              : null;

            return (
              <div key={time} className="flex border-b hover:bg-gray-50">
                <div className="w-20 p-4 border-r bg-gray-50 text-center">
                  <span className="text-sm font-medium">{time}</span>
                </div>
                <div
                  className={`flex-1 p-2 min-h-[80px] ${
                    appointment
                      ? "cursor-pointer"
                      : canCreateAppointments
                      ? "cursor-pointer hover:bg-blue-50"
                      : ""
                  }`}
                  onClick={() => {
                    if (appointment) {
                      onAppointmentClick(appointment);
                    } else if (canCreateAppointments) {
                      onTimeSlotClick(currentDate, time);
                    }
                  }}
                >
                  {appointment ? (
                    <div
                      className={`p-3 rounded text-white ${
                        appointmentType?.color || "bg-gray-500"
                      } ${
                        appointment.status === "cancelled" ? "opacity-50" : ""
                      }`}
                    >
                      <div className="font-medium">
                        {patientInfo?.fullName || "Paciente Desconocido"}
                      </div>
                      <div className="text-sm opacity-90">
                        {appointmentType?.label}
                      </div>
                      <div className="text-sm opacity-75">
                        {appointment.duration} min -{" "}
                        {appointment.reasonForVisit}
                      </div>
                    </div>
                  ) : (
                    canCreateAppointments && (
                      <div className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Plus className="h-6 w-6 text-gray-400" />
                      </div>
                    )
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

// ============================================================================
// CALENDAR STATS COMPONENT
// ============================================================================

import { Stethoscope } from "lucide-react";

interface CalendarStatsProps {
  appointments: Appointment[];
  currentDate: Date;
}

export const CalendarStats: React.FC<CalendarStatsProps> = ({
  appointments,
  currentDate,
}) => {
  const getWeekDays = () => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const weekDays = getWeekDays();

  // Calculate statistics
  const todayAppointments = appointments.filter(
    (apt) =>
      apt.appointmentDate.toDate().toDateString() === new Date().toDateString()
  ).length;

  const weekAppointments = appointments.filter((apt) => {
    const aptDate = apt.appointmentDate.toDate();
    return weekDays.some(
      (day) => day.toDateString() === aptDate.toDateString()
    );
  }).length;

  const scheduledAppointments = appointments.filter(
    (apt) => apt.status === "scheduled"
  ).length;

  const completedAppointments = appointments.filter(
    (apt) => apt.status === "completed"
  ).length;

  const stats = [
    {
      title: "Citas Hoy",
      value: todayAppointments,
      icon: Calendar1,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      title: "Esta Semana",
      value: weekAppointments,
      icon: Clock,
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      title: "Programadas",
      value: scheduledAppointments,
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Completadas",
      value: completedAppointments,
      icon: Stethoscope,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  {stat.title}
                </p>
                <p className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// ============================================================================
// ENHANCED CALENDAR STATS WITH MORE METRICS
// ============================================================================

interface EnhancedCalendarStatsProps {
  appointments: Appointment[];
  currentDate: Date;
}

export const EnhancedCalendarStats: React.FC<EnhancedCalendarStatsProps> = ({
  appointments,
  currentDate,
}) => {
  const getWeekDays = () => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const weekDays = getWeekDays();

  // Enhanced statistics
  const todayAppointments = appointments.filter(
    (apt) =>
      apt.appointmentDate.toDate().toDateString() === new Date().toDateString()
  );

  const weekAppointments = appointments.filter((apt) => {
    const aptDate = apt.appointmentDate.toDate();
    return weekDays.some(
      (day) => day.toDateString() === aptDate.toDateString()
    );
  });

  const appointmentsByStatus = {
    scheduled: appointments.filter((apt) => apt.status === "scheduled").length,
    confirmed: appointments.filter((apt) => apt.status === "confirmed").length,
    completed: appointments.filter((apt) => apt.status === "completed").length,
    cancelled: appointments.filter((apt) => apt.status === "cancelled").length,
    no_show: appointments.filter((apt) => apt.status === "no_show").length,
  };

  const appointmentsByType = appointmentTypes.reduce((acc, type) => {
    acc[type.value] = appointments.filter(
      (apt) => apt.type === type.value
    ).length;
    return acc;
  }, {} as Record<string, number>);

  const totalDuration = todayAppointments.reduce(
    (sum, apt) => sum + apt.duration,
    0
  );

  const averageDuration =
    todayAppointments.length > 0
      ? Math.round(totalDuration / todayAppointments.length)
      : 0;

  const primaryStats = [
    {
      title: "Citas Hoy",
      value: todayAppointments.length,
      subtitle: `${totalDuration} min total`,
      icon: Calendar1,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Esta Semana",
      value: weekAppointments.length,
      subtitle: `Promedio: ${averageDuration} min`,
      icon: Clock,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Confirmadas",
      value: appointmentsByStatus.confirmed,
      subtitle: `${appointmentsByStatus.scheduled} pendientes`,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Completadas",
      value: appointmentsByStatus.completed,
      subtitle: `${appointmentsByStatus.cancelled} canceladas`,
      icon: Stethoscope,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {primaryStats.map((stat, index) => (
          <Card
            key={index}
            className="transition-all hover:shadow-lg hover:scale-105"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 font-medium">
                    {stat.title}
                  </p>
                  <p className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointment Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tipos de Cita</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {appointmentTypes.map((type) => {
                const count = appointmentsByType[type.value] || 0;
                const percentage =
                  appointments.length > 0
                    ? Math.round((count / appointments.length) * 100)
                    : 0;

                return (
                  <div
                    key={type.value}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded ${type.color}`}></div>
                      <span className="text-sm font-medium">{type.label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {percentage}%
                      </span>
                      <span className="text-sm font-semibold">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estado de Citas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(appointmentsByStatus).map(([status, count]) => {
                const statusLabels = {
                  scheduled: "Programadas",
                  confirmed: "Confirmadas",
                  completed: "Completadas",
                  cancelled: "Canceladas",
                  no_show: "No Asistió",
                };

                const statusColors = {
                  scheduled: "text-blue-600",
                  confirmed: "text-green-600",
                  completed: "text-gray-600",
                  cancelled: "text-red-600",
                  no_show: "text-orange-600",
                };

                const percentage =
                  appointments.length > 0
                    ? Math.round((count / appointments.length) * 100)
                    : 0;

                return (
                  <div
                    key={status}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium">
                      {statusLabels[status as keyof typeof statusLabels]}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {percentage}%
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          statusColors[status as keyof typeof statusColors]
                        }`}
                      >
                        {count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ============================================================================
// APPOINTMENT SUMMARY CARD (Additional Component)
// ============================================================================

interface AppointmentSummaryProps {
  appointments: Appointment[];
  patients: Patient[];
  selectedDate?: Date;
}

export const AppointmentSummary: React.FC<AppointmentSummaryProps> = ({
  appointments,
  patients,
  selectedDate = new Date(),
}) => {
  const dayAppointments = appointments.filter((apt) => {
    const aptDate = apt.appointmentDate.toDate();
    return aptDate.toDateString() === selectedDate.toDateString();
  });

  const sortedAppointments = dayAppointments.sort(
    (a, b) =>
      a.appointmentDate.toDate().getTime() -
      b.appointmentDate.toDate().getTime()
  );

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "no_show":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "scheduled":
        return "Programada";
      case "confirmed":
        return "Confirmada";
      case "completed":
        return "Completada";
      case "cancelled":
        return "Cancelada";
      case "no_show":
        return "No Asistió";
      default:
        return "Desconocido";
    }
  };

  if (dayAppointments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Citas del{" "}
            {selectedDate.toLocaleDateString("es-MX", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Calendar1 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No hay citas programadas para este día</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>
            Citas del{" "}
            {selectedDate.toLocaleDateString("es-MX", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </span>
          <span className="text-sm font-normal text-gray-600">
            {dayAppointments.length} cita
            {dayAppointments.length !== 1 ? "s" : ""}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedAppointments.map((appointment) => {
            const patient = patients.find(
              (p) => p.id === appointment.patientId
            );
            const appointmentType = appointmentTypes.find(
              (t) => t.value === appointment.type
            );

            return (
              <div
                key={appointment.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-4 h-4 rounded ${
                      appointmentType?.color || "bg-gray-500"
                    }`}
                  ></div>
                  <div>
                    <p className="font-medium text-sm">
                      {patient?.fullName || "Paciente Desconocido"}
                    </p>
                    <p className="text-xs text-gray-600">
                      {appointmentType?.label} • {appointment.duration} min
                    </p>
                    <p className="text-xs text-gray-500 truncate max-w-[200px]">
                      {appointment.reasonForVisit}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {appointment.appointmentDate
                      .toDate()
                      .toLocaleTimeString("es-MX", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                  </p>
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(
                      appointment.status
                    )}`}
                  >
                    {getStatusLabel(appointment.status)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// WEEKLY PERFORMANCE CHART (Additional Component)
// ============================================================================

interface WeeklyPerformanceProps {
  appointments: Appointment[];
  currentDate: Date;
}

export const WeeklyPerformance: React.FC<WeeklyPerformanceProps> = ({
  appointments,
  currentDate,
}) => {
  const getWeekDays = () => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const weekDays = getWeekDays();

  const weeklyData = weekDays.map((day) => {
    const dayAppointments = appointments.filter((apt) => {
      const aptDate = apt.appointmentDate.toDate();
      return aptDate.toDateString() === day.toDateString();
    });

    const completed = dayAppointments.filter(
      (apt) => apt.status === "completed"
    ).length;
    const scheduled = dayAppointments.filter(
      (apt) => apt.status === "scheduled"
    ).length;
    const cancelled = dayAppointments.filter(
      (apt) => apt.status === "cancelled"
    ).length;

    return {
      day: day.toLocaleDateString("es-MX", { weekday: "short" }),
      date: day.getDate(),
      total: dayAppointments.length,
      completed,
      scheduled,
      cancelled,
      isToday: day.toDateString() === new Date().toDateString(),
    };
  });

  const maxAppointments = Math.max(...weeklyData.map((d) => d.total), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Rendimiento Semanal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {weeklyData.map((data, index) => (
            <div key={index} className="text-center">
              <div className="text-xs font-medium text-gray-600 mb-1">
                {data.day}
              </div>
              <div
                className={`text-sm font-bold mb-2 ${
                  data.isToday ? "text-blue-600" : "text-gray-900"
                }`}
              >
                {data.date}
              </div>

              {/* Visual bar chart */}
              <div className="h-20 flex flex-col justify-end space-y-1">
                {data.completed > 0 && (
                  <div
                    className="bg-green-500 rounded-sm"
                    style={{
                      height: `${(data.completed / maxAppointments) * 60}px`,
                      minHeight: data.completed > 0 ? "4px" : "0px",
                    }}
                    title={`${data.completed} completadas`}
                  ></div>
                )}
                {data.scheduled > 0 && (
                  <div
                    className="bg-blue-500 rounded-sm"
                    style={{
                      height: `${(data.scheduled / maxAppointments) * 60}px`,
                      minHeight: data.scheduled > 0 ? "4px" : "0px",
                    }}
                    title={`${data.scheduled} programadas`}
                  ></div>
                )}
                {data.cancelled > 0 && (
                  <div
                    className="bg-red-500 rounded-sm"
                    style={{
                      height: `${(data.cancelled / maxAppointments) * 60}px`,
                      minHeight: data.cancelled > 0 ? "4px" : "0px",
                    }}
                    title={`${data.cancelled} canceladas`}
                  ></div>
                )}
              </div>

              <div className="text-xs font-semibold text-gray-700 mt-1">
                {data.total}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex justify-center space-x-4 mt-4 pt-4 border-t">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
            <span className="text-xs text-gray-600">Completadas</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
            <span className="text-xs text-gray-600">Programadas</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
            <span className="text-xs text-gray-600">Canceladas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
