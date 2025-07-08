// src/app/admin/patients/[id]/page.tsx - Refactored
"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePatientData } from "@/hooks/usePatientData";
import { usePatientEditing } from "@/hooks/usePatientEditing";
import { addAppointment } from "@/lib/firebase/db";
import { Timestamp } from "firebase/firestore";

// Component imports
import { ContactInfoCard } from "@/components/patient/ContactInfoCard";
import { AddressCard } from "@/components/patient/AddressCard";
import { AllergiesCard } from "@/components/patient/AllergiesCard";
import { MedicationsCard } from "@/components/patient/MedicationsCard";
import { DentalHistoryCard } from "@/components/patient/DentalHistoryCard";
import { DentalProblemsCard } from "@/components/patient/DentalProblemsCard";
import {
  NewAppointmentModal,
  NewAppointmentData,
} from "@/components/patient/NewAppointmentModal";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  CalendarPlus,
  Activity,
  User,
  Calendar,
  FileText,
  Heart,
  Stethoscope,
  Shield,
  AlertTriangle,
  Pill,
} from "lucide-react";

export default function PatientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission, userProfile } = useAuth();
  const patientId = params.id as string;

  // Modal states
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);

  // Main data hook
  const {
    patient,
    treatments,
    appointments,
    doctors,
    isLoading,
    isSaving,
    error,
    updatePatientData,
    refreshData,
  } = usePatientData(patientId);

  // Editing state hook
  const {
    editingSection,
    editableData,
    hasUnsavedChanges,
    validationErrors,
    isValid,
    startEditing,
    cancelEditing,
    updateEditableData,
    addToArray,
    removeFromArray,
  } = usePatientEditing();
  const handleSave = async () => {
    if (!isValid) return;

    try {
      await updatePatientData(editableData);
      cancelEditing();
    } catch (error) {
      console.error("Failed to save:", error);
      // Error is already handled in the hook
    }
  };
  // Handle new appointment creation
  const handleCreateAppointment = async (
    appointmentData: NewAppointmentData
  ) => {
    try {
      const appointmentDateTime = new Date(
        `${appointmentData.date}T${appointmentData.time}`
      );

      const newAppointment = {
        patientId: patientId,
        doctorId: appointmentData.doctorId,
        appointmentDate: Timestamp.fromDate(appointmentDateTime),
        duration: appointmentData.duration,
        type: appointmentData.type,
        status: "scheduled" as const,
        reasonForVisit: appointmentData.reasonForVisit,
        notes: appointmentData.notes,
        reminders: [],
        createdBy: userProfile?.uid || "unknown",
      };

      await addAppointment(newAppointment);
      await refreshData(); // Refresh to show new appointment
    } catch (error) {
      console.error("Error creating appointment:", error);
      throw error;
    }
  };

  // Section editing handlers
  const handleContactEdit = () => {
    if (!patient) return;
    startEditing("contact", {
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      phone: patient.phone,
      alternatePhone: patient.alternatePhone,
      status: patient.status,
    });
  };

  const handleAddressEdit = () => {
    if (!patient) return;
    startEditing("address", {
      address: { ...patient.address },
    });
  };

  const handleAllergiesEdit = () => {
    if (!patient) return;
    startEditing("allergies", {
      medicalHistory: { ...patient.medicalHistory },
    });
  };

  const handleMedicationsEdit = () => {
    if (!patient) return;
    startEditing("medications", {
      medicalHistory: { ...patient.medicalHistory },
    });
  };

  const handleDentalHistoryEdit = () => {
    if (!patient) return;
    startEditing("dentalHistory", {
      dentalHistory: { ...patient.dentalHistory },
    });
  };

  const handleDentalProblemsEdit = () => {
    if (!patient) return;
    startEditing("dentalProblems", {
      dentalHistory: { ...patient.dentalHistory },
    });
  };

  // Helper functions
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

  const getStatusColor = (status: string) => {
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

  const getStatusLabel = (status: string) => {
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

  // Loading state
  if (isLoading && !patient) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/patients")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Pacientes
        </Button>

        <div className="flex gap-2">
          {/* Quick Action Buttons */}
          <Button
            variant="outline"
            onClick={() => setShowNewAppointmentModal(true)}
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            Nueva Cita
          </Button>
          <Button variant="outline">
            <Activity className="mr-2 h-4 w-4" />
            Nuevo Tratamiento
          </Button>
        </div>
      </div>

      {/* Patient Header Card */}
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
              <div className="flex items-center space-x-4 mt-2">
                <Badge className={getStatusColor(patient.status)}>
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
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="medical">Historial Médico</TabsTrigger>
          <TabsTrigger value="dental">Historial Dental</TabsTrigger>
          <TabsTrigger value="appointments">
            Citas ({appointments.length})
          </TabsTrigger>
          <TabsTrigger value="treatments">
            Tratamientos ({treatments.length})
          </TabsTrigger>
        </TabsList>

        {/* General Information Tab */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Information Card */}
            <ContactInfoCard
              patient={patient}
              isEditing={editingSection === "contact"}
              isSaving={isSaving}
              canEdit={hasPermission("patients:write")}
              editableData={editableData}
              validationErrors={validationErrors}
              onEdit={handleContactEdit}
              onSave={handleSave}
              onCancel={cancelEditing}
              onUpdateData={updateEditableData}
            />

            {/* Address Card */}
            <AddressCard
              patient={patient}
              isEditing={editingSection === "address"}
              isSaving={isSaving}
              canEdit={hasPermission("patients:write")}
              editableData={editableData}
              validationErrors={validationErrors}
              onEdit={handleAddressEdit}
              onSave={handleSave}
              onCancel={cancelEditing}
              onUpdateData={updateEditableData}
            />

            {/* TODO: Add other cards */}
            {/* Insurance Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="mr-2 h-5 w-5" />
                  Seguro Médico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  {patient.insurance.isActive
                    ? `${patient.insurance.provider} - ${patient.insurance.policyNumber}`
                    : "Sin seguro médico activo"}
                </p>
              </CardContent>
            </Card>

            {/* Emergency Contact Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Contacto de Emergencia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
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
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes Section */}
          <Card>
            <CardHeader>
              <CardTitle>Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">
                {patient.notes || "No hay notas disponibles"}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medical History Tab */}
        <TabsContent value="medical" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Allergies Card */}
            <AllergiesCard
              patient={patient}
              isEditing={editingSection === "allergies"}
              isSaving={isSaving}
              canEdit={hasPermission("patients:write")}
              editableData={editableData}
              validationErrors={validationErrors}
              onEdit={handleAllergiesEdit}
              onSave={handleSave}
              onCancel={cancelEditing}
              onAddToArray={addToArray}
              onRemoveFromArray={removeFromArray}
            />

            {/* Medications Card */}
            <MedicationsCard
              patient={patient}
              isEditing={editingSection === "medications"}
              isSaving={isSaving}
              canEdit={hasPermission("patients:write")}
              editableData={editableData}
              validationErrors={validationErrors}
              onEdit={handleMedicationsEdit}
              onSave={handleSave}
              onCancel={cancelEditing}
              onAddToArray={addToArray}
              onRemoveFromArray={removeFromArray}
            />

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
        </TabsContent>

        {/* Dental History Tab */}
        <TabsContent value="dental" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dental History Overview */}
            <DentalHistoryCard
              patient={patient}
              isEditing={editingSection === "dentalHistory"}
              isSaving={isSaving}
              canEdit={hasPermission("patients:write")}
              editableData={editableData}
              validationErrors={validationErrors}
              onEdit={handleDentalHistoryEdit}
              onSave={handleSave}
              onCancel={cancelEditing}
              onUpdateData={updateEditableData}
            />

            {/* Current Dental Problems */}
            <DentalProblemsCard
              patient={patient}
              isEditing={editingSection === "dentalProblems"}
              isSaving={isSaving}
              canEdit={hasPermission("patients:write")}
              editableData={editableData}
              validationErrors={validationErrors}
              onEdit={handleDentalProblemsEdit}
              onSave={handleSave}
              onCancel={cancelEditing}
              onAddToArray={addToArray}
              onRemoveFromArray={removeFromArray}
            />
          </div>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Historial de Citas ({appointments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.slice(0, 5).map((appointment) => (
                    <div
                      key={appointment.id}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{appointment.type}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(
                              appointment.appointmentDate.toDate()
                            ).toLocaleDateString("es-MX")}
                          </p>
                        </div>
                        <Badge>{appointment.status}</Badge>
                      </div>
                    </div>
                  ))}
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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Treatments Tab */}
        <TabsContent value="treatments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Historial de Tratamientos ({treatments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {treatments.length > 0 ? (
                <div className="space-y-4">
                  {treatments.slice(0, 5).map((treatment) => (
                    <div
                      key={treatment.id}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">
                            {treatment.treatment.description}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {new Date(
                              treatment.date.toDate()
                            ).toLocaleDateString("es-MX")}
                          </p>
                        </div>
                        <span className="font-medium text-green-600">
                          ${treatment.cost.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Appointment Modal */}
      <NewAppointmentModal
        isOpen={showNewAppointmentModal}
        onClose={() => setShowNewAppointmentModal(false)}
        onSubmit={handleCreateAppointment}
        doctors={doctors}
        patientName={patient.fullName}
        isLoading={isLoading}
      />
    </div>
  );
}
