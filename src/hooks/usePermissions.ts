// src/hooks/usePermissions.ts
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
    
    // Billing permissions
    canViewBilling: hasPermission('billing:read'),
    canManageBilling: hasPermission('billing:write'),
    canProcessPayments: hasPermission('billing:write'),
    
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

    // Compound permissions for complex operations
    canManagePatients: hasAnyPermission(['patients:read', 'patients:write']),
    canManageAppointments: hasAnyPermission(['appointments:read', 'appointments:write']),
    canManageTreatments: hasAnyPermission(['treatments:read', 'treatments:write']),
    canManageFinances: hasAnyPermission(['billing:read', 'billing:write', 'ventas:read']),
    
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
    ]),
    
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
    ]),
    canManageBusinessOperations: hasAnyPermission([
      'billing:write', 
      'ventas:write'
    ]),

    // Front desk operations
    canManageFrontDesk: hasAnyPermission([
      'appointments:read',
      'patients:read',
      'calendar:read'
    ]),
    
    // Role and status checks
    role: userProfile?.role,
    isActive: userProfile?.isActive || false,
    displayName: userProfile?.displayName || userProfile?.email || 'Usuario',
    
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
          return '/admin/patients';
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
    
    // Quick permission groups for UI components (only using existing permissions)
    patientPermissions: {
      read: hasPermission('patients:read'),
      write: hasPermission('patients:write'),
      delete: hasPermission('patients:delete'),
    },
    
    appointmentPermissions: {
      read: hasPermission('appointments:read'),
      write: hasPermission('appointments:write'),
      delete: hasPermission('appointments:delete'),
    },
    
    treatmentPermissions: {
      read: hasPermission('treatments:read'),
      write: hasPermission('treatments:write'),
    },
    
    billingPermissions: {
      read: hasPermission('billing:read'),
      write: hasPermission('billing:write'),
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
      write: hasPermission('calendar:write'),
    }
  }), [userProfile, hasPermission, hasAnyPermission]);

  return permissions;
};