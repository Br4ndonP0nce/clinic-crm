import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";

interface ArrayInputProps {
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
  placeholder?: string;
  emptyMessage?: string;
  maxItems?: number;
}

export default function ArrayInput({
  items,
  onAdd,
  onRemove,
  placeholder = "Agregar elemento...",
  emptyMessage = "No hay elementos agregados",
  maxItems,
}: ArrayInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    if (inputValue.trim() && (!maxItems || items.length < maxItems)) {
      onAdd(inputValue.trim());
      setInputValue("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-3">
      {/* Input for adding new items */}
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1"
          disabled={maxItems ? items.length >= maxItems : false}
        />
        <Button
          type="button"
          onClick={handleAdd}
          disabled={
            !inputValue.trim() || (maxItems ? items.length >= maxItems : false)
          }
          size="sm"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Display current items */}
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1 px-3 py-1"
            >
              <span className="text-sm">{item}</span>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">{emptyMessage}</p>
      )}

      {/* Max items warning */}
      {maxItems && items.length >= maxItems && (
        <p className="text-sm text-amber-600">
          Máximo {maxItems} elementos permitidos
        </p>
      )}
    </div>
  );
}
