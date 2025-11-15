
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// import { initializeApp, getApps, getApp } from 'firebase/app';
// import { getFirestore, doc, getDoc, collection } from 'firebase/firestore';
// import { firebaseConfig } from './firebase/config';

// Initialize Firebase Admin SDK
// Use a function to ensure it's initialized only once
// const getDb = () => {
//   if (!getApps().length) {
//     initializeApp(firebaseConfig);
//   }
//   return getFirestore(getApp());
// };


export async function middleware(request: NextRequest) {
  // Ignore routes that are not pages or are essential for functionality
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/api/') || 
      pathname.startsWith('/static/') || 
      pathname.includes('.') || // Ignore files with extensions
      pathname === '/blocked') { // Don't block the blocked page itself
    return NextResponse.next();
  }

  // Get IP address
  // const ip = request.ip ?? request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1';

  // try {
  //   const db = getDb();
  //   const blacklistCol = collection(db, 'ipBlacklist');
  //   const ipRef = doc(blacklistCol, ip);
  //   const ipDoc = await getDoc(ipRef);

  //   if (ipDoc.exists()) {
  //     // If the IP is in the blacklist, rewrite to a 'blocked' page
  //     console.log(`[Middleware] Blocked IP: ${ip}`);
  //     return NextResponse.rewrite(new URL('/blocked', request.url));
  //   }

  // } catch (error) {
  //   console.error('[Middleware] Error checking IP blacklist:', error);
  //   // In case of an error, it's safer to let the request through
  //   // than to block a legitimate user.
  // }
  
  // If IP is not in the blacklist, proceed
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
