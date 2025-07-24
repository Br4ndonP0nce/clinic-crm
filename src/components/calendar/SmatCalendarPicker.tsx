// src/components/calendar/SmartCalendarPicker.tsx - COMPLETE UPDATED VERSION
"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

import { Appointment, Patient } from "@/lib/firebase/db";
import {
  timestampToLocalDate,
  formatDateForInput,
  createLocalDateTime,
} from "@/lib/utils/datetime";

// NEW: Import schedule functions
import {
  getDoctorSchedule,
  isDoctorAvailable,
  getDayOfWeekFromDate,
  DoctorSchedule,
} from "@/lib/firebase/doctor-schedule";

interface SmartCalendarPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDateTime: (date: Date, time: string) => void;
  appointments: Appointment[];
  patients: Patient[];
  selectedDoctor: string;
  appointmentDuration: number; // in minutes
  initialDate?: Date;
}

interface TimeSlot {
  time: string;
  available: boolean;
  conflictingAppointment?: {
    patient: string;
    type: string;
    duration: number;
  };
  outsideSchedule?: boolean; // NEW: Track if slot is outside doctor's schedule
}

// Generate time slots based on doctor's schedule
const generateTimeSlotsForDay = (
  startTime: string,
  endTime: string,
  intervalMinutes: number = 30
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

const APPOINTMENT_TYPE_COLORS = {
  consultation: "bg-blue-500",
  cleaning: "bg-green-500",
  procedure: "bg-purple-500",
  followup: "bg-orange-500",
  emergency: "bg-red-500",
};

export const SmartCalendarPicker: React.FC<SmartCalendarPickerProps> = ({
  isOpen,
  onClose,
  onSelectDateTime,
  appointments,
  patients,
  selectedDoctor,
  appointmentDuration,
  initialDate = new Date(),
}) => {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // NEW: Doctor schedule state
  const [doctorSchedule, setDoctorSchedule] = useState<DoctorSchedule | null>(
    null
  );
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Load doctor schedule when doctor changes
  useEffect(() => {
    const loadDoctorSchedule = async () => {
      if (!selectedDoctor) return;

      try {
        setScheduleLoading(true);
        const schedule = await getDoctorSchedule(selectedDoctor);
        setDoctorSchedule(schedule);
      } catch (error) {
        console.error("Error loading doctor schedule:", error);
        // Fallback to default behavior if schedule loading fails
        setDoctorSchedule(null);
      } finally {
        setScheduleLoading(false);
      }
    };

    loadDoctorSchedule();
  }, [selectedDoctor]);

  // Generate calendar days for the current month view
  const calendarDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
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
  }, [selectedDate]);

  // Check if a time slot conflicts with existing appointments
  const checkSlotAvailability = useCallback(
    (date: Date, time: string, duration: number): TimeSlot => {
      // First check if the slot is within doctor's schedule
      if (doctorSchedule) {
        const available = isDoctorAvailable(
          doctorSchedule,
          date,
          time,
          duration
        );
        if (!available) {
          return {
            time,
            available: false,
            outsideSchedule: true,
          };
        }
      }

      const slotStart = createLocalDateTime(formatDateForInput(date), time);
      const slotEnd = new Date(slotStart.getTime() + duration * 60000);

      // Find conflicting appointments
      const conflict = appointments.find((appointment) => {
        const aptStart = timestampToLocalDate(appointment.appointmentDate);
        const aptEnd = new Date(
          aptStart.getTime() + appointment.duration * 60000
        );

        // PRECISE overlap detection: Two appointments overlap if they share any time
        // BUT appointments that start exactly when another ends are OK (back-to-back)
        const overlaps = slotStart < aptEnd && slotEnd > aptStart;

        // Additional check: Allow back-to-back appointments (touching but not overlapping)
        const isBackToBack =
          slotEnd.getTime() === aptStart.getTime() ||
          slotStart.getTime() === aptEnd.getTime();

        const hasConflict = overlaps && !isBackToBack;

        return hasConflict;
      });

      if (conflict) {
        const patient = patients.find((p) => p.id === conflict.patientId);
        return {
          time,
          available: false,
          conflictingAppointment: {
            patient: patient?.fullName || "Paciente",
            type: conflict.type,
            duration: conflict.duration,
          },
        };
      }

      return { time, available: true };
    },
    [appointments, patients, doctorSchedule]
  );

  // Get available time slots for the selected date
  const availableTimeSlots = useMemo(() => {
    if (!selectedDate || scheduleLoading) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return [];
    }

    // Generate time slots based on doctor's schedule or fallback to default
    let timeSlots: string[] = [];

    if (doctorSchedule) {
      const dayOfWeek = getDayOfWeekFromDate(selectedDate);
      const daySchedule = doctorSchedule.schedule[dayOfWeek];

      if (!daySchedule.isAvailable) {
        return []; // Doctor not available this day
      }

      timeSlots = generateTimeSlotsForDay(
        daySchedule.startTime,
        daySchedule.endTime,
        30 // 30-minute intervals
      );
    } else {
      // Fallback to default weekday schedule
      const dayOfWeek = selectedDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return []; // Weekend - no slots by default
      }

      timeSlots = generateTimeSlotsForDay("08:00", "17:00", 30);
    }

    return timeSlots.map((time) =>
      checkSlotAvailability(selectedDate, time, appointmentDuration)
    );
  }, [
    selectedDate,
    appointmentDuration,
    checkSlotAvailability,
    doctorSchedule,
    scheduleLoading,
  ]);

  // Get appointments for a specific day
  const getAppointmentsForDay = useCallback(
    (date: Date) => {
      return appointments.filter((apt) => {
        const aptDate = timestampToLocalDate(apt.appointmentDate);
        return aptDate.toDateString() === date.toDateString();
      });
    },
    [appointments]
  );

  // Navigation functions
  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(selectedDate.getMonth() + (direction === "next" ? 1 : -1));
    setSelectedDate(newDate);
    setSelectedTime(null);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      const dateTime = createLocalDateTime(
        formatDateForInput(selectedDate),
        selectedTime
      );
      onSelectDateTime(dateTime, selectedTime);
    }
  };

  const isDateSelectable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) return false;

    // Check doctor's schedule if available
    if (doctorSchedule) {
      const dayOfWeek = getDayOfWeekFromDate(date);
      return doctorSchedule.schedule[dayOfWeek].isAvailable;
    }

    // Fallback: weekdays only
    const dayOfWeek = date.getDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6;
  };

  const hasAvailableSlots = (date: Date) => {
    if (!isDateSelectable(date)) return false;

    // Quick check based on doctor schedule
    if (doctorSchedule) {
      const dayOfWeek = getDayOfWeekFromDate(date);
      const daySchedule = doctorSchedule.schedule[dayOfWeek];

      if (!daySchedule.isAvailable) return false;

      // Generate a few sample slots to check availability
      const sampleSlots = generateTimeSlotsForDay(
        daySchedule.startTime,
        daySchedule.endTime,
        60 // Check every hour
      );

      return sampleSlots.some(
        (time) =>
          checkSlotAvailability(date, time, appointmentDuration).available
      );
    }

    // Fallback check
    return true; // Assume availability if no schedule data
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5" />
              Seleccionar Fecha y Hora
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {scheduleLoading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mr-2"></div>
            <span className="text-sm text-gray-600">
              Cargando horario del doctor...
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar Section */}
          <div className="space-y-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("prev")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <h3 className="text-lg font-semibold">
                {selectedDate.toLocaleDateString("es-MX", {
                  month: "long",
                  year: "numeric",
                })}
              </h3>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("next")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <Card>
              <CardContent className="p-0">
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b">
                  {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(
                    (day) => (
                      <div
                        key={day}
                        className="p-2 text-center text-sm font-medium bg-gray-50"
                      >
                        {day}
                      </div>
                    )
                  )}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7">
                  {calendarDays.map((date, index) => {
                    const isCurrentMonth =
                      date.getMonth() === selectedDate.getMonth();
                    const isToday =
                      date.toDateString() === new Date().toDateString();
                    const isSelected =
                      date.toDateString() === selectedDate.toDateString();
                    const isSelectable = isDateSelectable(date);
                    const hasSlots = hasAvailableSlots(date);
                    const dayAppointments = getAppointmentsForDay(date);

                    return (
                      <div
                        key={index}
                        className={`
                          min-h-[80px] p-1 border-r border-b cursor-pointer transition-colors
                          ${
                            !isCurrentMonth
                              ? "bg-gray-50 text-gray-400"
                              : "bg-white"
                          }
                          ${isToday ? "bg-blue-50" : ""}
                          ${
                            isSelected ? "bg-blue-100 ring-2 ring-blue-500" : ""
                          }
                          ${isSelectable && hasSlots ? "hover:bg-green-50" : ""}
                          ${
                            !isSelectable ? "cursor-not-allowed opacity-50" : ""
                          }
                          ${isSelectable && !hasSlots ? "bg-red-50" : ""}
                        `}
                        onClick={() => isSelectable && handleDateSelect(date)}
                      >
                        <div
                          className={`text-sm font-medium mb-1 ${
                            isToday ? "text-blue-600" : ""
                          }`}
                        >
                          {date.getDate()}
                        </div>

                        {/* Appointment indicators */}
                        <div className="space-y-1">
                          {dayAppointments
                            .slice(0, 2)
                            .map((appointment, aptIndex) => {
                              const typeColor =
                                APPOINTMENT_TYPE_COLORS[
                                  appointment.type as keyof typeof APPOINTMENT_TYPE_COLORS
                                ] || "bg-gray-500";

                              return (
                                <div
                                  key={aptIndex}
                                  className={`text-xs text-white p-1 rounded truncate ${typeColor}`}
                                >
                                  {timestampToLocalDate(
                                    appointment.appointmentDate
                                  ).toLocaleTimeString("es-MX", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              );
                            })}

                          {dayAppointments.length > 2 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{dayAppointments.length - 2}
                            </div>
                          )}
                        </div>

                        {/* Availability indicator */}
                        {isCurrentMonth && isSelectable && (
                          <div className="mt-1">
                            {hasSlots ? (
                              <div className="flex items-center justify-center">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                <AlertCircle className="h-3 w-3 text-red-500" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Time Slots Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Horarios Disponibles
              </h3>
              <Badge variant="outline">
                Duración: {appointmentDuration} min
              </Badge>
            </div>

            {selectedDate && (
              <div className="text-sm text-gray-600 mb-4">
                {selectedDate.toLocaleDateString("es-MX", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            )}

            <Card>
              <CardContent className="p-4">
                {!selectedDate || !isDateSelectable(selectedDate) ? (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Selecciona una fecha disponible</p>
                  </div>
                ) : availableTimeSlots.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-300" />
                    <p>
                      {doctorSchedule
                        ? "Doctor no disponible este día"
                        : "No hay horarios disponibles este día"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                    {availableTimeSlots.map((slot) => (
                      <Button
                        key={slot.time}
                        variant={
                          slot.available
                            ? selectedTime === slot.time
                              ? "default"
                              : "outline"
                            : "secondary"
                        }
                        className={`
                          justify-start h-auto p-3
                          ${
                            !slot.available
                              ? "cursor-not-allowed opacity-50"
                              : ""
                          }
                          ${
                            slot.available && selectedTime === slot.time
                              ? "ring-2 ring-blue-500"
                              : ""
                          }
                        `}
                        disabled={!slot.available}
                        onClick={() =>
                          slot.available && handleTimeSelect(slot.time)
                        }
                      >
                        <div className="text-left w-full">
                          <div className="font-medium">{slot.time}</div>
                          {!slot.available && slot.outsideSchedule && (
                            <div className="text-xs text-orange-600 mt-1">
                              Fuera del horario del doctor
                            </div>
                          )}
                          {!slot.available && slot.conflictingAppointment && (
                            <div className="text-xs text-red-600 mt-1">
                              Ocupado: {slot.conflictingAppointment.patient}
                            </div>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selection Summary */}
            {selectedDate && selectedTime && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Selección Actual:
                  </h4>
                  <div className="text-sm text-blue-800">
                    <div className="flex items-center mb-1">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {selectedDate.toLocaleDateString("es-MX", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {selectedTime} ({appointmentDuration} minutos)
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action buttons */}
            <div className="flex justify-between items-center pt-4">
              <div className="flex space-x-2">
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={!selectedDate || !selectedTime}
                  className="flex items-center"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirmar Selección
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="border-t pt-4 mt-6">
          <h4 className="text-sm font-medium mb-2">Leyenda:</h4>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-50 border border-green-200 rounded mr-2"></div>
              <span>Días con horarios disponibles</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-50 border border-red-200 rounded mr-2"></div>
              <span>Días sin disponibilidad</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded mr-2"></div>
              <span>Días no laborables</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
              <span>Horario disponible</span>
            </div>
            <div className="flex items-center">
              <AlertCircle className="h-3 w-3 text-red-500 mr-2" />
              <span>Horario ocupado</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
