// IMPORTANT: This file should only be used in server-side code (e.g., Server Actions, API routes).
// Do not import it in client-side components.

import admin from 'firebase-admin';

let adminApp: admin.app.App | null = null;

// This function initializes and returns the Firebase Admin App instance.
// It ensures that initialization only happens once.
export function initializeAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  try {
    // When running on Firebase App Hosting or Cloud Functions, credentials are automatically discovered.
    console.log("Attempting to initialize Firebase Admin with default credentials...");
    const app = admin.initializeApp();
    adminApp = app;
    console.log("Firebase Admin initialized successfully.");
    return app;
  } catch (error: any) {
     if (error.code === 'app/invalid-credential') {
        // This is expected in a local dev environment if GOOGLE_APPLICATION_CREDENTIALS is not set.
        // We log a clear warning but do not throw, allowing the rest of the app to function
        // for features that do not require admin privileges.
        console.warn(
            'AVISO: Credenciais do Firebase Admin não foram encontradas. ' +
            'Isto é esperado no ambiente de desenvolvimento local. ' +
            'Funcionalidades de administrador (como a auto-promoção) não funcionarão localmente, ' +
            'mas devem funcionar em produção se o secret FIREBASE_SERVICE_ACCOUNT estiver configurado. Erro: ', error.message
        );
        // We return a "null" app, which can be checked by callers.
        // In this case, we'll throw a specific error so the action can handle it.
        throw new Error("AdminInitFailed");
     }
     // For other initialization errors, we re-throw because they are unexpected.
     console.error("Erro inesperado ao inicializar o Firebase Admin:", error);
     throw error;
  }
}
