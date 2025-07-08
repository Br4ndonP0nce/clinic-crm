// src/components/patient/EditableCard.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Save, X, Loader2 } from "lucide-react";

interface EditableCardProps {
  title: string;
  icon?: React.ReactNode;
  isEditing: boolean;
  isSaving?: boolean;
  canEdit: boolean;
  hasUnsavedChanges?: boolean;
  validationErrors?: Record<string, string>;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  viewContent: React.ReactNode;
  editContent: React.ReactNode;
  className?: string;
}

export const EditableCard: React.FC<EditableCardProps> = ({
  title,
  icon,
  isEditing,
  isSaving = false,
  canEdit,
  hasUnsavedChanges = false,
  validationErrors = {},
  onEdit,
  onSave,
  onCancel,
  viewContent,
  editContent,
  className = "",
}) => {
  const hasErrors = Object.keys(validationErrors).length > 0;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center">
          {icon && <span className="mr-2">{icon}</span>}
          {title}
        </CardTitle>

        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              {/* Cancel Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>

              {/* Save Button */}
              <Button
                size="sm"
                onClick={onSave}
                disabled={isSaving || hasErrors}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Save
              </Button>
            </>
          ) : (
            canEdit && (
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit2 className="h-4 w-4" />
              </Button>
            )
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Validation Errors */}
        {hasErrors && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm font-medium text-red-800 mb-1">
              Please fix the following errors:
            </p>
            <ul className="text-sm text-red-700 list-disc list-inside">
              {Object.entries(validationErrors).map(([field, error]) => (
                <li key={field}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Unsaved Changes Warning */}
        {isEditing && hasUnsavedChanges && !hasErrors && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-800">You have unsaved changes</p>
          </div>
        )}

        {/* Content */}
        {isEditing ? editContent : viewContent}
      </CardContent>
    </Card>
  );
};
