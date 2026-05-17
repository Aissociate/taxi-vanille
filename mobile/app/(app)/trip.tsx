import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/src/lib/api';
import { enqueueEvent } from '@/src/lib/db';
import { syncAll } from '@/src/lib/sync';
import { randomUUID } from 'expo-crypto';

const BRAND = '#F26419';
const INK = '#1A1718';
const INK3 = '#6B6566';
const INK4 = '#B9B3B4';
const INK5 = '#E8E5E6';
const DANGER = '#D13A2A';

const MOCK_STOPS = [
  { id: 's1', name: 'EHPAD de Pamandzi',        address: 'Route de Pamandzi · 97680', arrivalTime: '09:15' },
  { id: 's2', name: '14 rue de la Corniche',     address: 'Mamoudzou · arrivée prévue 09:34', arrivalTime: '09:34' },
  { id: 's3', name: 'Quartier Kaweni',            address: 'Kaweni · arrivée prévue 09:48', arrivalTime: '09:48' },
  { id: 's4', name: 'CHM Mamoudzou',             address: 'Avenue de l\'Hôpital · 97600', arrivalTime: '10:05' },
];

export default function TripScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const [aboard, setAboard] = useState(3);
  const [boarding, setBoarding] = useState(2);
  const [alighting, setAlighting] = useState(1);
  const [stopIdx, setStopIdx] = useState(1);

  const { data: trip } = useQuery({
    queryKey: ['trip', tripId],
    enabled: !!tripId,
    queryFn: () => api.get(`/planning/${tripId}`).then(r => r.data).catch(() => null),
  });

  // 'stops' enrichis par le backend (getTodaySchedule / findOne)
  // Fallback sur MOCK_STOPS uniquement hors-ligne
  const stops: any[] = (trip?.stops && trip.stops.length > 0) ? trip.stops : MOCK_STOPS;
  const current = stops[stopIdx] ?? stops[0];
  const next = stops[stopIdx + 1];
  const tripName = trip?.client_name ?? trip?.direction ?? 'Trajet';

  async function validateStop() {
    const event = {
      type: 'stop_event', trip_id: tripId, stop_id: current.id,
      local_id: randomUUID(), event_type: 'arrived',
      passengers_in: boarding, passengers_out: alighting,
      occurred_at: new Date().toISOString(),
    };
    enqueueEvent(event.local_id, event.type, event);
    try {
      await api.post(`/trips/${tripId}/stops/${current.id}/event`, {
        event_type: 'arrived', passengers_in: boarding, passengers_out: alighting,
        occurred_at: event.occurred_at,
      });
    } catch { syncAll(); }
    setAboard(a => Math.max(0, a + boarding - alighting));
    setBoarding(0);
    setAlighting(0);
    if (stopIdx < stops.length - 1) setStopIdx(i => i + 1);
  }

  async function endTrip() {
    Alert.alert('Terminer la course', 'Confirmer la fin de cette course ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Terminer', style: 'destructive', onPress: async () => {
          const event = { type: 'end', trip_id: tripId, local_id: randomUUID(), occurred_at: new Date().toISOString() };
          enqueueEvent(event.local_id, event.type, event);
          try { await api.post(`/trips/${tripId}/end`, { occurred_at: event.occurred_at }); } catch { syncAll(); }
          router.back();
        },
      },
    ]);
  }

  return (
    <View style={s.screen}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={s.backText}>← Planning</Text>
        </TouchableOpacity>
        <View style={s.headerMain}>
          <View style={s.headerLeft}>
            <Text style={s.eyebrow}>{tripName.toUpperCase()}</Text>
            <Text style={s.headerTitle}>Arrêt {stopIdx + 1} / {stops.length}</Text>
          </View>
          <TouchableOpacity style={s.syncIcon} onPress={() => { syncAll(); }}>
            <Text style={s.syncIconText}>↻</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        {/* Current stop card */}
        <View style={s.stopCard}>
          <Text style={s.stopLabel}>ARRÊT ACTUEL</Text>
          <Text style={s.stopName}>{current?.name ?? '—'}</Text>
          <Text style={s.stopAddress}>{current?.address ?? ''}</Text>
        </View>

        {/* Counters */}
        <View style={s.countersRow}>
          {/* Boarding */}
          <View style={s.counterHalf}>
            <Text style={s.counterLabel}>MONTANTS</Text>
            <View style={s.counterControls}>
              <TouchableOpacity style={s.btnMinus} onPress={() => setBoarding(v => Math.max(0, v - 1))}>
                <Text style={s.btnMinusText}>−</Text>
              </TouchableOpacity>
              <Text style={s.counterVal}>{boarding}</Text>
              <TouchableOpacity style={s.btnPlus} onPress={() => setBoarding(v => v + 1)}>
                <Text style={s.btnPlusText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Divider */}
          <View style={s.counterDivider} />

          {/* Alighting */}
          <View style={s.counterHalf}>
            <Text style={s.counterLabel}>DESCENDANTS</Text>
            <View style={s.counterControls}>
              <TouchableOpacity style={s.btnMinus} onPress={() => setAlighting(v => Math.max(0, v - 1))}>
                <Text style={s.btnMinusText}>−</Text>
              </TouchableOpacity>
              <Text style={s.counterVal}>{alighting}</Text>
              <TouchableOpacity style={s.btnPlus} onPress={() => setAlighting(v => v + 1)}>
                <Text style={s.btnPlusText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Aboard */}
        <View style={s.aboardCard}>
          <Text style={s.aboardNum}>{aboard}</Text>
          <Text style={s.aboardLabel}>passagers{'\n'}à bord</Text>
        </View>

        {/* Next stop button */}
        {next ? (
          <TouchableOpacity style={s.nextBtn} onPress={validateStop} activeOpacity={0.85}>
            <Text style={s.nextBtnText}>PARTIR → ARRÊT {stopIdx + 2}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[s.nextBtn, { backgroundColor: '#2E8B57' }]} onPress={endTrip} activeOpacity={0.85}>
            <Text style={s.nextBtnText}>✓ TERMINER LA COURSE</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Incident bar */}
      <TouchableOpacity style={s.incidentBar}
        onPress={() => router.push({ pathname: '/(app)/incident', params: { tripId } })}>
        <Text style={s.incidentBarText}>⚠  SIGNALER UN INCIDENT</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: INK5 },
  backText: { fontFamily: 'SpaceMono', fontSize: 11, color: INK4, letterSpacing: 1, marginBottom: 10 },
  headerMain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flex: 1 },
  eyebrow: { fontFamily: 'SpaceMono', fontSize: 10, color: INK3, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 3 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: INK },
  syncIcon: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: INK5, alignItems: 'center', justifyContent: 'center' },
  syncIconText: { fontSize: 16, color: INK4 },
  scroll: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  stopCard: { borderRadius: 14, borderWidth: 1.5, borderColor: INK5, padding: 16 },
  stopLabel: { fontFamily: 'SpaceMono', fontSize: 9, color: INK4, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  stopName: { fontSize: 20, fontWeight: '800', color: INK, marginBottom: 3 },
  stopAddress: { fontSize: 13, color: INK3 },
  countersRow: { borderRadius: 14, borderWidth: 1.5, borderColor: INK5, flexDirection: 'row', overflow: 'hidden' },
  counterHalf: { flex: 1, padding: 16, alignItems: 'center' },
  counterDivider: { width: 1.5, backgroundColor: INK5 },
  counterLabel: { fontFamily: 'SpaceMono', fontSize: 9, color: INK4, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 },
  counterControls: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  btnMinus: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: INK, alignItems: 'center', justifyContent: 'center' },
  btnMinusText: { fontSize: 26, fontWeight: '300', color: INK, lineHeight: 30 },
  btnPlus: { width: 44, height: 44, borderRadius: 22, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  btnPlusText: { fontSize: 24, fontWeight: '700', color: '#fff', lineHeight: 28 },
  counterVal: { fontSize: 36, fontWeight: '800', color: INK, minWidth: 36, textAlign: 'center' },
  aboardCard: { borderRadius: 14, borderWidth: 1.5, borderColor: INK5, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  aboardNum: { fontSize: 72, fontWeight: '900', color: INK, lineHeight: 76 },
  aboardLabel: { fontSize: 14, color: INK3, textAlign: 'right', lineHeight: 20 },
  nextBtn: { backgroundColor: BRAND, borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  nextBtnText: { fontFamily: 'SpaceMono', fontSize: 13, fontWeight: '700', color: '#fff', letterSpacing: 2.5, textTransform: 'uppercase' },
  incidentBar: { backgroundColor: DANGER, paddingVertical: 18, alignItems: 'center' },
  incidentBarText: { fontFamily: 'SpaceMono', fontSize: 12, fontWeight: '700', color: '#fff', letterSpacing: 2.5, textTransform: 'uppercase' },
});
