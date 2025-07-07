// src/app/admin/ventas/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { getSales } from "@/lib/firebase/sales";
import { getAllUsers, UserProfile } from "@/lib/firebase/rbac";
import { Sale } from "@/types/sales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  BarChart3,
  DollarSign,
  TrendingUp,
  Users,
  Search,
  Eye,
  Calendar,
  CreditCard,
  Plus,
  Stethoscope,
  Package,
  Award,
} from "lucide-react";

interface SalesUserData {
  userId: string;
  user: UserProfile | null;
  salesCount: number;
  totalAmount: number;
  paidAmount: number;
  commissionEarned: number;
  sales: Sale[];
}

export default function VentasPage() {
  const { hasPermission } = useAuth();
  const [salesData, setSalesData] = useState<SalesUserData[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"staff" | "products">("staff");

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    try {
      setLoading(true);

      // Fetch all sales and users
      const [allSales, allUsers] = await Promise.all([
        getSales(),
        getAllUsers(),
      ]);

      setUsers(allUsers);

      // Group sales by saleUserId (staff member who made the sale)
      const salesByUser = new Map<string, Sale[]>();

      allSales.forEach((sale) => {
        const userId = sale.saleUserId;
        if (!salesByUser.has(userId)) {
          salesByUser.set(userId, []);
        }
        salesByUser.get(userId)!.push(sale);
      });

      // Create aggregated data with commission calculations
      const aggregatedData: SalesUserData[] = [];

      salesByUser.forEach((userSales, userId) => {
        const user = allUsers.find((u) => u.uid === userId) || null;
        const totalAmount = userSales.reduce(
          (sum, sale) => sum + sale.totalAmount,
          0
        );
        const paidAmount = userSales.reduce(
          (sum, sale) => sum + sale.paidAmount,
          0
        );

        // Calculate commission based on role and paid amount
        const commissionRate = getCommissionRate(user?.role || "");
        const commissionEarned = paidAmount * commissionRate;

        aggregatedData.push({
          userId,
          user,
          salesCount: userSales.length,
          totalAmount,
          paidAmount,
          commissionEarned,
          sales: userSales.sort((a, b) => {
            const dateA = toJsDate(a.createdAt);
            const dateB = toJsDate(b.createdAt);
            if (!dateA || !dateB) return 0;
            return dateB.getTime() - dateA.getTime();
          }),
        });
      });

      // Sort by total sales amount (descending)
      aggregatedData.sort((a, b) => b.totalAmount - a.totalAmount);

      setSalesData(aggregatedData);
    } catch (err) {
      console.error("Error fetching sales data:", err);
      setError("Error al cargar los datos de ventas");
    } finally {
      setLoading(false);
    }
  };

  const getCommissionRate = (role: string): number => {
    // Commission rates based on staff role
    switch (role) {
      case "doctor":
        return 0.15; // 15% commission for doctors
      case "ventas":
        return 0.1; // 10% commission for sales staff
      case "recepcion":
        return 0.05; // 5% commission for reception
      default:
        return 0.02; // 2% default commission
    }
  };

  const getProductTypeLabel = (product: string): string => {
    const productLabels: Record<string, string> = {
      treatment_plan: "Plan de Tratamiento",
      consultation: "Consulta",
      cleaning: "Limpieza Dental",
      whitening: "Blanqueamiento",
      orthodontics: "Ortodoncia",
      implant: "Implante Dental",
      crown: "Corona",
      filling: "Empaste",
      extraction: "Extracción",
      root_canal: "Endodoncia",
      dentures: "Prótesis",
      oral_surgery: "Cirugía Oral",
      periodontics: "Periodoncia",
      pediatric: "Odontopediatría",
      cosmetic: "Odontología Estética",
      emergency: "Emergencia Dental",
      products: "Productos Dentales",
      membership: "Membresía/Plan",
      other: "Otros Servicios",
    };
    return productLabels[product] || product;
  };

  const filteredData = salesData.filter((data) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const userName =
      data.user?.displayName || data.user?.email || "Usuario Desconocido";

    return (
      userName.toLowerCase().includes(searchLower) ||
      data.userId.toLowerCase().includes(searchLower)
    );
  });

  // Calculate totals
  const totals = salesData.reduce(
    (acc, data) => ({
      sales: acc.sales + data.salesCount,
      totalAmount: acc.totalAmount + data.totalAmount,
      paidAmount: acc.paidAmount + data.paidAmount,
      totalCommissions: acc.totalCommissions + data.commissionEarned,
    }),
    { sales: 0, totalAmount: 0, paidAmount: 0, totalCommissions: 0 }
  );

  const formatDate = (date: any): string => {
    const jsDate = toJsDate(date);
    if (!jsDate) return "N/A";

    return jsDate.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={["ventas:read"]}>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              Gestión de Ventas y Comisiones
            </h1>
            <p className="text-gray-600">
              Seguimiento de ventas de servicios dentales y comisiones del
              personal
            </p>
          </div>

          <div className="flex gap-2">
            {hasPermission("ventas:write") && (
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Venta
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setViewMode("staff")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "staff"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Por Personal
            </button>
            <button
              onClick={() => setViewMode("products")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "products"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              Por Servicios
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Personal de Ventas</p>
                  <p className="text-2xl font-bold">{salesData.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Ventas</p>
                  <p className="text-2xl font-bold">{totals.sales}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Facturación Total</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${totals.totalAmount.toLocaleString()}
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
                    ${totals.paidAmount.toLocaleString()}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Comisiones</p>
                  <p className="text-2xl font-bold text-amber-600">
                    ${totals.totalCommissions.toLocaleString()}
                  </p>
                </div>
                <Award className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Buscar por nombre o usuario..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Sales Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              {viewMode === "staff"
                ? "Ventas por Personal"
                : "Ventas por Servicios"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Personal</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Ventas</TableHead>
                    <TableHead>Monto Total</TableHead>
                    <TableHead>Cobrado</TableHead>
                    <TableHead>% Cobrado</TableHead>
                    <TableHead>Comisión Ganada</TableHead>
                    <TableHead>Última Venta</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((data) => {
                    const collectionRate =
                      data.totalAmount > 0
                        ? (data.paidAmount / data.totalAmount) * 100
                        : 0;

                    const lastSale = data.sales[0]; // Already sorted by date desc
                    const commissionRate = getCommissionRate(
                      data.user?.role || ""
                    );

                    return (
                      <TableRow key={data.userId}>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-sm font-medium text-blue-600">
                                {data.user?.displayName
                                  ?.charAt(0)
                                  ?.toUpperCase() ||
                                  data.user?.email?.charAt(0)?.toUpperCase() ||
                                  "?"}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">
                                {data.user?.displayName ||
                                  "Usuario Desconocido"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {data.user?.email || data.userId}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center">
                            {data.user?.role === "doctor" && (
                              <Stethoscope className="h-4 w-4 text-purple-500 mr-1" />
                            )}
                            {data.user?.role === "ventas" && (
                              <Users className="h-4 w-4 text-green-500 mr-1" />
                            )}
                            <Badge variant="outline" className="capitalize">
                              {data.user?.role || "Sin rol"}
                            </Badge>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center">
                            <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="font-medium">
                              {data.salesCount}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="font-medium text-green-600">
                            ${data.totalAmount.toLocaleString()}
                          </span>
                        </TableCell>

                        <TableCell>
                          <span className="font-medium">
                            ${data.paidAmount.toLocaleString()}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{
                                  width: `${Math.min(collectionRate, 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium">
                              {collectionRate.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div>
                            <span className="font-medium text-amber-600">
                              ${data.commissionEarned.toLocaleString()}
                            </span>
                            <div className="text-xs text-gray-500">
                              ({(commissionRate * 100).toFixed(0)}% tasa)
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-1" />
                            {lastSale ? formatDate(lastSale.createdAt) : "N/A"}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Button size="sm" variant="outline" asChild>
                            <a href={`/admin/ventas/${data.userId}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              Ver Detalles
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {filteredData.length === 0 && (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay ventas registradas
                </h3>
                <p className="text-gray-500">
                  {searchTerm
                    ? "No se encontraron ventas con los filtros aplicados."
                    : "Aún no se han registrado ventas en el sistema."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          {hasPermission("ventas:write") && (
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="flex items-center p-4">
                <Plus className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <h3 className="font-medium">Registrar Venta</h3>
                  <p className="text-sm text-gray-600">
                    Nueva venta de servicio
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="flex items-center p-4">
              <Award className="h-8 w-8 text-amber-500 mr-3" />
              <div>
                <h3 className="font-medium">Reporte Comisiones</h3>
                <p className="text-sm text-gray-600">Cálculo de comisiones</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => (window.location.href = "/admin/patients")}
          >
            <CardContent className="flex items-center p-4">
              <Users className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <h3 className="font-medium">Ver Pacientes</h3>
                <p className="text-sm text-gray-600">Gestión de pacientes</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="flex items-center p-4">
              <TrendingUp className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <h3 className="font-medium">Análisis de Ventas</h3>
                <p className="text-sm text-gray-600">Reportes y métricas</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
