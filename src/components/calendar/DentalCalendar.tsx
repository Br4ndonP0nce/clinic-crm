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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Clock,
  User,
  Calendar as CalendarIcon,
  Filter,
  Search,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Appointment, Patient } from "@/types/patient";
import { AppointmentDetailsModal } from "./AppointmentModals";
import { NewAppointmentModal } from "./AppointmentModals";
const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    appointment: Appointment;
    patient: Patient;
    doctor: any;
  };
}

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

  // Fetch appointments based on current view and filters
  useEffect(() => {
    fetchAppointments();
  }, [currentDate, currentView, doctorId]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      // Implementation would fetch from Firebase
      // const appointments = await getAppointments({
      //   doctorId,
      //   startDate: getViewStartDate(currentDate, currentView),
      //   endDate: getViewEndDate(currentDate, currentView)
      // });

      // Transform appointments to calendar events
      // setEvents(transformAppointmentsToEvents(appointments));

      // Sample data for now
      setEvents(getSampleEvents());
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
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

    let backgroundColor = "#3174ad"; // default blue

    switch (appointment.status) {
      case "scheduled":
        backgroundColor = "#3174ad"; // blue
        break;
      case "confirmed":
        backgroundColor = "#10b981"; // green
        break;
      case "in_progress":
        backgroundColor = "#f59e0b"; // amber
        break;
      case "completed":
        backgroundColor = "#6b7280"; // gray
        break;
      case "cancelled":
        backgroundColor = "#ef4444"; // red
        break;
      case "no_show":
        backgroundColor = "#dc2626"; // dark red
        break;
    }

    return {
      style: {
        backgroundColor,
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
          {appointment.type.replace("_", " ")}
        </div>
        <div className="text-xs opacity-75">
          {moment(appointment.appointmentDate).format("h:mm A")}
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
              Today
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
                {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
              </Button>
            ))}
          </div>

          {hasPermission("appointments:write") && (
            <Button
              onClick={() => setShowNewAppointment(true)}
              className="ml-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
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
          />
        </CardContent>
      </Card>

      {/* Appointment Details Modal */}
      {selectedEvent && (
        <AppointmentDetailsModal
          event={selectedEvent}
          open={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
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
          onSuccess={fetchAppointments}
        />
      )}

      {/* Calendar Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Appointment Status Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm">Scheduled</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm">Confirmed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-amber-500 rounded"></div>
              <span className="text-sm">In Progress</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
              <span className="text-sm">Completed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm">Cancelled</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-700 rounded"></div>
              <span className="text-sm">No Show</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Sample data for development
const getSampleEvents = (): CalendarEvent[] => {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return [
    {
      id: "1",
      title: "John Doe - Cleaning",
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0),
      end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0),
      resource: {
        appointment: {
          id: "1",
          patientId: "p1",
          doctorId: "d1",
          appointmentDate: new Date(),
          duration: 60,
          type: "cleaning",
          status: "confirmed",
          reasonForVisit: "Regular cleaning",
          reminders: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: "staff1",
        },
        patient: {
          id: "p1",
          fullName: "John Doe",
          email: "john@example.com",
          phone: "555-1234",
        } as Patient,
        doctor: { name: "Dr. Smith" },
      },
    },
  ];
};

// Additional components would include:
// - AppointmentDetailsModal
// - NewAppointmentModal
// - AppointmentForm
// These will be implemented in subsequent phases

export default DentalCalendar;
