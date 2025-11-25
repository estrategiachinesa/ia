
'use server';

import { initializeAdminApp } from '@/firebase/admin';
import { getAuth } from 'firebase-admin/auth';

/**
 * Sets a custom 'admin' claim on a Firebase user.
 * This should only be callable under very specific, secure conditions.
 *
 * @param uid The UID of the user to make an admin.
 */
export async function makeAdmin(uid: string): Promise<{ success: boolean; message: string }> {
  try {
    const adminApp = initializeAdminApp();
    const adminAuth = getAuth(adminApp);
    
    // Check if there are any admins already.
    // This is a simple protection to prevent this from being used more than once easily.
    const listUsersResult = await adminAuth.listUsers(1000); // List all users to find admins
    const admins = listUsersResult.users.filter(user => !!user.customClaims?.admin);

    if (admins.length > 0) {
      // If there's already an admin, and it's not the current user trying to make themselves admin again
      if (!admins.some(admin => admin.uid === uid)) {
          console.log('Já existe um administrador. Ação bloqueada.');
          // Silently succeed to not alert non-admin users.
          return { success: true, message: 'Processo de verificação concluído.' };
      }
    }

    // Set the custom claim.
    await adminAuth.setCustomUserClaims(uid, { admin: true });

    return { success: true, message: `O utilizador ${uid} é agora um administrador.` };
  } catch (error: any) {
    if (error.message === 'AdminInitFailed') {
        const devErrorMsg = 'A funcionalidade de auto-promoção para admin está desativada no ambiente de desenvolvimento. Por favor, faça o deploy para o ambiente de produção para que a promoção automática funcione.';
        console.warn(devErrorMsg);
        // We throw this specific message to be caught on the client
        throw new Error(devErrorMsg);
    }
    
    console.error('Error in makeAdmin server action:', error);
    throw new Error(error.message || 'Ocorreu um erro ao atribuir privilégios de administrador.');
  }
}
