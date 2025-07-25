// src/app/api/public/booking-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isAdminSDKConfigured } from '@/lib/firebase/admin';

// Fallback imports for when Admin SDK isn't configured
import { getAllUsers } from '@/lib/firebase/rbac';
import { getAppointments } from '@/lib/firebase/db';

// Types for public API responses
interface PublicDoctor {
  uid: string;
  displayName: string;
  email?: string;
}

interface PublicAppointment {
  doctorId: string;
  appointmentDate: any;
  duration: number;
  status: string;
}

interface BookingDataResponse {
  doctors: PublicDoctor[];
  appointments: PublicAppointment[];
  success: boolean;
  error?: string;
}

export async function GET(request: NextRequest) {
  console.log('🔧 Public booking API called');
  
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let publicDoctors: PublicDoctor[] = [];
    let appointments: PublicAppointment[] = [];

    if (isAdminSDKConfigured()) {
      console.log('✅ Using Firebase Admin SDK');
      
      try {
        // Load doctors using Admin SDK
        const usersSnapshot = await adminDb.collection('app_users').get();
        
        usersSnapshot.forEach(doc => {
          const userData = doc.data();
          if (userData.role === 'doctor' && userData.isActive) {
            publicDoctors.push({
              uid: userData.uid,
              displayName: userData.displayName || 'Dr. ' + (userData.email?.split('@')[0] || ''),
              email: userData.email,
            });
          }
        });

        // Load appointments using Admin SDK
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          
          const appointmentsSnapshot = await adminDb.collection('appointments')
            .where('appointmentDate', '>=', start)
            .where('appointmentDate', '<=', end)
            .orderBy('appointmentDate', 'asc')
            .get();
          
          appointmentsSnapshot.forEach(doc => {
            const aptData = doc.data();
            appointments.push({
              doctorId: aptData.doctorId,
              appointmentDate: aptData.appointmentDate,
              duration: aptData.duration,
              status: aptData.status,
            });
          });
        }
        
        console.log(`✅ Admin SDK: Found ${publicDoctors.length} doctors, ${appointments.length} appointments`);

      } catch (adminError) {
        console.error('❌ Admin SDK failed:', adminError);
        throw adminError;
      }

    } else {
      console.log('⚠️ Admin SDK not configured, API will not work properly');
      
      // For now, return error instead of trying fallback
      return NextResponse.json({
        error: 'Server configuration incomplete. Please contact administrator.',
        success: false,
        details: 'Firebase Admin SDK not configured'
      }, { status: 503 });
    }

    const response: BookingDataResponse = {
      doctors: publicDoctors,
      appointments: appointments,
      success: true
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error fetching public booking data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch booking data. Please check server configuration.', 
        success: false,
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}