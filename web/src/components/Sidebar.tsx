'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/dashboard',  label: 'Tableau de bord', icon: '⊞' },
  { href: '/planning',   label: 'Planning',          icon: '◫' },
  { href: '/map',        label: 'Carte temps réel',  icon: '◉', dot: true, badge: '2' },
  { href: '/drivers',    label: 'Chauffeurs',         icon: '◎' },
  { href: '/clients',    label: 'Clients',            icon: '◷' },
  { href: '/invoices',   label: 'Factures',           icon: '◈', badge: '3' },
  { href: '/rapports',   label: 'Rapports',           icon: '◻' },
  { href: '/incidents',  label: 'Audit log',          icon: '◬' },
  { href: '/settings',   label: 'Paramétrage',        icon: '◧' },
];

export function Sidebar() {
  const pathname = usePathname();

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
        {NAV.map(({ href, label, dot, badge }) => {
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
        }}>MA</div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>M. Aubin</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
            connecté
          </div>
        </div>
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
