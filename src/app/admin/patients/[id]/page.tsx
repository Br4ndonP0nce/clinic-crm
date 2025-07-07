"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getPatient,
  updatePatient,
  Patient,
  getPatientTreatments,
  TreatmentRecord,
} from "@/lib/firebase/db";
import { getAppointments, Appointment } from "@/lib/firebase/db";
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
} from "lucide-react";

export default function PatientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [treatments, setTreatments] = useState<TreatmentRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState<Partial<Patient>>({});
  const [error, setError] = useState<string | null>(null);

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
            firstName: patientData?.firstName,
            lastName: patientData?.lastName,
            email: patientData?.email,
            phone: patientData?.phone,
            notes: patientData?.notes || "",
          });

          // Fetch related data
          const [treatmentData, appointmentData] = await Promise.all([
            getPatientTreatments(patientId),
            getAppointments(undefined, undefined, undefined, patientId),
          ]);

          setTreatments(treatmentData);
          setAppointments(appointmentData);
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
      await updatePatient(patientId, editableData);
      // Update local state with new data
      setPatient((prev) => (prev ? { ...prev, ...editableData } : null));
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating patient:", err);
      setError("Failed to update patient");
    } finally {
      setIsLoading(false);
    }
  };

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

  if (isLoading) {
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
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" /> Guardar
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit2 className="mr-2 h-4 w-4" /> Editar
            </Button>
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
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Información de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Nombre
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editableData.firstName || ""}
                        onChange={(e) =>
                          setEditableData({
                            ...editableData,
                            firstName: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border rounded-md px-3 py-2"
                      />
                    ) : (
                      <p className="mt-1">{patient.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Apellido
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editableData.lastName || ""}
                        onChange={(e) =>
                          setEditableData({
                            ...editableData,
                            lastName: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border rounded-md px-3 py-2"
                      />
                    ) : (
                      <p className="mt-1">{patient.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-500 mr-2" />
                  {isEditing ? (
                    <input
                      type="email"
                      value={editableData.email || ""}
                      onChange={(e) =>
                        setEditableData({
                          ...editableData,
                          email: e.target.value,
                        })
                      }
                      className="border rounded px-2 py-1 w-full"
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
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editableData.phone || ""}
                      onChange={(e) =>
                        setEditableData({
                          ...editableData,
                          phone: e.target.value,
                        })
                      }
                      className="border rounded px-2 py-1 w-full"
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

                {patient.alternatePhone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm">
                      Teléfono alternativo: {patient.alternatePhone}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  Dirección
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>{patient.address.street}</p>
                <p>
                  {patient.address.city}, {patient.address.state}{" "}
                  {patient.address.zipCode}
                </p>
                <p>{patient.address.country}</p>
              </CardContent>
            </Card>

            {/* Insurance Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Seguro Médico
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {patient.insurance.isActive ? (
                  <>
                    <p>
                      <strong>Proveedor:</strong> {patient.insurance.provider}
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
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Contacto de Emergencia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>
                  <strong>Nombre:</strong> {patient.emergencyContact.name}
                </p>
                <p>
                  <strong>Relación:</strong>{" "}
                  {patient.emergencyContact.relationship}
                </p>
                <p>
                  <strong>Teléfono:</strong> {patient.emergencyContact.phone}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Notes Section */}
          <Card>
            <CardHeader>
              <CardTitle>Notas</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <textarea
                  value={editableData.notes || ""}
                  onChange={(e) =>
                    setEditableData({
                      ...editableData,
                      notes: e.target.value,
                    })
                  }
                  className="w-full border rounded-md p-2 h-32 resize-none"
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
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
                  Alergias
                </CardTitle>
              </CardHeader>
              <CardContent>
                {patient.medicalHistory.allergies.length > 0 ? (
                  <div className="space-y-2">
                    {patient.medicalHistory.allergies.map((allergy, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="mr-2 mb-2 bg-red-50 text-red-700 border-red-200"
                      >
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Sin alergias conocidas</p>
                )}
              </CardContent>
            </Card>

            {/* Medications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Pill className="mr-2 h-5 w-5 text-blue-500" />
                  Medicamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Medical Conditions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="mr-2 h-5 w-5 text-purple-500" />
                  Condiciones Médicas
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Surgeries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Stethoscope className="mr-2 h-5 w-5 text-green-500" />
                  Cirugías Previas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {patient.medicalHistory.surgeries.length > 0 ? (
                  <div className="space-y-2">
                    {patient.medicalHistory.surgeries.map((surgery, index) => (
                      <div
                        key={index}
                        className="p-2 bg-green-50 rounded border-l-4 border-green-400"
                      >
                        {surgery}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Sin cirugías previas</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Primary Physician */}
          {patient.medicalHistory.primaryPhysician && (
            <Card>
              <CardHeader>
                <CardTitle>Médico de Cabecera</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{patient.medicalHistory.primaryPhysician}</p>
                {patient.medicalHistory.lastPhysicalExam && (
                  <p className="text-sm text-gray-600 mt-2">
                    Último examen físico:{" "}
                    {formatDate(patient.medicalHistory.lastPhysicalExam)}
                  </p>
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
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Stethoscope className="mr-2 h-5 w-5" />
                  Historial Dental
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    {patient.dentalHistory.previousDentist || "No especificado"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Motivo de Consulta
                  </label>
                  <p className="mt-1">{patient.dentalHistory.reasonForVisit}</p>
                </div>
              </CardContent>
            </Card>

            {/* Oral Hygiene */}
            <Card>
              <CardHeader>
                <CardTitle>Higiene Oral</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Higiene Oral General
                  </label>
                  <Badge variant="outline" className="mt-1 ml-2">
                    {patient.dentalHistory.oralHygiene}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Frecuencia de Cepillado
                  </label>
                  <p className="mt-1">
                    {patient.dentalHistory.brushingFrequency.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Frecuencia de Uso de Hilo Dental
                  </label>
                  <p className="mt-1">
                    {patient.dentalHistory.flossingFrequency.replace("_", " ")}
                  </p>
                </div>
                {patient.dentalHistory.painLevel && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Nivel de Dolor (1-10)
                    </label>
                    <p className="mt-1 text-red-600 font-medium">
                      {patient.dentalHistory.painLevel}/10
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Current Problems */}
          {patient.dentalHistory.currentProblems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
                  Problemas Actuales
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Historial de Citas
                </span>
                <Button size="sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  Nueva Cita
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {appointment.type.replace("_", " ")}
                          </p>
                          <p className="text-sm text-gray-600">
                            {appointment.reasonForVisit}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(appointment.appointmentDate)}
                          </p>
                        </div>
                        <Badge
                          className={
                            appointment.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : appointment.status === "scheduled"
                              ? "bg-blue-100 text-blue-800"
                              : appointment.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {appointment.status}
                        </Badge>
                      </div>
                      {appointment.notes && (
                        <p className="text-sm text-gray-600 mt-2 border-t pt-2">
                          {appointment.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay citas registradas
                  </h3>
                  <p className="text-gray-500">
                    Este paciente aún no tiene citas programadas.
                  </p>
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
                  Historial de Tratamientos
                </span>
                <Button size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Nuevo Tratamiento
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {treatments.length > 0 ? (
                <div className="space-y-4">
                  {treatments.map((treatment) => (
                    <div key={treatment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">
                            {treatment.treatment.description}
                          </p>
                          <p className="text-sm text-gray-600">
                            Código: {treatment.treatment.code}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(treatment.date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${treatment.cost.total}</p>
                          <Badge
                            className={
                              treatment.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : treatment.status === "in_progress"
                                ? "bg-blue-100 text-blue-800"
                                : treatment.status === "planned"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {treatment.status}
                          </Badge>
                        </div>
                      </div>

                      {treatment.treatment.tooth &&
                        treatment.treatment.tooth.length > 0 && (
                          <p className="text-sm text-gray-600">
                            <strong>Dientes:</strong>{" "}
                            {treatment.treatment.tooth.join(", ")}
                          </p>
                        )}

                      <p className="text-sm text-gray-600">
                        <strong>Diagnóstico:</strong>{" "}
                        {treatment.treatment.diagnosis}
                      </p>

                      {treatment.treatment.notes && (
                        <p className="text-sm text-gray-600 mt-2 border-t pt-2">
                          <strong>Notas:</strong> {treatment.treatment.notes}
                        </p>
                      )}

                      <div className="flex justify-between items-center mt-3 pt-3 border-t text-sm">
                        <span>Seguro: ${treatment.cost.insuranceCovered}</span>
                        <span>Paciente: ${treatment.cost.patientPortion}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay tratamientos registrados
                  </h3>
                  <p className="text-gray-500">
                    Este paciente aún no tiene tratamientos en su historial.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
