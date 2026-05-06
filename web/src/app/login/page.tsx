'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      router.push('/planning');
    } catch {
      setError('Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',
      background:'var(--ink-900)',fontFamily:'var(--font-sans)'}}>
      <div style={{width:380}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{width:52,height:52,background:'var(--brand)',borderRadius:10,display:'inline-flex',
            alignItems:'center',justifyContent:'center',fontFamily:'var(--font-mono)',
            fontSize:18,fontWeight:700,color:'#fff',marginBottom:16}}>TV</div>
          <div style={{fontFamily:'var(--font-mono)',fontWeight:700,fontSize:20,color:'#fff',letterSpacing:'.04em'}}>
            Taxi Vanille
          </div>
          <div style={{fontFamily:'var(--font-mono)',fontSize:10,letterSpacing:'.18em',textTransform:'uppercase',
            color:'rgba(255,255,255,.45)',marginTop:6}}>Direction · Coordinateurs · Mayotte</div>
        </div>

        <div style={{background:'var(--paper)',border:'1.5px solid var(--stroke)',borderRadius:8,
          boxShadow:'0 30px 80px rgba(0,0,0,.5)',overflow:'hidden'}}>
          <div style={{padding:'16px 24px',borderBottom:'1.5px solid var(--stroke)'}}>
            <div style={{fontFamily:'var(--font-mono)',fontSize:10,letterSpacing:'.16em',
              textTransform:'uppercase',color:'var(--stroke2)'}}>Accès sécurisé</div>
            <div style={{fontWeight:700,fontSize:18,marginTop:2}}>Connexion</div>
          </div>

          <form onSubmit={handleSubmit} style={{padding:24,display:'flex',flexDirection:'column',gap:16}}>
            {error && (
              <div style={{padding:'10px 12px',background:'rgba(209,58,42,0.08)',border:'1px solid var(--danger)',
                borderRadius:6,fontSize:12,color:'var(--danger)'}}>
                {error}
              </div>
            )}
            <div>
              <div style={{fontFamily:'var(--font-mono)',fontSize:9,letterSpacing:'.16em',textTransform:'uppercase',
                color:'var(--stroke2)',marginBottom:6}}>Adresse email</div>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                style={{width:'100%',border:'1.25px solid var(--stroke3)',borderRadius:6,padding:'9px 12px',
                  fontSize:13,fontFamily:'var(--font-sans)',outline:'none',background:'#fff'}}
                placeholder="coordinateur@taxivanille.yt"/>
            </div>
            <div>
              <div style={{fontFamily:'var(--font-mono)',fontSize:9,letterSpacing:'.16em',textTransform:'uppercase',
                color:'var(--stroke2)',marginBottom:6}}>Mot de passe</div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                style={{width:'100%',border:'1.25px solid var(--stroke3)',borderRadius:6,padding:'9px 12px',
                  fontSize:13,fontFamily:'var(--font-sans)',outline:'none',background:'#fff'}}/>
            </div>
            <button type="submit" disabled={loading}
              style={{marginTop:4,height:42,background:loading?'var(--stroke3)':'var(--brand)',
                border:'none',borderRadius:8,color:'#fff',fontFamily:'var(--font-sans)',
                fontSize:13,fontWeight:700,cursor:loading?'not-allowed':'pointer',
                transition:'background .12s'}}>
              {loading ? 'Connexion en cours…' : 'Se connecter →'}
            </button>
          </form>
        </div>

        <div style={{textAlign:'center',marginTop:20,fontFamily:'var(--font-mono)',fontSize:10,
          letterSpacing:'.12em',color:'rgba(255,255,255,.2)'}}>
          TAXI VANILLE · MAYOTTE · BACK-OFFICE v1.0
        </div>
      </div>
    </div>
  );
}
