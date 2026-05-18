'use client';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';
import { api } from '@/lib/api';
import { GpsPing, getPingStatus, STATUS_COLOR } from '@/lib/gpsUtils';

const LeafletMap = dynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f3' }}>
      <div style={{ textAlign: 'center', color: '#9ca3af' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>◉</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.1em' }}>CHARGEMENT CARTE…</div>
      </div>
    </div>
  ),
});

// ── Roster (chargé depuis l'API) ─────────────────────────────────────────────

interface RosterDriver { code: string; nom: string; ligne: string; color: string; }

/** Détermine la ligne d'affectation d'un chauffeur à partir du préfixe de son numéro. */
function lineFromCode(driverNumber: string): { ligne: string; color: string } {
  if (driverNumber.startsWith('D')) return { ligne: 'L3',  color: '#E8601A' };
  if (driverNumber.startsWith('C')) return { ligne: 'L4',  color: '#2563eb' };
  if (driverNumber.startsWith('H')) return { ligne: 'CHM', color: '#16a34a' };
  return { ligne: 'L3', color: '#E8601A' };
}

const LINE_OPTS = ['Tous', 'L3', 'L4', 'CHM'] as const;

// ── Helper affichage ──────────────────────────────────────────────────────────

function fmtAge(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'à l\'instant';
  if (m < 60) return `${m} mn`;
  return `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MapPage() {
  const [wsConnected, setWsConnected] = useState(false);
  const [positions, setPositions] = useState<Record<string, GpsPing>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lineFilter, setLineFilter] = useState<string>('Tous');
  const [showRoutes, setShowRoutes] = useState(true);
  const [dark, setDark] = useState(false);
  const [tick, setTick] = useState(0);
  const [roster, setRoster] = useState<RosterDriver[]>([]);
  const socketRef = useRef<Socket | null>(null);

  // Tick toutes les 30s pour rafraîchir les âges
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  // Charger la liste des chauffeurs depuis l'API
  useEffect(() => {
    api.get('/drivers')
      .then(r => {
        const list: Array<{ driver_number: string; full_name: string }> = r.data ?? [];
        setRoster(list.map(d => ({
          code: d.driver_number,
          nom:  d.full_name,
          ...lineFromCode(d.driver_number),
        })));
      })
      .catch(() => setRoster([]));
  }, []);

  // WebSocket GPS
  useEffect(() => {
    const token = Cookies.get('access_token');
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/api$/, '');
    const socket = io(`${baseUrl}/gps`, { auth: { token }, reconnectionAttempts: 5 });
    socketRef.current = socket;
    socket.on('connect', () => setWsConnected(true));
    socket.on('disconnect', () => setWsConnected(false));
    socket.on('gps:update', (ping: GpsPing) => {
      setPositions(prev => ({ ...prev, [ping.driver_id]: ping }));
    });
    socket.emit('subscribe_live');
    return () => { socket.disconnect(); setWsConnected(false); };
  }, []);

  const livePings = Object.values(positions);
  const displayPings: GpsPing[] = livePings;

  const filteredPings = lineFilter === 'Tous'
    ? displayPings
    : displayPings.filter(p => p.ligne === lineFilter);

  const counts = {
    live:    displayPings.filter(p => getPingStatus(p.recorded_at) === 'live').length,
    late:    displayPings.filter(p => getPingStatus(p.recorded_at) === 'late').length,
    offline: displayPings.filter(p => getPingStatus(p.recorded_at) === 'offline').length,
  };

  const selectedPing = selectedId ? displayPings.find(p => p.driver_id === selectedId) : null;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Barre de page ── */}
      <div style={{
        padding: '10px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--surface)', flexShrink: 0, gap: 12,
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
            DIRECTION · TEMPS RÉEL
          </div>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', letterSpacing: '-.025em', marginTop: 1 }}>
            Carte GPS
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Statuts */}
          <div style={{ display: 'flex', gap: 6, marginRight: 8 }}>
            {([['live', counts.live, '●'], ['late', counts.late, '●'], ['offline', counts.offline, '○']] as const).map(([s, n, sym]) => (
              <span key={s} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontFamily: 'var(--font-mono)', fontSize: 11, padding: '3px 10px',
                borderRadius: 999, border: '1px solid var(--border)',
                color: STATUS_COLOR[s], background: 'var(--surface)',
              }}>
                <span>{sym}</span> {n}
              </span>
            ))}
          </div>

          {/* WS status */}
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, padding: '3px 10px',
            borderRadius: 999, border: `1px solid ${wsConnected ? 'var(--success)' : 'var(--border)'}`,
            color: wsConnected ? 'var(--success)' : 'var(--text-3)',
            background: wsConnected ? 'var(--success-10)' : 'var(--surface)',
          }}>
            {wsConnected ? '⬤ Live' : '○ Hors-ligne'}
          </span>

          {/* Contrôles */}
          <button className="btn btn-sm" onClick={() => setShowRoutes(v => !v)}
            style={showRoutes ? { background: 'var(--surface-3)', borderColor: 'var(--border-strong)' } : {}}>
            {showRoutes ? 'Masquer lignes' : 'Afficher lignes'}
          </button>
          <button className="btn btn-sm" onClick={() => setDark(v => !v)}>
            {dark ? '☀ Clair' : '◐ Sombre'}
          </button>
        </div>
      </div>

      {/* ── Contenu principal ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Panneau latéral ── */}
        <div style={{
          width: 252, flexShrink: 0,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Filtres ligne */}
          <div style={{
            padding: '10px 12px 8px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', gap: 4, flexWrap: 'wrap',
          }}>
            {LINE_OPTS.map(l => {
              const color = l === 'L3' ? '#E8601A' : l === 'L4' ? '#2563eb' : l === 'CHM' ? '#16a34a' : 'var(--text-2)';
              const active = lineFilter === l;
              return (
                <button key={l} onClick={() => setLineFilter(l)}
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                    padding: '3px 10px', borderRadius: 4, cursor: 'pointer',
                    border: `1.5px solid ${active ? color : 'var(--border)'}`,
                    background: active ? `${color}14` : 'var(--surface)',
                    color: active ? color : 'var(--text-3)',
                    transition: 'all .1s',
                  }}>
                  {l}
                </button>
              );
            })}
          </div>

          {/* Légende statuts */}
          <div style={{
            padding: '8px 12px', borderBottom: '1px solid var(--border)',
            display: 'flex', gap: 12,
          }}>
            {([['live', 'En ligne'], ['late', 'Retard'], ['offline', 'Hors-ligne']] as const).map(([s, label]) => (
              <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-2)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLOR[s], display: 'inline-block' }} />
                {label}
              </span>
            ))}
          </div>

          {/* Liste chauffeurs */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {(['L3', 'L4', 'CHM'] as const)
              .filter(l => lineFilter === 'Tous' || lineFilter === l)
              .map(l => {
                const lColor = l === 'L3' ? '#E8601A' : l === 'L4' ? '#2563eb' : '#16a34a';
                const lLabel = l === 'L3' ? 'Doujani ↔ La Barge' : l === 'L4' ? 'Vahibe ↔ PEM' : 'CHM ↔ La Barge';
                const drivers = roster.filter(d => d.ligne === l);
                return (
                  <div key={l}>
                    {/* Ligne header */}
                    <div style={{
                      padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6,
                      background: 'var(--surface-2)', borderBottom: '1px solid var(--border)',
                      position: 'sticky', top: 0, zIndex: 1,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: lColor, flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: lColor }}>{l}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{lLabel}</span>
                    </div>

                    {drivers.map(dr => {
                      const ping = displayPings.find(p => p.driver_id === dr.code || p.driver_number === dr.code);
                      const status: 'live' | 'late' | 'offline' = ping ? getPingStatus(ping.recorded_at) : 'offline';
                      const isSelected = selectedId === dr.code || selectedId === ping?.driver_id;

                      return (
                        <div key={dr.code}
                          onClick={() => setSelectedId(isSelected ? null : (ping?.driver_id || dr.code))}
                          style={{
                            padding: '8px 12px',
                            borderBottom: '1px solid var(--border)',
                            cursor: 'pointer',
                            background: isSelected ? `${lColor}08` : 'transparent',
                            display: 'flex', alignItems: 'center', gap: 8,
                            transition: 'background .1s',
                          }}
                          onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isSelected ? `${lColor}08` : 'transparent'; }}
                        >
                          {/* Status dot */}
                          <span style={{
                            width: 7, height: 7, borderRadius: '50%',
                            background: ping ? STATUS_COLOR[status] : 'var(--stone-300)',
                            flexShrink: 0,
                          }} />

                          {/* Code */}
                          <span style={{
                            fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 700,
                            color: lColor, padding: '0 4px',
                            border: `1.5px solid ${lColor}`, borderRadius: 3,
                            flexShrink: 0,
                          }}>{dr.code}</span>

                          {/* Nom */}
                          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {dr.nom}
                          </span>

                          {/* Age ping */}
                          {ping && (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: STATUS_COLOR[status], flexShrink: 0 }}>
                              {fmtAge(ping.recorded_at)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
          </div>

          {/* Infos chauffeur sélectionné */}
          {selectedPing && (
            <div style={{
              padding: '12px 14px', borderTop: '1.5px solid var(--border)',
              background: 'var(--surface)', flexShrink: 0,
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>
                Sélectionné
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--brand)' }}>{selectedPing.driver_number}</span>
                {selectedPing.driver_name && <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{selectedPing.driver_name}</span>}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', lineHeight: 1.6 }}>
                {selectedPing.lat.toFixed(5)}, {selectedPing.lng.toFixed(5)}<br />
                Vu {fmtAge(selectedPing.recorded_at)}
              </div>
              <button className="btn btn-sm" style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}
                onClick={() => setSelectedId(null)}>
                Désélectionner
              </button>
            </div>
          )}
        </div>

        {/* ── Carte ── */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <LeafletMap
            positions={filteredPings}
            dark={dark}
            selectedDriverId={selectedId}
            onSelectDriver={setSelectedId}
            showRoutes={showRoutes}
          />

          {/* KPI overlay (coin haut-gauche) */}
          <div style={{
            position: 'absolute', top: 12, left: 12, zIndex: 1000,
            display: 'flex', gap: 6, pointerEvents: 'none',
          }}>
            {([
              ['En ligne', counts.live, STATUS_COLOR.live],
              ['Retard', counts.late, STATUS_COLOR.late],
              ['Hors-ligne', counts.offline, STATUS_COLOR.offline],
            ] as const).map(([label, n, color]) => (
              <div key={label} style={{
                background: dark ? 'rgba(20,20,20,.82)' : 'rgba(255,255,255,.92)',
                color: dark ? '#fff' : 'var(--text)',
                backdropFilter: 'blur(6px)',
                borderRadius: 8, padding: '7px 12px',
                boxShadow: '0 2px 8px rgba(0,0,0,.15)',
                fontFamily: 'var(--font-mono)',
                border: `1px solid ${dark ? 'rgba(255,255,255,.1)' : 'var(--border)'}`,
              }}>
                <div style={{ fontSize: 8.5, letterSpacing: '.1em', textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,.5)' : 'var(--text-3)' }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1.1, marginTop: 2 }}>{n}</div>
              </div>
            ))}
          </div>

          {/* Légende lignes (coin bas-gauche) */}
          {showRoutes && (
            <div style={{
              position: 'absolute', bottom: 32, left: 12, zIndex: 1000,
              background: dark ? 'rgba(20,20,20,.82)' : 'rgba(255,255,255,.92)',
              backdropFilter: 'blur(6px)',
              borderRadius: 8, padding: '10px 14px',
              boxShadow: '0 2px 8px rgba(0,0,0,.15)',
              border: `1px solid ${dark ? 'rgba(255,255,255,.1)' : 'var(--border)'}`,
              pointerEvents: 'none',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '.1em', textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,.4)' : 'var(--text-3)', marginBottom: 8 }}>
                Lignes
              </div>
              {[
                ['L3', '#E8601A', 'Doujani ↔ La Barge'],
                ['L4', '#2563eb', 'Vahibe ↔ PEM'],
                ['CHM', '#16a34a', 'CHM ↔ La Barge'],
              ].map(([name, color, label]) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <div style={{ width: 20, height: 3, background: color, borderRadius: 999, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color, flexShrink: 0 }}>{name}</span>
                  <span style={{ fontSize: 10, color: dark ? 'rgba(255,255,255,.6)' : 'var(--text-2)' }}>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
