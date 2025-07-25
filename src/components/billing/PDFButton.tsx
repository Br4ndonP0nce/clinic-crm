// src/components/billing/PDFButton.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Download,
  FileText,
  Eye,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import {
  generateBillingPDF,
  previewBillingPDF,
  getPDFGenerationStatus,
} from "@/lib/utils/pdf";
import type { BillingReport } from "@/types/billing";

interface PDFButtonProps {
  report: BillingReport;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  showDropdown?: boolean;
  className?: string;
}

export const PDFButton: React.FC<PDFButtonProps> = ({
  report,
  variant = "outline",
  size = "md",
  showDropdown = true,
  className = "",
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const status = getPDFGenerationStatus(report);

  const handleGeneratePDF = async () => {
    if (!status.canGenerate) return;

    try {
      setIsGenerating(true);
      await generateBillingPDF(report.id!, getFileName());
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewPDF = async () => {
    if (!status.canPreview) return;

    try {
      setIsPreviewing(true);
      await previewBillingPDF(report.id!);
    } catch (error) {
      console.error("Error previewing PDF:", error);
    } finally {
      setIsPreviewing(false);
    }
  };

  const getFileName = () => {
    if (report.invoiceNumber) {
      return `Factura-${report.invoiceNumber}.pdf`;
    }
    return `Reporte-${report.id?.slice(-8)}.pdf`;
  };

  const getButtonSize = () => {
    switch (size) {
      case "sm":
        return "sm";
      case "lg":
        return "lg";
      default:
        return "default";
    }
  };

  // Simple button for disabled state
  if (!status.canGenerate && !status.canPreview) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={getButtonSize()}
              disabled
              className={className}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>No se puede generar PDF: {status.reason}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Dropdown button with options
  if (showDropdown) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={getButtonSize()}
            disabled={isGenerating || isPreviewing}
            className={className}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                Generando...
              </>
            ) : isPreviewing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                Cargando...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                PDF
                <ChevronDown className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={handleGeneratePDF}
            disabled={!status.canGenerate}
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handlePreviewPDF}
            disabled={!status.canPreview}
          >
            <Eye className="h-4 w-4 mr-2" />
            Vista Previa
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
            {getFileName()}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Simple download button
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={getButtonSize()}
            onClick={handleGeneratePDF}
            disabled={!status.canGenerate || isGenerating}
            className={className}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                Generando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Descargar factura como PDF</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Bulk PDF Generation Component
interface BulkPDFButtonProps {
  reportIds: string[];
  selectedReports?: BillingReport[];
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const BulkPDFButton: React.FC<BulkPDFButtonProps> = ({
  reportIds,
  selectedReports = [],
  variant = "outline",
  size = "md",
  className = "",
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleBulkGenerate = async () => {
    if (reportIds.length === 0) return;

    try {
      setIsGenerating(true);
      const { generateBulkBillingPDF } = await import("@/lib/utils/pdf");
      await generateBulkBillingPDF(reportIds);
    } catch (error) {
      console.error("Error generating bulk PDFs:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case "sm":
        return "sm";
      case "lg":
        return "lg";
      default:
        return "default";
    }
  };

  const canGenerate = reportIds.length > 0;
  const validReports = selectedReports.filter((report) => {
    const status = getPDFGenerationStatus(report);
    return status.canGenerate;
  });

  const hasInvalidReports = selectedReports.length > validReports.length;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={getButtonSize()}
            onClick={handleBulkGenerate}
            disabled={!canGenerate || isGenerating || validReports.length === 0}
            className={className}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                Generando {reportIds.length} PDFs...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar PDFs ({reportIds.length})
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {!canGenerate ? (
            <p>Selecciona reportes para exportar</p>
          ) : hasInvalidReports ? (
            <p>
              Se generarán {validReports.length} de {reportIds.length} PDFs
              válidos
            </p>
          ) : (
            <p>Descargar {reportIds.length} facturas como PDF</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Quick PDF Preview Component (for tables/lists)
interface QuickPDFPreviewProps {
  reportId: string;
  triggerClassName?: string;
}

export const QuickPDFPreview: React.FC<QuickPDFPreviewProps> = ({
  reportId,
  triggerClassName = "",
}) => {
  const [isPreviewing, setIsPreviewing] = useState(false);

  const handleQuickPreview = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row clicks in tables

    try {
      setIsPreviewing(true);
      await previewBillingPDF(reportId);
    } catch (error) {
      console.error("Error in quick preview:", error);
    } finally {
      setIsPreviewing(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleQuickPreview}
            disabled={isPreviewing}
            className={`h-8 w-8 p-0 ${triggerClassName}`}
          >
            {isPreviewing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Vista rápida del PDF</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
