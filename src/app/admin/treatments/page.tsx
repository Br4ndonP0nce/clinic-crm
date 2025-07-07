// src/app/admin/treatments/page.tsx
"use client";

import React from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Stethoscope,
  Plus,
  Activity,
  Clipboard,
  TrendingUp,
  Users,
  Calendar,
} from "lucide-react";

export default function TreatmentsPage() {
  return (
    <ProtectedRoute requiredPermissions={["treatments:read"]}>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Gestión de Tratamientos</h1>
            <p className="text-gray-600">
              Historial clínico y planes de tratamiento
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Tratamiento
          </Button>
        </div>

        {/* Coming Soon Notice */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-center text-center">
              <div className="max-w-md">
                <Stethoscope className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">
                  Sistema de Tratamientos
                </h2>
                <p className="text-gray-600 mb-4">
                  El módulo de tratamientos está en desarrollo. Próximamente
                  incluirá:
                </p>
                <div className="text-left space-y-2 mb-6">
                  <div className="flex items-center">
                    <Clipboard className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">
                      Planes de tratamiento personalizados
                    </span>
                  </div>
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Historial clínico completo</span>
                  </div>
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Seguimiento de progreso</span>
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Análisis de resultados</span>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-800">
                    <strong>Próxima actualización:</strong> Odontograma digital,
                    códigos de procedimientos dentales y integración con sistema
                    de facturación.
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
                  <p className="text-sm text-gray-600">Tratamientos Activos</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completados Hoy</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <Clipboard className="h-8 w-8 text-green-500" />
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
                <Calendar className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    Pacientes en Tratamiento
                  </p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clipboard className="mr-2 h-5 w-5 text-blue-500" />
                Planes de Tratamiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm">Ortodoncia Completa</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Planificado
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm">Limpieza Dental</span>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    En Progreso
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm">Endodoncia</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Completado
                  </span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded text-center">
                <p className="text-xs text-blue-700">
                  Vista previa - Funcionalidad en desarrollo
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5 text-green-500" />
                Progreso de Tratamientos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Ortodoncia - Juan Pérez</span>
                    <span>75%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: "75%" }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Implante - María García</span>
                    <span>45%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: "45%" }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Blanqueamiento - Ana López</span>
                    <span>90%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: "90%" }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-green-50 rounded text-center">
                <p className="text-xs text-green-700">
                  Vista previa - Funcionalidad en desarrollo
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Odontogram Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Stethoscope className="mr-2 h-5 w-5" />
              Odontograma Digital (Vista Previa)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="max-w-2xl mx-auto">
                {/* Simple tooth diagram placeholder */}
                <div className="grid grid-cols-8 gap-2 mb-4">
                  {Array.from({ length: 16 }, (_, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 bg-white border-2 border-gray-300 rounded flex items-center justify-center text-xs font-medium"
                    >
                      {18 - i}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-8 gap-2 mb-6">
                  {Array.from({ length: 16 }, (_, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 bg-white border-2 border-gray-300 rounded flex items-center justify-center text-xs font-medium"
                    >
                      {31 + i}
                    </div>
                  ))}
                </div>

                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Odontograma Digital Interactivo
                </h3>
                <p className="text-gray-500 mb-4">
                  Sistema completo de registro dental con códigos de
                  procedimientos
                </p>
                <div className="flex justify-center space-x-4 text-xs">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
                    <span>Sano</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded mr-1"></div>
                    <span>Caries</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded mr-1"></div>
                    <span>Tratamiento</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
                    <span>Restaurado</span>
                  </div>
                </div>
                <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  En Desarrollo
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Treatment History Preview */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Historial de Tratamientos Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">Limpieza Dental - Juan Pérez</p>
                    <p className="text-sm text-gray-600">Código: D1110</p>
                    <p className="text-sm text-gray-500">
                      15 de Diciembre, 2024
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">$150</p>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Completado
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  <strong>Diagnóstico:</strong> Gingivitis leve, acumulación de
                  sarro
                </p>
                <p className="text-sm text-gray-600 mt-2 border-t pt-2">
                  <strong>Notas:</strong> Paciente respondió bien al
                  tratamiento. Recomendado control en 6 meses.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">Restauración - María García</p>
                    <p className="text-sm text-gray-600">Código: D2140</p>
                    <p className="text-sm text-gray-500">
                      12 de Diciembre, 2024
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">$280</p>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      En Progreso
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  <strong>Dientes:</strong> 14, 15
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Diagnóstico:</strong> Caries interproximal
                </p>
                <p className="text-sm text-gray-600 mt-2 border-t pt-2">
                  <strong>Notas:</strong> Primera sesión completada. Pendiente
                  segunda cita para finalizar restauración.
                </p>
              </div>

              <div className="text-center py-4">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  Vista previa - Los datos reales se mostrarán cuando el sistema
                  esté activo
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
