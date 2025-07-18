// src/components/ui/admin/PatientTable.tsx - Updated with Quick Appointment Action
"use client";

import React from "react";
import Link from "next/link";
import { Patient, updatePatient } from "@/lib/firebase/db";
import { useAuth } from "@/hooks/useAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Calendar,
  FileText,
  Phone,
  Mail,
  User,
  Clock,
  UserCheck,
  UserX,
  Activity,
  CalendarPlus,
} from "lucide-react";

interface PatientTableProps {
  patients: Patient[];
  onStatusChange: (patientId: string, newStatus: Patient["status"]) => void;
  // NEW: Quick appointment functionality
  onQuickAppointment?: (patient: Patient) => void;
  showQuickActions?: boolean;
}

export default function PatientTable({
  patients,
  onStatusChange,
  onQuickAppointment,
  showQuickActions = false,
}: PatientTableProps) {
  const { userProfile, hasPermission } = useAuth();

  const getStatusColor = (status: Patient["status"]) => {
    switch (status) {
      case "inquiry":
        return "bg-blue-100 text-blue-800";
      case "scheduled":
        return "bg-amber-100 text-amber-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "treatment":
        return "bg-purple-100 text-purple-800";
      case "maintenance":
        return "bg-teal-100 text-teal-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: Patient["status"]) => {
    switch (status) {
      case "inquiry":
        return "Consulta";
      case "scheduled":
        return "Programado";
      case "active":
        return "Activo";
      case "treatment":
        return "En Tratamiento";
      case "maintenance":
        return "Mantenimiento";
      case "inactive":
        return "Inactivo";
      default:
        return "Desconocido";
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateAge = (dateOfBirth: Date) => {
    if (!dateOfBirth) return "N/A";
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const handleStatusChange = async (
    patientId: string,
    newStatus: Patient["status"]
  ) => {
    try {
      await updatePatient(patientId, { status: newStatus }, userProfile?.uid);
      onStatusChange(patientId, newStatus);
    } catch (error) {
      console.error("Error updating patient status:", error);
    }
  };

  // NEW: Handle quick appointment creation
  const handleQuickAppointmentClick = (
    patient: Patient,
    event: React.MouseEvent
  ) => {
    event.stopPropagation(); // Prevent row click if you have it
    onQuickAppointment?.(patient);
  };

  if (patients.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay pacientes
        </h3>
        <p className="text-gray-500">
          No se encontraron pacientes con los criterios de búsqueda actuales.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Paciente</TableHead>
            <TableHead>Edad</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Última Visita</TableHead>
            <TableHead>Registrado</TableHead>
            <TableHead>Asignado a</TableHead>
            {/* NEW: Quick Actions Column - Only show if enabled */}
            {showQuickActions && (
              <TableHead className="text-center">Acciones Rápidas</TableHead>
            )}
            <TableHead className="text-right">Más</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => (
            <TableRow key={patient.id} className="hover:bg-gray-50">
              <TableCell>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                      {patient.firstName.slice(0, 1).toUpperCase()}
                      {patient.lastName.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{patient.fullName}</div>
                    <div className="text-sm text-gray-500 capitalize">
                      {patient.gender === "prefer_not_to_say"
                        ? "No especifica"
                        : patient.gender}
                    </div>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <span className="text-sm">
                  {calculateAge(patient.dateOfBirth.toDate())} años
                </span>
              </TableCell>

              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center text-sm">
                    <Mail className="h-3 w-3 text-gray-400 mr-1" />
                    <a
                      href={`mailto:${patient.email}`}
                      className="text-blue-600 hover:underline truncate"
                    >
                      {patient.email}
                    </a>
                  </div>
                  <div className="flex items-center text-sm">
                    <Phone className="h-3 w-3 text-gray-400 mr-1" />
                    <a
                      href={`tel:${patient.phone}`}
                      className="hover:underline"
                    >
                      {patient.phone}
                    </a>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <Badge className={getStatusColor(patient.status)}>
                  {getStatusLabel(patient.status)}
                </Badge>
              </TableCell>

              <TableCell>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-3 w-3 mr-1" />
                  {patient.dentalHistory.lastVisit
                    ? formatDate(patient.dentalHistory.lastVisit)
                    : "Primera visita"}
                </div>
              </TableCell>

              <TableCell>
                <span className="text-sm text-gray-600">
                  {formatDate(patient.createdAt)}
                </span>
              </TableCell>

              <TableCell>
                {patient.assignedTo ? (
                  <div className="flex items-center text-sm">
                    <UserCheck className="h-3 w-3 text-green-500 mr-1" />
                    <span>Asignado</span>
                  </div>
                ) : (
                  <div className="flex items-center text-sm text-gray-500">
                    <UserX className="h-3 w-3 mr-1" />
                    <span>Sin asignar</span>
                  </div>
                )}
              </TableCell>

              {/* NEW: Quick Actions Column */}
              {showQuickActions && (
                <TableCell className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    {/* Quick Appointment Button */}
                    {onQuickAppointment &&
                      hasPermission("appointments:write") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) =>
                            handleQuickAppointmentClick(patient, e)
                          }
                          className="flex items-center h-8 px-2"
                          title="Crear nueva cita para este paciente"
                        >
                          <CalendarPlus className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline text-xs">Cita</span>
                        </Button>
                      )}

                    {/* Quick View Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 px-2"
                      title="Ver perfil del paciente"
                    >
                      <Link href={`/admin/patients/${patient.id}`}>
                        <Eye className="h-3 w-3" />
                        <span className="sr-only">Ver perfil</span>
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              )}

              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menú</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {/* View Patient */}
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/patients/${patient.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Perfil
                      </Link>
                    </DropdownMenuItem>

                    {/* Schedule Appointment - NEW: With actual functionality */}
                    {hasPermission("appointments:write") &&
                      onQuickAppointment && (
                        <DropdownMenuItem
                          onClick={() => onQuickAppointment(patient)}
                        >
                          <CalendarPlus className="mr-2 h-4 w-4" />
                          Programar Cita
                        </DropdownMenuItem>
                      )}

                    {/* Add Treatment */}
                    {hasPermission("treatments:write") && (
                      <DropdownMenuItem>
                        <FileText className="mr-2 h-4 w-4" />
                        Nuevo Tratamiento
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    {/* Status Changes */}
                    {hasPermission("patients:write") && (
                      <>
                        <DropdownMenuLabel>Cambiar Estado</DropdownMenuLabel>

                        {patient.status !== "scheduled" && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(patient.id!, "scheduled")
                            }
                          >
                            <Calendar className="mr-2 h-4 w-4 text-amber-500" />
                            Programar
                          </DropdownMenuItem>
                        )}

                        {patient.status !== "active" && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(patient.id!, "active")
                            }
                          >
                            <UserCheck className="mr-2 h-4 w-4 text-green-500" />
                            Activar
                          </DropdownMenuItem>
                        )}

                        {patient.status !== "treatment" && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(patient.id!, "treatment")
                            }
                          >
                            <Activity className="mr-2 h-4 w-4 text-purple-500" />
                            En Tratamiento
                          </DropdownMenuItem>
                        )}

                        {patient.status !== "maintenance" && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(patient.id!, "maintenance")
                            }
                          >
                            <Clock className="mr-2 h-4 w-4 text-teal-500" />
                            Mantenimiento
                          </DropdownMenuItem>
                        )}

                        {patient.status !== "inactive" && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(patient.id!, "inactive")
                            }
                          >
                            <UserX className="mr-2 h-4 w-4 text-gray-500" />
                            Desactivar
                          </DropdownMenuItem>
                        )}
                      </>
                    )}

                    <DropdownMenuSeparator />

                    {/* Contact Actions */}
                    <DropdownMenuItem asChild>
                      <a href={`mailto:${patient.email}`}>
                        <Mail className="mr-2 h-4 w-4" />
                        Enviar Email
                      </a>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <a href={`tel:${patient.phone}`}>
                        <Phone className="mr-2 h-4 w-4" />
                        Llamar
                      </a>
                    </DropdownMenuItem>

                    {/* Edit */}
                    {hasPermission("patients:write") && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/admin/patients/${patient.id}?edit=true`}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
