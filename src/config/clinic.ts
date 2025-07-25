// src/config/clinic.ts - ENHANCED CLINIC CONFIGURATION WITH WATERMARK OPTIONS
export interface ClinicConfig {
  name: string;
  fullName: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contact: {
    phone: string;
    whatsapp?: string;
    email: string;
    website?: string;
  };
  legal: {
    rfc?: string;
    cedula?: string;
    license?: string;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logoPath?: string;
    watermarkText?: string;
    motto?: string;
  };
  pdf: {
    showLogo: boolean;
    showWatermark: boolean;
    showQRCode: boolean;
    showSecurityStrip: boolean;
    footerText?: string;
    // 🆕 NEW: Watermark configuration
    watermark: {
      type: 'image' | 'text' | 'both' | 'none' | 'auto';
      imagePath?: string;
      text?: string;
      opacity?: number;
      size?: 'small' | 'medium' | 'large';
    };
  };
}

// 🎯 CUSTOMIZE THIS FOR YOUR CLINIC
export const clinicConfig: ClinicConfig = {
  // Basic Information
  name: 'Fleurs Dental Health',
  fullName: 'Fleurs Dental Health',
  
  // Address
  address: {
    street: 'Av. Cruz del Sur 3973, Col. Loma Bonita Ejidal',
    city: 'Zapopan',
    state: 'Jalisco',
    zipCode: '45085',
    country: 'México'
  },
  
  // Contact Information
  contact: {
    phone: '(55) 24645101',
    whatsapp: ' (33) 33382410',
    email: 'contacto@fleurs.dental',
    website: 'https://www.fleurs.dental'
  },
  
  // Legal Information (important for Mexican invoices)
  legal: {
    rfc: 'FONS991102BGA',
    cedula: 'PEJ 390724',
    license: ''
  },
  
  // Branding
  branding: {
    primaryColor: '#d07263',    // pink
    secondaryColor: '#059669',  // Green
    logoPath: 'logo.png',       // Put your logo in public/logo.png
    watermarkText: '', // Fallback text
    motto: 'Excelencia en Cuidado Dental'
  },
  
  // PDF Settings
  pdf: {
    showLogo: true,
    showWatermark: true,
    showQRCode: true,
    showSecurityStrip: true,
    footerText: 'Gracias por confiar en nuestros servicios dentales profesionales',
    
    // 🆕 NEW: Flexible watermark configuration
    watermark: {
      type: 'auto',              // 'auto' will choose the best available option
      imagePath: 'watermark.png', // If you have a watermark image
      text: undefined,            // Will use branding.watermarkText if not set
      opacity: 0.08,              // Subtle opacity
      size: 'large'              // Size of watermark
    }
  }
};

// Helper functions to get specific config sections
export const getClinicInfo = () => ({
  name: clinicConfig.name,
  fullName: clinicConfig.fullName,
  address: clinicConfig.address,
  contact: clinicConfig.contact
});

export const getLegalInfo = () => clinicConfig.legal;

export const getBrandingInfo = () => clinicConfig.branding;

export const getPDFSettings = () => clinicConfig.pdf;

export const getWatermarkConfig = () => clinicConfig.pdf.watermark;