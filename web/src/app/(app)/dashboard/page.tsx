'use client';
import { STATS, DAYS } from '@/lib/data';
import { PageBar, Eyebrow, KpiCard, Sparkline } from '@/components/ui';

export default function DashboardPage() {
  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <PageBar title="Tableau de bord KPI" sub="Direction · Semaine 19"
        actions={[{l:'Jour'},{l:'Semaine'},{l:'Mois'},{l:'Exporter'}]}/>
      <div className="scroll" style={{padding:24,display:'flex',flexDirection:'column',gap:16}}>

        <div style={{display:'grid',gap:16,gridTemplateColumns:'repeat(4,1fr)'}}>
          <KpiCard label="CA semaine" value="12 480 €" delta="↑ 6 % vs S-1"/>
          <KpiCard label="Courses réalisées" value="187" delta="↑ 12 vs S-1"/>
          <KpiCard label="Ponctualité" value="94,2 %" delta="retards >10 mn : 18"/>
          <KpiCard label="Incidents ouverts" value="1" delta="D7 · COMBO Said · panne moteur" danger/>
        </div>

        <div style={{display:'grid',gap:16,gridTemplateColumns:'2fr 1fr'}}>
          <div className="card" style={{padding:18}}>
            <Eyebrow>Chiffre d'affaires · semaine / mois / année</Eyebrow>
            <Sparkline/>
            <div style={{display:'flex',justifyContent:'space-between',fontFamily:'var(--font-mono)',
              fontSize:10,color:'var(--stroke2)',marginTop:4}}>
              {DAYS.map(d => <span key={d}>{d.split(' ')[0]}</span>)}
            </div>
          </div>
          <div className="card" style={{padding:18}}>
            <Eyebrow>Trajets non effectués · 30 j</Eyebrow>
            <div style={{display:'flex',alignItems:'baseline',gap:8,marginTop:8}}>
              <div style={{fontFamily:'var(--font-mono)',fontSize:32,fontWeight:700}}>24</div>
              <span style={{fontSize:11,color:'var(--stroke2)'}}>panne véhicule = cause #1</span>
            </div>
            <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:8}}>
              {[['Voiture en panne',9,'var(--danger)'],['Absence chauffeur',7,'var(--warn)'],['Météo / route bloquée',5,'var(--info)'],['Autre',3,'var(--stroke2)']].map(([l,n,c])=>(
                <div key={String(l)} style={{display:'grid',gridTemplateColumns:'1fr 120px 24px',gap:8,alignItems:'center',fontSize:12}}>
                  <span>{l}</span>
                  <div style={{height:8,background:'var(--stroke4)',borderRadius:2,position:'relative'}}>
                    <div style={{position:'absolute',inset:0,width:`${(Number(n)/9)*100}%`,background:String(c),borderRadius:2}}/>
                  </div>
                  <span style={{fontFamily:'var(--font-mono)',fontWeight:700,textAlign:'right'}}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{padding:18}}>
          <Eyebrow>Trajets réalisés par chauffeur · L4 · mars 2026</Eyebrow>
          <div style={{marginTop:14,display:'flex',flexDirection:'column',gap:10}}>
            {STATS.parCh.map(r => (
              <div key={r.code} style={{display:'grid',gridTemplateColumns:'220px 1fr 60px',alignItems:'center',gap:10}}>
                <span style={{fontSize:12}}>{r.code} · {r.nom}</span>
                <div style={{height:14,background:'var(--stroke4)',borderRadius:3}}>
                  <div style={{width:`${(r.trajets/84)*100}%`,height:'100%',background:'var(--stroke)',borderRadius:3}}/>
                </div>
                <span style={{fontFamily:'var(--font-mono)',fontSize:12,fontWeight:700,textAlign:'right'}}>{r.trajets}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{display:'grid',gap:16,gridTemplateColumns:'repeat(4,1fr)'}}>
          <KpiCard label="Trajets théoriques" value="642" delta="• 24 non eff."/>
          <KpiCard label="Taux réalisation" value="96,3 %" delta="objectif 95 %"/>
          <KpiCard label="Voy. moyen / trajet" value="13,6" delta="objectif 12,0"/>
          <KpiCard label="Voy. moyen / jour" value="271" delta="31 j · L4 mars 2026"/>
        </div>

      </div>
    </div>
  );
}
