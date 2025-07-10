// src/app/admin/billing/report/new/page.tsx - FIXED TO WORK WITH EXISTING REPORTFORM
"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Calendar, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { usePermissions } from "@/hooks/usePermissions";

export default function NewBillingReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canManageBilling } = usePermissions();

  // Check if this came from an appointment
  const appointmentId = searchParams.get("appointmentId");

  const handleCancel = () => {
    router.push("/admin/billing/");
  };

  if (!canManageBilling) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Acceso Restringido
              </h3>
              <p className="text-gray-600">
                No tienes permisos para crear reportes de facturación.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Crear Reporte de Facturación
          </h1>
          <p className="text-gray-600">
            Creación manual de reporte de facturación
          </p>
        </div>
      </div>

      {/* Information Card */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <AlertCircle className="h-16 w-16 text-blue-400 mx-auto" />

            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">
                Creación Manual No Disponible
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Los reportes de facturación deben crearse desde citas
                completadas para mantener la integridad de los datos y facilitar
                el seguimiento.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-lg mx-auto">
              <h4 className="font-medium text-blue-800 mb-2">
                ¿Cómo crear un reporte de facturación?
              </h4>
              <ol className="text-sm text-blue-700 space-y-1 text-left list-decimal list-inside">
                <li>Ve al calendario de citas</li>
                <li>Busca la cita completada del paciente</li>
                <li>Haz clic en la cita para ver los detalles</li>
                <li>Ve a la pestaña "Facturación"</li>
                <li>Haz clic en "Crear Reporte de Facturación"</li>
              </ol>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button
                onClick={() => router.push("/admin/calendar")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Ir al Calendario
              </Button>

              <Button variant="outline" onClick={handleCancel}>
                Volver al Dashboard
              </Button>
            </div>

            {appointmentId && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-700">
                  <strong>Nota:</strong> Si llegaste aquí desde una cita,
                  regresa al calendario y usa el botón "Crear Reporte de
                  Facturación" en los detalles de la cita.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alternative: Quick Access to Recent Appointments */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium text-gray-800 mb-3 flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Accesos Rápidos
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/calendar?view=completed")}
              className="justify-start"
            >
              Ver Citas Completadas
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/admin/patients")}
              className="justify-start"
            >
              Ver Lista de Pacientes
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
