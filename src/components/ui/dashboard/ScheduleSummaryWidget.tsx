// src/components/dashboard/ScheduleSummaryWidget.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import {
  getDoctorSchedule,
  DoctorSchedule,
  getDayNameInSpanish,
  DayOfWeek,
} from "@/lib/firebase/doctor-schedule";
import {
  Clock,
  Calendar,
  Settings,
  ChevronRight,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

const DAYS_ORDER: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

interface ScheduleSummaryWidgetProps {
  doctorId?: string; // If not provided, will use current user (for doctors)
}

export const ScheduleSummaryWidget: React.FC<ScheduleSummaryWidgetProps> = ({
  doctorId,
}) => {
  const { userProfile } = useAuth();
  const {
    isDoctor,
    isSuperAdmin,
    canViewSchedules,
    canEditSchedules,
    canEditDoctorSchedule,
    canViewDoctorSchedule,
  } = usePermissions();
  const router = useRouter();

  const [schedule, setSchedule] = useState<DoctorSchedule | null>(null);
  const [loading, setLoading] = useState(false);

  const targetDoctorId = doctorId || (isDoctor ? userProfile?.uid : null);

  // Use your existing permission functions with proper null handling
  const canView =
    canViewSchedules &&
    targetDoctorId &&
    (canViewDoctorSchedule ? canViewDoctorSchedule(targetDoctorId) : false);
  const canEdit =
    canEditSchedules &&
    targetDoctorId &&
    (canEditDoctorSchedule ? canEditDoctorSchedule(targetDoctorId) : false);

  useEffect(() => {
    const loadSchedule = async () => {
      if (!targetDoctorId || !canView) return;

      try {
        setLoading(true);
        const doctorSchedule = await getDoctorSchedule(targetDoctorId);
        setSchedule(doctorSchedule);
      } catch (error) {
        console.error("Error loading schedule:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, [targetDoctorId, canView]);

  if (!canView || !targetDoctorId) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            Mi Horario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!schedule) {
    return null;
  }

  const availableDays = DAYS_ORDER.filter(
    (day) => schedule.schedule[day].isAvailable
  );
  const totalAvailableDays = availableDays.length;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            {isDoctor ? "Mi Horario" : "Horario Doctor"}
          </CardTitle>
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/schedule-settings")}
              className="text-blue-600 hover:text-blue-700"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Días disponibles:</div>
          <Badge variant="outline" className="bg-green-50 text-green-700">
            {totalAvailableDays} de 7
          </Badge>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {DAYS_ORDER.map((day) => {
            const daySchedule = schedule.schedule[day];
            const dayShort = getDayNameInSpanish(day).substring(0, 3);

            return (
              <div
                key={day}
                className={`text-center p-2 rounded text-xs ${
                  daySchedule.isAvailable
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                <div className="font-medium">{dayShort}</div>
                <div className="mt-1">
                  {daySchedule.isAvailable ? (
                    <CheckCircle className="h-3 w-3 mx-auto" />
                  ) : (
                    <XCircle className="h-3 w-3 mx-auto" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Working Hours Summary */}
        {totalAvailableDays > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">
              Horarios de trabajo:
            </div>
            <div className="space-y-1">
              {availableDays.slice(0, 3).map((day) => {
                const daySchedule = schedule.schedule[day];
                return (
                  <div key={day} className="flex justify-between text-xs">
                    <span className="text-gray-600">
                      {getDayNameInSpanish(day)}:
                    </span>
                    <span className="font-medium">
                      {daySchedule.startTime} - {daySchedule.endTime}
                    </span>
                  </div>
                );
              })}
              {availableDays.length > 3 && (
                <div className="text-xs text-gray-500 text-center">
                  +{availableDays.length - 3} días más
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => router.push("/admin/schedule-settings")}
          >
            <Settings className="mr-2 h-4 w-4" />
            Configurar Horario
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}

        {/* Read-only notice */}
        {!canEdit && canView && (
          <div className="text-xs text-gray-500 text-center">
            Horario configurado por el doctor
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScheduleSummaryWidget;
