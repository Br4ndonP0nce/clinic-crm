"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Bell } from "lucide-react";
import { useFeatureAnnouncements } from "@/hooks/useFeatureAnnouncements";
interface FeatureAnnouncementBadgeProps {
  userRole?: string;
  onClick: () => void;
  className?: string;
}

export function FeatureAnnouncementBadge({
  userRole,
  onClick,
  className = "",
}: FeatureAnnouncementBadgeProps) {
  const { hasUnviewed, count } = useFeatureAnnouncements(userRole);

  if (!hasUnviewed) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onClick}
        className={`flex items-center space-x-2 ${className}`}
      >
        <Sparkles className="h-4 w-4" />
        <span>Novedades</span>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={`flex items-center space-x-2 relative ${className}`}
    >
      <div className="relative">
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 text-white">
            {count > 9 ? "9+" : count}
          </Badge>
        )}
      </div>
      <span>Novedades</span>
    </Button>
  );
}
