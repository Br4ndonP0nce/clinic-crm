// src/lib/firebase/doctor-schedule.ts
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './config';
import { getAppointments, Appointment } from './db';

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface DaySchedule {
  isAvailable: boolean;
  startTime: string; // "08:00" format
  endTime: string;   // "17:00" format
  notes?: string;
}

export interface DoctorSchedule {
  id?: string;
  doctorId: string;
  schedule: Record<DayOfWeek, DaySchedule>;
  effectiveFrom: Timestamp;
  createdBy: string;
  updatedAt: Timestamp | any; // Allow FieldValue for server timestamp
  version: number; // For tracking schedule changes
}

export interface ScheduleConflict {
  appointmentId: string;
  patientName: string;
  appointmentDate: Date;
  appointmentTime: string;
  duration: number;
  reason: string;
}

const DOCTOR_SCHEDULES_COLLECTION = 'doctor_schedules';

// Default schedule: Monday-Saturday 8:00-17:00
export const DEFAULT_SCHEDULE: Record<DayOfWeek, DaySchedule> = {
  monday: { isAvailable: true, startTime: '08:00', endTime: '17:00' },
  tuesday: { isAvailable: true, startTime: '08:00', endTime: '17:00' },
  wednesday: { isAvailable: true, startTime: '08:00', endTime: '17:00' },
  thursday: { isAvailable: true, startTime: '08:00', endTime: '17:00' },
  friday: { isAvailable: true, startTime: '08:00', endTime: '17:00' },
  saturday: { isAvailable: true, startTime: '08:00', endTime: '17:00' },
  sunday: { isAvailable: false, startTime: '08:00', endTime: '17:00' }
};

// Clinic operating hours constraints
export const CLINIC_HOURS = {
  earliest: '08:00',
  latest: '19:00'
};

/**
 * Get doctor's current schedule or return default
 */
export const getDoctorSchedule = async (doctorId: string): Promise<DoctorSchedule> => {
  try {
    const scheduleRef = doc(db, DOCTOR_SCHEDULES_COLLECTION, doctorId);
    const scheduleSnap = await getDoc(scheduleRef);
    
    if (scheduleSnap.exists()) {
      return { id: scheduleSnap.id, ...scheduleSnap.data() } as DoctorSchedule;
    } else {
      // Return default schedule if none exists
      return {
        doctorId,
        schedule: DEFAULT_SCHEDULE,
        effectiveFrom: Timestamp.now(),
        createdBy: 'system',
        updatedAt: Timestamp.now(),
        version: 1
      };
    }
  } catch (error) {
    console.error('Error getting doctor schedule:', error);
    throw error;
  }
};

/**
 * Validate time format and clinic hours
 */
export const validateTimeSlot = (startTime: string, endTime: string): { valid: boolean; error?: string } => {
  // Validate time format (HH:MM)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    return { valid: false, error: 'Formato de hora inválido. Use HH:MM (ej: 08:00)' };
  }
  
  // Check clinic hours
  if (startTime < CLINIC_HOURS.earliest || endTime > CLINIC_HOURS.latest) {
    return { 
      valid: false, 
      error: `Horario debe estar entre ${CLINIC_HOURS.earliest} y ${CLINIC_HOURS.latest}` 
    };
  }
  
  // Check start is before end
  if (startTime >= endTime) {
    return { valid: false, error: 'Hora de inicio debe ser anterior a hora de fin' };
  }
  
  // Check minimum duration (30 minutes)
  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);
  const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  
  if (diffMinutes < 30) {
    return { valid: false, error: 'Duración mínima debe ser 30 minutos' };
  }
  
  return { valid: true };
};

/**
 * Check for appointment conflicts when changing schedule
 */
export const checkScheduleConflicts = async (
  doctorId: string, 
  newSchedule: Record<DayOfWeek, DaySchedule>
): Promise<ScheduleConflict[]> => {
  try {
    // Get future appointments for this doctor (next 3 months)
    const today = new Date();
    const futureDate = new Date();
    futureDate.setMonth(today.getMonth() + 3);
    
    const appointments = await getAppointments(today, futureDate, doctorId);
    
    // Filter only scheduled/confirmed appointments
    const activeAppointments = appointments.filter(apt => 
      apt.status === 'scheduled' || apt.status === 'confirmed'
    );
    
    const conflicts: ScheduleConflict[] = [];
    
    for (const appointment of activeAppointments) {
      const aptDate = appointment.appointmentDate.toDate();
      const dayOfWeek = getDayOfWeekFromDate(aptDate);
      const daySchedule = newSchedule[dayOfWeek];
      
      // Check if day is now unavailable
      if (!daySchedule.isAvailable) {
        conflicts.push({
          appointmentId: appointment.id!,
          patientName: 'Paciente', // You might want to fetch patient name
          appointmentDate: aptDate,
          appointmentTime: aptDate.toLocaleTimeString('es-MX', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          duration: appointment.duration,
          reason: `${getDayNameInSpanish(dayOfWeek)} ya no disponible`
        });
        continue;
      }
      
      // Check if appointment time is outside new hours
      const aptTime = aptDate.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }); // This gives "HH:MM" format
      
      const aptEndTime = new Date(aptDate.getTime() + appointment.duration * 60000);
      const aptEndTimeStr = aptEndTime.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      const isOutsideHours = 
        aptTime < daySchedule.startTime || 
        aptEndTimeStr > daySchedule.endTime;
      
      if (isOutsideHours) {
        conflicts.push({
          appointmentId: appointment.id!,
          patientName: 'Paciente',
          appointmentDate: aptDate,
          appointmentTime: aptTime,
          duration: appointment.duration,
          reason: `Cita fuera del nuevo horario (${daySchedule.startTime}-${daySchedule.endTime})`
        });
      }
    }
    
    return conflicts;
  } catch (error) {
    console.error('Error checking schedule conflicts:', error);
    throw error;
  }
};

/**
 * Save doctor schedule
 */
export const saveDoctorSchedule = async (
  doctorId: string,
  schedule: Record<DayOfWeek, DaySchedule>,
  updatedBy: string
): Promise<void> => {
  try {
    // Get current version for optimistic locking
    const currentSchedule = await getDoctorSchedule(doctorId);
    
    const scheduleData = {
      doctorId,
      schedule,
      effectiveFrom: Timestamp.now(),
      createdBy: currentSchedule.createdBy || updatedBy,
      updatedAt: serverTimestamp(),
      version: (currentSchedule.version || 0) + 1
    };
    
    const scheduleRef = doc(db, DOCTOR_SCHEDULES_COLLECTION, doctorId);
    await setDoc(scheduleRef, scheduleData);
    
    console.log('Doctor schedule saved successfully');
  } catch (error) {
    console.error('Error saving doctor schedule:', error);
    throw error;
  }
};

/**
 * Get all doctor schedules (for admin)
 */
export const getAllDoctorSchedules = async (): Promise<DoctorSchedule[]> => {
  try {
    const schedulesRef = collection(db, DOCTOR_SCHEDULES_COLLECTION);
    const snapshot = await getDocs(schedulesRef);
    
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }) as DoctorSchedule);
  } catch (error) {
    console.error('Error getting all doctor schedules:', error);
    throw error;
  }
};

/**
 * Check if doctor is available on specific day and time
 */
export const isDoctorAvailable = (
  schedule: DoctorSchedule,
  date: Date,
  time: string,
  duration: number = 60
): boolean => {
  const dayOfWeek = getDayOfWeekFromDate(date);
  const daySchedule = schedule.schedule[dayOfWeek];
  
  if (!daySchedule.isAvailable) {
    return false;
  }
  
  // Calculate end time of appointment
  const startTime = new Date(`2000-01-01T${time}:00`);
  const endTime = new Date(startTime.getTime() + duration * 60000);
  const endTimeStr = endTime.toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  // Check if appointment fits within day schedule
  return time >= daySchedule.startTime && endTimeStr <= daySchedule.endTime;
};

// Helper functions
export const getDayOfWeekFromDate = (date: Date): DayOfWeek => {
  const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};

export const getDayNameInSpanish = (day: DayOfWeek): string => {
  const names = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };
  return names[day];
};

export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};