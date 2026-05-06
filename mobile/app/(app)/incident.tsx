import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Animated } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import { api } from '@/src/lib/api';

const BRAND = '#F26419';
const INK = '#1A1718';
const INK2 = '#393536';
const INK3 = '#6B6566';
const INK4 = '#B9B3B4';
const INK5 = '#E8E5E6';
const BG = '#FAFAF9';
const DANGER = '#D13A2A';

const INCIDENT_TYPES = [
  { key: 'accident',         label: 'Accident',        icon: '✕' },
  { key: 'panne',            label: 'Panne',           icon: '⚙' },
  { key: 'retard',           label: 'Retard',          icon: '⏱' },
  { key: 'voie_bloquee',     label: 'Voie bloquée',    icon: '⊖' },
  { key: 'passager_refuse',  label: 'Passager refusé', icon: '✋' },
  { key: 'securite',         label: 'Sécurité',        icon: '◈' },
  { key: 'meteo',            label: 'Météo',           icon: '☂' },
  { key: 'passager_absent',  label: 'Passager absent', icon: '○' },
  { key: 'autre',            label: 'Autre',           icon: '···' },
];

export default function IncidentScreen() {
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  const [selected, setSelected] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [recDuration, setRecDuration] = useState(0);
  const recTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animated waveform bars
  const bars = useRef(Array.from({ length: 20 }, () => new Animated.Value(0.2))).current;

  function animateBars(active: boolean) {
    bars.forEach(bar => {
      if (active) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(bar, { toValue: Math.random() * 0.8 + 0.2, duration: 200 + Math.random() * 200, useNativeDriver: false }),
            Animated.timing(bar, { toValue: 0.2, duration: 200 + Math.random() * 200, useNativeDriver: false }),
          ])
        ).start();
      } else {
        bar.stopAnimation();
        Animated.timing(bar, { toValue: 0.2, duration: 200, useNativeDriver: false }).start();
      }
    });
  }

  useEffect(() => {
    return () => { if (recTimer.current) clearInterval(recTimer.current); };
  }, []);

  function toggleType(key: string) {
    setSelected(prev => prev === key ? null : key);
  }

  async function startRecording() {
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    setRecording(rec);
    setRecDuration(0);
    recTimer.current = setInterval(() => setRecDuration(d => {
      if (d >= 59) { stopRecordingNow(rec); return d; }
      return d + 1;
    }), 1000);
    animateBars(true);
  }

  async function stopRecordingNow(rec: Audio.Recording) {
    if (recTimer.current) clearInterval(recTimer.current);
    animateBars(false);
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      setAudioUri(uri);
    } catch {}
    setRecording(null);
  }

  async function stopRecording() {
    if (!recording) return;
    stopRecordingNow(recording);
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
      Alert.alert('Alerte envoyée', 'L\'incident a été signalé au dispatching', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? 'Impossible d\'envoyer l\'alerte');
    } finally {
      setSubmitting(false);
    }
  }

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <View style={s.screen}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backRow}>
          <Text style={s.backText}>‹ Course</Text>
        </TouchableOpacity>
        <Text style={s.headerEyebrow}>SIGNALEMENT</Text>
        <Text style={s.headerTitle}>Déclarer un incident</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        {/* 3×3 grid */}
        <Text style={s.sectionLabel}>TYPE D'INCIDENT</Text>
        <View style={s.grid}>
          {INCIDENT_TYPES.map(({ key, label, icon }) => {
            const isSelected = selected === key;
            const isDanger = key === 'accident' || key === 'securite';
            return (
              <TouchableOpacity key={key}
                style={[s.gridCell, isSelected && (isDanger ? s.gridCellDanger : s.gridCellActive)]}
                onPress={() => toggleType(key)}
                activeOpacity={0.75}>
                <Text style={[s.gridIcon, isSelected && s.gridIconActive, isDanger && isSelected && s.gridIconDanger]}>
                  {icon}
                </Text>
                <Text style={[s.gridLabel, isSelected && s.gridLabelActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Voice note */}
        <Text style={[s.sectionLabel, { marginTop: 20 }]}>NOTE VOCALE (optionnel · max 60s)</Text>
        <View style={s.voiceCard}>
          {audioUri ? (
            <View style={s.audioReady}>
              <Text style={s.audioReadyText}>● Enregistrement prêt · {recDuration}s</Text>
              <TouchableOpacity onPress={() => setAudioUri(null)}>
                <Text style={s.audioDelete}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Waveform */}
              <View style={s.waveform}>
                {bars.map((bar, i) => (
                  <Animated.View key={i} style={[s.waveBar, {
                    height: bar.interpolate({ inputRange: [0, 1], outputRange: [4, 40] }),
                    backgroundColor: recording ? BRAND : INK5,
                  }]} />
                ))}
              </View>
              <TouchableOpacity
                style={[s.voiceBtn, recording && s.voiceBtnRecording]}
                onPress={recording ? stopRecording : startRecording}>
                <Text style={s.voiceBtnText}>
                  {recording ? `⏹  ARRÊTER · ${recDuration}s` : '🎙  ENREGISTRER'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Context row */}
        <View style={s.contextRow}>
          {[['CHAUFFEUR', 'D1 · MOHAMED Ali'], ['VÉHICULE', 'GR-558-LA'], ['HEURE', timeStr]].map(([l, v]) => (
            <View key={l} style={s.contextItem}>
              <Text style={s.contextLabel}>{l}</Text>
              <Text style={s.contextValue}>{v}</Text>
            </View>
          ))}
        </View>

        <View style={s.actions}>
          <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()}>
            <Text style={s.cancelBtnText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.sendBtn, submitting && { opacity: 0.5 }]}
            onPress={submit} disabled={submitting}>
            <Text style={s.sendBtnText}>{submitting ? 'Envoi…' : '⚠  Envoyer l\'alerte'}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  header: { backgroundColor: INK, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20 },
  backRow: { marginBottom: 12 },
  backText: { color: 'rgba(255,255,255,.5)', fontFamily: 'SpaceMono', fontSize: 11, letterSpacing: 1 },
  headerEyebrow: { fontFamily: 'SpaceMono', fontSize: 9, color: BRAND, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 4 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
  sectionLabel: { fontFamily: 'SpaceMono', fontSize: 9, color: INK3, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridCell: { width: '31%', aspectRatio: 1, borderRadius: 12, borderWidth: 1.5, borderColor: INK5, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', gap: 6 },
  gridCellActive: { borderColor: BRAND, backgroundColor: '#FFF4EE' },
  gridCellDanger: { borderColor: DANGER, backgroundColor: '#FFF0EE' },
  gridIcon: { fontSize: 22, color: INK3 },
  gridIconActive: { color: BRAND },
  gridIconDanger: { color: DANGER },
  gridLabel: { fontFamily: 'SpaceMono', fontSize: 9, color: INK3, letterSpacing: 1, textAlign: 'center' },
  gridLabelActive: { color: INK, fontWeight: '700' },
  voiceCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: INK5, padding: 16, marginBottom: 10 },
  waveform: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, height: 48, marginBottom: 12 },
  waveBar: { width: 4, borderRadius: 2 },
  voiceBtn: { backgroundColor: INK, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  voiceBtnRecording: { backgroundColor: DANGER },
  voiceBtnText: { fontFamily: 'SpaceMono', fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 2 },
  audioReady: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  audioReadyText: { fontFamily: 'SpaceMono', fontSize: 11, color: BRAND, fontWeight: '700' },
  audioDelete: { fontFamily: 'SpaceMono', fontSize: 10, color: DANGER },
  contextRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: INK5, marginBottom: 14, overflow: 'hidden' },
  contextItem: { flex: 1, padding: 12, borderRightWidth: 1, borderRightColor: INK5 },
  contextLabel: { fontFamily: 'SpaceMono', fontSize: 8, color: INK4, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 3 },
  contextValue: { fontFamily: 'SpaceMono', fontSize: 10, color: INK, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, borderWidth: 1.5, borderColor: INK5, alignItems: 'center', backgroundColor: '#fff' },
  cancelBtnText: { fontFamily: 'SpaceMono', fontSize: 11, color: INK3, letterSpacing: 1 },
  sendBtn: { flex: 2, paddingVertical: 16, borderRadius: 12, backgroundColor: DANGER, alignItems: 'center' },
  sendBtnText: { fontFamily: 'SpaceMono', fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 1.5, textTransform: 'uppercase' },
});
