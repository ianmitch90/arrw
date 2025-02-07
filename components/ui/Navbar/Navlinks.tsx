'use client';

import Link from 'next/link';
import { SignOut } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { Logo } from '@/components/icons/Logo';
import { usePathname, useRouter } from 'next/navigation';
import { getRedirectMethod } from '@/utils/auth-helpers/settings';
import s from './Navbar.module.css';
import { Button } from '@nextui-org/react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType;
}

interface NavlinksProps {
  items: NavItem[];
  user?: any;
}

export default function Navlinks({ items, user }: NavlinksProps) {
  const router = useRouter();
  const pathname = usePathname();
  const shouldUseRouter = getRedirectMethod() === 'client';

  return (
    <div className="relative flex flex-row justify-between py-4 align-center md:py-6">
      <div className="flex items-center flex-1">
        <Link href="/" className={s.logo} aria-label="Logo">
          <Logo />
        </Link>
        <nav className="ml-6 space-x-2 lg:block">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className={s.link}>
              {item.name}
            </Link>
          ))}
          {user && (
            <Link href="/account" className={s.link}>
              Account
            </Link>
          )}
        </nav>
      </div>
      <div className="flex justify-end space-x-8">
        {user ? (
          <form onSubmit={(e) => handleRequest(e, SignOut, router)}>
            <input type="hidden" name="pathName" value={pathname} />
            <Button type="submit" className={s.link}>
              Sign out
            </Button>
          </form>
        ) : (
          <Link href="/signin" className={s.link}>
            Sign In
          </Link>
        )}
      </div>
    </div>
  );
}
