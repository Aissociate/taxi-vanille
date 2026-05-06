import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import { api } from '@/src/lib/api';

const INCIDENT_TYPES = [
  { key: 'accident', label: '🚨 Accident' },
  { key: 'panne', label: '🔧 Panne' },
  { key: 'retard', label: '⏰ Retard' },
  { key: 'passager_refuse', label: '🚫 Passager refusé' },
  { key: 'securite', label: '🛡️ Sécurité' },
  { key: 'voie_bloquee', label: '🚧 Voie bloquée' },
  { key: 'autre', label: '❓ Autre' },
];

export default function IncidentScreen() {
  const { trip_id } = useLocalSearchParams<{ trip_id?: string }>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggleType(key: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  async function startRecording() {
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    setRecording(recording);
  }

  async function stopRecording() {
    if (!recording) return;
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setAudioUri(uri);
    setRecording(null);
  }

  async function submit() {
    if (selected.size === 0) {
      Alert.alert('Sélection requise', 'Choisissez au moins un type d\'incident');
      return;
    }
    setSubmitting(true);
    try {
      const loc = await Location.getLastKnownPositionAsync();
      const formData = new FormData();
      formData.append('types', JSON.stringify(Array.from(selected)));
      if (trip_id) formData.append('trip_id', trip_id);
      if (loc) { formData.append('lat', String(loc.coords.latitude)); formData.append('lng', String(loc.coords.longitude)); }
      if (audioUri) {
        formData.append('audio', { uri: audioUri, name: 'incident.aac', type: 'audio/aac' } as any);
      }
      await api.post('/incidents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Incident déclaré', '', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Text style={s.backText}>‹ Retour</Text>
        </TouchableOpacity>
        <Text style={s.title}>Déclarer un incident</Text>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Type d'incident</Text>
        <View style={s.grid}>
          {INCIDENT_TYPES.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[s.typeBtn, selected.has(key) && s.typeBtnSelected]}
              onPress={() => toggleType(key)}
            >
              <Text style={[s.typeBtnText, selected.has(key) && s.typeBtnTextSelected]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Note vocale (optionnel, max 60s)</Text>
        {!audioUri ? (
          <TouchableOpacity
            style={[s.voiceBtn, recording ? s.voiceBtnRecording : null]}
            onPress={recording ? stopRecording : startRecording}
          >
            <Text style={s.voiceBtnText}>{recording ? '⏹ Arrêter l\'enregistrement' : '🎙 Enregistrer'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.audioReady}>
            <Text style={s.audioReadyText}>✅ Audio enregistré</Text>
            <TouchableOpacity onPress={() => setAudioUri(null)}>
              <Text style={s.deleteAudio}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={{ margin: 16, marginBottom: 40 }}>
        <TouchableOpacity
          style={[s.submitBtn, submitting && s.submitBtnDisabled]}
          onPress={submit}
          disabled={submitting}
        >
          <Text style={s.submitBtnText}>{submitting ? 'Envoi...' : 'Envoyer l\'incident'}</Text>
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
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#6b7685', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#dde2e8', backgroundColor: '#f7f8fa' },
  typeBtnSelected: { backgroundColor: '#fff3e0', borderColor: '#f07d1a' },
  typeBtnText: { fontSize: 13, color: '#0d1117' },
  typeBtnTextSelected: { fontWeight: '700', color: '#b55c0a' },
  voiceBtn: { backgroundColor: '#0057e7', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  voiceBtnRecording: { backgroundColor: '#e03150' },
  voiceBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  audioReady: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  audioReadyText: { color: '#007a65', fontWeight: '600' },
  deleteAudio: { color: '#e03150', fontSize: 13 },
  submitBtn: { backgroundColor: '#0d1117', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
