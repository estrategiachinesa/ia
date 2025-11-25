
'use server';

import { initializeAdminApp } from '@/firebase/admin';
import { getAuth } from 'firebase-admin/auth';

/**
 * Sets a custom 'admin' claim on a Firebase user.
 * This should only be callable under very specific, secure conditions.
 * For example, a one-time setup action for the first user.
 *
 * @param uid The UID of the user to make an admin.
 */
export async function makeAdmin(uid: string): Promise<{ success: boolean; message: string }> {
  try {
    const adminApp = initializeAdminApp();
    const adminAuth = getAuth(adminApp);
    
    // Check if there are any admins already.
    // This is a simple protection to prevent this from being used more than once easily.
    // For a real app, you would have more robust checks or use a different mechanism.
    const admins = await adminAuth.listUsers(1, undefined, { customClaims: { admin: true } });
    if (admins.users.length > 0) {
      // If there's already an admin, and it's not the current user trying to make themselves admin again
      if (admins.users[0].uid !== uid) {
          throw new Error('Já existe um administrador para esta aplicação.');
      }
    }

    // Set the custom claim.
    await adminAuth.setCustomUserClaims(uid, { admin: true });

    return { success: true, message: `O utilizador ${uid} é agora um administrador.` };
  } catch (error: any) {
    console.error('Error in makeAdmin server action:', error);
    // Re-throw the error so the client can handle it.
    // It's better to throw than to return an error object here,
    // as it integrates better with React's error boundaries and server action error handling.
    throw new Error(error.message || 'Ocorreu um erro ao atribuir privilégios de administrador.');
  }
}

    