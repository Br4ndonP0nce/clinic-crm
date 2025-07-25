// src/lib/utils/watermark.ts - FLEXIBLE WATERMARK SYSTEM
import { getImageAsBase64, generateWatermarkSvg } from './pdf-images';
import { clinicConfig } from '@/config/clinic';
export interface WatermarkConfig {
  type: 'image' | 'text' | 'both' | 'none';
  imagePath?: string;
  text?: string;
  opacity?: number;
  rotation?: number;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Generate watermark based on configuration
 */
export async function generateWatermark(config?: WatermarkConfig): Promise<string> {
  // Use default config if none provided
  const watermarkConfig: WatermarkConfig = {
    type: 'text', // default
    text: clinicConfig.branding.watermarkText,
    opacity: 0.08,
    rotation: -45,
    size: 'medium',
    ...config
  };

  switch (watermarkConfig.type) {
    case 'none':
      return '';

    case 'image':
      return await generateImageWatermark(watermarkConfig);

    case 'text':
      return generateTextWatermark(watermarkConfig);

    case 'both':
      return await generateCombinedWatermark(watermarkConfig);

    default:
      return '';
  }
}

/**
 * Generate image-only watermark
 */
async function generateImageWatermark(config: WatermarkConfig): Promise<string> {
  try {
    if (!config.imagePath) {
      console.warn('Image watermark requested but no imagePath provided');
      return '';
    }

    // Try to load the image
    const imageBase64 = await getImageAsBase64(config.imagePath);
    
    if (!imageBase64) {
      console.warn(`Watermark image not found: ${config.imagePath}`);
      return '';
    }

    // Create SVG wrapper for the image watermark
    const size = getSizeValues(config.size || 'medium');
    const opacity = config.opacity || 0.08;
    const rotation = config.rotation || -45;

    const watermarkSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" 
           width="${size.width}" 
           height="${size.height}" 
           viewBox="0 0 ${size.width} ${size.height}">
        <defs>
          <pattern id="imagePattern" 
                   patternUnits="userSpaceOnUse" 
                   width="${size.width}" 
                   height="${size.height}">
            <image href="${imageBase64}" 
                   width="${size.width}" 
                   height="${size.height}" 
                   opacity="${opacity}"
                   transform="rotate(${rotation} ${size.width/2} ${size.height/2})"/>
          </pattern>
        </defs>
        <rect width="100%" 
              height="100%" 
              fill="url(#imagePattern)"/>
      </svg>
    `;

    const base64Watermark = Buffer.from(watermarkSvg).toString('base64');
    return `data:image/svg+xml;base64,${base64Watermark}`;

  } catch (error) {
    console.error('Error generating image watermark:', error);
    return '';
  }
}

/**
 * Generate text-only watermark
 */
function generateTextWatermark(config: WatermarkConfig): string {
  const text = config.text || clinicConfig.branding.watermarkText || 'CLÍNICA DENTAL';
  const opacity = config.opacity || 0.08;
  const rotation = config.rotation || -45;
  const size = getSizeValues(config.size || 'medium');

  return generateWatermarkSvg(text, opacity, clinicConfig.branding.primaryColor);
}

/**
 * Generate combined image + text watermark
 */
async function generateCombinedWatermark(config: WatermarkConfig): Promise<string> {
  try {
    const text = config.text || clinicConfig.branding.watermarkText || 'CLÍNICA DENTAL';
    const opacity = config.opacity || 0.08;
    const rotation = config.rotation || -45;
    const size = getSizeValues(config.size || 'medium');

    let imageElement = '';
    
    // Add image if path provided
    if (config.imagePath) {
      const imageBase64 = await getImageAsBase64(config.imagePath);
      if (imageBase64) {
        imageElement = `
          <image href="${imageBase64}" 
                 x="${size.width/2 - 30}" 
                 y="${size.height/2 - 40}" 
                 width="60" 
                 height="40" 
                 opacity="${opacity * 1.5}"
                 transform="rotate(${rotation} ${size.width/2} ${size.height/2})"/>
        `;
      }
    }

    const watermarkSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" 
           width="${size.width}" 
           height="${size.height}" 
           viewBox="0 0 ${size.width} ${size.height}">
        ${imageElement}
        <text x="${size.width/2}" 
              y="${size.height/2 + 25}" 
              font-family="Arial, sans-serif" 
              font-size="18" 
              font-weight="bold" 
              fill="${clinicConfig.branding.primaryColor}" 
              fill-opacity="${opacity}" 
              text-anchor="middle" 
              dominant-baseline="middle"
              transform="rotate(${rotation} ${size.width/2} ${size.height/2})">
          ${text}
        </text>
      </svg>
    `;

    const base64Watermark = Buffer.from(watermarkSvg).toString('base64');
    return `data:image/svg+xml;base64,${base64Watermark}`;

  } catch (error) {
    console.error('Error generating combined watermark:', error);
    return generateTextWatermark(config);
  }
}

/**
 * Get size values based on size setting
 */
function getSizeValues(size: 'small' | 'medium' | 'large') {
  switch (size) {
    case 'small':
      return { width: 300, height: 75, fontSize: 16 };
    case 'large':
      return { width: 500, height: 125, fontSize: 24 };
    default: // medium
      return { width: 400, height: 100, fontSize: 20 };
  }
}

/**
 * Smart watermark detection - automatically choose best option
 */
export async function getSmartWatermark(): Promise<string> {
  // Check if custom watermark image exists
  const hasWatermarkImage = await checkImageExists('watermark.png');
  const hasWatermarkText = clinicConfig.branding.watermarkText;

  if (hasWatermarkImage && hasWatermarkText) {
    // Both available - use combined
    return generateWatermark({
      type: 'both',
      imagePath: 'watermark.png',
      text: clinicConfig.branding.watermarkText
    });
  } else if (hasWatermarkImage) {
    // Only image available - use image only
    return generateWatermark({
      type: 'image',
      imagePath: 'watermark.png'
    });
  } else if (hasWatermarkText) {
    // Only text available - use text only
    return generateWatermark({
      type: 'text',
      text: clinicConfig.branding.watermarkText
    });
  } else {
    // Nothing configured - no watermark
    return generateWatermark({ type: 'none' });
  }
}

/**
 * Check if image file exists
 */
async function checkImageExists(imagePath: string): Promise<boolean> {
  try {
    const { join } = await import('path');
    const { existsSync } = await import('fs');
    const fullPath = join(process.cwd(), 'public', imagePath);
    return existsSync(fullPath);
  } catch {
    return false;
  }
}

/**
 * Export convenience functions for different watermark types
 */
export const watermarkPresets = {
  // Image only (no text)
  imageOnly: (imagePath: string = 'watermark.png') => 
    generateWatermark({ type: 'image', imagePath }),

  // Text only (no image)
  textOnly: (text?: string) => 
    generateWatermark({ type: 'text', text }),

  // Both image and text
  combined: (imagePath: string = 'watermark.png', text?: string) => 
    generateWatermark({ type: 'both', imagePath, text }),

  // No watermark
  none: () => 
    generateWatermark({ type: 'none' }),

  // Auto-detect best option
  smart: () => 
    getSmartWatermark()
};