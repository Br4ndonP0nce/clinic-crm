// src/app/admin/page.tsx - Updated for Dental Practice
"use client";

import React, { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { useAuth } from "@/hooks/useAuth";
import { getPatients, Patient } from "@/lib/firebase/db";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Lock,
  TrendingUp,
  Users,
  Calendar,
  Stethoscope,
  DollarSign,
  Clock,
  UserPlus,
  Activity,
  FileText,
  CreditCard,
} from "lucide-react";

export default function DentalDashboard() {
  const { userProfile, hasPermission } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch patients data if user has permission
  useEffect(() => {
    const fetchPatients = async () => {
      if (!hasPermission("patients:read")) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const fetchedPatients = await getPatients();
        setPatients(fetchedPatients);
      } catch (err) {
        console.error("Error fetching patients:", err);
        setError("Failed to load patient data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, [hasPermission]);

  // Calculate statistics
  const patientCount = patients.length;
  const patientsByStatus = {
    inquiry: patients.filter((patient) => patient.status === "inquiry").length,
    scheduled: patients.filter((patient) => patient.status === "scheduled")
      .length,
    active: patients.filter((patient) => patient.status === "active").length,
    treatment: patients.filter((patient) => patient.status === "treatment")
      .length,
    maintenance: patients.filter((patient) => patient.status === "maintenance")
      .length,
    inactive: patients.filter((patient) => patient.status === "inactive")
      .length,
  };

  // Calculate potential revenue (simplified for demo)
  const estimatedMonthlyRevenue =
    patientsByStatus.active * 150 + patientsByStatus.treatment * 300;
  const todaysAppointments = 8; // This would come from appointments data
  const pendingTreatments = patientsByStatus.treatment;

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "super_admin":
        return "Super Administrador";
      case "doctor":
        return "Doctor";
      case "recepcion":
        return "Recepción";
      case "ventas":
        return "Ventas";
      default:
        return role;
    }
  };

  return (
    <ProtectedRoute requiredPermissions={["dashboard:read"]}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Dashboard - Práctica Dental</h1>
            <p className="text-gray-600">
              Bienvenido, {userProfile?.displayName || userProfile?.email}
            </p>
          </div>

          {/* Role indicator */}
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-gray-500" />
            <Badge variant="outline" className="capitalize">
              {getRoleDisplayName(userProfile?.role || "")}
            </Badge>
          </div>
        </div>

        {/* Permission-based content */}
        <PermissionGate
          permissions={["patients:read"]}
          fallback={
            <Card className="mb-8">
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">
                    Necesitas permisos de acceso a pacientes para ver las
                    estadísticas
                  </p>
                </div>
              </CardContent>
            </Card>
          }
        >
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
              {error}
            </div>
          ) : (
            <>
              {/* Main Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Total Pacientes
                        </p>
                        <p className="text-3xl font-bold text-blue-600">
                          {patientCount}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Registrados en el sistema
                        </p>
                      </div>
                      <Users className="h-12 w-12 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Citas Hoy
                        </p>
                        <p className="text-3xl font-bold text-green-600">
                          {todaysAppointments}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Programadas para hoy
                        </p>
                      </div>
                      <Calendar className="h-12 w-12 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          En Tratamiento
                        </p>
                        <p className="text-3xl font-bold text-purple-600">
                          {pendingTreatments}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Tratamientos activos
                        </p>
                      </div>
                      <Stethoscope className="h-12 w-12 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Ingresos Est.
                        </p>
                        <p className="text-3xl font-bold text-amber-600">
                          ${estimatedMonthlyRevenue.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Estimado mensual
                        </p>
                      </div>
                      <DollarSign className="h-12 w-12 text-amber-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Patient Status Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="mr-2 h-5 w-5" />
                      Estado de Pacientes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <UserPlus className="h-4 w-4 text-blue-500 mr-2" />
                          <span className="text-sm">Consultas</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm font-medium mr-2">
                            {patientsByStatus.inquiry}
                          </span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{
                                width: `${
                                  (patientsByStatus.inquiry / patientCount) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-amber-500 mr-2" />
                          <span className="text-sm">Programados</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm font-medium mr-2">
                            {patientsByStatus.scheduled}
                          </span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-amber-500 h-2 rounded-full"
                              style={{
                                width: `${
                                  (patientsByStatus.scheduled / patientCount) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-sm">Activos</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm font-medium mr-2">
                            {patientsByStatus.active}
                          </span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{
                                width: `${
                                  (patientsByStatus.active / patientCount) * 100
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Activity className="h-4 w-4 text-purple-500 mr-2" />
                          <span className="text-sm">En Tratamiento</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm font-medium mr-2">
                            {patientsByStatus.treatment}
                          </span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-500 h-2 rounded-full"
                              style={{
                                width: `${
                                  (patientsByStatus.treatment / patientCount) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-teal-500 mr-2" />
                          <span className="text-sm">Mantenimiento</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm font-medium mr-2">
                            {patientsByStatus.maintenance}
                          </span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-teal-500 h-2 rounded-full"
                              style={{
                                width: `${
                                  (patientsByStatus.maintenance /
                                    patientCount) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Today's Schedule Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="mr-2 h-5 w-5" />
                      Agenda de Hoy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Juan Pérez</p>
                          <p className="text-xs text-gray-600">
                            Limpieza dental
                          </p>
                        </div>
                        <span className="text-xs font-medium text-blue-600">
                          09:00
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">María García</p>
                          <p className="text-xs text-gray-600">
                            Consulta general
                          </p>
                        </div>
                        <span className="text-xs font-medium text-green-600">
                          10:30
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Carlos López</p>
                          <p className="text-xs text-gray-600">Endodoncia</p>
                        </div>
                        <span className="text-xs font-medium text-purple-600">
                          14:00
                        </span>
                      </div>

                      <div className="text-center pt-2">
                        <p className="text-xs text-gray-500">
                          +5 citas más programadas
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Patients Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Pacientes Recientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 text-sm font-medium text-gray-600">
                            Paciente
                          </th>
                          <th className="text-left py-2 text-sm font-medium text-gray-600">
                            Estado
                          </th>
                          <th className="text-left py-2 text-sm font-medium text-gray-600">
                            Última Visita
                          </th>
                          <th className="text-left py-2 text-sm font-medium text-gray-600">
                            Próxima Cita
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {patients.slice(0, 5).map((patient) => (
                          <tr
                            key={patient.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="py-3">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                  <span className="text-xs font-medium text-blue-600">
                                    {patient.firstName.charAt(0)}
                                    {patient.lastName.charAt(0)}
                                  </span>
                                </div>
                                <span className="text-sm font-medium">
                                  {patient.fullName}
                                </span>
                              </div>
                            </td>
                            <td className="py-3">
                              <Badge
                                variant="outline"
                                className={
                                  patient.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : patient.status === "treatment"
                                    ? "bg-purple-100 text-purple-800"
                                    : patient.status === "scheduled"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-gray-100 text-gray-800"
                                }
                              >
                                {patient.status === "active"
                                  ? "Activo"
                                  : patient.status === "treatment"
                                  ? "En Tratamiento"
                                  : patient.status === "scheduled"
                                  ? "Programado"
                                  : patient.status === "inquiry"
                                  ? "Consulta"
                                  : patient.status === "maintenance"
                                  ? "Mantenimiento"
                                  : "Inactivo"}
                              </Badge>
                            </td>
                            <td className="py-3 text-sm text-gray-600">
                              {patient.dentalHistory.lastVisit
                                ? new Date(
                                    patient.dentalHistory.lastVisit.toDate()
                                  ).toLocaleDateString("es-MX")
                                : "Primera visita"}
                            </td>
                            <td className="py-3 text-sm text-gray-600">
                              {patient.status === "scheduled"
                                ? "Próximamente"
                                : "Por programar"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </PermissionGate>

        {/* Quick Actions based on permissions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <PermissionGate permissions={["patients:write"]}>
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => (window.location.href = "/admin/patients")}
            >
              <CardContent className="flex items-center p-4">
                <Users className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <h3 className="font-medium">Gestionar Pacientes</h3>
                  <p className="text-sm text-gray-600">
                    Ver y editar pacientes
                  </p>
                </div>
              </CardContent>
            </Card>
          </PermissionGate>

          <PermissionGate permissions={["calendar:read"]}>
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => (window.location.href = "/admin/calendar")}
            >
              <CardContent className="flex items-center p-4">
                <Calendar className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <h3 className="font-medium">Ver Calendario</h3>
                  <p className="text-sm text-gray-600">Citas y horarios</p>
                </div>
              </CardContent>
            </Card>
          </PermissionGate>

          <PermissionGate permissions={["treatments:read"]}>
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => (window.location.href = "/admin/treatments")}
            >
              <CardContent className="flex items-center p-4">
                <Stethoscope className="h-8 w-8 text-purple-500 mr-3" />
                <div>
                  <h3 className="font-medium">Tratamientos</h3>
                  <p className="text-sm text-gray-600">Historial clínico</p>
                </div>
              </CardContent>
            </Card>
          </PermissionGate>

          <PermissionGate permissions={["billing:read"]}>
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => (window.location.href = "/admin/billing")}
            >
              <CardContent className="flex items-center p-4">
                <CreditCard className="h-8 w-8 text-amber-500 mr-3" />
                <div>
                  <h3 className="font-medium">Facturación</h3>
                  <p className="text-sm text-gray-600">Pagos y finanzas</p>
                </div>
              </CardContent>
            </Card>
          </PermissionGate>
        </div>
      </div>
    </ProtectedRoute>
  );
}
