'use client';
import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { L3, L4, CHM, HOURS, LINE_DIR, GANTT_START, GANTT_SPAN, Driver } from '@/lib/data';
import { PageBar, Eyebrow, Pill, Btn, AlertBanner } from '@/components/ui';
import { api } from '@/lib/api';
import { useDemoMode } from '@/lib/demo';

const toPos = (h: number) => ((h - GANTT_START) / GANTT_SPAN) * 100;
const parseTime = (s: string) => {
  if (!s) return null;
  const parts = s.split(':');
  return parseInt(parts[0]) + parseInt(parts[1]||'0') / 60;
};

type DriverExt = Driver & { _ligne: string; _color: string };
type ViewMode = 'jour' | 'semaine' | 'mois';

const DAYS_FR = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const MONTHS_SHORT = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];

function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function addMonths(d: Date, n: number): Date { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; }
function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  r.setDate(r.getDate() - (day === 0 ? 6 : day - 1));
  return r;
}
function getWeekNum(d: Date): number {
  const thu = addDays(startOfWeek(d), 3);
  const yearStart = new Date(thu.getFullYear(), 0, 1);
  return Math.ceil(((thu.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
function toISO(d: Date): string { return d.toISOString().split('T')[0]; }
function isSameDay(a: Date, b: Date): boolean { return toISO(a) === toISO(b); }
function periodLabel(mode: ViewMode, d: Date): string {
  if (mode === 'jour') return `${DAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
  if (mode === 'semaine') {
    const mon = startOfWeek(d);
    const sun = addDays(mon, 6);
    const sm = mon.getMonth() === sun.getMonth()
      ? `${mon.getDate()}`
      : `${mon.getDate()} ${MONTHS_SHORT[mon.getMonth()]}`;
    return `Semaine ${getWeekNum(d)} · ${sm}–${sun.getDate()} ${MONTHS_SHORT[sun.getMonth()].toLowerCase()} ${sun.getFullYear()}`;
  }
  return `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
}
function navigateDate(mode: ViewMode, d: Date, dir: -1 | 1): Date {
  if (mode === 'jour') return addDays(d, dir);
  if (mode === 'semaine') return addDays(d, dir * 7);
  return addMonths(d, dir);
}

const fmtH = (h: number) => {
  const hrs = Math.floor(h);
  const mins = Math.round((h % 1) * 60);
  return `${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}`;
};

interface BarDetail { dr: DriverExt; bar: 'am'|'pm'; start: number; end: number; rect: DOMRect; lineColor: string; lineLabel: string; tripId?: string; }

function CourseDetailPopup({ detail, onClose, onEdit, onDelete }: {
  detail: BarDetail; onClose: () => void; onEdit: () => void | Promise<void>; onDelete: () => void;
}) {
  const { dr, bar, start, end, rect, lineColor, lineLabel } = detail;
  const dir = LINE_DIR[lineLabel] || { am: 'AM →', pm: 'PM ←', route: lineLabel };
  const durH = end - start;
  const dur = `${Math.floor(durH)}h${durH % 1 ? '30' : ''}`;
  const W = 280, H = 170;
  const top = rect.bottom + 10 + H < window.innerHeight ? rect.bottom + 10 : rect.top - H - 10;
  const left = Math.max(10, Math.min(rect.left + rect.width / 2 - W / 2, window.innerWidth - W - 10));

  return (
    <>
      <div style={{position:'fixed',inset:0,zIndex:97}} onClick={onClose}/>
      <div style={{position:'fixed',top,left,width:W,background:'#fff',border:'1.5px solid var(--stroke)',
        borderRadius:8,boxShadow:'0 16px 48px rgba(20,15,16,.22)',zIndex:98,overflow:'hidden'}}>
        <div style={{padding:'10px 14px',borderBottom:'1px solid var(--stroke3)',display:'flex',alignItems:'center',gap:7}}>
          <span style={{width:8,height:8,borderRadius:'50%',background:lineColor,flexShrink:0}}/>
          <span style={{fontFamily:'var(--font-mono)',fontSize:10,fontWeight:700,color:lineColor,
            padding:'1px 5px',border:`1.5px solid ${lineColor}`,borderRadius:3}}>{lineLabel}</span>
          <span style={{fontWeight:700,fontSize:13,flex:1}}>{dr.nom}</span>
          <span style={{fontFamily:'var(--font-mono)',fontSize:9,color:'var(--stroke3)'}}>{dr.code}</span>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--stroke3)',fontSize:16,lineHeight:1,marginLeft:4}}>×</button>
        </div>
        <div style={{padding:'12px 14px 14px'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
            <span style={{padding:'2px 9px',borderRadius:4,fontSize:11,fontWeight:700,
              background: bar==='am' ? lineColor : `${lineColor}22`,
              color: bar==='am' ? '#fff' : lineColor}}>
              {bar.toUpperCase()} {bar==='am'?'→':'←'}
            </span>
            <span style={{fontFamily:'var(--font-mono)',fontSize:14,fontWeight:700,letterSpacing:'.02em'}}>
              {fmtH(start)} → {fmtH(end)}
            </span>
            <span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--stroke2)',marginLeft:'auto'}}>{dur}</span>
          </div>
          <div style={{fontSize:11,color:'var(--stroke2)',marginBottom:12}}>
            {bar==='am' ? dir.am : dir.pm}
          </div>
          <div style={{display:'flex',gap:7}}>
            <button onClick={onDelete}
              style={{flex:1,padding:'7px 0',border:'1.25px solid var(--danger)',borderRadius:5,background:'transparent',
                color:'var(--danger)',fontSize:12,fontWeight:600,cursor:'pointer'}}>
              Supprimer
            </button>
            <button onClick={onEdit}
              style={{flex:2,padding:'7px 0',border:'none',borderRadius:5,background:'var(--brand)',
                color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>
              ✎ Modifier
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

interface Replacement { oldCode: string; newCode: string; oldDr: DriverExt; }

function DbTripBar({ trip, dr, lineLabel, lineColor, containerRef, onBarClick, onReplace, isReplaced }: {
  trip: any; dr: DriverExt; lineLabel: string; lineColor: string;
  containerRef: React.RefObject<HTMLDivElement>;
  onBarClick?: (d: BarDetail) => void;
  onReplace: (d: DriverExt) => void;
  isReplaced?: boolean;
}) {
  const depDate = new Date(trip.scheduled_at);
  const s0 = depDate.getHours() + depDate.getMinutes() / 60;
  const arrDate = trip.estimated_arrival_at ? new Date(trip.estimated_arrival_at) : null;
  const e0 = arrDate ? arrDate.getHours() + arrDate.getMinutes() / 60 : s0 + 1.5;

  const [start, setStart] = useState(s0);
  const [end, setEnd]     = useState(e0);
  const dragging = useRef(false);

  const notes       = trip.notes || '';
  const isPm        = notes.includes('PM') && !notes.includes('Journée');
  const isUnplanned = trip.is_unplanned || notes.includes('Non planifié');
  const dir         = LINE_DIR[lineLabel] || { am: 'AM →', pm: 'PM ←', route: lineLabel };

  const startRef = useRef(start);
  const endRef   = useRef(end);
  startRef.current = start;
  endRef.current   = end;

  const saveToDb = () => {
    const date = new Date(trip.scheduled_at).toISOString().split('T')[0];
    const toISO8601 = (h: number) => {
      const hrs = Math.floor(h), mins = Math.round((h % 1) * 60);
      return new Date(`${date}T${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}:00`).toISOString();
    };
    api.put(`/planning/${trip.id}`, {
      scheduled_at:         toISO8601(startRef.current),
      estimated_arrival_at: toISO8601(endRef.current),
    }).catch(() => {});
  };

  const startDragDb = (e: React.MouseEvent, setter: (v: number) => void, minH: number, maxH: number) => {
    e.preventDefault(); e.stopPropagation();
    dragging.current = true;
    const container = containerRef.current;
    if (!container) return;
    const cRect = container.getBoundingClientRect();
    const onMove = (me: MouseEvent) => {
      const ratio = Math.max(0, Math.min(1, (me.clientX - cRect.left) / cRect.width));
      const h = GANTT_START + ratio * GANTT_SPAN;
      setter(Math.max(minH, Math.min(maxH, Math.round(h * 4) / 4)));
    };
    const onUp = () => {
      dragging.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      saveToDb();
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const w = Math.max(toPos(end) - toPos(start), 1.5);

  return (
    <div className="gantt-bar"
      style={{
        left: `${toPos(start)}%`, width: `${w}%`,
        background: isReplaced ? '#d1d5db'
          : isUnplanned
            ? 'repeating-linear-gradient(45deg,rgba(245,158,11,.9),rgba(245,158,11,.9) 4px,rgba(180,83,9,.75) 4px,rgba(180,83,9,.75) 10px)'
            : isPm ? `${lineColor}22` : lineColor,
        border: isReplaced ? '1.5px solid #9ca3af'
          : (isPm || isUnplanned) ? `1.5px solid ${isUnplanned ? '#d97706' : lineColor}` : 'none',
        color: isReplaced ? '#6b7280' : isPm ? lineColor : isUnplanned ? '#92400e' : '#fff',
        display: 'flex', alignItems: 'center', gap: 4,
        cursor: isReplaced ? 'default' : 'pointer', overflow: 'visible', zIndex: 2,
        opacity: isReplaced ? 0.6 : 1,
      }}
      onClick={ev => {
        if (dragging.current) return;
        onBarClick?.({ dr, bar: isPm ? 'pm' : 'am', start, end,
          rect: ev.currentTarget.getBoundingClientRect(), lineColor, lineLabel, tripId: trip.id });
      }}>
      {/* Handle gauche */}
      <div onMouseDown={e => startDragDb(e, setStart, GANTT_START, end - 0.25)}
        onClick={e => e.stopPropagation()}
        style={{position:'absolute',top:0,bottom:0,left:0,width:10,cursor:'ew-resize',zIndex:4,
          display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{width:2,height:'60%',background:'rgba(255,255,255,0.5)',borderRadius:1}}/>
      </div>
      <span style={{opacity:.7, fontSize:9, flexShrink:0, pointerEvents:'none'}}>
        {isReplaced ? '✕' : isUnplanned ? '⚠' : '▶'}
      </span>
      <span style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', pointerEvents:'none', fontSize:10,
        textDecoration: isReplaced ? 'line-through' : 'none'}}>
        {isUnplanned ? '⚠ Non planifié' : isPm ? dir.pm : dir.am} · {fmtH(start)}→{fmtH(end)}
      </span>
      {trip.passenger_count > 0 && (
        <span style={{flexShrink:0, fontSize:9, fontFamily:'var(--font-mono)', fontWeight:700, pointerEvents:'none',
          background:'rgba(255,255,255,0.22)', borderRadius:3, padding:'1px 4px',
          color: isPm ? lineColor : '#fff'}}>
          {trip.passenger_count}✦
        </span>
      )}
      <button onClick={e => { e.stopPropagation(); onReplace(dr); }}
        title="Remplacer"
        style={{flexShrink:0,padding:'1px 5px',borderRadius:3,cursor:'pointer',lineHeight:1.2,
          fontSize:10,fontWeight:700,marginLeft:'auto',
          background:'rgba(255,255,255,0.18)',border:'1px solid rgba(255,255,255,0.45)',
          color: isPm ? lineColor : '#fff'}}>⇄</button>
      {/* Handle droit */}
      <div onMouseDown={e => startDragDb(e, setEnd, start + 0.25, GANTT_START + GANTT_SPAN)}
        onClick={e => e.stopPropagation()}
        style={{position:'absolute',top:0,bottom:0,right:0,width:10,cursor:'ew-resize',zIndex:4,
          display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{width:2,height:'60%',background:'rgba(255,255,255,0.5)',borderRadius:1}}/>
      </div>
    </div>
  );
}

function GanttRow({ dr, lineLabel, lineColor, onReplace, onEdit, onBarClick, incident, replacedBy, replacing, dbTrips }: {
  dr: DriverExt; lineLabel: string; lineColor: string;
  onReplace: (d: DriverExt) => void;
  onEdit?: (d: DriverExt) => void;
  onBarClick?: (detail: BarDetail) => void;
  incident?: boolean;
  replacedBy?: string;
  replacing?: Array<{ code: string; am?: string; pm?: string }>;
  dbTrips?: any[]; // Trajets réels depuis la DB
}) {
  const amParts = (dr.am||'').split('-');
  const pmParts = (dr.pm||'').split('-');
  const [amS, setAmS] = useState(() => parseTime(amParts[0]||''));
  const [amE, setAmE] = useState(() => parseTime(amParts[1]||''));
  const [pmS, setPmS] = useState(() => parseTime(pmParts[0]||''));
  const [pmE, setPmE] = useState(() => parseTime(pmParts[1]||''));
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const astrSegs = dr.astr ? dr.astr.split('·').map(s => s.trim()) : [];
  const dir = LINE_DIR[lineLabel] || { am:'AM', pm:'PM', route:lineLabel };
  const isFullDay = amS != null && amE != null && pmS == null;
  const isReplaced = !!replacedBy;

  const startDrag = (
    e: React.MouseEvent,
    setter: (v: number) => void,
    minH: number,
    maxH: number,
  ) => {
    if (isReplaced) return; // barre remplacée non-draggable
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    const container = containerRef.current;
    if (!container) return;
    const cRect = container.getBoundingClientRect();

    const onMove = (me: MouseEvent) => {
      const ratio = Math.max(0, Math.min(1, (me.clientX - cRect.left) / cRect.width));
      const h = GANTT_START + ratio * GANTT_SPAN;
      setter(Math.max(minH, Math.min(maxH, Math.round(h * 4) / 4)));
    };
    const onUp = () => {
      dragging.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const handleBarClick = (e: React.MouseEvent, bar: 'am'|'pm', start: number, end: number) => {
    if (dragging.current) return;
    onBarClick?.({ dr, bar, start, end, rect: e.currentTarget.getBoundingClientRect(), lineColor, lineLabel });
  };

  const Handle = ({ onDown }: { onDown: (e: React.MouseEvent) => void }) => (
    <div
      onMouseDown={onDown}
      onClick={e => e.stopPropagation()}
      style={{position:'absolute',top:0,bottom:0,width:10,cursor:'ew-resize',zIndex:4,
        display:'flex',alignItems:'center',justifyContent:'center'}}
    >
      <div style={{width:2,height:'60%',background:'rgba(255,255,255,0.5)',borderRadius:1}}/>
    </div>
  );

  // Bouton ⇄ affiché sur la barre elle-même
  const ReplaceBtn = () => (
    <button
      onClick={e => { e.stopPropagation(); onReplace(dr); }}
      title="Remplacer ce chauffeur"
      style={{
        flexShrink:0, padding:'1px 5px', borderRadius:3, cursor:'pointer', lineHeight:1.2,
        fontSize:10, fontWeight:700,
        background:'rgba(255,255,255,0.18)', border:'1px solid rgba(255,255,255,0.45)',
        color:'#fff', marginLeft:'auto',
      }}>⇄</button>
  );

  return (
    <div style={{display:'grid',gridTemplateColumns:'230px 1fr',borderBottom:'1px solid var(--stroke3)',minHeight:52}}>
      {/* ── Colonne chauffeur ── */}
      <div style={{padding:'7px 10px',borderRight:'1.5px solid var(--stroke)',display:'flex',
        flexDirection:'column',justifyContent:'center',gap:2,
        background: isReplaced ? 'rgba(156,163,175,0.08)' : incident ? 'rgba(209,58,42,0.06)' : 'transparent'}}>
        <span style={{display:'flex',alignItems:'center',gap:5}}>
          <span style={{width:7,height:7,borderRadius:'50%',
            background: isReplaced ? '#9ca3af' : lineColor,flexShrink:0}}/>
          <span style={{fontFamily:'var(--font-mono)',fontSize:10,fontWeight:800,
            color: isReplaced ? '#9ca3af' : lineColor,
            padding:'0px 4px',border:`1.5px solid ${isReplaced ? '#d1d5db' : lineColor}`,
            borderRadius:3,letterSpacing:'.04em',
          }}>{dr.code}</span>
          <span style={{fontWeight:700,fontSize:12,color: isReplaced ? '#9ca3af' : 'var(--stroke)'}}>{dr.nom}</span>
          {incident && !isReplaced && <span style={{fontSize:10,color:'var(--danger)',fontWeight:700}}>⚠</span>}
          {isReplaced && (
            <span style={{fontSize:9,fontFamily:'var(--font-mono)',fontWeight:700,
              padding:'1px 5px',borderRadius:3,background:'rgba(245,158,11,.12)',
              border:'1px solid rgba(180,83,9,.3)',color:'#92400e',marginLeft:2}}>
              → {replacedBy}
            </span>
          )}
        </span>
        <span style={{display:'flex',alignItems:'center',gap:5,paddingLeft:12}}>
          <span style={{fontFamily:'var(--font-mono)',fontSize:9,fontWeight:700,
            color: isReplaced ? '#d1d5db' : lineColor,
            padding:'0px 4px',border:`1px solid ${isReplaced ? '#e5e7eb' : lineColor}`,borderRadius:2}}>{lineLabel}</span>
          <span style={{fontFamily:'var(--font-mono)',fontSize:8,color:'var(--stroke2)'}}>
            {lineLabel==='L3'?'Doujani↔Barge':lineLabel==='L4'?'Vahibe↔PEM':'CHM↔Barge'}
          </span>
          {dr.vehicule && <span style={{fontFamily:'var(--font-mono)',fontSize:8,color:'var(--stroke3)'}}>{dr.vehicule}</span>}
          {onEdit && !isReplaced && (
            <span style={{marginLeft:'auto'}}>
              <button onClick={() => onEdit(dr)} title="Modifier"
                style={{fontSize:10,color:'var(--info)',cursor:'pointer',background:'none',
                  border:'1px solid var(--info)',borderRadius:3,padding:'1px 5px',lineHeight:1.2}}>✎</button>
            </span>
          )}
        </span>
      </div>

      {/* ── Zone Gantt ── */}
      <div ref={containerRef} style={{position:'relative',
        background: isReplaced ? 'repeating-linear-gradient(135deg,rgba(156,163,175,.06),rgba(156,163,175,.06) 4px,transparent 4px,transparent 10px)'
          : incident ? 'rgba(209,58,42,0.03)' : 'transparent',
        userSelect:'none'}}>
        {HOURS.map(h => (
          <div key={h} style={{position:'absolute',left:`${toPos(h)}%`,top:0,bottom:0,borderLeft:'1px solid var(--stroke4)'}}/>
        ))}
        {astrSegs.map((seg, si) => {
          const [a, b] = seg.split('-');
          const s = parseTime(a), e = parseTime(b);
          if (s == null || e == null) return null;
          const w = toPos(e) - toPos(s);
          return (
            <div key={si} style={{
              position:'absolute', left:`${toPos(s)}%`, width:`${w}%`,
              top:3, bottom:3, borderRadius:4, zIndex:1,
              background:'repeating-linear-gradient(45deg,rgba(245,158,11,0.13),rgba(245,158,11,0.13) 5px,rgba(245,158,11,0.04) 5px,rgba(245,158,11,0.04) 12px)',
              border:'1.5px dashed rgba(245,158,11,0.7)',
              display:'flex', alignItems:'center', gap:4, paddingLeft:6, overflow:'hidden',
              pointerEvents:'none',
            }}>
              <span style={{fontSize:8,fontFamily:'var(--font-mono)',fontWeight:700,color:'#b45309',letterSpacing:'.04em',flexShrink:0}}>⟳ ASTR</span>
              {w > 8 && <span style={{fontSize:8,fontFamily:'var(--font-mono)',color:'#b45309',opacity:.8,whiteSpace:'nowrap'}}>{fmtH(s)}→{fmtH(e)}</span>}
            </div>
          );
        })}

        {/* ── Barres depuis la DB (trajets réels) ── */}
        {dbTrips && dbTrips.length > 0 && dbTrips.map((t: any, ti: number) => (
          <DbTripBar key={`db-${ti}`} trip={t} dr={dr}
            lineLabel={lineLabel} lineColor={lineColor} containerRef={containerRef}
            onBarClick={onBarClick} onReplace={onReplace} isReplaced={isReplaced} />
        ))}

        {/* ── Barre AM (ou journée) — planning théorique, masqué si trajets DB présents ── */}
        {(!dbTrips || dbTrips.length === 0) && amS != null && amE != null && (
          <div className="gantt-bar"
            style={{left:`${toPos(amS)}%`,width:`${toPos(amE)-toPos(amS)}%`,
              background: isReplaced ? '#d1d5db' : incident ? 'var(--warn)' : lineColor,
              color: isReplaced ? '#6b7280' : '#fff',
              display:'flex',alignItems:'center',gap:4,
              cursor: isReplaced ? 'default' : 'pointer',
              overflow:'visible',zIndex:2,
              opacity: isReplaced ? 0.6 : 1,
            }}
            onClick={e => !isReplaced && handleBarClick(e, 'am', amS!, amE!)}>
            {!isReplaced && <Handle onDown={e => startDrag(e, v => setAmS(v), GANTT_START, amE! - 0.25)}/>}
            <span style={{opacity: isReplaced ? 1 : .7,fontSize:9,flexShrink:0,pointerEvents:'none'}}>
              {isReplaced ? '✕' : '▶'}
            </span>
            <span style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',pointerEvents:'none',fontSize:10,
              textDecoration: isReplaced ? 'line-through' : 'none'}}>
              {isFullDay ? dir.route : dir.am} · {fmtH(amS)}→{fmtH(amE)}
            </span>
            {!isReplaced && <ReplaceBtn/>}
            {!isReplaced && <Handle onDown={e => startDrag(e, v => setAmE(v), amS! + 0.25, GANTT_START + GANTT_SPAN)}/>}
          </div>
        )}

        {/* ── Barre PM — planning théorique, masqué si trajets DB présents ── */}
        {(!dbTrips || dbTrips.length === 0) && pmS != null && pmE != null && (
          <div className="gantt-bar"
            style={{left:`${toPos(pmS)}%`,width:`${toPos(pmE)-toPos(pmS)}%`,
              background: isReplaced ? 'rgba(209,213,219,.2)' : `${lineColor}22`,
              border:`1.5px solid ${isReplaced ? '#d1d5db' : lineColor}`,
              color: isReplaced ? '#9ca3af' : lineColor,
              display:'flex',alignItems:'center',gap:4,
              cursor: isReplaced ? 'default' : 'pointer',
              overflow:'visible',zIndex:2,
              opacity: isReplaced ? 0.5 : 1,
            }}
            onClick={e => !isReplaced && handleBarClick(e, 'pm', pmS!, pmE!)}>
            {!isReplaced && <Handle onDown={e => startDrag(e, v => setPmS(v), GANTT_START, pmE! - 0.25)}/>}
            <span style={{opacity: isReplaced ? 1 : .7,fontSize:9,flexShrink:0,pointerEvents:'none'}}>
              {isReplaced ? '✕' : '▶'}
            </span>
            <span style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',pointerEvents:'none',fontSize:10,
              textDecoration: isReplaced ? 'line-through' : 'none'}}>
              {dir.pm} · {fmtH(pmS)}→{fmtH(pmE)}
            </span>
            {!isReplaced && <ReplaceBtn/>}
            {!isReplaced && <Handle onDown={e => startDrag(e, v => setPmE(v), pmS! + 0.25, GANTT_START + GANTT_SPAN)}/>}
          </div>
        )}

        {/* ── Barres héritées (courses reprises d'un autre chauffeur) — masqué si trajets DB présents ── */}
        {(!dbTrips || dbTrips.length === 0) && replacing && replacing.map((src, ri) => {
          const srcAmParts = (src.am||'').split('-');
          const srcPmParts = (src.pm||'').split('-');
          const sAmS = parseTime(srcAmParts[0]||'');
          const sAmE = parseTime(srcAmParts[1]||'');
          const sPmS = parseTime(srcPmParts[0]||'');
          const sPmE = parseTime(srcPmParts[1]||'');
          return (
            <React.Fragment key={ri}>
              {sAmS != null && sAmE != null && (
                <div className="gantt-bar" style={{
                  left:`${toPos(sAmS)}%`,width:`${toPos(sAmE)-toPos(sAmS)}%`,
                  background:'#d97706',color:'#fff',
                  display:'flex',alignItems:'center',gap:4,
                  cursor:'default',overflow:'hidden',zIndex:3,
                  top:6,bottom:6, // légèrement décalé pour distinguer
                }}>
                  <span style={{fontSize:9,opacity:.8,flexShrink:0}}>⇄</span>
                  <span style={{fontSize:9,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                    {src.code} · {fmtH(sAmS)}→{fmtH(sAmE)}
                  </span>
                </div>
              )}
              {sPmS != null && sPmE != null && (
                <div className="gantt-bar" style={{
                  left:`${toPos(sPmS)}%`,width:`${toPos(sPmE)-toPos(sPmS)}%`,
                  background:'rgba(217,119,6,.2)',border:'1.5px solid #d97706',color:'#92400e',
                  display:'flex',alignItems:'center',gap:4,
                  cursor:'default',overflow:'hidden',zIndex:3,
                  top:6,bottom:6,
                }}>
                  <span style={{fontSize:9,opacity:.8,flexShrink:0}}>⇄</span>
                  <span style={{fontSize:9,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                    {src.code} · {fmtH(sPmS)}→{fmtH(sPmE)}
                  </span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

const LIGNES_OPTS = [
  { code: 'L3', label: 'L3 · Doujani ↔ Passot La Barge', color: 'var(--brand)' },
  { code: 'L4', label: 'L4 · Vahibe ↔ PEM Passamainty',  color: 'var(--info)' },
  { code: 'CHM', label: 'CHM · CHM ↔ La Barge',          color: 'var(--success)' },
];

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1.25px solid var(--stroke3)', borderRadius: 6,
  padding: '8px 10px', fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box',
};
const selectStyle2: React.CSSProperties = { ...inputStyle, cursor: 'pointer', background: '#fff' };
const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.14em',
  textTransform: 'uppercase', color: 'var(--stroke2)', marginBottom: 5, display: 'block',
};

interface DbDriver { id: string; driver_number: string; full_name: string; }

// Fallback roster from static data (utilisé en mode démo uniquement)
const STATIC_DRIVERS: DbDriver[] = [
  ...L3.map(d => ({ id: d.code, driver_number: d.code, full_name: d.nom })),
  ...L4.map(d => ({ id: d.code, driver_number: d.code, full_name: d.nom })),
  ...CHM.map(d => ({ id: d.code, driver_number: d.code, full_name: d.nom })),
];

/** Détermine la ligne et la couleur à partir du numéro chauffeur */
function lineFromCode(driverNumber: string): { _ligne: string; _color: string } {
  if (driverNumber.startsWith('D')) return { _ligne: 'L3',  _color: 'var(--brand)' };
  if (driverNumber.startsWith('C')) return { _ligne: 'L4',  _color: 'var(--info)'  };
  if (driverNumber.startsWith('H')) return { _ligne: 'CHM', _color: 'var(--success)' };
  return { _ligne: 'L3', _color: 'var(--brand)' };
}

/** Convertit un chauffeur API en DriverExt (sans horaires statiques) */
function apiToDriverExt(d: DbDriver): DriverExt {
  return { code: d.driver_number, nom: d.full_name, ...lineFromCode(d.driver_number) } as DriverExt;
}

const STATIC_DRIVER_EXT: DriverExt[] = [
  ...L3.map(d => ({ ...d, _ligne: 'L3',  _color: 'var(--brand)'   })),
  ...L4.map(d => ({ ...d, _ligne: 'L4',  _color: 'var(--info)'    })),
  ...CHM.map(d => ({ ...d, _ligne: 'CHM', _color: 'var(--success)' })),
];

const loadDrivers = (setDrivers: (d: DbDriver[]) => void, demo: boolean) => {
  if (demo) { setDrivers(STATIC_DRIVERS); return; }
  api.get('/drivers')
    .then((r: any) => {
      const data: DbDriver[] = r.data ?? [];
      const sorted = [...data].sort((a, b) =>
        a.driver_number.localeCompare(b.driver_number, undefined, { numeric: true }));
      setDrivers(sorted.length ? sorted : []);
    })
    .catch(() => setDrivers([]));
};

function NouvelleCourseModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const today = new Date().toISOString().split('T')[0];
  const { demo } = useDemoMode();
  const [form, setForm] = useState({
    date: today, heure: '05:00', heure_arrivee: '', sens: 'AM', ligne: 'L3',
    driver_id: '', amount: '', notes: '',
    passenger_count: '', is_unplanned: false,
  });
  const [drivers, setDrivers] = useState<DbDriver[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { loadDrivers(setDrivers, demo); }, [demo]);

  const set = (k: keyof typeof form) => (v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.driver_id) e.driver_id = 'Obligatoire';
    if (!form.date) e.date = 'Obligatoire';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const scheduled_at = new Date(`${form.date}T${form.heure}:00`).toISOString();
      const estimated_arrival_at = form.heure_arrivee
        ? new Date(`${form.date}T${form.heure_arrivee}:00`).toISOString()
        : undefined;
      const notes = [form.ligne, form.sens, form.is_unplanned ? 'Non planifié' : '', form.notes]
        .filter(Boolean).join(' · ');
      await api.post('/planning', {
        driver_id:            form.driver_id,
        scheduled_at,
        estimated_arrival_at,
        amount:               form.amount ? parseFloat(form.amount) : undefined,
        notes:                notes || undefined,
        is_unplanned:         form.is_unplanned,
        passenger_count:      form.passenger_count ? parseInt(form.passenger_count) : undefined,
        direction:            sensToDirMap[form.sens] || 'matin_aller',
      });
      toast.success(form.is_unplanned
        ? 'Trajet non planifié ajouté et chauffeur notifié'
        : 'Course créée et chauffeur notifié'
      );
      onCreated();
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const ligne = LIGNES_OPTS.find(l => l.code === form.ligne);

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(20,15,16,.38)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#fff',border:'1.5px solid var(--stroke)',borderRadius:8,
        boxShadow:'0 30px 80px rgba(20,15,16,.35)',width:500,overflow:'hidden'}}>

        {/* Header */}
        <div style={{padding:'16px 20px',borderBottom:'1.5px solid var(--stroke)',
          display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontFamily:'var(--font-mono)',fontSize:9,letterSpacing:'.14em',
              textTransform:'uppercase',color:'var(--stroke2)'}}>Planning · Nouvelle course</div>
            <div style={{fontWeight:700,fontSize:16,marginTop:4,display:'flex',alignItems:'center',gap:8}}>
              Ajouter une course
              {form.is_unplanned && (
                <span style={{fontSize:10,fontFamily:'var(--font-mono)',fontWeight:700,
                  padding:'2px 7px',borderRadius:4,
                  background:'rgba(245,158,11,.12)',border:'1.5px dashed rgba(180,83,9,.5)',
                  color:'#92400e'}}>⚠ NON PLANIFIÉ</span>
              )}
            </div>
          </div>
          <Btn sm onClick={onClose}>✕</Btn>
        </div>

        {/* Bandeau trajet non planifié */}
        <div
          onClick={() => set('is_unplanned')(!form.is_unplanned)}
          style={{
            padding:'10px 20px', cursor:'pointer',
            background: form.is_unplanned
              ? 'repeating-linear-gradient(45deg,rgba(245,158,11,.08),rgba(245,158,11,.08) 6px,rgba(245,158,11,.03) 6px,rgba(245,158,11,.03) 12px)'
              : 'var(--paper)',
            borderBottom:'1.5px solid var(--stroke3)',
            display:'flex',alignItems:'center',gap:12,
            transition:'background .2s',
          }}>
          {/* Toggle custom */}
          <div style={{
            width:38,height:20,borderRadius:10,
            background: form.is_unplanned ? '#d97706' : 'var(--stroke3)',
            position:'relative',transition:'background .2s',flexShrink:0,
          }}>
            <div style={{
              position:'absolute',top:2,
              left: form.is_unplanned ? 20 : 2,
              width:16,height:16,borderRadius:'50%',background:'#fff',
              boxShadow:'0 1px 3px rgba(0,0,0,.2)',transition:'left .2s',
            }}/>
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:700,color: form.is_unplanned ? '#92400e' : 'var(--ink)'}}>
              Trajet non planifié
            </div>
            <div style={{fontSize:11,color:'var(--stroke2)',marginTop:1}}>
              Course ajoutée hors planning initial — sera signalée dans le rapport client
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{padding:20,display:'flex',flexDirection:'column',gap:14}}>

          {/* Ligne + Sens */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 120px',gap:12}}>
            <div>
              <label style={labelStyle}>Ligne <span style={{color:'var(--danger)'}}>*</span></label>
              <select value={form.ligne} onChange={e => set('ligne')(e.target.value)} style={selectStyle2}>
                {LIGNES_OPTS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Sens</label>
              <select value={form.sens} onChange={e => set('sens')(e.target.value)} style={selectStyle2}>
                <option value="AM">AM →</option>
                <option value="PM">PM ←</option>
                <option value="Journée">Journée</option>
                <option value="Astreinte">⟳ Astreinte</option>
              </select>
            </div>
          </div>

          {/* Chauffeur */}
          <div>
            <label style={labelStyle}>Chauffeur <span style={{color:'var(--danger)'}}>*</span></label>
            <select value={form.driver_id} onChange={e => set('driver_id')(e.target.value)}
              style={{...selectStyle2, borderColor: errors.driver_id ? 'var(--danger)' : 'var(--stroke3)'}}>
              <option value="">— Sélectionner un chauffeur —</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.driver_number} · {d.full_name}</option>)}
            </select>
            {errors.driver_id && <div style={{fontSize:10,color:'var(--danger)',marginTop:3}}>{errors.driver_id}</div>}
          </div>

          {/* Date + Heure départ + Heure arrivée */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 115px 115px',gap:12}}>
            <div>
              <label style={labelStyle}>Date <span style={{color:'var(--danger)'}}>*</span></label>
              <input type="date" value={form.date} onChange={e => set('date')(e.target.value)}
                style={{...inputStyle, borderColor: errors.date ? 'var(--danger)' : 'var(--stroke3)'}}/>
            </div>
            <div>
              <label style={labelStyle}>Départ</label>
              <input type="time" value={form.heure} onChange={e => set('heure')(e.target.value)} style={inputStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Arrivée</label>
              <input type="time" value={form.heure_arrivee} onChange={e => set('heure_arrivee')(e.target.value)} style={inputStyle}/>
            </div>
          </div>

          {/* Montant + Passagers + Notes */}
          <div style={{display:'grid',gridTemplateColumns:'115px 115px 1fr',gap:12}}>
            <div>
              <label style={labelStyle}>Montant (€)</label>
              <div style={{display:'flex',alignItems:'center',border:'1.25px solid var(--stroke3)',borderRadius:6,overflow:'hidden'}}>
                <input type="number" step="0.10" min="0" value={form.amount}
                  onChange={e => set('amount')(e.target.value)} placeholder="Auto"
                  style={{width:'100%',border:'none',padding:'8px 10px',fontSize:13,fontFamily:'var(--font-mono)',outline:'none'}}/>
                <span style={{padding:'0 8px',fontSize:12,color:'var(--stroke2)',background:'var(--paper)',
                  borderLeft:'1px solid var(--stroke3)',lineHeight:'34px'}}>€</span>
              </div>
            </div>
            <div>
              <label style={labelStyle}>
                Passagers
                {form.is_unplanned && <span style={{color:'var(--warn)',marginLeft:4}}>●</span>}
              </label>
              <input type="number" min="0" max="100" value={form.passenger_count}
                onChange={e => set('passenger_count')(e.target.value)}
                placeholder="Nb"
                style={{...inputStyle,
                  borderColor: form.is_unplanned ? 'rgba(180,83,9,.4)' : 'var(--stroke3)'}}/>
            </div>
            <div>
              <label style={labelStyle}>Notes</label>
              <input value={form.notes} onChange={e => set('notes')(e.target.value)}
                placeholder="Remarques, arrêts particuliers…" style={inputStyle}/>
            </div>
          </div>

          {/* Récap */}
          {form.driver_id && (
            <div style={{padding:'10px 12px',background:'var(--paper)',borderRadius:6,
              border:`1px solid ${form.is_unplanned ? 'rgba(180,83,9,.3)' : 'var(--stroke3)'}`,
              fontSize:12,display:'flex',alignItems:'center',gap:8}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:ligne?.color,flexShrink:0}}/>
              <span style={{fontFamily:'var(--font-mono)',fontSize:10,fontWeight:700,padding:'1px 6px',
                border:`1.5px solid ${ligne?.color}`,color:ligne?.color,borderRadius:3}}>{form.ligne}</span>
              <span style={{color:'var(--stroke2)'}}>
                {form.sens} · {form.date} · {form.heure}{form.heure_arrivee ? ` → ${form.heure_arrivee}` : ''}
              </span>
              {form.is_unplanned && (
                <span style={{fontSize:9,fontFamily:'var(--font-mono)',fontWeight:700,
                  padding:'1px 5px',borderRadius:3,background:'rgba(245,158,11,.15)',color:'#92400e',
                  border:'1px dashed rgba(180,83,9,.4)'}}>⚠ NON PLANIFIÉ</span>
              )}
              <span style={{marginLeft:'auto',fontFamily:'var(--font-mono)',fontSize:10,color:'var(--stroke3)'}}>
                {drivers.find(d => d.id === form.driver_id)?.driver_number}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{padding:'14px 20px',borderTop:'1.5px solid var(--stroke3)',display:'flex',gap:8,
          justifyContent:'flex-end',background:'var(--paper)'}}>
          <Btn onClick={onClose}>Annuler</Btn>
          <Btn accent onClick={handleSave} disabled={saving}>
            {saving ? 'Création…' : form.is_unplanned ? '⚠ Ajouter trajet non planifié →' : '+ Créer la course →'}
          </Btn>
        </div>
      </div>
    </div>
  );
}

interface DbTrip { id: string; scheduled_at: string; status: string; amount?: number; notes?: string; driver_id: string; driver_number?: string; driver_name?: string; }

// Mapping sens → direction DB (shared)
const sensToDirMap: Record<string, string> = {
  'AM':        'matin_aller',
  'PM':        'am_aller',
  'Journée':   'matin_aller',
  'Astreinte': 'matin_aller',
};

function EditCourseModal({ tripId, prefill, onClose, onSaved }: {
  tripId?: string;
  prefill?: { driver_id?: string; driver_number?: string; date?: string; heure?: string };
  onClose: () => void;
  onSaved: () => void;
}) {
  const { demo } = useDemoMode();
  const [form, setForm] = useState({
    driver_id: prefill?.driver_id ?? '',
    date: prefill?.date ?? new Date().toISOString().split('T')[0],
    heure: prefill?.heure ?? '05:00',
    heure_arrivee: '',
    sens: 'AM', ligne: 'L3',
    amount: '', notes: '',
    passenger_count: '', is_unplanned: false,
  });
  const [drivers, setDrivers] = useState<DbDriver[]>([]);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [loading, setLoading] = useState(!!tripId);

  useEffect(() => {
    loadDrivers(setDrivers, demo);
    if (tripId) {
      api.get(`/planning/${tripId}`).then(r => {
        const t: DbTrip & { is_unplanned?: boolean; passenger_count?: number } = r.data;
        const d = new Date(t.scheduled_at);
        const arr = (t as any).estimated_arrival_at ? new Date((t as any).estimated_arrival_at) : null;
        const notes = t.notes ?? '';
        const lignePart = LIGNES_OPTS.find(l => notes.includes(l.code));
        const isUnplanned = t.is_unplanned ?? notes.includes('Non planifié');
        setForm({
          driver_id: t.driver_id,
          date: toISO(d),
          heure: `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`,
          heure_arrivee: arr ? `${String(arr.getHours()).padStart(2,'0')}:${String(arr.getMinutes()).padStart(2,'0')}` : '',
          sens: notes.includes('Astreinte') ? 'Astreinte' : notes.includes('PM') ? 'PM' : notes.includes('Journée') ? 'Journée' : 'AM',
          ligne: lignePart?.code ?? 'L3',
          amount: t.amount ? String(t.amount) : '',
          notes: notes.split(' · ').filter(p =>
            !LIGNES_OPTS.some(l => l.code === p) &&
            p !== 'AM' && p !== 'PM' && p !== 'Journée' && p !== 'Astreinte' && p !== 'Non planifié'
          ).join(' · '),
          passenger_count: t.passenger_count ? String(t.passenger_count) : '',
          is_unplanned: isUnplanned,
        });
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [tripId]);

  const set = (k: keyof typeof form) => (v: string | boolean) => setForm(p => ({...p, [k]: v}));
  const ligne = LIGNES_OPTS.find(l => l.code === form.ligne);

  const handleSave = async () => {
    if (!form.driver_id || saving) return;
    setSaving(true);
    try {
      const scheduled_at = new Date(`${form.date}T${form.heure}:00`).toISOString();
      const estimated_arrival_at = form.heure_arrivee
        ? new Date(`${form.date}T${form.heure_arrivee}:00`).toISOString()
        : undefined;
      const notes = [form.ligne, form.sens, form.is_unplanned ? 'Non planifié' : '', form.notes]
        .filter(Boolean).join(' · ');
      const payload = {
        driver_id:            form.driver_id,
        scheduled_at,
        estimated_arrival_at,
        amount:               form.amount ? parseFloat(form.amount) : undefined,
        notes:                notes || undefined,
        is_unplanned:         form.is_unplanned,
        passenger_count:      form.passenger_count ? parseInt(form.passenger_count) : undefined,
        direction:            sensToDirMap[form.sens] || 'matin_aller',
      };
      if (tripId) { await api.put(`/planning/${tripId}`, payload); toast.success('Course modifiée'); }
      else { await api.post('/planning', payload); toast.success('Course créée'); }
      onSaved(); onClose();
    } catch { toast.error('Erreur lors de la sauvegarde'); }
    finally { setSaving(false); }
  };

  const handleCancel = async () => {
    if (!tripId || cancelling) return;
    setCancelling(true);
    try {
      await api.delete(`/planning/${tripId}`);
      toast.success('Course annulée');
      onSaved(); onClose();
    } catch { toast.error('Erreur lors de l\'annulation'); }
    finally { setCancelling(false); }
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(20,15,16,.38)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#fff',border:'1.5px solid var(--stroke)',borderRadius:8,boxShadow:'0 30px 80px rgba(20,15,16,.35)',width:500,overflow:'hidden'}}>

        {/* Header */}
        <div style={{padding:'16px 20px',borderBottom:'1.5px solid var(--stroke)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={labelStyle}>Planning · {tripId ? 'Modifier' : 'Créer'} une course</div>
            <div style={{fontWeight:700,fontSize:16,marginTop:4,display:'flex',alignItems:'center',gap:8}}>
              {tripId ? 'Modifier la course' : 'Nouvelle course'}
              {form.is_unplanned && (
                <span style={{fontSize:10,fontFamily:'var(--font-mono)',fontWeight:700,
                  padding:'2px 7px',borderRadius:4,
                  background:'rgba(245,158,11,.12)',border:'1.5px dashed rgba(180,83,9,.5)',
                  color:'#92400e'}}>⚠ NON PLANIFIÉ</span>
              )}
            </div>
          </div>
          <Btn sm onClick={onClose}>✕</Btn>
        </div>

        {/* Bandeau trajet non planifié */}
        <div
          onClick={() => set('is_unplanned')(!form.is_unplanned)}
          style={{
            padding:'10px 20px', cursor:'pointer',
            background: form.is_unplanned
              ? 'repeating-linear-gradient(45deg,rgba(245,158,11,.08),rgba(245,158,11,.08) 6px,rgba(245,158,11,.03) 6px,rgba(245,158,11,.03) 12px)'
              : 'var(--paper)',
            borderBottom:'1.5px solid var(--stroke3)',
            display:'flex',alignItems:'center',gap:12,
            transition:'background .2s',
          }}>
          <div style={{
            width:38,height:20,borderRadius:10,
            background: form.is_unplanned ? '#d97706' : 'var(--stroke3)',
            position:'relative',transition:'background .2s',flexShrink:0,
          }}>
            <div style={{
              position:'absolute',top:2,
              left: form.is_unplanned ? 20 : 2,
              width:16,height:16,borderRadius:'50%',background:'#fff',
              boxShadow:'0 1px 3px rgba(0,0,0,.2)',transition:'left .2s',
            }}/>
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:700,color: form.is_unplanned ? '#92400e' : 'var(--ink)'}}>
              Trajet non planifié
            </div>
            <div style={{fontSize:11,color:'var(--stroke2)',marginTop:1}}>
              Course hors planning initial — sera signalée dans le rapport client
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{padding:40,textAlign:'center',color:'var(--stroke2)',fontSize:13}}>Chargement…</div>
        ) : (
        <div style={{padding:20,display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 120px',gap:12}}>
            <div>
              <label style={labelStyle}>Ligne</label>
              <select value={form.ligne} onChange={e => set('ligne')(e.target.value)} style={selectStyle2}>
                {LIGNES_OPTS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Sens</label>
              <select value={form.sens} onChange={e => set('sens')(e.target.value)} style={selectStyle2}>
                <option value="AM">AM →</option>
                <option value="PM">PM ←</option>
                <option value="Journée">Journée</option>
                <option value="Astreinte">⟳ Astreinte</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Chauffeur <span style={{color:'var(--danger)'}}>*</span></label>
            <select value={form.driver_id} onChange={e => set('driver_id')(e.target.value)} style={selectStyle2}>
              <option value="">— Sélectionner —</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.driver_number} · {d.full_name}</option>)}
            </select>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 115px 115px',gap:12}}>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" value={form.date} onChange={e => set('date')(e.target.value)} style={inputStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Départ</label>
              <input type="time" value={form.heure} onChange={e => set('heure')(e.target.value)} style={inputStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Arrivée</label>
              <input type="time" value={form.heure_arrivee} onChange={e => set('heure_arrivee')(e.target.value)} style={inputStyle}/>
            </div>
          </div>
          {/* Montant + Passagers + Notes */}
          <div style={{display:'grid',gridTemplateColumns:'115px 115px 1fr',gap:12}}>
            <div>
              <label style={labelStyle}>Montant (€)</label>
              <div style={{display:'flex',alignItems:'center',border:'1.25px solid var(--stroke3)',borderRadius:6,overflow:'hidden'}}>
                <input type="number" step="0.10" min="0" value={form.amount} onChange={e => set('amount')(e.target.value)}
                  placeholder="Auto" style={{width:'100%',border:'none',padding:'8px 10px',fontSize:13,fontFamily:'var(--font-mono)',outline:'none'}}/>
                <span style={{padding:'0 8px',fontSize:12,color:'var(--stroke2)',background:'var(--paper)',borderLeft:'1px solid var(--stroke3)',lineHeight:'34px'}}>€</span>
              </div>
            </div>
            <div>
              <label style={labelStyle}>
                Passagers
                {form.is_unplanned && <span style={{color:'var(--warn)',marginLeft:4}}>●</span>}
              </label>
              <input type="number" min="0" max="100" value={form.passenger_count}
                onChange={e => set('passenger_count')(e.target.value)}
                placeholder="Nb"
                style={{...inputStyle,
                  borderColor: form.is_unplanned ? 'rgba(180,83,9,.4)' : 'var(--stroke3)'}}/>
            </div>
            <div>
              <label style={labelStyle}>Notes</label>
              <input value={form.notes} onChange={e => set('notes')(e.target.value)} placeholder="Remarques…" style={inputStyle}/>
            </div>
          </div>
          {form.driver_id && (
            <div style={{padding:'10px 12px',background:'var(--paper)',borderRadius:6,
              border:`1px solid ${form.is_unplanned ? 'rgba(180,83,9,.3)' : 'var(--stroke3)'}`,
              fontSize:12,display:'flex',alignItems:'center',gap:8}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:ligne?.color,flexShrink:0}}/>
              <span style={{fontFamily:'var(--font-mono)',fontSize:10,fontWeight:700,padding:'1px 6px',
                border:`1.5px solid ${ligne?.color}`,color:ligne?.color,borderRadius:3}}>{form.ligne}</span>
              <span style={{color:'var(--stroke2)'}}>
                {form.sens} · {form.date} · {form.heure}{form.heure_arrivee ? ` → ${form.heure_arrivee}` : ''}
              </span>
              {form.is_unplanned && (
                <span style={{fontSize:9,fontFamily:'var(--font-mono)',fontWeight:700,
                  padding:'1px 5px',borderRadius:3,background:'rgba(245,158,11,.15)',color:'#92400e',
                  border:'1px dashed rgba(180,83,9,.4)'}}>⚠ NON PLANIFIÉ</span>
              )}
              <span style={{marginLeft:'auto',fontFamily:'var(--font-mono)',fontSize:10,color:'var(--stroke3)'}}>
                {drivers.find(d=>d.id===form.driver_id)?.driver_number}
              </span>
            </div>
          )}
        </div>
        )}
        <div style={{padding:'14px 20px',borderTop:'1.5px solid var(--stroke3)',display:'flex',gap:8,alignItems:'center',background:'var(--paper)'}}>
          {tripId && <Btn sm onClick={handleCancel} disabled={cancelling} style={{color:'var(--danger)',borderColor:'var(--danger)',marginRight:'auto'}}>{cancelling?'Annulation…':'Annuler la course'}</Btn>}
          <Btn onClick={onClose}>Fermer</Btn>
          <Btn accent onClick={handleSave} disabled={saving || !form.driver_id}>
            {saving ? 'Sauvegarde…' : form.is_unplanned ? '⚠ Enregistrer non planifié →' : tripId ? 'Enregistrer →' : '+ Créer →'}
          </Btn>
        </div>
      </div>
    </div>
  );
}

function getDaySchedule(dr: DriverExt, dayOfWeek: number): { am?: string; pm?: string; astr?: string; off?: boolean; special?: string } {
  if (dayOfWeek === 0) { // Dimanche
    if (!dr.dimJF) return { off: true };
    return { special: dr.dimJF, am: dr.am, pm: dr.pm };
  }
  return { am: dr.am, pm: dr.pm, astr: dr.astr };
}

function WeekGridView({ currentDate, ligne, refreshKey, onEditCell, drivers: driversProp }: {
  currentDate: Date; ligne: string; refreshKey?: number;
  onEditCell: (dr: DriverExt, date: Date, tripId?: string) => void;
  drivers?: DriverExt[];
}) {
  const { demo } = useDemoMode();
  const mon = startOfWeek(currentDate);
  const monISO = toISO(mon);
  const days = Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  const today = new Date();

  // tripMap: driverNumber → isoDate → trips[]
  const [tripMap, setTripMap] = useState<Record<string, Record<string, any[]>>>({});
  const [apiReady, setApiReady] = useState(false);
  // driverLineMap: driverNumber → lineCode (derived from actual trips this week)
  const [driverLineMap, setDriverLineMap] = useState<Record<string,string>>({});
  // weekLinesFromTrips: lines found in trip data this week
  const [weekLinesFromTrips, setWeekLinesFromTrips] = useState<Array<{code:string;name:string;badge:string;color:string}>>([]);

  useEffect(() => {
    if (demo) { setTripMap({}); setApiReady(false); return; }
    let cancelled = false;
    const monDate = new Date(monISO);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(monDate, i));
    const load = async () => {
      try {
        const [drRes, ...dayResults] = await Promise.all([
          api.get('/drivers'),
          ...weekDays.map(d => api.get(`/planning?date=${toISO(d)}`).catch(() => ({ data: [] }))),
        ]);
        if (cancelled) return;
        const driverList: Array<{ id: string; driver_number: string }> = drRes.data || [];
        const idToNum: Record<string, string> = {};
        driverList.forEach(d => { idToNum[d.id] = d.driver_number; });
        const map: Record<string, Record<string, any[]>> = {};
        weekDays.forEach((day, i) => {
          const isoDay = toISO(day);
          const trips: any[] = (dayResults[i] as any).data || [];
          trips.forEach(trip => {
            const dnum = idToNum[trip.driver_id];
            if (!dnum) return;
            if (!map[dnum]) map[dnum] = {};
            if (!map[dnum][isoDay]) map[dnum][isoDay] = [];
            map[dnum][isoDay].push(trip);
          });
        });
        // Build driver→line and line metadata from trip data
        const dlm: Record<string,string> = {};
        const lim: Record<string,{code:string;name:string;badge:string;color:string}> = {};
        weekDays.forEach((day, i) => {
          const trips: any[] = (dayResults[i] as any).data || [];
          trips.forEach(trip => {
            const dnum = idToNum[trip.driver_id];
            if (dnum && trip.line_code && !dlm[dnum]) dlm[dnum] = trip.line_code;
            if (trip.line_code && !lim[trip.line_code]) {
              lim[trip.line_code] = {
                code:  trip.line_code,
                name:  trip.line_name  ?? trip.line_code,
                badge: trip.line_badge ?? trip.line_code,
                color: trip.line_color ?? '#888',
              };
            }
          });
        });
        setDriverLineMap(dlm);
        setWeekLinesFromTrips(Object.values(lim));
        setTripMap(map);
        setApiReady(true);
      } catch {
        setApiReady(false);
      }
    };
    setApiReady(false);
    load();
    return () => { cancelled = true; };
  }, [monISO, refreshKey, demo]);

  const allDrivers = driversProp ?? STATIC_DRIVER_EXT;

  // Fallback line info for legacy hardcoded lines
  const WEEK_FALLBACK_LINES: Record<string,{code:string;name:string;badge:string;color:string}> = {
    'L3':  {code:'L3',  name:'Doujani ↔ Passot Barge', badge:'L3',  color:'var(--brand)'},
    'L4':  {code:'L4',  name:'Vahibe ↔ Passamainty',   badge:'L4',  color:'var(--info)'},
    'CHM': {code:'CHM', name:'CHM ↔ La Barge',          badge:'CHM', color:'var(--success)'},
  };
  // Merge fallbacks with lines derived from actual trips
  const allLineInfoMap: Record<string,{code:string;name:string;badge:string;color:string}> = {...WEEK_FALLBACK_LINES};
  weekLinesFromTrips.forEach(l => { allLineInfoMap[l.code] = l; });
  // Effective line for a driver: trip-based override when available, else driver-prefix fallback
  const weekEffectiveLine = (d: DriverExt) => driverLineMap[d.code] ?? d._ligne;
  // All distinct lines that have at least one driver, in stable order
  const weekLineCodesForView = Array.from(new Set(allDrivers.map(d => weekEffectiveLine(d))));
  const weekLinesForView = weekLineCodesForView.map(code => allLineInfoMap[code] ?? {code, name:code, badge:code, color:'#888'});

  const shown = ligne === 'Tous' ? allDrivers : allDrivers.filter(d => weekEffectiveLine(d) === ligne);

  const timeShort = (t?: string) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    return m === '00' ? `${h}h` : `${h}h${m}`;
  };

  const CellBadge = ({ color, label, outline, onClick }: { color: string; label: string; outline?: boolean; onClick?: (e: React.MouseEvent) => void }) => (
    <div onClick={onClick} style={{
      fontSize: 9, fontFamily: 'var(--font-mono)', padding: '1px 4px', borderRadius: 3, marginBottom: 2,
      background: outline ? 'transparent' : color,
      border: `1px solid ${color}`,
      color: outline ? color : '#fff',
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      cursor: onClick ? 'pointer' : 'default',
    }}>{label}</div>
  );

  return (
    <div className="scroll" style={{flex:1}}>
      <div style={{minWidth:820}}>
        {/* Sticky header */}
        <div style={{display:'grid',gridTemplateColumns:'190px repeat(7,1fr)',borderBottom:'2px solid var(--stroke)',
          position:'sticky',top:0,background:'#fff',zIndex:3}}>
          <div style={{padding:'8px 10px',fontFamily:'var(--font-mono)',fontSize:9,letterSpacing:'.12em',
            textTransform:'uppercase',color:'var(--stroke2)',borderRight:'1.5px solid var(--stroke)',
            display:'flex',alignItems:'center'}}>Chauffeur</div>
          {days.map((d, i) => {
            const isT = isSameDay(d, today);
            const isWe = d.getDay() === 0 || d.getDay() === 6;
            return (
              <div key={i} style={{padding:'6px 4px',textAlign:'center',
                background: isT ? 'rgba(242,100,25,0.08)' : isWe ? 'var(--ink-100)' : '#fff',
                borderLeft:'1px solid var(--stroke4)'}}>
                <div style={{fontFamily:'var(--font-mono)',fontSize:8,letterSpacing:'.1em',textTransform:'uppercase',
                  color: isWe ? 'var(--stroke2)' : 'var(--stroke3)'}}>{DAYS_FR[d.getDay()]}</div>
                <div style={{fontFamily:'var(--font-mono)',fontSize:16,fontWeight: isT ? 700 : 500,
                  color: isT ? 'var(--brand)' : isWe ? 'var(--ink)' : 'var(--ink)',lineHeight:1.2}}>{d.getDate()}</div>
                <div style={{fontSize:8,color:'var(--stroke3)',fontFamily:'var(--font-mono)'}}>{MONTHS_SHORT[d.getMonth()]}</div>
              </div>
            );
          })}
        </div>

        {/* Rows grouped by line */}
        {weekLinesForView.filter(lineInfo => ligne==='Tous'||ligne===lineInfo.code).map(lineInfo => {
          const l = lineInfo.code;
          const lineDrivers = shown.filter(d => weekEffectiveLine(d) === l);
          if (!lineDrivers.length) return null;
          const lineLabel = lineInfo.name;
          const lineColor = lineInfo.color;
          return (
            <div key={l}>
              {/* Line header */}
              <div style={{display:'grid',gridTemplateColumns:'190px 1fr',borderBottom:'1px solid var(--stroke3)',
                background:'var(--ink-100)'}}>
                <div style={{padding:'5px 10px 5px 14px',display:'flex',alignItems:'center',gap:6}}>
                  <span style={{width:7,height:7,borderRadius:'50%',background:lineColor,flexShrink:0}}/>
                  <span style={{fontFamily:'var(--font-mono)',fontSize:10,fontWeight:700}}>{l}</span>
                  <span style={{fontSize:10,color:'var(--stroke2)'}}>{lineLabel}</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)'}}>
                  {days.map((d, i) => {
                    const isWe = d.getDay() === 0 || d.getDay() === 6;
                    return <div key={i} style={{borderLeft:'1px solid var(--stroke4)',
                      background: isWe ? 'rgba(0,0,0,0.02)' : 'transparent'}}/>;
                  })}
                </div>
              </div>
              {/* Driver rows */}
              {lineDrivers.map(dr => (
                <div key={dr.code} style={{display:'grid',gridTemplateColumns:'190px repeat(7,1fr)',
                  borderBottom:'1px solid var(--stroke4)',minHeight:52}}>
                  {/* Driver info */}
                  <div style={{padding:'6px 10px',borderRight:'1.5px solid var(--stroke)',display:'flex',
                    flexDirection:'column',justifyContent:'center',gap:2}}>
                    <span style={{display:'flex',alignItems:'center',gap:5}}>
                      <span style={{width:6,height:6,borderRadius:'50%',background:lineColor,flexShrink:0}}/>
                      <span style={{fontFamily:'var(--font-mono)',fontSize:9,fontWeight:800,color:lineColor,
                        padding:'0 3px',border:`1.5px solid ${lineColor}`,borderRadius:3}}>{dr.code}</span>
                      <span style={{fontWeight:700,fontSize:11,color:'var(--ink)'}}>{dr.nom}</span>
                    </span>
                    <span style={{display:'flex',alignItems:'center',gap:4,paddingLeft:11}}>
                      {dr.vehicule && <span style={{fontFamily:'var(--font-mono)',fontSize:8,color:'var(--stroke3)'}}>{dr.vehicule}</span>}
                    </span>
                  </div>
                  {/* Day cells */}
                  {days.map((d, i) => {
                    const isT = isSameDay(d, today);
                    const isWe = d.getDay() === 0 || d.getDay() === 6;
                    const isoDay = toISO(d);
                    const sched = getDaySchedule(dr, d.getDay());
                    const apiTrips: any[] | null = apiReady
                      ? (tripMap[dr.code]?.[isoDay] ?? []).filter((t: any) => t.status !== 'cancelled')
                      : null;
                    return (
                      <div key={i} onClick={() => {
                          const trips = (tripMap[dr.code]?.[isoDay] ?? []).filter((t: any) => t.status !== 'cancelled');
                          onEditCell(dr, d, trips[0]?.id);
                        }}
                        style={{borderLeft:'1px solid var(--stroke4)',padding:'5px 5px',cursor:'pointer',
                          background: isT ? 'rgba(242,100,25,0.05)' : isWe ? 'rgba(0,0,0,0.015)' : '#fff',
                          transition:'background .1s'}}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.04)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isT?'rgba(242,100,25,0.05)':isWe?'rgba(0,0,0,0.015)':'#fff'; }}>
                        {apiTrips !== null ? (
                          apiTrips.length === 0 ? (
                            <div style={{fontSize:9,color:'var(--stroke3)',fontFamily:'var(--font-mono)',paddingTop:4}}>—</div>
                          ) : (
                            apiTrips.map((t: any, ti: number) => {
                              const notes = t.notes || '';
                              const isAstr = notes.includes('Astreinte');
                              const isUnplanned = t.is_unplanned || notes.includes('Non planifié');
                              const isPm = notes.includes('PM') && !notes.includes('Journée');
                              const dt = new Date(t.scheduled_at);
                              const hh = String(dt.getHours()).padStart(2,'0');
                              const mm = dt.getMinutes();
                              const timeStr = mm ? `${hh}h${String(mm).padStart(2,'0')}` : `${hh}h`;
                              // Clic individuel sur le badge → ID exact du trajet
                              const handleTripClick = (e: React.MouseEvent) => {
                                e.stopPropagation();
                                onEditCell(dr, d, t.id);
                              };
                              if (isAstr) return (
                                <div key={ti} onClick={handleTripClick} style={{fontSize:8,fontFamily:'var(--font-mono)',fontWeight:700,
                                  padding:'1px 4px',borderRadius:3,marginBottom:2,cursor:'pointer',
                                  background:'repeating-linear-gradient(45deg,rgba(245,158,11,0.15),rgba(245,158,11,0.15) 3px,transparent 3px,transparent 8px)',
                                  border:'1px dashed rgba(180,83,9,0.5)',color:'#92400e',
                                  whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',
                                }}>⟳ {timeStr}</div>
                              );
                              if (isUnplanned) return (
                                <div key={ti} onClick={handleTripClick} style={{fontSize:8,fontFamily:'var(--font-mono)',fontWeight:700,
                                  padding:'1px 4px',borderRadius:3,marginBottom:2,cursor:'pointer',
                                  background:'repeating-linear-gradient(45deg,rgba(245,158,11,0.1),rgba(245,158,11,0.1) 3px,rgba(245,158,11,0.03) 3px,rgba(245,158,11,0.03) 8px)',
                                  border:'1.5px dashed rgba(180,83,9,0.6)',color:'#92400e',
                                  whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',
                                }}>⚠ {timeStr}{isPm?'←':'→'}</div>
                              );
                              return <CellBadge key={ti} color={lineColor} label={`${timeStr}${isPm?'←':'→'}`} outline={isPm} onClick={handleTripClick}/>;
                            })
                          )
                        ) : (
                          sched.off ? (
                            <div style={{fontSize:9,color:'var(--stroke3)',fontFamily:'var(--font-mono)',paddingTop:4}}>—</div>
                          ) : (
                            <>
                              {sched.special && (
                                <div style={{fontSize:8,color:'var(--info)',fontFamily:'var(--font-mono)',marginBottom:1}}>{sched.special}</div>
                              )}
                              {sched.am && (() => {
                                const [s,e] = sched.am.split('-');
                                return <CellBadge color={lineColor} label={`${timeShort(s)}→${timeShort(e)}`}/>;
                              })()}
                              {sched.pm && (() => {
                                const [s,e] = sched.pm.split('-');
                                return <CellBadge color={lineColor} label={`${timeShort(s)}→${timeShort(e)}`} outline/>;
                              })()}
                              {sched.astr && sched.astr.split('·').map((seg,si) => {
                                const [s,e] = seg.trim().split('-');
                                const label = s && e ? `⟳ ${timeShort(s)}→${timeShort(e)}` : '⟳ Astr.';
                                return (
                                  <div key={si} style={{
                                    fontSize:8,fontFamily:'var(--font-mono)',fontWeight:700,
                                    padding:'1px 4px',borderRadius:3,marginBottom:2,
                                    background:'repeating-linear-gradient(45deg,rgba(245,158,11,0.15),rgba(245,158,11,0.15) 3px,transparent 3px,transparent 8px)',
                                    border:'1px dashed rgba(180,83,9,0.5)',color:'#92400e',
                                    whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',
                                  }}>{label}</div>
                                );
                              })}
                            </>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DupliquerModal({ mode, currentDate, onClose }: {
  mode: ViewMode; currentDate: Date; onClose: () => void;
}) {
  const [targetDate, setTargetDate] = useState(toISO(new Date()));
  const [duplicating, setDuplicating] = useState(false);

  const handleDuplicate = async () => {
    if (!targetDate) return;
    setDuplicating(true);
    try {
      let dates: string[] = [];
      if (mode === 'jour') {
        dates = [toISO(currentDate)];
      } else if (mode === 'semaine') {
        const mon = startOfWeek(currentDate);
        dates = Array.from({ length: 7 }, (_, i) => toISO(addDays(mon, i)));
      } else {
        const y = currentDate.getFullYear(), m = currentDate.getMonth();
        const days = new Date(y, m + 1, 0).getDate();
        dates = Array.from({ length: days }, (_, i) => toISO(new Date(y, m, i + 1)));
      }
      const allTrips: any[] = [];
      await Promise.all(dates.map(async (date) => {
        try { const { data } = await api.get(`/planning?date=${date}`); allTrips.push(...(data || [])); } catch {}
      }));
      const srcStart = mode === 'jour' ? new Date(toISO(currentDate))
        : mode === 'semaine' ? new Date(toISO(startOfWeek(currentDate)))
        : new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const offsetDays = Math.round((new Date(targetDate).getTime() - srcStart.getTime()) / 86400000);
      let created = 0;
      await Promise.all(allTrips
        .filter((t: any) => t.status !== 'cancelled')
        .map(async (t: any) => {
          const dst = addDays(new Date(t.scheduled_at), offsetDays);
          await api.post('/planning', {
            driver_id: t.driver_id,
            scheduled_at: dst.toISOString(),
            amount: t.amount || undefined,
            notes: t.notes || undefined,
          });
          created++;
        })
      );
      toast.success(`${created} course(s) dupliquée(s)`);
      onClose();
    } catch {
      toast.error('Erreur lors de la duplication');
    } finally {
      setDuplicating(false);
    }
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(20,15,16,.38)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#fff',border:'1.5px solid var(--stroke)',borderRadius:8,
        boxShadow:'0 30px 80px rgba(20,15,16,.35)',width:400,overflow:'hidden'}}>
        <div style={{padding:'16px 20px',borderBottom:'1.5px solid var(--stroke)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={labelStyle}>Planning · Dupliquer</div>
            <div style={{fontWeight:700,fontSize:16,marginTop:4}}>Dupliquer la {mode}</div>
          </div>
          <Btn sm onClick={onClose}>✕</Btn>
        </div>
        <div style={{padding:20,display:'flex',flexDirection:'column',gap:14}}>
          <div style={{padding:'10px 12px',background:'var(--paper)',borderRadius:6,border:'1px solid var(--stroke3)'}}>
            <div style={labelStyle}>Source</div>
            <div style={{fontWeight:600,fontSize:13,marginTop:3}}>{periodLabel(mode, currentDate)}</div>
          </div>
          <div>
            <label style={labelStyle}>Date cible (début de période)</label>
            <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} style={inputStyle}/>
          </div>
          <div style={{fontSize:11,color:'var(--stroke2)',padding:'8px 10px',background:'rgba(242,100,25,.06)',borderRadius:6,border:'1px solid rgba(242,100,25,.15)'}}>
            Les courses de la période source seront recréées en décalant les dates au prorata.
          </div>
        </div>
        <div style={{padding:'14px 20px',borderTop:'1.5px solid var(--stroke3)',display:'flex',gap:8,justifyContent:'flex-end',background:'var(--paper)'}}>
          <Btn onClick={onClose}>Annuler</Btn>
          <Btn accent onClick={handleDuplicate} disabled={duplicating || !targetDate}>
            {duplicating ? 'Duplication…' : 'Dupliquer →'}
          </Btn>
        </div>
      </div>
    </div>
  );
}

function MonthView({ currentDate, onDayClick }: { currentDate: Date; onDayClick: (d: Date) => void }) {
  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const gridStart = startOfWeek(firstDay);
  const weeksNeeded = Math.ceil((lastDay.getDate() + (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1)) / 7);
  const days = Array.from({ length: weeksNeeded * 7 }, (_, i) => addDays(gridStart, i));

  return (
    <div className="scroll" style={{flex:1,padding:20}}>
      <div style={{maxWidth:900,margin:'0 auto',border:'1px solid var(--stroke3)',borderRadius:8,overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',background:'var(--stroke3)',gap:'1px'}}>
          {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d => (
            <div key={d} style={{padding:'7px 8px',background:'var(--paper)',fontFamily:'var(--font-mono)',
              fontSize:9,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--stroke2)',textAlign:'center'}}>
              {d}
            </div>
          ))}
          {days.map((d, i) => {
            const inMonth = d.getMonth() === month;
            const isToday = isSameDay(d, today);
            return (
              <div key={i} onClick={() => onDayClick(d)}
                style={{padding:'8px',background:isToday?'rgba(242,100,25,0.07)':inMonth?'#fff':'var(--ink-100)',
                  minHeight:90,cursor:'pointer',borderTop:'1px solid var(--stroke4)'}}>
                <div style={{
                  width:22,height:22,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
                  fontFamily:'var(--font-mono)',fontSize:12,fontWeight:isToday?700:400,
                  background:isToday?'var(--brand)':'transparent',
                  color:isToday?'#fff':inMonth?'var(--ink)':'var(--stroke3)',
                }}>
                  {d.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function PlanningPage() {
  const [ligne, setLigne] = useState('Tous');
  const [showAlert, setShowAlert] = useState(true);
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [editCell, setEditCell] = useState<{ dr: DriverExt; date: Date; tripId?: string } | null>(null);
  const [barDetail, setBarDetail] = useState<BarDetail | null>(null);
  // Map driverCode → trips[] pour la journée courante (vue jour)
  const [dayTripMap, setDayTripMap] = useState<Record<string, any[]>>({});
  const [replaceTarget, setReplaceTarget] = useState<DriverExt|null>(null);
  const [replacements, setReplacements] = useState<Replacement[]>([]);

  const [selectedDriverCode, setSelectedDriverCode] = useState('');
  const [replacing, setReplacing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('semaine');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey(k => k + 1);
  const { demo } = useDemoMode();
  const [realDrivers, setRealDrivers] = useState<DriverExt[]>([]);
  // Lines fetched from /clients/lines (used for day-view grouping and filter pills)
  const [clientLines, setClientLines] = useState<Array<{code:string;name:string;badge:string;color:string}>>([]);
  // driverNumber → lineCode for the currently displayed day (derived from dayTripMap trips)
  const [dayDriverLineMap, setDayDriverLineMap] = useState<Record<string,string>>({});

  // Fetch transport lines from API
  useEffect(() => {
    if (demo) return;
    api.get('/clients/lines')
      .then(r => {
        const lines: any[] = r.data ?? [];
        setClientLines(lines.map((l: any) => ({
          code:  l.code,
          name:  l.name,
          badge: l.badge ?? l.code,
          color: l.color ?? '#888',
        })));
      })
      .catch(() => {});
  }, [demo]);

  // En mode réel : charger les chauffeurs depuis l'API
  useEffect(() => {
    if (demo) { setRealDrivers([]); return; }
    api.get('/drivers')
      .then(r => {
        const list: DbDriver[] = r.data ?? [];
        setRealDrivers(list.map(apiToDriverExt));
      })
      .catch(() => setRealDrivers([]));
  }, [demo, refreshKey]);

  // Charger les courses réelles pour la vue jour (pour récupérer les tripId sur clic barre)
  useEffect(() => {
    if (viewMode !== 'jour' || demo) { setDayTripMap({}); return; }
    const isoDate = toISO(currentDate);
    Promise.all([api.get('/drivers'), api.get(`/planning?date=${isoDate}`)])
      .then(([drRes, trRes]) => {
        const driverList: any[] = drRes.data || [];
        const trips: any[] = trRes.data || [];
        const idToNum: Record<string, string> = {};
        driverList.forEach((d: any) => { idToNum[d.id] = d.driver_number; });
        const map: Record<string, any[]> = {};
        const dlm: Record<string, string> = {};
        trips.filter((t: any) => t.status !== 'cancelled').forEach((t: any) => {
          const code = idToNum[t.driver_id];
          if (!code) return;
          if (!map[code]) map[code] = [];
          map[code].push(t);
          if (t.line_code && !dlm[code]) dlm[code] = t.line_code;
        });
        setDayTripMap(map);
        setDayDriverLineMap(dlm);
      })
      .catch(() => {});
  }, [viewMode, currentDate, refreshKey, demo]);

  const handleConfirmReplace = async () => {
    if (!selectedDriverCode || !replaceTarget || replacing) return;
    setReplacing(true);
    try {
      const isoDate = toISO(currentDate);
      const [{ data: dbDrivers }, { data: trips }] = await Promise.all([
        api.get('/drivers'),
        api.get(`/planning?date=${isoDate}`),
      ]);
      const oldDriver = dbDrivers.find((d: any) => d.driver_number === replaceTarget.code);
      const newDriver = dbDrivers.find((d: any) => d.driver_number === selectedDriverCode);
      if (!oldDriver || !newDriver) throw new Error('Chauffeur introuvable en base');
      const driverTrips = trips.filter((t: any) =>
        t.driver_id === oldDriver.id && t.status !== 'cancelled' && t.status !== 'completed'
      );
      if (!driverTrips.length) {
        toast(`Aucune course active pour ${replaceTarget.code} aujourd'hui`, { icon: 'ℹ️' });
      } else {
        await Promise.all(driverTrips.map((t: any) =>
          api.put(`/planning/${t.id}/driver`, { driver_id: newDriver.id, reason: 'Remplacement coordinateur' })
        ));
        toast.success(`${replaceTarget.code} → ${selectedDriverCode} : ${driverTrips.length} course(s) réaffectée(s)`);
        setReplacements(prev => [...prev, {
          oldCode: replaceTarget.code,
          newCode: selectedDriverCode,
          oldDr:   replaceTarget,
        }]);
        refresh(); // recharger le planning avec les vraies données DB
      }
      setReplaceTarget(null);
      setSelectedDriverCode('');
    } catch (e: any) {
      const detail = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Erreur';
      const status = e?.response?.status ? ` (HTTP ${e.response.status})` : '';
      console.error('[replaceDriver] failed:', e?.response?.status, e?.response?.data, e);
      toast.error(`Remplacement: ${Array.isArray(detail) ? detail.join(', ') : detail}${status}`);
    } finally {
      setReplacing(false);
    }
  };

  const allDrivers: DriverExt[] = demo ? STATIC_DRIVER_EXT : realDrivers;

  // Fallback line info for day view (before trip data loads or for static drivers)
  const DAY_FALLBACK_LINES: Record<string,{code:string;name:string;badge:string;color:string}> = {
    'L3':  {code:'L3',  name:'Doujani ↔ Passot Barge', badge:'L3',  color:'var(--brand)'},
    'L4':  {code:'L4',  name:'Vahibe ↔ Passamainty',   badge:'L4',  color:'var(--info)'},
    'CHM': {code:'CHM', name:'CHM ↔ La Barge',          badge:'CHM', color:'var(--success)'},
  };
  const dayLineInfoMap: Record<string,{code:string;name:string;badge:string;color:string}> = {...DAY_FALLBACK_LINES};
  clientLines.forEach(l => { dayLineInfoMap[l.code] = l; });
  const dayEffectiveLine = (d: DriverExt) => dayDriverLineMap[d.code] ?? d._ligne;

  // Build filter pill options from drivers + client lines
  const LEGACY_LINE_CODES = ['L3','L4','CHM'];
  const extraLineCodes = clientLines.map(l => l.code).filter(c => !LEGACY_LINE_CODES.includes(c));
  const lignes = ['Tous', ...LEGACY_LINE_CODES, ...extraLineCodes];

  const shown = ligne==='Tous' ? allDrivers : allDrivers.filter(d => dayEffectiveLine(d) === ligne);

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      {showNewCourse && (
        <NouvelleCourseModal onClose={() => setShowNewCourse(false)} onCreated={() => { setShowNewCourse(false); refresh(); }}/>
      )}
      {showDuplicate && (
        <DupliquerModal mode={viewMode} currentDate={currentDate} onClose={() => setShowDuplicate(false)}/>
      )}
      {barDetail && (
        <CourseDetailPopup
          detail={barDetail}
          onClose={() => setBarDetail(null)}
          onEdit={async () => {
            let tripId = barDetail.tripId;
            // Si pas encore résolu (barre statique), chercher le trajet en base
            if (!tripId) {
              try {
                const isoDate = toISO(currentDate);
                const [drRes, trRes] = await Promise.all([
                  api.get('/drivers'),
                  api.get(`/planning?date=${isoDate}`),
                ]);
                const dbDriver = (drRes.data as any[]).find(
                  (d: any) => d.driver_number === barDetail.dr.code
                );
                if (dbDriver) {
                  const active = (trRes.data as any[]).filter(
                    (t: any) => t.driver_id === dbDriver.id && t.status !== 'cancelled'
                  );
                  // Préférer le trajet dont l'heure est proche de la barre
                  const matched = active.find((t: any) => {
                    const h = new Date(t.scheduled_at).getHours()
                           + new Date(t.scheduled_at).getMinutes() / 60;
                    return Math.abs(h - barDetail.start) < 2;
                  }) ?? active[0];
                  tripId = matched?.id;
                }
              } catch { /* pas de réseau → mode création */ }
            }
            setBarDetail(null);
            setEditCell({ dr: barDetail.dr, date: currentDate, tripId });
          }}
          onDelete={() => setBarDetail(null)}
        />
      )}
      {editCell && (
        <EditCourseModal
          tripId={editCell.tripId}
          prefill={{
            date: toISO(editCell.date),
            heure: editCell.dr.am ? editCell.dr.am.split('-')[0].padEnd(5,'0') : '05:00',
          }}
          onClose={() => setEditCell(null)}
          onSaved={() => { setEditCell(null); refresh(); }}
        />
      )}
      {showAlert && (
        <AlertBanner
          driver="D7 · COMBO Said · GB-965-EQ"
          message="Panne moteur · Passot La Barge · vocal 0:33 · course 17:50 non effectuée"
          age="28 mn"
          onDismiss={() => setShowAlert(false)}
          onReplace={() => { setReplaceTarget(allDrivers.find(d=>d.code==='D7')||null); setShowAlert(false); }}
        />
      )}

      {/* ── Page header ── */}
      <div style={{
        padding: '10px 20px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--surface)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Prev / Today / Next */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button
              onClick={() => setCurrentDate(d => navigateDate(viewMode, d, -1))}
              style={{ width: 30, height: 30, border: '1px solid var(--border)', borderRadius: '6px 0 0 6px',
                cursor: 'pointer', background: 'var(--surface)', color: 'var(--text)', fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
              ‹
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              style={{ height: 30, padding: '0 10px', border: '1px solid var(--border)', borderLeft: 'none', borderRight: 'none',
                cursor: 'pointer', background: 'var(--surface)', color: 'var(--text-2)',
                fontSize: 11, fontFamily: 'var(--font-mono)' }}>
              Aujourd'hui
            </button>
            <button
              onClick={() => setCurrentDate(d => navigateDate(viewMode, d, 1))}
              style={{ width: 30, height: 30, border: '1px solid var(--border)', borderRadius: '0 6px 6px 0',
                cursor: 'pointer', background: 'var(--surface)', color: 'var(--text)', fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
              ›
            </button>
          </div>
          {/* Title */}
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.12em',
              textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>
              {viewMode === 'semaine' ? 'Programme de ligne' : viewMode === 'jour' ? 'Planning journée' : 'Calendrier mensuel'}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', letterSpacing: '-.02em', marginTop: 1 }}>
              {periodLabel(viewMode, currentDate)}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* View mode switcher */}
          <div style={{ display: 'flex', gap: 2, background: 'var(--surface-3)', borderRadius: 7, padding: 2, border: '1px solid var(--border)' }}>
            {(['jour','semaine','mois'] as ViewMode[]).map(m => (
              <button key={m} onClick={() => setViewMode(m)}
                style={{ padding: '3px 12px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 11,
                  fontFamily: 'var(--font-mono)', letterSpacing: '.04em',
                  background: viewMode === m ? 'var(--surface)' : 'transparent',
                  color: viewMode === m ? 'var(--text)' : 'var(--text-3)',
                  fontWeight: viewMode === m ? 600 : 400,
                  boxShadow: viewMode === m ? 'var(--sh-xs)' : 'none' }}>
                {m === 'jour' ? 'Jour' : m === 'semaine' ? 'Semaine' : 'Mois'}
              </button>
            ))}
          </div>
          <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 2px' }}/>
          <button className="btn btn-sm" onClick={() => setShowDuplicate(true)}>Dupliquer</button>
          <button className="btn btn-sm">Imprimer</button>
          <button className="btn btn-sm btn-accent" onClick={() => setShowNewCourse(true)}>+ Course</button>
        </div>
      </div>

      {viewMode !== 'mois' && (
      <div style={{padding:'7px 20px',borderBottom:'1px dashed var(--stroke3)',background:'var(--paper)',
        display:'flex',gap:6,alignItems:'center',flexShrink:0,flexWrap:'wrap'}}>
        <Eyebrow>Ligne</Eyebrow>
        {lignes.map(l => (
          <span key={l} onClick={() => setLigne(l)} style={{cursor:'pointer'}}>
            <Pill variant={ligne===l?'active-dark':''}>{l}</Pill>
          </span>
        ))}
        <div style={{width:1,height:16,background:'var(--stroke3)',margin:'0 4px'}}/>
        <span style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'var(--stroke2)'}}>
          <span style={{width:10,height:4,background:'var(--stroke)',borderRadius:1,display:'inline-block'}}/>AM
          <span style={{width:10,height:4,border:'1px solid var(--stroke)',borderRadius:1,display:'inline-block',marginLeft:6}}/>PM
          <span style={{width:10,height:4,border:'1px dashed var(--warn)',borderRadius:1,display:'inline-block',marginLeft:6}}/>Astr.
          <span style={{
            fontFamily:'var(--font-mono)',fontSize:9,fontWeight:700,marginLeft:6,
            padding:'1px 5px',borderRadius:3,
            background:'repeating-linear-gradient(45deg,rgba(245,158,11,0.15),rgba(245,158,11,0.15) 3px,transparent 3px,transparent 8px)',
            border:'1.5px dashed rgba(180,83,9,0.6)',color:'#92400e',
          }}>⚠ Non planifié</span>
        </span>
        <span style={{marginLeft:'auto'}}>
          {!showAlert && <Btn sm onClick={() => setShowAlert(true)}>⚠ Alerte D7</Btn>}
        </span>
      </div>
      )}

      {viewMode === 'mois' ? (
        <MonthView currentDate={currentDate} onDayClick={(d) => { setCurrentDate(d); setViewMode('jour'); }}/>
      ) : viewMode === 'semaine' ? (
        <WeekGridView currentDate={currentDate} ligne={ligne} refreshKey={refreshKey} drivers={allDrivers}
          onEditCell={(dr, date, tripId) => setEditCell({ dr, date, tripId })}/>
      ) : (
      <div className="scroll" style={{background:'var(--paper)'}}>
        <div style={{display:'grid',gridTemplateColumns:'230px 1fr',borderBottom:'1.5px solid var(--stroke)',
          position:'sticky',top:0,background:'#fff',zIndex:2}}>
          <div style={{padding:'7px 10px',fontFamily:'var(--font-mono)',fontSize:10,letterSpacing:'.12em',
            textTransform:'uppercase',borderRight:'1.5px solid var(--stroke)',color:'var(--stroke2)'}}>
            {viewMode === 'jour'
              ? `${DAYS_FR[currentDate.getDay()]} ${currentDate.getDate()} ${MONTHS_SHORT[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : periodLabel('semaine', currentDate)
            }
          </div>
          <div style={{display:'flex'}}>
            {HOURS.map(h => (
              <div key={h} style={{flex:1,padding:'7px 2px',fontFamily:'var(--font-mono)',fontSize:9,
                color:h<6||h>20?'var(--stroke3)':'var(--stroke2)',borderLeft:'1px solid var(--stroke4)',
                textAlign:'center',background:h===new Date().getHours()?'rgba(242,100,25,0.06)':'transparent'}}>
                {String(h).padStart(2,'0')}h
              </div>
            ))}
          </div>
        </div>

        {Array.from(new Set(allDrivers.map(d => dayEffectiveLine(d)))).map(lCode => dayLineInfoMap[lCode] ?? {code:lCode,name:lCode,badge:lCode,color:'#888'}).filter(lineInfo => ligne==='Tous'||ligne===lineInfo.code).map(lineInfo => {
          const l = lineInfo.code;
          const lineDrivers = shown.filter(d => dayEffectiveLine(d) === l);
          if (!lineDrivers.length) return null;
          const lineLabel = lineInfo.name;
          const lineColor = lineInfo.color;
          return (
            <div key={l}>
              <div style={{padding:'5px 10px 5px 14px',background:'var(--ink-100)',borderBottom:'1px solid var(--stroke3)',
                display:'flex',alignItems:'center',gap:8}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:lineColor}}/>
                <span style={{fontFamily:'var(--font-mono)',fontSize:10,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase'}}>{l}</span>
                <span style={{fontSize:11,color:'var(--stroke2)'}}>{lineLabel}</span>
                <span style={{fontFamily:'var(--font-mono)',fontSize:9,color:'var(--stroke3)',marginLeft:'auto'}}>{lineDrivers.length} chauffeurs</span>
              </div>
              {lineDrivers.map(dr => {
                // Vérifier si ce chauffeur a été remplacé ou est remplaçant
                const replEntry = replacements.find(r => r.oldCode === dr.code);
                const replacedByCode = replEntry?.newCode;
                const inheritedCourses = replacements
                  .filter(r => r.newCode === dr.code)
                  .map(r => ({ code: r.oldCode, am: r.oldDr.am, pm: r.oldDr.pm }));
                return (
                  <GanttRow key={dr.code} dr={dr} lineLabel={l} lineColor={lineColor}
                    dbTrips={dayTripMap[dr.code]}
                    onReplace={setReplaceTarget}
                    onEdit={dr => {
                      const trips = dayTripMap[dr.code] || [];
                      setEditCell({ dr, date: currentDate, tripId: trips[0]?.id });
                    }}
                    onBarClick={detail => {
                      // Si le clic vient d'une barre DB, tripId est déjà dans detail
                      if (detail.tripId) { setBarDetail(detail); return; }
                      const trips = dayTripMap[detail.dr.code] || [];
                      const matched = trips.find((t: any) => {
                        const h = new Date(t.scheduled_at).getHours() + new Date(t.scheduled_at).getMinutes() / 60;
                        return Math.abs(h - detail.start) < 1;
                      });
                      setBarDetail({ ...detail, tripId: matched?.id });
                    }}
                    incident={l==='L3'&&dr.code==='D7'}
                    replacedBy={replacedByCode}
                    replacing={inheritedCourses.length ? inheritedCourses : undefined}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
      )}

      {replaceTarget && (
        <div style={{position:'fixed',inset:0,background:'rgba(20,15,16,.38)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',border:'1.5px solid var(--stroke)',borderRadius:8,
            boxShadow:'0 30px 80px rgba(20,15,16,.35)',width:420,overflow:'hidden'}}>
            <div style={{padding:'16px 20px',borderBottom:'1.5px solid var(--stroke)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div className="eyebrow">Remplacer le chauffeur</div>
                <div style={{fontWeight:700,fontSize:16,marginTop:4}}>{replaceTarget.code} · {replaceTarget.nom}</div>
              </div>
              <Btn sm onClick={() => setReplaceTarget(null)}>✕</Btn>
            </div>
            <div style={{padding:'20px'}}>
              <div className="eyebrow" style={{marginBottom:8}}>Choisir le remplaçant</div>
              <select
                value={selectedDriverCode}
                onChange={e => setSelectedDriverCode(e.target.value)}
                style={{width:'100%',border:'1.25px solid var(--stroke3)',borderRadius:6,
                  padding:'8px 10px',fontSize:13,fontFamily:'var(--font-sans)',marginBottom:14}}>
                <option value="">— Sélectionner un chauffeur disponible —</option>
                {allDrivers.filter(d => d.code!==replaceTarget.code).map(d => (
                  <option key={d.code} value={d.code}>{d.code} · {d.nom}</option>
                ))}
              </select>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                <Btn onClick={() => { setReplaceTarget(null); setSelectedDriverCode(''); }}>Annuler</Btn>
                <Btn accent onClick={handleConfirmReplace} disabled={!selectedDriverCode || replacing}>
                  {replacing ? 'En cours…' : 'Confirmer →'}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
