'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { PageBar } from '@/components/ui';
import toast from 'react-hot-toast';

interface WebUser {
  id: string;
  email: string;
  full_name: string;
  role: 'direction' | 'coordinator';
  active: boolean;
  created_at: string;
}

const ROLE_LABEL: Record<string, string> = {
  direction:   'Direction',
  coordinator: 'Coordinateur',
};

const ROLE_COLOR: Record<string, string> = {
  direction:   'var(--brand)',
  coordinator: 'var(--info)',
};

function RolePill({ role }: { role: string }) {
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
      letterSpacing: '.1em', textTransform: 'uppercase',
      padding: '2px 8px', borderRadius: 999,
      border: `1.25px solid ${ROLE_COLOR[role] ?? 'var(--stroke3)'}`,
      color: ROLE_COLOR[role] ?? 'var(--stroke2)',
    }}>
      {ROLE_LABEL[role] ?? role}
    </span>
  );
}

function inputStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    width: '100%', padding: '9px 12px',
    border: '1.5px solid var(--stroke3)', borderRadius: 8,
    fontSize: 13, fontFamily: 'inherit', background: 'var(--paper)',
    color: 'var(--stroke)', boxSizing: 'border-box', outline: 'none',
    ...extra,
  };
}

function labelStyle(): React.CSSProperties {
  return {
    fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '.1em',
    textTransform: 'uppercase', color: 'var(--stroke2)', fontWeight: 700,
    display: 'block', marginBottom: 5,
  };
}

// ── Modal create / edit ────────────────────────────────────────────────────

function UserModal({
  user,
  onClose,
  onSaved,
}: {
  user: WebUser | null; // null = création
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!user;
  const [email,    setEmail]    = useState(user?.email    ?? '');
  const [name,     setName]     = useState(user?.full_name ?? '');
  const [role,     setRole]     = useState(user?.role     ?? 'coordinator');
  const [active,   setActive]   = useState(user?.active   ?? true);
  const [password, setPassword] = useState('');
  const [saving,   setSaving]   = useState(false);

  const save = async () => {
    if (!email.trim() || !name.trim()) { toast.error('Email et nom requis'); return; }
    if (!isEdit && !password) { toast.error('Mot de passe requis'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/auth/users/${user.id}`, { email, full_name: name, role, active });
        if (password) await api.put(`/auth/users/${user.id}/password`, { password });
        toast.success('Utilisateur mis à jour');
      } else {
        await api.post('/auth/users', { email, full_name: name, role, password });
        toast.success('Utilisateur créé');
      }
      onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erreur lors de la sauvegarde');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 440, boxShadow: '0 8px 32px rgba(0,0,0,.18)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--stroke2)', marginBottom: 4 }}>
          {isEdit ? 'Modifier' : 'Créer'} un utilisateur
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--stroke)', marginBottom: 20 }}>
          {isEdit ? user.full_name : 'Nouvel utilisateur'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle()}>Nom complet</label>
            <input style={inputStyle()} value={name} onChange={e => setName(e.target.value)} placeholder="Prénom Nom" />
          </div>
          <div>
            <label style={labelStyle()}>Email</label>
            <input style={inputStyle()} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemple.com" />
          </div>
          <div>
            <label style={labelStyle()}>Rôle</label>
            <select style={inputStyle()} value={role} onChange={e => setRole(e.target.value as 'direction' | 'coordinator')}>
              <option value="coordinator">Coordinateur</option>
              <option value="direction">Direction</option>
            </select>
          </div>
          {isEdit && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" id="active-cb" checked={active} onChange={e => setActive(e.target.checked)} />
              <label htmlFor="active-cb" style={{ fontSize: 13, cursor: 'pointer', color: 'var(--stroke)' }}>Compte actif</label>
            </div>
          )}
          <div>
            <label style={labelStyle()}>{isEdit ? 'Nouveau mot de passe (laisser vide = inchangé)' : 'Mot de passe'}</label>
            <input style={inputStyle()} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={isEdit ? 'Laisser vide pour ne pas changer' : 'Minimum 8 caractères'} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1.5px solid var(--stroke3)', background: '#fff', cursor: 'pointer', fontSize: 13, color: 'var(--stroke2)' }}>
            Annuler
          </button>
          <button onClick={save} disabled={saving}
            style={{ flex: 2, padding: '10px 0', borderRadius: 8, border: 'none', background: 'var(--brand)', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, opacity: saving ? .6 : 1 }}>
            {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer le compte'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Confirm delete modal ───────────────────────────────────────────────────

function ConfirmDelete({ user, onClose, onDeleted }: { user: WebUser; onClose: () => void; onDeleted: () => void }) {
  const [loading, setLoading] = useState(false);

  const doDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/auth/users/${user.id}`);
      toast.success(`${user.full_name} supprimé`);
      onDeleted();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erreur lors de la suppression');
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 380, boxShadow: '0 8px 32px rgba(0,0,0,.18)' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--stroke)', marginBottom: 8 }}>Supprimer {user.full_name} ?</div>
        <div style={{ fontSize: 13, color: 'var(--stroke2)', marginBottom: 20, lineHeight: 1.6 }}>
          Cette action est irréversible. L'utilisateur ne pourra plus se connecter au dashboard.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1.5px solid var(--stroke3)', background: '#fff', cursor: 'pointer', fontSize: 13 }}>
            Annuler
          </button>
          <button onClick={doDelete} disabled={loading}
            style={{ flex: 2, padding: '10px 0', borderRadius: 8, border: 'none', background: 'var(--danger)', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, opacity: loading ? .6 : 1 }}>
            {loading ? 'Suppression…' : 'Supprimer définitivement'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [users, setUsers]       = useState<WebUser[]>([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState<'create' | WebUser | null>(null);
  const [toDelete, setToDelete] = useState<WebUser | null>(null);

  const load = () => {
    setLoading(true);
    api.get('/auth/users')
      .then(res => setUsers(res.data))
      .catch(() => toast.error('Impossible de charger les utilisateurs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <PageBar
        title="Utilisateurs du dashboard"
        sub={`Direction · ${users.length} compte${users.length !== 1 ? 's' : ''}`}
        actions={[{ l: '+ Nouveau compte', accent: true, onClick: () => setModal('create') }]}
      />

      <div className="scroll" style={{ flex: 1, padding: 24 }}>
        {loading ? (
          <div style={{ fontSize: 13, color: 'var(--stroke2)' }}>Chargement…</div>
        ) : users.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--stroke3)' }}>Aucun utilisateur</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--stroke3)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
            {/* Header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 200px 130px 100px 120px',
              padding: '9px 16px', background: 'var(--paper)', borderBottom: '1px solid var(--stroke3)',
              fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.12em',
              textTransform: 'uppercase', color: 'var(--stroke2)', fontWeight: 700,
            }}>
              <span>Nom / Email</span>
              <span>Créé le</span>
              <span>Rôle</span>
              <span>Statut</span>
              <span />
            </div>
            {users.map((u, i) => (
              <div key={u.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 200px 130px 100px 120px',
                padding: '13px 16px', alignItems: 'center',
                borderBottom: i < users.length - 1 ? '1px solid var(--stroke3)' : 'none',
                opacity: u.active ? 1 : .5,
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--stroke)' }}>{u.full_name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--stroke2)', marginTop: 2 }}>{u.email}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--stroke2)' }}>{fmtDate(u.created_at)}</div>
                <div><RolePill role={u.role} /></div>
                <div>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                    padding: '2px 8px', borderRadius: 999,
                    background: u.active ? 'rgba(22,163,74,.08)' : 'rgba(156,163,175,.12)',
                    color: u.active ? 'var(--success)' : 'var(--stroke3)',
                  }}>
                    {u.active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setModal(u)}
                    style={{ padding: '5px 12px', borderRadius: 6, border: '1.5px solid var(--stroke3)', background: '#fff', cursor: 'pointer', fontSize: 12, color: 'var(--stroke)' }}>
                    Modifier
                  </button>
                  <button
                    onClick={() => setToDelete(u)}
                    style={{ padding: '5px 12px', borderRadius: 6, border: '1.5px solid rgba(220,38,38,.3)', background: '#fff', cursor: 'pointer', fontSize: 12, color: 'var(--danger)' }}>
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal !== null && (
        <UserModal
          user={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}

      {toDelete && (
        <ConfirmDelete
          user={toDelete}
          onClose={() => setToDelete(null)}
          onDeleted={() => { setToDelete(null); load(); }}
        />
      )}
    </div>
  );
}
