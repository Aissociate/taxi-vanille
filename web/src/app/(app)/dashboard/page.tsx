'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="text-2xl font-bold text-blue-600">{value}</div>
      <div className="text-sm font-medium text-gray-700 mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['kpi'],
    queryFn: () => api.get('/kpi/dashboard').then(r => r.data),
  });

  if (isLoading) return <div className="p-8 text-gray-500">Chargement...</div>;

  const s = data?.summary ?? {};

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tableau de bord</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Courses terminées" value={s.completed_trips ?? 0} sub="30 derniers jours" />
        <StatCard label="Chiffre d'affaires" value={`${s.total_revenue ?? 0} €`} sub="30 derniers jours" />
        <StatCard label="Passagers transportés" value={s.total_passengers ?? 0} sub="30 derniers jours" />
        <StatCard label="Prix moyen / course" value={`${s.avg_revenue_per_trip ?? 0} €`} />
        <StatCard label="Incidents déclarés" value={s.incidents ?? 0} sub="30 derniers jours" />
        <StatCard label="Taux complétion" value={s.total_trips ? `${Math.round(s.completed_trips / s.total_trips * 100)}%` : '—'} />
      </div>

      {data?.by_driver?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Courses par chauffeur</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.by_driver}>
              <XAxis dataKey="driver_number" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="trips_count" fill="#0057e7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
