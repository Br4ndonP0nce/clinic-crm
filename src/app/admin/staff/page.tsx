// src/app/admin/staff/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  getAllUsers,
  updateUserRole,
  deactivateUser,
  UserProfile,
  Role,
  SYSTEM_ROLES,
  createUserProfile,
} from "@/lib/firebase/rbac";
import {
  createUserAsAdminNoLogout,
  reAuthenticateAdmin,
} from "@/lib/firebase/admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  Edit2,
  Trash2,
  Shield,
  AlertCircle,
  CheckCircle,
  UserX,
  Users,
  Stethoscope,
  Phone,
  Mail,
  Calendar,
  Settings,
} from "lucide-react";

export default function StaffPage() {
  const { userProfile, hasPermission } = useAuth();
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showReAuthModal, setShowReAuthModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [newStaffCreated, setNewStaffCreated] = useState<string | null>(null);

  // New staff form state
  const [newStaffData, setNewStaffData] = useState({
    email: "",
    password: "",
    displayName: "",
    role: "recepcion" as Role,
    phone: "",
    specialty: "",
    licenseNumber: "",
  });

  useEffect(() => {
    if (hasPermission("staff:read")) {
      fetchStaff();
    }
  }, [hasPermission]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const allUsers = await getAllUsers();
      setStaff(allUsers);
    } catch (err) {
      console.error("Error fetching staff:", err);
      setError("Error al cargar el personal");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      // Import the ultimate function
      const { createUserAsAdminNoLogout } = await import(
        "@/lib/firebase/admin-auth"
      );

      // Create staff member using the ultimate method (no logout!)
      const result = await createUserAsAdminNoLogout(
        newStaffData.email,
        newStaffData.password,
        newStaffData.role,
        newStaffData.displayName
      );

      if (result.success) {
        // Reset form
        setNewStaffData({
          email: "",
          password: "",
          displayName: "",
          role: "recepcion",
          phone: "",
          specialty: "",
          licenseNumber: "",
        });
        setShowCreateForm(false);

        // Refresh the staff list
        await fetchStaff();

        // Clear any previous errors
        setError(null);

        // Optional: Show success message
        setNewStaffCreated(result.newUserId || "Usuario creado exitosamente");
      } else {
        console.error("❌ Staff creation failed:", result.error);
        setError(result.error || "Error al crear el miembro del personal");
      }
    } catch (err: any) {
      console.error("❌ Error in handleCreateStaff:", err);
      setError(err.message || "Error al crear el miembro del personal");
    } finally {
      setCreating(false);
    }
  };

  const handleReAuthentication = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      if (!userProfile?.email) {
        throw new Error("Email del usuario actual no encontrado");
      }

      const result = await reAuthenticateAdmin(
        userProfile.email,
        adminPassword
      );

      if (result.success) {
        setShowReAuthModal(false);
        setAdminPassword("");
        setNewStaffCreated(null);

        // Refresh the staff list
        await fetchStaff();

        // Show success message
        setError(null);
      } else {
        setError(result.error || "Error en la re-autenticación");
      }
    } catch (err: any) {
      console.error("Error re-authenticating:", err);
      setError(err.message || "Error en la re-autenticación");
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      await updateUserRole(userId, newRole);
      await fetchStaff(); // Refresh the list
    } catch (err) {
      console.error("Error updating staff role:", err);
      setError("Error al actualizar el rol del personal");
    }
  };

  const handleDeactivateStaff = async (userId: string) => {
    if (
      confirm(
        "¿Estás seguro de que quieres desactivar a este miembro del personal?"
      )
    ) {
      try {
        await deactivateUser(userId);
        await fetchStaff(); // Refresh the list
      } catch (err) {
        console.error("Error deactivating staff:", err);
        setError("Error al desactivar el miembro del personal");
      }
    }
  };

  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case "super_admin":
        return "bg-red-100 text-red-800";
      case "doctor":
        return "bg-purple-100 text-purple-800";
      case "recepcion":
        return "bg-blue-100 text-blue-800";
      case "ventas":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case "super_admin":
        return <Shield className="h-4 w-4" />;
      case "doctor":
        return <Stethoscope className="h-4 w-4" />;
      case "recepcion":
        return <Phone className="h-4 w-4" />;
      case "ventas":
        return <Users className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getStaffStats = () => {
    const activeStaff = staff.filter((member) => member.isActive);
    const doctors = activeStaff.filter((member) => member.role === "doctor");
    const reception = activeStaff.filter(
      (member) => member.role === "recepcion"
    );
    const sales = activeStaff.filter((member) => member.role === "ventas");
    const admins = activeStaff.filter(
      (member) => member.role === "super_admin"
    );

    return { activeStaff, doctors, reception, sales, admins };
  };

  const stats = getStaffStats();

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={["staff:read"]}>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Gestión de Personal</h1>
            <p className="text-gray-600">
              Administración del equipo de la clínica dental
            </p>
          </div>

          {hasPermission("staff:write") && (
            <Button onClick={() => setShowCreateForm(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Agregar Personal
            </Button>
          )}
        </div>

        {/* Staff Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Personal Activo</p>
                  <p className="text-2xl font-bold">
                    {stats.activeStaff.length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Doctores</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.doctors.length}
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
                  <p className="text-sm text-gray-600">Recepción</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.reception.length}
                  </p>
                </div>
                <Phone className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ventas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.sales.length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6 flex items-center">
            <AlertCircle className="mr-2 h-4 w-4" />
            {error}
          </div>
        )}

        {newStaffCreated && (
          <div className="bg-green-100 text-green-700 p-4 rounded-md mb-6 flex items-center">
            <CheckCircle className="mr-2 h-4 w-4" />
            Miembro del personal creado exitosamente
          </div>
        )}

        {/* Create Staff Form */}
        {showCreateForm && hasPermission("staff:write") && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Agregar Nuevo Miembro del Personal</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateStaff} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Correo Electrónico *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newStaffData.email}
                      onChange={(e) =>
                        setNewStaffData({
                          ...newStaffData,
                          email: e.target.value,
                        })
                      }
                      required
                      placeholder="doctor@clinica.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="displayName">Nombre Completo *</Label>
                    <Input
                      id="displayName"
                      type="text"
                      value={newStaffData.displayName}
                      onChange={(e) =>
                        setNewStaffData({
                          ...newStaffData,
                          displayName: e.target.value,
                        })
                      }
                      required
                      placeholder="Dr. Juan Pérez"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Contraseña Temporal *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newStaffData.password}
                      onChange={(e) =>
                        setNewStaffData({
                          ...newStaffData,
                          password: e.target.value,
                        })
                      }
                      required
                      minLength={6}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Rol en la Clínica *</Label>
                    <select
                      id="role"
                      value={newStaffData.role}
                      onChange={(e) =>
                        setNewStaffData({
                          ...newStaffData,
                          role: e.target.value as Role,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.entries(SYSTEM_ROLES).map(([key, role]) => (
                        <option key={key} value={key}>
                          {role.name} - {role.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={newStaffData.phone}
                      onChange={(e) =>
                        setNewStaffData({
                          ...newStaffData,
                          phone: e.target.value,
                        })
                      }
                      placeholder="+52 33 1234 5678"
                    />
                  </div>
                  <div>
                    <Label htmlFor="specialty">
                      Especialidad (Solo Doctores)
                    </Label>
                    <Input
                      id="specialty"
                      type="text"
                      value={newStaffData.specialty}
                      onChange={(e) =>
                        setNewStaffData({
                          ...newStaffData,
                          specialty: e.target.value,
                        })
                      }
                      placeholder="Ej: Endodoncia, Ortodoncia"
                      disabled={newStaffData.role !== "doctor"}
                    />
                  </div>
                  <div>
                    <Label htmlFor="licenseNumber">
                      Número de Cédula (Solo Doctores)
                    </Label>
                    <Input
                      id="licenseNumber"
                      type="text"
                      value={newStaffData.licenseNumber}
                      onChange={(e) =>
                        setNewStaffData({
                          ...newStaffData,
                          licenseNumber: e.target.value,
                        })
                      }
                      placeholder="Número de cédula profesional"
                      disabled={newStaffData.role !== "doctor"}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={creating}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {creating ? "Creando..." : "Crear Miembro del Personal"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Re-authentication Modal */}
        {showReAuthModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">
                ✅ ¡Personal Creado Exitosamente!
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Para mantener la seguridad, por favor ingresa tu contraseña de
                administrador para continuar gestionando el personal.
              </p>
              <form onSubmit={handleReAuthentication}>
                <div className="mb-4">
                  <Label>Tu Contraseña de Administrador</Label>
                  <Input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={creating}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {creating ? "Iniciando Sesión..." : "Continuar como Admin"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowReAuthModal(false);
                      setAdminPassword("");
                      window.location.reload();
                    }}
                  >
                    Actualizar Página
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Staff Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Todo el Personal ({staff.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Personal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha de Creación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {staff.map((member) => (
                    <tr key={member.uid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-900">
                                {member.displayName?.charAt(0)?.toUpperCase() ||
                                  member.email?.charAt(0)?.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {member.displayName || "Sin nombre"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {hasPermission("staff:write") ? (
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleRoleChange(
                                member.uid,
                                e.target.value as Role
                              )
                            }
                            className={`text-xs px-2 py-1 rounded-full font-medium border-0 ${getRoleBadgeColor(
                              member.role
                            )}`}
                            disabled={member.uid === userProfile?.uid} // Can't change own role
                          >
                            {Object.entries(SYSTEM_ROLES).map(([key, role]) => (
                              <option key={key} value={key}>
                                {role.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center">
                            {getRoleIcon(member.role)}
                            <Badge
                              className={`ml-2 ${getRoleBadgeColor(
                                member.role
                              )}`}
                            >
                              {SYSTEM_ROLES[member.role]?.name || member.role}
                            </Badge>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {member.isActive ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              <span className="text-green-800 text-sm">
                                Activo
                              </span>
                            </>
                          ) : (
                            <>
                              <UserX className="h-4 w-4 text-red-500 mr-2" />
                              <span className="text-red-800 text-sm">
                                Inactivo
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="h-3 w-3 text-gray-400 mr-1" />
                            <a
                              href={`mailto:${member.email}`}
                              className="text-blue-600 hover:underline"
                            >
                              {member.email}
                            </a>
                          </div>
                          {/* Add phone display when we extend the schema */}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.createdAt
                          ? new Date(
                              member.createdAt.seconds * 1000
                            ).toLocaleDateString("es-MX")
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {hasPermission("staff:write") &&
                            member.uid !== userProfile?.uid && (
                              <>
                                {member.isActive && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleDeactivateStaff(member.uid)
                                    }
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <UserX className="h-4 w-4" />
                                  </Button>
                                )}
                              </>
                            )}

                          {/* View Schedule Button for Doctors */}
                          {member.role === "doctor" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                (window.location.href = `/admin/calendar?doctor=${member.uid}`)
                              }
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {hasPermission("staff:write") && (
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="flex items-center p-4">
                <Settings className="h-8 w-8 text-gray-500 mr-3" />
                <div>
                  <h3 className="font-medium">Configurar Horarios</h3>
                  <p className="text-sm text-gray-600">
                    Gestionar horarios del personal
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => (window.location.href = "/admin/calendar")}
          >
            <CardContent className="flex items-center p-4">
              <Calendar className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <h3 className="font-medium">Ver Calendario</h3>
                <p className="text-sm text-gray-600">Horarios y citas</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="flex items-center p-4">
              <Users className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <h3 className="font-medium">Reportes de Personal</h3>
                <p className="text-sm text-gray-600">
                  Productividad y asistencia
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
