// src/hooks/usePatientEditing.ts - Fixed validation for alternatePhone
import React, { useState, useCallback, useEffect } from 'react';
import { Patient } from '@/lib/firebase/db';

type PatientSection = 
  | 'contact' 
  | 'address' 
  | 'insurance' 
  | 'emergency' 
  | 'notes' 
  | 'allergies' 
  | 'medications' 
  | 'conditions' 
  | 'surgeries' 
  | 'physician'
  | 'dentalHistory' 
  | 'oralHygiene' 
  | 'dentalProblems'
  | 'clinicalFindings'; // Added new section

interface UsePatientEditingReturn {
  // State
  editingSection: PatientSection | null;
  editableData: Partial<Patient>;
  hasUnsavedChanges: boolean;
  
  // Actions
  startEditing: (section: PatientSection, initialData: Partial<Patient>) => void;
  cancelEditing: () => void;
  updateEditableData: (data: Partial<Patient>) => void;
  updateNestedData: <T extends keyof Patient>(
    field: T, 
    subField: string, 
    value: any
  ) => void;
  addToArray: <T extends keyof Patient>(
    field: T, 
    arrayField: string, 
    value: string
  ) => void;
  removeFromArray: <T extends keyof Patient>(
    field: T, 
    arrayField: string, 
    index: number
  ) => void;
  
  // Validation
  isValid: boolean;
  validationErrors: Record<string, string>;
}

export const usePatientEditing = (): UsePatientEditingReturn => {
  const [editingSection, setEditingSection] = useState<PatientSection | null>(null);
  const [editableData, setEditableData] = useState<Partial<Patient>>({});
  const [initialData, setInitialData] = useState<Partial<Patient>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const hasUnsavedChanges = JSON.stringify(editableData) !== JSON.stringify(initialData);

  const startEditing = useCallback((section: PatientSection, data: Partial<Patient>) => {
    setEditingSection(section);
    setEditableData(data);
    setInitialData(data);
    setValidationErrors({});
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingSection(null);
    setEditableData({});
    setInitialData({});
    setValidationErrors({});
  }, []);

  const updateEditableData = useCallback((data: Partial<Patient>) => {
    setEditableData(prev => ({ ...prev, ...data }));
    
    // Clear validation errors for updated fields
    const updatedFields = Object.keys(data);
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      updatedFields.forEach(field => delete newErrors[field]);
      return newErrors;
    });
  }, []);

  const updateNestedData = useCallback(<T extends keyof Patient>(
    field: T, 
    subField: string, 
    value: any
  ) => {
    setEditableData(prev => ({
      ...prev,
      [field]: {
        ...(prev[field] as Record<string, any> || {}),
        [subField]: value,
      },
    }));
  }, []);

  const addToArray = useCallback(<T extends keyof Patient>(
    field: T, 
    arrayField: string, 
    value: string
  ) => {
    if (!value.trim()) return;

    setEditableData(prev => {
      const current = (prev[field] as Record<string, any>) || {};
      const currentArray = current[arrayField] || [];

      if (!currentArray.includes(value)) {
        return {
          ...prev,
          [field]: {
            ...current,
            [arrayField]: [...currentArray, value],
          },
        } as Partial<Patient>;
      }
      return prev;
    });
  }, []);

  const removeFromArray = useCallback(<T extends keyof Patient>(
    field: T, 
    arrayField: string, 
    index: number
  ) => {
    setEditableData(prev => {
      const current = (prev[field] as Record<string, any>) || {};
      const currentArray = current[arrayField] || [];

      return {
        ...prev,
        [field]: {
          ...current,
          [arrayField]: currentArray.filter((_: any, i: number) => i !== index),
        },
      } as Partial<Patient>;
    });
  }, []);

  // Enhanced validation with better alternatePhone handling
  const validateData = useCallback((section: PatientSection, data: Partial<Patient>): Record<string, string> => {
    const errors: Record<string, string> = {};

    switch (section) {
      case 'contact':
        if (!data.firstName?.trim()) errors.firstName = 'Nombre es requerido';
        if (!data.lastName?.trim()) errors.lastName = 'Apellido es requerido';
        if (!data.email?.trim()) {
          errors.email = 'Email es requerido';
        } else if (!/\S+@\S+\.\S+/.test(data.email)) {
          errors.email = 'Formato de email inválido';
        }
        if (!data.phone?.trim()) errors.phone = 'Teléfono es requerido';
        // NOTE: alternatePhone is optional - no validation needed
        break;
        
      case 'address':
        if (!data.address?.street?.trim()) errors.street = 'Dirección es requerida';
        if (!data.address?.city?.trim()) errors.city = 'Ciudad es requerida';
        if (!data.address?.state?.trim()) errors.state = 'Estado es requerido';
        if (!data.address?.zipCode?.trim()) errors.zipCode = 'Código postal es requerido';
        break;
        
      case 'emergency':
        if (!data.emergencyContact?.name?.trim()) errors.emergencyName = 'Nombre del contacto de emergencia es requerido';
        if (!data.emergencyContact?.phone?.trim()) errors.emergencyPhone = 'Teléfono del contacto de emergencia es requerido';
        break;

      case 'insurance':
        if (data.insurance?.isActive) {
          if (!data.insurance?.provider?.trim()) errors.insuranceProvider = 'Proveedor de seguro es requerido';
          if (!data.insurance?.policyNumber?.trim()) errors.policyNumber = 'Número de póliza es requerido';
        }
        break;

      case 'allergies':
      case 'medications':
      case 'conditions':
      case 'surgeries':
      case 'dentalProblems':
      case 'clinicalFindings':
        // Array-based fields don't need specific validation beyond non-empty values
        break;

      case 'dentalHistory':
        if (!data.dentalHistory?.reasonForVisit?.trim()) {
          errors.reasonForVisit = 'Motivo de la visita es requerido';
        }
        break;
    }

    return errors;
  }, []);

  const isValid = Object.keys(validationErrors).length === 0;

  // Update validation when data changes
  useEffect(() => {
    if (editingSection) {
      const errors = validateData(editingSection, editableData);
      setValidationErrors(errors);
    }
  }, [editingSection, editableData, validateData]);

  return {
    // State
    editingSection,
    editableData,
    hasUnsavedChanges,
    
    // Actions
    startEditing,
    cancelEditing,
    updateEditableData,
    updateNestedData,
    addToArray,
    removeFromArray,
    
    // Validation
    isValid,
    validationErrors,
  };
};