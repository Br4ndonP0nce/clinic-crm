// src/hooks/usePatientData.ts
import { useState, useEffect } from 'react';
import { 
  getPatient, 
  updatePatient, 
  getPatientTreatments, 
  getAppointments,
  Patient, 
  TreatmentRecord, 
  Appointment 
} from '@/lib/firebase/db';
import { getAllUsers, UserProfile } from '@/lib/firebase/rbac';
import { useAuth } from '@/hooks/useAuth';

interface UsePatientDataReturn {
  // Data
  patient: Patient | null;
  treatments: TreatmentRecord[];
  appointments: Appointment[];
  doctors: UserProfile[];
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  updatePatientData: (data: Partial<Patient>) => Promise<void>;
  refreshData: () => Promise<void>;
}

export const usePatientData = (patientId: string): UsePatientDataReturn => {
  const { userProfile } = useAuth();
  
  // Data state
  const [patient, setPatient] = useState<Patient | null>(null);
  const [treatments, setTreatments] = useState<TreatmentRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<UserProfile[]>([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch patient data
      const patientData = await getPatient(patientId);
      if (!patientData) {
        throw new Error('Patient not found');
      }
      setPatient(patientData);

      // Fetch related data in parallel
      const [treatmentData, appointmentData, allUsers] = await Promise.all([
        getPatientTreatments(patientId),
        getAppointments(undefined, undefined, undefined, patientId),
        getAllUsers(),
      ]);

      setTreatments(treatmentData);
      setAppointments(appointmentData);

      // Filter doctors
      const doctorUsers = allUsers.filter(
        (user) => user.role === "doctor" && user.isActive
      );
      setDoctors(doctorUsers);

    } catch (err) {
      console.error('Error fetching patient data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load patient data');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePatientData = async (data: Partial<Patient>) => {
    try {
      setIsSaving(true);
      setError(null);
      
      await updatePatient(patientId, data, userProfile?.uid);
      
      // Update local state optimistically
      setPatient(prev => prev ? { ...prev, ...data } : null);
      
    } catch (err) {
      console.error('Error updating patient:', err);
      setError(err instanceof Error ? err.message : 'Failed to update patient');
      throw err; // Re-throw so components can handle it
    } finally {
      setIsSaving(false);
    }
  };

  const refreshData = async () => {
    await fetchAllData();
  };

  // Initial data fetch
  useEffect(() => {
    if (patientId) {
      fetchAllData();
    }
  }, [patientId]);

  return {
    // Data
    patient,
    treatments,
    appointments,
    doctors,
    
    // Loading states
    isLoading,
    isSaving,
    
    // Error state
    error,
    
    // Actions
    updatePatientData,
    refreshData,
  };
};