// src/app/admin/page.tsx - Updated for Dental Practice
"use client";

import React, { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import {
  getPatients,
  getAppointments,
  Patient,
  Appointment,
} from "@/lib/firebase/db";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  CalendarPlus,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface DashboardStats {
  totalPatients: number;
  todaysAppointments: number;
  pendingTreatments: number;
  estimatedRevenue: number;
  patientsByStatus: Record<string, number>;
  recentAppointments: Appointment[];
}

export default function DentalDashboard() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const {
    canViewPatients,
    canViewAppointments,
    canViewCalendar,
    canViewTreatments,
    canViewBilling,
    canEditPatients,
    role,
    getDefaultRoute,
  } = usePermissions();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [todaysAppointments, setTodaysAppointments] = useState<Appointment[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!canViewPatients) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Fetch patients
        const fetchedPatients = await getPatients();
        setPatients(fetchedPatients);

        // Fetch today's appointments if user has permission
        if (canViewAppointments) {
          const today = new Date();
          const startOfDay = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
          );
          const endOfDay = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            23,
            59,
            59
          );

          const appointments = await getAppointments(startOfDay, endOfDay);
          setTodaysAppointments(appointments);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [canViewPatients, canViewAppointments]);

  // Calculate statistics
  const stats: DashboardStats = React.useMemo(() => {
    const patientsByStatus = {
      inquiry: patients.filter((p) => p.status === "inquiry").length,
      scheduled: patients.filter((p) => p.status === "scheduled").length,
      active: patients.filter((p) => p.status === "active").length,
      treatment: patients.filter((p) => p.status === "treatment").length,
      maintenance: patients.filter((p) => p.status === "maintenance").length,
      inactive: patients.filter((p) => p.status === "inactive").length,
    };

    // Calculate estimated revenue (you can adjust these rates)
    const estimatedRevenue =
      patientsByStatus.active * 200 + // Active patients average monthly value
      patientsByStatus.treatment * 500; // Treatment patients higher value

    return {
      totalPatients: patients.length,
      todaysAppointments: todaysAppointments.length,
      pendingTreatments: patientsByStatus.treatment,
      estimatedRevenue,
      patientsByStatus,
      recentAppointments: todaysAppointments.slice(0, 3),
    };
  }, [patients, todaysAppointments]);

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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "treatment":
        return "bg-purple-100 text-purple-800";
      case "scheduled":
        return "bg-amber-100 text-amber-800";
      case "inquiry":
        return "bg-blue-100 text-blue-800";
      case "maintenance":
        return "bg-teal-100 text-teal-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Activo";
      case "treatment":
        return "En Tratamiento";
      case "scheduled":
        return "Programado";
      case "inquiry":
        return "Consulta";
      case "maintenance":
        return "Mantenimiento";
      case "inactive":
        return "Inactivo";
      default:
        return status;
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Quick navigation based on role
  const getQuickActions = () => {
    const actions = [];

    if (canEditPatients) {
      actions.push({
        title: "Nuevo Paciente",
        description: "Registrar nuevo paciente",
        icon: <UserPlus className="h-5 w-5" />,
        onClick: () => router.push("/admin/patients/new"),
        color: "text-blue-600",
      });
    }

    if (canViewAppointments) {
      actions.push({
        title: "Nueva Cita",
        description: "Programar cita",
        icon: <CalendarPlus className="h-5 w-5" />,
        onClick: () => router.push("/admin/calendar"),
        color: "text-green-600",
      });
    }

    return actions;
  };

  return (
    <ProtectedRoute requiredPermissions={["dashboard:read"]}>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dashboard - Práctica Dental</h1>
            <p className="text-gray-600">
              Bienvenido, {userProfile?.displayName || userProfile?.email}
            </p>
          </div>

          {/* Role indicator and Quick Actions */}
          <div className="flex items-center gap-4">
            {getQuickActions().map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={action.onClick}
                className="flex items-center gap-2"
              >
                <span className={action.color}>{action.icon}</span>
                {action.title}
              </Button>
            ))}

            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-gray-500" />
              <Badge variant="outline" className="capitalize">
                {getRoleDisplayName(role || "")}
              </Badge>
            </div>
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
                  <Button
                    variant="outline"
                    className="mt-3"
                    onClick={() => router.push(getDefaultRoute())}
                  >
                    Ir a mi área de trabajo
                  </Button>
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
            <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          ) : (
            <>
              {/* Main Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push("/admin/patients")}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Total Pacientes
                        </p>
                        <p className="text-3xl font-bold text-blue-600">
                          {stats.totalPatients}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Registrados en el sistema
                        </p>
                      </div>
                      <Users className="h-12 w-12 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() =>
                    canViewCalendar && router.push("/admin/calendar")
                  }
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Citas Hoy
                        </p>
                        <p className="text-3xl font-bold text-green-600">
                          {stats.todaysAppointments}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Programadas para hoy
                        </p>
                      </div>
                      <Calendar className="h-12 w-12 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() =>
                    canViewTreatments && router.push("/admin/treatments")
                  }
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          En Tratamiento
                        </p>
                        <p className="text-3xl font-bold text-purple-600">
                          {stats.pendingTreatments}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Tratamientos activos
                        </p>
                      </div>
                      <Stethoscope className="h-12 w-12 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <PermissionGate
                  permissions={["billing:read"]}
                  fallback={
                    <Card className="opacity-50">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-center h-full">
                          <Lock className="h-8 w-8 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  }
                >
                  <Card
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() =>
                      canViewBilling && router.push("/admin/billing")
                    }
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Ingresos Est.
                          </p>
                          <p className="text-3xl font-bold text-amber-600">
                            ${stats.estimatedRevenue.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Estimado mensual
                          </p>
                        </div>
                        <DollarSign className="h-12 w-12 text-amber-500" />
                      </div>
                    </CardContent>
                  </Card>
                </PermissionGate>
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Patient Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="mr-2 h-5 w-5" />
                      Estado de Pacientes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(stats.patientsByStatus).map(
                        ([status, count]) => (
                          <div
                            key={status}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center">
                              <div
                                className="w-3 h-3 rounded-full mr-3"
                                style={{
                                  backgroundColor:
                                    status === "inquiry"
                                      ? "#3b82f6"
                                      : status === "scheduled"
                                      ? "#f59e0b"
                                      : status === "active"
                                      ? "#10b981"
                                      : status === "treatment"
                                      ? "#8b5cf6"
                                      : status === "maintenance"
                                      ? "#14b8a6"
                                      : "#6b7280",
                                }}
                              />
                              <span className="text-sm capitalize">
                                {getStatusLabel(status)}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-sm font-medium mr-2">
                                {count}
                              </span>
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full"
                                  style={{
                                    width: `${
                                      stats.totalPatients > 0
                                        ? (count / stats.totalPatients) * 100
                                        : 0
                                    }%`,
                                    backgroundColor:
                                      status === "inquiry"
                                        ? "#3b82f6"
                                        : status === "scheduled"
                                        ? "#f59e0b"
                                        : status === "active"
                                        ? "#10b981"
                                        : status === "treatment"
                                        ? "#8b5cf6"
                                        : status === "maintenance"
                                        ? "#14b8a6"
                                        : "#6b7280",
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Today's Schedule */}
                <PermissionGate
                  permissions={["appointments:read"]}
                  fallback={
                    <Card>
                      <CardContent className="flex items-center justify-center h-48">
                        <div className="text-center">
                          <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600">Sin acceso a citas</p>
                        </div>
                      </CardContent>
                    </Card>
                  }
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center">
                          <Calendar className="mr-2 h-5 w-5" />
                          Agenda de Hoy
                        </span>
                        {stats.todaysAppointments > 0 && (
                          <Badge variant="secondary">
                            {stats.todaysAppointments}
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {stats.recentAppointments.length > 0 ? (
                        <div className="space-y-3">
                          {stats.recentAppointments.map((appointment) => (
                            <div
                              key={appointment.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div>
                                <p className="font-medium text-sm">
                                  {/* You'd need to fetch patient name based on appointment.patientId */}
                                  Cita {appointment.type}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {appointment.reasonForVisit}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-medium text-blue-600">
                                  {formatTime(appointment.appointmentDate)}
                                </span>
                                <div className="text-xs text-gray-500">
                                  {appointment.duration} min
                                </div>
                              </div>
                            </div>
                          ))}

                          {stats.todaysAppointments > 3 && (
                            <div className="text-center pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push("/admin/calendar")}
                              >
                                Ver todas las citas ({stats.todaysAppointments})
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 mb-3">
                            No hay citas programadas para hoy
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push("/admin/calendar")}
                          >
                            <CalendarPlus className="h-4 w-4 mr-2" />
                            Programar cita
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </PermissionGate>
              </div>

              {/* Recent Patients Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Users className="mr-2 h-5 w-5" />
                      Pacientes Recientes
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/admin/patients")}
                    >
                      Ver todos
                    </Button>
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
                            className="border-b hover:bg-gray-50 cursor-pointer"
                            onClick={() =>
                              router.push(`/admin/patients/${patient.id}`)
                            }
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
                                className={getStatusBadgeClass(patient.status)}
                              >
                                {getStatusLabel(patient.status)}
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

        {/* Quick Actions Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <PermissionGate permissions={["patients:write"]}>
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push("/admin/patients")}
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
              onClick={() => router.push("/admin/calendar")}
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
              onClick={() => router.push("/admin/treatments")}
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
              onClick={() => router.push("/admin/billing")}
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
