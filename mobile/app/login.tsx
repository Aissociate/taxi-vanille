import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { api, storeTokens } from '@/src/lib/api';

const BRAND = '#F26419';
const INK = '#1A1718';
const INK2 = '#393536';
const INK3 = '#6B6566';
const INK4 = '#B9B3B4';
const INK5 = '#E8E5E6';
const BG = '#FAFAF9';

export default function LoginScreen() {
  const [driverCode, setDriverCode] = useState('D1');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  function pressKey(k: string) {
    if (k === 'del') {
      setPin(p => p.slice(0, -1));
    } else if (pin.length < 4) {
      setPin(p => p + k);
    }
  }

  async function handleLogin() {
    if (pin.length < 4) {
      Alert.alert('PIN incomplet', 'Veuillez saisir votre code PIN à 4 chiffres');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/driver/login', {
        driver_number: driverCode.trim(),
        pin,
      });
      await storeTokens(data.access_token, data.refresh_token);
      router.replace('/(app)');
    } catch (e: any) {
      Alert.alert('Connexion refusée', e.response?.data?.message ?? 'Code ou PIN incorrect');
      setPin('');
    } finally {
      setLoading(false);
    }
  }

  const keys = ['1','2','3','4','5','6','7','8','9','del','0','ok'];

  return (
    <View style={s.screen}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.monogram}>
          <Text style={s.monogramText}>TV</Text>
        </View>
        <Text style={s.title}>Taxi Vanille</Text>
        <Text style={s.subtitle}>APPLICATION CHAUFFEUR</Text>
      </View>

      {/* Driver code */}
      <View style={s.section}>
        <Text style={s.label}>IDENTIFIANT CHAUFFEUR</Text>
        <View style={s.codeRow}>
          {['D1','D2','D3','D4','D5'].map(c => (
            <TouchableOpacity key={c} onPress={() => setDriverCode(c)}
              style={[s.codeBtn, driverCode===c && s.codeBtnActive]}>
              <Text style={[s.codeBtnText, driverCode===c && s.codeBtnTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* PIN dots */}
      <View style={s.section}>
        <Text style={s.label}>CODE PIN</Text>
        <View style={s.pinRow}>
          {[0,1,2,3].map(i => (
            <View key={i} style={[s.pinDot, i < pin.length && s.pinDotFilled]}>
              {i < pin.length && <View style={s.pinDotInner}/>}
            </View>
          ))}
        </View>
      </View>

      {/* Numpad */}
      <View style={s.numpad}>
        {keys.map((k, i) => {
          if (k === 'ok') {
            return (
              <TouchableOpacity key={k} style={[s.numKey, s.numKeyOk, loading && {opacity:0.5}]}
                onPress={handleLogin} disabled={loading}>
                <Text style={s.numKeyOkText}>{loading ? '…' : '✓'}</Text>
              </TouchableOpacity>
            );
          }
          if (k === 'del') {
            return (
              <TouchableOpacity key={k} style={[s.numKey, s.numKeyDel]} onPress={() => pressKey('del')}>
                <Text style={s.numKeyDelText}>⌫</Text>
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

      <Text style={s.hint}>TAXI VANILLE · MAYOTTE · v1.0</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex:1, backgroundColor:'#fff', paddingHorizontal:28, paddingTop:48, paddingBottom:24 },
  header: { alignItems:'center', marginBottom:28 },
  monogram: { width:52, height:52, backgroundColor:BRAND, borderRadius:12, alignItems:'center', justifyContent:'center', marginBottom:14 },
  monogramText: { color:'#fff', fontFamily:'SpaceMono', fontSize:16, fontWeight:'700', letterSpacing:1 },
  title: { fontSize:24, fontWeight:'800', color:INK, letterSpacing:0.5 },
  subtitle: { fontSize:9, color:INK3, letterSpacing:2.5, marginTop:4, fontFamily:'SpaceMono' },
  section: { marginBottom:20 },
  label: { fontSize:9, color:INK3, letterSpacing:2.2, marginBottom:10, fontFamily:'SpaceMono', textTransform:'uppercase' },
  codeRow: { flexDirection:'row', gap:8 },
  codeBtn: { flex:1, height:48, borderRadius:10, borderWidth:1.5, borderColor:INK5, alignItems:'center', justifyContent:'center', backgroundColor:'#fff' },
  codeBtnActive: { borderColor:INK, backgroundColor:INK },
  codeBtnText: { fontFamily:'SpaceMono', fontSize:14, fontWeight:'700', color:INK3 },
  codeBtnTextActive: { color:'#fff' },
  pinRow: { flexDirection:'row', gap:10 },
  pinDot: { flex:1, height:60, borderRadius:10, borderWidth:1.5, borderColor:INK5, alignItems:'center', justifyContent:'center', backgroundColor:'#fff' },
  pinDotFilled: { borderColor:INK, backgroundColor:INK },
  pinDotInner: { width:12, height:12, borderRadius:6, backgroundColor:'#fff' },
  numpad: { flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:16 },
  numKey: { width:'30%', flexGrow:1, height:64, borderRadius:12, borderWidth:1.5, borderColor:INK5, alignItems:'center', justifyContent:'center', backgroundColor:'#fff' },
  numKeyText: { fontSize:24, fontWeight:'600', color:INK },
  numKeyDel: { },
  numKeyDelText: { fontSize:20, color:INK3 },
  numKeyOk: { backgroundColor:BRAND, borderColor:BRAND },
  numKeyOkText: { fontSize:22, fontWeight:'700', color:'#fff' },
  hint: { textAlign:'center', fontFamily:'SpaceMono', fontSize:9, color:INK4, letterSpacing:2, marginTop:'auto' },
});
