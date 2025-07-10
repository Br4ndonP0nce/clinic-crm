// src/components/billing/ReportForm.tsx - PROPERLY TYPED VERSION
"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Calculator,
  AlertCircle,
  Edit,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBillingReport } from "@/hooks/useBilling";
import { useAuth } from "@/hooks/useAuth";
import {
  BillingService,
  MEXICAN_TAX_RATE,
  DentalServiceCategory,
} from "@/types/billing";
import { getPatient } from "@/lib/firebase/db";

interface ReportFormProps {
  reportId?: string;
  onSave: (reportId: string) => void;
  onCancel: () => void;
}

const SERVICE_CATEGORIES: DentalServiceCategory[] = [
  "consultation",
  "preventive",
  "restorative",
  "surgical",
  "cosmetic",
  "orthodontic",
  "periodontal",
  "endodontic",
  "prosthetic",
  "pediatric",
  "emergency",
  "other",
];

const CATEGORY_LABELS: Record<DentalServiceCategory, string> = {
  consultation: "Consulta",
  preventive: "Preventivo (Limpieza, Exámenes)",
  restorative: "Restaurativo (Empastes, Coronas)",
  surgical: "Quirúrgico (Extracciones, Implantes)",
  cosmetic: "Estético (Blanqueamiento, Carillas)",
  orthodontic: "Ortodoncia (Brackets, Alineadores)",
  periodontal: "Periodontal (Tratamiento de Encías)",
  endodontic: "Endodoncia (Tratamiento de Conducto)",
  prosthetic: "Prostodoncia (Prótesis, Dentaduras)",
  pediatric: "Odontopediatría",
  emergency: "Emergencia",
  other: "Otros",
};

export default function ReportForm({
  reportId,
  onSave,
  onCancel,
}: ReportFormProps) {
  const { userProfile } = useAuth();
  const {
    report,
    loading,
    error,
    loadReport,
    updateServices,
    updateNotes,
    completeReport,
  } = useBillingReport(reportId);

  const [patient, setPatient] = useState<any>(null);
  const [services, setServices] = useState<BillingService[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [internalNotes, setInternalNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load report data
  useEffect(() => {
    if (reportId) {
      loadReport(reportId);
    }
  }, [reportId]);

  // Initialize form when report loads
  useEffect(() => {
    const initializeForm = async () => {
      if (!report) return;

      try {
        const patientData = await getPatient(report.patientId);
        setPatient(patientData);

        // Initialize form data with safe defaults
        setServices(report.services || []);
        setDiscount(report.discount || 0);
        setNotes(report.notes || "");
        setInternalNotes(report.internalNotes || "");
        setHasChanges(false);
      } catch (error) {
        console.error("Error loading patient data:", error);
      }
    };

    if (report) {
      initializeForm();
    }
  }, [report]);

  // Calculate totals
  const subtotal = services.reduce(
    (sum, service) => sum + (service.total || 0),
    0
  );
  const tax = Math.round(subtotal * MEXICAN_TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + tax - (discount || 0)) * 100) / 100;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const createNewService = (): BillingService => ({
    id: `service_${Date.now()}`,
    description: "",
    quantity: 1,
    unitPrice: 0,
    total: 0,
    category: "consultation",
    providedBy: report?.doctorId || userProfile?.uid || "",
  });

  const handleAddService = () => {
    const newService = createNewService();
    setServices([...services, newService]);
    setHasChanges(true);
  };

  // 🔧 FIXED: Properly typed update function
  const handleUpdateService = (
    index: number,
    field: keyof BillingService,
    value: string | number | DentalServiceCategory | string[]
  ) => {
    const updatedServices = [...services];
    const service = { ...updatedServices[index] };

    // Type-safe field updates
    switch (field) {
      case "description":
        service.description = String(value || "");
        break;
      case "quantity":
        service.quantity = Math.max(0, Number(value) || 0);
        break;
      case "unitPrice":
        service.unitPrice = Math.max(0, Number(value) || 0);
        break;
      case "category":
        service.category = (value as DentalServiceCategory) || "consultation";
        break;
      case "procedureCode":
        service.procedureCode = value ? String(value) : undefined;
        break;
      case "tooth":
        if (Array.isArray(value)) {
          service.tooth = value.length > 0 ? value : undefined;
        } else if (typeof value === "string" && value.trim()) {
          service.tooth = [value.trim()];
        } else {
          service.tooth = undefined;
        }
        break;
      case "providedBy":
        service.providedBy = String(value || "");
        break;
      default:
        // For other fields, use type assertion
        (service as any)[field] = value;
        break;
    }

    // Recalculate total when quantity or unitPrice changes
    if (field === "quantity" || field === "unitPrice") {
      service.total = service.quantity * service.unitPrice;
    }

    updatedServices[index] = service;
    setServices(updatedServices);
    setHasChanges(true);
  };

  const handleRemoveService = (index: number) => {
    const updatedServices = services.filter((_, i) => i !== index);
    setServices(updatedServices);
    setHasChanges(true);
  };

  const validateForm = (): string | null => {
    if (services.length === 0) {
      return "Debe agregar al menos un servicio";
    }

    for (let i = 0; i < services.length; i++) {
      const service = services[i];
      if (!service.description?.trim()) {
        return `El servicio ${i + 1} debe tener una descripción`;
      }
      if ((service.quantity || 0) <= 0) {
        return `El servicio ${i + 1} debe tener una cantidad válida`;
      }
      if ((service.unitPrice || 0) < 0) {
        return `El servicio ${i + 1} debe tener un precio válido`;
      }
    }

    if ((discount || 0) < 0) {
      return "El descuento no puede ser negativo";
    }

    if ((discount || 0) > subtotal) {
      return "El descuento no puede ser mayor al subtotal";
    }

    return null;
  };

  const handleSave = async () => {
    if (!userProfile?.uid) return;

    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    try {
      setSaving(true);

      // Clean services data before saving
      const cleanServices: BillingService[] = services
        .filter(
          (service) =>
            service.description?.trim() && (service.quantity || 0) > 0
        )
        .map((service) => {
          const cleanService: BillingService = {
            id: service.id || `service_${Date.now()}`,
            description: service.description?.trim() || "",
            quantity: Math.max(0, service.quantity || 0),
            unitPrice: Math.max(0, service.unitPrice || 0),
            total: Math.max(
              0,
              (service.quantity || 0) * (service.unitPrice || 0)
            ),
            category: service.category || "consultation",
            providedBy: service.providedBy || userProfile.uid,
          };

          // Only add optional fields if they have values
          if (service.procedureCode?.trim()) {
            cleanService.procedureCode = service.procedureCode.trim();
          }

          if (service.tooth && service.tooth.length > 0) {
            const cleanTooth = service.tooth
              .filter((t) => t?.trim())
              .map((t) => t.trim());
            if (cleanTooth.length > 0) {
              cleanService.tooth = cleanTooth;
            }
          }

          return cleanService;
        });

      console.log("Saving clean services:", cleanServices);

      // Save services and discount
      await updateServices(cleanServices, Math.max(0, discount || 0));

      // Save notes if changed - ensure we never pass undefined
      const currentNotes = (notes || "").trim();
      const currentInternalNotes = (internalNotes || "").trim();

      if (
        currentNotes !== (report?.notes || "").trim() ||
        currentInternalNotes !== (report?.internalNotes || "").trim()
      ) {
        await updateNotes(currentNotes, currentInternalNotes);
      }

      setHasChanges(false);

      if (reportId) {
        onSave(reportId);
      }
    } catch (error) {
      console.error("Error saving services:", error);
      alert("Error al guardar los servicios. Por favor, intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!userProfile?.uid) return;

    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    try {
      setSaving(true);

      // Clean services data before saving
      const cleanServices: BillingService[] = services
        .filter(
          (service) =>
            service.description?.trim() && (service.quantity || 0) > 0
        )
        .map((service) => {
          const cleanService: BillingService = {
            id: service.id || `service_${Date.now()}`,
            description: service.description?.trim() || "",
            quantity: Math.max(0, service.quantity || 0),
            unitPrice: Math.max(0, service.unitPrice || 0),
            total: Math.max(
              0,
              (service.quantity || 0) * (service.unitPrice || 0)
            ),
            category: service.category || "consultation",
            providedBy: service.providedBy || userProfile.uid,
          };

          // Only add optional fields if they have values
          if (service.procedureCode?.trim()) {
            cleanService.procedureCode = service.procedureCode.trim();
          }

          if (service.tooth && service.tooth.length > 0) {
            const cleanTooth = service.tooth
              .filter((t) => t?.trim())
              .map((t) => t.trim());
            if (cleanTooth.length > 0) {
              cleanService.tooth = cleanTooth;
            }
          }

          return cleanService;
        });

      // Save services and discount first
      await updateServices(cleanServices, Math.max(0, discount || 0));

      // Save notes - ensure we never pass undefined
      const currentNotes = (notes || "").trim();
      const currentInternalNotes = (internalNotes || "").trim();

      if (
        currentNotes !== (report?.notes || "").trim() ||
        currentInternalNotes !== (report?.internalNotes || "").trim()
      ) {
        await updateNotes(currentNotes, currentInternalNotes);
      }

      // Complete the report with cleaned notes
      await completeReport(currentNotes);

      if (reportId) {
        onSave(reportId);
      }
    } catch (error) {
      console.error("Error completing report:", error);
      alert("Error al completar el reporte. Por favor, intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || (reportId && !report)) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error al cargar el reporte
            </h3>
            <p className="text-gray-600 mb-4">
              {error || "No se pudo encontrar el reporte solicitado."}
            </p>
            <Button onClick={onCancel}>Volver</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Edit className="h-6 w-6" />
              {reportId ? "Editar" : "Crear"} Reporte de Facturación
            </h1>
            {report?.invoiceNumber && (
              <p className="text-gray-600 font-mono">#{report.invoiceNumber}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Guardando..." : "Guardar"}
          </Button>

          {(!report || report.status === "draft") && (
            <Button
              onClick={handleComplete}
              disabled={services.length === 0 || saving}
            >
              <FileText className="h-4 w-4 mr-2" />
              Completar Reporte
            </Button>
          )}
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <span className="text-amber-800 font-medium">
              Tienes cambios sin guardar
            </span>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Info */}
          {patient && (
            <Card>
              <CardHeader>
                <CardTitle>Información del Paciente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Nombre:</span>
                    <p className="text-gray-700">{patient.fullName}</p>
                  </div>
                  <div>
                    <span className="font-medium">Email:</span>
                    <p className="text-gray-700">{patient.email}</p>
                  </div>
                  <div>
                    <span className="font-medium">Teléfono:</span>
                    <p className="text-gray-700">{patient.phone}</p>
                  </div>
                  <div>
                    <span className="font-medium">Estado:</span>
                    <p className="text-gray-700">{patient.status}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Servicios
                <Button size="sm" onClick={handleAddService}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Servicio
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {services.length > 0 ? (
                <div className="space-y-4">
                  <AnimatePresence>
                    {services.map((service, index) => (
                      <motion.div
                        key={service.id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="border rounded-lg p-4 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Servicio {index + 1}</h4>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveService(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <Label>Descripción *</Label>
                            <Input
                              value={service.description || ""}
                              onChange={(e) =>
                                handleUpdateService(
                                  index,
                                  "description",
                                  e.target.value
                                )
                              }
                              placeholder="Descripción del servicio"
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label>Categoría</Label>
                            <Select
                              value={service.category || "consultation"}
                              onValueChange={(value: DentalServiceCategory) =>
                                handleUpdateService(index, "category", value)
                              }
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {SERVICE_CATEGORIES.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {CATEGORY_LABELS[category]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Código de Procedimiento</Label>
                            <Input
                              value={service.procedureCode || ""}
                              onChange={(e) =>
                                handleUpdateService(
                                  index,
                                  "procedureCode",
                                  e.target.value
                                )
                              }
                              placeholder="Código (opcional)"
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label>Cantidad *</Label>
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              value={service.quantity || 0}
                              onChange={(e) =>
                                handleUpdateService(
                                  index,
                                  "quantity",
                                  e.target.value
                                )
                              }
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label>Precio Unitario *</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={service.unitPrice || 0}
                              onChange={(e) =>
                                handleUpdateService(
                                  index,
                                  "unitPrice",
                                  e.target.value
                                )
                              }
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-sm text-gray-600">
                            {service.quantity || 0} ×{" "}
                            {formatCurrency(service.unitPrice || 0)}
                          </span>
                          <span className="font-semibold text-lg">
                            {formatCurrency(service.total || 0)}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="mb-4">No hay servicios agregados</p>
                  <Button onClick={handleAddService}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Primer Servicio
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Notas del Cliente</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    setHasChanges(true);
                  }}
                  placeholder="Notas visibles para el cliente..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label>Notas Internas</Label>
                <Textarea
                  value={internalNotes}
                  onChange={(e) => {
                    setInternalNotes(e.target.value);
                    setHasChanges(true);
                  }}
                  placeholder="Notas internas (no visibles para el cliente)..."
                  className="mt-1 bg-yellow-50"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Resumen Financiero
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span>Descuento:</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(discount || 0)}
                    </span>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    max={subtotal}
                    step="0.01"
                    value={discount || 0}
                    onChange={(e) => {
                      setDiscount(parseFloat(e.target.value) || 0);
                      setHasChanges(true);
                    }}
                    placeholder="0.00"
                    className="text-sm"
                  />
                </div>

                <div className="flex justify-between">
                  <span>Impuestos (16%):</span>
                  <span className="font-medium">{formatCurrency(tax)}</span>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              {services.length > 0 && (
                <div className="pt-4 border-t text-sm text-gray-600">
                  <p>
                    {services.length} servicio{services.length !== 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
