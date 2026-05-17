'use client';
import { useState, useEffect } from 'react';
import { kindColor } from '@/lib/data';
import { PageBar, Eyebrow, Pill, Btn } from '@/components/ui';
import { api } from '@/lib/api';

interface AuditEntry {
  id: string;
  trip_id:     string | null;
  entity_type: string | null;
  entity_id:   string | null;
  action:      string;
  before_val:  string | null;
  after_val:   string | null;
  created_at:  string;
  performed_by_name: string | null;
}

interface AuditGroup {
  day: string;
  items: {
    t: string;
    who: string;
    action: string;
    target: string;
    reason?: string;
    kind: string;
    notify?: string;
  }[];
}

const ACTION_META: Record<string, { label: string; kind: string }> = {
  // Planning
  driver_replaced:    { label: 'Remplacement chauffeur', kind: 'replace'  },
  created:            { label: 'Course ajoutée',          kind: 'add'      },
  updated:            { label: 'Modification course',     kind: 'edit'     },
  cancelled:          { label: 'Annulation course',       kind: 'remove'   },
  // Incidents
  incident_reported:  { label: 'Incident signalé',       kind: 'incident' },
  incident_resolved:  { label: 'Incident résolu',        kind: 'resolve'  },
  // Auth
  web_login:          { label: 'Connexion web',           kind: 'system'   },
  driver_login:       { label: 'Connexion chauffeur',     kind: 'system'   },
  logout:             { label: 'Déconnexion',             kind: 'system'   },
  // Drivers
  driver_created:     { label: 'Chauffeur créé',          kind: 'add'      },
  driver_updated:     { label: 'Chauffeur modifié',       kind: 'edit'     },
  driver_activated:   { label: 'Chauffeur activé',        kind: 'resolve'  },
  driver_deactivated: { label: 'Chauffeur désactivé',     kind: 'remove'   },
  // Clients
  client_created:     { label: 'Client créé',             kind: 'add'      },
  client_updated:     { label: 'Client modifié',          kind: 'edit'     },
  // Invoices
  invoice_validated:  { label: 'Facture validée',         kind: 'resolve'  },
  invoice_paid:       { label: 'Paiement enregistré',     kind: 'add'      },
  // Settings
  settings_updated:   { label: 'Paramètres modifiés',     kind: 'edit'     },
};

function groupByDay(entries: AuditEntry[]): AuditGroup[] {
  const map = new Map<string, AuditGroup>();
  for (const e of entries) {
    const d = new Date(e.created_at);
    const dayKey = d.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
    const meta = ACTION_META[e.action] ?? { label: e.action, kind: 'system' };
    let after: any = {};
    try { after = e.after_val ? JSON.parse(e.after_val) : {}; } catch {}

    // Build a human-readable target string depending on entity_type / action
    let target: string;
    const entityType = e.entity_type ?? '';
    if (entityType === 'setting') {
      target = `Section : ${e.entity_id ?? after.section ?? '—'}`;
    } else if (entityType === 'driver') {
      target = after.driver_number ?? after.full_name ?? (e.entity_id?.slice(0, 8) ?? '—');
    } else if (entityType === 'client') {
      target = after.name ?? (e.entity_id?.slice(0, 8) ?? '—');
    } else if (entityType === 'invoice') {
      target = after.invoice_number ?? (e.entity_id?.slice(0, 8) ?? '—');
    } else if (entityType === 'auth') {
      const who = after.email ?? after.driver_number ?? '';
      const role = after.role ?? after.type ?? '';
      target = [who, role].filter(Boolean).join(' · ') || (e.entity_id?.slice(0, 8) ?? '—');
    } else if (e.action === 'incident_reported') {
      const types = Array.isArray(after.types) ? after.types.join(', ') : (after.types ?? '');
      const driverNum = after.driver_number ?? '';
      target = `${driverNum}${driverNum && types ? ' · ' : ''}${types}`;
      if (!target) target = e.trip_id ? `Trip ${e.trip_id.slice(0, 8)}` : '—';
    } else if (e.action === 'incident_resolved') {
      target = after.incident_id ? `Incident ${String(after.incident_id).slice(0, 8)}` : (e.trip_id ? `Trip ${e.trip_id.slice(0, 8)}` : '—');
    } else {
      target = e.trip_id ? `Trip ${e.trip_id.slice(0, 8)}` : (after.driver_id ?? '—');
    }

    if (!map.has(dayKey)) map.set(dayKey, { day: dayKey, items: [] });
    map.get(dayKey)!.items.push({
      t: d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }),
      who: e.performed_by_name ?? (e.action === 'incident_reported' ? 'Chauffeur (app)' : 'Système'),
      action: meta.label,
      target: String(target),
      reason: after.reason ?? after.notes,
      kind: meta.kind,
    });
  }
  return Array.from(map.values());
}

export default function AuditPage() {
  const [filter, setFilter] = useState('Tous');
  const [range, setRange] = useState('30 j');
  const [groups, setGroups] = useState<AuditGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const limits: Record<string, number> = { '7 j': 100, '30 j': 500, 'Personnalisé': 1000 };

  useEffect(() => {
    setLoading(true);
    api.get(`/planning/audit?limit=${limits[range] ?? 500}`)
      .then(res => {
        const data: AuditEntry[] = res.data;
        setTotal(data.length);
        setGroups(groupByDay(data));
      })
      .catch(() => {/* keep empty */})
      .finally(() => setLoading(false));
  }, [range]);

  const kindFilters: Record<string, string> = {
    'Incidents': 'incident', 'Remplacements': 'replace', 'Ajouts': 'add',
    'Annulations': 'remove', 'Connexions': 'system', 'Modifications': 'edit',
  };

  const filtered = groups.map(g => ({
    ...g,
    items: filter === 'Tous' ? g.items : g.items.filter(it => it.kind === kindFilters[filter]),
  })).filter(g => g.items.length > 0);

  const filters = ['Tous', 'Incidents', 'Remplacements', 'Ajouts', 'Annulations', 'Modifications', 'Connexions'];

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <PageBar title="Audit log · toutes actions" sub={`Direction · ${total} événement${total !== 1 ? 's' : ''} · ${range}`}
        actions={[{l:'Exporter CSV'},{l:'Restaurer version'}]}/>

      <div style={{padding:'10px 24px',borderBottom:'1px dashed var(--stroke3)',display:'flex',gap:8,
        alignItems:'center',background:'var(--paper)',flexShrink:0}}>
        <Eyebrow>Filtrer</Eyebrow>
        {filters.map(f => (
          <span key={f} onClick={() => setFilter(f)} style={{cursor:'pointer'}}>
            <Pill variant={filter===f?'active-dark':f==='Annulations'?'incident':''}>{f}</Pill>
          </span>
        ))}
        <div style={{flex:1}}/>
        {['7 j','30 j','Personnalisé'].map(t => (
          <span key={t} onClick={() => setRange(t)} style={{cursor:'pointer'}}>
            <Pill variant={t===range?'active-dark':''}>{t}</Pill>
          </span>
        ))}
      </div>

      <div style={{flex:1,display:'flex',overflow:'hidden'}}>
        <div className="scroll" style={{flex:1,padding:24}}>
          {loading && <div style={{fontSize:13,color:'var(--stroke2)'}}>Chargement…</div>}
          {!loading && filtered.length === 0 && (
            <div style={{fontSize:13,color:'var(--stroke2)'}}>Aucune entrée dans l'audit log pour cette période.</div>
          )}
          {filtered.map((g, gi) => (
            <div key={gi} style={{marginBottom:28}}>
              <Eyebrow>{g.day}</Eyebrow>
              <div style={{marginTop:12,position:'relative',paddingLeft:20}}>
                <div style={{position:'absolute',left:5,top:8,bottom:8,width:1,background:'var(--stroke3)'}}/>
                {g.items.map((it, i) => (
                  <div key={i} style={{position:'relative',paddingBottom:14}}>
                    <div className="tl-dot" style={{background:kindColor[it.kind]||'var(--stroke)'}}/>
                    <div className="card" style={{background:'#fff',padding:12}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:12,flexWrap:'wrap'}}>
                        <div style={{display:'flex',alignItems:'baseline',gap:8}}>
                          <span style={{fontFamily:'var(--font-mono)',fontWeight:700,fontSize:12}}>{it.t}</span>
                          <span style={{fontSize:13,fontWeight:700}}>{it.action}</span>
                          <span style={{fontSize:12,color:'var(--stroke2)'}}>· {it.target}</span>
                        </div>
                        <span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--stroke2)'}}>{it.who}</span>
                      </div>
                      {(it.reason || it.notify) && (
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:6,flexWrap:'wrap',gap:6}}>
                          {it.reason && <div style={{fontSize:11,color:'var(--stroke2)'}}>
                            <span style={{fontFamily:'var(--font-mono)',textTransform:'uppercase',letterSpacing:'.1em',fontSize:9,marginRight:6}}>Raison</span>
                            {it.reason}
                          </div>}
                          {it.notify && <Pill variant="live" dot>{it.notify}</Pill>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{width:300,borderLeft:'1.5px solid var(--stroke)',overflow:'auto',
          background:'#fff',padding:18,flexShrink:0}}>
          <Eyebrow>Dernier événement</Eyebrow>
          {filtered[0]?.items[0] ? (
            <>
              <div style={{fontSize:14,fontWeight:700,marginTop:6}}>{filtered[0].items[0].action}</div>
              <div style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--stroke2)',marginTop:2}}>
                par {filtered[0].items[0].who} · {filtered[0].items[0].t}
              </div>
              <div style={{fontSize:12,color:'var(--stroke2)',marginTop:8}}>
                {filtered[0].items[0].target}
              </div>
              {filtered[0].items[0].reason && (
                <div style={{marginTop:12,fontSize:11,color:'var(--stroke2)'}}>
                  <span style={{fontFamily:'var(--font-mono)',textTransform:'uppercase',letterSpacing:'.1em',fontSize:9}}>Raison · </span>
                  {filtered[0].items[0].reason}
                </div>
              )}
            </>
          ) : (
            <div style={{fontSize:12,color:'var(--stroke3)',marginTop:8}}>Aucun événement</div>
          )}
          <Btn style={{width:'100%',marginTop:18,height:38}}>↶ Annuler ce changement</Btn>
          <div style={{fontSize:10,color:'var(--stroke2)',textAlign:'center',marginTop:6}}>↳ jusqu'à 24 h après l'action</div>
        </div>
      </div>
    </div>
  );
}
