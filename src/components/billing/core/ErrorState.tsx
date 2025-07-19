// components/billing/core/ErrorState.tsx
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
interface ErrorStateProps {
  message: string;
  retry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, retry }) => {
  return (
    <Card>
      <CardContent className="p-6 text-center text-red-600">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p>{message}</p>
        {retry && (
          <Button onClick={retry} variant="outline" className="mt-4">
            Reintentar
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
