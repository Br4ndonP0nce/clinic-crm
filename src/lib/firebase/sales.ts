// src/lib/firebase/sales.ts - UPDATED for Dental Practice Billing Integration
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
import { updatePatient } from './db';

// =============================================================================
// DENTAL TREATMENT PLANS & ESTIMATES
// =============================================================================

export interface TreatmentPlan {
  id?: string;
  
  // Patient Reference
  patientId: string;
  
  // Plan Details
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  
  // Treatment Items
  treatments: TreatmentPlanItem[];
  
  // Financial Summary
  totalCost: number;
  estimatedInsuranceCoverage: number;
  patientPortion: number;
  
  // Payment Options
  paymentOptions: PaymentPlanOption[];
  
  // Status
  status: 'draft' | 'presented' | 'accepted' | 'declined' | 'in_progress' | 'completed';
  
  // Presentation Details
  presentedAt?: Timestamp;
  presentedBy?: string;
  acceptedAt?: Timestamp;
  declinedAt?: Timestamp;
  declineReason?: string;
  
  // System Fields
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  
  // Notes
  notes?: string;
  internalNotes?: string;
}

export interface TreatmentPlanItem {
  id: string;
  description: string;
  procedureCode?: string;
  tooth?: string[];
  priority: 'urgent' | 'high' | 'medium' | 'low';
  estimatedCost: number;
  insuranceCoverage: number;
  patientCost: number;
  expectedDuration: number; // in minutes
  prerequisiteItems?: string[]; // IDs of items that must be completed first
  notes?: string;
}

export interface PaymentPlanOption {
  id: string;
  name: string;
  description: string;
  downPayment: number;
  monthlyPayment: number;
  numberOfPayments: number;
  interestRate: number;
  totalCost: number;
}

// =============================================================================
// DENTAL SERVICE QUOTES & ESTIMATES
// =============================================================================

export interface ServiceQuote {
  id?: string;
  
  // Patient Reference
  patientId: string;
  
  // Quote Details
  title: string;
  description: string;
  
  // Services
  services: QuoteService[];
  
  // Financial Summary
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  
  // Quote Validity
  validUntil: Timestamp;
  
  // Status
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';
  
  // Conversion Tracking
  convertedToBilling?: boolean;
  billingReportId?: string;
  
  // System Fields
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  
  // Communication
  sentAt?: Timestamp;
  viewedAt?: Timestamp;
  respondedAt?: Timestamp;
  
  // Notes
  notes?: string;
  terms?: string;
}

export interface QuoteService {
  id: string;
  description: string;
  procedureCode?: string;
  tooth?: string[];
  quantity: number;
  unitPrice: number;
  total: number;
  category: string;
  notes?: string;
}

// =============================================================================
// MEMBERSHIP & SUBSCRIPTION PLANS
// =============================================================================

export interface MembershipPlan {
  id?: string;
  
  // Plan Details
  name: string;
  description: string;
  planType: 'individual' | 'family' | 'senior' | 'student';
  
  // Pricing
  monthlyFee: number;
  yearlyFee: number;
  setupFee: number;
  
  // Benefits
  includedServices: string[];
  discountedServices: { serviceId: string; discountPercentage: number }[];
  
  // Limits
  maxCleaningsPerYear: number;
  maxExamsPerYear: number;
  
  // Status
  isActive: boolean;
  
  // System Fields
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PatientMembership {
  id?: string;
  
  // References
  patientId: string;
  membershipPlanId: string;
  
  // Membership Details
  startDate: Timestamp;
  endDate: Timestamp;
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  
  // Payment
  monthlyFee: number;
  lastPaymentDate?: Timestamp;
  nextPaymentDate: Timestamp;
  
  // Usage Tracking
  servicesUsed: {
    serviceType: string;
    usedCount: number;
    maxCount: number;
  }[];
  
  // System Fields
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Cancellation
  cancelledAt?: Timestamp;
  cancellationReason?: string;
}

// =============================================================================
// DENTAL PRODUCT SALES
// =============================================================================
export interface Sale {
  id?: string;
  
  // Patient reference
  patientId: string;
  leadId?: string; // For backward compatibility
  
  // Sale details
  saleUserId: string; // Staff member who made the sale
  product: 'treatment_plan' | 'consultation' | 'cleaning' | 'whitening' | 'orthodontics' | 
           'implant' | 'crown' | 'filling' | 'extraction' | 'root_canal' | 'dentures' | 
           'oral_surgery' | 'periodontics' | 'pediatric' | 'cosmetic' | 'emergency' | 
           'products' | 'membership' | 'other';
  
  // Financial
  totalAmount: number;
  paidAmount: number;
  paymentPlan: 'full' | 'monthly' | 'quarterly' | 'custom';
  
  // Service tracking
  accessGranted?: boolean;
  serviceCompleted?: boolean;
  serviceStartDate?: Timestamp;
  serviceEndDate?: Timestamp;
  
  // System fields
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Additional context
  description?: string;
  notes?: string;
  paymentMethod?: string;
  
  // Source tracking
  sourceType: 'treatment_plan' | 'service_quote' | 'product_sale' | 'membership';
  sourceId: string;
}
export interface ProductSale {
  id?: string;
  
  // References
  patientId: string;
  saleStaffId: string;
  
  // Products
  products: SoldProduct[];
  
  // Financial
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paidAmount: number;
  
  // Payment
  paymentMethod: string;
  paymentReference?: string;
  
  // Status
  status: 'completed' | 'pending' | 'cancelled' | 'refunded';
  
  // System Fields
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Notes
  notes?: string;
}

export interface SoldProduct {
  id: string;
  name: string;
  description: string;
  category: 'toothbrush' | 'toothpaste' | 'mouthwash' | 'floss' | 'retainer' | 'night_guard' | 'other';
  quantity: number;
  unitPrice: number;
  total: number;
  sku?: string;
}

// =============================================================================
// FIRESTORE COLLECTIONS
// =============================================================================

const TREATMENT_PLANS_COLLECTION = 'treatment_plans';
const SERVICE_QUOTES_COLLECTION = 'service_quotes';
const MEMBERSHIP_PLANS_COLLECTION = 'membership_plans';
const PATIENT_MEMBERSHIPS_COLLECTION = 'patient_memberships';
const PRODUCT_SALES_COLLECTION = 'product_sales';

// =============================================================================
// TREATMENT PLAN FUNCTIONS
// =============================================================================

/**
 * Create a new treatment plan
 */
export const createTreatmentPlan = async (
  planData: Omit<TreatmentPlan, 'id' | 'createdAt' | 'updatedAt'>,
  createdBy: string
): Promise<string> => {
  try {
    const treatmentPlan: Omit<TreatmentPlan, 'id'> = {
      ...planData,
      createdBy,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any
    };

    const docRef = await addDoc(collection(db, TREATMENT_PLANS_COLLECTION), treatmentPlan);
    return docRef.id;
  } catch (error) {
    console.error('Error creating treatment plan:', error);
    throw error;
  }
};

/**
 * Update treatment plan status
 */
export const updateTreatmentPlanStatus = async (
  planId: string,
  status: TreatmentPlan['status'],
  userId: string,
  notes?: string
): Promise<void> => {
  try {
    const planRef = doc(db, TREATMENT_PLANS_COLLECTION, planId);
    
    const updateData: any = {
      status,
      updatedAt: serverTimestamp()
    };

    if (status === 'presented') {
      updateData.presentedAt = serverTimestamp();
      updateData.presentedBy = userId;
    } else if (status === 'accepted') {
      updateData.acceptedAt = serverTimestamp();
    } else if (status === 'declined') {
      updateData.declinedAt = serverTimestamp();
      if (notes) {
        updateData.declineReason = notes;
      }
    }

    await updateDoc(planRef, updateData);
  } catch (error) {
    console.error('Error updating treatment plan status:', error);
    throw error;
  }
};

/**
 * Get treatment plans for a patient
 */
export const getTreatmentPlans = async (
  patientId?: string,
  status?: TreatmentPlan['status']
): Promise<TreatmentPlan[]> => {
  try {
    let q = query(collection(db, TREATMENT_PLANS_COLLECTION));

    if (patientId) {
      q = query(q, where('patientId', '==', patientId));
    }
    if (status) {
      q = query(q, where('status', '==', status));
    }

    q = query(q, orderBy('createdAt', 'desc'));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TreatmentPlan));
  } catch (error) {
    console.error('Error getting treatment plans:', error);
    throw error;
  }
};
// =============================================================================
// DENTAL PRODUCT/SERVICE LABELS
// =============================================================================

export const getDentalProductLabel = (product: string): string => {
  const productLabels: Record<string, string> = {
    treatment_plan: "Plan de Tratamiento",
    consultation: "Consulta",
    cleaning: "Limpieza Dental",
    whitening: "Blanqueamiento",
    orthodontics: "Ortodoncia",
    implant: "Implante Dental",
    crown: "Corona",
    filling: "Empaste",
    extraction: "Extracción",
    root_canal: "Endodoncia",
    dentures: "Prótesis",
    oral_surgery: "Cirugía Oral",
    periodontics: "Periodoncia",
    pediatric: "Odontopediatría",
    cosmetic: "Odontología Estética",
    emergency: "Emergencia Dental",
    products: "Productos Dentales",
    membership: "Membresía/Plan",
    other: "Otros Servicios",
  };
  return productLabels[product] || product;
};

export const getPaymentPlanLabel = (plan: string): string => {
  const planLabels: Record<string, string> = {
    full: "Pago Completo",
    monthly: "Mensual",
    quarterly: "Trimestral",
    custom: "Plan Personalizado"
  };
  return planLabels[plan] || plan;
};

// AGGREGATION FUNCTIONS
// =============================================================================

/**
 * Convert treatment plan to Sale format for reporting
 */
const treatmentPlanToSale = (plan: TreatmentPlan): Sale => {
  // For treatment plans, we'll assume they're billed when accepted
  const isPaid = plan.status === 'completed';
  const isActive = plan.status === 'accepted' || plan.status === 'in_progress';
  
  return {
    id: plan.id,
    patientId: plan.patientId,
    saleUserId: plan.createdBy,
    product: 'treatment_plan',
    totalAmount: plan.totalCost,
    paidAmount: isPaid ? plan.patientPortion : 0, // Only patient portion counts as revenue
    paymentPlan: 'custom', // Treatment plans usually have custom payment arrangements
    serviceCompleted: plan.status === 'completed',
    accessGranted: isActive || isPaid,
    serviceStartDate: plan.status === 'in_progress' ? plan.createdAt : undefined,
    serviceEndDate: plan.status === 'completed' ? plan.updatedAt : undefined,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    description: plan.title,
    notes: plan.notes,
    sourceType: 'treatment_plan',
    sourceId: plan.id!
  };
};

/**
 * Convert service quote to Sale format for reporting
 */
const serviceQuoteToSale = (quote: ServiceQuote): Sale => {
  const isConverted = quote.convertedToBilling;
  
  return {
    id: quote.id,
    patientId: quote.patientId,
    saleUserId: quote.createdBy,
    product: inferProductFromServices(quote.services),
    totalAmount: quote.total,
    paidAmount: isConverted ? quote.total : 0,
    paymentPlan: 'full', // Quotes are typically full payment
    serviceCompleted: isConverted,
    accessGranted: quote.status === 'accepted',
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt,
    description: quote.title,
    notes: quote.notes,
    sourceType: 'service_quote',
    sourceId: quote.id!
  };
};

/**
 * Convert product sale to Sale format for reporting
 */
const productSaleToSale = (productSale: ProductSale): Sale => {
  return {
    id: productSale.id,
    patientId: productSale.patientId,
    saleUserId: productSale.saleStaffId,
    product: 'products',
    totalAmount: productSale.total,
    paidAmount: productSale.paidAmount,
    paymentPlan: 'full',
    serviceCompleted: true, // Products are delivered immediately
    accessGranted: true,
    createdAt: productSale.createdAt,
    updatedAt: productSale.updatedAt,
    description: `Venta de Productos (${productSale.products?.length || 0} items)`,
    notes: productSale.notes,
    paymentMethod: productSale.paymentMethod,
    sourceType: 'product_sale',
    sourceId: productSale.id!
  };
};

/**
 * Convert membership to Sale format for reporting
 */
const membershipToSale = (membership: PatientMembership, plan: MembershipPlan): Sale => {
  const monthlyRevenue = membership.monthlyFee;
  const isActive = membership.status === 'active';
  
  return {
    id: membership.id,
    patientId: membership.patientId,
    saleUserId: 'system', // Memberships might not have a specific sales person
    product: 'membership',
    totalAmount: monthlyRevenue * 12, // Annualized for reporting
    paidAmount: isActive ? monthlyRevenue : 0, // Current month payment
    paymentPlan: 'monthly',
    serviceCompleted: false, // Ongoing service
    accessGranted: isActive,
    serviceStartDate: membership.startDate,
    serviceEndDate: membership.endDate,
    createdAt: membership.createdAt,
    updatedAt: membership.updatedAt,
    description: `Membresía: ${plan.name}`,
    notes: membership.status,
    sourceType: 'membership',
    sourceId: membership.id!
  };
};
// =============================================================================
// MAIN getSales FUNCTION
// =============================================================================

/**
 * Get all sales data aggregated from different sources
 * This replaces the old getSales function and works with the new schema
 */
export const getSales = async (filters?: {
  patientId?: string;
  leadId?: string; // For backward compatibility
  saleUserId?: string;
  product?: Sale['product'];
  accessGranted?: boolean;
  serviceCompleted?: boolean;
}): Promise<Sale[]> => {
  try {
    const sales: Sale[] = [];
    
    // 1. Get Treatment Plans
    let treatmentPlansQuery = query(collection(db, TREATMENT_PLANS_COLLECTION));
    if (filters?.patientId) {
      treatmentPlansQuery = query(treatmentPlansQuery, where('patientId', '==', filters.patientId));
    }
    if (filters?.saleUserId) {
      treatmentPlansQuery = query(treatmentPlansQuery, where('createdBy', '==', filters.saleUserId));
    }
    
    const treatmentPlansSnapshot = await getDocs(treatmentPlansQuery);
    const treatmentPlanSales = treatmentPlansSnapshot.docs.map(doc => 
      treatmentPlanToSale({ id: doc.id, ...doc.data() } as TreatmentPlan)
    );
    
    // 2. Get Service Quotes (only converted ones count as sales)
    let quotesQuery = query(
      collection(db, SERVICE_QUOTES_COLLECTION),
      where('convertedToBilling', '==', true)
    );
    if (filters?.patientId) {
      quotesQuery = query(quotesQuery, where('patientId', '==', filters.patientId));
    }
    if (filters?.saleUserId) {
      quotesQuery = query(quotesQuery, where('createdBy', '==', filters.saleUserId));
    }
    
    const quotesSnapshot = await getDocs(quotesQuery);
    const quoteSales = quotesSnapshot.docs.map(doc => 
      serviceQuoteToSale({ id: doc.id, ...doc.data() } as ServiceQuote)
    );
    
    // 3. Get Product Sales
    let productSalesQuery = query(collection(db, PRODUCT_SALES_COLLECTION));
    if (filters?.patientId) {
      productSalesQuery = query(productSalesQuery, where('patientId', '==', filters.patientId));
    }
    if (filters?.saleUserId) {
      productSalesQuery = query(productSalesQuery, where('saleStaffId', '==', filters.saleUserId));
    }
    
    const productSalesSnapshot = await getDocs(productSalesQuery);
    const productSalesData = productSalesSnapshot.docs.map(doc => 
      productSaleToSale({ id: doc.id, ...doc.data() } as ProductSale)
    );
    
    // 4. Get Memberships (only active ones)
    let membershipsQuery = query(
      collection(db, PATIENT_MEMBERSHIPS_COLLECTION),
      where('status', '==', 'active')
    );
    if (filters?.patientId) {
      membershipsQuery = query(membershipsQuery, where('patientId', '==', filters.patientId));
    }
    
    const membershipsSnapshot = await getDocs(membershipsQuery);
    const membershipPlansCache = new Map();
    
    const membershipSales = await Promise.all(
      membershipsSnapshot.docs.map(async (membershipDoc) => {
        const membership = { id: membershipDoc.id, ...membershipDoc.data() } as PatientMembership;
        
        // Get membership plan details
        let plan = membershipPlansCache.get(membership.membershipPlanId);
        if (!plan) {
          const planDocRef = doc(db, MEMBERSHIP_PLANS_COLLECTION, membership.membershipPlanId);
          const planDoc = await getDoc(planDocRef);
          if (planDoc.exists()) {
            plan = { id: planDoc.id, ...planDoc.data() } as MembershipPlan;
            membershipPlansCache.set(membership.membershipPlanId, plan);
          }
        }
        
        if (plan) {
          return membershipToSale(membership, plan);
        }
        return null;
      })
    );
    
    // Combine all sales
    sales.push(
      ...treatmentPlanSales,
      ...quoteSales,
      ...productSalesData,
      ...membershipSales.filter(sale => sale !== null) as Sale[]
    );
    
    // Apply additional filters
    let filteredSales = sales;
    
    if (filters?.product) {
      filteredSales = filteredSales.filter(sale => sale.product === filters.product);
    }
    
    if (filters?.accessGranted !== undefined) {
      filteredSales = filteredSales.filter(sale => sale.accessGranted === filters.accessGranted);
    }
    
    if (filters?.serviceCompleted !== undefined) {
      filteredSales = filteredSales.filter(sale => sale.serviceCompleted === filters.serviceCompleted);
    }
    
    // Handle backward compatibility with leadId
    if (filters?.leadId && !filters?.patientId) {
      filteredSales = filteredSales.filter(sale => 
        sale.patientId === filters.leadId || sale.leadId === filters.leadId
      );
    }
    
    // Sort by creation date (newest first)
    filteredSales.sort((a, b) => {
      let dateA: Date;
      let dateB: Date;
      
      // Handle Firestore Timestamp conversion
      if (a.createdAt && typeof a.createdAt.toDate === 'function') {
        dateA = a.createdAt.toDate();
      } else if (a.createdAt instanceof Date) {
        dateA = a.createdAt;
      } else {
        dateA = new Date(0); // Fallback
      }
      
      if (b.createdAt && typeof b.createdAt.toDate === 'function') {
        dateB = b.createdAt.toDate();
      } else if (b.createdAt instanceof Date) {
        dateB = b.createdAt;
      } else {
        dateB = new Date(0); // Fallback
      }
      
      return dateB.getTime() - dateA.getTime();
    });
    
    return filteredSales;
    
  } catch (error) {
    console.error('Error getting sales:', error);
    throw error;
  }
};
/**
 * Helper function to infer product type from services
 */
const inferProductFromServices = (services: QuoteService[]): Sale['product'] => {
  if (!services || services.length === 0) return 'consultation';
  
  // Simple logic - could be more sophisticated
  const firstService = services[0];
  const category = firstService.category?.toLowerCase();
  
  if (category?.includes('cleaning')) return 'cleaning';
  if (category?.includes('whitening')) return 'whitening';
  if (category?.includes('orthodontics')) return 'orthodontics';
  if (category?.includes('implant')) return 'implant';
  if (category?.includes('crown')) return 'crown';
  if (category?.includes('filling')) return 'filling';
  if (category?.includes('extraction')) return 'extraction';
  if (category?.includes('root_canal')) return 'root_canal';
  if (category?.includes('surgery')) return 'oral_surgery';
  
  return 'consultation'; // Default
};

// =============================================================================
// SERVICE QUOTE FUNCTIONS
// =============================================================================

/**
 * Create a service quote
 */
export const createServiceQuote = async (
  quoteData: Omit<ServiceQuote, 'id' | 'createdAt' | 'updatedAt'>,
  createdBy: string
): Promise<string> => {
  try {
    const quote: Omit<ServiceQuote, 'id'> = {
      ...quoteData,
      createdBy,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any
    };

    const docRef = await addDoc(collection(db, SERVICE_QUOTES_COLLECTION), quote);
    return docRef.id;
  } catch (error) {
    console.error('Error creating service quote:', error);
    throw error;
  }
};

/**
 * Convert quote to billing report
 */
export const convertQuoteToBilling = async (
  quoteId: string,
  billingReportId: string
): Promise<void> => {
  try {
    const quoteRef = doc(db, SERVICE_QUOTES_COLLECTION, quoteId);
    
    await updateDoc(quoteRef, {
      status: 'accepted',
      convertedToBilling: true,
      billingReportId,
      respondedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error converting quote to billing:', error);
    throw error;
  }
};

/**
 * Update quote status
 */
export const updateQuoteStatus = async (
  quoteId: string,
  status: ServiceQuote['status'],
  userId: string
): Promise<void> => {
  try {
    const quoteRef = doc(db, SERVICE_QUOTES_COLLECTION, quoteId);
    
    const updateData: any = {
      status,
      updatedAt: serverTimestamp()
    };

    if (status === 'sent') {
      updateData.sentAt = serverTimestamp();
    } else if (status === 'viewed') {
      updateData.viewedAt = serverTimestamp();
    } else if (status === 'accepted' || status === 'declined') {
      updateData.respondedAt = serverTimestamp();
    }

    await updateDoc(quoteRef, updateData);
  } catch (error) {
    console.error('Error updating quote status:', error);
    throw error;
  }
};

/**
 * Get quote by ID
 */
export const getServiceQuote = async (quoteId: string): Promise<ServiceQuote | null> => {
  try {
    const quoteRef = doc(db, SERVICE_QUOTES_COLLECTION, quoteId);
    const quoteSnap = await getDoc(quoteRef);
    
    if (quoteSnap.exists()) {
      return { id: quoteSnap.id, ...quoteSnap.data() } as ServiceQuote;
    }
    return null;
  } catch (error) {
    console.error('Error getting service quote:', error);
    throw error;
  }
};