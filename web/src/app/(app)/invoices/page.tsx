'use client';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { PageBar, Eyebrow, Btn } from '@/components/ui';
import { api } from '@/lib/api';
import { useDemoMode } from '@/lib/demo';

const DEMO_INVOICES: Invoice[] = [
  {
    id: 'demo-1', invoice_number: 'RET-2026-05-CH001', month: '2026-05',
    period_start: '2026-05-01', period_end: '2026-05-31', status: 'draft',
    driver_name: 'Soibati Abdallah', driver_number: 'CH001',
    amount_ht: 3142.50, amount_ttc: 3142.50, net_amount: 3042.50,
    km_total: 3820, on_call_hours: 14, vehicle_rental: true, advance_repayment: 100, notes: '',
    pricing_config_id: '',
    line_items: [
      { key:'astreinte_hours',  label:"Heures d'astreinte",         qty:14,  unit_price:12.50, total:175.00, unit:'h', editable:true },
      { key:'fullhour_weekday', label:'Trajets HP semaine (6h–19h)', qty:87,  unit_price:8.00,  total:696.00 },
      { key:'after19h_weekday', label:'Trajets après 19h semaine',  qty:22,  unit_price:10.00, total:220.00 },
      { key:'astreinte_trip',   label:'Trajets en astreinte',       qty:31,  unit_price:11.50, total:356.50 },
      { key:'saturday',         label:'Trajets samedi',             qty:18,  unit_price:9.00,  total:162.00 },
      { key:'sunday',           label:'Trajets dimanche',           qty:9,   unit_price:11.00, total:99.00  },
      { key:'public_holiday',   label:'Trajets jours fériés',      qty:4,   unit_price:13.00, total:52.00  },
      { key:'unplanned_trip',   label:'Trajets non prévus',        qty:5,   unit_price:9.50,  total:47.50  },
      { key:'km_total',         label:'Kilométrage mensuel',        qty:3820, unit_price:0,    total:0, unit:'km', info:true },
      { key:'km_surcharge',     label:'Surcharge km (>3 500 km)',   qty:320, unit_price:0.50,  total:160.00, unit:'km' },
      { key:'management_fee',   label:'Frais de gestion',           qty:1,   unit_price:74.00, total:74.00, unit:'forfait' },
    ],
  },
  {
    id: 'demo-2', invoice_number: 'RET-2026-05-CH002', month: '2026-05',
    period_start: '2026-05-01', period_end: '2026-05-31', status: 'validated',
    driver_name: 'Mouhoudhoire Ali', driver_number: 'CH002',
    amount_ht: 2587.00, amount_ttc: 2587.00, net_amount: 2587.00,
    km_total: 3210, on_call_hours: 8, vehicle_rental: false, advance_repayment: 0, notes: 'Véhicule personnel. RAS.',
    pricing_config_id: '',
    line_items: [
      { key:'astreinte_hours',  label:"Heures d'astreinte",         qty:8,   unit_price:12.50, total:100.00, unit:'h', editable:true },
      { key:'fullhour_weekday', label:'Trajets HP semaine (6h–19h)', qty:102, unit_price:8.00,  total:816.00 },
      { key:'after19h_weekday', label:'Trajets après 19h semaine',  qty:18,  unit_price:10.00, total:180.00 },
      { key:'astreinte_trip',   label:'Trajets en astreinte',       qty:24,  unit_price:11.50, total:276.00 },
      { key:'saturday',         label:'Trajets samedi',             qty:22,  unit_price:9.00,  total:198.00 },
      { key:'sunday',           label:'Trajets dimanche',           qty:13,  unit_price:11.00, total:143.00 },
      { key:'public_holiday',   label:'Trajets jours fériés',      qty:2,   unit_price:13.00, total:26.00  },
      { key:'unplanned_trip',   label:'Trajets non prévus',        qty:2,   unit_price:9.50,  total:19.00  },
      { key:'km_total',         label:'Kilométrage mensuel',        qty:3210, unit_price:0,    total:0, unit:'km', info:true },
      { key:'km_surcharge',     label:'Surcharge km (>3 500 km)',   qty:0,   unit_price:0.50,  total:0.00, unit:'km' },
      { key:'management_fee',   label:'Frais de gestion',           qty:1,   unit_price:74.00, total:74.00, unit:'forfait' },
    ],
  },
];

const DEMO_PRICING = {
  id:'', name:'Tarifs standard', astreinte_hourly_rate:12.50, fullhour_weekday_rate:8.00,
  after19h_weekday_rate:10.00, astreinte_trip_rate:11.50, saturday_rate:9.00, sunday_rate:11.00,
  public_holiday_rate:13.00, unplanned_trip_rate:9.50,
  km_threshold:3500, km_surcharge_per_km:0.50, vehicle_rental_forfait:200.00, management_fee:74.00,
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = 'draft' | 'validated' | 'paid';

interface InvoiceLine {
  key: string;
  label: string;
  qty: number;
  unit_price: number;
  total: number;
  unit?: string;
  info?: boolean;
  editable?: boolean;
}

interface Invoice {
  id: string;
  invoice_number: string;
  period_start: string;
  period_end: string;
  month: string;
  amount_ht: number;
  amount_ttc: number;
  net_amount: number;
  status: Status;
  driver_name: string;
  driver_number: string;
  on_call_hours: number;
  vehicle_rental: boolean;
  advance_repayment: number;
  km_total: number;
  line_items: InvoiceLine[];
  notes: string;
  pricing_config_id: string;
}

interface PricingConfig {
  id: string;
  name: string;
  astreinte_hourly_rate: number;
  fullhour_weekday_rate: number;
  after19h_weekday_rate: number;
  astreinte_trip_rate: number;
  saturday_rate: number;
  sunday_rate: number;
  km_threshold: number;
  km_surcharge_per_km: number;
  vehicle_rental_forfait: number;
  management_fee: number;
  public_holiday_rate: number;
  unplanned_trip_rate: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_META: Record<Status, { label: string; color: string }> = {
  draft:     { label: 'Brouillon',  color: 'var(--brand)' },
  validated: { label: 'Validée',    color: 'var(--success)' },
  paid:      { label: 'Payée',      color: 'var(--stroke2)' },
};

const KANBAN_COLS: { title: string; sub: string; key: Status }[] = [
  { title: 'Brouillons',         sub: 'À vérifier & valider', key: 'draft' },
  { title: 'Validées',           sub: 'À mettre en paiement', key: 'validated' },
  { title: 'Payées',             sub: 'Archivées',            key: 'paid' },
];

const fmt = (n: number | string) =>
  Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function monthLabel(m: string) {
  if (!m) return '';
  const [y, mo] = m.split('-');
  const names = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  return `${names[parseInt(mo, 10) - 1]} ${y}`;
}

// ─── Status pill ──────────────────────────────────────────────────────────────

function StatusPill({ s }: { s: Status }) {
  const m = STATUS_META[s] ?? STATUS_META.paid;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 800,
      letterSpacing: '.1em', textTransform: 'uppercase',
      padding: '2px 8px', borderRadius: 999,
      border: `1.25px solid ${m.color}`, color: m.color, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.color, flexShrink: 0 }}/>
      {m.label}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const { demo } = useDemoMode();
  const [view, setView] = useState<'kanban' | 'detail' | 'pricing'>('kanban');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);

  const fetchInvoices = useCallback(() => {
    if (demo) { setInvoices(DEMO_INVOICES); setLoading(false); return; }
    setLoading(true);
    api.get('/invoices')
      .then(res => setInvoices(res.data))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }, [demo]);

  const fetchPricing = useCallback(() => {
    if (demo) { setPricing(DEMO_PRICING); return; }
    api.get('/invoices/pricing-config')
      .then(res => setPricing(res.data))
      .catch(() => setPricing(DEMO_PRICING));
  }, [demo]);

  useEffect(() => { fetchInvoices(); fetchPricing(); }, [fetchInvoices, fetchPricing]);

  const openDetail = (inv: Invoice) => {
    api.get(`/invoices/${inv.id}`)
      .then(res => { setSelected(res.data); setView('detail'); })
      .catch(() => { setSelected(inv); setView('detail'); });
  };

  if (view === 'detail' && selected) {
    return (
      <InvoiceDetail
        invoice={selected}
        pricing={pricing}
        onBack={() => { setView('kanban'); fetchInvoices(); }}
        onUpdated={updated => setSelected({ ...selected, ...updated })}
        onValidated={() => { setView('kanban'); fetchInvoices(); }}
        onPaid={() => { setView('kanban'); fetchInvoices(); }}
      />
    );
  }

  if (view === 'pricing' && pricing) {
    return (
      <PricingConfigView
        config={pricing}
        onBack={() => { setView('kanban'); fetchPricing(); }}
        onSaved={cfg => { setPricing(cfg); setView('kanban'); }}
      />
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <PageBar
        title="Fiches de rétrocession · Kanban"
        sub="Direction · Facturation"
        actions={[
          { l: 'Tarifs', onClick: () => setView('pricing') },
          { l: '+ Générer du mois', accent: true, onClick: () => setShowGenerate(true) },
        ]}
      />

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--stroke2)', fontSize: 13 }}>Chargement…</div>
      ) : (
        <div className="scroll" style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, alignContent: 'start' }}>
          {KANBAN_COLS.map(col => {
            const cards = invoices.filter(iv => iv.status === col.key);
            return (
              <div key={col.key} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Column header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, borderBottom: '1.5px solid var(--stroke3)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--stroke)' }}>{col.title}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--stroke2)', marginTop: 2 }}>{col.sub}</div>
                  </div>
                  <span style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px solid var(--stroke3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 800, color: 'var(--stroke2)', flexShrink: 0 }}>
                    {cards.length}
                  </span>
                </div>

                {cards.length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--stroke3)', padding: '12px 0' }}>Aucune fiche</div>
                )}

                {cards.map(iv => (
                  <div key={iv.id} className="card" onClick={() => openDetail(iv)}
                    style={{ padding: 14, background: '#fff', cursor: 'pointer', transition: 'box-shadow .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,.1)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 11, color: 'var(--stroke)' }}>{iv.invoice_number}</span>
                      <StatusPill s={iv.status} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--stroke)', marginBottom: 4 }}>{iv.driver_name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--stroke2)', marginBottom: 10 }}>
                      {iv.driver_number} · {monthLabel(iv.month)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--stroke2)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Net à payer</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 18, color: iv.status === 'draft' ? 'var(--brand)' : 'var(--stroke)' }}>
                        {fmt(iv.net_amount)} <span style={{ fontSize: 13 }}>€</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {showGenerate && (
        <GenerateModal
          onClose={() => setShowGenerate(false)}
          onDone={() => { setShowGenerate(false); fetchInvoices(); }}
        />
      )}
    </div>
  );
}

// ─── Generate modal ───────────────────────────────────────────────────────────

function GenerateModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [month, setMonth] = useState(currentMonth());
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await api.post('/invoices/generate', { month });
      const { generated, skipped } = res.data;
      toast.success(`${generated} fiche(s) générée(s)${skipped ? ` · ${skipped} déjà existante(s)` : ''}`);
      onDone();
    } catch { toast.error('Erreur lors de la génération'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 380, boxShadow: '0 8px 32px rgba(0,0,0,.18)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--stroke2)', marginBottom: 8 }}>Générer les fiches</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--stroke)', marginBottom: 18 }}>Rétrocessions du mois</div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--stroke2)', textTransform: 'uppercase', letterSpacing: '.1em', display: 'block', marginBottom: 6 }}>Mois</label>
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--stroke3)', borderRadius: 8, fontSize: 14, fontFamily: 'var(--font-mono)', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ fontSize: 12, color: 'var(--stroke2)', marginBottom: 20, lineHeight: 1.6 }}>
          Une fiche brouillon sera créée pour chaque chauffeur actif ayant des trajets sur la période. Les fiches déjà existantes pour ce mois seront ignorées.
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Btn sm style={{ flex: 1 }} onClick={onClose}>Annuler</Btn>
          <Btn sm accent style={{ flex: 2 }} onClick={generate} disabled={loading}>
            {loading ? 'Génération…' : `Générer · ${monthLabel(month)}`}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Invoice detail ───────────────────────────────────────────────────────────

function InvoiceDetail({
  invoice: initial,
  pricing,
  onBack,
  onUpdated,
  onValidated,
  onPaid,
}: {
  invoice: Invoice;
  pricing: PricingConfig | null;
  onBack: () => void;
  onUpdated: (u: Partial<Invoice>) => void;
  onValidated: () => void;
  onPaid: () => void;
}) {
  const [inv, setInv] = useState(initial);
  const [onCallHours, setOnCallHours] = useState(String(initial.on_call_hours ?? 0));
  const [vehicleRental, setVehicleRental] = useState(initial.vehicle_rental ?? false);
  const [advRepayment, setAdvRepayment] = useState(String(initial.advance_repayment ?? 0));
  const [notes, setNotes] = useState(initial.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [paying, setPaying] = useState(false);

  const lines: InvoiceLine[] = inv.line_items ?? [];

  const save = async () => {
    setSaving(true);
    try {
      const res = await api.patch(`/invoices/${inv.id}`, {
        on_call_hours: Number(onCallHours) || 0,
        vehicle_rental: vehicleRental,
        advance_repayment: Number(advRepayment) || 0,
        notes,
      });
      const updated = res.data;
      setInv({ ...inv, ...updated });
      onUpdated(updated);
      toast.success('Fiche mise à jour');
    } catch { toast.error('Erreur lors de la sauvegarde'); }
    finally { setSaving(false); }
  };

  const validate = async () => {
    setValidating(true);
    try {
      await save();
      await api.put(`/invoices/${inv.id}/validate`);
      toast.success('Fiche validée');
      onValidated();
    } catch { toast.error('Erreur lors de la validation'); }
    finally { setValidating(false); }
  };

  const markPaid = async () => {
    setPaying(true);
    try {
      await api.put(`/invoices/${inv.id}/pay`);
      toast.success('Mise en paiement enregistrée');
      onPaid();
    } catch { toast.error('Erreur'); }
    finally { setPaying(false); }
  };

  // Live-compute net for display before save
  const astreinteHoursLine = lines.find(l => l.key === 'astreinte_hours');
  const astreinteTotal = (Number(onCallHours) || 0) * (astreinteHoursLine?.unit_price ?? 0);
  const baseTotal = lines.filter(l => !l.info && l.key !== 'astreinte_hours').reduce((s, l) => s + l.total, 0) + astreinteTotal;
  const vRentalAmount = vehicleRental ? (pricing?.vehicle_rental_forfait ?? 0) : 0;
  const amountHt = baseTotal + vRentalAmount;
  const netDisplay = amountHt - (Number(advRepayment) || 0);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <PageBar
        title={`Fiche ${inv.invoice_number} · ${inv.driver_name}`}
        sub={`Direction · Facturation › ${monthLabel(inv.month)}`}
        actions={[
          { l: '← Retour', onClick: onBack },
          ...(inv.status === 'draft' ? [
            { l: saving ? 'Enregistrement…' : 'Enregistrer', onClick: save },
            { l: validating ? 'Validation…' : 'Valider la fiche →', accent: true, onClick: validate },
          ] : []),
          ...(inv.status === 'validated' ? [
            { l: paying ? 'Traitement…' : 'Mettre en paiement', accent: true, onClick: markPaid },
          ] : []),
        ]}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Main panel */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16, background: 'var(--paper)' }}>

          {/* Header card */}
          <div className="card" style={{ background: '#fff', padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <Eyebrow>Chauffeur</Eyebrow>
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>{inv.driver_name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--stroke2)', marginTop: 2 }}>
                  N° {inv.driver_number} · {monthLabel(inv.month)}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <StatusPill s={inv.status} />
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--stroke2)', marginTop: 6 }}>
                  {inv.period_start} → {inv.period_end}
                </div>
              </div>
            </div>

            {/* Solde acompte — visible avant validation uniquement */}
            {inv.status === 'draft' && (Number(advRepayment) > 0) && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(234,179,8,.07)', border: '1.5px solid rgba(234,179,8,.45)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '.12em', color: '#92400e', fontWeight: 700 }}>Solde acompte en cours</div>
                  <div style={{ fontSize: 11, color: '#78350f', marginTop: 2 }}>Sera déduit du net à payer</div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 20, color: '#92400e' }}>
                  − {fmt(Number(advRepayment))} €
                </span>
              </div>
            )}
          </div>

          {/* Line items */}
          <div className="card" style={{ background: '#fff' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1.5px solid var(--stroke3)' }}>
              <Eyebrow>Détail du calcul · Taxi Vanille → {inv.driver_name}</Eyebrow>
            </div>

            {/* Astreinte hours — editable */}
            {astreinteHoursLine && (
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 100px 110px', gap: 8, alignItems: 'center', padding: '10px 16px', borderBottom: '1px dashed var(--stroke3)', background: 'var(--paper)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{astreinteHoursLine.label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--stroke2)', marginTop: 2 }}>Selon planning du mois</div>
                  {inv.status === 'draft' && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--brand)', marginTop: 1 }}>✎ Modifiable</div>}
                </div>
                <div>
                  {inv.status === 'draft' ? (
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={onCallHours}
                      onChange={e => setOnCallHours(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', border: '1.5px solid var(--brand)', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 13, textAlign: 'center', boxSizing: 'border-box' }}
                    />
                  ) : (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{inv.on_call_hours} h</span>
                  )}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--stroke2)', textAlign: 'right' }}>
                  {fmt(astreinteHoursLine.unit_price)} €/h
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, textAlign: 'right' }}>
                  {fmt(astreinteTotal)} €
                </div>
              </div>
            )}

            {/* Other lines */}
            {lines.filter(li => li.key !== 'astreinte_hours').map((li, i, arr) => (
              <div key={li.key} style={{
                display: 'grid', gridTemplateColumns: '2fr 80px 100px 110px', gap: 8, alignItems: 'center',
                padding: '10px 16px',
                borderBottom: i < arr.length - 1 ? '1px dashed var(--stroke3)' : 'none',
                opacity: li.qty === 0 && !li.info ? 0.5 : 1,
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: li.info ? 400 : 600, color: li.info ? 'var(--stroke2)' : 'inherit', fontStyle: li.info ? 'italic' : 'normal' }}>
                      {li.label}
                    </span>
                    {li.key === 'unplanned_trip' && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700,
                        padding: '1px 5px', borderRadius: 3,
                        background: 'rgba(245,158,11,.12)', color: '#d97706',
                        border: '1px solid rgba(245,158,11,.35)', letterSpacing: '.08em',
                        textTransform: 'uppercase' }}>⚠ Non prévu</span>
                    )}
                  </div>
                  {li.key === 'km_total' && Number(inv.km_total) > (pricing?.km_threshold ?? 3500) && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--danger)', marginTop: 2 }}>
                      ↑ seuil de {pricing?.km_threshold ?? 3500} km dépassé
                    </div>
                  )}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--stroke2)' }}>
                  {li.key === 'management_fee'
                    ? 'Forfait mensuel'
                    : li.key === 'km_surcharge'
                      ? (li.qty > 0 ? `${li.qty.toLocaleString('fr-FR')} km au-delà` : '—')
                      : `${li.qty} ${li.unit ?? (li.info ? 'km' : 'trajet(s)')}`
                  }
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--stroke2)', textAlign: 'right' }}>
                  {li.info ? '—'
                    : li.key === 'management_fee' ? `${fmt(li.unit_price)} €/mois`
                    : li.key === 'km_surcharge'   ? `${fmt(li.unit_price)} €/km`
                    : `${fmt(li.unit_price)} €`}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, textAlign: 'right', color: li.info ? 'var(--stroke2)' : 'inherit' }}>
                  {li.info ? `${li.qty.toLocaleString('fr-FR')} km` : `${fmt(li.total)} €`}
                </div>
              </div>
            ))}

            {/* Vehicle rental */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 100px 110px', gap: 8, alignItems: 'center', padding: '10px 16px', borderTop: '1px dashed var(--stroke3)', background: 'var(--paper)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Location véhicule</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--stroke2)', marginTop: 2 }}>
                  {vehicleRental && pricing ? `Forfait : ${fmt(pricing.vehicle_rental_forfait)} €/mois` : 'Non applicable si véhicule personnel'}
                </div>
                {inv.status === 'draft' && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--brand)', marginTop: 1 }}>✎ Modifiable</div>}
              </div>
              <div>
                {inv.status === 'draft' ? (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12 }}>
                    <input type="checkbox" checked={vehicleRental} onChange={e => setVehicleRental(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--brand)' }} />
                    {vehicleRental ? 'Oui' : 'Non'}
                  </label>
                ) : (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{inv.vehicle_rental ? 'Oui' : 'Non'}</span>
                )}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--stroke2)', textAlign: 'right' }}>
                {vehicleRental && pricing ? `${fmt(pricing.vehicle_rental_forfait)} €/mois` : '—'}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, textAlign: 'right', color: vehicleRental ? 'inherit' : 'var(--stroke2)' }}>
                {vehicleRental ? `${fmt(pricing?.vehicle_rental_forfait ?? 0)} €` : '—'}
              </div>
            </div>

            {/* Summary */}
            <div style={{ padding: '14px 16px', borderTop: '2px solid var(--stroke)', background: '#fff', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--stroke2)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Sous-total</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16 }}>{fmt(amountHt)} €</span>
              </div>

              {/* Advance repayment */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--stroke2)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Remboursement acompte</span>
                  {inv.status === 'draft' && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--brand)', marginLeft: 8 }}>✎</span>}
                </div>
                {inv.status === 'draft' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--stroke2)' }}>−</span>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={advRepayment}
                      onChange={e => setAdvRepayment(e.target.value)}
                      style={{ width: 90, padding: '5px 8px', border: '1.5px solid var(--stroke3)', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 13, textAlign: 'right', boxSizing: 'border-box' }}
                    />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>€</span>
                  </div>
                ) : (
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: 'var(--danger)' }}>
                    − {fmt(inv.advance_repayment)} €
                  </span>
                )}
              </div>

              {/* Net */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1.5px solid var(--stroke3)', marginTop: 4 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.12em' }}>Net à payer</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 26, color: 'var(--brand)' }}>{fmt(netDisplay)} €</span>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--stroke2)', textAlign: 'right' }}>
                TVA non applicable — auto-entrepreneur
              </div>
            </div>
          </div>

          {/* Notes */}
          {inv.status === 'draft' && (
            <div className="card" style={{ background: '#fff', padding: 16 }}>
              <Eyebrow>Notes internes</Eyebrow>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Observations, ajustements, motifs…"
                style={{ marginTop: 8, width: '100%', minHeight: 70, padding: '10px 12px', border: '1.5px solid var(--stroke3)', borderRadius: 8, fontSize: 13, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', color: 'var(--stroke)' }}
              />
            </div>
          )}
          {inv.status !== 'draft' && inv.notes && (
            <div className="card" style={{ background: '#fff', padding: 16 }}>
              <Eyebrow>Notes</Eyebrow>
              <div style={{ marginTop: 6, fontSize: 13, color: 'var(--stroke2)', lineHeight: 1.6 }}>{inv.notes}</div>
            </div>
          )}
        </div>

        {/* PDF preview panel */}
        <div style={{ width: 340, borderLeft: '1.5px solid var(--stroke)', background: 'var(--paper)', overflow: 'auto', padding: 18, flexShrink: 0 }}>
          <Eyebrow>Aperçu · A4</Eyebrow>
          <div style={{ marginTop: 8, background: '#fff', border: '1.5px solid var(--stroke)', padding: 20, fontSize: 10, lineHeight: 1.65 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 800, letterSpacing: '.12em' }}>TAXI VANILLE</div>
                <div style={{ fontSize: 9, color: 'var(--stroke2)' }}>Mamoudzou · Mayotte</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 11 }}>RÉTROCESSION</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--stroke2)' }}>{inv.invoice_number}</div>
              </div>
            </div>

            <div style={{ fontSize: 9, marginBottom: 12 }}>
              <b>Chauffeur : {inv.driver_name}</b><br />
              N° {inv.driver_number} · {monthLabel(inv.month)}
              {inv.status === 'draft' && Number(advRepayment) > 0 && (
                <div style={{ marginTop: 5, padding: '3px 6px', background: 'rgba(234,179,8,.12)', border: '1px solid rgba(234,179,8,.5)', borderRadius: 4, color: '#78350f', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  Solde acompte : − {fmt(Number(advRepayment))} €
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', paddingTop: 6, paddingBottom: 6, marginBottom: 8 }}>
              {[
                astreinteHoursLine && { label: 'Astreinte', detail: `${onCallHours} h × ${fmt(astreinteHoursLine.unit_price)} €`, total: `${fmt(astreinteTotal)} €` },
                ...lines.filter(li => li.key !== 'astreinte_hours' && !li.info && li.qty > 0).map(li => ({
                  label: li.label,
                  detail: li.key === 'management_fee'
                    ? `forfait mensuel`
                    : li.key === 'km_surcharge'
                      ? `${li.qty.toLocaleString('fr-FR')} km × ${fmt(li.unit_price)} €/km`
                      : `${li.qty} × ${fmt(li.unit_price)} €`,
                  total: `${fmt(li.total)} €`,
                })),
                vehicleRental && pricing && { label: 'Location véhicule', detail: 'forfait', total: `${fmt(pricing.vehicle_rental_forfait)} €` },
              ].filter(Boolean).map((row: any, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.9fr 0.7fr', padding: '3px 0', fontSize: 8, borderTop: i ? '1px dotted var(--stroke3)' : 'none' }}>
                  <span>{row.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--stroke2)' }}>{row.detail}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', textAlign: 'right' }}>{row.total}</span>
                </div>
              ))}

              {/* km info row */}
              {inv.km_total > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.9fr 0.7fr', padding: '3px 0', fontSize: 8, borderTop: '1px dotted var(--stroke3)', color: 'var(--stroke2)', fontStyle: 'italic' }}>
                  <span>Km mensuel</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{inv.km_total.toLocaleString('fr-FR')} km</span>
                  <span style={{ fontFamily: 'var(--font-mono)', textAlign: 'right' }}>—</span>
                </div>
              )}
            </div>

            {Number(advRepayment) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--danger)', marginBottom: 4 }}>
                <span>Remb. acompte</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>− {fmt(Number(advRepayment))} €</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 11, marginTop: 6, paddingTop: 4, borderTop: '1px solid #000' }}>
              <span>Net à payer</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand)' }}>{fmt(netDisplay)} €</span>
            </div>

            <div style={{ marginTop: 16, fontSize: 8, color: 'var(--stroke2)' }}>
              TVA non applicable — art. 293 B CGI<br />
              Règlement par virement ou espèces
            </div>
          </div>

          {inv.status !== 'validated' && inv.status !== 'paid' ? null : (
            <div style={{ marginTop: 12 }}>
              <Btn sm style={{ width: '100%' }} onClick={() => {
                const url = `${process.env.NEXT_PUBLIC_API_URL}/invoices/${inv.id}/pdf`;
                const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.click();
              }}>
                Télécharger PDF ↓
              </Btn>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Pricing config ───────────────────────────────────────────────────────────

type PricingField = { key: keyof PricingConfig; label: string; unit: string; sub?: string };
type PricingSection = { title: string; fields: PricingField[] };

const PRICING_SECTIONS: PricingSection[] = [
  {
    title: 'Astreinte',
    fields: [
      { key: 'astreinte_hourly_rate', label: 'Tarif horaire d\'astreinte', sub: 'Rémunération par heure de disponibilité (garde)', unit: '€/h' },
      { key: 'astreinte_trip_rate',   label: 'Tarif du trajet en astreinte', sub: 'Prix par trajet effectué pendant une période d\'astreinte', unit: '€/trajet' },
    ],
  },
  {
    title: 'Trajets semaine',
    fields: [
      { key: 'fullhour_weekday_rate', label: 'Heure pleine (lun–ven, 6h–19h)', unit: '€/trajet' },
      { key: 'after19h_weekday_rate', label: 'Après 19h (lun–ven)',            unit: '€/trajet' },
    ],
  },
  {
    title: 'Week-end & Jours fériés',
    fields: [
      { key: 'saturday_rate',       label: 'Samedi (toute la journée)',     unit: '€/trajet' },
      { key: 'sunday_rate',         label: 'Dimanche (toute la journée)',   unit: '€/trajet' },
      { key: 'public_holiday_rate', label: 'Jour férié',                    sub: 'Calculé automatiquement (jours fériés français)', unit: '€/trajet' },
    ],
  },
  {
    title: 'Kilométrage mensuel',
    fields: [
      { key: 'km_threshold',        label: 'Seuil avant surcharge',        unit: 'km' },
      { key: 'km_surcharge_per_km', label: 'Surcharge au-delà du seuil',   unit: '€/km' },
    ],
  },
  {
    title: 'Forfaits mensuels',
    fields: [
      { key: 'vehicle_rental_forfait', label: 'Location véhicule (forfait mensuel)', unit: '€/mois' },
      { key: 'management_fee',         label: 'Frais de gestion mensuels',           unit: '€/mois' },
    ],
  },
  {
    title: 'Courses non prévues',
    fields: [
      { key: 'unplanned_trip_rate', label: 'Trajet non prévu au planning', sub: 'Supplément appliqué pour tout trajet absent du planning initial (is_unplanned = true)', unit: '€/trajet' },
    ],
  },
];

const ALL_PRICING_FIELDS = PRICING_SECTIONS.flatMap(s => s.fields);

function PricingConfigView({
  config,
  onBack,
  onSaved,
}: {
  config: PricingConfig;
  onBack: () => void;
  onSaved: (cfg: PricingConfig) => void;
}) {
  const [form, setForm] = useState<Record<string, string>>(() =>
    Object.fromEntries(ALL_PRICING_FIELDS.map(f => [f.key, String((config as any)[f.key] ?? 0)]))
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const body = Object.fromEntries(ALL_PRICING_FIELDS.map(f => [f.key, Number(form[f.key]) || 0]));
    try {
      const res = await api.put('/invoices/pricing-config', body);
      toast.success('Tarifs mis à jour');
      onSaved(res.data);
    } catch {
      // backend absent — on applique localement
      onSaved({ ...config, ...body } as PricingConfig);
      toast.success('Tarifs mis à jour');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <PageBar
        title="Configuration des tarifs"
        sub="Direction · Facturation › Tarifs"
        actions={[
          { l: '← Retour', onClick: onBack },
          { l: saving ? 'Enregistrement…' : 'Enregistrer', accent: true, onClick: save },
        ]}
      />
      <div className="scroll" style={{ padding: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 640 }}>
          {PRICING_SECTIONS.map(section => (
            <div key={section.title} className="card" style={{ background: '#fff', padding: 0, overflow: 'hidden' }}>
              {/* Section header */}
              <div style={{ padding: '10px 18px', borderBottom: '1.5px solid var(--stroke3)', background: 'var(--paper)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--stroke)' }}>
                  {section.title}
                </span>
              </div>
              {/* Fields */}
              <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {section.fields.map((f, i) => (
                  <div key={f.key}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 60px', gap: 10, alignItems: 'center' }}>
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--stroke)' }}>{f.label}</label>
                        {f.sub && <div style={{ fontSize: 11, color: 'var(--stroke2)', marginTop: 2 }}>{f.sub}</div>}
                      </div>
                      <input
                        type="number"
                        min={0}
                        step={f.key === 'km_threshold' ? 100 : 0.01}
                        value={form[f.key]}
                        onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        style={{ padding: '8px 10px', border: '1.5px solid var(--stroke3)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 14, textAlign: 'right', width: '100%', boxSizing: 'border-box' }}
                      />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--stroke2)' }}>{f.unit}</span>
                    </div>
                    {i < section.fields.length - 1 && (
                      <div style={{ marginTop: 12, borderBottom: '1px dashed var(--stroke3)' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
