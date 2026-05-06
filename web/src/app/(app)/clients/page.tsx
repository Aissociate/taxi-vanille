'use client';
import { Eyebrow, Btn } from '@/components/ui';

const CLIENTS = [
  {
    nom: 'CADEMA — Ligne 3',
    sub: 'Doujani ↔ Passot Barge · 14 chauffeurs',
    badge: 'AO',
    ca: '~38 240 € / mois',
    trajets: 618,
  },
  {
    nom: 'CADEMA — Ligne 4',
    sub: 'Vahibe ↔ Passamainty (PEM) · 14 chauffeurs',
    badge: 'AO',
    ca: '~24 000 € / mois',
    trajets: 642,
  },
  {
    nom: 'CHM Petite-Terre',
    sub: 'CHM ↔ La Barge · 13 arrêts · 8 chauffeurs',
    badge: 'MARCHE',
    ca: '~8 600 € / mois',
    trajets: 284,
  },
];

export default function ClientsPage() {
  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      {/* Header */}
      <div style={{padding:'14px 24px',borderBottom:'1.5px solid var(--stroke)',display:'flex',
        alignItems:'center',justifyContent:'space-between',background:'#fff',flexShrink:0}}>
        <div>
          <div className="eyebrow">Direction · 3 contrats actifs</div>
          <h1 style={{fontSize:20,fontWeight:700,marginTop:3}}>Gestion clients</h1>
        </div>
        <Btn accent>+ Contrat</Btn>
      </div>

      {/* Cards */}
      <div className="scroll" style={{padding:24,display:'flex',flexDirection:'column',gap:16}}>
        {CLIENTS.map(c => (
          <div key={c.nom} className="card" style={{background:'#fff',padding:24}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
              <div>
                <div style={{fontSize:18,fontWeight:800,color:'var(--stroke)'}}>{c.nom}</div>
                <div style={{fontSize:13,color:'var(--stroke2)',marginTop:3}}>{c.sub}</div>
              </div>
              <span style={{fontFamily:'var(--font-mono)',fontSize:10,fontWeight:700,
                border:'1.5px solid var(--stroke3)',borderRadius:999,padding:'3px 10px',
                color:'var(--stroke2)',whiteSpace:'nowrap'}}>{c.badge}</span>
            </div>

            <div style={{borderTop:'1px dashed var(--stroke3)',paddingTop:14,
              display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:14}}>
              <div>
                <div className="eyebrow" style={{color:'var(--brand)'}}>CA mensuel</div>
                <div style={{fontFamily:'var(--font-mono)',fontSize:22,fontWeight:800,marginTop:4}}>{c.ca}</div>
              </div>
              <div>
                <div className="eyebrow" style={{color:'var(--brand)'}}>Trajets mars 2026</div>
                <div style={{fontFamily:'var(--font-mono)',fontSize:22,fontWeight:800,marginTop:4}}>{c.trajets}</div>
              </div>
            </div>

            <div style={{display:'flex',gap:8}}>
              <Btn sm>Voir rapport</Btn>
              <Btn sm>Factures</Btn>
              <Btn sm accent>Planning</Btn>
            </div>
          </div>
        ))}
        <div style={{height:24}}/>
      </div>
    </div>
  );
}
