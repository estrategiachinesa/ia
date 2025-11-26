import admin from 'firebase-admin';

// Throw a custom error to be caught in the action
class AdminInitFailed extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminInitFailed";
  }
}

export function initializeAdminApp() {
  // Evita a reinicialização da app no hot-reload do Next.js
  if (admin.apps.length > 0) {
    return;
  }

  // As credenciais são obtidas a partir das variáveis de ambiente
  // que o Firebase Functions/Google Cloud Run injeta automaticamente.
  // Para desenvolvimento local, o ficheiro serviceAccountKey.json deve ser
  // referenciado pela variável de ambiente GOOGLE_APPLICATION_CREDENTIALS.
  try {
    admin.initializeApp();
  } catch (error: any) {
    console.error("Firebase admin initialization error:", error);
    // Lança um erro específico para que a action possa lidar com o modo de desenvolvimento.
    throw new AdminInitFailed("Failed to initialize Firebase Admin SDK. Ensure credentials are set for production, or use the fallback for local development.");
  }
}
