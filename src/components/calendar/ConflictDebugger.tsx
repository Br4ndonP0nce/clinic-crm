// src/components/calendar/ConflictDebugger.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { Appointment } from "@/lib/firebase/db";
import {
  timestampToLocalDate,
  createLocalDateTime,
  formatDateForInput,
} from "@/lib/utils/datetime";

interface ConflictDebuggerProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  duration: number;
  appointments: Appointment[];
  isOpen?: boolean;
}

export const ConflictDebugger: React.FC<ConflictDebuggerProps> = ({
  selectedDate,
  selectedTime,
  duration,
  appointments,
  isOpen = false,
}) => {
  if (!isOpen || !selectedDate || !selectedTime) return null;

  const slotStart = createLocalDateTime(
    formatDateForInput(selectedDate),
    selectedTime
  );
  const slotEnd = new Date(slotStart.getTime() + duration * 60000);

  // Get appointments for the selected day
  const dayAppointments = appointments.filter((apt) => {
    const aptDate = timestampToLocalDate(apt.appointmentDate);
    return aptDate.toDateString() === selectedDate.toDateString();
  });

  const checkConflict = (appointment: Appointment) => {
    const aptStart = timestampToLocalDate(appointment.appointmentDate);
    const aptEnd = new Date(aptStart.getTime() + appointment.duration * 60000);

    // Precise overlap detection with back-to-back allowance
    const rawOverlap = slotStart < aptEnd && slotEnd > aptStart;
    const isBackToBack =
      slotEnd.getTime() === aptStart.getTime() ||
      slotStart.getTime() === aptEnd.getTime();
    const finalConflict = rawOverlap && !isBackToBack;

    return {
      overlaps: finalConflict,
      rawOverlap,
      isBackToBack,
      aptStart,
      aptEnd,
      details: {
        slotStartsBeforeAptEnds: slotStart < aptEnd,
        slotEndsAfterAptStarts: slotEnd > aptStart,
        slotEndEqualsAptStart: slotEnd.getTime() === aptStart.getTime(),
        slotStartEqualsAptEnd: slotStart.getTime() === aptEnd.getTime(),
        timeDifference: {
          slotStartToAptEnd: aptEnd.getTime() - slotStart.getTime(),
          slotEndToAptStart: slotEnd.getTime() - aptStart.getTime(),
        },
      },
    };
  };

  return (
    <Card className="mt-4 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center text-orange-800">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Debug: Conflict Detection Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Selected Slot Info */}
        <div className="bg-white p-3 rounded border">
          <h4 className="font-medium text-sm mb-2">
            Nuevo Horario Solicitado:
          </h4>
          <div className="text-xs space-y-1">
            <div>📅 Fecha: {selectedDate.toLocaleDateString("es-MX")}</div>
            <div>
              🕒 Inicio:{" "}
              {slotStart.toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div>
              🕒 Fin:{" "}
              {slotEnd.toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div>⏱️ Duración: {duration} minutos</div>
          </div>
        </div>

        {/* Existing Appointments Analysis */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Citas Existentes del Día:</h4>
          {dayAppointments.length === 0 ? (
            <div className="text-xs text-gray-600 flex items-center">
              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
              No hay citas este día - Sin conflictos
            </div>
          ) : (
            dayAppointments.map((appointment) => {
              const conflict = checkConflict(appointment);

              return (
                <div
                  key={appointment.id}
                  className={`p-2 rounded border text-xs ${
                    conflict.overlaps
                      ? "bg-red-100 border-red-300"
                      : "bg-green-100 border-green-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Cita Existente</span>
                    <Badge
                      variant={conflict.overlaps ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {conflict.overlaps ? "CONFLICTO" : "SIN CONFLICTO"}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div>
                      🕒{" "}
                      {conflict.aptStart.toLocaleTimeString("es-MX", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {conflict.aptEnd.toLocaleTimeString("es-MX", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div>⏱️ Duración: {appointment.duration} min</div>
                    <div>📋 Tipo: {appointment.type}</div>
                  </div>

                  {conflict.rawOverlap && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="text-gray-700 font-medium mb-1">
                        Análisis de Conflicto:
                      </div>
                      <div className="space-y-1">
                        <div>
                          • Hay superposición de tiempo:{" "}
                          {conflict.rawOverlap ? "✅ Sí" : "❌ No"}
                        </div>
                        <div>
                          • Citas consecutivas (una termina cuando otra inicia):{" "}
                          {conflict.isBackToBack ? "✅ Sí" : "❌ No"}
                        </div>
                        <div>
                          • ¿El nuevo termina exactamente cuando inicia la
                          existente?:{" "}
                          {conflict.details.slotEndEqualsAptStart
                            ? "✅ Sí"
                            : "❌ No"}
                        </div>
                        <div>
                          • ¿El nuevo inicia exactamente cuando termina la
                          existente?:{" "}
                          {conflict.details.slotStartEqualsAptEnd
                            ? "✅ Sí"
                            : "❌ No"}
                        </div>
                        <div
                          className={`font-medium ${
                            conflict.overlaps
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          Resultado:{" "}
                          {conflict.overlaps
                            ? "CONFLICTO (se superponen)"
                            : "SIN CONFLICTO (consecutivas permitidas)"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Recommendation */}
        <div className="bg-blue-50 p-3 rounded border border-blue-200">
          <h4 className="font-medium text-sm text-blue-800 mb-1">
            Recomendación:
          </h4>
          <div className="text-xs text-blue-700">
            {dayAppointments.some((apt) => checkConflict(apt).overlaps)
              ? "❌ Este horario causaría un conflicto. Selecciona otro horario disponible."
              : "✅ Este horario está disponible y no causa conflictos."}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
