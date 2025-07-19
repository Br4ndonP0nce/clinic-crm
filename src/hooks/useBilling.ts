// src/hooks/useBilling.ts - CLEAN APPROACH (No Backward Compatibility)
'use client';
import { useState, useEffect, useCallback } from 'react';
import { 
  BillingReport, 
  BillingPaymentInput,
  Expense, 
  BillingDashboard,
  BillingService,
  BillingPayment,
  // 🆕 NEW: Multiple Reports Support
  BillingReportSummary,
  AppointmentBillingSummary,
  CreateReportOptions,
  DuplicateReportOptions,
  BillingReportType
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
  updateBillingNotes,
  // 🆕 NEW: Multiple Reports Functions
  getBillingReportsByAppointment,
  getAppointmentBillingSummary,
  duplicateBillingReport,
  archiveBillingReport,
  createPartialReport,
  createEmergencyAddonReport,
  createProductSaleReport,
  linkBillingReports
} from '@/lib/firebase/billing';
import { useAuth } from './useAuth';

// =============================================================================
// BILLING REPORTS HOOK (Clean New Approach)
// =============================================================================

interface UseBillingReportsReturn {
  reports: BillingReport[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  
  // Core Actions (New Clean Approach)
  loadReports: (filters?: any, reset?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  refreshReports: () => Promise<void>;
  refresh: () => Promise<void>; // 🆕 ADD: Alias for compatibility
  createReport: (appointmentId: string, options: CreateReportOptions, initialServices?: any[]) => Promise<string>;
  createCompleteVisitReport: (appointmentId: string, title?: string, initialServices?: any[]) => Promise<string>;
  updateServices: (reportId: string, services: BillingService[], discount?: number) => Promise<void>;
  addPayment: (reportId: string, payment: BillingPaymentInput) => Promise<void>;
  completeReport: (reportId: string, notes?: string) => Promise<void>;
  updateNotes: (reportId: string, notes: string, internalNotes: string) => Promise<void>;
  
  // Enhanced Actions
  duplicateReport: (sourceReportId: string, options: DuplicateReportOptions) => Promise<string>;
  archiveReport: (reportId: string, reason?: string) => Promise<void>;
  linkReports: (reportIds: string[], linkType: 'related' | 'consolidated' | 'split', notes?: string) => Promise<void>;
}

export const useBillingReports = (): UseBillingReportsReturn => {
  const { userProfile } = useAuth();
  const [reports, setReports] = useState<BillingReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [currentFilters, setCurrentFilters] = useState<any>({});

  const loadReports = useCallback(async (filters: any = {}, reset: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentFilters(filters);
      
      // If reset is true, clear lastDoc to start fresh
      if (reset) {
        setLastDoc(null);
      }
      
      const result = await getBillingReports({ 
        ...filters, 
        limit: 20,
        lastDoc: reset ? undefined : lastDoc 
      });
      
      if (reset) {
        setReports(result.reports);
      } else {
        setReports(prev => [...prev, ...result.reports]);
      }
      
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('Error loading billing reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to load billing reports');
    } finally {
      setLoading(false);
    }
  }, [lastDoc]);

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
    await loadReports(currentFilters, true); // Use reset=true for refresh
  }, [loadReports, currentFilters]);

  // ✅ CLEAN: Main create report function (requires options)
  const createReport = useCallback(async (
    appointmentId: string,
    options: CreateReportOptions,
    initialServices?: any[]
  ): Promise<string> => {
    if (!userProfile?.uid) throw new Error('User not authenticated');
    
    try {
      const reportId = await createBillingReport(
        appointmentId, 
        userProfile.uid, 
        options,
        initialServices
      );
      await refreshReports();
      return reportId;
    } catch (err) {
      console.error('Error creating billing report:', err);
      throw err;
    }
  }, [userProfile?.uid, refreshReports]);

  // ✅ CLEAN: Convenience function for most common use case
  const createCompleteVisitReport = useCallback(async (
    appointmentId: string,
    title: string = 'Consulta Completa',
    initialServices?: any[]
  ): Promise<string> => {
    return createReport(appointmentId, {
      reportType: 'complete_visit',
      title,
      isPartialReport: false
    }, initialServices);
  }, [createReport]);

  // 🆕 NEW: Duplicate report
  const duplicateReport = useCallback(async (
    sourceReportId: string,
    options: DuplicateReportOptions
  ): Promise<string> => {
    if (!userProfile?.uid) throw new Error('User not authenticated');
    
    try {
      const reportId = await duplicateBillingReport(
        sourceReportId,
        userProfile.uid,
        options
      );
      await refreshReports();
      return reportId;
    } catch (err) {
      console.error('Error duplicating billing report:', err);
      throw err;
    }
  }, [userProfile?.uid, refreshReports]);

  // 🆕 NEW: Archive report
  const archiveReport = useCallback(async (
    reportId: string,
    reason?: string
  ): Promise<void> => {
    if (!userProfile?.uid) throw new Error('User not authenticated');
    
    try {
      await archiveBillingReport(reportId, userProfile.uid, reason);
      await refreshReports();
    } catch (err) {
      console.error('Error archiving billing report:', err);
      throw err;
    }
  }, [userProfile?.uid, refreshReports]);

  // 🆕 NEW: Link reports
  const linkReports = useCallback(async (
    reportIds: string[],
    linkType: 'related' | 'consolidated' | 'split',
    notes?: string
  ): Promise<void> => {
    if (!userProfile?.uid) throw new Error('User not authenticated');
    
    try {
      await linkBillingReports(reportIds, linkType, userProfile.uid, notes);
      await refreshReports();
    } catch (err) {
      console.error('Error linking billing reports:', err);
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
    refresh: refreshReports, // 🆕 ADD: Alias for backward compatibility
    createReport,
    createCompleteVisitReport,
    updateServices,
    addPayment,
    completeReport,
    updateNotes,
    duplicateReport,
    archiveReport,
    linkReports
  };
};

// =============================================================================
// SINGLE BILLING REPORT HOOK (Unchanged)
// =============================================================================

interface UseBillingReportReturn {
  report: BillingReport | null;
  loading: boolean;
  error: string | null;
  
  // Existing Actions
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
// 🆕 NEW: APPOINTMENT BILLING HOOK (Multiple Reports per Appointment)
// =============================================================================

interface UseAppointmentBillingReturn {
  reports: BillingReportSummary[];
  summary: AppointmentBillingSummary | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadAppointmentBilling: (appointmentId: string) => Promise<void>;
  createReport: (appointmentId: string, options: CreateReportOptions, initialServices?: any[]) => Promise<string>;
  createQuickReport: (appointmentId: string, type: 'emergency' | 'product' | 'partial', services?: any[]) => Promise<string>;
  duplicateReport: (sourceReportId: string, options: DuplicateReportOptions) => Promise<string>;
  archiveReport: (reportId: string, reason?: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

export const useAppointmentBilling = (appointmentId?: string): UseAppointmentBillingReturn => {
  const { userProfile } = useAuth();
  const [reports, setReports] = useState<BillingReportSummary[]>([]);
  const [summary, setSummary] = useState<AppointmentBillingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAppointmentId, setCurrentAppointmentId] = useState<string | null>(null);

  const loadAppointmentBilling = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentAppointmentId(id);
      
      const [reportsData, summaryData] = await Promise.all([
        getBillingReportsByAppointment(id),
        getAppointmentBillingSummary(id)
      ]);
      
      setReports(reportsData);
      
      // ✅ FIXED: Create complete AppointmentBillingSummary object
      const completeSummary: AppointmentBillingSummary = {
        appointmentId: id,
        totalReports: summaryData.totalReports,
        totalAmount: summaryData.totalAmount,
        totalPaid: summaryData.totalPaid,
        totalPending: summaryData.totalPending,
        hasCompletedReports: summaryData.hasCompletedReports,
        hasDraftReports: summaryData.hasDraftReports,
        reportTypes: summaryData.reportTypes,
        reports: reportsData // Include the reports array
      };
      
      setSummary(completeSummary);
    } catch (err) {
      console.error('Error loading appointment billing:', err);
      setError(err instanceof Error ? err.message : 'Failed to load appointment billing');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (currentAppointmentId) {
      await loadAppointmentBilling(currentAppointmentId);
    }
  }, [currentAppointmentId, loadAppointmentBilling]);

  const createReport = useCallback(async (
    appointmentId: string,
    options: CreateReportOptions,
    initialServices?: any[]
  ): Promise<string> => {
    if (!userProfile?.uid) throw new Error('User not authenticated');
    
    try {
      const reportId = await createBillingReport(
        appointmentId,
        userProfile.uid,
        options,
        initialServices
      );
      
      await refreshData();
      return reportId;
    } catch (err) {
      console.error('Error creating report:', err);
      throw err;
    }
  }, [userProfile?.uid, refreshData]);

  const createQuickReport = useCallback(async (
    appointmentId: string,
    type: 'emergency' | 'product' | 'partial',
    services?: any[]
  ): Promise<string> => {
    if (!userProfile?.uid) throw new Error('User not authenticated');
    
    try {
      let reportId: string;

      switch (type) {
        case 'emergency':
          reportId = await createEmergencyAddonReport(
            appointmentId,
            services || [],
            userProfile.uid
          );
          break;
        case 'product':
          reportId = await createProductSaleReport(
            appointmentId,
            services || [],
            userProfile.uid
          );
          break;
        case 'partial':
          reportId = await createPartialReport(
            appointmentId,
            'Tratamiento Adicional',
            services || [],
            userProfile.uid
          );
          break;
      }

      await refreshData();
      return reportId;
    } catch (err) {
      console.error('Error creating quick report:', err);
      throw err;
    }
  }, [userProfile?.uid, refreshData]);

  const duplicateReport = useCallback(async (
    sourceReportId: string,
    options: DuplicateReportOptions
  ): Promise<string> => {
    if (!userProfile?.uid) throw new Error('User not authenticated');
    
    try {
      const reportId = await duplicateBillingReport(
        sourceReportId,
        userProfile.uid,
        options
      );
      
      await refreshData();
      return reportId;
    } catch (err) {
      console.error('Error duplicating report:', err);
      throw err;
    }
  }, [userProfile?.uid, refreshData]);

  const archiveReport = useCallback(async (
    reportId: string,
    reason?: string
  ): Promise<void> => {
    if (!userProfile?.uid) throw new Error('User not authenticated');
    
    try {
      await archiveBillingReport(reportId, userProfile.uid, reason);
      await refreshData();
    } catch (err) {
      console.error('Error archiving report:', err);
      throw err;
    }
  }, [userProfile?.uid, refreshData]);

  // Auto-load when appointmentId changes
  useEffect(() => {
    if (appointmentId && appointmentId !== currentAppointmentId) {
      loadAppointmentBilling(appointmentId);
    }
  }, [appointmentId, currentAppointmentId, loadAppointmentBilling]);

  return {
    reports,
    summary,
    loading,
    error,
    loadAppointmentBilling,
    createReport,
    createQuickReport,
    duplicateReport,
    archiveReport,
    refreshData
  };
};

// =============================================================================
// EXPENSES HOOK (Unchanged)
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
// BILLING DASHBOARD HOOK (Unchanged)
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

// =============================================================================
// 🆕 NEW: BILLING STATISTICS HOOK
// =============================================================================

interface UseBillingStatsReturn {
  stats: {
    totalRevenue: number;
    pendingAmount: number;
    reportsCount: number;
    completedReports: number;
    paidReports: number;
    overdueReports: number;
  } | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadStats: (filters?: any) => Promise<void>;
  refreshStats: () => Promise<void>;
}

export const useBillingStats = (): UseBillingStatsReturn => {
  const [stats, setStats] = useState<{
    totalRevenue: number;
    pendingAmount: number;
    reportsCount: number;
    completedReports: number;
    paidReports: number;
    overdueReports: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<any>({});

  const loadStats = useCallback(async (filters: any = {}) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentFilters(filters);
      
      // Load reports and calculate stats
      const { reports } = await getBillingReports({
        ...filters,
        limit: 1000 // Get a large sample for stats
      });
      
      const calculatedStats = {
        totalRevenue: reports.reduce((sum, report) => sum + (report.total || 0), 0),
        pendingAmount: reports.reduce((sum, report) => sum + (report.pendingAmount || 0), 0),
        reportsCount: reports.length,
        completedReports: reports.filter(r => r.status === 'completed' || r.status === 'paid').length,
        paidReports: reports.filter(r => r.status === 'paid').length,
        overdueReports: reports.filter(r => {
          if (!r.dueDate || r.status === 'paid') return false;
          const dueDate = r.dueDate.toDate();
          return dueDate < new Date() && (r.pendingAmount || 0) > 0;
        }).length
      };
      
      setStats(calculatedStats);
    } catch (err) {
      console.error('Error loading billing stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load billing statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshStats = useCallback(async () => {
    await loadStats(currentFilters);
  }, [loadStats, currentFilters]);

  return {
    stats,
    loading,
    error,
    loadStats,
    refreshStats
  };
};