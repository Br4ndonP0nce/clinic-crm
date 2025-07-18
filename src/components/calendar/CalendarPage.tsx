// CalendarPage.tsx - Updated to integrate Smart Calendar Picker
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { getAllUsers, UserProfile } from "@/lib/firebase/rbac";
import {
  getAppointments,
  getPatients,
  Appointment,
  Patient,
} from "@/lib/firebase/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, AlertCircle, Users, Loader2 } from "lucide-react";

// Import timezone utilities
import {
  timestampToLocalDate,
  convertAppointmentToCalendarEvent,
  debugTimezone,
} from "@/lib/utils/datetime";

// Import optimized components
import { CalendarControls } from "@/components/calendar/CalendarControls";
import { CalendarViews, CalendarStats } from "./views/CalendarViews";
import { NewAppointmentModal } from "./NewAppointmentModal";
import { AppointmentDetailsModal } from "@/components/calendar/AppointmentModals";

// Types
import { CalendarEvent } from "@/types/calendar";
export type CalendarView = "month" | "week" | "day";

// Custom hook for calendar data with timezone fixes
const useCalendarData = () => {
  const { userProfile } = useAuth();
  const [doctors, setDoctors] = useState<UserProfile[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]); // For smart scheduling
  const [patients, setPatients] = useState<Patient[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("week");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoized date ranges with timezone fixes
  const dateRange = useMemo(() => {
    let startDate: Date, endDate: Date;

    switch (view) {
      case "month":
        // Start from the first day of the month at 00:00:00 local time
        startDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1,
          0,
          0,
          0,
          0
        );
        // End at the last day of the month at 23:59:59 local time
        endDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );
        break;
      case "week": {
        // Get the start of the week (Monday) at 00:00:00 local time
        const start = new Date(currentDate);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        startDate = new Date(
          start.getFullYear(),
          start.getMonth(),
          diff,
          0,
          0,
          0,
          0
        );

        // Get the end of the week (Sunday) at 23:59:59 local time
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case "day":
        // Start of the day at 00:00:00 local time
        startDate = new Date(currentDate);
        startDate.setHours(0, 0, 0, 0);
        // End of the day at 23:59:59 local time
        endDate = new Date(currentDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate = new Date();
        endDate = new Date();
    }

    // Debug logging to verify date ranges
    console.log("📅 Date Range:", {
      view,
      startDate: startDate.toLocaleString(),
      endDate: endDate.toLocaleString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    return { startDate, endDate };
  }, [currentDate, view]);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [allUsers, allPatients] = await Promise.all([
        getAllUsers(),
        getPatients(),
      ]);

      const doctorUsers = allUsers.filter(
        (user) => user.role === "doctor" && user.isActive
      );
      setDoctors(doctorUsers);
      setPatients(allPatients);

      // Auto-select doctor
      if (userProfile?.role === "doctor") {
        setSelectedDoctor(userProfile.uid);
      } else if (doctorUsers.length > 0) {
        setSelectedDoctor(doctorUsers[0].uid);
      }
    } catch (err) {
      console.error("Error loading initial data:", err);
      setError("Error al cargar datos del calendario");
    } finally {
      setIsLoading(false);
    }
  }, [userProfile]);

  // Load appointments with timezone fixes
  const loadAppointments = useCallback(async () => {
    if (!selectedDoctor) return;

    try {
      // Load appointments for the current view (for display)
      const doctorAppointments = await getAppointments(
        dateRange.startDate,
        dateRange.endDate,
        selectedDoctor
      );

      // Load ALL appointments for the selected doctor (for smart scheduling conflict detection)
      // Get a wider range - 3 months forward from today
      const today = new Date();
      const futureDate = new Date();
      futureDate.setMonth(today.getMonth() + 3);

      const allDoctorAppointments = await getAppointments(
        today,
        futureDate,
        selectedDoctor
      );

      console.log(
        "🏥 Loaded Appointments for View:",
        doctorAppointments.length
      );
      console.log(
        "🏥 Loaded All Appointments for Smart Scheduling:",
        allDoctorAppointments.length
      );

      setAppointments(doctorAppointments);
      setAllAppointments(allDoctorAppointments);
    } catch (err) {
      console.error("Error loading appointments:", err);
      setError("Error al cargar las citas");
    }
  }, [selectedDoctor, dateRange]);

  // Reload all appointments (for after creating new appointments)
  const reloadAllAppointments = useCallback(async () => {
    if (!selectedDoctor) return;

    try {
      // Reload both sets of appointments
      const today = new Date();
      const futureDate = new Date();
      futureDate.setMonth(today.getMonth() + 3);

      const [doctorAppointments, allDoctorAppointments] = await Promise.all([
        getAppointments(dateRange.startDate, dateRange.endDate, selectedDoctor),
        getAppointments(today, futureDate, selectedDoctor),
      ]);

      setAppointments(doctorAppointments);
      setAllAppointments(allDoctorAppointments);
    } catch (err) {
      console.error("Error reloading appointments:", err);
    }
  }, [selectedDoctor, dateRange]);

  return {
    doctors,
    selectedDoctor,
    setSelectedDoctor,
    appointments,
    allAppointments, // Include all appointments for smart scheduling
    patients,
    currentDate,
    setCurrentDate,
    view,
    setView,
    isLoading,
    error,
    setError,
    loadInitialData,
    loadAppointments,
    reloadAllAppointments,
  };
};

// Main Calendar Component
export default function CalendarPage() {
  const { hasPermission } = useAuth();
  const {
    doctors,
    selectedDoctor,
    setSelectedDoctor,
    appointments,
    allAppointments,
    patients,
    currentDate,
    setCurrentDate,
    view,
    setView,
    isLoading,
    error,
    setError,
    loadInitialData,
    loadAppointments,
    reloadAllAppointments,
  } = useCalendarData();

  // Modal states
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCalendarEvent, setSelectedCalendarEvent] =
    useState<CalendarEvent | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    date: Date;
    time: string;
  } | null>(null);

  // Effects
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (selectedDoctor) {
      loadAppointments();
    }
  }, [selectedDoctor, loadAppointments]);

  // Event handlers
  const handleNewAppointment = useCallback(() => {
    setSelectedTimeSlot(null);
    setShowAppointmentModal(true);
  }, []);

  const handleTimeSlotClick = useCallback((date: Date, time: string) => {
    console.log("🎯 Time Slot Clicked:", {
      date: date.toLocaleString(),
      time,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    setSelectedTimeSlot({ date, time });
    setShowAppointmentModal(true);
  }, []);

  // FIXED: Use timezone-safe appointment click handler
  const handleAppointmentClick = useCallback(
    (appointment: Appointment) => {
      const patient = patients.find((p) => p.id === appointment.patientId);
      if (patient) {
        const doctor = doctors.find((d) => d.uid === appointment.doctorId);

        // Use the timezone-safe conversion function
        const calendarEvent: CalendarEvent = convertAppointmentToCalendarEvent(
          appointment,
          patient,
          doctor
        );

        // Debug the converted event
        console.log("🎯 Appointment Clicked:", {
          appointmentId: appointment.id,
          originalTimestamp: appointment.appointmentDate,
          convertedStart: calendarEvent.start.toLocaleString(),
          convertedEnd: calendarEvent.end.toLocaleString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });

        setSelectedCalendarEvent(calendarEvent);
        setShowDetailsModal(true);
      }
    },
    [patients, doctors]
  );

  const handleAppointmentCreated = useCallback(() => {
    // Reload all appointments to ensure the smart scheduler has the latest data
    reloadAllAppointments();
    setShowAppointmentModal(false);
    setSelectedTimeSlot(null);
  }, [reloadAllAppointments]);

  const handleCloseDetailsModal = useCallback(() => {
    setShowDetailsModal(false);
    setSelectedCalendarEvent(null);
  }, []);

  // Loading state
  if (isLoading && doctors.length === 0) {
    return (
      <ProtectedRoute requiredPermissions={["calendar:read"]}>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={["calendar:read"]}>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Calendario</h1>
            <p className="text-sm text-gray-600">
              Gestión de citas médicas -{" "}
              {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </p>
          </div>

          {hasPermission("appointments:write") && (
            <Button
              onClick={handleNewAppointment}
              className="flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva Cita
            </Button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        )}

        {/* Doctor Selection */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Doctor:</span>
              </div>

              <div className="flex-1 min-w-0">
                <Select
                  value={selectedDoctor}
                  onValueChange={setSelectedDoctor}
                >
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Seleccionar doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.uid} value={doctor.uid}>
                        <div className="flex items-center space-x-2">
                          <span>{doctor.displayName || doctor.email}</span>
                          <Badge variant="outline" className="text-xs">
                            {doctor.role}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedDoctor && (
                <div className="text-sm text-gray-600">
                  {appointments.length} cita
                  {appointments.length !== 1 ? "s" : ""} en vista actual
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedDoctor && (
          <>
            {/* Calendar Controls */}
            <CalendarControls
              currentDate={currentDate}
              view={view}
              onDateChange={setCurrentDate}
              onViewChange={setView}
            />

            {/* Calendar Views - Pass timezone-safe data */}
            <CalendarViews
              view={view}
              currentDate={currentDate}
              appointments={appointments}
              patients={patients}
              selectedDoctor={selectedDoctor}
              onTimeSlotClick={handleTimeSlotClick}
              onAppointmentClick={handleAppointmentClick}
              canCreateAppointments={hasPermission("appointments:write")}
            />

            {/* Statistics */}
            <CalendarStats
              appointments={appointments}
              currentDate={currentDate}
            />
          </>
        )}

        {/* Modals */}
        <AppointmentDetailsModal
          event={selectedCalendarEvent}
          open={showDetailsModal}
          onClose={handleCloseDetailsModal}
          onUpdate={reloadAllAppointments}
        />

        {/* Updated NewAppointmentModal with Smart Calendar Picker */}
        <NewAppointmentModal
          isOpen={showAppointmentModal}
          onClose={() => setShowAppointmentModal(false)}
          onSuccess={handleAppointmentCreated}
          selectedTimeSlot={selectedTimeSlot}
          selectedDoctor={selectedDoctor}
          patients={patients}
          appointments={allAppointments} // Pass all appointments for conflict detection
          // No preSelectedPatient for calendar page - user should select
        />
      </div>
    </ProtectedRoute>
  );
}
