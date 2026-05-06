import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Animated } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import { api } from '@/src/lib/api';

const BRAND = '#F26419';
const INK = '#1A1718';
const INK3 = '#6B6566';
const INK4 = '#B9B3B4';
const INK5 = '#E8E5E6';
const DANGER = '#D13A2A';

const TYPES = [
  { key: 'accident',        label: 'Accident',        icon: '✕' },
  { key: 'panne',           label: 'Panne',           icon: '⚙' },
  { key: 'retard',          label: 'Retard',          icon: '⏱' },
  { key: 'voie_bloquee',    label: 'Voie bloquée',    icon: '⊖' },
  { key: 'passager_refuse', label: 'Passager refusé', icon: '✋' },
  { key: 'securite',        label: 'Sécurité',        icon: '◈' },
  { key: 'meteo',           label: 'Météo',           icon: '☂' },
  { key: 'client_absent',   label: 'Client absent',   icon: '◯' },
  { key: 'autre',           label: 'Autre',           icon: '···' },
];

const NUM_BARS = 28;

export default function IncidentScreen() {
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  const [selected, setSelected] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [recSecs, setRecSecs] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const bars = useRef(Array.from({ length: NUM_BARS }, () => new Animated.Value(0.15))).current;
  const loopsRef = useRef<Animated.CompositeAnimation[]>([]);

  function startBars() {
    loopsRef.current.forEach(l => l.stop());
    loopsRef.current = bars.map(bar => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(bar, { toValue: Math.random() * 0.85 + 0.15, duration: 150 + Math.random() * 250, useNativeDriver: false }),
          Animated.timing(bar, { toValue: 0.15, duration: 150 + Math.random() * 250, useNativeDriver: false }),
        ])
      );
      loop.start();
      return loop;
    });
  }

  function stopBars() {
    loopsRef.current.forEach(l => l.stop());
    bars.forEach(b => Animated.timing(b, { toValue: 0.15, duration: 200, useNativeDriver: false }).start());
  }

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopBars();
  }, []);

  async function startRecording() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(rec);
      setRecSecs(0);
      startBars();
      timerRef.current = setInterval(() => {
        setRecSecs(s => {
          if (s >= 59) { doStop(rec); return s; }
          return s + 1;
        });
      }, 1000);
    } catch {}
  }

  async function doStop(rec: Audio.Recording) {
    if (timerRef.current) clearInterval(timerRef.current);
    stopBars();
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      setAudioUri(uri ?? null);
    } catch {}
    setRecording(null);
  }

  function fmtTime(secs: number) {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  async function submit() {
    if (!selected) {
      Alert.alert('Sélection requise', 'Choisissez un type d\'incident');
      return;
    }
    setSubmitting(true);
    try {
      const loc = await Location.getLastKnownPositionAsync();
      const formData = new FormData();
      formData.append('types', JSON.stringify([selected]));
      if (tripId) formData.append('trip_id', tripId);
      if (loc) {
        formData.append('lat', String(loc.coords.latitude));
        formData.append('lng', String(loc.coords.longitude));
      }
      if (audioUri) {
        formData.append('audio', { uri: audioUri, name: 'incident.aac', type: 'audio/aac' } as any);
      }
      await api.post('/incidents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Alerte envoyée', 'Le dispatching a été notifié', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? 'Impossible d\'envoyer l\'alerte');
    } finally {
      setSubmitting(false);
    }
  }

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <View style={s.overlay}>
      {/* Tap-to-dismiss area */}
      <TouchableOpacity style={s.backdrop} onPress={() => router.back()} activeOpacity={1} />

      {/* Bottom sheet */}
      <View style={s.sheet}>
        {/* Drag handle */}
        <View style={s.handle} />

        <ScrollView contentContainerStyle={s.sheetContent} showsVerticalScrollIndicator={false}>
          {/* Photo placeholder */}
          <View style={s.photoArea}>
            <Text style={s.photoLabel}>[PHOTO OPTIONNELLE]</Text>
          </View>

          {/* Section header */}
          <View style={s.sectionHeader}>
            <Text style={s.incidentTag}>INCIDENT</Text>
            <Text style={s.incidentTime}>{timeStr}</Text>
          </View>
          <Text style={s.mainTitle}>Que se passe-t-il ?</Text>

          {/* 3×3 grid */}
          <View style={s.grid}>
            {TYPES.map(({ key, label, icon }) => {
              const isSelected = selected === key;
              return (
                <TouchableOpacity key={key}
                  style={[s.cell, isSelected && s.cellSelected]}
                  onPress={() => setSelected(k => k === key ? null : key)}
                  activeOpacity={0.75}>
                  <Text style={[s.cellIcon, isSelected && s.cellIconSelected]}>{icon}</Text>
                  <Text style={[s.cellLabel, isSelected && s.cellLabelSelected]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Voice memo */}
          <Text style={s.voiceTitle}>MÉMO VOCAL · FACULTATIF (60 S MAX)</Text>
          <View style={s.voiceCard}>
            {/* Record button */}
            <TouchableOpacity
              style={[s.recBtn, recording && s.recBtnActive]}
              onPress={recording ? () => doStop(recording) : startRecording}
              activeOpacity={0.8}>
              {recording
                ? <View style={s.recStop} />
                : <View style={s.recDot} />}
            </TouchableOpacity>

            {/* Waveform */}
            <View style={s.waveform}>
              {bars.map((bar, i) => (
                <Animated.View key={i} style={[s.bar, {
                  height: bar.interpolate({ inputRange: [0, 1], outputRange: [3, 32] }),
                  backgroundColor: recording ? BRAND : INK5,
                }]} />
              ))}
            </View>

            {/* Timer */}
            <Text style={s.recTime}>
              {audioUri ? `${fmtTime(recSecs)} / 01:00` : `${fmtTime(recSecs)} / 01:00`}
            </Text>
          </View>

          {/* Actions */}
          <View style={s.actions}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()}>
              <Text style={s.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.sendBtn, submitting && { opacity: 0.55 }]}
              onPress={submit}
              disabled={submitting}>
              <Text style={s.sendText}>{submitting ? 'Envoi…' : 'Envoyer l\'alerte'}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '90%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: INK5, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  sheetContent: { paddingHorizontal: 18, paddingTop: 4 },
  photoArea: { height: 110, backgroundColor: '#F2F1EF', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  photoLabel: { fontFamily: 'SpaceMono', fontSize: 11, color: INK4, letterSpacing: 1.5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  incidentTag: { fontFamily: 'SpaceMono', fontSize: 10, fontWeight: '700', color: BRAND, letterSpacing: 2 },
  incidentTime: { fontFamily: 'SpaceMono', fontSize: 10, color: INK4 },
  mainTitle: { fontSize: 22, fontWeight: '800', color: INK, marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  cell: { width: '31%', aspectRatio: 1, borderRadius: 12, borderWidth: 1.5, borderColor: INK5, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', gap: 6 },
  cellSelected: { borderColor: BRAND, backgroundColor: '#FFF3EC' },
  cellIcon: { fontSize: 20, color: INK4 },
  cellIconSelected: { color: BRAND },
  cellLabel: { fontFamily: 'SpaceMono', fontSize: 8, color: INK3, textAlign: 'center', letterSpacing: 0.5 },
  cellLabelSelected: { color: INK, fontWeight: '700' },
  voiceTitle: { fontFamily: 'SpaceMono', fontSize: 8, color: INK4, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  voiceCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1.5, borderColor: INK5, padding: 12, marginBottom: 16 },
  recBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: DANGER, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  recBtnActive: { backgroundColor: DANGER },
  recDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff' },
  recStop: { width: 14, height: 14, borderRadius: 3, backgroundColor: '#fff' },
  waveform: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 36 },
  bar: { width: 3, borderRadius: 1.5 },
  recTime: { fontFamily: 'SpaceMono', fontSize: 10, color: INK4, flexShrink: 0 },
  actions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, paddingVertical: 15, borderRadius: 14, borderWidth: 1.5, borderColor: INK, alignItems: 'center', backgroundColor: '#fff' },
  cancelText: { fontSize: 15, fontWeight: '600', color: INK },
  sendBtn: { flex: 2, paddingVertical: 15, borderRadius: 14, backgroundColor: DANGER, alignItems: 'center' },
  sendText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
