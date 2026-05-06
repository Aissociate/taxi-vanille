'use client';
import { useState } from 'react';
import { STATS } from '@/lib/data';
import { PageBar, Eyebrow, KpiCard } from '@/components/ui';

const clients = [
  {nom:'CADEMA — Ligne 3',sub:'Doujani ↔ Passot La Barge · 14 chauffeurs',n:618},
  {nom:'CADEMA — Ligne 4',sub:'Vahibe ↔ PEM Passamainty · 14 chauffeurs',n:642},
  {nom:'CHM Petite-Terre',sub:'CHM ↔ La Barge · 13 arrêts · 8 chauffeurs',n:284},
];

export default function RapportsPage() {
  const [clientIdx, setClientIdx] = useState(0);
  const c = clients[clientIdx];

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <PageBar title="Rapports clients institutionnels" sub="Direction · Rapports"
        actions={[{l:'Rapport sur mesure →'},{l:'Exporter PDF'},{l:'Excel',accent:true}]}/>
      <div className="scroll" style={{padding:24,display:'grid',gridTemplateColumns:'280px 1fr',gap:20,alignContent:'start'}}>
        <div className="card" style={{background:'#fff',padding:12,alignSelf:'start'}}>
          <Eyebrow>Clients</Eyebrow>
          {clients.map((cl,i) => (
            <div key={i} onClick={() => setClientIdx(i)} style={{
              padding:'12px 8px',borderBottom:'1px dashed var(--stroke3)',cursor:'pointer',
              background:i===clientIdx?'var(--accent-soft)':'transparent',
              borderLeft:i===clientIdx?'3px solid var(--brand)':'3px solid transparent',
            }}>
              <div style={{fontWeight:i===clientIdx?700:600,fontSize:13}}>{cl.nom}</div>
              <div style={{fontSize:10,color:'var(--stroke2)'}}>{cl.sub}</div>
              <div style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--stroke2)',marginTop:4}}>
                {cl.n} trajets · mars 2026
              </div>
            </div>
          ))}
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div className="card" style={{background:'#fff',padding:20}}>
            <Eyebrow>{c.nom} · Mars 2026</Eyebrow>
            <div style={{fontSize:20,fontWeight:700,marginTop:6}}>
              {STATS.trajets.ef} trajets · {STATS.voy.total.toLocaleString('fr-FR')} voyageurs · {STATS.trajets.taux} % réalisation
            </div>
          </div>

          <div style={{display:'grid',gap:12,gridTemplateColumns:'repeat(4,1fr)'}}>
            <KpiCard label="Trajets théoriques" value={STATS.trajets.th} delta={`• ${STATS.trajets.non} non eff.`}/>
            <KpiCard label="Ponctualité" value={`${STATS.retards.ponct} %`} delta={`${STATS.retards.plus10} retards >10 mn`}/>
            <KpiCard label="Voy. moy / trajet" value={STATS.voy.parTj} delta="objectif 12,0"/>
            <KpiCard label="Voy. moy / jour" value={STATS.voy.moy} delta="31 j"/>
          </div>

          <div className="card" style={{padding:20,background:'#fff'}}>
            <Eyebrow>Détail par chauffeur</Eyebrow>
            <table style={{marginTop:12}}>
              <thead>
                <tr>
                  <th>Code</th><th>Chauffeur</th>
                  <th style={{textAlign:'center'}}>Trajets</th>
                  <th style={{textAlign:'center'}}>Retards</th>
                  <th style={{textAlign:'right'}}>Voyageurs</th>
                </tr>
              </thead>
              <tbody>
                {STATS.parCh.map(r => (
                  <tr key={r.code}>
                    <td style={{fontFamily:'var(--font-mono)',fontWeight:700}}>{r.code}</td>
                    <td>{r.nom}</td>
                    <td style={{fontFamily:'var(--font-mono)',fontWeight:700,textAlign:'center'}}>{r.trajets}</td>
                    <td style={{fontFamily:'var(--font-mono)',textAlign:'center',color:r.retards>3?'var(--warn)':'inherit'}}>{r.retards}</td>
                    <td style={{fontFamily:'var(--font-mono)',fontWeight:700,textAlign:'right'}}>{r.vy.toLocaleString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
