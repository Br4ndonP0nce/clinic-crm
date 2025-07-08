"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getPatient,
  updatePatient,
  Patient,
  getPatientTreatments,
  TreatmentRecord,
  addAppointment,
  addTreatmentRecord,
} from "@/lib/firebase/db";
import { getAppointments, Appointment } from "@/lib/firebase/db";
import { getAllUsers, UserProfile } from "@/lib/firebase/rbac";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Edit2,
  Save,
  ExternalLink,
  Mail,
  Phone,
  Calendar,
  Trash2,
  User,
  Heart,
  Stethoscope,
  CreditCard,
  FileText,
  Clock,
  MapPin,
  Shield,
  AlertTriangle,
  Pill,
  Plus,
  X,
  CalendarPlus,
  Activity,
} from "lucide-react";
import { Timestamp } from "firebase/firestore";

export default function PatientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { userProfile, hasPermission } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [treatments, setTreatments] = useState<TreatmentRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState<Partial<Patient>>({});
  const [error, setError] = useState<string | null>(null);
  const [activeEditSection, setActiveEditSection] = useState<string | null>(
    null
  );

  // Modal states
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [showNewTreatmentModal, setShowNewTreatmentModal] = useState(false);

  // New appointment form data
  const [newAppointmentData, setNewAppointmentData] = useState({
    doctorId: "",
    date: "",
    time: "",
    duration: 60,
    type: "consultation" as const,
    reasonForVisit: "",
    notes: "",
  });

  // New treatment form data
  const [newTreatmentData, setNewTreatmentData] = useState({
    doctorId: "",
    date: "",
    treatmentCode: "",
    description: "",
    tooth: [] as string[],
    diagnosis: "",
    notes: "",
    totalCost: 0,
    insuranceCovered: 0,
    status: "planned" as const,
  });

  const patientId = params.id as string;

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setIsLoading(true);

        // Fetch patient data
        const patientData = await getPatient(patientId);
        setPatient(patientData);

        if (patientData) {
          setEditableData({
            ...patientData,
          });

          // Fetch related data
          const [treatmentData, appointmentData, allUsers] = await Promise.all([
            getPatientTreatments(patientId),
            getAppointments(undefined, undefined, undefined, patientId),
            getAllUsers(),
          ]);

          setTreatments(treatmentData);
          setAppointments(appointmentData);

          // Filter doctors
          const doctorUsers = allUsers.filter(
            (user) => user.role === "doctor" && user.isActive
          );
          setDoctors(doctorUsers);
        }
      } catch (err) {
        console.error("Error fetching patient:", err);
        setError("Failed to load patient data");
      } finally {
        setIsLoading(false);
      }
    };

    if (patientId) {
      fetchPatientData();
    }
  }, [patientId]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await updatePatient(patientId, editableData, userProfile?.uid);
      // Update local state with new data
      setPatient((prev) => (prev ? { ...prev, ...editableData } : null));
      setIsEditing(false);
      setActiveEditSection(null);
    } catch (err) {
      console.error("Error updating patient:", err);
      setError("Failed to update patient");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditableData(patient || {});
    setIsEditing(false);
    setActiveEditSection(null);
  };

  const handleSectionEdit = (section: string) => {
    setActiveEditSection(section);
    setIsEditing(true);
  };

  const handleCreateAppointment = async () => {
    try {
      setIsLoading(true);

      const appointmentDateTime = new Date(
        `${newAppointmentData.date}T${newAppointmentData.time}`
      );

      const appointmentData = {
        patientId: patientId,
        doctorId: newAppointmentData.doctorId,
        appointmentDate: Timestamp.fromDate(appointmentDateTime),
        duration: newAppointmentData.duration,
        type: newAppointmentData.type,
        status: "scheduled" as const,
        reasonForVisit: newAppointmentData.reasonForVisit,
        notes: newAppointmentData.notes,
        reminders: [],
        createdBy: userProfile?.uid || "unknown",
      };

      await addAppointment(appointmentData);

      // Refresh appointments
      const updatedAppointments = await getAppointments(
        undefined,
        undefined,
        undefined,
        patientId
      );
      setAppointments(updatedAppointments);

      // Reset form and close modal
      setNewAppointmentData({
        doctorId: "",
        date: "",
        time: "",
        duration: 60,
        type: "consultation",
        reasonForVisit: "",
        notes: "",
      });
      setShowNewAppointmentModal(false);
    } catch (err) {
      console.error("Error creating appointment:", err);
      setError("Failed to create appointment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTreatment = async () => {
    try {
      setIsLoading(true);

      const treatmentDate = new Date(newTreatmentData.date);

      const treatmentData = {
        patientId: patientId,
        date: Timestamp.fromDate(treatmentDate),
        doctorId: newTreatmentData.doctorId,
        treatment: {
          code: newTreatmentData.treatmentCode,
          description: newTreatmentData.description,
          tooth: newTreatmentData.tooth,
          diagnosis: newTreatmentData.diagnosis,
          notes: newTreatmentData.notes,
        },
        cost: {
          total: newTreatmentData.totalCost,
          insuranceCovered: newTreatmentData.insuranceCovered,
          patientPortion:
            newTreatmentData.totalCost - newTreatmentData.insuranceCovered,
        },
        status: newTreatmentData.status,
      };

      await addTreatmentRecord(treatmentData);

      // Refresh treatments
      const updatedTreatments = await getPatientTreatments(patientId);
      setTreatments(updatedTreatments);

      // Reset form and close modal
      setNewTreatmentData({
        doctorId: "",
        date: "",
        treatmentCode: "",
        description: "",
        tooth: [],
        diagnosis: "",
        notes: "",
        totalCost: 0,
        insuranceCovered: 0,
        status: "planned",
      });
      setShowNewTreatmentModal(false);
    } catch (err) {
      console.error("Error creating treatment:", err);
      setError("Failed to create treatment");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
  const getStatusColor = (status: Patient["status"]) => {
    switch (status) {
      case "inquiry":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "scheduled":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "treatment":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "maintenance":
        return "bg-teal-100 text-teal-800 border-teal-200";
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: Patient["status"]) => {
    switch (status) {
      case "inquiry":
        return "Consulta";
      case "scheduled":
        return "Programado";
      case "active":
        return "Activo";
      case "treatment":
        return "En Tratamiento";
      case "maintenance":
        return "Mantenimiento";
      case "inactive":
        return "Inactivo";
      default:
        return "Desconocido";
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const calculateAge = (dateOfBirth: Date) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  // Type-safe helper functions for updating nested data
  const updateNestedData = (
    field: keyof Patient,
    subField: string,
    value: any
  ) => {
    setEditableData((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [subField]: value,
      },
    }));
  };

  // Add/Remove functions for arrays with proper typing
  const addToMedicalArray = (
    arrayType: "allergies" | "medications" | "medicalConditions" | "surgeries",
    value: string
  ) => {
    if (!value.trim()) return;

    setEditableData((prev) => {
      const current = prev.medicalHistory || {};
      const currentArray = current[arrayType] || [];

      if (!currentArray.includes(value)) {
        return {
          ...prev,
          medicalHistory: {
            ...current,
            [arrayType]: [...currentArray, value],
          },
        };
      }
      return prev;
    });
  };

  const removeFromMedicalArray = (
    arrayType: "allergies" | "medications" | "medicalConditions" | "surgeries",
    index: number
  ) => {
    setEditableData((prev) => {
      const current = prev.medicalHistory || {};
      const currentArray = current[arrayType] || [];

      return {
        ...prev,
        medicalHistory: {
          ...current,
          [arrayType]: currentArray.filter((_, i) => i !== index),
        },
      };
    });
  };

  const addToDentalArray = (arrayType: "currentProblems", value: string) => {
    if (!value.trim()) return;

    setEditableData((prev) => {
      const current = prev.dentalHistory || {};
      const currentArray = current[arrayType] || [];

      if (!currentArray.includes(value)) {
        return {
          ...prev,
          dentalHistory: {
            ...current,
            [arrayType]: [...currentArray, value],
          },
        };
      }
      return prev;
    });
  };

  const removeFromDentalArray = (
    arrayType: "currentProblems",
    index: number
  ) => {
    setEditableData((prev) => {
      const current = prev.dentalHistory || {};
      const currentArray = current[arrayType] || [];

      return {
        ...prev,
        dentalHistory: {
          ...current,
          [arrayType]: currentArray.filter((_, i) => i !== index),
        },
      };
    });
  };

  if (isLoading && !patient) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="p-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <div className="bg-red-100 text-red-700 p-4 rounded-md">
          {error || "Paciente no encontrado"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/patients")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Pacientes
        </Button>

        <div className="flex gap-2">
          {/* New Appointment Button */}
          <Dialog
            open={showNewAppointmentModal}
            onOpenChange={setShowNewAppointmentModal}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <CalendarPlus className="mr-2 h-4 w-4" />
                Nueva Cita
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nueva Cita para {patient.fullName}</DialogTitle>
                <DialogDescription>
                  Programar una nueva cita médica
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="appointmentDoctor">Doctor</Label>
                  <Select
                    value={newAppointmentData.doctorId}
                    onValueChange={(value) =>
                      setNewAppointmentData((prev) => ({
                        ...prev,
                        doctorId: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.uid} value={doctor.uid}>
                          {doctor.displayName || doctor.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="appointmentDate">Fecha</Label>
                    <Input
                      id="appointmentDate"
                      type="date"
                      value={newAppointmentData.date}
                      onChange={(e) =>
                        setNewAppointmentData((prev) => ({
                          ...prev,
                          date: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="appointmentTime">Hora</Label>
                    <Input
                      id="appointmentTime"
                      type="time"
                      value={newAppointmentData.time}
                      onChange={(e) =>
                        setNewAppointmentData((prev) => ({
                          ...prev,
                          time: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="appointmentType">Tipo</Label>
                    <Select
                      value={newAppointmentData.type}
                      onValueChange={(value: any) =>
                        setNewAppointmentData((prev) => ({
                          ...prev,
                          type: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consultation">Consulta</SelectItem>
                        <SelectItem value="cleaning">Limpieza</SelectItem>
                        <SelectItem value="procedure">Procedimiento</SelectItem>
                        <SelectItem value="followup">Seguimiento</SelectItem>
                        <SelectItem value="emergency">Emergencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="appointmentDuration">Duración (min)</Label>
                    <Select
                      value={newAppointmentData.duration.toString()}
                      onValueChange={(value) =>
                        setNewAppointmentData((prev) => ({
                          ...prev,
                          duration: parseInt(value),
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="60">1 hora</SelectItem>
                        <SelectItem value="90">1.5 horas</SelectItem>
                        <SelectItem value="120">2 horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="appointmentReason">Motivo de la visita</Label>
                  <Input
                    id="appointmentReason"
                    value={newAppointmentData.reasonForVisit}
                    onChange={(e) =>
                      setNewAppointmentData((prev) => ({
                        ...prev,
                        reasonForVisit: e.target.value,
                      }))
                    }
                    placeholder="Motivo de la cita"
                  />
                </div>

                <div>
                  <Label htmlFor="appointmentNotes">Notas adicionales</Label>
                  <Textarea
                    id="appointmentNotes"
                    value={newAppointmentData.notes}
                    onChange={(e) =>
                      setNewAppointmentData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Notas sobre la cita"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowNewAppointmentModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateAppointment}
                  disabled={
                    !newAppointmentData.doctorId ||
                    !newAppointmentData.date ||
                    !newAppointmentData.time
                  }
                >
                  Crear Cita
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* New Treatment Button */}
          <Dialog
            open={showNewTreatmentModal}
            onOpenChange={setShowNewTreatmentModal}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <Activity className="mr-2 h-4 w-4" />
                Nuevo Tratamiento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  Nuevo Tratamiento para {patient.fullName}
                </DialogTitle>
                <DialogDescription>
                  Registrar un nuevo tratamiento médico
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div>
                  <Label htmlFor="treatmentDoctor">Doctor</Label>
                  <Select
                    value={newTreatmentData.doctorId}
                    onValueChange={(value) =>
                      setNewTreatmentData((prev) => ({
                        ...prev,
                        doctorId: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.uid} value={doctor.uid}>
                          {doctor.displayName || doctor.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="treatmentDate">Fecha del tratamiento</Label>
                  <Input
                    id="treatmentDate"
                    type="date"
                    value={newTreatmentData.date}
                    onChange={(e) =>
                      setNewTreatmentData((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="treatmentCode">Código</Label>
                    <Input
                      id="treatmentCode"
                      value={newTreatmentData.treatmentCode}
                      onChange={(e) =>
                        setNewTreatmentData((prev) => ({
                          ...prev,
                          treatmentCode: e.target.value,
                        }))
                      }
                      placeholder="D1110"
                    />
                  </div>
                  <div>
                    <Label htmlFor="treatmentStatus">Estado</Label>
                    <Select
                      value={newTreatmentData.status}
                      onValueChange={(value: any) =>
                        setNewTreatmentData((prev) => ({
                          ...prev,
                          status: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">Planificado</SelectItem>
                        <SelectItem value="in_progress">En Progreso</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="treatmentDescription">Descripción</Label>
                  <Input
                    id="treatmentDescription"
                    value={newTreatmentData.description}
                    onChange={(e) =>
                      setNewTreatmentData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Limpieza dental profesional"
                  />
                </div>

                <div>
                  <Label htmlFor="treatmentDiagnosis">Diagnóstico</Label>
                  <Input
                    id="treatmentDiagnosis"
                    value={newTreatmentData.diagnosis}
                    onChange={(e) =>
                      setNewTreatmentData((prev) => ({
                        ...prev,
                        diagnosis: e.target.value,
                      }))
                    }
                    placeholder="Gingivitis leve"
                  />
                </div>

                <div>
                  <Label htmlFor="treatmentTooth">
                    Dientes afectados (separados por coma)
                  </Label>
                  <Input
                    id="treatmentTooth"
                    value={newTreatmentData.tooth.join(", ")}
                    onChange={(e) =>
                      setNewTreatmentData((prev) => ({
                        ...prev,
                        tooth: e.target.value
                          .split(",")
                          .map((t) => t.trim())
                          .filter((t) => t),
                      }))
                    }
                    placeholder="14, 15, 16"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="treatmentCost">Costo total</Label>
                    <Input
                      id="treatmentCost"
                      type="number"
                      value={newTreatmentData.totalCost}
                      onChange={(e) =>
                        setNewTreatmentData((prev) => ({
                          ...prev,
                          totalCost: parseFloat(e.target.value) || 0,
                        }))
                      }
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="treatmentInsurance">
                      Cubierto por seguro
                    </Label>
                    <Input
                      id="treatmentInsurance"
                      type="number"
                      value={newTreatmentData.insuranceCovered}
                      onChange={(e) =>
                        setNewTreatmentData((prev) => ({
                          ...prev,
                          insuranceCovered: parseFloat(e.target.value) || 0,
                        }))
                      }
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="treatmentNotes">Notas</Label>
                  <Textarea
                    id="treatmentNotes"
                    value={newTreatmentData.notes}
                    onChange={(e) =>
                      setNewTreatmentData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Notas del tratamiento"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowNewTreatmentModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateTreatment}
                  disabled={
                    !newTreatmentData.doctorId ||
                    !newTreatmentData.date ||
                    !newTreatmentData.description
                  }
                >
                  Crear Tratamiento
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit/Save buttons */}
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" /> Guardar
              </Button>
            </>
          ) : (
            hasPermission("patients:write") && (
              <Button onClick={() => setIsEditing(true)}>
                <Edit2 className="mr-2 h-4 w-4" /> Editar
              </Button>
            )
          )}
        </div>
      </div>

      {/* Patient Header */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-blue-700 text-white text-xl">
                {patient.firstName.slice(0, 1).toUpperCase()}
                {patient.lastName.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{patient.fullName}</CardTitle>
              <CardDescription className="flex items-center space-x-4 mt-2">
                <Badge className={`${getStatusColor(patient.status)}`}>
                  {getStatusLabel(patient.status)}
                </Badge>
                <span className="text-sm text-gray-600">
                  {patient.dateOfBirth &&
                    `${calculateAge(patient.dateOfBirth.toDate())} años`}
                </span>
                <span className="text-sm text-gray-600 capitalize">
                  {patient.gender === "prefer_not_to_say"
                    ? "No especifica"
                    : patient.gender}
                </span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="medical">Historial Médico</TabsTrigger>
          <TabsTrigger value="dental">Historial Dental</TabsTrigger>
          <TabsTrigger value="appointments">Citas</TabsTrigger>
          <TabsTrigger value="treatments">Tratamientos</TabsTrigger>
        </TabsList>

        {/* General Information Tab */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Information */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Información de Contacto
                </CardTitle>
                {!isEditing && hasPermission("patients:write") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSectionEdit("contact")}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Nombre
                    </label>
                    {isEditing && activeEditSection === "contact" ? (
                      <Input
                        value={editableData.firstName || ""}
                        onChange={(e) =>
                          setEditableData({
                            ...editableData,
                            firstName: e.target.value,
                          })
                        }
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1">{patient.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Apellido
                    </label>
                    {isEditing && activeEditSection === "contact" ? (
                      <Input
                        value={editableData.lastName || ""}
                        onChange={(e) =>
                          setEditableData({
                            ...editableData,
                            lastName: e.target.value,
                          })
                        }
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1">{patient.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Estado del Paciente
                  </label>
                  {isEditing && activeEditSection === "contact" ? (
                    <Select
                      value={editableData.status || patient.status}
                      onValueChange={(value: Patient["status"]) =>
                        setEditableData({
                          ...editableData,
                          status: value,
                        })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inquiry">Consulta</SelectItem>
                        <SelectItem value="scheduled">Programado</SelectItem>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="treatment">
                          En Tratamiento
                        </SelectItem>
                        <SelectItem value="maintenance">
                          Mantenimiento
                        </SelectItem>
                        <SelectItem value="inactive">Inactivo</SelectItem>
                        <SelectItem value="transferred">Transferido</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-1">
                      <Badge className={getStatusColor(patient.status)}>
                        {getStatusLabel(patient.status)}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-500 mr-2" />
                  {isEditing && activeEditSection === "contact" ? (
                    <Input
                      type="email"
                      value={editableData.email || ""}
                      onChange={(e) =>
                        setEditableData({
                          ...editableData,
                          email: e.target.value,
                        })
                      }
                      className="w-full"
                    />
                  ) : (
                    <a
                      href={`mailto:${patient.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {patient.email}
                    </a>
                  )}
                </div>

                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-500 mr-2" />
                  {isEditing && activeEditSection === "contact" ? (
                    <Input
                      type="tel"
                      value={editableData.phone || ""}
                      onChange={(e) =>
                        setEditableData({
                          ...editableData,
                          phone: e.target.value,
                        })
                      }
                      className="w-full"
                    />
                  ) : (
                    <a
                      href={`tel:${patient.phone}`}
                      className="hover:underline"
                    >
                      {patient.phone}
                    </a>
                  )}
                </div>

                {(patient.alternatePhone ||
                  (isEditing && activeEditSection === "contact")) && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-500 mr-2" />
                    {isEditing && activeEditSection === "contact" ? (
                      <Input
                        type="tel"
                        value={editableData.alternatePhone || ""}
                        onChange={(e) =>
                          setEditableData({
                            ...editableData,
                            alternatePhone: e.target.value,
                          })
                        }
                        placeholder="Teléfono alternativo"
                        className="w-full"
                      />
                    ) : (
                      <span className="text-sm">
                        Teléfono alternativo: {patient.alternatePhone}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  Dirección
                </CardTitle>
                {!isEditing && hasPermission("patients:write") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSectionEdit("address")}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {isEditing && activeEditSection === "address" ? (
                  <div className="space-y-3">
                    <Input
                      value={editableData.address?.street || ""}
                      onChange={(e) =>
                        setEditableData({
                          ...editableData,
                          address: {
                            ...editableData.address,
                            street: e.target.value,
                          },
                        })
                      }
                      placeholder="Calle y número"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={editableData.address?.city || ""}
                        onChange={(e) =>
                          setEditableData({
                            ...editableData,
                            address: {
                              ...editableData.address,
                              city: e.target.value,
                            },
                          })
                        }
                        placeholder="Ciudad"
                      />
                      <Input
                        value={editableData.address?.state || ""}
                        onChange={(e) =>
                          setEditableData({
                            ...editableData,
                            address: {
                              ...editableData.address,
                              state: e.target.value,
                            },
                          })
                        }
                        placeholder="Estado"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={editableData.address?.zipCode || ""}
                        onChange={(e) =>
                          setEditableData({
                            ...editableData,
                            address: {
                              ...editableData.address,
                              zipCode: e.target.value,
                            },
                          })
                        }
                        placeholder="Código postal"
                      />
                      <Input
                        value={editableData.address?.country || ""}
                        onChange={(e) =>
                          setEditableData({
                            ...editableData,
                            address: {
                              ...editableData.address,
                              country: e.target.value,
                            },
                          })
                        }
                        placeholder="País"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <p>{patient.address.street}</p>
                    <p>
                      {patient.address.city}, {patient.address.state}{" "}
                      {patient.address.zipCode}
                    </p>
                    <p>{patient.address.country}</p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Insurance Information */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Seguro Médico
                </CardTitle>
                {!isEditing && hasPermission("patients:write") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSectionEdit("insurance")}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {isEditing && activeEditSection === "insurance" ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editableData.insurance?.isActive ?? false}
                        onChange={(e) =>
                          updateNestedData(
                            "insurance",
                            "isActive",
                            e.target.checked
                          )
                        }
                      />
                      <label>Seguro activo</label>
                    </div>
                    {editableData.insurance?.isActive && (
                      <>
                        <Input
                          value={editableData.insurance?.provider || ""}
                          onChange={(e) =>
                            updateNestedData(
                              "insurance",
                              "provider",
                              e.target.value
                            )
                          }
                          placeholder="Proveedor de seguro"
                        />
                        <Input
                          value={editableData.insurance?.policyNumber || ""}
                          onChange={(e) =>
                            updateNestedData(
                              "insurance",
                              "policyNumber",
                              e.target.value
                            )
                          }
                          placeholder="Número de póliza"
                        />
                        <Input
                          value={editableData.insurance?.subscriberName || ""}
                          onChange={(e) =>
                            updateNestedData(
                              "insurance",
                              "subscriberName",
                              e.target.value
                            )
                          }
                          placeholder="Nombre del titular"
                        />
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    {patient.insurance.isActive ? (
                      <>
                        <p>
                          <strong>Proveedor:</strong>{" "}
                          {patient.insurance.provider}
                        </p>
                        <p>
                          <strong>Número de Póliza:</strong>{" "}
                          {patient.insurance.policyNumber}
                        </p>
                        <p>
                          <strong>Titular:</strong>{" "}
                          {patient.insurance.subscriberName}
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-500">Sin seguro médico activo</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Contacto de Emergencia
                </CardTitle>
                {!isEditing && hasPermission("patients:write") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSectionEdit("emergency")}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {isEditing && activeEditSection === "emergency" ? (
                  <div className="space-y-3">
                    <Input
                      value={editableData.emergencyContact?.name || ""}
                      onChange={(e) =>
                        updateNestedData(
                          "emergencyContact",
                          "name",
                          e.target.value
                        )
                      }
                      placeholder="Nombre del contacto"
                    />
                    <Input
                      value={editableData.emergencyContact?.relationship || ""}
                      onChange={(e) =>
                        updateNestedData(
                          "emergencyContact",
                          "relationship",
                          e.target.value
                        )
                      }
                      placeholder="Relación (padre, hermano, etc.)"
                    />
                    <Input
                      value={editableData.emergencyContact?.phone || ""}
                      onChange={(e) =>
                        updateNestedData(
                          "emergencyContact",
                          "phone",
                          e.target.value
                        )
                      }
                      placeholder="Teléfono de contacto"
                    />
                  </div>
                ) : (
                  <>
                    <p>
                      <strong>Nombre:</strong> {patient.emergencyContact.name}
                    </p>
                    <p>
                      <strong>Relación:</strong>{" "}
                      {patient.emergencyContact.relationship}
                    </p>
                    <p>
                      <strong>Teléfono:</strong>{" "}
                      {patient.emergencyContact.phone}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notes Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Notas</CardTitle>
              {!isEditing && hasPermission("patients:write") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSectionEdit("notes")}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditing && activeEditSection === "notes" ? (
                <Textarea
                  value={editableData.notes || ""}
                  onChange={(e) =>
                    setEditableData({
                      ...editableData,
                      notes: e.target.value,
                    })
                  }
                  className="w-full h-32 resize-none"
                  placeholder="Añadir notas sobre este paciente..."
                />
              ) : (
                <p className="whitespace-pre-wrap">
                  {patient.notes || "No hay notas disponibles"}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medical History Tab */}
        <TabsContent value="medical" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Allergies */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
                  Alergias
                </CardTitle>
                {!isEditing && hasPermission("patients:write") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSectionEdit("allergies")}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isEditing && activeEditSection === "allergies" ? (
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Agregar nueva alergia"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            const value = e.currentTarget.value;
                            addToMedicalArray("allergies", value);
                            e.currentTarget.value = "";
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={(e) => {
                          const input =
                            e.currentTarget.parentElement?.querySelector(
                              "input"
                            ) as HTMLInputElement;
                          if (input) {
                            addToMedicalArray("allergies", input.value);
                            input.value = "";
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(editableData.medicalHistory?.allergies || []).map(
                        (allergy, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-red-50 rounded border-l-4 border-red-400"
                          >
                            <span>{allergy}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                removeFromMedicalArray("allergies", index)
                              }
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {patient.medicalHistory.allergies.length > 0 ? (
                      <div className="space-y-2">
                        {patient.medicalHistory.allergies.map(
                          (allergy, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="mr-2 mb-2 bg-red-50 text-red-700 border-red-200"
                            >
                              {allergy}
                            </Badge>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">Sin alergias conocidas</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Medications */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                  <Pill className="mr-2 h-5 w-5 text-blue-500" />
                  Medicamentos
                </CardTitle>
                {!isEditing && hasPermission("patients:write") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSectionEdit("medications")}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isEditing && activeEditSection === "medications" ? (
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Agregar nuevo medicamento"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            const value = e.currentTarget.value;
                            addToMedicalArray("medications", value);
                            e.currentTarget.value = "";
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={(e) => {
                          const input =
                            e.currentTarget.parentElement?.querySelector(
                              "input"
                            ) as HTMLInputElement;
                          if (input) {
                            addToMedicalArray("medications", input.value);
                            input.value = "";
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(editableData.medicalHistory?.medications || []).map(
                        (medication, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-blue-50 rounded border-l-4 border-blue-400"
                          >
                            <span>{medication}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                removeFromMedicalArray("medications", index)
                              }
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {patient.medicalHistory.medications.length > 0 ? (
                      <div className="space-y-2">
                        {patient.medicalHistory.medications.map(
                          (medication, index) => (
                            <div
                              key={index}
                              className="p-2 bg-blue-50 rounded border-l-4 border-blue-400"
                            >
                              {medication}
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">Sin medicamentos actuales</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Medical Conditions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                  <Heart className="mr-2 h-5 w-5 text-purple-500" />
                  Condiciones Médicas
                </CardTitle>
                {!isEditing && hasPermission("patients:write") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSectionEdit("conditions")}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isEditing && activeEditSection === "conditions" ? (
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Agregar nueva condición médica"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            const value = e.currentTarget.value;
                            addToMedicalArray("medicalConditions", value);
                            e.currentTarget.value = "";
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={(e) => {
                          const input =
                            e.currentTarget.parentElement?.querySelector(
                              "input"
                            ) as HTMLInputElement;
                          if (input) {
                            addToMedicalArray("medicalConditions", input.value);
                            input.value = "";
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(
                        editableData.medicalHistory?.medicalConditions || []
                      ).map((condition, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-purple-50 rounded border-l-4 border-purple-400"
                        >
                          <span>{condition}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              removeFromMedicalArray("medicalConditions", index)
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {patient.medicalHistory.medicalConditions.length > 0 ? (
                      <div className="space-y-2">
                        {patient.medicalHistory.medicalConditions.map(
                          (condition, index) => (
                            <div
                              key={index}
                              className="p-2 bg-purple-50 rounded border-l-4 border-purple-400"
                            >
                              {condition}
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        Sin condiciones médicas reportadas
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Surgeries */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                  <Stethoscope className="mr-2 h-5 w-5 text-green-500" />
                  Cirugías Previas
                </CardTitle>
                {!isEditing && hasPermission("patients:write") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSectionEdit("surgeries")}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isEditing && activeEditSection === "surgeries" ? (
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Agregar nueva cirugía"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            const value = e.currentTarget.value;
                            addToMedicalArray("surgeries", value);
                            e.currentTarget.value = "";
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={(e) => {
                          const input =
                            e.currentTarget.parentElement?.querySelector(
                              "input"
                            ) as HTMLInputElement;
                          if (input) {
                            addToMedicalArray("surgeries", input.value);
                            input.value = "";
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(editableData.medicalHistory?.surgeries || []).map(
                        (surgery, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-green-50 rounded border-l-4 border-green-400"
                          >
                            <span>{surgery}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                removeFromMedicalArray("surgeries", index)
                              }
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {patient.medicalHistory.surgeries.length > 0 ? (
                      <div className="space-y-2">
                        {patient.medicalHistory.surgeries.map(
                          (surgery, index) => (
                            <div
                              key={index}
                              className="p-2 bg-green-50 rounded border-l-4 border-green-400"
                            >
                              {surgery}
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">Sin cirugías previas</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Primary Physician */}
          {(patient.medicalHistory.primaryPhysician || isEditing) && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Médico de Cabecera</CardTitle>
                {!isEditing && hasPermission("patients:write") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSectionEdit("physician")}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isEditing && activeEditSection === "physician" ? (
                  <div className="space-y-3">
                    <Input
                      value={
                        editableData.medicalHistory?.primaryPhysician || ""
                      }
                      onChange={(e) =>
                        updateNestedData(
                          "medicalHistory",
                          "primaryPhysician",
                          e.target.value
                        )
                      }
                      placeholder="Nombre del médico de cabecera"
                    />
                  </div>
                ) : (
                  <>
                    <p>{patient.medicalHistory.primaryPhysician}</p>
                    {patient.medicalHistory.lastPhysicalExam && (
                      <p className="text-sm text-gray-600 mt-2">
                        Último examen físico:{" "}
                        {formatDate(patient.medicalHistory.lastPhysicalExam)}
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Dental History Tab */}
        <TabsContent value="dental" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dental History Overview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                  <Stethoscope className="mr-2 h-5 w-5" />
                  Historial Dental
                </CardTitle>
                {!isEditing && hasPermission("patients:write") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSectionEdit("dentalHistory")}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing && activeEditSection === "dentalHistory" ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Dentista Anterior</Label>
                      <Input
                        value={
                          editableData.dentalHistory?.previousDentist || ""
                        }
                        onChange={(e) =>
                          updateNestedData(
                            "dentalHistory",
                            "previousDentist",
                            e.target.value
                          )
                        }
                        placeholder="Nombre del dentista anterior"
                      />
                    </div>
                    <div>
                      <Label>Motivo de Consulta</Label>
                      <Input
                        value={editableData.dentalHistory?.reasonForVisit || ""}
                        onChange={(e) =>
                          updateNestedData(
                            "dentalHistory",
                            "reasonForVisit",
                            e.target.value
                          )
                        }
                        placeholder="Motivo principal de la visita"
                      />
                    </div>
                    <div>
                      <Label>Nivel de Dolor (1-10)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        value={editableData.dentalHistory?.painLevel || ""}
                        onChange={(e) =>
                          updateNestedData(
                            "dentalHistory",
                            "painLevel",
                            parseInt(e.target.value) || 0
                          )
                        }
                        placeholder="0-10"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Última Visita Dental
                      </label>
                      <p className="mt-1">
                        {patient.dentalHistory.lastVisit
                          ? formatDate(patient.dentalHistory.lastVisit)
                          : "No registrada"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Última Limpieza
                      </label>
                      <p className="mt-1">
                        {patient.dentalHistory.lastCleaning
                          ? formatDate(patient.dentalHistory.lastCleaning)
                          : "No registrada"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Dentista Anterior
                      </label>
                      <p className="mt-1">
                        {patient.dentalHistory.previousDentist ||
                          "No especificado"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Motivo de Consulta
                      </label>
                      <p className="mt-1">
                        {patient.dentalHistory.reasonForVisit}
                      </p>
                    </div>
                    {patient.dentalHistory.painLevel && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Nivel de Dolor
                        </label>
                        <p className="mt-1 text-red-600 font-medium">
                          {patient.dentalHistory.painLevel}/10
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Oral Hygiene */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Higiene Oral</CardTitle>
                {!isEditing && hasPermission("patients:write") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSectionEdit("oralHygiene")}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing && activeEditSection === "oralHygiene" ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Higiene Oral General</Label>
                      <Select
                        value={
                          editableData.dentalHistory?.oralHygiene || "good"
                        }
                        onValueChange={(value: any) =>
                          updateNestedData(
                            "dentalHistory",
                            "oralHygiene",
                            value
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excellent">Excelente</SelectItem>
                          <SelectItem value="good">Buena</SelectItem>
                          <SelectItem value="fair">Regular</SelectItem>
                          <SelectItem value="poor">Deficiente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Frecuencia de Cepillado</Label>
                      <Select
                        value={
                          editableData.dentalHistory?.brushingFrequency ||
                          "twice_daily"
                        }
                        onValueChange={(value: any) =>
                          updateNestedData(
                            "dentalHistory",
                            "brushingFrequency",
                            value
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="twice_daily">
                            Dos veces al día
                          </SelectItem>
                          <SelectItem value="daily">Una vez al día</SelectItem>
                          <SelectItem value="few_times_week">
                            Pocas veces por semana
                          </SelectItem>
                          <SelectItem value="rarely">Raramente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Frecuencia de Uso de Hilo Dental</Label>
                      <Select
                        value={
                          editableData.dentalHistory?.flossingFrequency ||
                          "daily"
                        }
                        onValueChange={(value: any) =>
                          updateNestedData(
                            "dentalHistory",
                            "flossingFrequency",
                            value
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Diariamente</SelectItem>
                          <SelectItem value="few_times_week">
                            Pocas veces por semana
                          </SelectItem>
                          <SelectItem value="weekly">Semanalmente</SelectItem>
                          <SelectItem value="rarely">Raramente</SelectItem>
                          <SelectItem value="never">Nunca</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Higiene Oral General
                      </label>
                      <div className="mt-1">
                        <Badge variant="outline">
                          {patient.dentalHistory.oralHygiene}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Frecuencia de Cepillado
                      </label>
                      <p className="mt-1">
                        {patient.dentalHistory.brushingFrequency.replace(
                          "_",
                          " "
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Frecuencia de Uso de Hilo Dental
                      </label>
                      <p className="mt-1">
                        {patient.dentalHistory.flossingFrequency.replace(
                          "_",
                          " "
                        )}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Current Problems */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
                Problemas Actuales
              </CardTitle>
              {!isEditing && hasPermission("patients:write") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSectionEdit("dentalProblems")}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditing && activeEditSection === "dentalProblems" ? (
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Agregar nuevo problema dental"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          const value = e.currentTarget.value;
                          addToArray("dentalHistory", "currentProblems", value);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={(e) => {
                        const input =
                          e.currentTarget.parentElement?.querySelector(
                            "input"
                          ) as HTMLInputElement;
                        if (input) {
                          addToArray(
                            "dentalHistory",
                            "currentProblems",
                            input.value
                          );
                          input.value = "";
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(editableData.dentalHistory?.currentProblems || []).map(
                      (problem, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-orange-50 rounded border-l-4 border-orange-400"
                        >
                          <span>{problem}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              removeFromArray(
                                "dentalHistory",
                                "currentProblems",
                                index
                              )
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {patient.dentalHistory.currentProblems.length > 0 ? (
                    <div className="space-y-2">
                      {patient.dentalHistory.currentProblems.map(
                        (problem, index) => (
                          <div
                            key={index}
                            className="p-3 bg-orange-50 rounded border-l-4 border-orange-400"
                          >
                            {problem}
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      Sin problemas dentales actuales reportados
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Historial de Citas ({appointments.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.map((appointment) => {
                    const doctor = doctors.find(
                      (d) => d.uid === appointment.doctorId
                    );
                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case "completed":
                          return "bg-green-100 text-green-800";
                        case "scheduled":
                          return "bg-blue-100 text-blue-800";
                        case "confirmed":
                          return "bg-purple-100 text-purple-800";
                        case "cancelled":
                          return "bg-red-100 text-red-800";
                        case "no_show":
                          return "bg-gray-100 text-gray-800";
                        default:
                          return "bg-gray-100 text-gray-800";
                      }
                    };

                    const getTypeLabel = (type: string) => {
                      const labels: Record<string, string> = {
                        consultation: "Consulta",
                        cleaning: "Limpieza",
                        procedure: "Procedimiento",
                        followup: "Seguimiento",
                        emergency: "Emergencia",
                      };
                      return labels[type] || type;
                    };

                    return (
                      <div
                        key={appointment.id}
                        className="border rounded-lg p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-medium text-lg">
                                {getTypeLabel(appointment.type)}
                              </h4>
                              <Badge
                                className={getStatusColor(appointment.status)}
                              >
                                {appointment.status}
                              </Badge>
                            </div>

                            <div className="space-y-1 text-sm text-gray-600">
                              <p className="flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                {formatDate(appointment.appointmentDate)} •{" "}
                                {appointment.duration} min
                              </p>
                              <p className="flex items-center">
                                <User className="h-4 w-4 mr-2" />
                                Dr.{" "}
                                {doctor?.displayName || appointment.doctorId}
                              </p>
                              <p>
                                <strong>Motivo:</strong>{" "}
                                {appointment.reasonForVisit}
                              </p>
                            </div>

                            {appointment.notes && (
                              <div className="mt-3 p-3 bg-gray-50 rounded border-l-4 border-gray-300">
                                <p className="text-sm">
                                  <strong>Notas:</strong> {appointment.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay citas registradas
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Este paciente aún no tiene citas programadas.
                  </p>
                  <Button onClick={() => setShowNewAppointmentModal(true)}>
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Programar Primera Cita
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Treatments Tab */}
        <TabsContent value="treatments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Historial de Tratamientos ({treatments.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {treatments.length > 0 ? (
                <div className="space-y-4">
                  {treatments.map((treatment) => {
                    const doctor = doctors.find(
                      (d) => d.uid === treatment.doctorId
                    );
                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case "completed":
                          return "bg-green-100 text-green-800";
                        case "in_progress":
                          return "bg-blue-100 text-blue-800";
                        case "planned":
                          return "bg-yellow-100 text-yellow-800";
                        case "cancelled":
                          return "bg-red-100 text-red-800";
                        default:
                          return "bg-gray-100 text-gray-800";
                      }
                    };

                    const getStatusLabel = (status: string) => {
                      const labels: Record<string, string> = {
                        completed: "Completado",
                        in_progress: "En Progreso",
                        planned: "Planificado",
                        cancelled: "Cancelado",
                      };
                      return labels[status] || status;
                    };

                    return (
                      <div
                        key={treatment.id}
                        className="border rounded-lg p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-medium text-lg">
                                {treatment.treatment.description}
                              </h4>
                              <Badge
                                className={getStatusColor(treatment.status)}
                              >
                                {getStatusLabel(treatment.status)}
                              </Badge>
                            </div>

                            <div className="space-y-1 text-sm text-gray-600">
                              <p className="flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                {formatDate(treatment.date)}
                              </p>
                              <p className="flex items-center">
                                <User className="h-4 w-4 mr-2" />
                                Dr. {doctor?.displayName || treatment.doctorId}
                              </p>
                              <p>
                                <strong>Código:</strong>{" "}
                                {treatment.treatment.code}
                              </p>
                              {treatment.treatment.tooth &&
                                treatment.treatment.tooth.length > 0 && (
                                  <p>
                                    <strong>Dientes:</strong>{" "}
                                    {treatment.treatment.tooth.join(", ")}
                                  </p>
                                )}
                              <p>
                                <strong>Diagnóstico:</strong>{" "}
                                {treatment.treatment.diagnosis}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="font-medium text-lg">
                              ${treatment.cost.total.toLocaleString()}
                            </p>
                            <div className="text-sm text-gray-600">
                              <p>
                                Seguro: $
                                {treatment.cost.insuranceCovered.toLocaleString()}
                              </p>
                              <p>
                                Paciente: $
                                {treatment.cost.patientPortion.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        {treatment.treatment.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded border-l-4 border-gray-300">
                            <p className="text-sm">
                              <strong>Notas:</strong>{" "}
                              {treatment.treatment.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay tratamientos registrados
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Este paciente aún no tiene tratamientos en su historial.
                  </p>
                  <Button onClick={() => setShowNewTreatmentModal(true)}>
                    <Activity className="mr-2 h-4 w-4" />
                    Registrar Primer Tratamiento
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
