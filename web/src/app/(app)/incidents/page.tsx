'use client';
import { useState } from 'react';
import { AUDIT, kindColor } from '@/lib/data';
import { PageBar, Eyebrow, Pill, Btn } from '@/components/ui';

export default function AuditPage() {
  const [filter, setFilter] = useState('Tous (248)');
  const filters = ['Tous (248)','Remplacements (42)','Ajouts (88)','Annulations (24)'];

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <PageBar title="Audit log · planning" sub="Direction · 248 modifications · 30 derniers jours"
        actions={[{l:'Exporter CSV'},{l:'Restaurer version'}]}/>

      <div style={{padding:'10px 24px',borderBottom:'1px dashed var(--stroke3)',display:'flex',gap:8,
        alignItems:'center',background:'var(--paper)',flexShrink:0}}>
        <Eyebrow>Filtrer</Eyebrow>
        {filters.map(f => (
          <span key={f} onClick={() => setFilter(f)} style={{cursor:'pointer'}}>
            <Pill variant={filter===f?'active-dark':f.includes('Annulations')?'incident':''}>{f}</Pill>
          </span>
        ))}
        <div style={{flex:1}}/>
        {['7 j','30 j','Personnalisé'].map(t => (
          <span key={t} onClick={() => {}} style={{cursor:'pointer'}}>
            <Pill variant={t==='30 j'?'active-dark':''}>{t}</Pill>
          </span>
        ))}
      </div>

      <div style={{flex:1,display:'flex',overflow:'hidden'}}>
        <div className="scroll" style={{flex:1,padding:24}}>
          {AUDIT.map((g, gi) => (
            <div key={gi} style={{marginBottom:28}}>
              <Eyebrow>{g.day}</Eyebrow>
              <div style={{marginTop:12,position:'relative',paddingLeft:20}}>
                <div style={{position:'absolute',left:5,top:8,bottom:8,width:1,background:'var(--stroke3)'}}/>
                {g.items.map((it, i) => (
                  <div key={i} style={{position:'relative',paddingBottom:14}}>
                    <div className="tl-dot" style={{background:kindColor[it.kind]||'var(--stroke)'}}/>
                    <div className="card" style={{background:'#fff',padding:12}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:12,flexWrap:'wrap'}}>
                        <div style={{display:'flex',alignItems:'baseline',gap:8}}>
                          <span style={{fontFamily:'var(--font-mono)',fontWeight:700,fontSize:12}}>{it.t}</span>
                          <span style={{fontSize:13,fontWeight:700}}>{it.action}</span>
                          <span style={{fontSize:12,color:'var(--stroke2)'}}>· {it.target}</span>
                        </div>
                        <span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--stroke2)'}}>{it.who}</span>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:6,flexWrap:'wrap',gap:6}}>
                        {it.reason && <div style={{fontSize:11,color:'var(--stroke2)'}}>
                          <span style={{fontFamily:'var(--font-mono)',textTransform:'uppercase',letterSpacing:'.1em',fontSize:9,marginRight:6}}>Raison</span>
                          {it.reason}
                        </div>}
                        {it.notify && <Pill variant="live" dot>{it.notify}</Pill>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{width:300,borderLeft:'1.5px solid var(--stroke)',overflow:'auto',
          background:'#fff',padding:18,flexShrink:0}}>
          <Eyebrow>Détail · 11:42 — Remplacement</Eyebrow>
          <div style={{fontSize:14,fontWeight:700,marginTop:6}}>D1 → D5 · 14:40 DOUJANI</div>
          <div style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--stroke2)',marginTop:2}}>par M. Aubin · IP 41.x.x.12</div>
          <div className="card-soft" style={{padding:10,marginTop:16}}>
            <Eyebrow>Avant</Eyebrow>
            <div style={{fontSize:12,marginTop:4}}><b>D1</b> · MOHAMED Ali · 14:40-18:10</div>
          </div>
          <div style={{textAlign:'center',fontFamily:'var(--font-hand)',fontSize:20,color:'var(--brand)',margin:'4px 0'}}>↓</div>
          <div className="card" style={{padding:10,background:'var(--accent-soft)',borderColor:'var(--brand)'}}>
            <Eyebrow>Après</Eyebrow>
            <div style={{fontSize:12,marginTop:4}}><b>D5</b> · AMINA Selemani · 14:40-18:10</div>
          </div>
          <div style={{marginTop:18}}>
            <Eyebrow>Notifications envoyées</Eyebrow>
            <ul style={{fontSize:11,color:'var(--stroke2)',paddingLeft:16,lineHeight:1.8,marginTop:6}}>
              <li>FCM push → D5 · livré 11:42:04</li>
              <li>FCM push → D1 · livré 11:42:04</li>
              <li>Email CADEMA · envoyé 11:42:08</li>
            </ul>
          </div>
          <Btn style={{width:'100%',marginTop:18,height:38}}>↶ Annuler ce changement</Btn>
          <div style={{fontSize:10,color:'var(--stroke2)',textAlign:'center',marginTop:6}}>↳ jusqu'à 24 h après l'action</div>
        </div>
      </div>
    </div>
  );
}
