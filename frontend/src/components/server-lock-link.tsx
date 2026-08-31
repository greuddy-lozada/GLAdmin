'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { isPosSafePath } from '@/lib/sync/pos-nav-lock';

interface ServerLockLinkProps {
  href: string;
  locked: boolean;
  lockMessage: string;
  className?: string;
  children: React.ReactNode;
}

export function ServerLockLink({
  href,
  locked,
  lockMessage,
  className,
  children,
}: ServerLockLinkProps) {
  const allow = !locked || isPosSafePath(href);

  if (!allow) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            aria-disabled="true"
            className={cn(className, 'cursor-not-allowed opacity-50')}
          >
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent>{lockMessage}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
