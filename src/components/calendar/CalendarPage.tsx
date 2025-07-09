"use client";
import React, { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { getAllUsers, UserProfile } from "@/lib/firebase/rbac";
import { getAppointments, Appointment } from "@/lib/firebase/db";
import { getPatients, Patient } from "@/lib/firebase/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { NewAppointmentModal } from "./NewAppointmentModal";
// Import sub-components
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { DoctorSelector } from "@/components/calendar/DoctorSelector";
import { CalendarControls } from "@/components/calendar/CalendarControls";
import { CalendarViews } from "./views/CalendarViews";
import { CalendarStats } from "./views/CalendarViews";

import { AppointmentDetailsModal } from "@/components/calendar/AppointmentModals";
import { ErrorDisplay } from "./common/ErrorDisplay";
import { LoadingSpinner } from "./common/LoadingSpinner";

// Types
import { CalendarEvent } from "@/types/calendar";

export type CalendarView = "month" | "week" | "day";

// Custom hook for calendar data management
export const useCalendarData = () => {
  const { userProfile } = useAuth();
  const [doctors, setDoctors] = useState<UserProfile[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("week");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInitialData = async () => {
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
      setError("Error al cargar los datos del calendario");
    } finally {
      setIsLoading(false);
    }
  };

  const loadAppointments = async () => {
    if (!selectedDoctor) return;

    try {
      let startDate: Date, endDate: Date;

      if (view === "month") {
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
      } else if (view === "week") {
        const start = new Date(currentDate);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        startDate = start;
        endDate = new Date(start);
        endDate.setDate(start.getDate() + 6);
      } else {
        startDate = new Date(currentDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(currentDate);
        endDate.setHours(23, 59, 59, 999);
      }

      const doctorAppointments = await getAppointments(
        startDate,
        endDate,
        selectedDoctor
      );
      setAppointments(doctorAppointments);
    } catch (err) {
      console.error("Error loading appointments:", err);
      setError("Error al cargar las citas");
    }
  };

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

// Main Calendar Page Component
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

  // Load data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load appointments when dependencies change
  useEffect(() => {
    if (selectedDoctor) {
      loadAppointments();
    }
  }, [selectedDoctor, currentDate, view]);

  // Event handlers
  const handleNewAppointment = () => {
    setSelectedTimeSlot(null);
    setShowAppointmentModal(true);
  };

  const handleTimeSlotClick = (date: Date, time: string) => {
    setSelectedTimeSlot({ date, time });
    setShowAppointmentModal(true);
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    const patient = patients.find((p) => p.id === appointment.patientId);
    if (patient) {
      // Find the doctor information
      const doctor = doctors.find((d) => d.uid === appointment.doctorId);

      const calendarEvent: CalendarEvent = {
        id: appointment.id!,
        title: `${patient.fullName}`,
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
            name: doctor?.displayName || doctor?.email || "Unknown Doctor",
            email: doctor?.email,
          },
        },
      };
      setSelectedCalendarEvent(calendarEvent);
      setShowDetailsModal(true);
    }
  };

  const handleAppointmentCreated = () => {
    loadAppointments();
    setShowAppointmentModal(false);
    setSelectedTimeSlot(null);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedCalendarEvent(null);
  };

  // Loading state
  if (isLoading && doctors.length === 0) {
    return (
      <ProtectedRoute requiredPermissions={["calendar:read"]}>
        <LoadingSpinner />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={["calendar:read"]}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <CalendarHeader
          onNewAppointment={handleNewAppointment}
          canCreateAppointments={hasPermission("appointments:write")}
        />

        {/* Error Display */}
        <ErrorDisplay error={error} onDismiss={() => setError(null)} />

        {/* Doctor Selection */}
        <DoctorSelector
          doctors={doctors}
          selectedDoctor={selectedDoctor}
          onDoctorChange={setSelectedDoctor}
        />

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
