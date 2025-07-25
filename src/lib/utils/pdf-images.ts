// src/lib/utils/pdf-images.ts - UTILITY FOR MANAGING PDF IMAGES
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Convert image file to base64 data URL
 */
export async function getImageAsBase64(imagePath: string): Promise<string> {
  try {
    // For Next.js, images should be in the public folder
    const fullPath = join(process.cwd(), 'public', imagePath);
    
    // Read the file
    const imageBuffer = readFileSync(fullPath);
    
    // Determine MIME type based on file extension
    const extension = imagePath.split('.').pop()?.toLowerCase();
    let mimeType = 'image/png'; // default
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'png':
        mimeType = 'image/png';
        break;
      case 'gif':
        mimeType = 'image/gif';
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
    return `data:${mimeType};base64,${base64}`;
    
  } catch (error) {
    console.error(`Error loading image ${imagePath}:`, error);
    // Return fallback SVG logo if file not found
    return generateFallbackLogo();
  }
}

/**
 * Generate a fallback SVG logo if no image is provided
 */
export function generateFallbackLogo(
  clinicName: string = 'CLÍNICA DENTAL',
  primaryColor: string = '#2563eb'
): string {
  const logoSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="60" viewBox="0 0 120 60">
      <!-- Background -->
      <rect width="120" height="60" fill="${primaryColor}" rx="8"/>
      
      <!-- Clinic name -->
      <text x="60" y="22" 
            font-family="Arial, sans-serif" 
            font-size="11" 
            font-weight="bold" 
            fill="white" 
            text-anchor="middle">
        ${clinicName.split(' ')[0]}
      </text>
      <text x="60" y="38" 
            font-family="Arial, sans-serif" 
            font-size="10" 
            fill="white" 
            text-anchor="middle">
        ${clinicName.split(' ').slice(1).join(' ')}
      </text>
      
      <!-- Dental icons -->
      <circle cx="25" cy="30" r="6" fill="white" opacity="0.9"/>
      <circle cx="95" cy="30" r="6" fill="white" opacity="0.9"/>
      
      <!-- Small dental cross -->
      <path d="M58 28 h4 v4 h-4 z M60 26 h0 v8" 
            stroke="white" 
            stroke-width="1" 
            fill="white" 
            opacity="0.8"/>
    </svg>
  `;
  
  const base64Logo = Buffer.from(logoSvg).toString('base64');
  return `data:image/svg+xml;base64,${base64Logo}`;
}

/**
 * Generate watermark SVG
 */
export function generateWatermarkSvg(
  text: string = 'CLÍNICA DENTAL',
  opacity: number = 0.08,
  color: string = '#2563eb'
): string {
  const watermarkSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="100" viewBox="0 0 400 100">
      <text x="200" y="50" 
            font-family="Arial, sans-serif" 
            font-size="20" 
            font-weight="bold" 
            fill="${color}" 
            fill-opacity="${opacity}" 
            text-anchor="middle" 
            dominant-baseline="middle">
        ${text}
      </text>
    </svg>
  `;
  
  const base64Watermark = Buffer.from(watermarkSvg).toString('base64');
  return `data:image/svg+xml;base64,${base64Watermark}`;
}

/**
 * Generate QR code placeholder (you can integrate with a real QR library)
 */
export function generateQRCodeSvg(
  data: string,
  size: number = 60
): string {
  // Simple QR placeholder - you can replace with actual QR generation
  const qrSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="white" stroke="#d1d5db" stroke-width="1"/>
      
      <!-- QR pattern simulation -->
      <rect x="5" y="5" width="8" height="8" fill="#1f2937"/>
      <rect x="47" y="5" width="8" height="8" fill="#1f2937"/>
      <rect x="5" y="47" width="8" height="8" fill="#1f2937"/>
      
      <!-- Center pattern -->
      <rect x="26" y="26" width="8" height="8" fill="#1f2937"/>
      
      <!-- Data patterns -->
      <rect x="18" y="18" width="2" height="2" fill="#1f2937"/>
      <rect x="22" y="18" width="2" height="2" fill="#1f2937"/>
      <rect x="26" y="18" width="2" height="2" fill="#1f2937"/>
      <rect x="18" y="22" width="2" height="2" fill="#1f2937"/>
      <rect x="26" y="22" width="2" height="2" fill="#1f2937"/>
      <rect x="18" y="26" width="2" height="2" fill="#1f2937"/>
      <rect x="22" y="26" width="2" height="2" fill="#1f2937"/>
      
      <!-- More data patterns -->
      <rect x="38" y="18" width="2" height="2" fill="#1f2937"/>
      <rect x="42" y="18" width="2" height="2" fill="#1f2937"/>
      <rect x="38" y="22" width="2" height="2" fill="#1f2937"/>
      <rect x="42" y="22" width="2" height="2" fill="#1f2937"/>
      
      <!-- Label -->
      <text x="${size/2}" y="${size-8}" 
            font-family="Arial, sans-serif" 
            font-size="6" 
            fill="#6b7280" 
            text-anchor="middle">
        VERIFY
      </text>
    </svg>
  `;
  
  const base64QR = Buffer.from(qrSvg).toString('base64');
  return `data:image/svg+xml;base64,${base64QR}`;
}

/**
 * Get clinic configuration for PDF branding
 */
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
  };
  legal: {
    rfc?: string;
    cedula?: string;
  };
  branding: {
    primaryColor: string;
    logoPath?: string;
    watermarkText?: string;
  };
}

export const getClinicConfig = (): ClinicConfig => {
  return {
    name: 'CLÍNICA DENTAL',
    fullName: 'Clínica Dental Excellence',
    address: {
      street: 'Av. Revolución #1234, Col. Centro',
      city: 'Zapopan',
      state: 'Jalisco',
      zipCode: '45000',
      country: 'México'
    },
    contact: {
      phone: '+52 (33) 1234-5678',
      whatsapp: '+52 (33) 8765-4321',
      email: 'contacto@clinicaexcellence.com'
    },
    legal: {
      rfc: 'CDE123456ABC',
      cedula: '1234567'
    },
    branding: {
      primaryColor: '#2563eb',
      logoPath: 'logo.png', // Put your logo in public/logo.png
      watermarkText: 'CLÍNICA DENTAL EXCELLENCE'
    }
  };
};

/**
 * Optimize image for PDF (resize and compress)
 */
export function optimizeImageForPDF(
  base64Image: string,
  maxWidth: number = 200,
  maxHeight: number = 100
): string {
  // This is a simplified version - in production you might want to use
  // an image processing library like sharp or canvas
  
  // For now, just return the original image
  // You can implement actual resizing here if needed
  return base64Image;
}

/**
 * Validate image file before processing
 */
export function validateImageFile(imagePath: string): {
  isValid: boolean;
  error?: string;
} {
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'svg', 'webp'];
  const extension = imagePath.split('.').pop()?.toLowerCase();
  
  if (!extension || !allowedExtensions.includes(extension)) {
    return {
      isValid: false,
      error: `Formato de imagen no soportado. Use: ${allowedExtensions.join(', ')}`
    };
  }
  
  try {
    const fullPath = join(process.cwd(), 'public', imagePath);
    const stats = require('fs').statSync(fullPath);
    
    // Check file size (max 5MB)
    if (stats.size > 5 * 1024 * 1024) {
      return {
        isValid: false,
        error: 'El archivo es demasiado grande (máximo 5MB)'
      };
    }
    
    return { isValid: true };
    
  } catch (error) {
    return {
      isValid: false,
      error: `Archivo no encontrado: ${imagePath}`
    };
  }
}

/**
 * Generate security patterns for document verification
 */
export function generateSecurityPattern(): string {
  const patternSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="20" viewBox="0 0 100 20">
      <defs>
        <linearGradient id="securityGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#2563eb;stop-opacity:0.8" />
          <stop offset="50%" style="stop-color:#1d4ed8;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1e40af;stop-opacity:0.8" />
        </linearGradient>
      </defs>
      <rect width="100" height="20" fill="url(#securityGrad)"/>
      <text x="50" y="13" 
            font-family="Arial, sans-serif" 
            font-size="8" 
            fill="white" 
            text-anchor="middle">
        ORIGINAL
      </text>
    </svg>
  `;
  
  const base64Pattern = Buffer.from(patternSvg).toString('base64');
  return `data:image/svg+xml;base64,${base64Pattern}`;
}