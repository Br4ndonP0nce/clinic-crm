// src/hooks/useFeatureAnnouncements.ts
import { useState, useEffect } from 'react';
import { 
  FeatureAnnouncement, 
  getUnviewedAnnouncements, 
  markAnnouncementAsViewed,
  resetViewedAnnouncements
} from '@/lib/features/announcements';

export const useFeatureAnnouncements = (userRole?: string) => {
  const [unviewedAnnouncements, setUnviewedAnnouncements] = useState<FeatureAnnouncement[]>([]);
  const [hasUnviewed, setHasUnviewed] = useState(false);

  const refreshAnnouncements = () => {
    const announcements = getUnviewedAnnouncements(userRole);
    setUnviewedAnnouncements(announcements);
    setHasUnviewed(announcements.length > 0);
  };

  useEffect(() => {
    refreshAnnouncements();
  }, [userRole]);

  const markAsViewed = (announcementId: string) => {
    markAnnouncementAsViewed(announcementId);
    refreshAnnouncements();
  };

  const markAllAsViewed = () => {
    unviewedAnnouncements.forEach(announcement => {
      markAnnouncementAsViewed(announcement.id);
    });
    refreshAnnouncements();
  };

  const resetAll = () => {
    resetViewedAnnouncements();
    refreshAnnouncements();
  };

  return {
    unviewedAnnouncements,
    hasUnviewed,
    markAsViewed,
    markAllAsViewed,
    resetAll,
    refreshAnnouncements,
    count: unviewedAnnouncements.length
  };
};