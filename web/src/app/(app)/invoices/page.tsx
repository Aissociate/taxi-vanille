'use client';
import { useState } from 'react';
import { INVOICES } from '@/lib/data';
import { PageBar, Eyebrow, Pill, Btn, StatusPill } from '@/components/ui';

export default function InvoicesPage() {
  const [view, setView] = useState<'kanban'|'new'>('kanban');

  if (view === 'new') {
    return <NewInvoice onBack={() => setView('kanban')}/>;
  }

  const cols = [
    {title:'Reçue · à valider', key:'draft', count:4},
    {title:'Validée · à payer', key:'validated', count:2},
    {title:'Payée', key:'paid', count:2},
  ];

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <PageBar title="Factures de rétrocession · vue Kanban" sub="Direction · Factures"
        actions={[{l:'Vue liste'},{l:'+ Nouvelle facture',accent:true,onClick:()=>setView('new')}]}/>
      <div className="scroll" style={{padding:24,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,alignContent:'start'}}>
        {cols.map(col => (
          <div key={col.key} className="card" style={{padding:14,background:'var(--paper)',display:'flex',flexDirection:'column',gap:10}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <Eyebrow>{col.title}</Eyebrow>
              <Pill>{String(col.count)}</Pill>
            </div>
            {INVOICES.filter(iv => iv.status===col.key).map(iv => (
              <div key={iv.id} className="card" style={{padding:12,background:'#fff'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontFamily:'var(--font-mono)',fontWeight:700,fontSize:12}}>{iv.id}</span>
                  <StatusPill s={iv.status}/>
                </div>
                <div style={{fontSize:12,marginTop:6,color:'var(--stroke)'}}>{iv.driver}</div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
                  <span style={{fontFamily:'var(--font-mono)',fontSize:9,color:'var(--stroke2)',letterSpacing:'.1em',textTransform:'uppercase'}}>{iv.week}</span>
                  <span style={{fontFamily:'var(--font-mono)',fontWeight:700,fontSize:16}}>{iv.amount} €</span>
                </div>
                {iv.status==='draft' && (
                  <div style={{display:'flex',gap:6,marginTop:10}}>
                    <Btn sm style={{flex:1}}>Aperçu PDF</Btn>
                    <Btn sm accent style={{flex:1}}>Valider →</Btn>
                  </div>
                )}
                {iv.status==='validated' && (
                  <Btn sm accent style={{width:'100%',marginTop:10}}>Mettre en paiement</Btn>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function NewInvoice({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(1);
  const steps = [{n:1,l:'Client & période'},{n:2,l:'Lignes (auto)'},{n:3,l:'Ajustements'},{n:4,l:'Émettre'}];

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <PageBar title="Nouvelle facture client" sub="Direction · Factures › Nouvelle"
        actions={[
          {l:'← Retour aux factures',onClick:onBack},
          {l:'Enregistrer brouillon'},
          {l:'Émettre la facture',accent:true,onClick:()=>setStep(4)},
        ]}/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',borderBottom:'1.5px solid var(--stroke)',
        background:'var(--paper)',flexShrink:0}}>
        {steps.map(({n,l},i) => (
          <div key={n} onClick={() => setStep(n)} style={{
            padding:'10px 14px',borderRight:i<3?'1px solid var(--stroke3)':'none',
            background:n===step?'#fff':'transparent',cursor:'pointer',display:'flex',alignItems:'center',gap:10}}>
            <div className="step-num" style={{
              background:n<step?'var(--brand)':n===step?'var(--stroke)':'#fff',
              color:n<=step?'#fff':'var(--stroke2)',
              borderColor:n<step?'var(--brand)':n===step?'var(--stroke)':'var(--stroke3)'}}>
              {n<step?'✓':n}
            </div>
            <div>
              <div style={{fontFamily:'var(--font-mono)',fontSize:9,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--stroke2)'}}>Étape {n}</div>
              <div style={{fontSize:12,fontWeight:n===step?700:500}}>{l}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>
        <div style={{flex:1,padding:20,overflow:'auto',background:'var(--paper)',display:'flex',flexDirection:'column',gap:14}}>
          <div className="card-soft" style={{padding:14}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <Eyebrow>Étape 1 · {step>1?'validée':'en cours'}</Eyebrow>
                <div style={{fontSize:14,fontWeight:700,marginTop:4}}>CADEMA — Ligne 4 Caribus · Mars 2026</div>
                <div style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--stroke2)',marginTop:2}}>Contrat C-2024-04 · forfait 6,80 € / trajet · 642 prévus</div>
              </div>
              {step>1 && <Btn sm onClick={() => setStep(1)}>← modifier</Btn>}
            </div>
            {step===1 && (
              <div style={{marginTop:14,display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                {[['Client','CADEMA'],['Ligne','L4 — Vahibe ↔ PEM Passamainty'],['Période','Mars 2026'],['Contrat','C-2024-04 · 6,80 € / trajet']].map(([l,v]) => (
                  <div key={String(l)}>
                    <Eyebrow>{l}</Eyebrow>
                    <div style={{marginTop:4,fontSize:13,fontWeight:600,padding:'8px 10px',
                      border:'1.25px solid var(--stroke3)',borderRadius:6,background:'#fff'}}>{v}</div>
                  </div>
                ))}
                <Btn accent style={{display:'block',width:'100%',marginTop:8}} onClick={() => setStep(2)}>Suivant → Générer les lignes</Btn>
              </div>
            )}
          </div>

          {step>=2 && (
            <div className="card" style={{background:'#fff'}}>
              <div style={{padding:'10px 14px',borderBottom:'1.5px solid var(--stroke)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <Eyebrow>Lignes calculées · depuis Planning + Replay GPS</Eyebrow>
                <div style={{display:'flex',gap:6}}><Btn sm>↻ Recalculer</Btn><Btn sm>+ Ligne manuelle</Btn></div>
              </div>
              {[['Trajets effectués L4','618 trajets','6,80 €','4 202,40 €','auto · Planning + GPS'],
                ['Voyageurs transportés','8 412 vy','—','—','auto · Replay GPS'],
                ['Pénalité ponctualité (>10 mn × 18)','18 × 22 €','−22,00 €','−396,00 €','auto · Contrat §4.2'],
                ['Course supplémentaire CADEMA-EXT','4 trajets','8,50 €','34,00 €','auto · Demandes ad hoc'],
              ].map(([l,q,p,t,src],i,arr) => (
                <div key={i} style={{display:'grid',gridTemplateColumns:'2fr 90px 80px 120px 32px',
                  alignItems:'center',gap:10,padding:'10px 14px',borderBottom:i<arr.length-1?'1px dashed var(--stroke3)':'none'}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600}}>{l}</div>
                    <div style={{fontFamily:'var(--font-mono)',fontSize:9,color:'var(--stroke2)',marginTop:2}}>↳ {src}</div>
                  </div>
                  <div style={{fontFamily:'var(--font-mono)',fontSize:11}}>{q}</div>
                  <div style={{fontFamily:'var(--font-mono)',fontSize:11}}>{p}</div>
                  <div style={{fontFamily:'var(--font-mono)',fontWeight:700,textAlign:'right'}}>{t}</div>
                  <Btn sm>✎</Btn>
                </div>
              ))}
              <div style={{padding:'12px 14px',background:'var(--paper)',display:'flex',justifyContent:'space-between',borderTop:'1.5px solid var(--stroke)'}}>
                <div style={{fontSize:11,color:'var(--stroke2)'}}>HT · TVA non applicable, art. 293 B CGI</div>
                <div style={{display:'flex',gap:18,alignItems:'baseline'}}>
                  <span style={{fontFamily:'var(--font-mono)',fontSize:11,color:'var(--stroke2)'}}>Total HT</span>
                  <span style={{fontFamily:'var(--font-mono)',fontSize:24,fontWeight:800}}>3 840,40 €</span>
                </div>
              </div>
              {step===2 && <div style={{padding:'12px 14px',borderTop:'1px dashed var(--stroke3)'}}>
                <Btn accent onClick={() => setStep(3)}>Suivant → Ajustements</Btn>
              </div>}
            </div>
          )}

          {step>=3 && (
            <div className="card" style={{background:'#fff',padding:16}}>
              <Eyebrow>Ajustements & note client</Eyebrow>
              <div style={{marginTop:10,display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                {[['Remise commerciale','0,00 €'],['Frais de gestion','0,00 €']].map(([l,v]) => (
                  <div key={String(l)}>
                    <Eyebrow>{l}</Eyebrow>
                    <div style={{marginTop:4,padding:'8px 10px',border:'1.25px dashed var(--stroke3)',
                      borderRadius:6,fontSize:13,fontFamily:'var(--font-mono)'}}>{v}</div>
                  </div>
                ))}
              </div>
              {step===3 && <Btn accent style={{marginTop:12}} onClick={() => setStep(4)}>Suivant → Émettre</Btn>}
            </div>
          )}

          {step===4 && (
            <div className="card" style={{background:'#fff',padding:16}}>
              <Eyebrow>Confirmer l'émission</Eyebrow>
              <div style={{marginTop:8,fontSize:13,color:'var(--stroke2)'}}>La facture <b>F-2026-0114</b> sera envoyée à <b>comptabilite@cadema.yt</b>.</div>
              <div style={{display:'flex',gap:8,marginTop:14}}>
                <Btn sm onClick={() => setStep(3)}>← Modifier</Btn>
                <Btn sm accent>Émettre &amp; envoyer →</Btn>
              </div>
            </div>
          )}
        </div>

        <div style={{width:360,borderLeft:'1.5px solid var(--stroke)',background:'var(--paper)',overflow:'auto',padding:18,flexShrink:0}}>
          <Eyebrow>Aperçu PDF · A4</Eyebrow>
          <div style={{marginTop:8,background:'#fff',border:'1.5px solid var(--stroke)',padding:18,fontSize:11,lineHeight:1.6}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <div style={{fontFamily:'var(--font-mono)',fontSize:10,letterSpacing:'.14em'}}>TAXI VANILLE</div>
                <div style={{fontSize:9,color:'var(--stroke2)'}}>Mamoudzou · Mayotte</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontWeight:700}}>FACTURE</div>
                <div style={{fontFamily:'var(--font-mono)',fontSize:10}}>F-2026-0114 · 03/04/2026</div>
              </div>
            </div>
            <div style={{height:12}}/>
            <div style={{fontSize:10}}>Client · <b>CADEMA</b><br/>Place Mariage · 97600 Mamoudzou</div>
            <div style={{height:12}}/>
            <div style={{borderTop:'1px solid #000',borderBottom:'1px solid #000'}}>
              {[['Trajets L4','618 × 6,80','4 202,40 €'],['Voyageurs','8 412','—'],
                ['Pénalité ponctualité','18 × 22','−396,00 €'],['Suppl. CADEMA-EXT','4 × 8,50','34,00 €']].map(([l,q,t],i)=>(
                <div key={i} style={{display:'grid',gridTemplateColumns:'1.4fr 1fr 0.9fr',padding:'4px 0',
                  fontSize:9,borderTop:i?'1px dotted var(--stroke3)':'none'}}>
                  <span>{l}</span><span style={{fontFamily:'var(--font-mono)'}}>{q}</span>
                  <span style={{fontFamily:'var(--font-mono)',textAlign:'right'}}>{t}</span>
                </div>
              ))}
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:10,fontWeight:700}}>
              <span>Total HT</span><span style={{fontFamily:'var(--font-mono)'}}>3 840,40 €</span>
            </div>
            <div style={{fontSize:8,color:'var(--stroke2)',marginTop:14}}>Règlement à 30 j · IBAN FR76 …</div>
          </div>
        </div>
      </div>
    </div>
  );
}
