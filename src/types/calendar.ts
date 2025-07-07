// src/types/calendar.ts
import { Timestamp } from "firebase/firestore";
import { Patient, Appointment } from "@/lib/firebase/db";

/**
 * Shared calendar event type that works with both react-big-calendar and our modals
 * This ensures type consistency across the entire calendar system
 */
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date; // react-big-calendar expects Date objects
  end: Date;   // react-big-calendar expects Date objects
  resource: {
    appointment: Appointment; // This contains Timestamp for appointmentDate
    patient: Patient;
    doctor: {
      id: string;
      name: string;
      email?: string;
    };
  };
}

/**
 * Doctor/Provider information for calendar display
 */
export interface CalendarDoctor {
  id: string;
  name: string;
  email?: string;
  specialty?: string;
  color?: string; // For calendar color coding
}

/**
 * Calendar view configuration
 */
export interface CalendarViewConfig {
  view: 'month' | 'week' | 'day' | 'agenda';
  minTime?: Date;
  maxTime?: Date;
  step?: number; // Time slot step in minutes
  timeslots?: number; // Number of slots per hour
}

/**
 * Calendar filter options
 */
export interface CalendarFilters {
  doctorId?: string;
  status?: Appointment['status'][];
  type?: Appointment['type'][];
  startDate?: Date;
  endDate?: Date;
}

/**
 * Transform Appointment to CalendarEvent
 * This utility function handles the Timestamp to Date conversion
 */
export const appointmentToCalendarEvent = (
  appointment: Appointment,
  patient: Patient,
  doctor: CalendarDoctor
): CalendarEvent => {
  // Convert Timestamp to Date for react-big-calendar
  const startDate = appointment.appointmentDate.toDate();
  const endDate = new Date(startDate.getTime() + (appointment.duration * 60 * 1000));

  return {
    id: appointment.id!,
    title: `${patient.fullName} - ${getAppointmentTypeLabel(appointment.type)}`,
    start: startDate,
    end: endDate,
    resource: {
      appointment,
      patient,
      doctor
    }
  };
};

/**
 * Get human-readable appointment type label
 */
export const getAppointmentTypeLabel = (type: Appointment['type']): string => {
  const labels: Record<Appointment['type'], string> = {
    consultation: 'Consulta',
    cleaning: 'Limpieza',
    procedure: 'Procedimiento',
    followup: 'Seguimiento',
    emergency: 'Emergencia'
  };
  return labels[type] || type;
};

/**
 * Get human-readable appointment status label
 */
export const getAppointmentStatusLabel = (status: Appointment['status']): string => {
  const labels: Record<Appointment['status'], string> = {
    scheduled: 'Programada',
    confirmed: 'Confirmada',
    in_progress: 'En Progreso',
    completed: 'Completada',
    cancelled: 'Cancelada',
    no_show: 'No se presentó'
  };
  return labels[status] || status;
};

/**
 * Get status-based styling
 */
export const getAppointmentStatusStyle = (status: Appointment['status']) => {
  const styles = {
    scheduled: {
      backgroundColor: '#3174ad',
      className: 'bg-blue-100 text-blue-800'
    },
    confirmed: {
      backgroundColor: '#10b981',
      className: 'bg-green-100 text-green-800'
    },
    in_progress: {
      backgroundColor: '#f59e0b',
      className: 'bg-amber-100 text-amber-800'
    },
    completed: {
      backgroundColor: '#6b7280',
      className: 'bg-gray-100 text-gray-800'
    },
    cancelled: {
      backgroundColor: '#ef4444',
      className: 'bg-red-100 text-red-800'
    },
    no_show: {
      backgroundColor: '#dc2626',
      className: 'bg-red-200 text-red-900'
    }
  };
  
  return styles[status] || styles.scheduled;
};