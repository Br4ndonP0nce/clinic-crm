"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { useAuth } from "@/hooks/useAuth";
import { getPatients, Patient } from "@/lib/firebase/db";
import { exportPatientsToExcel } from "@/lib/utils/exportPatientsToExcel";

import PatientTable from "@/components/ui/admin/PatientTable";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Download,
  UserPlus,
  Users,
  Calendar,
  Stethoscope,
  Filter,
  MoreHorizontal,
  Eye,
  EyeOff,
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
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  inquiry: { label: "Consultas", color: "text-blue-600", icon: UserPlus },
  scheduled: { label: "Programados", color: "text-amber-600", icon: Calendar },
  active: { label: "Activos", color: "text-green-600", icon: Users },
  treatment: {
    label: "En Tratamiento",
    color: "text-purple-600",
    icon: Stethoscope,
  },
  maintenance: { label: "Mantenimiento", color: "text-teal-600", icon: Users },
  inactive: { label: "Inactivos", color: "text-gray-600", icon: Users },
};

export default function PatientsPage() {
  const { hasPermission } = useAuth();
  const router = useRouter();

  // Core data state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Type guard for patient status
  const isValidPatientStatus = (status: string): status is PatientStatus => {
    return status in STATUS_CONFIG;
  };

  // Memoized calculations
  const stats = useMemo(() => {
    const baseStats = {
      total: patients.length,
      inquiry: 0,
      scheduled: 0,
      active: 0,
      treatment: 0,
      maintenance: 0,
      inactive: 0,
    };

    return patients.reduce((acc, patient) => {
      if (patient.status in acc) {
        acc[patient.status as PatientStatus]++;
      }
      return acc;
    }, baseStats);
  }, [patients]);

  const filteredPatients = useMemo(() => {
    let filtered = patients;

    // Status filter
    if (activeTab !== "all" && isValidPatientStatus(activeTab)) {
      filtered = filtered.filter((patient) => patient.status === activeTab);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (patient) =>
          patient.fullName.toLowerCase().includes(term) ||
          patient.firstName.toLowerCase().includes(term) ||
          patient.lastName.toLowerCase().includes(term) ||
          patient.email.toLowerCase().includes(term) ||
          patient.phone.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [patients, activeTab, searchTerm]);

  // Data fetching
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setIsLoading(true);
        const fetchedPatients = await getPatients();
        setPatients(fetchedPatients);
      } catch (err) {
        console.error("Error fetching patients:", err);
        setError("Error al cargar pacientes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, []);

  // Event handlers
  const handleStatusChange = async (
    patientId: string,
    newStatus: Patient["status"]
  ) => {
    setPatients((prev) =>
      prev.map((patient) =>
        patient.id === patientId ? { ...patient, status: newStatus } : patient
      )
    );
  };

  const handleExportToExcel = async () => {
    try {
      setIsExporting(true);
      setError(null);
      await exportPatientsToExcel(filteredPatients);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      setError("Error al exportar datos");
    } finally {
      setIsExporting(false);
    }
  };

  const clearError = () => setError(null);

  // Mobile-first statistics component (removed as we're using inline buttons now)

  if (isLoading) {
    return (
      <ProtectedRoute requiredPermissions={["patients:read"]}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={["patients:read"]}>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Pacientes</h1>
              <p className="text-sm text-gray-600 hidden sm:block">
                {stats.total} pacientes totales
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStats(!showStats)}
                className="sm:hidden flex items-center"
              >
                {showStats ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Ocultar
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Stats
                  </>
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleExportToExcel}
                    disabled={isExporting || filteredPatients.length === 0}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Excel
                  </DropdownMenuItem>
                  <PermissionGate permissions={["patients:write"]}>
                    <DropdownMenuItem
                      onClick={() => router.push("/admin/patients/new")}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Nuevo Paciente
                    </DropdownMenuItem>
                  </PermissionGate>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Buscar pacientes..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
            <span className="text-red-800 text-sm">{error}</span>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        )}

        {/* Export Status */}
        {isExporting && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500" />
              <span className="text-blue-800 text-sm">Exportando...</span>
            </div>
          </div>
        )}

        {/* Statistics - Compact Collapsible */}
        <div
          className={`transition-all duration-300 ${
            showStats ? "block" : "hidden sm:block"
          }`}
        >
          <div className="flex justify-center">
            <div className="inline-flex flex-wrap justify-center gap-2 p-3 bg-gray-50 rounded-lg border max-w-4xl">
              {/* Total Stat */}
              <button
                onClick={() => setActiveTab("all")}
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all hover:bg-white hover:shadow-sm ${
                  activeTab === "all"
                    ? "bg-blue-100 text-blue-700 ring-2 ring-blue-500"
                    : "bg-white text-gray-700"
                }`}
              >
                <Users className="h-4 w-4 mr-2 text-blue-500" />
                Total
                <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                  {stats.total}
                </span>
              </button>

              {/* Status Stats */}
              {(Object.keys(STATUS_CONFIG) as PatientStatus[]).map((status) => {
                const config = STATUS_CONFIG[status];
                const Icon = config.icon;
                return (
                  <button
                    key={status}
                    onClick={() => setActiveTab(status)}
                    className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all hover:bg-white hover:shadow-sm ${
                      activeTab === status
                        ? "bg-blue-100 text-blue-700 ring-2 ring-blue-500"
                        : "bg-white text-gray-700"
                    }`}
                  >
                    <Icon className={`h-4 w-4 mr-2 ${config.color}`} />
                    <span className="hidden sm:inline">{config.label}</span>
                    <span className="sm:hidden">
                      {config.label.split(" ")[0]}
                    </span>
                    <span
                      className={`ml-2 px-2 py-1 text-white text-xs rounded-full ${config.color
                        .replace("text-", "bg-")
                        .replace("-600", "-500")}`}
                    >
                      {stats[status]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tabs - Mobile Optimized */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="all" className="whitespace-nowrap">
              Todos ({stats.total})
            </TabsTrigger>
            {(Object.keys(STATUS_CONFIG) as PatientStatus[]).map((status) => (
              <TabsTrigger
                key={status}
                value={status}
                className="whitespace-nowrap"
              >
                {STATUS_CONFIG[status].label} ({stats[status]})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <Card>
              <CardContent className="p-0">
                <PatientTable
                  patients={filteredPatients}
                  onStatusChange={handleStatusChange}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Results Info */}
        {!isLoading && (
          <div className="text-sm text-gray-600 text-center">
            Mostrando {filteredPatients.length} de {stats.total} pacientes
            {searchTerm && ` para "${searchTerm}"`}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
