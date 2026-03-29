'use client';

// Bottom navigation bar for mobile — persistent across pages

import { usePathname, useRouter } from 'next/navigation';

const tabs = [
  { path: '/', label: 'Machines', icon: '⬡' },
  { path: '/auto', label: 'Auto', icon: '⚡' },
  { path: '/settings', label: 'Settings', icon: '⚙' },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide nav on terminal session pages (full screen)
  if (pathname.startsWith('/session/')) return null;

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 'var(--nav-height)',
      paddingBottom: 'var(--safe-bottom)',
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 50,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    }}>
      {tabs.map((tab) => {
        const active = tab.path === '/'
          ? pathname === '/' || pathname.startsWith('/machine/')
          : pathname.startsWith(tab.path);

        return (
          <button
            key={tab.path}
            onClick={() => router.push(tab.path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              padding: '6px 0',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: active ? 'var(--accent)' : 'var(--text-muted)',
              transition: 'color 0.15s ease',
            }}
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>{tab.icon}</span>
            <span style={{ fontSize: '10px', fontWeight: active ? 600 : 400 }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
