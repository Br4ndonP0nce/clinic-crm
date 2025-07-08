// src/lib/firebase/sales.ts - UPDATED for Dental Practice
import { 
  collection, 
  doc, 
  getDoc,
  getDocs,
  addDoc, 
  updateDoc, 
  query, 
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';
import { 
  Sale, 
  PaymentProof, 
  SaleStatusHistory, 
  calculateAccessEndDate,
  PaymentRecord,
  PaymentMethod 
} from '@/types/sales';
import { updatePatient } from './db'; // Updated from updateLead

const SALES_COLLECTION = 'sales';

/**
 * Create a new sale when patient status is updated to "sale"
 */
export const createSale = async (saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory' | 'paymentProofs'>): Promise<string> => {
  try {
    const batch = writeBatch(db);
    
    // Create initial status history
    const initialHistory: SaleStatusHistory = {
      id: `history_${Date.now()}`,
      action: 'sale_created',
      details: `Sale created for ${saleData.product} with ${saleData.paymentPlan}`,
      amount: saleData.totalAmount,
      performedBy: saleData.saleUserId,
      performedAt: new Date()
    };

    // Create sale document
    const saleRef = doc(collection(db, SALES_COLLECTION));
    const saleId = saleRef.id;
    
    const sale: Omit<Sale, 'id'> = {
      ...saleData,
      paymentProofs: [], // Initialize empty array
      statusHistory: [initialHistory],
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any
    };

    batch.set(saleRef, sale);

    // Update patient with sale reference (using patientId instead of leadId)
    const patientId = saleData.patientId || saleData.leadId;
    if (patientId) {
      const patientRef = doc(db, 'patients', patientId);
      batch.update(patientRef, {
        saleId: saleId,
        status: 'active', // Update patient status to active when sale is created
        updatedAt: serverTimestamp()
      });
    }

    await batch.commit();
    return saleId;
  } catch (error) {
    console.error('Error creating sale:', error);
    throw error;
  }
};

/**
 * Add payment proof and update sale
 */
export const addPaymentProof = async (
  saleId: string, 
  paymentProof: Omit<PaymentProof, 'id' | 'uploadedAt'>,
  performedBy: string
): Promise<void> => {
  try {
    const saleRef = doc(db, SALES_COLLECTION, saleId);
    const saleSnap = await getDoc(saleRef);
    
    if (!saleSnap.exists()) {
      throw new Error('Sale not found');
    }

    const sale = saleSnap.data() as Sale;
    
    // Create new payment proof
    const newProof: PaymentProof = {
      ...paymentProof,
      id: `proof_${Date.now()}`,
      uploadedAt: new Date()
    };

    // Update paid amount
    const newPaidAmount = sale.paidAmount + paymentProof.amount;
    
    // Create status history entry
    const historyEntry: SaleStatusHistory = {
      id: `history_${Date.now()}`,
      action: 'payment_added',
      details: `Payment of $${paymentProof.amount} added`,
      amount: paymentProof.amount,
      performedBy,
      performedAt: new Date()
    };

    // Update sale
    await updateDoc(saleRef, {
      paymentProofs: [...(sale.paymentProofs || []), newProof],
      paidAmount: newPaidAmount,
      statusHistory: [...sale.statusHistory, historyEntry],
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding payment proof:', error);
    throw error;
  }
};

/**
 * Add payment record (new structured approach)
 */
export const addPaymentRecord = async (
  saleId: string,
  paymentData: Omit<PaymentRecord, 'id' | 'date'>,
  performedBy: string
): Promise<void> => {
  try {
    const saleRef = doc(db, SALES_COLLECTION, saleId);
    const saleSnap = await getDoc(saleRef);
    
    if (!saleSnap.exists()) {
      throw new Error('Sale not found');
    }

    const sale = saleSnap.data() as Sale;
    
    // Create new payment record
    const newPayment: PaymentRecord = {
      ...paymentData,
      id: `payment_${Date.now()}`,
      date: Timestamp.now()
    };

    // Update paid amount
    const newPaidAmount = sale.paidAmount + paymentData.amount;
    
    // Create status history entry
    const historyEntry: SaleStatusHistory = {
      id: `history_${Date.now()}`,
      action: 'payment_added',
      details: `Payment of $${paymentData.amount} via ${paymentData.method}`,
      amount: paymentData.amount,
      performedBy,
      performedAt: new Date()
    };

    // Update sale
    await updateDoc(saleRef, {
      payments: [...(sale.payments || []), newPayment],
      paidAmount: newPaidAmount,
      statusHistory: [...sale.statusHistory, historyEntry],
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding payment record:', error);
    throw error;
  }
};

/**
 * Start treatment/service (replaces grantCourseAccess for dental practice)
 */
export const startTreatment = async (
  saleId: string, 
  startDate: Date,
  startedBy: string,
  notes?: string
): Promise<void> => {
  try {
    const saleRef = doc(db, SALES_COLLECTION, saleId);
    
    const historyEntry: SaleStatusHistory = {
      id: `history_${Date.now()}`,
      action: 'treatment_started',
      details: `Treatment started on ${startDate.toLocaleDateString()}${notes ? `: ${notes}` : ''}`,
      performedBy: startedBy,
      performedAt: new Date()
    };

    const saleSnap = await getDoc(saleRef);
    if (!saleSnap.exists()) {
      throw new Error('Sale not found');
    }

    const sale = saleSnap.data() as Sale;

    await updateDoc(saleRef, {
      serviceCompleted: false,
      serviceStartDate: Timestamp.fromDate(startDate),
      // Keep legacy fields for backward compatibility
      accessGranted: true,
      statusHistory: [...sale.statusHistory, historyEntry],
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error starting treatment:', error);
    throw error;
  }
};

/**
 * Complete treatment/service
 */
export const completeTreatment = async (
  saleId: string,
  completionDate: Date,
  completedBy: string,
  notes?: string
): Promise<void> => {
  try {
    const saleRef = doc(db, SALES_COLLECTION, saleId);
    
    const historyEntry: SaleStatusHistory = {
      id: `history_${Date.now()}`,
      action: 'treatment_completed',
      details: `Treatment completed on ${completionDate.toLocaleDateString()}${notes ? `: ${notes}` : ''}`,
      performedBy: completedBy,
      performedAt: new Date()
    };

    const saleSnap = await getDoc(saleRef);
    if (!saleSnap.exists()) {
      throw new Error('Sale not found');
    }

    const sale = saleSnap.data() as Sale;

    await updateDoc(saleRef, {
      serviceCompleted: true,
      serviceEndDate: Timestamp.fromDate(completionDate),
      statusHistory: [...sale.statusHistory, historyEntry],
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error completing treatment:', error);
    throw error;
  }
};

/**
 * Grant course access (legacy function - kept for backward compatibility)
 */
export const grantCourseAccess = async (
  saleId: string, 
  startDate: Date,
  grantedBy: string
): Promise<void> => {
  try {
    const saleRef = doc(db, SALES_COLLECTION, saleId);
    const endDate = calculateAccessEndDate(startDate);
    
    const historyEntry: SaleStatusHistory = {
      id: `history_${Date.now()}`,
      action: 'access_granted',
      details: `Course access granted from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
      performedBy: grantedBy,
      performedAt: new Date()
    };

    const saleSnap = await getDoc(saleRef);
    if (!saleSnap.exists()) {
      throw new Error('Sale not found');
    }

    const sale = saleSnap.data() as Sale;

    await updateDoc(saleRef, {
      accessGranted: true,
      serviceStartDate: Timestamp.fromDate(startDate),
      accessEndDate: Timestamp.fromDate(endDate),
      statusHistory: [...sale.statusHistory, historyEntry],
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error granting course access:', error);
    throw error;
  }
};

/**
 * Update course access dates (admin/super_admin only)
 */
export const updateCourseAccess = async (
  saleId: string, 
  newStartDate: Date,
  updatedBy: string
): Promise<void> => {
  try {
    const saleRef = doc(db, SALES_COLLECTION, saleId);
    const newEndDate = calculateAccessEndDate(newStartDate);
    
    const historyEntry: SaleStatusHistory = {
      id: `history_${Date.now()}`,
      action: 'access_updated',
      details: `Course access updated: new period from ${newStartDate.toLocaleDateString()} to ${newEndDate.toLocaleDateString()}`,
      performedBy: updatedBy,
      performedAt: new Date()
    };

    const saleSnap = await getDoc(saleRef);
    if (!saleSnap.exists()) {
      throw new Error('Sale not found');
    }

    const sale = saleSnap.data() as Sale;

    await updateDoc(saleRef, {
      serviceStartDate: Timestamp.fromDate(newStartDate),
      accessEndDate: Timestamp.fromDate(newEndDate),
      statusHistory: [...sale.statusHistory, historyEntry],
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating course access:', error);
    throw error;
  }
};

/**
 * Revoke course access (admin/super_admin only)
 */
export const revokeCourseAccess = async (
  saleId: string,
  revokedBy: string,
  reason?: string
): Promise<void> => {
  try {
    const saleRef = doc(db, SALES_COLLECTION, saleId);
    
    const historyEntry: SaleStatusHistory = {
      id: `history_${Date.now()}`,
      action: 'access_revoked',
      details: `Course access revoked${reason ? `: ${reason}` : ''}`,
      performedBy: revokedBy,
      performedAt: new Date()
    };

    const saleSnap = await getDoc(saleRef);
    if (!saleSnap.exists()) {
      throw new Error('Sale not found');
    }

    const sale = saleSnap.data() as Sale;

    await updateDoc(saleRef, {
      accessGranted: false,
      serviceStartDate: null,
      accessEndDate: null,
      statusHistory: [...sale.statusHistory, historyEntry],
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error revoking course access:', error);
    throw error;
  }
};

/**
 * Grant exemption for payment requirements
 */
export const grantPaymentExemption = async (
  saleId: string,
  reason: string,
  grantedBy: string
): Promise<void> => {
  try {
    const saleRef = doc(db, SALES_COLLECTION, saleId);
    
    const historyEntry: SaleStatusHistory = {
      id: `history_${Date.now()}`,
      action: 'exemption_granted',
      details: `Payment exemption granted: ${reason}`,
      performedBy: grantedBy,
      performedAt: new Date()
    };

    const saleSnap = await getDoc(saleRef);
    if (!saleSnap.exists()) {
      throw new Error('Sale not found');
    }

    const sale = saleSnap.data() as Sale;

    await updateDoc(saleRef, {
      exemptionGranted: true,
      exemptionReason: reason,
      exemptionGrantedBy: grantedBy,
      statusHistory: [...sale.statusHistory, historyEntry],
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error granting exemption:', error);
    throw error;
  }
};

/**
 * Get all sales (with filters)
 */
export const getSales = async (filters?: {
  patientId?: string;
  leadId?: string;
  saleUserId?: string;
  product?: Sale['product'];
  accessGranted?: boolean;
  serviceCompleted?: boolean;
}): Promise<Sale[]> => {
  try {
    let q = query(collection(db, SALES_COLLECTION), orderBy('createdAt', 'desc'));
    
    // Handle both patientId and leadId for backward compatibility
    if (filters?.patientId) {
      q = query(q, where('patientId', '==', filters.patientId));
    } else if (filters?.leadId) {
      q = query(q, where('leadId', '==', filters.leadId));
    }
    
    if (filters?.saleUserId) {
      q = query(q, where('saleUserId', '==', filters.saleUserId));
    }
    if (filters?.product) {
      q = query(q, where('product', '==', filters.product));
    }
    if (filters?.accessGranted !== undefined) {
      q = query(q, where('accessGranted', '==', filters.accessGranted));
    }
    if (filters?.serviceCompleted !== undefined) {
      q = query(q, where('serviceCompleted', '==', filters.serviceCompleted));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
  } catch (error) {
    console.error('Error getting sales:', error);
    throw error;
  }
};

/**
 * Get sale by ID
 */
export const getSale = async (saleId: string): Promise<Sale | null> => {
  try {
    const saleRef = doc(db, SALES_COLLECTION, saleId);
    const saleSnap = await getDoc(saleRef);
    
    if (saleSnap.exists()) {
      return { id: saleSnap.id, ...saleSnap.data() } as Sale;
    }
    return null;
  } catch (error) {
    console.error('Error getting sale:', error);
    throw error;
  }
};

/**
 * Get sale by patient ID (updated from leadId)
 */
export const getSaleByPatientId = async (patientId: string): Promise<Sale | null> => {
  try {
    // Try patientId first, then fall back to leadId for backward compatibility
    let q = query(collection(db, SALES_COLLECTION), where('patientId', '==', patientId));
    let snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // Fall back to leadId for backward compatibility
      q = query(collection(db, SALES_COLLECTION), where('leadId', '==', patientId));
      snapshot = await getDocs(q);
    }
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Sale;
    }
    return null;
  } catch (error) {
    console.error('Error getting sale by patient ID:', error);
    throw error;
  }
};

/**
 * Get sale by lead ID (legacy function - kept for backward compatibility)
 */
export const getSaleByLeadId = getSaleByPatientId;

/**
 * Get active members (for /admin/activos route)
 * Returns patients with sales that meet minimum payment requirements
 */
export const getActiveMembers = async (): Promise<Array<Sale & { patientData: any }>> => {
  try {
    // Get all sales with "acceso_curso" product (legacy support)
    const salesQuery = query(
      collection(db, SALES_COLLECTION),
      where('product', '==', 'acceso_curso'),
      orderBy('createdAt', 'desc')
    );
    
    const salesSnapshot = await getDocs(salesQuery);
    const sales = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
    
    // Filter sales that meet minimum payment requirements
    const qualifiedSales = sales.filter(sale => {
      if (sale.exemptionGranted) return true;
      return sale.paidAmount >= (sale.totalAmount * 0.5);
    });
    
    // Get patient data for each qualified sale
    const activeMembersPromises = qualifiedSales.map(async (sale) => {
      try {
        const patientId = sale.patientId || sale.leadId;
        if (!patientId) return null;
        
        const patientRef = doc(db, 'patients', patientId);
        const patientSnap = await getDoc(patientRef);
        const patientData = patientSnap.exists() ? patientSnap.data() : null;
        
        if (!patientData) return null;
        
        return {
          ...sale,
          patientData
        } as Sale & { patientData: any };
      } catch (error) {
        console.error('Error fetching patient data for sale:', sale.id, error);
        return null;
      }
    });
    
    const activeMembersWithPatientData = await Promise.all(activeMembersPromises);
    
    // Filter out null values and ensure type safety
    return activeMembersWithPatientData.filter((member): member is Sale & { patientData: any } => 
      member !== null && member.patientData !== null
    );
  } catch (error) {
    console.error('Error getting active members:', error);
    throw error;
  }
};