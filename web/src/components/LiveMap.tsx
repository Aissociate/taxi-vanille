'use client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DriverPosition } from '@/app/(app)/map/page';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const taxiIcon = (active: boolean) =>
  L.divIcon({
    html: `<div style="background:${active ? '#0057e7' : '#6b7280'};color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)">🚕</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

// Centre de Mayotte
const MAYOTTE_CENTER: [number, number] = [-12.8275, 45.166244];

export default function LiveMap({ positions }: { positions: DriverPosition[] }) {
  return (
    <MapContainer center={MAYOTTE_CENTER} zoom={11} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {positions.map((pos) => (
        <Marker
          key={pos.driver_id}
          position={[pos.lat, pos.lng]}
          icon={taxiIcon(!!pos.trip_id)}
        >
          <Popup>
            <div className="text-sm">
              <div className="font-bold">{pos.full_name}</div>
              <div className="text-gray-500">N° {pos.driver_number}</div>
              <div className="mt-1 text-xs text-gray-400">
                Mis à jour {formatDistanceToNow(new Date(pos.recorded_at), { locale: fr, addSuffix: true })}
              </div>
              {pos.trip_id && <div className="text-xs mt-1 text-green-600 font-medium">En course</div>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
