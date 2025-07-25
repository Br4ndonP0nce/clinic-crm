// src/components/agenda/ResponsiveAppointmentForm.tsx - COMPLETE MOBILE-FIRST REDESIGN
"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Stethoscope,
  Check,
  ArrowLeft,
  MapPin,
  Heart,
} from "lucide-react";
import {
  PublicDoctor,
  PublicAppointment,
  BookingDataResponse,
  SubmissionResponse,
  convertToCalendarAppointment,
  MinimalAppointment,
} from "@/types/public-booking";
import { addPatient, getAppointments } from "@/lib/firebase/db";
import { getAllUsers, UserProfile } from "@/lib/firebase/rbac";
import { Timestamp } from "firebase/firestore";
import { Appointment } from "@/lib/firebase/db";
import {
  validateEmail,
  validateName,
  validatePhone,
  generateWhatsAppLink,
  COUNTRY_VALIDATIONS,
} from "@/lib/phoneValidationUtils";
import { SmartCalendarPicker } from "@/components/calendar/SmatCalendarPicker";
import {
  formatDateForInput,
  createLocalDateTime,
  getCurrentLocalDateTime,
} from "@/lib/utils/datetime";

// Dental procedures with better categorization
const DENTAL_PROCEDURES = [
  {
    id: "consultation",
    name: "Consulta General",
    duration: 30,
    description: "Revisión y diagnóstico completo",
    icon: "👨‍⚕️",
    category: "preventive",
  },
  {
    id: "cleaning",
    name: "Limpieza Dental",
    duration: 60,
    description: "Profilaxis y limpieza profunda",
    icon: "🦷",
    category: "preventive",
  },
  {
    id: "whitening",
    name: "Blanqueamiento",
    duration: 90,
    description: "Blanqueamiento dental profesional",
    icon: "✨",
    category: "cosmetic",
  },
  {
    id: "filling",
    name: "Empaste",
    duration: 45,
    description: "Reparación de caries",
    icon: "🔧",
    category: "restorative",
  },
  {
    id: "extraction",
    name: "Extracción",
    duration: 30,
    description: "Extracción dental simple",
    icon: "🦷",
    category: "surgical",
  },
  {
    id: "root_canal",
    name: "Endodoncia",
    duration: 120,
    description: "Tratamiento de conducto",
    icon: "🩺",
    category: "specialized",
  },
  {
    id: "crown",
    name: "Corona",
    duration: 90,
    description: "Colocación de corona dental",
    icon: "👑",
    category: "restorative",
  },
  {
    id: "orthodontics",
    name: "Ortodoncia",
    duration: 60,
    description: "Consulta de ortodoncia",
    icon: "🦷",
    category: "orthodontic",
  },
  {
    id: "implant",
    name: "Implante",
    duration: 120,
    description: "Colocación de implante dental",
    icon: "🔩",
    category: "surgical",
  },
  {
    id: "emergency",
    name: "Emergencia",
    duration: 30,
    description: "Atención de urgencia dental",
    icon: "🚨",
    category: "emergency",
  },
];

// Country codes (simplified)
const countryCodes = COUNTRY_VALIDATIONS.filter((c) => c.code !== "+999")
  .sort((a, b) => {
    const latinAmericanCodes = ["+52", "+55", "+54", "+57", "+56", "+51"];
    const aIsLA = latinAmericanCodes.includes(a.code);
    const bIsLA = latinAmericanCodes.includes(b.code);

    if (aIsLA && !bIsLA) return -1;
    if (!aIsLA && bIsLA) return 1;
    return a.country.localeCompare(b.country);
  })
  .map((c) => ({ code: c.code, country: c.country }));

// Question types
interface Question {
  id: string;
  text: string;
  type: "text" | "email" | "phone" | "select" | "calendar" | "confirmation";
  required: boolean;
  description?: string;
  mobileTitle?: string;
}

const questions: Question[] = [
  {
    id: "name",
    text: "¿Cuál es tu nombre completo?",
    mobileTitle: "Tu nombre",
    type: "text",
    required: true,
    description: "Para identificarte en tu cita",
  },
  {
    id: "email",
    text: "¿Cuál es tu correo electrónico?",
    mobileTitle: "Tu email",
    type: "email",
    required: true,
    description: "Te enviaremos la confirmación",
  },
  {
    id: "phone",
    text: "¿Cuál es tu número de WhatsApp?",
    mobileTitle: "Tu WhatsApp",
    type: "phone",
    required: true,
    description: "Para contactarte y recordatorios",
  },
  {
    id: "procedure",
    text: "¿Qué tipo de tratamiento necesitas?",
    mobileTitle: "Tu tratamiento",
    type: "select",
    required: true,
    description: "Selecciona el procedimiento",
  },
  {
    id: "doctor",
    text: "¿Con qué doctor te gustaría agendar?",
    mobileTitle: "Tu doctor",
    type: "select",
    required: true,
    description: "Selecciona tu doctor preferido",
  },
  {
    id: "calendar",
    text: "¿Cuándo te gustaría tu cita?",
    mobileTitle: "Fecha y hora",
    type: "calendar",
    required: true,
    description: "Selecciona fecha y hora disponible",
  },
  {
    id: "confirmation",
    text: "¡Perfecto! Confirma tu cita",
    mobileTitle: "Confirmar",
    type: "confirmation",
    required: false,
    description: "Revisa y confirma los detalles",
  },
];

interface FormData {
  name: string;
  email: string;
  phone: string;
  procedure: string;
  doctorId: string;
  selectedDate: Date | null;
  selectedTime: string;
}

const ResponsiveAppointmentForm: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    procedure: "",
    doctorId: "",
    selectedDate: null,
    selectedTime: "",
  });
  const [selectedCode, setSelectedCode] = useState("+52");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);

  // Data states
  const [doctors, setDoctors] = useState<PublicDoctor[]>([]);
  const [allAppointments, setAllAppointments] = useState<PublicAppointment[]>(
    []
  );
  const [loadingData, setLoadingData] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load doctors and appointments on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

        const response = await fetch(
          `/api/public/booking-data?startDate=${tomorrow.toISOString()}&endDate=${dayAfterTomorrow.toISOString()}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch booking data");
        }

        const data: BookingDataResponse = await response.json();

        if (data.success) {
          setDoctors(data.doctors);
          setAllAppointments(data.appointments);
        } else {
          throw new Error(data.error || "Failed to load data");
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setError("Error cargando información. Intenta recargar la página.");
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  // Focus input when question changes
  useEffect(() => {
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 300);
  }, [currentQuestion]);

  // Handle country dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const calendarAppointments: Appointment[] = allAppointments
    .filter((apt) => apt.doctorId === formData.doctorId)
    .map((apt) => convertToCalendarAppointment(apt) as Appointment);
  // Validation
  const validateCurrentQuestion = (): string | null => {
    const currentQ = questions[currentQuestion];
    const currentValue = getFieldValue(currentQ.id);

    if (currentQ.required && (!currentValue || currentValue === "")) {
      return "Este campo es obligatorio";
    }

    if (currentValue) {
      switch (currentQ.type) {
        case "email":
          if (!validateEmail(currentValue as string)) {
            return "Email inválido";
          }
          break;
        case "phone":
          const phoneValidation = validatePhone(
            currentValue as string,
            selectedCode
          );
          if (!phoneValidation.isValid) {
            return phoneValidation.error || "Número inválido";
          }
          break;
        case "text":
          if (currentQ.id === "name" && !validateName(currentValue as string)) {
            return "Nombre debe tener al menos 2 caracteres";
          }
          break;
        case "calendar":
          if (!formData.selectedDate || !formData.selectedTime) {
            return "Selecciona fecha y hora";
          }
          break;
      }
    }

    return null;
  };

  // Get field value helper
  const getFieldValue = (fieldId: string): string | Date | null => {
    switch (fieldId) {
      case "name":
        return formData.name;
      case "email":
        return formData.email;
      case "phone":
        return formData.phone;
      case "procedure":
        return formData.procedure;
      case "doctor":
        return formData.doctorId; // Map correctly
      case "calendar":
        return formData.selectedDate && formData.selectedTime
          ? `${formData.selectedDate.toLocaleDateString()} ${
              formData.selectedTime
            }`
          : null;
      default:
        return null;
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const questionId = questions[currentQuestion].id;

    setFormData((prev) => ({ ...prev, [questionId]: value }));
    setError(null);
  };

  // Handle phone change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, "");
    const countryValidation = COUNTRY_VALIDATIONS.find(
      (c) => c.code === selectedCode
    );

    if (countryValidation && value.length <= countryValidation.maxLength) {
      const fullNumber = `${selectedCode} ${value}`;
      setFormData((prev) => ({ ...prev, phone: fullNumber }));
    }
    setError(null);
  };

  // Handle option select
  const handleOptionSelect = (optionId: string) => {
    const questionId = questions[currentQuestion].id;

    // Map question IDs to form data fields correctly
    const fieldMapping: Record<string, keyof FormData> = {
      procedure: "procedure",
      doctor: "doctorId", // Map 'doctor' question to 'doctorId' field
    };

    const fieldName =
      fieldMapping[questionId] || (questionId as keyof FormData);
    setFormData((prev) => ({ ...prev, [fieldName]: optionId }));
    setError(null);

    // Auto-advance
    setTimeout(() => {
      handleNext();
    }, 300);
  };

  // Handle calendar selection
  const handleCalendarSelection = (
    selectedDate: Date,
    selectedTime: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      selectedDate,
      selectedTime,
    }));
    setShowCalendarPicker(false);
    setError(null);

    // Auto-advance to confirmation
    setTimeout(() => {
      handleNext();
    }, 500);
  };

  // Navigation
  const handleNext = () => {
    const validationError = validateCurrentQuestion();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleBack = () => {
    if (currentQuestion === 0) {
      window.history.back();
    } else {
      handlePrev();
    }
  };

  // Submit form
  const handleSubmit = async () => {
    if (!formData.selectedDate || !formData.selectedTime) {
      setError("Faltan datos de la cita");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/public/submit-appointment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          procedure: formData.procedure,
          doctorId: formData.doctorId,
          selectedDate: formData.selectedDate.toISOString(),
          selectedTime: formData.selectedTime,
        }),
      });

      const result: SubmissionResponse = await response.json();

      if (result.success) {
        localStorage.setItem(
          "bookingConfirmation",
          JSON.stringify(result.data)
        );
        setIsSubmitted(true);
      } else {
        throw new Error(result.error || "Failed to submit appointment");
      }
    } catch (err) {
      console.error("Error submitting appointment request:", err);
      setError("Error al enviar solicitud. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get selected procedure and doctor
  const selectedProcedure = DENTAL_PROCEDURES.find(
    (p) => p.id === formData.procedure
  );
  const selectedDoctor = doctors.find((d) => d.uid === formData.doctorId);

  // Loading state
  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-white mx-auto mb-4"></div>
          <p>Cargando información...</p>
        </div>
      </div>
    );
  }

  // Success screen
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-md w-full text-center border border-white/20"
        >
          <div className="text-6xl mb-6">✅</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            ¡Solicitud Enviada!
          </h2>
          <p className="text-white/80 mb-6 leading-relaxed">
            Hemos recibido tu solicitud de cita dental. Nos pondremos en
            contacto contigo pronto para confirmar tu cita.
          </p>

          <div className="bg-white/10 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-medium text-white mb-3 flex items-center">
              <Heart className="h-4 w-4 mr-2" />
              Resumen de tu solicitud:
            </h3>
            <div className="space-y-2 text-sm text-white/80">
              <p>
                <strong>Tratamiento:</strong> {selectedProcedure?.name}
              </p>
              <p>
                <strong>Doctor:</strong> Dr.{" "}
                {selectedDoctor?.displayName || selectedDoctor?.email}
              </p>
              <p>
                <strong>Fecha:</strong>{" "}
                {formData.selectedDate?.toLocaleDateString("es-MX", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
              <p>
                <strong>Hora:</strong> {formData.selectedTime}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <a
              href={generateWhatsAppLink(
                `Hola! Soy ${
                  formData.name
                }. Acabo de solicitar una cita dental para ${
                  selectedProcedure?.name
                } el ${formData.selectedDate?.toLocaleDateString(
                  "es-MX"
                )} a las ${formData.selectedTime} con Dr. ${
                  selectedDoctor?.displayName
                }. ¿Pueden confirmar mi cita?`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-xl transition-colors"
            >
              <Phone className="inline w-5 h-5 mr-2" />
              Confirmar por WhatsApp
            </a>

            <button
              onClick={() => (window.location.href = "/")}
              className="w-full bg-white/20 hover:bg-white/30 text-white font-medium py-3 px-6 rounded-xl transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Render question content
  const renderQuestionContent = () => {
    const question = questions[currentQuestion];

    switch (question.type) {
      case "text":
        return (
          <div className="w-full space-y-4">
            <input
              ref={inputRef}
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full bg-white/10 border border-white/20 rounded-xl py-4 px-4 text-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
              placeholder="Tu nombre completo"
            />
          </div>
        );

      case "email":
        return (
          <div className="w-full space-y-4">
            <input
              ref={inputRef}
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full bg-white/10 border border-white/20 rounded-xl py-4 px-4 text-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
              placeholder="ejemplo@correo.com"
            />
          </div>
        );

      case "phone":
        const phoneValue = formData.phone || "";
        const nationalNumber = phoneValue.includes(selectedCode)
          ? phoneValue.replace(`${selectedCode} `, "").replace(/\D/g, "")
          : phoneValue.replace(/\D/g, "");

        return (
          <div className="w-full space-y-4">
            <div className="flex gap-3">
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  className="flex items-center bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white backdrop-blur-sm"
                >
                  {selectedCode}
                  <ChevronRight className="ml-2 w-4 h-4 rotate-90" />
                </button>

                {showCountryDropdown && (
                  <div className="absolute top-full left-0 mt-2 max-h-60 overflow-y-auto bg-white/90 backdrop-blur-md border border-white/20 rounded-xl z-50 w-64">
                    {countryCodes.map((country, index) => (
                      <button
                        key={`${country.code}-${index}`}
                        type="button"
                        className="block w-full text-left px-4 py-3 hover:bg-white/20 text-gray-800 hover:text-gray-900 transition-colors"
                        onClick={() => {
                          setSelectedCode(country.code);
                          setShowCountryDropdown(false);
                        }}
                      >
                        <span className="font-medium">{country.code}</span>{" "}
                        {country.country}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input
                ref={inputRef}
                type="tel"
                value={nationalNumber}
                onChange={handlePhoneChange}
                className="flex-1 bg-white/10 border border-white/20 rounded-xl py-4 px-4 text-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
                placeholder="1234567890"
              />
            </div>
          </div>
        );

      case "select":
        if (question.id === "procedure") {
          return (
            <div className="w-full space-y-3 max-h-[60vh] overflow-y-auto">
              {DENTAL_PROCEDURES.map((procedure) => (
                <motion.button
                  key={procedure.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOptionSelect(procedure.id)}
                  className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                    formData.procedure === procedure.id
                      ? "bg-white/20 border-2 border-white/40"
                      : "bg-white/10 border border-white/20 hover:bg-white/15"
                  } backdrop-blur-sm`}
                >
                  <div className="flex items-start">
                    <span className="text-2xl mr-3 mt-1">{procedure.icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-white">
                        {procedure.name}
                      </div>
                      <div className="text-sm text-white/70 mt-1">
                        {procedure.description}
                      </div>
                      <div className="text-xs text-white/50 mt-2">
                        Duración: {procedure.duration} min
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          );
        }

        if (question.id === "doctor") {
          return (
            <div className="w-full space-y-3 max-h-[60vh] overflow-y-auto">
              {doctors.map((doctor) => (
                <motion.button
                  key={doctor.uid}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOptionSelect(doctor.uid)}
                  className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                    formData.doctorId === doctor.uid
                      ? "bg-white/20 border-2 border-white/40"
                      : "bg-white/10 border border-white/20 hover:bg-white/15"
                  } backdrop-blur-sm`}
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                      <Stethoscope className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">
                        Dr. {doctor.displayName || doctor.email}
                      </div>
                      <div className="text-sm text-white/70">Odontólogo</div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          );
        }
        break;

      case "calendar":
        return (
          <div className="w-full space-y-6">
            {formData.selectedDate && formData.selectedTime ? (
              <div className="bg-white/10 border border-white/20 rounded-xl p-6 backdrop-blur-sm">
                <div className="text-center">
                  <div className="text-white/80 mb-2">Cita seleccionada:</div>
                  <div className="text-xl font-semibold text-white mb-1">
                    {formData.selectedDate.toLocaleDateString("es-MX", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </div>
                  <div className="text-lg text-white/90">
                    a las {formData.selectedTime}
                  </div>
                  <button
                    onClick={() => setShowCalendarPicker(true)}
                    className="mt-4 text-white/70 hover:text-white text-sm underline"
                  >
                    Cambiar fecha/hora
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCalendarPicker(true)}
                className="w-full bg-white/10 border border-white/20 rounded-xl p-8 backdrop-blur-sm hover:bg-white/15 transition-colors"
              >
                <Calendar className="h-12 w-12 mx-auto mb-4 text-white/70" />
                <div className="text-white font-medium mb-2">
                  Seleccionar fecha y hora
                </div>
                <div className="text-white/70 text-sm">
                  Usa nuestro calendario inteligente
                </div>
              </button>
            )}
          </div>
        );

      case "confirmation":
        return (
          <div className="w-full space-y-6">
            <div className="bg-white/10 border border-white/20 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="font-semibold text-white mb-4 flex items-center">
                <Check className="h-5 w-5 mr-2" />
                Detalles de tu cita:
              </h3>

              <div className="space-y-3 text-white/90">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-3 text-white/70" />
                  <span className="font-medium">{formData.name}</span>
                </div>

                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-3 text-white/70" />
                  <span>{formData.email}</span>
                </div>

                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-3 text-white/70" />
                  <span>{formData.phone}</span>
                </div>

                <div className="flex items-center">
                  <Stethoscope className="h-4 w-4 mr-3 text-white/70" />
                  <span>{selectedProcedure?.name}</span>
                </div>

                <div className="flex items-center">
                  <User className="h-4 w-4 mr-3 text-white/70" />
                  <span>
                    Dr. {selectedDoctor?.displayName || selectedDoctor?.email}
                  </span>
                </div>

                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-3 text-white/70" />
                  <span>
                    {formData.selectedDate?.toLocaleDateString("es-MX", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                </div>

                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-3 text-white/70" />
                  <span>{formData.selectedTime}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-white/90 text-sm">
                <strong>Importante:</strong> Esta es una solicitud de cita. Te
                contactaremos pronto para confirmar la disponibilidad y
                finalizar el agendamiento.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-64 h-64 rounded-full bg-white/5 blur-3xl"></div>
          <div className="absolute bottom-1/3 -right-20 w-80 h-80 rounded-full bg-white/5 blur-3xl"></div>
        </div>

        {/* Mobile-first container */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6">
            <button
              onClick={handleBack}
              className="flex items-center text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Volver</span>
            </button>
            <div className="text-center flex-1 px-4">
              <h1 className="text-lg sm:text-xl font-bold text-white">
                Agenda tu Cita Dental
              </h1>
              <p className="text-white/70 text-sm mt-1">
                {questions[currentQuestion].mobileTitle ||
                  questions[currentQuestion].text}
              </p>
            </div>
            <div className="w-10 sm:w-20"></div> {/* Spacer for centering */}
          </div>

          {/* Progress bar */}
          <div className="px-4 sm:px-6 mb-6">
            <div className="w-full bg-white/10 rounded-full h-2">
              <motion.div
                className="h-2 rounded-full bg-white"
                initial={{ width: 0 }}
                animate={{
                  width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-white/60">
              <span>Paso {currentQuestion + 1}</span>
              <span>{questions.length} pasos</span>
            </div>
          </div>

          {/* Question content */}
          <div className="flex-1 px-4 sm:px-6 pb-8">
            <div className="max-w-md mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Question header */}
                  <div className="text-center mb-8">
                    <h2 className="text-xl sm:text-2xl font-medium text-white mb-3 leading-tight">
                      {questions[currentQuestion].text}
                    </h2>
                    {questions[currentQuestion].description && (
                      <p className="text-white/70 text-sm">
                        {questions[currentQuestion].description}
                      </p>
                    )}
                  </div>

                  {/* Question input */}
                  {renderQuestionContent()}

                  {/* Error message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-500/20 border border-red-400/30 rounded-xl p-3 backdrop-blur-sm"
                    >
                      <p className="text-red-200 text-sm text-center">
                        {error}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="p-4 sm:p-6 bg-black/10 backdrop-blur-sm">
            <div className="max-w-md mx-auto">
              <div className="flex gap-3">
                {currentQuestion > 0 && (
                  <button
                    onClick={handlePrev}
                    className="flex items-center justify-center px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}

                <button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className={`flex-1 flex items-center justify-center px-6 py-3 rounded-xl font-medium transition-colors backdrop-blur-sm ${
                    isSubmitting
                      ? "bg-white/20 text-white/70 cursor-not-allowed"
                      : "bg-white text-blue-900 hover:bg-white/90"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 animate-spin rounded-full border-2 border-blue-900/30 border-t-blue-900 mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <span>
                        {currentQuestion === questions.length - 1
                          ? "Solicitar Cita"
                          : "Siguiente"}
                      </span>
                      {currentQuestion < questions.length - 1 && (
                        <ChevronRight className="w-5 h-5 ml-2" />
                      )}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Calendar Picker Modal - Tomorrow Only + 1 Hour Slots */}
      {showCalendarPicker && (
        <SmartCalendarPicker
          isOpen={showCalendarPicker}
          onClose={() => setShowCalendarPicker(false)}
          onSelectDateTime={handleCalendarSelection}
          appointments={calendarAppointments} // Use the converted appointments here
          patients={[]}
          selectedDoctor={formData.doctorId}
          appointmentDuration={60}
          initialDate={(() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow;
          })()}
        />
      )}
    </>
  );
};

export default ResponsiveAppointmentForm;
