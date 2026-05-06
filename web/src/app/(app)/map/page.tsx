'use client';
import { useState } from 'react';
import { Eyebrow, Btn, MapBg, TaxiPin } from '@/components/ui';

export default function MapPage() {
  const [replayMode, setReplayMode] = useState(false);

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{padding:'14px 24px',borderBottom:'1.5px solid var(--stroke)',display:'flex',
        alignItems:'center',justifyContent:'space-between',flexShrink:0,
        background:replayMode?'#fff':'var(--stroke)',color:replayMode?'var(--stroke)':'#fff'}}>
        <div>
          <div style={{fontFamily:'var(--font-mono)',fontSize:10,letterSpacing:'.16em',textTransform:'uppercase',opacity:.6}}>
            {replayMode?'Historique trajectoire · D1 MOHAMED Ali · Vendredi 8 mai':'Mode opérationnel · live'}
          </div>
          <div style={{fontSize:18,fontWeight:700,marginTop:2}}>
            {replayMode?'Replay GPS · L3':'Carte GPS temps réel'}
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn" onClick={() => setReplayMode(false)}
            style={{background:!replayMode?'rgba(255,255,255,0.18)':'#fff',
              color:!replayMode?'#fff':'var(--stroke)',borderColor:!replayMode?'rgba(255,255,255,0.3)':'var(--stroke)'}}>Live</button>
          <button className="btn" onClick={() => setReplayMode(true)}
            style={{background:replayMode?'var(--brand)':'rgba(255,255,255,0.06)',
              color:'#fff',borderColor:replayMode?'var(--brand)':'rgba(255,255,255,0.2)'}}>Historique</button>
          {replayMode && <button className="btn" style={{background:'transparent',color:'var(--stroke)',borderColor:'var(--stroke)'}}
            onClick={() => setReplayMode(false)}>Exporter GPX</button>}
        </div>
      </div>

      <div style={{flex:1,display:'flex',overflow:'hidden'}}>
        <div className="map-wrap">
          <MapBg dark={!replayMode}/>

          {!replayMode && (<>
            <TaxiPin left="41%" top="36%" kind="live" label="D1"/>
            <TaxiPin left="38%" top="59%" kind="live" label="D5"/>
            <TaxiPin left="40%" top="50%" kind="late" label="D7"/>
            <TaxiPin left="39%" top="65%" kind="live" label="D12"/>
            <TaxiPin left="35%" top="71%" kind="offline" label="C5"/>
            <TaxiPin left="62%" top="40%" kind="live" label="C14"/>

            <div style={{position:'absolute',left:16,top:16,display:'flex',gap:10,zIndex:3}}>
              {[['Live','4','var(--success)'],['Retard','1','var(--warn)'],['Hors-ligne','1','var(--stroke2)']].map(([l,v,c])=>(
                <div key={String(l)} style={{background:'rgba(0,0,0,.65)',color:'#fff',padding:'8px 14px',borderRadius:6,fontFamily:'var(--font-mono)'}}>
                  <div style={{fontSize:9,letterSpacing:'.14em',textTransform:'uppercase',color:'rgba(255,255,255,.55)'}}>{l}</div>
                  <div style={{fontSize:22,fontWeight:700,color:String(c)}}>{v}</div>
                </div>
              ))}
            </div>

            <div className="card" style={{position:'absolute',left:16,bottom:16,padding:'10px 14px',
              fontSize:11,background:'rgba(255,255,255,.96)',zIndex:3}}>
              <Eyebrow>Légende</Eyebrow>
              <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:8}}>
                {[['#2e8b57','En cours'],['#e8a523','Retard'],['#817A7C','Hors-ligne']].map(([c,l])=>(
                  <span key={String(l)} style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{width:10,height:10,borderRadius:'50%',background:String(c),display:'inline-block'}}/>
                    {l}
                  </span>
                ))}
              </div>
            </div>

            <div style={{position:'absolute',right:16,top:16,display:'flex',flexDirection:'column',gap:4,zIndex:3}}>
              {['+','−','⊕'].map(s => <button key={s} className="btn" style={{width:36,height:36,background:'rgba(255,255,255,.95)'}}>{s}</button>)}
            </div>
          </>)}

          {replayMode && (<>
            <svg viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice"
              style={{position:'absolute',inset:0,width:'100%',height:'100%',zIndex:2}}>
              <path d="M 380 415 L 395 380 L 412 340 Q 420 305 415 270 L 415 250"
                stroke="var(--brand)" strokeWidth="4" fill="none"/>
              <circle cx="380" cy="415" r="8" fill="var(--success)" stroke="#fff" strokeWidth="2.5"/>
              <circle cx="415" cy="250" r="5" fill="#fff" stroke="var(--brand)" strokeWidth="2"/>
              <circle cx="395" cy="380" r="7" fill="var(--danger)" stroke="#fff" strokeWidth="2.5"/>
            </svg>

            <div className="card" style={{position:'absolute',left:16,right:16,bottom:16,padding:14,
              background:'rgba(255,255,255,.97)',zIndex:3}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <Eyebrow>D1 · MOHAMED Ali · Lecture 11:42</Eyebrow>
                <div style={{display:'flex',gap:4}}>
                  {['◀◀','▶','▶▶','×2'].map((s,i) => (
                    <button key={i} className={`btn${i===1?' btn-accent':''}`} style={{width:i===1?40:36,height:32,fontSize:12}}>{s}</button>
                  ))}
                </div>
              </div>
              <div style={{height:8,background:'var(--stroke4)',borderRadius:999,position:'relative'}}>
                <div style={{width:'52%',height:'100%',background:'var(--brand)',borderRadius:999}}/>
                <div style={{position:'absolute',left:'52%',top:'50%',transform:'translate(-50%,-50%)',
                  width:16,height:16,borderRadius:'50%',background:'#fff',border:'2.5px solid var(--brand)'}}/>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontFamily:'var(--font-mono)',
                fontSize:10,color:'var(--stroke2)',marginTop:4}}>
                {['06:00','10:00','14:00','18:00','22:00'].map(t=><span key={t}>{t}</span>)}
              </div>
            </div>

            <div className="card" style={{position:'absolute',right:16,top:16,bottom:80,width:260,
              overflow:'auto',background:'rgba(255,255,255,.97)',padding:14,zIndex:3}}>
              <Eyebrow>Évènements · 12</Eyebrow>
              {[['5:00','Départ DOUJANI','done'],['5:30','Arrivée Passot Barge','done'],
                ['5:34','Voie bloquée (incident)','incident'],['6:00','Reprise depuis DOUJANI','done'],
                ['8:30','Position · PEM','live']].map(([t,n,k],i) => (
                <div key={i} style={{display:'flex',gap:10,padding:'10px 0',borderBottom:'1px dashed var(--stroke3)'}}>
                  <span style={{fontFamily:'var(--font-mono)',fontSize:11,fontWeight:700,color:'var(--stroke2)',width:38}}>{t}</span>
                  <span style={{flex:1,fontSize:12}}>{n}</span>
                  <span style={{width:8,height:8,borderRadius:'50%',marginTop:6,flexShrink:0,
                    background:k==='incident'?'var(--danger)':k==='live'?'var(--brand)':'var(--success)'}}/>
                </div>
              ))}
            </div>
          </>)}
        </div>
      </div>
    </div>
  );
}
