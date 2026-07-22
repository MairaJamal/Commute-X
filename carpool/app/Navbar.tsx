'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { name: 'Home', href: '/' },
    { name: 'Sign up / Login', href: '/signup-login' },
    { name: 'My Profile', href: '/profile' },
    { name: 'Request a Commute', href: '/create-request' },
    { name: 'AI Matches', href: '/matches' },
    { name: 'Match Profile', href: '/match-detail' },
    { name: 'Chat', href: '/chat' },
    { name: 'Fare Split', href: '/fare-split' },
    { name: 'Confirmation', href: '/confirmation' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Safety', href: '/safety' },
  ];

  const handleLogout = async () => {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    }).catch(() => {});
    router.push('/signup-login');
    router.refresh();
  };

  return (
    <div className="appbar">
      <div className="appbar-inner">
        <Link href="/" className="logo text-white no-underline">
          <span className="logo-dot"></span>
          CommuteX
        </Link>
        <div className="tabs">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`tab ${isActive ? 'active' : ''}`}
                id={`nav-${tab.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              >
                {tab.name}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="tab"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            type="button"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
