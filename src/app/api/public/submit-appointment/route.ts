// src/app/api/public/submit-appointment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isAdminSDKConfigured } from '@/lib/firebase/admin';

// Types for the submission
interface AppointmentFormData {
  name: string;
  email: string;
  phone: string;
  procedure: string;
  doctorId: string;
  selectedDate: string;
  selectedTime: string;
}

interface SubmissionResponse {
  success: boolean;
  patientId?: string;
  message?: string;
  data?: {
    patientName: string;
    procedure: string;
    doctor: string;
    requestedDate: string;
    requestedTime: string;
  };
  error?: string;
}

const DENTAL_PROCEDURES = [
  { id: "consultation", name: "Consulta General" },
  { id: "cleaning", name: "Limpieza Dental" },
  { id: "whitening", name: "Blanqueamiento" },
  { id: "filling", name: "Empaste" },
  { id: "extraction", name: "Extracción" },
  { id: "root_canal", name: "Endodoncia" },
  { id: "crown", name: "Corona" },
  { id: "orthodontics", name: "Ortodoncia" },
  { id: "implant", name: "Implante" },
  { id: "emergency", name: "Emergencia" },
] as const;

export async function POST(request: NextRequest) {
  console.log('🔧 Submit appointment API called');
  
  try {
    const formData: AppointmentFormData = await request.json();
    
    // Validate required fields
    const requiredFields: (keyof AppointmentFormData)[] = ['name', 'email', 'phone', 'procedure', 'doctorId', 'selectedDate', 'selectedTime'];
    for (const field of requiredFields) {
      if (!formData[field]) {
        return NextResponse.json({
          error: `Missing required field: ${field}`,
          success: false
        }, { status: 400 });
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return NextResponse.json({
        error: 'Invalid email format',
        success: false
      }, { status: 400 });
    }

    // Validate procedure exists
    const selectedProcedure = DENTAL_PROCEDURES.find(p => p.id === formData.procedure);
    if (!selectedProcedure) {
      return NextResponse.json({
        error: 'Invalid procedure selected',
        success: false
      }, { status: 400 });
    }

    // Parse selected date
    const selectedDate = new Date(formData.selectedDate);
    if (isNaN(selectedDate.getTime())) {
      return NextResponse.json({
        error: 'Invalid date format',
        success: false
      }, { status: 400 });
    }

    if (!isAdminSDKConfigured()) {
      console.log('⚠️ Admin SDK not configured');
      return NextResponse.json({
        error: 'Server configuration incomplete. Please contact administrator.',
        success: false,
        details: 'Firebase Admin SDK not configured'
      }, { status: 503 });
    }

    console.log('✅ Using Firebase Admin SDK for patient creation');
    
    // Validate doctor using Admin SDK
    const doctorDoc = await adminDb.collection('app_users').doc(formData.doctorId).get();
    if (!doctorDoc.exists) {
      return NextResponse.json({
        error: 'Doctor not found',
        success: false
      }, { status: 400 });
    }

    const doctorData = doctorDoc.data();
    if (!doctorData || doctorData.role !== 'doctor' || !doctorData.isActive) {
      return NextResponse.json({
        error: 'Invalid doctor selected',
        success: false
      }, { status: 400 });
    }

    // Parse name
    const [firstName, ...lastNameParts] = formData.name.trim().split(' ');
    const lastName = lastNameParts.join(' ') || '';

    // Create patient record using Admin SDK
    const patientData = {
      firstName,
      lastName,
      fullName: formData.name.trim(),
      email: formData.email.toLowerCase().trim(),
      phone: formData.phone,
      dateOfBirth: new Date(1990, 0, 1),
      gender: 'prefer_not_to_say',
      address: {
        street: '',
        city: 'Zapopan',
        state: 'Jalisco',
        zipCode: '',
        country: 'México',
      },
      emergencyContact: { name: '', relationship: '', phone: '' },
      insurance: { isActive: false },
      medicalHistory: {
        allergies: [],
        medications: [],
        medicalConditions: [],
        surgeries: [],
      },
      dentalHistory: {
        reasonForVisit: selectedProcedure.name,
        oralHygiene: 'good',
        brushingFrequency: 'twice_daily',
        flossingFrequency: 'daily',
        currentProblems: [],
        clinicalFindings: [],
      },
      status: 'inquiry',
      preferences: {
        preferredTimeSlots: [formData.selectedTime],
        preferredDays: [selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()],
        communicationMethod: 'phone',
        reminderPreferences: { email: true, sms: true, days: 1 },
      },
      financial: { paymentMethod: 'cash', balance: 0 },
      createdBy: 'public_booking_form',
      notes: `📱 SOLICITUD DE CITA DESDE FORMULARIO WEB

🔸 Información de la solicitud:
   • Procedimiento solicitado: ${selectedProcedure.name}
   • Fecha preferida: ${selectedDate.toLocaleDateString('es-MX', { 
     weekday: 'long', 
     year: 'numeric', 
     month: 'long', 
     day: 'numeric' 
   })}
   • Hora preferida: ${formData.selectedTime}
   • Doctor preferido: Dr. ${doctorData.displayName || doctorData.email}

🔸 Acciones pendientes:
   ✅ Contactar al paciente para confirmar disponibilidad
   ✅ Verificar agenda del doctor
   ✅ Confirmar fecha y hora final
   ✅ Crear cita oficial en el sistema

📞 Datos de contacto verificados:
   • Email: ${formData.email}
   • WhatsApp: ${formData.phone}
   
⏰ Solicitud creada: ${new Date().toLocaleString('es-MX')}`,
      statusHistory: [{
        id: `inquiry_${Date.now()}`,
        previousStatus: 'inquiry',
        newStatus: 'inquiry',
        details: 'Paciente creado desde formulario público de citas',
        performedBy: 'public_booking_form',
        performedAt: new Date()
      }],
      consents: {
        treatmentConsent: true,
        privacyPolicy: true,
        marketingEmails: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      alternatePhone: '',
    };

    const patientRef = await adminDb.collection('patients').add(patientData);
    console.log(`✅ Patient created with ID: ${patientRef.id}`);

    const response: SubmissionResponse = {
      success: true,
      patientId: patientRef.id,
      message: 'Appointment request submitted successfully',
      data: {
        patientName: formData.name,
        procedure: selectedProcedure.name,
        doctor: doctorData.displayName || doctorData.email,
        requestedDate: selectedDate.toLocaleDateString('es-MX'),
        requestedTime: formData.selectedTime
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error submitting appointment request:', error);
    return NextResponse.json({
      error: 'Failed to submit appointment request',
      success: false,
      details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    }, { status: 500 });
  }
}