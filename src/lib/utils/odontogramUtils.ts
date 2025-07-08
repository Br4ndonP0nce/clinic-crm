// src/lib/utils/odontogramUtils.ts
import { OdontogramData, ToothData, ToothCondition } from '@/components/dental/odonthogram';

// Standard dental numbering systems
export const ADULT_TEETH_NUMBERS = Array.from({ length: 32 }, (_, i) => i + 1);

// Quadrant mapping for dental numbering
export const QUADRANTS = {
  upperRight: [1, 2, 3, 4, 5, 6, 7, 8],
  upperLeft: [9, 10, 11, 12, 13, 14, 15, 16],
  lowerLeft: [17, 18, 19, 20, 21, 22, 23, 24],
  lowerRight: [25, 26, 27, 28, 29, 30, 31, 32]
};

// Tooth type classification
export const TOOTH_TYPES = {
  incisors: [7, 8, 9, 10, 23, 24, 25, 26],
  canines: [6, 11, 22, 27],
  premolars: [4, 5, 12, 13, 20, 21, 28, 29],
  molars: [1, 2, 3, 14, 15, 16, 17, 18, 19, 30, 31, 32]
};

// Condition severity mapping
export const CONDITION_SEVERITY: Record<ToothCondition, number> = {
  healthy: 0,
  sealant: 1,
  veneer: 1,
  filling: 2,
  crack: 3,
  crown: 3,
  caries: 4,
  fracture: 5,
  root_canal: 5,
  bridge: 5,
  abscess: 6,
  impacted: 6,
  extraction: 7,
  missing: 7,
  implant: 8
};

// Treatment urgency levels
export const URGENCY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
} as const;

export type UrgencyLevel = typeof URGENCY_LEVELS[keyof typeof URGENCY_LEVELS];

/**
 * Calculate overall oral health score based on odontogram data
 */
export function calculateOralHealthScore(data: OdontogramData): {
  score: number; // 0-100 scale
  category: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
} {
  const teeth = Object.values(data.teeth);
  
  if (teeth.length === 0) {
    return {
      score: 0,
      category: 'poor',
      recommendations: ['Realizar examen dental inicial']
    };
  }

  // Calculate weighted score based on condition severity
  let totalSeverity = 0;
  let maxPossibleSeverity = teeth.length * 7; // Maximum severity

  teeth.forEach(tooth => {
    totalSeverity += CONDITION_SEVERITY[tooth.condition];
  });

  // Invert score so higher is better
  const score = Math.max(0, Math.round(((maxPossibleSeverity - totalSeverity) / maxPossibleSeverity) * 100));

  // Determine category
  let category: 'excellent' | 'good' | 'fair' | 'poor';
  if (score >= 90) category = 'excellent';
  else if (score >= 75) category = 'good';
  else if (score >= 50) category = 'fair';
  else category = 'poor';

  // Generate recommendations
  const recommendations = generateRecommendations(data);

  return { score, category, recommendations };
}

/**
 * Generate treatment recommendations based on odontogram data
 */
export function generateRecommendations(data: OdontogramData): string[] {
  const teeth = Object.values(data.teeth);
  const recommendations: string[] = [];

  // Count conditions
  const conditionCounts = teeth.reduce((acc, tooth) => {
    acc[tooth.condition] = (acc[tooth.condition] || 0) + 1;
    return acc;
  }, {} as Record<ToothCondition, number>);

  // Urgent conditions
  if (conditionCounts.abscess > 0) {
    recommendations.push(`Tratamiento urgente para ${conditionCounts.abscess} absceso(s)`);
  }
  if (conditionCounts.fracture > 0) {
    recommendations.push(`Reparación inmediata de ${conditionCounts.fracture} fractura(s)`);
  }

  // Active treatment needs
  if (conditionCounts.caries > 0) {
    recommendations.push(`Tratamiento de ${conditionCounts.caries} caries`);
  }
  if (conditionCounts.crack > 0) {
    recommendations.push(`Evaluación de ${conditionCounts.crack} fisura(s)`);
  }
  if (conditionCounts.impacted > 0) {
    recommendations.push(`Evaluación ortodóntica para ${conditionCounts.impacted} diente(s) impactado(s)`);
  }

  // Maintenance recommendations
  if (conditionCounts.root_canal > 0) {
    recommendations.push('Seguimiento de endodoncias realizadas');
  }
  if (conditionCounts.crown > 0 || conditionCounts.bridge > 0) {
    recommendations.push('Revisión de restauraciones protésicas');
  }

  // Replacement needs
  if (conditionCounts.missing > 0 || conditionCounts.extraction > 0) {
    const missing = (conditionCounts.missing || 0) + (conditionCounts.extraction || 0);
    recommendations.push(`Considerar reemplazo de ${missing} pieza(s) dental(es)`);
  }

  // Preventive care
  const healthyTeeth = conditionCounts.healthy || 0;
  const totalTeeth = teeth.length;
  
  if (healthyTeeth / totalTeeth > 0.8) {
    recommendations.push('Mantener rutina de higiene preventiva');
    recommendations.push('Limpieza dental cada 6 meses');
  } else {
    recommendations.push('Mejorar rutina de higiene oral');
    recommendations.push('Limpieza dental cada 3-4 meses');
  }

  return recommendations;
}

/**
 * Assess treatment urgency for a patient
 */
export function assessTreatmentUrgency(data: OdontogramData): {
  level: UrgencyLevel;
  urgentTeeth: number[];
  reason: string;
} {
  const teeth = Object.values(data.teeth);
  const urgentConditions: ToothCondition[] = ['abscess', 'fracture'];
  const highPriorityConditions: ToothCondition[] = ['caries', 'crack'];

  const urgentTeeth = teeth
    .filter(tooth => urgentConditions.includes(tooth.condition))
    .map(tooth => tooth.number);

  const highPriorityTeeth = teeth
    .filter(tooth => highPriorityConditions.includes(tooth.condition))
    .map(tooth => tooth.number);

  if (urgentTeeth.length > 0) {
    return {
      level: URGENCY_LEVELS.URGENT,
      urgentTeeth,
      reason: 'Condiciones que requieren atención inmediata'
    };
  }

  if (highPriorityTeeth.length > 3) {
    return {
      level: URGENCY_LEVELS.HIGH,
      urgentTeeth: highPriorityTeeth,
      reason: 'Múltiples dientes requieren tratamiento'
    };
  }

  if (highPriorityTeeth.length > 0) {
    return {
      level: URGENCY_LEVELS.MEDIUM,
      urgentTeeth: highPriorityTeeth,
      reason: 'Tratamiento necesario en el corto plazo'
    };
  }

  return {
    level: URGENCY_LEVELS.LOW,
    urgentTeeth: [],
    reason: 'Mantenimiento preventivo regular'
  };
}

/**
 * Generate treatment plan summary
 */
export function generateTreatmentPlan(data: OdontogramData): {
  phases: TreatmentPhase[];
  estimatedSessions: number;
  estimatedDuration: string;
} {
  const teeth = Object.values(data.teeth);
  const phases: TreatmentPhase[] = [];

  // Phase 1: Emergency/Urgent
  const urgentTeeth = teeth.filter(tooth => 
    ['abscess', 'fracture'].includes(tooth.condition)
  );
  if (urgentTeeth.length > 0) {
    phases.push({
      phase: 1,
      title: 'Tratamiento de Emergencia',
      teeth: urgentTeeth.map(t => t.number),
      procedures: urgentTeeth.map(t => `Tratamiento de ${t.condition} - Diente ${t.number}`),
      priority: 'urgent',
      estimatedSessions: urgentTeeth.length
    });
  }

  // Phase 2: Active Treatment
  const activeTeeth = teeth.filter(tooth => 
    ['caries', 'crack', 'root_canal'].includes(tooth.condition)
  );
  if (activeTeeth.length > 0) {
    phases.push({
      phase: phases.length + 1,
      title: 'Tratamiento Activo',
      teeth: activeTeeth.map(t => t.number),
      procedures: activeTeeth.map(t => getTreatmentProcedure(t.condition)),
      priority: 'high',
      estimatedSessions: Math.ceil(activeTeeth.length / 2)
    });
  }

  // Phase 3: Restorative
  const restorativeTeeth = teeth.filter(tooth => 
    ['missing', 'extraction'].includes(tooth.condition)
  );
  if (restorativeTeeth.length > 0) {
    phases.push({
      phase: phases.length + 1,
      title: 'Tratamiento Restaurativo',
      teeth: restorativeTeeth.map(t => t.number),
      procedures: ['Evaluación para implantes/prótesis', 'Restauración de piezas faltantes'],
      priority: 'medium',
      estimatedSessions: Math.ceil(restorativeTeeth.length * 1.5)
    });
  }

  // Phase 4: Maintenance
  phases.push({
    phase: phases.length + 1,
    title: 'Mantenimiento Preventivo',
    teeth: [],
    procedures: ['Limpieza dental', 'Aplicación de flúor', 'Revisión general'],
    priority: 'low',
    estimatedSessions: 1
  });

  const totalSessions = phases.reduce((sum, phase) => sum + phase.estimatedSessions, 0);
  const estimatedWeeks = Math.ceil(totalSessions * 1.5); // Assuming bi-weekly appointments
  
  return {
    phases,
    estimatedSessions: totalSessions,
    estimatedDuration: `${estimatedWeeks} semanas aproximadamente`
  };
}

interface TreatmentPhase {
  phase: number;
  title: string;
  teeth: number[];
  procedures: string[];
  priority: 'urgent' | 'high' | 'medium' | 'low';
  estimatedSessions: number;
}

function getTreatmentProcedure(condition: ToothCondition): string {
  const procedures: Record<ToothCondition, string> = {
    caries: 'Restauración/Empaste',
    crack: 'Evaluación y posible corona',
    root_canal: 'Endodoncia',
    crown: 'Revisión de corona',
    filling: 'Revisión de empaste',
    abscess: 'Tratamiento de absceso',
    fracture: 'Reparación de fractura',
    missing: 'Evaluación para reemplazo',
    extraction: 'Evaluación post-extracción',
    impacted: 'Evaluación ortodóntica',
    bridge: 'Revisión de puente',
    veneer: 'Revisión de carilla',
    sealant: 'Mantenimiento de sellador',
    implant: 'Seguimiento de implante',
    healthy: 'Mantenimiento preventivo'
  };
  
  return procedures[condition] || 'Evaluación general';
}

/**
 * Export odontogram data to various formats
 */
export function exportOdontogramData(data: OdontogramData, format: 'json' | 'csv' | 'summary'): string {
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);
      
    case 'csv':
      const teeth = Object.values(data.teeth);
      const headers = ['Diente', 'Condición', 'Superficies', 'Notas', 'Fecha', 'Registrado Por'];
      const rows = teeth.map(tooth => [
        tooth.number.toString(),
        tooth.condition,
        tooth.surfaces?.join(';') || '',
        tooth.notes || '',
        tooth.dateRecorded ? new Date(tooth.dateRecorded).toLocaleDateString('es-MX') : '',
        tooth.recordedBy || ''
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
      
    case 'summary':
      const healthScore = calculateOralHealthScore(data);
      const urgency = assessTreatmentUrgency(data);
      const plan = generateTreatmentPlan(data);
      
      return `RESUMEN DEL ODONTOGRAMA
==============================

Puntuación de Salud Oral: ${healthScore.score}/100 (${healthScore.category.toUpperCase()})
Nivel de Urgencia: ${urgency.level.toUpperCase()}

RECOMENDACIONES:
${healthScore.recommendations.map(rec => `• ${rec}`).join('\n')}

PLAN DE TRATAMIENTO:
${plan.phases.map(phase => 
  `Fase ${phase.phase}: ${phase.title}
  - Procedimientos: ${phase.procedures.join(', ')}
  - Sesiones estimadas: ${phase.estimatedSessions}
  - Prioridad: ${phase.priority.toUpperCase()}`
).join('\n\n')}

Duración estimada total: ${plan.estimatedDuration}
Sesiones totales: ${plan.estimatedSessions}

Notas generales: ${data.generalNotes || 'Ninguna'}
`;
      
    default:
      return JSON.stringify(data);
  }
}

/**
 * Validate odontogram data integrity
 */
export function validateOdontogramData(data: OdontogramData): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for valid tooth numbers
  Object.values(data.teeth).forEach(tooth => {
    if (tooth.number < 1 || tooth.number > 32) {
      errors.push(`Número de diente inválido: ${tooth.number}`);
    }
    
    // Check for logical inconsistencies
    if (tooth.condition === 'missing' && tooth.surfaces && tooth.surfaces.length > 0) {
      warnings.push(`Diente ${tooth.number}: Superficies especificadas para diente ausente`);
    }
    
    if (tooth.condition === 'healthy' && tooth.surfaces && tooth.surfaces.length > 0) {
      warnings.push(`Diente ${tooth.number}: Superficies especificadas para diente sano`);
    }
  });
  
  // Check for duplicate tooth numbers
  const toothNumbers = Object.values(data.teeth).map(t => t.number);
  const duplicates = toothNumbers.filter((num, index) => toothNumbers.indexOf(num) !== index);
  if (duplicates.length > 0) {
    errors.push(`Números de diente duplicados: ${duplicates.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}