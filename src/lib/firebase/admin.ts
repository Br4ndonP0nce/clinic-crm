// src/lib/firebase/admin.ts - Firebase Admin SDK for server-side operations
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK only once
if (!admin.apps.length) {
  try {
    // Check if we have the required environment variables
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      console.warn('⚠️ Firebase Admin SDK environment variables not found. Server-side features will be limited.');
      console.warn('Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
      
      // Initialize with minimal config for development
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    } else {
      // Initialize with service account credentials
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
        }),
        databaseURL: `https://${projectId}-default-rtdb.firebaseio.com`,
      });
      
      console.log('✅ Firebase Admin SDK initialized successfully');
    }
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error);
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();

// Helper function to check if Admin SDK is properly configured
export const isAdminSDKConfigured = (): boolean => {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );
};