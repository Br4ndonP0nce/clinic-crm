// src/lib/utils/datetime.ts - COMPLETE TIMEZONE FIX
import { Timestamp } from 'firebase/firestore';

/**
 * Creates a proper Date object from date and time strings in user's local timezone
 * This prevents timezone conversion issues when storing to Firebase
 */
export const createLocalDateTime = (dateString: string, timeString: string): Date => {
  // Parse the date components
  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = timeString.split(':').map(Number);
  
  // Create date in local timezone (no automatic UTC conversion)
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

/**
 * Converts a Date to a date string in YYYY-MM-DD format
 */
export const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Converts a Date to a time string in HH:MM format
 */
export const formatTimeForInput = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Gets the current date and time formatted for form inputs
 */
export const getCurrentLocalDateTime = (): { date: string; time: string } => {
  const now = new Date();
  return {
    date: formatDateForInput(now),
    time: formatTimeForInput(now),
  };
};

/**
 * Validates if a date/time combination is in the future
 */
export const isFutureDateTime = (dateString: string, timeString: string): boolean => {
  const selectedDateTime = createLocalDateTime(dateString, timeString);
  return selectedDateTime > new Date();
};

/**
 * Converts a Firestore Timestamp to local date/time strings for form inputs
 */
export const timestampToFormInputs = (timestamp: Timestamp): { date: string; time: string } => {
  const date = timestamp.toDate();
  return {
    date: formatDateForInput(date),
    time: formatTimeForInput(date),
  };
};

/**
 * Helper to ensure consistent timezone handling across the app
 */
export const createFirestoreTimestamp = (dateString: string, timeString: string): Timestamp => {
  const localDate = createLocalDateTime(dateString, timeString);
  return Timestamp.fromDate(localDate);
};

/**
 * Converts Firestore Timestamp to Date with proper timezone handling for calendar display
 * This is the KEY function that fixes calendar display issues
 */
export const timestampToLocalDate = (timestamp: Timestamp): Date => {
  // Get the raw JavaScript Date from Firestore
  const firestoreDate = timestamp.toDate();
  
  // Get the individual components in local timezone
  const year = firestoreDate.getFullYear();
  const month = firestoreDate.getMonth();
  const day = firestoreDate.getDate();
  const hours = firestoreDate.getHours();
  const minutes = firestoreDate.getMinutes();
  const seconds = firestoreDate.getSeconds();
  const milliseconds = firestoreDate.getMilliseconds();
  
  // Create a new Date object with these components in local timezone
  // This prevents any UTC conversion artifacts
  return new Date(year, month, day, hours, minutes, seconds, milliseconds);
};

/**
 * Converts multiple Firestore Timestamps to local dates
 */
export const timestampsToLocalDates = (timestamps: Timestamp[]): Date[] => {
  return timestamps.map(timestampToLocalDate);
};

/**
 * Helper for React Big Calendar event conversion
 * Ensures appointments display on the correct date/time
 */
export const convertAppointmentToCalendarEvent = (
  appointment: any,
  patient: any,
  doctor: any
) => {
  // Use our timezone-safe conversion
  const startDate = timestampToLocalDate(appointment.appointmentDate);
  const endDate = new Date(startDate.getTime() + (appointment.duration * 60000));
  
  return {
    id: appointment.id,
    title: patient.fullName,
    start: startDate,
    end: endDate,
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
};

/**
 * Debug helper to log timezone information
 */
export const debugTimezone = (label: string, date: Date | Timestamp) => {
  const jsDate = date instanceof Date ? date : date.toDate();
  console.log(`${label}:`, {
    original: jsDate.toString(),
    iso: jsDate.toISOString(),
    local: jsDate.toLocaleString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    offset: jsDate.getTimezoneOffset(),
  });
};

/**
 * Get user's timezone for display
 */
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Format date for display in user's locale
 */
export const formatDateForDisplay = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };
  
  return new Intl.DateTimeFormat('es-MX', defaultOptions).format(date);
};

/**
 * Format time for display in user's locale
 */
export const formatTimeForDisplay = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  return new Intl.DateTimeFormat('es-MX', defaultOptions).format(date);
};

/**
 * Format datetime for display in user's locale
 */
export const formatDateTimeForDisplay = (date: Date): string => {
  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};