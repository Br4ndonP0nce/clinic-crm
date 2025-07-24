// src/app/admin/page.tsx - Optimized Dental Practice Dashboard
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import FeatureAnnouncementModal from "@/components/ui/admin/FeatureAnnouncementModal";
import { useFeatureAnnouncements } from "@/hooks/useFeatureAnnouncements";
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
  Users,
  Calendar,
  Stethoscope,
  DollarSign,
  UserPlus,
  CalendarPlus,
  AlertCircle,
  Lock,
  TrendingUp,
  Clock,
  Activity,
  MoreHorizontal,
  Eye,
  EyeOff,
  Bell,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type PatientStatus =
  | "inquiry"
  | "scheduled"
  | "active"
  | "treatment"
  | "maintenance"
  | "inactive";

const STATUS_CONFIG: Record<
  PatientStatus,
  {
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  inquiry: {
    label: "Consultas",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  scheduled: {
    label: "Programados",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  active: {
    label: "Activos",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  treatment: {
    label: "En Tratamiento",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  maintenance: {
    label: "Mantenimiento",
    color: "text-teal-600",
    bgColor: "bg-teal-100",
  },
  inactive: {
    label: "Inactivos",
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
};

interface DashboardStats {
  totalPatients: number;
  todaysAppointments: number;
  pendingTreatments: number;
  estimatedRevenue: number;
  patientsByStatus: Record<PatientStatus, number>;
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

  // State management
  const [patients, setPatients] = useState<Patient[]>([]);
  const [todaysAppointments, setTodaysAppointments] = useState<Appointment[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetailedStats, setShowDetailedStats] = useState(false);
  const [compactView, setCompactView] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const { hasUnviewed, count } = useFeatureAnnouncements(role);
  // Memoized calculations
  const stats: DashboardStats = useMemo(() => {
    const patientsByStatus = (
      Object.keys(STATUS_CONFIG) as PatientStatus[]
    ).reduce((acc, status) => {
      acc[status] = patients.filter((p) => p.status === status).length;
      return acc;
    }, {} as Record<PatientStatus, number>);

    const estimatedRevenue =
      patientsByStatus.active * 200 + patientsByStatus.treatment * 500;

    return {
      totalPatients: patients.length,
      todaysAppointments: todaysAppointments.length,
      pendingTreatments: patientsByStatus.treatment,
      estimatedRevenue,
      patientsByStatus,
      recentAppointments: todaysAppointments.slice(0, 3),
    };
  }, [patients, todaysAppointments]);
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnnouncementModal(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);
  // Data fetching
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!canViewPatients) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const fetchedPatients = await getPatients();
        setPatients(fetchedPatients);

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
        setError("Error al cargar datos");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [canViewPatients, canViewAppointments]);

  // Helper functions
  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getQuickActions = () => {
    const actions = [];
    if (canEditPatients) {
      actions.push({
        title: "Nuevo Paciente",
        icon: <UserPlus className="h-4 w-4" />,
        onClick: () => router.push("/admin/patients/new"),
      });
    }
    if (canViewAppointments) {
      actions.push({
        title: "Nueva Cita",
        icon: <CalendarPlus className="h-4 w-4" />,
        onClick: () => router.push("/admin/calendar"),
      });
    }
    return actions;
  };

  // Stat Card Component
  const StatCard: React.FC<{
    title: string;
    value: number | string;
    subtitle: string;
    icon: React.ReactNode;
    color: string;
    onClick?: () => void;
  }> = ({ title, value, subtitle, icon, color, onClick }) => (
    <Card
      className={`hover:shadow-md transition-all cursor-pointer ${
        compactView ? "p-2" : ""
      }`}
      onClick={onClick}
    >
      <CardContent className={compactView ? "p-3" : "p-4"}>
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p
              className={`text-xs font-medium text-gray-600 ${
                compactView ? "truncate" : ""
              }`}
            >
              {title}
            </p>
            <p
              className={`font-bold ${color} ${
                compactView ? "text-xl" : "text-2xl"
              }`}
            >
              {value}
            </p>
            <p
              className={`text-xs text-gray-500 ${
                compactView ? "truncate" : ""
              }`}
            >
              {subtitle}
            </p>
          </div>
          <div
            className={`${compactView ? "h-8 w-8" : "h-10 w-10"} flex-shrink-0`}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <ProtectedRoute requiredPermissions={["dashboard:read"]}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={["dashboard:read"]}>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold truncate">
              Dashboard
            </h1>
            <p className="text-sm text-gray-600 truncate">
              {userProfile?.displayName || userProfile?.email}
            </p>
          </div>
          {showAnnouncementModal && (
            <FeatureAnnouncementModal
              userRole={role}
              onClose={() => setShowAnnouncementModal(false)}
            />
          )}

          <div className="flex items-center space-x-2">
            {/* View Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCompactView(!compactView)}
              className="hidden sm:flex"
            >
              {compactView ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>

            {/* Quick Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {getQuickActions().map((action, index) => (
                  <DropdownMenuItem key={index} onClick={action.onClick}>
                    {action.icon}
                    <span className="ml-2">{action.title}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Badge variant="outline" className="capitalize">
              {role?.replace("_", " ")}
            </Badge>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
            <span className="text-red-800 text-sm">{error}</span>
          </div>
        )}

        <PermissionGate
          permissions={["patients:read"]}
          fallback={
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">
                    Sin permisos de acceso
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => router.push(getDefaultRoute())}
                  >
                    Ir a mi área
                  </Button>
                </div>
              </CardContent>
            </Card>
          }
        >
          {/* Main Stats */}
          <div
            className={`grid gap-3 ${
              compactView
                ? "grid-cols-2 sm:grid-cols-4"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            }`}
          >
            <StatCard
              title="Total Pacientes"
              value={stats.totalPatients}
              subtitle="Registrados"
              icon={<Users className="h-full w-full text-blue-500" />}
              color="text-blue-600"
              onClick={() => router.push("/admin/patients")}
            />

            <StatCard
              title="Citas Hoy"
              value={stats.todaysAppointments}
              subtitle="Programadas"
              icon={<Calendar className="h-full w-full text-green-500" />}
              color="text-green-600"
              onClick={() => canViewCalendar && router.push("/admin/calendar")}
            />

            <StatCard
              title="En Tratamiento"
              value={stats.pendingTreatments}
              subtitle="Activos"
              icon={<Stethoscope className="h-full w-full text-purple-500" />}
              color="text-purple-600"
              onClick={() =>
                canViewTreatments && router.push("/admin/treatments")
              }
            />

            <PermissionGate
              permissions={["billing:read"]}
              fallback={
                <Card className="opacity-50">
                  <CardContent className="p-4 flex items-center justify-center">
                    <Lock className="h-8 w-8 text-gray-400" />
                  </CardContent>
                </Card>
              }
            >
              <StatCard
                title="Ingresos Est."
                value={`$${stats.estimatedRevenue.toLocaleString()}`}
                subtitle="Mensual"
                icon={<DollarSign className="h-full w-full text-amber-500" />}
                color="text-amber-600"
                onClick={() => canViewBilling && router.push("/admin/billing")}
              />
            </PermissionGate>
          </div>

          {/* Detailed Stats Toggle */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetailedStats(!showDetailedStats)}
              className="flex items-center space-x-2"
            >
              {showDetailedStats ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span>{showDetailedStats ? "Ocultar" : "Ver"} detalles</span>
            </Button>
          </div>

          {/* Detailed Content */}
          {showDetailedStats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Patient Status Distribution */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    Estado de Pacientes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(Object.keys(STATUS_CONFIG) as PatientStatus[]).map(
                    (status) => (
                      <div
                        key={status}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-3 h-3 rounded-full ${STATUS_CONFIG[status].bgColor}`}
                          />
                          <span className="text-sm">
                            {STATUS_CONFIG[status].label}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">
                            {stats.patientsByStatus[status]}
                          </span>
                          <div className="w-12 bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${STATUS_CONFIG[
                                status
                              ].bgColor
                                .replace("bg-", "bg-")
                                .replace("-100", "-500")}`}
                              style={{
                                width: `${
                                  stats.totalPatients > 0
                                    ? (stats.patientsByStatus[status] /
                                        stats.totalPatients) *
                                      100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  )}
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
                        <p className="text-gray-600 text-sm">
                          Sin acceso a citas
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                }
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        Agenda de Hoy
                      </span>
                      {stats.todaysAppointments > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {stats.todaysAppointments}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.recentAppointments.length > 0 ? (
                      <div className="space-y-2">
                        {stats.recentAppointments.map((appointment) => (
                          <div
                            key={appointment.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">
                                Cita {appointment.type}
                              </p>
                              <p className="text-xs text-gray-600 truncate">
                                {appointment.reasonForVisit}
                              </p>
                            </div>
                            <div className="text-right ml-2">
                              <span className="text-xs font-medium text-blue-600">
                                {formatTime(appointment.appointmentDate)}
                              </span>
                              <div className="text-xs text-gray-500">
                                {appointment.duration}min
                              </div>
                            </div>
                          </div>
                        ))}

                        {stats.todaysAppointments > 3 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => router.push("/admin/calendar")}
                          >
                            Ver todas ({stats.todaysAppointments})
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm mb-2">
                          Sin citas hoy
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push("/admin/calendar")}
                        >
                          <CalendarPlus className="h-4 w-4 mr-1" />
                          Programar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </PermissionGate>
            </div>
          )}

          {/* Recent Patients - Compact */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center">
                  <Users className="mr-2 h-4 w-4" />
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
              <div className="space-y-2">
                {patients.slice(0, 3).map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/patients/${patient.id}`)}
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-blue-600">
                          {patient.firstName.charAt(0)}
                          {patient.lastName.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {patient.fullName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {patient.dentalHistory.lastVisit
                            ? new Date(
                                patient.dentalHistory.lastVisit.toDate()
                              ).toLocaleDateString("es-MX")
                            : "Primera visita"}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${
                        STATUS_CONFIG[patient.status as PatientStatus]
                          ?.bgColor || "bg-gray-100"
                      } text-xs`}
                    >
                      {STATUS_CONFIG[patient.status as PatientStatus]?.label ||
                        patient.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </PermissionGate>
      </div>
    </ProtectedRoute>
  );
}
