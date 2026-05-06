import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
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
  const [focus, setFocus] = useState<'num' | 'pin'>('num');
  const [loading, setLoading] = useState(false);

  function pressKey(k: string) {
    if (k === 'del') {
      if (focus === 'pin' && pin.length > 0) setPin(p => p.slice(0, -1));
      else if (focus === 'num') setDriverNum(d => d.slice(0, -1));
      return;
    }
    if (focus === 'num') {
      if (driverNum.length < 10) setDriverNum(d => d + k);
    } else {
      if (pin.length < 4) setPin(p => p + k);
    }
  }

  async function handleLogin() {
    if (!driverNum.trim()) {
      Alert.alert('Numéro requis', 'Saisissez votre numéro de chauffeur');
      return;
    }
    if (pin.length < 4) {
      Alert.alert('PIN incomplet', 'Veuillez saisir votre code PIN à 4 chiffres');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/driver/login', {
        driver_number: driverNum.trim(),
        pin,
      });
      await storeTokens(data.access_token, data.refresh_token);
      router.replace('/(app)');
    } catch (e: any) {
      Alert.alert('Connexion refusée', e.response?.data?.message ?? 'Numéro ou PIN incorrect');
      setPin('');
    } finally {
      setLoading(false);
    }
  }

  // Numpad rows: 1-9 then blank/0/del
  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'del'],
  ];

  const numDisplay = driverNum.split('').join(' ');

  return (
    <View style={s.screen}>
      {/* Badge */}
      <View style={s.badge}>
        <Text style={s.badgeText}>A(I)SSOC.</Text>
      </View>

      {/* Title */}
      <Text style={s.title}>Taxi Vanille</Text>
      <Text style={s.subtitle}>ESPACE CHAUFFEUR</Text>

      {/* Driver number */}
      <Text style={s.fieldLabel}>NUMÉRO CHAUFFEUR</Text>
      <TouchableOpacity
        style={[s.numField, focus === 'num' && s.numFieldActive]}
        onPress={() => setFocus('num')}
        activeOpacity={0.8}>
        <Text style={[s.numFieldText, !driverNum && s.numFieldPlaceholder]}>
          {driverNum ? numDisplay : '—'}
        </Text>
      </TouchableOpacity>

      {/* PIN */}
      <Text style={[s.fieldLabel, { marginTop: 18 }]}>CODE PIN</Text>
      <TouchableOpacity style={s.pinRow} onPress={() => setFocus('pin')} activeOpacity={0.9}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={[s.pinBox, i < pin.length && s.pinBoxFilled]}>
            {i < pin.length && <View style={s.pinDot} />}
          </View>
        ))}
      </TouchableOpacity>

      {/* Numpad */}
      <View style={s.numpad}>
        {rows.map((row, ri) => (
          <View key={ri} style={s.numpadRow}>
            {row.map((k, ki) => {
              if (!k) return <View key={ki} style={s.numKeyEmpty} />;
              if (k === 'del') {
                return (
                  <TouchableOpacity key={k} style={s.numKey} onPress={() => pressKey('del')}>
                    <Text style={s.numKeyDel}>⌫</Text>
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity key={k} style={s.numKey} onPress={() => pressKey(k)}>
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
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG, paddingHorizontal: 24, paddingTop: 52, paddingBottom: 24, alignItems: 'center' },
  badge: { backgroundColor: INK5, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 20 },
  badgeText: { fontFamily: 'SpaceMono', fontSize: 10, color: INK3, letterSpacing: 1.5 },
  title: { fontSize: 28, fontWeight: '800', color: INK, letterSpacing: 0.3, marginBottom: 4 },
  subtitle: { fontFamily: 'SpaceMono', fontSize: 10, color: BRAND, letterSpacing: 3, marginBottom: 24 },
  fieldLabel: { fontFamily: 'SpaceMono', fontSize: 9, color: BRAND, letterSpacing: 2.5, textTransform: 'uppercase', alignSelf: 'flex-start', marginBottom: 8 },
  numField: { width: '100%', backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: INK5, paddingVertical: 14, paddingHorizontal: 18, marginBottom: 4 },
  numFieldActive: { borderColor: INK },
  numFieldText: { fontFamily: 'SpaceMono', fontSize: 22, fontWeight: '700', color: INK, letterSpacing: 8 },
  numFieldPlaceholder: { color: INK4 },
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
