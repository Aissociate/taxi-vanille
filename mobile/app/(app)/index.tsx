import { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/src/lib/api';
import { saveSchedule, getSchedule, bufferGps } from '@/src/lib/db';
import { syncAll } from '@/src/lib/sync';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_LABELS: Record<string, string> = {
  planned: 'Planifié',
  in_progress: 'En cours',
  completed: 'Terminé',
};
const STATUS_COLORS: Record<string, string> = {
  planned: '#e8f0ff',
  in_progress: '#e6f9f5',
  completed: '#eef0f3',
};
const STATUS_TEXT: Record<string, string> = {
  planned: '#0057e7',
  in_progress: '#007a65',
  completed: '#6b7685',
};

export default function ScheduleScreen() {
  const qc = useQueryClient();
  const [trips, setTrips] = useState<any[]>([]);
  const gpsInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [activeTrip, setActiveTrip] = useState<string | null>(null);

  const { isLoading, refetch } = useQuery({
    queryKey: ['schedule'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/drivers/me/schedule/today');
        saveSchedule(data);
        setTrips(data);
        return data;
      } catch {
        const cached = getSchedule();
        setTrips(cached);
        return cached;
      }
    },
  });

  useEffect(() => {
    syncAll();
    return () => { if (gpsInterval.current) clearInterval(gpsInterval.current); };
  }, []);

  useEffect(() => {
    if (activeTrip) {
      startGpsTracking();
    } else {
      if (gpsInterval.current) clearInterval(gpsInterval.current);
    }
  }, [activeTrip]);

  async function startGpsTracking() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    gpsInterval.current = setInterval(async () => {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      bufferGps(loc.coords.latitude, loc.coords.longitude, loc.coords.accuracy, activeTrip);
      try {
        await api.post('/gps/ping', {
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          accuracy_m: loc.coords.accuracy,
          trip_id: activeTrip,
          recorded_at: new Date().toISOString(),
        });
      } catch {}
    }, 60_000);
  }

  return (
    <ScrollView
      style={s.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
    >
      <View style={s.header}>
        <Text style={s.headerTitle}>Mon planning</Text>
        <Text style={s.headerDate}>{format(new Date(), 'EEEE d MMMM', { locale: fr })}</Text>
      </View>

      {trips.length === 0 && !isLoading && (
        <View style={s.empty}>
          <Text style={s.emptyText}>Aucun trajet aujourd'hui</Text>
        </View>
      )}

      {trips.map((trip) => (
        <TouchableOpacity
          key={trip.id}
          style={s.tripCard}
          onPress={() => router.push({ pathname: '/(app)/trip', params: { id: trip.id } })}
        >
          <View style={s.tripTime}>
            <Text style={s.timeText}>{format(new Date(trip.scheduled_at), 'HH:mm')}</Text>
          </View>
          <View style={s.tripInfo}>
            <Text style={s.clientName}>{trip.client_name ?? 'Trajet'}</Text>
            {trip.notes && <Text style={s.notes} numberOfLines={1}>{trip.notes}</Text>}
            <View style={[s.badge, { backgroundColor: STATUS_COLORS[trip.status] ?? '#eee' }]}>
              <Text style={[s.badgeText, { color: STATUS_TEXT[trip.status] ?? '#333' }]}>
                {STATUS_LABELS[trip.status] ?? trip.status}
              </Text>
            </View>
          </View>
          <Text style={s.arrow}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8fa' },
  header: { backgroundColor: '#0d1117', padding: 24, paddingTop: 56 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerDate: { fontSize: 14, color: 'rgba(255,255,255,.5)', marginTop: 4 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#6b7685', fontSize: 15 },
  tripCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#dde2e8' },
  tripTime: { width: 52 },
  timeText: { fontSize: 16, fontWeight: '700', color: '#0d1117' },
  tripInfo: { flex: 1, marginLeft: 12 },
  clientName: { fontSize: 15, fontWeight: '600', color: '#0d1117' },
  notes: { fontSize: 13, color: '#6b7685', marginTop: 2 },
  badge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  arrow: { fontSize: 22, color: '#6b7685', marginLeft: 8 },
});
