// src/lib/utils/billingExcelExport.ts
import * as XLSX from 'xlsx';
import { 
  BillingReport, 
  Expense, 
  BillingDashboard,
  getBillingStatusLabel,
  getServiceCategoryLabel,
  getExpenseCategoryLabel
} from '@/types/billing';
import { getPaymentMethodLabel } from '@/types/sales';

// =============================================================================
// BILLING REPORTS EXCEL EXPORT
// =============================================================================

/**
 * Export billing reports to Excel
 */
export const exportBillingReportsToExcel = async (
  reports: BillingReport[],
  patientData?: Record<string, any>, // Patient lookup by ID
  doctorData?: Record<string, any>,  // Doctor lookup by ID
  filename?: string
): Promise<void> => {
  try {
    console.log('Preparing billing reports export data...');

    // Prepare main reports data
    const reportsData = reports.map((report) => {
      const patient = patientData?.[report.patientId];
      const doctor = doctorData?.[report.doctorId];

      // Format services
      const servicesText = report.services
        .map(service => `${service.description} (${service.quantity}x ${service.unitPrice.toFixed(2)})`)
        .join('; ');

      // Format payments
      const paymentsText = report.payments
        .map(payment => `${payment.amount.toFixed(2)} via ${getPaymentMethodLabel(payment.method)}`)
        .join('; ');

      return {
        'ID Reporte': report.id || '',
        'Número de Factura': report.invoiceNumber || 'Sin generar',
        'Estado': getBillingStatusLabel(report.status),
        'Fecha de Creación': formatDateForExcel(report.createdAt),
        'Fecha de Factura': report.invoiceDate ? formatDateForExcel(report.invoiceDate) : 'N/A',
        'Fecha de Vencimiento': report.dueDate ? formatDateForExcel(report.dueDate) : 'N/A',
        
        // Patient information
        'Paciente': patient?.fullName || 'Desconocido',
        'Email Paciente': patient?.email || '',
        'Teléfono Paciente': patient?.phone || '',
        
        // Doctor information
        'Doctor': doctor?.displayName || doctor?.email || 'Desconocido',
        
        // Financial details
        'Subtotal': report.subtotal,
        'IVA': report.tax,
        'Descuento': report.discount,
        'Total': report.total,
        'Pagado': report.paidAmount,
        'Pendiente': report.pendingAmount,
        
        // Services and payments
        'Servicios': servicesText,
        'Métodos de Pago': paymentsText,
        
        // Additional information
        'Notas': report.notes || '',
        'Notas Internas': report.internalNotes || '',
        'PDF Generado': report.pdfGenerated ? 'Sí' : 'No',
        
        // System fields
        'Creado Por': report.createdBy,
        'Última Modificación': formatDateForExcel(report.updatedAt),
        'Modificado Por': report.lastModifiedBy
      };
    });

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Main reports sheet
    const reportsWs = XLSX.utils.json_to_sheet(reportsData);
    setColumnWidths(reportsWs, [
      { wch: 15 }, // ID Reporte
      { wch: 20 }, // Número de Factura
      { wch: 15 }, // Estado
      { wch: 18 }, // Fecha de Creación
      { wch: 18 }, // Fecha de Factura
      { wch: 18 }, // Fecha de Vencimiento
      { wch: 25 }, // Paciente
      { wch: 25 }, // Email Paciente
      { wch: 15 }, // Teléfono Paciente
      { wch: 20 }, // Doctor
      { wch: 12 }, // Subtotal
      { wch: 12 }, // IVA
      { wch: 12 }, // Descuento
      { wch: 12 }, // Total
      { wch: 12 }, // Pagado
      { wch: 12 }, // Pendiente
      { wch: 50 }, // Servicios
      { wch: 30 }, // Métodos de Pago
      { wch: 40 }, // Notas
      { wch: 40 }, // Notas Internas
      { wch: 12 }, // PDF Generado
      { wch: 15 }, // Creado Por
      { wch: 18 }, // Última Modificación
      { wch: 15 }  // Modificado Por
    ]);
    XLSX.utils.book_append_sheet(wb, reportsWs, 'Reportes de Facturación');

    // Summary sheet
    const summaryData = createBillingSummaryData(reports);
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    setColumnWidths(summaryWs, [{ wch: 30 }, { wch: 15 }]);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen');

    // Services breakdown sheet
    const servicesBreakdownData = createServicesBreakdownData(reports);
    const servicesWs = XLSX.utils.json_to_sheet(servicesBreakdownData);
    setColumnWidths(servicesWs, [
      { wch: 25 }, // Servicio
      { wch: 15 }, // Categoría
      { wch: 12 }, // Cantidad
      { wch: 15 }, // Precio Promedio
      { wch: 15 }, // Ingresos Totales
      { wch: 12 }  // % del Total
    ]);
    XLSX.utils.book_append_sheet(wb, servicesWs, 'Servicios Detallados');

    // Payments breakdown sheet
    const paymentsBreakdownData = createPaymentsBreakdownData(reports);
    const paymentsWs = XLSX.utils.json_to_sheet(paymentsBreakdownData);
    setColumnWidths(paymentsWs, [
      { wch: 20 }, // Método de Pago
      { wch: 12 }, // Cantidad
      { wch: 15 }, // Monto Total
      { wch: 12 }  // % del Total
    ]);
    XLSX.utils.book_append_sheet(wb, paymentsWs, 'Métodos de Pago');

    // Generate filename
    const defaultFilename = `reportes_facturacion_${new Date().toISOString().slice(0, 10)}.xlsx`;
    const finalFilename = filename || defaultFilename;

    // Save file
    XLSX.writeFile(wb, finalFilename);
    
    console.log('Billing reports export completed successfully!');
  } catch (error) {
    console.error('Error exporting billing reports to Excel:', error);
    throw error;
  }
};

// =============================================================================
// EXPENSES EXCEL EXPORT
// =============================================================================

/**
 * Export expenses to Excel
 */
export const exportExpensesToExcel = async (
  expenses: Expense[],
  userData?: Record<string, any>, // User lookup by ID
  filename?: string
): Promise<void> => {
  try {
    console.log('Preparing expenses export data...');

    // Prepare expenses data
    const expensesData = expenses.map((expense) => {
      const submitter = userData?.[expense.submittedBy];
      const approver = expense.approvedBy ? userData?.[expense.approvedBy] : null;

      return {
        'ID Gasto': expense.id || '',
        'Fecha': formatDateForExcel(expense.date),
        'Descripción': expense.description,
        'Categoría': getExpenseCategoryLabel(expense.category),
        'Monto': expense.amount,
        'Proveedor': expense.vendor || '',
        'Estado': getExpenseStatusLabel(expense.status),
        'Deducible': expense.deductible ? 'Sí' : 'No',
        'Monto IVA': expense.taxAmount || 0,
        'Número de Recibo': expense.receiptNumber || '',
        'URL Recibo': expense.receiptUrl || '',
        'Enviado Por': submitter?.displayName || submitter?.email || 'Desconocido',
        'Aprobado Por': approver?.displayName || approver?.email || 'N/A',
        'Fecha de Aprobación': expense.approvedAt ? formatDateForExcel(expense.approvedAt) : 'N/A',
        'Fecha de Creación': formatDateForExcel(expense.createdAt),
        'Última Actualización': formatDateForExcel(expense.updatedAt),
        'Notas': expense.notes || ''
      };
    });

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Main expenses sheet
    const expensesWs = XLSX.utils.json_to_sheet(expensesData);
    setColumnWidths(expensesWs, [
      { wch: 15 }, // ID Gasto
      { wch: 12 }, // Fecha
      { wch: 30 }, // Descripción
      { wch: 20 }, // Categoría
      { wch: 12 }, // Monto
      { wch: 20 }, // Proveedor
      { wch: 12 }, // Estado
      { wch: 10 }, // Deducible
      { wch: 12 }, // Monto IVA
      { wch: 15 }, // Número de Recibo
      { wch: 30 }, // URL Recibo
      { wch: 20 }, // Enviado Por
      { wch: 20 }, // Aprobado Por
      { wch: 18 }, // Fecha de Aprobación
      { wch: 18 }, // Fecha de Creación
      { wch: 18 }, // Última Actualización
      { wch: 40 }  // Notas
    ]);
    XLSX.utils.book_append_sheet(wb, expensesWs, 'Gastos');

    // Summary sheet
    const expensesSummaryData = createExpensesSummaryData(expenses);
    const expensesSummaryWs = XLSX.utils.json_to_sheet(expensesSummaryData);
    setColumnWidths(expensesSummaryWs, [{ wch: 25 }, { wch: 15 }]);
    XLSX.utils.book_append_sheet(wb, expensesSummaryWs, 'Resumen Gastos');

    // Category breakdown sheet
    const categoryBreakdownData = createExpensesCategoryBreakdownData(expenses);
    const categoryWs = XLSX.utils.json_to_sheet(categoryBreakdownData);
    setColumnWidths(categoryWs, [
      { wch: 25 }, // Categoría
      { wch: 12 }, // Cantidad
      { wch: 15 }, // Monto Total
      { wch: 15 }, // Promedio
      { wch: 12 }  // % del Total
    ]);
    XLSX.utils.book_append_sheet(wb, categoryWs, 'Por Categoría');

    // Generate filename
    const defaultFilename = `gastos_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    const finalFilename = filename || defaultFilename;

    // Save file
    XLSX.writeFile(wb, finalFilename);
    
    console.log('Expenses export completed successfully!');
  } catch (error) {
    console.error('Error exporting expenses to Excel:', error);
    throw error;
  }
};

// =============================================================================
// FINANCIAL DASHBOARD EXCEL EXPORT
// =============================================================================

/**
 * Export complete financial dashboard to Excel
 */
export const exportFinancialDashboardToExcel = async (
  dashboard: BillingDashboard,
  reports: BillingReport[],
  expenses: Expense[],
  filename?: string
): Promise<void> => {
  try {
    console.log('Preparing financial dashboard export...');

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Dashboard summary sheet
    const dashboardData = [
      { 'Métrica': 'RESUMEN FINANCIERO', 'Valor': '' },
      { 'Métrica': 'Período', 'Valor': `${formatDateForExcel(dashboard.period.start)} - ${formatDateForExcel(dashboard.period.end)}` },
      { 'Métrica': '', 'Valor': '' },
      
      { 'Métrica': 'INGRESOS', 'Valor': '' },
      { 'Métrica': 'Ingresos Totales', 'Valor': `${dashboard.totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
      { 'Métrica': 'Ingresos Pagados', 'Valor': `${dashboard.paidRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
      { 'Métrica': 'Ingresos Pendientes', 'Valor': `${dashboard.pendingRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
      { 'Métrica': 'Ingresos Vencidos', 'Valor': `${dashboard.overdueRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
      { 'Métrica': '', 'Valor': '' },
      
      { 'Métrica': 'GASTOS', 'Valor': '' },
      { 'Métrica': 'Gastos Totales', 'Valor': `${dashboard.totalExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
      { 'Métrica': 'Gastos Aprobados', 'Valor': `${dashboard.approvedExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
      { 'Métrica': 'Gastos Pendientes', 'Valor': `${dashboard.pendingExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
      { 'Métrica': '', 'Valor': '' },
      
      { 'Métrica': 'MÉTRICAS CALCULADAS', 'Valor': '' },
      { 'Métrica': 'Ingresos Netos', 'Valor': `${dashboard.netIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
      { 'Métrica': 'Margen Bruto', 'Valor': `${dashboard.grossMargin.toFixed(1)}%` },
      { 'Métrica': '', 'Valor': '' },
      
      { 'Métrica': 'REPORTES', 'Valor': '' },
      { 'Métrica': 'Total de Reportes', 'Valor': dashboard.totalReports },
      { 'Métrica': 'Reportes Completados', 'Valor': dashboard.completedReports },
      { 'Métrica': 'Reportes en Borrador', 'Valor': dashboard.draftReports },
      { 'Métrica': 'Reportes Vencidos', 'Valor': dashboard.overdueReports }
    ];

    const dashboardWs = XLSX.utils.json_to_sheet(dashboardData);
    setColumnWidths(dashboardWs, [{ wch: 25 }, { wch: 20 }]);
    XLSX.utils.book_append_sheet(wb, dashboardWs, 'Dashboard');

    // Monthly trends sheet
    if (dashboard.monthlyTrends.length > 0) {
      const trendsData = dashboard.monthlyTrends.map(trend => ({
        'Mes': trend.month,
        'Ingresos': trend.revenue,
        'Gastos': trend.expenses,
        'Ingresos Netos': trend.netIncome,
        'Número de Reportes': trend.reportCount
      }));

      const trendsWs = XLSX.utils.json_to_sheet(trendsData);
      setColumnWidths(trendsWs, [
        { wch: 12 }, // Mes
        { wch: 15 }, // Ingresos
        { wch: 15 }, // Gastos
        { wch: 15 }, // Ingresos Netos
        { wch: 18 }  // Número de Reportes
      ]);
      XLSX.utils.book_append_sheet(wb, trendsWs, 'Tendencias Mensuales');
    }

    // Payment methods breakdown
    if (dashboard.paymentMethodBreakdown.length > 0) {
      const paymentMethodsData = dashboard.paymentMethodBreakdown.map(breakdown => ({
        'Método de Pago': getPaymentMethodLabel(breakdown.method),
        'Cantidad': breakdown.count,
        'Monto Total': breakdown.amount,
        'Porcentaje': `${breakdown.percentage.toFixed(1)}%`
      }));

      const paymentMethodsWs = XLSX.utils.json_to_sheet(paymentMethodsData);
      setColumnWidths(paymentMethodsWs, [
        { wch: 20 }, // Método de Pago
        { wch: 12 }, // Cantidad
        { wch: 15 }, // Monto Total
        { wch: 12 }  // Porcentaje
      ]);
      XLSX.utils.book_append_sheet(wb, paymentMethodsWs, 'Métodos de Pago');
    }

    // Service categories breakdown
    if (dashboard.serviceCategoryBreakdown.length > 0) {
      const serviceCategoriesData = dashboard.serviceCategoryBreakdown.map(breakdown => ({
        'Categoría de Servicio': getServiceCategoryLabel(breakdown.category),
        'Cantidad': breakdown.count,
        'Ingresos': breakdown.revenue,
        'Precio Promedio': breakdown.averagePrice
      }));

      const serviceCategoriesWs = XLSX.utils.json_to_sheet(serviceCategoriesData);
      setColumnWidths(serviceCategoriesWs, [
        { wch: 25 }, // Categoría de Servicio
        { wch: 12 }, // Cantidad
        { wch: 15 }, // Ingresos
        { wch: 15 }  // Precio Promedio
      ]);
      XLSX.utils.book_append_sheet(wb, serviceCategoriesWs, 'Categorías de Servicios');
    }

    // Generate filename
    const defaultFilename = `dashboard_financiero_${new Date().toISOString().slice(0, 10)}.xlsx`;
    const finalFilename = filename || defaultFilename;

    // Save file
    XLSX.writeFile(wb, finalFilename);
    
    console.log('Financial dashboard export completed successfully!');
  } catch (error) {
    console.error('Error exporting financial dashboard to Excel:', error);
    throw error;
  }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const setColumnWidths = (worksheet: XLSX.WorkSheet, widths: Array<{ wch: number }>) => {
  worksheet['!cols'] = widths;
};

const formatDateForExcel = (date: any): string => {
  if (!date) return 'N/A';
  
  let jsDate: Date;
  if (typeof date === 'object' && date !== null && 'toDate' in date) {
    jsDate = date.toDate();
  } else if (date instanceof Date) {
    jsDate = date;
  } else {
    jsDate = new Date(date);
  }
  
  if (isNaN(jsDate.getTime())) return 'Invalid Date';
  
  return jsDate.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

const getExpenseStatusLabel = (status: Expense['status']): string => {
  const labels: Record<Expense['status'], string> = {
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    paid: 'Pagado'
  };
  return labels[status] || status;
};

// =============================================================================
// SUMMARY DATA CREATORS
// =============================================================================

const createBillingSummaryData = (reports: BillingReport[]) => {
  const total = reports.length;
  const draftCount = reports.filter(r => r.status === 'draft').length;
  const completedCount = reports.filter(r => r.status === 'completed').length;
  const paidCount = reports.filter(r => r.status === 'paid').length;
  const partiallyPaidCount = reports.filter(r => r.status === 'partially_paid').length;
  const overdueCount = reports.filter(r => r.status === 'overdue').length;
  const cancelledCount = reports.filter(r => r.status === 'cancelled').length;

  const totalRevenue = reports.reduce((sum, r) => sum + r.total, 0);
  const paidRevenue = reports.reduce((sum, r) => sum + r.paidAmount, 0);
  const pendingRevenue = reports.reduce((sum, r) => sum + r.pendingAmount, 0);

  return [
    { 'Métrica': 'ESTADÍSTICAS GENERALES', 'Valor': '' },
    { 'Métrica': 'Total de Reportes', 'Valor': total },
    { 'Métrica': '', 'Valor': '' },
    
    { 'Métrica': 'DISTRIBUCIÓN POR ESTADO', 'Valor': '' },
    { 'Métrica': 'Borradores', 'Valor': draftCount },
    { 'Métrica': 'Completados', 'Valor': completedCount },
    { 'Métrica': 'Pagados', 'Valor': paidCount },
    { 'Métrica': 'Pago Parcial', 'Valor': partiallyPaidCount },
    { 'Métrica': 'Vencidos', 'Valor': overdueCount },
    { 'Métrica': 'Cancelados', 'Valor': cancelledCount },
    { 'Métrica': '', 'Valor': '' },
    
    { 'Métrica': 'FINANCIEROS', 'Valor': '' },
    { 'Métrica': 'Ingresos Totales', 'Valor': `${totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
    { 'Métrica': 'Ingresos Pagados', 'Valor': `${paidRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
    { 'Métrica': 'Ingresos Pendientes', 'Valor': `${pendingRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
    { 'Métrica': '% Pagado', 'Valor': `${totalRevenue > 0 ? ((paidRevenue / totalRevenue) * 100).toFixed(1) : 0}%` }
  ];
};

const createServicesBreakdownData = (reports: BillingReport[]) => {
  const servicesMap = new Map<string, { count: number; revenue: number; category: string }>();
  
  reports.forEach(report => {
    report.services.forEach(service => {
      const current = servicesMap.get(service.description) || { count: 0, revenue: 0, category: service.category };
      servicesMap.set(service.description, {
        count: current.count + service.quantity,
        revenue: current.revenue + service.total,
        category: service.category
      });
    });
  });

  const totalRevenue = Array.from(servicesMap.values()).reduce((sum, data) => sum + data.revenue, 0);

  return Array.from(servicesMap.entries()).map(([service, data]) => ({
    'Servicio': service,
    'Categoría': getServiceCategoryLabel(data.category as any),
    'Cantidad': data.count,
    'Precio Promedio': `${(data.revenue / data.count).toFixed(2)}`,
    'Ingresos Totales': `${data.revenue.toFixed(2)}`,
    '% del Total': `${totalRevenue > 0 ? ((data.revenue / totalRevenue) * 100).toFixed(1) : 0}%`
  }));
};

const createPaymentsBreakdownData = (reports: BillingReport[]) => {
  const paymentsMap = new Map<string, { count: number; amount: number }>();
  
  reports.forEach(report => {
    report.payments.forEach(payment => {
      const current = paymentsMap.get(payment.method) || { count: 0, amount: 0 };
      paymentsMap.set(payment.method, {
        count: current.count + 1,
        amount: current.amount + payment.amount
      });
    });
  });

  const totalAmount = Array.from(paymentsMap.values()).reduce((sum, data) => sum + data.amount, 0);

  return Array.from(paymentsMap.entries()).map(([method, data]) => ({
    'Método de Pago': getPaymentMethodLabel(method as any),
    'Cantidad': data.count,
    'Monto Total': `${data.amount.toFixed(2)}`,
    '% del Total': `${totalAmount > 0 ? ((data.amount / totalAmount) * 100).toFixed(1) : 0}%`
  }));
};

const createExpensesSummaryData = (expenses: Expense[]) => {
  const total = expenses.length;
  const pendingCount = expenses.filter(e => e.status === 'pending').length;
  const approvedCount = expenses.filter(e => e.status === 'approved').length;
  const rejectedCount = expenses.filter(e => e.status === 'rejected').length;
  const paidCount = expenses.filter(e => e.status === 'paid').length;

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const approvedAmount = expenses.filter(e => e.status === 'approved' || e.status === 'paid').reduce((sum, e) => sum + e.amount, 0);
  const pendingAmount = expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);
  const deductibleAmount = expenses.filter(e => e.deductible && (e.status === 'approved' || e.status === 'paid')).reduce((sum, e) => sum + e.amount, 0);

  return [
    { 'Métrica': 'ESTADÍSTICAS DE GASTOS', 'Valor': '' },
    { 'Métrica': 'Total de Gastos', 'Valor': total },
    { 'Métrica': '', 'Valor': '' },
    
    { 'Métrica': 'DISTRIBUCIÓN POR ESTADO', 'Valor': '' },
    { 'Métrica': 'Pendientes', 'Valor': pendingCount },
    { 'Métrica': 'Aprobados', 'Valor': approvedCount },
    { 'Métrica': 'Rechazados', 'Valor': rejectedCount },
    { 'Métrica': 'Pagados', 'Valor': paidCount },
    { 'Métrica': '', 'Valor': '' },
    
    { 'Métrica': 'MONTOS', 'Valor': '' },
    { 'Métrica': 'Monto Total', 'Valor': `${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
    { 'Métrica': 'Monto Aprobado', 'Valor': `${approvedAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
    { 'Métrica': 'Monto Pendiente', 'Valor': `${pendingAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
    { 'Métrica': 'Gastos Deducibles', 'Valor': `${deductibleAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` }
  ];
};

const createExpensesCategoryBreakdownData = (expenses: Expense[]) => {
  const categoryMap = new Map<string, { count: number; amount: number }>();
  
  expenses.forEach(expense => {
    const current = categoryMap.get(expense.category) || { count: 0, amount: 0 };
    categoryMap.set(expense.category, {
      count: current.count + 1,
      amount: current.amount + expense.amount
    });
  });

  const totalAmount = Array.from(categoryMap.values()).reduce((sum, data) => sum + data.amount, 0);

  return Array.from(categoryMap.entries()).map(([category, data]) => ({
    'Categoría': getExpenseCategoryLabel(category as any),
    'Cantidad': data.count,
    'Monto Total': `${data.amount.toFixed(2)}`,
    'Promedio': `${(data.amount / data.count).toFixed(2)}`,
    '% del Total': `${totalAmount > 0 ? ((data.amount / totalAmount) * 100).toFixed(1) : 0}%`
  }));
};