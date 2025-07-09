"use client";
// src/app/admin/billing/report/new/page.tsx

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { usePermissions } from "@/hooks/usePermissions";
import ReportForm from "@/components/billing/ReportForm";

export default function NewBillingReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");

  const { canManageBilling } = usePermissions();

  const handleSave = (reportId: string) => {
    router.push(`/admin/billing/report/${reportId}`);
  };

  const handleCancel = () => {
    router.push("/admin/billing/reports");
  };

  if (!canManageBilling) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Acceso Restringido
              </h3>
              <p className="text-gray-600">
                No tienes permisos para crear reportes de facturación.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6"
    >
      <ReportForm
        appointmentId={appointmentId || undefined}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </motion.div>
  );
}
