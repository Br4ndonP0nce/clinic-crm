// src/hooks/usePermissions.ts - ENHANCED VERSION
import { useAuth } from './useAuth';
import { Permission } from '@/lib/firebase/rbac';
import { useMemo } from 'react';

export const usePermissions = () => {
  const { userProfile, hasPermission, hasAnyPermission } = useAuth();

  const permissions = useMemo(() => ({
    // Core navigation permissions
    canViewDashboard: hasPermission('dashboard:read'),
    
    // Patient management permissions
    canViewPatients: hasPermission('patients:read'),
    canEditPatients: hasPermission('patients:write'),
    canDeletePatients: hasPermission('patients:delete'),
    canCreatePatients: hasPermission('patients:write'),
    
    // Appointment management permissions
    canViewAppointments: hasPermission('appointments:read'),
    canCreateAppointments: hasPermission('appointments:write'),
    canEditAppointments: hasPermission('appointments:write'),
    canDeleteAppointments: hasPermission('appointments:delete'),
    
    // Treatment management permissions
    canViewTreatments: hasPermission('treatments:read'),
    canCreateTreatments: hasPermission('treatments:write'),
    canEditTreatments: hasPermission('treatments:write'),
    
    // Calendar permissions
    canViewCalendar: hasPermission('calendar:read'),
    canManageCalendar: hasPermission('calendar:write'),
    
    // 🆕 ENHANCED BILLING PERMISSIONS
    canViewBilling: hasPermission('billing:read') || userProfile?.role === 'doctor',
    canManageBilling: hasPermission('billing:write') || userProfile?.role === 'doctor',
    canProcessPayments: hasPermission('billing:write') || userProfile?.role === 'doctor',
    
    // Enhanced billing access for doctors
    canCreateBillingReports: hasPermission('billing:write') || userProfile?.role === 'doctor',
    canEditOwnBillingReports: userProfile?.role === 'doctor' || hasPermission('billing:write'),
    canViewAllBillingReports: hasPermission('billing:read') && userProfile?.role !== 'doctor',
    canDeleteBillingReports: hasPermission('billing:write') && userProfile?.role !== 'doctor',
    
    // Sales and ventas permissions
    canViewSales: hasPermission('ventas:read'),
    canManageSales: hasPermission('ventas:write'),
    canViewCommissions: hasPermission('ventas:read'),
    
    // Settings permissions
    canViewSettings: hasPermission('settings:read'),
    canEditSettings: hasPermission('settings:write'),
    
    // Staff management permissions
    canViewStaff: hasPermission('staff:read'),
    canManageStaff: hasPermission('staff:write'),
    canDeleteStaff: hasPermission('staff:delete'),

    // 🆕 ENHANCED APPOINTMENT PERMISSIONS FOR DOCTORS
    canEditOwnAppointments: userProfile?.role === 'doctor' || hasPermission('appointments:write'),
    canDeleteOwnAppointments: userProfile?.role === 'doctor' || hasPermission('appointments:delete'),
    canManageOwnPatientData: userProfile?.role === 'doctor' || hasPermission('patients:write'),

    // Compound permissions for complex operations
    canManagePatients: hasAnyPermission(['patients:read', 'patients:write']),
    canManageAppointments: hasAnyPermission(['appointments:read', 'appointments:write']),
    canManageTreatments: hasAnyPermission(['treatments:read', 'treatments:write']),
    
    // 🆕 ENHANCED FINANCIAL PERMISSIONS
    canManageFinances: hasAnyPermission(['billing:read', 'billing:write', 'ventas:read']) || userProfile?.role === 'doctor',
    canViewFinancialReports: hasPermission('billing:read') || userProfile?.role === 'doctor',
    canCreateFinancialDocuments: hasPermission('billing:write') || userProfile?.role === 'doctor',
    
    // Role-based compound permissions
    isDoctor: userProfile?.role === 'doctor',
    isReceptionist: userProfile?.role === 'recepcion',
    isSalesStaff: userProfile?.role === 'ventas',
    isAdmin: hasAnyPermission(['staff:write', 'settings:write']),
    isSuperAdmin: userProfile?.role === 'super_admin',
    
    // Clinical access levels (based on actual permissions)
    canAccessClinicalData: hasAnyPermission([
      'patients:read', 
      'treatments:read', 
      'appointments:read'
    ]),
    canModifyClinicalData: hasAnyPermission([
      'patients:write', 
      'treatments:write', 
      'appointments:write'
    ]) || userProfile?.role === 'doctor',
    
    // Administrative access levels
    canAccessAdminPanel: hasAnyPermission([
      'staff:read', 
      'settings:read'
    ]),
    canManageSystem: hasAnyPermission([
      'staff:write', 
      'settings:write'
    ]),
    
    // Business operations access
    canAccessBusinessData: hasAnyPermission([
      'billing:read', 
      'ventas:read'
    ]) || userProfile?.role === 'doctor',
    canManageBusinessOperations: hasAnyPermission([
      'billing:write', 
      'ventas:write'
    ]) || userProfile?.role === 'doctor',

    // Front desk operations
    canManageFrontDesk: hasAnyPermission([
      'appointments:read',
      'patients:read',
      'calendar:read'
    ]),
    
    // 🆕 CONTEXTUAL PERMISSIONS - Based on resource ownership
    canEditAppointment: (appointmentDoctorId?: string) => {
      if (userProfile?.role === 'super_admin') return true;
      if (userProfile?.role === 'recepcion') return true;
      if (userProfile?.role === 'doctor' && appointmentDoctorId === userProfile.uid) return true;
      return hasPermission('appointments:write');
    },
    
    canDeleteAppointment: (appointmentDoctorId?: string, appointmentStatus?: string) => {
      if (userProfile?.role === 'super_admin') return true;
      if (userProfile?.role === 'recepcion' && appointmentStatus !== 'completed') return true;
      if (userProfile?.role === 'doctor' && 
          appointmentDoctorId === userProfile.uid && 
          appointmentStatus !== 'completed' && 
          appointmentStatus !== 'cancelled') return true;
      return hasPermission('appointments:delete');
    },
    
    canViewBillingReport: (reportDoctorId?: string) => {
      if (userProfile?.role === 'super_admin') return true;
      if (userProfile?.role === 'recepcion') return true;
      if (userProfile?.role === 'doctor' && reportDoctorId === userProfile.uid) return true;
      return hasPermission('billing:read');
    },
    
    canEditBillingReport: (reportDoctorId?: string) => {
      if (userProfile?.role === 'super_admin') return true;
      if (userProfile?.role === 'recepcion') return true;
      if (userProfile?.role === 'doctor' && reportDoctorId === userProfile.uid) return true;
      return hasPermission('billing:write');
    },
    
    canCreateBillingReportForAppointment: (appointmentDoctorId?: string) => {
      if (userProfile?.role === 'super_admin') return true;
      if (userProfile?.role === 'recepcion') return true;
      if (userProfile?.role === 'doctor' && appointmentDoctorId === userProfile.uid) return true;
      return hasPermission('billing:write');
    },
    
    // Role and status checks
    role: userProfile?.role,
    isActive: userProfile?.isActive || false,
    displayName: userProfile?.displayName || userProfile?.email || 'Usuario',
    userId: userProfile?.uid,
    
    // Helper functions for dynamic permission checking
    can: hasPermission,
    canAny: hasAnyPermission,
    
    // Navigation helpers based on role
    getDefaultRoute: () => {
      if (!userProfile?.isActive) return '/unauthorized';
      
      switch (userProfile?.role) {
        case 'super_admin':
          return '/admin/dashboard';
        case 'doctor':
          return '/admin/calendar'; // Changed from patients to calendar for doctors
        case 'ventas':
          return '/admin/ventas';
        case 'recepcion':
          return '/admin/calendar';
        default:
          return '/admin/dashboard';
      }
    },
    
    // Access level indicators
    getAccessLevel: () => {
      if (!userProfile?.isActive) return 'inactive';
      if (userProfile?.role === 'super_admin') return 'super_admin';
      if (hasAnyPermission(['staff:write', 'settings:write'])) return 'admin';
      if (userProfile?.role === 'doctor') return 'clinical';
      if (userProfile?.role === 'ventas') return 'sales';
      if (userProfile?.role === 'recepcion') return 'front_desk';
      return 'basic';
    },
    
    // 🆕 FEATURE FLAGS FOR UI COMPONENTS
    shouldShowBillingTab: () => {
      return hasPermission('billing:read') || userProfile?.role === 'doctor';
    },
    
    shouldShowEditButtons: (resourceOwnerId?: string) => {
      if (userProfile?.role === 'super_admin') return true;
      if (userProfile?.role === 'recepcion') return true;
      if (userProfile?.role === 'doctor' && resourceOwnerId === userProfile.uid) return true;
      return false;
    },
    
    shouldShowDeleteButtons: (resourceOwnerId?: string, resourceStatus?: string) => {
      if (userProfile?.role === 'super_admin') return true;
      if (userProfile?.role === 'recepcion' && resourceStatus !== 'completed') return true;
      if (userProfile?.role === 'doctor' && 
          resourceOwnerId === userProfile.uid && 
          resourceStatus !== 'completed') return true;
      return false;
    },
    
    // Quick permission groups for UI components
    patientPermissions: {
      read: hasPermission('patients:read'),
      write: hasPermission('patients:write') || userProfile?.role === 'doctor',
      delete: hasPermission('patients:delete'),
    },
    
    appointmentPermissions: {
      read: hasPermission('appointments:read'),
      write: hasPermission('appointments:write') || userProfile?.role === 'doctor',
      delete: hasPermission('appointments:delete'),
    },
    
    treatmentPermissions: {
      read: hasPermission('treatments:read'),
      write: hasPermission('treatments:write') || userProfile?.role === 'doctor',
    },
    
    billingPermissions: {
      read: hasPermission('billing:read') || userProfile?.role === 'doctor',
      write: hasPermission('billing:write') || userProfile?.role === 'doctor',
      create: hasPermission('billing:write') || userProfile?.role === 'doctor',
      delete: hasPermission('billing:write') && userProfile?.role !== 'doctor',
    },
    
    salesPermissions: {
      read: hasPermission('ventas:read'),
      write: hasPermission('ventas:write'),
    },
    
    staffPermissions: {
      read: hasPermission('staff:read'),
      write: hasPermission('staff:write'),
      delete: hasPermission('staff:delete'),
    },
    
    settingsPermissions: {
      read: hasPermission('settings:read'),
      write: hasPermission('settings:write'),
    },
    
    calendarPermissions: {
      read: hasPermission('calendar:read'),
      write: hasPermission('calendar:write') || userProfile?.role === 'doctor',
    },

    // 🆕 DATA FILTERING HELPERS
    shouldFilterDataByUser: () => {
      // Regular doctors should only see their own data
      // Super admins should see all data
      return userProfile?.role === 'doctor';
    },
    
    getDataFilterUserId: () => {
      // Only return user ID for filtering if it's a regular doctor
      if (userProfile?.role === 'doctor') {
        return userProfile.uid;
      }
      return null;
    },
    
    // 🆕 BILLING SPECIFIC HELPERS
    canProcessPaymentsFor: (reportDoctorId?: string) => {
      if (userProfile?.role === 'super_admin') return true;
      if (userProfile?.role === 'recepcion') return true;
      if (userProfile?.role === 'doctor' && reportDoctorId === userProfile.uid) return true;
      return hasPermission('billing:write');
    },
    
    canGenerateInvoicesFor: (reportDoctorId?: string) => {
      if (userProfile?.role === 'super_admin') return true;
      if (userProfile?.role === 'recepcion') return true;
      if (userProfile?.role === 'doctor' && reportDoctorId === userProfile.uid) return true;
      return hasPermission('billing:write');
    },
    
    canViewFinancialSummaries: () => {
      if (userProfile?.role === 'super_admin') return true;
      if (userProfile?.role === 'recepcion') return true;
      // Doctors can see summaries for their own work
      if (userProfile?.role === 'doctor') return true;
      return hasPermission('billing:read');
    }
  }), [userProfile, hasPermission, hasAnyPermission]);

  return permissions;
};