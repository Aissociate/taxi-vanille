'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function ClientsPage() {
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients').then(r => r.data),
  });

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Clients institutionnels</h1>
      {isLoading ? <div className="text-gray-500">Chargement...</div> : (
        <div className="grid gap-4">
          {clients.map((c: any) => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="font-medium text-gray-900">{c.name}</div>
              {c.address && <div className="text-sm text-gray-500 mt-0.5">{c.address}</div>}
              {c.contact_name && (
                <div className="text-sm text-gray-500 mt-1">
                  Contact : {c.contact_name}
                  {c.contact_phone && ` · ${c.contact_phone}`}
                  {c.contact_email && ` · ${c.contact_email}`}
                </div>
              )}
            </div>
          ))}
          {clients.length === 0 && <div className="text-center py-12 text-gray-400">Aucun client</div>}
        </div>
      )}
    </div>
  );
}
