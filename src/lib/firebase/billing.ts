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
    MEXICAN_TAX_RATE
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
  export const createBillingReport = async (
    appointmentId: string,
    createdBy: string,
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
  
      // Calculate initial totals
      const services = initialServices || [];
      const subtotal = services.reduce((sum, service) => sum + (service.quantity * service.unitPrice), 0);
      const tax = Math.round(subtotal * MEXICAN_TAX_RATE * 100) / 100;
      const total = subtotal + tax;
  
      const billingReport: Omit<BillingReport, 'id'> = {
        appointmentId,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        status: 'draft',
        
        // Financial
        subtotal,
        tax,
        discount: 0,
        total,
        paidAmount: 0,
        pendingAmount: total,
        
        // Services and Payments
        services: services.map((service, index) => ({
          id: `service_${index + 1}`,
          description: service.description,
          quantity: service.quantity,
          unitPrice: service.unitPrice,
          total: service.quantity * service.unitPrice,
          procedureCode: service.procedureCode,
          tooth: service.tooth,
          category: service.category as any,
          providedBy: appointment.doctorId
        })),
        payments: [],
        
        // PDF
        pdfGenerated: false,
        
        // System fields
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
        createdBy,
        lastModifiedBy: createdBy,
        
        // Status history
        statusHistory: [{
          id: `history_${Date.now()}`,
          previousStatus: 'draft' as any,
          newStatus: 'draft',
          details: 'Billing report created',
          performedBy: createdBy,
          performedAt: serverTimestamp() as any
        }]
      };
  
      const docRef = await addDoc(collection(db, BILLING_REPORTS_COLLECTION), billingReport);
      return docRef.id;
    } catch (error) {
      console.error('Error creating billing report:', error);
      throw error;
    }
  };
  
  /**
   * Update billing report services and recalculate totals
   */
  export const updateBillingServices = async (
    reportId: string,
    services: BillingReport['services'],
    discount: number = 0,
    updatedBy: string
  ): Promise<void> => {
    try {
      const reportRef = doc(db, BILLING_REPORTS_COLLECTION, reportId);
      const reportSnap = await getDoc(reportRef);
      
      if (!reportSnap.exists()) {
        throw new Error('Billing report not found');
      }
  
      const currentReport = reportSnap.data() as BillingReport;
  
      // Calculate new totals
      const subtotal = services.reduce((sum, service) => sum + service.total, 0);
      const tax = Math.round(subtotal * MEXICAN_TAX_RATE * 100) / 100;
      const total = Math.round((subtotal + tax - discount) * 100) / 100;
      const pendingAmount = total - currentReport.paidAmount;
  
      // Create status history entry
      const historyEntry: BillingStatusHistory = {
        id: `history_${Date.now()}`,
        previousStatus: currentReport.status,
        newStatus: currentReport.status,
        details: `Services updated. New total: $${total.toFixed(2)}`,
        amount: total,
        performedBy: updatedBy,
        performedAt: serverTimestamp() as any
      };
  
      await updateDoc(reportRef, {
        services,
        subtotal,
        tax,
        discount,
        total,
        pendingAmount,
        statusHistory: [...currentReport.statusHistory, historyEntry],
        lastModifiedBy: updatedBy,
        updatedAt: serverTimestamp()
      });
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
  
      // Create new payment
      const newPayment: BillingPayment = {
        ...paymentData,
        id: `payment_${Date.now()}`,
        date: serverTimestamp() as any,
        processedBy,
        verified: true,
        verifiedBy: processedBy,
        verifiedAt: serverTimestamp() as any
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
  
      // Create status history entry
      const historyEntry: BillingStatusHistory = {
        id: `history_${Date.now()}`,
        previousStatus: report.status,
        newStatus,
        details: `Payment of $${paymentData.amount.toFixed(2)} via ${paymentData.method}`,
        amount: paymentData.amount,
        performedBy: processedBy,
        performedAt: serverTimestamp() as any
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
      const invoiceDate = serverTimestamp() as any;
      const dueDate = Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30 days from now
  
      // Determine initial status based on payments
      const newStatus: BillingReport['status'] = report.paidAmount >= report.total ? 'paid' : 'completed';
  
      // Create status history entry
      const historyEntry: BillingStatusHistory = {
        id: `history_${Date.now()}`,
        previousStatus: report.status,
        newStatus,
        details: `Report completed. Invoice number: ${invoiceNumber}`,
        performedBy: completedBy,
        performedAt: serverTimestamp() as any
      };
  
      await updateDoc(reportRef, {
        status: newStatus,
        invoiceNumber,
        invoiceDate,
        dueDate,
        notes: notes || report.notes,
        statusHistory: [...report.statusHistory, historyEntry],
        lastModifiedBy: completedBy,
        updatedAt: serverTimestamp()
      });
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
  export const getBillingReportByAppointment = async (appointmentId: string): Promise<BillingReport | null> => {
    try {
      const q = query(
        collection(db, BILLING_REPORTS_COLLECTION),
        where('appointmentId', '==', appointmentId)
      );
      
      const querySnapshot = await getDocs(q);
      
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
      
      await updateDoc(reportRef, {
        notes,
        internalNotes,
        lastModifiedBy: updatedBy,
        updatedAt: serverTimestamp()
      });
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