// src/lib/utils/patientExcelExport.ts
import * as XLSX from 'xlsx';
import { Patient } from '@/lib/firebase/db';

export interface EnhancedPatientExportData {
  patient: Patient;
  // Add more related data as needed (appointments, treatments, etc.)
}

/**
 * Export patients to Excel with comprehensive data
 */
export const exportPatientsToExcel = async (
  patients: Patient[],
  filename?: string
): Promise<void> => {
  try {
    console.log('Preparing patient export data...');

    // Prepare data for Excel
    const excelData = patients.map((patient) => {
      // Calculate age
      const calculateAge = (dateOfBirth: Date) => {
        if (!dateOfBirth) return 'N/A';
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age;
      };

      // Basic patient data
      const baseData = {
        'ID': patient.id || '',
        'Nombre': patient.firstName,
        'Apellido': patient.lastName,
        'Nombre Completo': patient.fullName,
        'Email': patient.email,
        'Teléfono': patient.phone,
        'Teléfono Alternativo': patient.alternatePhone || '',
        'Fecha de Nacimiento': patient.dateOfBirth 
          ? formatDateForExcel(patient.dateOfBirth) 
          : 'N/A',
        'Edad': calculateAge(patient.dateOfBirth.toDate()),
        'Género': getGenderLabel(patient.gender),
        'Estado': getStatusLabel(patient.status),
        
        // Address
        'Dirección': patient.address.street,
        'Ciudad': patient.address.city,
        'Estado/Provincia': patient.address.state,
        'Código Postal': patient.address.zipCode,
        'País': patient.address.country,
        
        // Contact preferences
        'Método de Contacto Preferido': patient.preferences.communicationMethod,
        'Horarios Preferidos': patient.preferences.preferredTimeSlots.join(', '),
        'Días Preferidos': patient.preferences.preferredDays.join(', '),
        
        // Emergency contact
        'Contacto de Emergencia - Nombre': patient.emergencyContact.name,
        'Contacto de Emergencia - Relación': patient.emergencyContact.relationship,
        'Contacto de Emergencia - Teléfono': patient.emergencyContact.phone,
        
        // Insurance
        'Tiene Seguro': patient.insurance.isActive ? 'Sí' : 'No',
        'Proveedor de Seguro': patient.insurance.provider || '',
        'Número de Póliza': patient.insurance.policyNumber || '',
        'Titular del Seguro': patient.insurance.subscriberName || '',
        
        // Medical history
        'Alergias': patient.medicalHistory.allergies.join('; '),
        'Medicamentos': patient.medicalHistory.medications.join('; '),
        'Condiciones Médicas': patient.medicalHistory.medicalConditions.join('; '),
        'Cirugías Previas': patient.medicalHistory.surgeries.join('; '),
        'Médico de Cabecera': patient.medicalHistory.primaryPhysician || '',
        
        // Dental history
        'Última Visita Dental': patient.dentalHistory.lastVisit 
          ? formatDateForExcel(patient.dentalHistory.lastVisit) 
          : 'No registrada',
        'Última Limpieza': patient.dentalHistory.lastCleaning 
          ? formatDateForExcel(patient.dentalHistory.lastCleaning) 
          : 'No registrada',
        'Dentista Anterior': patient.dentalHistory.previousDentist || '',
        'Motivo de Consulta': patient.dentalHistory.reasonForVisit,
        'Higiene Oral': patient.dentalHistory.oralHygiene,
        'Frecuencia de Cepillado': patient.dentalHistory.brushingFrequency.replace('_', ' '),
        'Frecuencia de Hilo Dental': patient.dentalHistory.flossingFrequency.replace('_', ' '),
        'Problemas Actuales': patient.dentalHistory.currentProblems.join('; '),
        'Nivel de Dolor (1-10)': patient.dentalHistory.painLevel || 'N/A',
        
        // Financial
        'Método de Pago Preferido': patient.financial.paymentMethod,
        'Balance Actual': patient.financial.balance,
        
        // System fields
        'Asignado a': patient.assignedTo || 'Sin asignar',
        'Fecha de Registro': formatDateForExcel(patient.createdAt),
        'Última Actualización': formatDateForExcel(patient.updatedAt),
        'Registrado Por': patient.createdBy,
        'Notas': patient.notes || '',
        
        // Consents
        'Consentimiento de Tratamiento': patient.consents.treatmentConsent ? 'Sí' : 'No',
        'Política de Privacidad': patient.consents.privacyPolicy ? 'Sí' : 'No',
        'Emails de Marketing': patient.consents.marketingEmails ? 'Sí' : 'No',
        'Fecha de Consentimiento': patient.consents.dateSigned 
          ? formatDateForExcel(patient.consents.dateSigned) 
          : 'No firmado'
      };

      return baseData;
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for better readability
    const columnWidths = [
      { wch: 10 }, // ID
      { wch: 15 }, // Nombre
      { wch: 15 }, // Apellido
      { wch: 25 }, // Nombre Completo
      { wch: 25 }, // Email
      { wch: 15 }, // Teléfono
      { wch: 15 }, // Teléfono Alternativo
      { wch: 15 }, // Fecha de Nacimiento
      { wch: 8 },  // Edad
      { wch: 12 }, // Género
      { wch: 15 }, // Estado
      { wch: 30 }, // Dirección
      { wch: 15 }, // Ciudad
      { wch: 15 }, // Estado/Provincia
      { wch: 12 }, // Código Postal
      { wch: 12 }, // País
      { wch: 15 }, // Método de Contacto
      { wch: 20 }, // Horarios Preferidos
      { wch: 20 }, // Días Preferidos
      { wch: 20 }, // Contacto Emergencia Nombre
      { wch: 15 }, // Contacto Emergencia Relación
      { wch: 15 }, // Contacto Emergencia Teléfono
      { wch: 12 }, // Tiene Seguro
      { wch: 20 }, // Proveedor Seguro
      { wch: 20 }, // Número Póliza
      { wch: 20 }, // Titular Seguro
      { wch: 30 }, // Alergias
      { wch: 30 }, // Medicamentos
      { wch: 30 }, // Condiciones Médicas
      { wch: 30 }, // Cirugías
      { wch: 20 }, // Médico Cabecera
      { wch: 15 }, // Última Visita Dental
      { wch: 15 }, // Última Limpieza
      { wch: 20 }, // Dentista Anterior
      { wch: 30 }, // Motivo Consulta
      { wch: 12 }, // Higiene Oral
      { wch: 20 }, // Frecuencia Cepillado
      { wch: 20 }, // Frecuencia Hilo
      { wch: 30 }, // Problemas Actuales
      { wch: 12 }, // Nivel Dolor
      { wch: 15 }, // Método Pago
      { wch: 12 }, // Balance
      { wch: 15 }, // Asignado a
      { wch: 18 }, // Fecha Registro
      { wch: 18 }, // Última Actualización
      { wch: 15 }, // Registrado Por
      { wch: 50 }, // Notas
      { wch: 12 }, // Consentimiento Tratamiento
      { wch: 12 }, // Política Privacidad
      { wch: 12 }, // Emails Marketing
      { wch: 18 }  // Fecha Consentimiento
    ];
    
    ws['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Pacientes');

    // Create summary sheet
    const summaryData = createPatientSummaryData(patients);
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    summaryWs['!cols'] = [{ wch: 25 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen');

    // Generate filename
    const defaultFilename = `pacientes_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    const finalFilename = filename || defaultFilename;

    // Save file
    XLSX.writeFile(wb, finalFilename);
    
    console.log('Patient export completed successfully!');
  } catch (error) {
    console.error('Error exporting patients to Excel:', error);
    throw error;
  }
};

/**
 * Create summary statistics for the patients
 */
const createPatientSummaryData = (patients: Patient[]) => {
  const total = patients.length;
  const inquiryCount = patients.filter(p => p.status === 'inquiry').length;
  const scheduledCount = patients.filter(p => p.status === 'scheduled').length;
  const activeCount = patients.filter(p => p.status === 'active').length;
  const treatmentCount = patients.filter(p => p.status === 'treatment').length;
  const maintenanceCount = patients.filter(p => p.status === 'maintenance').length;
  const inactiveCount = patients.filter(p => p.status === 'inactive').length;

  // Gender distribution
  const maleCount = patients.filter(p => p.gender === 'male').length;
  const femaleCount = patients.filter(p => p.gender === 'female').length;
  const otherGenderCount = patients.filter(p => p.gender === 'other').length;
  const noGenderSpecified = patients.filter(p => p.gender === 'prefer_not_to_say').length;

  // Age groups
  const calculateAge = (dateOfBirth: Date) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const ageGroups = {
    under18: 0,
    '18-30': 0,
    '31-50': 0,
    '51-70': 0,
    over70: 0,
    unknown: 0
  };

  patients.forEach(patient => {
    const age = calculateAge(patient.dateOfBirth.toDate());
    if (age === null) {
      ageGroups.unknown++;
    } else if (age < 18) {
      ageGroups.under18++;
    } else if (age <= 30) {
      ageGroups['18-30']++;
    } else if (age <= 50) {
      ageGroups['31-50']++;
    } else if (age <= 70) {
      ageGroups['51-70']++;
    } else {
      ageGroups.over70++;
    }
  });

  // Insurance status
  const withInsurance = patients.filter(p => p.insurance.isActive).length;
  const withoutInsurance = total - withInsurance;

  return [
    { 'Métrica': 'ESTADÍSTICAS GENERALES', 'Valor': '' },
    { 'Métrica': 'Total de Pacientes', 'Valor': total },
    { 'Métrica': '', 'Valor': '' },
    
    { 'Métrica': 'DISTRIBUCIÓN POR ESTADO', 'Valor': '' },
    { 'Métrica': 'Consultas', 'Valor': inquiryCount },
    { 'Métrica': 'Programados', 'Valor': scheduledCount },
    { 'Métrica': 'Activos', 'Valor': activeCount },
    { 'Métrica': 'En Tratamiento', 'Valor': treatmentCount },
    { 'Métrica': 'Mantenimiento', 'Valor': maintenanceCount },
    { 'Métrica': 'Inactivos', 'Valor': inactiveCount },
    { 'Métrica': '', 'Valor': '' },
    
    { 'Métrica': 'DISTRIBUCIÓN POR GÉNERO', 'Valor': '' },
    { 'Métrica': 'Masculino', 'Valor': maleCount },
    { 'Métrica': 'Femenino', 'Valor': femaleCount },
    { 'Métrica': 'Otro', 'Valor': otherGenderCount },
    { 'Métrica': 'No Especifica', 'Valor': noGenderSpecified },
    { 'Métrica': '', 'Valor': '' },
    
    { 'Métrica': 'DISTRIBUCIÓN POR EDAD', 'Valor': '' },
    { 'Métrica': 'Menores de 18', 'Valor': ageGroups.under18 },
    { 'Métrica': '18-30 años', 'Valor': ageGroups['18-30'] },
    { 'Métrica': '31-50 años', 'Valor': ageGroups['31-50'] },
    { 'Métrica': '51-70 años', 'Valor': ageGroups['51-70'] },
    { 'Métrica': 'Mayores de 70', 'Valor': ageGroups.over70 },
    { 'Métrica': 'Edad Desconocida', 'Valor': ageGroups.unknown },
    { 'Métrica': '', 'Valor': '' },
    
    { 'Métrica': 'SEGURO MÉDICO', 'Valor': '' },
    { 'Métrica': 'Con Seguro', 'Valor': withInsurance },
    { 'Métrica': 'Sin Seguro', 'Valor': withoutInsurance },
    { 'Métrica': '% Con Seguro', 'Valor': `${((withInsurance / total) * 100).toFixed(1)}%` },
    { 'Métrica': '', 'Valor': '' },
    
    { 'Métrica': 'TASAS DE CONVERSIÓN', 'Valor': '' },
    { 'Métrica': 'Consulta → Programado', 'Valor': `${inquiryCount > 0 ? ((scheduledCount / inquiryCount) * 100).toFixed(1) : 0}%` },
    { 'Métrica': 'Programado → Activo', 'Valor': `${scheduledCount > 0 ? ((activeCount / scheduledCount) * 100).toFixed(1) : 0}%` },
    { 'Métrica': 'Activo → Tratamiento', 'Valor': `${activeCount > 0 ? ((treatmentCount / activeCount) * 100).toFixed(1) : 0}%` },
  ];
};

/**
 * Helper functions
 */
const formatDateForExcel = (date: any): string => {
  if (!date) return 'N/A';
  
  let jsDate: Date;
  if (typeof date === 'object' && date !== null && 'toDate' in date) {
    jsDate = date.toDate();
  } else if (date instanceof Date) {
    jsDate = date;
  } else {
    jsDate = new Date(date);
  }
  
  if (isNaN(jsDate.getTime())) return 'Invalid Date';
  
  return jsDate.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

const getStatusLabel = (status: Patient['status']): string => {
  switch (status) {
    case 'inquiry': return 'Consulta';
    case 'scheduled': return 'Programado';
    case 'active': return 'Activo';
    case 'treatment': return 'En Tratamiento';
    case 'maintenance': return 'Mantenimiento';
    case 'inactive': return 'Inactivo';
    default: return status;
  }
};

const getGenderLabel = (gender: Patient['gender']): string => {
  switch (gender) {
    case 'male': return 'Masculino';
    case 'female': return 'Femenino';
    case 'other': return 'Otro';
    case 'prefer_not_to_say': return 'No Especifica';
    default: return gender;
  }
};