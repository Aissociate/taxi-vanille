import { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/src/lib/api';
import { saveSchedule, getSchedule, bufferGps } from '@/src/lib/db';
import { syncAll } from '@/src/lib/sync';

const BRAND = '#F26419';
const INK = '#1A1718';
const INK2 = '#393536';
const INK3 = '#6B6566';
const INK4 = '#B9B3B4';
const INK5 = '#E8E5E6';
const BG = '#FAFAF9';
const SUCCESS = '#2E8B57';
const DANGER = '#D13A2A';
const WARN = '#E8A523';

const MOCK_TRIPS = [
  { id:'AM1', time:'05:00', label:'AM · Aller',    direction:'Doujani → Passot La Barge', meta:'7 arrêts · L3', status:'done',    pill:'TERMINÉ' },
  { id:'AM2', time:'06:30', label:'AM · Retour',   direction:'Passot La Barge → Doujani', meta:'7 arrêts · L3', status:'done',    pill:'TERMINÉ' },
  { id:'AM3', time:'08:10', label:'AM · Fin serv', direction:'Retour dépôt Doujani',      meta:'Fin service AM',status:'done',    pill:'TERMINÉ' },
  { id:'PM1', time:'14:40', label:'PM · Aller',    direction:'Doujani → Passot La Barge', meta:'7 arrêts · L3', status:'next',    pill:'PROCHAIN' },
  { id:'PM2', time:'16:20', label:'PM · Retour',   direction:'Passot La Barge → Doujani', meta:'7 arrêts · L3', status:'planned', pill:'PLANIFIÉ' },
  { id:'PM3', time:'18:10', label:'PM · Fin serv', direction:'Retour dépôt Doujani',      meta:'Fin service PM',status:'planned', pill:'PLANIFIÉ' },
];

function statusColor(status: string) {
  if (status === 'done') return SUCCESS;
  if (status === 'next' || status === 'live') return BRAND;
  return INK4;
}

export default function ScheduleScreen() {
  const [trips, setTrips] = useState<any[]>(MOCK_TRIPS);
  const [offline, setOffline] = useState(false);
  const gpsInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const { isLoading, refetch } = useQuery({
    queryKey: ['schedule'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/drivers/me/schedule/today');
        saveSchedule(data);
        setTrips(data);
        setOffline(false);
        return data;
      } catch {
        const cached = getSchedule();
        if (cached.length) setTrips(cached);
        setOffline(true);
        return cached;
      }
    },
  });

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      gpsInterval.current = setInterval(async () => {
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          bufferGps({ lat: loc.coords.latitude, lng: loc.coords.longitude, accuracy: loc.coords.accuracy ?? 0 });
          await api.post('/gps/ping', { lat: loc.coords.latitude, lng: loc.coords.longitude });
        } catch {}
      }, 60000);
    })();
    return () => { if (gpsInterval.current) clearInterval(gpsInterval.current); };
  }, []);

  return (
    <View style={s.container}>
      {offline && (
        <View style={s.offlineBanner}>
          <Text style={s.offlineText}>⚡ MODE HORS-LIGNE · données locales</Text>
        </View>
      )}

      <View style={s.header}>
        <Text style={s.eyebrow}>D1 · MOHAMED Ali · GR-558-LA</Text>
        <Text style={s.title}>Planning du jour</Text>
        <Text style={s.badge}>L3 · Ven 8 mai 2026</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => { syncAll(); refetch(); }}/>}>
        {trips.map(trip => {
          const color = statusColor(trip.status || 'planned');
          const isDone = trip.status === 'done';
          const isNext = trip.status === 'next' || trip.status === 'live';
          return (
            <TouchableOpacity key={trip.id || trip.trip_id}
              style={[s.card, isNext && s.cardNext, isDone && s.cardDone]}
              onPress={() => {
                if (!isDone) router.push({ pathname:'/(app)/trip', params: { tripId: trip.id || trip.trip_id } });
              }}
              activeOpacity={isDone ? 1 : 0.8}>
              <View style={[s.sideBar, { backgroundColor: color }]}/>
              <View style={s.cardBody}>
                <Text style={[s.time, isDone && s.timeDone, isNext && s.timeActive]}>
                  {trip.time || trip.scheduled_start?.slice(11,16) || '--:--'}
                </Text>
                <Text style={[s.label2, isDone && s.labelDone]}>
                  {trip.label || trip.direction || trip.route_code || 'Trajet'}
                </Text>
                <Text style={[s.meta, isDone && s.metaDone]}>
                  {trip.meta || trip.stop_count ? `${trip.stop_count} arrêts · L3` : 'L3'}
                </Text>
                <View style={s.statusPill}>
                  <View style={[s.dot, { backgroundColor: color }, isNext && s.dotPulse]}/>
                  <Text style={[s.pillText, { color }]}>
                    {trip.pill || (trip.status==='done'?'TERMINÉ':trip.status==='in_progress'?'EN COURS':'PLANIFIÉ')}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
        <View style={{height:80}}/>
      </ScrollView>

      <TouchableOpacity style={s.incidentFab} onPress={() => router.push('/(app)/incident')}>
        <Text style={s.incidentFabText}>⚠  SIGNALER UN INCIDENT</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#fff' },
  offlineBanner: { backgroundColor:WARN, paddingVertical:12, paddingHorizontal:20, alignItems:'center', flexDirection:'row', justifyContent:'center', gap:8 },
  offlineText: { fontFamily:'SpaceMono', fontSize:11, fontWeight:'700', color:'#fff', letterSpacing:1.5, textTransform:'uppercase' },
  header: { paddingHorizontal:20, paddingTop:18, paddingBottom:14, backgroundColor:'#fff' },
  eyebrow: { fontFamily:'SpaceMono', fontSize:10, letterSpacing:2.5, textTransform:'uppercase', color:INK3, marginBottom:4 },
  title: { fontSize:26, fontWeight:'700', color:INK },
  badge: { fontFamily:'SpaceMono', fontSize:12, color:INK3, marginTop:4 },
  scroll: { flex:1, backgroundColor:BG },
  scrollContent: { paddingHorizontal:16, paddingTop:12 },
  card: { backgroundColor:'#fff', borderRadius:14, borderWidth:1.5, borderColor:INK5, marginBottom:12, flexDirection:'row', overflow:'hidden', position:'relative' },
  cardNext: { borderColor:BRAND, shadowColor:BRAND, shadowOffset:{width:0,height:2}, shadowOpacity:0.15, shadowRadius:8, elevation:4 },
  cardDone: { opacity:0.72 },
  sideBar: { width:5 },
  cardBody: { flex:1, padding:16, paddingLeft:14 },
  time: { fontFamily:'SpaceMono', fontSize:22, fontWeight:'700', color:INK },
  timeDone: { color:INK3 },
  timeActive: { color:BRAND },
  label2: { fontSize:15, fontWeight:'600', color:INK, marginTop:2 },
  labelDone: { color:INK3 },
  meta: { fontSize:12, color:INK3, marginTop:2 },
  metaDone: { color:INK4 },
  statusPill: { position:'absolute', top:16, right:14, flexDirection:'row', alignItems:'center', gap:5 },
  dot: { width:7, height:7, borderRadius:3.5 },
  dotPulse: { },
  pillText: { fontFamily:'SpaceMono', fontSize:10, letterSpacing:1.2, textTransform:'uppercase', fontWeight:'700' },
  incidentFab: { backgroundColor:DANGER, paddingVertical:20, paddingHorizontal:24, alignItems:'center', justifyContent:'center', flexDirection:'row', gap:10 },
  incidentFabText: { fontFamily:'SpaceMono', fontSize:13, fontWeight:'700', color:'#fff', letterSpacing:2, textTransform:'uppercase' },
});
