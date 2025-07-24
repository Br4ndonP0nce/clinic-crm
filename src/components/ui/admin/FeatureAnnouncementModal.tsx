// src/components/ui/admin/FeatureAnnouncementModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  FeatureAnnouncement,
  getUnviewedAnnouncements,
  markAnnouncementAsViewed,
} from "@/lib/features/announcements";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Calendar,
  Star,
  CheckCircle,
  Play,
  X,
  Stethoscope,
} from "lucide-react";

interface FeatureAnnouncementModalProps {
  userRole?: string;
  onClose?: () => void;
}

export default function FeatureAnnouncementModal({
  userRole,
  onClose,
}: FeatureAnnouncementModalProps) {
  const [announcements, setAnnouncements] = useState<FeatureAnnouncement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const unviewed = getUnviewedAnnouncements(userRole);
    setAnnouncements(unviewed);
    setIsOpen(unviewed.length > 0);
  }, [userRole]);

  const currentAnnouncement = announcements[currentIndex];
  const hasMultiple = announcements.length > 1;

  const handleNext = () => {
    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleClose = () => {
    // Mark current announcement as viewed
    if (currentAnnouncement) {
      markAnnouncementAsViewed(currentAnnouncement.id);
    }

    setIsOpen(false);
    onClose?.();
  };

  const handleCTAClick = () => {
    if (currentAnnouncement?.ctaUrl) {
      // Navigate to the feature
      window.location.href = currentAnnouncement.ctaUrl;
    }
    // Always mark as viewed and close
    handleClose();
  };

  const handleViewAll = () => {
    // Mark all announcements as viewed
    announcements.forEach((announcement) => {
      markAnnouncementAsViewed(announcement.id);
    });

    setIsOpen(false);
    onClose?.();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return "🔥";
      case "medium":
        return "⭐";
      case "low":
        return "💡";
      default:
        return "📢";
    }
  };

  if (!isOpen || !currentAnnouncement) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {currentAnnouncement.title}
                </DialogTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge
                    variant="outline"
                    className={getPriorityColor(currentAnnouncement.priority)}
                  >
                    {getPriorityIcon(currentAnnouncement.priority)}{" "}
                    {currentAnnouncement.priority.toUpperCase()}
                  </Badge>
                  <Badge variant="secondary">
                    v{currentAnnouncement.version}
                  </Badge>
                </div>
              </div>
            </div>

            {hasMultiple && (
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <span>{currentIndex + 1}</span>
                <span>/</span>
                <span>{announcements.length}</span>
              </div>
            )}
          </div>

          <DialogDescription className="text-base leading-relaxed">
            {currentAnnouncement.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Feature Image/Video */}
          {currentAnnouncement.imageUrl && (
            <Card>
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={currentAnnouncement.imageUrl}
                    alt={currentAnnouncement.title}
                    className="w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                  {currentAnnouncement.videoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        size="lg"
                        className="bg-black/50 hover:bg-black/70 text-white rounded-full"
                        onClick={() =>
                          window.open(currentAnnouncement.videoUrl, "_blank")
                        }
                      >
                        <Play className="h-6 w-6 mr-2" />
                        Ver Demo
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Features List */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center">
              <Star className="h-4 w-4 mr-2 text-blue-500" />
              Nuevas Funcionalidades
            </h4>
            <div className="space-y-2">
              {currentAnnouncement.features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Release Date */}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>
              Lanzado el{" "}
              {new Date(currentAnnouncement.date).toLocaleDateString("es-MX", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {hasMultiple && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentIndex === announcements.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          <div className="flex space-x-2 w-full sm:w-auto">
            {hasMultiple && (
              <Button
                variant="ghost"
                onClick={handleViewAll}
                className="flex-1 sm:flex-none"
              >
                <X className="h-4 w-4 mr-2" />
                Cerrar Todo
              </Button>
            )}

            <Button onClick={handleCTAClick} className="flex-1 sm:flex-none">
              {currentAnnouncement.ctaText || "Entendido"}
              {currentAnnouncement.ctaUrl && (
                <ExternalLink className="h-4 w-4 ml-2" />
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
