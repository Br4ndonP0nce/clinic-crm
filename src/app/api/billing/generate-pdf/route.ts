// src/app/api/billing/generate-pdf/route.ts - ENHANCED WITH LOGO AND WATERMARK
import { NextRequest, NextResponse } from 'next/server';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { getBillingReport } from '@/lib/firebase/billing';
import { getPatient } from '@/lib/firebase/db';
import { getUserProfile } from '@/lib/firebase/rbac';
import { watermarkPresets } from '@/lib/utils/watermark';
import { clinicConfig } from '@/config/clinic';
export const maxDuration = 30; // Vercel function timeout

export async function POST(request: NextRequest) {
  try {
    const { reportId } = await request.json();

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    // Fetch report data
    const report = await getBillingReport(reportId);
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Fetch related data
    const [patient, doctor] = await Promise.all([
      getPatient(report.patientId),
      getUserProfile(report.doctorId)
    ]);

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generateBillingPDF({
      report,
      patient,
      doctor: doctor || { displayName: 'Doctor', email: '' }
    });

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Factura-${report.invoiceNumber || report.id}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      environment: getEnvironmentInfo()
    };
    
    console.error('PDF Generation Error:', errorDetails);

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

async function generateBillingPDF({
  report,
  patient,
  doctor
}: {
  report: any;
  patient: any;
  doctor: any;
}): Promise<Buffer> {
  
  const env = getEnvironmentInfo();
  //console.log('🔍 Environment detected:', env);
  
  let browser = null;
  
  try {
    if (env.isVercel) {
      // VERCEL: Use serverless chromium
      //console.log('🚀 Launching browser on Vercel...');
      
      const chromium = await import('@sparticuz/chromium');
      const puppeteer = await import('puppeteer-core');
      
      browser = await puppeteer.default.launch({
        args: chromium.default.args,
        executablePath: await chromium.default.executablePath(),
        headless: true
      });
      
    } else {
      // LOCAL/OTHER: Use regular puppeteer
     // console.log('💻 Launching browser locally...');
      
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
       // console.log('📦 Regular puppeteer not found, trying puppeteer-core...');
        
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
              //console.log(`✅ Found Chrome/Chromium at: ${path}`);
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

   // console.log('✅ Browser launched successfully');

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600 });
    page.setDefaultTimeout(25000);

   // console.log('📄 Generating HTML content...');
    const htmlContent = await generateInvoiceHTML({ report, patient, doctor });

    //console.log('🔧 Setting page content...');
    await page.setContent(htmlContent, {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });

   // console.log('📋 Generating PDF...');
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

    //console.log('✅ PDF generated successfully');
    return Buffer.from(pdfBuffer);

  } catch (error) {
    console.error('❌ Error in PDF generation:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (browser) {
     // console.log('🔒 Closing browser...');
      await browser.close();
    }
  }
}

// 🆕 ENHANCED: Function to convert image to base64
// Vercel-optimized image loading
// Replace your getImageAsBase64 function with this debug version temporarily
/*async function debugClinicConfig() {
  console.log('🏥 Clinic Config Debug:');
  console.log('PDF showLogo:', clinicConfig.pdf?.showLogo);
  console.log('Branding logoPath:', clinicConfig.branding?.logoPath);
  console.log('Full clinic config:', JSON.stringify(clinicConfig, null, 2));
}*/
async function getImageAsBase64(imagePath: string): Promise<string> {
  //console.log(`🖼️  Loading image: ${imagePath}`);
  
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const fullPath = path.join(process.cwd(), 'public', imagePath);
    //console.log(`📁 Full path: ${fullPath}`);
    
    // Debug: list files in public
    const publicDir = path.join(process.cwd(), 'public');
    if (fs.existsSync(publicDir)) {
      const files = fs.readdirSync(publicDir);
      //console.log(`📂 Files in public:`, files);
    }
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
     // console.log(`❌ Image not found at: ${fullPath}`);
      return generateFallbackLogo();
    }
    
    // Read the file
    const imageBuffer = fs.readFileSync(fullPath);
   // console.log(`✅ Image loaded successfully, size: ${imageBuffer.length} bytes`);
    
    // Get MIME type
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
    
    // Convert to base64
    const base64 = imageBuffer.toString('base64');
    //(`📊 Base64 length: ${base64.length}, MIME: ${mimeType}`);
    
    return `data:${mimeType};base64,${base64}`;
    
  } catch (error) {
    console.error('❌ Error loading image:', error);
    return generateFallbackLogo();
  }
}

function getMimeType(extension?: string): string {
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'svg':
      return 'image/svg+xml';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/png';
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

// 🆕 ENHANCED: Function to generate watermark
function generateWatermarkSvg(text: string = 'CLÍNICA DENTAL'): string {
  const watermarkSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="100" viewBox="0 0 400 100">
      <text x="200" y="50" 
            font-family="Arial, sans-serif" 
            font-size="24" 
            font-weight="bold" 
            fill="#2563eb" 
            fill-opacity="0.1" 
            text-anchor="middle" 
            dominant-baseline="middle"
            transform="rotate(-45 200 50)">
        ${text}
      </text>
    </svg>
  `;
  
  const base64Watermark = Buffer.from(watermarkSvg).toString('base64');
  return `data:image/svg+xml;base64,${base64Watermark}`;
}
export async function GET() {
  try {
    //console.log('🏥 Testing Puppeteer on Vercel...');
    
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true
    });
    
    const page = await browser.newPage();
    await page.setContent('<h1>Test</h1>');
    await browser.close();
    
    return NextResponse.json({
      status: 'healthy',
      puppeteer: 'working',
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
async function generateInvoiceHTML({
  report,
  patient,
  doctor
}: {
  report: any;
  patient: any;
  doctor: any;
    }): Promise<string> {
    // console.log('🏥 Clinic Config Debug:');
  //console.log('- showLogo:', clinicConfig.pdf.showLogo);
  //console.log('- logoPath:', clinicConfig.branding.logoPath);
  //console.log('- primaryColor:', clinicConfig.branding.primaryColor);
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const jsDate = date.toDate ? date.toDate() : new Date(date);
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

  // 🆕 NEW: Get logo and flexible watermark using clinic config
 let logoBase64 = '';
  if (clinicConfig.pdf.showLogo) {
    const logoPath = clinicConfig.branding.logoPath || 'logo.png';
    //console.log(`🖼️  Loading logo from: ${logoPath}`);
    logoBase64 = await getImageAsBase64(logoPath);
    
    if (logoBase64.includes('data:image/svg+xml')) {
      //console.log('⚠️  Using fallback SVG logo - real image failed to load');
    } else {
      //console.log('✅ Real logo loaded successfully');
    }
  } else {
   // console.log('🚫 Logo disabled in clinic config');
  }  
  // 🆕 ENHANCED: Flexible watermark system
  let watermarkBase64 = '';
  if (clinicConfig.pdf.showWatermark) {
    const watermarkConfig = clinicConfig.pdf.watermark;
    
    switch (watermarkConfig.type) {
      case 'image':
        // Image only - no text
        watermarkBase64 = await watermarkPresets.imageOnly(watermarkConfig.imagePath);
        break;
        
      case 'text':
        // Text only - no image
        watermarkBase64 = await watermarkPresets.textOnly(
          watermarkConfig.text || clinicConfig.branding.watermarkText
        );
        break;
        
      case 'both':
        // Both image and text
        watermarkBase64 = await watermarkPresets.combined(
          watermarkConfig.imagePath,
          watermarkConfig.text || clinicConfig.branding.watermarkText
        );
        break;
        
      case 'none':
        // No watermark
        watermarkBase64 = '';
        break;
        
      case 'auto':
      default:
        // Smart detection - use what's available
        watermarkBase64 = await watermarkPresets.smart();
        break;
    }
  }

  // 🆕 NEW: Extract clinic information from config
  const clinicInfo = clinicConfig;
  const showSecurityStrip = clinicConfig.pdf.showSecurityStrip;
  const showQRCode = clinicConfig.pdf.showQRCode;

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
        /* 🆕 NEW: Watermark background */
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

        /* 🆕 ENHANCED: Header with clinic branding */
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

        /* 🆕 NEW: Logo styles */
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

        /* Status Badge */
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
        /* 🆕 NEW: Security elements */
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

        /* Billing Information */
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

        /* Services Table */
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

        /* Financial Summary */
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

        /* Payments Section */
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

        /* Notes Section */
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

        /* 🆕 ENHANCED: Footer with branding */
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

        /* Print Styles */
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .invoice-container { margin: 0; padding: 15px; }
        }

        /* No Services Message */
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
        <!-- 🆕 NEW: Security strip (conditional) -->
        ${showSecurityStrip ? '<div class="security-strip"></div>' : ''}
        
        <!-- 🆕 ENHANCED: Header with clinic configuration -->
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

        <!-- Billing Information -->
        <div class="billing-section">
          <div class="billing-info">
            <div class="section-title">Facturar a:</div>
            <div class="patient-name">${patient.firstName} ${patient.lastName}</div>
            <div class="info-block">${patient.email}</div>
            <div class="info-block">${patient.phone}</div>
            ${patient.address ? `
              <div class="info-block">
                ${patient.address.street}<br>
                ${patient.address.city}, ${patient.address.state}<br>
                C.P. ${patient.address.zipCode}
              </div>
            ` : ''}
          </div>
          <div class="billing-info">
            <div class="section-title">Doctor/Tratante:</div>
            <div class="info-block"><strong>Dr. ${doctor.displayName || 'Doctor'}</strong></div>
            <div class="info-block">${doctor.email || ''}</div>
            ${report.dueDate ? `
              <div class="info-block" style="margin-top: 15px;">
                <strong>Fecha de Vencimiento:</strong><br>
                ${formatDate(report.dueDate)}
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Services -->
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
                ${report.services.map((service: any) => `
                  <tr>
                    <td>
                      <div class="service-description">${service.description}</div>
                      ${service.procedureCode || service.tooth?.length ? `
                        <div class="service-details">
                          ${service.procedureCode ? `Código: ${service.procedureCode}` : ''}
                          ${service.tooth?.length ? ` | Dientes: ${service.tooth.join(', ')}` : ''}
                        </div>
                      ` : ''}
                    </td>
                    <td class="quantity-cell">${service.quantity}</td>
                    <td class="price-cell">${formatCurrency(service.unitPrice)}</td>
                    <td class="total-cell">${formatCurrency(service.total)}</td>
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

        <!-- Financial Summary -->
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

        <!-- Payments -->
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
                ${report.payments.map((payment: any) => `
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

        <!-- Notes -->
        ${report.notes ? `
          <div class="notes-section">
            <div class="notes-title">Notas y Observaciones:</div>
            <div class="notes-content">${report.notes}</div>
          </div>
        ` : ''}

        <!-- 🆕 ENHANCED: Footer with clinic configuration -->
        <div class="footer">
          <div class="footer-brand">${clinicInfo.fullName}</div>
          <div>${clinicInfo.pdf.footerText || 'Gracias por confiar en nuestros servicios'}</div>
          ${clinicInfo.branding.motto ? `<div style="font-style: italic; margin-top: 5px;">${clinicInfo.branding.motto}</div>` : ''}
          <div style="margin-top: 10px; font-size: 11px;">
            Documento generado el ${new Date().toLocaleDateString('es-MX')} a las ${new Date().toLocaleTimeString('es-MX')}<br>
            Este documento es válido únicamente con sello y firma digital
          </div>
          
          <!-- 🆕 NEW: QR Code placeholder (conditional) -->
          ${showQRCode ? `
          <div class="footer-qr">
            QR<br>
            Verify
          </div>
          ` : ''}
        </div>

        <!-- 🆕 NEW: Document ID for tracking -->
        <div class="document-id">
          DOC-ID: ${report.id?.toUpperCase()}-${Date.now().toString().slice(-6)}
        </div>
      </div>
    </body>
    </html>
  `;
}