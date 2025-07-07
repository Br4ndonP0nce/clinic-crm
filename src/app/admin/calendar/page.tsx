// src/app/admin/calendar/page.tsx
"use client";

import React from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Users,
  Stethoscope,
  AlertCircle,
} from "lucide-react";

export default function CalendarPage() {
  return (
    <ProtectedRoute requiredPermissions={["calendar:read"]}>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Calendario de Citas</h1>
            <p className="text-gray-600">
              Programación y gestión de citas dentales
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cita
          </Button>
        </div>

        {/* Coming Soon Notice */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-center text-center">
              <div className="max-w-md">
                <CalendarIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">
                  Sistema de Calendario
                </h2>
                <p className="text-gray-600 mb-4">
                  El sistema de calendario está en desarrollo. Próximamente
                  podrás:
                </p>
                <div className="text-left space-y-2 mb-6">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Programar citas por doctor</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">
                      Gestionar pacientes y horarios
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Stethoscope className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Asignar salas y equipos</span>
                  </div>
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Recordatorios automáticos</span>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Próxima actualización:</strong> Sistema completo de
                    calendario con integración de pacientes y gestión de
                    disponibilidad médica.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Citas Hoy</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <CalendarIcon className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Esta Semana</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <Clock className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <AlertCircle className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Disponibilidad</p>
                  <p className="text-2xl font-bold">100%</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Temporary Calendar View */}
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa del Calendario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <CalendarIcon className="h-24 w-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Vista de Calendario
              </h3>
              <p className="text-gray-500 mb-4">
                El calendario interactivo se implementará en la próxima versión
              </p>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                En Desarrollo
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
