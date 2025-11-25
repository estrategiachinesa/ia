'use client';

import { useAffiliateRouter } from '@/hooks/use-affiliate-router';
import Link, { type LinkProps } from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

type AffiliateLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> &
  LinkProps & {
  children?: React.ReactNode;
};

const AffiliateLink = React.forwardRef<HTMLAnchorElement, AffiliateLinkProps>(
  ({ href, ...props }, ref) => {
    const router = useAffiliateRouter();
    const isExternal = typeof href === 'string' && /^(https|http|www)/.test(href);

    if (isExternal) {
      return <a ref={ref} href={href} {...props} />;
    }

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      router.push(href);
    };

    return <a ref={ref} href={href.toString()} onClick={handleClick} {...props} />;
  }
);

AffiliateLink.displayName = 'AffiliateLink';


export default AffiliateLink;
