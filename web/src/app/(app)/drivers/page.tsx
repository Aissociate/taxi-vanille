'use client';
import { useState } from 'react';
import { L3, L4, CHM, DOCS, RIBS, TODAY_DOC, DAYS, LINE_DIR, Driver } from '@/lib/data';
import { PageBar, Eyebrow, Btn, KpiCard, Sparkline } from '@/components/ui';

type DriverExt = Driver & { _l: string; _color: string };

const allDrivers: DriverExt[] = [
  ...L3.map(d => ({...d, _l:'L3', _color:'var(--brand)'})),
  ...L4.map(d => ({...d, _l:'L4', _color:'var(--info)'})),
  ...CHM.map(d => ({...d, _l:'CHM', _color:'var(--success)'})),
];

const getDocStatus = (doc: any) => {
  if (!doc) return {color:'var(--stroke2)',label:'Manquant',stl:'missing'};
  const days = (new Date(doc.e).getTime() - TODAY_DOC.getTime()) / 86400000;
  if (days < 0) return {color:'var(--danger)',label:'Expiré',stl:'expired'};
  if (days < 60) return {color:'var(--warn)',label:'À renouveler',stl:'soon'};
  return {color:'var(--success)',label:'Valide',stl:'ok'};
};
const fmt = (e: string|undefined) => e ? e.split('-').reverse().join('/') : '—';

export default function DriversPage() {
  const [sel, setSel] = useState(0);
  const [period, setPeriod] = useState('semaine');
  const [search, setSearch] = useState('');

  const dr = allDrivers[sel];
  const lineLabel = dr._l==='L3'?'L3 · Doujani ↔ Passot Barge':dr._l==='L4'?'L4 · Vahibe ↔ Passamainty':'CHM · La Barge ↔ CHM';
  const docs = DOCS[dr.code] || {};
  const rib = RIBS[dr.code];

  const filtered = allDrivers.filter(d =>
    search==='' || d.nom.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase())
  );

  const kpiData: Record<string,any> = {
    jour:    {courses:3,  passagers:12, ca:'285 €',    inc:0,  label:"Aujourd'hui"},
    semaine: {courses:18, passagers:58, ca:'1 180 €',  inc:1,  label:'Semaine en cours (S19)'},
    mois:    {courses:72, passagers:234,ca:'4 740 €',  inc:2,  label:'Mai 2026'},
    annee:   {courses:856,passagers:2940,ca:'56 700 €',inc:9,  label:'Année 2026'},
    total:   {courses:2450,passagers:8420,ca:'164 000 €',inc:24,label:'Depuis le début'},
  };
  const kpi = kpiData[period];

  return (
    <div style={{flex:1,display:'flex',overflow:'hidden'}}>
      {/* List */}
      <div style={{width:280,borderRight:'1.5px solid var(--stroke)',display:'flex',flexDirection:'column',flexShrink:0}}>
        <div style={{padding:'14px 16px',borderBottom:'1.5px solid var(--stroke)',background:'#fff'}}>
          <div style={{fontFamily:'var(--font-mono)',fontSize:10,letterSpacing:'.16em',textTransform:'uppercase',color:'var(--stroke2)'}}>
            Chauffeurs · {allDrivers.length}
          </div>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Rechercher…"
            style={{width:'100%',border:'1.25px solid var(--stroke3)',borderRadius:4,padding:'6px 8px',
              fontSize:12,marginTop:8,fontFamily:'var(--font-sans)',outline:'none'}}/>
        </div>
        <div className="scroll">
          {filtered.map((d,i) => {
            const realIdx = allDrivers.indexOf(d);
            return (
              <div key={d.code} onClick={() => setSel(realIdx)} style={{
                padding:'10px 16px',borderBottom:'1px dashed var(--stroke3)',cursor:'pointer',
                background:realIdx===sel?'var(--accent-soft)':'transparent',
                borderLeft:realIdx===sel?`4px solid ${d._color}`:'4px solid transparent',
              }}>
                <div style={{fontWeight:600,fontSize:12,display:'flex',alignItems:'center',gap:8}}>
                  <span style={{width:7,height:7,borderRadius:'50%',background:d._color,flexShrink:0}}/>
                  {d.code} · {d.nom}
                </div>
                <div style={{fontSize:10,color:'var(--stroke2)',marginTop:2}}>
                  {d._l==='L3'?'Ligne 3':d._l==='L4'?'Ligne 4':'CHM'} · {d.vehicule||'—'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail */}
      <div className="scroll" style={{flex:1,background:'var(--paper)'}}>
        <div style={{padding:'20px 24px',borderBottom:'1.5px solid var(--stroke)',background:'#fff',display:'flex',alignItems:'center',gap:18}}>
          <div style={{width:64,height:64,borderRadius:'50%',background:'var(--ink-100)',border:`2px solid ${dr._color}`,
            display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-mono)',
            fontSize:16,fontWeight:700,flexShrink:0,color:dr._color}}>{dr.code}</div>
          <div style={{flex:1}}>
            <Eyebrow>Chauffeur {dr.code} · {lineLabel}</Eyebrow>
            <div style={{fontWeight:700,fontSize:22,marginTop:2}}>{dr.nom}</div>
            <div style={{fontSize:12,color:'var(--stroke2)'}}>{dr.tel||'—'} · {dr.vehicule||'—'}</div>
          </div>
          <Btn>Modifier</Btn>
          <Btn accent>Voir factures</Btn>
        </div>

        <div style={{padding:'14px 24px 0',display:'flex',alignItems:'center',gap:6,
          borderBottom:'1.5px solid var(--stroke3)',background:'#fff'}}>
          <span style={{fontFamily:'var(--font-mono)',fontSize:9,letterSpacing:'.14em',textTransform:'uppercase',
            color:'var(--stroke2)',marginRight:6}}>Période</span>
          {[['jour',"Aujourd'hui"],['semaine','Semaine'],['mois','Mois'],['annee','Année'],['total','Total']].map(([k,l]) => (
            <button key={k} onClick={() => setPeriod(k)} style={{
              padding:'6px 14px',borderRadius:999,fontSize:12,fontWeight:600,cursor:'pointer',
              fontFamily:'var(--font-sans)',marginBottom:10,transition:'all .12s',
              border:`1.5px solid ${period===k?dr._color:'var(--stroke3)'}`,
              background:period===k?dr._color:'transparent',
              color:period===k?'#fff':'var(--stroke2)',}}>{l}</button>
          ))}
        </div>

        <div style={{padding:'16px 24px',display:'grid',gap:12,gridTemplateColumns:'repeat(4,1fr)'}}>
          <KpiCard label="Courses" value={kpi.courses} delta={kpi.label}/>
          <KpiCard label="Passagers" value={kpi.passagers} delta={`moy ${(kpi.passagers/Math.max(kpi.courses,1)).toFixed(1)}/course`}/>
          <KpiCard label="CA généré" value={kpi.ca} delta="↑ 6 %"/>
          <KpiCard label="Incidents" value={kpi.inc} delta={kpi.inc===0?'Aucun':`sur ${kpi.label.toLowerCase()}`}/>
        </div>

        <div style={{padding:'0 24px 24px',display:'grid',gap:16,gridTemplateColumns:'2fr 1fr'}}>
          <div className="card" style={{padding:18}}>
            <Eyebrow>Activité · {period==='semaine'?'12 dernières semaines':period==='mois'?'12 derniers mois':'historique'}</Eyebrow>
            <Sparkline/>
          </div>
          <div className="card" style={{padding:18}}>
            <Eyebrow>Documents & RIB</Eyebrow>
            <div style={{marginTop:10,display:'flex',flexDirection:'column',gap:0,fontSize:12}}>
              {[
                {icon:'🪪',label:'Permis B',doc:docs.p},
                {icon:'📋',label:'Carte pro',doc:docs.c},
                {icon:'🏥',label:'Visite médicale',doc:docs.m},
                {icon:'🛡',label:'Assurance véhicule',doc:docs.a},
              ].map(({icon,label,doc}) => {
                const {color,stl} = getDocStatus(doc);
                return (
                  <div key={label} style={{display:'flex',alignItems:'center',gap:7,padding:'7px 0',borderBottom:'1px dashed var(--stroke3)'}}>
                    <span style={{fontSize:13,width:18,textAlign:'center',flexShrink:0}}>{icon}</span>
                    <span style={{flex:1,fontSize:11}}>{label}</span>
                    <span style={{fontFamily:'var(--font-mono)',fontSize:10,fontWeight:700,color}}>
                      {stl==='ok'?`✓ ${fmt(doc?.e)}`:stl==='soon'?`⚠ ${fmt(doc?.e)}`:stl==='expired'?`✕ ${fmt(doc?.e)}`:'—'}
                    </span>
                  </div>
                );
              })}
              <div style={{display:'flex',alignItems:'center',gap:7,padding:'7px 0'}}>
                <span style={{fontSize:13,width:18,textAlign:'center',flexShrink:0}}>🏦</span>
                <span style={{flex:1,fontSize:11}}>RIB</span>
                {rib
                  ? <span style={{fontFamily:'var(--font-mono)',fontSize:10,fontWeight:700,color:'var(--success)'}}>✓ {rib.banque}</span>
                  : <span style={{fontFamily:'var(--font-mono)',fontSize:10,fontWeight:700,color:'var(--danger)'}}>✕ Manquant</span>
                }
              </div>
            </div>
          </div>
        </div>

        <div style={{padding:'0 24px 24px'}}>
          <div className="card" style={{padding:18}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
              <Eyebrow>Programme de ligne · Semaine 19 · 4–10 mai 2026</Eyebrow>
              <span style={{fontFamily:'var(--font-mono)',fontSize:10,fontWeight:700,color:dr._color,
                padding:'2px 8px',border:`1px solid ${dr._color}`,borderRadius:3}}>
                {dr._l} · {LINE_DIR[dr._l]?.route}
              </span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'68px 1fr 1fr 90px',gap:6,paddingBottom:6,
              borderBottom:'1.5px solid var(--stroke3)',fontSize:9,fontFamily:'var(--font-mono)',
              letterSpacing:'.12em',textTransform:'uppercase',color:'var(--stroke2)'}}>
              <span>Jour</span><span>Matin AM</span><span>Soir PM</span><span style={{textAlign:'right'}}>Note</span>
            </div>
            {DAYS.map((day,i) => {
              const isSun = i===6;
              let amVal = dr.am||null, pmVal = dr.pm||null, note = '';
              if (isSun) {
                if (!dr.dimJF) { amVal=null; pmVal=null; note='Repos'; }
                else note = `Dim ${dr.dimJF}`;
              }
              if (dr.astr && !isSun) note = 'Astr.';
              const isRest = !amVal&&!pmVal;
              const dir = LINE_DIR[dr._l];
              return (
                <div key={day} style={{display:'grid',gridTemplateColumns:'68px 1fr 1fr 90px',gap:6,
                  padding:'7px 0',borderBottom:'1px dashed var(--stroke3)',alignItems:'center',
                  background:isRest?'var(--paper)':'transparent'}}>
                  <span style={{fontFamily:'var(--font-mono)',fontSize:11,fontWeight:700,
                    color:isRest?'var(--stroke2)':'var(--stroke)'}}>{day}</span>
                  <span style={{fontSize:11}}>{amVal ? <><span style={{fontFamily:'var(--font-mono)',fontWeight:700}}>{amVal}</span> <span style={{fontSize:10,color:dr._color}}>{dir?.am}</span></> : <span style={{color:'var(--stroke2)',fontStyle:'italic'}}>Repos</span>}</span>
                  <span style={{fontSize:11}}>{pmVal ? <><span style={{fontFamily:'var(--font-mono)',fontWeight:700}}>{pmVal}</span> <span style={{fontSize:10,color:dr._color}}>{dir?.pm}</span></> : <span style={{color:'var(--stroke2)',fontStyle:'italic'}}>Repos</span>}</span>
                  <span style={{textAlign:'right',fontSize:10,fontFamily:'var(--font-mono)',
                    color:note==='Astr.'?'var(--warn)':isRest?'var(--stroke2)':'var(--stroke3)',
                    fontWeight:note==='Astr.'?700:400}}>{note}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
