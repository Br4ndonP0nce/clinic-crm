import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
interface ErrorDisplayProps {
  error: string | null;
  onDismiss: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onDismiss,
}) => {
  if (!error) return null;

  return (
    <div className="bg-red-100 text-red-700 p-4 rounded-md flex items-center justify-between">
      <div className="flex items-center">
        <AlertCircle className="h-4 w-4 mr-2" />
        {error}
      </div>
      <Button variant="ghost" size="sm" onClick={onDismiss}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
