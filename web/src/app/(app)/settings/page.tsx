'use client';
import { useState, useEffect } from 'react';
import { PageBar, Eyebrow, Btn } from '@/components/ui';
import toast from 'react-hot-toast';
import { useSettingsSection } from '@/lib/useSettingsSection';

/* ───────────────────────── helpers ───────────────────────── */

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!on)} style={{
      width: 44, height: 24, borderRadius: 999, cursor: 'pointer', flexShrink: 0,
      background: on ? 'var(--brand)' : 'var(--stroke3)', position: 'relative',
      transition: 'background .2s',
    }}>
      <div style={{
        position: 'absolute', top: 3, left: on ? 23 : 3, width: 18, height: 18,
        borderRadius: '50%', background: '#fff', transition: 'left .2s',
        boxShadow: '0 1px 3px rgba(0,0,0,.25)',
      }}/>
    </div>
  );
}

function Field({ label, value, onChange, unit }: { label: string; value: string; onChange: (v: string) => void; unit?: string }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--stroke2)', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input value={value} onChange={e => onChange(e.target.value)}
          style={{ border: '1.25px solid var(--stroke3)', borderRadius: 6, padding: '8px 10px', fontSize: 13, fontFamily: 'var(--font-mono)', width: '100%', outline: 'none' }}/>
        {unit && <span style={{ fontSize: 12, color: 'var(--stroke2)', flexShrink: 0 }}>{unit}</span>}
      </div>
    </div>
  );
}

function AlertRow({ label, sub, on, onChange }: { label: string; sub: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: '1px dashed var(--stroke3)', gap: 16 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--info)', marginTop: 2 }}>{sub}</div>
      </div>
      <Toggle on={on} onChange={onChange}/>
    </div>
  );
}

function UserRow({ name, role, email, last }: { name: string; role: string; email: string; last: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 200px 120px 80px', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px dashed var(--stroke3)', fontSize: 12 }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{name}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--stroke2)' }}>{email}</div>
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 8px', borderRadius: 999, border: '1px solid var(--stroke3)', color: 'var(--stroke2)' }}>{role}</span>
      <span style={{ color: 'var(--stroke2)' }}>{email}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--stroke3)' }}>{last}</span>
      <Btn sm>Modifier</Btn>
    </div>
  );
}

/* ───────────────────────── tab contents ───────────────────── */

const DEF_ENTREPRISE = { nom: 'Taxi Vanille', siret: '84512307600019', adresse: 'Rue du Commerce · 97600 Mamoudzou', tel: '+262 639 00 00 00', email: 'direction@taxivanille.yt', iban: 'FR76 1027 8060 0000 0000 0000 000' };

function TabEntreprise() {
  const [vals, setVals] = useSettingsSection('entreprise', DEF_ENTREPRISE);
  const set = (k: keyof typeof vals) => (v: string) => setVals(p => ({ ...p, [k]: v }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card" style={{ background: '#fff', padding: 18 }}>
        <Eyebrow style={{ marginBottom: 14 }}>Identité de la société</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Raison sociale" value={vals.nom} onChange={set('nom')}/>
          <Field label="SIRET" value={vals.siret} onChange={set('siret')}/>
          <Field label="Adresse" value={vals.adresse} onChange={set('adresse')}/>
          <Field label="Téléphone" value={vals.tel} onChange={set('tel')}/>
          <Field label="Email direction" value={vals.email} onChange={set('email')}/>
          <Field label="IBAN société" value={vals.iban} onChange={set('iban')}/>
        </div>
      </div>
      <div className="card" style={{ background: '#fff', padding: 18 }}>
        <Eyebrow style={{ marginBottom: 14 }}>Logo & identité visuelle</Eyebrow>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 72, height: 72, borderRadius: 8, background: 'var(--stroke)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 22 }}>TV</div>
          <div>
            <Btn sm>Changer le logo</Btn>
            <div style={{ fontSize: 11, color: 'var(--stroke2)', marginTop: 6 }}>PNG · SVG · max 1 Mo · 512×512 px recommandé</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const COLOR_OPTS = [
  { label: 'Bleu marine (défaut)', value: 'var(--stroke)' },
  { label: 'Orange marque', value: 'var(--brand)' },
  { label: 'Bleu info', value: 'var(--info)' },
  { label: 'Vert succès', value: 'var(--success)' },
  { label: 'Rouge danger', value: 'var(--danger)' },
  { label: 'Ambre alerte', value: 'var(--warn)' },
];

interface Stop { nom: string; lat: number; lng: number; }
interface Ligne { code: string; label: string; am: string; pm: string; arrets: number; chauffeurs: number; color: string; stops?: Stop[]; }

const EMPTY_LIGNE: Omit<Ligne, 'chauffeurs'> = { code: '', label: '', am: '', pm: '', arrets: 0, color: 'var(--stroke)', stops: [] };

const inpSm: React.CSSProperties = {
  border: '1.25px solid var(--stroke3)', borderRadius: 5, padding: '5px 8px',
  fontSize: 12, fontFamily: 'var(--font-mono)', outline: 'none', boxSizing: 'border-box' as const,
};

function StopsEditor({ stops, onChange }: { stops: Stop[]; onChange: (s: Stop[]) => void }) {
  const [form, setForm] = useState({ nom: '', lat: '', lng: '' });
  const [err, setErr] = useState('');
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ nom: '', lat: '', lng: '' });
  const [editErr, setEditErr] = useState('');

  const handleAdd = () => {
    const lat = parseFloat(form.lat), lng = parseFloat(form.lng);
    if (!form.nom.trim()) { setErr('Nom requis'); return; }
    if (isNaN(lat) || lat < -90 || lat > 90) { setErr('Latitude invalide (ex: -12.788)'); return; }
    if (isNaN(lng) || lng < -180 || lng > 180) { setErr('Longitude invalide (ex: 45.227)'); return; }
    onChange([...stops, { nom: form.nom.trim(), lat, lng }]);
    setForm({ nom: '', lat: '', lng: '' });
    setErr('');
  };

  const startEdit = (i: number) => {
    setEditIdx(i);
    setEditForm({ nom: stops[i].nom, lat: String(stops[i].lat), lng: String(stops[i].lng) });
    setEditErr('');
  };

  const saveEdit = () => {
    const lat = parseFloat(editForm.lat), lng = parseFloat(editForm.lng);
    if (!editForm.nom.trim()) { setEditErr('Nom requis'); return; }
    if (isNaN(lat) || lat < -90 || lat > 90) { setEditErr('Latitude invalide'); return; }
    if (isNaN(lng) || lng < -180 || lng > 180) { setEditErr('Longitude invalide'); return; }
    const s = [...stops];
    s[editIdx!] = { nom: editForm.nom.trim(), lat, lng };
    onChange(s);
    setEditIdx(null);
    setEditErr('');
  };

  const move = (i: number, dir: -1 | 1) => {
    const s = [...stops];
    const j = i + dir;
    if (j < 0 || j >= s.length) return;
    [s[i], s[j]] = [s[j], s[i]];
    onChange(s);
  };

  const remove = (i: number) => onChange(stops.filter((_, idx) => idx !== i));

  return (
    <div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--stroke2)', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Points GPS des arrêts <span style={{ color: 'var(--stroke3)', fontWeight: 400 }}>· ordre AM →</span></span>
        <span style={{ color: 'var(--stroke3)', fontWeight: 400 }}>{stops.length} arrêt{stops.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Liste */}
      {stops.length > 0 && (
        <div style={{ border: '1.25px solid var(--stroke3)', borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
          {stops.map((s, i) => {
            const isEditing = editIdx === i;
            return (
              <div key={i} style={{ borderBottom: i < stops.length - 1 ? '1px dashed var(--stroke4)' : 'none', background: isEditing ? 'rgba(242,100,25,.04)' : i % 2 === 0 ? '#fff' : 'var(--paper)' }}>
                {isEditing ? (
                  /* ── Ligne en édition ── */
                  <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px', gap: 6 }}>
                      <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--stroke3)', marginBottom: 3 }}>Nom</div>
                        <input value={editForm.nom} onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))}
                          autoFocus style={{ ...inpSm, width: '100%' }}
                          onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditIdx(null); }} />
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--stroke3)', marginBottom: 3 }}>Latitude</div>
                        <input value={editForm.lat} onChange={e => setEditForm(f => ({ ...f, lat: e.target.value }))}
                          style={{ ...inpSm, width: '100%' }}
                          onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditIdx(null); }} />
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--stroke3)', marginBottom: 3 }}>Longitude</div>
                        <input value={editForm.lng} onChange={e => setEditForm(f => ({ ...f, lng: e.target.value }))}
                          style={{ ...inpSm, width: '100%' }}
                          onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditIdx(null); }} />
                      </div>
                    </div>
                    {editErr && <div style={{ fontSize: 10, color: 'var(--danger)' }}>{editErr}</div>}
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button onClick={saveEdit}
                        style={{ padding: '3px 10px', border: 'none', borderRadius: 4, background: 'var(--brand)', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                        ✓ Valider
                      </button>
                      <button onClick={() => { setEditIdx(null); setEditErr(''); }}
                        style={{ padding: '3px 10px', border: '1px solid var(--stroke3)', borderRadius: 4, background: '#fff', fontSize: 11, cursor: 'pointer', color: 'var(--stroke2)' }}>
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Ligne normale ── */
                  <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 90px 90px 68px', alignItems: 'center', gap: 6, padding: '7px 10px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--stroke3)', textAlign: 'center', fontWeight: 700 }}>{i + 1}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nom}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--stroke2)' }}>{s.lat.toFixed(4)}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--stroke2)' }}>{s.lng.toFixed(4)}</span>
                    <div style={{ display: 'flex', gap: 2 }}>
                      <button onClick={() => startEdit(i)} title="Modifier"
                        style={{ width: 18, height: 18, border: '1px solid var(--info)', borderRadius: 3, background: '#fff', cursor: 'pointer', fontSize: 9, padding: 0, lineHeight: 1, color: 'var(--info)' }}>✎</button>
                      <button onClick={() => move(i, -1)} disabled={i === 0} title="Monter"
                        style={{ width: 18, height: 18, border: '1px solid var(--stroke3)', borderRadius: 3, background: '#fff', cursor: 'pointer', fontSize: 9, padding: 0, lineHeight: 1, opacity: i === 0 ? .3 : 1 }}>▲</button>
                      <button onClick={() => move(i, 1)} disabled={i === stops.length - 1} title="Descendre"
                        style={{ width: 18, height: 18, border: '1px solid var(--stroke3)', borderRadius: 3, background: '#fff', cursor: 'pointer', fontSize: 9, padding: 0, lineHeight: 1, opacity: i === stops.length - 1 ? .3 : 1 }}>▼</button>
                      <button onClick={() => remove(i)} title="Supprimer"
                        style={{ width: 18, height: 18, border: '1px solid var(--danger)', borderRadius: 3, background: '#fff', cursor: 'pointer', fontSize: 11, padding: 0, lineHeight: 1, color: 'var(--danger)' }}>×</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Formulaire ajout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px auto', gap: 6, alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--stroke3)', marginBottom: 3 }}>Nom de l'arrêt</div>
          <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
            placeholder="ex. Mamoudzou Centre" style={{ ...inpSm, width: '100%' }}
            onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--stroke3)', marginBottom: 3 }}>Latitude</div>
          <input value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))}
            placeholder="-12.788" style={{ ...inpSm, width: '100%' }}
            onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--stroke3)', marginBottom: 3 }}>Longitude</div>
          <input value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))}
            placeholder="45.227" style={{ ...inpSm, width: '100%' }}
            onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        </div>
        <button onClick={handleAdd}
          style={{ height: 30, padding: '0 12px', border: 'none', borderRadius: 5, background: 'var(--brand)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          + Ajouter
        </button>
      </div>
      {err && <div style={{ fontSize: 10, color: 'var(--danger)', marginTop: 4 }}>{err}</div>}
      <div style={{ fontSize: 10, color: 'var(--stroke3)', marginTop: 5 }}>
        Coordonnées décimales WGS84 · ex. -12.7880 / 45.2270 pour Mamoudzou
      </div>
    </div>
  );
}

function NouvelleligneModal({ onClose, onSave }: { onClose: () => void; onSave: (l: Ligne) => void }) {
  const [form, setForm] = useState({ ...EMPTY_LIGNE, stops: [] as Stop[] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof form) => (v: string | number | Stop[]) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.code.trim()) e.code = 'Obligatoire';
    if (!form.label.trim()) e.label = 'Obligatoire';
    if (!form.am.trim()) e.am = 'Obligatoire';
    if (!form.pm.trim()) e.pm = 'Obligatoire';
    if (form.arrets < 2) e.arrets = 'Minimum 2 arrêts';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({ ...form, code: form.code.toUpperCase(), chauffeurs: 0 });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,15,16,.38)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', border: '1.5px solid var(--stroke)', borderRadius: 8, boxShadow: '0 30px 80px rgba(20,15,16,.35)', width: 640, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1.5px solid var(--stroke)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--stroke2)' }}>Paramétrage · Lignes & routes</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginTop: 4 }}>Nouvelle ligne</div>
          </div>
          <Btn sm onClick={onClose}>✕</Btn>
        </div>

        {/* Body scrollable */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>

          {/* Code + couleur */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--stroke2)', marginBottom: 6 }}>
                Code <span style={{ color: 'var(--danger)' }}>*</span>
              </div>
              <input value={form.code} onChange={e => set('code')(e.target.value.toUpperCase())}
                placeholder="ex. L5"
                style={{ width: '100%', border: `1.25px solid ${errors.code ? 'var(--danger)' : 'var(--stroke3)'}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', boxSizing: 'border-box' }}/>
              {errors.code && <div style={{ fontSize: 10, color: 'var(--danger)', marginTop: 3 }}>{errors.code}</div>}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--stroke2)', marginBottom: 6 }}>Couleur</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {COLOR_OPTS.map(c => (
                  <div key={c.value} onClick={() => set('color')(c.value)} title={c.label}
                    style={{ width: 22, height: 22, borderRadius: '50%', background: c.value, cursor: 'pointer',
                      border: form.color === c.value ? '3px solid var(--stroke)' : '2px solid transparent',
                      boxShadow: form.color === c.value ? '0 0 0 1px rgba(0,0,0,.2)' : 'none',
                      flexShrink: 0, transition: 'border .15s' }}/>
                ))}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--stroke2)', marginLeft: 4 }}>
                  {`Aperçu → `}
                  <span style={{ fontWeight: 800, padding: '1px 7px', border: `1.5px solid ${form.color}`, color: form.color, borderRadius: 3 }}>
                    {form.code || 'XX'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Libellé route */}
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--stroke2)', marginBottom: 6 }}>
              Itinéraire <span style={{ color: 'var(--danger)' }}>*</span>
            </div>
            <input value={form.label} onChange={e => set('label')(e.target.value)}
              placeholder="ex. Bouéni ↔ Mamoudzou"
              style={{ width: '100%', border: `1.25px solid ${errors.label ? 'var(--danger)' : 'var(--stroke3)'}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }}/>
            {errors.label && <div style={{ fontSize: 10, color: 'var(--danger)', marginTop: 3 }}>{errors.label}</div>}
          </div>

          {/* Directions AM / PM */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--stroke2)', marginBottom: 6 }}>
                Sens AM <span style={{ color: 'var(--danger)' }}>*</span>
              </div>
              <input value={form.am} onChange={e => set('am')(e.target.value)}
                placeholder="ex. → Mamoudzou"
                style={{ width: '100%', border: `1.25px solid ${errors.am ? 'var(--danger)' : 'var(--stroke3)'}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }}/>
              {errors.am && <div style={{ fontSize: 10, color: 'var(--danger)', marginTop: 3 }}>{errors.am}</div>}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--stroke2)', marginBottom: 6 }}>
                Sens PM <span style={{ color: 'var(--danger)' }}>*</span>
              </div>
              <input value={form.pm} onChange={e => set('pm')(e.target.value)}
                placeholder="ex. → Bouéni"
                style={{ width: '100%', border: `1.25px solid ${errors.pm ? 'var(--danger)' : 'var(--stroke3)'}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }}/>
              {errors.pm && <div style={{ fontSize: 10, color: 'var(--danger)', marginTop: 3 }}>{errors.pm}</div>}
            </div>
          </div>

          {/* Arrêts count */}
          <div style={{ width: 160 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--stroke2)', marginBottom: 6 }}>
              Nombre d'arrêts <span style={{ color: 'var(--danger)' }}>*</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="number" min={2} max={50} value={form.arrets || ''} onChange={e => set('arrets')(parseInt(e.target.value) || 0)}
                placeholder="0"
                style={{ width: '100%', border: `1.25px solid ${errors.arrets ? 'var(--danger)' : 'var(--stroke3)'}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, fontFamily: 'var(--font-mono)', boxSizing: 'border-box' }}/>
              <span style={{ fontSize: 12, color: 'var(--stroke2)', flexShrink: 0 }}>arrêts</span>
            </div>
            {errors.arrets && <div style={{ fontSize: 10, color: 'var(--danger)', marginTop: 3 }}>{errors.arrets}</div>}
          </div>

          {/* Points GPS arrêts */}
          <div style={{ borderTop: '1px dashed var(--stroke3)', paddingTop: 14 }}>
            <StopsEditor stops={form.stops ?? []} onChange={s => set('stops')(s)} />
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1.5px solid var(--stroke3)', display: 'flex', gap: 8, justifyContent: 'flex-end', background: 'var(--paper)', flexShrink: 0 }}>
          <Btn onClick={onClose}>Annuler</Btn>
          <Btn accent onClick={handleSave}>Créer la ligne →</Btn>
        </div>
      </div>
    </div>
  );
}

function ConfigurerLigneModal({ ligne, onClose, onSave }: { ligne: Ligne; onClose: () => void; onSave: (l: Ligne) => void }) {
  const [form, setForm] = useState({ ...ligne, stops: ligne.stops ?? [] as Stop[] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof form) => (v: string | number | Stop[]) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.label.trim()) e.label = 'Obligatoire';
    if (!form.am.trim()) e.am = 'Obligatoire';
    if (!form.pm.trim()) e.pm = 'Obligatoire';
    if (form.arrets < 2) e.arrets = 'Minimum 2 arrêts';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave(form);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,15,16,.38)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', border: '1.5px solid var(--stroke)', borderRadius: 8, boxShadow: '0 30px 80px rgba(20,15,16,.35)', width: 640, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        <div style={{ padding: '16px 20px', borderBottom: '1.5px solid var(--stroke)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--stroke2)' }}>Paramétrage · Lignes & routes</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginTop: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 800, padding: '2px 8px', borderRadius: 4, border: `1.5px solid ${form.color}`, color: form.color }}>{form.code}</span>
              Configurer la ligne
            </div>
          </div>
          <Btn sm onClick={onClose}>✕</Btn>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>

          {/* Couleur */}
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--stroke2)', marginBottom: 6 }}>Couleur</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {COLOR_OPTS.map(c => (
                <div key={c.value} onClick={() => set('color')(c.value)} title={c.label}
                  style={{ width: 22, height: 22, borderRadius: '50%', background: c.value, cursor: 'pointer',
                    border: form.color === c.value ? '3px solid var(--stroke)' : '2px solid transparent',
                    boxShadow: form.color === c.value ? '0 0 0 1px rgba(0,0,0,.2)' : 'none',
                    flexShrink: 0, transition: 'border .15s' }}/>
              ))}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--stroke2)', marginLeft: 4 }}>
                {`Aperçu → `}
                <span style={{ fontWeight: 800, padding: '1px 7px', border: `1.5px solid ${form.color}`, color: form.color, borderRadius: 3 }}>{form.code}</span>
              </span>
            </div>
          </div>

          {/* Libellé */}
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--stroke2)', marginBottom: 6 }}>
              Itinéraire <span style={{ color: 'var(--danger)' }}>*</span>
            </div>
            <input value={form.label} onChange={e => set('label')(e.target.value)}
              style={{ width: '100%', border: `1.25px solid ${errors.label ? 'var(--danger)' : 'var(--stroke3)'}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }}/>
            {errors.label && <div style={{ fontSize: 10, color: 'var(--danger)', marginTop: 3 }}>{errors.label}</div>}
          </div>

          {/* AM / PM */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--stroke2)', marginBottom: 6 }}>
                Sens AM <span style={{ color: 'var(--danger)' }}>*</span>
              </div>
              <input value={form.am} onChange={e => set('am')(e.target.value)}
                style={{ width: '100%', border: `1.25px solid ${errors.am ? 'var(--danger)' : 'var(--stroke3)'}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }}/>
              {errors.am && <div style={{ fontSize: 10, color: 'var(--danger)', marginTop: 3 }}>{errors.am}</div>}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--stroke2)', marginBottom: 6 }}>
                Sens PM <span style={{ color: 'var(--danger)' }}>*</span>
              </div>
              <input value={form.pm} onChange={e => set('pm')(e.target.value)}
                style={{ width: '100%', border: `1.25px solid ${errors.pm ? 'var(--danger)' : 'var(--stroke3)'}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }}/>
              {errors.pm && <div style={{ fontSize: 10, color: 'var(--danger)', marginTop: 3 }}>{errors.pm}</div>}
            </div>
          </div>

          {/* Arrêts count */}
          <div style={{ width: 200 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--stroke2)', marginBottom: 6 }}>
              Nombre d'arrêts <span style={{ color: 'var(--danger)' }}>*</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="number" min={2} max={50} value={form.arrets || ''} onChange={e => set('arrets')(parseInt(e.target.value) || 0)}
                style={{ width: '100%', border: `1.25px solid ${errors.arrets ? 'var(--danger)' : 'var(--stroke3)'}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, fontFamily: 'var(--font-mono)', boxSizing: 'border-box' }}/>
              <span style={{ fontSize: 12, color: 'var(--stroke2)', flexShrink: 0 }}>arrêts</span>
            </div>
            {errors.arrets && <div style={{ fontSize: 10, color: 'var(--danger)', marginTop: 3 }}>{errors.arrets}</div>}
          </div>

          {/* Points GPS arrêts */}
          <div style={{ borderTop: '1px dashed var(--stroke3)', paddingTop: 14 }}>
            <StopsEditor stops={form.stops ?? []} onChange={s => set('stops')(s)} />
          </div>

        </div>

        <div style={{ padding: '14px 20px', borderTop: '1.5px solid var(--stroke3)', display: 'flex', gap: 8, justifyContent: 'flex-end', background: 'var(--paper)', flexShrink: 0 }}>
          <Btn onClick={onClose}>Annuler</Btn>
          <Btn accent onClick={handleSave}>Enregistrer →</Btn>
        </div>
      </div>
    </div>
  );
}

const DEF_LIGNES: Ligne[] = [
  {
    code: 'L3', label: 'Doujani ↔ Passot La Barge', am: '→ Passot La Barge', pm: '→ Doujani',
    arrets: 11, chauffeurs: 14, color: 'var(--brand)',
    stops: [
      { nom: 'Doujani',               lat: -12.9108, lng: 45.1662 },
      { nom: 'Majicavo Lamir',        lat: -12.8720, lng: 45.1558 },
      { nom: 'Kawéni carrefour',      lat: -12.8428, lng: 45.1622 },
      { nom: 'Koungou Route',         lat: -12.8195, lng: 45.1740 },
      { nom: 'Mamoudzou Marché',      lat: -12.7828, lng: 45.2270 },
      { nom: 'Mamoudzou Centre',      lat: -12.7797, lng: 45.2283 },
      { nom: 'Cavani',                lat: -12.7762, lng: 45.2298 },
      { nom: 'Mgombani',              lat: -12.7710, lng: 45.2321 },
      { nom: 'Passamainty carrefour', lat: -12.7883, lng: 45.2428 },
      { nom: 'Badamiers',             lat: -12.7760, lng: 45.2259 },
      { nom: 'Passot La Barge',       lat: -12.7744, lng: 45.2242 },
    ],
  },
  {
    code: 'L4', label: 'Vahibe ↔ PEM Passamainty', am: '→ Passamainty', pm: '→ Vahibe',
    arrets: 14, chauffeurs: 14, color: 'var(--info)',
    stops: [
      { nom: 'Vahibe',                lat: -12.9812, lng: 45.1774 },
      { nom: 'Kani-Kéli',            lat: -12.9582, lng: 45.1638 },
      { nom: 'Bouéni',               lat: -12.9388, lng: 45.2012 },
      { nom: 'Chirongui',            lat: -12.9262, lng: 45.2105 },
      { nom: 'Koungu',               lat: -12.8968, lng: 45.2192 },
      { nom: 'Tsararano',            lat: -12.8728, lng: 45.2260 },
      { nom: 'Bandraboua',           lat: -12.8452, lng: 45.2378 },
      { nom: "M'Tsapéré",           lat: -12.8195, lng: 45.2422 },
      { nom: 'Mamoudzou Nord',       lat: -12.7982, lng: 45.2360 },
      { nom: 'Mamoudzou Centre',     lat: -12.7797, lng: 45.2283 },
      { nom: 'Passamainty marché',   lat: -12.7920, lng: 45.2445 },
      { nom: 'Passamainty carrefour',lat: -12.7883, lng: 45.2428 },
      { nom: 'Longoni Route',        lat: -12.7658, lng: 45.2518 },
      { nom: 'PEM Passamainty',      lat: -12.7842, lng: 45.2488 },
    ],
  },
  {
    code: 'CHM', label: 'CHM ↔ La Barge', am: '→ La Barge', pm: '→ CHM',
    arrets: 13, chauffeurs: 8, color: 'var(--success)',
    stops: [
      { nom: 'CHM – Entrée principale', lat: -12.7908, lng: 45.2272 },
      { nom: 'CHM – Urgences',          lat: -12.7918, lng: 45.2265 },
      { nom: 'Quartier Wema',           lat: -12.7878, lng: 45.2258 },
      { nom: 'Mamoudzou Préfecture',    lat: -12.7842, lng: 45.2278 },
      { nom: 'Mamoudzou Marché',        lat: -12.7828, lng: 45.2270 },
      { nom: 'Mamoudzou Centre',        lat: -12.7797, lng: 45.2283 },
      { nom: 'Cavani stade',            lat: -12.7762, lng: 45.2298 },
      { nom: 'Kawéni centre comm.',     lat: -12.8428, lng: 45.1622 },
      { nom: 'Zone industrielle Kawéni',lat: -12.8460, lng: 45.1598 },
      { nom: 'Majicavo Koropa',         lat: -12.8712, lng: 45.1535 },
      { nom: 'Longoni Port',            lat: -12.7658, lng: 45.2518 },
      { nom: 'Badamiers',               lat: -12.7760, lng: 45.2259 },
      { nom: 'La Barge (embarcadère)',  lat: -12.7744, lng: 45.2242 },
    ],
  },
];

function TabLignes() {
  const [lignes, setLignes] = useSettingsSection<Ligne[]>('lignes', DEF_LIGNES);
  const [showModal, setShowModal] = useState(false);
  const [configuringLigne, setConfiguringLigne] = useState<Ligne | null>(null);
  const [deletingLigne, setDeletingLigne] = useState<Ligne | null>(null);

  const handleSave = (l: Ligne) => {
    setLignes(prev => [...prev, l]);
    setShowModal(false);
    toast.success(`Ligne ${l.code} créée · ${l.label}`);
  };

  const handleUpdate = (updated: Ligne) => {
    setLignes(prev => prev.map(l => l.code === updated.code ? updated : l));
    setConfiguringLigne(null);
    toast.success(`Ligne ${updated.code} mise à jour`);
  };

  const handleDelete = () => {
    if (!deletingLigne) return;
    setLignes(prev => prev.filter(l => l.code !== deletingLigne.code));
    toast.success(`Ligne ${deletingLigne.code} supprimée`);
    setDeletingLigne(null);
  };

  return (
    <>
    {showModal && <NouvelleligneModal onClose={() => setShowModal(false)} onSave={handleSave}/>}
    {configuringLigne && <ConfigurerLigneModal ligne={configuringLigne} onClose={() => setConfiguringLigne(null)} onSave={handleUpdate}/>}
    {deletingLigne && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,15,16,.38)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', border: '1.5px solid var(--stroke)', borderRadius: 8, boxShadow: '0 30px 80px rgba(20,15,16,.35)', width: 400, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1.5px solid var(--stroke)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--danger)' }}>Action irréversible</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginTop: 4 }}>Supprimer la ligne</div>
            </div>
            <Btn sm onClick={() => setDeletingLigne(null)}>✕</Btn>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'rgba(209,58,42,0.06)', border: '1px solid rgba(209,58,42,0.2)', borderRadius: 6, marginBottom: 16 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 800, padding: '2px 8px', borderRadius: 4, border: `1.5px solid ${deletingLigne.color}`, color: deletingLigne.color }}>{deletingLigne.code}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{deletingLigne.label}</div>
                <div style={{ fontSize: 11, color: 'var(--stroke2)', marginTop: 1 }}>{deletingLigne.arrets} arrêts</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--stroke2)', lineHeight: 1.5 }}>
              Cette action supprimera définitivement la ligne. Le planning existant ne sera pas modifié.
            </div>
          </div>
          <div style={{ padding: '14px 20px', borderTop: '1.5px solid var(--stroke3)', display: 'flex', gap: 8, justifyContent: 'flex-end', background: 'var(--paper)' }}>
            <Btn onClick={() => setDeletingLigne(null)}>Annuler</Btn>
            <Btn onClick={handleDelete} style={{ background: 'var(--danger)', color: '#fff', borderColor: 'var(--danger)' }}>Supprimer →</Btn>
          </div>
        </div>
      </div>
    )}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ background: '#fff', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1.5px solid var(--stroke3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Eyebrow>Lignes actives · {lignes.length}</Eyebrow>
          <Btn sm accent onClick={() => setShowModal(true)}>+ Nouvelle ligne</Btn>
        </div>
        {lignes.map((l, i) => (
          <div key={l.code} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 120px 100px 80px', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: i < lignes.length - 1 ? '1px dashed var(--stroke3)' : 'none' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4, border: `1.5px solid ${l.color}`, color: l.color, textAlign: 'center' }}>{l.code}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{l.label}</div>
              <div style={{ fontSize: 10, color: 'var(--stroke2)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{l.am} · {l.pm}</div>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--stroke2)' }}>{l.arrets} arrêts</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }}/>
              <span style={{ fontSize: 11, color: 'var(--stroke2)' }}>Active</span>
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <Btn sm onClick={() => setConfiguringLigne(l)}>Configurer</Btn>
              <Btn sm onClick={() => setDeletingLigne(l)}
                style={{ color: 'var(--danger)', borderColor: 'var(--danger)', background: 'transparent' }}>✕</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  );
}

const DEF_CHAUFFEURS = {
  alerts: { gps: true, horsCircuit: true },
  gpsDelai: '5',
  circuitRayon: '300',
  retardSeuil: '10',
  retardAlerte: true,
};

function TabChauffeurs() {
  const [cfg, setCfg] = useSettingsSection('chauffeurs', DEF_CHAUFFEURS);
  const alerts = cfg.alerts;
  const gpsDelai = cfg.gpsDelai;
  const circuitRayon = cfg.circuitRayon;
  const retardSeuil  = cfg.retardSeuil  ?? '10';
  const retardAlerte = cfg.retardAlerte ?? true;
  const setAlerts = (fn: (p: typeof alerts) => typeof alerts) => setCfg(p => ({ ...p, alerts: fn(p.alerts) }));
  const setGpsDelai      = (v: string)  => setCfg(p => ({ ...p, gpsDelai: v }));
  const setCircuitRayon  = (v: string)  => setCfg(p => ({ ...p, circuitRayon: v }));
  const setRetardSeuil   = (v: string)  => setCfg(p => ({ ...p, retardSeuil: v }));
  const setRetardAlerte  = (v: boolean) => setCfg(p => ({ ...p, retardAlerte: v }));
  const toggle = (k: keyof typeof alerts) => setAlerts(p => ({ ...p, [k]: !p[k] }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Ponctualité des départs ── */}
      <div className="card" style={{ background: '#fff', padding: 18 }}>
        <Eyebrow style={{ marginBottom: 4 }}>Ponctualité des départs</Eyebrow>
        <div style={{ fontSize: 11, color: 'var(--stroke2)', marginBottom: 14 }}>
          Un départ est considéré <strong>en retard</strong> si l'heure du clic « Départ »
          dans l'app chauffeur dépasse l'heure planifiée du délai ci-dessous.
          Cette valeur alimente la colonne <em>Retards</em> des rapports clients.
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', padding: '14px 0', borderBottom: '1px dashed var(--stroke3)', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Seuil de retard au départ</div>
            <div style={{ fontSize: 11, color: 'var(--stroke2)', marginTop: 2 }}>
              Heure départ planning − heure clic « Départ » app chauffeur
            </div>
            <div style={{ marginTop: 10, maxWidth: 200 }}>
              <Field label="Seuil (minutes)" value={retardSeuil} onChange={setRetardSeuil} unit="mn"/>
            </div>
          </div>
          {/* Indicateur visuel du seuil */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '10px 18px', borderRadius: 10,
            background: 'rgba(220,38,38,.06)', border: '1.5px solid rgba(220,38,38,.2)',
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 800, color: '#dc2626', lineHeight: 1 }}>
              {retardSeuil || '10'}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#dc2626', letterSpacing: '.1em' }}>MIN</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', padding: '14px 0', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Alerte retard en temps réel</div>
            <div style={{ fontSize: 11, color: 'var(--stroke2)', marginTop: 2 }}>
              Notifie la coordination dès qu'un départ dépasse le seuil sur une ligne active
            </div>
          </div>
          <Toggle on={retardAlerte} onChange={setRetardAlerte}/>
        </div>
      </div>

      <div className="card" style={{ background: '#fff', padding: 18 }}>
        <Eyebrow style={{ marginBottom: 4 }}>Alertes chauffeur</Eyebrow>

        <div style={{ display: 'flex', alignItems: 'flex-start', padding: '14px 0', borderBottom: '1px dashed var(--stroke3)', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Alerte coupure GPS</div>
            <div style={{ fontSize: 11, color: 'var(--stroke2)', marginTop: 2 }}>Notification direction si le signal GPS d'un chauffeur actif est perdu</div>
            <div style={{ marginTop: 10 }}>
              <Field label="Délai avant alerte (mn)" value={gpsDelai} onChange={setGpsDelai} unit="mn"/>
            </div>
          </div>
          <Toggle on={alerts.gps} onChange={() => toggle('gps')}/>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', padding: '14px 0', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Alerte hors circuit</div>
            <div style={{ fontSize: 11, color: 'var(--stroke2)', marginTop: 2 }}>Notification si un chauffeur s'éloigne du trajet prévu au-delà du rayon défini</div>
            <div style={{ marginTop: 10 }}>
              <Field label="Rayon de tolérance (m)" value={circuitRayon} onChange={setCircuitRayon} unit="m"/>
            </div>
          </div>
          <Toggle on={alerts.horsCircuit} onChange={() => toggle('horsCircuit')}/>
        </div>
      </div>

      <div className="card" style={{ background: '#fff', padding: 18 }}>
        <Eyebrow style={{ marginBottom: 14 }}>Documents obligatoires</Eyebrow>
        {[
          ['Permis de conduire', 'Expiration · alertes à 60 j, 30 j, 7 j'],
          ['Carte grise', 'Expiration · alertes à 30 j, 7 j'],
          ['Assurance véhicule', 'Expiration · alertes à 60 j, 30 j, 7 j'],
          ['Visite technique', 'Expiration · alertes à 30 j, 14 j'],
        ].map(([doc, hint]) => (
          <div key={doc} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px dashed var(--stroke3)', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{doc}</div>
              <div style={{ fontSize: 11, color: 'var(--stroke2)', marginTop: 2 }}>{hint}</div>
            </div>
            <Toggle on={true} onChange={() => {}}/>
          </div>
        ))}
      </div>
    </div>
  );
}

interface JourFerie { id: number; date: string; label: string; recurrent: boolean; }
interface PlanningConfig {
  delaiMin: string; horizonMax: string; validationJour: string;
  remplacementAuto: boolean; notifierTous: boolean; escaladeDirection: boolean;
  delaiEscalade: string; delaiMaxSansRemplacant: string;
  retentionAudit: string; delaiAnnulation: string;
  feries: JourFerie[];
}
const PLANNING_DEFAULTS: PlanningConfig = {
  delaiMin: '2', horizonMax: '30', validationJour: 'Mercredi',
  remplacementAuto: true, notifierTous: false, escaladeDirection: true,
  delaiEscalade: '15', delaiMaxSansRemplacant: '30',
  retentionAudit: '365', delaiAnnulation: '24',
  feries: [
    { id: 1, date: '2026-01-01', label: 'Jour de l\'An', recurrent: true },
    { id: 2, date: '2026-03-17', label: 'Anniversaire de Mayotte', recurrent: true },
    { id: 3, date: '2026-04-27', label: 'Lundi de Pâques', recurrent: false },
    { id: 4, date: '2026-05-01', label: 'Fête du Travail', recurrent: true },
    { id: 5, date: '2026-05-08', label: 'Victoire 1945', recurrent: true },
    { id: 6, date: '2026-06-04', label: 'Ascension', recurrent: false },
    { id: 7, date: '2026-07-14', label: 'Fête Nationale', recurrent: true },
    { id: 8, date: '2026-08-15', label: 'Assomption', recurrent: true },
    { id: 9, date: '2026-11-01', label: 'Toussaint', recurrent: true },
    { id: 10, date: '2026-11-11', label: 'Armistice', recurrent: true },
    { id: 11, date: '2026-12-25', label: 'Noël', recurrent: true },
  ],
};

function TabPlanning() {
  const [cfg, setCfg] = useSettingsSection<PlanningConfig>('planning', PLANNING_DEFAULTS);
  const set = (k: keyof PlanningConfig) => (v: any) => setCfg(p => ({...p, [k]: v}));
  const [newFerie, setNewFerie] = useState({ date: '', label: '', recurrent: false });

  const addFerie = () => {
    if (!newFerie.date || !newFerie.label) return;
    const id = Date.now();
    setCfg(p => ({ ...p, feries: [...(p.feries || []), { ...newFerie, id }] }));
    setNewFerie({ date: '', label: '', recurrent: false });
  };

  const removeFerie = (id: number) => setCfg(p => ({ ...p, feries: (p.feries || []).filter(f => f.id !== id) }));

  const sortedFeries = [...(cfg.feries || [])].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Jours fériés */}
      <div className="card" style={{ background: '#fff', padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Eyebrow>Jours fériés spécifiques</Eyebrow>
          <span style={{ fontSize: 11, color: 'var(--stroke2)' }}>{sortedFeries.length} configurés</span>
        </div>

        {/* List */}
        <div style={{ borderRadius: 6, border: '1px solid var(--stroke3)', overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 80px 36px', padding: '7px 12px',
            background: 'var(--ink-100)', borderBottom: '1px solid var(--stroke3)',
            fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--stroke2)' }}>
            <span>Date</span><span>Intitulé</span><span>Récurrent</span><span/>
          </div>
          {sortedFeries.map(f => (
            <div key={f.id} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 80px 36px',
              padding: '10px 12px', borderBottom: '1px dashed var(--stroke3)', alignItems: 'center', fontSize: 13 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--info)' }}>
                {new Date(f.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <span style={{ fontWeight: 500 }}>{f.label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: f.recurrent ? 'var(--success)' : 'var(--stroke3)' }}>
                {f.recurrent ? '↻ annuel' : 'unique'}
              </span>
              <button onClick={() => removeFerie(f.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 14, padding: '2px 6px' }}>✕</button>
            </div>
          ))}
          {sortedFeries.length === 0 && (
            <div style={{ padding: '14px 12px', color: 'var(--stroke2)', fontSize: 12, textAlign: 'center' }}>Aucun jour férié configuré</div>
          )}
        </div>

        {/* Add form */}
        <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 100px 80px', gap: 8, alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--stroke2)', marginBottom: 5 }}>Date</div>
            <input type="date" value={newFerie.date} onChange={e => setNewFerie(p => ({...p, date: e.target.value}))}
              style={{ border: '1.25px solid var(--stroke3)', borderRadius: 6, padding: '7px 10px', fontSize: 12, fontFamily: 'var(--font-mono)', width: '100%', outline: 'none', boxSizing: 'border-box' }}/>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--stroke2)', marginBottom: 5 }}>Intitulé</div>
            <input value={newFerie.label} onChange={e => setNewFerie(p => ({...p, label: e.target.value}))}
              placeholder="ex. Aïd el-Fitr" onKeyDown={e => e.key === 'Enter' && addFerie()}
              style={{ border: '1.25px solid var(--stroke3)', borderRadius: 6, padding: '7px 10px', fontSize: 13, width: '100%', outline: 'none', boxSizing: 'border-box' }}/>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--stroke2)', marginBottom: 5 }}>Type</div>
            <select value={newFerie.recurrent ? 'annual' : 'unique'}
              onChange={e => setNewFerie(p => ({...p, recurrent: e.target.value === 'annual'}))}
              style={{ border: '1.25px solid var(--stroke3)', borderRadius: 6, padding: '7px 8px', fontSize: 12, fontFamily: 'var(--font-mono)', width: '100%', background: '#fff', outline: 'none', cursor: 'pointer' }}>
              <option value="unique">Unique</option>
              <option value="annual">↻ Annuel</option>
            </select>
          </div>
          <button onClick={addFerie}
            style={{ padding: '8px 14px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            + Ajouter
          </button>
        </div>
      </div>

      {/* Règles de création */}
      <div className="card" style={{ background: '#fff', padding: 18 }}>
        <Eyebrow style={{ marginBottom: 14 }}>Règles de création</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Délai min avant création (h)" value={cfg.delaiMin} onChange={set('delaiMin')} unit="h"/>
          <Field label="Horizon max planification (j)" value={cfg.horizonMax} onChange={set('horizonMax')} unit="j"/>
          <Field label="Validation planning hebdo (jour)" value={cfg.validationJour} onChange={set('validationJour')}/>
        </div>
      </div>

      {/* Audit log */}
      <div className="card" style={{ background: '#fff', padding: 18 }}>
        <Eyebrow style={{ marginBottom: 14 }}>Audit log</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Rétention historique (jours)" value={cfg.retentionAudit} onChange={set('retentionAudit')} unit="j"/>
          <Field label="Délai annulation d'une action (h)" value={cfg.delaiAnnulation} onChange={set('delaiAnnulation')} unit="h"/>
        </div>
      </div>
    </div>
  );
}

/* ── Tarification ── */

const HOURS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

interface Slot { id: number; from: string; to: string; label: string; price: string; }

const DEFAULT_SLOTS: Record<string, Slot[]> = {
  semaine: [
    { id: 1, from: '05:00', to: '07:00', label: 'Matin',         price: '6.50' },
    { id: 2, from: '07:00', to: '09:00', label: 'Heure de pointe', price: '7.50' },
    { id: 3, from: '09:00', to: '17:00', label: 'Journée',        price: '6.80' },
    { id: 4, from: '17:00', to: '19:30', label: 'Heure de pointe', price: '7.50' },
    { id: 5, from: '19:30', to: '22:00', label: 'Soir',           price: '6.80' },
  ],
  samedi: [
    { id: 1, from: '06:00', to: '09:00', label: 'Matin',   price: '7.00' },
    { id: 2, from: '09:00', to: '19:00', label: 'Journée', price: '7.20' },
    { id: 3, from: '19:00', to: '23:00', label: 'Soir',    price: '7.80' },
  ],
  dimanche: [
    { id: 1, from: '06:00', to: '22:00', label: 'Tarif dimanche', price: '8.30' },
  ],
  feries: [
    { id: 1, from: '00:00', to: '23:30', label: 'Tarif jour férié', price: '9.00' },
  ],
};

const selectStyle: React.CSSProperties = {
  border: '1.25px solid var(--stroke3)', borderRadius: 5, padding: '6px 8px',
  fontSize: 12, fontFamily: 'var(--font-mono)', background: '#fff', cursor: 'pointer',
  outline: 'none', color: 'var(--stroke)',
};

function SlotRow({ slot, onChange, onDelete, isLast }: {
  slot: Slot; onChange: (s: Slot) => void; onDelete: () => void; isLast: boolean;
}) {
  const set = (k: keyof Slot) => (v: string) => onChange({ ...slot, [k]: v });
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '110px 16px 110px 1fr 100px 32px',
      alignItems: 'center', gap: 8, padding: '10px 16px',
      borderBottom: isLast ? 'none' : '1px dashed var(--stroke3)',
      background: '#fff',
    }}>
      <select value={slot.from} onChange={e => set('from')(e.target.value)} style={selectStyle}>
        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
      <span style={{ textAlign: 'center', color: 'var(--stroke3)', fontSize: 11 }}>→</span>
      <select value={slot.to} onChange={e => set('to')(e.target.value)} style={selectStyle}>
        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
      <input value={slot.label} onChange={e => set('label')(e.target.value)}
        placeholder="Libellé…"
        style={{ border: '1.25px solid var(--stroke3)', borderRadius: 5, padding: '6px 10px', fontSize: 12, outline: 'none' }}/>
      <div style={{ display: 'flex', alignItems: 'center', border: '1.25px solid var(--stroke3)', borderRadius: 5, overflow: 'hidden' }}>
        <input type="number" step="0.10" min="0" value={slot.price} onChange={e => set('price')(e.target.value)}
          style={{ width: '100%', border: 'none', padding: '6px 8px', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 700, outline: 'none', color: 'var(--stroke)' }}/>
        <span style={{ padding: '0 8px', fontSize: 12, color: 'var(--stroke2)', background: 'var(--paper)', borderLeft: '1px solid var(--stroke3)', flexShrink: 0, lineHeight: '32px' }}>€</span>
      </div>
      <button onClick={onDelete} style={{ width: 28, height: 28, border: '1px solid var(--stroke3)', borderRadius: 4, background: 'transparent', cursor: 'pointer', color: 'var(--stroke3)', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
    </div>
  );
}

function PricingTable({ dayKey }: { dayKey: string }) {
  const [slots, setSlots] = useSettingsSection<Slot[]>(`pricing_${dayKey}`, DEFAULT_SLOTS[dayKey] ?? []);
  let nextId = Math.max(0, ...slots.map(s => s.id)) + 1;

  const addSlot = () => {
    const last = slots[slots.length - 1];
    setSlots(prev => [...prev, { id: nextId++, from: last?.to ?? '06:00', to: '22:00', label: '', price: '6.80' }]);
  };

  const totalCoverage = () => {
    let mins = 0;
    for (const s of slots) {
      const [fh, fm] = s.from.split(':').map(Number);
      const [th, tm] = s.to.split(':').map(Number);
      const diff = (th * 60 + tm) - (fh * 60 + fm);
      if (diff > 0) mins += diff;
    }
    const h = Math.floor(mins / 60), m = mins % 60;
    return `${h}h${m ? String(m).padStart(2,'0') : ''} couvertes`;
  };

  return (
    <div>
      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '110px 16px 110px 1fr 100px 32px', gap: 8, padding: '6px 16px 6px', background: 'var(--paper)', borderBottom: '1.5px solid var(--stroke3)' }}>
        {['De', '', 'À', 'Libellé', 'Tarif / trajet', ''].map((h, i) => (
          <span key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--stroke2)' }}>{h}</span>
        ))}
      </div>
      {slots.map((s, i) => (
        <SlotRow key={s.id} slot={s} isLast={i === slots.length - 1}
          onChange={updated => setSlots(prev => prev.map(x => x.id === updated.id ? updated : x))}
          onDelete={() => setSlots(prev => prev.filter(x => x.id !== s.id))}/>
      ))}
      <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px dashed var(--stroke3)' }}>
        <button onClick={addSlot} style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1.25px dashed var(--stroke3)', borderRadius: 5, padding: '6px 12px', background: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--stroke2)' }}>
          <span style={{ fontSize: 14 }}>+</span> Ajouter une plage
        </button>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--stroke3)' }}>{totalCoverage()}</span>
      </div>
    </div>
  );
}

function AstreintePanel() {
  const [cfg, setCfg] = useSettingsSection('astreinte', { price: '4.20', min: '60' });
  const price = cfg.price, min = cfg.min;
  const setPrice = (v: string) => setCfg(p => ({ ...p, price: v }));
  const setMin = (v: string) => setCfg(p => ({ ...p, min: v }));
  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 13, color: 'var(--stroke2)', lineHeight: 1.6 }}>
        L'astreinte est une disponibilité rémunérée en dehors des services planifiés. Le tarif est forfaitaire par heure d'astreinte effectuée.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '200px 200px', gap: 14 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--stroke2)', marginBottom: 6 }}>Tarif / heure d'astreinte</div>
          <div style={{ display: 'flex', alignItems: 'center', border: '1.25px solid var(--stroke3)', borderRadius: 5, overflow: 'hidden' }}>
            <input type="number" step="0.10" min="0" value={price} onChange={e => setPrice(e.target.value)}
              style={{ width: '100%', border: 'none', padding: '8px 10px', fontSize: 16, fontFamily: 'var(--font-mono)', fontWeight: 800, outline: 'none', color: 'var(--stroke)' }}/>
            <span style={{ padding: '0 12px', fontSize: 13, color: 'var(--stroke2)', background: 'var(--paper)', borderLeft: '1px solid var(--stroke3)', flexShrink: 0, lineHeight: '38px' }}>€ / h</span>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--stroke2)', marginBottom: 6 }}>Durée minimale facturée</div>
          <div style={{ display: 'flex', alignItems: 'center', border: '1.25px solid var(--stroke3)', borderRadius: 5, overflow: 'hidden' }}>
            <input type="number" step="15" min="15" value={min} onChange={e => setMin(e.target.value)}
              style={{ width: '100%', border: 'none', padding: '8px 10px', fontSize: 16, fontFamily: 'var(--font-mono)', fontWeight: 800, outline: 'none', color: 'var(--stroke)' }}/>
            <span style={{ padding: '0 12px', fontSize: 13, color: 'var(--stroke2)', background: 'var(--paper)', borderLeft: '1px solid var(--stroke3)', flexShrink: 0, lineHeight: '38px' }}>mn</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Frais de gestion ── */

interface KmSlot { id: number; from: string; to: string; price: string; }

const DEF_FRAIS = {
  locationActive: true,
  locationForfait: '180.00',
  locationPeriode: 'semaine',
  fraisMensuels: '30.00',
  kmSlots: [
    { id: 1, from: '0', to: '50', price: '0.00' },
    { id: 2, from: '50', to: '100', price: '0.18' },
    { id: 3, from: '100', to: '', price: '0.22' },
  ] as KmSlot[],
};

function FraisGestion() {
  const [cfg, setCfg] = useSettingsSection('frais_gestion', DEF_FRAIS);
  const set = <K extends keyof typeof cfg>(k: K) => (v: typeof cfg[K]) => setCfg(p => ({ ...p, [k]: v }));

  // Guard: kmSlots peut être absent si sauvegardé avec une ancienne version
  const kmSlots: KmSlot[] = Array.isArray(cfg.kmSlots) ? cfg.kmSlots : DEF_FRAIS.kmSlots;

  const addKmSlot = () => {
    const last = kmSlots[kmSlots.length - 1];
    const newFrom = last?.to ?? '0';
    setCfg(p => ({
      ...p,
      kmSlots: [...(Array.isArray(p.kmSlots) ? p.kmSlots : DEF_FRAIS.kmSlots), { id: Date.now(), from: newFrom, to: '', price: '0.00' }],
    }));
  };

  const updateKmSlot = (id: number, field: keyof KmSlot, val: string) =>
    setCfg(p => ({ ...p, kmSlots: (Array.isArray(p.kmSlots) ? p.kmSlots : DEF_FRAIS.kmSlots).map(s => s.id === id ? { ...s, [field]: val } : s) }));

  const deleteKmSlot = (id: number) =>
    setCfg(p => ({ ...p, kmSlots: (Array.isArray(p.kmSlots) ? p.kmSlots : DEF_FRAIS.kmSlots).filter(s => s.id !== id) }));

  const inputBox = (value: string, onChange: (v: string) => void, unit: string, width = 90) => (
    <div style={{ display: 'flex', alignItems: 'center', border: '1.25px solid var(--stroke3)', borderRadius: 5, overflow: 'hidden', width }}>
      <input type="number" step="0.01" min="0" value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', border: 'none', padding: '6px 8px', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 700, outline: 'none', color: 'var(--stroke)' }}/>
      <span style={{ padding: '0 8px', fontSize: 11, color: 'var(--stroke2)', background: 'var(--paper)', borderLeft: '1px solid var(--stroke3)', flexShrink: 0, whiteSpace: 'nowrap', lineHeight: '30px' }}>{unit}</span>
    </div>
  );

  return (
    <div className="card" style={{ background: '#fff', padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '12px 18px', borderBottom: '1.5px solid var(--stroke3)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Eyebrow>Frais de gestion</Eyebrow>
      </div>

      {/* Forfait location véhicule */}
      <div style={{ padding: '16px 18px', borderBottom: '1px dashed var(--stroke3)', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Forfait location véhicule</div>
          <div style={{ fontSize: 11, color: 'var(--stroke2)' }}>Montant fixe déduit de la rétrocession chauffeur pour la mise à disposition du véhicule</div>
        </div>
        <Toggle on={cfg.locationActive} onChange={v => set('locationActive')(v)}/>
      </div>

      {cfg.locationActive && (
        <div style={{ padding: '14px 18px 16px', borderBottom: '1px dashed var(--stroke3)', display: 'flex', alignItems: 'flex-end', gap: 14 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--stroke2)', marginBottom: 6 }}>Montant forfaitaire</div>
            {inputBox(cfg.locationForfait, v => set('locationForfait')(v), '€', 130)}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--stroke2)', marginBottom: 6 }}>Période</div>
            <select value={cfg.locationPeriode} onChange={e => set('locationPeriode')(e.target.value)} style={selectStyle}>
              <option value="jour">Par jour</option>
              <option value="semaine">Par semaine</option>
              <option value="mois">Par mois</option>
            </select>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--stroke2)', paddingBottom: 8 }}>
            = {cfg.locationPeriode === 'jour'
              ? `${cfg.locationForfait} €/j`
              : cfg.locationPeriode === 'semaine'
              ? `${(parseFloat(cfg.locationForfait) / 7).toFixed(2)} €/j`
              : `${(parseFloat(cfg.locationForfait) / 30).toFixed(2)} €/j`}
          </div>
        </div>
      )}

      {/* Frais de gestion mensuels */}
      <div style={{ padding: '14px 18px', borderBottom: '1px dashed var(--stroke3)', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Frais de gestion mensuels</div>
          <div style={{ fontSize: 11, color: 'var(--stroke2)' }}>Montant fixe mensuel facturé au chauffeur pour la gestion administrative et le suivi de l'activité</div>
        </div>
        {inputBox(cfg.fraisMensuels, v => set('fraisMensuels')(v), '€ / mois', 140)}
      </div>

      {/* Supplément kilométrique */}
      <div style={{ padding: '14px 18px 4px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Supplément kilométrique</div>
        <div style={{ fontSize: 11, color: 'var(--stroke2)', marginBottom: 12 }}>Coût par km appliqué selon la tranche de kilométrage journalier du chauffeur</div>

        {/* Headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '90px 16px 90px 1fr 110px 32px', gap: 8, padding: '5px 0', marginBottom: 2 }}>
          {['De (km)', '', 'À (km)', '', 'Tarif / km', ''].map((h, i) => (
            <span key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--stroke2)' }}>{h}</span>
          ))}
        </div>

        {kmSlots.map((s, i) => (
          <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '90px 16px 90px 1fr 110px 32px', gap: 8, alignItems: 'center', padding: '6px 0', borderTop: i > 0 ? '1px dashed var(--stroke4)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1.25px solid var(--stroke3)', borderRadius: 5, overflow: 'hidden' }}>
              <input type="number" min="0" value={s.from} onChange={e => updateKmSlot(s.id, 'from', e.target.value)}
                style={{ width: '100%', border: 'none', padding: '6px 8px', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, outline: 'none' }}/>
            </div>
            <span style={{ textAlign: 'center', color: 'var(--stroke3)', fontSize: 11 }}>→</span>
            <div style={{ display: 'flex', alignItems: 'center', border: '1.25px solid var(--stroke3)', borderRadius: 5, overflow: 'hidden' }}>
              <input type="number" min="0" value={s.to} onChange={e => updateKmSlot(s.id, 'to', e.target.value)}
                placeholder="∞"
                style={{ width: '100%', border: 'none', padding: '6px 8px', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, outline: 'none' }}/>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--stroke3)', paddingLeft: 4 }}>
              {!s.to ? 'et plus' : `(${parseInt(s.to || '0') - parseInt(s.from || '0')} km)`}
            </span>
            {inputBox(s.price, v => updateKmSlot(s.id, 'price', v), '€ / km', 110)}
            <button onClick={() => deleteKmSlot(s.id)}
              style={{ width: 28, height: 28, border: '1px solid var(--stroke3)', borderRadius: 4, background: 'transparent', cursor: 'pointer', color: 'var(--stroke3)', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
        ))}

        <div style={{ padding: '10px 0 14px' }}>
          <button onClick={addKmSlot} style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1.25px dashed var(--stroke3)', borderRadius: 5, padding: '6px 12px', background: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--stroke2)' }}>
            <span style={{ fontSize: 14 }}>+</span> Ajouter une tranche
          </button>
        </div>
      </div>
    </div>
  );
}


const DAY_TABS = [
  { key: 'semaine',  label: 'Lun – Ven',    icon: '📅' },
  { key: 'samedi',   label: 'Samedi',        icon: '🗓' },
  { key: 'dimanche', label: 'Dimanche',      icon: '🌅' },
  { key: 'feries',   label: 'Jours fériés', icon: '⭐' },
  { key: 'astreinte',label: 'Astreinte',     icon: '📟' },
] as const;

function TabTarification() {
  const [day, setDay] = useState<string>('semaine');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ background: '#fff', padding: 0, overflow: 'hidden' }}>
        {/* Day selector */}
        <div style={{ display: 'flex', borderBottom: '1.5px solid var(--stroke3)', background: 'var(--paper)' }}>
          {DAY_TABS.map(t => (
            <button key={t.key} onClick={() => setDay(t.key)} style={{
              flex: 1, padding: '12px 8px', border: 'none', cursor: 'pointer', fontSize: 12,
              background: day === t.key ? '#fff' : 'transparent',
              color: day === t.key ? 'var(--stroke)' : 'var(--stroke2)',
              fontWeight: day === t.key ? 700 : 400,
              borderBottom: day === t.key ? '2.5px solid var(--brand)' : '2.5px solid transparent',
              marginBottom: -1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            }}>
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {day === 'astreinte'
          ? <AstreintePanel/>
          : <PricingTable key={day} dayKey={day}/>
        }
      </div>

      {/* Frais de gestion */}
      <FraisGestion/>

      {/* Courses non prévues */}
      <CoursesNonPrevues/>

    </div>
  );
}

/* ── Courses non prévues ── */

const DEF_NON_PREVUES = {
  supplement: '9.50',
  active: true,
};

function CoursesNonPrevues() {
  const [cfg, setCfg] = useSettingsSection('courses_non_prevues', DEF_NON_PREVUES);
  const set = <K extends keyof typeof cfg>(k: K) => (v: typeof cfg[K]) => setCfg(p => ({ ...p, [k]: v }));

  return (
    <div className="card" style={{ background: '#fff', padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '10px 18px', borderBottom: '1.5px solid var(--stroke3)', background: 'var(--paper)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 800,
          letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--stroke)' }}>
          ⚠ Courses non prévues
        </span>
        <Toggle on={cfg.active} onChange={() => set('active')(!cfg.active)}/>
      </div>

      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10,
        opacity: cfg.active ? 1 : 0.45, pointerEvents: cfg.active ? 'auto' : 'none' }}>
        <div style={{ fontSize: 12, color: 'var(--stroke2)', lineHeight: 1.6 }}>
          Un trajet est considéré &laquo; non prévu &raquo; lorsqu&apos;il est ajouté manuellement et absent du planning initial
          (<code style={{ fontSize: 11 }}>is_unplanned = true</code> dans la base). Un supplément tarifaire lui est appliqué dans la rétrocession chauffeur.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 80px', gap: 10, alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--stroke)' }}>
              Supplément par trajet non prévu
            </label>
            <div style={{ fontSize: 11, color: 'var(--stroke2)', marginTop: 2 }}>
              Ajouté à la rétrocession mensuelle, quelle que soit la tranche horaire
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', border: '1.25px solid var(--stroke3)',
            borderRadius: 5, overflow: 'hidden' }}>
            <input
              type="number" step="0.50" min="0"
              value={cfg.supplement}
              onChange={e => set('supplement')(e.target.value)}
              style={{ flex: 1, padding: '8px 10px', border: 'none', outline: 'none',
                fontFamily: 'var(--font-mono)', fontSize: 14, textAlign: 'right',
                background: 'transparent', color: 'var(--stroke)' }}
            />
            <span style={{ padding: '0 10px', borderLeft: '1.25px solid var(--stroke3)',
              fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--stroke2)',
              background: 'var(--paper)', alignSelf: 'stretch', display: 'flex',
              alignItems: 'center' }}>€</span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--stroke2)' }}>par trajet</span>
        </div>
        <div style={{ padding: '8px 12px', background: 'rgba(245,158,11,.07)',
          border: '1px solid rgba(245,158,11,.3)', borderRadius: 6,
          fontSize: 11, color: '#92400e', lineHeight: 1.6 }}>
          💡 Ce tarif est synchronisé avec la section &laquo; Courses non prévues &raquo; dans la configuration
          des fiches de rétrocession.
        </div>
      </div>
    </div>
  );
}

const DEF_ALERTES = {
  ponct: { orange: '5', rouge: '10', objectif: '95.0', critique: '90.0' },
  remp: { delaiMax: '30', escalade: '15' },
  alerts: { incident: true, horsLigne: true, retard: true, panne: true, doc: true, facture: true, ca: true },
};

function TabAlertes() {
  const [cfg, setCfg] = useSettingsSection('alertes', DEF_ALERTES);
  const ponct = cfg.ponct, remp = cfg.remp, alerts = cfg.alerts;
  const setPonct = (fn: (p: typeof ponct) => typeof ponct) => setCfg(p => ({ ...p, ponct: fn(p.ponct) }));
  const setRemp = (fn: (p: typeof remp) => typeof remp) => setCfg(p => ({ ...p, remp: fn(p.remp) }));
  const setAlerts = (fn: (p: typeof alerts) => typeof alerts) => setCfg(p => ({ ...p, alerts: fn(p.alerts) }));
  const toggle = (k: keyof typeof alerts) => setAlerts(p => ({ ...p, [k]: !p[k] }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ background: '#fff', padding: 18 }}>
        <Eyebrow style={{ marginBottom: 14 }}>Seuils de ponctualité</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Retard · seuil d'alerte orange" value={ponct.orange} onChange={v => setPonct(p=>({...p,orange:v}))} unit="mn"/>
          <Field label="Retard · seuil d'alerte rouge" value={ponct.rouge} onChange={v => setPonct(p=>({...p,rouge:v}))} unit="mn"/>
          <Field label="Objectif de ponctualité" value={ponct.objectif} onChange={v => setPonct(p=>({...p,objectif:v}))} unit="%"/>
          <Field label="Ponctualité critique (déclenche rapport)" value={ponct.critique} onChange={v => setPonct(p=>({...p,critique:v}))} unit="%"/>
        </div>
      </div>

      <div className="card" style={{ background: '#fff', padding: 18 }}>
        <Eyebrow style={{ marginBottom: 4 }}>Alertes opérationnelles</Eyebrow>
        <AlertRow label="Alerte incident vocal reçu" sub="Bannière + toast dans l'app Direction dès réception d'un vocal chauffeur" on={alerts.incident} onChange={() => toggle('incident')}/>
        <AlertRow label="Alerte chauffeur hors-ligne" sub="Notification si un chauffeur actif ne répond plus au GPS depuis 5 mn" on={alerts.horsLigne} onChange={() => toggle('horsLigne')}/>
        <AlertRow label="Alerte retard > seuil rouge" sub="Badge rouge sur la carte et notification push Direction" on={alerts.retard} onChange={() => toggle('retard')}/>
        <AlertRow label="Alerte panne véhicule déclarée" sub="Ouverture automatique du workflow remplacement" on={alerts.panne} onChange={() => toggle('panne')}/>
        <AlertRow label="Alerte document expiré" sub="7 jours avant expiration de tout document chauffeur" on={alerts.doc} onChange={() => toggle('doc')}/>
        <AlertRow label="Alerte facture non validée > 48 h" sub="Relance automatique au coordinateur responsable" on={alerts.facture} onChange={() => toggle('facture')}/>
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 0', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Alerte CA mensuel sous objectif</div>
            <div style={{ fontSize: 11, color: 'var(--info)', marginTop: 2 }}>Si le CA réalisé est inférieur à 90 % du CA contractuel en milieu de mois</div>
          </div>
          <Toggle on={alerts.ca} onChange={() => toggle('ca')}/>
        </div>
      </div>

      <div className="card" style={{ background: '#fff', padding: 18 }}>
        <Eyebrow style={{ marginBottom: 14 }}>Seuils de remplacements</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Délai max sans remplaçant (mn)" value={remp.delaiMax} onChange={v => setRemp(p=>({...p,delaiMax:v}))} unit="mn"/>
          <Field label="Escalade auto direction après (mn)" value={remp.escalade} onChange={v => setRemp(p=>({...p,escalade:v}))} unit="mn"/>
        </div>
      </div>
    </div>
  );
}

const DEF_NOTIFICATIONS = {
  emails: { direction: 'm.aubin@taxivanille.yt', coord: 'coord@taxivanille.yt', compta: 'comptabilite@taxivanille.yt' },
  notifs: { rapportHebdo: true, alerteSms: false, digestJournalier: true, alerteDocExp: true },
};

function TabNotifications() {
  const [cfg, setCfg] = useSettingsSection('notifications', DEF_NOTIFICATIONS);
  const emails = cfg.emails, notifs = cfg.notifs;
  const setEmails = (fn: (p: typeof emails) => typeof emails) => setCfg(p => ({ ...p, emails: fn(p.emails) }));
  const setNotifs = (fn: (p: typeof notifs) => typeof notifs) => setCfg(p => ({ ...p, notifs: fn(p.notifs) }));
  const toggle = (k: keyof typeof notifs) => setNotifs(p => ({ ...p, [k]: !p[k] }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ background: '#fff', padding: 18 }}>
        <Eyebrow style={{ marginBottom: 14 }}>Destinataires e-mail</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Direction · alertes critiques" value={emails.direction} onChange={v => setEmails(p=>({...p,direction:v}))}/>
          <Field label="Coordinateurs · rapports hebdo" value={emails.coord} onChange={v => setEmails(p=>({...p,coord:v}))}/>
          <Field label="Comptabilité · factures" value={emails.compta} onChange={v => setEmails(p=>({...p,compta:v}))}/>
        </div>
      </div>
      <div className="card" style={{ background: '#fff', padding: 18 }}>
        <Eyebrow style={{ marginBottom: 4 }}>Canaux actifs</Eyebrow>
        {([
          ['rapportHebdo', 'Rapport hebdomadaire e-mail', 'Envoyé le vendredi à 18h00'],
          ['digestJournalier', 'Digest journalier', 'Récapitulatif des courses et incidents du jour'],
          ['alerteDocExp', 'Alertes documents expirés', '60 j, 30 j, 7 j avant expiration'],
          ['alerteSms', 'SMS urgence (hors-ligne)', 'Backup SMS si FCM indisponible'],
        ] as [keyof typeof notifs, string, string][]).map(([k, l, s]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px dashed var(--stroke3)', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{l}</div>
              <div style={{ fontSize: 11, color: 'var(--stroke2)', marginTop: 2 }}>{s}</div>
            </div>
            <Toggle on={notifs[k]} onChange={() => toggle(k)}/>
          </div>
        ))}
      </div>
      <div className="card" style={{ background: '#fff', padding: 18 }}>
        <Eyebrow style={{ marginBottom: 14 }}>Firebase Cloud Messaging (FCM)</Eyebrow>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--paper)', borderRadius: 6, border: '1px solid var(--stroke3)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }}/>
          <span style={{ fontSize: 12 }}>Configuré · <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--stroke2)' }}>taxivanille-mayotte@firebase</span></span>
          <Btn sm style={{ marginLeft: 'auto' }}>Régénérer clé</Btn>
        </div>
      </div>
    </div>
  );
}

function TabUtilisateurs() {
  const users = [
    { name: 'M. Aubin', role: 'direction', email: 'm.aubin@taxivanille.yt', last: 'il y a 14 s' },
    { name: 'Y. Hamada', role: 'coordinator', email: 'y.hamada@taxivanille.yt', last: 'il y a 2 h' },
    { name: 'M. Kamardine', role: 'coordinator', email: 'm.kamardine@taxivanille.yt', last: 'hier 14:08' },
    { name: 'Comptabilité', role: 'accountant', email: 'compta@taxivanille.yt', last: 'lun. 09:00' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ background: '#fff', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1.5px solid var(--stroke3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Eyebrow>Comptes web actifs · {users.length}</Eyebrow>
          <Btn sm accent>+ Inviter un utilisateur</Btn>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 200px 120px 80px', gap: 12, padding: '8px 18px', borderBottom: '1px solid var(--stroke3)', background: 'var(--paper)' }}>
          {['Nom', 'Rôle', 'Email', 'Dernière connexion', ''].map(h => (
            <span key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--stroke2)' }}>{h}</span>
          ))}
        </div>
        {users.map(u => <UserRow key={u.email} {...u}/>)}
      </div>
      <div className="card" style={{ background: '#fff', padding: 18 }}>
        <Eyebrow style={{ marginBottom: 14 }}>Permissions par rôle</Eyebrow>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid var(--stroke)' }}>
                {['Fonctionnalité', 'Direction', 'Coordinateur', 'Comptable'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Fonctionnalité' ? 'left' : 'center', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--stroke2)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Planning · lecture', '✓', '✓', '—'],
                ['Planning · modification', '✓', '✓', '—'],
                ['Factures · génération', '✓', '—', '✓'],
                ['Factures · validation', '✓', '—', '✓'],
                ['Chauffeurs · gestion', '✓', '—', '—'],
                ['Paramétrage', '✓', '—', '—'],
                ['KPI · tableau de bord', '✓', '✓', '✓'],
                ['Audit log', '✓', '✓', '—'],
              ].map(([feat, ...roles]) => (
                <tr key={feat} style={{ borderBottom: '1px dashed var(--stroke3)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 500 }}>{feat}</td>
                  {roles.map((r, i) => (
                    <td key={i} style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: r === '✓' ? 'var(--success)' : 'var(--stroke3)', fontWeight: r === '✓' ? 700 : 400 }}>{r}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── TabIA ───────────────────────────── */

const OPENROUTER_MODELS_SETTINGS = [
  { id: 'anthropic/claude-haiku-4-5',           label: 'Claude Haiku 4.5 (rapide)' },
  { id: 'anthropic/claude-sonnet-4-5',          label: 'Claude Sonnet 4.5' },
  { id: 'openai/gpt-4o',                        label: 'GPT-4o' },
  { id: 'openai/gpt-4o-mini',                   label: 'GPT-4o Mini (rapide)' },
  { id: 'google/gemini-1.5-pro',                label: 'Gemini 1.5 Pro' },
  { id: 'mistralai/mistral-large-2407',          label: 'Mistral Large' },
  { id: 'meta-llama/llama-3.1-70b-instruct',    label: 'Llama 3.1 70B' },
];

const DEFAULT_SYSTEM_PROMPT = `Tu es un expert en transport en commun et en gestion de lignes de bus. Rédige des commentaires de rapport mensuel professionnels, synthétiques et en français. Sois précis, neutre et factuel. Mentionne les points forts, les risques de saturation et des recommandations opérationnelles concrètes.`;

const STORAGE_KEY_IA = 'settings_ia';

function TabIA() {
  const [apiKey, setApiKey]         = useState('');
  const [showKey, setShowKey]       = useState(false);
  const [model, setModel]           = useState(OPENROUTER_MODELS_SETTINGS[0].id);
  const [sysPrompt, setSysPrompt]   = useState(DEFAULT_SYSTEM_PROMPT);
  const [saved, setSaved]           = useState(false);
  const [testing, setTesting]       = useState(false);
  const [testResult, setTestResult] = useState<'ok' | 'error' | null>(null);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE_KEY_IA) || '{}');
      if (s.api_key) setApiKey(s.api_key);
      // Valider que le modèle sauvegardé existe encore dans la liste
      const validModel = OPENROUTER_MODELS_SETTINGS.find(m => m.id === s.model);
      if (validModel) setModel(s.model);
      if (s.system_prompt) setSysPrompt(s.system_prompt);
    } catch {}
  }, []);

  function save() {
    localStorage.setItem(STORAGE_KEY_IA, JSON.stringify({ api_key: apiKey, model, system_prompt: sysPrompt }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast.success('Paramètres IA enregistrés');
  }

  async function testKey() {
    if (!apiKey) { toast.error('Entrez une clé API'); return; }
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      setTestResult(res.ok ? 'ok' : 'error');
    } catch { setTestResult('error'); }
    finally { setTesting(false); }
  }

  const maskedKey = apiKey ? apiKey.slice(0, 8) + '••••••••••••••••••••••••' + apiKey.slice(-4) : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>
      {/* API Key */}
      <div className="card" style={{ background: '#fff', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 20 }}>🔑</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Clé API OpenRouter</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
              Obtenez votre clé sur{' '}
              <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer"
                style={{ color: 'var(--brand)', textDecoration: 'none', fontWeight: 600 }}>
                openrouter.ai/keys
              </a>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-or-v1-••••••••••••••••••••••••••••••••"
              style={{ width: '100%', padding: '10px 44px 10px 12px', border: '1.5px solid var(--stroke3)',
                borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-mono)', boxSizing: 'border-box' }}
            />
            <button onClick={() => setShowKey(!showKey)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#9ca3af' }}>
              {showKey ? '🙈' : '👁'}
            </button>
          </div>
          <button onClick={testKey} disabled={testing || !apiKey}
            style={{ padding: '10px 16px', borderRadius: 8, border: '1.5px solid var(--stroke3)',
              background: '#fff', fontSize: 12, fontWeight: 700, cursor: apiKey ? 'pointer' : 'not-allowed',
              color: apiKey ? '#374151' : '#d1d5db', whiteSpace: 'nowrap' }}>
            {testing ? '⟳ Test…' : 'Tester la clé'}
          </button>
        </div>

        {testResult === 'ok' && (
          <div style={{ padding: '8px 12px', background: 'rgba(22,163,74,.08)',
            border: '1.5px solid rgba(22,163,74,.3)', borderRadius: 8,
            fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
            ✓ Clé API valide — connexion OpenRouter OK
          </div>
        )}
        {testResult === 'error' && (
          <div style={{ padding: '8px 12px', background: 'rgba(220,38,38,.06)',
            border: '1.5px solid rgba(220,38,38,.3)', borderRadius: 8,
            fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
            ✕ Clé API invalide ou erreur réseau
          </div>
        )}

        <div style={{ marginTop: 10, padding: '8px 12px', background: '#f9fafb',
          borderRadius: 8, border: '1px solid var(--stroke3)',
          fontSize: 11, color: '#6b7280', lineHeight: 1.6 }}>
          🔒 La clé est stockée uniquement dans votre navigateur (localStorage). Elle n'est jamais transmise à nos serveurs.
        </div>
      </div>

      {/* Model */}
      <div className="card" style={{ background: '#fff', padding: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Modèle par défaut</div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 14 }}>
          Utilisé pour la génération des commentaires de rapport
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {OPENROUTER_MODELS_SETTINGS.map(m => (
            <label key={m.id}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                border: `1.5px solid ${model === m.id ? 'var(--brand)' : 'var(--stroke3)'}`,
                borderRadius: 10, cursor: 'pointer',
                background: model === m.id ? 'var(--accent-soft)' : '#fff' }}>
              <input type="radio" name="model" value={m.id} checked={model === m.id}
                onChange={() => setModel(m.id)} style={{ accentColor: 'var(--brand)' }} />
              <span style={{ fontSize: 13, fontWeight: model === m.id ? 700 : 400,
                color: model === m.id ? 'var(--brand)' : '#374151' }}>{m.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* System prompt */}
      <div className="card" style={{ background: '#fff', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Prompt système</div>
          <button onClick={() => setSysPrompt(DEFAULT_SYSTEM_PROMPT)}
            style={{ border: '1px solid var(--stroke3)', background: 'none', fontSize: 12, color: '#9ca3af',
              cursor: 'pointer', fontWeight: 600, padding: '2px 8px',
              borderRadius: 6 }}>
            Réinitialiser
          </button>
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
          Instructions de personnalité et de style pour l'IA. Modifiable par rapport dans la modale de génération.
        </div>
        <textarea
          value={sysPrompt} onChange={e => setSysPrompt(e.target.value)} rows={6}
          style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--stroke3)',
            borderRadius: 10, fontSize: 13, lineHeight: 1.7, fontFamily: 'inherit',
            resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
        />
      </div>

      {/* Save */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={save}
          style={{ padding: '11px 28px', borderRadius: 10, border: 'none',
            background: saved ? '#16a34a' : 'var(--brand)', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'background .3s' }}>
          {saved ? '✓ Enregistré' : '✓ Enregistrer'}
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────── nav items ───────────────────────── */

const NAV = [
  { key: 'entreprise',   icon: '🏢', label: 'Entreprise' },
  { key: 'lignes',       icon: '🚌', label: 'Lignes & routes' },
  { key: 'chauffeurs',   icon: '👤', label: 'Chauffeurs' },
  { key: 'planning',     icon: '📅', label: 'Planning' },
  { key: 'tarification', icon: '💶', label: 'Tarification' },
  { key: 'alertes',      icon: '⚠', label: 'Alertes & seuils' },
  { key: 'notifications',icon: '🔔', label: 'Notifications' },
  { key: 'utilisateurs', icon: '🎭', label: 'Utilisateurs & rôles' },
  { key: 'ia',           icon: '🤖', label: 'IA & Rapports' },
] as const;

type NavKey = typeof NAV[number]['key'];

const CONTENT: Record<NavKey, () => JSX.Element> = {
  entreprise:    TabEntreprise,
  lignes:        TabLignes,
  chauffeurs:    TabChauffeurs,
  planning:      TabPlanning,
  tarification:  TabTarification,
  alertes:       TabAlertes,
  notifications: TabNotifications,
  utilisateurs:  TabUtilisateurs,
  ia:            TabIA,
};

/* ───────────────────────── page ────────────────────────────── */

export default function SettingsPage() {
  const [active, setActive] = useState<NavKey>('alertes');
  const [editMode, setEditMode] = useState(true);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <PageBar
        title="Paramétrage"
        sub="Direction · Configuration système"
        actions={[
          { l: 'Annuler', onClick: () => { setEditMode(false); toast('Modifications annulées'); } },
          { l: '✓ Enregistrer', accent: true, onClick: () => { toast.success('Paramètres enregistrés'); } },
        ]}
      />

      {editMode && (
        <div style={{ padding: '10px 24px', background: 'var(--accent-soft)', borderBottom: '1.5px solid var(--brand)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)', flexShrink: 0 }}/>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand)' }}>Mode édition actif</span>
          <span style={{ fontSize: 12, color: 'var(--stroke2)' }}>— modifiez les champs puis cliquez Enregistrer</span>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar navigation */}
        <div style={{ width: 220, borderRight: '1.5px solid var(--stroke)', background: '#fff', flexShrink: 0, overflow: 'auto', paddingTop: 8 }}>
          {NAV.map(({ key, icon, label }) => (
            <div key={key} onClick={() => { setActive(key); setEditMode(true); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: 'pointer',
                background: active === key ? 'var(--stroke)' : 'transparent',
                color: active === key ? '#fff' : 'var(--stroke)',
                borderRadius: 0,
                fontSize: 13, fontWeight: active === key ? 700 : 400,
              }}>
              <span style={{ fontSize: 15, width: 20, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
              {label}
            </div>
          ))}
        </div>

        {/* Content area — tous les onglets restent montés, seul l'actif est visible */}
        <div className="scroll" style={{ flex: 1, padding: 24, background: 'var(--paper)' }}>
          {(Object.entries(CONTENT) as [NavKey, () => JSX.Element][]).map(([key, Tab]) => (
            <div key={key} style={{ display: active === key ? 'block' : 'none' }}>
              <Tab/>
            </div>
          ))}
          <div style={{ height: 24 }}/>
        </div>
      </div>
    </div>
  );
}
