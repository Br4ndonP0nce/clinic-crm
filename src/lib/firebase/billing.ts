// src/lib/firebase/billing.ts
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
  writeBatch,
  limit as firestoreLimit,
  startAfter,
  QueryDocumentSnapshot,
  deleteDoc
  } from 'firebase/firestore';
import { db } from './config';
  
  import { 
    BillingReport, 
    BillingPayment, 
    BillingPaymentInput,
    BillingStatusHistory,
    Expense,
    BillingDashboard,
    PaymentMethodBreakdown,
    ServiceCategoryBreakdown,
    MonthlyTrend,
    generateInvoiceNumber,
  MEXICAN_TAX_RATE,
    BillingService
  } from '@/types/billing';
  import { getAppointment, Patient, Appointment } from './db';
  import { getUserProfile } from './rbac';
  
  // Collection names
  const BILLING_REPORTS_COLLECTION = 'billing_reports';
  const EXPENSES_COLLECTION = 'expenses';
  
  // =============================================================================
  // BILLING REPORTS MANAGEMENT
  // =============================================================================
  
  /**
   * Create a new billing report from an appointment
   */
  export interface BillingReportSummary {
  id: string;
  title: string;
  status: BillingReport['status'];
  total: number;
  paidAmount: number;
  pendingAmount: number;
  invoiceNumber?: string;
  createdAt: Timestamp;
  reportType: BillingReportType;
  isPartialReport: boolean;
}
export type BillingReportType = 
  | 'complete_visit'      // Complete appointment report
  | 'partial_treatment'   // Specific treatment within visit
  | 'product_sale'        // Product purchases
  | 'additional_service'  // Additional services
  | 'emergency_addon'     // Emergency add-on services
  | 'insurance_claim';    // Insurance-specific report
  export interface CreateReportOptions {
  reportType: BillingReportType;
  title: string;
  description?: string;
  isPartialReport?: boolean;
  parentReportId?: string; // For linking related reports
  includePreviousServices?: boolean; // Copy services from previous reports
}
const cleanDataForFirestore = (data: any): any => {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => cleanDataForFirestore(item));
  }

  // Handle objects
  if (typeof data === 'object') {
    // Check if it's a Firestore Timestamp or other special object
    if ('toDate' in data || 'seconds' in data || 'nanoseconds' in data) {
      return data; // Keep Firestore Timestamps as-is
    }

    const cleaned: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = cleanDataForFirestore(value);
      }
    }
    return cleaned;
  }

  // Primitive values (string, number, boolean)
  return data;
};
export const deleteBillingReport = async (reportId: string): Promise<void> => {
  try {
    const reportRef = doc(db, BILLING_REPORTS_COLLECTION, reportId);
    
    // Optional: Verify the report exists before attempting deletion
    const reportSnap = await getDoc(reportRef);
    if (!reportSnap.exists()) {
      throw new Error('Billing report not found');
    }
    
    // Perform hard delete
    await deleteDoc(reportRef);
    
    console.log(`Billing report ${reportId} successfully deleted`);
  } catch (error) {
    console.error('Error deleting billing report:', error);
    throw error;
  }
};

/**
 * Soft delete a billing report (recommended approach)
 * Marks the report as deleted but preserves data for recovery/audit
 */
export const softDeleteBillingReport = async (
  reportId: string,
  deletedBy: string,
  reason?: string
): Promise<void> => {
  try {
    const reportRef = doc(db, BILLING_REPORTS_COLLECTION, reportId);
    const reportSnap = await getDoc(reportRef);
    
    if (!reportSnap.exists()) {
      throw new Error('Billing report not found');
    }

    const report = reportSnap.data() as BillingReport;

    // Create status history entry
    const historyEntry: BillingStatusHistory = {
      id: `history_${Date.now()}`,
      previousStatus: report.status,
      newStatus: 'deleted' as any, // Adding 'deleted' as a valid status
      details: `Report soft deleted${reason ? ': ' + reason : ''}`,
      performedBy: deletedBy,
      performedAt: Timestamp.now()
    };

    await updateDoc(reportRef, {
      status: 'deleted',
      isDeleted: true,
      deletedAt: serverTimestamp(),
      deletedBy,
      deleteReason: reason,
      statusHistory: [...(report.statusHistory || []), historyEntry],
      lastModifiedBy: deletedBy,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error soft deleting billing report:', error);
    throw error;
  }
};
const getNextReportSequence = async (appointmentId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, BILLING_REPORTS_COLLECTION),
      where('appointmentId', '==', appointmentId),
      orderBy('reportSequence', 'desc'),
      firestoreLimit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return 1;
    }
    
    const lastReport = querySnapshot.docs[0].data();
    return (lastReport.reportSequence || 0) + 1;
  } catch (error) {
    console.error('Error getting next report sequence:', error);
    // Fallback to timestamp-based sequence if orderBy fails
    return Date.now() % 1000; // Last 3 digits of timestamp
  }
};
export const createBillingReport = async (
  appointmentId: string,
  createdBy: string,
  options: CreateReportOptions,
  initialServices?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    category: string;
    procedureCode?: string;
    tooth?: string[];
  }>
): Promise<string> => {
  try {
    // Get appointment details
    const appointment = await getAppointment(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Get current timestamp for consistent use
    const now = Timestamp.now();

    // Calculate initial totals
    const services = initialServices || [];
    const subtotal = services.reduce((sum, service) => sum + (service.quantity * service.unitPrice), 0);
    const tax = Math.round(subtotal * MEXICAN_TAX_RATE * 100) / 100;
    const total = subtotal + tax;

    // Prepare services array with proper structure (clean optional fields)
    const billingServices: BillingService[] = services.map((service, index) => ({
      id: `service_${Date.now()}_${index}`,
      description: service.description,
      quantity: service.quantity,
      unitPrice: service.unitPrice,
      total: service.quantity * service.unitPrice,
      category: service.category as any,
      providedBy: appointment.doctorId,
      // ✅ CONDITIONAL FIELDS - only add if they exist
      ...(service.procedureCode && { procedureCode: service.procedureCode }),
      ...(service.tooth && service.tooth.length > 0 && { tooth: service.tooth })
    }));

    // Prepare status history entry with proper timestamp
    const statusHistoryEntry: BillingStatusHistory = {
      id: `history_${Date.now()}`,
      previousStatus: 'draft' as any,
      newStatus: 'draft',
      details: `${options.reportType || 'billing'} report created: ${options.title}`,
      performedBy: createdBy,
      performedAt: now
    };

    // Get next sequence number
    const reportSequence = await getNextReportSequence(appointmentId);

    // ✅ FIXED: Build billing report with conditional spread to avoid undefined values
    const billingReportData = {
      // Required core fields
      appointmentId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      status: 'draft' as const,
      reportSequence,
      
      // Financial data
      subtotal,
      tax,
      discount: 0,
      total,
      paidAmount: 0,
      pendingAmount: total,
      
      // Arrays and objects
      services: billingServices,
      payments: [],
      statusHistory: [statusHistoryEntry],
      
      // Booleans
      pdfGenerated: false,
      
      // System fields
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy,
      lastModifiedBy: createdBy,
      
      // ✅ CONDITIONAL FIELDS - only added if they have values
      ...(options.reportType && { reportType: options.reportType }),
      ...(options.title && { reportTitle: options.title }),
      ...(options.description && { reportDescription: options.description }),
      ...(typeof options.isPartialReport === 'boolean' && { isPartialReport: options.isPartialReport }),
      ...(options.parentReportId && { parentReportId: options.parentReportId })
    };

    // Copy services from previous reports if requested
    if (options.includePreviousServices && options.parentReportId) {
      const parentReport = await getBillingReport(options.parentReportId);
      if (parentReport && parentReport.services.length > 0) {
        // Add parent services with adjusted IDs
        const parentServices = parentReport.services.map((service, index) => ({
          ...service,
          id: `inherited_${Date.now()}_${index}`,
          total: service.quantity * service.unitPrice
        }));
        
        billingReportData.services = [...billingReportData.services, ...parentServices];
        
        // Recalculate totals
        const newSubtotal = billingReportData.services.reduce((sum, service) => sum + (service.total || 0), 0);
        billingReportData.subtotal = newSubtotal;
        billingReportData.tax = Math.round(newSubtotal * MEXICAN_TAX_RATE * 100) / 100;
        billingReportData.total = newSubtotal + billingReportData.tax;
        billingReportData.pendingAmount = billingReportData.total;
      }
    }

    console.log('Creating billing report with clean data:', billingReportData);

    const docRef = await addDoc(collection(db, BILLING_REPORTS_COLLECTION), billingReportData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating billing report:', error);
    throw error;
  }
};
  export const getBillingReportsByAppointment = async (
  appointmentId: string
): Promise<BillingReportSummary[]> => {
  try {
    const q = query(
      collection(db, BILLING_REPORTS_COLLECTION),
      where('appointmentId', '==', appointmentId),
      orderBy('reportSequence', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.reportTitle || `Report ${data.reportSequence || 1}`,
        status: data.status,
        total: data.total || 0,
        paidAmount: data.paidAmount || 0,
        pendingAmount: data.pendingAmount || 0,
        invoiceNumber: data.invoiceNumber,
        createdAt: data.createdAt,
        reportType: data.reportType || 'complete_visit',
        isPartialReport: data.isPartialReport || false
      } as BillingReportSummary;
    });
  } catch (error) {
    console.error('Error getting billing reports by appointment:', error);
    throw error;
  }
};
export const getAppointmentBillingSummary = async (appointmentId: string): Promise<{
  totalReports: number;
  totalAmount: number;
  totalPaid: number;
  totalPending: number;
  hasCompletedReports: boolean;
  hasDraftReports: boolean;
  reportTypes: BillingReportType[];
}> => {
  try {
    const reports = await getBillingReportsByAppointment(appointmentId);
    
    const summary = {
      totalReports: reports.length,
      totalAmount: reports.reduce((sum, report) => sum + report.total, 0),
      totalPaid: reports.reduce((sum, report) => sum + report.paidAmount, 0),
      totalPending: reports.reduce((sum, report) => sum + report.pendingAmount, 0),
      hasCompletedReports: reports.some(report => 
        report.status === 'completed' || report.status === 'paid'
      ),
      hasDraftReports: reports.some(report => report.status === 'draft'),
      reportTypes: [...new Set(reports.map(report => report.reportType))]
    };
    
    return summary;
  } catch (error) {
    console.error('Error getting appointment billing summary:', error);
    throw error;
  }
};



export const duplicateBillingReport = async (
  sourceReportId: string,
  duplicatedBy: string,
  options: {
    newTitle: string;
    newDescription?: string;
    reportType?: BillingReportType;
    includeServices?: boolean;
    includePayments?: boolean;
  }
): Promise<string> => {
  try {
    const sourceReport = await getBillingReport(sourceReportId);
    if (!sourceReport) {
      throw new Error('Source report not found');
    }

    const now = Timestamp.now();

    // Prepare services (optional)
    let services: BillingService[] = [];
    if (options.includeServices && sourceReport.services) {
      services = sourceReport.services.map((service, index) => ({
        ...service,
        id: `duplicated_${Date.now()}_${index}`
      }));
    }

    // Prepare payments (optional)
    let payments: BillingPayment[] = [];
    let paidAmount = 0;
    if (options.includePayments && sourceReport.payments) {
      payments = sourceReport.payments.map((payment, index) => ({
        ...payment,
        id: `duplicated_${Date.now()}_${index}`
      }));
      paidAmount = sourceReport.paidAmount;
    }

    // Calculate totals
    const subtotal = services.reduce((sum, service) => sum + (service.total || 0), 0);
    const tax = Math.round(subtotal * MEXICAN_TAX_RATE * 100) / 100;
    const total = subtotal + tax - (sourceReport.discount || 0);
    const pendingAmount = total - paidAmount;

    // Status history entry
    const statusHistoryEntry: BillingStatusHistory = {
      id: `history_${Date.now()}`,
      previousStatus: 'draft' as any,
      newStatus: 'draft',
      details: `Report duplicated from ${sourceReport.invoiceNumber || sourceReportId}`,
      performedBy: duplicatedBy,
      performedAt: now
    };

    const duplicatedReport: Omit<BillingReport, 'id'> & {
      reportType: BillingReportType;
      reportTitle: string;
      reportDescription?: string;
      isPartialReport: boolean;
      parentReportId: string;
      reportSequence: number;
    } = {
      ...sourceReport,
      
      // Reset system fields
      status: 'draft',
      invoiceNumber: undefined,
      invoiceDate: undefined,
      dueDate: undefined,
      pdfGenerated: false,
      pdfUrl: undefined,
      
      // New metadata
      reportType: options.reportType || sourceReport.reportType || 'complete_visit',
      reportTitle: options.newTitle,
      reportDescription: options.newDescription,
      isPartialReport: true, // Duplicates are typically partial
      parentReportId: sourceReportId,
      reportSequence: await getNextReportSequence(sourceReport.appointmentId),
      
      // Financial data
      services,
      payments,
      subtotal,
      tax,
      total,
      paidAmount,
      pendingAmount,
      
      // System fields
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      createdBy: duplicatedBy,
      lastModifiedBy: duplicatedBy,
      statusHistory: [statusHistoryEntry]
    };

    const docRef = await addDoc(collection(db, BILLING_REPORTS_COLLECTION), duplicatedReport);
    return docRef.id;
  } catch (error) {
    console.error('Error duplicating billing report:', error);
    throw error;
  }
};
export const archiveBillingReport = async (
  reportId: string,
  archivedBy: string,
  reason?: string
): Promise<void> => {
  try {
    const reportRef = doc(db, BILLING_REPORTS_COLLECTION, reportId);
    const reportSnap = await getDoc(reportRef);
    
    if (!reportSnap.exists()) {
      throw new Error('Billing report not found');
    }

    const report = reportSnap.data() as BillingReport;

    // Create status history entry
    const historyEntry: BillingStatusHistory = {
      id: `history_${Date.now()}`,
      previousStatus: report.status,
      newStatus: 'archived' as any,
      details: `Report archived${reason ? ': ' + reason : ''}`,
      performedBy: archivedBy,
      performedAt: Timestamp.now()
    };

    await updateDoc(reportRef, {
      status: 'archived',
      archivedAt: serverTimestamp(),
      archivedBy,
      archiveReason: reason,
      statusHistory: [...(report.statusHistory || []), historyEntry],
      lastModifiedBy: archivedBy,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error archiving billing report:', error);
    throw error;
  }
};

/**
 * Link related billing reports
 */
export const linkBillingReports = async (
  reportIds: string[],
  linkType: 'related' | 'consolidated' | 'split',
  linkedBy: string,
  notes?: string
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    const linkId = `link_${Date.now()}`;
    
    for (const reportId of reportIds) {
      const reportRef = doc(db, BILLING_REPORTS_COLLECTION, reportId);
      batch.update(reportRef, {
        linkedReports: reportIds.filter(id => id !== reportId),
        linkType,
        linkId,
        linkNotes: notes,
        linkedBy,
        linkedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    await batch.commit();
  } catch (error) {
    console.error('Error linking billing reports:', error);
    throw error;
  }
};
// =============================================================================
// ENHANCED CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Create a quick partial report for additional services
 */
export const createPartialReport = async (
  appointmentId: string,
  title: string,
  services: any[],
  createdBy: string
): Promise<string> => {
  return createBillingReport(
    appointmentId,
    createdBy,
    {
      reportType: 'partial_treatment',
      title,
      description: `Tratamiento parcial: ${title}`,
      isPartialReport: true
      // No parentReportId - let it be undefined and it won't be included
    },
    services
  );
};

/**
 * Create emergency add-on report
 */
export const createEmergencyAddonReport = async (
  appointmentId: string,
  emergencyServices: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    category: string;
  }>,
  createdBy: string
): Promise<string> => {
  return createBillingReport(
    appointmentId,
    createdBy,
    {
      reportType: 'emergency_addon',
      title: 'Emergency Add-on Services',
      description: 'Additional emergency services provided during appointment',
      isPartialReport: true
    },
    emergencyServices
  );
};

/**
 * Create product sale report
 */
export const createProductSaleReport = async (
  appointmentId: string,
  products: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>,
  createdBy: string
): Promise<string> => {
  return createBillingReport(
    appointmentId,
    createdBy,
    {
      reportType: 'product_sale',
      title: 'Product Sale',
      description: `Products sold: ${products.map(p => p.description).join(', ')}`,
      isPartialReport: true
    },
    products.map(p => ({ ...p, category: 'products' }))
  );
};

/**
 * Get report type label for UI
 */
export const getReportTypeLabel = (reportType: BillingReportType): string => {
  const labels: Record<BillingReportType, string> = {
    complete_visit: 'Consulta Completa',
    partial_treatment: 'Tratamiento Parcial',
    product_sale: 'Venta de Productos',
    additional_service: 'Servicio Adicional',
    emergency_addon: 'Servicio de Emergencia',
    insurance_claim: 'Reclamo de Seguro'
  };
  
  return labels[reportType] || reportType;
};
////////////////////////////////////////////
  /**
   * Update billing report services and recalculate totals
   */
export const updateBillingServices = async (
  reportId: string,
  services: BillingReport['services'],
  discount: number = 0,
  updatedBy: string,
  customTax?: number // 🆕 NEW: Optional custom tax amount
): Promise<void> => {
  try {
    const reportRef = doc(db, BILLING_REPORTS_COLLECTION, reportId);
    const reportSnap = await getDoc(reportRef);
    
    if (!reportSnap.exists()) {
      throw new Error('Billing report not found');
    }

    const currentReport = reportSnap.data() as BillingReport;

    // Validate and clean services data
    const cleanServices = services.map((service, index) => {
      const cleanService: any = {
        id: service.id || `service_${Date.now()}_${index}`,
        description: service.description || '',
        quantity: Math.max(0, service.quantity || 0),
        unitPrice: Math.max(0, service.unitPrice || 0),
        total: Math.max(0, service.total || 0),
        category: service.category || 'consultation',
        providedBy: service.providedBy || updatedBy
      };

      // ✅ CONDITIONAL FIELDS - only add if they have actual values
      if (service.procedureCode && service.procedureCode.trim()) {
        cleanService.procedureCode = service.procedureCode.trim();
      }
      
      if (service.tooth && Array.isArray(service.tooth) && service.tooth.length > 0) {
        const cleanTooth = service.tooth.filter(t => t && t.trim()).map(t => t.trim());
        if (cleanTooth.length > 0) {
          cleanService.tooth = cleanTooth;
        }
      }

      return cleanService;
    }).filter(service => 
      // Only include services with valid data
      service.description.trim() !== '' && service.quantity > 0
    );

    // Calculate new totals
    const subtotal = cleanServices.reduce((sum, service) => sum + (service.total || 0), 0);
    
    // 🆕 UPDATED: Use custom tax if provided, otherwise calculate with standard rate
    const tax = customTax !== undefined 
      ? Math.round(customTax * 100) / 100 
      : Math.round(subtotal * MEXICAN_TAX_RATE * 100) / 100;
    
    const cleanDiscount = Math.max(0, discount || 0);
    const total = Math.round((subtotal + tax - cleanDiscount) * 100) / 100;
    const pendingAmount = Math.max(0, total - (currentReport.paidAmount || 0));

    // Create status history entry with regular Timestamp
    const historyEntry: BillingStatusHistory = {
      id: `history_${Date.now()}`,
      previousStatus: currentReport.status,
      newStatus: currentReport.status,
      details: `Services updated. New total: $${total.toFixed(2)}${customTax !== undefined ? ` (Custom tax: $${tax.toFixed(2)})` : ''}`,
      amount: total,
      performedBy: updatedBy,
      performedAt: Timestamp.now()
    };

    // ✅ CLEAN UPDATE DATA - no undefined values
    const updateData = {
      services: cleanServices,
      subtotal: subtotal,
      tax: tax,
      discount: cleanDiscount,
      total: total,
      pendingAmount: pendingAmount,
      statusHistory: [...(currentReport.statusHistory || []), historyEntry],
      lastModifiedBy: updatedBy,
      updatedAt: serverTimestamp()
    };

    console.log('Updating billing services with custom tax:', {
      subtotal,
      customTax,
      calculatedTax: tax,
      total
    });
    
    await updateDoc(reportRef, updateData);
  } catch (error) {
    console.error('Error updating billing services:', error);
    throw error;
  }
};
  /**
   * Add payment to billing report
   */
  export const addPaymentToBilling = async (
    reportId: string,
    paymentData: BillingPaymentInput,
    processedBy: string
  ): Promise<void> => {
    try {
      const reportRef = doc(db, BILLING_REPORTS_COLLECTION, reportId);
      const reportSnap = await getDoc(reportRef);
      
      if (!reportSnap.exists()) {
        throw new Error('Billing report not found');
      }
  
      const report = reportSnap.data() as BillingReport;
      const now = Timestamp.now();
  
      // Create new payment with regular Timestamp
      const newPayment: BillingPayment = {
        ...paymentData,
        id: `payment_${Date.now()}`,
        date: now,  // Use Timestamp.now()
        processedBy,
        verified: true,
        verifiedBy: processedBy,
        verifiedAt: now  // Use Timestamp.now()
      };
  
      // Update amounts
      const newPaidAmount = report.paidAmount + paymentData.amount;
      const newPendingAmount = report.total - newPaidAmount;
      
      // Determine new status
      let newStatus: BillingReport['status'] = report.status;
      if (newPaidAmount >= report.total) {
        newStatus = 'paid';
      } else if (newPaidAmount > 0) {
        newStatus = 'partially_paid';
      }
  
      // Create status history entry with regular Timestamp
      const historyEntry: BillingStatusHistory = {
        id: `history_${Date.now()}`,
        previousStatus: report.status,
        newStatus,
        details: `Payment of $${paymentData.amount.toFixed(2)} via ${paymentData.method}`,
        amount: paymentData.amount,
        performedBy: processedBy,
        performedAt: now
      };
  
      await updateDoc(reportRef, {
        payments: [...report.payments, newPayment],
        paidAmount: newPaidAmount,
        pendingAmount: newPendingAmount,
        status: newStatus,
        statusHistory: [...report.statusHistory, historyEntry],
        lastModifiedBy: processedBy,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding payment to billing:', error);
      throw error;
    }
  };
  
  /**
   * Complete billing report and generate invoice number
   */
  export const completeBillingReport = async (
    reportId: string,
    completedBy: string,
    notes?: string
  ): Promise<void> => {
    try {
      const reportRef = doc(db, BILLING_REPORTS_COLLECTION, reportId);
      const reportSnap = await getDoc(reportRef);
      
      if (!reportSnap.exists()) {
        throw new Error('Billing report not found');
      }
  
      const report = reportSnap.data() as BillingReport;
  
      if (report.status !== 'draft') {
        throw new Error('Only draft reports can be completed');
      }
  
      const invoiceNumber = generateInvoiceNumber();
      const now = Timestamp.now();
      const dueDate = Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30 days from now
  
      // Determine initial status based on payments
      const newStatus: BillingReport['status'] = report.paidAmount >= report.total ? 'paid' : 'completed';
  
      // Create status history entry with regular Timestamp
      const historyEntry: BillingStatusHistory = {
        id: `history_${Date.now()}`,
        previousStatus: report.status,
        newStatus,
        details: `Report completed. Invoice number: ${invoiceNumber}`,
        performedBy: completedBy,
        performedAt: now
      };
  
      // Prepare clean update data
      const updateData = {
        status: newStatus,
        invoiceNumber,
        invoiceDate: now,
        dueDate,
        notes: notes || report.notes || '', // Always provide a string
        statusHistory: [...(report.statusHistory || []), historyEntry],
        lastModifiedBy: completedBy,
        updatedAt: serverTimestamp()
      };
  
      console.log('Completing billing report with clean data:', updateData);
  
      await updateDoc(reportRef, updateData);
    } catch (error) {
      console.error('Error completing billing report:', error);
      throw error;
    }
  };
  
  /**
   * Get billing report by ID
   */
  export const getBillingReport = async (reportId: string): Promise<BillingReport | null> => {
    try {
      const reportRef = doc(db, BILLING_REPORTS_COLLECTION, reportId);
      const reportSnap = await getDoc(reportRef);
      
      if (reportSnap.exists()) {
        return { id: reportSnap.id, ...reportSnap.data() } as BillingReport;
      }
      return null;
    } catch (error) {
      console.error('Error getting billing report:', error);
      throw error;
    }
  };
  
  /**
   * Get billing reports with filters
   */
  export const getBillingReports = async (filters?: {
    patientId?: string;
    doctorId?: string;
    status?: BillingReport['status'];
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    lastDoc?: QueryDocumentSnapshot;
  }): Promise<{
    reports: BillingReport[];
    lastDoc?: QueryDocumentSnapshot;
    hasMore: boolean;
  }> => {
    try {
      let q = query(collection(db, BILLING_REPORTS_COLLECTION));
  
      // Apply filters
      if (filters?.patientId) {
        q = query(q, where('patientId', '==', filters.patientId));
      }
      if (filters?.doctorId) {
        q = query(q, where('doctorId', '==', filters.doctorId));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.startDate) {
        q = query(q, where('createdAt', '>=', Timestamp.fromDate(filters.startDate)));
      }
      if (filters?.endDate) {
        q = query(q, where('createdAt', '<=', Timestamp.fromDate(filters.endDate)));
      }
  
      // Order by creation date (most recent first)
      q = query(q, orderBy('createdAt', 'desc'));
  
      // Pagination
      if (filters?.lastDoc) {
        q = query(q, startAfter(filters.lastDoc));
      }
  
      const limitCount = filters?.limit || 20;
      q = query(q, firestoreLimit(limitCount + 1)); // Get one extra to check if there are more
  
      const querySnapshot = await getDocs(q);
      const reports = querySnapshot.docs.slice(0, limitCount).map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BillingReport));
  
      const hasMore = querySnapshot.docs.length > limitCount;
      const lastDoc = reports.length > 0 ? querySnapshot.docs[reports.length - 1] : undefined;
  
      return { reports, lastDoc, hasMore };
    } catch (error) {
      console.error('Error getting billing reports:', error);
      throw error;
    }
  };
  
  /**
   * Get billing report by appointment ID
   */
 export const getBillingReportByAppointment = async (
  appointmentId: string
): Promise<BillingReport | null> => {
  try {
    // First try to get the primary/complete report
    const q = query(
      collection(db, BILLING_REPORTS_COLLECTION),
      where('appointmentId', '==', appointmentId),
      where('reportType', '==', 'complete_visit'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(1)
    );
    
    let querySnapshot = await getDocs(q);
    
    // If no complete report, get the most recent report
    if (querySnapshot.empty) {
      const fallbackQ = query(
        collection(db, BILLING_REPORTS_COLLECTION),
        where('appointmentId', '==', appointmentId),
        orderBy('createdAt', 'desc'),
        firestoreLimit(1)
      );
      
      querySnapshot = await getDocs(fallbackQ);
    }
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as BillingReport;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting billing report by appointment:', error);
    throw error;
  }
};
  
  // =============================================================================
  // EXPENSE MANAGEMENT
  // =============================================================================
  
  /**
   * Add new expense
   */
  export const addExpense = async (
    expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
    submittedBy: string
  ): Promise<string> => {
    try {
      const expense: Omit<Expense, 'id'> = {
        ...expenseData,
        status: 'pending',
        submittedBy,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any
      };
  
      const docRef = await addDoc(collection(db, EXPENSES_COLLECTION), expense);
      return docRef.id;
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  };
  
  /**
   * Update expense status (approve/reject)
   */
  export const updateExpenseStatus = async (
    expenseId: string,
    status: Expense['status'],
    approvedBy: string,
    notes?: string
  ): Promise<void> => {
    try {
      const expenseRef = doc(db, EXPENSES_COLLECTION, expenseId);
      
      const updateData: any = {
        status,
        updatedAt: serverTimestamp()
      };
  
      if (status === 'approved') {
        updateData.approvedBy = approvedBy;
        updateData.approvedAt = serverTimestamp();
      }
  
      if (notes) {
        updateData.notes = notes;
      }
  
      await updateDoc(expenseRef, updateData);
    } catch (error) {
      console.error('Error updating expense status:', error);
      throw error;
    }
  };
  
  /**
   * Get expenses with filters
   */
  export const getExpenses = async (filters?: {
    category?: Expense['category'];
    status?: Expense['status'];
    submittedBy?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<Expense[]> => {
    try {
      let q = query(collection(db, EXPENSES_COLLECTION));
  
      // Apply filters
      if (filters?.category) {
        q = query(q, where('category', '==', filters.category));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.submittedBy) {
        q = query(q, where('submittedBy', '==', filters.submittedBy));
      }
      if (filters?.startDate) {
        q = query(q, where('date', '>=', Timestamp.fromDate(filters.startDate)));
      }
      if (filters?.endDate) {
        q = query(q, where('date', '<=', Timestamp.fromDate(filters.endDate)));
      }
  
      // Order by date (most recent first)
      q = query(q, orderBy('date', 'desc'));
  
      if (filters?.limit) {
        q = query(q, firestoreLimit(filters.limit));
      }
  
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Expense));
    } catch (error) {
      console.error('Error getting expenses:', error);
      throw error;
    }
  };
  
  /**
   * Delete expense
   */
  export const deleteExpense = async (expenseId: string): Promise<void> => {
    try {
      const expenseRef = doc(db, EXPENSES_COLLECTION, expenseId);
      await deleteDoc(expenseRef);
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  };
  
  // =============================================================================
  // DASHBOARD AND REPORTING
  // =============================================================================
  
  /**
   * Get billing dashboard data for a specific period
   */
  export const getBillingDashboard = async (
    startDate: Date,
    endDate: Date,
    doctorId?: string
  ): Promise<BillingDashboard> => {
    try {
      // Get billing reports for the period
      const reportsFilter: any = {
        startDate,
        endDate,
        limit: 1000 // Get all reports for the period
      };
      
      if (doctorId) {
        reportsFilter.doctorId = doctorId;
      }
  
      const { reports } = await getBillingReports(reportsFilter);
  
      // Get expenses for the period
      const expenses = await getExpenses({
        startDate,
        endDate,
        limit: 1000
      });
  
      // Calculate revenue metrics
      const totalRevenue = reports.reduce((sum, report) => sum + report.total, 0);
      const paidRevenue = reports.reduce((sum, report) => sum + report.paidAmount, 0);
      const pendingRevenue = reports.reduce((sum, report) => sum + report.pendingAmount, 0);
      const overdueRevenue = reports
        .filter(report => {
          if (!report.dueDate || report.status === 'paid') return false;
          const dueDate = report.dueDate.toDate();
          return dueDate < new Date() && report.pendingAmount > 0;
        })
        .reduce((sum, report) => sum + report.pendingAmount, 0);
  
      // Calculate expense metrics
      const totalExpenses = expenses
        .filter(expense => expense.status === 'approved' || expense.status === 'paid')
        .reduce((sum, expense) => sum + expense.amount, 0);
      const approvedExpenses = expenses
        .filter(expense => expense.status === 'approved')
        .reduce((sum, expense) => sum + expense.amount, 0);
      const pendingExpenses = expenses
        .filter(expense => expense.status === 'pending')
        .reduce((sum, expense) => sum + expense.amount, 0);
  
      // Calculate derived metrics
      const netIncome = paidRevenue - totalExpenses;
      const grossMargin = paidRevenue > 0 ? ((paidRevenue - totalExpenses) / paidRevenue) * 100 : 0;
  
      // Count reports by status
      const totalReports = reports.length;
      const completedReports = reports.filter(r => r.status === 'completed' || r.status === 'paid' || r.status === 'partially_paid').length;
      const draftReports = reports.filter(r => r.status === 'draft').length;
      const overdueReports = reports.filter(r => {
        if (!r.dueDate || r.status === 'paid') return false;
        const dueDate = r.dueDate.toDate();
        return dueDate < new Date() && r.pendingAmount > 0;
      }).length;
  
      // Payment method breakdown
      const paymentMethodMap = new Map<string, { count: number; amount: number }>();
      reports.forEach(report => {
        report.payments.forEach(payment => {
          const current = paymentMethodMap.get(payment.method) || { count: 0, amount: 0 };
          paymentMethodMap.set(payment.method, {
            count: current.count + 1,
            amount: current.amount + payment.amount
          });
        });
      });
  
      const paymentMethodBreakdown: PaymentMethodBreakdown[] = Array.from(paymentMethodMap.entries()).map(([method, data]) => ({
        method: method as any,
        count: data.count,
        amount: data.amount,
        percentage: paidRevenue > 0 ? (data.amount / paidRevenue) * 100 : 0
      }));
  
      // Service category breakdown
      const serviceCategoryMap = new Map<string, { count: number; revenue: number }>();
      reports.forEach(report => {
        report.services.forEach(service => {
          const current = serviceCategoryMap.get(service.category) || { count: 0, revenue: 0 };
          serviceCategoryMap.set(service.category, {
            count: current.count + service.quantity,
            revenue: current.revenue + service.total
          });
        });
      });
  
      const serviceCategoryBreakdown: ServiceCategoryBreakdown[] = Array.from(serviceCategoryMap.entries()).map(([category, data]) => ({
        category: category as any,
        count: data.count,
        revenue: data.revenue,
        averagePrice: data.count > 0 ? data.revenue / data.count : 0
      }));
  
      // Monthly trends (simplified - could be expanded)
      const monthlyTrends: MonthlyTrend[] = [];
      const monthlyData = new Map<string, { revenue: number; expenses: number; reportCount: number }>();
      
      reports.forEach(report => {
        const date = report.createdAt.toDate();
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const current = monthlyData.get(monthKey) || { revenue: 0, expenses: 0, reportCount: 0 };
        monthlyData.set(monthKey, {
          revenue: current.revenue + report.paidAmount,
          expenses: current.expenses,
          reportCount: current.reportCount + 1
        });
      });
  
      expenses.forEach(expense => {
        if (expense.status === 'approved' || expense.status === 'paid') {
          const date = expense.date.toDate();
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const current = monthlyData.get(monthKey) || { revenue: 0, expenses: 0, reportCount: 0 };
          monthlyData.set(monthKey, {
            revenue: current.revenue,
            expenses: current.expenses + expense.amount,
            reportCount: current.reportCount
          });
        }
      });
  
      Array.from(monthlyData.entries()).forEach(([month, data]) => {
        monthlyTrends.push({
          month,
          revenue: data.revenue,
          expenses: data.expenses,
          netIncome: data.revenue - data.expenses,
          reportCount: data.reportCount
        });
      });
  
      // Sort monthly trends by month
      monthlyTrends.sort((a, b) => a.month.localeCompare(b.month));
  
      return {
        period: {
          start: Timestamp.fromDate(startDate),
          end: Timestamp.fromDate(endDate)
        },
        totalRevenue,
        paidRevenue,
        pendingRevenue,
        overdueRevenue,
        totalExpenses,
        approvedExpenses,
        pendingExpenses,
        netIncome,
        grossMargin,
        totalReports,
        completedReports,
        draftReports,
        overdueReports,
        paymentMethodBreakdown,
        serviceCategoryBreakdown,
        monthlyTrends
      };
    } catch (error) {
      console.error('Error getting billing dashboard:', error);
      throw error;
    }
  };
  
  /**
   * Mark PDF as generated for a billing report
   */
  export const markPdfGenerated = async (
    reportId: string,
    pdfUrl: string,
    generatedBy: string
  ): Promise<void> => {
    try {
      const reportRef = doc(db, BILLING_REPORTS_COLLECTION, reportId);
      const reportSnap = await getDoc(reportRef);
      
      if (!reportSnap.exists()) {
        throw new Error('Billing report not found');
      }
  
      const report = reportSnap.data() as BillingReport;
  
      const historyEntry: BillingStatusHistory = {
        id: `history_${Date.now()}`,
        previousStatus: report.status,
        newStatus: report.status,
        details: 'PDF invoice generated',
        performedBy: generatedBy,
        performedAt: serverTimestamp() as any
      };
  
      await updateDoc(reportRef, {
        pdfGenerated: true,
        pdfUrl,
        statusHistory: [...report.statusHistory, historyEntry],
        lastModifiedBy: generatedBy,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking PDF as generated:', error);
      throw error;
    }
  };
  
  /**
   * Get revenue summary for quick dashboard view
   */
  export const getRevenueSummary = async (doctorId?: string): Promise<{
    today: number;
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
  }> => {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);
  
      const [todayReports, weekReports, monthReports, yearReports] = await Promise.all([
        getBillingReports({ startDate: startOfDay, doctorId, limit: 1000 }),
        getBillingReports({ startDate: startOfWeek, doctorId, limit: 1000 }),
        getBillingReports({ startDate: startOfMonth, doctorId, limit: 1000 }),
        getBillingReports({ startDate: startOfYear, doctorId, limit: 1000 })
      ]);
  
      return {
        today: todayReports.reports.reduce((sum, r) => sum + r.paidAmount, 0),
        thisWeek: weekReports.reports.reduce((sum, r) => sum + r.paidAmount, 0),
        thisMonth: monthReports.reports.reduce((sum, r) => sum + r.paidAmount, 0),
        thisYear: yearReports.reports.reduce((sum, r) => sum + r.paidAmount, 0)
      };
    } catch (error) {
      console.error('Error getting revenue summary:', error);
      throw error;
    }
  };
  
  /**
   * Update billing report notes
   */
  export const updateBillingNotes = async (
    reportId: string,
    notes: string,
    internalNotes: string,
    updatedBy: string
  ): Promise<void> => {
    try {
      const reportRef = doc(db, BILLING_REPORTS_COLLECTION, reportId);
      
      // Clean the data - ensure we never pass undefined
      const updateData = {
        notes: notes || '',  // Always provide a string, even if empty
        internalNotes: internalNotes || '', // Always provide a string, even if empty
        lastModifiedBy: updatedBy,
        updatedAt: serverTimestamp()
      };
  
      console.log('Updating billing notes with clean data:', updateData);
      
      await updateDoc(reportRef, updateData);
    } catch (error) {
      console.error('Error updating billing notes:', error);
      throw error;
    }
  };
  
  /**
   * Get overdue billing reports
   */
  export const getOverdueBillingReports = async (doctorId?: string): Promise<BillingReport[]> => {
    try {
      const now = new Date();
      let q = query(
        collection(db, BILLING_REPORTS_COLLECTION),
        where('dueDate', '<', Timestamp.fromDate(now)),
        where('status', 'in', ['completed', 'partially_paid']),
        orderBy('dueDate', 'asc')
      );
  
      if (doctorId) {
        q = query(q, where('doctorId', '==', doctorId));
      }
  
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as BillingReport))
        .filter(report => report.pendingAmount > 0);
    } catch (error) {
      console.error('Error getting overdue billing reports:', error);
      throw error;
    }
  };