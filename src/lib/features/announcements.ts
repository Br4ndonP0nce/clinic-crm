// src/lib/features/announcements.ts
export interface FeatureAnnouncement {
  id: string;
  title: string;
  description: string;
  features: string[];
  version: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
  targetRoles?: string[]; // Optional: target specific roles
  imageUrl?: string; // Optional: feature screenshot
  videoUrl?: string; // Optional: demo video
  ctaText?: string; // Call to action text
  ctaUrl?: string; // Call to action URL
}

// Define your announcements here
export const FEATURE_ANNOUNCEMENTS: FeatureAnnouncement[] = [
 
  {
    id: 'certain-patient-data-optional',
    title: 'FIX: Cambio de datos de obligatorios a opcionales',
    description: 'Se cambiaron los datos de correo electronico, direccion a opcionales ademas de remover las tabs de preferencias y financieros para mejorar la experiencia en general',
    features: [
      'Correo electronico opcional',
        'Direccion opcional',
        'Tabs de preferencias y financieros removidas'

    ],
    version: '2.0.8',
    date: '2025-07-23',
    priority: 'low',
    ctaText: 'Entendido!',
    ctaUrl: ''
  },{
  id: 'doctor-schedule-administration',
  title: 'NUEVO: Sistema de Administración de Horarios',
  description: 'Los doctores ahora pueden configurar sus propios horarios de disponibilidad, incluyendo fines de semana. El sistema incluye detección de conflictos y integración completa con el calendario para una gestión más flexible de citas.',
  features: [
    'Configuración personalizada de horarios por doctor',
    'Disponibilidad en fines de semana configurable',
    'Detección automática de conflictos con citas existentes',
    'Integración completa con el calendario inteligente',
    'Validación de horarios dentro de las horas de clínica (8AM-7PM)',
    'Widget de resumen de horario en el dashboard',
    'Permisos basados en roles (doctores editan su horario, admins todos)'
  ],
  version: '2.1.0',
  date: '2025-07-24',
  priority: 'high',
  ctaText: '¡Configurar mi horario!',
  ctaUrl: '/admin/schedule-settings'
  },
  {
 id: 'enhanced-patient-management-system',
 title: 'NUEVO: Sistema Mejorado de Gestión de Pacientes',
 description: 'Grandes mejoras al sistema de pacientes incluyendo edición completa del historial médico, creación de tratamientos desde el perfil del paciente, y nuevas secciones para hallazgos clínicos. También se corrigieron problemas de validación para mejorar la experiencia de usuario.',
 features: [
   'Edición completa de condiciones médicas del paciente',
   'Edición completa de cirugías previas del paciente',
   'Creación de tratamientos directamente desde el perfil del paciente',
   'Nueva sección "Accidentes/Hallazgos Clínicos" editable',
   'Corrección de validación: teléfono alternativo ahora es opcional',
   'Interfaz mejorada con mejor feedback visual',
   'Compatibilidad retroactiva con datos existentes'
 ],
 version: '2.1.1',
 date: '2025-07-24',
 priority: 'medium',
 ctaText: 'Entendido',
 ctaUrl: ''
}
];

// Storage key for tracking viewed announcements
const VIEWED_ANNOUNCEMENTS_KEY = 'ep_viewed_announcements';

export const getViewedAnnouncements = (): string[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(VIEWED_ANNOUNCEMENTS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const markAnnouncementAsViewed = (announcementId: string): void => {
  if (typeof window === 'undefined') return;
  
  const viewed = getViewedAnnouncements();
  if (!viewed.includes(announcementId)) {
    viewed.push(announcementId);
    localStorage.setItem(VIEWED_ANNOUNCEMENTS_KEY, JSON.stringify(viewed));
  }
};

export const getUnviewedAnnouncements = (userRole?: string): FeatureAnnouncement[] => {
  const viewed = getViewedAnnouncements();
  
  return FEATURE_ANNOUNCEMENTS.filter(announcement => {
    // Check if not viewed
    const notViewed = !viewed.includes(announcement.id);
    
    // Check role targeting
    const roleMatches = !announcement.targetRoles || 
      !userRole || 
      announcement.targetRoles.includes(userRole);
    
    return notViewed && roleMatches;
  }).sort((a, b) => {
    // Sort by priority and date
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
};

export const resetViewedAnnouncements = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(VIEWED_ANNOUNCEMENTS_KEY);
};