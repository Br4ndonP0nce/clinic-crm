// components/billing/core/ActionButtons.tsx
import { Button } from "@/components/ui/button";
import { Eye, Edit, Receipt, Trash2, CheckCircle } from "lucide-react";

interface ActionButtonsProps {
  onView?: () => void;
  onEdit?: () => void;
  onPDF?: () => void;
  onDelete?: () => void;
  onApprove?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canApprove?: boolean;
  showPDF?: boolean;
  size?: "sm" | "default" | "lg" | "icon";
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onView,
  onEdit,
  onPDF,
  onDelete,
  onApprove,
  canEdit = false,
  canDelete = false,
  canApprove = false,
  showPDF = false,
  size = "sm",
}) => {
  return (
    <div className="flex items-center gap-1">
      {onView && (
        <Button variant="outline" size={size} onClick={onView} title="Ver">
          <Eye className="h-4 w-4" />
        </Button>
      )}

      {onEdit && canEdit && (
        <Button variant="outline" size={size} onClick={onEdit} title="Editar">
          <Edit className="h-4 w-4" />
        </Button>
      )}

      {onPDF && showPDF && (
        <Button variant="outline" size={size} onClick={onPDF} title="PDF">
          <Receipt className="h-4 w-4" />
        </Button>
      )}

      {onApprove && canApprove && (
        <Button
          variant="outline"
          size={size}
          onClick={onApprove}
          className="text-green-600 hover:text-green-700"
          title="Aprobar"
        >
          <CheckCircle className="h-4 w-4" />
        </Button>
      )}

      {onDelete && canDelete && (
        <Button
          variant="outline"
          size={size}
          onClick={onDelete}
          className="text-red-600 hover:text-red-700"
          title="Eliminar"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
