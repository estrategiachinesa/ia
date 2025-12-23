
import { NextRequest, NextResponse } from 'next/server';
import { initializeAdminApp } from '@/firebase/admin';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
try {
  initializeAdminApp();
} catch (error) {
  console.warn("Admin SDK already initialized or initialization failed in a non-critical way.");
}

/**
 * Endpoint to handle Hotmart's postback notifications for subscriptions.
 */
export async function POST(request: NextRequest) {
  const hotmartToken = process.env.HOTMART_TOKEN;

  if (!hotmartToken) {
    console.error('HOTMART_TOKEN environment variable is not set.');
    return NextResponse.json({ success: false, message: 'Internal server configuration error.' }, { status: 500 });
  }

  // Hotmart sends the token in the headers for verification.
  const providedToken = request.headers.get('Hottok');

  if (providedToken !== hotmartToken) {
    console.warn('Invalid Hottok token received.');
    return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const data = await request.json();
    console.log('Received data from Hotmart:', JSON.stringify(data, null, 2));

    const userEmail = data?.subscriber?.email;
    const subscriptionStatus = data?.status; // e.g., 'active', 'inactive', 'canceled'

    if (!userEmail || !subscriptionStatus) {
      return NextResponse.json({ success: false, message: 'Missing required fields (email or status).' }, { status: 400 });
    }

    const firestore = admin.firestore();
    const usersRef = firestore.collection('users');
    const querySnapshot = await usersRef.where('email', '==', userEmail).limit(1).get();

    if (querySnapshot.empty) {
      console.log(`User with email ${userEmail} not found.`);
      // Even if user not found, return 200 to Hotmart to prevent retries.
      return NextResponse.json({ success: true, message: 'User not found, but acknowledged.' });
    }

    const userDoc = querySnapshot.docs[0];
    const newStatus = ['active', 'activated'].includes(subscriptionStatus) ? 'ACTIVE' : 'INACTIVE';

    await userDoc.ref.update({
      subscriptionStatus: newStatus,
      lastHotmartUpdate: admin.firestore.FieldValue.serverTimestamp(),
      lastHotmartStatus: subscriptionStatus
    });

    console.log(`Successfully updated user ${userDoc.id} (${userEmail}) to status ${newStatus}.`);

    return NextResponse.json({ success: true, message: 'User status updated successfully.' });

  } catch (error) {
    console.error('Error processing Hotmart webhook:', error);
    // Return a 500 error but Hotmart might retry. Check logs.
    return NextResponse.json({ success: false, message: 'An internal error occurred.' }, { status: 500 });
  }
}
