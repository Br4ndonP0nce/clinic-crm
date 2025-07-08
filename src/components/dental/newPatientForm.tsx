import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { addPatient, Patient } from "@/lib/firebase/db";
import { Timestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  User,
  MapPin,
  Heart,
  Stethoscope,
  Shield,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Phone,
  Mail,
  CreditCard,
  FileText,
  Bone,
  Plus,
  X,
} from "lucide-react";
import Odontogram, { OdontogramData } from "@/components/dental/odonthogram";

interface NewPatientFormData {
  // Basic Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  alternatePhone: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other" | "prefer_not_to_say";

  // Address
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;

  // Emergency Contact
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;

  // Insurance
  hasInsurance: boolean;
  insuranceProvider: string;
  policyNumber: string;
  groupNumber: string;
  subscriberName: string;
  relationToSubscriber: string;

  // Medical History
  allergies: string[];
  medications: string[];
  medicalConditions: string[];
  surgeries: string[];
  primaryPhysician: string;
  lastPhysicalExam: string;

  // Dental History
  lastVisit: string;
  lastCleaning: string;
  previousDentist: string;
  reasonForVisit: string;
  oralHygiene: "excellent" | "good" | "fair" | "poor";
  brushingFrequency: "twice_daily" | "daily" | "few_times_week" | "rarely";
  flossingFrequency: "daily" | "few_times_week" | "weekly" | "rarely" | "never";
  currentProblems: string[];
  painLevel: number;

  // Preferences
  preferredTimeSlots: string[];
  preferredDays: string[];
  communicationMethod: "email" | "phone" | "text" | "app";
  reminderEmail: boolean;
  reminderSms: boolean;
  reminderDays: number;

  // Financial
  paymentMethod: "insurance" | "cash" | "card" | "payment_plan";

  // Consents
  treatmentConsent: boolean;
  privacyPolicy: boolean;
  marketingEmails: boolean;

  // Notes
  notes: string;
}

const initialFormData: NewPatientFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  alternatePhone: "",
  dateOfBirth: "",
  gender: "prefer_not_to_say",
  street: "",
  city: "",
  state: "",
  zipCode: "",
  country: "México",
  emergencyName: "",
  emergencyRelationship: "",
  emergencyPhone: "",
  hasInsurance: false,
  insuranceProvider: "",
  policyNumber: "",
  groupNumber: "",
  subscriberName: "",
  relationToSubscriber: "",
  allergies: [],
  medications: [],
  medicalConditions: [],
  surgeries: [],
  primaryPhysician: "",
  lastPhysicalExam: "",
  lastVisit: "",
  lastCleaning: "",
  previousDentist: "",
  reasonForVisit: "",
  oralHygiene: "good",
  brushingFrequency: "twice_daily",
  flossingFrequency: "daily",
  currentProblems: [],
  painLevel: 0,
  preferredTimeSlots: [],
  preferredDays: [],
  communicationMethod: "email",
  reminderEmail: true,
  reminderSms: false,
  reminderDays: 1,
  paymentMethod: "insurance",
  treatmentConsent: false,
  privacyPolicy: false,
  marketingEmails: false,
  notes: "",
};

const FORM_STEPS = [
  { id: "basic", title: "Información Básica", icon: User },
  { id: "address", title: "Dirección y Contacto", icon: MapPin },
  { id: "medical", title: "Historial Médico", icon: Heart },
  { id: "dental", title: "Historial Dental", icon: Stethoscope },
  { id: "odontogram", title: "Odontograma", icon: Bone },
  { id: "preferences", title: "Preferencias", icon: Calendar },
  { id: "financial", title: "Información Financiera", icon: CreditCard },
  { id: "consents", title: "Consentimientos", icon: Shield },
  { id: "review", title: "Revisión Final", icon: CheckCircle },
];

export default function NewPatientForm() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<NewPatientFormData>(initialFormData);
  const [odontogramData, setOdontogramData] = useState<OdontogramData>({
    teeth: {},
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-save draft (optional feature)
  useEffect(() => {
    const draftKey = "newPatientDraft";
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setFormData(draft.formData || initialFormData);
        setOdontogramData(draft.odontogramData || { teeth: {} });
      } catch (error) {
        console.error("Error loading draft:", error);
      }
    }
  }, []);

  // Save draft on form changes
  useEffect(() => {
    const draftKey = "newPatientDraft";
    const draft = { formData, odontogramData };
    localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [formData, odontogramData]);

  const updateFormData = (field: keyof NewPatientFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const addArrayItem = (field: keyof NewPatientFormData, item: string) => {
    if (!item.trim()) return;
    const currentArray = formData[field] as string[];
    if (!currentArray.includes(item.trim())) {
      updateFormData(field, [...currentArray, item.trim()]);
    }
  };

  const removeArrayItem = (field: keyof NewPatientFormData, index: number) => {
    const currentArray = formData[field] as string[];
    updateFormData(
      field,
      currentArray.filter((_, i) => i !== index)
    );
  };

  const validateStep = (stepIndex: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (stepIndex) {
      case 0: // Basic Info
        if (!formData.firstName.trim())
          newErrors.firstName = "Nombre es requerido";
        if (!formData.lastName.trim())
          newErrors.lastName = "Apellido es requerido";
        if (!formData.email.trim()) newErrors.email = "Email es requerido";
        else if (!/\S+@\S+\.\S+/.test(formData.email))
          newErrors.email = "Email inválido";
        if (!formData.phone.trim()) newErrors.phone = "Teléfono es requerido";
        if (!formData.dateOfBirth)
          newErrors.dateOfBirth = "Fecha de nacimiento es requerida";
        break;
      case 1: // Address
        if (!formData.street.trim())
          newErrors.street = "Dirección es requerida";
        if (!formData.city.trim()) newErrors.city = "Ciudad es requerida";
        if (!formData.state.trim()) newErrors.state = "Estado es requerido";
        if (!formData.emergencyName.trim())
          newErrors.emergencyName = "Contacto de emergencia es requerido";
        if (!formData.emergencyPhone.trim())
          newErrors.emergencyPhone = "Teléfono de emergencia es requerido";
        break;
      case 2: // Medical History - No required fields, all optional
        // Medical history is optional for new patients
        break;
      case 3: // Dental History - Make reason for visit optional since it's a new patient
        if (!formData.reasonForVisit.trim()) {
          // Set default reason if empty
          updateFormData("reasonForVisit", "Consulta inicial - Paciente nuevo");
        }
        break;
      case 4: // Odontogram - Optional
        // Odontogram is optional for initial intake
        break;

      case 5: // Preferences - No required fields
        // All preferences are optional
        break;

      case 6: // Financial Information - No required fields
        // Payment method selection is optional
        break;
      case 7: // Consents
        if (!formData.treatmentConsent)
          newErrors.treatmentConsent =
            "Debe aceptar el consentimiento de tratamiento";
        if (!formData.privacyPolicy)
          newErrors.privacyPolicy = "Debe aceptar la política de privacidad";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, FORM_STEPS.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      // Convert form data to Patient interface
      const patientData: Omit<
        Patient,
        "id" | "createdAt" | "updatedAt" | "fullName"
      > = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        // Only include alternatePhone if it has a value
        ...(formData.alternatePhone && {
          alternatePhone: formData.alternatePhone,
        }),
        dateOfBirth: Timestamp.fromDate(new Date(formData.dateOfBirth)),
        gender: formData.gender,

        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
        },

        emergencyContact: {
          name: formData.emergencyName,
          relationship: formData.emergencyRelationship,
          phone: formData.emergencyPhone,
        },

        insurance: {
          isActive: formData.hasInsurance,
          // Only include insurance fields if hasInsurance is true
          ...(formData.hasInsurance && {
            provider: formData.insuranceProvider,
            policyNumber: formData.policyNumber,
            groupNumber: formData.groupNumber,
            subscriberName: formData.subscriberName,
            relationToSubscriber: formData.relationToSubscriber,
          }),
        },

        medicalHistory: {
          allergies: formData.allergies,
          medications: formData.medications,
          medicalConditions: formData.medicalConditions,
          surgeries: formData.surgeries,
          // Only include if they have values
          ...(formData.primaryPhysician && {
            primaryPhysician: formData.primaryPhysician,
          }),
          ...(formData.lastPhysicalExam && {
            lastPhysicalExam: Timestamp.fromDate(
              new Date(formData.lastPhysicalExam)
            ),
          }),
        },

        dentalHistory: {
          // Only include dates if they have values
          ...(formData.lastVisit && {
            lastVisit: Timestamp.fromDate(new Date(formData.lastVisit)),
          }),
          ...(formData.lastCleaning && {
            lastCleaning: Timestamp.fromDate(new Date(formData.lastCleaning)),
          }),
          ...(formData.previousDentist && {
            previousDentist: formData.previousDentist,
          }),
          reasonForVisit: formData.reasonForVisit,
          oralHygiene: formData.oralHygiene,
          brushingFrequency: formData.brushingFrequency,
          flossingFrequency: formData.flossingFrequency,
          currentProblems: formData.currentProblems,
          // Only include painLevel if it's greater than 0
          ...(formData.painLevel > 0 && { painLevel: formData.painLevel }),
        },

        status: "inquiry",

        preferences: {
          preferredTimeSlots: formData.preferredTimeSlots,
          preferredDays: formData.preferredDays,
          communicationMethod: formData.communicationMethod,
          reminderPreferences: {
            email: formData.reminderEmail,
            sms: formData.reminderSms,
            days: formData.reminderDays,
          },
        },

        financial: {
          paymentMethod: formData.paymentMethod,
          balance: 0,
        },

        createdBy: userProfile?.uid || "unknown",
        notes: formData.notes,
        statusHistory: [],

        consents: {
          treatmentConsent: formData.treatmentConsent,
          privacyPolicy: formData.privacyPolicy,
          marketingEmails: formData.marketingEmails,
          // Only include dateSigned if both consents are true
          ...(formData.treatmentConsent &&
            formData.privacyPolicy && {
              dateSigned: Timestamp.now(),
            }),
        },
      };

      // Add patient to database
      const patientId = await addPatient(patientData);

      // TODO: Save odontogram data separately if needed
      // You might want to create a separate collection for odontograms
      // or add it as a subcollection under the patient

      // Clear draft
      localStorage.removeItem("newPatientDraft");

      // Redirect to patient details
      router.push(`/admin/patients/${patientId}`);
    } catch (error) {
      console.error("Error creating patient:", error);
      setErrors({
        submit: "Error al crear el paciente. Por favor intenta de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Information
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Nombre *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateFormData("firstName", e.target.value)}
                  placeholder="Juan"
                  className={errors.firstName ? "border-red-500" : ""}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="lastName">Apellido *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateFormData("lastName", e.target.value)}
                  placeholder="Pérez"
                  className={errors.lastName ? "border-red-500" : ""}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  placeholder="juan.perez@email.com"
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Teléfono *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateFormData("phone", e.target.value)}
                  placeholder="+52 33 1234 5678"
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="alternatePhone">Teléfono Alternativo</Label>
                <Input
                  id="alternatePhone"
                  value={formData.alternatePhone}
                  onChange={(e) =>
                    updateFormData("alternatePhone", e.target.value)
                  }
                  placeholder="+52 33 8765 4321"
                />
              </div>

              <div>
                <Label htmlFor="dateOfBirth">Fecha de Nacimiento *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    updateFormData("dateOfBirth", e.target.value)
                  }
                  className={errors.dateOfBirth ? "border-red-500" : ""}
                />
                {errors.dateOfBirth && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.dateOfBirth}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label>Género</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {[
                  { value: "male", label: "Masculino" },
                  { value: "female", label: "Femenino" },
                  { value: "other", label: "Otro" },
                  { value: "prefer_not_to_say", label: "Prefiero no decir" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateFormData("gender", option.value)}
                    className={`p-2 border rounded-lg text-sm ${
                      formData.gender === option.value
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 1: // Address and Emergency Contact
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Dirección
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="street">Dirección *</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => updateFormData("street", e.target.value)}
                    placeholder="Calle Nombre #123, Colonia"
                    className={errors.street ? "border-red-500" : ""}
                  />
                  {errors.street && (
                    <p className="text-red-500 text-sm mt-1">{errors.street}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">Ciudad *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => updateFormData("city", e.target.value)}
                      placeholder="Guadalajara"
                      className={errors.city ? "border-red-500" : ""}
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="state">Estado *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => updateFormData("state", e.target.value)}
                      placeholder="Jalisco"
                      className={errors.state ? "border-red-500" : ""}
                    />
                    {errors.state && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.state}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="zipCode">Código Postal</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) =>
                        updateFormData("zipCode", e.target.value)
                      }
                      placeholder="44100"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="country">País</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => updateFormData("country", e.target.value)}
                    placeholder="México"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Contacto de Emergencia
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergencyName">Nombre *</Label>
                    <Input
                      id="emergencyName"
                      value={formData.emergencyName}
                      onChange={(e) =>
                        updateFormData("emergencyName", e.target.value)
                      }
                      placeholder="María Pérez"
                      className={errors.emergencyName ? "border-red-500" : ""}
                    />
                    {errors.emergencyName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.emergencyName}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="emergencyRelationship">Relación</Label>
                    <Input
                      id="emergencyRelationship"
                      value={formData.emergencyRelationship}
                      onChange={(e) =>
                        updateFormData("emergencyRelationship", e.target.value)
                      }
                      placeholder="Esposa, Hermano, Padre, etc."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="emergencyPhone">Teléfono *</Label>
                  <Input
                    id="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={(e) =>
                      updateFormData("emergencyPhone", e.target.value)
                    }
                    placeholder="+52 33 8765 4321"
                    className={errors.emergencyPhone ? "border-red-500" : ""}
                  />
                  {errors.emergencyPhone && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.emergencyPhone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Seguro Médico
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="hasInsurance"
                    checked={formData.hasInsurance}
                    onChange={(e) =>
                      updateFormData("hasInsurance", e.target.checked)
                    }
                    className="rounded"
                  />
                  <Label htmlFor="hasInsurance">Tengo seguro médico</Label>
                </div>

                {formData.hasInsurance && (
                  <div className="space-y-4 border-l-4 border-blue-200 pl-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="insuranceProvider">
                          Proveedor de Seguro
                        </Label>
                        <Input
                          id="insuranceProvider"
                          value={formData.insuranceProvider}
                          onChange={(e) =>
                            updateFormData("insuranceProvider", e.target.value)
                          }
                          placeholder="IMSS, ISSSTE, Seguros Monterrey, etc."
                        />
                      </div>

                      <div>
                        <Label htmlFor="policyNumber">Número de Póliza</Label>
                        <Input
                          id="policyNumber"
                          value={formData.policyNumber}
                          onChange={(e) =>
                            updateFormData("policyNumber", e.target.value)
                          }
                          placeholder="123456789"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="subscriberName">
                          Nombre del Titular
                        </Label>
                        <Input
                          id="subscriberName"
                          value={formData.subscriberName}
                          onChange={(e) =>
                            updateFormData("subscriberName", e.target.value)
                          }
                          placeholder="Nombre completo del titular"
                        />
                      </div>

                      <div>
                        <Label htmlFor="relationToSubscriber">
                          Relación con el Titular
                        </Label>
                        <select
                          id="relationToSubscriber"
                          value={formData.relationToSubscriber}
                          onChange={(e) =>
                            updateFormData(
                              "relationToSubscriber",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Seleccionar...</option>
                          <option value="self">Yo mismo</option>
                          <option value="spouse">Cónyuge</option>
                          <option value="child">Hijo/a</option>
                          <option value="parent">Padre/Madre</option>
                          <option value="other">Otro</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 2: // Medical History
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Heart className="h-5 w-5 mr-2" />
              Historial Médico
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Allergies */}
              <div>
                <Label htmlFor="allergiesText">Alergias</Label>
                <Textarea
                  id="allergiesText"
                  value={formData.allergies.join("\n")}
                  onChange={(e) =>
                    updateFormData(
                      "allergies",
                      e.target.value.split("\n").filter((item) => item.trim())
                    )
                  }
                  placeholder="Lista cada alergia en una línea nueva:&#10;Penicilina&#10;Látex&#10;Mariscos"
                  rows={4}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separe cada alergia en una línea nueva
                </p>
              </div>

              {/* Previous Surgeries */}
              <div>
                <Label htmlFor="surgeriesText">Cirugías Previas</Label>
                <Textarea
                  id="surgeriesText"
                  value={formData.surgeries.join("\n")}
                  onChange={(e) =>
                    updateFormData(
                      "surgeries",
                      e.target.value.split("\n").filter((item) => item.trim())
                    )
                  }
                  placeholder="Lista cada cirugía con año:&#10;Apendicectomía 2020&#10;Cesárea 2018"
                  rows={4}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separe cada cirugía en una línea nueva
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Medications */}
              <div>
                <Label htmlFor="medicationsText">Medicamentos Actuales</Label>
                <Textarea
                  id="medicationsText"
                  value={formData.medications.join("\n")}
                  onChange={(e) =>
                    updateFormData(
                      "medications",
                      e.target.value.split("\n").filter((item) => item.trim())
                    )
                  }
                  placeholder="Lista medicamentos con dosis:&#10;Aspirina 100mg diario&#10;Metformina 500mg 2x día"
                  rows={4}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Incluya dosis y frecuencia si es posible
                </p>
              </div>

              {/* Medical Conditions */}
              <div>
                <Label htmlFor="conditionsText">Condiciones Médicas</Label>
                <Textarea
                  id="conditionsText"
                  value={formData.medicalConditions.join("\n")}
                  onChange={(e) =>
                    updateFormData(
                      "medicalConditions",
                      e.target.value.split("\n").filter((item) => item.trim())
                    )
                  }
                  placeholder="Lista condiciones médicas:&#10;Diabetes tipo 2&#10;Hipertensión&#10;Asma"
                  rows={4}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Condiciones médicas crónicas o relevantes
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primaryPhysician">Médico de Cabecera</Label>
                <Input
                  id="primaryPhysician"
                  value={formData.primaryPhysician}
                  onChange={(e) =>
                    updateFormData("primaryPhysician", e.target.value)
                  }
                  placeholder="Dr. Juan López"
                />
              </div>

              <div>
                <Label htmlFor="lastPhysicalExam">Último Examen Físico</Label>
                <Input
                  id="lastPhysicalExam"
                  type="date"
                  value={formData.lastPhysicalExam}
                  onChange={(e) =>
                    updateFormData("lastPhysicalExam", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                Información Importante
              </h4>
              <p className="text-sm text-blue-800">
                Esta información médica es confidencial y solo será compartida
                con el personal autorizado. Nos ayuda a brindar un tratamiento
                dental más seguro y personalizado.
              </p>
            </div>
          </div>
        );

      case 3: // Dental History
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Stethoscope className="h-5 w-5 mr-2" />
              Historial Dental
            </h3>

            {/* Check if this is a new patient or has existing history */}
            <div className="bg-amber-50 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900">Paciente Nuevo</h4>
                  <p className="text-sm text-amber-800 mt-1">
                    Este es un paciente nuevo. El historial dental se construirá
                    durante las consultas. Complete la información básica
                    disponible.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="lastVisit">Última Visita al Dentista</Label>
                <Input
                  id="lastVisit"
                  type="date"
                  value={formData.lastVisit}
                  onChange={(e) => updateFormData("lastVisit", e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Dejar vacío si es primera visita dental
                </p>
              </div>

              <div>
                <Label htmlFor="lastCleaning">Última Limpieza</Label>
                <Input
                  id="lastCleaning"
                  type="date"
                  value={formData.lastCleaning}
                  onChange={(e) =>
                    updateFormData("lastCleaning", e.target.value)
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Dejar vacío si nunca ha tenido
                </p>
              </div>

              <div>
                <Label htmlFor="previousDentist">Dentista Anterior</Label>
                <Input
                  id="previousDentist"
                  value={formData.previousDentist}
                  onChange={(e) =>
                    updateFormData("previousDentist", e.target.value)
                  }
                  placeholder="Dr. Ana García"
                />
                <p className="text-xs text-gray-500 mt-1">Opcional</p>
              </div>
            </div>

            <div>
              <Label htmlFor="reasonForVisit">Motivo de la Visita Actual</Label>
              <Textarea
                id="reasonForVisit"
                value={formData.reasonForVisit}
                onChange={(e) =>
                  updateFormData("reasonForVisit", e.target.value)
                }
                placeholder="Ej: Dolor en muela, limpieza rutinaria, revisión general, consulta preventiva..."
                rows={3}
                className={errors.reasonForVisit ? "border-red-500" : ""}
              />
              <p className="text-xs text-gray-500 mt-1">
                Describa el motivo principal de esta consulta
              </p>
              {errors.reasonForVisit && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.reasonForVisit}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Higiene Oral Auto-reportada</Label>
                <select
                  value={formData.oralHygiene}
                  onChange={(e) =>
                    updateFormData("oralHygiene", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                >
                  <option value="excellent">Excelente</option>
                  <option value="good">Buena</option>
                  <option value="fair">Regular</option>
                  <option value="poor">Deficiente</option>
                </select>
              </div>

              <div>
                <Label>Frecuencia de Cepillado</Label>
                <select
                  value={formData.brushingFrequency}
                  onChange={(e) =>
                    updateFormData("brushingFrequency", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                >
                  <option value="twice_daily">Dos veces al día</option>
                  <option value="daily">Una vez al día</option>
                  <option value="few_times_week">
                    Varias veces por semana
                  </option>
                  <option value="rarely">Raramente</option>
                </select>
              </div>

              <div>
                <Label>Frecuencia de Hilo Dental</Label>
                <select
                  value={formData.flossingFrequency}
                  onChange={(e) =>
                    updateFormData("flossingFrequency", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                >
                  <option value="daily">Diariamente</option>
                  <option value="few_times_week">
                    Varias veces por semana
                  </option>
                  <option value="weekly">Semanalmente</option>
                  <option value="rarely">Raramente</option>
                  <option value="never">Nunca</option>
                </select>
              </div>
            </div>

            <div>
              <Label>Problemas Dentales Actuales</Label>
              <Textarea
                value={formData.currentProblems.join("\n")}
                onChange={(e) =>
                  updateFormData(
                    "currentProblems",
                    e.target.value.split("\n").filter((item) => item.trim())
                  )
                }
                placeholder="Describa cualquier problema dental actual:&#10;Dolor en muela superior derecha&#10;Sangrado de encías&#10;Sensibilidad al frío"
                rows={3}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separe cada problema en una línea nueva. Dejar vacío si no hay
                problemas.
              </p>
            </div>

            <div>
              <Label htmlFor="painLevel">Nivel de Dolor Actual (0-10)</Label>
              <div className="mt-2">
                <input
                  type="range"
                  id="painLevel"
                  min="0"
                  max="10"
                  value={formData.painLevel}
                  onChange={(e) =>
                    updateFormData("painLevel", parseInt(e.target.value))
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>Sin dolor (0)</span>
                  <span className="font-medium">
                    Nivel actual: {formData.painLevel}
                  </span>
                  <span>Dolor severo (10)</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                Nota Importante
              </h4>
              <p className="text-sm text-blue-800">
                Durante la consulta inicial, el doctor completará un examen
                dental completo y actualizará el historial con hallazgos
                clínicos y recomendaciones de tratamiento.
              </p>
            </div>
          </div>
        );

      case 4: // Odontogram
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Bone className="h-5 w-5 mr-2" />
              Odontograma Inicial
            </h3>
            <p className="text-gray-600 mb-4">
              Registre el estado inicial de los dientes del paciente. Puede
              hacerlo ahora o completarlo después durante la consulta.
            </p>

            <Odontogram
              data={odontogramData}
              onDataChange={setOdontogramData}
              recordedBy={userProfile?.displayName || userProfile?.email}
              showNotes={true}
            />
          </div>
        );

      case 5: // Preferences
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Preferencias de Citas
            </h3>

            <div>
              <Label>Horarios Preferidos</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {["morning", "afternoon", "evening", "weekend"].map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => {
                      const current = formData.preferredTimeSlots;
                      if (current.includes(slot)) {
                        updateFormData(
                          "preferredTimeSlots",
                          current.filter((s) => s !== slot)
                        );
                      } else {
                        updateFormData("preferredTimeSlots", [
                          ...current,
                          slot,
                        ]);
                      }
                    }}
                    className={`p-2 border rounded-lg text-sm ${
                      formData.preferredTimeSlots.includes(slot)
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {slot === "morning" && "Mañana"}
                    {slot === "afternoon" && "Tarde"}
                    {slot === "evening" && "Noche"}
                    {slot === "weekend" && "Fin de semana"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Días Preferidos</Label>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mt-2">
                {[
                  "monday",
                  "tuesday",
                  "wednesday",
                  "thursday",
                  "friday",
                  "saturday",
                  "sunday",
                ].map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      const current = formData.preferredDays;
                      if (current.includes(day)) {
                        updateFormData(
                          "preferredDays",
                          current.filter((d) => d !== day)
                        );
                      } else {
                        updateFormData("preferredDays", [...current, day]);
                      }
                    }}
                    className={`p-2 border rounded-lg text-sm ${
                      formData.preferredDays.includes(day)
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {day === "monday" && "Lun"}
                    {day === "tuesday" && "Mar"}
                    {day === "wednesday" && "Mié"}
                    {day === "thursday" && "Jue"}
                    {day === "friday" && "Vie"}
                    {day === "saturday" && "Sáb"}
                    {day === "sunday" && "Dom"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Método de Comunicación Preferido</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {[
                  { value: "email", label: "Email", icon: Mail },
                  { value: "phone", label: "Teléfono", icon: Phone },
                  { value: "text", label: "SMS", icon: Phone },
                  { value: "app", label: "App", icon: CheckCircle },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      updateFormData("communicationMethod", option.value)
                    }
                    className={`p-3 border rounded-lg text-sm flex flex-col items-center ${
                      formData.communicationMethod === option.value
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <option.icon className="h-5 w-5 mb-1" />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Recordatorios de Citas</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="reminderEmail"
                    checked={formData.reminderEmail}
                    onChange={(e) =>
                      updateFormData("reminderEmail", e.target.checked)
                    }
                    className="rounded"
                  />
                  <Label htmlFor="reminderEmail">Recordatorios por email</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="reminderSmsPrefs"
                    checked={formData.reminderSms}
                    onChange={(e) =>
                      updateFormData("reminderSms", e.target.checked)
                    }
                    className="rounded"
                  />
                  <Label htmlFor="reminderSmsPrefs">
                    Recordatorios por SMS
                  </Label>
                </div>

                <div>
                  <Label htmlFor="reminderDaysPrefs">
                    Días de anticipación para recordatorios
                  </Label>
                  <select
                    id="reminderDaysPrefs"
                    value={formData.reminderDays}
                    onChange={(e) =>
                      updateFormData("reminderDays", parseInt(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                  >
                    <option value={1}>1 día antes</option>
                    <option value={2}>2 días antes</option>
                    <option value={3}>3 días antes</option>
                    <option value={7}>1 semana antes</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );
      case 6: // Financial Information
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Información Financiera
            </h3>

            <div>
              <Label>Método de Pago Preferido</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {[
                  { value: "insurance", label: "Seguro Médico" },
                  { value: "cash", label: "Efectivo" },
                  { value: "card", label: "Tarjeta" },
                  { value: "payment_plan", label: "Plan de Pagos" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      updateFormData("paymentMethod", option.value)
                    }
                    className={`p-3 border rounded-lg text-sm ${
                      formData.paymentMethod === option.value
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                Información sobre Pagos
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Aceptamos efectivo, tarjetas de débito y crédito</li>
                <li>• Ofrecemos planes de pago para tratamientos extensos</li>
                <li>• Trabajamos con los principales seguros médicos</li>
                <li>• Cotizaciones sin costo para todos los tratamientos</li>
              </ul>
            </div>
          </div>
        );

      case 7: // Consents
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Consentimientos y Autorizaciones
            </h3>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="treatmentConsent"
                    checked={formData.treatmentConsent}
                    onChange={(e) =>
                      updateFormData("treatmentConsent", e.target.checked)
                    }
                    className={`mt-1 rounded ${
                      errors.treatmentConsent ? "border-red-500" : ""
                    }`}
                  />
                  <div className="flex-1">
                    <Label htmlFor="treatmentConsent" className="font-medium">
                      Consentimiento de Tratamiento *
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Autorizo al personal dental a realizar los tratamientos
                      necesarios para mi cuidado dental. Entiendo que me
                      explicarán todos los procedimientos antes de realizarlos.
                    </p>
                  </div>
                </div>
                {errors.treatmentConsent && (
                  <p className="text-red-500 text-sm mt-2">
                    {errors.treatmentConsent}
                  </p>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="privacyPolicy"
                    checked={formData.privacyPolicy}
                    onChange={(e) =>
                      updateFormData("privacyPolicy", e.target.checked)
                    }
                    className={`mt-1 rounded ${
                      errors.privacyPolicy ? "border-red-500" : ""
                    }`}
                  />
                  <div className="flex-1">
                    <Label htmlFor="privacyPolicy" className="font-medium">
                      Política de Privacidad *
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      He leído y acepto la política de privacidad. Entiendo cómo
                      se manejará mi información personal y médica de acuerdo
                      con las leyes de protección de datos vigentes.
                    </p>
                  </div>
                </div>
                {errors.privacyPolicy && (
                  <p className="text-red-500 text-sm mt-2">
                    {errors.privacyPolicy}
                  </p>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="marketingEmails"
                    checked={formData.marketingEmails}
                    onChange={(e) =>
                      updateFormData("marketingEmails", e.target.checked)
                    }
                    className="mt-1 rounded"
                  />
                  <div className="flex-1">
                    <Label htmlFor="marketingEmails" className="font-medium">
                      Comunicaciones Promocionales
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Acepto recibir información sobre promociones, nuevos
                      servicios y tips de salud dental por email. Puedo cancelar
                      estas comunicaciones en cualquier momento.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900">Importante</h4>
                  <p className="text-sm text-amber-800 mt-1">
                    Sus datos personales y médicos están protegidos bajo las
                    leyes de privacidad mexicanas. Solo el personal autorizado
                    tendrá acceso a su información médica.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 8: // Review
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Revisión Final
            </h3>

            {errors.submit && (
              <div className="bg-red-100 text-red-700 p-4 rounded-lg">
                {errors.submit}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Información Básica
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <strong>Nombre:</strong> {formData.firstName}{" "}
                    {formData.lastName}
                  </div>
                  <div>
                    <strong>Email:</strong> {formData.email}
                  </div>
                  <div>
                    <strong>Teléfono:</strong> {formData.phone}
                  </div>
                  <div>
                    <strong>Fecha de Nacimiento:</strong> {formData.dateOfBirth}
                  </div>
                  <div>
                    <strong>Género:</strong>{" "}
                    {formData.gender === "male"
                      ? "Masculino"
                      : formData.gender === "female"
                      ? "Femenino"
                      : formData.gender === "other"
                      ? "Otro"
                      : "Prefiere no decir"}
                  </div>
                </CardContent>
              </Card>

              {/* Medical Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resumen Médico</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <strong>Alergias:</strong>{" "}
                    {formData.allergies.length > 0
                      ? formData.allergies.join(", ")
                      : "Ninguna"}
                  </div>
                  <div>
                    <strong>Medicamentos:</strong>{" "}
                    {formData.medications.length > 0
                      ? formData.medications.join(", ")
                      : "Ninguno"}
                  </div>
                  <div>
                    <strong>Condiciones:</strong>{" "}
                    {formData.medicalConditions.length > 0
                      ? formData.medicalConditions.join(", ")
                      : "Ninguna"}
                  </div>
                  <div>
                    <strong>Seguro:</strong>{" "}
                    {formData.hasInsurance
                      ? `Sí - ${formData.insuranceProvider}`
                      : "No"}
                  </div>
                </CardContent>
              </Card>

              {/* Dental Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resumen Dental</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <strong>Motivo de visita:</strong> {formData.reasonForVisit}
                  </div>
                  <div>
                    <strong>Higiene oral:</strong> {formData.oralHygiene}
                  </div>
                  <div>
                    <strong>Nivel de dolor:</strong> {formData.painLevel}/10
                  </div>
                  <div>
                    <strong>Problemas actuales:</strong>{" "}
                    {formData.currentProblems.length > 0
                      ? formData.currentProblems.join(", ")
                      : "Ninguno"}
                  </div>
                </CardContent>
              </Card>

              {/* Preferences Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Preferencias</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <strong>Método de contacto:</strong>{" "}
                    {formData.communicationMethod}
                  </div>
                  <div>
                    <strong>Método de pago:</strong> {formData.paymentMethod}
                  </div>
                  <div>
                    <strong>Recordatorios:</strong>
                    {formData.reminderEmail && " Email"}
                    {formData.reminderSms && " SMS"}
                    {` (${formData.reminderDays} días antes)`}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notas Adicionales</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateFormData("notes", e.target.value)}
                placeholder="Cualquier información adicional relevante sobre el paciente..."
                rows={4}
              />
            </div>

            {/* Odontogram Summary */}
            {Object.keys(odontogramData.teeth).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Odontograma Registrado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Se ha registrado información dental para{" "}
                    {Object.keys(odontogramData.teeth).length} dientes.
                    {odontogramData.generalNotes && (
                      <span> Notas: {odontogramData.generalNotes}</span>
                    )}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    if (currentStep === FORM_STEPS.length - 1) {
      return formData.treatmentConsent && formData.privacyPolicy;
    }
    return true;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/patients")}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Pacientes
          </Button>

          <Badge variant="outline">
            Paso {currentStep + 1} de {FORM_STEPS.length}
          </Badge>
        </div>

        <h1 className="text-3xl font-bold text-gray-900">Nuevo Paciente</h1>
        <p className="text-gray-600">
          Complete la información del paciente paso a paso
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {FORM_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    isCompleted
                      ? "bg-green-500 border-green-500 text-white"
                      : isActive
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "bg-gray-100 border-gray-300 text-gray-400"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={`text-xs mt-1 text-center max-w-20 ${
                    isActive ? "text-blue-600 font-medium" : "text-gray-500"
                  }`}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentStep + 1) / FORM_STEPS.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Form Content */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            {React.createElement(FORM_STEPS[currentStep].icon, {
              className: "mr-2 h-5 w-5",
            })}
            {FORM_STEPS[currentStep].title}
          </CardTitle>
        </CardHeader>
        <CardContent>{renderStepContent()}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>

        <div className="flex gap-2">
          {currentStep === FORM_STEPS.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </div>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Crear Paciente
                </>
              )}
            </Button>
          ) : (
            <Button onClick={nextStep} disabled={!canProceed()}>
              Siguiente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Draft Save Indicator */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Los datos se guardan automáticamente como borrador mientras completa
          el formulario
        </p>
      </div>
    </div>
  );
}

// Array Input Component (inline for now, should be moved to separate file)
function ArrayInput({
  items,
  onAdd,
  onRemove,
  placeholder = "Agregar elemento...",
  emptyMessage = "No hay elementos agregados",
  maxItems,
}: {
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
  placeholder?: string;
  emptyMessage?: string;
  maxItems?: number;
}) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    if (inputValue.trim() && (!maxItems || items.length < maxItems)) {
      onAdd(inputValue.trim());
      setInputValue("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1"
          disabled={maxItems ? items.length >= maxItems : false}
        />
        <Button
          type="button"
          onClick={handleAdd}
          disabled={
            !inputValue.trim() || (maxItems ? items.length >= maxItems : false)
          }
          size="sm"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1 px-3 py-1"
            >
              <span className="text-sm">{item}</span>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">{emptyMessage}</p>
      )}

      {maxItems && items.length >= maxItems && (
        <p className="text-sm text-amber-600">
          Máximo {maxItems} elementos permitidos
        </p>
      )}
    </div>
  );
}
