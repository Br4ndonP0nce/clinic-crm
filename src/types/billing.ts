// src/types/billing.ts
import { Timestamp } from 'firebase/firestore';
import { DentalProduct, PaymentMethod } from './sales';

export interface BillingReport {
  id?: string;
  
  // Appointment Reference
  appointmentId: string;
  patientId: string;
  doctorId: string;
  
  // Report Status
  status: 'draft' | 'completed' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  
  // Financial Information (in Mexican Pesos)
  subtotal: number;
  tax: number;              // IVA (16% in Mexico)
  discount: number;
  total: number;
  paidAmount: number;
  pendingAmount: number;    // Calculated: total - paidAmount
  
  // Service Details
  services: BillingService[];
  
  // Payment Records
  payments: BillingPayment[];
  
  // Invoice Information
  invoiceNumber?: string;   // Auto-generated when completed
  invoiceDate?: Timestamp;
  dueDate?: Timestamp;
  
  // Additional Information
  notes?: string;
  internalNotes?: string;   // Only visible to staff
  
  // PDF Generation
  pdfGenerated: boolean;
  pdfUrl?: string;
  
  // System Fields
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  lastModifiedBy: string;
  
  // Status History
  statusHistory: BillingStatusHistory[];
}

export interface BillingService {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  
  // Dental-specific fields
  procedureCode?: string;   // ADA procedure codes
  tooth?: string[];        // Affected teeth
  category: DentalServiceCategory;
  
  // Provider information
  providedBy?: string;     // Doctor/hygienist ID
}

export interface BillingPayment {
  id: string;
  amount: number;
  method: PaymentMethod;
  date: Timestamp;
  reference?: string;      // Transaction ID, check number, etc.
  notes?: string;
  processedBy: string;     // Staff member who processed payment
  
  // Verification
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Timestamp;
}

// Type for creating new payments (before system fields are added)
export interface BillingPaymentInput {
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}

export interface BillingStatusHistory {
  id: string;
  previousStatus: BillingReport['status'];
  newStatus: BillingReport['status'];
  details: string;
  amount?: number;
  performedBy: string;
  performedAt: Timestamp;
}

export type DentalServiceCategory = 
  | 'preventive'           // Cleanings, exams, x-rays
  | 'restorative'          // Fillings, crowns, bridges
  | 'surgical'             // Extractions, implants
  | 'cosmetic'             // Whitening, veneers
  | 'orthodontic'          // Braces, aligners
  | 'periodontal'          // Gum treatments
  | 'endodontic'           // Root canals
  | 'prosthetic'           // Dentures, partials
  | 'pediatric'            // Children's dentistry
  | 'emergency'            // Emergency treatments
  | 'consultation'         // Consultations, second opinions
  | 'other';

// Expense Tracking
export interface Expense {
  id?: string;
  
  // Basic Information
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: Timestamp;
  
  // Receipt/Documentation
  receiptUrl?: string;
  receiptNumber?: string;
  vendor?: string;
  
  // Tax Information
  deductible: boolean;
  taxAmount?: number;
  
  // Approval Workflow
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  approvedBy?: string;
  approvedAt?: Timestamp;
  
  // System Fields
  createdAt: Timestamp;
  updatedAt: Timestamp;
  submittedBy: string;
  
  // Notes
  notes?: string;
}

export type ExpenseCategory = 
  | 'office_supplies'      // Office materials, forms
  | 'dental_supplies'      // Dental materials, instruments
  | 'equipment'            // Dental equipment, maintenance
  | 'laboratory'           // Lab fees, crown/bridge work
  | 'utilities'            // Electricity, water, internet
  | 'rent'                 // Office rent, property costs
  | 'marketing'            // Advertising, website, promotional
  | 'continuing_education' // Courses, certifications
  | 'insurance'            // Malpractice, general business
  | 'professional_services'// Accounting, legal, consulting
  | 'travel'               // Business travel, conferences
  | 'meals'                // Business meals, staff events
  | 'software'             // Software subscriptions, licenses
  | 'maintenance'          // Office maintenance, cleaning
  | 'taxes'                // Business taxes, fees
  | 'other';

// Financial Dashboard Data
export interface BillingDashboard {
  period: {
    start: Timestamp;
    end: Timestamp;
  };
  
  // Revenue Metrics
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  overdueRevenue: number;
  
  // Expense Metrics
  totalExpenses: number;
  approvedExpenses: number;
  pendingExpenses: number;
  
  // Calculated Metrics
  netIncome: number;        // paidRevenue - totalExpenses
  grossMargin: number;      // (paidRevenue - totalExpenses) / paidRevenue
  
  // Report Counts
  totalReports: number;
  completedReports: number;
  draftReports: number;
  overdueReports: number;
  
  // Payment Method Breakdown
  paymentMethodBreakdown: PaymentMethodBreakdown[];
  
  // Service Category Breakdown
  serviceCategoryBreakdown: ServiceCategoryBreakdown[];
  
  // Monthly Trends
  monthlyTrends: MonthlyTrend[];
}

export interface PaymentMethodBreakdown {
  method: PaymentMethod;
  count: number;
  amount: number;
  percentage: number;
}

export interface ServiceCategoryBreakdown {
  category: DentalServiceCategory;
  count: number;
  revenue: number;
  averagePrice: number;
}

export interface MonthlyTrend {
  month: string;
  revenue: number;
  expenses: number;
  netIncome: number;
  reportCount: number;
}

// Invoice Template Data
export interface InvoiceData {
  // Practice Information
  practice: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
    logo?: string;
    taxId?: string;         // RFC in Mexico
  };
  
  // Patient Information
  patient: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  
  // Invoice Details
  invoice: {
    number: string;
    date: string;
    dueDate: string;
    terms: string;
  };
  
  // Services and Totals
  services: BillingService[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  
  // Payment Information
  payments: BillingPayment[];
  paidAmount: number;
  pendingAmount: number;
  
  // Additional Information
  notes?: string;
  termsAndConditions?: string;
}

// Export interfaces for Excel reports
export interface BillingExportData {
  reportId: string;
  appointmentDate: string;
  patientName: string;
  doctorName: string;
  status: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paidAmount: number;
  pendingAmount: number;
  services: string;        // Concatenated service descriptions
  paymentMethods: string;  // Concatenated payment methods
  invoiceNumber?: string;
  createdAt: string;
  lastModified: string;
}

export interface ExpenseExportData {
  expenseId: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  vendor?: string;
  status: string;
  deductible: boolean;
  submittedBy: string;
  approvedBy?: string;
  notes?: string;
}

// Helper functions
export const getBillingStatusLabel = (status: BillingReport['status']): string => {
  const labels: Record<BillingReport['status'], string> = {
    draft: 'Borrador',
    completed: 'Completado',
    paid: 'Pagado',
    partially_paid: 'Pago Parcial',
    overdue: 'Vencido',
    cancelled: 'Cancelado'
  };
  return labels[status] || status;
};

export const getServiceCategoryLabel = (category: DentalServiceCategory): string => {
  const labels: Record<DentalServiceCategory, string> = {
    preventive: 'Preventivo',
    restorative: 'Restaurativo',
    surgical: 'Cirugía',
    cosmetic: 'Estética',
    orthodontic: 'Ortodoncia',
    periodontal: 'Periodoncia',
    endodontic: 'Endodoncia',
    prosthetic: 'Prótesis',
    pediatric: 'Odontopediatría',
    emergency: 'Emergencia',
    consultation: 'Consulta',
    other: 'Otros'
  };
  return labels[category] || category;
};

export const getExpenseCategoryLabel = (category: ExpenseCategory): string => {
  const labels: Record<ExpenseCategory, string> = {
    office_supplies: 'Material de Oficina',
    dental_supplies: 'Material Dental',
    equipment: 'Equipo',
    laboratory: 'Laboratorio',
    utilities: 'Servicios Públicos',
    rent: 'Renta',
    marketing: 'Marketing',
    continuing_education: 'Educación Continua',
    insurance: 'Seguros',
    professional_services: 'Servicios Profesionales',
    travel: 'Viajes',
    meals: 'Comidas de Negocio',
    software: 'Software',
    maintenance: 'Mantenimiento',
    taxes: 'Impuestos',
    other: 'Otros'
  };
  return labels[category] || category;
};

// Constants
export const MEXICAN_TAX_RATE = 0.16; // 16% IVA
export const DEFAULT_PAYMENT_TERMS = '30 días';
export const INVOICE_NUMBER_PREFIX = 'FAC-';

// Utility functions
export const calculateTax = (subtotal: number): number => {
  return Math.round(subtotal * MEXICAN_TAX_RATE * 100) / 100;
};

export const calculateTotal = (subtotal: number, tax: number, discount: number): number => {
  return Math.round((subtotal + tax - discount) * 100) / 100;
};

export const generateInvoiceNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const timestamp = now.getTime().toString().slice(-4);
  
  return `${INVOICE_NUMBER_PREFIX}${year}${month}${day}-${timestamp}`;
};