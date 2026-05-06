// android-screens.jsx — wireframe screens for the chauffeur app
// Each screen is a function returning the inside of a phone screen.
// Three layout variations per screen.

// ─────────────────────────────────────────────────────────────────────
// Shared atoms
// ─────────────────────────────────────────────────────────────────────
const TopBar = ({ title, sub, action, dark }) => (
  <div style={{
    padding: '12px 16px 10px',
    borderBottom: '1.25px solid var(--wf-stroke-3)',
    background: dark ? 'var(--wf-stroke)' : '#fff',
    color: dark ? '#fff' : 'var(--wf-stroke)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  }}>
    <div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.6 }}>{sub}</div>
      <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 16, marginTop: 2 }}>{title}</div>
    </div>
    {action && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7 }}>{action}</div>}
  </div>
);

const Pill = ({ kind = 'planned', children }) => (
  <span className={`wf-pill is-${kind}`}><span className="dot" /> {children}</span>
);

const ScribbleLine = ({ width = '100%', height = 8, op = 1 }) => (
  <div className="wf-scribble" style={{ width, height, opacity: op }} />
);

// ─────────────────────────────────────────────────────────────────────
// 1 ▸ LOGIN — three layouts
// ─────────────────────────────────────────────────────────────────────
const LoginA = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '28px 22px' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 16 }}>
      <img src="assets/logo-aissociate.png" alt="" style={{ width: 56, height: 56, opacity: 0.85 }} />
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, marginTop: 12 }}>Taxi Vanille</div>
      <div className="wf-eyebrow" style={{ marginTop: 4 }}>Espace chauffeur</div>
    </div>
    <div style={{ marginTop: 28 }}>
      <div className="wf-eyebrow" style={{ marginBottom: 6 }}>Numéro chauffeur</div>
      <div className="wf-box" style={{ padding: '14px 14px', fontFamily: 'var(--font-mono)', fontSize: 22, letterSpacing: '0.1em' }}>0 4 7</div>
    </div>
    <div style={{ marginTop: 16 }}>
      <div className="wf-eyebrow" style={{ marginBottom: 6 }}>Code PIN</div>
      <div style={{ display: 'flex', gap: 10 }}>
        {[1,2,3,4].map(i => (
          <div key={i} className="wf-box" style={{ flex: 1, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
            {i <= 2 ? '•' : ''}
          </div>
        ))}
      </div>
    </div>
    <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
      {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
        <div key={i} className="tap-btn" style={{ height: 50, fontSize: 20, opacity: k === '' ? 0 : 1 }}>{k}</div>
      ))}
    </div>
    <div style={{ marginTop: 16 }}>
      <div className="tap-btn tap-btn-accent" style={{ height: 52, fontSize: 16 }}>Se connecter</div>
    </div>
    <div style={{ marginTop: 'auto', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--wf-stroke-3)' }}>
      ● Hors-ligne autorisé
    </div>
  </div>
);

const LoginB = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <div style={{ background: 'var(--wf-stroke)', color: '#fff', padding: '36px 22px 26px' }}>
      <div className="wf-eyebrow" style={{ color: 'rgba(255,255,255,0.5)' }}>Bonsoir,</div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 26, fontWeight: 700, marginTop: 4 }}>Chauffeur</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 60, fontWeight: 700, marginTop: 6, letterSpacing: '0.04em' }}>047</div>
      <div style={{ marginTop: 8, fontFamily: 'var(--font-sans)', fontSize: 12, opacity: 0.7 }}>Ce n'est pas vous ? <u>Changer</u></div>
    </div>
    <div style={{ padding: '24px 22px', flex: 1 }}>
      <div className="wf-eyebrow">Saisissez votre PIN</div>
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            flex: 1, height: 52, borderBottom: '2px solid var(--wf-stroke)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, color: 'var(--wf-stroke)',
          }}>{i <= 3 ? '•' : ''}</div>
        ))}
      </div>
      <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[1,2,3,4,5,6,7,8,9].map(k => (
          <div key={k} className="tap-btn" style={{ height: 56, fontSize: 22, borderRadius: '50%' }}>{k}</div>
        ))}
        <div style={{ height: 56 }} />
        <div className="tap-btn" style={{ height: 56, fontSize: 22, borderRadius: '50%' }}>0</div>
        <div className="tap-btn" style={{ height: 56, fontSize: 18, borderRadius: '50%', borderStyle: 'dashed' }}>⌫</div>
      </div>
    </div>
  </div>
);

const LoginC = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px 16px', background: 'var(--wf-paper)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <img src="assets/logo-aissociate.png" alt="" style={{ width: 32, height: 32 }} />
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}>Taxi Vanille</div>
    </div>
    <div className="wf-box" style={{ padding: 16, marginTop: 16 }}>
      <div className="wf-eyebrow">Identifiant</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        {[0,4,7].map((d,i) => (
          <div key={i} className="wf-box" style={{ flex: 1, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 30, fontWeight: 700 }}>{d}</div>
        ))}
      </div>
      <div className="wf-eyebrow" style={{ marginTop: 18 }}>PIN à 4 chiffres</div>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            flex: 1, height: 18, borderRadius: 999,
            background: i <= 1 ? 'var(--wf-accent)' : 'var(--wf-stroke-4)',
          }} />
        ))}
      </div>
    </div>
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 14 }}>
      {[1,2,3,4,5,6,7,8,9,'⌫',0,'OK'].map((k,i) => (
        <div key={i} className={`tap-btn ${k === 'OK' ? 'tap-btn-accent' : ''}`}
          style={{ fontSize: k === 'OK' ? 14 : 22, fontWeight: 700 }}>{k}</div>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────
// 2 ▸ PLANNING — three layouts
// ─────────────────────────────────────────────────────────────────────
const PlanningA = () => {
  const trips = [
    { time: '07:30', title: 'Hôpital Saint-Louis', sub: '4 patients · 6 arrêts', kind: 'done' },
    { time: '09:15', title: 'EHPAD Les Tilleuls', sub: '3 patients · 4 arrêts', kind: 'live', label: 'En cours' },
    { time: '11:00', title: 'Centre médical Bichat', sub: '5 patients · 7 arrêts', kind: 'planned' },
    { time: '14:00', title: 'Clinique Pasteur', sub: '2 patients · 3 arrêts', kind: 'planned' },
    { time: '16:30', title: 'EHPAD Les Tilleuls', sub: '4 patients · 5 arrêts', kind: 'planned' },
  ];
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar sub="Vendredi 8 mai" title="Planning du jour" action="047" />
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 14px 70px' }}>
        {trips.map((t, i) => (
          <div key={i} className="wf-box" style={{
            padding: 14, marginBottom: 10,
            borderLeft: t.kind === 'live' ? '6px solid var(--wf-accent)' : t.kind === 'done' ? '6px solid var(--wf-success)' : '6px solid var(--wf-stroke-3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700 }}>{t.time}</div>
              <Pill kind={t.kind === 'live' ? 'live' : t.kind === 'done' ? 'done' : 'planned'}>
                {t.kind === 'live' ? 'En cours' : t.kind === 'done' ? 'Terminé' : 'Planifié'}
              </Pill>
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, marginTop: 4 }}>{t.title}</div>
            <div style={{ fontSize: 12, color: 'var(--wf-stroke-2)', marginTop: 2 }}>{t.sub}</div>
          </div>
        ))}
      </div>
      <IncidentBar />
    </div>
  );
};

const PlanningB = () => {
  const trips = [
    { time: '07:30', dur: '45 min', title: 'Hôpital Saint-Louis', kind: 'done' },
    { time: '09:15', dur: '90 min', title: 'EHPAD Les Tilleuls', kind: 'live' },
    { time: '11:00', dur: '60 min', title: 'Centre Bichat', kind: 'planned' },
    { time: '14:00', dur: '40 min', title: 'Clinique Pasteur', kind: 'planned' },
    { time: '16:30', dur: '75 min', title: 'EHPAD Les Tilleuls', kind: 'planned' },
  ];
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar sub="Aujourd'hui · 5 courses" title="Vendredi 8 mai" action="●●●" />
      <div style={{ padding: '10px 14px 0', display: 'flex', gap: 6 }}>
        {[
          { l: 'Toutes', n: 5, on: true },
          { l: 'À faire', n: 3 },
          { l: 'Faites', n: 1 },
        ].map((f,i) => (
          <div key={i} className="wf-pill" style={{
            background: f.on ? 'var(--wf-stroke)' : '#fff',
            color: f.on ? '#fff' : 'var(--wf-stroke-2)',
            borderColor: f.on ? 'var(--wf-stroke)' : 'var(--wf-stroke-3)',
            fontSize: 10,
          }}>{f.l} · {f.n}</div>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 0 70px', position: 'relative' }}>
        {/* timeline rail */}
        <div style={{ position: 'absolute', top: 16, bottom: 70, left: 60, width: 1.5, background: 'var(--wf-stroke-3)' }} />
        {trips.map((t, i) => (
          <div key={i} style={{ display: 'flex', padding: '0 14px', marginBottom: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 50, fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, paddingTop: 6 }}>{t.time}</div>
            <div style={{
              width: 14, height: 14, borderRadius: '50%',
              background: t.kind === 'live' ? 'var(--wf-accent)' : t.kind === 'done' ? 'var(--wf-success)' : '#fff',
              border: '2px solid ' + (t.kind === 'planned' ? 'var(--wf-stroke-3)' : t.kind === 'live' ? 'var(--wf-accent)' : 'var(--wf-success)'),
              marginTop: 8, marginLeft: -7, marginRight: 12, flexShrink: 0,
              boxShadow: t.kind === 'live' ? '0 0 0 4px rgba(242,100,25,0.18)' : 'none',
            }} />
            <div className="wf-box" style={{
              flex: 1, padding: 10,
              background: t.kind === 'live' ? 'var(--wf-accent-soft)' : '#fff',
              borderColor: t.kind === 'live' ? 'var(--wf-accent)' : 'var(--wf-stroke)',
            }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{t.title}</div>
              <div style={{ fontSize: 11, color: 'var(--wf-stroke-2)', marginTop: 2 }}>{t.dur}</div>
            </div>
          </div>
        ))}
      </div>
      <IncidentBar />
    </div>
  );
};

const PlanningC = () => {
  const trips = [
    { time: '07:30', title: 'St-Louis', kind: 'done' },
    { time: '09:15', title: 'Tilleuls', kind: 'live' },
    { time: '11:00', title: 'Bichat', kind: 'planned' },
    { time: '14:00', title: 'Pasteur', kind: 'planned' },
    { time: '16:30', title: 'Tilleuls', kind: 'planned' },
  ];
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar sub="047" title="Ven. 8 mai" />
      {/* Big "current trip" hero */}
      <div style={{ padding: '14px 14px 0' }}>
        <div className="wf-box" style={{ padding: 14, background: 'var(--wf-stroke)', color: '#fff', borderColor: 'var(--wf-stroke)' }}>
          <div className="wf-eyebrow" style={{ color: 'rgba(255,255,255,0.55)' }}>Maintenant · 09:15</div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 20, fontWeight: 700, marginTop: 4 }}>EHPAD Les Tilleuls</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>3 patients · 4 arrêts · 90 min</div>
          <div style={{ marginTop: 12 }}>
            <div className="tap-btn tap-btn-accent" style={{ height: 44, fontSize: 14 }}>Reprendre la course →</div>
          </div>
        </div>
      </div>
      <div style={{ padding: '14px 14px 6px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--wf-stroke-2)' }}>
        Suite du planning
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 14px 70px' }}>
        {trips.slice(2).map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px dashed var(--wf-stroke-3)' }}>
            <div style={{ width: 44, fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700 }}>{t.time}</div>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{t.title}</div>
            <Pill kind="planned">→</Pill>
          </div>
        ))}
      </div>
      <IncidentBar variant="fab" />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// 3 ▸ COURSE (counter for stops) — three layouts
// ─────────────────────────────────────────────────────────────────────
const Counter = ({ label, value, big = false }) => (
  <div style={{ flex: 1, textAlign: 'center' }}>
    <div className="wf-eyebrow" style={{ marginBottom: 6 }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <div className="tap-btn" style={{ width: big ? 70 : 56, height: big ? 70 : 56, fontSize: big ? 32 : 24, borderRadius: '50%' }}>−</div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: big ? 48 : 36, fontWeight: 700,
        minWidth: big ? 80 : 60, textAlign: 'center', lineHeight: 1,
      }}>{value}</div>
      <div className="tap-btn tap-btn-primary" style={{ width: big ? 70 : 56, height: big ? 70 : 56, fontSize: big ? 32 : 24, borderRadius: '50%' }}>+</div>
    </div>
  </div>
);

const CourseA = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <TopBar sub="EHPAD Les Tilleuls" title="Arrêt 2 / 4" action="↻" />
    <div style={{ padding: '14px 14px 0' }}>
      <div className="wf-eyebrow">Arrêt actuel</div>
      <div style={{ fontWeight: 700, fontSize: 17, marginTop: 4 }}>14 rue de Belleville</div>
      <div style={{ fontSize: 12, color: 'var(--wf-stroke-2)' }}>75019 Paris · arrivée prévue 09:34</div>
    </div>
    <div style={{ padding: '20px 14px 0' }}>
      <div className="wf-box" style={{ padding: '18px 14px', display: 'flex', gap: 12 }}>
        <Counter label="Montants" value={2} />
        <div style={{ width: 1, background: 'var(--wf-stroke-3)' }} />
        <Counter label="Descendants" value={1} />
      </div>
    </div>
    <div style={{ padding: '14px 14px 0', flex: 1 }}>
      <div className="wf-eyebrow" style={{ marginBottom: 6 }}>Total à bord</div>
      <div className="wf-box" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700 }}>3</span>
        <span style={{ fontSize: 12, color: 'var(--wf-stroke-2)' }}>passagers</span>
      </div>
    </div>
    <div style={{ padding: '12px 14px 70px' }}>
      <div className="tap-btn tap-btn-accent" style={{ height: 64, fontSize: 18 }}>PARTIR → Arrêt 3</div>
    </div>
    <IncidentBar />
  </div>
);

const CourseB = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <TopBar sub="Course en cours · 09:32" title="Tilleuls" action="2/4" />
    {/* split-screen: left + / right − */}
    <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
      <div style={{ flex: 1, background: 'var(--wf-paper)', borderRight: '2px dashed var(--wf-stroke-3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div className="wf-eyebrow">Montants</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 80, fontWeight: 700, lineHeight: 1, margin: '8px 0' }}>2</div>
        <div className="tap-btn tap-btn-primary" style={{ width: '100%', height: 60, fontSize: 32 }}>+</div>
        <div className="tap-btn" style={{ width: '100%', height: 44, fontSize: 22, marginTop: 8 }}>−</div>
      </div>
      <div style={{ flex: 1, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div className="wf-eyebrow">Descendants</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 80, fontWeight: 700, lineHeight: 1, margin: '8px 0' }}>1</div>
        <div className="tap-btn tap-btn-primary" style={{ width: '100%', height: 60, fontSize: 32 }}>+</div>
        <div className="tap-btn" style={{ width: '100%', height: 44, fontSize: 22, marginTop: 8 }}>−</div>
      </div>
    </div>
    <div style={{ padding: '10px 14px 60px', borderTop: '1.5px solid var(--wf-stroke)', background: '#fff' }}>
      <div style={{ fontSize: 11, color: 'var(--wf-stroke-2)', textAlign: 'center', marginBottom: 6, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>14 rue de Belleville · 3 à bord</div>
      <div className="tap-btn tap-btn-accent" style={{ height: 56, fontSize: 18 }}>PARTIR →</div>
    </div>
    <IncidentBar compact />
  </div>
);

const CourseC = () => {
  const stops = [
    { name: 'M. Dupuis · 14 rue Belleville', state: 'done' },
    { name: 'Mme Renaud · 8 rue Piat', state: 'live' },
    { name: 'M. Khalil · Place Fréhel', state: 'next' },
    { name: 'Hôpital St-Louis · entrée B', state: 'next' },
  ];
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar sub="EHPAD Les Tilleuls" title="Course 09:15" action="2/4" />
      <div style={{ flex: 1, overflow: 'auto', padding: '10px 12px 200px' }}>
        {stops.map((s, i) => (
          <div key={i} style={{
            display: 'flex', gap: 10, padding: '10px 0',
            borderBottom: '1px dashed var(--wf-stroke-3)',
            opacity: s.state === 'done' ? 0.5 : 1,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: s.state === 'live' ? 'var(--wf-accent)' : s.state === 'done' ? 'var(--wf-success)' : '#fff',
              border: '2px solid ' + (s.state === 'next' ? 'var(--wf-stroke-3)' : 'transparent'),
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 12, flexShrink: 0,
            }}>{s.state === 'done' ? '✓' : i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: s.state === 'live' ? 700 : 500, fontSize: 13 }}>{s.name}</div>
              {s.state === 'live' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <div style={{ flex: 1, padding: '8px 6px', textAlign: 'center', border: '2px solid var(--wf-stroke)', borderRadius: 8 }}>
                    <div style={{ fontSize: 9, color: 'var(--wf-stroke-2)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>MONTE</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      <div className="tap-btn" style={{ width: 32, height: 32, fontSize: 18, borderRadius: 6 }}>−</div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700 }}>2</span>
                      <div className="tap-btn tap-btn-primary" style={{ width: 32, height: 32, fontSize: 18, borderRadius: 6 }}>+</div>
                    </div>
                  </div>
                  <div style={{ flex: 1, padding: '8px 6px', textAlign: 'center', border: '2px solid var(--wf-stroke)', borderRadius: 8 }}>
                    <div style={{ fontSize: 9, color: 'var(--wf-stroke-2)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>DESC.</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      <div className="tap-btn" style={{ width: 32, height: 32, fontSize: 18, borderRadius: 6 }}>−</div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700 }}>1</span>
                      <div className="tap-btn tap-btn-primary" style={{ width: 32, height: 32, fontSize: 18, borderRadius: 6 }}>+</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 56, padding: '10px 12px', background: 'rgba(255,255,255,0.95)', borderTop: '1.5px solid var(--wf-stroke)' }}>
        <div className="tap-btn tap-btn-accent" style={{ height: 52, fontSize: 16 }}>PARTIR vers M. Khalil →</div>
      </div>
      <IncidentBar />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// 4 ▸ INCIDENT MODAL — three layouts
// ─────────────────────────────────────────────────────────────────────
const ICONS = [
  { ic: '✕', l: 'Accident' },
  { ic: '⚙', l: 'Panne' },
  { ic: '⏱', l: 'Retard' },
  { ic: '⛔', l: 'Voie bloquée' },
  { ic: '✋', l: 'Passager refusé' },
  { ic: '🛡', l: 'Sécurité' },
  { ic: '☂', l: 'Météo' },
  { ic: '👤', l: 'Client absent' },
  { ic: '⋯', l: 'Autre' },
];

const IncidentA = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(26,23,24,0.55)' }}>
    <div style={{ flex: 1 }} />
    <div style={{ background: '#fff', borderTop: '2px solid var(--wf-stroke)', borderRadius: '14px 14px 0 0', padding: '16px 14px 20px', maxHeight: '88%', overflow: 'auto' }}>
      <div style={{ width: 40, height: 4, background: 'var(--wf-stroke-3)', borderRadius: 2, margin: '0 auto 12px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <div className="wf-eyebrow" style={{ color: 'var(--wf-danger)' }}>Incident</div>
          <div style={{ fontWeight: 700, fontSize: 18, marginTop: 2 }}>Que se passe-t-il ?</div>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--wf-stroke-2)' }}>09:34</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 14 }}>
        {ICONS.map((ic, i) => (
          <div key={i} className="wf-box" style={{
            aspectRatio: '1', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 6,
            background: i === 2 ? 'var(--wf-accent-soft)' : '#fff',
            borderColor: i === 2 ? 'var(--wf-accent)' : 'var(--wf-stroke)',
            borderWidth: i === 2 ? 2 : 1.5,
          }}>
            <div style={{ fontSize: 22 }}>{ic.ic}</div>
            <div style={{ fontSize: 10, fontWeight: 600, textAlign: 'center', lineHeight: 1.1 }}>{ic.l}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14 }}>
        <div className="wf-eyebrow">Mémo vocal · facultatif (60 s max)</div>
        <div className="wf-box" style={{ padding: 12, marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--wf-danger)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>●</div>
          <div style={{ flex: 1 }}>
            <ScribbleLine />
            <div style={{ fontSize: 11, color: 'var(--wf-stroke-2)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>00:00 / 01:00</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <div className="tap-btn" style={{ flex: 1, height: 50 }}>Annuler</div>
        <div className="tap-btn tap-btn-danger" style={{ flex: 2, height: 50 }}>Envoyer l'alerte</div>
      </div>
    </div>
  </div>
);

const IncidentB = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <div style={{ background: 'var(--wf-danger)', color: '#fff', padding: '14px 16px' }}>
      <div className="wf-eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>Incident · étape 1 / 2</div>
      <div style={{ fontWeight: 700, fontSize: 18, marginTop: 4 }}>Choisir le type</div>
    </div>
    <div style={{ flex: 1, overflow: 'auto', padding: '10px 12px' }}>
      {ICONS.map((ic, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '12px 10px',
          borderBottom: '1px solid var(--wf-stroke-3)',
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, border: '1.5px solid var(--wf-stroke)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{ic.ic}</div>
          <div style={{ flex: 1, fontWeight: 600 }}>{ic.l}</div>
          <div style={{ fontSize: 18, color: 'var(--wf-stroke-3)' }}>›</div>
        </div>
      ))}
    </div>
    <div style={{ padding: '10px 12px 14px', borderTop: '1.5px solid var(--wf-stroke)', background: '#fff' }}>
      <div className="tap-btn" style={{ height: 48 }}>Annuler</div>
    </div>
  </div>
);

const IncidentC = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--wf-paper)' }}>
    <div style={{ padding: '14px 16px', background: '#fff', borderBottom: '1.5px solid var(--wf-stroke)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="wf-eyebrow" style={{ color: 'var(--wf-danger)' }}>● Incident en cours</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>00:42</div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 17, marginTop: 4 }}>Voie bloquée</div>
    </div>
    <div style={{ padding: '12px 14px' }}>
      <div className="wf-eyebrow">Type</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        {ICONS.map((ic, i) => (
          <div key={i} className="wf-pill" style={{
            background: i === 3 ? 'var(--wf-danger)' : '#fff',
            color: i === 3 ? '#fff' : 'var(--wf-stroke)',
            borderColor: i === 3 ? 'var(--wf-danger)' : 'var(--wf-stroke-3)',
            padding: '6px 10px', fontSize: 11,
          }}>{ic.ic} {ic.l}</div>
        ))}
      </div>
    </div>
    <div style={{ padding: '0 14px' }}>
      <div className="wf-eyebrow" style={{ marginTop: 6 }}>Voix · enregistrement</div>
      <div className="wf-box" style={{ padding: 16, marginTop: 8, textAlign: 'center', background: '#fff' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--wf-danger)', color: '#fff', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, boxShadow: '0 0 0 6px rgba(209,58,42,0.18)' }}>■</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, marginTop: 12 }}>00:42</div>
        <div style={{ fontSize: 11, color: 'var(--wf-stroke-2)', marginTop: 2 }}>Tapez pour arrêter · 60 s max</div>
        <div style={{ marginTop: 12, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          {[6,10,4,14,8,18,12,7,16,9,11,5,8,13,6,9,4,12,8,11,5,7,10].map((h, i) => (
            <div key={i} style={{ width: 3, height: h, background: 'var(--wf-danger)', borderRadius: 2, opacity: i > 14 ? 0.3 : 1 }} />
          ))}
        </div>
      </div>
    </div>
    <div style={{ padding: '12px 14px', marginTop: 'auto', display: 'flex', gap: 10 }}>
      <div className="tap-btn" style={{ flex: 1, height: 50 }}>Annuler</div>
      <div className="tap-btn tap-btn-danger" style={{ flex: 2, height: 50 }}>Envoyer</div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────
// 5 ▸ HORS-LIGNE / SYNC — three layouts
// ─────────────────────────────────────────────────────────────────────
const OfflineA = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <div style={{ background: 'var(--wf-warn)', color: '#3b2c08', padding: '8px 14px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
      ⚠ Mode hors-ligne · 12 éléments en attente
    </div>
    <TopBar sub="Vendredi 8 mai" title="Planning du jour" action="047" />
    <div style={{ flex: 1, overflow: 'auto', padding: '14px 14px 70px' }}>
      <div className="wf-box-soft" style={{ padding: 12, marginBottom: 10, opacity: 0.85 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--wf-stroke-2)' }}>Données en cache · dernière maj 09:02</div>
      </div>
      {[1,2,3,4].map(i => (
        <div key={i} className="wf-box" style={{ padding: 12, marginBottom: 10, position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700 }}>{['07:30','09:15','11:00','14:00'][i-1]}</div>
            {i <= 2 && <span style={{ fontSize: 11, color: 'var(--wf-warn)', fontWeight: 700 }}>↻ à synchroniser</span>}
          </div>
          <div style={{ marginTop: 4 }}><ScribbleLine width="80%" /></div>
          <div style={{ marginTop: 4 }}><ScribbleLine width="50%" /></div>
        </div>
      ))}
    </div>
    <IncidentBar />
  </div>
);

const OfflineB = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 24, textAlign: 'center', background: 'var(--wf-paper)' }}>
    <div style={{ width: 96, height: 96, borderRadius: '50%', border: '2.5px dashed var(--wf-stroke-3)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>⚡</div>
    <div className="wf-eyebrow" style={{ marginTop: 22 }}>Connexion perdue</div>
    <h3 style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 700 }}>Tout est sauvé en local.</h3>
    <p style={{ marginTop: 8, fontSize: 14, color: 'var(--wf-stroke-2)', maxWidth: 280, marginInline: 'auto' }}>
      Continuez votre tournée normalement. Les données seront envoyées automatiquement dès le retour du réseau.
    </p>
    <div className="wf-box" style={{ padding: 14, marginTop: 22, textAlign: 'left', background: '#fff' }}>
      <div className="wf-eyebrow">File de synchronisation</div>
      {[
        ['Course 09:15 · 4 arrêts validés', '↻'],
        ['Compteurs passagers (×3)', '↻'],
        ['Position GPS (×42)', '↻'],
        ['Incident · voie bloquée', '↻'],
      ].map((r, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 3 ? '1px dashed var(--wf-stroke-3)' : 'none', fontSize: 12 }}>
          <span>{r[0]}</span>
          <span style={{ color: 'var(--wf-warn)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{r[1]}</span>
        </div>
      ))}
    </div>
    <div style={{ marginTop: 18 }}>
      <div className="tap-btn" style={{ height: 48, fontSize: 14 }}>Continuer en hors-ligne</div>
    </div>
    <IncidentBar compact />
  </div>
);

const OfflineC = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <TopBar sub="Sync · 09:34" title="Connexion rétablie" />
    <div style={{ padding: '14px 14px 0' }}>
      <div className="wf-box" style={{ padding: 14, background: 'var(--wf-accent-soft)', borderColor: 'var(--wf-accent)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="wf-eyebrow" style={{ color: 'var(--wf-accent)' }}>Synchronisation en cours</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700 }}>8 / 12</div>
        </div>
        <div style={{ marginTop: 10, height: 8, background: '#fff', border: '1.25px solid var(--wf-accent)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: '66%', height: '100%', background: 'var(--wf-accent)' }} />
        </div>
        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--wf-stroke-2)' }}>Envoi des compteurs passagers…</div>
      </div>
    </div>
    <div style={{ padding: '14px 14px 0', flex: 1, overflow: 'auto' }}>
      <div className="wf-eyebrow" style={{ marginBottom: 8 }}>Détail</div>
      {[
        ['Planning du jour', 'sync', 'OK'],
        ['Course 07:30 · St-Louis', 'sync', 'OK'],
        ['Course 09:15 · Tilleuls', 'sync', 'OK'],
        ['Compteurs passagers', 'sync', '8/12'],
        ['Positions GPS (42)', 'wait', '—'],
        ['Incident voie bloquée + voix', 'wait', '—'],
      ].map((r, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px dashed var(--wf-stroke-3)', fontSize: 13 }}>
          <span>{r[0]}</span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
            color: r[1] === 'sync' ? 'var(--wf-success)' : 'var(--wf-stroke-2)',
          }}>{r[1] === 'sync' ? '✓ ' : '… '}{r[2]}</span>
        </div>
      ))}
    </div>
    <IncidentBar />
  </div>
);

Object.assign(window, {
  LoginA, LoginB, LoginC,
  PlanningA, PlanningB, PlanningC,
  CourseA, CourseB, CourseC,
  IncidentA, IncidentB, IncidentC,
  OfflineA, OfflineB, OfflineC,
});
