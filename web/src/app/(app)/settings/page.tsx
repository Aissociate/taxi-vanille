'use client';
import { PageBar, Eyebrow, Btn } from '@/components/ui';

const SECTIONS = [
  { title: 'Compte & accès', items: [
    { label: 'Mot de passe', value: '••••••••', action: 'Modifier' },
    { label: 'Email', value: 'm.aubin@taxivanille.yt', action: 'Modifier' },
    { label: 'Rôle', value: 'Direction · Coordinateur', action: null },
  ]},
  { title: 'Notifications', items: [
    { label: 'Incidents en temps réel', value: 'Activé', action: 'Configurer' },
    { label: 'Rapports hebdomadaires', value: 'Vendredi 18h00', action: 'Modifier' },
    { label: 'Alertes documents expirés', value: '30 j avant', action: 'Modifier' },
  ]},
  { title: 'Application chauffeur', items: [
    { label: 'Version APK', value: 'v1.2.4 (stable)', action: 'Voir changelog' },
    { label: 'Lien de téléchargement', value: 'taxivanille.yt/app', action: 'Copier' },
    { label: 'Mode hors-ligne', value: 'Activé — 7 jours de cache', action: null },
  ]},
];

export default function SettingsPage() {
  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <PageBar title="Paramétrage" sub="Direction · Paramètres" actions={[]}/>
      <div className="scroll" style={{padding:24,display:'flex',flexDirection:'column',gap:20}}>
        {SECTIONS.map(section => (
          <div key={section.title} className="card" style={{background:'#fff',padding:0,overflow:'hidden'}}>
            <div style={{padding:'12px 18px',borderBottom:'1.5px solid var(--stroke3)',background:'var(--paper)'}}>
              <Eyebrow>{section.title}</Eyebrow>
            </div>
            {section.items.map((item, i) => (
              <div key={item.label} style={{
                display:'flex',alignItems:'center',padding:'14px 18px',
                borderBottom:i<section.items.length-1?'1px dashed var(--stroke3)':'none',
              }}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--stroke)'}}>{item.label}</div>
                  <div style={{fontSize:11,color:'var(--stroke2)',marginTop:2,fontFamily:'var(--font-mono)'}}>{item.value}</div>
                </div>
                {item.action && <Btn sm>{item.action}</Btn>}
              </div>
            ))}
          </div>
        ))}
        <div style={{height:24}}/>
      </div>
    </div>
  );
}
