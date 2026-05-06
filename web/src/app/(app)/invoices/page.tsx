'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const STATUS_LABELS = { draft: 'Brouillon', validated: 'Validée', paid: 'Payée' };
const STATUS_COLORS = {
  draft: 'bg-yellow-100 text-yellow-700',
  validated: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
};

export default function InvoicesPage() {
  const qc = useQueryClient();
  const [generating, setGenerating] = useState(false);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.get('/invoices').then(r => r.data),
  });

  const generate = useMutation({
    mutationFn: () => api.post('/invoices/generate', { period: 'weekly', date: new Date().toISOString() }),
    onSuccess: (r) => {
      toast.success(`${r.data.generated} facture(s) générée(s)`);
      qc.invalidateQueries({ queryKey: ['invoices'] });
      setGenerating(false);
    },
    onError: () => toast.error('Erreur lors de la génération'),
  });

  const validate = useMutation({
    mutationFn: (id: string) => api.put(`/invoices/${id}/validate`),
    onSuccess: () => { toast.success('Facture validée'); qc.invalidateQueries({ queryKey: ['invoices'] }); },
  });

  const markPaid = useMutation({
    mutationFn: (id: string) => api.put(`/invoices/${id}/pay`),
    onSuccess: () => { toast.success('Facture marquée payée'); qc.invalidateQueries({ queryKey: ['invoices'] }); },
  });

  function downloadPdf(id: string, num: string) {
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${id}/pdf`, '_blank');
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Facturation</h1>
        <button
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {generate.isPending ? 'Génération...' : '⚡ Générer factures semaine'}
        </button>
      </div>

      {isLoading ? <div className="text-gray-500">Chargement...</div> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-white">
              <tr>
                {['N° facture', 'Chauffeur', 'Période', 'Montant TTC', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-xs tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv: any) => (
                <tr key={inv.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-medium text-blue-600">{inv.invoice_number}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{inv.driver_name}</div>
                    <div className="text-gray-400 text-xs">N° {inv.driver_number}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {format(new Date(inv.period_start), 'dd MMM', { locale: fr })} → {format(new Date(inv.period_end), 'dd MMM yyyy', { locale: fr })}
                  </td>
                  <td className="px-4 py-3 font-medium">{parseFloat(inv.amount_ttc).toFixed(2)} €</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${(STATUS_COLORS as any)[inv.status]}`}>
                      {(STATUS_LABELS as any)[inv.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => downloadPdf(inv.id, inv.invoice_number)} className="text-xs text-gray-500 hover:text-gray-700">PDF</button>
                      {inv.status === 'draft' && (
                        <button onClick={() => validate.mutate(inv.id)} className="text-xs text-blue-600 hover:text-blue-800">Valider</button>
                      )}
                      {inv.status === 'validated' && (
                        <button onClick={() => markPaid.mutate(inv.id)} className="text-xs text-green-600 hover:text-green-800">Payer</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {invoices.length === 0 && (
            <div className="text-center py-12 text-gray-400">Aucune facture</div>
          )}
        </div>
      )}
    </div>
  );
}
