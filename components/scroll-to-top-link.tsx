'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ComponentPropsWithoutRef } from 'react';

type Props = Omit<ComponentPropsWithoutRef<typeof Link>, 'href'> & {
  href: string;
};

export function ScrollToTopLink({ href, onClick, children, ...props }: Props) {
  const pathname = usePathname();

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (pathname === href) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    onClick?.(e);
  }

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
