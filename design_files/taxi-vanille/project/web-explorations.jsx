// web-explorations.jsx — 4 deeper explorations beyond the base wireframes
// Reuses Sidebar, PageBar, Eyebrow, MapBg from web-screens.jsx (loaded first).

// ─────────────────────────────────────────────────────────────────────
// SHARED ▸ Alerte visuelle forte (incident / vocal)
// ─────────────────────────────────────────────────────────────────────
// Injecte une keyframe pulse une seule fois
if (typeof document !== 'undefined' && !document.getElementById('wf-alert-keyframes')) {
  const s = document.createElement('style');
  s.id = 'wf-alert-keyframes';
  s.textContent = `
    @keyframes wfPulseRing {
      0%   { box-shadow: 0 0 0 0 rgba(209,58,42,0.55); }
      70%  { box-shadow: 0 0 0 14px rgba(209,58,42,0); }
      100% { box-shadow: 0 0 0 0 rgba(209,58,42,0); }
    }
    @keyframes wfBlink {
      0%, 60%  { background: var(--wf-danger); color: #fff; }
      80%      { background: #fff; color: var(--wf-danger); }
      100%     { background: var(--wf-danger); color: #fff; }
    }
    @keyframes wfStripes {
      from { background-position: 0 0; }
      to   { background-position: 28px 0; }
    }
    .wf-alert-stripes {
      background-image: repeating-linear-gradient(
        45deg,
        var(--wf-danger) 0 8px,
        #b8311f 8px 16px
      );
      animation: wfStripes 1.4s linear infinite;
    }
  `;
  document.head.appendChild(s);
}

const AlertBanner = ({ kind = 'incident', driver = 'D7 · COMBO Said', message = 'Vocal incident reçu · M\'tsapéré · panne moteur', age = '14 s', dismissible = true }) => {
  const isIncident = kind === 'incident';
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      borderTop: isIncident ? '2px solid var(--wf-danger)' : '2px solid var(--wf-warn)',
      borderBottom: isIncident ? '2px solid var(--wf-danger)' : '2px solid var(--wf-warn)',
      background: isIncident ? '#fff' : '#fffaeb',
    }}>
      {/* Stripe / blink badge */}
      <div className={isIncident ? 'wf-alert-stripes' : ''} style={{
        width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isIncident ? undefined : 'var(--wf-warn)',
        color: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 16,
      }}>!</div>
      {/* Pulse dot */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px 0 14px' }}>
        <div style={{
          width: 12, height: 12, borderRadius: '50%',
          background: isIncident ? 'var(--wf-danger)' : 'var(--wf-warn)',
          animation: 'wfPulseRing 1.4s infinite',
        }} />
      </div>
      {/* Message */}
      <div style={{ flex: 1, padding: '8px 0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em',
            textTransform: 'uppercase', fontWeight: 800,
            color: isIncident ? 'var(--wf-danger)' : '#9a6f10',
            padding: '2px 6px', border: '1.5px solid currentColor', borderRadius: 3,
            animation: isIncident ? 'wfBlink 1.6s infinite' : 'none',
          }}>{isIncident ? 'Incident' : 'Nouveau vocal'}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--wf-stroke)' }}>{driver}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--wf-stroke-2)' }}>il y a {age}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--wf-stroke)', marginTop: 2 }}>{message}</div>
      </div>
      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 10 }}>
        <div className="tap-btn" style={{ padding: '6px 10px', height: 30, fontSize: 11 }}>▶ Écouter</div>
        <div className="tap-btn tap-btn-danger" style={{ padding: '6px 12px', height: 30, fontSize: 11 }}>Réagir →</div>
        {dismissible && <div className="tap-btn" style={{ width: 28, height: 28, fontSize: 12 }}>✕</div>}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// E1 ▸ MODAL "REMPLACER CHAUFFEUR" — 3 clics chrono
// ─────────────────────────────────────────────────────────────────────
const ReplaceDriverModal = () => {
  const STEPS = [
    { n: 1, l: 'Course à remplacer' },
    { n: 2, l: 'Nouveau chauffeur' },
    { n: 3, l: 'Confirmer + notifier' },
  ];
  const candidates = [
    { code: 'D5', name: 'AMINA Selemani',  km: '0,8 km', avail: 'libre 6:00-8:30',  match: 'Compatible L3', best: true },
    { code: 'D14', name: 'AHAMADI Laydine', km: '2,1 km', avail: 'libre 6:00-9:00',  match: 'Compatible L3' },
    { code: 'D7', name: 'COMBO Said',       km: '3,4 km', avail: 'libre 7:30-10:00', match: 'L3 (après-midi)' },
    { code: 'C14', name: 'MANSOUR Kamardine', km: '4,2 km', avail: 'repos demandé', match: 'L4 habituel', dim: true },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', height: '100%', position: 'relative' }}>
      <Sidebar active={1} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', filter: 'blur(1.5px) saturate(0.5)', opacity: 0.6 }}>
        <PageBar title="Planning · Vendredi 8 mai" sub="Direction" actions={[{ l: 'Aujourd\'hui' }, { l: '+ Course', primary: true }]} />
        <div style={{ flex: 1, padding: 24, background: 'var(--wf-paper)' }}>
          <div className="wf-box" style={{ padding: 16, height: 80, background: '#fff' }} />
          <div className="wf-box" style={{ padding: 16, height: 80, background: '#fff', marginTop: 12 }} />
          <div className="wf-box" style={{ padding: 16, height: 80, background: '#fff', marginTop: 12 }} />
        </div>
      </div>
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,15,16,0.34)' }} />
      {/* Modal */}
      <div className="wf-box" style={{
        position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
        width: 720, background: '#fff', boxShadow: '0 30px 80px rgba(20,15,16,0.35)',
        display: 'flex', flexDirection: 'column', maxHeight: 'calc(100% - 48px)',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1.5px solid var(--wf-stroke)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Eyebrow>Action rapide · 3 étapes</Eyebrow>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>Remplacer un chauffeur</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="wf-hand-note" style={{ fontSize: 14 }}>↳ ⏱ &lt; 8 sec</span>
            <div className="tap-btn" style={{ width: 28, height: 28, fontSize: 14 }}>✕</div>
          </div>
        </div>
        {/* Stepper */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1.5px solid var(--wf-stroke)', background: 'var(--wf-paper)' }}>
          {STEPS.map((s, i) => (
            <div key={s.n} style={{
              padding: '10px 14px',
              borderRight: i < 2 ? '1px solid var(--wf-stroke-3)' : 'none',
              background: i === 1 ? '#fff' : 'transparent',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: i <= 1 ? 'var(--wf-stroke)' : '#fff',
                color: i <= 1 ? '#fff' : 'var(--wf-stroke-2)',
                border: '1.5px solid var(--wf-stroke)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
              }}>{i < 1 ? '✓' : s.n}</div>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--wf-stroke-2)' }}>Étape {s.n}</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{s.l}</div>
              </div>
            </div>
          ))}
        </div>
        {/* Body — Step 2 active */}
        <div style={{ padding: 18, overflow: 'auto' }}>
          {/* Récap step 1 */}
          <div className="wf-box-soft" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Eyebrow>Course sélectionnée · cliquée à 11:42:03</Eyebrow>
              <div style={{ marginTop: 4, fontSize: 13, fontWeight: 600 }}>D1 · MOHAMED Ali — 14:40 DOUJANI → Passot Barge</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--wf-stroke-2)', marginTop: 2 }}>L3 · 9 voyageurs prévus · raison : panne véhicule</div>
            </div>
            <span className="wf-hand-note" style={{ fontSize: 13 }}>← modifier</span>
          </div>
          {/* Step 2 — list of candidates */}
          <Eyebrow style={{ marginTop: 16 }}>2. Choisir un remplaçant · classés par proximité</Eyebrow>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {candidates.map((c, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '40px 1fr 100px 130px 90px',
                alignItems: 'center', gap: 12, padding: '10px 12px',
                border: '1.5px solid ' + (c.best ? 'var(--wf-accent)' : 'var(--wf-stroke-3)'),
                borderRadius: 6, background: c.best ? 'var(--wf-accent-soft)' : '#fff',
                opacity: c.dim ? 0.55 : 1,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: c.best ? 'var(--wf-accent)' : 'var(--wf-stroke-4)',
                  color: c.best ? '#fff' : 'var(--wf-stroke)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                }}>{c.code}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--wf-stroke-2)' }}>{c.match}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{c.km}</div>
                <div style={{ fontSize: 11, color: 'var(--wf-stroke-2)' }}>{c.avail}</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div className={c.best ? 'tap-btn tap-btn-accent' : 'tap-btn'} style={{ padding: '6px 12px', height: 30, fontSize: 12 }}>
                    {c.best ? 'Choisir →' : 'Choisir'}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--wf-stroke-2)', display: 'flex', gap: 14 }}>
            <span>↳ Filtres : ligne · disponibilité · distance</span>
            <span>↳ Astuce : ⏎ pour valider la suggestion</span>
          </div>
        </div>
        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: '1.5px solid var(--wf-stroke)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--wf-paper)' }}>
          <div style={{ fontSize: 11, color: 'var(--wf-stroke-2)' }}>
            ☐ Notifier D5 par push <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--wf-success)' }}>(par défaut ✓)</span> · ☐ Notifier client CADEMA
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="tap-btn" style={{ padding: '8px 14px', height: 34, fontSize: 12 }}>← Retour</div>
            <div className="tap-btn tap-btn-accent" style={{ padding: '8px 18px', height: 34, fontSize: 12 }}>Confirmer →</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// E2 ▸ LECTEUR DE VOCAUX D'INCIDENT — embedded dans la carte
// ─────────────────────────────────────────────────────────────────────
const VoiceWaveform = ({ progress = 0.42, accent = 'var(--wf-accent)' }) => {
  // Faux waveform — 60 barres
  const bars = Array.from({ length: 60 }).map((_, i) => {
    const seed = Math.sin(i * 1.3) * Math.cos(i * 0.7);
    return 0.25 + Math.abs(seed) * 0.75;
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 36 }}>
      {bars.map((h, i) => {
        const played = i / bars.length < progress;
        return (
          <div key={i} style={{
            width: 3, height: `${h * 100}%`,
            background: played ? accent : 'var(--wf-stroke-3)',
            borderRadius: 1,
          }} />
        );
      })}
    </div>
  );
};

const IncidentVoicePlayer = () => (
  <div style={{ flex: 1, display: 'flex', height: '100%' }}>
    <Sidebar active={2} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <PageBar title="Carte temps réel · incident en cours" sub="Direction · L3 · D7 retard signalé" actions={[
        { l: 'Vocaux', primary: true }, { l: 'Live' }, { l: 'Historique' }
      ]} />
      <AlertBanner kind="incident" driver="D7 · COMBO Said" message="Vocal incident reçu · M'tsapéré · panne moteur, demande remplaçant 12:00" age="14 s" />
      <div style={{ flex: 1, display: 'flex' }}>
        {/* Map left */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <MapBg />
          {/* incident pin pulsing */}
          <div style={{ position: 'absolute', left: '40%', top: '50%', transform: 'translate(-50%, -100%)', textAlign: 'center' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--wf-danger)', border: '3px solid #fff',
              boxShadow: '0 0 0 8px rgba(209,58,42,0.18), 0 4px 12px rgba(0,0,0,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
            }}>D7</div>
          </div>
          {/* other pins, dimmer */}
          <TaxiPin left="38%" top="36%" kind="live" label="D1" />
          <TaxiPin left="38%" top="64%" kind="live" label="D5" />
          <TaxiPin left="62%" top="42%" kind="live" label="C14" />

          {/* Floating voice player overlay */}
          <div className="wf-box" style={{
            position: 'absolute', left: 16, bottom: 16, right: 16,
            background: '#fff', padding: 14, boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'var(--wf-accent)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0,
              }}>▶</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>D7 · COMBO Said</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--wf-stroke-2)', marginLeft: 8 }}>11:38 · L3 · M'TSAPERE</span>
                  </div>
                  <span className="wf-pill is-incident" style={{ fontSize: 9 }}><span className="dot"/>Incident</span>
                </div>
                <VoiceWaveform progress={0.42} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--wf-stroke-2)', marginTop: 2 }}>
                  <span>0:14</span><span>0:33</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <div className="tap-btn" style={{ width: 32, height: 32, fontSize: 11 }}>×1.5</div>
                <div className="tap-btn" style={{ width: 32, height: 32, fontSize: 14 }}>↓</div>
                <div className="tap-btn tap-btn-accent" style={{ padding: '0 12px', height: 32, fontSize: 11 }}>Réagir</div>
              </div>
            </div>
            {/* transcript */}
            <div style={{
              marginTop: 12, padding: 10,
              background: 'var(--wf-paper)', border: '1px dashed var(--wf-stroke-3)', borderRadius: 4,
            }}>
              <Eyebrow>Transcription auto · FR</Eyebrow>
              <div style={{ fontSize: 12, marginTop: 4, color: 'var(--wf-stroke)', lineHeight: 1.5 }}>
                "Allô c'est Said, je suis bloqué à <b>M'tsapéré</b>, voiture en panne moteur, j'ai prévenu les voyageurs. <span style={{ background: 'var(--wf-accent-soft)' }}>J'ai besoin d'un remplaçant</span> pour le 12h00..."
              </div>
            </div>
          </div>
        </div>
        {/* Right rail — file vocaux */}
        <div style={{ width: 280, borderLeft: '1.5px solid var(--wf-stroke)', overflow: 'auto', background: '#fff' }}>
          <div style={{ padding: '14px 14px 8px', borderBottom: '1.5px solid var(--wf-stroke)', position: 'sticky', top: 0, background: '#fff' }}>
            <Eyebrow>Boîte vocaux · 5 nouveaux</Eyebrow>
            <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
              <div className="wf-pill is-incident" style={{ fontSize: 9 }}>Incident · 2</div>
              <div className="wf-pill" style={{ fontSize: 9 }}>Info · 3</div>
            </div>
          </div>
          {[
            { t: '11:38', d: 'D7 · COMBO Said',     l: '0:33', tag: 'incident', preview: 'Bloqué à M\'tsapéré, panne moteur', active: true, unread: true },
            { t: '10:52', d: 'D5 · AMINA Selemani', l: '0:18', tag: 'info', preview: 'Voyageur oublié sac à Doujani', unread: true },
            { t: '09:14', d: 'D1 · MOHAMED Ali',    l: '0:42', tag: 'incident', preview: 'Voie bloquée Passot, déviation', unread: true },
            { t: 'Hier', d: 'D12 · VELOU M\'Berou', l: '0:11', tag: 'info', preview: 'Confirmation reprise lundi' },
            { t: 'Hier', d: 'D14 · AHAMADI Laydine', l: '1:04', tag: 'info', preview: 'Demande congé 15-17 mai' },
          ].map((v, i) => (
            <div key={i} style={{
              padding: '12px 14px', borderBottom: '1px dashed var(--wf-stroke-3)',
              background: v.active ? 'var(--wf-accent-soft)' : '#fff',
              borderLeft: v.active ? '3px solid var(--wf-accent)' : '3px solid transparent',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {v.unread && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--wf-accent)' }} />}
                  {v.d}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--wf-stroke-2)' }}>{v.t} · {v.l}</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--wf-stroke-2)', marginTop: 4, lineHeight: 1.4 }}>{v.preview}</div>
              <div style={{ marginTop: 6, height: 16 }}>
                <VoiceWaveform progress={v.active ? 0.42 : 0} accent={v.tag === 'incident' ? 'var(--wf-danger)' : 'var(--wf-stroke-2)'} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────
// E3 ▸ AUDIT LOG — historique des modifications de planning
// ─────────────────────────────────────────────────────────────────────
const AuditLog = () => {
  const events = [
    {
      day: 'Aujourd\'hui · vendredi 8 mai',
      items: [
        { t: '11:42', who: 'M. Aubin · Direction', action: 'Remplacement', target: 'D1 → D5 · 14:40 DOUJANI', reason: 'Panne véhicule', kind: 'replace', notify: '✓ FCM D5' },
        { t: '11:14', who: 'L. Ousseni · Coordinateur', action: 'Course ajoutée', target: 'D14 · 16:00 PEM Passamainty', reason: 'Demande client CADEMA', kind: 'add' },
        { t: '09:02', who: 'M. Aubin · Direction', action: 'Annulation', target: 'D7 · 10:00 PASSOT (vendredi)', reason: 'Météo · route bloquée', kind: 'remove', notify: '✓ FCM D7 + CADEMA' },
        { t: '08:31', who: 'Système', action: 'Notification reçue', target: 'D7 · vocal incident', reason: '0:33 · transcription auto', kind: 'system' },
      ]
    },
    {
      day: 'Hier · jeudi 7 mai',
      items: [
        { t: '17:20', who: 'M. Aubin · Direction', action: 'Validation hebdo', target: 'Planning S19 · 187 courses', kind: 'validate' },
        { t: '14:08', who: 'L. Ousseni · Coordinateur', action: 'Décalage horaire', target: 'D5 · 5:20 → 5:40', reason: 'Demande chauffeur', kind: 'edit' },
        { t: '11:55', who: 'M. Aubin · Direction', action: 'Remplacement', target: 'D12 → D14 · mardi 14:00', reason: 'Congé maladie', kind: 'replace', notify: '✓ FCM D14' },
      ]
    }
  ];
  const kindColor = {
    replace: 'var(--wf-accent)', add: 'var(--wf-success)', remove: 'var(--wf-danger)',
    validate: 'var(--wf-stroke)', edit: '#3A6EA5', system: 'var(--wf-stroke-3)',
  };

  return (
    <div style={{ flex: 1, display: 'flex', height: '100%' }}>
      <Sidebar active={1} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <PageBar title="Audit log · planning" sub="Direction · 248 modifications · 30 derniers jours" actions={[
          { l: 'Exporter CSV' }, { l: 'Restaurer version', primary: false }
        ]} />
        {/* Filters */}
        <div style={{ padding: '10px 24px', borderBottom: '1px dashed var(--wf-stroke-3)', display: 'flex', gap: 8, alignItems: 'center', background: 'var(--wf-paper)' }}>
          <Eyebrow>Filtrer</Eyebrow>
          <div className="wf-pill" style={{ background: 'var(--wf-stroke)', color: '#fff', borderColor: 'var(--wf-stroke)' }}>Tous (248)</div>
          <div className="wf-pill">Remplacements (42)</div>
          <div className="wf-pill">Ajouts (88)</div>
          <div className="wf-pill is-incident">Annulations (24)</div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--wf-stroke-2)' }}>
            <span>Période :</span>
            <div className="wf-pill">7 j</div>
            <div className="wf-pill" style={{ background: 'var(--wf-paper-2)' }}>30 j</div>
            <div className="wf-pill">Personnalisé</div>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Timeline */}
          <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
            {events.map((g, gi) => (
              <div key={gi} style={{ marginBottom: 24 }}>
                <Eyebrow>{g.day}</Eyebrow>
                <div style={{ marginTop: 10, position: 'relative', paddingLeft: 18 }}>
                  {/* vertical line */}
                  <div style={{ position: 'absolute', left: 5, top: 6, bottom: 6, width: 1, background: 'var(--wf-stroke-3)' }} />
                  {g.items.map((it, i) => (
                    <div key={i} style={{ position: 'relative', paddingBottom: 14 }}>
                      <div style={{
                        position: 'absolute', left: -17, top: 4,
                        width: 10, height: 10, borderRadius: '50%',
                        background: kindColor[it.kind] || 'var(--wf-stroke)',
                        border: '2px solid #fff', boxShadow: '0 0 0 1.5px var(--wf-stroke-3)',
                      }} />
                      <div className="wf-box" style={{ background: '#fff', padding: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12 }}>{it.t}</span>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{it.action}</span>
                            <span style={{ fontSize: 12, color: 'var(--wf-stroke-2)' }}>· {it.target}</span>
                          </div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--wf-stroke-2)' }}>{it.who}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                          {it.reason && (
                            <div style={{ fontSize: 11, color: 'var(--wf-stroke-2)' }}>
                              <span style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 9, marginRight: 6 }}>Raison</span>
                              {it.reason}
                            </div>
                          )}
                          {it.notify && (
                            <span className="wf-pill is-live" style={{ fontSize: 9 }}><span className="dot" />{it.notify}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* Detail panel */}
          <div style={{ width: 320, borderLeft: '1.5px solid var(--wf-stroke)', overflow: 'auto', background: '#fff', padding: 16 }}>
            <Eyebrow>Détail · 11:42 — Remplacement</Eyebrow>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>D1 → D5 · 14:40 DOUJANI</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--wf-stroke-2)', marginTop: 2 }}>par M. Aubin · IP 41.x.x.12</div>

            <div className="wf-box-soft" style={{ padding: 10, marginTop: 14 }}>
              <Eyebrow>Avant</Eyebrow>
              <div style={{ fontSize: 12, marginTop: 4 }}><b>D1</b> · MOHAMED Ali · 14:40-18:10</div>
            </div>
            <div style={{ textAlign: 'center', fontFamily: 'var(--font-hand)', fontSize: 18, color: 'var(--wf-accent)', margin: '4px 0' }}>↓</div>
            <div className="wf-box" style={{ padding: 10, background: 'var(--wf-accent-soft)', borderColor: 'var(--wf-accent)' }}>
              <Eyebrow>Après</Eyebrow>
              <div style={{ fontSize: 12, marginTop: 4 }}><b>D5</b> · AMINA Selemani · 14:40-18:10</div>
            </div>

            <Eyebrow style={{ marginTop: 18 }}>Notifications envoyées</Eyebrow>
            <ul style={{ fontSize: 11, color: 'var(--wf-stroke-2)', paddingLeft: 16, lineHeight: 1.7, marginTop: 4 }}>
              <li>FCM push → D5 · livré 11:42:04</li>
              <li>FCM push → D1 · livré 11:42:04</li>
              <li>Email CADEMA · envoyé 11:42:08</li>
            </ul>

            <div className="tap-btn" style={{ width: '100%', height: 36, fontSize: 12, marginTop: 16 }}>↶ Annuler ce changement</div>
            <div style={{ fontSize: 10, color: 'var(--wf-stroke-2)', textAlign: 'center', marginTop: 6 }}>↳ jusqu'à 24 h après l'action</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// E4 ▸ RECHERCHE GLOBALE ⌘K
// ─────────────────────────────────────────────────────────────────────
const CommandPalette = () => {
  const sections = [
    {
      l: 'Chauffeurs',
      items: [
        { code: 'CH', main: 'D1 · MOHAMED Ali', sub: 'L3 · en service · 5:00-8:30', shortcut: '⏎' },
        { code: 'CH', main: 'D5 · AMINA Selemani', sub: 'L3 · libre 6:00-8:30' },
      ],
    },
    {
      l: 'Courses',
      items: [
        { code: 'CO', main: 'C-2026-0387 · 14:40 DOUJANI → Passot Barge', sub: 'D1 · vendredi 8 mai · 9 voyageurs' },
        { code: 'CO', main: 'C-2026-0388 · 16:00 PEM Passamainty', sub: 'D14 · vendredi 8 mai · ajouté 11:14' },
      ],
    },
    {
      l: 'Factures',
      items: [
        { code: 'FA', main: 'F-2026-0114 · 4 218,00 €', sub: 'CADEMA · L4 mars 2026 · à valider', tag: 'À valider' },
      ],
    },
    {
      l: 'Clients · contrats',
      items: [
        { code: 'CL', main: 'CADEMA — L4 Caribus', sub: '618 trajets · 8 412 voyageurs · mars 2026' },
      ],
    },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Sidebar active={0} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', filter: 'blur(2px) saturate(0.4)', opacity: 0.55 }}>
        <PageBar title="Tableau de bord" sub="Direction" actions={[]} />
        <div style={{ flex: 1, padding: 24, background: 'var(--wf-paper)' }}>
          <div className="wf-box" style={{ height: 120, background: '#fff' }} />
          <div className="wf-box" style={{ height: 200, background: '#fff', marginTop: 12 }} />
        </div>
      </div>
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,15,16,0.42)' }} />
      {/* Palette */}
      <div className="wf-box" style={{
        position: 'absolute', left: '50%', top: 80, transform: 'translateX(-50%)',
        width: 640, background: '#fff', boxShadow: '0 30px 80px rgba(20,15,16,0.4)',
        display: 'flex', flexDirection: 'column', maxHeight: 'calc(100% - 100px)',
      }}>
        {/* Search input */}
        <div style={{ padding: '14px 16px', borderBottom: '1.5px solid var(--wf-stroke)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--wf-stroke-2)' }}>⌕</span>
          <div style={{ flex: 1, fontSize: 16 }}>
            <span>cademaq</span>
            <span style={{
              display: 'inline-block', width: 1.5, height: 18, background: 'var(--wf-stroke)',
              verticalAlign: 'middle', marginLeft: 2, animation: 'none',
            }} />
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <kbd style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 6px',
              border: '1px solid var(--wf-stroke-3)', borderRadius: 4, background: 'var(--wf-paper)',
            }}>esc</kbd>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--wf-stroke-2)' }}>fermer</span>
          </div>
        </div>
        {/* Scopes */}
        <div style={{ padding: '8px 14px', borderBottom: '1px dashed var(--wf-stroke-3)', display: 'flex', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 10, alignItems: 'center' }}>
          <span style={{ color: 'var(--wf-stroke-2)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Cherche dans :</span>
          {['Tout', 'Chauffeurs', 'Courses', 'Factures', 'Clients'].map((s, i) => (
            <span key={i} className="wf-pill" style={{
              fontSize: 9,
              background: i === 0 ? 'var(--wf-stroke)' : '#fff',
              color: i === 0 ? '#fff' : 'var(--wf-stroke)',
              borderColor: i === 0 ? 'var(--wf-stroke)' : 'var(--wf-stroke-3)',
            }}>{s}</span>
          ))}
        </div>
        {/* Results */}
        <div style={{ overflow: 'auto', flex: 1 }}>
          {sections.map((sec, si) => (
            <div key={si}>
              <div style={{ padding: '10px 16px 4px', display: 'flex', justifyContent: 'space-between' }}>
                <Eyebrow>{sec.l}</Eyebrow>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--wf-stroke-2)' }}>{sec.items.length} résultat{sec.items.length > 1 ? 's' : ''}</span>
              </div>
              {sec.items.map((it, i) => {
                const active = si === 2 && i === 0; // highlight invoice (matches "cadema")
                return (
                  <div key={i} style={{
                    padding: '10px 16px',
                    background: active ? 'var(--wf-accent-soft)' : '#fff',
                    borderLeft: active ? '3px solid var(--wf-accent)' : '3px solid transparent',
                    display: 'grid', gridTemplateColumns: '32px 1fr auto', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: 4,
                      background: active ? 'var(--wf-accent)' : 'var(--wf-paper-2)',
                      color: active ? '#fff' : 'var(--wf-stroke)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                    }}>{it.code}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {it.main.split(/(cadema)/i).map((part, pi) =>
                          part.toLowerCase() === 'cadema'
                            ? <mark key={pi} style={{ background: 'rgba(242,100,25,0.35)', color: 'var(--wf-stroke)', padding: '0 2px' }}>{part}</mark>
                            : <span key={pi}>{part}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--wf-stroke-2)', marginTop: 2 }}>{it.sub}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {it.tag && <span className="wf-pill is-incident" style={{ fontSize: 9 }}>{it.tag}</span>}
                      {active && (
                        <kbd style={{
                          fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 6px',
                          border: '1px solid var(--wf-stroke-3)', borderRadius: 4, background: 'var(--wf-paper)',
                        }}>⏎</kbd>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {/* Footer */}
        <div style={{
          padding: '10px 16px', borderTop: '1.5px solid var(--wf-stroke)', background: 'var(--wf-paper)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--wf-stroke-2)',
        }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <span><kbd style={{ padding: '1px 5px', border: '1px solid var(--wf-stroke-3)', borderRadius: 3, background: '#fff' }}>↑↓</kbd> naviguer</span>
            <span><kbd style={{ padding: '1px 5px', border: '1px solid var(--wf-stroke-3)', borderRadius: 3, background: '#fff' }}>⏎</kbd> ouvrir</span>
            <span><kbd style={{ padding: '1px 5px', border: '1px solid var(--wf-stroke-3)', borderRadius: 3, background: '#fff' }}>⌘K</kbd> ouvrir partout</span>
          </div>
          <span>9 résultats · 38 ms</span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// E5 ▸ ALERTE GLOBALE — bandeau, toast, sidebar pulsing
// ─────────────────────────────────────────────────────────────────────
const GlobalAlertView = () => (
  <div style={{ flex: 1, display: 'flex', height: '100%', position: 'relative' }}>
    {/* Sidebar custom avec badge pulsant sur Carte */}
    <div style={{ width: 200, background: 'var(--wf-paper)', borderRight: '1.5px solid var(--wf-stroke)', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 6px 14px' }}>
        <img src="assets/logo-aissociate.png" style={{ width: 30, height: 30 }} alt="" />
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700 }}>Vanille</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.16em', color: 'var(--wf-stroke-2)', textTransform: 'uppercase' }}>Direction</div>
        </div>
      </div>
      {['Tableau de bord', 'Planning', 'Carte temps réel', 'Chauffeurs', 'Clients', 'Factures', 'Rapports', 'Paramètres'].map((it, i) => {
        const active = i === 0;
        const alert = i === 2;
        return (
          <div key={i} style={{
            padding: '8px 10px', borderRadius: 6,
            background: active ? 'var(--wf-stroke)' : 'transparent',
            color: active ? '#fff' : 'var(--wf-stroke-2)',
            fontWeight: active ? 700 : 500, fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            border: alert ? '1.5px solid var(--wf-danger)' : 'none',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {alert && <span style={{
                width: 10, height: 10, borderRadius: '50%',
                background: 'var(--wf-danger)', animation: 'wfPulseRing 1.4s infinite',
              }} />}
              {it}
            </span>
            {alert && <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 800,
              background: 'var(--wf-danger)', color: '#fff', padding: '2px 6px', borderRadius: 999,
            }}>2</span>}
          </div>
        );
      })}
    </div>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <PageBar title="Tableau de bord" sub="Direction · vendredi 8 mai · 11:42" actions={[{ l: 'Jour' }, { l: 'Semaine' }]} />
      <AlertBanner kind="incident" driver="D7 · COMBO Said" message="Vocal incident reçu · M'tsapéré · panne moteur — demande remplaçant 12:00" age="14 s" />
      <div style={{ flex: 1, padding: 24, background: 'var(--wf-paper)', overflow: 'auto' }}>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[['CA semaine', '12 480 €', '↑ 6 %'], ['Courses', '187', '↑ 12'], ['Ponctualité', '94,2 %'], ['Incidents', '1 ouvert', 'D7']].map(([l, v, d], i) => (
            <div key={i} className="wf-box" style={{ padding: 14, background: '#fff', borderColor: i === 3 ? 'var(--wf-danger)' : 'var(--wf-stroke)', position: 'relative' }}>
              {i === 3 && <span style={{ position: 'absolute', top: 8, right: 8, width: 10, height: 10, borderRadius: '50%', background: 'var(--wf-danger)', animation: 'wfPulseRing 1.4s infinite' }} />}
              <Eyebrow>{l}</Eyebrow>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 26, marginTop: 6 }}>{v}</div>
              <div style={{ fontSize: 11, color: 'var(--wf-stroke-2)', marginTop: 4 }}>{d}</div>
            </div>
          ))}
        </div>
        {/* Toast bottom-right */}
        <div style={{ position: 'absolute', right: 24, bottom: 24, width: 320 }}>
          <div className="wf-box" style={{
            padding: 12, background: '#fff',
            borderColor: 'var(--wf-danger)', borderWidth: 2,
            boxShadow: '0 12px 30px rgba(209,58,42,0.25)',
          }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: 'var(--wf-danger)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, animation: 'wfPulseRing 1.4s infinite',
              }}>!</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>Nouvel incident</div>
                <div style={{ fontSize: 11, color: 'var(--wf-stroke-2)', marginTop: 2 }}>D7 a envoyé un vocal il y a 14 s</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <div className="tap-btn tap-btn-danger" style={{ padding: '4px 10px', height: 26, fontSize: 11 }}>Ouvrir</div>
                  <div className="tap-btn" style={{ padding: '4px 10px', height: 26, fontSize: 11 }}>Plus tard</div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-hand)', fontSize: 14, color: 'var(--wf-accent)', textAlign: 'right', marginTop: 6 }}>+ son court (option)</div>
        </div>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────
// E6 ▸ CRÉATION DE FACTURE — assistant 4 étapes, données auto
// ─────────────────────────────────────────────────────────────────────
const InvoiceCreate = () => (
  <div style={{ flex: 1, display: 'flex', height: '100%' }}>
    <Sidebar active={5} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <PageBar title="Nouvelle facture client" sub="Direction · Factures › Nouvelle" actions={[
        { l: '← Retour' }, { l: 'Enregistrer brouillon' }, { l: 'Émettre la facture', primary: true }
      ]} />
      {/* Stepper */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1.5px solid var(--wf-stroke)', background: 'var(--wf-paper)' }}>
        {[
          ['1', 'Client & période', true],
          ['2', 'Lignes (auto)',    true],
          ['3', 'Ajustements',      false],
          ['4', 'Émettre',          false],
        ].map(([n, l, done], i) => (
          <div key={i} style={{
            padding: '10px 14px', borderRight: i < 3 ? '1px solid var(--wf-stroke-3)' : 'none',
            background: i === 1 ? '#fff' : 'transparent',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: done || i === 1 ? 'var(--wf-stroke)' : '#fff',
              color: done || i === 1 ? '#fff' : 'var(--wf-stroke-2)',
              border: '1.5px solid var(--wf-stroke)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
            }}>{done ? '✓' : n}</div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--wf-stroke-2)' }}>Étape {n}</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{l}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left — form */}
        <div style={{ flex: 1, padding: 18, overflow: 'auto', background: 'var(--wf-paper)' }}>
          {/* Récap step 1 */}
          <div className="wf-box-soft" style={{ padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Eyebrow>Étape 1 · validée</Eyebrow>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>CADEMA — Ligne 4 Caribus · Mars 2026</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--wf-stroke-2)', marginTop: 2 }}>Contrat C-2024-04 · forfait 6,80 € / trajet · 642 prévus</div>
              </div>
              <span className="wf-hand-note" style={{ fontSize: 13 }}>← modifier</span>
            </div>
          </div>

          {/* Lignes auto */}
          <div className="wf-box" style={{ marginTop: 14, background: '#fff' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1.5px solid var(--wf-stroke)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Eyebrow>Lignes calculées · 4 · depuis Planning + Replay GPS</Eyebrow>
              <div style={{ display: 'flex', gap: 6 }}>
                <div className="tap-btn" style={{ padding: '4px 10px', height: 26, fontSize: 11 }}>↻ Recalculer</div>
                <div className="tap-btn" style={{ padding: '4px 10px', height: 26, fontSize: 11 }}>+ Ligne manuelle</div>
              </div>
            </div>
            <div style={{ padding: '0' }}>
              {[
                ['Trajets effectués L4', '618 trajets', '6,80 €', '4 202,40 €', 'auto · Planning + GPS'],
                ['Voyageurs transportés', '8 412 vy', '— info —', '—', 'auto · Replay GPS'],
                ['Pénalité ponctualité (>10 mn × 18)', '18 × 22 €', '−22,00 €', '−396,00 €', 'auto · Contrat §4.2'],
                ['Course supplémentaire CADEMA-EXT', '4 trajets', '8,50 €', '34,00 €', 'auto · Demandes ad hoc'],
              ].map(([l, q, p, t, src], i, arr) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '2fr 90px 80px 110px 30px',
                  alignItems: 'center', gap: 10, padding: '10px 14px',
                  borderBottom: i < arr.length - 1 ? '1px dashed var(--wf-stroke-3)' : 'none',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{l}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--wf-stroke-2)', marginTop: 2 }}>↳ {src}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{q}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{p}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, textAlign: 'right' }}>{t}</div>
                  <div className="tap-btn" style={{ width: 24, height: 24, fontSize: 11 }}>✎</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 14px', background: 'var(--wf-paper-2)', display: 'flex', justifyContent: 'space-between', borderTop: '1.5px solid var(--wf-stroke)' }}>
              <div style={{ fontSize: 11, color: 'var(--wf-stroke-2)' }}>HT · TVA non applicable, art. 293 B CGI</div>
              <div style={{ display: 'flex', gap: 18, alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--wf-stroke-2)' }}>Total</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 800 }}>3 840,40 €</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="wf-box" style={{ marginTop: 14, padding: 12, background: '#fff' }}>
            <Eyebrow>Note client (optionnelle)</Eyebrow>
            <div style={{ marginTop: 6, padding: 10, border: '1px dashed var(--wf-stroke-3)', borderRadius: 4, fontSize: 12, color: 'var(--wf-stroke-2)', minHeight: 50 }}>
              Mois clôturé au 31/03/2026 · 96,3 % de réalisation · merci à toute l'équipe CADEMA.
            </div>
          </div>
        </div>

        {/* Right — aperçu */}
        <div style={{ width: 380, borderLeft: '1.5px solid var(--wf-stroke)', background: 'var(--wf-paper-2)', overflow: 'auto', padding: 18 }}>
          <Eyebrow>Aperçu PDF · A4</Eyebrow>
          <div style={{ marginTop: 8, background: '#fff', border: '1.5px solid var(--wf-stroke)', padding: 18, fontSize: 11, lineHeight: 1.5, fontFamily: 'var(--font-sans)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em' }}>TAXI VANILLE</div>
                <div style={{ fontSize: 9, color: 'var(--wf-stroke-2)' }}>Mamoudzou · Mayotte</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700 }}>FACTURE</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>F-2026-0114 · 03/04/2026</div>
              </div>
            </div>
            <div style={{ height: 10 }} />
            <div style={{ fontSize: 10 }}>Client · <b>CADEMA</b><br/>Place Mariage · 97600 Mamoudzou</div>
            <div style={{ height: 12 }} />
            <div style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>
              {[
                ['Trajets L4', '618 × 6,80', '4 202,40 €'],
                ['Voyageurs', '8 412', '—'],
                ['Pénalité', '18 × 22', '−396,00 €'],
                ['Suppl.', '4 × 8,50', '34,00 €'],
              ].map(([l, q, t], i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 0.9fr', padding: '4px 0', fontSize: 9, borderTop: i ? '1px dotted var(--wf-stroke-3)' : 'none' }}>
                  <span>{l}</span><span style={{ fontFamily: 'var(--font-mono)' }}>{q}</span><span style={{ fontFamily: 'var(--font-mono)', textAlign: 'right' }}>{t}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontWeight: 700 }}>
              <span>Total HT</span><span style={{ fontFamily: 'var(--font-mono)' }}>3 840,40 €</span>
            </div>
            <div style={{ fontSize: 8, color: 'var(--wf-stroke-2)', marginTop: 14 }}>Règlement à 30 j · IBAN FR76 …</div>
          </div>
          <div style={{ marginTop: 14, fontSize: 11, color: 'var(--wf-stroke-2)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>↳ Auto-numérotée · F-2026-0114</span>
            <span>↳ Envoi e-mail à comptabilite@cadema.yt</span>
            <span>↳ Copie classée /factures/2026/04/</span>
          </div>
          <div className="tap-btn tap-btn-accent" style={{ width: '100%', height: 38, fontSize: 13, marginTop: 14 }}>Émettre &amp; envoyer →</div>
        </div>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────
// E7 ▸ RAPPORT SUR MESURE — croiseur multi-sources
// ─────────────────────────────────────────────────────────────────────
const CustomReportBuilder = () => {
  const sources = [
    { label: 'Courses',    fields: ['Date', 'Heure', 'Ligne', 'Origine', 'Destination', 'Statut', 'Voyageurs'], on: ['Date', 'Ligne', 'Voyageurs'] },
    { label: 'Chauffeurs', fields: ['Code', 'Nom', 'Ligne habituelle', 'Ancienneté'], on: ['Nom'] },
    { label: 'Clients',    fields: ['Nom', 'Contrat', 'Tarif', 'Période'], on: ['Nom'] },
    { label: 'Factures',   fields: ['N°', 'Statut', 'Montant HT'], on: [] },
    { label: 'Incidents',  fields: ['Date', 'Type', 'Cause', 'Résolution'], on: [] },
    { label: 'GPS / Replay', fields: ['Distance', 'Vitesse moy.', 'Arrêts'], on: [] },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', height: '100%' }}>
      <Sidebar active={6} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <PageBar title="Rapport sur mesure" sub="Direction · Rapports › Sur mesure" actions={[
          { l: '← Retour' }, { l: 'Enregistrer modèle' }, { l: 'Exporter Excel' }, { l: 'Générer PDF', primary: true }
        ]} />
        {/* Filter strip */}
        <div style={{ padding: '10px 24px', borderBottom: '1px dashed var(--wf-stroke-3)', display: 'flex', gap: 8, alignItems: 'center', background: 'var(--wf-paper)', flexWrap: 'wrap' }}>
          <Eyebrow>Filtres globaux</Eyebrow>
          <div className="wf-pill" style={{ background: 'var(--wf-stroke)', color: '#fff', borderColor: 'var(--wf-stroke)' }}>Période : Mars 2026</div>
          <div className="wf-pill">Client : CADEMA</div>
          <div className="wf-pill">Ligne : L4</div>
          <div className="wf-pill">Chauffeurs : tous</div>
          <div className="wf-pill" style={{ borderStyle: 'dashed' }}>+ Ajouter filtre</div>
          <div style={{ flex: 1 }} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--wf-stroke-2)' }}>Aperçu live · 618 lignes</div>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* LEFT — sources & fields */}
          <div style={{ width: 260, borderRight: '1.5px solid var(--wf-stroke)', overflow: 'auto', padding: 14, background: '#fff' }}>
            <Eyebrow>1. Sources de données</Eyebrow>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sources.map((src, i) => (
                <div key={i} className="wf-box-soft" style={{ padding: 8, background: src.on.length ? 'var(--wf-accent-soft)' : '#fff', borderColor: src.on.length ? 'var(--wf-accent)' : 'var(--wf-stroke-3)', borderStyle: src.on.length ? 'solid' : 'dashed' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{src.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--wf-stroke-2)' }}>{src.on.length}/{src.fields.length}</span>
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {src.fields.map((f, j) => {
                      const active = src.on.includes(f);
                      return (
                        <span key={j} style={{
                          fontFamily: 'var(--font-mono)', fontSize: 9,
                          padding: '2px 6px', borderRadius: 3,
                          border: '1px solid ' + (active ? 'var(--wf-accent)' : 'var(--wf-stroke-3)'),
                          background: active ? 'var(--wf-accent)' : '#fff',
                          color: active ? '#fff' : 'var(--wf-stroke-2)',
                        }}>{active ? '✓ ' : '+ '}{f}</span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, fontFamily: 'var(--font-hand)', fontSize: 14, color: 'var(--wf-accent)' }}>↳ glisser un champ dans la zone droite</div>
          </div>

          {/* CENTER — query/group + preview */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: 14, borderBottom: '1px dashed var(--wf-stroke-3)', display: 'flex', gap: 14, alignItems: 'flex-start', background: 'var(--wf-paper)' }}>
              <div style={{ flex: 1 }}>
                <Eyebrow>2. Grouper par</Eyebrow>
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  <span className="wf-pill" style={{ background: 'var(--wf-stroke)', color: '#fff', borderColor: 'var(--wf-stroke)', fontSize: 10 }}>Date · jour</span>
                  <span className="wf-pill" style={{ background: 'var(--wf-stroke)', color: '#fff', borderColor: 'var(--wf-stroke)', fontSize: 10 }}>Chauffeur</span>
                  <span className="wf-pill" style={{ borderStyle: 'dashed', fontSize: 10 }}>+ champ</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <Eyebrow>3. Mesures</Eyebrow>
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  <span className="wf-pill" style={{ background: 'var(--wf-accent)', color: '#fff', borderColor: 'var(--wf-accent)', fontSize: 10 }}>Σ Voyageurs</span>
                  <span className="wf-pill" style={{ background: 'var(--wf-accent)', color: '#fff', borderColor: 'var(--wf-accent)', fontSize: 10 }}># Trajets</span>
                  <span className="wf-pill" style={{ background: 'var(--wf-accent)', color: '#fff', borderColor: 'var(--wf-accent)', fontSize: 10 }}>% Ponctualité</span>
                  <span className="wf-pill" style={{ borderStyle: 'dashed', fontSize: 10 }}>+ mesure</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <Eyebrow>4. Visualisation</Eyebrow>
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  {['Tableau', 'Barres', 'Courbe', 'Heatmap'].map((v, i) => (
                    <div key={v} className={i === 1 ? 'tap-btn tap-btn-accent' : 'tap-btn'} style={{ padding: '4px 10px', height: 28, fontSize: 11 }}>{v}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Live preview */}
            <div style={{ flex: 1, padding: 18, overflow: 'auto', background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Eyebrow>Aperçu live · CADEMA L4 · mars 2026</Eyebrow>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--wf-stroke-2)' }}>9 lignes · maj il y a 2 s</span>
              </div>
              {/* Bars chart */}
              <div className="wf-box" style={{ padding: 14, marginTop: 10, background: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160 }}>
                  {[68, 74, 71, 81, 65, 78, 84, 70, 76].map((h, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--wf-stroke-2)' }}>{h}</div>
                      <div style={{ width: '100%', height: `${h * 1.4}px`, background: 'var(--wf-accent)', borderRadius: '3px 3px 0 0' }} />
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--wf-stroke-2)' }}>C{i+1}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: 'var(--wf-stroke-2)' }}>Trajets effectués par chauffeur · L4 · mars 2026</div>
              </div>

              {/* Result table */}
              <div className="wf-box" style={{ marginTop: 14, background: '#fff', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--wf-paper-2)', borderBottom: '1.5px solid var(--wf-stroke)' }}>
                      {['Chauffeur', 'Trajets', 'Voyageurs', 'Pénalités', 'Ponctualité'].map((h, i) => (
                        <th key={i} style={{ textAlign: i ? 'right' : 'left', padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--wf-stroke-2)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['C1 · EL ANZIZE Hamada',     84, 1148, 1, '96 %'],
                      ['C14 · MANSOUR Kamardine',   81, 1102, 0, '98 %'],
                      ['C8 · HADHURAMI Makinedine', 78, 1056, 2, '92 %'],
                      ['C5 · AHAMADI Raenmouddine', 72,  982, 1, '95 %'],
                      ['C6 · OUSSENI Soula',        70,  941, 3, '88 %'],
                    ].map((r, i, arr) => (
                      <tr key={i} style={{ borderBottom: i < arr.length - 1 ? '1px dashed var(--wf-stroke-3)' : 'none' }}>
                        {r.map((c, j) => (
                          <td key={j} style={{
                            padding: '8px 12px', textAlign: j ? 'right' : 'left',
                            fontFamily: j ? 'var(--font-mono)' : 'var(--font-sans)',
                            fontWeight: j === 0 ? 600 : 500,
                          }}>{c}</td>
                        ))}
                      </tr>
                    ))}
                    <tr style={{ background: 'var(--wf-paper)', borderTop: '1.5px solid var(--wf-stroke)' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700 }}>Total</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>385</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>5 229</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>7</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>94 %</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT — saved templates */}
          <div style={{ width: 220, borderLeft: '1.5px solid var(--wf-stroke)', overflow: 'auto', padding: 14, background: 'var(--wf-paper)' }}>
            <Eyebrow>Modèles enregistrés</Eyebrow>
            {[
              ['Mensuel CADEMA',   'Date, Chauffeur · Σ Vy', true],
              ['Hebdo CDM',        'Jour, Ligne · # Trajets'],
              ['Incidents 30 j',   'Type, Cause · #'],
              ['Comparatif Q1',    'Mois, Client · CA'],
            ].map(([n, s, active], i) => (
              <div key={i} className="wf-box-soft" style={{
                padding: 10, marginTop: 8,
                background: active ? '#fff' : 'transparent',
                borderColor: active ? 'var(--wf-accent)' : 'var(--wf-stroke-3)',
                borderStyle: 'solid', borderWidth: active ? 1.5 : 1,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{n}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--wf-stroke-2)', marginTop: 2 }}>{s}</div>
              </div>
            ))}
            <div className="tap-btn" style={{ width: '100%', height: 32, fontSize: 11, marginTop: 12 }}>+ Nouveau modèle</div>
            <div style={{ marginTop: 18 }}>
              <Eyebrow>Planifier l'envoi</Eyebrow>
              <div style={{ fontSize: 11, color: 'var(--wf-stroke-2)', marginTop: 6 }}>☐ chaque 1<sup>er</sup> du mois<br/>☐ comptabilite@cadema.yt</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, {
  AlertBanner,
  ReplaceDriverModal,
  IncidentVoicePlayer,
  AuditLog,
  CommandPalette,
  GlobalAlertView,
  InvoiceCreate,
  CustomReportBuilder,
});
