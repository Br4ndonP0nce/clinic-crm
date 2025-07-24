// src/app/admin/schedule-settings/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { getAllUsers, UserProfile } from "@/lib/firebase/rbac";
import {
  getDoctorSchedule,
  saveDoctorSchedule,
  checkScheduleConflicts,
  DoctorSchedule,
  ScheduleConflict,
  DayOfWeek,
  DaySchedule,
  validateTimeSlot,
  getDayNameInSpanish,
  CLINIC_HOURS,
} from "@/lib/firebase/doctor-schedule";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Calendar,
  Clock,
  Settings,
  Save,
  RotateCcw,
  AlertTriangle,
  Users,
  CheckCircle,
  X,
} from "lucide-react";

// Simple Switch component if not available in your UI library
const Switch: React.FC<{
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onCheckedChange, disabled = false }) => (
  <button
    type="button"
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
      checked ? "bg-blue-600" : "bg-gray-200"
    } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    onClick={() => !disabled && onCheckedChange(!checked)}
    disabled={disabled}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

const DAYS_ORDER: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export default function ScheduleSettingsPage() {
  const { userProfile } = useAuth();
  const { isSuperAdmin, isDoctor } = usePermissions();

  // State management
  const [doctors, setDoctors] = useState<UserProfile[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [currentSchedule, setCurrentSchedule] = useState<DoctorSchedule | null>(
    null
  );
  const [workingSchedule, setWorkingSchedule] = useState<Record<
    DayOfWeek,
    DaySchedule
  > | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Conflict handling
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load doctors on mount
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setIsLoading(true);
        const allUsers = await getAllUsers();
        const doctorUsers = allUsers.filter(
          (user) => user.role === "doctor" && user.isActive
        );
        setDoctors(doctorUsers);

        // Auto-select current user if they're a doctor
        if (isDoctor && userProfile?.uid) {
          setSelectedDoctorId(userProfile.uid);
        } else if (doctorUsers.length > 0) {
          setSelectedDoctorId(doctorUsers[0].uid);
        }
      } catch (err) {
        console.error("Error loading doctors:", err);
        setError("Error al cargar la lista de doctores");
      } finally {
        setIsLoading(false);
      }
    };

    loadDoctors();
  }, [userProfile, isDoctor]);

  // Load schedule when doctor is selected
  useEffect(() => {
    const loadSchedule = async () => {
      if (!selectedDoctorId) return;

      try {
        setIsLoading(true);
        const schedule = await getDoctorSchedule(selectedDoctorId);
        setCurrentSchedule(schedule);
        setWorkingSchedule({ ...schedule.schedule });
        setHasUnsavedChanges(false);
        setValidationErrors({});
      } catch (err) {
        console.error("Error loading schedule:", err);
        setError("Error al cargar el horario del doctor");
      } finally {
        setIsLoading(false);
      }
    };

    loadSchedule();
  }, [selectedDoctorId]);

  // Validate and update day schedule
  const updateDaySchedule = (
    day: DayOfWeek,
    field: keyof DaySchedule,
    value: any
  ) => {
    if (!workingSchedule) return;

    const newSchedule = { ...workingSchedule };
    newSchedule[day] = { ...newSchedule[day], [field]: value };

    // If toggling availability off, no need to validate times
    if (field === "isAvailable" && !value) {
      setWorkingSchedule(newSchedule);
      setHasUnsavedChanges(true);
      return;
    }

    // Validate times if they're being changed
    if (
      (field === "startTime" || field === "endTime") &&
      newSchedule[day].isAvailable
    ) {
      const { startTime, endTime } = newSchedule[day];
      const validation = validateTimeSlot(startTime, endTime);

      const errorKey = `${day}_time`;
      const newErrors = { ...validationErrors };

      if (!validation.valid) {
        newErrors[errorKey] = validation.error!;
      } else {
        delete newErrors[errorKey];
      }

      setValidationErrors(newErrors);
    }

    setWorkingSchedule(newSchedule);
    setHasUnsavedChanges(true);
  };

  // Reset to current saved schedule
  const resetSchedule = () => {
    if (currentSchedule) {
      setWorkingSchedule({ ...currentSchedule.schedule });
      setHasUnsavedChanges(false);
      setValidationErrors({});
    }
  };

  // Check for conflicts before saving
  const handleSave = async () => {
    if (!workingSchedule || !selectedDoctorId || !userProfile) return;

    // Check for validation errors
    if (Object.keys(validationErrors).length > 0) {
      setError("Por favor corrija los errores de validación antes de guardar");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Check for appointment conflicts
      const conflicts = await checkScheduleConflicts(
        selectedDoctorId,
        workingSchedule
      );

      if (conflicts.length > 0) {
        setConflicts(conflicts);
        setShowConflictDialog(true);
        return;
      }

      // No conflicts, save directly
      await saveDoctorSchedule(
        selectedDoctorId,
        workingSchedule,
        userProfile.uid
      );

      // Reload the schedule to get updated version
      const updatedSchedule = await getDoctorSchedule(selectedDoctorId);
      setCurrentSchedule(updatedSchedule);
      setHasUnsavedChanges(false);

      // Success message (you can replace with a toast notification)
      setError(null);
      console.log("Schedule saved successfully");
    } catch (err) {
      console.error("Error saving schedule:", err);
      setError("Error al guardar el horario");
    } finally {
      setSaving(false);
    }
  };

  // Force save despite conflicts
  const forceSave = async () => {
    if (!workingSchedule || !selectedDoctorId || !userProfile) return;

    try {
      setSaving(true);
      await saveDoctorSchedule(
        selectedDoctorId,
        workingSchedule,
        userProfile.uid
      );

      const updatedSchedule = await getDoctorSchedule(selectedDoctorId);
      setCurrentSchedule(updatedSchedule);
      setHasUnsavedChanges(false);
      setShowConflictDialog(false);
      setConflicts([]);
    } catch (err) {
      console.error("Error force saving schedule:", err);
      setError("Error al guardar el horario");
    } finally {
      setSaving(false);
    }
  };

  const selectedDoctor = doctors.find((d) => d.uid === selectedDoctorId);
  const canEdit =
    isSuperAdmin || (isDoctor && userProfile?.uid === selectedDoctorId);

  if (isLoading && !workingSchedule) {
    return (
      <ProtectedRoute requiredPermissions={["schedule:read"]}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={["schedule:read"]}>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center">
              <Settings className="mr-2 h-6 w-6" />
              Configuración de Horarios
            </h1>
            <p className="text-sm text-gray-600">
              Gestión de horarios de disponibilidad por doctor
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Doctor Selection */}
        {isSuperAdmin && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Users className="h-5 w-5 text-gray-500" />
                <div className="flex-1">
                  <Label htmlFor="doctorSelect">Seleccionar Doctor</Label>
                  <Select
                    value={selectedDoctorId}
                    onValueChange={setSelectedDoctorId}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Seleccione un doctor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.uid} value={doctor.uid}>
                          {doctor.displayName || doctor.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Schedule Editor */}
        {selectedDoctor && workingSchedule && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Horario - {selectedDoctor.displayName || selectedDoctor.email}
                </span>
                <Badge variant="outline">
                  Horario de Clínica: {CLINIC_HOURS.earliest} -{" "}
                  {CLINIC_HOURS.latest}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Schedule Grid */}
                <div className="grid gap-4">
                  {DAYS_ORDER.map((day) => {
                    const daySchedule = workingSchedule[day];
                    const hasError = validationErrors[`${day}_time`];

                    return (
                      <div
                        key={day}
                        className={`flex items-center space-x-4 p-4 border rounded-lg ${
                          hasError
                            ? "border-red-300 bg-red-50"
                            : "border-gray-200"
                        }`}
                      >
                        {/* Day Toggle */}
                        <div className="flex items-center space-x-3 min-w-[120px]">
                          <Switch
                            checked={daySchedule.isAvailable}
                            onCheckedChange={(checked) =>
                              canEdit &&
                              updateDaySchedule(day, "isAvailable", checked)
                            }
                            disabled={!canEdit}
                          />
                          <Label className="font-medium">
                            {getDayNameInSpanish(day)}
                          </Label>
                        </div>

                        {/* Time Inputs */}
                        <div className="flex items-center space-x-2 flex-1">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <Input
                              type="time"
                              value={daySchedule.startTime}
                              onChange={(e) =>
                                canEdit &&
                                updateDaySchedule(
                                  day,
                                  "startTime",
                                  e.target.value
                                )
                              }
                              disabled={!canEdit || !daySchedule.isAvailable}
                              min={CLINIC_HOURS.earliest}
                              max={CLINIC_HOURS.latest}
                              className="w-24"
                            />
                            <span className="text-gray-500">a</span>
                            <Input
                              type="time"
                              value={daySchedule.endTime}
                              onChange={(e) =>
                                canEdit &&
                                updateDaySchedule(
                                  day,
                                  "endTime",
                                  e.target.value
                                )
                              }
                              disabled={!canEdit || !daySchedule.isAvailable}
                              min={CLINIC_HOURS.earliest}
                              max={CLINIC_HOURS.latest}
                              className="w-24"
                            />
                          </div>

                          {/* Status Indicator */}
                          <div className="min-w-[120px]">
                            {daySchedule.isAvailable ? (
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-800"
                              >
                                Disponible
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="bg-gray-100 text-gray-600"
                              >
                                No disponible
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Error Display */}
                        {hasError && (
                          <div className="min-w-[200px]">
                            <p className="text-red-600 text-xs">{hasError}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Action Buttons */}
                {canEdit && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        onClick={resetSchedule}
                        disabled={!hasUnsavedChanges || isSaving}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Restablecer
                      </Button>
                    </div>

                    <div className="flex items-center space-x-2">
                      {hasUnsavedChanges && (
                        <Badge
                          variant="outline"
                          className="text-amber-600 border-amber-600"
                        >
                          Cambios sin guardar
                        </Badge>
                      )}
                      <Button
                        onClick={handleSave}
                        disabled={
                          !hasUnsavedChanges ||
                          isSaving ||
                          Object.keys(validationErrors).length > 0
                        }
                      >
                        {isSaving ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Guardando...
                          </div>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Guardar Horario
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Read-only notice */}
                {!canEdit && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Solo puedes ver este horario. No tienes permisos para
                      editarlo.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Schedule Summary */}
        {workingSchedule && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen del Horario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {DAYS_ORDER.map((day) => {
                  const schedule = workingSchedule[day];
                  return (
                    <div
                      key={day}
                      className={`p-3 rounded-lg border ${
                        schedule.isAvailable
                          ? "border-green-200 bg-green-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="font-medium text-sm">
                        {getDayNameInSpanish(day)}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {schedule.isAvailable
                          ? `${schedule.startTime} - ${schedule.endTime}`
                          : "No disponible"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conflict Resolution Dialog */}
        <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
                Conflictos de Horario Detectados
              </DialogTitle>
              <DialogDescription>
                Los siguientes pacientes tienen citas programadas que entran en
                conflicto con el nuevo horario. Debes cancelar o reprogramar
                estas citas antes de guardar el horario.
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[400px] overflow-y-auto">
              <div className="space-y-3">
                {conflicts.map((conflict, index) => (
                  <div
                    key={conflict.appointmentId}
                    className="p-4 border border-red-200 bg-red-50 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-red-900">
                          {conflict.patientName}
                        </h4>
                        <div className="text-sm text-red-700 space-y-1 mt-1">
                          <div>
                            📅{" "}
                            {conflict.appointmentDate.toLocaleDateString(
                              "es-MX",
                              {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                              }
                            )}
                          </div>
                          <div>
                            🕐 {conflict.appointmentTime} ({conflict.duration}{" "}
                            min)
                          </div>
                          <div>⚠️ {conflict.reason}</div>
                        </div>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        Conflicto
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="flex-col space-y-2">
              <div className="text-xs text-gray-600 text-center">
                Recomendación: Cancela o reprograma las citas conflictivas
                primero, luego intenta guardar el horario nuevamente.
              </div>
              <div className="flex space-x-2 justify-end w-full">
                <Button
                  variant="outline"
                  onClick={() => setShowConflictDialog(false)}
                  disabled={isSaving}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={forceSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </div>
                  ) : (
                    <>
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Guardar de Todas Formas
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
