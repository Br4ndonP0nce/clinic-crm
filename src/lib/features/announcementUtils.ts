// src/lib/features/announcementUtils.ts
import { FeatureAnnouncement } from './announcements';
export const createAnnouncement = (data: {
  title: string;
  description: string;
  features: string[];
  version: string;
  priority?: 'low' | 'medium' | 'high';
  targetRoles?: string[];
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
}): FeatureAnnouncement => {
  return {
    id: `announcement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    date: new Date().toISOString().split('T')[0],
    priority: data.priority || 'medium',
    ...data
  };
};

// Quick announcement templates
export const ANNOUNCEMENT_TEMPLATES = {
  NEW_FEATURE: {
    title: '✨ Nueva Funcionalidad',
    priority: 'high' as const,
    ctaText: 'Explorar'
  },
  IMPROVEMENT: {
    title: '🚀 Mejora Implementada',
    priority: 'medium' as const,
    ctaText: 'Ver Cambios'
  },
  BUG_FIX: {
    title: '🐛 Corrección de Errores',
    priority: 'low' as const,
    ctaText: 'Entendido'
  },
  MAINTENANCE: {
    title: '🔧 Mantenimiento Programado',
    priority: 'medium' as const,
    ctaText: 'Ver Detalles'
  },
  SECURITY_UPDATE: {
    title: '🔒 Actualización de Seguridad',
    priority: 'high' as const,
    ctaText: 'Leer Más'
  }
};

// Utility to add new announcement to the list
export const addNewAnnouncement = (announcement: FeatureAnnouncement) => {
  // In a real app, you'd want to store this in a database
  // For now, we'll just add it to the existing array
  const { FEATURE_ANNOUNCEMENTS } = require('./announcements');
  FEATURE_ANNOUNCEMENTS.unshift(announcement);
  
  // Clear localStorage to ensure new announcement shows
  if (typeof window !== 'undefined') {
    const VIEWED_ANNOUNCEMENTS_KEY = 'ep_viewed_announcements';
    const viewed = JSON.parse(localStorage.getItem(VIEWED_ANNOUNCEMENTS_KEY) || '[]');
    // Don't include the new announcement ID in viewed list
    const filteredViewed = viewed.filter((id: string) => id !== announcement.id);
    localStorage.setItem(VIEWED_ANNOUNCEMENTS_KEY, JSON.stringify(filteredViewed));
  }
};

// Admin utility to create and immediately show announcement
export const createAndShowAnnouncement = (data: {
  title: string;
  description: string;
  features: string[];
  version: string;
  priority?: 'low' | 'medium' | 'high';
  targetRoles?: string[];
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
}) => {
  const announcement = createAnnouncement(data);
  addNewAnnouncement(announcement);
  return announcement;
};