'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { logout } from '@/lib/auth';
import { useRouter } from 'next/navigation';

const links = [
  { href: '/dashboard', label: 'Tableau de bord', icon: '📊' },
  { href: '/planning', label: 'Planning', icon: '📅' },
  { href: '/map', label: 'Carte GPS live', icon: '🗺️' },
  { href: '/drivers', label: 'Chauffeurs', icon: '🚕' },
  { href: '/clients', label: 'Clients', icon: '🏢' },
  { href: '/incidents', label: 'Incidents', icon: '⚠️' },
  { href: '/invoices', label: 'Facturation', icon: '📄' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <aside className="w-56 bg-gray-900 text-white flex flex-col h-full shrink-0">
      <div className="px-4 py-5 border-b border-gray-700">
        <div className="font-bold text-lg leading-tight">Taxi Vanille</div>
        <div className="text-xs text-gray-400 mt-0.5">Mayotte</div>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {links.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname.startsWith(href)
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            )}
          >
            <span>{icon}</span>
            {label}
          </Link>
        ))}
      </nav>
      <div className="px-2 py-3 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 transition-colors"
        >
          <span>🚪</span> Déconnexion
        </button>
      </div>
    </aside>
  );
}
