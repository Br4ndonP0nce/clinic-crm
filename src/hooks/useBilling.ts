// src/hooks/useBilling.ts
'use client';
import { useState, useEffect, useCallback } from 'react';
import { 
  BillingReport, 
  BillingPaymentInput,
  Expense, 
  BillingDashboard,
  BillingService,
  BillingPayment
} from '@/types/billing';
import {
  getBillingReports,
  getBillingReport,
  createBillingReport,
  updateBillingServices,
  addPaymentToBilling,
  completeBillingReport,
  getBillingReportByAppointment,
  addExpense,
  getExpenses,
  updateExpenseStatus,
  getBillingDashboard,
  getRevenueSummary,
  updateBillingNotes
} from '@/lib/firebase/billing';
import { useAuth } from './useAuth';

// =============================================================================
// BILLING REPORTS HOOK
// =============================================================================

interface UseBillingReportsReturn {
  reports: BillingReport[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  
  // Actions
  loadReports: (filters?: any) => Promise<void>;
  loadMore: () => Promise<void>;
  refreshReports: () => Promise<void>;
  createReport: (appointmentId: string, initialServices?: any[]) => Promise<string>;
  updateServices: (reportId: string, services: BillingService[], discount?: number) => Promise<void>;
  addPayment: (reportId: string, payment: BillingPaymentInput) => Promise<void>;
  completeReport: (reportId: string, notes?: string) => Promise<void>;
  updateNotes: (reportId: string, notes: string, internalNotes: string) => Promise<void>;
}

export const useBillingReports = (): UseBillingReportsReturn => {
  const { userProfile } = useAuth();
  const [reports, setReports] = useState<BillingReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [currentFilters, setCurrentFilters] = useState<any>({});

  const loadReports = useCallback(async (filters: any = {}) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentFilters(filters);
      
      const result = await getBillingReports({ ...filters, limit: 20 });
      setReports(result.reports);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('Error loading billing reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to load billing reports');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading || !lastDoc) return;

    try {
      setLoading(true);
      const result = await getBillingReports({ 
        ...currentFilters, 
        limit: 20, 
        lastDoc 
      });
      
      setReports(prev => [...prev, ...result.reports]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('Error loading more reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to load more reports');
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, lastDoc, currentFilters]);

  const refreshReports = useCallback(async () => {
    await loadReports(currentFilters);
  }, [loadReports, currentFilters]);

  const createReport = useCallback(async (
    appointmentId: string, 
    initialServices?: any[]
  ): Promise<string> => {
    if (!userProfile?.uid) throw new Error('User not authenticated');
    
    try {
      const reportId = await createBillingReport(appointmentId, userProfile.uid, initialServices);
      await refreshReports();
      return reportId;
    } catch (err) {
      console.error('Error creating billing report:', err);
      throw err;
    }
  }, [userProfile?.uid, refreshReports]);

  const updateServices = useCallback(async (
    reportId: string, 
    services: BillingService[], 
    discount: number = 0
  ): Promise<void> => {
    if (!userProfile?.uid) throw new Error('User not authenticated');
    
    try {
      await updateBillingServices(reportId, services, discount, userProfile.uid);
      await refreshReports();
    } catch (err) {
      console.error('Error updating services:', err);
      throw err;
    }
  }, [userProfile?.uid, refreshReports]);

  const addPayment = useCallback(async (
    reportId: string, 
    payment: BillingPaymentInput
  ): Promise<void> => {
    if (!userProfile?.uid) throw new Error('User not authenticated');
    
    try {
      await addPaymentToBilling(reportId, payment, userProfile.uid);
      await refreshReports();
    } catch (err) {
      console.error('Error adding payment:', err);
      throw err;
    }
  }, [userProfile?.uid, refreshReports]);

  const completeReport = useCallback(async (reportId: string, notes?: string): Promise<void> => {
    if (!userProfile?.uid) throw new Error('User not authenticated');
    
    try {
      await completeBillingReport(reportId, userProfile.uid, notes);
      await refreshReports();
    } catch (err) {
      console.error('Error completing report:', err);
      throw err;
    }
  }, [userProfile?.uid, refreshReports]);

  const updateNotes = useCallback(async (
    reportId: string, 
    notes: string, 
    internalNotes: string
  ): Promise<void> => {
    if (!userProfile?.uid) throw new Error('User not authenticated');
    
    try {
      await updateBillingNotes(reportId, notes, internalNotes, userProfile.uid);
      await refreshReports();
    } catch (err) {
      console.error('Error updating notes:', err);
      throw err;
    }
  }, [userProfile?.uid, refreshReports]);

  return {
    reports,
    loading,
    error,
    hasMore,
    loadReports,
    loadMore,
    refreshReports,
    createReport,
    updateServices,
    addPayment,
    completeReport,
    updateNotes
  };
};

// =============================================================================
// SINGLE BILLING REPORT HOOK
// =============================================================================

interface UseBillingReportReturn {
  report: BillingReport | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadReport: (reportId: string) => Promise<void>;
  loadReportByAppointment: (appointmentId: string) => Promise<void>;
  updateServices: (services: BillingService[], discount?: number) => Promise<void>;
  addPayment: (payment: BillingPaymentInput) => Promise<void>;
  completeReport: (notes?: string) => Promise<void>;
  updateNotes: (notes: string, internalNotes: string) => Promise<void>;
  refreshReport: () => Promise<void>;
}

export const useBillingReport = (reportId?: string): UseBillingReportReturn => {
  const { userProfile } = useAuth();
  const [report, setReport] = useState<BillingReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);

  const loadReport = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentReportId(id);
      
      const reportData = await getBillingReport(id);
      setReport(reportData);
    } catch (err) {
      console.error('Error loading billing report:', err);
      setError(err instanceof Error ? err.message : 'Failed to load billing report');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReportByAppointment = useCallback(async (appointmentId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const reportData = await getBillingReportByAppointment(appointmentId);
      setReport(reportData);
      if (reportData) {
        setCurrentReportId(reportData.id!);
      }
    } catch (err) {
      console.error('Error loading billing report by appointment:', err);
      setError(err instanceof Error ? err.message : 'Failed to load billing report');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshReport = useCallback(async () => {
    if (currentReportId) {
      await loadReport(currentReportId);
    }
  }, [currentReportId, loadReport]);

  const updateServices = useCallback(async (
    services: BillingService[], 
    discount: number = 0
  ): Promise<void> => {
    if (!userProfile?.uid || !currentReportId) throw new Error('User not authenticated or no report selected');
    
    try {
      await updateBillingServices(currentReportId, services, discount, userProfile.uid);
      await refreshReport();
    } catch (err) {
      console.error('Error updating services:', err);
      throw err;
    }
  }, [userProfile?.uid, currentReportId, refreshReport]);

  const addPayment = useCallback(async (
    payment: BillingPaymentInput
  ): Promise<void> => {
    if (!userProfile?.uid || !currentReportId) throw new Error('User not authenticated or no report selected');
    
    try {
      await addPaymentToBilling(currentReportId, payment, userProfile.uid);
      await refreshReport();
    } catch (err) {
      console.error('Error adding payment:', err);
      throw err;
    }
  }, [userProfile?.uid, currentReportId, refreshReport]);

  const completeReport = useCallback(async (notes?: string): Promise<void> => {
    if (!userProfile?.uid || !currentReportId) throw new Error('User not authenticated or no report selected');
    
    try {
      await completeBillingReport(currentReportId, userProfile.uid, notes);
      await refreshReport();
    } catch (err) {
      console.error('Error completing report:', err);
      throw err;
    }
  }, [userProfile?.uid, currentReportId, refreshReport]);

  const updateNotes = useCallback(async (
    notes: string, 
    internalNotes: string
  ): Promise<void> => {
    if (!userProfile?.uid || !currentReportId) throw new Error('User not authenticated or no report selected');
    
    try {
      await updateBillingNotes(currentReportId, notes, internalNotes, userProfile.uid);
      await refreshReport();
    } catch (err) {
      console.error('Error updating notes:', err);
      throw err;
    }
  }, [userProfile?.uid, currentReportId, refreshReport]);

  // Auto-load report when reportId changes
  useEffect(() => {
    if (reportId && reportId !== currentReportId) {
      loadReport(reportId);
    }
  }, [reportId, currentReportId, loadReport]);

  return {
    report,
    loading,
    error,
    loadReport,
    loadReportByAppointment,
    updateServices,
    addPayment,
    completeReport,
    updateNotes,
    refreshReport
  };
};

// =============================================================================
// EXPENSES HOOK
// =============================================================================

interface UseExpensesReturn {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  
  // Actions
  loadExpenses: (filters?: any) => Promise<void>;
  addExpense: (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<void>;
  updateStatus: (expenseId: string, status: Expense['status'], notes?: string) => Promise<void>;
  refreshExpenses: () => Promise<void>;
}

export const useExpenses = (): UseExpensesReturn => {
  const { userProfile } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<any>({});

  const loadExpenses = useCallback(async (filters: any = {}) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentFilters(filters);
      
      const expenseData = await getExpenses(filters);
      setExpenses(expenseData);
    } catch (err) {
      console.error('Error loading expenses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshExpenses = useCallback(async () => {
    await loadExpenses(currentFilters);
  }, [loadExpenses, currentFilters]);

  const addExpenseAction = useCallback(async (
    expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<void> => {
    if (!userProfile?.uid) throw new Error('User not authenticated');
    
    try {
      await addExpense(expenseData, userProfile.uid);
      await refreshExpenses();
    } catch (err) {
      console.error('Error adding expense:', err);
      throw err;
    }
  }, [userProfile?.uid, refreshExpenses]);

  const updateStatus = useCallback(async (
    expenseId: string, 
    status: Expense['status'], 
    notes?: string
  ): Promise<void> => {
    if (!userProfile?.uid) throw new Error('User not authenticated');
    
    try {
      await updateExpenseStatus(expenseId, status, userProfile.uid, notes);
      await refreshExpenses();
    } catch (err) {
      console.error('Error updating expense status:', err);
      throw err;
    }
  }, [userProfile?.uid, refreshExpenses]);

  return {
    expenses,
    loading,
    error,
    loadExpenses,
    addExpense: addExpenseAction,
    updateStatus,
    refreshExpenses
  };
};

// =============================================================================
// BILLING DASHBOARD HOOK
// =============================================================================

interface UseBillingDashboardReturn {
  dashboard: BillingDashboard | null;
  revenueSummary: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
  } | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadDashboard: (startDate: Date, endDate: Date, doctorId?: string) => Promise<void>;
  loadRevenueSummary: (doctorId?: string) => Promise<void>;
  refreshDashboard: () => Promise<void>;
}

export const useBillingDashboard = (): UseBillingDashboardReturn => {
  const [dashboard, setDashboard] = useState<BillingDashboard | null>(null);
  const [revenueSummary, setRevenueSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentParams, setCurrentParams] = useState<{
    startDate: Date;
    endDate: Date;
    doctorId?: string;
  } | null>(null);

  const loadDashboard = useCallback(async (
    startDate: Date, 
    endDate: Date, 
    doctorId?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentParams({ startDate, endDate, doctorId });
      
      const dashboardData = await getBillingDashboard(startDate, endDate, doctorId);
      setDashboard(dashboardData);
    } catch (err) {
      console.error('Error loading billing dashboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRevenueSummary = useCallback(async (doctorId?: string) => {
    try {
      const summary = await getRevenueSummary(doctorId);
      setRevenueSummary(summary);
    } catch (err) {
      console.error('Error loading revenue summary:', err);
      // Don't set error for summary as it's supplementary data
    }
  }, []);

  const refreshDashboard = useCallback(async () => {
    if (currentParams) {
      await loadDashboard(currentParams.startDate, currentParams.endDate, currentParams.doctorId);
    }
  }, [currentParams, loadDashboard]);

  return {
    dashboard,
    revenueSummary,
    loading,
    error,
    loadDashboard,
    loadRevenueSummary,
    refreshDashboard
  };
};