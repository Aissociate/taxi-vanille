'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const INCIDENT_LABELS: Record<string, string> = {
  accident: '🚨 Accident',
  panne: '🔧 Panne',
  retard: '⏰ Retard',
  passager_refuse: '🚫 Passager refusé',
  securite: '🛡️ Sécurité',
  voie_bloquee: '🚧 Voie bloquée',
  autre: '❓ Autre',
};

export default function IncidentsPage() {
  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => api.get('/incidents').then(r => r.data),
  });

  async function playAudio(incidentId: string) {
    try {
      const { data } = await api.get(`/incidents/${incidentId}/audio`);
      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        toast.error('Aucun audio disponible');
      }
    } catch {
      toast.error('Erreur lors de la récupération de l\'audio');
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Incidents déclarés</h1>

      {isLoading && <div className="text-gray-500">Chargement...</div>}

      <div className="space-y-3">
        {incidents.map((inc: any) => (
          <div key={inc.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-medium text-gray-900">{inc.driver_name}</span>
                  <span className="text-xs text-gray-400">N° {inc.driver_number}</span>
                  <span className="text-xs text-gray-400">
                    {format(new Date(inc.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(inc.types ?? []).map((t: string) => (
                    <span key={t} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                      {INCIDENT_LABELS[t] ?? t}
                    </span>
                  ))}
                </div>
                {inc.notes && <div className="text-sm text-gray-500 mt-2">{inc.notes}</div>}
              </div>
              {inc.has_audio && (
                <button
                  onClick={() => playAudio(inc.id)}
                  className="ml-4 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100"
                >
                  🎙️ Écouter
                </button>
              )}
            </div>
          </div>
        ))}

        {!isLoading && incidents.length === 0 && (
          <div className="text-center py-12 text-gray-400">Aucun incident déclaré</div>
        )}
      </div>
    </div>
  );
}
