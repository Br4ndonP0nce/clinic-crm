// src/components/ui/admin/DashboardLayout.tsx - Updated for Dental Practice
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Users,
  Calendar,
  FileText,
  DollarSign,
  Settings,
  Shield,
  TrendingUp,
  Menu,
  X,
  LogOut,
  User,
  Stethoscope,
  ClipboardList,
  CreditCard,
} from "lucide-react";

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: string;
  description?: string;
}

// Updated navigation structure for dental practice
const DENTAL_NAVIGATION: NavigationItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: BarChart3,
    permission: "dashboard:read",
    description: "Vista general de la práctica",
  },
  {
    href: "/admin/patients",
    label: "Pacientes", // Changed from "Leads"
    icon: Users,
    permission: "patients:read",
    description: "Gestión de pacientes",
  },
  {
    href: "/admin/calendar",
    label: "Calendario", // New
    icon: Calendar,
    permission: "calendar:read",
    description: "Programación de citas",
  },
  {
    href: "/admin/treatments",
    label: "Tratamientos", // New
    icon: Stethoscope,
    permission: "treatments:read",
    description: "Historial clínico",
  },
  {
    href: "/admin/billing",
    label: "Facturación", // Changed from "Activos"
    icon: CreditCard,
    permission: "billing:read",
    description: "Facturación y pagos",
  },
  {
    href: "/admin/ventas",
    label: "Ventas", // Keep for commissions
    icon: TrendingUp,
    permission: "ventas:read",
    description: "Ventas y comisiones",
  },
  {
    href: "/admin/settings",
    label: "Configuración",
    icon: Settings,
    permission: "settings:read",
    description: "Configuración del sistema",
  },
  {
    href: "/admin/staff",
    label: "Personal", // Changed from "Users"
    icon: Shield,
    permission: "staff:read",
    description: "Gestión de personal",
  },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { userProfile, hasPermission } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Filter navigation items based on user permissions
  const accessibleNavItems = DENTAL_NAVIGATION.filter((item) =>
    hasPermission(item.permission as any)
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-red-100 text-red-800";
      case "doctor":
        return "bg-blue-100 text-blue-800";
      case "recepcion":
        return "bg-green-100 text-green-800";
      case "ventas":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "super_admin":
        return "Super Admin";
      case "doctor":
        return "Doctor";
      case "recepcion":
        return "Recepción";
      case "ventas":
        return "Ventas";
      default:
        return role;
    }
  };

  const isActiveRoute = (href: string): boolean => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Dental Practice
                </h1>
                <p className="text-xs text-gray-500">Sistema de Gestión</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Profile Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {userProfile?.displayName?.charAt(0)?.toUpperCase() ||
                    userProfile?.email?.charAt(0)?.toUpperCase() ||
                    "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userProfile?.displayName || userProfile?.email || "Usuario"}
                </p>
                {userProfile?.role && (
                  <Badge
                    className={`text-xs ${getRoleBadgeColor(userProfile.role)}`}
                  >
                    {getRoleDisplayName(userProfile.role)}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {accessibleNavItems.map((item) => {
              const isActive = isActiveRoute(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                    ${
                      isActive
                        ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={`
                    mr-3 h-5 w-5 
                    ${isActive ? "text-blue-700" : "text-gray-400"}
                  `}
                  />
                  <div className="flex-1">
                    <div>{item.label}</div>
                    {item.description && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {item.description}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left font-normal"
                >
                  <User className="mr-2 h-4 w-4" />
                  Mi Cuenta
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top Bar (Mobile) */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <Stethoscope className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-gray-900">Dental Practice</span>
          </div>
          <div className="w-8" /> {/* Spacer for balance */}
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
