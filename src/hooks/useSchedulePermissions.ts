// src/hooks/useSchedulePermissions.ts - Simplified version using your existing hook
import { usePermissions } from './usePermissions';

export const useSchedulePermissions = () => {
  const {
    canViewSchedules,
    canEditSchedules,
    canEditDoctorSchedule,
    canViewDoctorSchedule,
    schedulePermissions,
    isSuperAdmin,
    isDoctor,
    userId,
    role
  } = usePermissions();

  // Get list of doctor IDs this user can edit
  const getEditableDoctorIds = (allDoctors: { uid: string }[]): string[] => {
    if (!canEditSchedules) return [];
    
    if (isSuperAdmin) {
      return allDoctors.map(d => d.uid);
    }
    
    if (isDoctor && userId) {
      return [userId];
    }
    
    return [];
  };

  // Type-safe wrapper functions
  const canEditDoctorScheduleSafe = (doctorId: string | null | undefined): boolean => {
    if (!doctorId) return false;
    return canEditDoctorSchedule ? canEditDoctorSchedule(doctorId) : false;
  };

  const canViewDoctorScheduleSafe = (doctorId: string | null | undefined): boolean => {
    if (!doctorId) return false;
    return canViewDoctorSchedule ? canViewDoctorSchedule(doctorId) : false;
  };

  return {
    canViewSchedules,
    canEditSchedules,
    canEditDoctorSchedule: canEditDoctorScheduleSafe,
    canViewDoctorSchedule: canViewDoctorScheduleSafe,
    getEditableDoctorIds,
    schedulePermissions,
    isSuperAdmin,
    isDoctor,
    currentUserId: userId,
    role
  };
};