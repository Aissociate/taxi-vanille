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
const INK2 = '#393536';
const INK3 = '#6B6566';
const INK4 = '#B9B3B4';
const INK5 = '#E8E5E6';
const BG = '#FAFAF9';
const SUCCESS = '#2E8B57';
const DANGER = '#D13A2A';

const MOCK_STOPS = [
  { id:'s1', name:'Doujani · Dépôt', time:'14:40' },
  { id:'s2', name:'Majicavo Koropa', time:'14:48' },
  { id:'s3', name:'Cavani Centre', time:'14:55' },
  { id:'s4', name:'Place Mariage', time:'15:02' },
  { id:'s5', name:'Mamoudzou Centre', time:'15:08' },
  { id:'s6', name:'Kaweni Marché', time:'15:16' },
  { id:'s7', name:'Passot La Barge', time:'15:24' },
];

export default function TripScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const [aboard, setAboard] = useState(12);
  const [boardingVal, setBoardingVal] = useState(0);
  const [alightingVal, setAlightingVal] = useState(0);
  const [stopIdx, setStopIdx] = useState(2);

  const { data: trip } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => api.get(`/planning/${tripId}`).then(r => r.data).catch(() => null),
  });

  const stops: any[] = trip?.stops ?? MOCK_STOPS;
  const currentStop = stops[stopIdx] ?? stops[0];
  const nextStop = stops[stopIdx + 1];
  const progress = Math.round(((stopIdx) / Math.max(stops.length - 1, 1)) * 100);

  async function validateStop() {
    const event = {
      type: 'stop_event', trip_id: tripId, stop_id: currentStop.id,
      local_id: randomUUID(), event_type: 'arrived',
      passengers_in: boardingVal, passengers_out: alightingVal,
      occurred_at: new Date().toISOString(),
    };
    enqueueEvent(event.local_id, event.type, event);
    try {
      await api.post(`/trips/${tripId}/stops/${currentStop.id}/event`, {
        event_type: 'arrived', passengers_in: boardingVal, passengers_out: alightingVal,
        occurred_at: event.occurred_at,
      });
    } catch { syncAll(); }

    setAboard(a => a + boardingVal - alightingVal);
    setBoardingVal(0);
    setAlightingVal(0);
    if (stopIdx < stops.length - 1) {
      setStopIdx(i => i + 1);
    }
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
      {/* Dark hero header */}
      <View style={s.hero}>
        <TouchableOpacity onPress={() => router.back()} style={s.backRow}>
          <Text style={s.backText}>‹ Planning</Text>
        </TouchableOpacity>
        <Text style={s.heroEyebrow}>PM · ALLER · ARRÊT {stopIdx + 1}/{stops.length}</Text>
        <Text style={s.heroTitle}>Course en cours</Text>
        <Text style={s.heroSub}>L3 · Doujani → Passot La Barge</Text>
        {/* Progress bar */}
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${progress}%` as any }]} />
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        {/* Current stop card */}
        <View style={s.stopCard}>
          <View style={s.stopCardLeft}>
            <Text style={s.stopCardEyebrow}>ARRÊT ACTUEL</Text>
            <Text style={s.stopCardName}>{currentStop?.name ?? '—'}</Text>
          </View>
          <View style={s.stopCardRight}>
            <Text style={s.stopCardTime}>{currentStop?.time ?? '--:--'}</Text>
          </View>
        </View>

        {/* Boarding counter */}
        <View style={s.counterCard}>
          <Text style={s.counterLabel}>MONTANTS</Text>
          <View style={s.counterRow}>
            <TouchableOpacity style={s.counterBtn}
              onPress={() => setBoardingVal(v => Math.max(0, v - 1))}>
              <Text style={s.counterBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={s.counterValue}>{boardingVal}</Text>
            <TouchableOpacity style={[s.counterBtn, s.counterBtnPlus]}
              onPress={() => setBoardingVal(v => v + 1)}>
              <Text style={[s.counterBtnText, s.counterBtnTextPlus]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Alighting counter */}
        <View style={s.counterCard}>
          <Text style={s.counterLabel}>DESCENDANTS</Text>
          <View style={s.counterRow}>
            <TouchableOpacity style={s.counterBtn}
              onPress={() => setAlightingVal(v => Math.max(0, v - 1))}>
              <Text style={s.counterBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={s.counterValue}>{alightingVal}</Text>
            <TouchableOpacity style={[s.counterBtn, s.counterBtnPlus]}
              onPress={() => setAlightingVal(v => v + 1)}>
              <Text style={[s.counterBtnText, s.counterBtnTextPlus]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Total aboard */}
        <View style={s.aboardCard}>
          <Text style={s.aboardLabel}>À BORD</Text>
          <Text style={s.aboardValue}>{aboard}</Text>
          <Text style={s.aboardUnit}>passagers</Text>
        </View>

        {/* Next stop + validate */}
        {nextStop ? (
          <TouchableOpacity style={s.nextBtn} onPress={validateStop}>
            <Text style={s.nextBtnText}>→ Prochain arrêt · {nextStop.name}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[s.nextBtn, { backgroundColor: SUCCESS }]} onPress={endTrip}>
            <Text style={s.nextBtnText}>✓ Terminer la course</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Incident FAB */}
      <TouchableOpacity style={s.incidentFab}
        onPress={() => router.push({ pathname: '/(app)/incident', params: { tripId } })}>
        <Text style={s.incidentFabText}>⚠  INCIDENT</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  hero: { backgroundColor: INK, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20 },
  backRow: { marginBottom: 12 },
  backText: { color: 'rgba(255,255,255,.5)', fontFamily: 'SpaceMono', fontSize: 11, letterSpacing: 1 },
  heroEyebrow: { fontFamily: 'SpaceMono', fontSize: 10, color: BRAND, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 4 },
  heroTitle: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 2 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,.55)', marginBottom: 14 },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,.15)', borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: BRAND, borderRadius: 2 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 14 },
  stopCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: INK5, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  stopCardLeft: { flex: 1 },
  stopCardEyebrow: { fontFamily: 'SpaceMono', fontSize: 9, color: INK3, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  stopCardName: { fontSize: 18, fontWeight: '700', color: INK },
  stopCardRight: { },
  stopCardTime: { fontFamily: 'SpaceMono', fontSize: 22, fontWeight: '700', color: BRAND },
  counterCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: INK5, padding: 16, marginBottom: 10 },
  counterLabel: { fontFamily: 'SpaceMono', fontSize: 9, color: INK3, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  counterBtn: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: INK5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  counterBtnPlus: { backgroundColor: BRAND, borderColor: BRAND },
  counterBtnText: { fontSize: 28, fontWeight: '300', color: INK, lineHeight: 32 },
  counterBtnTextPlus: { color: '#fff', fontWeight: '700' },
  counterValue: { fontSize: 48, fontWeight: '700', color: INK, minWidth: 70, textAlign: 'center' },
  aboardCard: { backgroundColor: INK, borderRadius: 14, padding: 16, marginBottom: 14, alignItems: 'center' },
  aboardLabel: { fontFamily: 'SpaceMono', fontSize: 9, color: 'rgba(255,255,255,.5)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 4 },
  aboardValue: { fontSize: 64, fontWeight: '800', color: '#fff', lineHeight: 70 },
  aboardUnit: { fontSize: 13, color: 'rgba(255,255,255,.5)', marginTop: 2 },
  nextBtn: { backgroundColor: BRAND, borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginBottom: 8 },
  nextBtnText: { fontFamily: 'SpaceMono', fontSize: 13, fontWeight: '700', color: '#fff', letterSpacing: 1.5, textTransform: 'uppercase' },
  incidentFab: { backgroundColor: DANGER, paddingVertical: 18, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  incidentFabText: { fontFamily: 'SpaceMono', fontSize: 13, fontWeight: '700', color: '#fff', letterSpacing: 2.5, textTransform: 'uppercase' },
});
