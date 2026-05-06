'use client';

export interface DriverPosition {
  driver_id: string;
  lat: number;
  lng: number;
  trip_id?: string;
  full_name?: string;
  driver_number?: string;
  recorded_at: string;
}

export default function LiveMap({ positions }: { positions: DriverPosition[] }) {
  return (
    <div style={{height:'100%',width:'100%',display:'flex',alignItems:'center',justifyContent:'center',
      background:'var(--ink-100)',color:'var(--stroke2)',fontSize:13,fontFamily:'var(--font-mono)'}}>
      {positions.length} véhicule(s) tracé(s)
    </div>
  );
}
