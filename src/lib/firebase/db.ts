import { 
  collection, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  orderBy,
  Timestamp,
  doc,
  serverTimestamp,
  limit as firestoreLimit
} from 'firebase/firestore';
import { db } from './config';

// =============================================================================
// DENTAL PRACTICE MANAGEMENT SYSTEM - DATABASE LAYER
// =============================================================================

// Core Types for Dental Practice
export interface Patient {
  id?: string;
  
  // Basic Information
  firstName: string;
  lastName: string;
  fullName: string; // computed: firstName + lastName
  email: string;
  phone: string;
  alternatePhone?: string;
  dateOfBirth: Timestamp;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  
  // Address Information
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Emergency Contact
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  
  // Insurance Information
  insurance: {
    provider?: string;
    policyNumber?: string;
    groupNumber?: string;
    subscriberName?: string;
    relationToSubscriber?: string;
    isActive: boolean;
  };
  
  // Medical History
  medicalHistory: {
    allergies: string[];
    medications: string[];
    medicalConditions: string[];
    surgeries: string[];
    lastPhysicalExam?: Timestamp;
    primaryPhysician?: string;
  };
  
  // Dental History
  dentalHistory: {
    lastVisit?: Timestamp;
    lastCleaning?: Timestamp;
    previousDentist?: string;
    reasonForVisit: string;
    oralHygiene: 'excellent' | 'good' | 'fair' | 'poor';
    brushingFrequency: 'twice_daily' | 'daily' | 'few_times_week' | 'rarely';
    flossingFrequency: 'daily' | 'few_times_week' | 'weekly' | 'rarely' | 'never';
    currentProblems: string[];
    painLevel?: number; // 1-10 scale
  };
  
  // Patient Status (evolved from Lead status)
  status: 'inquiry' | 'scheduled' | 'active' | 'treatment' | 'maintenance' | 'inactive' | 'transferred';
  
  // Appointment Preferences
  preferences: {
    preferredTimeSlots: string[]; // e.g., ['morning', 'afternoon']
    preferredDays: string[]; // e.g., ['monday', 'wednesday', 'friday']
    communicationMethod: 'email' | 'phone' | 'text' | 'app';
    reminderPreferences: {
      email: boolean;
      sms: boolean;
      days: number; // how many days before appointment
    };
  };
  
  // Financial Information
  financial: {
    paymentMethod: 'insurance' | 'cash' | 'card' | 'payment_plan';
    balance: number;
    lastPayment?: {
      amount: number;
      date: Timestamp;
      method: string;
    };
  };
  
  // System Fields
  createdAt: Timestamp;
  updatedAt: Timestamp;
  assignedTo?: string; // Doctor/Hygienist ID
  createdBy: string; // Staff member who added patient
  notes: string;
  statusHistory: PatientStatusHistory[];
  
  // Consent and Legal (HIPAA Compliance)
  consents: {
    treatmentConsent: boolean;
    privacyPolicy: boolean;
    marketingEmails: boolean;
    dateSigned?: Timestamp;
  };
}

export interface PatientStatusHistory {
  id: string;
  previousStatus: Patient['status'];
  newStatus: Patient['status'];
  details: string;
  performedBy: string;
  performedAt: Timestamp;
}

// Appointment Management
export interface Appointment {
  id?: string;
  patientId: string;
  doctorId: string;
  appointmentDate: Timestamp;
  duration: number; // in minutes
  type: 'consultation' | 'cleaning' | 'procedure' | 'followup' | 'emergency';
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  reasonForVisit: string;
  notes?: string;
  
  // Preparation instructions
  preVisitInstructions?: string;
  
  // Reminders
  reminders: {
    sent: boolean;
    sentAt?: Timestamp;
    method: 'email' | 'sms' | 'call';
  }[];
  
  // Room/Equipment assignments
  room?: string;
  equipment?: string[];
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

// Treatment Records
export interface TreatmentRecord {
  id?: string;
  patientId: string;
  appointmentId?: string;
  date: Timestamp;
  doctorId: string;
  treatment: {
    code: string; // Dental procedure code
    description: string;
    tooth?: string[]; // Which teeth involved
    surface?: string[]; // Which surfaces of teeth
    diagnosis: string;
    notes: string;
  };
  cost: {
    total: number;
    insuranceCovered: number;
    patientPortion: number;
  };
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// =============================================================================
// FIRESTORE COLLECTIONS
// =============================================================================

const PATIENTS_COLLECTION = 'patients'; // Renamed from 'leads'
const APPOINTMENTS_COLLECTION = 'appointments';
const TREATMENTS_COLLECTION = 'treatments';
const CONTENT_COLLECTION = 'content'; // Keep existing for website

// =============================================================================
// PATIENT MANAGEMENT FUNCTIONS (Evolved from Lead functions)
// =============================================================================

/**
 * Add a new patient to Firestore
 */
export const addPatient = async (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'fullName'>): Promise<string> => {
  try {
    const fullName = `${patientData.firstName} ${patientData.lastName}`.trim();
    
    const docRef = await addDoc(collection(db, PATIENTS_COLLECTION), {
      ...patientData,
      fullName,
      status: patientData.status || 'inquiry', // Default status
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding patient:', error);
    throw error;
  }
};

/**
 * Update a patient's status or data
 */
export const updatePatient = async (patientId: string, data: Partial<Patient>, performedBy?: string): Promise<void> => {
  try {
    const patientRef = doc(db, PATIENTS_COLLECTION, patientId);
    
    // If status is being updated, add to history
    if (data.status && performedBy) {
      const currentPatient = await getDoc(patientRef);
      if (currentPatient.exists()) {
        const currentData = currentPatient.data() as Patient;
        const historyEntry: PatientStatusHistory = {
          id: `history_${Date.now()}`,
          previousStatus: currentData.status,
          newStatus: data.status,
          details: `Status updated from ${currentData.status} to ${data.status}`,
          performedBy,
          performedAt: Timestamp.fromDate(new Date())
        };
        
        data.statusHistory = [...(currentData.statusHistory || []), historyEntry];
      }
    }
    
    // Update fullName if first or last name changed
    if (data.firstName || data.lastName) {
      const currentPatient = await getDoc(patientRef);
      if (currentPatient.exists()) {
        const currentData = currentPatient.data() as Patient;
        const firstName = data.firstName || currentData.firstName;
        const lastName = data.lastName || currentData.lastName;
        data.fullName = `${firstName} ${lastName}`.trim();
      }
    }
    
    await updateDoc(patientRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    throw error;
  }
};

/**
 * Get a single patient by ID
 */
export const getPatient = async (patientId: string): Promise<Patient | null> => {
  try {
    const patientRef = doc(db, PATIENTS_COLLECTION, patientId);
    const patientSnap = await getDoc(patientRef);
    
    if (patientSnap.exists()) {
      return { id: patientSnap.id, ...patientSnap.data() } as Patient;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting patient:', error);
    throw error;
  }
};

/**
 * Get all patients, optionally filtered by status
 */
export const getPatients = async (status?: Patient['status'], limit?: number): Promise<Patient[]> => {
  try {
    let q = status
      ? query(
          collection(db, PATIENTS_COLLECTION), 
          where('status', '==', status),
          orderBy('createdAt', 'desc')
        )
      : query(
          collection(db, PATIENTS_COLLECTION),
          orderBy('createdAt', 'desc')
        );
    
    if (limit) {
      q = query(q, firestoreLimit(limit));
    }
    
    const querySnapshot = await getDocs(q);
    const patients: Patient[] = [];
    
    querySnapshot.forEach((doc) => {
      patients.push({ id: doc.id, ...doc.data() } as Patient);
    });
    
    return patients;
  } catch (error) {
    console.error('Error getting patients:', error);
    throw error;
  }
};

/**
 * Search patients by name, email, or phone
 */
export const searchPatients = async (searchTerm: string): Promise<Patient[]> => {
  try {
    // Note: Firestore doesn't support native text search
    // For small datasets, we can fetch all and filter client-side
    // For production, consider Algolia or similar search service
    
    const allPatients = await getPatients();
    const searchTermLower = searchTerm.toLowerCase();
    
    return allPatients.filter(patient => 
      patient.fullName.toLowerCase().includes(searchTermLower) ||
      patient.firstName.toLowerCase().includes(searchTermLower) ||
      patient.lastName.toLowerCase().includes(searchTermLower) ||
      patient.email.toLowerCase().includes(searchTermLower) ||
      patient.phone.toLowerCase().includes(searchTermLower)
    );
  } catch (error) {
    console.error('Error searching patients:', error);
    throw error;
  }
};

/**
 * Get patients by assigned provider (doctor/hygienist)
 */
export const getPatientsByProvider = async (providerId: string): Promise<Patient[]> => {
  try {
    const q = query(
      collection(db, PATIENTS_COLLECTION),
      where('assignedTo', '==', providerId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const patients: Patient[] = [];
    
    querySnapshot.forEach((doc) => {
      patients.push({ id: doc.id, ...doc.data() } as Patient);
    });
    
    return patients;
  } catch (error) {
    console.error('Error getting patients by provider:', error);
    throw error;
  }
};

// =============================================================================
// APPOINTMENT MANAGEMENT FUNCTIONS
// =============================================================================

/**
 * Add a new appointment
 */
export const addAppointment = async (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, APPOINTMENTS_COLLECTION), {
      ...appointmentData,
      status: appointmentData.status || 'scheduled',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding appointment:', error);
    throw error;
  }
};

/**
 * Get appointments for a specific date range
 */
export const getAppointments = async (
  startDate?: Date, 
  endDate?: Date, 
  doctorId?: string,
  patientId?: string
): Promise<Appointment[]> => {
  try {
    let q = query(collection(db, APPOINTMENTS_COLLECTION));
    
    if (startDate && endDate) {
      q = query(
        q,
        where('appointmentDate', '>=', Timestamp.fromDate(startDate)),
        where('appointmentDate', '<=', Timestamp.fromDate(endDate))
      );
    }
    
    if (doctorId) {
      q = query(q, where('doctorId', '==', doctorId));
    }
    
    if (patientId) {
      q = query(q, where('patientId', '==', patientId));
    }
    
    q = query(q, orderBy('appointmentDate', 'asc'));
    
    const querySnapshot = await getDocs(q);
    const appointments: Appointment[] = [];
    
    querySnapshot.forEach((doc) => {
      appointments.push({ id: doc.id, ...doc.data() } as Appointment);
    });
    
    return appointments;
  } catch (error) {
    console.error('Error getting appointments:', error);
    throw error;
  }
};

/**
 * Update appointment status
 */
export const updateAppointment = async (appointmentId: string, data: Partial<Appointment>): Promise<void> => {
  try {
    const appointmentRef = doc(db, APPOINTMENTS_COLLECTION, appointmentId);
    await updateDoc(appointmentRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }
};

// =============================================================================
// TREATMENT MANAGEMENT FUNCTIONS
// =============================================================================

/**
 * Add a treatment record
 */
export const addTreatmentRecord = async (treatmentData: Omit<TreatmentRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, TREATMENTS_COLLECTION), {
      ...treatmentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding treatment record:', error);
    throw error;
  }
};

/**
 * Get treatment history for a patient
 */
export const getPatientTreatments = async (patientId: string): Promise<TreatmentRecord[]> => {
  try {
    const q = query(
      collection(db, TREATMENTS_COLLECTION),
      where('patientId', '==', patientId),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const treatments: TreatmentRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      treatments.push({ id: doc.id, ...doc.data() } as TreatmentRecord);
    });
    
    return treatments;
  } catch (error) {
    console.error('Error getting patient treatments:', error);
    throw error;
  }
};

// =============================================================================
// CONTENT MANAGEMENT (Keep existing functionality)
// =============================================================================

export interface ContentItem {
  id?: string;
  type: 'text' | 'image' | 'video';
  section: string;
  key: string;
  value: string;
  label: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const getAllContent = async (): Promise<ContentItem[]> => {
  try {
    const q = query(
      collection(db, CONTENT_COLLECTION),
      orderBy('section'),
      orderBy('key')
    );
    
    const querySnapshot = await getDocs(q);
    const content: ContentItem[] = [];
    
    querySnapshot.forEach((doc) => {
      content.push({ id: doc.id, ...doc.data() } as ContentItem);
    });
    
    return content;
  } catch (error) {
    console.error('Error getting content:', error);
    throw error;
  }
};

export const getContentBySection = async (section: string): Promise<ContentItem[]> => {
  try {
    const q = query(
      collection(db, CONTENT_COLLECTION),
      where('section', '==', section),
      orderBy('key')
    );
    
    const querySnapshot = await getDocs(q);
    const content: ContentItem[] = [];
    
    querySnapshot.forEach((doc) => {
      content.push({ id: doc.id, ...doc.data() } as ContentItem);
    });
    
    return content;
  } catch (error) {
    console.error('Error getting section content:', error);
    throw error;
  }
};

export const updateContent = async (contentId: string, value: string): Promise<void> => {
  try {
    const contentRef = doc(db, CONTENT_COLLECTION, contentId);
    await updateDoc(contentRef, {
      value,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating content:', error);
    throw error;
  }
};

// =============================================================================
// BACKWARD COMPATIBILITY (For gradual migration)
// =============================================================================

// Keep these aliases for existing code during transition
export const addLead = addPatient;
export const getLead = getPatient;
export const getLeads = getPatients;
export const updateLead = updatePatient;
export const searchLeads = searchPatients;

// Export legacy Lead type as alias
export type Lead = Patient;