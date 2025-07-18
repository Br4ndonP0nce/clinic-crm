// src/components/billing/AddExpenseModal.tsx
"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Upload,
  FileText,
  X,
  AlertCircle,
  DollarSign,
  Receipt,
  Calendar as CalendarIcon,
  Building,
  Tag,
  FileImage,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ExpenseCategory, getExpenseCategoryLabel } from "@/types/billing";

// Types
interface ExpenseFormData {
  description: string;
  amount: string;
  category: ExpenseCategory;
  date: string;
  vendor: string;
  receiptNumber: string;
  deductible: boolean;
  notes: string;
}

interface AddExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (expenseData: any) => Promise<void>;
  isLoading?: boolean;
  title?: string;
  description?: string;
  defaultCategory?: ExpenseCategory;
  defaultDate?: string;
  triggerRefresh?: () => void;
}

// Form validation
const validateForm = (
  formData: ExpenseFormData
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!formData.description.trim()) {
    errors.push("La descripción es obligatoria");
  }

  if (!formData.amount || parseFloat(formData.amount) <= 0) {
    errors.push("El monto debe ser mayor a 0");
  }

  if (parseFloat(formData.amount) > 999999) {
    errors.push("El monto no puede ser mayor a $999,999");
  }

  if (!formData.date) {
    errors.push("La fecha es obligatoria");
  }

  // Validate future dates (optional business rule)
  const selectedDate = new Date(formData.date);
  const today = new Date();
  const maxFutureDate = new Date();
  maxFutureDate.setDate(today.getDate() + 30); // Allow up to 30 days in future

  if (selectedDate > maxFutureDate) {
    errors.push("La fecha no puede ser más de 30 días en el futuro");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Quick amount presets for common expense amounts
const QUICK_AMOUNTS = [
  { label: "$100", value: 100 },
  { label: "$500", value: 500 },
  { label: "$1,000", value: 1000 },
  { label: "$2,500", value: 2500 },
  { label: "$5,000", value: 5000 },
];

// Common expense categories with descriptions
const EXPENSE_CATEGORIES = [
  {
    value: "office_supplies",
    label: "Material de Oficina",
    description: "Papelería, formas, material de limpieza",
    icon: "📄",
  },
  {
    value: "dental_supplies",
    label: "Material Dental",
    description: "Instrumentos, materiales de restauración",
    icon: "🦷",
  },
  {
    value: "equipment",
    label: "Equipo",
    description: "Equipos médicos, mantenimiento",
    icon: "🔧",
  },
  {
    value: "laboratory",
    label: "Laboratorio",
    description: "Servicios de laboratorio dental",
    icon: "🧪",
  },
  {
    value: "utilities",
    label: "Servicios Públicos",
    description: "Luz, agua, gas, internet",
    icon: "💡",
  },
  {
    value: "rent",
    label: "Renta",
    description: "Renta del consultorio, espacios",
    icon: "🏢",
  },
  {
    value: "marketing",
    label: "Marketing",
    description: "Publicidad, promoción, sitio web",
    icon: "📢",
  },
  {
    value: "continuing_education",
    label: "Educación Continua",
    description: "Cursos, certificaciones, conferencias",
    icon: "🎓",
  },
  {
    value: "insurance",
    label: "Seguros",
    description: "Seguro médico, responsabilidad civil",
    icon: "🛡️",
  },
  {
    value: "professional_services",
    label: "Servicios Profesionales",
    description: "Contabilidad, legal, consultoría",
    icon: "👔",
  },
  {
    value: "travel",
    label: "Viajes",
    description: "Viajes de negocios, conferencias",
    icon: "✈️",
  },
  {
    value: "meals",
    label: "Comidas de Negocio",
    description: "Comidas con clientes, eventos",
    icon: "🍽️",
  },
  {
    value: "software",
    label: "Software",
    description: "Licencias, suscripciones digitales",
    icon: "💻",
  },
  {
    value: "maintenance",
    label: "Mantenimiento",
    description: "Mantenimiento de instalaciones",
    icon: "🔨",
  },
  {
    value: "taxes",
    label: "Impuestos",
    description: "Impuestos y contribuciones",
    icon: "📊",
  },
  {
    value: "other",
    label: "Otros",
    description: "Gastos no clasificados",
    icon: "📦",
  },
] as const;

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  title = "Registrar Nuevo Gasto",
  description = "Completa la información del gasto para registrarlo en el sistema.",
  defaultCategory = "office_supplies",
  defaultDate,
  triggerRefresh,
}) => {
  const [formData, setFormData] = useState<ExpenseFormData>({
    description: "",
    amount: "",
    category: defaultCategory,
    date: defaultDate || new Date().toISOString().split("T")[0],
    vendor: "",
    receiptNumber: "",
    deductible: true,
    notes: "",
  });

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setSubmissionError(null);
      setValidationErrors([]);
    } else {
      resetForm();
    }
  }, [open]);

  // Auto-set date if defaultDate changes
  useEffect(() => {
    if (defaultDate) {
      setFormData((prev) => ({ ...prev, date: defaultDate }));
    }
  }, [defaultDate]);

  const resetForm = () => {
    setFormData({
      description: "",
      amount: "",
      category: defaultCategory,
      date: defaultDate || new Date().toISOString().split("T")[0],
      vendor: "",
      receiptNumber: "",
      deductible: true,
      notes: "",
    });
    setSubmissionError(null);
    setValidationErrors([]);
  };

  const handleQuickAmount = (amount: number) => {
    setFormData((prev) => ({ ...prev, amount: amount.toString() }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validation = validateForm(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors([]);
    setShowConfirmation(true);
  };

  const handleConfirmedSubmit = async () => {
    try {
      setSubmissionError(null);

      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
        date: new Date(formData.date),
      };

      await onSubmit(expenseData);

      // Success - close modal and reset
      setShowConfirmation(false);
      onOpenChange(false);

      // Trigger refresh if provided
      if (triggerRefresh) {
        triggerRefresh();
      }
    } catch (error) {
      console.error("Error submitting expense:", error);
      setSubmissionError(
        error instanceof Error ? error.message : "Error al registrar el gasto"
      );
      setShowConfirmation(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const selectedCategory = EXPENSE_CATEGORIES.find(
    (cat) => cat.value === formData.category
  );

  return (
    <>
      {/* Main Modal */}
      <Dialog
        open={open && !showConfirmation}
        onOpenChange={(isOpen) => {
          if (!isLoading) {
            onOpenChange(isOpen);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              {title}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Display */}
            <AnimatePresence>
              {(validationErrors.length > 0 || submissionError) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">
                      {submissionError
                        ? "Error de envío"
                        : "Errores de validación"}
                    </span>
                  </div>
                  {submissionError && (
                    <p className="text-sm text-red-700">{submissionError}</p>
                  )}
                  {validationErrors.length > 0 && (
                    <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Description */}
              <div className="md:col-span-2">
                <Label
                  htmlFor="description"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Descripción *
                </Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Ej: Materiales de oficina, factura #123"
                  required
                  className="mt-1"
                />
              </div>

              {/* Amount with Quick Presets */}
              <div>
                <Label htmlFor="amount" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Monto *
                </Label>
                <div className="space-y-2">
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    max="999999"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    placeholder="0.00"
                    required
                    className="mt-1"
                  />
                  <div className="flex flex-wrap gap-1">
                    {QUICK_AMOUNTS.map((preset) => (
                      <Button
                        key={preset.value}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAmount(preset.value)}
                        className="text-xs h-6 px-2"
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category" className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Categoría *
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      category: value as ExpenseCategory,
                    })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {EXPENSE_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        <div className="flex items-center gap-2">
                          <span>{category.icon}</span>
                          <div>
                            <div className="font-medium">{category.label}</div>
                            <div className="text-xs text-gray-500">
                              {category.description}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCategory && (
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedCategory.description}
                  </p>
                )}
              </div>

              {/* Date */}
              <div>
                <Label htmlFor="date" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Fecha *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                  className="mt-1"
                />
              </div>

              {/* Vendor */}
              <div>
                <Label htmlFor="vendor" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Proveedor
                </Label>
                <Input
                  id="vendor"
                  value={formData.vendor}
                  onChange={(e) =>
                    setFormData({ ...formData, vendor: e.target.value })
                  }
                  placeholder="Nombre del proveedor"
                  className="mt-1"
                />
              </div>

              {/* Receipt Number */}
              <div>
                <Label
                  htmlFor="receiptNumber"
                  className="flex items-center gap-2"
                >
                  <Receipt className="h-4 w-4" />
                  Número de Recibo
                </Label>
                <Input
                  id="receiptNumber"
                  value={formData.receiptNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, receiptNumber: e.target.value })
                  }
                  placeholder="Número de factura/recibo"
                  className="mt-1"
                />
              </div>

              {/* Tax Deductible Checkbox */}
              <div className="md:col-span-2">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Checkbox
                    id="deductible"
                    checked={formData.deductible}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, deductible: !!checked })
                    }
                  />
                  <div>
                    <Label
                      htmlFor="deductible"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Deducible de impuestos
                    </Label>
                    <p className="text-xs text-gray-600 mt-1">
                      Marcar si este gasto es deducible para efectos fiscales
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <Label htmlFor="notes">Notas adicionales</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Observaciones, detalles adicionales del gasto..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Summary Preview */}
            {formData.amount && parseFloat(formData.amount) > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gray-50 rounded-lg border"
              >
                <h4 className="font-medium mb-2">Resumen del Gasto</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Monto:</span>
                    <span className="ml-2 font-semibold text-red-600">
                      {formatCurrency(parseFloat(formData.amount))}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Categoría:</span>
                    <span className="ml-2 font-semibold">
                      {selectedCategory?.label}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Fecha:</span>
                    <span className="ml-2 font-semibold">
                      {new Date(formData.date).toLocaleDateString("es-MX")}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Deducible:</span>
                    <span className="ml-2 font-semibold">
                      {formData.deductible ? "Sí" : "No"}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  "Registrar Gasto"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Registro de Gasto</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>¿Estás seguro de que deseas registrar este gasto?</p>

              <div className="p-3 bg-gray-50 rounded-lg mt-3">
                <div className="space-y-1 text-sm">
                  <div>
                    <strong>Descripción:</strong> {formData.description}
                  </div>
                  <div>
                    <strong>Monto:</strong>{" "}
                    {formatCurrency(parseFloat(formData.amount))}
                  </div>
                  <div>
                    <strong>Categoría:</strong> {selectedCategory?.label}
                  </div>
                  <div>
                    <strong>Fecha:</strong>{" "}
                    {new Date(formData.date).toLocaleDateString("es-MX")}
                  </div>
                  {formData.vendor && (
                    <div>
                      <strong>Proveedor:</strong> {formData.vendor}
                    </div>
                  )}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Revisar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmedSubmit}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Confirmar Registro"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AddExpenseModal;
