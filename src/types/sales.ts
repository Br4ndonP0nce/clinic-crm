// src/types/sales.ts - Complete Sales System for Dental Practice
import { Timestamp } from 'firebase/firestore';

export interface Sale {
  id?: string;
  
  // Reference IDs
  patientId: string;         // Updated from leadId to patientId
  leadId?: string;           // Keep for backward compatibility
  saleUserId: string;        // Staff member who made the sale
  
  // Product/Service Information
  product: DentalProduct;    // Type of dental service or product
  productDetails?: {
    procedureCode?: string;   // Dental procedure code (ADA codes)
    description?: string;     // Detailed description
    category?: DentalCategory;
    tooth?: string[];        // Affected teeth
    treatmentPlan?: string;  // Treatment plan ID reference
  };
  
  // Financial Information
  totalAmount: number;       // Total sale amount
  paidAmount: number;        // Amount paid so far
  pendingAmount?: number;    // Calculated: totalAmount - paidAmount
  paymentPlan: PaymentPlan;  // Payment structure
  
  // Service/Treatment Status
  serviceCompleted?: boolean;     // Updated from accessGranted
  serviceStartDate?: Timestamp;   // When treatment started
  serviceEndDate?: Timestamp;     // When treatment completed/expires
  accessGranted?: boolean;        // Keep for backward compatibility
  accessEndDate?: Timestamp;      // Keep for backward compatibility
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  
  // Payment Tracking
  payments?: PaymentRecord[];
  paymentProofs: PaymentProof[];  // Add this back for compatibility
  
  // Status History - ADD THIS BACK
  statusHistory: SaleStatusHistory[];
  
  // Commission Tracking
  commissionRate?: number;        // Commission rate for this sale
  commissionPaid?: boolean;       // Whether commission has been paid
  
  // Exemption System (for backward compatibility)
  exemptionGranted?: boolean;
  exemptionReason?: string;
  exemptionGrantedBy?: string;
  
  // Notes and Documentation
  notes?: string;
  attachments?: string[];         // File URLs for contracts, treatment plans, etc.
}

// Status History Interface
export interface SaleStatusHistory {
  id: string;
  action: 'sale_created' | 'payment_added' | 'access_granted' | 'access_updated' | 'access_revoked' | 'exemption_granted' | 'service_completed' | 'treatment_started' | 'treatment_completed' | 'cancelled';
  details: string;
  amount?: number;
  performedBy: string;
  performedAt: Date | Timestamp;
}

// Payment Proof Interface (for backward compatibility)
export interface PaymentProof {
  id: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  imageUrl?: string;
  notes?: string;
  uploadedBy?: string;
  uploadedAt: Date | Timestamp;
  verified?: boolean;
  verifiedBy?: string;
  verifiedAt?: Date | Timestamp;
}

// Dental Products and Services
export type DentalProduct = 
  // Preventive Services
  | 'consultation'
  | 'cleaning'
  | 'fluoride_treatment'
  | 'sealants'
  | 'oral_cancer_screening'
  
  // Restorative Services
  | 'filling'
  | 'crown'
  | 'bridge'
  | 'inlay_onlay'
  | 'veneer'
  
  // Surgical Services
  | 'extraction'
  | 'oral_surgery'
  | 'implant'
  | 'bone_graft'
  | 'sinus_lift'
  
  // Specialized Services
  | 'root_canal'
  | 'periodontics'
  | 'orthodontics'
  | 'whitening'
  | 'cosmetic'
  
  // Prosthetics
  | 'dentures'
  | 'partial_dentures'
  | 'implant_dentures'
  
  // Pediatric Services
  | 'pediatric'
  | 'space_maintainer'
  
  // Emergency Services
  | 'emergency'
  | 'pain_management'
  
  // Plans and Memberships
  | 'treatment_plan'
  | 'membership'
  | 'insurance_plan'
  
  // Products
  | 'dental_products'
  | 'oral_appliances'
  | 'night_guard'
  | 'retainer'
  
  // Legacy support
  | 'acceso_curso'
  | 'other';

// Add ProductType alias for backward compatibility
export type ProductType = DentalProduct;

export type DentalCategory = 
  | 'preventive'
  | 'restorative' 
  | 'surgical'
  | 'specialized'
  | 'prosthetics'
  | 'pediatric'
  | 'emergency'
  | 'cosmetic'
  | 'orthodontic'
  | 'periodontal'
  | 'endodontic'
  | 'products'
  | 'plans';

export type PaymentPlan = 
  | 'full_payment'           // Full payment upfront
  | 'two_payments'           // 50% down, 50% on completion
  | 'three_payments'         // 33% down, 33% midway, 34% completion
  | 'monthly_plan'           // Monthly installments
  | 'insurance_copay'        // Insurance + copay
  | 'insurance_full'         // Full insurance coverage
  | 'financing'              // Third-party financing
  | 'payment_plan_custom';   // Custom payment arrangement

export interface PaymentRecord {
  id: string;
  amount: number;
  date: Timestamp;
  method: PaymentMethod;
  reference?: string;        // Transaction ID, check number, etc.
  processedBy: string;       // Staff member who processed payment
  notes?: string;
}

export type PaymentMethod = 
  | 'cash'
  | 'check'
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'insurance'
  | 'financing'
  | 'store_credit'
  | 'other';

// Commission calculation interface
export interface CommissionRule {
  role: string;
  productCategory?: DentalCategory;
  rate: number;              // Percentage as decimal (0.10 = 10%)
  minimumSale?: number;      // Minimum sale amount for commission
  tiered?: {
    threshold: number;
    rate: number;
  }[];                       // Tiered commission rates
}

// Sales reporting interfaces
export interface SalesReport {
  period: {
    start: Timestamp;
    end: Timestamp;
  };
  staffMember?: string;
  totalSales: number;
  totalRevenue: number;
  totalCommissions: number;
  productBreakdown: ProductSalesBreakdown[];
  paymentBreakdown: PaymentBreakdown[];
}

export interface ProductSalesBreakdown {
  product: DentalProduct;
  category: DentalCategory;
  count: number;
  revenue: number;
  averagePrice: number;
}

export interface PaymentBreakdown {
  method: PaymentMethod;
  count: number;
  amount: number;
  percentage: number;
}

// Helper function to calculate access end date (for legacy support)
export const calculateAccessEndDate = (startDate: Date): Date => {
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 1); // 1 year access
  return endDate;
};

// Export functions for getting labels
export const getDentalProductLabel = (product: DentalProduct): string => {
  const labels: Record<DentalProduct, string> = {
    consultation: 'Consulta',
    cleaning: 'Limpieza Dental',
    fluoride_treatment: 'Tratamiento con Flúor',
    sealants: 'Selladores',
    oral_cancer_screening: 'Detección de Cáncer Oral',
    filling: 'Empaste',
    crown: 'Corona',
    bridge: 'Puente',
    inlay_onlay: 'Incrustación',
    veneer: 'Carilla',
    extraction: 'Extracción',
    oral_surgery: 'Cirugía Oral',
    implant: 'Implante Dental',
    bone_graft: 'Injerto Óseo',
    sinus_lift: 'Elevación de Seno',
    root_canal: 'Endodoncia',
    periodontics: 'Periodoncia',
    orthodontics: 'Ortodoncia',
    whitening: 'Blanqueamiento',
    cosmetic: 'Odontología Estética',
    dentures: 'Prótesis Completa',
    partial_dentures: 'Prótesis Parcial',
    implant_dentures: 'Prótesis sobre Implantes',
    pediatric: 'Odontopediatría',
    space_maintainer: 'Mantenedor de Espacio',
    emergency: 'Emergencia Dental',
    pain_management: 'Manejo del Dolor',
    treatment_plan: 'Plan de Tratamiento',
    membership: 'Membresía',
    insurance_plan: 'Plan de Seguro',
    dental_products: 'Productos Dentales',
    oral_appliances: 'Aparatos Orales',
    night_guard: 'Protector Nocturno',
    retainer: 'Retenedor',
    acceso_curso: 'Acceso al Curso',
    other: 'Otros Servicios'
  };
  return labels[product] || product;
};

export const getPaymentPlanLabel = (plan: PaymentPlan): string => {
  const labels: Record<PaymentPlan, string> = {
    full_payment: 'Pago Completo',
    two_payments: 'Dos Pagos',
    three_payments: 'Tres Pagos',
    monthly_plan: 'Plan Mensual',
    insurance_copay: 'Seguro + Copago',
    insurance_full: 'Seguro Completo',
    financing: 'Financiamiento',
    payment_plan_custom: 'Plan Personalizado'
  };
  return labels[plan] || plan;
};

export const getPaymentMethodLabel = (method: PaymentMethod): string => {
  const labels: Record<PaymentMethod, string> = {
    cash: 'Efectivo',
    check: 'Cheque',
    credit_card: 'Tarjeta de Crédito',
    debit_card: 'Tarjeta de Débito',
    bank_transfer: 'Transferencia Bancaria',
    insurance: 'Seguro',
    financing: 'Financiamiento',
    store_credit: 'Crédito de Tienda',
    other: 'Otro'
  };
  return labels[method] || method;
};