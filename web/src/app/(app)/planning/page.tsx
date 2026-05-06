'use client';
import { useState } from 'react';
import { L3, L4, CHM, HOURS, LINE_DIR, GANTT_START, GANTT_SPAN, Driver } from '@/lib/data';
import { PageBar, Eyebrow, Pill, Btn, AlertBanner } from '@/components/ui';

const toPos = (h: number) => ((h - GANTT_START) / GANTT_SPAN) * 100;
const parseTime = (s: string) => {
  if (!s) return null;
  const parts = s.split(':');
  return parseInt(parts[0]) + parseInt(parts[1]||'0') / 60;
};

type DriverExt = Driver & { _ligne: string; _color: string };

function GanttRow({ dr, lineLabel, lineColor, onReplace, incident }: {
  dr: DriverExt; lineLabel: string; lineColor: string;
  onReplace: (d: DriverExt) => void; incident?: boolean;
}) {
  const amParts = (dr.am||'').split('-');
  const pmParts = (dr.pm||'').split('-');
  const amStart = parseTime(amParts[0]||''), amEnd = parseTime(amParts[1]||'');
  const pmStart = parseTime(pmParts[0]||''), pmEnd = parseTime(pmParts[1]||'');
  const astrSegs = dr.astr ? dr.astr.split('·').map(s => s.trim()) : [];
  const dir = LINE_DIR[lineLabel] || { am:'AM', pm:'PM', route:lineLabel };
  const isFullDay = amStart != null && amEnd != null && pmStart == null;

  return (
    <div style={{display:'grid',gridTemplateColumns:'230px 1fr',borderBottom:'1px solid var(--stroke3)',minHeight:52}}>
      <div style={{padding:'7px 10px',borderRight:'1.5px solid var(--stroke)',display:'flex',
        flexDirection:'column',justifyContent:'center',gap:2,
        background:incident?'rgba(209,58,42,0.06)':'transparent'}}>
        <span style={{display:'flex',alignItems:'center',gap:5}}>
          <span style={{width:7,height:7,borderRadius:'50%',background:lineColor,flexShrink:0}}/>
          <span style={{fontWeight:700,fontSize:12,color:'var(--stroke)'}}>{dr.nom}</span>
          {incident && <span style={{fontSize:10,color:'var(--danger)',fontWeight:700}}>⚠</span>}
        </span>
        <span style={{display:'flex',alignItems:'center',gap:5,paddingLeft:12}}>
          <span style={{fontFamily:'var(--font-mono)',fontSize:9,fontWeight:700,color:lineColor,
            padding:'0px 4px',border:`1px solid ${lineColor}`,borderRadius:2}}>{lineLabel}</span>
          <span style={{fontFamily:'var(--font-mono)',fontSize:8,color:'var(--stroke2)'}}>
            {lineLabel==='L3'?'Doujani↔Barge':lineLabel==='L4'?'Vahibe↔PEM':'CHM↔Barge'}
          </span>
          <span style={{fontFamily:'var(--font-mono)',fontSize:8,color:'var(--stroke3)'}}>{dr.code}</span>
          {dr.dimJF && <span style={{fontFamily:'var(--font-mono)',fontSize:7,color:'var(--info)',
            padding:'1px 3px',border:'1px solid var(--info)',borderRadius:2,marginLeft:2}}>{dr.dimJF}</span>}
          <button onClick={() => onReplace(dr)} title="Remplacer"
            style={{marginLeft:'auto',fontSize:11,color:'var(--stroke3)',cursor:'pointer',background:'none',
              border:'1px solid var(--stroke3)',borderRadius:3,padding:'1px 5px',lineHeight:1.2}}>⇄</button>
        </span>
      </div>

      <div style={{position:'relative',background:incident?'rgba(209,58,42,0.03)':'transparent'}}>
        {HOURS.map(h => (
          <div key={h} style={{position:'absolute',left:`${toPos(h)}%`,top:0,bottom:0,borderLeft:'1px solid var(--stroke4)'}}/>
        ))}
        {astrSegs.map((seg, si) => {
          const [a, b] = seg.split('-');
          const s = parseTime(a), e = parseTime(b);
          if (s == null || e == null) return null;
          return <div key={si} className="gantt-bar" style={{left:`${toPos(s)}%`,width:`${toPos(e)-toPos(s)}%`,
            background:'transparent',border:'1.5px dashed var(--warn)',color:'var(--warn)',fontSize:9,
            top:2,bottom:'auto',height:10}}>{si===0?'astr':''}</div>;
        })}
        {amStart != null && amEnd != null && (
          <div className="gantt-bar" style={{left:`${toPos(amStart)}%`,width:`${toPos(amEnd)-toPos(amStart)}%`,
            background:incident?'var(--warn)':lineColor,color:'#fff',display:'flex',alignItems:'center',gap:4}}>
            <span style={{opacity:.7,fontSize:9,flexShrink:0}}>▶</span>
            <span style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
              {isFullDay ? dir.route : dir.am}
            </span>
          </div>
        )}
        {pmStart != null && pmEnd != null && (
          <div className="gantt-bar" style={{left:`${toPos(pmStart)}%`,width:`${toPos(pmEnd)-toPos(pmStart)}%`,
            background:`${lineColor}22`,border:`1.5px solid ${lineColor}`,color:lineColor,
            display:'flex',alignItems:'center',gap:4}}>
            <span style={{opacity:.7,fontSize:9,flexShrink:0}}>▶</span>
            <span style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{dir.pm}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PlanningPage() {
  const [ligne, setLigne] = useState('Tous');
  const [showAlert, setShowAlert] = useState(true);
  const [replaceTarget, setReplaceTarget] = useState<DriverExt|null>(null);

  const allDrivers: DriverExt[] = [
    ...L3.map(d => ({...d, _ligne:'L3', _color:'var(--brand)'})),
    ...L4.map(d => ({...d, _ligne:'L4', _color:'var(--info)'})),
    ...CHM.map(d => ({...d, _ligne:'CHM', _color:'var(--success)'})),
  ];
  const lignes = ['Tous','L3','L4','CHM'];
  const shown = ligne==='Tous' ? allDrivers : allDrivers.filter(d => d._ligne===ligne);

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      {showAlert && (
        <AlertBanner
          driver="D7 · COMBO Said · GB-965-EQ"
          message="Panne moteur · Passot La Barge · vocal 0:33 · course 17:50 non effectuée"
          age="28 mn"
          onDismiss={() => setShowAlert(false)}
          onReplace={() => { setReplaceTarget(allDrivers.find(d=>d.code==='D7')||null); setShowAlert(false); }}
        />
      )}

      <PageBar title="Planning hebdo · vue Gantt" sub="Direction · Semaine 19 · 4–10 mai 2026"
        actions={[{l:'Imprimer'},{l:'Dupliquer S-1'},{l:'+ Course',accent:true}]}/>

      <div style={{padding:'7px 20px',borderBottom:'1px dashed var(--stroke3)',background:'var(--paper)',
        display:'flex',gap:6,alignItems:'center',flexShrink:0,flexWrap:'wrap'}}>
        <Eyebrow>Ligne</Eyebrow>
        {lignes.map(l => (
          <span key={l} onClick={() => setLigne(l)} style={{cursor:'pointer'}}>
            <Pill variant={ligne===l?'active-dark':''}>{l}</Pill>
          </span>
        ))}
        <div style={{width:1,height:16,background:'var(--stroke3)',margin:'0 4px'}}/>
        <span style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'var(--stroke2)'}}>
          <span style={{width:10,height:4,background:'var(--stroke)',borderRadius:1,display:'inline-block'}}/>AM
          <span style={{width:10,height:4,border:'1px solid var(--stroke)',borderRadius:1,display:'inline-block',marginLeft:6}}/>PM
          <span style={{width:10,height:4,border:'1px dashed var(--warn)',borderRadius:1,display:'inline-block',marginLeft:6}}/>Astr.
        </span>
        <span style={{marginLeft:'auto'}}>
          {!showAlert && <Btn sm onClick={() => setShowAlert(true)}>⚠ Alerte D7</Btn>}
        </span>
      </div>

      <div className="scroll" style={{background:'var(--paper)'}}>
        <div style={{display:'grid',gridTemplateColumns:'230px 1fr',borderBottom:'1.5px solid var(--stroke)',
          position:'sticky',top:0,background:'#fff',zIndex:2}}>
          <div style={{padding:'7px 10px',fontFamily:'var(--font-mono)',fontSize:10,letterSpacing:'.12em',
            textTransform:'uppercase',borderRight:'1.5px solid var(--stroke)',color:'var(--stroke2)'}}>
            Ven 8 mai 2026
          </div>
          <div style={{display:'flex'}}>
            {HOURS.map(h => (
              <div key={h} style={{flex:1,padding:'7px 2px',fontFamily:'var(--font-mono)',fontSize:9,
                color:h<6||h>20?'var(--stroke3)':'var(--stroke2)',borderLeft:'1px solid var(--stroke4)',
                textAlign:'center',background:h===new Date().getHours()?'rgba(242,100,25,0.06)':'transparent'}}>
                {String(h).padStart(2,'0')}h
              </div>
            ))}
          </div>
        </div>

        {(['L3','L4','CHM'] as const).filter(l => ligne==='Tous'||ligne===l).map(l => {
          const lineDrivers = shown.filter(d => d._ligne===l);
          if (!lineDrivers.length) return null;
          const lineLabel = l==='L3'?'Doujani ↔ Passot Barge':l==='L4'?'Vahibe ↔ Passamainty':'CHM ↔ La Barge';
          const lineColor = l==='L3'?'var(--brand)':l==='L4'?'var(--info)':'var(--success)';
          return (
            <div key={l}>
              <div style={{padding:'5px 10px 5px 14px',background:'var(--ink-100)',borderBottom:'1px solid var(--stroke3)',
                display:'flex',alignItems:'center',gap:8}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:lineColor}}/>
                <span style={{fontFamily:'var(--font-mono)',fontSize:10,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase'}}>{l}</span>
                <span style={{fontSize:11,color:'var(--stroke2)'}}>{lineLabel}</span>
                <span style={{fontFamily:'var(--font-mono)',fontSize:9,color:'var(--stroke3)',marginLeft:'auto'}}>{lineDrivers.length} chauffeurs</span>
              </div>
              {lineDrivers.map(dr => (
                <GanttRow key={dr.code} dr={dr} lineLabel={l} lineColor={lineColor}
                  onReplace={setReplaceTarget} incident={l==='L3'&&dr.code==='D7'}/>
              ))}
            </div>
          );
        })}
      </div>

      {replaceTarget && (
        <div style={{position:'fixed',inset:0,background:'rgba(20,15,16,.38)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',border:'1.5px solid var(--stroke)',borderRadius:8,
            boxShadow:'0 30px 80px rgba(20,15,16,.35)',width:420,overflow:'hidden'}}>
            <div style={{padding:'16px 20px',borderBottom:'1.5px solid var(--stroke)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div className="eyebrow">Remplacer le chauffeur</div>
                <div style={{fontWeight:700,fontSize:16,marginTop:4}}>{replaceTarget.code} · {replaceTarget.nom}</div>
              </div>
              <Btn sm onClick={() => setReplaceTarget(null)}>✕</Btn>
            </div>
            <div style={{padding:'20px'}}>
              <div className="eyebrow" style={{marginBottom:8}}>Choisir le remplaçant</div>
              <select style={{width:'100%',border:'1.25px solid var(--stroke3)',borderRadius:6,
                padding:'8px 10px',fontSize:13,fontFamily:'var(--font-sans)',marginBottom:14}}>
                <option>— Sélectionner un chauffeur disponible —</option>
                {allDrivers.filter(d => d.code!==replaceTarget.code).map(d => (
                  <option key={d.code}>{d.code} · {d.nom}</option>
                ))}
              </select>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                <Btn onClick={() => setReplaceTarget(null)}>Annuler</Btn>
                <Btn accent onClick={() => setReplaceTarget(null)}>Confirmer →</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
