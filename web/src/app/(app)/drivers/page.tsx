'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function DriversPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ driver_number: '', full_name: '', pin: '', phone: '', invoice_period: 'weekly' });

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['drivers', 'all'],
    queryFn: () => api.get('/drivers?active=false').then(r => r.data),
  });

  const create = useMutation({
    mutationFn: (data: typeof form) => api.post('/drivers', data),
    onSuccess: () => {
      toast.success('Chauffeur créé');
      qc.invalidateQueries({ queryKey: ['drivers'] });
      setShowForm(false);
      setForm({ driver_number: '', full_name: '', pin: '', phone: '', invoice_period: 'weekly' });
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Erreur'),
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => api.put(`/drivers/${id}/deactivate`),
    onSuccess: () => { toast.success('Chauffeur désactivé'); qc.invalidateQueries({ queryKey: ['drivers'] }); },
  });

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Chauffeurs</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Nouveau chauffeur
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="font-semibold mb-4">Nouveau chauffeur</h2>
          <div className="grid grid-cols-2 gap-4">
            {[['driver_number', 'N° chauffeur'], ['full_name', 'Nom complet'], ['pin', 'PIN (4-6 chiffres)'], ['phone', 'Téléphone']].map(([k, label]) => (
              <div key={k}>
                <label className="block text-sm text-gray-600 mb-1">{label}</label>
                <input
                  type={k === 'pin' ? 'password' : 'text'}
                  value={(form as any)[k]}
                  onChange={(e) => setForm(f => ({ ...f, [k]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            ))}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Période facturation</label>
              <select
                value={form.invoice_period}
                onChange={(e) => setForm(f => ({ ...f, invoice_period: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuelle</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => create.mutate(form)}
              disabled={create.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              Créer
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-500">Annuler</button>
          </div>
        </div>
      )}

      {isLoading ? <div className="text-gray-500">Chargement...</div> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-white">
              <tr>
                {['N°', 'Nom', 'Téléphone', 'Facturation', 'Statut', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-xs tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {drivers.map((d: any) => (
                <tr key={d.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{d.driver_number}</td>
                  <td className="px-4 py-3">{d.full_name}</td>
                  <td className="px-4 py-3 text-gray-500">{d.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{d.invoice_period === 'weekly' ? 'Hebdo' : 'Mensuel'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {d.active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {d.active && (
                      <button
                        onClick={() => deactivate.mutate(d.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Désactiver
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
