
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLegacyRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/adm');
    }, [router]);
    return null;
}
