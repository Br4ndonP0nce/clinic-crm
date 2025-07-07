// src/types/patient.ts
export interface Patient {
    id?: string;
    
    // Basic Information (expanded from Lead)
    firstName: string;
    lastName: string;
    fullName: string; // computed
    email: string;
    phone: string;
    alternatePhone?: string;
    dateOfBirth: Date;
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
      lastPhysicalExam?: Date;
      primaryPhysician?: string;
    };
    
    // Dental History
    dentalHistory: {
      lastVisit?: Date;
      lastCleaning?: Date;
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
        date: Date;
        method: string;
      };
    };
    
    // System Fields (from existing Lead)
    createdAt: Date;
    updatedAt: Date;
    assignedTo?: string; // Doctor/Hygienist ID
    createdBy: string; // Staff member who added patient
    notes: string;
    statusHistory: PatientStatusHistory[];
    
    // Consent and Legal
    consents: {
      treatmentConsent: boolean;
      privacyPolicy: boolean;
      marketingEmails: boolean;
      dateSigned?: Date;
    };
  }
  
  export interface PatientStatusHistory {
    id: string;
    previousStatus: Patient['status'];
    newStatus: Patient['status'];
    details: string;
    performedBy: string;
    performedAt: Date;
  }
  
  // Treatment Records
  export interface TreatmentRecord {
    id?: string;
    patientId: string;
    appointmentId?: string;
    date: Date;
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
    createdAt: Date;
    updatedAt: Date;
  }
  
  // Appointment System
  export interface Appointment {
    id?: string;
    patientId: string;
    doctorId: string;
    appointmentDate: Date;
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
      sentAt?: Date;
      method: 'email' | 'sms' | 'call';
    }[];
    
    // Room/Equipment assignments
    room?: string;
    equipment?: string[];
    
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
  }
  
  // Updated Role Types for Dental Practice
  