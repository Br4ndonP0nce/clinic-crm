// components/billing/core/BillingCard.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface BillingCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  subtitle?: string;
  variant?: "default" | "revenue" | "expense" | "net";
  className?: string;
  children?: React.ReactNode;
}

export const BillingCard: React.FC<BillingCardProps> = ({
  title,
  value,
  icon: Icon,
  subtitle,
  variant = "default",
  className = "",
  children,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "revenue":
        return "text-green-600 bg-green-50 border-green-200";
      case "expense":
        return "text-red-600 bg-red-50 border-red-200";
      case "net":
        return "text-purple-600 bg-purple-50 border-purple-200";
      default:
        return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

  return (
    <Card
      className={`${className} ${
        variant !== "default" ? getVariantStyles() : ""
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          {Icon && <Icon className="h-8 w-8 opacity-60" />}
        </div>
        {children}
      </CardContent>
    </Card>
  );
};

// components/billing/core/StatusBadge.tsx
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  type?: "billing" | "expense";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = "billing",
}) => {
  const getVariant = () => {
    if (type === "expense") {
      const variants: Record<string, string> = {
        pending: "secondary",
        approved: "default",
        paid: "default",
        rejected: "destructive",
      };
      return variants[status] || "outline";
    }

    // Billing status variants
    const variants: Record<string, string> = {
      paid: "default",
      completed: "secondary",
      partially_paid: "outline",
      overdue: "destructive",
      draft: "secondary",
      cancelled: "destructive",
    };
    return variants[status] || "outline";
  };

  const getLabel = () => {
    if (type === "expense") {
      const labels: Record<string, string> = {
        pending: "Pendiente",
        approved: "Aprobado",
        paid: "Pagado",
        rejected: "Rechazado",
      };
      return labels[status] || status;
    }

    // Billing status labels
    const labels: Record<string, string> = {
      draft: "Borrador",
      completed: "Completado",
      paid: "Pagado",
      partially_paid: "Pago Parcial",
      overdue: "Vencido",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  };

  return <Badge variant={getVariant() as any}>{getLabel()}</Badge>;
};
