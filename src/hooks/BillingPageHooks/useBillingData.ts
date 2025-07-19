import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { BillingReport, Expense } from '@/types/billing';
import {
  useBillingReports,
  useBillingDashboard,
  useExpenses,
} from '@/hooks/useBilling';
import { DateFilter } from './useBillingFilters';

interface UseBillingDataProps {
  canViewBilling: boolean;
  dateFilter: DateFilter;
}

export const useBillingData = ({ canViewBilling, dateFilter }: UseBillingDataProps) => {
  // Prevent infinite loops with refs
  const lastFilterRef = useRef<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Core hooks
  const {
    reports,
    loading: reportsLoading,
    error: reportsError,
    loadReports,
    refreshReports,
  } = useBillingReports();

  const {
    expenses,
    loading: expensesLoading,
    error: expensesError,
    loadExpenses,
    addExpense,
    refreshExpenses,
  } = useExpenses();

  const {
    dashboard,
    revenueSummary,
    loading: dashboardLoading,
    loadDashboard,
    loadRevenueSummary,
    refreshDashboard,
  } = useBillingDashboard();

  // Create stable filter key to prevent infinite loops
  const filterKey = useMemo(() => {
    return `${dateFilter.key}-${dateFilter.start.getTime()}-${dateFilter.end.getTime()}`;
  }, [dateFilter.key, dateFilter.start, dateFilter.end]);

  // Load data when filters change (with loop prevention)
  useEffect(() => {
    if (canViewBilling && filterKey !== lastFilterRef.current) {
      lastFilterRef.current = filterKey;
      
      const loadData = async () => {
        try {
          await Promise.all([
            loadReports({
              startDate: dateFilter.start,
              endDate: dateFilter.end,
              limit: 100,
            }, true), // Use reset=true to avoid accumulating old data
            loadExpenses({
              startDate: dateFilter.start,
              endDate: dateFilter.end,
              limit: 100,
            }),
            loadDashboard(dateFilter.start, dateFilter.end),
            loadRevenueSummary(),
          ]);
          
          if (!isInitialized) {
            setIsInitialized(true);
          }
        } catch (error) {
          console.error('Error loading billing data:', error);
        }
      };

      loadData();
    }
  }, [canViewBilling, filterKey]); // Simplified dependencies

  // Stable refresh function
  const refreshAll = useCallback(() => {
    if (canViewBilling) {
      Promise.all([
        refreshReports(),
        refreshExpenses(),
        refreshDashboard(),
      ]).catch(error => {
        console.error('Error refreshing data:', error);
      });
    }
  }, [canViewBilling, refreshReports, refreshExpenses, refreshDashboard]);

  // Memoized filtered data functions to prevent unnecessary recalculations
  const getFilteredReports = useCallback((statusFilter: string, typeFilter: string) => {
    // Deduplicate reports by ID to prevent duplicate key errors
    const uniqueReports = reports.reduce((acc, report) => {
      if (report.id && !acc.find(r => r.id === report.id)) {
        acc.push(report);
      }
      return acc;
    }, [] as BillingReport[]);

    let filtered = uniqueReports;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(report => 
        (report.reportType || 'complete_visit') === typeFilter
      );
    }
    
    return filtered;
  }, [reports]);

  const getFilteredExpenses = useCallback((statusFilter: string) => {
    // Deduplicate expenses by ID
    const uniqueExpenses = expenses.reduce((acc, expense) => {
      if (expense.id && !acc.find(e => e.id === expense.id)) {
        acc.push(expense);
      }
      return acc;
    }, [] as Expense[]);

    if (statusFilter === 'all') return uniqueExpenses;
    return uniqueExpenses.filter(expense => expense.status === statusFilter);
  }, [expenses]);

  // Legacy filtered data functions for backward compatibility
  const filteredReports = useCallback((statusFilter: string, typeFilter: string) => {
    return getFilteredReports(statusFilter, typeFilter);
  }, [getFilteredReports]);

  const filteredExpenses = useCallback((statusFilter: string) => {
    return getFilteredExpenses(statusFilter);
  }, [getFilteredExpenses]);

  // Memoized loading state
  const isLoading = useMemo(() => {
    return reportsLoading || expensesLoading || dashboardLoading;
  }, [reportsLoading, expensesLoading, dashboardLoading]);

  return {
    // Data (memoized to prevent unnecessary re-renders)
    reports: useMemo(() => reports, [reports]),
    expenses: useMemo(() => expenses, [expenses]),
    dashboard: useMemo(() => dashboard, [dashboard]),
    revenueSummary: useMemo(() => revenueSummary, [revenueSummary]),
    
    // Loading states
    loading: isLoading,
    reportsLoading,
    expensesLoading,
    dashboardLoading,
    isInitialized,
    
    // Error states
    reportsError,
    expensesError,
    
    // Actions (stable references)
    addExpense: useCallback(addExpense, [addExpense]),
    refreshAll,
    refreshReports: useCallback(refreshReports, [refreshReports]),
    refreshExpenses: useCallback(refreshExpenses, [refreshExpenses]),
    refreshDashboard: useCallback(refreshDashboard, [refreshDashboard]),
    
    // New filtered data functions (stable references)
    getFilteredReports,
    getFilteredExpenses,
    
    // Legacy filtered data functions for backward compatibility
    filteredReports,
    filteredExpenses,
  };
};
