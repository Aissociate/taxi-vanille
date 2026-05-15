export interface GpsPing {
  driver_id: string;
  driver_number?: string;
  driver_name?: string;
  lat: number;
  lng: number;
  recorded_at: string;
  ligne?: string;
}

export type DriverStatus = 'live' | 'late' | 'offline';

export function getPingStatus(recorded_at: string): DriverStatus {
  const age = (Date.now() - new Date(recorded_at).getTime()) / 60000;
  if (age < 5) return 'live';
  if (age < 15) return 'late';
  return 'offline';
}

export const STATUS_COLOR: Record<DriverStatus, string> = {
  live:    '#16a34a',
  late:    '#d97706',
  offline: '#9ca3af',
};
