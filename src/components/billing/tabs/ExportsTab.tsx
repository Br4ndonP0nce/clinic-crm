// components/billing/tabs/ExportsTab.tsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  FileText,
  CreditCard,
  BarChart3,
  CalendarIcon,
} from "lucide-react";
import { BillingReport, Expense } from "@/types/billing";
import { DateFilter, generateMonthOptions } from "../DateFilterSelect";

interface ExportsTabProps {
  reports: BillingReport[];
  expenses: Expense[];
  dashboard: any;
  currentFilter: DateFilter;
  onExport: (
    type: "reports" | "expenses" | "dashboard",
    dateFilter: DateFilter
  ) => void;
}

export const ExportsTab: React.FC<ExportsTabProps> = ({
  reports,
  expenses,
  dashboard,
  currentFilter,
  onExport,
}) => {
  const monthOptions = generateMonthOptions();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Exportar Datos</h3>

      {/* Current Period Exports */}
      <div className="mb-6">
        <h4 className="text-md font-medium mb-4">
          Exportar para {currentFilter.label}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Reportes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Exporta {reports.length} reportes de facturación.
              </p>
              <Button
                onClick={() => onExport("reports", currentFilter)}
                disabled={reports.length === 0}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Reportes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Gastos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Exporta {expenses.length} gastos con categorías.
              </p>
              <Button
                onClick={() => onExport("expenses", currentFilter)}
                disabled={expenses.length === 0}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Gastos
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Dashboard Completo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Exporta dashboard financiero completo.
              </p>
              <Button
                onClick={() => onExport("dashboard", currentFilter)}
                disabled={!dashboard}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Export for Other Periods */}
      <div>
        <h4 className="text-md font-medium mb-4">
          Exportación Rápida - Otros Períodos
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {monthOptions.slice(0, 8).map((option) => (
            <Button
              key={option.key}
              variant="outline"
              size="sm"
              onClick={() => onExport("dashboard", option)}
              className="text-left justify-start"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Export Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-800 mb-2">
            Información sobre Exportaciones
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Los archivos se descargan en formato Excel (.xlsx)</li>
            <li>
              • Los reportes incluyen información detallada de pacientes y
              servicios
            </li>
            <li>• Los gastos incluyen categorías y estado de aprobación</li>
            <li>
              • El dashboard completo incluye análisis financiero integrado
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
