"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Calendar, Clock, User, Phone, Mail, Stethoscope } from "lucide-react";
import { addPatient } from "@/lib/firebase/db";
import { getAllUsers, UserProfile } from "@/lib/firebase/rbac";
import { getAppointments } from "@/lib/firebase/db";
import { Timestamp } from "firebase/firestore";
import {
  validateEmail,
  validateName,
  validatePhone,
  generateWhatsAppLink,
  COUNTRY_VALIDATIONS,
  PhoneValidationResult,
} from "@/lib/phoneValidationUtils";

// Dental procedures
const DENTAL_PROCEDURES = [
  { id: "consultation", name: "Consulta General", duration: 30, description: "Revisión y diagnóstico" },
  { id: "cleaning", name: "Limpieza Dental", duration: 60, description: "Profilaxis y limpieza profunda" },
  { id: "whitening", name: "Blanqueamiento", duration: 90, description: "Blanqueamiento dental profesional" },
  { id: "filling", name: "Empaste", duration: 45, description: "Reparación de caries" },
  { id: "extraction", name: "Extracción", duration: 30, description: "Extracción dental simple" },
  { id: "root_canal", name: "Endodoncia", duration: 120, description: "Tratamiento de conducto" },
  { id: "crown", name: "Corona", duration: 90, description: "Colocación de corona dental" },
  { id: "orthodontics", name: "Ortodoncia", duration: 60, description: "Consulta de ortodoncia" },
  { id: "implant", name: "Implante", duration: 120, description: "Colocación de implante dental" },
  { id: "emergency", name: "Emergencia", duration: 30, description: "Atención de urgencia dental" }
];

// Time slots
const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"
];

// Question types
type QuestionType = "text" | "email" | "phone" | "select" | "calendar" | "time";

interface Question {
  id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  description?: string;
}

// Form questions for appointment booking
const questions: Question[] = [
  {
    id: "name",
    text: "¿Cuál es tu nombre completo?",
    type: "text",
    required: true,
    description: "Para identificarte en tu cita"
  },
  {
    id: "email",
    text: "¿Cuál es tu correo electrónico?",
    type: "email",
    required: true,
    description: "Te enviaremos la confirmación de tu cita"
  },
  {
    id: "phone",
    text: "¿Cuál es tu número de WhatsApp?",
    type: "phone",
    required: true,
    description: "Para contactarte y recordatorios"
  },
  {
    id: "procedure",
    text: "¿Qué tipo de tratamiento necesitas?",
    type: "select",
    required: true,
    description: "Selecciona el procedimiento que más se ajuste a tu necesidad"
  },
  {
    id: "doctor",
    text: "¿Con qué doctor te gustaría agendar?",
    type: "select",
    required: true,
    description: "Selecciona tu doctor de preferencia"
  },
  {
    id: "date",
    text: "¿Qué día te gustaría agendar?",
    type: "calendar",
    required: true,
    description: "Selecciona una fecha disponible"
  },
  {
    id: "time",
    text: "¿A qué hora prefieres tu cita?",
    type: "time",
    required: true,
    description: "Selecciona un horario disponible"
  }
];

// Generate country codes (simplified from original)
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

interface AppointmentData {
  name: string;
  email: string;
  phone: string;
  procedure: string;
  doctorId: string;
  date: string;
  time: string;
}

const DentalAppointmentForm: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedCode, setSelectedCode] = useState("+52");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneValidationError, setPhoneValidationError] = useState<string | null>(null);
  
  // Dental-specific state
  const [doctors, setDoctors] = useState<UserProfile[]>([]);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<any[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load doctors on component mount
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const allUsers = await getAllUsers();
        const activeDoctors = allUsers.filter(user => 
          user.role === "doctor" && user.isActive
        );
        setDoctors(activeDoctors);
      } catch (error) {
        console.error("Error loading doctors:", error);
      }
    };
    
    loadDoctors();
  }, []);

  // Generate available dates (next 7 days, excluding weekends)
  useEffect(() => {
    const dates: Date[] = [];
    const today = new Date();
    let currentDate = new Date(today);
    
    // Skip today if it's too late
    const currentHour = today.getHours();
    if (currentHour >= 18) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    while (dates.length < 7) {
      const dayOfWeek = currentDate.getDay();
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        dates.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    setAvailableDates(dates);
  }, []);

  // Load existing appointments and calculate available times
  useEffect(() => {
    const loadAppointments = async () => {
      if (answers.doctor && answers.date) {
        try {
          const selectedDate = new Date(answers.date);
          const startOfDay = new Date(selectedDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(selectedDate);
          endOfDay.setHours(23, 59, 59, 999);
          
          const appointments = await getAppointments(
            startOfDay,
            endOfDay,
            answers.doctor
          );
          
          setExistingAppointments(appointments);
          
          // Calculate available times
          const bookedTimes = appointments.map(apt => {
            const aptDate = apt.appointmentDate.toDate();
            return aptDate.toTimeString().slice(0, 5);
          });
          
          const available = TIME_SLOTS.filter(time => !bookedTimes.includes(time));
          setAvailableTimes(available);
          
        } catch (error) {
          console.error("Error loading appointments:", error);
          setAvailableTimes(TIME_SLOTS); // Fallback to all times
        }
      }
    };
    
    loadAppointments();
  }, [answers.doctor, answers.date]);

  // Focus input when question changes
  useEffect(() => {
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 300);
  }, [currentQuestion]);

  // Close country dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Validation
  const validateCurrentQuestion = (): string | null => {
    const currentQ = questions[currentQuestion];
    const currentValue = answers[currentQ.id];

    if (currentQ.required && (!currentValue || currentValue === "")) {
      return "Este campo es obligatorio";
    }

    if (currentValue) {
      switch (currentQ.type) {
        case "email":
          if (!validateEmail(currentValue)) {
            return "Por favor ingresa un correo electrónico válido";
          }
          break;
        case "phone":
          const phoneValidation = validatePhone(currentValue, selectedCode);
          if (!phoneValidation.isValid) {
            return phoneValidation.error || "Número de teléfono inválido";
          }
          break;
        case "text":
          if (currentQ.id === "name" && !validateName(currentValue)) {
            return "El nombre debe tener al menos 2 caracteres";
          }
          break;
      }
    }

    return null;
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnswers({
      ...answers,
      [questions[currentQuestion].id]: e.target.value,
    });
    setError(null);
    setPhoneValidationError(null);
  };

  // Handle option selection
  const handleOptionSelect = (optionId: string, optionText?: string) => {
    setAnswers({
      ...answers,
      [questions[currentQuestion].id]: optionId,
      [`${questions[currentQuestion].id}_text`]: optionText || optionId,
    });
    setError(null);

    // Auto-advance for certain question types
    setTimeout(() => {
      if (questions[currentQuestion].type === "select") {
        handleNext();
      }
    }, 300);
  };

  // Handle phone input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, "");
    const countryValidation = COUNTRY_VALIDATIONS.find(c => c.code === selectedCode);

    if (countryValidation && value.length <= countryValidation.maxLength) {
      const fullNumber = `${selectedCode} ${value}`;
      setAnswers({
        ...answers,
        [questions[currentQuestion].id]: fullNumber,
      });

      if (value.length >= countryValidation.minLength) {
        const validation = validatePhone(value, selectedCode);
        if (!validation.isValid) {
          setPhoneValidationError(validation.error || null);
        } else {
          setPhoneValidationError(null);
        }
      } else {
        setPhoneValidationError(null);
      }
    }
    setError(null);
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

  // Submit form
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Create patient data
      const [firstName, ...lastNameParts] = answers.name.split(' ');
      const lastName = lastNameParts.join(' ') || '';
      
      const patientData = {
        firstName,
        lastName,
        fullName: answers.name,
        email: answers.email,
        phone: answers.phone,
        dateOfBirth: Timestamp.fromDate(new Date(1990, 0, 1)), // Default date
        gender: "prefer_not_to_say" as const,
        
        address: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "México"
        },
        
        emergencyContact: {
          name: "",
          relationship: "",
          phone: ""
        },
        
        insurance: {
          isActive: false
        },
        
        medicalHistory: {
          allergies: [],
          medications: [],
          medicalConditions: [],
          surgeries: []
        },
        
        dentalHistory: {
          reasonForVisit: answers.procedure_text || answers.procedure,
          oralHygiene: "good" as const,
          brushingFrequency: "twice_daily" as const,
          flossingFrequency: "daily" as const,
          currentProblems: []
        },
        
        status: "scheduled" as const,
        
        preferences: {
          preferredTimeSlots: [answers.time],
          preferredDays: [],
          communicationMethod: "phone" as const,
          reminderPreferences: {
            email: true,
            sms: true,
            days: 1
          }
        },
        
        financial: {
          paymentMethod: "cash" as const,
          balance: 0
        },
        
        createdBy: "website_form",
        notes: `Cita solicitada para: ${answers.procedure_text || answers.procedure}. Fecha preferida: ${answers.date} a las ${answers.time}`,
        statusHistory: [],
        
        consents: {
          treatmentConsent: true,
          privacyPolicy: true,
          marketingEmails: false
        }
      };

      // Add patient to database
      const patientId = await addPatient(patientData);
      console.log("Patient successfully added with ID:", patientId);

      setIsSubmitted(true);
    } catch (err) {
      console.error("Error submitting appointment request:", err);
      setError("Hubo un error al enviar tu solicitud. Por favor intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleNext();
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  // Render question content
  const renderQuestion = () => {
    const question = questions[currentQuestion];

    switch (question.type) {
      case "text":
        return (
          <div className="w-full">
            <input
              ref={inputRef}
              type="text"
              value={answers[question.id] || ""}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent border-b-2 border-white/30 focus:border-white py-2 px-1 text-lg outline-none text-white transition-colors"
              placeholder="Tu nombre completo"
            />
          </div>
        );

      case "email":
        return (
          <div className="w-full">
            <input
              ref={inputRef}
              type="email"
              value={answers[question.id] || ""}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent border-b-2 border-white/30 focus:border-white py-2 px-1 text-lg outline-none text-white transition-colors"
              placeholder="ejemplo@correo.com"
            />
          </div>
        );

      case "phone":
        const phoneValue = answers[question.id] || "";
        const nationalNumber = phoneValue.includes(selectedCode)
          ? phoneValue.replace(`${selectedCode} `, "").replace(/\D/g, "")
          : phoneValue.replace(/\D/g, "");

        return (
          <div className="w-full">
            <div className="flex items-center gap-2">
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  className="flex items-center bg-purple-900/50 border border-purple-700/50 rounded px-2 py-1 text-white min-w-[80px]"
                >
                  {selectedCode}
                  <ChevronRight className="ml-1 w-4 h-4 rotate-90" />
                </button>

                {showCountryDropdown && (
                  <div className="absolute top-full left-0 mt-1 max-h-60 overflow-y-auto bg-purple-900/90 border border-purple-700/50 rounded z-10 w-64">
                    {countryCodes.map((country, index) => (
                      <button
                        key={`${country.code}-${country.country}-${index}`}
                        type="button"
                        className="block w-full text-left px-3 py-2 hover:bg-purple-800/80 text-white"
                        onClick={() => {
                          setSelectedCode(country.code);
                          setShowCountryDropdown(false);
                          setPhoneValidationError(null);
                        }}
                      >
                        <span className="font-medium">{country.code}</span> {country.country}
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
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-b-2 border-white/30 focus:border-white py-2 px-1 text-lg outline-none text-white"
                placeholder="1234567890"
              />
            </div>
            {phoneValidationError && (
              <div className="text-xs text-red-300 mt-2">{phoneValidationError}</div>
            )}
          </div>
        );

      case "select":
        if (question.id === "procedure") {
          return (
            <div className="w-full">
              <div className="max-h-80 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {DENTAL_PROCEDURES.map((procedure) => (
                  <button
                    key={procedure.id}
                    onClick={() => handleOptionSelect(procedure.id, procedure.name)}
                    className={`w-full text-left p-4 rounded-md transition-colors duration-200 ${
                      answers[question.id] === procedure.id
                        ? "bg-blue-700/70 border border-blue-500"
                        : "bg-purple-900/40 border border-purple-800/30 hover:bg-purple-800/50"
                    } text-white`}
                  >
                    <div className="flex items-start">
                      <Stethoscope className="h-5 w-5 mr-3 mt-1 text-blue-400 flex-shrink-0" />
                      <div>
                        <div className="font-medium">{procedure.name}</div>
                        <div className="text-sm text-white/70">{procedure.description}</div>
                        <div className="text-xs text-white/50 mt-1">
                          Duración aproximada: {procedure.duration} min
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Scroll indicator */}
              <div className="text-center mt-3">
                <div className="text-xs text-white/50 flex items-center justify-center gap-2">
                  <div className="w-1 h-1 bg-white/30 rounded-full"></div>
                  <span>Desliza para ver más opciones</span>
                  <div className="w-1 h-1 bg-white/30 rounded-full"></div>
                </div>
              </div>
            </div>
          );
        }

        if (question.id === "doctor") {
          return (
            <div className="w-full">
              <div className="max-h-80 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {doctors.map((doctor) => (
                  <button
                    key={doctor.uid}
                    onClick={() => handleOptionSelect(doctor.uid, doctor.displayName || doctor.email)}
                    className={`w-full text-left p-4 rounded-md transition-colors duration-200 ${
                      answers[question.id] === doctor.uid
                        ? "bg-blue-700/70 border border-blue-500"
                        : "bg-purple-900/40 border border-purple-800/30 hover:bg-purple-800/50"
                    } text-white`}
                  >
                    <div className="flex items-center">
                      <User className="h-5 w-5 mr-3 text-blue-400 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Dr. {doctor.displayName || doctor.email}</div>
                        <div className="text-sm text-white/70">Odontólogo</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Show scroll indicator only if there are many doctors */}
              {doctors.length > 4 && (
                <div className="text-center mt-3">
                  <div className="text-xs text-white/50 flex items-center justify-center gap-2">
                    <div className="w-1 h-1 bg-white/30 rounded-full"></div>
                    <span>Desliza para ver más doctores</span>
                    <div className="w-1 h-1 bg-white/30 rounded-full"></div>
                  </div>
                </div>
              )}
            </div>
          );
        }
        break;

      case "calendar":
        return (
          <div className="w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableDates.map((date, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(date.toISOString().split('T')[0], formatDate(date))}
                  className={`p-4 rounded-md transition-colors duration-200 ${
                    answers[question.id] === date.toISOString().split('T')[0]
                      ? "bg-blue-700/70 border border-blue-500"
                      : "bg-purple-900/40 border border-purple-800/30 hover:bg-purple-800/50"
                  } text-white text-left`}
                >
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-3 text-blue-400" />
                    <div>
                      <div className="font-medium">{formatDate(date)}</div>
                      <div className="text-sm text-white/70">
                        {date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case "time":
        return (
          <div className="w-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {availableTimes.map((time) => (
                <button
                  key={time}
                  onClick={() => handleOptionSelect(time)}
                  className={`p-3 rounded-md transition-colors duration-200 ${
                    answers[question.id] === time
                      ? "bg-blue-700/70 border border-blue-500"
                      : "bg-purple-900/40 border border-purple-800/30 hover:bg-purple-800/50"
                  } text-white text-center`}
                >
                  <div className="flex items-center justify-center">
                    <Clock className="h-4 w-4 mr-2 text-blue-400" />
                    <span className="font-medium">{time}</span>
                  </div>
                </button>
              ))}
            </div>
            {availableTimes.length === 0 && (
              <div className="text-center text-white/70 py-8">
                <Clock className="h-12 w-12 mx-auto mb-4 text-white/50" />
                <p>No hay horarios disponibles para esta fecha.</p>
                <p className="text-sm mt-2">Por favor selecciona otra fecha.</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Success screen
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-950 flex justify-center items-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-blue-900/40 backdrop-blur-md rounded-xl p-8 max-w-md w-full text-center border border-blue-700/30"
        >
          <div className="text-4xl mb-4">🦷</div>
          <h2 className="text-2xl font-bold text-white mb-3">
            ¡Solicitud Enviada!
          </h2>
          <p className="text-white/80 mb-6">
            Hemos recibido tu solicitud de cita. Nos pondremos en contacto contigo pronto para confirmar tu cita.
          </p>

          <div className="bg-blue-800/50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-white mb-2">Resumen de tu solicitud:</h3>
            <div className="space-y-1 text-sm text-white/80">
              <p><strong>Procedimiento:</strong> {answers.procedure_text}</p>
              <p><strong>Doctor:</strong> Dr. {answers.doctor_text}</p>
              <p><strong>Fecha:</strong> {answers.date_text}</p>
              <p><strong>Hora:</strong> {answers.time}</p>
            </div>
          </div>

          {answers.phone && (
            <div className="mb-4">
              <a
                href={generateWhatsAppLink(
                  `Hola! Soy ${answers.name}. Acabo de solicitar una cita dental para ${answers.procedure_text} el ${answers.date_text} a las ${answers.time}. ¿Pueden confirmar mi cita?`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-md transition-colors mb-3 w-full justify-center"
              >
                <Phone className="w-5 h-5" />
                Confirmar por WhatsApp
              </a>
              <p className="text-white/60 text-xs">
                Para confirmación más rápida
              </p>
            </div>
          )}

          <button
            onClick={() => window.location.href = "/"}
            className="bg-white text-blue-900 font-medium py-2 px-6 rounded-md hover:bg-white/90 transition-colors w-full"
          >
            Volver al inicio
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-950 flex justify-center items-center relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-64 h-64 rounded-full bg-blue-700/20 blur-3xl"></div>
        <div className="absolute bottom-1/3 -right-20 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl"></div>
      </div>

      {/* Main container */}
      <div className="w-full max-w-3xl mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🦷 Agenda tu Cita Dental</h1>
          <p className="text-white/70">Reserva tu cita con nuestros especialistas</p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/10 rounded-full h-2 mb-8">
          <motion.div
            className="h-2 rounded-full bg-white"
            initial={{ width: 0 }}
            animate={{
              width: `${((currentQuestion + 1) / questions.length) * 100}%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Question container */}
        <div className="relative min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex flex-col"
            >
              {/* Question counter */}
              <div className="text-white/60 text-sm mb-2">
                {currentQuestion + 1} de {questions.length}
              </div>

              {/* Question text */}
              <h2 className="text-xl sm:text-2xl md:text-3xl font-medium text-white mb-2">
                {questions[currentQuestion].text}
                {questions[currentQuestion].required && (
                  <span className="text-blue-300">*</span>
                )}
              </h2>

              {/* Question description */}
              {questions[currentQuestion].description && (
                <p className="text-white/70 text-sm mb-6">
                  {questions[currentQuestion].description}
                </p>
              )}

              {/* Question input */}
              <div className="flex-1 w-full">{renderQuestion()}</div>

              {/* Error message */}
              {error && (
                <div className="mt-4 text-red-300 text-sm bg-red-900/20 border border-red-500/30 rounded-md px-3 py-2">
                  {error}
                </div>
              )}

              {/* Navigation buttons */}
              <div className="mt-8 flex justify-between w-full">
                <button
                  onClick={handlePrev}
                  disabled={currentQuestion === 0}
                  className={`flex items-center gap-1 py-2 px-4 rounded-md ${
                    currentQuestion === 0
                      ? "opacity-0 pointer-events-none"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  } transition-colors`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>

                <button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className={`flex items-center gap-1 py-2 px-4 rounded-md ${
                    isSubmitting
                      ? "bg-blue-700/50 text-white/70 cursor-not-allowed"
                      : "bg-blue-700 text-white hover:bg-blue-600"
                  } transition-colors`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {currentQuestion === questions.length - 1
                          ? "Solicitar Cita"
                          : "Siguiente"}
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-white/40 text-xs">
          <p>🦷 Sistema de Citas Dentales</p>
        </div>
      </div>
    </div>
  );
};

export default DentalAppointmentForm;