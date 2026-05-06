'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/lib/auth';
import { useRouter } from 'next/navigation';

const links = [
  { href: '/planning', label: 'Planning Gantt', icon: '▦' },
  { href: '/dashboard', label: 'KPI Dashboard', icon: '◈' },
  { href: '/map', label: 'Carte GPS live', icon: '◎', badge: '4' },
  { href: '/drivers', label: 'Chauffeurs', icon: '◉' },
  { href: '/invoices', label: 'Facturation', icon: '◧' },
  { href: '/clients', label: 'Rapports clients', icon: '◫' },
  { href: '/incidents', label: 'Audit log', icon: '◱', alert: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="monogram">TV</div>
        <div>
          <div className="brand-name">Taxi Vanille</div>
          <div className="brand-sub">Direction · Mayotte</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {links.map(({ href, label, icon, badge, alert }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`nav-item${active ? ' active' : ''}${alert && !active ? ' alert-ring' : ''}`}
            >
              <span style={{fontFamily:'var(--font-mono)',fontSize:13,opacity:.75}}>{icon}</span>
              <span>{label}</span>
              {badge && !active && <span className="nav-badge">{badge}</span>}
              {alert && !active && <span className="nav-dot"/>}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-user">
        <b>M. Aubin</b>
        Direction · coordinateur
        <button
          onClick={handleLogout}
          style={{display:'block',marginTop:8,fontSize:11,color:'var(--stroke2)',cursor:'pointer',
            border:'1px solid var(--stroke3)',borderRadius:4,padding:'4px 8px',width:'100%',textAlign:'left',background:'none'}}
        >
          Déconnexion →
        </button>
      </div>
    </aside>
  );
}
