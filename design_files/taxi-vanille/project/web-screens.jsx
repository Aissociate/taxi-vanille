// web-screens.jsx — wireframe screens for Direction & Coordinateur web app
// 7 screens × 3 layout variations.

const Eyebrow = ({ children, color }) => (
  <div className="wf-eyebrow" style={{ color: color || 'var(--wf-stroke-2)' }}>{children}</div>
);

const Sline = ({ w = '100%', h = 8 }) => (
  <div className="wf-scribble" style={{ width: w, height: h }} />
);

// Browser-ish chrome window for each variation
const WebFrame = ({ width = 1280, height = 760, label, sublabel, children, sidebarMode = 'full' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
    <div style={{
      width, height,
      border: '1.5px solid var(--wf-stroke)',
      background: '#fff',
      borderRadius: '10px 11px 9px 12px / 11px 9px 12px 10px',
      overflow: 'hidden',
      boxShadow: '0 18px 40px rgba(25,20,20,0.07)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* tab bar */}
      <div style={{
        height: 36, background: 'var(--wf-paper-2)', borderBottom: '1.5px solid var(--wf-stroke)',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8,
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#fff', border: '1.25px solid var(--wf-stroke-3)' }} />
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#fff', border: '1.25px solid var(--wf-stroke-3)' }} />
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#fff', border: '1.25px solid var(--wf-stroke-3)' }} />
        </div>
        <div style={{ flex: 1, height: 22, background: '#fff', border: '1.25px solid var(--wf-stroke-3)', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--wf-stroke-2)', display: 'flex', alignItems: 'center', padding: '0 10px' }}>
          taxi-vanille.app › <span style={{ color: 'var(--wf-stroke)', marginLeft: 4 }}>{sublabel || ''}</span>
        </div>
      </div>
      {children}
    </div>
    {label && (
      <div style={{ textAlign: 'center', maxWidth: 600 }}>
        <div className="wf-variation-tag">{label}</div>
        {sublabel && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--wf-stroke-2)', marginTop: 2, lineHeight: 1.45 }}>{sublabel}</div>}
      </div>
    )}
  </div>
);

const Sidebar = ({ active, mode = 'full' }) => {
  const items = ['Tableau de bord', 'Planning', 'Carte temps réel', 'Chauffeurs', 'Clients', 'Factures', 'Rapports', 'Paramètres'];
  if (mode === 'rail') {
    return (
      <div style={{ width: 56, background: 'var(--wf-paper)', borderRight: '1.5px solid var(--wf-stroke)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 0', gap: 10 }}>
        <img src="assets/logo-aissociate.png" style={{ width: 28, height: 28 }} alt="" />
        {items.map((_, i) => (
          <div key={i} style={{
            width: 36, height: 36, borderRadius: 8,
            background: i === active ? 'var(--wf-stroke)' : 'transparent',
            color: i === active ? '#fff' : 'var(--wf-stroke-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
          }}>{['DB','PL','GP','CH','CL','FA','RP','PR'][i]}</div>
        ))}
      </div>
    );
  }
  return (
    <div style={{ width: 200, background: 'var(--wf-paper)', borderRight: '1.5px solid var(--wf-stroke)', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 6px 14px' }}>
        <img src="assets/logo-aissociate.png" style={{ width: 30, height: 30 }} alt="" />
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700 }}>Vanille</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.16em', color: 'var(--wf-stroke-2)', textTransform: 'uppercase' }}>Direction</div>
        </div>
      </div>
      {items.map((it, i) => (
        <div key={i} style={{
          padding: '8px 10px', borderRadius: 6,
          background: i === active ? 'var(--wf-stroke)' : 'transparent',
          color: i === active ? '#fff' : 'var(--wf-stroke-2)',
          fontWeight: i === active ? 700 : 500, fontSize: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>{it}</span>
          {i === 5 && <span className="wf-pill" style={{ fontSize: 9, padding: '1px 6px', background: i === active ? 'rgba(255,255,255,0.15)' : '#fff', borderColor: 'transparent' }}>3</span>}
        </div>
      ))}
      <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px dashed var(--wf-stroke-3)' }}>
        <div style={{ fontSize: 11, color: 'var(--wf-stroke-2)' }}>M. Aubin · Direction</div>
      </div>
    </div>
  );
};

const PageBar = ({ title, sub, actions = [] }) => (
  <div style={{ padding: '14px 24px', borderBottom: '1.5px solid var(--wf-stroke)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}>
    <div>
      <Eyebrow>{sub}</Eyebrow>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 18, fontWeight: 700, marginTop: 2 }}>{title}</div>
    </div>
    <div style={{ display: 'flex', gap: 8 }}>
      {actions.map((a, i) => (
        <div key={i} className={a.primary ? 'tap-btn tap-btn-accent' : 'tap-btn'} style={{ padding: '6px 14px', height: 32, fontSize: 12 }}>{a.l}</div>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────
// 1 ▸ PLANNING HEBDO — three layouts (rows = chauffeurs)
// ─────────────────────────────────────────────────────────────────────
// Données réelles : chauffeurs Ligne 3 (Doujani ↔ Passot Barge)
const DRIVERS = [
  'D1 · MOHAMED Ali',
  'D5 · AMINA Selemani',
  'D7 · COMBO Said',
  'D12 · VELOU M\'Berou',
  'D13 · MOURIDI Aktoir',
  'D14 · AHAMADI Laydine',
];
const DAYS = ['Lun 4', 'Mar 5', 'Mer 6', 'Jeu 7', 'Ven 8', 'Sam 9', 'Dim 10'];
const STOPS_L3 = ['DOUJANI', 'PASSOT LA BARGE', "M'TSAPERE", 'DOUJANI', 'PASSOT LA BARGE'];
// Plages réelles extraites du PLANNING GENERAL Ligne 3
const PLANNING_RANGES_L3 = {
  'D1':  { am: '5:00-8:30',   pm: '14:40-18:10' },
  'D5':  { am: '5:20-8:10',   pm: '15:20-17:50' },
  'D7':  { am: '6:20-8:20',   pm: '17:50-20:50' },
  'D12': { am: '6:00-13:50' },
  'D13': { am: '5:10-8:10' },
  'D14': { am: '5:30-8:30' },
};

const PlanningGridA = () => (
  <div style={{ flex: 1, display: 'flex', height: '100%' }}>
    <Sidebar active={1} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <PageBar title="Planning · Semaine 19 (4-10 mai)" sub="Direction" actions={[
        { l: '← Précédent' }, { l: 'Aujourd\'hui' }, { l: 'Suivant →' }, { l: '+ Course', primary: true }
      ]} />
      <div style={{ padding: '8px 24px', borderBottom: '1px dashed var(--wf-stroke-3)', display: 'flex', gap: 8, alignItems: 'center', background: 'var(--wf-paper)' }}>
        <Eyebrow>Filtres</Eyebrow>
        <div className="wf-pill">Tous chauffeurs</div>
        <div className="wf-pill">Clients : tous</div>
        <div className="wf-pill is-incident">Incidents</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0' }}>
        {/* header row */}
        <div style={{ display: 'grid', gridTemplateColumns: '160px repeat(7, 1fr)', borderBottom: '1.5px solid var(--wf-stroke)', position: 'sticky', top: 0, background: '#fff' }}>
          <div style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--wf-stroke-2)' }}>Chauffeur</div>
          {DAYS.map(d => (
            <div key={d} style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, borderLeft: '1px solid var(--wf-stroke-3)', textAlign: 'center' }}>{d}</div>
          ))}
        </div>
        {/* rows */}
        {DRIVERS.map((dr, i) => {
          const code = dr.split(' ')[0];
          const r = PLANNING_RANGES_L3[code] || {};
          return (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '160px repeat(7, 1fr)', borderBottom: '1px solid var(--wf-stroke-3)' }}>
            <div style={{ padding: '14px 12px', fontWeight: 600, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span>{dr}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--wf-stroke-2)' }}>L3 · {r.am || '—'}{r.pm ? ' / ' + r.pm : ''}</span>
            </div>
            {DAYS.map((d, j) => {
              const isWeekend = j >= 5;
              const stopAm = ['DOUJANI','PASSOT','M\'TSAPERE','DOUJANI','PASSOT'][i % 5];
              const stopPm = ['LA BARGE','DOUJANI','PASSOT'][i % 3];
              return (
                <div key={j} style={{ borderLeft: '1px solid var(--wf-stroke-3)', minHeight: 80, padding: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {r.am && !isWeekend && (
                    <div style={{ background: 'var(--wf-stroke)', color: '#fff', padding: '4px 6px', borderRadius: 4, fontSize: 10, fontFamily: 'var(--font-mono)' }}>
                      <div>{r.am}</div>
                      <div style={{ opacity: 0.8 }}>{stopAm}</div>
                    </div>
                  )}
                  {r.pm && !isWeekend && (
                    <div style={{ background: 'var(--wf-accent-soft)', border: '1px solid var(--wf-accent)', padding: '4px 6px', borderRadius: 4, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--wf-stroke)' }}>
                      <div>{r.pm}</div>
                      <div style={{ opacity: 0.8 }}>{stopPm}</div>
                    </div>
                  )}
                  {j === 6 && (code === 'D7' || code === 'D12' || code === 'D14') && (
                    <div style={{ background: '#fff', border: '1px dashed var(--wf-accent)', padding: '4px 6px', borderRadius: 4, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--wf-accent)' }}>
                      Dimanche · férié
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          );
        })}
      </div>
    </div>
  </div>
);

const PlanningGridB = () => (
  <div style={{ flex: 1, display: 'flex', height: '100%' }}>
    <Sidebar active={1} mode="rail" />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <PageBar title="Planning hebdo · vue Gantt" sub="Direction" actions={[{ l: 'Imprimer' }, { l: 'Dupliquer S-1' }, { l: '+ Course', primary: true }]} />
      <div style={{ flex: 1, overflow: 'auto', padding: '0', position: 'relative' }}>
        {/* hour ruler */}
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', borderBottom: '1.5px solid var(--wf-stroke)', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <div style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Vendredi 8 mai</div>
          <div style={{ display: 'flex' }}>
            {Array.from({ length: 14 }).map((_, h) => (
              <div key={h} style={{ flex: 1, padding: '8px 4px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--wf-stroke-2)', borderLeft: '1px solid var(--wf-stroke-4)' }}>{(h + 6).toString().padStart(2, '0')}h</div>
            ))}
          </div>
        </div>
        {DRIVERS.map((dr, i) => {
          const blocks = [
            { start: 0.5 + i * 0.3, w: 1.2, kind: 'done' },
            { start: 3 + (i % 3) * 0.7, w: 1.6, kind: 'live' },
            { start: 6 + (i % 4), w: 1.0, kind: 'planned' },
            { start: 9 + (i % 2), w: 1.5, kind: 'planned' },
          ];
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '180px 1fr', borderBottom: '1px solid var(--wf-stroke-3)', minHeight: 60 }}>
              <div style={{ padding: '12px 12px', fontWeight: 600, fontSize: 12, borderRight: '1.5px solid var(--wf-stroke)' }}>
                {dr}
                <div style={{ fontSize: 10, color: 'var(--wf-stroke-2)', fontFamily: 'var(--font-mono)' }}>32h</div>
              </div>
              <div style={{ position: 'relative' }}>
                {/* hour grid */}
                {Array.from({ length: 14 }).map((_, h) => (
                  <div key={h} style={{ position: 'absolute', left: `${(h / 14) * 100}%`, top: 0, bottom: 0, borderLeft: '1px solid var(--wf-stroke-4)' }} />
                ))}
                {blocks.map((b, k) => (
                  <div key={k} style={{
                    position: 'absolute',
                    left: `${(b.start / 14) * 100}%`,
                    width: `${(b.w / 14) * 100}%`,
                    top: 8, bottom: 8,
                    background: b.kind === 'live' ? 'var(--wf-accent)' : b.kind === 'done' ? 'var(--wf-stroke)' : '#fff',
                    border: '1.5px solid ' + (b.kind === 'live' ? 'var(--wf-accent)' : b.kind === 'done' ? 'var(--wf-stroke)' : 'var(--wf-stroke)'),
                    color: b.kind === 'planned' ? 'var(--wf-stroke)' : '#fff',
                    borderRadius: 4, padding: '4px 8px',
                    fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
                    display: 'flex', alignItems: 'center', overflow: 'hidden',
                  }}>{k === 0 ? 'DOUJANI' : k === 1 ? 'PASSOT BARGE' : k === 2 ? "M'TSAPERE" : 'PEM PASSAMAINTY'}</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

const PlanningGridC = () => (
  <div style={{ flex: 1, display: 'flex', height: '100%' }}>
    <Sidebar active={1} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <PageBar title="Planning · jour zoomé" sub="Direction · Vendredi 8 mai" actions={[{ l: '← Hier' }, { l: 'Demain →' }, { l: 'Remplacer chauffeur', primary: true }]} />
      <div style={{ flex: 1, display: 'flex' }}>
        {/* Left: drivers */}
        <div style={{ width: 280, borderRight: '1.5px solid var(--wf-stroke)', overflow: 'auto', padding: '12px' }}>
          <Eyebrow>Chauffeurs · 6</Eyebrow>
          {DRIVERS.map((dr, i) => (
            <div key={i} className="wf-box" style={{ padding: 10, marginTop: 8, borderColor: i === 0 ? 'var(--wf-accent)' : 'var(--wf-stroke)' }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{dr}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--wf-stroke-2)' }}>
                <span>5 courses</span>·<span>8h30</span>
              </div>
              <div style={{ marginTop: 6, height: 4, background: 'var(--wf-stroke-4)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${40 + i * 10}%`, height: '100%', background: 'var(--wf-accent)' }} />
              </div>
            </div>
          ))}
        </div>
        {/* Right: course detail */}
        <div style={{ flex: 1, padding: 18, overflow: 'auto', background: 'var(--wf-paper)' }}>
          <Eyebrow>D1 · MOHAMED Ali (laglace)</Eyebrow>
          <div style={{ fontWeight: 700, fontSize: 18, marginTop: 4 }}>3 trajets matin · L3 · 5:00-8:30</div>
          <div className="wf-box" style={{ marginTop: 14, background: '#fff' }}>
            {[
              ['5:00', 'DOUJANI → Passot Barge', 'Terminé', 'done'],
              ['5:30', 'PASSOT BARGE → Doujani', 'En cours', 'live'],
              ['6:00', 'DOUJANI → Passot Barge', 'Planifié', 'planned'],
              ['6:30', 'PASSOT BARGE → Doujani', 'Planifié', 'planned'],
              ['8:00', 'DOUJANI → Passot Barge', 'Planifié', 'planned'],
            ].map(([t, n, s, k], i, arr) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '64px 1fr 110px 80px', padding: '12px 14px', borderBottom: i < arr.length - 1 ? '1px dashed var(--wf-stroke-3)' : 'none', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{t}</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{n}</span>
                <span><span className={`wf-pill is-${k}`}><span className="dot" />{s}</span></span>
                <span className="wf-hand-note" style={{ fontSize: 14, textAlign: 'right' }}>↻ remplacer</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────
// 2 ▸ KPI DASHBOARD — three layouts
// ─────────────────────────────────────────────────────────────────────
const Kpi = ({ l, v, d, big }) => (
  <div className="wf-box" style={{ padding: big ? 18 : 14, background: '#fff' }}>
    <Eyebrow>{l}</Eyebrow>
    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: big ? 36 : 26, marginTop: 6, lineHeight: 1 }}>{v}</div>
    <div style={{ fontSize: 11, color: 'var(--wf-stroke-2)', marginTop: 4 }}>{d}</div>
  </div>
);

const Sparkline = () => (
  <svg viewBox="0 0 200 60" style={{ width: '100%', height: 60 }}>
    <polyline points="0,40 20,32 40,38 60,28 80,30 100,22 120,25 140,15 160,20 180,12 200,8" fill="none" stroke="var(--wf-accent)" strokeWidth="2"/>
    <polyline points="0,40 20,32 40,38 60,28 80,30 100,22 120,25 140,15 160,20 180,12 200,8 200,60 0,60" fill="var(--wf-accent-soft)" stroke="none"/>
  </svg>
);

const KpiA = () => (
  <div style={{ flex: 1, display: 'flex', height: '100%' }}>
    <Sidebar active={0} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <PageBar title="Tableau de bord" sub="Direction · Semaine 19" actions={[{ l: 'Jour' }, { l: 'Semaine', primary: false }, { l: 'Mois' }, { l: 'Exporter' }]} />
      <div style={{ padding: 24, display: 'grid', gap: 16, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <Kpi l="Courses semaine" v="187" d="↑ 12 vs S-1" />
        <Kpi l="Trajets réalisés" v="96,3 %" d="objectif 95 %" />
        <Kpi l="Voyageurs / jour" v="271" d="L4 · mars 2026" />
        <Kpi l="Ponctualité" v="94,2 %" d="retards >10 mn : 18" />
      </div>
      <div style={{ padding: '0 24px 24px', display: 'grid', gap: 16, gridTemplateColumns: '2fr 1fr' }}>
        <div className="wf-box" style={{ padding: 16, background: '#fff' }}>
          <Eyebrow>Chiffre d'affaire semaine/mois/année</Eyebrow>
          <Sparkline />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--wf-stroke-2)', marginTop: 4 }}>
            {DAYS.map(d => <span key={d}>{d.split(' ')[0]}</span>)}
          </div>
        </div>
        <div className="wf-box" style={{ padding: 16, background: '#fff' }}>
          <Eyebrow>Trajets non effectués · mars 2026</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700 }}>24</div>
            <span style={{ fontSize: 11, color: 'var(--wf-stroke-2)' }}>panne véhicule = cause #1</span>
          </div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              ['Voiture en panne',     9, 'var(--wf-danger)'],
              ['Absence chauffeur',    7, 'var(--wf-warn)'],
              ['Météo / route bloquée', 5, '#3A6EA5'],
              ['Autre',                3, 'var(--wf-stroke-2)'],
            ].map(([l, n, c]) => (
              <div key={l} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 26px', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <span>{l}</span>
                <div style={{ height: 8, background: 'var(--wf-stroke-4)', borderRadius: 2, position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 0, width: `${(n / 9) * 100}%`, background: c, borderRadius: 2 }} />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, textAlign: 'right' }}>{n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ padding: '0 24px 24px' }}>
        <div className="wf-box" style={{ padding: 16, background: '#fff' }}>
          <Eyebrow>Trajets réalisés par chauffeur · L4 · mars 2026</Eyebrow>
          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            {[
              ['C1 · EL ANZIZE Hamada', 84],
              ['C14 · MANSOUR Kamardine', 81],
              ['C8 · HADHURAMI Makinedine', 78],
              ['C5 · AHAMADI Raenmouddine', 72],
              ['C6 · OUSSENI Soula', 70],
              ['C10 · ADINANI Zoubert', 65],
            ].map(([dr, n], i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '220px 1fr 60px', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12 }}>{dr}</span>
                <div style={{ height: 14, background: 'var(--wf-stroke-4)', borderRadius: 3 }}>
                  <div style={{ width: `${(n / 84) * 100}%`, height: '100%', background: 'var(--wf-stroke)', borderRadius: 3 }} />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, textAlign: 'right' }}>{n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const KpiB = () => (
  <div style={{ flex: 1, display: 'flex', height: '100%' }}>
    <Sidebar active={0} mode="rail" />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', background: 'var(--wf-paper)' }}>
      <PageBar title="Vue d'ensemble" sub="Direction" actions={[{ l: 'Personnaliser' }]} />
      {/* Hero KPI */}
      <div style={{ padding: 24 }}>
        <div className="wf-box" style={{ padding: 24, background: 'var(--wf-stroke)', color: '#fff', borderColor: 'var(--wf-stroke)' }}>
          <Eyebrow color="rgba(255,255,255,0.55)">Voyageurs transportés · mars 2026</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, marginTop: 8 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 56, fontWeight: 700, lineHeight: 1 }}>8 412</div>
            <div style={{ paddingBottom: 8, fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--wf-accent)' }}>L4 · 271 / jour</div>
          </div>
          <div style={{ marginTop: 18, height: 80 }}><Sparkline /></div>
        </div>
      </div>
      <div style={{ padding: '0 24px 24px', display: 'grid', gap: 16, gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <Kpi l="Trajets réalisés" v="618" d="sur 642 · 96,3 %" big />
        <Kpi l="Ponctualité" v="94,2 %" d="retards >10 mn : 18" big />
        <Kpi l="Pass. moy / trajet" v="13,6" d="objectif 13" big />
      </div>
      <div style={{ padding: '0 24px 24px', display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
        <div className="wf-box" style={{ padding: 16, background: '#fff' }}>
          <Eyebrow>Top chauffeurs · voyageurs L4</Eyebrow>
          {[
            ['C1 · EL ANZIZE Hamada', 1148],
            ['C14 · MANSOUR Kamardine', 1102],
            ['C8 · HADHURAMI Makinedine', 1056],
            ['C5 · AHAMADI Raenmouddine', 982],
          ].map(([dr, n], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 3 ? '1px dashed var(--wf-stroke-3)' : 'none', alignItems: 'center' }}>
              <span style={{ fontSize: 13 }}>{dr}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{n.toLocaleString('fr-FR')} pass.</span>
            </div>
          ))}
        </div>
        <div className="wf-box" style={{ padding: 16, background: '#fff' }}>
          <Eyebrow>Trajets non effectués · 30 j</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 700 }}>24</div>
            <div style={{ fontSize: 11, color: 'var(--wf-stroke-2)' }}>dont 9 panne véhicule</div>
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 4 }}>
            {[3,1,0,2,1,0,1].map((n, i) => (
              <div key={i} style={{ flex: 1, height: 60, position: 'relative', background: 'var(--wf-stroke-4)', borderRadius: 2 }}>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${n * 18}%`, background: 'var(--wf-danger)', borderRadius: 2 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const KpiC = () => (
  <div style={{ flex: 1, display: 'flex', height: '100%' }}>
    <Sidebar active={0} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <PageBar title="KPI temps réel" sub="Direction · live" actions={[{ l: 'Pause' }, { l: 'Plein écran' }]} />
      <div style={{ padding: '14px 24px 0', display: 'flex', gap: 6 }}>
        {['Aujourd\'hui','Cette semaine','Ce mois','Cette année'].map((p, i) => (
          <div key={p} className="wf-pill" style={{
            background: i === 0 ? 'var(--wf-accent)' : '#fff',
            color: i === 0 ? '#fff' : 'var(--wf-stroke)',
            borderColor: i === 0 ? 'var(--wf-accent)' : 'var(--wf-stroke-3)',
          }}>{p}</div>
        ))}
      </div>
      {/* big tile grid */}
      <div style={{ padding: 24, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(6, 1fr)', gridTemplateRows: 'repeat(3, 1fr)', flex: 1 }}>
        <div className="wf-box" style={{ gridColumn: 'span 3', gridRow: 'span 2', padding: 18, background: '#fff', display: 'flex', flexDirection: 'column' }}>
          <Eyebrow>Voyageurs aujourd'hui · L4</Eyebrow>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 64, fontWeight: 700, marginTop: 8 }}>284</div>
          <div style={{ marginTop: 'auto' }}><Sparkline /></div>
        </div>
        <div className="wf-box" style={{ gridColumn: 'span 3', padding: 16 }}><Eyebrow>Trajets en cours</Eyebrow><div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 700 }}>4</div></div>
        <div className="wf-box" style={{ gridColumn: 'span 3', padding: 16 }}><Eyebrow>Chauffeurs opérationnels</Eyebrow><div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 700 }}>17 / 23</div></div>
        <div className="wf-box" style={{ gridColumn: 'span 2', padding: 14 }}><Eyebrow>Pass. transportés</Eyebrow><div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 700 }}>284</div></div>
        <div className="wf-box" style={{ gridColumn: 'span 2', padding: 14 }}><Eyebrow>Trajets réalisés</Eyebrow><div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 700 }}>21 / 22</div></div>
        <div className="wf-box" style={{ gridColumn: 'span 2', padding: 14, background: 'var(--wf-danger)', color: '#fff', borderColor: 'var(--wf-danger)' }}><Eyebrow color="rgba(255,255,255,0.7)">Trajets non effectués</Eyebrow><div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 700 }}>1</div><div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>cause: panne véhicule</div></div>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────
// 3 ▸ CARTE GPS — three layouts
// ─────────────────────────────────────────────────────────────────────
// Carte stylisée de Mayotte (Grande-Terre + Petite-Terre) axée sur les zones desservies
const MapBg = ({ dark = false }) => (
  <div style={{
    position: 'absolute', inset: 0,
    background: dark ? '#1a1d24' : '#eef0f3',
    overflow: 'hidden',
  }}>
    <svg viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      {/* Lagon */}
      <defs>
        <pattern id="lagon" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M0 12 Q6 8 12 12 T24 12" fill="none" stroke={dark ? 'rgba(160,200,230,0.10)' : 'rgba(120,170,200,0.18)'} strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="1000" height="700" fill={dark ? '#1a1d24' : '#dfe7ec'} />
      <rect width="1000" height="700" fill="url(#lagon)" />

      {/* Barrière de corail (silhouette extérieure du lagon) */}
      <path d="M 80 380 Q 60 240 180 140 Q 320 70 480 90 Q 640 110 760 200 Q 880 300 880 440 Q 880 580 740 620 Q 580 660 420 620 Q 240 580 130 500 Q 70 440 80 380 Z"
        fill="none" stroke={dark ? 'rgba(120,180,210,0.22)' : 'rgba(100,160,190,0.45)'} strokeWidth="1.5" strokeDasharray="4 6" />

      {/* GRANDE-TERRE — silhouette simplifiée (orientée nord en haut) */}
      <path d="M 290 130 Q 360 110 410 145 Q 460 175 470 230 Q 480 280 460 320 L 480 360 Q 510 400 500 460 Q 490 510 460 540 Q 440 565 400 575 Q 360 580 330 555 Q 295 525 285 480 Q 270 440 285 405 Q 270 380 280 340 Q 250 310 245 270 Q 240 220 260 180 Q 275 145 290 130 Z"
        fill={dark ? '#2a2e38' : '#cdd6c8'} stroke={dark ? '#3b4250' : '#a8b3a3'} strokeWidth="1.5" />

      {/* PETITE-TERRE */}
      <path d="M 600 240 Q 640 230 660 250 Q 670 280 655 305 Q 640 320 615 315 Q 595 305 590 285 Q 585 260 600 240 Z"
        fill={dark ? '#2a2e38' : '#cdd6c8'} stroke={dark ? '#3b4250' : '#a8b3a3'} strokeWidth="1.5" />

      {/* Routes principales */}
      {/* RN1 côte est : Mamoudzou → Tsoundzou → Passamainty → Vahibe (sud) */}
      <path d="M 410 250 L 425 290 L 440 340 L 425 395 L 395 450 L 360 490"
        fill="none" stroke={dark ? 'rgba(255,255,255,0.32)' : 'rgba(80,80,80,0.55)'} strokeWidth="2.5" />
      {/* RN2 / Doujani → Passot Barge (Mamoudzou) */}
      <path d="M 380 415 L 395 380 L 412 340 L 422 295 L 415 250"
        fill="none" stroke={dark ? 'rgba(255,255,255,0.32)' : 'rgba(80,80,80,0.55)'} strokeWidth="2.5" />
      {/* Route intérieure / nord */}
      <path d="M 305 200 Q 350 215 400 230"
        fill="none" stroke={dark ? 'rgba(255,255,255,0.18)' : 'rgba(80,80,80,0.30)'} strokeWidth="1.8" />
      {/* Liaison maritime barge — Mamoudzou ↔ Petite-Terre */}
      <path d="M 425 270 Q 510 250 600 270"
        fill="none" stroke={dark ? 'rgba(160,200,230,0.5)' : 'rgba(80,140,180,0.6)'} strokeWidth="1.5" strokeDasharray="3 4" />

      {/* Labels villes */}
      {[
        { x: 408, y: 244, t: 'MAMOUDZOU' },
        { x: 380, y: 415, t: 'DOUJANI' },
        { x: 415, y: 270, t: 'PASSOT' },
        { x: 425, y: 350, t: "M'TSAPERE" },
        { x: 405, y: 395, t: 'TSOUNDZOU' },
        { x: 395, y: 450, t: 'PASSAMAINTY' },
        { x: 350, y: 495, t: 'VAHIBE' },
        { x: 625, y: 285, t: 'PETITE-TERRE' },
        { x: 305, y: 175, t: 'KOUNGOU' },
      ].map(({ x, y, t }) => (
        <text key={t} x={x} y={y} fontSize="9" fontFamily="ui-monospace, monospace"
          fill={dark ? 'rgba(255,255,255,0.55)' : 'rgba(60,60,60,0.65)'} letterSpacing="0.5">{t}</text>
      ))}

      {/* Boussole */}
      <g transform="translate(890, 60)" opacity={dark ? 0.5 : 0.55}>
        <circle r="18" fill="none" stroke={dark ? 'rgba(255,255,255,0.4)' : 'rgba(60,60,60,0.5)'} strokeWidth="1" />
        <path d="M 0 -16 L 4 0 L 0 4 L -4 0 Z" fill={dark ? 'rgba(255,255,255,0.6)' : 'rgba(60,60,60,0.7)'} />
        <text x="0" y="-22" textAnchor="middle" fontSize="9" fontFamily="ui-monospace, monospace" fill={dark ? 'rgba(255,255,255,0.5)' : 'rgba(60,60,60,0.6)'}>N</text>
      </g>

      {/* Échelle */}
      <g transform="translate(40, 660)" opacity="0.6">
        <line x1="0" y1="0" x2="80" y2="0" stroke={dark ? 'rgba(255,255,255,0.5)' : 'rgba(60,60,60,0.6)'} strokeWidth="1.5" />
        <line x1="0" y1="-3" x2="0" y2="3" stroke={dark ? 'rgba(255,255,255,0.5)' : 'rgba(60,60,60,0.6)'} strokeWidth="1.5" />
        <line x1="80" y1="-3" x2="80" y2="3" stroke={dark ? 'rgba(255,255,255,0.5)' : 'rgba(60,60,60,0.6)'} strokeWidth="1.5" />
        <text x="40" y="-6" textAnchor="middle" fontSize="9" fontFamily="ui-monospace, monospace" fill={dark ? 'rgba(255,255,255,0.5)' : 'rgba(60,60,60,0.6)'}>5 km</text>
      </g>
    </svg>
  </div>
);

const TaxiPin = ({ left, top, kind = 'live', label }) => {
  const c = kind === 'live' ? '#2e8b57' : kind === 'late' ? '#e8a523' : kind === 'offline' ? '#817A7C' : 'var(--wf-accent)';
  return (
    <div style={{ position: 'absolute', left, top, transform: 'translate(-50%, -100%)', textAlign: 'center' }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: c, border: '2.5px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
        fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
      }}>{label}</div>
      <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: `8px solid ${c}`, margin: '0 auto' }} />
    </div>
  );
};

const MapA = () => (
  <div style={{ flex: 1, display: 'flex', height: '100%' }}>
    <Sidebar active={2} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <PageBar title="Carte temps réel" sub="L3 + L4 · 6 chauffeurs en service" actions={[{ l: 'Live', primary: true }, { l: 'Historique' }]} />
      <div style={{ flex: 1, display: 'flex' }}>
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <MapBg />
          <TaxiPin left="41%" top="36%" kind="live" label="D1" />
          <TaxiPin left="38%" top="59%" kind="live" label="D5" />
          <TaxiPin left="40%" top="50%" kind="late" label="D7" />
          <TaxiPin left="39%" top="65%" kind="live" label="D12" />
          <TaxiPin left="35%" top="71%" kind="offline" label="C5" />
          <TaxiPin left="62%" top="40%" kind="live" label="C14" />
          {/* zoom controls */}
          <div style={{ position: 'absolute', right: 16, top: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className="tap-btn" style={{ width: 36, height: 36, fontSize: 18, background: '#fff' }}>+</div>
            <div className="tap-btn" style={{ width: 36, height: 36, fontSize: 18, background: '#fff' }}>−</div>
            <div className="tap-btn" style={{ width: 36, height: 36, fontSize: 14, background: '#fff' }}>⊕</div>
          </div>
          {/* legend */}
          <div className="wf-box" style={{ position: 'absolute', left: 16, bottom: 16, padding: 10, fontSize: 11, background: 'rgba(255,255,255,0.95)' }}>
            <Eyebrow>Légende</Eyebrow>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#2e8b57', marginRight: 6 }}></span>En cours</span>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#e8a523', marginRight: 6 }}></span>Retard</span>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#817A7C', marginRight: 6 }}></span>Hors-ligne</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const MapB = () => (
  <div style={{ flex: 1, display: 'flex', height: '100%' }}>
    <Sidebar active={2} mode="rail" />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 24px', borderBottom: '1.5px solid #393536', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--wf-stroke)', color: '#fff' }}>
        <div>
          <Eyebrow color="rgba(255,255,255,0.55)">Mode opérationnel · live</Eyebrow>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 18, fontWeight: 700 }}>Carte sombre</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="tap-btn" style={{ padding: '6px 14px', height: 32, fontSize: 12, background: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>Live</div>
          <div className="tap-btn" style={{ padding: '6px 14px', height: 32, fontSize: 12, background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>Historique</div>
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <MapBg dark />
        <TaxiPin left="41%" top="36%" kind="live" label="D1" />
        <TaxiPin left="38%" top="59%" kind="live" label="D5" />
        <TaxiPin left="40%" top="50%" kind="late" label="D7" />
        <TaxiPin left="39%" top="65%" kind="live" label="D12" />
        <TaxiPin left="35%" top="71%" kind="offline" label="C5" />
        <TaxiPin left="62%" top="40%" kind="live" label="C14" />
        {/* live KPI overlay */}
        <div style={{ position: 'absolute', left: 16, top: 16, display: 'flex', gap: 10 }}>
          {[['Live', '4'], ['Retard', '1'], ['Off', '1']].map(([l, v], i) => (
            <div key={i} style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '8px 14px', borderRadius: 6, fontFamily: 'var(--font-mono)' }}>
              <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>{l}</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const MapC = () => (
  <div style={{ flex: 1, display: 'flex', height: '100%' }}>
    <Sidebar active={2} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <PageBar title="Replay · D1 MOHAMED Ali · Vendredi 8 mai" sub="Direction · historique trajectoire L3" actions={[{ l: 'Retour live' }, { l: 'Exporter GPX' }]} />
      <div style={{ flex: 1, display: 'flex' }}>
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <MapBg />
          {/* trajectoire D1 — DOUJANI → PASSOT BARGE */}
          <svg viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <path d="M 380 415 L 395 380 L 412 340 Q 420 305 415 270 L 415 250" stroke="var(--wf-accent)" strokeWidth="4" fill="none" strokeDasharray="0" />
            <circle cx="380" cy="415" r="8" fill="var(--wf-success)" stroke="#fff" strokeWidth="2.5" />
            <circle cx="415" cy="250" r="5" fill="#fff" stroke="var(--wf-accent)" strokeWidth="2" />
            <circle cx="412" cy="340" r="5" fill="#fff" stroke="var(--wf-accent)" strokeWidth="2" />
            {/* incident marker (5:34 voie bloquée) */}
            <circle cx="395" cy="380" r="7" fill="var(--wf-danger)" stroke="#fff" strokeWidth="2.5" />
          </svg>
          {/* time scrubber */}
          <div className="wf-box" style={{ position: 'absolute', left: 16, right: 16, bottom: 16, padding: 14, background: 'rgba(255,255,255,0.96)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Eyebrow>Lecture · 11:42</Eyebrow>
              <div style={{ display: 'flex', gap: 4 }}>
                <div className="tap-btn" style={{ width: 32, height: 32, fontSize: 12 }}>◀◀</div>
                <div className="tap-btn tap-btn-accent" style={{ width: 36, height: 32, fontSize: 12 }}>▶</div>
                <div className="tap-btn" style={{ width: 32, height: 32, fontSize: 12 }}>▶▶</div>
                <div className="tap-btn" style={{ width: 36, height: 32, fontSize: 11 }}>×2</div>
              </div>
            </div>
            <div style={{ height: 8, background: 'var(--wf-stroke-4)', borderRadius: 999, position: 'relative' }}>
              <div style={{ width: '52%', height: '100%', background: 'var(--wf-accent)', borderRadius: 999 }} />
              <div style={{ position: 'absolute', left: '52%', top: '50%', transform: 'translate(-50%, -50%)', width: 16, height: 16, borderRadius: '50%', background: '#fff', border: '2.5px solid var(--wf-accent)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--wf-stroke-2)', marginTop: 4 }}>
              <span>06:00</span><span>10:00</span><span>14:00</span><span>18:00</span><span>22:00</span>
            </div>
          </div>
        </div>
        {/* events panel */}
        <div style={{ width: 280, borderLeft: '1.5px solid var(--wf-stroke)', overflow: 'auto', padding: 14 }}>
          <Eyebrow>Évènements · 12</Eyebrow>
          {[
            ['5:00', 'Départ DOUJANI', 'done'],
            ['5:30', 'Arrivée Passot Barge', 'done'],
            ['5:34', 'Trajet non effectué · voie bloquée', 'incident'],
            ['6:00', 'Reprise depuis DOUJANI', 'done'],
            ['8:30', 'Position actuelle · PEM', 'live'],
          ].map(([t, n, k], i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px dashed var(--wf-stroke-3)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--wf-stroke-2)', width: 38 }}>{t}</span>
              <span style={{ flex: 1, fontSize: 12 }}>{n}</span>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: k === 'incident' ? 'var(--wf-danger)' : k === 'live' ? 'var(--wf-accent)' : 'var(--wf-success)', marginTop: 6 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────
// 4 ▸ FACTURES — three layouts
// ─────────────────────────────────────────────────────────────────────
const Status = ({ s }) => {
  const map = { brouillon: ['Reçue', 'planned'], valide: ['Validé', 'live'], paye: ['Payé', 'done'] };
  const [l, k] = map[s] || ['?', 'planned'];
  return <span className={`wf-pill is-${k}`}><span className="dot"/>{l}</span>;
};

const InvoicesA = () => (
  <div style={{ flex: 1, display: 'flex', height: '100%' }}>
    <Sidebar active={5} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <PageBar title="Factures chauffeurs → Taxi Vanille" sub="Direction · 12 à valider · mai 2026" actions={[{ l: 'Filtrer' }, { l: 'Récupérer S-1', primary: true }]} />
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <div className="wf-box" style={{ background: '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid var(--wf-stroke)', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--wf-stroke-2)' }}>
                <th style={{ padding: '12px 14px' }}>N°</th>
                <th>Chauffeur</th><th>Période</th><th>Montant</th><th>Statut</th><th></th>
              </tr>
            </thead>
            <tbody>
              {[
                ['F2026-0142', 'D1 · MOHAMED Ali', 'S18', '1 240,00', 'paye'],
                ['F2026-0143', 'D5 · AMINA Selemani', 'S18', '1 380,50', 'paye'],
                ['F2026-0144', 'D7 · COMBO Said', 'S18', '980,00', 'valide'],
                ['F2026-0145', 'D12 · VELOU M\'Berou', 'S18', '1 100,00', 'valide'],
                ['F2026-0146', 'C1 · EL ANZIZE Hamada', 'S19', '1 850,00', 'brouillon'],
                ['F2026-0147', 'C14 · MANSOUR Kamardine', 'S19', '1 410,00', 'brouillon'],
                ['F2026-0148', 'C8 · HADHURAMI Makinedine', 'S19', '1 320,00', 'brouillon'],
                ['F2026-0149', 'C5 · AHAMADI Raenmouddine', 'S19', '1 180,00', 'brouillon'],
              ].map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px dashed var(--wf-stroke-3)' }}>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{r[0]}</td>
                  <td>{r[1]}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{r[2]}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{r[3]} €</td>
                  <td><Status s={r[4]} /></td>
                  <td style={{ textAlign: 'right', paddingRight: 14 }}>
                    {r[4] === 'brouillon'
                      ? <span className="wf-hand-note" style={{ fontSize: 14 }}>✓ valider · payer</span>
                      : <span style={{ fontSize: 11, color: 'var(--wf-stroke-2)' }}>PDF · ⤓</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);

const InvoicesB = () => (
  <div style={{ flex: 1, display: 'flex', height: '100%' }}>
    <Sidebar active={5} />
    <div style={{ flex: 1, display: 'flex' }}>
      <div style={{ width: 320, borderRight: '1.5px solid var(--wf-stroke)', display: 'flex', flexDirection: 'column' }}>
        <PageBar title="12 factures reçues" sub="S19 · à valider" />
        <div style={{ flex: 1, overflow: 'auto' }}>
          {[
            ['F2026-0146', 'C1 · EL ANZIZE Hamada', '1 850,00', 'brouillon', true],
            ['F2026-0147', 'C14 · MANSOUR Kamardine', '1 410,00', 'brouillon'],
            ['F2026-0148', 'C8 · HADHURAMI Makinedine', '1 320,00', 'brouillon'],
            ['F2026-0149', 'C5 · AHAMADI Raenmouddine', '1 180,00', 'brouillon'],
            ['F2026-0144', 'D7 · COMBO Said', '980,00', 'valide'],
            ['F2026-0142', 'D1 · MOHAMED Ali', '1 240,00', 'paye'],
          ].map((r, i) => (
            <div key={i} style={{
              padding: '12px 16px', borderBottom: '1px dashed var(--wf-stroke-3)',
              background: r[4] ? 'var(--wf-accent-soft)' : 'transparent',
              borderLeft: r[4] ? '4px solid var(--wf-accent)' : '4px solid transparent',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12 }}>{r[0]}</div>
              <div style={{ fontSize: 13, marginTop: 2 }}>{r[1]}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, alignItems: 'center' }}>
                <Status s={r[3]} />
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13 }}>{r[2]} €</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Detail */}
      <div style={{ flex: 1, padding: 24, background: 'var(--wf-paper)', overflow: 'auto' }}>
        <div className="wf-box" style={{ background: '#fff', padding: 28, maxWidth: 700 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1.5px solid var(--wf-stroke)', paddingBottom: 14 }}>
            <div>
              <Eyebrow>Facture chauffeur</Eyebrow>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 22, marginTop: 4 }}>F2026-0146</div>
              <div style={{ fontSize: 12, color: 'var(--wf-stroke-2)' }}>Émise le 06/05/2026</div>
            </div>
            <Status s="brouillon" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, paddingTop: 18 }}>
            <div>
              <Eyebrow>De · Émetteur</Eyebrow>
              <div style={{ marginTop: 4, fontWeight: 600 }}>EL ANZIZE Hamada · C1</div>
              <div style={{ fontSize: 12, color: 'var(--wf-stroke-2)', marginTop: 2 }}>Ligne 4 · Vahibe ↔ Passamainty</div>
              <div style={{ fontSize: 12, color: 'var(--wf-stroke-2)' }}>Véhicule TV1 · 0639 22 81 28</div>
              <div style={{ fontSize: 11, color: 'var(--wf-stroke-2)', marginTop: 6 }}>SIRET chauffeur —</div>
            </div>
            <div>
              <Eyebrow>À · Destinataire</Eyebrow>
              <div style={{ marginTop: 4, fontWeight: 600 }}>Taxi Vanille SAS</div>
              <div style={{ fontSize: 12, color: 'var(--wf-stroke-2)', marginTop: 2 }}>Mamoudzou · Mayotte</div>
              <div style={{ fontSize: 12, color: 'var(--wf-stroke-2)' }}>SIRET 901 234 567 00012</div>
            </div>
          </div>
          <div style={{ marginTop: 18 }}>
            <Eyebrow>Détail · semaine 19 (4-10 mai) — prestation chauffeur</Eyebrow>
            <table style={{ width: '100%', fontSize: 13, marginTop: 8, borderCollapse: 'collapse' }}>
              <tbody>
                {[['52 trajets réalisés', '—', '2 080,00 €'], ['Forfait carburant (refacturation)', '+', '120,00 €'], ['Indemnité astreinte dimanche', '+', '150,00 €']].map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px dashed var(--wf-stroke-3)' }}>
                    <td style={{ padding: '10px 0' }}>{r[0]}</td>
                    <td style={{ width: 30, textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--wf-stroke-2)' }}>{r[1]}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{r[2]}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ padding: '14px 0', fontWeight: 700 }}>Net à payer par Taxi Vanille</td><td/>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700 }}>2 350,00 €</td>
                </tr>
              </tbody>
            </table>
            <div style={{ fontSize: 11, color: 'var(--wf-stroke-2)', marginTop: 8 }}>TVA non applicable — art. 293 B du CGI · Règlement à 30 jours par virement</div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <div className="tap-btn" style={{ flex: 1, height: 40, fontSize: 13 }}>Modifier</div>
            <div className="tap-btn" style={{ flex: 1, height: 40, fontSize: 13 }}>Aperçu PDF</div>
            <div className="tap-btn tap-btn-accent" style={{ flex: 2, height: 40, fontSize: 13 }}>Valider — mettre en paiement</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const InvoicesC = () => (
  <div style={{ flex: 1, display: 'flex', height: '100%' }}>
    <Sidebar active={5} mode="rail" />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <PageBar title="Factures reçues · vue Kanban" sub="Direction · S19 · chauffeurs → Taxi Vanille" actions={[{ l: 'Liste' }, { l: 'Tout valider', primary: true }]} />
      <div style={{ flex: 1, padding: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, overflow: 'auto' }}>
        {[
          ['Reçue · à valider', 'brouillon', 8, ['F0146', 'F0147', 'F0148', 'F0149']],
          ['Validée · à payer', 'valide', 3, ['F0144', 'F0145']],
          ['Payée', 'paye', 12, ['F0142', 'F0143']],
        ].map(([title, s, n, items], i) => (
          <div key={i} className="wf-box" style={{ padding: 14, background: 'var(--wf-paper)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Eyebrow>{title}</Eyebrow>
              <span className="wf-pill" style={{ fontSize: 10 }}>{n}</span>
            </div>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((it, k) => (
                <div key={k} className="wf-box" style={{ padding: 12, background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12 }}>{it}</span>
                    <Status s={s} />
                  </div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>{['C1 · EL ANZIZE','D5 · AMINA','C14 · MANSOUR','D7 · COMBO'][k % 4]}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, marginTop: 4 }}>{(1100 + k * 80).toLocaleString('fr-FR')},00 €</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────
// 5 ▸ CHAUFFEURS — three layouts
// ─────────────────────────────────────────────────────────────────────
const DriversA = () => (
  <div style={{ flex: 1, display: 'flex', height: '100%' }}>
    <Sidebar active={3} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <PageBar title="Chauffeurs · 23" sub="L3 (13) + L4 (10) · Direction" actions={[{ l: 'Filtrer' }, { l: '+ Nouveau', primary: true }]} />
      <div style={{ flex: 1, padding: 24, overflow: 'auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[...L3_DRIVERS, ...L4_DRIVERS].slice(0, 12).map((d, i) => (
          <div key={i} className="wf-box" style={{ padding: 16, background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--wf-paper-2)', border: '1.25px solid var(--wf-stroke-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13 }}>{d.code}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{d.nom} {d.prenom}</div>
                <div style={{ fontSize: 11, color: 'var(--wf-stroke-2)' }}>{d.code.startsWith('D') ? 'Ligne 3' : 'Ligne 4'} · {d.secteur} · véh. {d.vehicule}</div>
              </div>
              <span className={`wf-pill is-${i % 3 === 0 ? 'live' : 'planned'}`} style={{ marginLeft: 'auto', fontSize: 9 }}><span className="dot"/>{i % 3 === 0 ? 'Actif' : 'Repos'}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 14 }}>
              <div><Eyebrow>S19</Eyebrow><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, marginTop: 2 }}>{12 + i * 2}c</div></div>
              <div><Eyebrow>Pass.</Eyebrow><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, marginTop: 2 }}>{38 + i * 4}</div></div>
              <div><Eyebrow>CA</Eyebrow><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, marginTop: 2 }}>{1.3 + i * 0.2}k €</div></div>
            </div>
            <div className="wf-divider" style={{ margin: '14px 0' }} />
            <div style={{ display: 'flex', gap: 6 }}>
              <div className="tap-btn" style={{ flex: 1, height: 30, fontSize: 11 }}>Voir</div>
              <div className="tap-btn" style={{ flex: 1, height: 30, fontSize: 11 }}>Planning</div>
              <div className="tap-btn" style={{ flex: 1, height: 30, fontSize: 11 }}>Factures</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const DriversB = () => (
  <div style={{ flex: 1, display: 'flex', height: '100%' }}>
    <Sidebar active={3} />
    <div style={{ flex: 1, display: 'flex' }}>
      <div style={{ width: 280, borderRight: '1.5px solid var(--wf-stroke)', display: 'flex', flexDirection: 'column' }}>
        <PageBar title="Chauffeurs" sub="8 actifs" />
        <div className="wf-box" style={{ margin: 12, padding: 8, background: '#fff' }}>
          <input placeholder="Rechercher…" style={{ width: '100%', border: 'none', outline: 'none', fontSize: 13 }} disabled />
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {DRIVERS.map((dr, i) => (
            <div key={i} style={{
              padding: '12px 16px', borderBottom: '1px dashed var(--wf-stroke-3)',
              background: i === 0 ? 'var(--wf-accent-soft)' : 'transparent',
              borderLeft: i === 0 ? '4px solid var(--wf-accent)' : '4px solid transparent',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--wf-paper-2)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{dr}</div>
                <div style={{ fontSize: 10, color: 'var(--wf-stroke-2)' }}>{i % 2 === 0 ? 'En ligne' : 'Repos'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', background: 'var(--wf-paper)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1.5px solid var(--wf-stroke)', background: '#fff', display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--wf-paper-2)', border: '1.25px solid var(--wf-stroke-3)' }} />
          <div style={{ flex: 1 }}>
            <Eyebrow>Chauffeur D1 · Ligne 3</Eyebrow>
            <div style={{ fontWeight: 700, fontSize: 22, marginTop: 2 }}>MOHAMED Ali (laglace)</div>
            <div style={{ fontSize: 12, color: 'var(--wf-stroke-2)' }}>Mamoudzou · Journée · Véhicule TV1 · 06 39 40 35 35</div>
          </div>
          <div className="tap-btn" style={{ padding: '6px 14px', height: 32, fontSize: 12 }}>Modifier</div>
          <div className="tap-btn tap-btn-accent" style={{ padding: '6px 14px', height: 32, fontSize: 12 }}>Voir factures</div>
        </div>
        <div style={{ padding: 24, display: 'grid', gap: 16, gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <Kpi l="S19 — Courses" v="18" d="↑ 2 vs S-1" />
          <Kpi l="S19 — Pass." v="62" d="moy 14,2 / j" />
          <Kpi l="S19 — CA" v="1 850 €" d="↑ 6 %" />
          <Kpi l="Incidents 30j" v="1" d="voie bloquée" />
        </div>
        <div style={{ padding: '0 24px 24px', display: 'grid', gap: 16, gridTemplateColumns: '2fr 1fr' }}>
          <div className="wf-box" style={{ padding: 16, background: '#fff' }}>
            <Eyebrow>Activité 12 dernières semaines</Eyebrow>
            <Sparkline />
          </div>
          <div className="wf-box" style={{ padding: 16, background: '#fff' }}>
            <Eyebrow>Documents</Eyebrow>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Permis B</span><span style={{ color: 'var(--wf-success)' }}>✓ valide</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Carte pro VTC</span><span style={{ color: 'var(--wf-warn)' }}>⚠ exp. 09/26</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Visite médicale</span><span style={{ color: 'var(--wf-success)' }}>✓ valide</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const DriversC = () => (
  <div style={{ flex: 1, display: 'flex', height: '100%' }}>
    <Sidebar active={3} mode="rail" />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <PageBar title="Chauffeurs · vue tableau" sub="Direction" actions={[{ l: 'Exporter' }, { l: '+ Ajouter', primary: true }]} />
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <div className="wf-box" style={{ background: '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid var(--wf-stroke)', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--wf-stroke-2)' }}>
                {['ID', 'Nom', 'Statut', 'S19 c.', 'S19 km', 'S19 €', 'Documents', ''].map(h => (
                  <th key={h} style={{ padding: '12px 14px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...L3_DRIVERS, ...L4_DRIVERS].map((d, i) => (
                <tr key={i} style={{ borderBottom: '1px dashed var(--wf-stroke-3)' }}>
                  <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{d.code}</td>
                  <td>{d.nom} {d.prenom}</td>
                  <td><span className={`wf-pill is-${i % 3 === 0 ? 'live' : i % 4 === 0 ? 'late' : 'planned'}`} style={{ fontSize: 9 }}><span className="dot"/>{i % 3 === 0 ? 'Actif' : 'Repos'}</span></td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{12 + i * 2}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{180 + i * 22}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{(1300 + i * 110).toLocaleString('fr-FR')}</td>
                  <td>{i === 1 ? <span style={{ color: 'var(--wf-warn)', fontSize: 11 }}>⚠ 1 expire</span> : <span style={{ color: 'var(--wf-success)', fontSize: 11 }}>✓</span>}</td>
                  <td style={{ textAlign: 'right' }}><span className="wf-hand-note" style={{ fontSize: 14 }}>voir →</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────
// 6 ▸ RAPPORTS CLIENTS — three layouts
// ─────────────────────────────────────────────────────────────────────
const ReportsA = () => (
  <div style={{ flex: 1, display: 'flex', height: '100%' }}>
    <Sidebar active={6} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <PageBar title="Rapports clients institutionnels" sub="Direction · 14 clients" actions={[{ l: 'Période · Avril 2026' }, { l: 'Exporter PDF' }, { l: 'Excel', primary: true }]} />
      <div style={{ flex: 1, padding: 24, display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, overflow: 'hidden' }}>
        <div className="wf-box" style={{ background: '#fff', padding: 12, overflow: 'auto' }}>
          <Eyebrow>Clients</Eyebrow>
          {[
            { nom: 'CADEMA — Ligne 3', sub: 'Doujani ↔ Passot Barge', n: 618 },
            { nom: 'CADEMA — Ligne 4', sub: 'Vahibe ↔ Passamainty', n: 642 },
            { nom: 'CHM Petite-Terre', sub: 'Barge ↔ Hopital', n: 284 },
          ].map((c, i) => (
            <div key={c.nom} style={{
              padding: '12px 8px', borderBottom: '1px dashed var(--wf-stroke-3)',
              background: i === 1 ? 'var(--wf-accent-soft)' : 'transparent',
              borderLeft: i === 1 ? '3px solid var(--wf-accent)' : '3px solid transparent',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontWeight: i === 1 ? 700 : 600, fontSize: 13 }}>{c.nom}</div>
                <div style={{ fontSize: 10, color: 'var(--wf-stroke-2)' }}>{c.sub}</div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--wf-stroke-2)' }}>{c.n}t</span>
            </div>
          ))}
        </div>
        <div style={{ overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="wf-box" style={{ background: '#fff', padding: 18 }}>
            <Eyebrow>CADEMA — Ligne 4 · Mars 2026</Eyebrow>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 700, marginTop: 4 }}>618 trajets effectués · 8 412 voyageurs · 96,3 % réalisation</div>
          </div>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <Kpi l="Trajets théoriques" v="642" d="• 24 non eff." />
            <Kpi l="Ponctualité" v="94,2 %" d="18 retards >10mn" />
            <Kpi l="Voy. moy / trajet" v="13,6" d="obj 12,0" />
            <Kpi l="Voy. moy / jour" v="271" d="31 j" />
          </div>
          <div className="wf-box" style={{ background: '#fff', padding: 18 }}>
            <Eyebrow>Détail par chauffeur</Eyebrow>
            <table style={{ width: '100%', fontSize: 12, marginTop: 8, borderCollapse: 'collapse' }}>
              <thead style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--wf-stroke-2)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                <tr style={{ borderBottom: '1px solid var(--wf-stroke-3)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 6px' }}>Code</th>
                  <th style={{ textAlign: 'left' }}>Chauffeur</th><th>Trajets</th><th>Retards</th><th style={{ textAlign: 'right' }}>Voyageurs</th>
                </tr>
              </thead>
              <tbody>
                {STATS_CLIENT.parChauffeur.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px dashed var(--wf-stroke-3)' }}>
                    <td style={{ padding: '8px 6px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{r.code}</td>
                    <td>{r.nom}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{r.trajets}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{r.retards}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{r.vy.toLocaleString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ReportsB = () => (
  <div style={{ flex: 1, display: 'flex', height: '100%' }}>
    <Sidebar active={6} mode="rail" />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <PageBar title="Configurer un rapport" sub="Direction · assistant" actions={[{ l: 'Aperçu' }, { l: 'Générer', primary: true }]} />
      <div style={{ flex: 1, padding: 24, display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, overflow: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            ['1 · Client', 'CADEMA — Ligne 4 (Caribus)'],
            ['2 · Période', 'Mars 2026'],
            ['3 · Détail par chauffeur', 'Inclus · 9 chauffeurs L4'],
            ['4 · KPI synthétiques', 'Trajets, voyageurs, ponctualité, retards'],
            ['5 · Format', 'PDF · A4 portrait'],
          ].map(([title, val], i) => (
            <div key={i} className="wf-box" style={{ padding: 14, background: '#fff', borderColor: i === 0 ? 'var(--wf-accent)' : 'var(--wf-stroke)' }}>
              <Eyebrow color={i === 0 ? 'var(--wf-accent)' : undefined}>{title}</Eyebrow>
              <div style={{ marginTop: 4, fontWeight: 600, fontSize: 13 }}>{val}</div>
              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--wf-stroke-2)' }}>Cliquer pour modifier</div>
            </div>
          ))}
        </div>
        <div className="wf-box" style={{ background: 'var(--wf-paper)', padding: 28, borderColor: 'var(--wf-stroke-3)', display: 'flex', flexDirection: 'column' }}>
          <Eyebrow>Aperçu · page 1 / 4</Eyebrow>
          <div style={{ background: '#fff', flex: 1, marginTop: 12, padding: 32, border: '1.25px solid var(--wf-stroke-3)', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--wf-stroke)', paddingBottom: 14 }}>
              <div>
                <Eyebrow>Rapport mensuel</Eyebrow>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, marginTop: 2 }}>CADEMA — Ligne 4</div>
                <div style={{ fontSize: 13, color: 'var(--wf-stroke-2)' }}>Mars 2026 · édité le 02/04/2026</div>
              </div>
              <img src="assets/logo-aissociate.png" alt="" style={{ width: 56, height: 56 }} />
            </div>
            <h3 style={{ marginTop: 20, fontSize: 18, fontWeight: 700 }}>Synthèse</h3>
            <Sline w="80%" /><Sline w="65%" /><Sline w="72%" />
            <h3 style={{ marginTop: 20, fontSize: 18, fontWeight: 700 }}>Courses</h3>
            <Sline w="90%" /><Sline w="86%" /><Sline w="74%" /><Sline w="80%" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ReportsC = () => (
  <div style={{ flex: 1, display: 'flex', height: '100%' }}>
    <Sidebar active={6} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <PageBar title="Comparateur clients · M-3" sub="Direction" actions={[{ l: 'Exporter Excel' }]} />
      <div style={{ flex: 1, padding: 24, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <Kpi l="CA total clients" v="38 240 €" d="↑ 6 %" />
          <Kpi l="Trajets effectués" v="1 520" d="sur 1 568 · 96,9 %" />
          <Kpi l="Voyageurs transportés" v="19 840" d="moy 13 / trajet" />
          <Kpi l="Top contrat" v="L4" d="618 trajets · 8 412 vy" />
        </div>
        <div className="wf-box" style={{ padding: 18, background: '#fff' }}>
          <Eyebrow>CA mensuel par contrat</Eyebrow>
          <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
            {[
              ['CADEMA — Ligne 4', 18420, 17850, 18120],
              ['CADEMA — Ligne 3', 14280, 13950, 14110],
              ['CHM Petite-Terre', 5540, 5210, 5360],
            ].map(([name, m, m1, m2], i) => {
              const max = 20000;
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr 1fr 80px', gap: 8, alignItems: 'center', fontSize: 12 }}>
                  <span style={{ fontWeight: 600 }}>{name}</span>
                  <div style={{ position: 'relative', height: 22, background: 'var(--wf-stroke-4)', borderRadius: 3 }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(m / max) * 100}%`, background: 'var(--wf-accent)', borderRadius: 3 }} />
                  </div>
                  <div style={{ position: 'relative', height: 22, background: 'var(--wf-stroke-4)', borderRadius: 3 }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(m1 / max) * 100}%`, background: 'var(--wf-stroke-2)', borderRadius: 3 }} />
                  </div>
                  <div style={{ position: 'relative', height: 22, background: 'var(--wf-stroke-4)', borderRadius: 3 }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(m2 / max) * 100}%`, background: 'var(--wf-stroke-3)', borderRadius: 3 }} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, textAlign: 'right' }}>{m.toLocaleString('fr-FR')} €</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 14, fontSize: 11, color: 'var(--wf-stroke-2)' }}>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--wf-accent)', marginRight: 4 }} />Avril</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--wf-stroke-2)', marginRight: 4 }} />Mars</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--wf-stroke-3)', marginRight: 4 }} />Février</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────
// 7 ▸ REPLAY GPS — three layouts (extra of map)
// Reuse MapC + 2 alternates
// ─────────────────────────────────────────────────────────────────────
const ReplayA = () => <MapC />;

const ReplayB = () => (
  <div style={{ flex: 1, display: 'flex', height: '100%' }}>
    <Sidebar active={2} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <PageBar title="Historique multi-chauffeurs" sub="Vendredi 8 mai · 06:00-22:00" actions={[{ l: '+ Chauffeur' }]} />
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <MapBg />
        <svg viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <path d="M 380 415 L 395 380 L 412 340 Q 420 305 415 270 L 415 250" stroke="var(--wf-accent)" strokeWidth="3" fill="none" />
          <path d="M 350 495 L 380 460 L 395 420 L 410 380 L 425 340 L 415 290" stroke="#3A6EA5" strokeWidth="3" fill="none" strokeDasharray="4 4" />
          <path d="M 305 200 Q 360 220 410 250 L 412 295" stroke="#2E8B57" strokeWidth="3" fill="none" strokeDasharray="2 6" />
        </svg>
        {/* legend overlay */}
        <div className="wf-box" style={{ position: 'absolute', left: 16, top: 16, padding: 12, background: 'rgba(255,255,255,0.96)', minWidth: 200 }}>
          <Eyebrow>Chauffeurs affichés</Eyebrow>
          {[['D1 · MOHAMED Ali', 'var(--wf-accent)'], ['D5 · AMINA Selemani', '#3A6EA5'], ['D12 · VELOU M\'Berou', '#2E8B57']].map(([n, c], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 12 }}>
              <div style={{ width: 24, height: 3, background: c, borderRadius: 2 }} />
              <span>{n}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '14px 24px', borderTop: '1.5px solid var(--wf-stroke)', background: 'var(--wf-paper)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Eyebrow>11:42</Eyebrow>
          <div style={{ flex: 1, height: 6, background: 'var(--wf-stroke-4)', borderRadius: 999, position: 'relative' }}>
            <div style={{ width: '52%', height: '100%', background: 'var(--wf-accent)', borderRadius: 999 }} />
            {[20, 30, 35, 50, 65, 80].map(p => (
              <div key={p} style={{ position: 'absolute', left: `${p}%`, top: -3, width: 12, height: 12, borderRadius: '50%', background: '#fff', border: '2px solid var(--wf-stroke)' }} />
            ))}
          </div>
          <Eyebrow>22:00</Eyebrow>
        </div>
      </div>
    </div>
  </div>
);

Object.assign(window, {
  PlanningGridA, PlanningGridB, PlanningGridC,
  KpiA, KpiB, KpiC,
  MapA, MapB, MapC,
  InvoicesA, InvoicesB, InvoicesC,
  DriversA, DriversB, DriversC,
  ReportsA, ReportsB, ReportsC,
  ReplayA, ReplayB,
  WebFrame,
});
