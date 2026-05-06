'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/dashboard',  label: 'Tableau de bord' },
  { href: '/planning',   label: 'Planning' },
  { href: '/map',        label: 'Carte temps réel', dot: true, badge: '2' },
  { href: '/drivers',    label: 'Chauffeurs' },
  { href: '/clients',    label: 'Clients' },
  { href: '/invoices',   label: 'Factures',          badge: '3' },
  { href: '/rapports',   label: 'Rapports' },
  { href: '/incidents',  label: 'Audit log' },
  { href: '/settings',   label: 'Paramétrage' },
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
              {dot && !active && <span className="nav-live-dot"/>}
              <span style={{flex:1}}>{label}</span>
              {badge && !active && (
                <span style={{
                  fontFamily:'var(--font-mono)',fontSize:10,fontWeight:700,
                  background:'var(--danger)',color:'#fff',
                  borderRadius:999,padding:'1px 6px',minWidth:18,textAlign:'center',
                }}>{badge}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Search */}
      <div style={{padding:'0 12px 10px'}}>
        <div style={{
          display:'flex',alignItems:'center',justifyContent:'space-between',
          border:'1px solid var(--stroke3)',borderRadius:6,
          padding:'7px 10px',cursor:'pointer',fontSize:12,color:'var(--stroke2)',
        }}>
          <span>⌕ Recherche</span>
          <span style={{fontFamily:'var(--font-mono)',fontSize:9,
            border:'1px solid var(--stroke3)',borderRadius:3,padding:'1px 5px',color:'var(--stroke3)'}}>
            Ctrl+k
          </span>
        </div>
      </div>

      {/* User */}
      <div className="sidebar-user">
        <b>M. Aubin</b>
        <div style={{fontSize:11,color:'var(--stroke2)',marginTop:1}}>Direction · connecté</div>
      </div>

      {/* App chauffeur link */}
      <div style={{padding:'8px 16px 16px',borderTop:'1px solid var(--stroke3)'}}>
        <a href="#" style={{fontSize:11,color:'var(--stroke2)',textDecoration:'none',display:'flex',alignItems:'center',gap:6}}>
          <span style={{fontSize:12}}>🖥</span> App chauffeur
        </a>
      </div>
    </aside>
  );
}
