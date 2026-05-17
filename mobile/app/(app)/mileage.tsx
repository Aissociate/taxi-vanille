import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { api } from '@/src/lib/api';

const BRAND = '#F26419';
const INK = '#1A1718';
const INK3 = '#6B6566';
const INK4 = '#B9B3B4';
const INK5 = '#E8E5E6';
const BG = '#FAFAF9';
const SUCCESS = '#2E8B57';
const DANGER = '#D13A2A';

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(m: string) {
  const [y, mo] = m.split('-');
  const names = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  return `${names[parseInt(mo, 10) - 1]} ${y}`;
}

export default function MileageScreen() {
  const month = currentMonth();
  const [mileage, setMileage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [kmInput, setKmInput] = useState('');
  const [type, setType] = useState<'start' | 'end'>('start');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/drivers/me/mileage/current');
      setMileage(data);
    } catch {
      setMileage(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const hasStart = mileage?.km_start != null;
  const hasEnd   = mileage?.km_end   != null;
  const kmTotal  = hasStart && hasEnd ? mileage.km_end - mileage.km_start : null;

  const submit = async () => {
    const km = parseInt(kmInput, 10);
    if (isNaN(km) || km <= 0) { Alert.alert('Erreur', 'Veuillez saisir un kilométrage valide'); return; }
    if (type === 'end' && hasStart && km <= mileage.km_start) {
      Alert.alert('Erreur', `Le relevé de fin doit être supérieur au relevé de début (${mileage.km_start} km)`);
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post('/drivers/me/mileage', { month, type, km });
      setMileage(data);
      setKmInput('');
      Alert.alert('Enregistré', `Relevé ${type === 'start' ? 'de début' : 'de fin'} enregistré : ${km.toLocaleString('fr-FR')} km`);
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message ?? 'Impossible d\'enregistrer le relevé');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={s.title}>Kilométrage</Text>
        <Text style={s.sub}>{monthLabel(month)}</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={{ padding: 20 }}>
        {loading ? (
          <Text style={s.hint}>Chargement…</Text>
        ) : (
          <>
            {/* État actuel */}
            <View style={s.card}>
              <Text style={s.cardTitle}>État du mois en cours</Text>
              <View style={s.row}>
                <View style={s.kpiBox}>
                  <Text style={s.kpiLabel}>DÉBUT DE MOIS</Text>
                  <Text style={[s.kpiValue, !hasStart && s.kpiEmpty]}>
                    {hasStart ? `${mileage.km_start.toLocaleString('fr-FR')} km` : '—'}
                  </Text>
                  {mileage?.declared_start_at && (
                    <Text style={s.kpiDate}>
                      {new Date(mileage.declared_start_at).toLocaleDateString('fr-FR')}
                    </Text>
                  )}
                </View>
                <View style={s.kpiDivider} />
                <View style={s.kpiBox}>
                  <Text style={s.kpiLabel}>FIN DE MOIS</Text>
                  <Text style={[s.kpiValue, !hasEnd && s.kpiEmpty]}>
                    {hasEnd ? `${mileage.km_end.toLocaleString('fr-FR')} km` : '—'}
                  </Text>
                  {mileage?.declared_end_at && (
                    <Text style={s.kpiDate}>
                      {new Date(mileage.declared_end_at).toLocaleDateString('fr-FR')}
                    </Text>
                  )}
                </View>
              </View>
              {kmTotal !== null && (
                <View style={s.totalBox}>
                  <Text style={s.totalLabel}>TOTAL DU MOIS</Text>
                  <Text style={s.totalValue}>{kmTotal.toLocaleString('fr-FR')} km</Text>
                </View>
              )}
            </View>

            {/* Formulaire de déclaration */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Déclarer un relevé</Text>

              {/* Toggle start / end */}
              <View style={s.toggle}>
                {(['start', 'end'] as const).map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[s.toggleBtn, type === t && s.toggleActive]}
                    onPress={() => setType(t)}>
                    <Text style={[s.toggleText, type === t && s.toggleTextActive]}>
                      {t === 'start' ? 'Début de mois' : 'Fin de mois'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.hint}>
                {type === 'start'
                  ? `Relevé au 1er ${monthLabel(month).split(' ')[0].toLowerCase()} (compteur au départ)`
                  : `Relevé au dernier jour du mois (compteur à l'arrivée)`}
              </Text>

              <TextInput
                style={s.input}
                value={kmInput}
                onChangeText={setKmInput}
                placeholder="Ex : 123456"
                keyboardType="numeric"
                placeholderTextColor={INK4}
              />

              <TouchableOpacity
                style={[s.btn, saving && s.btnDisabled]}
                onPress={submit}
                disabled={saving}>
                <Text style={s.btnText}>
                  {saving ? 'Enregistrement…' : `Enregistrer le relevé ${type === 'start' ? 'de début' : 'de fin'}`}
                </Text>
              </TouchableOpacity>

              {((type === 'start' && hasStart) || (type === 'end' && hasEnd)) && (
                <Text style={s.overwriteHint}>
                  ⚠ Un relevé existe déjà. La nouvelle valeur remplacera l'ancienne.
                </Text>
              )}
            </View>

            {/* Info facturation */}
            <View style={s.infoBox}>
              <Text style={s.infoText}>
                📋 Le kilométrage déclaré est automatiquement intégré dans votre fiche de rétrocession mensuelle. Assurez-vous de déclarer les deux relevés avant la génération de la facture.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen:     { flex: 1, backgroundColor: '#fff' },
  header:     { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: INK5 },
  backBtn:    { marginBottom: 8 },
  backText:   { fontFamily: 'SpaceMono', fontSize: 12, color: BRAND },
  title:      { fontSize: 24, fontWeight: '800', color: INK },
  sub:        { fontFamily: 'SpaceMono', fontSize: 11, color: INK3, marginTop: 2 },
  scroll:     { flex: 1, backgroundColor: BG },
  card:       { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: INK5, padding: 18, marginBottom: 14 },
  cardTitle:  { fontFamily: 'SpaceMono', fontSize: 10, color: INK3, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 14 },
  row:        { flexDirection: 'row', alignItems: 'stretch' },
  kpiBox:     { flex: 1, alignItems: 'center', paddingVertical: 8 },
  kpiDivider: { width: 1, backgroundColor: INK5, marginHorizontal: 8 },
  kpiLabel:   { fontFamily: 'SpaceMono', fontSize: 9, color: INK4, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  kpiValue:   { fontFamily: 'SpaceMono', fontSize: 20, fontWeight: '700', color: INK },
  kpiEmpty:   { color: INK4 },
  kpiDate:    { fontFamily: 'SpaceMono', fontSize: 9, color: INK4, marginTop: 4 },
  totalBox:   { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: INK5, alignItems: 'center' },
  totalLabel: { fontFamily: 'SpaceMono', fontSize: 9, color: INK3, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  totalValue: { fontFamily: 'SpaceMono', fontSize: 28, fontWeight: '700', color: BRAND },
  toggle:     { flexDirection: 'row', borderRadius: 10, borderWidth: 1.5, borderColor: INK5, overflow: 'hidden', marginBottom: 14 },
  toggleBtn:  { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: '#fff' },
  toggleActive:    { backgroundColor: BRAND },
  toggleText:      { fontFamily: 'SpaceMono', fontSize: 11, color: INK3 },
  toggleTextActive:{ fontFamily: 'SpaceMono', fontSize: 11, color: '#fff', fontWeight: '700' },
  hint:       { fontSize: 12, color: INK3, marginBottom: 12, lineHeight: 17 },
  input:      { borderWidth: 1.5, borderColor: INK5, borderRadius: 10, padding: 14, fontFamily: 'SpaceMono', fontSize: 20, color: INK, marginBottom: 12 },
  btn:        { backgroundColor: BRAND, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  btnDisabled:{ opacity: 0.55 },
  btnText:    { fontFamily: 'SpaceMono', fontSize: 12, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  overwriteHint: { fontSize: 11, color: DANGER, marginTop: 10, textAlign: 'center' },
  infoBox:    { backgroundColor: 'rgba(242,100,25,.06)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(242,100,25,.2)', padding: 14 },
  infoText:   { fontSize: 12, color: INK3, lineHeight: 18 },
});
