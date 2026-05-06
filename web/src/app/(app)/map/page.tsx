'use client';
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/LiveMap'), { ssr: false });

export interface DriverPosition {
  driver_id: string;
  driver_number: string;
  full_name: string;
  lat: number;
  lng: number;
  trip_id?: string;
  recorded_at: string;
}

export default function MapPage() {
  const [positions, setPositions] = useState<Map<string, DriverPosition>>(new Map());
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = Cookies.get('access_token');
    const socket = io(`${process.env.NEXT_PUBLIC_WS_URL}/gps`, {
      auth: { token },
      transports: ['websocket'],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    socket.on('connect', () => socket.emit('subscribe_live'));
    socket.on('gps:update', (pos: DriverPosition) => {
      setPositions((prev) => new Map(prev).set(pos.driver_id, pos));
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); };
  }, []);

  const posArray = Array.from(positions.values());

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 py-4 bg-white border-b border-gray-200 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Carte GPS live</h1>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-sm text-gray-500">{posArray.length} taxi(s) actif(s)</span>
        </div>
      </div>
      <div className="flex-1">
        <MapComponent positions={posArray} />
      </div>
    </div>
  );
}
