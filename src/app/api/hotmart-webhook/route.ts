
import { NextRequest, NextResponse } from 'next/server';
import { initializeAdminApp } from '@/firebase/admin';
import admin from 'firebase-admin';

/**
 * Maps Hotmart's subscription statuses to our internal application statuses.
 * @param hotmartStatus The status string received from Hotmart.
 * @returns 'ACTIVE' or 'INACTIVE'.
 */
function mapHotmartStatusToAppStatus(hotmartStatus: string): 'ACTIVE' | 'INACTIVE' {
  const activeStatuses = ['active', 'activated', 'started'];
  // Any status not explicitly active is considered inactive (e.g., 'canceled', 'expired', 'inactive').
  return activeStatuses.includes(hotmartStatus.toLowerCase()) ? 'ACTIVE' : 'INACTIVE';
}

/**
 * Endpoint to handle Hotmart's postback notifications for subscriptions.
 * This function is designed to securely process subscription status changes.
 */
export async function POST(request: NextRequest) {
  // Security First: Verify Hotmart's token immediately.
  const hotmartToken = process.env.HOTMART_TOKEN;

  if (!hotmartToken) {
    console.error('CRITICAL: HOTMART_TOKEN environment variable is not set.');
    // Respond with 500 but don't give away internal details.
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }

  const providedToken = request.headers.get('Hottok');
  if (providedToken !== hotmartToken) {
    console.warn(`Unauthorized webhook attempt with token: ${providedToken}`);
    return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  }

  // If token is valid, proceed to initialize Firebase and process the data.
  try {
    initializeAdminApp();
  } catch (error) {
    console.error('Firebase admin initialization failed:', error);
    return NextResponse.json({ success: false, message: 'Internal server configuration error.' }, { status: 500 });
  }

  try {
    const data = await request.json();
    console.log('Received data from Hotmart:', JSON.stringify(data, null, 2));

    const userEmail = data?.subscriber?.email || data?.buyer?.email;
    const subscriptionStatus = data?.status;
    const userName = data?.buyer?.name;

    if (!userEmail || !subscriptionStatus) {
      console.warn('Webhook received but missing required fields (email or status).');
      return NextResponse.json({ success: false, message: 'Missing required fields.' }, { status: 400 });
    }

    const firestore = admin.firestore();
    const auth = admin.auth();
    const newAppStatus = mapHotmartStatusToAppStatus(subscriptionStatus);

    let userRecord;
    try {
        // Try to find an existing user by email.
        userRecord = await auth.getUserByEmail(userEmail);
    } catch (error: any) {
        if (error.code === 'auth/user-not-found' && newAppStatus === 'ACTIVE') {
            console.log(`User with email ${userEmail} not found. Creating a new user.`);
            // If the user doesn't exist and the status is active, create them.
            userRecord = await auth.createUser({
                email: userEmail,
                displayName: userName || userEmail.split('@')[0], // Use name from Hotmart or derive from email
                emailVerified: true, // Assume email is verified as it's from a purchase
            });
            console.log(`Successfully created new user: ${userRecord.uid}`);
        } else {
            // For other errors or if status is not 'ACTIVE' for a non-existent user.
            console.error(`Error fetching user ${userEmail}:`, error);
             // Acknowledge to Hotmart to prevent retries for non-actionable errors.
            return NextResponse.json({ success: true, message: 'User not found or not an activation event.' });
        }
    }
    
    // At this point, we have a userRecord (either found or newly created).
    const userDocRef = firestore.collection('users').doc(userRecord.uid);
    const userProfileData = {
        email: userEmail,
        displayName: userRecord.displayName || userName,
        subscriptionStatus: newAppStatus,
        lastHotmartUpdate: admin.firestore.FieldValue.serverTimestamp(),
        lastHotmartStatus: subscriptionStatus,
    };
    
    // Use set with merge to create the document if it doesn't exist or update it if it does.
    await userDocRef.set(userProfileData, { merge: true });

    console.log(`Successfully processed webhook for user ${userRecord.uid} (${userEmail}). Set status to ${newAppStatus}.`);

    // Acknowledge receipt to Hotmart.
    return NextResponse.json({ success: true, message: 'Webhook processed successfully.' });

  } catch (error) {
    console.error('Error processing Hotmart webhook payload:', error);
    return NextResponse.json({ success: false, message: 'An internal error occurred.' }, { status: 500 });
  }
}
