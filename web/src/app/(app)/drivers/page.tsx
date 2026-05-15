'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { L3, L4, CHM, DOCS, RIBS, TODAY_DOC, DAYS, LINE_DIR } from '@/lib/data';

// ── Types ────────────────────────────────────────────────────────────────────

interface ApiDriver {
  id: string;
  driver_number: string;
  full_name: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  invoice_period?: 'weekly' | 'monthly';
  vehicle_seats?: number;
  is_active: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const LOCAL_ALL = [
  ...L3.map(d => ({ ...d, _l: 'L3', _color: 'var(--brand)' })),
  ...L4.map(d => ({ ...d, _l: 'L4', _color: 'var(--info)' })),
  ...CHM.map(d => ({ ...d, _l: 'CHM', _color: 'var(--success)' })),
];

function localMatch(driverNumber: string) {
  return LOCAL_ALL.find(d => d.code === driverNumber);
}

// ── Types Documents ───────────────────────────────────────────────────────────

interface DocEntry {
  id: string;
  icon: string;
  label: string;
  expiry?: string;   // YYYY-MM-DD
  banque?: string;   // RIB uniquement
  s3Key?: string;    // clé S3 si fichier uploadé
  filename?: string; // nom du fichier original
}

const DOC_TYPES = [
  { value: 'permis',    icon: '🪪', label: 'Permis B' },
  { value: 'carte_pro', icon: '📋', label: 'Carte professionnelle' },
  { value: 'visite',    icon: '🏥', label: 'Visite médicale' },
  { value: 'assurance', icon: '🛡', label: 'Assurance véhicule' },
  { value: 'rib',       icon: '🏦', label: 'RIB' },
  { value: 'autre',     icon: '📄', label: 'Autre' },
];

function docStatusFromExpiry(expiry?: string): { color: string; badge: string } {
  if (!expiry) return { color: 'var(--text-3)', badge: '—' };
  const days = (new Date(expiry).getTime() - TODAY_DOC.getTime()) / 86400000;
  const fmtDate = expiry.split('-').reverse().join('/');
  if (days < 0)  return { color: 'var(--danger)', badge: `✕ ${fmtDate}` };
  if (days < 60) return { color: 'var(--warn)',   badge: `⚠ ${fmtDate}` };
  return { color: 'var(--success)', badge: `✓ ${fmtDate}` };
}

function initDocs(driverNumber: string): DocEntry[] {
  const key = `docs_${driverNumber}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch {}
  // Bootstrap depuis données statiques
  const d = DOCS[driverNumber] || {};
  const rib = RIBS[driverNumber];
  const entries: DocEntry[] = [];
  if (d.p) entries.push({ id: 'p', icon: '🪪', label: 'Permis B',           expiry: d.p.e });
  if (d.c) entries.push({ id: 'c', icon: '📋', label: 'Carte professionnelle', expiry: d.c.e });
  if (d.m) entries.push({ id: 'm', icon: '🏥', label: 'Visite médicale',     expiry: d.m.e });
  if (d.a) entries.push({ id: 'a', icon: '🛡', label: 'Assurance véhicule',  expiry: d.a.e });
  if (rib)  entries.push({ id: 'rib', icon: '🏦', label: 'RIB', banque: rib.banque });
  return entries;
}

// ── Composant Documents & RIB ─────────────────────────────────────────────────

function DocsSection({ driverId, driverNumber }: { driverId: string; driverNumber: string }) {
  const storageKey = `docs_${driverNumber}`;
  const [docs, setDocs] = useState<DocEntry[]>(() => initDocs(driverNumber));
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: 'permis', label: '', expiry: '', banque: '' });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fetchingKey, setFetchingKey] = useState<string | null>(null);

  useEffect(() => {
    setDocs(initDocs(driverNumber));
    setShowAdd(false);
    setFile(null);
  }, [driverNumber]);

  const persist = (next: DocEntry[]) => {
    setDocs(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
  };

  const handleAdd = async () => {
    const def = DOC_TYPES.find(t => t.value === form.type)!;
    const label = form.label.trim() || def.label;
    let s3Key: string | undefined;
    let filename: string | undefined;

    if (file) {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append('file', file);
        const { data } = await api.post(`/drivers/${driverId}/documents/upload`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        s3Key = data.key;
        filename = data.filename;
      } catch {
        toast.error("Échec de l'upload — document ajouté sans fichier");
      } finally {
        setUploading(false);
      }
    }

    const entry: DocEntry = {
      id: `${form.type}_${Date.now()}`,
      icon: def.icon,
      label,
      expiry:   form.type !== 'rib' ? (form.expiry || undefined) : undefined,
      banque:   form.type === 'rib' ? (form.banque.trim() || undefined) : undefined,
      s3Key,
      filename,
    };
    persist([...docs, entry]);
    setForm({ type: 'permis', label: '', expiry: '', banque: '' });
    setFile(null);
    setShowAdd(false);
    toast.success(`Document « ${label} » ajouté`);
  };

  const handleView = async (doc: DocEntry) => {
    if (!doc.s3Key) return;
    setFetchingKey(doc.id);
    try {
      const { data } = await api.get(`/drivers/documents/signed-url?key=${encodeURIComponent(doc.s3Key)}`);
      window.open(data.url, '_blank', 'noopener');
    } catch {
      toast.error('Impossible d\'ouvrir le document');
    } finally {
      setFetchingKey(null);
    }
  };

  const handleRemove = async (id: string) => {
    const doc = docs.find(d => d.id === id);
    if (doc?.s3Key) {
      try { await api.delete(`/drivers/documents?key=${encodeURIComponent(doc.s3Key)}`); } catch {}
    }
    persist(docs.filter(d => d.id !== id));
    toast(`Document « ${doc?.label} » supprimé`, { icon: '🗑' });
  };

  const inp: React.CSSProperties = {
    border: '1px solid var(--border)', borderRadius: 5, padding: '5px 8px',
    fontSize: 12, outline: 'none', background: 'var(--surface)',
    color: 'var(--text)', fontFamily: 'var(--font-sans)', width: '100%',
    boxSizing: 'border-box',
  };
  const lbl: React.CSSProperties = {
    fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '.1em',
    textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700,
    display: 'block', marginBottom: 4,
  };

  const isRib = form.type === 'rib';

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
      padding: 18, boxShadow: 'var(--sh-xs)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.12em',
            textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>
            Documents & RIB
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '.08em',
            textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600,
            padding: '1px 6px', border: '1px solid var(--border)', borderRadius: 999 }}>
            Toute la période
          </span>
        </div>
        <button className="btn btn-sm" onClick={() => { setShowAdd(v => !v); setFile(null); }}>
          {showAdd ? '✕ Fermer' : '+ Ajouter'}
        </button>
      </div>

      {/* Formulaire ajout inline */}
      {showAdd && (
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 7,
          padding: 12, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={lbl}>Type de document</label>
              <select value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value, label: '', banque: '' }))}
                style={inp}>
                {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
              </select>
            </div>
            {!isRib && (
              <div>
                <label style={lbl}>Date d'expiration</label>
                <input type="date" value={form.expiry}
                  onChange={e => setForm(f => ({ ...f, expiry: e.target.value }))} style={inp} />
              </div>
            )}
            {isRib && (
              <div>
                <label style={lbl}>Banque</label>
                <input value={form.banque}
                  onChange={e => setForm(f => ({ ...f, banque: e.target.value }))}
                  placeholder="BFC OI, CIC…" style={inp} />
              </div>
            )}
          </div>
          {form.type === 'autre' && (
            <div>
              <label style={lbl}>Intitulé personnalisé</label>
              <input value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                placeholder="Nom du document" style={inp} />
            </div>
          )}
          {/* Upload fichier */}
          <div>
            <label style={lbl}>Fichier (PDF, image — optionnel)</label>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              border: `1.5px dashed ${file ? 'var(--brand)' : 'var(--border)'}`,
              borderRadius: 6, padding: '7px 10px',
              background: file ? 'rgba(242,100,25,.04)' : 'var(--surface)',
              transition: 'all .15s',
            }}>
              <span style={{ fontSize: 16 }}>{file ? '📎' : '⬆'}</span>
              <span style={{ fontSize: 11, color: file ? 'var(--brand)' : 'var(--text-3)', flex: 1,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file ? file.name : 'Cliquer pour sélectionner…'}
              </span>
              {file && (
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
                  {(file.size / 1024).toFixed(0)} Ko
                </span>
              )}
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
                style={{ display: 'none' }}
                onChange={e => setFile(e.target.files?.[0] ?? null)} />
            </label>
            {file && (
              <button onClick={() => setFile(null)}
                style={{ marginTop: 4, fontSize: 10, color: 'var(--text-3)', background: 'none',
                  border: 'none', cursor: 'pointer', padding: 0 }}>
                × Retirer le fichier
              </button>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
            <button className="btn btn-sm" onClick={() => { setShowAdd(false); setFile(null); }}>Annuler</button>
            <button className="btn btn-sm btn-accent" onClick={handleAdd} disabled={uploading}>
              {uploading ? 'Upload…' : 'Ajouter →'}
            </button>
          </div>
        </div>
      )}

      {/* Liste documents */}
      {docs.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '12px 0' }}>
          Aucun document — cliquez sur + Ajouter
        </div>
      )}
      {docs.map(doc => {
        const { color, badge } = doc.expiry
          ? docStatusFromExpiry(doc.expiry)
          : { color: 'var(--text-3)', badge: doc.banque ?? '—' };
        const isRibDoc = !!doc.banque;
        const badgeColor = isRibDoc ? 'var(--success)' : color;
        const badgeText  = isRibDoc ? `✓ ${doc.banque}` : badge;
        const fetching = fetchingKey === doc.id;
        return (
          <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 7,
            padding: '7px 0', borderBottom: '1px dashed var(--border)' }}>
            <span style={{ fontSize: 13, width: 18, textAlign: 'center', flexShrink: 0 }}>{doc.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 500 }}>{doc.label}</div>
              {doc.filename && (
                <div style={{ fontSize: 9.5, color: 'var(--text-3)', fontFamily: 'var(--font-mono)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  📎 {doc.filename}
                </div>
              )}
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
              color: badgeColor, flexShrink: 0 }}>
              {badgeText}
            </span>
            {doc.s3Key && (
              <button onClick={() => handleView(doc)} disabled={fetching}
                title="Ouvrir le fichier"
                style={{ border: '1px solid var(--border)', borderRadius: 4, background: 'var(--surface-2)',
                  cursor: 'pointer', fontSize: 11, padding: '2px 7px', color: 'var(--text-2)',
                  flexShrink: 0, opacity: fetching ? .5 : 1 }}>
                {fetching ? '…' : '↗'}
              </button>
            )}
            <button onClick={() => handleRemove(doc.id)} title="Supprimer"
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-3)',
                fontSize: 16, padding: '0 2px', lineHeight: 1, opacity: .4, flexShrink: 0 }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '.4')}>
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── Composant Kilométrages ────────────────────────────────────────────────────

interface MileageEntry {
  id: string; month: string;
  km_start: number | null; km_end: number | null;
  km_total: number | null;
  declared_start_at: string | null; declared_end_at: string | null;
  notes?: string | null;
  status: 'complet' | 'en_attente_fin' | 'en_attente_debut' | 'non_declare';
}

function loadLocalMileages(driverId: string): MileageEntry[] {
  try { return JSON.parse(localStorage.getItem(`mileages_${driverId}`) ?? '[]'); } catch { return []; }
}
function saveLocalMileages(driverId: string, list: MileageEntry[]) {
  try { localStorage.setItem(`mileages_${driverId}`, JSON.stringify(list)); } catch {}
}

function MileageSection({ driverId }: { driverId: string }) {
  const [entries, setEntries] = useState<MileageEntry[]>(() => loadLocalMileages(driverId));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setEntries(loadLocalMileages(driverId));
    setLoading(true);
    api.get(`/drivers/${driverId}/mileages`)
      .then(res => { setEntries(res.data); saveLocalMileages(driverId, res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [driverId]);

  const fmtMonth = (m: string) => {
    const [y, mo] = m.split('-');
    const names = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
    return `${names[parseInt(mo, 10) - 1]} ${y}`;
  };
  const fmtKm = (v: number | null) =>
    v != null ? v.toLocaleString('fr-FR') + ' km' : '—';

  const statusBadge = (status: MileageEntry['status']) => {
    switch (status) {
      case 'complet':          return { label: '✓ Complet',         color: 'var(--success)' };
      case 'en_attente_fin':   return { label: '⏳ Fin manquante',  color: 'var(--warn)' };
      case 'en_attente_debut': return { label: '⏳ Début manquant', color: 'var(--warn)' };
      default:                 return { label: 'Non déclaré',        color: 'var(--text-3)' };
    }
  };

  const inp: React.CSSProperties = {
    border: '1px solid var(--border)', borderRadius: 5, padding: '4px 8px',
    fontSize: 12, outline: 'none', background: 'var(--surface)', color: 'var(--text)',
    fontFamily: 'var(--font-mono)', width: 90, boxSizing: 'border-box',
  };

  const [editing, setEditing] = useState<{ month: string; type: 'start' | 'end'; km: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!editing) return;
    const km = parseInt(editing.km, 10);
    if (isNaN(km) || km < 0) { toast.error('Kilométrage invalide'); return; }
    setSaving(true);
    const now = new Date().toISOString();
    const next = entries.map(e => {
      if (e.month !== editing.month) return e;
      const updated = { ...e };
      if (editing.type === 'start') { updated.km_start = km; updated.declared_start_at = now; }
      else                          { updated.km_end   = km; updated.declared_end_at   = now; }
      updated.km_total = updated.km_start != null && updated.km_end != null
        ? updated.km_end - updated.km_start : null;
      updated.status = updated.km_start != null && updated.km_end != null ? 'complet'
        : updated.km_start != null ? 'en_attente_fin'
        : updated.km_end   != null ? 'en_attente_debut' : 'non_declare';
      return updated;
    });
    // If month doesn't exist yet, create entry
    if (!entries.find(e => e.month === editing.month)) {
      const newEntry: MileageEntry = {
        id: `ml_${Date.now()}`, month: editing.month,
        km_start: editing.type === 'start' ? km : null,
        km_end:   editing.type === 'end'   ? km : null,
        km_total: null,
        declared_start_at: editing.type === 'start' ? now : null,
        declared_end_at:   editing.type === 'end'   ? now : null,
        status: editing.type === 'start' ? 'en_attente_fin' : 'en_attente_debut',
      };
      next.unshift(newEntry);
    }
    setEntries(next); saveLocalMileages(driverId, next);
    setEditing(null);
    toast.success('Kilométrage mis à jour');
    // Try backend
    api.post(`/drivers/${driverId}/mileage-override`, { type: editing.type, month: editing.month, km })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  // Generate last 6 months for display
  const months6: string[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
    months6.push(d.toISOString().slice(0, 7));
  }
  // Merge with API data
  const rows = months6.map(m => entries.find(e => e.month === m) ?? {
    id: '', month: m, km_start: null, km_end: null, km_total: null,
    declared_start_at: null, declared_end_at: null, status: 'non_declare' as const,
  });

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
      padding: 18, boxShadow: 'var(--sh-xs)', gridColumn: '1 / -1' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.12em',
            textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>
            Kilométrage mensuel
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '.08em',
            textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600,
            padding: '1px 6px', border: '1px solid var(--border)', borderRadius: 999 }}>
            Toute la période
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '.08em',
            textTransform: 'uppercase', color: 'var(--info)', fontWeight: 600,
            padding: '1px 6px', border: '1px solid var(--info)', borderRadius: 999 }}>
            Déclaratif Android
          </span>
        </div>
        {loading && <span style={{ fontSize: 10, color: 'var(--text-3)' }}>Synchronisation…</span>}
      </div>

      {/* Table */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '90px 110px 110px 90px 120px 1fr',
          gap: 8, padding: '7px 12px', background: 'var(--surface-2)',
          fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.1em',
          textTransform: 'uppercase', color: 'var(--text-3)' }}>
          <span>Mois</span>
          <span>Début (km)</span>
          <span>Fin (km)</span>
          <span>Total</span>
          <span>Statut</span>
          <span>Modifier</span>
        </div>

        {rows.map((row, i) => {
          const badge = statusBadge(row.status);
          const isEditing = editing?.month === row.month;
          return (
            <div key={row.month} style={{
              display: 'grid', gridTemplateColumns: '90px 110px 110px 90px 120px 1fr',
              gap: 8, padding: '8px 12px', alignItems: 'center',
              borderTop: '1px dashed var(--border)',
              background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                color: 'var(--text)' }}>
                {fmtMonth(row.month)}
              </span>

              {/* Début */}
              <div>
                {isEditing && editing.type === 'start' ? (
                  <input autoFocus style={inp} value={editing.km}
                    onChange={e => setEditing({ ...editing, km: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(null); }}
                    type="number" min={0} />
                ) : (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11,
                    color: row.km_start != null ? 'var(--text)' : 'var(--text-3)' }}>
                    {fmtKm(row.km_start)}
                  </span>
                )}
                {row.declared_start_at && (
                  <div style={{ fontSize: 9, color: 'var(--text-3)', marginTop: 1 }}>
                    {new Date(row.declared_start_at).toLocaleDateString('fr-FR')}
                  </div>
                )}
              </div>

              {/* Fin */}
              <div>
                {isEditing && editing.type === 'end' ? (
                  <input autoFocus style={inp} value={editing.km}
                    onChange={e => setEditing({ ...editing, km: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(null); }}
                    type="number" min={0} />
                ) : (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11,
                    color: row.km_end != null ? 'var(--text)' : 'var(--text-3)' }}>
                    {fmtKm(row.km_end)}
                  </span>
                )}
                {row.declared_end_at && (
                  <div style={{ fontSize: 9, color: 'var(--text-3)', marginTop: 1 }}>
                    {new Date(row.declared_end_at).toLocaleDateString('fr-FR')}
                  </div>
                )}
              </div>

              {/* Total */}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
                color: row.km_total != null ? 'var(--brand)' : 'var(--text-3)' }}>
                {row.km_total != null ? row.km_total.toLocaleString('fr-FR') + ' km' : '—'}
              </span>

              {/* Statut */}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                color: badge.color }}>
                {badge.label}
              </span>

              {/* Actions */}
              {isEditing ? (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={handleSave} disabled={saving}
                    style={{ padding: '3px 8px', border: 'none', borderRadius: 4,
                      background: 'var(--brand)', color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                    ✓
                  </button>
                  <button onClick={() => setEditing(null)}
                    style={{ padding: '3px 8px', border: '1px solid var(--border)', borderRadius: 4,
                      background: 'none', fontSize: 10, cursor: 'pointer', color: 'var(--text-3)' }}>
                    ✕
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => setEditing({ month: row.month, type: 'start', km: row.km_start != null ? String(row.km_start) : '' })}
                    title="Modifier début"
                    style={{ padding: '2px 7px', border: '1px solid var(--border)', borderRadius: 4,
                      background: 'var(--surface)', fontSize: 9, cursor: 'pointer', color: 'var(--text-3)',
                      fontFamily: 'var(--font-mono)' }}>
                    ✎ dép.
                  </button>
                  <button
                    onClick={() => setEditing({ month: row.month, type: 'end', km: row.km_end != null ? String(row.km_end) : '' })}
                    title="Modifier fin"
                    style={{ padding: '2px 7px', border: '1px solid var(--border)', borderRadius: 4,
                      background: 'var(--surface)', fontSize: 9, cursor: 'pointer', color: 'var(--text-3)',
                      fontFamily: 'var(--font-mono)' }}>
                    ✎ fin
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Composant Acomptes ────────────────────────────────────────────────────────

interface Repayment { id: string; advance_id: string; amount: string; date: string; notes?: string; }
interface AdvanceRaw { id: string; amount: string; date: string; notes?: string; repayments: Repayment[]; }
interface Advance extends AdvanceRaw { repaid: string; balance: string; daysOpen: number; }

function deriveAdvance(a: AdvanceRaw): Advance {
  const repaid = a.repayments.reduce((s, r) => s + Number(r.amount), 0);
  const balance = Number(a.amount) - repaid;
  const daysOpen = Math.max(0, Math.floor((Date.now() - new Date(a.date).getTime()) / 86400000));
  return { ...a, repaid: repaid.toFixed(2), balance: balance.toFixed(2), daysOpen };
}

function loadLocal(driverId: string): AdvanceRaw[] {
  try { return JSON.parse(localStorage.getItem(`advances_${driverId}`) ?? '[]'); } catch { return []; }
}
function saveLocal(driverId: string, list: AdvanceRaw[]) {
  try { localStorage.setItem(`advances_${driverId}`, JSON.stringify(list)); } catch {}
}

function AdvancesSection({ driverId }: { driverId: string }) {
  const [raw, setRaw] = useState<AdvanceRaw[]>(() => loadLocal(driverId));
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState({ amount: '', date: new Date().toISOString().slice(0, 10), notes: '' });
  const [repForms, setRepForms] = useState<Record<string, { amount: string; date: string; notes: string }>>({});
  const [showRepForm, setShowRepForm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const advances = raw.map(deriveAdvance);

  const persist = (list: AdvanceRaw[]) => { setRaw(list); saveLocal(driverId, list); };

  // Reset when driver changes
  useEffect(() => {
    setRaw(loadLocal(driverId));
    setExpanded(null); setShowNewForm(false); setShowRepForm(null);
  }, [driverId]);

  // Try to sync from API (non-blocking)
  useEffect(() => {
    setLoading(true);
    api.get(`/drivers/${driverId}/advances`)
      .then(res => { persist(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverId]);

  const handleCreate = async () => {
    const amt = parseFloat(newForm.amount);
    if (!amt || amt <= 0) { toast.error('Montant invalide'); return; }
    setSaving(true);
    const newAdv: AdvanceRaw = {
      id: `adv_${Date.now()}`,
      amount: String(amt),
      date: newForm.date,
      notes: newForm.notes.trim() || undefined,
      repayments: [],
    };
    // Optimistic local save
    const next = [newAdv, ...raw];
    persist(next);
    setNewForm({ amount: '', date: new Date().toISOString().slice(0, 10), notes: '' });
    setShowNewForm(false);
    toast.success('Acompte enregistré');
    // Try API in background
    api.post(`/drivers/${driverId}/advances`, { amount: amt, date: newForm.date, notes: newAdv.notes })
      .then(res => {
        // Replace temp id with server id
        persist(next.map(a => a.id === newAdv.id ? { ...a, id: res.data.id } : a));
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  const handleRepayment = async (advId: string) => {
    const f = repForms[advId] ?? { amount: '', date: new Date().toISOString().slice(0, 10), notes: '' };
    const amt = parseFloat(f.amount);
    if (!amt || amt <= 0) { toast.error('Montant invalide'); return; }
    setSaving(true);
    const newRep: Repayment = {
      id: `rep_${Date.now()}`,
      advance_id: advId,
      amount: String(amt),
      date: f.date,
      notes: f.notes.trim() || undefined,
    };
    const next = raw.map(a => a.id === advId ? { ...a, repayments: [...a.repayments, newRep] } : a);
    persist(next);
    setRepForms(prev => { const n = { ...prev }; delete n[advId]; return n; });
    setShowRepForm(null);
    toast.success('Remboursement enregistré');
    api.post(`/drivers/${driverId}/advances/${advId}/repayments`, { amount: amt, date: f.date, notes: newRep.notes })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  const handleDeleteAdvance = async (advId: string) => {
    if (!window.confirm('Supprimer cet acompte et tous ses remboursements ?')) return;
    persist(raw.filter(a => a.id !== advId));
    toast('Acompte supprimé', { icon: '🗑' });
    api.delete(`/drivers/${driverId}/advances/${advId}`).catch(() => {});
  };

  const handleDeleteRepayment = async (advId: string, repId: string) => {
    persist(raw.map(a => a.id === advId ? { ...a, repayments: a.repayments.filter(r => r.id !== repId) } : a));
    toast('Remboursement supprimé', { icon: '🗑' });
    api.delete(`/drivers/${driverId}/advances/${advId}/repayments/${repId}`).catch(() => {});
  };

  const fmtDate = (d: string) => d ? d.split('-').reverse().join('/') : '—';
  const fmtAmt = (v: string | number) => Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

  const durationLabel = (days: number) => {
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return '1 jour';
    if (days < 7)   return `${days} jours`;
    const weeks = Math.floor(days / 7);
    const rem = days % 7;
    if (weeks < 5)  return rem ? `${weeks}sem ${rem}j` : `${weeks} sem.`;
    const months = Math.floor(days / 30);
    return `${months} mois`;
  };

  const inp: React.CSSProperties = {
    border: '1px solid var(--border)', borderRadius: 5, padding: '5px 8px',
    fontSize: 12, outline: 'none', background: 'var(--surface)', color: 'var(--text)',
    fontFamily: 'var(--font-sans)', width: '100%', boxSizing: 'border-box',
  };
  const lbl: React.CSSProperties = {
    fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '.1em',
    textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700,
    display: 'block', marginBottom: 4,
  };

  const totalDemandé = advances.reduce((s, a) => s + Number(a.amount), 0);
  const totalRemboursé = advances.reduce((s, a) => s + Number(a.repaid), 0);
  const totalSolde = totalDemandé - totalRemboursé;

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
      padding: 18, boxShadow: 'var(--sh-xs)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.12em',
            textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>
            Acomptes & Avances
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '.08em',
            textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600,
            padding: '1px 6px', border: '1px solid var(--border)', borderRadius: 999 }}>
            Toute la période
          </span>
        </div>
        <button className="btn btn-sm" onClick={() => setShowNewForm(v => !v)}>
          {showNewForm ? '✕ Fermer' : '+ Nouvel acompte'}
        </button>
      </div>

      {/* Résumé global */}
      {advances.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
          {[
            { label: 'Demandé', value: fmtAmt(totalDemandé), color: 'var(--text)' },
            { label: 'Remboursé', value: fmtAmt(totalRemboursé), color: 'var(--success)' },
            { label: 'Solde dû', value: fmtAmt(totalSolde), color: totalSolde > 0 ? 'var(--danger)' : 'var(--success)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'var(--surface-2)', borderRadius: 6, padding: '8px 10px',
              border: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '.1em',
                textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 3 }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Formulaire nouvel acompte */}
      {showNewForm && (
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 7,
          padding: 12, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={lbl}>Montant (€) *</label>
              <input type="number" min="1" step="0.01" value={newForm.amount}
                onChange={e => setNewForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="500.00" style={inp} />
            </div>
            <div>
              <label style={lbl}>Date</label>
              <input type="date" value={newForm.date}
                onChange={e => setNewForm(f => ({ ...f, date: e.target.value }))} style={inp} />
            </div>
          </div>
          <div>
            <label style={lbl}>Notes (optionnel)</label>
            <input value={newForm.notes}
              onChange={e => setNewForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Motif de l'avance…" style={inp} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
            <button className="btn btn-sm" onClick={() => setShowNewForm(false)}>Annuler</button>
            <button className="btn btn-sm btn-accent" onClick={handleCreate} disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer →'}
            </button>
          </div>
        </div>
      )}

      {/* Liste acomptes */}
      {loading && (
        <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '12px 0' }}>
          Chargement…
        </div>
      )}
      {!loading && advances.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '12px 0' }}>
          Aucun acompte enregistré
        </div>
      )}
      {advances.map(adv => {
        const isFullyRepaid = Number(adv.balance) <= 0;
        const isOpen = expanded === adv.id;
        const showRep = showRepForm === adv.id;
        const rf = repForms[adv.id] ?? { amount: '', date: new Date().toISOString().slice(0, 10), notes: '' };
        const setRf = (patch: Partial<typeof rf>) =>
          setRepForms(prev => ({ ...prev, [adv.id]: { ...rf, ...patch } }));

        return (
          <div key={adv.id} style={{ border: '1px solid var(--border)', borderRadius: 7, marginBottom: 8,
            overflow: 'hidden', opacity: isFullyRepaid ? .7 : 1 }}>

            {/* Ligne principale */}
            <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr 90px 90px 68px 68px 28px',
              alignItems: 'center', gap: 6, padding: '9px 12px',
              background: isOpen ? 'var(--surface-2)' : 'var(--surface)',
              cursor: 'pointer' }}
              onClick={() => setExpanded(isOpen ? null : adv.id)}>

              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', fontWeight: 700 }}>
                {fmtDate(adv.date)}
              </span>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                  {fmtAmt(adv.amount)}
                </div>
                {adv.notes && (
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{adv.notes}</div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--success)', fontWeight: 600 }}>
                  {fmtAmt(adv.repaid)}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-3)' }}>remboursé</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                  color: isFullyRepaid ? 'var(--success)' : 'var(--danger)' }}>
                  {isFullyRepaid ? '✓ soldé' : fmtAmt(adv.balance)}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-3)' }}>solde</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                  color: adv.daysOpen > 60 ? 'var(--warn)' : 'var(--text-3)' }}>
                  {durationLabel(adv.daysOpen)}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-3)' }}>durée</div>
              </div>
              <div onClick={e => { e.stopPropagation(); handleDeleteAdvance(adv.id); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-3)', cursor: 'pointer', fontSize: 15, opacity: .4 }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '.4')}>×</div>
              <span style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center' }}>
                {isOpen ? '▲' : '▼'}
              </span>
            </div>

            {/* Détail remboursements */}
            {isOpen && (
              <div style={{ borderTop: '1px dashed var(--border)', padding: 12,
                background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', gap: 6 }}>

                {adv.repayments.length === 0 ? (
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', padding: '4px 0' }}>
                    Aucun remboursement enregistré
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr 28px', gap: 6,
                      fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '.1em',
                      textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 4 }}>
                      <span>Date</span><span>Montant</span><span />
                    </div>
                    {adv.repayments.map(rep => (
                      <div key={rep.id} style={{ display: 'grid', gridTemplateColumns: '72px 1fr 28px',
                        gap: 6, alignItems: 'center', padding: '5px 0',
                        borderTop: '1px dashed var(--border)' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>
                          {fmtDate(rep.date)}
                        </span>
                        <div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                            color: 'var(--success)' }}>+{fmtAmt(rep.amount)}</span>
                          {rep.notes && <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 8 }}>{rep.notes}</span>}
                        </div>
                        <button onClick={() => handleDeleteRepayment(adv.id, rep.id)}
                          style={{ border: 'none', background: 'none', cursor: 'pointer',
                            color: 'var(--text-3)', fontSize: 14, padding: 0, lineHeight: 1, opacity: .4 }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '.4')}>×</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Formulaire remboursement */}
                {!isFullyRepaid && (
                  showRep ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 6,
                      borderTop: '1px dashed var(--border)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div>
                          <label style={lbl}>Montant (€) *</label>
                          <input type="number" min="0.01" step="0.01" value={rf.amount}
                            onChange={e => setRf({ amount: e.target.value })}
                            placeholder={String(adv.balance)} style={inp} autoFocus />
                        </div>
                        <div>
                          <label style={lbl}>Date</label>
                          <input type="date" value={rf.date}
                            onChange={e => setRf({ date: e.target.value })} style={inp} />
                        </div>
                      </div>
                      <div>
                        <label style={lbl}>Notes</label>
                        <input value={rf.notes}
                          onChange={e => setRf({ notes: e.target.value })}
                          placeholder="Virement, espèces…" style={inp} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button className="btn btn-sm" onClick={() => setShowRepForm(null)}>Annuler</button>
                        <button className="btn btn-sm btn-accent"
                          onClick={() => handleRepayment(adv.id)} disabled={saving}>
                          {saving ? '…' : '✓ Valider remboursement'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn btn-sm" style={{ alignSelf: 'flex-start' }}
                      onClick={e => { e.stopPropagation(); setShowRepForm(adv.id); }}>
                      + Ajouter remboursement
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Modal Nouveau Chauffeur ───────────────────────────────────────────────────

function AddDriverModal({ onClose, onCreated }: { onClose: () => void; onCreated: (d: ApiDriver) => void }) {
  const [form, setForm] = useState({
    driver_number: '', full_name: '', pin: '', phone: '',
    address: '', tax_id: '', invoice_period: 'weekly' as 'weekly' | 'monthly',
  });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.driver_number.trim() || !form.full_name.trim() || form.pin.length < 4) {
      toast.error('Numéro, nom et PIN (4 car. min) sont requis');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post('/drivers', {
        driver_number: form.driver_number.trim().toUpperCase(),
        full_name: form.full_name.trim(),
        pin: form.pin.trim(),
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        tax_id: form.tax_id.trim() || undefined,
        invoice_period: form.invoice_period,
      });
      toast.success(`Chauffeur ${data.driver_number} créé`);
      onCreated(data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const inp: React.CSSProperties = {
    width: '100%', border: '1px solid var(--border)', borderRadius: 6,
    padding: '7px 10px', fontSize: 13, outline: 'none',
    background: 'var(--surface)', color: 'var(--text)', fontFamily: 'var(--font-sans)',
  };
  const lbl: React.CSSProperties = {
    fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '.1em',
    textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700,
    display: 'block', marginBottom: 5,
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,15,16,.4)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
        boxShadow: 'var(--sh-xl)', width: 480, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.12em',
              textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>
              Nouveau chauffeur
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', marginTop: 2 }}>
              Ajouter un chauffeur
            </div>
          </div>
          <button onClick={onClose} className="btn btn-sm">✕</button>
        </div>

        {/* Form */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Numéro *</label>
              <input value={form.driver_number} onChange={set('driver_number')}
                placeholder="D15" maxLength={10} style={inp} />
            </div>
            <div>
              <label style={lbl}>PIN (4–6 chiffres) *</label>
              <input value={form.pin} onChange={set('pin')} type="password"
                placeholder="••••" maxLength={6} style={inp} />
            </div>
          </div>
          <div>
            <label style={lbl}>Nom complet *</label>
            <input value={form.full_name} onChange={set('full_name')}
              placeholder="COMBO Said" maxLength={100} style={inp} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Téléphone</label>
              <input value={form.phone} onChange={set('phone')}
                placeholder="+262 639 00 00 00" style={inp} />
            </div>
            <div>
              <label style={lbl}>Facturation</label>
              <select value={form.invoice_period} onChange={set('invoice_period')} style={inp}>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuelle</option>
              </select>
            </div>
          </div>
          <div>
            <label style={lbl}>Adresse</label>
            <input value={form.address} onChange={set('address')}
              placeholder="Rue de la paix, Mamoudzou" style={inp} />
          </div>
          <div>
            <label style={lbl}>N° fiscal (NIF / SIRET)</label>
            <input value={form.tax_id} onChange={set('tax_id')}
              placeholder="FR 00 000 000 000" style={inp} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)',
          display: 'flex', gap: 8, justifyContent: 'flex-end',
          background: 'var(--surface-2)' }}>
          <button className="btn" onClick={onClose}>Annuler</button>
          <button className="btn btn-accent" onClick={handleSave} disabled={saving}>
            {saving ? 'Création…' : '+ Créer le chauffeur'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Modifier Chauffeur ──────────────────────────────────────────────────

function EditDriverModal({ driver, onClose, onSaved }: {
  driver: ApiDriver; onClose: () => void; onSaved: (d: ApiDriver) => void;
}) {
  const local = localMatch(driver.driver_number);
  const [form, setForm] = useState({
    full_name:      driver.full_name,
    phone:          driver.phone ?? '',
    address:        driver.address ?? '',
    tax_id:         driver.tax_id ?? '',
    invoice_period: driver.invoice_period ?? 'weekly' as 'weekly' | 'monthly',
    vehicle_seats:  String(driver.vehicle_seats ?? 55),
    pin:            '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.full_name.trim()) { toast.error('Le nom est requis'); return; }
    if (form.pin && form.pin.length < 4) { toast.error('Le PIN doit faire 4 à 6 caractères'); return; }
    setSaving(true);
    try {
      const payload: any = {
        full_name:      form.full_name.trim(),
        phone:          form.phone.trim()   || undefined,
        address:        form.address.trim() || undefined,
        tax_id:         form.tax_id.trim()  || undefined,
        invoice_period: form.invoice_period,
        vehicle_seats:  parseInt(form.vehicle_seats) || 55,
      };
      if (form.pin.trim()) payload.pin = form.pin.trim();
      const { data } = await api.put(`/drivers/${driver.id}`, payload);
      toast.success('Fiche mise à jour');
      onSaved(data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const inp: React.CSSProperties = {
    width: '100%', border: '1px solid var(--border)', borderRadius: 6,
    padding: '7px 10px', fontSize: 13, outline: 'none',
    background: 'var(--surface)', color: 'var(--text)', fontFamily: 'var(--font-sans)',
    boxSizing: 'border-box',
  };
  const lbl: React.CSSProperties = {
    fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '.1em',
    textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700,
    display: 'block', marginBottom: 5,
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,15,16,.4)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
        boxShadow: 'var(--sh-xl)', width: 480, overflow: 'hidden' }}>

        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.12em',
              textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>
              Modifier · {driver.driver_number}
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', marginTop: 2 }}>
              {driver.full_name}
            </div>
          </div>
          <button onClick={onClose} className="btn btn-sm">✕</button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>Nom complet *</label>
            <input value={form.full_name} onChange={set('full_name')}
              placeholder="COMBO Said" maxLength={100} style={inp} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Téléphone</label>
              <input value={form.phone} onChange={set('phone')}
                placeholder="+262 639 00 00 00" style={inp} />
            </div>
            <div>
              <label style={lbl}>Facturation</label>
              <select value={form.invoice_period} onChange={set('invoice_period')} style={inp}>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuelle</option>
              </select>
            </div>
          </div>
          <div>
            <label style={lbl}>Adresse</label>
            <input value={form.address} onChange={set('address')}
              placeholder="Rue de la paix, Mamoudzou" style={inp} />
          </div>
          <div>
            <label style={lbl}>N° fiscal (NIF / SIRET)</label>
            <input value={form.tax_id} onChange={set('tax_id')}
              placeholder="FR 00 000 000 000" style={inp} />
          </div>
          {/* ── Identification véhicule ── */}
          <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 14, marginTop: 2 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.12em',
              textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700, marginBottom: 12 }}>
              Véhicule
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Immatriculation</label>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, padding: '7px 10px',
                  border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-3)',
                  background: 'var(--surface-2)' }}>
                  {(local?.vehicule) ?? '—'}
                </div>
              </div>
              <div>
                <label style={lbl}>Nb places <span style={{ fontWeight: 400, opacity: .6 }}>(capacité)</span></label>
                <input type="number" min={1} max={100} value={form.vehicle_seats}
                  onChange={e => setForm(f => ({ ...f, vehicle_seats: e.target.value }))}
                  placeholder="55" style={inp} />
              </div>
            </div>
          </div>
          <div>
            <label style={lbl}>Nouveau PIN <span style={{ fontWeight: 400, opacity: .6 }}>(laisser vide pour ne pas changer)</span></label>
            <input value={form.pin} onChange={set('pin')} type="password"
              placeholder="••••" maxLength={6} style={inp} />
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)',
          display: 'flex', gap: 8, justifyContent: 'flex-end', background: 'var(--surface-2)' }}>
          <button className="btn" onClick={onClose}>Annuler</button>
          <button className="btn btn-accent" onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Confirmation Suppression ────────────────────────────────────────────

function ConfirmDeactivateModal({ driver, onClose, onConfirm }: {
  driver: ApiDriver; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,15,16,.4)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
        boxShadow: 'var(--sh-xl)', width: 400, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.12em',
            textTransform: 'uppercase', color: 'var(--danger)', fontWeight: 700 }}>
            Désactiver le chauffeur
          </div>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', marginTop: 2 }}>
            {driver.driver_number} · {driver.full_name}
          </div>
        </div>
        <div style={{ padding: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.6 }}>
            Le chauffeur sera désactivé et n'apparaîtra plus dans le planning.
            Ses données historiques (courses, factures) sont conservées.
          </p>
        </div>
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)',
          display: 'flex', gap: 8, justifyContent: 'flex-end', background: 'var(--surface-2)' }}>
          <button className="btn" onClick={onClose}>Annuler</button>
          <button className="btn"
            style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
            onClick={onConfirm}>
            Désactiver
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function DriversPage() {
  const FALLBACK: ApiDriver[] = LOCAL_ALL.map((d, i) => ({
    id: String(i), driver_number: d.code, full_name: d.nom,
    phone: (d as any).tel, is_active: true, invoice_period: 'weekly' as const,
  }));

  const [drivers, setDrivers] = useState<ApiDriver[]>(FALLBACK);
  const [loading, setLoading] = useState(false);
  const [selId, setSelId] = useState<string | null>(FALLBACK[0]?.id ?? null);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<ApiDriver | null>(null);
  const [deactivating, setDeactivating] = useState<ApiDriver | null>(null);
  const [period, setPeriod] = useState('semaine');
  const [kpi, setKpi] = useState<{ courses: number; passagers: number; ca: string; incidents: number; unplanned: number } | null>(null);
  const [kpiLoading, setKpiLoading] = useState(false);

  useEffect(() => {
    api.get('/drivers')
      .then(res => {
        const list: ApiDriver[] = res.data;
        setDrivers(list);
        if (list.length) setSelId(list[0].id);
      })
      .catch(() => { /* garde le fallback initial */ });
  }, []);

  useEffect(() => {
    if (!selId) return;
    setKpiLoading(true);
    api.get(`/drivers/${selId}/stats?period=${period}`)
      .then(res => setKpi(res.data))
      .catch(() => setKpi(null))
      .finally(() => setKpiLoading(false));
  }, [selId, period]);

  const filtered = drivers.filter(d =>
    search === '' ||
    d.full_name.toLowerCase().includes(search.toLowerCase()) ||
    d.driver_number.toLowerCase().includes(search.toLowerCase())
  );

  const dr = drivers.find(d => d.id === selId) ?? null;
  const local = dr ? localMatch(dr.driver_number) : null;
  const lineColor = local?._color ?? 'var(--text-3)';
  const lineLabel = local?._l === 'L3' ? 'L3 · Doujani ↔ Passot Barge'
    : local?._l === 'L4' ? 'L4 · Vahibe ↔ Passamainty'
    : local?._l === 'CHM' ? 'CHM · La Barge ↔ CHM'
    : 'Ligne non assignée';

  const handleCreated = (newDr: ApiDriver) => {
    setDrivers(prev => [newDr, ...prev]);
    setSelId(newDr.id);
    setShowAdd(false);
  };

  const handleDeactivate = async () => {
    if (!deactivating) return;
    try {
      await api.put(`/drivers/${deactivating.id}/deactivate`);
      toast.success(`${deactivating.driver_number} désactivé`);
      const updated = drivers.filter(d => d.id !== deactivating.id);
      setDrivers(updated);
      setSelId(updated[0]?.id ?? null);
    } catch {
      toast.error('Erreur lors de la désactivation');
    } finally {
      setDeactivating(null);
    }
  };


  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

      {showAdd && <AddDriverModal onClose={() => setShowAdd(false)} onCreated={handleCreated} />}
      {editing && (
        <EditDriverModal
          driver={editing}
          onClose={() => setEditing(null)}
          onSaved={updated => {
            setDrivers(prev => prev.map(d => d.id === updated.id ? updated : d));
            setEditing(null);
          }}
        />
      )}
      {deactivating && (
        <ConfirmDeactivateModal
          driver={deactivating}
          onClose={() => setDeactivating(null)}
          onConfirm={handleDeactivate}
        />
      )}

      {/* ── Liste gauche ── */}
      <div style={{ width: 280, borderRight: '1px solid var(--border)', display: 'flex',
        flexDirection: 'column', flexShrink: 0, background: 'var(--surface)' }}>

        {/* Header liste */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '.12em',
              textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>
              Chauffeurs · {drivers.filter(d => d.is_active).length}
            </span>
            <button className="btn btn-sm btn-accent" onClick={() => setShowAdd(true)}>
              + Ajouter
            </button>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 5,
              padding: '6px 9px', fontSize: 12, outline: 'none', fontFamily: 'var(--font-sans)',
              background: 'var(--surface-2)', color: 'var(--text)', boxSizing: 'border-box' }} />
        </div>

        {/* Liste */}
        <div className="scroll">
          {loading && (
            <div style={{ padding: 20, fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>
              Chargement…
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: 20, fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>
              Aucun résultat
            </div>
          )}
          {filtered.map(d => {
            const loc = localMatch(d.driver_number);
            const c = loc?._color ?? 'var(--text-3)';
            const active = d.id === selId;
            return (
              <div key={d.id} onClick={() => setSelId(d.id)} style={{
                padding: '10px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                background: active ? 'var(--surface-3)' : 'transparent',
                borderLeft: active ? `3px solid ${c}` : '3px solid transparent',
                opacity: d.is_active ? 1 : 0.45,
              }}>
                <div style={{ fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 7,
                  color: 'var(--text)' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: c, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: c,
                    padding: '0 3px', border: `1.5px solid ${c}`, borderRadius: 3 }}>
                    {d.driver_number}
                  </span>
                  {d.full_name}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3, paddingLeft: 14 }}>
                  {loc ? (loc._l === 'L3' ? 'Ligne 3' : loc._l === 'L4' ? 'Ligne 4' : 'CHM') : '—'}
                  {d.phone ? ` · ${d.phone}` : ''}
                  {!d.is_active && ' · désactivé'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Détail droite ── */}
      {!dr ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-3)', fontSize: 13 }}>
          Sélectionnez un chauffeur
        </div>
      ) : (
        <div className="scroll" style={{ flex: 1, background: 'var(--surface-2)' }}>

          {/* ── Header fiche ── */}
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)',
            background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--surface-3)',
              border: `2px solid ${lineColor}`, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 14,
              fontWeight: 700, flexShrink: 0, color: lineColor }}>
              {dr.driver_number}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.12em',
                textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>
                Chauffeur · {lineLabel}
              </div>
              <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--text)', marginTop: 2 }}>
                {dr.full_name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                {dr.phone ?? '—'}
                {dr.invoice_period && ` · Fact. ${dr.invoice_period === 'weekly' ? 'hebdo' : 'mensuelle'}`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-sm"
                style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                onClick={() => setDeactivating(dr)}>
                Désactiver
              </button>
              <button className="btn btn-sm" onClick={() => setEditing(dr)}>Modifier</button>
              <button className="btn btn-sm btn-accent">Voir factures</button>
            </div>
          </div>

          {/* ── Section Analyse (période) ── */}
          <div style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>

            {/* Barre période */}
            <div style={{ padding: '10px 24px', background: 'var(--surface)',
              borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.12em',
                  textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>
                  Période
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '.08em',
                  textTransform: 'uppercase', color: lineColor, fontWeight: 600,
                  padding: '1px 6px', border: `1px solid ${lineColor}`, borderRadius: 999 }}>
                  KPI &amp; Planning uniquement
                </span>
              </div>
              {[['jour', "Aujourd'hui"], ['semaine', 'Semaine'], ['mois', 'Mois'], ['annee', 'Année'], ['total', 'Total']].map(([k, l]) => (
                <button key={k} onClick={() => setPeriod(k)} className="btn btn-sm"
                  style={period === k ? { background: lineColor, color: '#fff', borderColor: lineColor } : {}}>
                  {l}
                </button>
              ))}
            </div>

          {/* ── Info véhicule ── */}
          <div style={{ padding: '8px 24px 0', display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.12em',
              textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>Véhicule</span>
            {local?.vehicule && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                color: lineColor, padding: '1px 8px', border: `1.5px solid ${lineColor}`,
                borderRadius: 4 }}>{local.vehicule}</span>
            )}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-2)' }}>
              🪑 {dr.vehicle_seats ?? 55} places
            </span>
          </div>

          {/* ── KPI ── */}
          <div style={{ padding: '16px 24px', display: 'grid', gap: 10,
            gridTemplateColumns: 'repeat(5, 1fr)' }}>
            {kpiLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '12px 16px', boxShadow: 'var(--sh-xs)',
                  opacity: .5, animation: 'pulse 1.5s ease-in-out infinite' }}>
                  <div style={{ height: 9, width: 60, background: 'var(--border)', borderRadius: 3, marginBottom: 10 }}/>
                  <div style={{ height: 26, width: 48, background: 'var(--border)', borderRadius: 3 }}/>
                </div>
              ))
            ) : kpi ? [
              { label: 'Courses',      value: kpi.courses,    sub: 'réalisées',        danger: false, amber: false },
              { label: 'Passagers',    value: kpi.passagers,  sub: `moy. ${(kpi.passagers / Math.max(kpi.courses, 1)).toFixed(1)} / trajet`, danger: false, amber: false },
              { label: 'CA',           value: `${Number(kpi.ca).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`, sub: "chiffre d'affaires", danger: false, amber: false },
              { label: 'Incidents',    value: kpi.incidents,  sub: kpi.incidents === 0 ? 'Aucun' : 'signalés', danger: kpi.incidents > 0, amber: false },
              { label: 'Non prévues', value: kpi.unplanned ?? 0, sub: (kpi.unplanned ?? 0) === 0 ? 'Aucune' : 'hors planning', danger: false, amber: (kpi.unplanned ?? 0) > 0 },
            ].map(({ label, value, sub, danger, amber }) => (
              <div key={label} style={{ background: 'var(--surface)', border: `1px solid ${danger ? 'var(--danger)' : amber ? 'rgba(245,158,11,.45)' : 'var(--border)'}`,
                borderRadius: 8, padding: '12px 16px', boxShadow: 'var(--sh-xs)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.12em',
                  textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 700,
                  color: danger ? 'var(--danger)' : amber ? '#d97706' : 'var(--text)', marginTop: 4, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>{sub}</div>
              </div>
            )) : (
              <div style={{ gridColumn: '1/-1', padding: '16px 0', fontSize: 12,
                color: 'var(--text-3)', textAlign: 'center' }}>
                Données indisponibles
              </div>
            )}
          </div>

          <div style={{ padding: '0 24px 16px' }}>

            {/* ── Programme de ligne ── */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
              padding: 18, boxShadow: 'var(--sh-xs)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.12em',
                    textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>
                    Programme de ligne
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '.08em',
                    textTransform: 'uppercase', color: lineColor, fontWeight: 600,
                    padding: '1px 6px', border: `1px solid ${lineColor}`, borderRadius: 999 }}>
                    {({ jour: "Aujourd'hui", semaine: 'Semaine en cours', mois: 'Mois en cours', annee: 'Année en cours', total: 'Toute la période' } as Record<string,string>)[period] ?? 'Semaine en cours'}
                  </span>
                </div>
                {local && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: lineColor,
                    padding: '2px 8px', border: `1px solid ${lineColor}`, borderRadius: 3 }}>
                    {local._l} · {LINE_DIR[local._l]?.route}
                  </span>
                )}
              </div>
              {local ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '68px 1fr 1fr 80px', gap: 6,
                    paddingBottom: 6, borderBottom: '1px solid var(--border)',
                    fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '.1em',
                    textTransform: 'uppercase', color: 'var(--text-3)' }}>
                    <span>Jour</span><span>Matin AM</span><span>Soir PM</span><span style={{ textAlign: 'right' }}>Note</span>
                  </div>
                  {DAYS.map((day, i) => {
                    const isSun = i === 6;
                    let amVal = local.am || null, pmVal = local.pm || null, note = '';
                    if (isSun) {
                      if (!local.dimJF) { amVal = null; pmVal = null; note = 'Repos'; }
                      else note = `Dim ${local.dimJF}`;
                    }
                    if (local.astr && !isSun) note = 'Astr.';
                    const isRest = !amVal && !pmVal;
                    const dir = LINE_DIR[local._l];
                    return (
                      <div key={day} style={{ display: 'grid', gridTemplateColumns: '68px 1fr 1fr 80px', gap: 6,
                        padding: '7px 0', borderBottom: '1px dashed var(--border)', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                          color: isRest ? 'var(--text-3)' : 'var(--text)' }}>{day}</span>
                        <span style={{ fontSize: 11 }}>
                          {amVal
                            ? <><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{amVal}</span>{' '}
                              <span style={{ fontSize: 10, color: lineColor }}>{dir?.am}</span></>
                            : <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>Repos</span>}
                        </span>
                        <span style={{ fontSize: 11 }}>
                          {pmVal
                            ? <><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{pmVal}</span>{' '}
                              <span style={{ fontSize: 10, color: lineColor }}>{dir?.pm}</span></>
                            : <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>Repos</span>}
                        </span>
                        <span style={{ textAlign: 'right', fontSize: 10, fontFamily: 'var(--font-mono)',
                          color: note === 'Astr.' ? 'var(--warn)' : 'var(--text-3)',
                          fontWeight: note === 'Astr.' ? 700 : 400 }}>{note}</span>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div style={{ padding: '20px 0', fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>
                  Aucun programme configuré pour ce chauffeur
                </div>
              )}
            </div>
          </div>

          </div>{/* fin section Analyse */}

          {/* ── Blocs toute la période ── */}
          <div style={{ padding: '0 24px 16px', display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr' }}>
            {/* Documents & RIB */}
            <DocsSection driverId={dr.id} driverNumber={dr.driver_number} />

            {/* Acomptes */}
            <AdvancesSection driverId={dr.id} />

            {/* Kilométrage mensuel — pleine largeur */}
            <MileageSection driverId={dr.id} />
          </div>

          {/* ── Historique factures ── */}
          <div style={{ padding: '0 24px 24px' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
              overflow: 'hidden', boxShadow: 'var(--sh-xs)' }}>
              <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'var(--surface-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.12em',
                    textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>
                    Historique des factures · 6 dernières semaines
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '.08em',
                    textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600,
                    padding: '1px 6px', border: '1px solid var(--border)', borderRadius: 999 }}>
                    Toute la période
                  </span>
                </div>
                <button className="btn btn-sm">Voir tout</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)' }}>
                    {['Sem.', 'Référence · Période', 'Montant', 'Statut', ''].map(h => (
                      <th key={h} style={{ padding: '7px 18px', fontFamily: 'var(--font-mono)', fontSize: 9,
                        letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-3)',
                        fontWeight: 400, textAlign: h === 'Montant' ? 'right' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { sem: 'S19', ref: 'F2026-150', per: '4–10 mai 2026',   amt: '1 200,00 €', status: 'brouillon' },
                    { sem: 'S18', ref: 'F2026-140', per: '27 avr–3 mai',    amt: '1 150,00 €', status: 'validée' },
                    { sem: 'S17', ref: 'F2026-130', per: '20–26 avr',       amt: '1 176,00 €', status: 'payée' },
                    { sem: 'S16', ref: 'F2026-120', per: '13–19 avr',       amt: '1 120,00 €', status: 'payée' },
                    { sem: 'S15', ref: 'F2026-110', per: '6–12 avr',        amt: '1 174,00 €', status: 'payée' },
                    { sem: 'S14', ref: 'F2026-100', per: '30 mar–5 avr',    amt: '1 126,00 €', status: 'payée' },
                  ].map(row => (
                    <tr key={row.ref} style={{ borderTop: '1px dashed var(--border)' }}>
                      <td style={{ padding: '11px 18px', fontFamily: 'var(--font-mono)', fontSize: 11,
                        fontWeight: 700, color: 'var(--text-3)' }}>{row.sem}</td>
                      <td style={{ padding: '11px 18px' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{row.ref}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{row.per}</div>
                      </td>
                      <td style={{ padding: '11px 18px', fontFamily: 'var(--font-mono)', fontSize: 14,
                        fontWeight: 700, textAlign: 'right', color: 'var(--text)' }}>{row.amt}</td>
                      <td style={{ padding: '11px 18px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                          padding: '2px 9px', borderRadius: 999,
                          background: row.status === 'brouillon' ? 'var(--surface-3)'
                            : row.status === 'validée' ? 'rgba(242,100,25,.08)' : 'var(--surface-2)',
                          color: row.status === 'validée' ? 'var(--brand)' : 'var(--text-3)' }}>
                          {row.status}
                        </span>
                      </td>
                      <td style={{ padding: '11px 18px', textAlign: 'right' }}>
                        {row.status === 'brouillon'
                          ? <button className="btn btn-sm btn-accent">Valider</button>
                          : <button className="btn btn-sm">Voir</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
