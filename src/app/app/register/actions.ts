'use server';

import { initializeAdminApp } from '@/firebase/admin';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Valida o código de ativação contra o segredo armazenado no Firestore.
 * @param activationCode - O código inserido pelo utilizador.
 * @returns {Promise<{success: boolean}>} - Retorna um objeto indicando se a validação foi bem-sucedida.
 */
export async function validateActivationCode(activationCode: string): Promise<{ success: boolean }> {
  if (!activationCode) {
    return { success: false };
  }

  try {
    // Inicializa o Firebase Admin SDK (seguro para ser chamado múltiplas vezes)
    initializeAdminApp();
    
    const db = getFirestore();
    const registrationConfigRef = db.doc('appConfig/registration');
    const docSnap = await registrationConfigRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();
      if (data && data.registrationSecret === activationCode) {
        return { success: true };
      }
    }
    
    // Se o documento não existir ou o código não corresponder
    return { success: false };

  } catch (error: any) {
     // Se a inicialização do admin falhar localmente, permite o registo com um código de fallback.
     // Isto previne bloqueios no desenvolvimento local onde as credenciais podem não estar configuradas.
    if (error.message === "AdminInitFailed") {
        console.warn("Falha na inicialização do Admin. Usando código de fallback para desenvolvimento local.");
        if (activationCode === "changeme") {
            return { success: true };
        }
    }
    console.error("Erro ao validar o código de ativação:", error);
    return { success: false };
  }
}
