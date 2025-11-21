'use server';

import { getAuth } from 'firebase-admin/auth';
import { initializeAdminApp } from '@/firebase/admin';
import { revalidatePath } from 'next/cache';

/**
 * Sets a custom claim on a user account to grant admin privileges.
 * This function should only be callable by an existing admin.
 * 
 * @param email The email of the user to make an admin.
 * @returns An object indicating success or an error message.
 */
export async function setAdminClaim(email: string): Promise<{ success: boolean, message: string }> {
  try {
    // Initialize the Firebase Admin SDK
    const adminApp = initializeAdminApp();
    const adminAuth = getAuth(adminApp);

    // Get the user by email
    const user = await adminAuth.getUserByEmail(email);
    if (!user) {
      return { success: false, message: `Usuário com email ${email} não encontrado.` };
    }

    // Get existing custom claims
    const existingClaims = user.customClaims || {};

    // Check if the user is already an admin
    if (existingClaims.admin === true) {
        return { success: true, message: `O usuário ${email} já é um administrador.` };
    }

    // Set the new custom claim
    await adminAuth.setCustomUserClaims(user.uid, { ...existingClaims, admin: true });
    
    // Revalidate the path to ensure the UI updates if the current user was changed
    revalidatePath('/admin');

    return { success: true, message: `O usuário ${email} agora é um administrador.` };

  } catch (error: any) {
    console.error('Erro ao definir a permissão de administrador:', error);
    if (error.code === 'auth/user-not-found') {
        return { success: false, message: `Usuário com email "${email}" não encontrado.` };
    }
    return { success: false, message: 'Ocorreu um erro inesperado. Verifique os logs do servidor.' };
  }
}
