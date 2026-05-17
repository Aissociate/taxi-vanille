import { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/src/lib/api';
import { saveSchedule, getSchedule, bufferGps, getPendingEvents } from '@/src/lib/db';
import { syncAll } from '@/src/lib/sync';

const BRAND = '#F26419';
const INK = '#1A1718';
const INK3 = '#6B6566';
const INK4 = '#B9B3B4';
const INK5 = '#E8E5E6';
const BG = '#FAFAF9';
const SUCCESS = '#2E8B57';
const DANGER = '#D13A2A';
const WARN = '#F26419';

/** Convertit un trip API en affichage normalisé */
function normalizeTrip(t: any) {
  return {
    id: t.id,
    time: t.scheduled_at ? new Date(t.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--',
    name: t.client_name || t.direction || 'Trajet',
    patients: t.passenger_count ?? 0,
    stops: t.stops_count ?? (Array.isArray(t.stops) ? t.stops.length : 0),
    // 'completed' backend → 'done' UI ; 'in_progress' → 'in_progress' ✓
    status: t.status === 'completed' ? 'done' : t.status ?? 'planned',
  };
}

function formatDate() {
  const d = new Date();
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

export default function ScheduleScreen() {
  const [trips, setTrips] = useState<any[]>([]);
  const [offline, setOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [driverNum, setDriverNum] = useState('');
  const [cacheTime, setCacheTime] = useState('');
  const gpsInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Charger le profil chauffeur au montage
  useEffect(() => {
    api.get('/drivers/me')
      .then(r => setDriverNum(r.data.driver_number ?? ''))
      .catch(() => {});
  }, []);

  // Mettre à jour le compteur d'événements en attente
  const refreshPending = () => setPendingCount(getPendingEvents().length);

  const { isLoading, refetch } = useQuery({
    queryKey: ['schedule'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/drivers/me/schedule/today');
        const normalized = data.map(normalizeTrip);
        saveSchedule(normalized);
        setTrips(normalized);
        setOffline(false);
        setCacheTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
        refreshPending();
        return normalized;
      } catch {
        const cached = getSchedule();
        if (cached.length) setTrips(cached);
        setOffline(true);
        refreshPending();
        return cached;
      }
    },
  });

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      gpsInterval.current = setInterval(async () => {
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          // Correct: arguments individuels (lat, lng, accuracy, tripId)
          bufferGps(loc.coords.latitude, loc.coords.longitude, loc.coords.accuracy ?? null, null);
          await api.post('/gps/ping', { lat: loc.coords.latitude, lng: loc.coords.longitude });
        } catch {}
      }, 60000);
    })();
    return () => { if (gpsInterval.current) clearInterval(gpsInterval.current); };
  }, []);

  const syncCount = trips.filter(t => t.status === 'sync').length;

  return (
    <View style={s.screen}>
      {/* Offline / sync banner */}
      {(offline || syncCount > 0) && (
        <View style={s.banner}>
          <Text style={s.bannerText}>
            {offline ? `⚠  MODE HORS-LIGNE${pendingCount > 0 ? ` · ${pendingCount} ÉLÉMENTS EN ATTENTE` : ''}` : `↻ ${pendingCount} ÉLÉMENTS EN ATTENTE`}
          </Text>
        </View>
      )}

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.dateText}>{formatDate().toUpperCase()}</Text>
          <Text style={s.titleText}>Planning du jour</Text>
        </View>
        <Text style={s.driverNum}>{driverNum || '—'}</Text>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => { syncAll(); refetch(); }} tintColor={BRAND} />}>

        {/* Cache info pill */}
        {offline && (
          <View style={s.cachePill}>
            <Text style={s.cachePillText}>Données en cache · dernière maj {cacheTime || '—'}</Text>
          </View>
        )}

        {trips.map(trip => {
          const status = trip.status || 'planned';
          const isDone = status === 'done';
          const isLive = status === 'in_progress' || status === 'live';
          const isSync = status === 'sync';

          return (
            <TouchableOpacity
              key={trip.id || trip.trip_id}
              style={[s.card, isLive && s.cardLive, isDone && s.cardDone]}
              onPress={() => {
                if (!isDone) router.push({ pathname: '/(app)/trip', params: { tripId: trip.id || trip.trip_id } });
              }}
              activeOpacity={isDone ? 1 : 0.75}>
              {/* Green left bar for done */}
              {isDone && <View style={s.doneBar} />}

              <View style={s.cardInner}>
                {/* Status pill */}
                <View style={s.statusArea}>
                  {isDone && (
                    <View style={s.statusRow}>
                      <View style={[s.dot, { backgroundColor: SUCCESS }]} />
                      <Text style={[s.statusText, { color: SUCCESS }]}>TERMINÉ</Text>
                    </View>
                  )}
                  {isLive && (
                    <View style={s.statusRow}>
                      <View style={[s.dot, { backgroundColor: BRAND }]} />
                      <Text style={[s.statusText, { color: BRAND }]}>EN COURS</Text>
                    </View>
                  )}
                  {isSync && (
                    <View style={s.statusRow}>
                      <Text style={[s.statusText, { color: BRAND }]}>↻ à synchroniser</Text>
                    </View>
                  )}
                  {!isDone && !isLive && !isSync && (
                    <View style={s.statusRow}>
                      <View style={[s.dot, { backgroundColor: INK4 }]} />
                      <Text style={[s.statusText, { color: INK4 }]}>PLANIFIÉ</Text>
                    </View>
                  )}
                </View>

                {/* Time */}
                <Text style={[s.time, isDone && s.timeDone, isLive && s.timeLive]}>
                  {trip.time || trip.scheduled_start?.slice(11, 16) || '--:--'}
                </Text>

                {/* Name */}
                <Text style={[s.name, isDone && s.nameDone]}>
                  {trip.name || trip.direction || trip.route_code || 'Trajet'}
                </Text>

                {/* Meta */}
                <Text style={[s.meta, isDone && s.metaDone]}>
                  {`${trip.patients ?? trip.stop_count ?? 0} patients · ${trip.stops ?? 0} arrêts`}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Incident FAB */}
      <TouchableOpacity style={s.incidentBar} onPress={() => router.push('/(app)/incident')}>
        <Text style={s.incidentBarText}>⚠  SIGNALER UN INCIDENT</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  banner: { backgroundColor: WARN, paddingVertical: 11, paddingHorizontal: 20, alignItems: 'center' },
  bannerText: { fontFamily: 'SpaceMono', fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 1.5, textTransform: 'uppercase' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  dateText: { fontFamily: 'SpaceMono', fontSize: 10, color: INK3, letterSpacing: 1.5, marginBottom: 2 },
  titleText: { fontSize: 28, fontWeight: '800', color: INK },
  driverNum: { fontFamily: 'SpaceMono', fontSize: 14, color: INK4, fontWeight: '700', paddingBottom: 4 },
  scroll: { flex: 1, backgroundColor: BG },
  scrollContent: { paddingHorizontal: 16, paddingTop: 10 },
  cachePill: { borderRadius: 10, borderWidth: 1.5, borderColor: INK5, borderStyle: 'dashed', paddingVertical: 10, paddingHorizontal: 14, marginBottom: 12, backgroundColor: '#fff' },
  cachePillText: { fontSize: 12, color: INK3 },
  card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: INK5, marginBottom: 10, flexDirection: 'row', overflow: 'hidden' },
  cardLive: { borderColor: BRAND },
  cardDone: { },
  doneBar: { width: 4, backgroundColor: SUCCESS },
  cardInner: { flex: 1, padding: 16 },
  statusArea: { position: 'absolute', top: 14, right: 14 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontFamily: 'SpaceMono', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  time: { fontFamily: 'SpaceMono', fontSize: 26, fontWeight: '700', color: INK, marginBottom: 2 },
  timeDone: { color: INK3 },
  timeLive: { color: BRAND },
  name: { fontSize: 15, fontWeight: '700', color: INK, marginBottom: 2 },
  nameDone: { color: INK3 },
  meta: { fontSize: 12, color: INK3 },
  metaDone: { color: INK4 },
  incidentBar: { backgroundColor: DANGER, paddingVertical: 20, alignItems: 'center' },
  incidentBarText: { fontFamily: 'SpaceMono', fontSize: 12, fontWeight: '700', color: '#fff', letterSpacing: 2.5, textTransform: 'uppercase' },
});
