// src/components/calendar/DentalCalendar.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer, View, SlotInfo } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Clock,
  User,
  Calendar as CalendarIcon,
  Filter,
  Search,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getAppointments,
  getPatients,
  Patient,
  Appointment,
} from "@/lib/firebase/db";
import {
  CalendarEvent,
  CalendarDoctor,
  appointmentToCalendarEvent,
  getAppointmentStatusStyle,
  getAppointmentStatusLabel,
  getAppointmentTypeLabel,
} from "@/types/calendar";
import {
  AppointmentDetailsModal,
  NewAppointmentModal,
} from "./AppointmentModals";

const localizer = momentLocalizer(moment);

interface DentalCalendarProps {
  doctorId?: string; // Filter by specific doctor
  view?: "month" | "week" | "day";
}

export const DentalCalendar: React.FC<DentalCalendarProps> = ({
  doctorId,
  view = "week",
}) => {
  const { userProfile, hasPermission } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [currentView, setCurrentView] = useState<View>(view);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch appointments and patients based on current view and filters
  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, currentView, doctorId]);

  const fetchCalendarData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Calculate date range based on current view
      const { startDate, endDate } = getViewDateRange(currentDate, currentView);

      // Fetch appointments and patients in parallel
      const [appointments, allPatients] = await Promise.all([
        getAppointments(startDate, endDate, doctorId),
        getPatients(),
      ]);

      setPatients(allPatients);

      // Transform appointments to calendar events
      const calendarEvents = appointments
        .filter((appointment) => appointment.id) // Ensure appointment has ID
        .map((appointment) => {
          const patient = allPatients.find(
            (p) => p.id === appointment.patientId
          );
          if (!patient) {
            console.warn(`Patient not found for appointment ${appointment.id}`);
            return null;
          }

          // Create doctor object (in a real app, you'd fetch this from a doctors collection)
          const doctor: CalendarDoctor = {
            id: appointment.doctorId,
            name: getDoctorName(appointment.doctorId),
            email: `${appointment.doctorId}@clinic.com`,
          };

          return appointmentToCalendarEvent(appointment, patient, doctor);
        })
        .filter((event): event is CalendarEvent => event !== null);

      setEvents(calendarEvents);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      setError("Error al cargar los datos del calendario");
    } finally {
      setLoading(false);
    }
  };

  const getViewDateRange = (date: Date, view: View) => {
    const start = moment(date);
    const end = moment(date);

    switch (view) {
      case "month":
        return {
          startDate: start.startOf("month").toDate(),
          endDate: end.endOf("month").toDate(),
        };
      case "week":
        return {
          startDate: start.startOf("week").toDate(),
          endDate: end.endOf("week").toDate(),
        };
      case "day":
        return {
          startDate: start.startOf("day").toDate(),
          endDate: end.endOf("day").toDate(),
        };
      default:
        return {
          startDate: start.startOf("week").toDate(),
          endDate: end.endOf("week").toDate(),
        };
    }
  };

  const getDoctorName = (doctorId: string): string => {
    // In a real app, you'd fetch this from a doctors collection
    // For now, return a formatted name
    const doctorNames: Record<string, string> = {
      dr_smith: "Dr. Smith",
      dr_garcia: "Dr. García",
      dr_martinez: "Dr. Martínez",
    };

    return doctorNames[doctorId] || `Dr. ${doctorId}`;
  };

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    if (!hasPermission("appointments:write")) return;

    setSelectedSlot(slotInfo);
    setShowNewAppointment(true);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const getEventStyle = (event: CalendarEvent) => {
    const appointment = event.resource.appointment;
    const statusStyle = getAppointmentStatusStyle(appointment.status);

    return {
      style: {
        backgroundColor: statusStyle.backgroundColor,
        borderRadius: "6px",
        opacity: appointment.status === "cancelled" ? 0.6 : 1,
        color: "white",
        border: "none",
        fontSize: "12px",
      },
    };
  };

  const CustomEvent = ({ event }: { event: CalendarEvent }) => {
    const { appointment, patient } = event.resource;

    return (
      <div className="p-1">
        <div className="font-semibold text-xs truncate">{patient.fullName}</div>
        <div className="text-xs opacity-90 truncate">
          {getAppointmentTypeLabel(appointment.type)}
        </div>
        <div className="text-xs opacity-75">
          {moment(appointment.appointmentDate.toDate()).format("h:mm A")}
        </div>
      </div>
    );
  };

  const CustomToolbar = ({ date, view, onNavigate, onView }: any) => {
    return (
      <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold">
            {moment(date).format("MMMM YYYY")}
          </h2>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate("PREV")}
            >
              ←
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate("TODAY")}
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate("NEXT")}
            >
              →
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            {["month", "week", "day"].map((viewType) => (
              <Button
                key={viewType}
                variant={view === viewType ? "default" : "outline"}
                size="sm"
                onClick={() => onView(viewType)}
              >
                {viewType === "month"
                  ? "Mes"
                  : viewType === "week"
                  ? "Semana"
                  : "Día"}
              </Button>
            ))}
          </div>

          {hasPermission("appointments:write") && (
            <Button
              onClick={() => setShowNewAppointment(true)}
              className="ml-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Cita
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="text-gray-600">{error}</p>
            <Button
              onClick={fetchCalendarData}
              className="mt-4"
              variant="outline"
            >
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar Component */}
      <Card>
        <CardContent className="p-0">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            view={currentView}
            onView={setCurrentView}
            date={currentDate}
            onNavigate={setCurrentDate}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            selectable={hasPermission("appointments:write")}
            eventPropGetter={getEventStyle}
            components={{
              event: CustomEvent,
              toolbar: CustomToolbar,
            }}
            step={15}
            timeslots={4}
            min={new Date(0, 0, 0, 7, 0, 0)} // 7 AM
            max={new Date(0, 0, 0, 19, 0, 0)} // 7 PM
            formats={{
              timeGutterFormat: "h:mm A",
              eventTimeRangeFormat: ({ start, end }) =>
                `${moment(start).format("h:mm")} - ${moment(end).format(
                  "h:mm A"
                )}`,
            }}
            messages={{
              allDay: "Todo el día",
              previous: "Anterior",
              next: "Siguiente",
              today: "Hoy",
              month: "Mes",
              week: "Semana",
              day: "Día",
              agenda: "Agenda",
              date: "Fecha",
              time: "Hora",
              event: "Evento",
              noEventsInRange: "No hay citas en este rango de fechas",
              showMore: (total) => `+ Ver ${total} más`,
            }}
          />
        </CardContent>
      </Card>

      {/* Appointment Details Modal */}
      {selectedEvent && (
        <AppointmentDetailsModal
          event={selectedEvent}
          open={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onUpdate={fetchCalendarData}
        />
      )}

      {/* New Appointment Modal */}
      {showNewAppointment && (
        <NewAppointmentModal
          open={showNewAppointment}
          onClose={() => {
            setShowNewAppointment(false);
            setSelectedSlot(null);
          }}
          selectedSlot={selectedSlot}
          onSuccess={fetchCalendarData}
        />
      )}

      {/* Calendar Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Estados de Citas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm">Programada</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm">Confirmada</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-amber-500 rounded"></div>
              <span className="text-sm">En Progreso</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
              <span className="text-sm">Completada</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm">Cancelada</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-700 rounded"></div>
              <span className="text-sm">No se presentó</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Citas Hoy</p>
                <p className="text-2xl font-bold">
                  {
                    events.filter((event) =>
                      moment(event.start).isSame(moment(), "day")
                    ).length
                  }
                </p>
              </div>
              <CalendarIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Esta Semana</p>
                <p className="text-2xl font-bold">
                  {
                    events.filter((event) =>
                      moment(event.start).isSame(moment(), "week")
                    ).length
                  }
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Confirmadas</p>
                <p className="text-2xl font-bold">
                  {
                    events.filter(
                      (event) =>
                        event.resource.appointment.status === "confirmed"
                    ).length
                  }
                </p>
              </div>
              <User className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pacientes Únicos</p>
                <p className="text-2xl font-bold">
                  {
                    new Set(events.map((event) => event.resource.patient.id))
                      .size
                  }
                </p>
              </div>
              <User className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DentalCalendar;

// Note: Make sure to install moment if not already installed:
// npm install moment @types/moment

// Also ensure react-big-calendar is properly installed:
// npm install react-big-calendar @types/react-big-calendar
