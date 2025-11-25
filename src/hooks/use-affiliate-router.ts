'use client';

import { useAppConfig } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

type NavigateOptions = Parameters<ReturnType<typeof useRouter>['push']>[1];
type Route = Parameters<ReturnType<typeof useRouter>['push']>[0];


export function useAffiliateRouter() {
  const router = useRouter();
  const pathname = usePathname();
  const { affiliateId } = useAppConfig();

  const isExternal = (url: string) => /^(https|http|www)/.test(url);

  const generateHref = useCallback((url: string) => {
    if (!affiliateId || isExternal(url) || pathname === url) {
      return url;
    }

    const hasParams = url.includes('?');
    const separator = hasParams ? '&' : '?';
    
    return `${url}${separator}aff=${affiliateId}`;
  }, [affiliateId, pathname]);

  const push = useCallback(
    (href: Route, options?: NavigateOptions) => {
      const finalHref = typeof href === 'string' ? generateHref(href) : href;
      router.push(finalHref, options);
    },
    [generateHref, router]
  );

  const replace = useCallback(
    (href: Route, options?: NavigateOptions) => {
      const finalHref = typeof href === 'string' ? generateHref(href) : href;
      router.replace(finalHref, options);
    },
    [generateHref, router]
  );

  return {
    ...router,
    push,
    replace,
  };
}
