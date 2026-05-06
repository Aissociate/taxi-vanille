import { api } from './api';
import { getPendingEvents, markEventSynced, getPendingGps, markGpsSynced } from './db';
import NetInfo from '@react-native-community/netinfo';

export async function syncAll() {
  const net = await NetInfo.fetch();
  if (!net.isConnected) return { ok: false, reason: 'offline' };

  await syncEvents();
  await syncGps();
  return { ok: true };
}

async function syncEvents() {
  const events = getPendingEvents();
  if (!events.length) return;

  try {
    const { data } = await api.post('/trips/batch-sync', { events });
    for (const result of data.synced) {
      if (result.ok) markEventSynced(result.id);
    }
  } catch (e) {
    console.warn('Sync events failed:', (e as any).message);
  }
}

async function syncGps() {
  const pings = getPendingGps();
  if (!pings.length) return;

  const payload = pings.map(p => ({
    lat: p.lat,
    lng: p.lng,
    accuracy_m: p.accuracy_m,
    trip_id: p.trip_id,
    recorded_at: new Date(p.recorded_at).toISOString(),
  }));

  try {
    await api.post('/gps/batch', { pings: payload });
    markGpsSynced(pings.map(p => p.id));
  } catch (e) {
    console.warn('GPS sync failed:', (e as any).message);
  }
}
