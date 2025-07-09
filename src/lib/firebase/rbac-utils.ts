// src/lib/firebase/rbacUtils.ts - Updated for Dental Practice
import { UserProfile, Role, Permission, getUserProfile } from './rbac';
import { updateUserRole } from './rbac';
import { getAllUsers } from './rbac';

/**
 * Batch update multiple users' roles
 */
export const batchUpdateUserRoles = async (
  updates: Array<{ uid: string; role: Role }>
): Promise<void> => {
  const promises = updates.map(({ uid, role }) => updateUserRole(uid, role));
  await Promise.all(promises);
};

/**
 * Get users by role
 */
export const getUsersByRole = async (role: Role): Promise<UserProfile[]> => {
  const allUsers = await getAllUsers();
  return allUsers.filter(user => user.role === role);
};

/**
 * Check if user can perform action on target user
 */
export const canManageUser = (
  currentUser: UserProfile, 
  targetUser: UserProfile
): boolean => {
  // Super admins can manage anyone except themselves
  if (currentUser.role === 'super_admin' && currentUser.uid !== targetUser.uid) {
    return true;
  }
  
  // No other roles can manage users in this dental practice system
  // Only super_admin has staff management permissions
  return false;
};

/**
 * Get role hierarchy level (higher number = more permissions)
 */
export const getRoleLevel = (role: Role): number => {
  const levels = {
    'recepcion': 1,     // Reception - front desk operations
    'ventas': 2,        // Sales - patient conversion and sales tracking
    'doctor': 3,        // Doctor - clinical operations and patient care
    'super_admin': 4    // Super Admin - full system access
  };
  return levels[role] || 0;
};

/**
 * Check if role A can manage role B
 */
export const canRoleManageRole = (managerRole: Role, targetRole: Role): boolean => {
  // Only super_admin can manage other users in this system
  return managerRole === 'super_admin' && targetRole !== 'super_admin';
};

/**
 * Get available roles that current user can assign
 */
export const getAssignableRoles = (currentUserRole: Role): Role[] => {
  // Only super_admin can assign roles
  if (currentUserRole === 'super_admin') {
    return ['recepcion', 'ventas', 'doctor'];
  }
  
  return [];
};

/**
 * Validate permission string format
 */
export const isValidPermission = (permission: string): permission is Permission => {
  const validPermissions: Permission[] = [
    'dashboard:read',
    'patients:read', 'patients:write', 'patients:delete',
    'appointments:read', 'appointments:write', 'appointments:delete',
    'treatments:read', 'treatments:write',
    'calendar:read', 'calendar:write',
    'billing:read', 'billing:write',
    'ventas:read', 'ventas:write',
    'settings:read', 'settings:write',
    'staff:read', 'staff:write', 'staff:delete'
  ];
  
  return validPermissions.includes(permission as Permission);
};

/**
 * Create audit log entry (extend as needed)
 */
export interface AuditLogEntry {
  id?: string;
  userId: string;
  action: string;
  targetUserId?: string;
  targetPatientId?: string; // Added for dental practice
  details: Record<string, any>;
  timestamp: any;
}

export const createAuditLog = async (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> => {
  // Implementation would go here - add to an audit_logs collection
  console.log('Dental Practice Audit log:', {
    ...entry,
    timestamp: new Date().toISOString()
  });
};