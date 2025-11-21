// IMPORTANT: This file should only be used in server-side code (e.g., Server Actions, API routes).
// Do not import it in client-side components.

import admin from 'firebase-admin';

// This function initializes and returns the Firebase Admin App instance.
// It ensures that initialization only happens once.
export function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  try {
    // When running on Firebase App Hosting, credentials are automatically discovered.
    return admin.initializeApp();
  } catch (error: any) {
     if (error.code === 'app/invalid-credential') {
        console.warn(
            'Credenciais do Firebase Admin não encontradas. ' +
            'Isto é esperado no desenvolvimento local. ' +
            'Se você precisar de funcionalidades de admin localmente, configure as credenciais via ' +
            'GOOGLE_APPLICATION_CREDENTIALS. Erro: ', error.message
        );
        // Return a dummy object or handle as needed for local dev without admin features.
        // For this use case, we re-throw because admin features are critical.
        throw new Error("Credenciais de Admin não configuradas para ambiente local.");
     }
     throw error; // Re-throw other initialization errors
  }
}
