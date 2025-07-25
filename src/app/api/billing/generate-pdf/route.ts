// src/app/api/billing/generate-pdf/route.ts - FIXED WITH PROPER TYPES
import { NextRequest, NextResponse } from 'next/server';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { adminDb, isAdminSDKConfigured } from '@/lib/firebase/admin';
import { watermarkPresets } from '@/lib/utils/watermark';
import { clinicConfig } from '@/config/clinic';
import { BillingReport, BillingService, BillingPayment } from '@/types/billing';
import { Patient } from '@/types/patient';

export const maxDuration = 30; // Vercel function timeout

// Define proper types for the PDF generation
interface PDFGenerationData {
  report: BillingReport & { id: string };
  patient: Patient & { id: string };
  doctor: {
    id: string;
    displayName: string;
    email?: string;
    uid: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { reportId } = await request.json();

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    // Check if Admin SDK is configured
    if (!isAdminSDKConfigured()) {
      console.error('❌ Admin SDK not configured for PDF generation');
      return NextResponse.json(
        { error: 'Server configuration error. Please contact administrator.' },
        { status: 503 }
      );
    }

    console.log('🔧 Fetching billing report data using Admin SDK...');

    // Fetch report data using Admin SDK with proper error handling
    const reportDoc = await adminDb.collection('billing_reports').doc(reportId).get();
    if (!reportDoc.exists) {
      return NextResponse.json(
        { error: 'Billing report not found' },
        { status: 404 }
      );
    }

    const reportData = reportDoc.data();
    if (!reportData) {
      return NextResponse.json(
        { error: 'Invalid report data' },
        { status: 400 }
      );
    }

    // Transform Firestore data to proper BillingReport type
    const report: BillingReport & { id: string } = {
      id: reportDoc.id,
      appointmentId: reportData.appointmentId,
      patientId: reportData.patientId,
      doctorId: reportData.doctorId,
      reportType: reportData.reportType || 'complete_visit',
      reportTitle: reportData.reportTitle,
      reportDescription: reportData.reportDescription,
      isPartialReport: reportData.isPartialReport || false,
      parentReportId: reportData.parentReportId,
      reportSequence: reportData.reportSequence,
      linkedReports: reportData.linkedReports || [],
      linkType: reportData.linkType,
      linkId: reportData.linkId,
      linkNotes: reportData.linkNotes,
      linkedBy: reportData.linkedBy,
      linkedAt: reportData.linkedAt,
      status: reportData.status || 'draft',
      subtotal: reportData.subtotal || 0,
      tax: reportData.tax || 0,
      discount: reportData.discount || 0,
      total: reportData.total || 0,
      paidAmount: reportData.paidAmount || 0,
      pendingAmount: reportData.pendingAmount || (reportData.total - reportData.paidAmount),
      services: reportData.services || [],
      payments: reportData.payments || [],
      invoiceNumber: reportData.invoiceNumber,
      invoiceDate: reportData.invoiceDate,
      dueDate: reportData.dueDate,
      notes: reportData.notes,
      internalNotes: reportData.internalNotes,
      pdfGenerated: reportData.pdfGenerated || false,
      pdfUrl: reportData.pdfUrl,
      archivedAt: reportData.archivedAt,
      archivedBy: reportData.archivedBy,
      archiveReason: reportData.archiveReason,
      createdAt: reportData.createdAt,
      updatedAt: reportData.updatedAt,
      createdBy: reportData.createdBy || 'unknown',
      lastModifiedBy: reportData.lastModifiedBy || reportData.createdBy || 'unknown',
      statusHistory: reportData.statusHistory || []
    };

    console.log('✅ Report data fetched and transformed');

    // Fetch related data using Admin SDK with proper error handling
    const [patientDoc, doctorDoc] = await Promise.all([
      adminDb.collection('patients').doc(report.patientId).get(),
      adminDb.collection('app_users').doc(report.doctorId).get()
    ]);

    if (!patientDoc.exists) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    const patientData = patientDoc.data();
    if (!patientData) {
      return NextResponse.json(
        { error: 'Invalid patient data' },
        { status: 400 }
      );
    }

    // Transform patient data to proper Patient type
    const patient: Patient & { id: string } = {
      id: patientDoc.id,
      firstName: patientData.firstName || '',
      lastName: patientData.lastName || '',
      fullName: patientData.fullName || `${patientData.firstName} ${patientData.lastName}`,
      email: patientData.email || '',
      phone: patientData.phone || '',
      alternatePhone: patientData.alternatePhone,
      dateOfBirth: patientData.dateOfBirth?.toDate?.() || new Date(),
      gender: patientData.gender || 'prefer_not_to_say',
      address: patientData.address || {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      emergencyContact: patientData.emergencyContact || {
        name: '',
        relationship: '',
        phone: ''
      },
      insurance: patientData.insurance || {
        isActive: false
      },
      medicalHistory: patientData.medicalHistory || {
        allergies: [],
        medications: [],
        medicalConditions: [],
        surgeries: []
      },
      dentalHistory: patientData.dentalHistory || {
        reasonForVisit: '',
        oralHygiene: 'good',
        brushingFrequency: 'twice_daily',
        flossingFrequency: 'daily',
        currentProblems: []
      },
      status: patientData.status || 'inquiry',
      preferences: patientData.preferences || {
        preferredTimeSlots: [],
        preferredDays: [],
        communicationMethod: 'phone',
        reminderPreferences: {
          email: true,
          sms: true,
          days: 1
        }
      },
      financial: patientData.financial || {
        paymentMethod: 'cash',
        balance: 0
      },
      createdAt: patientData.createdAt?.toDate?.() || new Date(),
      updatedAt: patientData.updatedAt?.toDate?.() || new Date(),
      assignedTo: patientData.assignedTo,
      createdBy: patientData.createdBy || 'unknown',
      notes: patientData.notes || '',
      statusHistory: patientData.statusHistory || [],
      consents: patientData.consents || {
        treatmentConsent: false,
        privacyPolicy: false,
        marketingEmails: false
      }
    };

    // Handle doctor data with fallback
    const doctorData = doctorDoc.exists ? doctorDoc.data() : null;
    const doctor = {
      id: doctorDoc.id,
      displayName: doctorData?.displayName || 'Doctor',
      email: doctorData?.email || '',
      uid: doctorData?.uid || doctorDoc.id
    };

    console.log('✅ Related data fetched and transformed');

    // Generate PDF with properly typed data
    console.log('🔧 Starting PDF generation...');
    const pdfBuffer = await generateBillingPDF({
      report,
      patient,
      doctor
    });

    console.log('✅ PDF generated successfully');

    // Update report to mark PDF as generated
    try {
      await adminDb.collection('billing_reports').doc(reportId).update({
        pdfGenerated: true,
        lastModifiedBy: 'pdf_generator',
        updatedAt: new Date()
      });
      console.log('✅ Report updated with PDF generation status');
    } catch (updateError) {
      console.warn('⚠️ Could not update report PDF status:', updateError);
      // Don't fail the entire operation for this
    }

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Factura-${report.invoiceNumber || report.id}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });

  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      environment: getEnvironmentInfo(),
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    };
    
    console.error('PDF Generation Error Details:', errorDetails);

    return NextResponse.json(
      { 
        error: 'Failed to generate PDF',
        details: process.env.NODE_ENV === 'development' ? errorDetails.message : undefined
      },
      { status: 500 }
    );
  }
}

function getEnvironmentInfo() {
  return {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    platform: process.platform,
    isLocal: !process.env.VERCEL && !process.env.RAILWAY && !process.env.RENDER,
    isVercel: !!process.env.VERCEL,
    isDev: process.env.NODE_ENV === 'development'
  };
}

async function generateBillingPDF(data: PDFGenerationData): Promise<Buffer> {
  const env = getEnvironmentInfo();
  let browser = null;
  
  try {
    if (env.isVercel) {
      // VERCEL: Use serverless chromium
      const chromium = await import('@sparticuz/chromium');
      const puppeteer = await import('puppeteer-core');
      
      browser = await puppeteer.default.launch({
        args: chromium.default.args,
        executablePath: await chromium.default.executablePath(),
        headless: true
      });
      
    } else {
      // LOCAL/OTHER: Use regular puppeteer
      try {
        // Try to use regular puppeteer first
        const puppeteer = await import('puppeteer');
        browser = await puppeteer.default.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
          ]
        });
      } catch (localPuppeteerError) {
        // Fallback: try to find local chromium
        const puppeteer = await import('puppeteer-core');
        
        // Common local chromium paths
        const possiblePaths = [
          // Windows
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          // macOS
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          '/Applications/Chromium.app/Contents/MacOS/Chromium',
          // Linux
          '/usr/bin/google-chrome',
          '/usr/bin/chromium-browser',
          '/usr/bin/chromium',
          // Snap
          '/snap/bin/chromium'
        ];
        
        let executablePath = undefined;
        for (const path of possiblePaths) {
          try {
            const fs = await import('fs');
            if (fs.existsSync(path)) {
              executablePath = path;
              break;
            }
          } catch (e) {
            // Continue searching
          }
        }
        
        if (!executablePath) {
          throw new Error('❌ No Chromium/Chrome installation found. Please install:\n' +
            '- npm install puppeteer (for development), OR\n' +
            '- Install Google Chrome/Chromium browser');
        }
        
        browser = await puppeteer.default.launch({
          executablePath,
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
          ]
        });
      }
    }

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600 });
    page.setDefaultTimeout(25000);

    const htmlContent = await generateInvoiceHTML(data);

    await page.setContent(htmlContent, {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    return Buffer.from(pdfBuffer);

  } catch (error) {
    console.error('❌ Error in PDF generation:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Enhanced image loading function with better error handling
async function getImageAsBase64(imagePath: string): Promise<string> {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const fullPath = path.join(process.cwd(), 'public', imagePath);
    
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️ Image not found: ${fullPath}, using fallback`);
      return generateFallbackLogo();
    }
    
    const imageBuffer = fs.readFileSync(fullPath);
    const extension = imagePath.split('.').pop()?.toLowerCase();
    let mimeType = 'image/png';
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'png':
        mimeType = 'image/png';
        break;
      case 'svg':
        mimeType = 'image/svg+xml';
        break;
      case 'webp':
        mimeType = 'image/webp';
        break;
    }
    
    const base64 = imageBuffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
    
  } catch (error) {
    console.error('❌ Error loading image:', error);
    return generateFallbackLogo();
  }
}

function generateFallbackLogo(): string {
  const logoSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="60" viewBox="0 0 120 60">
      <rect width="120" height="60" fill="${clinicConfig.branding.primaryColor}" rx="8"/>
      <text x="60" y="25" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="white" text-anchor="middle">
        ${clinicConfig.name.split(' ')[0] || 'CLÍNICA'}
      </text>
      <text x="60" y="40" font-family="Arial, sans-serif" font-size="12" fill="white" text-anchor="middle">
        ${clinicConfig.name.split(' ').slice(1).join(' ') || 'DENTAL'}
      </text>
      <circle cx="25" cy="30" r="8" fill="white" opacity="0.8"/>
      <circle cx="95" cy="30" r="8" fill="white" opacity="0.8"/>
    </svg>
  `;
  
  const base64Logo = Buffer.from(logoSvg).toString('base64');
  return `data:image/svg+xml;base64,${base64Logo}`;
}

export async function GET() {
  try {
    if (!isAdminSDKConfigured()) {
      return NextResponse.json({
        status: 'error',
        error: 'Admin SDK not configured',
        platform: 'server',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    // Test basic functionality
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true
    });
    
    const page = await browser.newPage();
    await page.setContent('<h1>PDF Service Test</h1>');
    await browser.close();
    
    return NextResponse.json({
      status: 'healthy',
      puppeteer: 'working',
      adminSDK: 'configured',
      platform: 'vercel',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      platform: 'vercel',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Enhanced HTML generation with proper type safety
async function generateInvoiceHTML(data: PDFGenerationData): Promise<string> {
  const { report, patient, doctor } = data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    // Handle both Firebase Timestamp and regular dates
    let jsDate: Date;
    if (date && typeof date.toDate === 'function') {
      jsDate = date.toDate();
    } else if (date && typeof date.seconds === 'number') {
      jsDate = new Date(date.seconds * 1000);
    } else if (date instanceof Date) {
      jsDate = date;
    } else {
      jsDate = new Date(date);
    }
    
    // Validate date
    if (isNaN(jsDate.getTime())) {
      return 'N/A';
    }
    
    return jsDate.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Borrador',
      completed: 'Completado',
      paid: 'Pagado',
      partially_paid: 'Pago Parcial',
      overdue: 'Vencido',
      cancelled: 'Cancelado'
    };
    return labels[status] || status;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Efectivo',
      credit_card: 'Tarjeta de Crédito',
      debit_card: 'Tarjeta de Débito',
      bank_transfer: 'Transferencia Bancaria',
      check: 'Cheque',
      insurance: 'Seguro',
      other: 'Otro'
    };
    return labels[method] || method;
  };

  // Get logo and watermark
  let logoBase64 = '';
  if (clinicConfig.pdf.showLogo) {
    const logoPath = clinicConfig.branding.logoPath || 'logo.png';
    logoBase64 = await getImageAsBase64(logoPath);
  }
  
  let watermarkBase64 = '';
  if (clinicConfig.pdf.showWatermark) {
    const watermarkConfig = clinicConfig.pdf.watermark;
    
    try {
      switch (watermarkConfig.type) {
        case 'image':
          watermarkBase64 = await watermarkPresets.imageOnly(watermarkConfig.imagePath);
          break;
        case 'text':
          watermarkBase64 = await watermarkPresets.textOnly(
            watermarkConfig.text || clinicConfig.branding.watermarkText
          );
          break;
        case 'both':
          watermarkBase64 = await watermarkPresets.combined(
            watermarkConfig.imagePath,
            watermarkConfig.text || clinicConfig.branding.watermarkText
          );
          break;
        case 'auto':
        default:
          watermarkBase64 = await watermarkPresets.smart();
          break;
      }
    } catch (watermarkError) {
      console.warn('⚠️ Watermark generation failed:', watermarkError);
      // Continue without watermark
    }
  }

  const clinicInfo = clinicConfig;
  const showSecurityStrip = clinicConfig.pdf.showSecurityStrip;
  const showQRCode = clinicConfig.pdf.showQRCode;

  // Your existing HTML template with proper escaping and null checks
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Factura - ${report.invoiceNumber || report.id}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background: #fff;
          position: relative;
        }

        ${watermarkBase64 ? `
        body::before {
          content: '';
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          background-image: url('${watermarkBase64}');
          background-repeat: repeat;
          background-size: 300px 75px;
          width: 200%;
          height: 200%;
          opacity: 0.05;
          z-index: -1;
          pointer-events: none;
        }
        ` : ''}

        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: white;
          position: relative;
          z-index: 1;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid ${clinicInfo.branding.primaryColor};
        }

        .practice-info {
          flex: 1;
          display: flex;
          align-items: flex-start;
          gap: 20px;
        }

        .logo-container {
          flex-shrink: 0;
        }

        .logo {
          width: 80px;
          height: auto;
          max-height: 60px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .practice-details-container {
          flex: 1;
        }

        .practice-name {
          font-size: 28px;
          font-weight: bold;
          color: ${clinicInfo.branding.primaryColor};
          margin-bottom: 8px;
        }

        .practice-details {
          color: #6b7280;
          font-size: 14px;
          line-height: 1.4;
        }

        .invoice-info {
          text-align: right;
          flex: 1;
        }

        .invoice-title {
          font-size: 32px;
          font-weight: bold;
          color: ${clinicInfo.branding.primaryColor};
          margin-bottom: 10px;
        }

        .invoice-number {
          font-size: 18px;
          color: #374151;
          margin-bottom: 5px;
        }

        .invoice-date {
          color: #6b7280;
          font-size: 14px;
        }

        .status-badge {
          display: inline-block;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 10px;
        }

        .status-paid { background: #dcfce7; color: #166534; }
        .status-completed { background: #dbeafe; color: #1d4ed8; }
        .status-partially-paid { background: #fef3c7; color: #d97706; }
        .status-draft { background: #f3f4f6; color: #374151; }
        .status-overdue { background: #fee2e2; color: #dc2626; }

        ${showSecurityStrip ? `
        .security-strip {
          position: absolute;
          top: 0;
          right: 0;
          width: 100px;
          height: 20px;
          background: linear-gradient(45deg, ${clinicInfo.branding.primaryColor}, ${clinicInfo.branding.secondaryColor});
          transform: rotate(45deg);
          transform-origin: top right;
          opacity: 0.8;
        }
        ` : ''}

        .document-id {
          position: absolute;
          bottom: 10px;
          right: 20px;
          font-size: 8px;
          color: #9ca3af;
          font-family: monospace;
        }

        .billing-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }

        .billing-info {
          flex: 1;
          margin-right: 40px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 12px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 6px;
        }

        .info-block {
          margin-bottom: 8px;
          font-size: 14px;
          line-height: 1.4;
        }

        .patient-name {
          font-weight: 600;
          color: #1f2937;
          font-size: 16px;
        }

        .services-section {
          margin-bottom: 40px;
        }

        .services-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .services-table th {
          background: #f8fafc;
          padding: 16px 12px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
          font-size: 14px;
        }

        .services-table td {
          padding: 16px 12px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 14px;
        }

        .services-table tr:nth-child(even) {
          background: #f9fafb;
        }

        .service-description {
          font-weight: 500;
          color: #1f2937;
        }

        .service-details {
          color: #6b7280;
          font-size: 12px;
          margin-top: 4px;
        }

        .quantity-cell, .price-cell, .total-cell {
          text-align: right;
          font-weight: 500;
        }

        .total-cell {
          color: #1f2937;
          font-weight: 600;
        }

        .financial-summary {
          margin-top: 40px;
          border-top: 2px solid #e5e7eb;
          padding-top: 20px;
        }

        .summary-table {
          width: 100%;
          max-width: 400px;
          margin-left: auto;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 15px;
        }

        .summary-row.subtotal {
          color: #6b7280;
        }

        .summary-row.discount {
          color: #dc2626;
        }

        .summary-row.tax {
          color: #6b7280;
        }

        .summary-row.total {
          border-top: 2px solid #1f2937;
          margin-top: 12px;
          padding-top: 12px;
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
        }

        .summary-row.paid {
          color: ${clinicInfo.branding.secondaryColor};
          font-weight: 600;
        }

        .summary-row.pending {
          color: #d97706;
          font-weight: 600;
          border-top: 1px solid #e5e7eb;
          margin-top: 8px;
          padding-top: 8px;
        }

        .payments-section {
          margin-top: 40px;
        }

        .payments-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }

        .payments-table th {
          background: #f0f9ff;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: ${clinicInfo.branding.primaryColor};
          border-bottom: 2px solid #bfdbfe;
          font-size: 14px;
        }

        .payments-table td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 14px;
        }

        .payment-amount {
          color: ${clinicInfo.branding.secondaryColor};
          font-weight: 600;
        }

        .notes-section {
          margin-top: 40px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 8px;
          border-left: 4px solid ${clinicInfo.branding.primaryColor};
        }

        .notes-title {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .notes-content {
          color: #4b5563;
          font-size: 14px;
          line-height: 1.6;
        }

        .footer {
          margin-top: 60px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
          position: relative;
        }

        .footer-brand {
          font-weight: 600;
          color: ${clinicInfo.branding.primaryColor};
          margin-bottom: 5px;
        }

        ${showQRCode ? `
        .footer-qr {
          position: absolute;
          right: 0;
          top: 20px;
          width: 60px;
          height: 60px;
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          color: #6b7280;
        }
        ` : ''}

        @media print {
          body { -webkit-print-color-adjust: exact; }
          .invoice-container { margin: 0; padding: 15px; }
        }

        .no-services {
          text-align: center;
          padding: 40px 20px;
          color: #6b7280;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        ${showSecurityStrip ? '<div class="security-strip"></div>' : ''}
        
        <div class="header">
          <div class="practice-info">
            ${logoBase64 ? `
              <div class="logo-container">
                <img src="${logoBase64}" alt="Logo ${clinicInfo.name}" class="logo" />
              </div>
            ` : ''}
            <div class="practice-details-container">
              <div class="practice-name">${clinicInfo.fullName}</div>
              <div class="practice-details">
                ${clinicInfo.address.street}<br>
                ${clinicInfo.address.city}, ${clinicInfo.address.state} ${clinicInfo.address.zipCode}, ${clinicInfo.address.country}<br>
                Tel: ${clinicInfo.contact.phone}${clinicInfo.contact.whatsapp ? ` | WhatsApp: ${clinicInfo.contact.whatsapp}` : ''}<br>
                ${clinicInfo.contact.email}${clinicInfo.contact.website ? ` | ${clinicInfo.contact.website}` : ''}<br>
                ${clinicInfo.legal.rfc ? `<strong>RFC:</strong> ${clinicInfo.legal.rfc}` : ''}${clinicInfo.legal.cedula ? ` | <strong>Cédula:</strong> ${clinicInfo.legal.cedula}` : ''}${clinicInfo.legal.license ? ` | <strong>Licencia:</strong> ${clinicInfo.legal.license}` : ''}
              </div>
            </div>
          </div>
          <div class="invoice-info">
            <div class="invoice-title">NOTA DE CITA</div>
            <div class="invoice-number">
              ${report.invoiceNumber ? `Nº ${report.invoiceNumber}` : `ID: ${report.id?.slice(-8).toUpperCase()}`}
            </div>
            <div class="invoice-date">
              ${formatDate(report.invoiceDate || report.createdAt)}
            </div>
            <div class="status-badge status-${report.status.replace('_', '-')}">
              ${getStatusLabel(report.status)}
            </div>
          </div>
        </div>

        <div class="billing-section">
          <div class="billing-info">
            <div class="section-title">Facturar a:</div>
            <div class="patient-name">${patient.fullName}</div>
            <div class="info-block">${patient.email}</div>
            <div class="info-block">${patient.phone}</div>
            ${patient.address && patient.address.street ? `
              <div class="info-block">
                ${patient.address.street}<br>
                ${patient.address.city}, ${patient.address.state}<br>
                C.P. ${patient.address.zipCode}
              </div>
            ` : ''}
          </div>
          <div class="billing-info">
            <div class="section-title">Doctor/Tratante:</div>
            <div class="info-block"><strong>Dr. ${doctor.displayName}</strong></div>
            <div class="info-block">${doctor.email}</div>
            ${report.dueDate ? `
              <div class="info-block" style="margin-top: 15px;">
                <strong>Fecha de Vencimiento:</strong><br>
                ${formatDate(report.dueDate)}
              </div>
            ` : ''}
          </div>
        </div>

        <div class="services-section">
          <div class="section-title">Servicios Prestados</div>
          ${report.services && report.services.length > 0 ? `
            <table class="services-table">
              <thead>
                <tr>
                  <th style="width: 50%;">Descripción</th>
                  <th style="width: 15%; text-align: center;">Cant.</th>
                  <th style="width: 20%; text-align: right;">Precio Unit.</th>
                  <th style="width: 15%; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${report.services.map((service: BillingService) => `
                  <tr>
                    <td>
                      <div class="service-description">${service.description || 'Servicio'}</div>
                      ${service.procedureCode || service.tooth?.length ? `
                        <div class="service-details">
                          ${service.procedureCode ? `Código: ${service.procedureCode}` : ''}
                          ${service.tooth && service.tooth.length ? ` | Dientes: ${service.tooth.join(', ')}` : ''}
                        </div>
                      ` : ''}
                    </td>
                    <td class="quantity-cell">${service.quantity || 1}</td>
                    <td class="price-cell">${formatCurrency(service.unitPrice || 0)}</td>
                    <td class="total-cell">${formatCurrency(service.total || 0)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : `
            <div class="no-services">
              No hay servicios registrados en este reporte.
            </div>
          `}
        </div>

        <div class="financial-summary">
          <div class="summary-table">
            <div class="summary-row subtotal">
              <span>Subtotal:</span>
              <span>${formatCurrency(report.subtotal)}</span>
            </div>
            ${report.discount > 0 ? `
              <div class="summary-row discount">
                <span>Descuento:</span>
                <span>-${formatCurrency(report.discount)}</span>
              </div>
            ` : ''}
            <div class="summary-row tax">
              <span>IVA (16%):</span>
              <span>${formatCurrency(report.tax)}</span>
            </div>
            <div class="summary-row total">
              <span>TOTAL:</span>
              <span>${formatCurrency(report.total)}</span>
            </div>
            <div class="summary-row paid">
              <span>Pagado:</span>
              <span>${formatCurrency(report.paidAmount)}</span>
            </div>
            ${report.pendingAmount > 0 ? `
              <div class="summary-row pending">
                <span>Pendiente:</span>
                <span>${formatCurrency(report.pendingAmount)}</span>
              </div>
            ` : ''}
          </div>
        </div>

        ${report.payments && report.payments.length > 0 ? `
          <div class="payments-section">
            <div class="section-title">Historial de Pagos</div>
            <table class="payments-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Método</th>
                  <th>Referencia</th>
                  <th style="text-align: right;">Monto</th>
                </tr>
              </thead>
              <tbody>
                ${report.payments.map((payment: BillingPayment) => `
                  <tr>
                    <td>${formatDate(payment.date)}</td>
                    <td>${getPaymentMethodLabel(payment.method)}</td>
                    <td>${payment.reference || '-'}</td>
                    <td class="payment-amount" style="text-align: right;">
                      ${formatCurrency(payment.amount)}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        ${report.notes ? `
          <div class="notes-section">
            <div class="notes-title">Notas y Observaciones:</div>
            <div class="notes-content">${report.notes}</div>
          </div>
        ` : ''}

        <div class="footer">
          <div class="footer-brand">${clinicInfo.fullName}</div>
          <div>${clinicInfo.pdf.footerText || 'Gracias por confiar en nuestros servicios'}</div>
          ${clinicInfo.branding.motto ? `<div style="font-style: italic; margin-top: 5px;">${clinicInfo.branding.motto}</div>` : ''}
          <div style="margin-top: 10px; font-size: 11px;">
            Documento generado el ${new Date().toLocaleDateString('es-MX')} a las ${new Date().toLocaleTimeString('es-MX')}<br>
            Este documento es válido únicamente con sello y firma digital
          </div>
          
          ${showQRCode ? `
          <div class="footer-qr">
            QR<br>
            Verify
          </div>
          ` : ''}
        </div>

        <div class="document-id">
          DOC-ID: ${report.id?.toUpperCase()}-${Date.now().toString().slice(-6)}
        </div>
      </div>
    </body>
    </html>
  `;
}