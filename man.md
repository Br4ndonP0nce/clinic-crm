# 🎨 PDF Customization Guide

## 🖼️ **Adding Your Logo**

### **Step 1: Prepare Your Logo**

1. **Recommended size**: 200x100 pixels (2:1 ratio)
2. **Supported formats**: PNG, JPG, SVG, WebP
3. **File size**: Maximum 2MB
4. **Background**: Transparent PNG works best

### **Step 2: Add Logo to Your Project**

```bash
# Place your logo in the public folder
public/
  └── logo.png          # Your clinic logo
  └── logo-white.png    # White version for dark backgrounds (optional)
  └── watermark.png     # Custom watermark (optional)
```

### **Step 3: Update Configuration**

Edit `src/config/clinic.ts`:

```typescript
export const clinicConfig: ClinicConfig = {
  // ... other config
  branding: {
    primaryColor: "#your-brand-color",
    logoPath: "logo.png", // ← Change this to your logo filename
    watermarkText: "YOUR CLINIC NAME",
  },
};
```

## 🎯 **Customization Options**

### **1. Clinic Information**

```typescript
// In src/config/clinic.ts
{
  name: 'TU CLÍNICA',                    // Short name for headers
  fullName: 'Tu Clínica Dental S.A.',   // Full legal name

  address: {
    street: 'Tu Dirección #123',
    city: 'Tu Ciudad',
    state: 'Tu Estado',
    zipCode: '12345',
    country: 'México'
  },

  contact: {
    phone: '+52 (33) 1234-5678',
    whatsapp: '+52 (33) 8765-4321',    // Optional
    email: 'contacto@tuclinica.com',
    website: 'www.tuclinica.com'        // Optional
  }
}
```

### **2. Legal Information (Important for Mexico)**

```typescript
legal: {
  rfc: 'ABC123456DEF',      // RFC (Registro Federal de Contribuyentes)
  cedula: '1234567',        // Professional license number
  license: 'SS-12345'       // Health department license
}
```

### **3. Brand Colors**

```typescript
branding: {
  primaryColor: '#2563eb',    // Main brand color (headers, accents)
  secondaryColor: '#059669',  // Secondary color (paid amounts, success)
  watermarkText: 'YOUR CLINIC NAME OFFICIAL'
}
```

### **4. PDF Features**

```typescript
pdf: {
  showLogo: true,           // Show logo in header
  showWatermark: true,      // Background watermark
  showQRCode: true,         // QR code for verification
  showSecurityStrip: true,  // Security element
  footerText: 'Custom footer message'
}
```

## 🛠️ **Advanced Customization**

### **Custom Watermark**

If you want to use a custom watermark image instead of text:

1. **Add watermark image** to `public/watermark.png`
2. **Update the PDF generation** in `src/app/api/billing/generate-pdf/route.ts`:

```typescript
// Replace the generateWatermarkSvg() call with:
const watermarkBase64 = await getImageAsBase64("watermark.png");
```

### **Multiple Logo Versions**

For different document types or themes:

```typescript
// In your PDF generation
const logoPath =
  report.status === "paid"
    ? "logo-success.png" // Green version for paid invoices
    : "logo.png"; // Standard version

const logoBase64 = await getImageAsBase64(logoPath);
```

### **Custom QR Codes**

To add real QR codes for invoice verification:

```bash
npm install qrcode
```

```typescript
import QRCode from "qrcode";

const generateQRCode = async (data: string) => {
  try {
    const qrDataUrl = await QRCode.toDataURL(data, {
      width: 60,
      margin: 1,
      color: {
        dark: "#1f2937",
        light: "#ffffff",
      },
    });
    return qrDataUrl;
  } catch (error) {
    return generateQRCodeSvg(data); // Fallback
  }
};

// Use in PDF generation
const qrData = `${process.env.NEXT_PUBLIC_APP_URL}/verify/${report.id}`;
const qrCode = await generateQRCode(qrData);
```

## 🎨 **Design Templates**

### **Modern Dental Clinic**

```typescript
branding: {
  primaryColor: '#0ea5e9',      // Sky blue
  secondaryColor: '#10b981',    // Emerald green
  watermarkText: 'MODERN DENTAL CARE'
}
```

### **Professional Medical**

```typescript
branding: {
  primaryColor: '#1e40af',      // Deep blue
  secondaryColor: '#059669',    // Medical green
  watermarkText: 'PROFESSIONAL DENTAL SERVICES'
}
```

### **Elegant Luxury**

```typescript
branding: {
  primaryColor: '#7c3aed',      // Purple
  secondaryColor: '#d97706',    // Amber
  watermarkText: 'LUXURY DENTAL EXPERIENCE'
}
```

## 📋 **Testing Your Customization**

### **1. Test PDF Generation**

```bash
# Generate a test PDF to see your changes
curl -X POST http://localhost:3000/api/billing/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{"reportId":"your-test-report-id"}' \
  --output test-invoice.pdf
```

### **2. Preview Changes**

1. Create a test billing report
2. Generate PDF using the UI
3. Check logo placement, colors, and branding
4. Verify all clinic information is correct

### **3. Logo Quality Check**

- ✅ **Resolution**: Logo appears crisp at print size
- ✅ **Contrast**: Logo is visible against header background
- ✅ **Alignment**: Logo aligns properly with clinic name
- ✅ **Size**: Logo doesn't overpower other elements

## 🚨 **Troubleshooting**

### **Logo Not Showing**

```typescript
// Check if file exists and path is correct
const logoPath = "logo.png"; // Must be in public/ folder
const fullPath = join(process.cwd(), "public", logoPath);
console.log("Logo path:", fullPath);
```

### **Colors Not Applied**

```typescript
// Ensure color format is correct
primaryColor: '#2563eb',  // ✅ Correct hex format
primaryColor: '2563eb',   // ❌ Missing #
primaryColor: 'blue',     // ❌ Use hex codes
```

### **Watermark Too Prominent**

```typescript
// Adjust opacity in generateWatermarkSvg
fill-opacity="0.05"  // Very subtle
fill-opacity="0.10"  // Medium
fill-opacity="0.15"  // More visible
```

## 📱 **Mobile & Print Optimization**

The PDF is automatically optimized for:

- ✅ **A4 paper size** (210 × 297 mm)
- ✅ **Print quality** (300 DPI equivalent)
- ✅ **Mobile viewing** (responsive elements)
- ✅ **Screen readers** (semantic HTML)
- ✅ **Professional appearance** (consistent spacing)

## 🔐 **Security Features Included**

1. **Document ID** - Unique tracking number
2. **Security Strip** - Visual authenticity element
3. **Watermark** - Background branding protection
4. **QR Code** - Digital verification (optional)
5. **Generation Timestamp** - Document creation time

## 🎯 **Next Steps**

1. ✅ **Add your logo** to `public/logo.png`
2. ✅ **Update clinic config** in `src/config/clinic.ts`
3. ✅ **Test PDF generation** with a sample report
4. ✅ **Adjust colors and branding** as needed
5. ✅ **Train staff** on the new PDF features

Your branded PDF invoices are now ready for professional use! 🎉
