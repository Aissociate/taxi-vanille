import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { api, storeTokens } from '@/src/lib/api';

const BRAND = '#F26419';
const INK = '#1A1718';
const INK3 = '#6B6566';
const INK4 = '#B9B3B4';
const INK5 = '#E8E5E6';
const BG = '#F4F3F1';

export default function LoginScreen() {
  const [driverNum, setDriverNum] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const driverInput = useRef<TextInput>(null);

  function pressPinKey(k: string) {
    if (k === 'del') {
      setPin(p => p.slice(0, -1));
      return;
    }
    if (pin.length < 4) setPin(p => p + k);
  }

  async function handleLogin() {
    const num = driverNum.trim().toUpperCase();
    if (!num) {
      Alert.alert('Numéro requis', 'Saisissez votre numéro de chauffeur (ex: D1, C5, H2)');
      return;
    }
    if (pin.length < 4) {
      Alert.alert('PIN incomplet', 'Veuillez saisir votre code PIN à 4 chiffres');
      return;
    }
    setLoading(true);
    const apiUrl = (process.env.EXPO_PUBLIC_API_URL ?? '(undef → localhost fallback)');
    try {
      const { data } = await api.post('/auth/driver/login', {
        driver_number: num,
        pin,
      });
      await storeTokens(data.access_token, data.refresh_token);
      router.replace('/(app)');
    } catch (e: any) {
      const status = e.response?.status ?? 'no-status';
      const body = e.response?.data ? JSON.stringify(e.response.data).slice(0, 200) : (e.message ?? 'unknown');
      Alert.alert(
        '[DEBUG] Login fail',
        `URL bake: ${apiUrl}\nNum: "${num}"\nPin len: ${pin.length}\nStatus: ${status}\nBody: ${body}`,
      );
      setPin('');
    } finally {
      setLoading(false);
    }
  }

  // Numpad rows: 1-9 then blank/0/del — utilisé uniquement pour le PIN
  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'del'],
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}>
      <View style={s.screen}>
        {/* Badge */}
        <View style={s.badge}>
          <Text style={s.badgeText}>A(I)SSOC.</Text>
        </View>

        {/* Title */}
        <Text style={s.title}>Taxi Vanille</Text>
        <Text style={s.subtitle}>ESPACE CHAUFFEUR</Text>

        {/* Driver number — champ texte (accepte D1, C5, H2, etc.) */}
        <Text style={s.fieldLabel}>NUMÉRO CHAUFFEUR</Text>
        <TextInput
          ref={driverInput}
          value={driverNum}
          onChangeText={(t) => setDriverNum(t.toUpperCase())}
          placeholder="Ex: D1, C5, H2"
          placeholderTextColor={INK4}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={10}
          style={s.driverInput}
        />

        {/* PIN */}
        <Text style={[s.fieldLabel, { marginTop: 18 }]}>CODE PIN</Text>
        <View style={s.pinRow}>
          {[0, 1, 2, 3].map(i => (
            <View key={i} style={[s.pinBox, i < pin.length && s.pinBoxFilled]}>
              {i < pin.length && <View style={s.pinDot} />}
            </View>
          ))}
        </View>

        {/* Numpad (PIN uniquement) */}
        <View style={s.numpad}>
          {rows.map((row, ri) => (
            <View key={ri} style={s.numpadRow}>
              {row.map((k, ki) => {
                if (!k) return <View key={ki} style={s.numKeyEmpty} />;
                if (k === 'del') {
                  return (
                    <TouchableOpacity key={k} style={s.numKey} onPress={() => pressPinKey('del')}>
                      <Text style={s.numKeyDel}>⌫</Text>
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity key={k} style={s.numKey} onPress={() => pressPinKey(k)}>
                    <Text style={s.numKeyText}>{k}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Connect button */}
        <TouchableOpacity
          style={[s.connectBtn, loading && { opacity: 0.55 }]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}>
          <Text style={s.connectBtnText}>{loading ? '…' : 'Se connecter'}</Text>
        </TouchableOpacity>

        <Text style={s.hint}>· HORS-LIGNE AUTORISÉ</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG, paddingHorizontal: 24, paddingTop: 52, paddingBottom: 24, alignItems: 'center' },
  badge: { backgroundColor: INK5, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 20 },
  badgeText: { fontFamily: 'SpaceMono', fontSize: 10, color: INK3, letterSpacing: 1.5 },
  title: { fontSize: 28, fontWeight: '800', color: INK, letterSpacing: 0.3, marginBottom: 4 },
  subtitle: { fontFamily: 'SpaceMono', fontSize: 10, color: BRAND, letterSpacing: 3, marginBottom: 24 },
  fieldLabel: { fontFamily: 'SpaceMono', fontSize: 9, color: BRAND, letterSpacing: 2.5, textTransform: 'uppercase', alignSelf: 'flex-start', marginBottom: 8 },
  driverInput: {
    width: '100%', backgroundColor: '#fff', borderRadius: 10,
    borderWidth: 1.5, borderColor: INK5,
    paddingVertical: 14, paddingHorizontal: 18,
    fontSize: 22, fontWeight: '700', color: INK, letterSpacing: 4,
    fontFamily: 'SpaceMono',
  },
  pinRow: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 20 },
  pinBox: { flex: 1, aspectRatio: 1.3, borderRadius: 10, borderWidth: 1.5, borderColor: INK5, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  pinBoxFilled: { backgroundColor: INK, borderColor: INK },
  pinDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#fff' },
  numpad: { width: '100%', gap: 10, marginBottom: 16 },
  numpadRow: { flexDirection: 'row', gap: 10 },
  numKey: { flex: 1, height: 58, borderRadius: 12, borderWidth: 1.5, borderColor: INK5, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  numKeyEmpty: { flex: 1, height: 58 },
  numKeyText: { fontSize: 24, fontWeight: '500', color: INK },
  numKeyDel: { fontSize: 20, color: INK3 },
  connectBtn: { width: '100%', backgroundColor: BRAND, borderRadius: 14, paddingVertical: 17, alignItems: 'center', marginTop: 4 },
  connectBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  hint: { fontFamily: 'SpaceMono', fontSize: 9, color: INK4, letterSpacing: 2, marginTop: 'auto', paddingTop: 12 },
});
