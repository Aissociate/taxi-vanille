'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const STATUS_LABELS: Record<string, string> = {
  planned: 'Planifié',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
};

export default function PlanningPage() {
  const qc = useQueryClient();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [replacing, setReplacing] = useState<string | null>(null);
  const [newDriverId, setNewDriverId] = useState('');

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['planning', date],
    queryFn: () => api.get(`/planning?date=${date}`).then(r => r.data),
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => api.get('/drivers').then(r => r.data),
  });

  const replace = useMutation({
    mutationFn: ({ tripId, driverId }: { tripId: string; driverId: string }) =>
      api.put(`/planning/${tripId}/driver`, { driver_id: driverId }),
    onSuccess: () => {
      toast.success('Chauffeur remplacé');
      qc.invalidateQueries({ queryKey: ['planning'] });
      setReplacing(null);
    },
    onError: () => toast.error('Erreur lors du remplacement'),
  });

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Planning</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {isLoading && <div className="text-gray-500">Chargement...</div>}

      <div className="space-y-3">
        {trips.map((trip: any) => (
          <div key={trip.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[trip.status]}`}>
                    {STATUS_LABELS[trip.status]}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {format(new Date(trip.scheduled_at), 'HH:mm', { locale: fr })}
                  </span>
                  {trip.client_name && (
                    <span className="text-sm text-gray-500">· {trip.client_name}</span>
                  )}
                </div>
                <div className="text-sm text-gray-700">
                  Chauffeur : <span className="font-medium">{trip.driver_name ?? '—'}</span>
                  {trip.driver_number && <span className="text-gray-400 ml-1">(N° {trip.driver_number})</span>}
                </div>
                {trip.amount && (
                  <div className="text-sm text-gray-500 mt-0.5">{trip.amount} €</div>
                )}
              </div>
              <div className="flex gap-2">
                {trip.status === 'planned' && (
                  <button
                    onClick={() => { setReplacing(trip.id); setNewDriverId(''); }}
                    className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors"
                  >
                    Remplacer
                  </button>
                )}
              </div>
            </div>

            {replacing === trip.id && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
                <select
                  value={newDriverId}
                  onChange={(e) => setNewDriverId(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Sélectionner un chauffeur</option>
                  {drivers.filter((d: any) => d.id !== trip.driver_id).map((d: any) => (
                    <option key={d.id} value={d.id}>{d.full_name} (N° {d.driver_number})</option>
                  ))}
                </select>
                <button
                  disabled={!newDriverId || replace.isPending}
                  onClick={() => replace.mutate({ tripId: trip.id, driverId: newDriverId })}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                >
                  Confirmer
                </button>
                <button
                  onClick={() => setReplacing(null)}
                  className="text-gray-400 hover:text-gray-600 text-sm px-2"
                >
                  Annuler
                </button>
              </div>
            )}
          </div>
        ))}

        {!isLoading && trips.length === 0 && (
          <div className="text-center py-12 text-gray-400">Aucun trajet pour cette date</div>
        )}
      </div>
    </div>
  );
}
