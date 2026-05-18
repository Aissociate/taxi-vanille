'use client';
import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

interface Summary {
  total_trips: number;
  completed_trips: number;
  missed_trips: number;
  delayed_trips: number;
  total_revenue: string;
  avg_revenue_per_trip: string;
  total_passengers: number;
  avg_passengers_per_trip: string;
  avg_passengers_per_day: string;
  incidents: number;
  last_incident: { notes: string; driver_number: string; full_name: string } | null;
  ponctualite: string;
  taux_frequentation: string;
  avg_trip_duration_min: number;
  prev_revenue: string;
  prev_completed: number;
  revenue_delta_pct: string;
  completed_delta: number;
}

interface SparkPoint { date: string; trips: number; revenue: number; }
interface CauseItem  { cause: string; count: number; }
interface DriverRow  { driver_id: string; driver_number: string; full_name: string; trips_count: number; revenue: string; }

interface KpiData {
  period: { from: string; to: string; span_days: number };
  summary: Summary;
  sparkline: SparkPoint[];
  missed_by_cause: CauseItem[];
  by_driver: DriverRow[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

type Period = 'jour' | 'semaine' | 'mois' | 'annee';

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const MONTHS_SHORT = ['Janv','Févr','Mars','Avr','Mai','Juin','Juil','Août','Sept','Oct','Nov','Déc'];
const DAYS_FR   = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
const DAYS_LONG = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];

const FMT = (d: Date) => d.toISOString().split('T')[0];

function getRange(p: Period, customDate?: string): { from: string; to: string } {
  const now = new Date();
  const today = FMT(now);
  if (p === 'jour') {
    const d = customDate ?? today;
    return { from: d, to: d };
  }
  if (p === 'semaine') {
    const day = now.getDay();
    const mon = new Date(now); mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return { from: FMT(mon), to: FMT(sun) };
  }
  if (p === 'mois') {
    return { from: FMT(new Date(now.getFullYear(), now.getMonth(), 1)), to: today };
  }
  return { from: FMT(new Date(now.getFullYear(), 0, 1)), to: today };
}

function getWeekNum(d: Date) {
  const thu = new Date(d); thu.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1) + 3);
  const y = new Date(thu.getFullYear(), 0, 1);
  return Math.ceil(((thu.getTime() - y.getTime()) / 86400000 + 1) / 7);
}

const PERIOD_META: Record<Period, { label: string; labelLong: string; vs: string }> = {
  jour:    { label: 'Journée',  labelLong: 'Journée',  vs: 'J-1' },
  semaine: { label: 'Semaine',  labelLong: 'Semaine',  vs: 'S-1' },
  mois:    { label: 'Mois',     labelLong: 'Mois',     vs: 'M-1' },
  annee:   { label: 'Année',    labelLong: 'Année',    vs: 'A-1' },
};

function fmtDateFR(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return `${DAYS_LONG[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtEuro(v: string | number) {
  return parseFloat(String(v)).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function delta(sign: number, val: string, suffix = '') {
  if (Math.abs(parseFloat(val)) < 0.1) return null;
  const pos = sign > 0 ? parseFloat(val) > 0 : parseFloat(val) < 0;
  return { label: `${parseFloat(val) > 0 ? '+' : ''}${val}${suffix}`, positive: pos };
}

// ── Composants internes ───────────────────────────────────────────────────────

function KpiBlock({ label, value, sub, delta: d, danger }: {
  label: string; value: string; sub?: string;
  delta?: { label: string; positive: boolean } | null; danger?: boolean;
}) {
  return (
    <div style={{
      background: 'var(--surface)', border: `1px solid ${danger ? 'var(--danger)' : 'var(--border)'}`,
      borderRadius: 8, padding: '14px 18px', position: 'relative',
      boxShadow: danger ? '0 0 0 3px rgba(220,38,38,.07)' : 'var(--sh-xs)',
    }}>
      {danger && (
        <span style={{ position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)', animation: 'pulse-ring 1.4s infinite' }} />
      )}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, letterSpacing: '-.03em', color: danger ? 'var(--danger)' : 'var(--text)', marginTop: 6, lineHeight: 1 }}>
        {value}
      </div>
      {(sub || d) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
          {d && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: d.positive ? 'rgba(22,163,74,.10)' : 'rgba(220,38,38,.10)', color: d.positive ? 'var(--success)' : 'var(--danger)' }}>
              {d.label}
            </span>
          )}
          {sub && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{sub}</span>}
        </div>
      )}
    </div>
  );
}

function SparklineChart({ data, height = 80 }: { data: SparkPoint[]; height?: number }) {
  const pts = useMemo(() => {
    if (!data.length) return [];
    const revenues = data.map(d => d.revenue);
    const min = Math.min(...revenues);
    const max = Math.max(...revenues);
    const range = max - min || 1;
    const w = 100 / Math.max(data.length - 1, 1);
    return data.map((d, i) => ({
      x: i * w,
      y: 100 - ((d.revenue - min) / range) * 85 - 7,
      ...d,
    }));
  }, [data]);

  if (!pts.length) {
    return (
      <svg width="100%" height={height} viewBox={`0 0 100 100`} preserveAspectRatio="none">
        <line x1="0" y1="50" x2="100" y2="50" stroke="var(--border)" strokeDasharray="3 3" strokeWidth="0.8" />
      </svg>
    );
  }

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const fillD = pathD + ` L${pts[pts.length - 1].x},100 L0,100 Z`;

  return (
    <svg width="100%" height={height} viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill="url(#sparkGrad)" />
      <path d={pathD} fill="none" stroke="var(--brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="var(--brand)" opacity="0.7" />
      ))}
    </svg>
  );
}

function HBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ height: 10, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width .4s' }} />
    </div>
  );
}

const CAUSE_COLOR: Record<string, string> = {
  'Voiture en panne':    'var(--danger)',
  'Absence chauffeur':   'var(--warn)',
  'Météo / route bloquée': 'var(--info)',
  'Autre':               'var(--stone-400)',
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('semaine');
  const [customDate, setCustomDate] = useState<string>('');

  const todayISO = FMT(new Date());
  const activeDate = period === 'jour' ? (customDate || todayISO) : '';

  useEffect(() => {
    setLoading(true);
    const { from, to } = getRange(period, activeDate || undefined);
    api.get(`/kpi/dashboard?from=${from}&to=${to}`)
      .then(res => setKpi(res.data))
      .catch(() => setKpi(null))
      .finally(() => setLoading(false));
  }, [period, activeDate]);

  const noRealData = !kpi;
  const now = new Date();
  const meta = PERIOD_META[period];

  const eyebrow = period === 'semaine'
    ? `DIRECTION · SEMAINE ${getWeekNum(now)}`
    : period === 'mois'
      ? `DIRECTION · ${MONTHS_SHORT[now.getMonth()].toUpperCase()} ${now.getFullYear()}`
      : period === 'annee'
        ? `DIRECTION · ANNÉE ${now.getFullYear()}`
        : activeDate
          ? `DIRECTION · ${fmtDateFR(activeDate).toUpperCase()}`
          : `DIRECTION · ${DAYS_FR[now.getDay()].toUpperCase()} ${now.getDate()} ${MONTHS_SHORT[now.getMonth()].toUpperCase()}`;

  const maxDriverTrips = kpi ? Math.max(...kpi.by_driver.map(d => Number(d.trips_count)), 1) : 1;
  const maxCause = kpi ? Math.max(...kpi.missed_by_cause.map(c => c.count), 1) : 1;
  const realisationPct = kpi && kpi.summary.total_trips > 0 ? (kpi.summary.completed_trips / kpi.summary.total_trips) * 100 : 0;

  // Labels axe sparkline
  const sparkLabels = kpi && kpi.sparkline.length
    ? kpi.sparkline.map(p => p.date.length === 10 ? DAYS_FR[new Date(p.date).getDay()] : p.date)
    : [];

  const PERIODS: { key: Period; label: string }[] = [
    { key: 'jour', label: 'Jour' },
    { key: 'semaine', label: 'Semaine' },
    { key: 'mois', label: 'Mois' },
    { key: 'annee', label: 'Année' },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Barre de page ── */}
      <div style={{
        padding: '11px 22px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--surface)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
              {eyebrow}
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', letterSpacing: '-.025em', marginTop: 1 }}>
              Tableau de bord KPI
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {PERIODS.map(({ key, label }) => (
            <button key={key} onClick={() => setPeriod(key)}
              className="btn btn-sm"
              style={period === key ? { background: 'var(--text)', color: '#fff', borderColor: 'var(--text)' } : {}}>
              {label}
            </button>
          ))}
          {period === 'jour' && (
            <input
              type="date"
              value={activeDate}
              max={todayISO}
              onChange={e => setCustomDate(e.target.value)}
              style={{
                marginLeft: 4, height: 30, padding: '0 8px', fontSize: 12,
                border: '1px solid var(--border)', borderRadius: 6,
                background: 'var(--surface)', color: 'var(--text)',
                fontFamily: 'var(--font-mono)', cursor: 'pointer',
                outline: 'none',
              }}
            />
          )}
          <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
          <button className="btn btn-sm">Exporter</button>
        </div>
      </div>

      {/* ── Contenu scrollable ── */}
      <div className="scroll" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16, background: 'var(--surface-2)' }}>

        {/* ── Bannière mode réel sans données ── */}
        {noRealData && !loading && (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
            padding: '20px 22px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13,
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
            <div style={{ fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>Aucune donnée pour cette période</div>
            <div style={{ fontSize: 12 }}>Les KPI s'alimenteront au fur et à mesure des courses saisies.</div>
          </div>
        )}

        {/* ── KPI complets (masqués si aucune donnée réelle) ── */}
        {kpi && (() => { const data = kpi; const s = kpi.summary; return <><div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <KpiBlock
            label={`CA · ${meta.label}`}
            value={`${fmtEuro(s.total_revenue)} €`}
            delta={delta(1, s.revenue_delta_pct, ` % vs ${meta.vs}`)}
            sub={`moy. ${fmtEuro(s.avg_revenue_per_trip)} € / trajet`}
          />
          <KpiBlock
            label="Courses réalisées"
            value={String(s.completed_trips)}
            delta={s.completed_delta !== 0 ? { label: `${s.completed_delta > 0 ? '+' : ''}${s.completed_delta} vs ${meta.vs}`, positive: s.completed_delta > 0 } : null}
            sub={`sur ${s.total_trips} planifiées`}
          />
          <KpiBlock
            label="Ponctualité"
            value={`${s.ponctualite} %`}
            sub={`retards >10 mn : ${s.delayed_trips}`}
            delta={parseFloat(s.ponctualite) >= 95
              ? { label: '✓ objectif 95 %', positive: true }
              : { label: `objectif 95 %`, positive: false }}
          />
          <KpiBlock
            label="Incidents ouverts"
            value={String(s.incidents)}
            sub={s.last_incident ? `${s.last_incident.driver_number} · ${s.last_incident.full_name} · ${s.last_incident.notes}` : 'Aucun incident'}
            danger={s.incidents > 0}
          />
        </div>

        {/* ── Ligne 2 : Sparkline + Trajets non effectués ── */}
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '2fr 1fr' }}>

          {/* Sparkline CA */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 18px', boxShadow: 'var(--sh-xs)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>
                  Chiffre d'affaires · {meta.label}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.03em', marginTop: 4 }}>
                  {fmtEuro(s.total_revenue)} €
                </div>
              </div>
              {parseFloat(s.revenue_delta_pct) !== 0 && (
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                  padding: '3px 8px', borderRadius: 4,
                  background: parseFloat(s.revenue_delta_pct) > 0 ? 'rgba(22,163,74,.10)' : 'rgba(220,38,38,.10)',
                  color: parseFloat(s.revenue_delta_pct) > 0 ? 'var(--success)' : 'var(--danger)',
                }}>
                  {parseFloat(s.revenue_delta_pct) > 0 ? '↑' : '↓'} {Math.abs(parseFloat(s.revenue_delta_pct)).toFixed(1)} % vs {meta.vs}
                </span>
              )}
            </div>
            <SparklineChart data={data.sparkline} height={72} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-3)', marginTop: 6 }}>
              {sparkLabels.map((l, i) => <span key={i}>{l}</span>)}
            </div>
          </div>

          {/* Trajets non effectués */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 18px', boxShadow: 'var(--sh-xs)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700, marginBottom: 8 }}>
              Trajets non effectués · {period === 'jour' ? (activeDate ? fmtDateFR(activeDate) : "aujourd'hui") : `${data.period.span_days} j`}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.03em' }}>
                {s.missed_trips}
              </span>
              {s.missed_trips > 0 && data.missed_by_cause[0]?.count > 0 && (
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                  {data.missed_by_cause[0].cause.toLowerCase()} = cause #1
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.missed_by_cause.map(c => (
                <div key={c.cause} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 28px', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11.5, color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.cause}</span>
                  <HBar value={c.count} max={maxCause} color={CAUSE_COLOR[c.cause] ?? 'var(--stone-400)'} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, textAlign: 'right', color: 'var(--text)' }}>{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Ligne 3 : Chauffeurs ── */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 18px', boxShadow: 'var(--sh-xs)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>
              Trajets réalisés par chauffeur · {
                period === 'jour'
                  ? (activeDate ? fmtDateFR(activeDate) : "aujourd'hui")
                  : period === 'semaine'
                    ? `Semaine ${getWeekNum(now)} · ${now.getFullYear()}`
                    : period === 'mois'
                      ? `${MONTHS_FR[now.getMonth()]} ${now.getFullYear()}`
                      : `Année ${now.getFullYear()}`
              }
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-3)' }}>
              top {data.by_driver.length}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {data.by_driver.map(r => (
              <div key={r.driver_id} style={{ display: 'grid', gridTemplateColumns: '200px 1fr 52px', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 700, color: 'var(--brand)', padding: '0 4px', border: '1.5px solid var(--brand)', borderRadius: 3 }}>
                    {r.driver_number}
                  </span>
                  {r.full_name}
                </span>
                <HBar value={Number(r.trips_count)} max={maxDriverTrips} color="var(--text)" />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, textAlign: 'right', color: 'var(--text)' }}>
                  {r.trips_count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Ligne 4 : KPI secondaires ── */}
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <KpiBlock
            label="Trajets théoriques"
            value={String(s.total_trips)}
            sub={s.missed_trips > 0 ? `+ ${s.missed_trips} non eff.` : 'tous effectués'}
          />
          <KpiBlock
            label="Taux réalisation"
            value={`${realisationPct.toFixed(1)} %`}
            sub="objectif 95 %"
            delta={realisationPct >= 95
              ? { label: '✓ atteint', positive: true }
              : { label: `−${(95 - realisationPct).toFixed(1)} pts`, positive: false }}
          />
          <KpiBlock
            label="Voy. moyen / trajet"
            value={s.avg_passengers_per_trip}
            sub="objectif 12,0"
            delta={parseFloat(s.avg_passengers_per_trip) >= 12
              ? { label: '✓ objectif', positive: true }
              : { label: `−${(12 - parseFloat(s.avg_passengers_per_trip)).toFixed(1)}`, positive: false }}
          />
          <KpiBlock
            label={period === 'jour' ? 'Voy. total · journée' : 'Voy. moyen / jour'}
            value={period === 'jour' ? String(s.total_passengers) : s.avg_passengers_per_day}
            sub={period === 'jour' ? 'total voyageurs sur la journée' : `${data.period.span_days} j · période sélectionnée`}
          />
        </div>

        {/* ── Ligne 5 : Fréquentation + Durée trajet ── */}
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(3, 1fr)' }}>

          {/* Taux de fréquentation */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 18px', boxShadow: 'var(--sh-xs)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700, marginBottom: 10 }}>
              Taux de fréquentation
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, letterSpacing: '-.03em', color: 'var(--text)' }}>
                {s.taux_frequentation} %
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>cap. 24 sièges</span>
            </div>
            {/* Jauge */}
            <div style={{ height: 8, background: 'var(--surface-3)', borderRadius: 999, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ width: `${Math.min(parseFloat(s.taux_frequentation), 100)}%`, height: '100%', background: parseFloat(s.taux_frequentation) >= 60 ? 'var(--success)' : parseFloat(s.taux_frequentation) >= 40 ? 'var(--warn)' : 'var(--danger)', borderRadius: 999, transition: 'width .4s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)' }}>
              <span>0 %</span><span>objectif 60 %</span><span>100 %</span>
            </div>
          </div>

          {/* Temps de trajet */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 18px', boxShadow: 'var(--sh-xs)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700, marginBottom: 10 }}>
              Temps de trajet moyen
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, letterSpacing: '-.03em', color: 'var(--text)', marginBottom: 6, lineHeight: 1 }}>
              {s.avg_trip_duration_min > 0
                ? `${s.avg_trip_duration_min} mn`
                : '—'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
              {s.avg_trip_duration_min > 0 ? 'mesuré sur les courses complétées' : 'données insuffisantes'}
            </div>
          </div>

          {/* Taux réalisation visuel */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 18px', boxShadow: 'var(--sh-xs)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700, marginBottom: 10 }}>
              Réalisation vs planifié
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[
                ['Effectuées', s.completed_trips, 'var(--success)'],
                ['Non effectuées', s.missed_trips, 'var(--danger)'],
                ['En retard', s.delayed_trips, 'var(--warn)'],
              ].map(([label, n, c]) => (
                <div key={String(label)} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 36px', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11.5, color: 'var(--text-2)' }}>{label}</span>
                  <HBar value={Number(n)} max={s.total_trips} color={String(c)} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, textAlign: 'right' }}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        </>; })()}

      </div>
    </div>
  );
}
