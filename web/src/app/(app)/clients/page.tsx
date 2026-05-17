'use client';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';
import { useDemoMode } from '@/lib/demo';

/* ═══════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════ */
type Period = 'jour' | 'semaine' | 'mois' | 'custom';
type ReportTab = 'journee' | 'matin' | 'aprem' | 'samedis' | 'dimanches';

interface DailyRow {
  date: string;
  jour: string;
  usagers: number;
  usagers_matin: number;
  usagers_am: number;
  taux: number;
  taux_matin: number;
  taux_am: number;
  incidents: number;
  retards: number;   // départs > seuil configurable (défaut 10 mn)
  unplanned: number; // courses non prévues au planning initial
}

interface DirStats {
  duration_min: number;   // durée navette en minutes
  avg_pax:      number;   // passagers moyens / bus (déclarés chauffeurs)
  nb_vehicles:  number;   // nb véhicules en service ce sens
  vehicle_seats: number;  // nb places par véhicule
  nb_trips_day: number;   // nb rotations par jour par véhicule (en général 1)
}

interface ClientDef {
  id: string;
  nom: string;
  ligne: string;
  sub: string;
  badge: string;
  color: string;
  data: DailyRow[];
  dir_matin_a: string;
  dir_matin_r: string;
  dir_am_a: string;
  dir_am_r: string;
  taux_matin_a: number;
  taux_matin_r: number;
  taux_am_a: number;
  taux_am_r: number;
  // Stats enrichies par direction (depuis v_direction_stats)
  stats_matin_a: DirStats;
  stats_matin_r: DirStats;
  stats_am_a:    DirStats;
  stats_am_r:    DirStats;
}

/* ═══════════════════════════════════════════════════════════════
   API HELPERS
═══════════════════════════════════════════════════════════════ */
const JOURS_ABR = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];

/** Convertit une ligne `client_daily_stats` (API) en DailyRow UI */
function apiToDailyRow(r: Record<string,unknown>): DailyRow {
  const d = new Date(r.date as string);
  return {
    date:          r.date as string,
    jour:          JOURS_ABR[d.getDay()],
    usagers:       Number(r.usagers        ?? 0),
    usagers_matin: Number(r.usagers_matin  ?? 0),
    usagers_am:    Number(r.usagers_am     ?? 0),
    taux:          Number(r.taux           ?? 0),
    taux_matin:    Number(r.taux_matin     ?? 0),
    taux_am:       Number(r.taux_am        ?? 0),
    incidents:     Number(r.incidents_count ?? r.incidents ?? 0),
    retards:       Number(r.retards_count   ?? r.retards   ?? 0),
    unplanned:     Number(r.unplanned_trips ?? r.unplanned ?? 0),
  };
}

/** Convertit la réponse `/direction-stats` en quatre DirStats */
function apiToDirStats(raw: Record<string,unknown>, fb: ClientDef): Pick<ClientDef,'stats_matin_a'|'stats_matin_r'|'stats_am_a'|'stats_am_r'> {
  const map = (key: string, fb2: DirStats): DirStats => {
    const s = raw[key] as Record<string,unknown> | undefined;
    if (!s) return fb2;
    return {
      duration_min:  Number(s.duration_min  ?? s.avg_duration_min ?? fb2.duration_min),
      avg_pax:       Number(s.avg_pax       ?? s.avg_pax_per_trip ?? fb2.avg_pax),
      nb_vehicles:   Number(s.nb_vehicles   ?? s.nb_drivers       ?? fb2.nb_vehicles),
      vehicle_seats: Number(s.vehicle_seats ?? fb2.vehicle_seats),
      nb_trips_day:  Number(s.nb_trips_day  ?? s.nb_trips         ?? fb2.nb_trips_day),
    };
  };
  return {
    stats_matin_a: map('matin_aller',  fb.stats_matin_a),
    stats_matin_r: map('matin_retour', fb.stats_matin_r),
    stats_am_a:    map('am_aller',     fb.stats_am_a),
    stats_am_r:    map('am_retour',    fb.stats_am_r),
  };
}

/* ═══════════════════════════════════════════════════════════════
   DEMO DATA — CADEMA Ligne 4 (Mars 2026)
═══════════════════════════════════════════════════════════════ */
const L4: DailyRow[] = [
  { date:'2026-03-01', jour:'Dim', usagers:112,  usagers_matin:68,  usagers_am:44,  taux:28, taux_matin:34,  taux_am:22, incidents:0, retards:0, unplanned:0 },
  { date:'2026-03-02', jour:'Lun', usagers:534,  usagers_matin:298, usagers_am:236, taux:82, taux_matin:92,  taux_am:72, incidents:0, retards:2, unplanned:1 },
  { date:'2026-03-03', jour:'Mar', usagers:521,  usagers_matin:290, usagers_am:231, taux:80, taux_matin:90,  taux_am:71, incidents:1, retards:1, unplanned:0 },
  { date:'2026-03-04', jour:'Mer', usagers:548,  usagers_matin:308, usagers_am:240, taux:84, taux_matin:95,  taux_am:74, incidents:0, retards:0, unplanned:1 },
  { date:'2026-03-05', jour:'Jeu', usagers:562,  usagers_matin:315, usagers_am:247, taux:86, taux_matin:97,  taux_am:76, incidents:0, retards:1, unplanned:0 },
  { date:'2026-03-06', jour:'Ven', usagers:578,  usagers_matin:322, usagers_am:256, taux:89, taux_matin:99,  taux_am:79, incidents:0, retards:3, unplanned:2 },
  { date:'2026-03-07', jour:'Sam', usagers:284,  usagers_matin:168, usagers_am:116, taux:56, taux_matin:66,  taux_am:46, incidents:0, retards:0, unplanned:1 },
  { date:'2026-03-08', jour:'Dim', usagers:98,   usagers_matin:58,  usagers_am:40,  taux:24, taux_matin:29,  taux_am:20, incidents:0, retards:0, unplanned:0 },
  { date:'2026-03-09', jour:'Lun', usagers:541,  usagers_matin:302, usagers_am:239, taux:83, taux_matin:93,  taux_am:73, incidents:0, retards:1, unplanned:0 },
  { date:'2026-03-10', jour:'Mar', usagers:556,  usagers_matin:311, usagers_am:245, taux:85, taux_matin:96,  taux_am:75, incidents:0, retards:2, unplanned:1 },
  { date:'2026-03-11', jour:'Mer', usagers:544,  usagers_matin:304, usagers_am:240, taux:84, taux_matin:94,  taux_am:74, incidents:1, retards:0, unplanned:0 },
  { date:'2026-03-12', jour:'Jeu', usagers:568,  usagers_matin:318, usagers_am:250, taux:87, taux_matin:98,  taux_am:77, incidents:0, retards:1, unplanned:1 },
  { date:'2026-03-13', jour:'Ven', usagers:571,  usagers_matin:319, usagers_am:252, taux:88, taux_matin:98,  taux_am:77, incidents:0, retards:2, unplanned:0 },
  { date:'2026-03-14', jour:'Sam', usagers:271,  usagers_matin:159, usagers_am:112, taux:54, taux_matin:63,  taux_am:44, incidents:0, retards:1, unplanned:2 },
  { date:'2026-03-15', jour:'Dim', usagers:104,  usagers_matin:62,  usagers_am:42,  taux:26, taux_matin:31,  taux_am:21, incidents:0, retards:0, unplanned:0 },
  { date:'2026-03-16', jour:'Lun', usagers:537,  usagers_matin:300, usagers_am:237, taux:82, taux_matin:92,  taux_am:73, incidents:0, retards:0, unplanned:1 },
  { date:'2026-03-17', jour:'Mar', usagers:549,  usagers_matin:307, usagers_am:242, taux:84, taux_matin:94,  taux_am:74, incidents:0, retards:1, unplanned:0 },
  { date:'2026-03-18', jour:'Mer', usagers:561,  usagers_matin:314, usagers_am:247, taux:86, taux_matin:97,  taux_am:76, incidents:0, retards:2, unplanned:0 },
  { date:'2026-03-19', jour:'Jeu', usagers:555,  usagers_matin:310, usagers_am:245, taux:85, taux_matin:95,  taux_am:75, incidents:1, retards:1, unplanned:1 },
  { date:'2026-03-20', jour:'Ven', usagers:574,  usagers_matin:321, usagers_am:253, taux:88, taux_matin:99,  taux_am:78, incidents:0, retards:3, unplanned:1 },
  { date:'2026-03-21', jour:'Sam', usagers:268,  usagers_matin:156, usagers_am:112, taux:53, taux_matin:62,  taux_am:44, incidents:0, retards:0, unplanned:2 },
  { date:'2026-03-22', jour:'Dim', usagers:91,   usagers_matin:54,  usagers_am:37,  taux:22, taux_matin:27,  taux_am:18, incidents:0, retards:0, unplanned:0 },
  { date:'2026-03-23', jour:'Lun', usagers:543,  usagers_matin:304, usagers_am:239, taux:83, taux_matin:94,  taux_am:73, incidents:0, retards:1, unplanned:0 },
  { date:'2026-03-24', jour:'Mar', usagers:558,  usagers_matin:312, usagers_am:246, taux:86, taux_matin:96,  taux_am:76, incidents:0, retards:0, unplanned:1 },
  { date:'2026-03-25', jour:'Mer', usagers:565,  usagers_matin:316, usagers_am:249, taux:87, taux_matin:97,  taux_am:77, incidents:0, retards:2, unplanned:0 },
  { date:'2026-03-26', jour:'Jeu', usagers:572,  usagers_matin:320, usagers_am:252, taux:88, taux_matin:98,  taux_am:77, incidents:0, retards:1, unplanned:0 },
  { date:'2026-03-27', jour:'Ven', usagers:581,  usagers_matin:325, usagers_am:256, taux:89, taux_matin:100, taux_am:79, incidents:0, retards:4, unplanned:2 },
  { date:'2026-03-28', jour:'Sam', usagers:276,  usagers_matin:162, usagers_am:114, taux:55, taux_matin:64,  taux_am:45, incidents:1, retards:1, unplanned:1 },
  { date:'2026-03-29', jour:'Dim', usagers:108,  usagers_matin:64,  usagers_am:44,  taux:27, taux_matin:32,  taux_am:22, incidents:0, retards:0, unplanned:0 },
  { date:'2026-03-30', jour:'Lun', usagers:548,  usagers_matin:307, usagers_am:241, taux:84, taux_matin:95,  taux_am:74, incidents:0, retards:2, unplanned:1 },
  { date:'2026-03-31', jour:'Mar', usagers:562,  usagers_matin:314, usagers_am:248, taux:86, taux_matin:97,  taux_am:76, incidents:0, retards:1, unplanned:0 },
];

const L3: DailyRow[] = L4.map(r => ({
  ...r,
  usagers:        Math.round(r.usagers        * 1.28),
  usagers_matin:  Math.round(r.usagers_matin  * 1.30),
  usagers_am:     Math.round(r.usagers_am     * 1.25),
  taux:           Math.min(99, Math.round(r.taux       * 1.08)),
  taux_matin:     Math.min(100,Math.round(r.taux_matin * 1.06)),
  taux_am:        Math.min(99, Math.round(r.taux_am    * 1.10)),
}));

const CHM: DailyRow[] = L4.map(r => ({
  ...r,
  usagers:        Math.round(r.usagers        * 0.54),
  usagers_matin:  Math.round(r.usagers_matin  * 0.55),
  usagers_am:     Math.round(r.usagers_am     * 0.53),
  taux:           Math.max(20, Math.round(r.taux       * 0.78)),
  taux_matin:     Math.max(20, Math.round(r.taux_matin * 0.76)),
  taux_am:        Math.max(15, Math.round(r.taux_am    * 0.80)),
}));

const CLIENTS: ClientDef[] = [
  {
    id: 'l3', nom: 'CADEMA', ligne: 'Ligne 3', color: '#2563eb',
    sub: 'Doujani ↔ Passot Barge · 14 chauffeurs', badge: 'AO',
    data: L3,
    dir_matin_a: 'Doujani → Barge', dir_matin_r: 'Barge → Doujani',
    dir_am_a:   'Barge → Doujani',  dir_am_r:   'Doujani → Barge',
    taux_matin_a: 97, taux_matin_r: 51, taux_am_a: 86, taux_am_r: 58,
    stats_matin_a: { duration_min: 48, avg_pax: 51, nb_vehicles: 7, vehicle_seats: 55, nb_trips_day: 1 },
    stats_matin_r: { duration_min: 44, avg_pax: 49, nb_vehicles: 7, vehicle_seats: 55, nb_trips_day: 1 },
    stats_am_a:    { duration_min: 47, avg_pax: 41, nb_vehicles: 7, vehicle_seats: 55, nb_trips_day: 1 },
    stats_am_r:    { duration_min: 51, avg_pax: 39, nb_vehicles: 7, vehicle_seats: 55, nb_trips_day: 1 },
  },
  {
    id: 'l4', nom: 'CADEMA', ligne: 'Ligne 4', color: '#7c3aed',
    sub: 'Vahibe ↔ Passamainty (PEM) · 14 chauffeurs', badge: 'AO',
    data: L4,
    dir_matin_a: 'Vahibe → PEM', dir_matin_r: 'PEM → Vahibe',
    dir_am_a:   'PEM → Vahibe', dir_am_r:   'Vahibe → PEM',
    taux_matin_a: 97, taux_matin_r: 43, taux_am_a: 79, taux_am_r: 45,
    stats_matin_a: { duration_min: 42, avg_pax: 49, nb_vehicles: 6, vehicle_seats: 55, nb_trips_day: 1 },
    stats_matin_r: { duration_min: 38, avg_pax: 47, nb_vehicles: 6, vehicle_seats: 55, nb_trips_day: 1 },
    stats_am_a:    { duration_min: 41, avg_pax: 39, nb_vehicles: 6, vehicle_seats: 55, nb_trips_day: 1 },
    stats_am_r:    { duration_min: 45, avg_pax: 37, nb_vehicles: 6, vehicle_seats: 55, nb_trips_day: 1 },
  },
  {
    id: 'chm', nom: 'CHM', ligne: 'Petite-Terre', color: '#059669',
    sub: 'CHM ↔ La Barge · 13 arrêts · 8 chauffeurs', badge: 'MARCHÉ',
    data: CHM,
    dir_matin_a: 'CHM → La Barge', dir_matin_r: 'La Barge → CHM',
    dir_am_a:   'La Barge → CHM', dir_am_r:   'CHM → La Barge',
    taux_matin_a: 72, taux_matin_r: 38, taux_am_a: 61, taux_am_r: 41,
    stats_matin_a: { duration_min: 22, avg_pax: 38, nb_vehicles: 4, vehicle_seats: 45, nb_trips_day: 1 },
    stats_matin_r: { duration_min: 20, avg_pax: 36, nb_vehicles: 4, vehicle_seats: 45, nb_trips_day: 1 },
    stats_am_a:    { duration_min: 21, avg_pax: 29, nb_vehicles: 4, vehicle_seats: 45, nb_trips_day: 1 },
    stats_am_r:    { duration_min: 23, avg_pax: 27, nb_vehicles: 4, vehicle_seats: 45, nb_trips_day: 1 },
  },
];

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */
const fmtN = (n: number) => n.toLocaleString('fr-FR');
const avg  = (arr: number[]) =>
  arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

function tauxColor(t: number) {
  return t >= 90 ? '#dc2626' : t >= 70 ? '#d97706' : '#16a34a';
}
function tauxBg(t: number) {
  return t >= 90 ? 'rgba(220,38,38,.10)' : t >= 70 ? 'rgba(217,119,6,.10)' : 'rgba(22,163,74,.10)';
}

function filterRows(rows: DailyRow[], tab: ReportTab): DailyRow[] {
  if (tab === 'samedis')   return rows.filter(r => r.jour === 'Sam');
  if (tab === 'dimanches') return rows.filter(r => r.jour === 'Dim');
  return rows.filter(r => r.jour !== 'Sam' && r.jour !== 'Dim');
}

function getDateRange(period: Period, cf: string, ct: string) {
  const today = new Date();
  if (period === 'jour') {
    const d = today.toISOString().split('T')[0];
    return { from: d, to: d };
  }
  if (period === 'semaine') {
    const d = new Date(today);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const from = d.toISOString().split('T')[0];
    d.setDate(d.getDate() + 6);
    return { from, to: d.toISOString().split('T')[0] };
  }
  if (period === 'mois') {
    const y = today.getFullYear(), m = today.getMonth();
    return {
      from: `${y}-${String(m+1).padStart(2,'0')}-01`,
      to: new Date(y, m+1, 0).toISOString().split('T')[0],
    };
  }
  return { from: cf || '2026-03-01', to: ct || '2026-03-31' };
}

/* ═══════════════════════════════════════════════════════════════
   SVG CHARTS
═══════════════════════════════════════════════════════════════ */
function MiniSparkline({ data, color = '#7c3aed' }: { data: number[], color?: string }) {
  if (data.length < 2) return null;
  const W = 80, H = 28, p = 2;
  const min = Math.min(...data), range = (Math.max(...data) - min) || 1;
  const pts = data.map((v, i) => {
    const x = p + (i / (data.length - 1)) * (W - p * 2);
    const y = H - p - ((v - min) / range) * (H - p * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={W} height={H} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5}
        strokeLinejoin="round" strokeLinecap="round" opacity={0.75} />
    </svg>
  );
}

function LineChart({ values, labels, color = '#7c3aed' }: {
  values: number[], labels: string[], color?: string
}) {
  if (values.length < 2) return (
    <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#9ca3af', fontSize: 12 }}>Données insuffisantes</div>
  );
  const W = 560, H = 110, pL = 32, pR = 8, pT = 8, pB = 22;
  const iW = W - pL - pR, iH = H - pT - pB;
  const xi = (i: number) => pL + (i / (values.length - 1)) * iW;
  const yv = (v: number) => pT + iH - (Math.max(0, Math.min(100, v)) / 100) * iH;
  const pts = values.map((v, i) => `${xi(i).toFixed(1)},${yv(v).toFixed(1)}`).join(' ');
  const area = `M${xi(0).toFixed(1)},${yv(values[0]).toFixed(1)} ` +
    values.map((v, i) => `L${xi(i).toFixed(1)},${yv(v).toFixed(1)}`).join(' ') +
    ` L${xi(values.length-1).toFixed(1)},${H-pB} L${xi(0).toFixed(1)},${H-pB} Z`;
  const tick = Math.max(1, Math.ceil(values.length / 8));
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`lg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity={0.18}/>
          <stop offset="100%" stopColor={color} stopOpacity={0}/>
        </linearGradient>
      </defs>
      {[25,50,70,90].map(v => (
        <g key={v}>
          <line x1={pL} x2={W-pR} y1={yv(v)} y2={yv(v)}
            stroke={v===70?'#d97706':v===90?'#dc2626':'#e5e7eb'}
            strokeWidth={v===70||v===90?1:0.5}
            strokeDasharray={v===70||v===90?'4,3':undefined}/>
          <text x={pL-4} y={yv(v)+4} textAnchor="end" fontSize={8} fill="#9ca3af">{v}%</text>
        </g>
      ))}
      <path d={area} fill={`url(#lg-${color.replace('#','')})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8}
        strokeLinejoin="round" strokeLinecap="round"/>
      {values.map((v, i) => v >= 90 && (
        <circle key={i} cx={xi(i)} cy={yv(v)} r={3} fill="#dc2626"/>
      ))}
      {labels.map((l, i) => i % tick === 0 && (
        <text key={i} x={xi(i)} y={H-4} textAnchor="middle" fontSize={8} fill="#9ca3af">{l}</text>
      ))}
    </svg>
  );
}

function DualLineChart({ v1, v2, labels, color1='#7c3aed', color2='#f59e0b', l1, l2 }: {
  v1: number[], v2: number[], labels: string[],
  color1?: string, color2?: string, l1: string, l2: string
}) {
  if (v1.length < 2) return null;
  const W = 560, H = 110, pL = 32, pR = 8, pT = 18, pB = 22;
  const iW = W-pL-pR, iH = H-pT-pB;
  const xi = (i: number) => pL + (i / (v1.length-1)) * iW;
  const yv = (v: number) => pT + iH - (Math.max(0,Math.min(100,v))/100) * iH;
  const pts1 = v1.map((v,i) => `${xi(i).toFixed(1)},${yv(v).toFixed(1)}`).join(' ');
  const pts2 = v2.map((v,i) => `${xi(i).toFixed(1)},${yv(v).toFixed(1)}`).join(' ');
  const tick = Math.max(1, Math.ceil(labels.length / 8));
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      {[25,50,75].map(v=>(
        <line key={v} x1={pL} x2={W-pR} y1={yv(v)} y2={yv(v)} stroke="#f3f4f6" strokeWidth={0.5}/>
      ))}
      <polyline points={pts1} fill="none" stroke={color1} strokeWidth={2} strokeLinejoin="round"/>
      <polyline points={pts2} fill="none" stroke={color2} strokeWidth={2} strokeLinejoin="round" strokeDasharray="5,3"/>
      {labels.map((l,i) => i%tick===0 && (
        <text key={i} x={xi(i)} y={H-4} textAnchor="middle" fontSize={8} fill="#9ca3af">{l}</text>
      ))}
      <rect x={pL}    y={4} width={8} height={3} fill={color1} rx={1}/>
      <text x={pL+11} y={8} fontSize={8} fill="#374151" fontWeight={500}>{l1}</text>
      <rect x={pL+80} y={4} width={8} height={3} fill={color2} rx={1}/>
      <text x={pL+91} y={8} fontSize={8} fill="#374151" fontWeight={500}>{l2}</text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAUX PILL
═══════════════════════════════════════════════════════════════ */
function TauxPill({ value }: { value: number }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '2px 8px', borderRadius: 999,
      background: tauxBg(value), color: tauxColor(value),
      fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap',
    }}>
      {value >= 90 && '⚡'}{value}%
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AI MODAL — rendered via portal at document.body
═══════════════════════════════════════════════════════════════ */
const OR_MODELS = [
  { id: 'anthropic/claude-haiku-4-5',           label: 'Claude Haiku 4.5 (rapide)' },
  { id: 'anthropic/claude-sonnet-4-5',          label: 'Claude Sonnet 4.5' },
  { id: 'openai/gpt-4o',                        label: 'GPT-4o' },
  { id: 'openai/gpt-4o-mini',                   label: 'GPT-4o Mini (rapide)' },
  { id: 'google/gemini-1.5-pro',                label: 'Gemini 1.5 Pro' },
  { id: 'mistralai/mistral-large-2407',          label: 'Mistral Large' },
  { id: 'meta-llama/llama-3.1-70b-instruct',    label: 'Llama 3.1 70B' },
];

function AIModal({ client, rows, onClose, onResult }: {
  client: ClientDef, rows: DailyRow[],
  onClose: () => void, onResult: (t: string) => void,
}) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [prompt, setPrompt]   = useState('');
  const [model, setModel]     = useState(OR_MODELS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('settings_ia') || '{}');
      setSettings(s);
      // Valider que le modèle sauvegardé existe encore dans la liste
      const validModel = OR_MODELS.find(m => m.id === s.model);
      setModel(validModel ? s.model : OR_MODELS[0].id);
      if (s.system_prompt) setPrompt(s.system_prompt);
      else setPrompt(`Tu es un expert en transport en commun. Rédige un commentaire de rapport mensuel professionnel, synthétique et en français. Sois précis, factuel, mentionne les points forts, risques de saturation et recommandations opérationnelles.`);
    } catch {
      setModel(OR_MODELS[0].id);
      setPrompt(`Tu es un expert en transport en commun. Rédige un commentaire de rapport mensuel professionnel.`);
    }
  }, []);

  const totalUsagers = rows.reduce((a, r) => a + r.usagers, 0);
  const avgTaux      = avg(rows.map(r => r.taux));
  const joursService = rows.length;
  const satJours     = rows.filter(r => r.taux >= 90).length;

  async function generate() {
    if (!settings.api_key) {
      setError('Clé API manquante — configurez-la dans Paramètres › IA & Rapports');
      return;
    }
    setLoading(true); setError('');
    const userMsg = `Rapport ${client.nom} ${client.ligne} — Mars 2026\nJours: ${joursService} · Usagers: ${fmtN(totalUsagers)} · Taux moyen: ${avgTaux}% · Saturation: ${satJours}j\nMatin aller (${client.dir_matin_a}): ${client.taux_matin_a}% · Matin retour: ${client.taux_matin_r}%\nAM aller (${client.dir_am_a}): ${client.taux_am_a}% · AM retour: ${client.taux_am_r}%\n\nRédige un commentaire mensuel (3-4 paragraphes).`;
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.api_key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://taxivanille.app',
          'X-Title': 'Taxi Vanille - Rapports',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: prompt },
            { role: 'user',   content: userMsg },
          ],
          max_tokens: 600,
        }),
      });
      // Lire le corps JSON même en cas d'erreur (OpenRouter y met le détail)
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error?.message || data?.message || `Erreur HTTP ${res.status}`;
        throw new Error(msg);
      }
      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error('Réponse vide — vérifiez votre quota OpenRouter');
      onResult(text);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur réseau');
    } finally { setLoading(false); }
  }

  const modal = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,.50)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, width: 540,
          maxHeight: '88vh', overflow: 'auto',
          boxShadow: '0 24px 64px rgba(0,0,0,.25)',
        }}
      >
        {/* header */}
        <div style={{ padding: '20px 24px 14px', borderBottom: '1.5px solid var(--stroke3)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase',
              letterSpacing: '.1em', color: '#9ca3af', marginBottom: 3 }}>Génération IA</div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>Commentaire mensuel</div>
          </div>
          <button onClick={onClose}
            style={{ fontSize: 20, color: '#9ca3af', padding: '4px 8px', lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* model */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Modèle</div>
            <select value={model} onChange={e => setModel(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--stroke3)',
                borderRadius: 8, fontSize: 13 }}>
              {OR_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>

          {/* system prompt */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
              Prompt système <span style={{ fontWeight: 400, color: '#9ca3af' }}>(personnalisable)</span>
            </div>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={5}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--stroke3)',
                borderRadius: 8, fontSize: 12, resize: 'vertical', fontFamily: 'inherit',
                lineHeight: 1.6, boxSizing: 'border-box' }}/>
          </div>

          {/* context */}
          <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px',
            border: '1px solid var(--stroke3)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase',
              letterSpacing: '.08em', marginBottom: 5 }}>Données envoyées</div>
            <div style={{ fontSize: 11, color: '#374151', fontFamily: 'var(--font-mono)', lineHeight: 1.8 }}>
              {joursService} jours · {fmtN(totalUsagers)} usagers · taux {avgTaux}% · {satJours}j saturation
            </div>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(220,38,38,.07)',
              border: '1.5px solid rgba(220,38,38,.3)', borderRadius: 8,
              fontSize: 13, color: '#dc2626' }}>{error}</div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={onClose}
              style={{ padding: '9px 20px', borderRadius: 8, border: '1.5px solid var(--stroke3)',
                fontSize: 13, fontWeight: 600, color: '#374151' }}>Annuler</button>
            <button onClick={generate} disabled={loading}
              style={{ padding: '9px 22px', borderRadius: 8, border: 'none',
                background: loading ? '#9ca3af' : 'var(--brand)', color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8 }}>
              {loading
                ? <><span style={{display:'inline-block',animation:'spin 1s linear infinite'}}>⟳</span> Génération…</>
                : '✦ Générer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : null;
}

/* ═══════════════════════════════════════════════════════════════
   CLIENT REPORT
═══════════════════════════════════════════════════════════════ */
const REPORT_TABS: { key: ReportTab, label: string }[] = [
  { key: 'journee',   label: 'Journée' },
  { key: 'matin',     label: 'Matin' },
  { key: 'aprem',     label: 'Après-midi' },
  { key: 'samedis',   label: 'Samedis' },
  { key: 'dimanches', label: 'Dimanches' },
];

function ClientReport({ client, range, onBack }: {
  client: ClientDef;
  range: { from: string; to: string };
  onBack: () => void;
}) {
  const [tab,          setTab]          = useState<ReportTab>('journee');
  const [overrides,    setOverrides]    = useState<Record<string, Record<string, number>>>({});
  const [comment,      setComment]      = useState('');
  const [showAI,       setShowAI]       = useState(false);
  const [editingCell,  setEditingCell]  = useState<{date:string, field:string}|null>(null);
  const [cellVal,      setCellVal]      = useState('');
  const [liveRows,     setLiveRows]     = useState<DailyRow[] | null>(null);
  const [liveStats,    setLiveStats]    = useState<Pick<ClientDef,'stats_matin_a'|'stats_matin_r'|'stats_am_a'|'stats_am_r'> | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [saveState,    setSaveState]    = useState<'idle'|'saving'|'saved'|'error'>('idle');

  /* ── Fetch stats journalières ── */
  useEffect(() => {
    setStatsLoading(true);
    setLiveRows(null);
    setOverrides({});
    api.get(`/clients/${client.id}/daily-stats`, { params: { from: range.from, to: range.to } })
      .then(res => {
        const rows: DailyRow[] = (res.data as Record<string,unknown>[]).map(apiToDailyRow);
        setLiveRows(rows.length ? rows : null);
      })
      .catch(() => { /* garde client.data statique */ })
      .finally(() => setStatsLoading(false));
  }, [client.id, range.from, range.to]);

  /* ── Fetch stats direction ── */
  useEffect(() => {
    api.get(`/clients/${client.id}/direction-stats`, { params: { from: range.from, to: range.to } })
      .then(res => setLiveStats(apiToDirStats(res.data as Record<string,unknown>, client)))
      .catch(() => { /* garde client.stats_* statiques */ });
  }, [client.id, range.from, range.to]);

  /* Données effectives : live si disponible, sinon demo */
  const allRows = liveRows ?? client.data;
  const effStats = liveStats ?? {
    stats_matin_a: client.stats_matin_a,
    stats_matin_r: client.stats_matin_r,
    stats_am_a:    client.stats_am_a,
    stats_am_r:    client.stats_am_r,
  };

  const baseRows = useMemo(() => filterRows(allRows, tab), [allRows, tab]);
  const rows = useMemo(() =>
    baseRows.map(r => ({ ...r, ...(overrides[r.date] || {}) })),
    [baseRows, overrides]
  );

  const totalUsagers  = rows.reduce((a, r) => a + r.usagers, 0);
  const avgTauxGlobal = avg(rows.map(r => r.taux));
  const avgTauxMatin  = avg(rows.map(r => r.taux_matin));
  const avgTauxAm     = avg(rows.map(r => r.taux_am));
  const joursService  = rows.length;
  const satJours      = rows.filter(r => r.taux >= 90).length;
  const incidents     = rows.reduce((a, r) => a + r.incidents, 0);
  const totalRetards  = rows.reduce((a, r) => a + (r.retards ?? 0), 0);
  const totalUnplanned = rows.reduce((a, r) => a + (r.unplanned ?? 0), 0);
  const hasOverrides  = Object.keys(overrides).length > 0;

  const EDITABLE_FIELDS = ['usagers_matin','usagers_am','usagers','taux_matin','taux_am','taux'] as const;
  // Champs recalculés automatiquement (non saisissables directement)
  const AUTO_FIELDS = new Set(['usagers', 'taux']);

  function startEdit(row: DailyRow, field: string) {
    // usagers et taux sont dérivés — on redirige vers les champs sources
    if (field === 'usagers') {
      // Ouvre simultanément usagers_matin (premier champ source utile)
      setEditingCell({ date: row.date, field: 'usagers_matin' });
      setCellVal(String((row as unknown as Record<string,number>)['usagers_matin'] ?? ''));
      return;
    }
    if (field === 'taux') {
      setEditingCell({ date: row.date, field: 'taux_matin' });
      setCellVal(String((row as unknown as Record<string,number>)['taux_matin'] ?? ''));
      return;
    }
    setEditingCell({ date: row.date, field });
    setCellVal(String((row as unknown as Record<string,number>)[field] ?? ''));
  }

  function commitEdit() {
    if (!editingCell) return;
    const num = parseFloat(cellVal);
    if (!isNaN(num)) {
      setOverrides(prev => {
        const dateOverrides = { ...(prev[editingCell.date] || {}) };
        dateOverrides[editingCell.field] = num;

        // ── Cascade automatique ────────────────────────────────────
        // Trouver la ligne de base pour avoir les valeurs actuelles
        const baseRow = baseRows.find(r => r.date === editingCell.date);
        const merged = baseRow ? { ...baseRow, ...dateOverrides } : dateOverrides;

        if (editingCell.field === 'usagers_matin' || editingCell.field === 'usagers_am') {
          // Total usagers = matin + am
          const matin = Number(merged['usagers_matin'] ?? 0);
          const am    = Number(merged['usagers_am']    ?? 0);
          dateOverrides['usagers'] = matin + am;
        }

        if (editingCell.field === 'taux_matin' || editingCell.field === 'taux_am') {
          // Taux global = moyenne arrondie des deux demi-journées
          const tm = Number(merged['taux_matin'] ?? 0);
          const ta = Number(merged['taux_am']    ?? 0);
          dateOverrides['taux'] = Math.round((tm + ta) / 2);
        }
        // ─────────────────────────────────────────────────────────

        return { ...prev, [editingCell.date]: dateOverrides };
      });
    }
    setEditingCell(null);
  }
  const resetOverrides = useCallback(() => setOverrides({}), []);

  async function saveReport() {
    setSaveState('saving');
    try {
      await api.post(`/clients/${client.id}/reports`, {
        period_start:    range.from,
        period_end:      range.to,
        title:           `${client.nom} — ${client.ligne}`,
        total_usagers:   totalUsagers,
        avg_taux:        avgTauxGlobal,
        jours_service:   joursService,
        total_incidents: incidents,
        total_retards:   totalRetards,
        total_unplanned: totalUnplanned,
        comment:         comment || null,
        snapshot: {
          rows:        allRows,
          dir_stats:   effStats,
          generated_at: new Date().toISOString(),
        },
      });
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 3000);
    } catch {
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 4000);
    }
  }

  const chartVals = rows.map(r => tab === 'matin' ? r.taux_matin : tab === 'aprem' ? r.taux_am : r.taux);
  const chartLabels = rows.map(r => r.date.slice(8));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--paper)' }}>
      {/* ── header ── */}
      <div style={{ padding: '12px 24px', borderBottom: '1.5px solid var(--stroke3)',
        background: '#fff', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={onBack}
          style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid var(--stroke3)',
            fontSize: 13, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Retour
        </button>
        <div style={{ width: 4, height: 32, borderRadius: 2, background: client.color, flexShrink: 0 }}/>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 17, fontWeight: 800 }}>{client.nom} — {client.ligne}</span>
            {statsLoading && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--brand)',
                display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
                Chargement…
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>
            {range.from === range.to ? range.from : `${range.from} → ${range.to}`} · {client.sub}
          </div>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
          border: `1.5px solid ${client.color}`, borderRadius: 999, padding: '3px 10px',
          color: client.color }}>{client.badge}</span>
      </div>

      {/* ── KPI band ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)',
        borderBottom: '1.5px solid var(--stroke3)', background: '#fff', flexShrink: 0 }}>
        {[
          { label: 'Usagers total',    val: fmtN(totalUsagers) },
          { label: 'Jours service',    val: String(joursService) },
          { label: 'Taux global',      val: `${avgTauxGlobal}%`, col: tauxColor(avgTauxGlobal) },
          { label: 'Taux matin',       val: `${avgTauxMatin}%`,  col: tauxColor(avgTauxMatin)  },
          { label: 'Taux après-midi',  val: `${avgTauxAm}%`,     col: tauxColor(avgTauxAm)     },
          { label: 'Jours saturation', val: `${satJours}j`,      col: satJours > 3 ? '#dc2626' : '#374151' },
        ].map((k, i) => (
          <div key={i} style={{ padding: '12px 16px', borderRight: i < 5 ? '1px solid var(--stroke3)' : 'none' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase',
              letterSpacing: '.1em', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 19, fontWeight: 800,
              color: k.col || '#111' }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* ── direction bar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
        borderBottom: '1.5px solid var(--stroke3)', background: '#fafafa', flexShrink: 0 }}>
        {([
          { label: 'Matin aller',  dir: client.dir_matin_a, taux: client.taux_matin_a, st: effStats.stats_matin_a },
          { label: 'Matin retour', dir: client.dir_matin_r, taux: client.taux_matin_r, st: effStats.stats_matin_r },
          { label: 'AM aller',     dir: client.dir_am_a,    taux: client.taux_am_a,    st: effStats.stats_am_a    },
          { label: 'AM retour',    dir: client.dir_am_r,    taux: client.taux_am_r,    st: effStats.stats_am_r    },
        ] as Array<{ label: string; dir: string; taux: number; st: DirStats }>).map((d, i) => {
          const capMax = d.st.nb_vehicles * d.st.vehicle_seats * d.st.nb_trips_day;
          const tauxCalc = capMax > 0 ? Math.round((d.st.avg_pax / d.st.vehicle_seats) * 100) : d.taux;
          return (
            <div key={i} style={{ padding: '11px 14px', borderRight: i < 3 ? '1px solid var(--stroke3)' : 'none' }}>
              {/* Ligne 1 : label + taux */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 9, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '.08em' }}>{d.label}</div>
                <TauxPill value={d.taux}/>
              </div>
              {/* Ligne 2 : itinéraire */}
              <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 8,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.dir}</div>
              {/* Grille métriques 2×2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 8px' }}>
                {/* Temps navette */}
                <div style={{ background: '#fff', borderRadius: 6, padding: '6px 8px',
                  border: '1px solid var(--stroke3)' }}>
                  <div style={{ fontSize: 8, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '.06em', marginBottom: 2 }}>Temps navette</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 800, color: '#374151' }}>
                    {d.st.duration_min}<span style={{ fontSize: 9, fontWeight: 500, marginLeft: 2 }}>mn</span>
                  </div>
                </div>
                {/* Nbre personnes */}
                <div style={{ background: '#fff', borderRadius: 6, padding: '6px 8px',
                  border: '1px solid var(--stroke3)' }}>
                  <div style={{ fontSize: 8, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '.06em', marginBottom: 2 }}>Nbre pers. moy.</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 800, color: '#374151' }}>
                    {d.st.avg_pax}<span style={{ fontSize: 9, fontWeight: 500, marginLeft: 2 }}>/ bus</span>
                  </div>
                </div>
                {/* Capacité max */}
                <div style={{ background: '#fff', borderRadius: 6, padding: '6px 8px',
                  border: '1px solid var(--stroke3)' }}>
                  <div style={{ fontSize: 8, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '.06em', marginBottom: 2 }}>Capacité max</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 800, color: '#374151',
                    display: 'flex', alignItems: 'baseline', gap: 3 }}>
                    {capMax}
                    <span style={{ fontSize: 8, color: '#9ca3af', fontWeight: 500 }}>
                      ({d.st.nb_vehicles}×{d.st.vehicle_seats})
                    </span>
                  </div>
                </div>
                {/* Taux fréquentation calculé */}
                <div style={{ background: tauxCalc >= 90 ? 'rgba(220,38,38,.06)' : tauxCalc >= 70 ? 'rgba(245,158,11,.06)' : 'rgba(22,163,74,.06)',
                  borderRadius: 6, padding: '6px 8px',
                  border: `1px solid ${tauxCalc >= 90 ? 'rgba(220,38,38,.2)' : tauxCalc >= 70 ? 'rgba(245,158,11,.2)' : 'rgba(22,163,74,.2)'}` }}>
                  <div style={{ fontSize: 8, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '.06em', marginBottom: 2 }}>Taux fréq.</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 800,
                    color: tauxCalc >= 90 ? '#dc2626' : tauxCalc >= 70 ? '#d97706' : '#16a34a' }}>
                    {tauxCalc}%
                  </div>
                </div>
              </div>
              {/* Formule capacité */}
              <div style={{ fontSize: 8, color: '#c4c4c4', marginTop: 5, fontFamily: 'var(--font-mono)' }}>
                {d.st.nb_vehicles} véh × {d.st.vehicle_seats} pl × {d.st.nb_trips_day} rot/j = {capMax}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── main content ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* left: table + charts */}
        <div style={{ flex: 1, overflow: 'auto', padding: 20, minWidth: 0 }}>
          {/* tab bar */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {REPORT_TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ padding: '6px 14px', borderRadius: 8,
                  border: `1.5px solid ${tab === t.key ? client.color : 'var(--stroke3)'}`,
                  background: tab === t.key ? client.color : '#fff',
                  color: tab === t.key ? '#fff' : '#374151',
                  fontSize: 13, fontWeight: tab === t.key ? 700 : 500, cursor: 'pointer' }}>
                {t.label}
              </button>
            ))}
            <div style={{ flex: 1 }}/>
            {hasOverrides && (
              <button onClick={resetOverrides}
                style={{ padding: '6px 12px', borderRadius: 8,
                  border: '1.5px solid rgba(220,38,38,.35)', background: 'rgba(220,38,38,.06)',
                  color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                ↺ Réinitialiser
              </button>
            )}
          </div>

          {/* table */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1.5px solid var(--stroke3)',
            overflow: 'hidden', marginBottom: 20, position: 'relative' }}>
            {statsLoading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,.75)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5,
                borderRadius: 10, backdropFilter: 'blur(2px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8,
                  fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--brand)', fontWeight: 700 }}>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: 18 }}>⟳</span>
                  Chargement des données…
                </div>
              </div>
            )}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 680 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {[
                      { label: 'Date',          auto: false, danger: false, amber: false },
                      { label: 'Jour',          auto: false, danger: false, amber: false },
                      { label: 'Usagers mat.',  auto: false, danger: false, amber: false },
                      { label: 'Usagers AM',    auto: false, danger: false, amber: false },
                      { label: 'Total',         auto: true,  danger: false, amber: false },
                      { label: 'Taux mat.',     auto: false, danger: false, amber: false },
                      { label: 'Taux AM',       auto: false, danger: false, amber: false },
                      { label: 'Global',        auto: true,  danger: false, amber: false },
                      { label: 'Inc.',          auto: false, danger: false, amber: false },
                      { label: '⏱ Retards',    auto: false, danger: true,  amber: false },
                      { label: '⚠ Non prévu',  auto: false, danger: false, amber: true  },
                    ].map((h,i) => (
                      <th key={i} style={{ padding: '9px 12px', textAlign: i < 2 ? 'left' : 'right',
                        fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                        color: h.amber ? '#f59e0b' : h.danger ? '#f87171' : h.auto ? '#c4b5fd' : '#9ca3af',
                        textTransform: 'uppercase', letterSpacing: '.08em',
                        borderBottom: '1.5px solid var(--stroke3)', whiteSpace: 'nowrap',
                        background: '#f9fafb' }}>
                        {h.label}{h.auto && <span style={{ marginLeft: 3, fontSize: 7, opacity: .7 }}>AUTO</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => {
                    const isModified = !!overrides[row.date];
                    return (
                      <tr key={row.date} style={{
                        background: isModified ? `${client.color}08` : idx % 2 === 0 ? '#fff' : '#fafafa',
                        borderBottom: '1px solid var(--stroke3)',
                      }}>
                        <td style={{ padding: '7px 12px', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#374151' }}>
                          {row.date.slice(8)}/{row.date.slice(5,7)}
                          {isModified && <span style={{ marginLeft: 4, fontSize: 9, color: client.color }}>✎</span>}
                        </td>
                        <td style={{ padding: '7px 12px', fontWeight: 600, color: '#6b7280', fontSize: 12 }}>{row.jour}</td>
                        {EDITABLE_FIELDS.map(f => {
                          const isEditing = editingCell?.date === row.date && editingCell?.field === f;
                          // usagers_matin/am en cours d'édition → la cellule "total" s'affiche aussi active
                          const isAutoEditing =
                            (f === 'usagers' && (editingCell?.date === row.date) && (editingCell?.field === 'usagers_matin' || editingCell?.field === 'usagers_am')) ||
                            (f === 'taux'    && (editingCell?.date === row.date) && (editingCell?.field === 'taux_matin'    || editingCell?.field === 'taux_am'));
                          const isTaux  = f.startsWith('taux');
                          const isAuto  = AUTO_FIELDS.has(f);
                          const isOverridden = !!overrides[row.date]?.[f];
                          const val = (row as unknown as Record<string,number>)[f] ?? 0;
                          return (
                            <td key={f} style={{ padding: '5px 12px', textAlign: 'right',
                              background: isAutoEditing ? 'rgba(139,92,246,.06)' : 'transparent' }}>
                              {isEditing ? (
                                <input autoFocus type="number" value={cellVal}
                                  onChange={e => setCellVal(e.target.value)}
                                  onBlur={commitEdit}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') commitEdit();
                                    if (e.key === 'Escape') setEditingCell(null);
                                  }}
                                  style={{ width: 62, textAlign: 'right', padding: '2px 6px',
                                    border: `1.5px solid ${client.color}`, borderRadius: 5,
                                    fontSize: 12, fontFamily: 'var(--font-mono)', outline: 'none' }}
                                />
                              ) : (
                                <span onClick={() => startEdit(row, f)}
                                  title={isAuto
                                    ? f === 'usagers'
                                      ? 'Calculé automatiquement (matin + après-midi) — modifier les colonnes sources'
                                      : 'Calculé automatiquement — modifier Taux mat. ou Taux AM'
                                    : 'Cliquer pour modifier'}
                                  style={{
                                    cursor: isAuto ? 'default' : 'text',
                                    fontFamily: 'var(--font-mono)', fontSize: 12,
                                    color: isTaux ? tauxColor(val) : isAuto ? '#8b5cf6' : '#374151',
                                    padding: '2px 6px', borderRadius: 4,
                                    background: isTaux ? tauxBg(val) : isAuto ? 'rgba(139,92,246,.07)' : 'transparent',
                                    display: 'inline-block',
                                    outline: isOverridden && isAuto ? `1.5px solid rgba(139,92,246,.4)` : 'none',
                                  }}>
                                  {isTaux ? `${val}%` : fmtN(val)}
                                  {isAutoEditing && <span style={{ marginLeft: 3, fontSize: 8, opacity: .5 }}>↻</span>}
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td style={{ padding: '7px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)',
                          fontSize: 11, color: row.incidents > 0 ? '#dc2626' : '#d1d5db' }}>
                          {row.incidents > 0 ? `⚠ ${row.incidents}` : '—'}
                        </td>
                        {/* Retards */}
                        <td style={{ padding: '7px 12px', textAlign: 'right' }}>
                          {(row.retards ?? 0) > 0 ? (
                            <span style={{
                              fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                              padding: '2px 7px', borderRadius: 4,
                              background: row.retards >= 3 ? 'rgba(220,38,38,.1)' : 'rgba(251,146,60,.1)',
                              color: row.retards >= 3 ? '#dc2626' : '#ea580c',
                              border: `1px solid ${row.retards >= 3 ? 'rgba(220,38,38,.3)' : 'rgba(251,146,60,.3)'}`,
                            }}>
                              {row.retards}
                            </span>
                          ) : (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#d1d5db' }}>—</span>
                          )}
                        </td>
                        {/* Non prévues */}
                        <td style={{ padding: '7px 12px', textAlign: 'right' }}>
                          {(row.unplanned ?? 0) > 0 ? (
                            <span style={{
                              fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                              padding: '2px 7px', borderRadius: 4,
                              background: 'rgba(245,158,11,.12)',
                              color: '#d97706',
                              border: '1px solid rgba(245,158,11,.35)',
                            }}>
                              {row.unplanned}
                            </span>
                          ) : (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#d1d5db' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f9fafb', borderTop: '2px solid var(--stroke3)' }}>
                    <td colSpan={2} style={{ padding: '9px 12px', fontWeight: 700, fontSize: 11,
                      fontFamily: 'var(--font-mono)' }}>TOTAL / MOY.</td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12 }}>
                      {fmtN(rows.reduce((a,r)=>a+r.usagers_matin,0))}
                    </td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12 }}>
                      {fmtN(rows.reduce((a,r)=>a+r.usagers_am,0))}
                    </td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12 }}>
                      {fmtN(totalUsagers)}
                    </td>
                    <td style={{ padding: '9px 12px', textAlign: 'right' }}><TauxPill value={avgTauxMatin}/></td>
                    <td style={{ padding: '9px 12px', textAlign: 'right' }}><TauxPill value={avgTauxAm}/></td>
                    <td style={{ padding: '9px 12px', textAlign: 'right' }}><TauxPill value={avgTauxGlobal}/></td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)',
                      fontWeight: 700, fontSize: 11, color: incidents > 0 ? '#dc2626' : '#9ca3af' }}>
                      {incidents > 0 ? incidents : '—'}
                    </td>
                    <td style={{ padding: '9px 12px', textAlign: 'right' }}>
                      {totalRetards > 0 ? (
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 800,
                          padding: '2px 8px', borderRadius: 4,
                          background: totalRetards >= 10 ? 'rgba(220,38,38,.12)' : 'rgba(251,146,60,.12)',
                          color: totalRetards >= 10 ? '#dc2626' : '#ea580c',
                          border: `1.5px solid ${totalRetards >= 10 ? 'rgba(220,38,38,.35)' : 'rgba(251,146,60,.35)'}`,
                        }}>
                          {totalRetards}
                        </span>
                      ) : (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#9ca3af' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '9px 12px', textAlign: 'right' }}>
                      {totalUnplanned > 0 ? (
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 800,
                          padding: '2px 8px', borderRadius: 4,
                          background: 'rgba(245,158,11,.14)',
                          color: '#d97706',
                          border: '1.5px solid rgba(245,158,11,.4)',
                        }}>
                          {totalUnplanned}
                        </span>
                      ) : (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#9ca3af' }}>—</span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* charts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#fff', borderRadius: 10, border: '1.5px solid var(--stroke3)', padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10 }}>
                Évolution du taux de fréquentation
              </div>
              <LineChart values={chartVals} labels={chartLabels} color={client.color}/>
            </div>

            {tab === 'journee' && (
              <div style={{ background: '#fff', borderRadius: 10, border: '1.5px solid var(--stroke3)', padding: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10 }}>
                  Matin vs Après-midi
                </div>
                <DualLineChart
                  v1={rows.map(r=>r.taux_matin)} v2={rows.map(r=>r.taux_am)}
                  labels={chartLabels} color1={client.color} color2="#f59e0b"
                  l1="Matin" l2="Après-midi"
                />
              </div>
            )}
          </div>
        </div>

        {/* right: comment panel */}
        <div style={{ width: 300, borderLeft: '1.5px solid var(--stroke3)', background: '#fff',
          display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1.5px solid var(--stroke3)', flexShrink: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800 }}>Commentaire mensuel</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
              {client.nom} {client.ligne} · Mars 2026
            </div>
          </div>

          <div style={{ flex: 1, padding: '14px 18px', display: 'flex', flexDirection: 'column',
            gap: 12, overflow: 'auto', minHeight: 0 }}>
            <textarea value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Commentaire généré ou rédigé manuellement…"
              style={{ flex: 1, minHeight: 180, border: '1.5px solid var(--stroke3)', borderRadius: 8,
                padding: '10px 12px', fontSize: 13, lineHeight: 1.7, fontFamily: 'inherit',
                resize: 'none', outline: 'none', color: '#374151' }}/>

            <button onClick={() => setShowAI(true)}
              style={{ padding: '10px 16px', borderRadius: 8, border: 'none',
                background: `linear-gradient(135deg,${client.color},#4f46e5)`, color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              ✦ Générer avec l'IA
            </button>

            {comment && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => navigator.clipboard.writeText(comment)}
                  style={{ flex: 1, padding: '7px', borderRadius: 7, border: '1.5px solid var(--stroke3)',
                    fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                  📋 Copier
                </button>
                <button onClick={() => setComment('')}
                  style={{ flex: 1, padding: '7px', borderRadius: 7,
                    border: '1.5px solid rgba(220,38,38,.3)', background: 'rgba(220,38,38,.04)',
                    fontSize: 12, fontWeight: 600, color: '#dc2626', cursor: 'pointer' }}>
                  Effacer
                </button>
              </div>
            )}

            {/* ── Sauvegarder dans l'archive ── */}
            <div style={{ borderTop: '1px solid var(--stroke3)', paddingTop: 12, marginTop: 4 }}>
              <button
                onClick={saveReport}
                disabled={saveState === 'saving' || saveState === 'saved'}
                style={{
                  width: '100%', padding: '10px 16px', borderRadius: 8,
                  border: saveState === 'error'
                    ? '1.5px solid rgba(220,38,38,.5)'
                    : saveState === 'saved'
                      ? '1.5px solid rgba(22,163,74,.5)'
                      : '1.5px solid var(--stroke3)',
                  background: saveState === 'error'
                    ? 'rgba(220,38,38,.06)'
                    : saveState === 'saved'
                      ? 'rgba(22,163,74,.08)'
                      : '#f9fafb',
                  color: saveState === 'error'
                    ? '#dc2626'
                    : saveState === 'saved'
                      ? '#16a34a'
                      : '#374151',
                  fontSize: 13, fontWeight: 700, cursor: saveState === 'saving' ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all .2s',
                }}>
                {saveState === 'saving' && (
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
                )}
                {saveState === 'saving' && 'Sauvegarde…'}
                {saveState === 'saved'  && '✓ Rapport archivé'}
                {saveState === 'error'  && '✕ Erreur — réessayer'}
                {saveState === 'idle'   && '💾 Sauvegarder le rapport'}
              </button>
              <div style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center', marginTop: 5 }}>
                Enregistre les stats et le commentaire dans l'archive
              </div>
            </div>

            {satJours > 0 && (
              <div style={{ padding: '9px 12px', background: 'rgba(220,38,38,.04)',
                border: '1.5px solid rgba(220,38,38,.2)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', marginBottom: 2 }}>
                  ⚡ Saturation ≥ 90%
                </div>
                <div style={{ fontSize: 11, color: '#374151' }}>
                  {satJours} jour(s) · max {Math.max(...rows.map(r=>r.taux))}%
                </div>
              </div>
            )}

            {incidents > 0 && (
              <div style={{ padding: '9px 12px', background: 'rgba(220,38,38,.05)',
                border: '1.5px solid rgba(220,38,38,.25)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', marginBottom: 3 }}>
                  ⚠ {incidents} incident(s)
                </div>
                <div style={{ fontSize: 11, color: '#374151' }}>
                  {rows.filter(r=>r.incidents>0).map(r=>`${r.date.slice(8)}/${r.date.slice(5,7)}`).join(', ')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Modal via portal */}
      {showAI && (
        <AIModal
          client={client} rows={rows}
          onClose={() => setShowAI(false)}
          onResult={text => { setComment(text); setShowAI(false); }}
        />
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CLIENT CARD — layout horizontal compact
═══════════════════════════════════════════════════════════════ */
function ClientCard({ client, onViewReport }: { client: ClientDef, onViewReport: () => void }) {
  const weekdayData  = client.data.filter(r => r.jour !== 'Sam' && r.jour !== 'Dim');
  const sparkData    = weekdayData.map(r => r.taux);
  const totalUsagers = client.data.reduce((a, r) => a + r.usagers, 0);
  const avgTaux      = avg(sparkData);
  const satJours     = client.data.filter(r => r.taux >= 90).length;
  const joursService = weekdayData.length;

  return (
    <div style={{
      background: '#fff',
      borderRadius: 14,
      border: '1.5px solid var(--stroke3)',
      boxShadow: '0 2px 8px rgba(0,0,0,.06)',
      display: 'flex',
      overflow: 'visible',
    }}>
      {/* left accent bar */}
      <div style={{
        width: 5, borderRadius: '14px 0 0 14px', background: client.color, flexShrink: 0,
      }}/>

      {/* card body */}
      <div style={{ flex: 1, padding: '18px 20px 16px', minWidth: 0 }}>

        {/* ── row 1 : identity + KPIs + sparkline ── */}
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 20, marginBottom: 14 }}>

          {/* identity */}
          <div style={{ flex: '0 0 220px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '.1em', color: '#fff',
                background: client.color, borderRadius: 5, padding: '2px 7px',
              }}>{client.badge}</span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '.1em', color: client.color,
              }}>{client.nom}</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#111', letterSpacing: '-.02em', lineHeight: 1.1 }}>
              {client.ligne}
            </div>
            <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 5, lineHeight: 1.4 }}>
              {client.sub}
            </div>
          </div>

          {/* separator */}
          <div style={{ width: 1, background: 'var(--stroke3)', flexShrink: 0, alignSelf: 'stretch' }}/>

          {/* KPIs */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, alignItems: 'center' }}>
            {[
              {
                label: 'Usagers mars',
                content: (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 800, color: '#111', lineHeight: 1 }}>
                    {fmtN(totalUsagers)}
                  </span>
                ),
              },
              {
                label: 'Jours service',
                content: (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 800, color: '#111', lineHeight: 1 }}>
                    {joursService}
                  </span>
                ),
              },
              {
                label: 'Taux moyen',
                content: (
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 800, lineHeight: 1,
                    color: tauxColor(avgTaux),
                  }}>
                    {avgTaux}%
                    {avgTaux >= 90 && <span style={{ fontSize: 14 }}> ⚡</span>}
                  </span>
                ),
              },
              {
                label: 'Saturation',
                content: (
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 800, lineHeight: 1,
                    color: satJours > 5 ? '#dc2626' : satJours > 2 ? '#d97706' : '#374151',
                  }}>
                    {satJours}j
                  </span>
                ),
              },
            ].map((k, i) => (
              <div key={i} style={{ padding: '0 16px', borderRight: i < 3 ? '1px solid var(--stroke3)' : 'none' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase',
                  letterSpacing: '.1em', marginBottom: 6 }}>{k.label}</div>
                {k.content}
              </div>
            ))}
          </div>

          {/* separator */}
          <div style={{ width: 1, background: 'var(--stroke3)', flexShrink: 0, alignSelf: 'stretch' }}/>

          {/* sparkline */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center',
            alignItems: 'center', gap: 4, paddingLeft: 4 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase',
              letterSpacing: '.1em' }}>Tendance</div>
            <MiniSparkline data={sparkData} color={client.color}/>
          </div>
        </div>

        {/* ── row 2 : directions + actions ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12,
          paddingTop: 12, borderTop: '1px solid var(--stroke3)' }}>

          {/* direction taux */}
          <div style={{ flex: 1, display: 'flex', gap: 6, flexWrap: 'nowrap', overflow: 'hidden' }}>
            {[
              { label: 'Matin aller',  dir: client.dir_matin_a, taux: client.taux_matin_a },
              { label: 'Matin retour', dir: client.dir_matin_r, taux: client.taux_matin_r },
              { label: 'AM aller',     dir: client.dir_am_a,    taux: client.taux_am_a    },
              { label: 'AM retour',    dir: client.dir_am_r,    taux: client.taux_am_r    },
            ].map((d, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#f9fafb', borderRadius: 8, padding: '6px 10px',
                border: '1px solid var(--stroke3)', flexShrink: 0,
              }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase',
                    letterSpacing: '.06em', lineHeight: 1, marginBottom: 2 }}>{d.label}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap',
                    maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.dir}</div>
                </div>
                <TauxPill value={d.taux}/>
              </div>
            ))}
          </div>

          {/* action buttons */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={onViewReport}
              style={{
                padding: '9px 20px', borderRadius: 9,
                background: client.color, color: '#fff', border: 'none',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                whiteSpace: 'nowrap', boxShadow: `0 2px 8px ${client.color}40`,
              }}>
              📊 Rapport
            </button>
            <button style={{
              padding: '9px 14px', borderRadius: 9, border: '1.5px solid var(--stroke3)',
              background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              🧾 Factures
            </button>
            <button style={{
              padding: '9px 14px', borderRadius: 9, border: '1.5px solid var(--stroke3)',
              background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              📅 Planning
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PERIOD SELECTOR
═══════════════════════════════════════════════════════════════ */
function PeriodSelector({ period, onPeriod, cf, ct, onCf, onCt }: {
  period: Period, onPeriod: (p: Period) => void,
  cf: string, ct: string, onCf: (s: string) => void, onCt: (s: string) => void,
}) {
  const PILLS: { key: Period, label: string }[] = [
    { key: 'jour',    label: "Aujourd'hui" },
    { key: 'semaine', label: 'Cette semaine' },
    { key: 'mois',    label: 'Ce mois' },
    { key: 'custom',  label: 'Personnalisé' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      {PILLS.map(p => (
        <button key={p.key} onClick={() => onPeriod(p.key)}
          style={{ padding: '5px 14px', borderRadius: 20,
            border: `1.5px solid ${period === p.key ? 'var(--brand)' : 'var(--stroke3)'}`,
            background: period === p.key ? 'var(--brand)' : '#fff',
            color: period === p.key ? '#fff' : '#374151',
            fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          {p.label}
        </button>
      ))}
      {period === 'custom' && (
        <>
          <input type="date" value={cf} onChange={e => onCf(e.target.value)}
            style={{ padding: '5px 8px', borderRadius: 7, border: '1.5px solid var(--stroke3)',
              fontSize: 12, color: '#374151' }}/>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>→</span>
          <input type="date" value={ct} onChange={e => onCt(e.target.value)}
            style={{ padding: '5px 8px', borderRadius: 7, border: '1.5px solid var(--stroke3)',
              fontSize: 12, color: '#374151' }}/>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function ClientsPage() {
  const { demo } = useDemoMode();
  const [period,       setPeriod]       = useState<Period>('mois');
  const [customFrom,   setCustomFrom]   = useState('2026-03-01');
  const [customTo,     setCustomTo]     = useState('2026-03-31');
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [clients,      setClients]      = useState<ClientDef[]>(CLIENTS);

  /* ── Fetch liste des lignes depuis l'API ── */
  useEffect(() => {
    if (demo) { setClients(CLIENTS); return; }
    api.get('/clients/lines')
      .then(res => {
        const lines: Record<string,unknown>[] = res.data;
        if (!Array.isArray(lines) || !lines.length) { setClients([]); return; }
        const mapped: ClientDef[] = lines.map(l => {
          // Fallback sur les données statiques pour les champs non fournis par l'API
          const fb = CLIENTS.find(c =>
            (l.id && c.id === l.id) ||
            (l.name && c.ligne === l.name) ||
            (l.code && c.ligne.includes(String(l.code)))
          ) ?? CLIENTS[0];
          return {
            id:           String(l.id ?? fb.id),
            nom:          String(l.client_name ?? l.nom ?? fb.nom),
            ligne:        String(l.name ?? fb.ligne),
            sub:          String(l.sub  ?? fb.sub),
            badge:        String(l.badge ?? fb.badge),
            color:        String(l.color ?? fb.color),
            data:         [],
            dir_matin_a:  String(l.dir_matin_a ?? fb.dir_matin_a),
            dir_matin_r:  String(l.dir_matin_r ?? fb.dir_matin_r),
            dir_am_a:     String(l.dir_am_a    ?? fb.dir_am_a),
            dir_am_r:     String(l.dir_am_r    ?? fb.dir_am_r),
            taux_matin_a: Number(l.taux_matin_a ?? fb.taux_matin_a),
            taux_matin_r: Number(l.taux_matin_r ?? fb.taux_matin_r),
            taux_am_a:    Number(l.taux_am_a    ?? fb.taux_am_a),
            taux_am_r:    Number(l.taux_am_r    ?? fb.taux_am_r),
            stats_matin_a: fb.stats_matin_a,
            stats_matin_r: fb.stats_matin_r,
            stats_am_a:    fb.stats_am_a,
            stats_am_r:    fb.stats_am_r,
          };
        });
        setClients(mapped);
      })
      .catch(() => setClients([]));
  }, [demo]);

  const activeClient = clients.find(c => c.id === activeReport) ?? null;
  const range        = getDateRange(period, customFrom, customTo);
  const totalAll     = clients.reduce((a, c) => a + c.data.reduce((b, r) => b + r.usagers, 0), 0);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>

      {activeClient ? (
        /* ── REPORT VIEW ── */
        <ClientReport client={activeClient} range={range} onBack={() => setActiveReport(null)} />

      ) : (
        /* ── CARDS LIST ── */
        <>
          {/* header */}
          <div style={{ padding: '14px 24px', borderBottom: '1.5px solid var(--stroke3)',
            background: '#fff', flexShrink: 0, zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase',
                  letterSpacing: '.12em', color: '#9ca3af', fontWeight: 700 }}>
                  Direction · {clients.length} contrats actifs
                </div>
                <h1 style={{ fontSize: 19, fontWeight: 700, marginTop: 3 }}>Gestion clients</h1>
              </div>
              <button style={{ padding: '8px 18px', borderRadius: 8, border: 'none',
                background: 'var(--brand)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                + Contrat
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <PeriodSelector period={period} onPeriod={setPeriod}
                cf={customFrom} ct={customTo} onCf={setCustomFrom} onCt={setCustomTo}/>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6b7280' }}>
                {range.from === range.to ? range.from : `${range.from} → ${range.to}`}
                &nbsp;·&nbsp;{fmtN(totalAll)} usagers total
              </div>
            </div>
          </div>

          {/* cards */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
            {clients.map(c => (
              <ClientCard
                key={c.id}
                client={c}
                onViewReport={() => setActiveReport(c.id)}
              />
            ))}
            <div style={{ height: 24 }}/>
          </div>
        </>
      )}
    </div>
  );
}
