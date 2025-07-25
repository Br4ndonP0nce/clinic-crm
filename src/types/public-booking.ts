// src/types/public-booking.ts

export interface PublicDoctor {
  uid: string;
  displayName: string;
  email?: string; // Add email as optional for fallback display
}

export interface PublicAppointment {
  doctorId: string;
  appointmentDate: any; // Firestore Timestamp
  duration: number;
  status: string;
}

// For the calendar picker, we need to convert PublicAppointment to Appointment
export interface MinimalAppointment {
  id?: string;
  doctorId: string;
  appointmentDate: any;
  duration: number;
  status: string;
  // Required fields for calendar picker with default values
  patientId: string;
  type: 'consultation' | 'cleaning' | 'procedure' | 'followup' | 'emergency';
  reasonForVisit: string;
  reminders: any[];
  createdAt: any;
  updatedAt: any;
  createdBy: string;
}

export interface BookingDataResponse {
  doctors: PublicDoctor[];
  appointments: PublicAppointment[];
  success: boolean;
  error?: string;
}

export interface AppointmentFormData {
  name: string;
  email: string;
  phone: string;
  procedure: string;
  doctorId: string;
  selectedDate: string;
  selectedTime: string;
}

export interface SubmissionResponse {
  success: boolean;
  patientId?: string;
  message?: string;
  data?: {
    patientName: string;
    procedure: string;
    doctor: string;
    requestedDate: string;
    requestedTime: string;
  };
  error?: string;
}

export interface DentalProcedure {
  id: string;
  name: string;
  duration: number;
  description: string;
  icon: string;
  category: string;
}

// Utility function to convert PublicAppointment to calendar-compatible format
export const convertToCalendarAppointment = (publicApt: PublicAppointment): MinimalAppointment => {
  return {
    doctorId: publicApt.doctorId,
    appointmentDate: publicApt.appointmentDate,
    duration: publicApt.duration,
    status: publicApt.status,
    // Default values for calendar compatibility
    patientId: 'blocked',
    type: 'consultation',
    reasonForVisit: 'Occupied slot',
    reminders: [],
    createdAt: publicApt.appointmentDate,
    updatedAt: publicApt.appointmentDate,
    createdBy: 'public_form'
  };
};