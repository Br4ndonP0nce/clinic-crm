// src/app/admin/ventas/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { getSales } from "@/lib/firebase/sales";
import { getUserProfile } from "@/lib/firebase/rbac";
import { getPatient } from "@/lib/firebase/db"; // Updated from getLead
import {
  Sale,
  getPaymentPlanLabel,
  getDentalProductLabel,
} from "@/types/sales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  CreditCard,
  User,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Stethoscope,
  Award,
  Package,
  Phone,
  Mail,
} from "lucide-react";

interface SaleWithPatient extends Sale {
  patientData: {
    id: string;
    fullName: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status: string;
  } | null;
}

export default function VentasUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [sales, setSales] = useState<SaleWithPatient[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = params.id as string;

  useEffect(() => {
    if (userId) {
      fetchUserSalesData();
    }
  }, [userId]);

  const fetchUserSalesData = async () => {
    try {
      setLoading(true);

      // Fetch user profile and sales
      const [userProfile, allSales] = await Promise.all([
        getUserProfile(userId),
        getSales({ saleUserId: userId }),
      ]);

      setUser(userProfile);

      // Get patient data for each sale
      const salesWithPatients = await Promise.all(
        allSales.map(async (sale) => {
          try {
            // Updated to use patientId instead of leadId
            const patientDataId = sale.patientId || sale.leadId;
            if (!patientDataId) {
              console.warn(`Sale ${sale.id} has no patientId or leadId`);
              return { ...sale, patientData: null };
            }
            const patientData = await getPatient(patientDataId);
            return {
              ...sale,
              patientData: patientData
                ? {
                    id: patientData.id!,
                    fullName: patientData.fullName,
                    firstName: patientData.firstName,
                    lastName: patientData.lastName,
                    email: patientData.email,
                    phone: patientData.phone,
                    status: patientData.status,
                  }
                : null,
            };
          } catch (err) {
            console.error(
              `Error fetching patient ${sale.patientId || sale.leadId}:`,
              err
            );
            return {
              ...sale,
              patientData: null,
            };
          }
        })
      );

      // Sort by creation date (newest first)
      salesWithPatients.sort((a, b) => {
        const dateA = toJsDate(a.createdAt);
        const dateB = toJsDate(b.createdAt);

        if (!dateA || !dateB) return 0;
        return dateB.getTime() - dateA.getTime();
      });

      setSales(salesWithPatients);
    } catch (err) {
      console.error("Error fetching user sales data:", err);
      setError("Error al cargar los datos de ventas");
    } finally {
      setLoading(false);
    }
  };

  // Utility function to safely convert any date format to JavaScript Date
  const toJsDate = (date: any): Date | null => {
    if (!date) return null;

    if (typeof date === "object" && date !== null && "toDate" in date) {
      // Firestore Timestamp
      return date.toDate();
    } else if (date instanceof Date) {
      // JavaScript Date
      return date;
    } else {
      // String or number timestamp
      const jsDate = new Date(date);
      return isNaN(jsDate.getTime()) ? null : jsDate;
    }
  };

  const formatDate = (date: any): string => {
    const jsDate = toJsDate(date);
    if (!jsDate) return "N/A";

    return jsDate.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentStatus = (sale: Sale) => {
    const progress = (sale.paidAmount / sale.totalAmount) * 100;

    if (progress >= 100)
      return {
        status: "completed",
        label: "Pagado Completo",
        color: "bg-green-100 text-green-800",
      };
    if (progress >= 50)
      return {
        status: "partial",
        label: "Pago Parcial",
        color: "bg-yellow-100 text-yellow-800",
      };
    if (progress > 0)
      return {
        status: "started",
        label: "Pago Iniciado",
        color: "bg-blue-100 text-blue-800",
      };
    return {
      status: "pending",
      label: "Pago Pendiente",
      color: "bg-gray-100 text-gray-800",
    };
  };

  const getServiceStatus = (sale: Sale) => {
    // For dental services, we track treatment completion instead of access
    if (!sale.serviceCompleted)
      return {
        status: "pending",
        label: "Pendiente",
        color: "bg-gray-100 text-gray-800",
      };

    if (sale.serviceEndDate) {
      const endDate = toJsDate(sale.serviceEndDate);
      if (endDate) {
        const now = new Date();
        if (now > endDate) {
          return {
            status: "expired",
            label: "Servicio Completado",
            color: "bg-blue-100 text-blue-800",
          };
        } else {
          return {
            status: "active",
            label: "En Tratamiento",
            color: "bg-green-100 text-green-800",
          };
        }
      }
    }

    return {
      status: "completed",
      label: "Servicio Completado",
      color: "bg-green-100 text-green-800",
    };
  };

  // Commission rate helper function
  const getCommissionRate = (role: string): number => {
    switch (role) {
      case "doctor":
        return 0.15; // 15% commission for doctors
      case "ventas":
        return 0.1; // 10% commission for sales staff
      case "recepcion":
        return 0.05; // 5% commission for reception
      case "super_admin":
        return 0.02; // 2% commission for admins
      default:
        return 0.02; // 2% default commission
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "doctor":
        return <Stethoscope className="h-4 w-4 text-purple-500" />;
      case "ventas":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "recepcion":
        return <Phone className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  // Calculate statistics
  const commissionRate = getCommissionRate(user?.role || "");
  const stats = sales.reduce(
    (acc, sale) => ({
      totalSales: acc.totalSales + 1,
      totalAmount: acc.totalAmount + sale.totalAmount,
      paidAmount: acc.paidAmount + sale.paidAmount,
      completedSales:
        acc.completedSales + (sale.paidAmount >= sale.totalAmount ? 1 : 0),
      activeServices:
        acc.activeServices +
        (sale.serviceCompleted && getServiceStatus(sale).status === "active"
          ? 1
          : 0),
      totalCommission: acc.totalCommission + sale.paidAmount * commissionRate,
    }),
    {
      totalSales: 0,
      totalAmount: 0,
      paidAmount: 0,
      completedSales: 0,
      activeServices: 0,
      totalCommission: 0,
    }
  );

  const conversionRate =
    stats.totalSales > 0 ? (stats.completedSales / stats.totalSales) * 100 : 0;
  const collectionRate =
    stats.totalAmount > 0 ? (stats.paidAmount / stats.totalAmount) * 100 : 0;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-6">
        <Button variant="outline" onClick={() => router.push("/admin/ventas")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Ventas
        </Button>
        <div className="bg-red-100 text-red-700 p-4 rounded-md mt-6">
          {error || "Usuario no encontrado"}
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={["ventas:read"]}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/ventas")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Ventas
          </Button>
        </div>

        {/* User Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">
                  {user.displayName || "Usuario Sin Nombre"}
                </h1>
                <p className="text-gray-600">{user.email}</p>
                <div className="flex items-center mt-2 space-x-2">
                  {getRoleIcon(user.role)}
                  <Badge className="capitalize">
                    {user.role === "doctor"
                      ? "Doctor"
                      : user.role === "ventas"
                      ? "Ventas"
                      : user.role === "recepcion"
                      ? "Recepción"
                      : user.role || "Sin Rol"}
                  </Badge>
                  <Badge variant="outline">
                    Comisión: {(commissionRate * 100).toFixed(0)}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Ventas</p>
                  <p className="text-2xl font-bold">{stats.totalSales}</p>
                </div>
                <CreditCard className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Monto Total</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${stats.totalAmount.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Cobrado</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ${stats.paidAmount.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">% Cobrado</p>
                  <p className="text-2xl font-bold">
                    {collectionRate.toFixed(0)}%
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Comisión Ganada</p>
                  <p className="text-2xl font-bold text-amber-600">
                    ${stats.totalCommission.toLocaleString()}
                  </p>
                </div>
                <Award className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En Tratamiento</p>
                  <p className="text-2xl font-bold">{stats.activeServices}</p>
                </div>
                <Stethoscope className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detalle de Ventas ({sales.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Servicio/Producto</TableHead>
                    <TableHead>Plan de Pago</TableHead>
                    <TableHead>Progreso de Pago</TableHead>
                    <TableHead>Estado del Servicio</TableHead>
                    <TableHead>Comisión</TableHead>
                    <TableHead>Fecha de Venta</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => {
                    const paymentStatus = getPaymentStatus(sale);
                    const serviceStatus = getServiceStatus(sale);
                    const paymentProgress =
                      (sale.paidAmount / sale.totalAmount) * 100;
                    const saleCommission = sale.paidAmount * commissionRate;

                    return (
                      <TableRow key={sale.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {sale.patientData?.fullName ||
                                "Paciente Desconocido"}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center space-x-2">
                              <Mail className="h-3 w-3" />
                              <span>
                                {sale.patientData?.email ||
                                  "Email no disponible"}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500 flex items-center space-x-2">
                              <Phone className="h-3 w-3" />
                              <span>
                                {sale.patientData?.phone ||
                                  "Teléfono no disponible"}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div>
                            <div className="font-medium flex items-center">
                              <Package className="h-4 w-4 mr-2 text-gray-400" />
                              {getDentalProductLabel(sale.product)}
                            </div>
                            <div className="text-sm text-gray-600">
                              ${sale.totalAmount.toLocaleString()}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {getPaymentPlanLabel(sale.paymentPlan)}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>${sale.paidAmount.toLocaleString()}</span>
                              <span>{paymentProgress.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{
                                  width: `${Math.min(paymentProgress, 100)}%`,
                                }}
                              />
                            </div>
                            <Badge
                              className={paymentStatus.color}
                              variant="outline"
                            >
                              {paymentStatus.label}
                            </Badge>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            className={serviceStatus.color}
                            variant="outline"
                          >
                            {serviceStatus.label}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div>
                            <span className="font-medium text-amber-600">
                              ${saleCommission.toLocaleString()}
                            </span>
                            <div className="text-xs text-gray-500">
                              ({(commissionRate * 100).toFixed(0)}% de cobrado)
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            {formatDate(sale.createdAt)}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex gap-2">
                            {sale.patientData && (
                              <Button size="sm" variant="outline" asChild>
                                <a
                                  href={`/admin/patients/${sale.patientData.id}`}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver Paciente
                                </a>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {sales.length === 0 && (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay ventas registradas
                </h3>
                <p className="text-gray-500">
                  Este miembro del personal aún no tiene ventas asociadas.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Resumen de Rendimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Tasa de Conversión
                  </span>
                  <span className="font-medium">
                    {conversionRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Tasa de Cobranza
                  </span>
                  <span className="font-medium">
                    {collectionRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Promedio por Venta
                  </span>
                  <span className="font-medium">
                    $
                    {stats.totalSales > 0
                      ? (stats.totalAmount / stats.totalSales).toLocaleString()
                      : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Comisión por Venta
                  </span>
                  <span className="font-medium text-amber-600">
                    $
                    {stats.totalSales > 0
                      ? (
                          stats.totalCommission / stats.totalSales
                        ).toLocaleString()
                      : 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="mr-2 h-5 w-5" />
                Información de Comisiones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Tasa de Comisión
                  </span>
                  <span className="font-medium">
                    {(commissionRate * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Ganado</span>
                  <span className="font-medium text-amber-600">
                    ${stats.totalCommission.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Pendiente de Cobro
                  </span>
                  <span className="font-medium text-orange-600">
                    $
                    {(
                      (stats.totalAmount - stats.paidAmount) *
                      commissionRate
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg">
                  <p className="text-xs text-amber-800">
                    Las comisiones se calculan sobre el monto cobrado, no sobre
                    el monto total de la venta.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
