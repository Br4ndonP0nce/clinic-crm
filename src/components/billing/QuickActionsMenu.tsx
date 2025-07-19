import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Settings,
  ChevronDown,
  Plus,
  FileText,
  CreditCard,
  BarChart3,
  Download,
  CalendarIcon,
} from "lucide-react";
import { DateFilter, generateMonthOptions } from "./DateFilterSelect";
import { BillingReport, Expense } from "@/types/billing";

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

interface QuickActionsMenuProps {
  currentFilter: DateFilter;
  reports: BillingReport[];
  expenses: Expense[];
  dashboard: any;
  onExport: (
    type: "reports" | "expenses" | "dashboard",
    dateFilter: DateFilter
  ) => void;
  onNewExpense: () => void;
  onNewReport: () => void;
  canManage: boolean;
}

export const QuickActionsMenu: React.FC<QuickActionsMenuProps> = ({
  currentFilter,
  reports,
  expenses,
  dashboard,
  onExport,
  onNewExpense,
  onNewReport,
  canManage,
}) => {
  const monthOptions = generateMonthOptions();

  const quickActions: QuickAction[] = [
    {
      label: "Nuevo Reporte",
      icon: <Plus className="h-4 w-4" />,
      onClick: onNewReport,
      disabled: !canManage,
    },
    {
      label: "Nuevo Gasto",
      icon: <Plus className="h-4 w-4" />,
      onClick: onNewExpense,
      disabled: !canManage,
    },
    {
      label: "Exportar Reportes",
      icon: <FileText className="h-4 w-4" />,
      onClick: () => onExport("reports", currentFilter),
      disabled: reports.length === 0,
    },
    {
      label: "Exportar Gastos",
      icon: <CreditCard className="h-4 w-4" />,
      onClick: () => onExport("expenses", currentFilter),
      disabled: expenses.length === 0,
    },
    {
      label: "Exportar Dashboard",
      icon: <BarChart3 className="h-4 w-4" />,
      onClick: () => onExport("dashboard", currentFilter),
      disabled: !dashboard,
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Acciones Rápidas
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Gestión Rápida</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Quick Create Actions */}
        {canManage && (
          <>
            <DropdownMenuItem
              onClick={onNewReport}
              className="flex items-center gap-2 text-blue-600"
            >
              <Plus className="h-4 w-4" />
              Nuevo Reporte
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onNewExpense}
              className="flex items-center gap-2 text-green-600"
            >
              <Plus className="h-4 w-4" />
              Nuevo Gasto
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Export Options */}
        <DropdownMenuLabel>Exportar Datos del Período</DropdownMenuLabel>
        {quickActions.slice(2).map((action, index) => (
          <DropdownMenuItem
            key={index}
            onClick={action.onClick}
            disabled={action.disabled}
            className="flex items-center gap-2"
          >
            {action.icon}
            {action.label}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* Export All Data Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar Todo
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {monthOptions.slice(0, 6).map((option) => (
              <DropdownMenuItem
                key={option.key}
                onClick={() => onExport("dashboard", option)}
                className="text-sm"
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
