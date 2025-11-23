'use server';

import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
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
    const adminApp = initializeAdminApp();
    const adminAuth = getAuth(adminApp);

    const user = await adminAuth.getUserByEmail(email);
    if (!user) {
      return { success: false, message: `Usuário com email ${email} não encontrado.` };
    }

    const existingClaims = user.customClaims || {};
    if (existingClaims.admin === true) {
        return { success: true, message: `O usuário ${email} já é um administrador.` };
    }

    await adminAuth.setCustomUserClaims(user.uid, { ...existingClaims, admin: true });
    
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


export type VipStatus = 'PENDING' | 'AWAITING_DEPOSIT' | 'DEPOSIT_PENDING' | 'APPROVED' | 'REJECTED' | 'PREMIUM';

/**
 * Updates the status of a VIP request. Only callable by an admin.
 * @param userId The UID of the user whose request is being updated.
 * @param newStatus The new status to set.
 * @returns An object indicating success or an error message.
 */
export async function updateVipRequestStatus(userId: string, newStatus: VipStatus): Promise<{ success: boolean, message: string }> {
     try {
        const adminApp = initializeAdminApp();
        const db = getFirestore(adminApp);

        const requestRef = db.collection('vipRequests').doc(userId);
        const requestDoc = await requestRef.get();

        if (!requestDoc.exists) {
            return { success: false, message: 'Solicitação não encontrada.' };
        }

        await requestRef.update({ status: newStatus });
        
        revalidatePath('/admin');
        
        return { success: true, message: `Status da solicitação atualizado para ${newStatus}.` };

     } catch (error: any) {
        console.error('Erro ao atualizar status da solicitação VIP:', error);
        return { success: false, message: 'Ocorreu um erro inesperado ao atualizar o status.' };
     }
}
