// Optimized CalendarPage.tsx
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

// Import optimized components
import { CalendarControls } from "@/components/calendar/CalendarControls";
import { CalendarViews, CalendarStats } from "./views/CalendarViews";
import { NewAppointmentModal } from "./NewAppointmentModal";
import { AppointmentDetailsModal } from "@/components/calendar/AppointmentModals";

// Types
import { CalendarEvent } from "@/types/calendar";
export type CalendarView = "month" | "week" | "day";

// Custom hook for calendar data
const useCalendarData = () => {
  const { userProfile } = useAuth();
  const [doctors, setDoctors] = useState<UserProfile[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("week");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoized date ranges
  const dateRange = useMemo(() => {
    let startDate: Date, endDate: Date;

    switch (view) {
      case "month":
        startDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        );
        endDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0
        );
        break;
      case "week": {
        const start = new Date(currentDate);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        startDate = start;
        endDate = new Date(start);
        endDate.setDate(start.getDate() + 6);
        break;
      }
      case "day":
        startDate = new Date(currentDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(currentDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate = new Date();
        endDate = new Date();
    }

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

  // Load appointments
  const loadAppointments = useCallback(async () => {
    if (!selectedDoctor) return;

    try {
      const doctorAppointments = await getAppointments(
        dateRange.startDate,
        dateRange.endDate,
        selectedDoctor
      );
      setAppointments(doctorAppointments);
    } catch (err) {
      console.error("Error loading appointments:", err);
      setError("Error al cargar las citas");
    }
  }, [selectedDoctor, dateRange]);

  return {
    doctors,
    selectedDoctor,
    setSelectedDoctor,
    appointments,
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
    setSelectedTimeSlot({ date, time });
    setShowAppointmentModal(true);
  }, []);

  const handleAppointmentClick = useCallback(
    (appointment: Appointment) => {
      const patient = patients.find((p) => p.id === appointment.patientId);
      if (patient) {
        const doctor = doctors.find((d) => d.uid === appointment.doctorId);
        const calendarEvent: CalendarEvent = {
          id: appointment.id!,
          title: patient.fullName,
          start: appointment.appointmentDate.toDate(),
          end: new Date(
            appointment.appointmentDate.toDate().getTime() +
              appointment.duration * 60000
          ),
          resource: {
            appointment,
            patient,
            doctor: {
              id: doctor?.uid || appointment.doctorId,
              name: doctor?.displayName || doctor?.email || "Doctor",
              email: doctor?.email,
            },
          },
        };
        setSelectedCalendarEvent(calendarEvent);
        setShowDetailsModal(true);
      }
    },
    [patients, doctors]
  );

  const handleAppointmentCreated = useCallback(() => {
    loadAppointments();
    setShowAppointmentModal(false);
    setSelectedTimeSlot(null);
  }, [loadAppointments]);

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
            <p className="text-sm text-gray-600">Gestión de citas médicas</p>
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
                  {appointments.length !== 1 ? "s" : ""}
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

            {/* Calendar Views */}
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
          onUpdate={loadAppointments}
        />

        <NewAppointmentModal
          isOpen={showAppointmentModal}
          onClose={() => setShowAppointmentModal(false)}
          onSuccess={handleAppointmentCreated}
          selectedTimeSlot={selectedTimeSlot}
          selectedDoctor={selectedDoctor}
          patients={patients}
        />
      </div>
    </ProtectedRoute>
  );
}
