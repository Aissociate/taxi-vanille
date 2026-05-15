'use client';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Polyline, ZoomControl, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import { GpsPing, DriverStatus, getPingStatus, STATUS_COLOR } from '@/lib/gpsUtils';

export type { GpsPing, DriverStatus };
export { getPingStatus, STATUS_COLOR };

// ── Routes approximatives des lignes de Mayotte ──────────────────────────────

const ROUTES = {
  L3: {
    color: '#E8601A',
    name: 'L3',
    label: 'Doujani ↔ Passot La Barge',
    coords: [
      [-12.841, 45.219],
      [-12.831, 45.220],
      [-12.818, 45.221],
      [-12.806, 45.222],
      [-12.797, 45.223],
      [-12.786, 45.224],
      [-12.778, 45.225],
      [-12.768, 45.222],
      [-12.756, 45.218],
      [-12.742, 45.213],
    ] as [number, number][],
    stops: [
      { name: 'Doujani',        pos: [-12.841, 45.219] as [number, number] },
      { name: 'Mamoudzou',      pos: [-12.797, 45.223] as [number, number] },
      { name: 'La Barge',       pos: [-12.778, 45.225] as [number, number] },
      { name: 'Passot La Barge',pos: [-12.742, 45.213] as [number, number] },
    ],
  },
  L4: {
    color: '#2563eb',
    name: 'L4',
    label: 'Vahibe ↔ PEM Passamainty',
    coords: [
      [-12.988, 45.177],
      [-12.974, 45.185],
      [-12.960, 45.193],
      [-12.945, 45.201],
      [-12.930, 45.209],
      [-12.916, 45.216],
      [-12.901, 45.223],
      [-12.888, 45.228],
    ] as [number, number][],
    stops: [
      { name: 'Vahibe',          pos: [-12.988, 45.177] as [number, number] },
      { name: 'Tsoundzou',       pos: [-12.945, 45.201] as [number, number] },
      { name: 'PEM Passamainty', pos: [-12.888, 45.228] as [number, number] },
    ],
  },
  CHM: {
    color: '#16a34a',
    name: 'CHM',
    label: 'CHM ↔ La Barge',
    coords: [
      [-12.803, 45.219],
      [-12.797, 45.221],
      [-12.791, 45.223],
      [-12.784, 45.225],
      [-12.778, 45.225],
    ] as [number, number][],
    stops: [
      { name: 'CHM',      pos: [-12.803, 45.219] as [number, number] },
      { name: 'La Barge', pos: [-12.778, 45.225] as [number, number] },
    ],
  },
};

// ── Custom DivIcon ────────────────────────────────────────────────────────────

function driverIcon(code: string, status: DriverStatus, selected: boolean) {
  const c = STATUS_COLOR[status];
  const size = selected ? 38 : 32;
  const ring = selected ? `box-shadow:0 0 0 3px ${c}40,0 3px 10px rgba(0,0,0,.35);` : 'box-shadow:0 2px 6px rgba(0,0,0,.3);';
  return L.divIcon({
    className: '',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="width:${size}px;height:${size}px;border-radius:50%;background:${c};border:2.5px solid #fff;
          ${ring}display:flex;align-items:center;justify-content:center;
          font-family:monospace;font-size:${selected?10:9}px;font-weight:700;color:#fff;transition:all .2s;">
          ${code}
        </div>
        <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;
          border-top:7px solid ${c};margin-top:-1px;"/>
      </div>`,
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 8],
    popupAnchor: [0, -(size + 10)],
  });
}

function stopIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:8px;height:8px;border-radius:50%;background:#fff;border:2px solid ${color};box-shadow:0 1px 4px rgba(0,0,0,.2);"/>`,
    iconSize: [8, 8],
    iconAnchor: [4, 4],
  });
}

// ── Pan-to helper (must be inside MapContainer) ───────────────────────────────

function MapController({ selectedId, positions }: { selectedId: string | null; positions: GpsPing[] }) {
  const map = useMap();
  useEffect(() => {
    if (!selectedId) return;
    const ping = positions.find(p => p.driver_id === selectedId);
    if (ping) map.flyTo([ping.lat, ping.lng], Math.max(map.getZoom(), 14), { duration: 0.8 });
  }, [selectedId, positions, map]);
  return null;
}

// ── Main component ────────────────────────────────────────────────────────────

interface LeafletMapProps {
  positions: GpsPing[];
  dark?: boolean;
  selectedDriverId?: string | null;
  onSelectDriver?: (id: string | null) => void;
  showRoutes?: boolean;
}

export default function LeafletMap({
  positions,
  dark = false,
  selectedDriverId = null,
  onSelectDriver,
  showRoutes = true,
}: LeafletMapProps) {
  const center: [number, number] = [-12.83, 45.16];

  const tileUrl = dark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  const attribution = '© <a href="https://www.openstreetmap.org/copyright" style="color:inherit">OpenStreetMap</a> © <a href="https://carto.com/attributions" style="color:inherit">CARTO</a>';

  const fmtAge = (iso: string) => {
    const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return 'à l\'instant';
    if (mins < 60) return `il y a ${mins} mn`;
    return `il y a ${Math.floor(mins / 60)}h`;
  };

  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
    >
      <TileLayer url={tileUrl} attribution={attribution} subdomains="abcd" maxZoom={20} />
      <ZoomControl position="bottomright" />
      <MapController selectedId={selectedDriverId} positions={positions} />

      {/* ── Lignes de bus ── */}
      {showRoutes && Object.entries(ROUTES).map(([key, route]) => (
        <Polyline
          key={key}
          positions={route.coords}
          color={route.color}
          weight={dark ? 5 : 4}
          opacity={dark ? 0.85 : 0.75}
          dashArray={undefined}
        />
      ))}

      {/* ── Arrêts ── */}
      {showRoutes && Object.entries(ROUTES).map(([key, route]) =>
        route.stops.map(stop => (
          <Marker
            key={`${key}-${stop.name}`}
            position={stop.pos}
            icon={stopIcon(route.color)}
          >
            <Popup>
              <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: route.color, marginBottom: 2 }}>{route.name}</div>
                <div>{stop.name}</div>
              </div>
            </Popup>
          </Marker>
        ))
      )}

      {/* ── Marqueurs chauffeurs ── */}
      {positions.map(p => {
        const status = getPingStatus(p.recorded_at);
        const selected = p.driver_id === selectedDriverId;
        return (
          <Marker
            key={p.driver_id}
            position={[p.lat, p.lng]}
            icon={driverIcon(p.driver_number || p.driver_id.slice(0, 4), status, selected)}
            zIndexOffset={selected ? 1000 : 0}
            eventHandlers={{
              click: () => onSelectDriver?.(selected ? null : p.driver_id),
            }}
          >
            <Popup>
              <div style={{ fontFamily: 'sans-serif', fontSize: 12, minWidth: 160 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[status], display: 'inline-block' }} />
                  <strong>{p.driver_number}</strong>
                  {p.driver_name && <span style={{ color: '#6b7280' }}>{p.driver_name}</span>}
                </div>
                {p.ligne && (
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 3 }}>Ligne {p.ligne}</div>
                )}
                <div style={{ fontSize: 11, color: '#9ca3af' }}>{fmtAge(p.recorded_at)}</div>
                <div style={{ fontSize: 10, color: '#b5b0ad', marginTop: 2 }}>
                  {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
