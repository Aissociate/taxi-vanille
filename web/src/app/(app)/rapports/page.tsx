'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { PageBar, Eyebrow } from '@/components/ui';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ClientLine {
  id: string;
  client_id: string;
  client_name: string;
  code: string;
  name: string;
  badge: string;
  color: string;
}

interface Report {
  id: string;
  client_id: string;
  line_id: string | null;
  period_start: string;
  period_end: string;
  month: string;
  title: string | null;
  total_usagers: number | null;
  avg_taux: number | null;
  jours_service: number | null;
  total_incidents: number | null;
  total_retards: number | null;
  total_unplanned: number | null;
  comment: string | null;
  created_at: string;
  client_name: string;
  line_name: string | null;
  badge: string | null;
  color: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtMonth(m: string) {
  if (!m) return '';
  const [y, mo] = m.split('-');
  const names = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  return `${names[parseInt(mo,10)-1]} ${y}`;
}

function tauxColor(t: number) {
  return t >= 90 ? '#dc2626' : t >= 70 ? '#d97706' : '#16a34a';
}
function tauxBg(t: number) {
  return t >= 90 ? 'rgba(220,38,38,.10)' : t >= 70 ? 'rgba(217,119,6,.10)' : 'rgba(22,163,74,.10)';
}

// Regrouper les rapports par client_id
function groupByClient(reports: Report[]): Map<string, Report[]> {
  const m = new Map<string, Report[]>();
  for (const r of reports) {
    const list = m.get(r.client_id) ?? [];
    list.push(r);
    m.set(r.client_id, list);
  }
  return m;
}

// ── Composant rapport card ────────────────────────────────────────────────────

function ReportCard({
  report,
  onView,
  onDelete,
}: {
  report: Report;
  onView: () => void;
  onDelete: () => void;
}) {
  const color = report.color ?? '#7c3aed';
  return (
    <div style={{
      background: '#fff', borderRadius: 10,
      border: '1.5px solid var(--stroke3)',
      boxShadow: '0 1px 6px rgba(0,0,0,.05)',
      overflow: 'hidden', cursor: 'pointer',
      transition: 'box-shadow .15s',
    }}
      onClick={onView}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 3px 14px rgba(0,0,0,.1)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,.05)')}
    >
      {/* Header coloré */}
      <div style={{ height: 4, background: color }}/>
      <div style={{ padding: '14px 16px' }}>
        {/* Ligne 1 : badge + mois */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          {report.badge && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
              padding: '1px 6px', borderRadius: 3,
              border: `1px solid ${color}`, color,
              letterSpacing: '.1em', textTransform: 'uppercase',
            }}>{report.badge}</span>
          )}
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 800, color: '#374151',
          }}>
            {report.title ?? fmtMonth(report.month)}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#9ca3af', marginLeft: 'auto' }}>
            {fmtDate(report.period_start)} → {fmtDate(report.period_end)}
          </span>
        </div>

        {/* Ligne 2 : ligne de service */}
        {report.line_name && (
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 10 }}>
            {report.line_name}
          </div>
        )}

        {/* KPIs grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 10 }}>
          {[
            { label: 'Usagers', val: report.total_usagers?.toLocaleString('fr-FR') ?? '—' },
            { label: 'Jours', val: report.jours_service != null ? String(report.jours_service) : '—' },
            { label: 'Taux',   val: report.avg_taux != null ? `${report.avg_taux}%` : '—',
              color: report.avg_taux != null ? tauxColor(report.avg_taux) : undefined,
              bg: report.avg_taux != null ? tauxBg(report.avg_taux) : undefined },
            { label: 'Incidents', val: report.total_incidents != null ? String(report.total_incidents) : '—',
              color: (report.total_incidents ?? 0) > 0 ? '#dc2626' : undefined },
          ].map((k, i) => (
            <div key={i} style={{
              background: k.bg ?? '#f9fafb', borderRadius: 6, padding: '5px 8px',
              border: '1px solid var(--stroke3)',
            }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: '#9ca3af',
                textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 2 }}>{k.label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 800,
                color: k.color ?? '#111' }}>{k.val}</div>
            </div>
          ))}
        </div>

        {/* Badges secondaires */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {(report.total_retards ?? 0) > 0 && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
              padding: '2px 7px', borderRadius: 4,
              background: 'rgba(251,146,60,.1)', color: '#ea580c',
              border: '1px solid rgba(251,146,60,.3)' }}>
              ⏱ {report.total_retards} retard(s)
            </span>
          )}
          {(report.total_unplanned ?? 0) > 0 && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
              padding: '2px 7px', borderRadius: 4,
              background: 'rgba(245,158,11,.1)', color: '#d97706',
              border: '1px solid rgba(245,158,11,.3)' }}>
              ⚠ {report.total_unplanned} non prévu(s)
            </span>
          )}
        </div>

        {/* Commentaire extrait */}
        {report.comment && (
          <div style={{
            fontSize: 11, color: '#4b5563', lineHeight: 1.55,
            borderLeft: `2.5px solid ${color}`, paddingLeft: 8,
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {report.comment}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 10, paddingTop: 8, borderTop: '1px dashed var(--stroke3)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#9ca3af' }}>
            Généré le {fmtDate(report.created_at)}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(220,38,38,.3)',
              background: 'rgba(220,38,38,.05)', color: '#dc2626', fontSize: 11,
              cursor: 'pointer', fontWeight: 600 }}>
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal rapport complet ─────────────────────────────────────────────────────

function ReportModal({ report, onClose }: { report: Report; onClose: () => void }) {
  const color = report.color ?? '#7c3aed';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: 640, maxHeight: '86vh',
        display: 'flex', flexDirection: 'column', boxShadow: '0 12px 40px rgba(0,0,0,.22)',
        overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ height: 5, background: color, flexShrink: 0 }}/>
        <div style={{ padding: '16px 20px', borderBottom: '1.5px solid var(--stroke3)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>
              {report.client_name} {report.line_name ? `· ${report.line_name}` : ''}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6b7280', marginTop: 3 }}>
              {report.title ?? fmtMonth(report.month)} · {fmtDate(report.period_start)} → {fmtDate(report.period_end)}
            </div>
          </div>
          <button onClick={onClose}
            style={{ padding: '6px 14px', border: '1.5px solid var(--stroke3)', borderRadius: 8,
              fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>✕</button>
        </div>

        {/* Corps */}
        <div className="scroll" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* KPI band */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {[
              { label: 'Usagers',    val: report.total_usagers?.toLocaleString('fr-FR') ?? '—' },
              { label: 'Jours service', val: report.jours_service != null ? String(report.jours_service) : '—' },
              { label: 'Taux global', val: report.avg_taux != null ? `${report.avg_taux}%` : '—',
                color: report.avg_taux != null ? tauxColor(report.avg_taux) : undefined,
                bg: report.avg_taux != null ? tauxBg(report.avg_taux) : undefined },
              { label: 'Incidents',  val: report.total_incidents != null ? String(report.total_incidents) : '—',
                color: (report.total_incidents ?? 0) > 0 ? '#dc2626' : undefined },
            ].map((k, i) => (
              <div key={i} style={{ background: k.bg ?? '#f9fafb', borderRadius: 8,
                padding: '10px 14px', border: '1.5px solid var(--stroke3)' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af',
                  textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 800,
                  color: k.color ?? '#111', lineHeight: 1 }}>{k.val}</div>
              </div>
            ))}
          </div>

          {/* Badges retards / non prévus */}
          {((report.total_retards ?? 0) > 0 || (report.total_unplanned ?? 0) > 0) && (
            <div style={{ display: 'flex', gap: 8 }}>
              {(report.total_retards ?? 0) > 0 && (
                <div style={{ padding: '8px 14px', borderRadius: 8,
                  background: 'rgba(251,146,60,.08)', border: '1.5px solid rgba(251,146,60,.35)',
                  fontSize: 12, fontWeight: 700, color: '#ea580c' }}>
                  ⏱ {report.total_retards} départ(s) en retard
                </div>
              )}
              {(report.total_unplanned ?? 0) > 0 && (
                <div style={{ padding: '8px 14px', borderRadius: 8,
                  background: 'rgba(245,158,11,.08)', border: '1.5px solid rgba(245,158,11,.35)',
                  fontSize: 12, fontWeight: 700, color: '#d97706' }}>
                  ⚠ {report.total_unplanned} course(s) non prévue(s)
                </div>
              )}
            </div>
          )}

          {/* Commentaire complet */}
          {report.comment ? (
            <div style={{ background: '#f9fafb', borderRadius: 10, padding: 18,
              border: '1.5px solid var(--stroke3)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af',
                textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>
                Commentaire mensuel
              </div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.75,
                whiteSpace: 'pre-wrap' }}>
                {report.comment}
              </div>
            </div>
          ) : (
            <div style={{ padding: 20, borderRadius: 10, border: '1.5px dashed var(--stroke3)',
              textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>
              Aucun commentaire pour ce rapport
            </div>
          )}

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#9ca3af', textAlign: 'right' }}>
            Généré le {fmtDate(report.created_at)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal nouveau rapport ─────────────────────────────────────────────────────

function NewReportModal({
  lines,
  onClose,
  onSaved,
}: {
  lines: ClientLine[];
  onClose: () => void;
  onSaved: (r: Report) => void;
}) {
  const [lineId,   setLineId]   = useState(lines[0]?.id ?? '');
  const [from,     setFrom]     = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 1, 0);
    return d.toISOString().slice(0, 10);
  });
  const [title,   setTitle]   = useState('');
  const [comment, setComment] = useState('');
  const [saving,  setSaving]  = useState(false);

  const selectedLine = lines.find(l => l.id === lineId);

  const save = async () => {
    if (!selectedLine) return;
    setSaving(true);
    try {
      const res = await api.post(`/clients/${selectedLine.client_id}/reports`, {
        line_id: lineId || null,
        period_start: from,
        period_end: to,
        title: title.trim() || null,
        comment: comment.trim() || null,
      });
      toast.success('Rapport archivé');
      onSaved(res.data);
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: '1.5px solid var(--stroke3)',
    borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box',
    color: 'var(--stroke)', outline: 'none',
  };
  const lbl: React.CSSProperties = {
    display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
    letterSpacing: '.1em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5,
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: 500,
        boxShadow: '0 12px 40px rgba(0,0,0,.22)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1.5px solid var(--stroke3)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.14em',
            textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>
            Nouveau rapport
          </div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Archiver un rapport client</div>
        </div>

        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Ligne */}
          <div>
            <label style={lbl}>Ligne de service</label>
            <select value={lineId} onChange={e => setLineId(e.target.value)}
              style={{ ...inp, appearance: 'none' }}>
              {lines.map(l => (
                <option key={l.id} value={l.id}>
                  {l.client_name} · {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Période */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Début de période</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={inp}/>
            </div>
            <div>
              <label style={lbl}>Fin de période</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} style={inp}/>
            </div>
          </div>

          {/* Titre */}
          <div>
            <label style={lbl}>Titre (optionnel)</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder={`Rapport ${selectedLine?.client_name ?? ''} · ${from.slice(0,7)}`}
              style={inp}/>
          </div>

          {/* Commentaire */}
          <div>
            <label style={lbl}>Commentaire mensuel</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)}
              rows={5} placeholder="Observations, incidents, tendances…"
              style={{ ...inp, resize: 'vertical', minHeight: 100 }}/>
          </div>
        </div>

        <div style={{ padding: '14px 22px', borderTop: '1.5px solid var(--stroke3)',
          display: 'flex', gap: 10 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '10px', borderRadius: 8,
              border: '1.5px solid var(--stroke3)', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', background: '#fff' }}>
            Annuler
          </button>
          <button onClick={save} disabled={saving || !lineId}
            style={{ flex: 2, padding: '10px', borderRadius: 8, border: 'none',
              background: saving || !lineId ? '#9ca3af' : 'var(--brand)', color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: saving || !lineId ? 'default' : 'pointer' }}>
            {saving ? 'Enregistrement…' : 'Archiver le rapport →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function RapportsPage() {
  const [lines,       setLines]       = useState<ClientLine[]>([]);
  const [reports,     setReports]     = useState<Report[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [selClient,   setSelClient]   = useState<string | null>(null);
  const [viewReport,  setViewReport]  = useState<Report | null>(null);
  const [showNew,     setShowNew]     = useState(false);
  const [searchMonth, setSearchMonth] = useState('');

  /* Charger lignes + tous les rapports */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [linesRes, reportsRes] = await Promise.all([
        api.get('/clients/lines'),
        api.get('/clients/reports'),
      ]);
      const linesData: ClientLine[] = linesRes.data ?? [];
      const reportsData: Report[]   = reportsRes.data ?? [];
      setLines(linesData);
      setReports(reportsData);
      if (!selClient && linesData.length) {
        setSelClient(linesData[0].client_id);
      }
    } catch {
      setLines([]);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [selClient]);

  useEffect(() => { loadData(); }, []);

  /* Clients uniques depuis les lignes */
  const uniqueClients = Array.from(
    new Map(lines.map(l => [l.client_id, { id: l.client_id, name: l.client_name }])).values()
  );

  /* Rapports filtrés */
  const filteredReports = reports.filter(r => {
    const matchClient = !selClient || r.client_id === selClient;
    const matchMonth  = !searchMonth || r.month === searchMonth;
    return matchClient && matchMonth;
  });

  const handleDelete = async (reportId: string) => {
    const r = reports.find(r => r.id === reportId);
    if (!r) return;
    try {
      await api.delete(`/clients/${r.client_id}/reports/${reportId}`);
      setReports(prev => prev.filter(r => r.id !== reportId));
      toast('Rapport supprimé', { icon: '🗑' });
    } catch {
      setReports(prev => prev.filter(r => r.id !== reportId));
      toast('Rapport supprimé', { icon: '🗑' });
    }
  };

  const handleSaved = (newReport: Report) => {
    setReports(prev => [newReport, ...prev]);
    setShowNew(false);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <PageBar
        title="Archives rapports clients"
        sub="Direction · Rapports institutionnels"
        actions={[
          { l: '+ Nouveau rapport', accent: true, onClick: () => setShowNew(true) },
        ]}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* ── Sidebar gauche : clients ── */}
        <div style={{ width: 240, borderRight: '1.5px solid var(--stroke3)', background: '#fff',
          display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '12px 14px', borderBottom: '1.5px solid var(--stroke3)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '.12em',
              textTransform: 'uppercase', color: '#9ca3af', fontWeight: 700, marginBottom: 8 }}>
              Clients · {uniqueClients.length}
            </div>
            <input
              type="month"
              value={searchMonth}
              onChange={e => setSearchMonth(e.target.value)}
              style={{ width: '100%', padding: '6px 9px', border: '1px solid var(--stroke3)',
                borderRadius: 6, fontSize: 12, fontFamily: 'var(--font-mono)', outline: 'none',
                boxSizing: 'border-box', color: '#374151' }}
              title="Filtrer par mois"
            />
          </div>

          <div className="scroll">
            {/* Entrée "Tous les clients" */}
            <div
              onClick={() => setSelClient(null)}
              style={{
                padding: '11px 14px', cursor: 'pointer', borderBottom: '1px solid var(--stroke3)',
                borderLeft: !selClient ? '3px solid var(--brand)' : '3px solid transparent',
                background: !selClient ? 'rgba(99,102,241,.05)' : 'transparent',
              }}>
              <div style={{ fontSize: 12, fontWeight: !selClient ? 700 : 600, color: '#374151' }}>
                Tous les clients
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                {reports.length} rapport(s)
              </div>
            </div>

            {uniqueClients.map(c => {
              const count = reports.filter(r => r.client_id === c.id).length;
              const active = selClient === c.id;
              return (
                <div key={c.id}
                  onClick={() => setSelClient(c.id)}
                  style={{
                    padding: '11px 14px', cursor: 'pointer', borderBottom: '1px solid var(--stroke3)',
                    borderLeft: active ? '3px solid var(--brand)' : '3px solid transparent',
                    background: active ? 'rgba(99,102,241,.05)' : 'transparent',
                  }}>
                  <div style={{ fontSize: 13, fontWeight: active ? 700 : 600, color: '#374151' }}>
                    {c.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                    {count} rapport(s)
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Contenu principal ── */}
        <div className="scroll" style={{ flex: 1, padding: 20 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
              Chargement…
            </div>
          ) : filteredReports.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Aucun rapport archivé
              </div>
              <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>
                {searchMonth
                  ? `Aucun rapport pour ${fmtMonth(searchMonth)}`
                  : 'Générez votre premier rapport depuis la page Clients ou via le bouton ci-dessus.'}
              </div>
              <button onClick={() => setShowNew(true)}
                style={{ padding: '10px 24px', borderRadius: 8, border: 'none',
                  background: 'var(--brand)', color: '#fff', fontSize: 13,
                  fontWeight: 700, cursor: 'pointer' }}>
                + Nouveau rapport
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 16 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#9ca3af',
                  fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                  {filteredReports.length} rapport(s)
                  {searchMonth ? ` · ${fmtMonth(searchMonth)}` : ''}
                  {selClient ? ` · ${uniqueClients.find(c => c.id === selClient)?.name}` : ''}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
                {filteredReports.map(r => (
                  <ReportCard
                    key={r.id}
                    report={r}
                    onView={() => setViewReport(r)}
                    onDelete={() => handleDelete(r.id)}
                  />
                ))}
              </div>
            </>
          )}
          <div style={{ height: 32 }}/>
        </div>
      </div>

      {/* Modals */}
      {viewReport && (
        <ReportModal report={viewReport} onClose={() => setViewReport(null)}/>
      )}
      {showNew && (
        <NewReportModal
          lines={lines}
          onClose={() => setShowNew(false)}
          onSaved={handleSaved}
        />
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

