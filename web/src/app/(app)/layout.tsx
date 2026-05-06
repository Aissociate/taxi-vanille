'use client';
import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [dismissed, setDismissed] = useState(false);

  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden'}}>
      <Sidebar />
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        {!dismissed && (
          <div className="alert-banner" style={{flexShrink:0}}>
            <div className="alert-stripe" style={{fontSize:18,letterSpacing:0}}>I</div>
            <div style={{flex:1,padding:'0 16px',display:'flex',alignItems:'center',gap:10,overflow:'hidden'}}>
              <span style={{width:10,height:10,borderRadius:'50%',background:'var(--danger)',flexShrink:0,animation:'pulse-ring 1.4s infinite'}}/>
              <span style={{fontFamily:'var(--font-mono)',fontSize:10,fontWeight:800,padding:'2px 8px',
                border:'1.5px solid var(--danger)',borderRadius:3,color:'var(--danger)',textTransform:'uppercase',
                letterSpacing:'.1em',flexShrink:0,animation:'blink 1.6s infinite'}}>Incident</span>
              <span style={{fontFamily:'var(--font-mono)',fontSize:13,fontWeight:800,flexShrink:0}}>D7 · COMBO Said</span>
              <span style={{fontSize:11,color:'var(--stroke2)',flexShrink:0}}>il y a 14 s</span>
              <span style={{fontSize:12,color:'var(--stroke)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                Vocal incident reçu · M'Tsapéré · panne moteur — demande remplaçant 12:00
              </span>
            </div>
            <div style={{display:'flex',gap:8,padding:'0 16px',alignItems:'center',borderLeft:'1.5px solid var(--stroke4)',flexShrink:0}}>
              <button className="btn btn-sm">▶ Écouter</button>
              <button className="btn btn-sm btn-accent" style={{gap:5}}>⇄ Remplacer</button>
              <button onClick={() => setDismissed(true)} style={{width:28,height:28,borderRadius:'50%',
                border:'1.5px solid var(--stroke3)',display:'flex',alignItems:'center',justifyContent:'center',
                cursor:'pointer',background:'#fff',fontSize:16,fontWeight:400,color:'var(--stroke2)',flexShrink:0}}>×</button>
            </div>
          </div>
        )}
        <main style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          {children}
        </main>
      </div>
    </div>
  );
}
