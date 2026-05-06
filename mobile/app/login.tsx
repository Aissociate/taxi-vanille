import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { api, storeTokens } from '@/src/lib/api';

export default function LoginScreen() {
  const [driverNumber, setDriverNumber] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!driverNumber.trim() || pin.length < 4) {
      Alert.alert('Erreur', 'Veuillez saisir votre numéro et votre PIN');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/driver/login', { driver_number: driverNumber.trim(), pin });
      await storeTokens(data.access_token, data.refresh_token);
      router.replace('/(app)');
    } catch (e: any) {
      Alert.alert('Connexion refusée', e.response?.data?.message ?? 'Numéro ou PIN incorrect');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.container}>
      <View style={s.card}>
        <Text style={s.logo}>🚕</Text>
        <Text style={s.title}>Taxi Vanille</Text>
        <Text style={s.subtitle}>Application Chauffeur</Text>

        <TextInput
          style={s.input}
          placeholder="Numéro chauffeur"
          value={driverNumber}
          onChangeText={setDriverNumber}
          autoCapitalize="none"
          keyboardType="numeric"
        />
        <TextInput
          style={s.input}
          placeholder="PIN (4-6 chiffres)"
          value={pin}
          onChangeText={setPin}
          secureTextEntry
          keyboardType="numeric"
          maxLength={6}
        />
        <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleLogin} disabled={loading}>
          <Text style={s.btnText}>{loading ? 'Connexion...' : 'Se connecter'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 28, alignItems: 'center' },
  logo: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#0d1117' },
  subtitle: { fontSize: 14, color: '#6b7685', marginBottom: 28, marginTop: 4 },
  input: { width: '100%', borderWidth: 1, borderColor: '#dde2e8', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, marginBottom: 12 },
  btn: { width: '100%', backgroundColor: '#0057e7', borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
