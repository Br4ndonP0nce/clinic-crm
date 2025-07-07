"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { useAuth } from "@/hooks/useAuth";
import { getPatients, Patient } from "@/lib/firebase/db";
import { exportPatientsToExcel } from "@/lib/utils/exportPatientsToExcel";

import PatientTable from "@/components/ui/admin/PatientTable";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search,
  Filter,
  Download,
  Lock,
  FileSpreadsheet,
  Loader2,
  Users,
  UserPlus,
  Calendar,
  Stethoscope,
} from "lucide-react";

export default function PatientsPage() {
  const { hasPermission } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setIsLoading(true);
        const fetchedPatients = await getPatients();
        setPatients(fetchedPatients);
        setFilteredPatients(fetchedPatients);
      } catch (err) {
        console.error("Error fetching patients:", err);
        setError("Failed to load patient data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, []);

  useEffect(() => {
    let filtered = [...patients];

    if (activeTab !== "all") {
      filtered = filtered.filter((patient) => patient.status === activeTab);
    }

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

    setFilteredPatients(filtered);
  }, [patients, activeTab, searchTerm]);

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

      // Use filtered patients for export (respects current search/filter)
      await exportPatientsToExcel(filteredPatients);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      setError("Failed to export data to Excel");
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate statistics
  const stats = {
    total: patients.length,
    inquiry: patients.filter((p) => p.status === "inquiry").length,
    scheduled: patients.filter((p) => p.status === "scheduled").length,
    active: patients.filter((p) => p.status === "active").length,
    treatment: patients.filter((p) => p.status === "treatment").length,
    maintenance: patients.filter((p) => p.status === "maintenance").length,
    inactive: patients.filter((p) => p.status === "inactive").length,
  };

  return (
    <ProtectedRoute requiredPermissions={["patients:read"]}>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Pacientes</h1>
            <p className="text-gray-600">
              Gestión de pacientes de la práctica dental
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Buscar pacientes..."
                className="pl-9 w-full sm:w-auto min-w-[240px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Button
              variant="outline"
              onClick={handleExportToExcel}
              disabled={isExporting || filteredPatients.length === 0}
              className="relative"
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exportar Excel
                </>
              )}
            </Button>

            <PermissionGate permissions={["patients:write"]}>
              <Button onClick={() => router.push("/admin/patients/new")}>
                <UserPlus className="mr-2 h-4 w-4" /> Nuevo Paciente
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* Show access level indicator */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center text-blue-800">
            <Lock className="h-4 w-4 mr-2" />
            <span className="text-sm">
              Nivel de Acceso:{" "}
              {hasPermission("patients:write")
                ? hasPermission("patients:delete")
                  ? "Acceso Completo"
                  : "Lectura y Escritura"
                : "Solo Lectura"}
            </span>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Consultas</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.inquiry}
                  </p>
                </div>
                <UserPlus className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Programados</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {stats.scheduled}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Activos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.active}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En Tratamiento</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.treatment}
                  </p>
                </div>
                <Stethoscope className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Mantenimiento</p>
                  <p className="text-2xl font-bold text-teal-600">
                    {stats.maintenance}
                  </p>
                </div>
                <Users className="h-8 w-8 text-teal-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6 flex items-between">
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        )}

        {/* Export Status */}
        {isExporting && (
          <div className="bg-blue-100 text-blue-800 p-4 rounded-md mb-6 flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <div>
              <p className="font-medium">Preparando reporte Excel...</p>
              <p className="text-sm">
                Recopilando datos de pacientes y tratamientos. Esto puede tomar
                unos momentos.
              </p>
            </div>
          </div>
        )}

        <Tabs defaultValue="all" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">Todos ({stats.total})</TabsTrigger>
            <TabsTrigger value="inquiry">
              Consultas ({stats.inquiry})
            </TabsTrigger>
            <TabsTrigger value="scheduled">
              Programados ({stats.scheduled})
            </TabsTrigger>
            <TabsTrigger value="active">Activos ({stats.active})</TabsTrigger>
            <TabsTrigger value="treatment">
              En Tratamiento ({stats.treatment})
            </TabsTrigger>
            <TabsTrigger value="maintenance">
              Mantenimiento ({stats.maintenance})
            </TabsTrigger>
            <TabsTrigger value="inactive">
              Inactivos ({stats.inactive})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <PatientTable
                    patients={filteredPatients}
                    onStatusChange={handleStatusChange}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {[
            "inquiry",
            "scheduled",
            "active",
            "treatment",
            "maintenance",
            "inactive",
          ].map((status) => (
            <TabsContent key={status} value={status} className="space-y-4">
              <Card>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <PatientTable
                      patients={filteredPatients}
                      onStatusChange={handleStatusChange}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Export Info */}
        {!isLoading && filteredPatients.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600">
              <FileSpreadsheet className="inline h-4 w-4 mr-1" />
              El reporte incluye: datos del paciente, historial médico/dental,
              información de citas y tratamientos con estadísticas resumidas.
            </p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
