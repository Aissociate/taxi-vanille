'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { logout, decodeToken, AuthUser } from '@/lib/auth';
import Cookies from 'js-cookie';

const NAV = [
  { href: '/dashboard',  label: 'Tableau de bord', icon: '⊞' },
  { href: '/planning',   label: 'Planning',          icon: '◫' },
  { href: '/map',        label: 'Carte temps réel',  icon: '◉', dot: true, badge: '2' },
  { href: '/drivers',    label: 'Chauffeurs',         icon: '◎' },
  { href: '/clients',    label: 'Clients',            icon: '◷' },
  { href: '/invoices',   label: 'Factures',           icon: '◈', badge: '3', directionOnly: true },
  { href: '/rapports',   label: 'Rapports',           icon: '◻' },
  { href: '/incidents',  label: 'Audit log',          icon: '◬' },
  { href: '/users',      label: 'Utilisateurs',       icon: '◑', directionOnly: true },
  { href: '/settings',   label: 'Paramétrage',        icon: '◧' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const token = Cookies.get('access_token');
    if (token) setUser(decodeToken(token));
  }, []);

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
    : 'TV';
  const displayName = user?.full_name ?? 'Utilisateur';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="monogram">TV</div>
        <div>
          <div className="brand-name">Vanille</div>
          <div className="brand-sub">Direction</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV.filter(item => !item.directionOnly || user?.role === 'direction').map(({ href, label, dot, badge }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`nav-item${active ? ' active' : ''}`}>
              {dot && !active && <span className="nav-live-dot" />}
              <span style={{ flex: 1 }}>{label}</span>
              {badge && !active && (
                <span className="nav-badge">{badge}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Search */}
      <div style={{ padding: '0 10px 10px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          border: '1px solid var(--border)', borderRadius: 6,
          padding: '6px 10px', cursor: 'pointer',
          fontSize: 12, color: 'var(--text-3)',
          background: 'var(--surface-2)',
          transition: 'border-color .1s',
        }}>
          <span>Rechercher…</span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9,
            border: '1px solid var(--border)', borderRadius: 3,
            padding: '1px 4px', color: 'var(--text-3)',
          }}>⌘K</span>
        </div>
      </div>

      {/* User */}
      <div style={{
        padding: '10px 14px',
        borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'var(--stone-200)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
          color: 'var(--text-2)', flexShrink: 0,
        }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
            connecté
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Se déconnecter"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '4px 5px', borderRadius: 5,
            color: 'var(--text-3)', fontSize: 14, lineHeight: 1,
            flexShrink: 0,
            transition: 'color .15s, background .15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--danger, #ef4444)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--red-50, #fef2f2)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)'; (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
        >⏻</button>
      </div>

      {/* App chauffeur */}
      <div style={{ padding: '8px 14px 14px', borderTop: '1px solid var(--border)' }}>
        <a href="#" style={{
          fontSize: 11.5, color: 'var(--text-3)', textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 0',
          transition: 'color .1s',
        }}>
          <span style={{ fontSize: 13 }}>↗</span> App chauffeur
        </a>
      </div>
    </aside>
  );
}
