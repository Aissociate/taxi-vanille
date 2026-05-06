import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/src/lib/api';
import { enqueueEvent } from '@/src/lib/db';
import { syncAll } from '@/src/lib/sync';
import { randomUUID } from 'expo-crypto';

export default function TripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [passengersIn, setPassengersIn] = useState(0);
  const [passengersOut, setPassengersOut] = useState(0);
  const [currentStopIdx, setCurrentStopIdx] = useState(0);

  const { data: trip } = useQuery({
    queryKey: ['trip', id],
    queryFn: () => api.get(`/planning/${id}`).then(r => r.data),
  });

  async function startTrip() {
    const event = { type: 'start', trip_id: id, local_id: randomUUID(), occurred_at: new Date().toISOString() };
    enqueueEvent(event.local_id, event.type, event);
    try {
      await api.post(`/trips/${id}/start`, { occurred_at: event.occurred_at });
    } catch { syncAll(); }
    Alert.alert('Course démarrée', '');
  }

  async function recordPassengers(stopId: string) {
    const event = {
      type: 'stop_event', trip_id: id, stop_id: stopId, local_id: randomUUID(),
      event_type: 'arrived', passengers_in: passengersIn, passengers_out: passengersOut,
      occurred_at: new Date().toISOString(),
    };
    enqueueEvent(event.local_id, event.type, event);
    try {
      await api.post(`/trips/${id}/stops/${stopId}/event`, { event_type: 'arrived', passengers_in: passengersIn, passengers_out: passengersOut, occurred_at: event.occurred_at });
    } catch { syncAll(); }
    setPassengersIn(0);
    setPassengersOut(0);
    setCurrentStopIdx(i => i + 1);
  }

  async function endTrip() {
    Alert.alert('Terminer la course', 'Confirmer la fin de cette course ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Terminer', style: 'destructive', onPress: async () => {
        const event = { type: 'end', trip_id: id, local_id: randomUUID(), occurred_at: new Date().toISOString() };
        enqueueEvent(event.local_id, event.type, event);
        try { await api.post(`/trips/${id}/end`, { occurred_at: event.occurred_at }); } catch { syncAll(); }
        router.back();
      }},
    ]);
  }

  const stops: string[] = trip?.stops_order ? (typeof trip.stops_order === 'string' ? JSON.parse(trip.stops_order) : trip.stops_order) : [];

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Text style={s.backText}>‹ Retour</Text>
        </TouchableOpacity>
        <Text style={s.title}>{trip?.client_name ?? 'Course'}</Text>
      </View>

      <View style={s.section}>
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#00c9a7' }]} onPress={startTrip}>
          <Text style={s.actionBtnText}>▶ Démarrer la course</Text>
        </TouchableOpacity>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Comptage passagers</Text>
        <View style={s.counter}>
          <View style={s.counterItem}>
            <Text style={s.counterLabel}>Montants</Text>
            <View style={s.counterRow}>
              <TouchableOpacity style={s.counterBtn} onPress={() => setPassengersIn(Math.max(0, passengersIn - 1))}>
                <Text style={s.counterBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={s.counterValue}>{passengersIn}</Text>
              <TouchableOpacity style={[s.counterBtn, s.counterBtnPlus]} onPress={() => setPassengersIn(passengersIn + 1)}>
                <Text style={s.counterBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={s.counterItem}>
            <Text style={s.counterLabel}>Descendants</Text>
            <View style={s.counterRow}>
              <TouchableOpacity style={s.counterBtn} onPress={() => setPassengersOut(Math.max(0, passengersOut - 1))}>
                <Text style={s.counterBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={s.counterValue}>{passengersOut}</Text>
              <TouchableOpacity style={[s.counterBtn, s.counterBtnPlus]} onPress={() => setPassengersOut(passengersOut + 1)}>
                <Text style={s.counterBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {stops[currentStopIdx] && (
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#0057e7' }]} onPress={() => recordPassengers(stops[currentStopIdx])}>
            <Text style={s.actionBtnText}>✓ Valider arrêt {currentStopIdx + 1}/{stops.length}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[s.section, { marginBottom: 40 }]}>
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#e03150' }]} onPress={endTrip}>
          <Text style={s.actionBtnText}>■ Terminer la course</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.actionBtn, { backgroundColor: '#f07d1a', marginTop: 8 }]}
          onPress={() => router.push({ pathname: '/(app)/incident', params: { trip_id: id } })}
        >
          <Text style={s.actionBtnText}>⚠ Déclarer un incident</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8fa' },
  header: { backgroundColor: '#0d1117', padding: 20, paddingTop: 52 },
  back: { marginBottom: 8 },
  backText: { color: 'rgba(255,255,255,.6)', fontSize: 15 },
  title: { fontSize: 20, fontWeight: '800', color: '#fff' },
  section: { margin: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#dde2e8' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6b7685', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 },
  counter: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  counterItem: { flex: 1 },
  counterLabel: { fontSize: 13, color: '#6b7685', marginBottom: 8, textAlign: 'center' },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  counterBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#eef0f3', alignItems: 'center', justifyContent: 'center' },
  counterBtnPlus: { backgroundColor: '#e8f0ff' },
  counterBtnText: { fontSize: 22, fontWeight: '700', color: '#0d1117' },
  counterValue: { fontSize: 28, fontWeight: '800', color: '#0d1117', minWidth: 40, textAlign: 'center' },
  actionBtn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
