// src/lib/utils/pdf.ts
import { toast } from 'sonner';

/**
 * Generate and download PDF for a billing report
 */
export const generateBillingPDF = async (
  reportId: string,
  fileName?: string
): Promise<void> => {
  try {
    // Show loading toast
    const loadingToast = toast.loading('Generando PDF...', {
      description: 'Por favor espera mientras se genera el documento'
    });

    // Make API call to generate PDF
    const response = await fetch('/api/billing/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reportId }),
    });

    // Dismiss loading toast
    toast.dismiss(loadingToast);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al generar PDF');
    }

    // Get the PDF blob
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Set filename from response header or use provided/default name
    const contentDisposition = response.headers.get('Content-Disposition');
    const defaultFileName = fileName || `Factura-${reportId.slice(-8)}.pdf`;
    
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
      link.download = fileNameMatch ? fileNameMatch[1] : defaultFileName;
    } else {
      link.download = defaultFileName;
    }
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    // Show success toast
    toast.success('PDF generado exitosamente', {
      description: 'El archivo se ha descargado automáticamente'
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    
    toast.error('Error al generar PDF', {
      description: error instanceof Error ? error.message : 'Ocurrió un error inesperado'
    });
    
    throw error;
  }
};

/**
 * Generate PDF for multiple billing reports (bulk export)
 */
export const generateBulkBillingPDF = async (
  reportIds: string[],
  fileName?: string
): Promise<void> => {
  try {
    if (reportIds.length === 0) {
      toast.error('No hay reportes seleccionados');
      return;
    }

    if (reportIds.length === 1) {
      // Use single report generation for single report
      return await generateBillingPDF(reportIds[0], fileName);
    }

    const loadingToast = toast.loading('Generando PDFs...', {
      description: `Procesando ${reportIds.length} reportes`
    });

    // For multiple reports, we'll generate them one by one
    // In a production environment, you might want to implement a bulk API endpoint
    const promises = reportIds.map((reportId, index) => 
      generateSingleReportForBulk(reportId, index + 1)
    );

    await Promise.all(promises);
    
    toast.dismiss(loadingToast);
    toast.success('PDFs generados exitosamente', {
      description: `Se han descargado ${reportIds.length} archivos`
    });

  } catch (error) {
    console.error('Error generating bulk PDFs:', error);
    toast.error('Error al generar PDFs', {
      description: 'Algunos archivos pueden no haberse generado correctamente'
    });
  }
};

/**
 * Helper function for bulk PDF generation
 */
const generateSingleReportForBulk = async (
  reportId: string, 
  sequence: number
): Promise<void> => {
  const fileName = `Factura-${sequence.toString().padStart(3, '0')}-${reportId.slice(-8)}.pdf`;
  return generateBillingPDF(reportId, fileName);
};

/**
 * Preview PDF in new tab (without downloading)
 */
export const previewBillingPDF = async (reportId: string): Promise<void> => {
  try {
    const loadingToast = toast.loading('Preparando vista previa...', {
      description: 'Generando documento para visualización'
    });

    const response = await fetch('/api/billing/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reportId }),
    });

    toast.dismiss(loadingToast);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al generar vista previa');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    // Open in new tab
    const newWindow = window.open(url, '_blank');
    
    if (!newWindow) {
      // Fallback to download if popup blocked
      toast.warning('Vista previa bloqueada', {
        description: 'Se descargará el archivo en su lugar'
      });
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `Vista-Previa-${reportId.slice(-8)}.pdf`;
      link.click();
    } else {
      toast.success('Vista previa abierta', {
        description: 'El documento se abrió en una nueva pestaña'
      });
    }

    // Cleanup after a delay (give time for the window to load)
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 5000);

  } catch (error) {
    console.error('Error previewing PDF:', error);
    toast.error('Error en vista previa', {
      description: error instanceof Error ? error.message : 'Ocurrió un error inesperado'
    });
  }
};

/**
 * Validate report before PDF generation
 */
export const validateReportForPDF = (report: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!report) {
    errors.push('Reporte no encontrado');
    return { isValid: false, errors };
  }

  if (!report.services || report.services.length === 0) {
    errors.push('El reporte no tiene servicios registrados');
  }

  if (report.status === 'draft') {
    errors.push('No se puede generar PDF de un reporte en borrador');
  }

  if (!report.total || report.total <= 0) {
    errors.push('El reporte no tiene un total válido');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get PDF generation status for UI
 */
export const getPDFGenerationStatus = (report: any): {
  canGenerate: boolean;
  canPreview: boolean;
  reason?: string;
} => {
  const validation = validateReportForPDF(report);

  if (!validation.isValid) {
    return {
      canGenerate: false,
      canPreview: false,
      reason: validation.errors.join(', ')
    };
  }

  return {
    canGenerate: true,
    canPreview: true
  };
};