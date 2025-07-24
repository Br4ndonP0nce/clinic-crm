// src/lib/firebase/rbac.ts - Updated for Dental Practice
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from './config';
import { User } from 'firebase/auth';

// Define all possible permissions in your system
export type Permission = 
  | 'dashboard:read'
  | 'patients:read' 
  | 'patients:write'
  | 'patients:delete'
  | 'appointments:read'
  | 'appointments:write'
  | 'appointments:delete'
  | 'treatments:read'
  | 'treatments:write'
  | 'calendar:read'
  | 'calendar:write'
  | 'billing:read'
  | 'billing:write'
  | 'ventas:read'
  | 'ventas:write'
  | 'settings:read'
  | 'settings:write'
  | 'staff:read'
  | 'staff:write'
  | 'staff:delete'
  | 'schedule:read'    // NEW: View schedules
  | 'schedule:write';  // NEW: Modify schedules

// Define roles for dental practice
export type Role = 'super_admin' | 'doctor' | 'recepcion' | 'ventas';

export interface RoleDefinition {
  id: Role;
  name: string;
  description: string;
  permissions: Permission[];
  isSystemRole: boolean;
}

// System roles definition for dental practice
export const SYSTEM_ROLES: Record<Role, RoleDefinition> = {
  super_admin: {
    id: 'super_admin',
    name: 'Super Admin',
    description: 'Acceso completo a todas las funciones del sistema',
    permissions: [
      'dashboard:read',
      'patients:read', 'patients:write', 'patients:delete',
      'appointments:read', 'appointments:write', 'appointments:delete',
      'treatments:read', 'treatments:write',
      'calendar:read', 'calendar:write',
      'billing:read', 'billing:write',
      'ventas:read', 'ventas:write',
      'settings:read', 'settings:write',
      'staff:read', 'staff:write', 'staff:delete',
       'schedule:read', 'schedule:write'  // NEW
    ],
    isSystemRole: true
  },
  doctor: {
    id: 'doctor',
    name: 'Doctor',
    description: 'Acceso completo a pacientes y tratamientos',
    permissions: [
      'dashboard:read',
      'patients:read', 'patients:write',
      'appointments:read', 'appointments:write',
      'treatments:read', 'treatments:write',
      'calendar:read', 'calendar:write',
      'billing:read',
      'schedule:read', 'schedule:write'  // NEW: Doctors can manage their own schedule
    ],
    isSystemRole: true
  },
  recepcion: {
    id: 'recepcion',
    name: 'Recepción',
    description: 'Gestión de pacientes, citas y facturación',
    permissions: [
      'dashboard:read',
      'patients:read', 'patients:write',
      'appointments:read', 'appointments:write',
      'calendar:read', 'calendar:write',
      'billing:read', 'billing:write',
       'schedule:read'  // NEW: Sales can view schedules for appointment booking
    ],
    isSystemRole: true
  },
  ventas: {
    id: 'ventas',
    name: 'Ventas',
    description: 'Acceso a pacientes y gestión de ventas/comisiones',
    permissions: [
      'dashboard:read',
      'patients:read', 'patients:write',
      'appointments:read',
      'calendar:read',
      'ventas:read', 'ventas:write',
       'schedule:read'  // 🆕 NEW (can view but not edit)
    ],
    isSystemRole: true
  }
};

// User profile with role information
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: Role;
  permissions?: Permission[]; // Custom permissions that override role
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
  createdBy?: string; // Who created this user
  lastLoginAt?: any;
}

const USERS_COLLECTION = 'app_users';

/**
 * Get user profile with role and permissions
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Create or update user profile
 */
export const createUserProfile = async (
  uid: string, 
  userData: Partial<UserProfile>,
  createdByUid?: string
): Promise<void> => {
  try {
    console.log('🔧 createUserProfile called with:');
    console.log('   UID:', uid);
    console.log('   UserData:', userData);
    console.log('   Role in userData:', userData.role);
    console.log('   CreatedBy:', createdByUid);
    
    const userRef = doc(db, USERS_COLLECTION, uid);
    const existingUser = await getDoc(userRef);
    
    if (existingUser.exists()) {
      console.log('📝 Updating existing user');
      
      const updateData: Record<string, any> = {
        ...userData,
        updatedAt: serverTimestamp()
      };
      
      const cleanUpdateData: Record<string, any> = {};
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanUpdateData[key] = value;
        }
      });
      
      console.log('📤 Clean update data:', cleanUpdateData);
      await updateDoc(userRef, cleanUpdateData);
      console.log('✅ Updated existing user profile');
      
    } else {
      console.log('🆕 Creating new user profile');
      
      const newUserData: Record<string, any> = {
        uid: uid,
        email: userData.email || '',
        displayName: userData.displayName || '',
        role: userData.role || 'recepcion', // Default to reception role
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      console.log('📦 Base user data built:', newUserData);
      console.log('🎯 Role assigned as:', newUserData.role);
      
      if (userData.permissions && userData.permissions.length > 0) {
        newUserData.permissions = userData.permissions;
        console.log('🔐 Added custom permissions:', userData.permissions);
      }
      
      if (createdByUid) {
        newUserData.createdBy = createdByUid;
        console.log('👤 Added createdBy:', createdByUid);
      }
      
      if (userData.lastLoginAt) {
        newUserData.lastLoginAt = userData.lastLoginAt;
      }
      
      console.log('📤 Final data to be saved to Firestore:');
      console.log(JSON.stringify(newUserData, null, 2));
      console.log('🎯 FINAL ROLE CONFIRMATION:', newUserData.role);
      
      await setDoc(userRef, newUserData);
      console.log('✅ User profile saved to Firestore');
      
      // Verification step
      console.log('🔍 Verifying what was actually saved...');
      const savedDoc = await getDoc(userRef);
      if (savedDoc.exists()) {
        const savedData = savedDoc.data();
        console.log('💾 Verification - Data read from Firestore:');
        console.log(JSON.stringify(savedData, null, 2));
        console.log('💾 Verification - Role in database:', savedData.role);
        
        if (savedData.role !== userData.role) {
          console.error('🚨 CRITICAL: ROLE MISMATCH DETECTED!');
          console.error('   🎯 Expected role:', userData.role);
          console.error('   💾 Actual role in DB:', savedData.role);
        } else {
          console.log('✅ SUCCESS: Role correctly saved as:', savedData.role);
        }
      } else {
        console.error('❌ ERROR: Could not read back the saved document!');
      }
    }
  } catch (error) {
    console.error('❌ Error in createUserProfile:', error);
    throw error;
  }
};

/**
 * Get all users (admin only)
 */
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const snapshot = await getDocs(usersRef);
    
    return snapshot.docs.map(doc => doc.data() as UserProfile);
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

/**
 * Update user role
 */
export const updateUserRole = async (uid: string, role: Role): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, {
      role,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

/**
 * Deactivate user
 */
export const deactivateUser = async (uid: string): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, {
      isActive: false,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error deactivating user:', error);
    throw error;
  }
};

/**
 * Delete user (hard delete)
 */
export const deleteUser = async (uid: string): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await deleteDoc(userRef);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

/**
 * Get effective permissions for a user
 */
export const getUserPermissions = (userProfile: UserProfile): Permission[] => {
  if (userProfile.permissions && userProfile.permissions.length > 0) {
    return userProfile.permissions;
  }
  
  const role = SYSTEM_ROLES[userProfile.role];
  return role ? role.permissions : [];
};

/**
 * Check if user has specific permission
 */
export const hasPermission = (userProfile: UserProfile, permission: Permission): boolean => {
  if (!userProfile.isActive) return false;
  
  const permissions = getUserPermissions(userProfile);
  return permissions.includes(permission);
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = (userProfile: UserProfile, permissions: Permission[]): boolean => {
  return permissions.some(permission => hasPermission(userProfile, permission));
};

/**
 * Check if user has all specified permissions
 */
export const hasAllPermissions = (userProfile: UserProfile, permissions: Permission[]): boolean => {
  return permissions.every(permission => hasPermission(userProfile, permission));
};

/**
 * Get routes accessible by user based on permissions
 */
export const getAccessibleRoutes = (userProfile: UserProfile): string[] => {
  const routes: string[] = [];
  const permissions = getUserPermissions(userProfile);
  
  if (permissions.includes('dashboard:read')) {
    routes.push('/admin');
  }
  
  if (permissions.includes('patients:read')) {
    routes.push('/admin/patients');
  }
  
  if (permissions.includes('calendar:read')) {
    routes.push('/admin/calendar');
  }
  
  if (permissions.includes('treatments:read')) {
    routes.push('/admin/treatments');
  }
  
  if (permissions.includes('billing:read')) {
    routes.push('/admin/billing');
  }
  
  if (permissions.includes('ventas:read')) {
    routes.push('/admin/ventas');
  }
  
  if (permissions.includes('settings:read')) {
    routes.push('/admin/settings');
  }
  
  if (permissions.includes('staff:read')) {
    routes.push('/admin/staff');
  }
    if (permissions.includes('schedule:write')) {
    routes.push('/admin/schedule-settings');
  }
  
  return routes;
};

/**
 * Initialize default admin user (run once during setup)
 */
export const initializeDefaultAdmin = async (adminUser: User): Promise<void> => {
  try {
    const existingProfile = await getUserProfile(adminUser.uid);
    
    if (!existingProfile) {
      const adminData: Partial<UserProfile> = {
        email: adminUser.email || '',
        role: 'super_admin',
        isActive: true
      };
      
      if (adminUser.displayName) {
        adminData.displayName = adminUser.displayName;
      }
      
      await createUserProfile(adminUser.uid, adminData);
      console.log('Default admin user initialized');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error initializing default admin:', error);
    throw error;
  }
};