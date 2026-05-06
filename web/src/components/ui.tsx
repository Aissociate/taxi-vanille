'use client';
import React from 'react';

export const Eyebrow = ({children, color}: {children: React.ReactNode; color?: string}) => (
  <div className="eyebrow" style={color ? {color} : {}}>{children}</div>
);

export const Pill = ({children, variant='', dot}: {children: React.ReactNode; variant?: string; dot?: boolean}) => (
  <span className={`pill ${variant}`}>{dot && <span className="dot"/>}{children}</span>
);

export const Btn = ({children, accent, danger, sm, onClick, style, disabled}: {
  children: React.ReactNode; accent?: boolean; danger?: boolean; sm?: boolean;
  onClick?: () => void; style?: React.CSSProperties; disabled?: boolean;
}) => (
  <button
    className={`btn${accent?' btn-accent':''}${danger?' btn-danger':''}${sm?' btn-sm':''}`}
    onClick={onClick} style={style} disabled={disabled}
  >{children}</button>
);

export const PageBar = ({title, sub, actions=[]}: {
  title: string; sub: string;
  actions?: {l: string; accent?: boolean; onClick?: () => void}[];
}) => (
  <div className="page-bar">
    <div className="pb-left">
      <div className="eyebrow">{sub}</div>
      <h1>{title}</h1>
    </div>
    <div className="pb-actions">
      {actions.map((a,i) => <Btn key={i} accent={a.accent} onClick={a.onClick}>{a.l}</Btn>)}
    </div>
  </div>
);

export const Sparkline = () => (
  <svg className="sparkline" viewBox="0 0 200 60" preserveAspectRatio="none">
    <polyline points="0,40 20,32 40,38 60,28 80,30 100,22 120,25 140,15 160,20 180,12 200,8"
      fill="none" stroke="var(--brand)" strokeWidth="2"/>
    <polyline points="0,40 20,32 40,38 60,28 80,30 100,22 120,25 140,15 160,20 180,12 200,8 200,60 0,60"
      fill="var(--accent-soft)" stroke="none"/>
  </svg>
);

export const KpiCard = ({label, value, delta, danger}: {
  label: string; value: string|number; delta?: string; danger?: boolean;
}) => (
  <div className="kpi-block" style={danger ? {borderColor:'var(--danger)',position:'relative'} : {}}>
    {danger && <span style={{position:'absolute',top:8,right:8,width:10,height:10,borderRadius:'50%',background:'var(--danger)',animation:'pulse-ring 1.4s infinite'}}/>}
    <Eyebrow>{label}</Eyebrow>
    <div className="kpi-val">{value}</div>
    {delta && <div className="kpi-sub">{delta}</div>}
  </div>
);

export const StatusPill = ({s}: {s: string}) => {
  const m: Record<string,[string,string]> = {
    draft: ['Reçue',''], validated: ['Validé','live'], paid: ['Payé','done']
  };
  const [l, v] = m[s] || ['?',''];
  return <Pill variant={v} dot>{l}</Pill>;
};

export const MapBg = ({dark}: {dark?: boolean}) => {
  const d = dark;
  return (
    <div style={{position:'absolute',inset:0,background:d?'#1a1d24':'#eef0f3',overflow:'hidden'}}>
      <svg viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice"
        style={{position:'absolute',inset:0,width:'100%',height:'100%'}}>
        <defs>
          <pattern id="lagon" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M0 12 Q6 8 12 12 T24 12" fill="none"
              stroke={d?'rgba(160,200,230,0.10)':'rgba(120,170,200,0.18)'} strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="1000" height="700" fill={d?'#1a1d24':'#dfe7ec'}/>
        <rect width="1000" height="700" fill="url(#lagon)"/>
        <path d="M 80 380 Q 60 240 180 140 Q 320 70 480 90 Q 640 110 760 200 Q 880 300 880 440 Q 880 580 740 620 Q 580 660 420 620 Q 240 580 130 500 Q 70 440 80 380 Z"
          fill="none" stroke={d?'rgba(120,180,210,0.22)':'rgba(100,160,190,0.45)'} strokeWidth="1.5" strokeDasharray="4 6"/>
        <path d="M 290 130 Q 360 110 410 145 Q 460 175 470 230 Q 480 280 460 320 L 480 360 Q 510 400 500 460 Q 490 510 460 540 Q 440 565 400 575 Q 360 580 330 555 Q 295 525 285 480 Q 270 440 285 405 Q 270 380 280 340 Q 250 310 245 270 Q 240 220 260 180 Q 275 145 290 130 Z"
          fill={d?'#2a2e38':'#cdd6c8'} stroke={d?'#3b4250':'#a8b3a3'} strokeWidth="1.5"/>
        <path d="M 600 240 Q 640 230 660 250 Q 670 280 655 305 Q 640 320 615 315 Q 595 305 590 285 Q 585 260 600 240 Z"
          fill={d?'#2a2e38':'#cdd6c8'} stroke={d?'#3b4250':'#a8b3a3'} strokeWidth="1.5"/>
        <path d="M 410 250 L 425 290 L 440 340 L 425 395 L 395 450 L 360 490"
          fill="none" stroke={d?'rgba(255,255,255,0.32)':'rgba(80,80,80,0.55)'} strokeWidth="2.5"/>
        <path d="M 380 415 L 395 380 L 412 340 L 422 295 L 415 250"
          fill="none" stroke={d?'rgba(255,255,255,0.32)':'rgba(80,80,80,0.55)'} strokeWidth="2.5"/>
        <path d="M 425 270 Q 510 250 600 270"
          fill="none" stroke={d?'rgba(160,200,230,0.5)':'rgba(80,140,180,0.6)'} strokeWidth="1.5" strokeDasharray="3 4"/>
        {[{x:408,y:244,t:'MAMOUDZOU'},{x:378,y:415,t:'DOUJANI'},{x:412,y:275,t:'PASSOT'},{x:422,y:350,t:"M'TSAPERE"},
          {x:402,y:395,t:'TSOUNDZOU'},{x:392,y:450,t:'PASSAMAINTY'},{x:350,y:495,t:'VAHIBE'},
          {x:622,y:285,t:'PETITE-TERRE'},{x:302,y:172,t:'KOUNGOU'}].map(({x,y,t})=>(
          <text key={t} x={x} y={y} fontSize="9" fontFamily="ui-monospace,monospace"
            fill={d?'rgba(255,255,255,0.55)':'rgba(60,60,60,0.65)'} letterSpacing="0.5">{t}</text>
        ))}
        <g transform="translate(888,58)" opacity={d?0.5:0.55}>
          <circle r="18" fill="none" stroke={d?'rgba(255,255,255,0.4)':'rgba(60,60,60,0.5)'} strokeWidth="1"/>
          <path d="M 0 -16 L 4 0 L 0 4 L -4 0 Z" fill={d?'rgba(255,255,255,0.6)':'rgba(60,60,60,0.7)'}/>
          <text x="0" y="-22" textAnchor="middle" fontSize="9" fontFamily="ui-monospace,monospace" fill={d?'rgba(255,255,255,0.5)':'rgba(60,60,60,0.6)'}>N</text>
        </g>
      </svg>
    </div>
  );
};

export const TaxiPin = ({left, top, kind, label}: {left:string;top:string;kind:string;label:string}) => {
  const c = kind==='live'?'#2e8b57':kind==='late'?'#e8a523':kind==='offline'?'#817A7C':'var(--brand)';
  return (
    <div style={{position:'absolute',left,top,transform:'translate(-50%,-100%)',textAlign:'center',zIndex:2}}>
      <div style={{width:28,height:28,borderRadius:'50%',background:c,border:'2.5px solid #fff',
        boxShadow:'0 4px 10px rgba(0,0,0,.25)',display:'flex',alignItems:'center',justifyContent:'center',
        color:'#fff',fontFamily:'var(--font-mono)',fontSize:10,fontWeight:700}}>{label}</div>
      <div style={{width:0,height:0,borderLeft:'5px solid transparent',borderRight:'5px solid transparent',
        borderTop:`8px solid ${c}`,margin:'0 auto'}}/>
    </div>
  );
};

export const AlertBanner = ({driver, message, age, onDismiss, onReplace}: {
  driver:string;message:string;age:string;onDismiss:()=>void;onReplace:()=>void;
}) => (
  <div className="alert-banner">
    <div className="alert-stripe">!</div>
    <div style={{display:'flex',alignItems:'center',padding:'0 12px 0 14px'}}>
      <div className="alert-pulse"/>
    </div>
    <div style={{flex:1,padding:'8px 0',display:'flex',flexDirection:'column',justifyContent:'center'}}>
      <div style={{display:'flex',alignItems:'baseline',gap:8}}>
        <span className="alert-badge">Incident</span>
        <span style={{fontSize:13,fontWeight:700}}>{driver}</span>
        <span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--stroke2)'}}>il y a {age}</span>
      </div>
      <div style={{fontSize:12,color:'var(--stroke)',marginTop:2}}>{message}</div>
    </div>
    <div style={{display:'flex',alignItems:'center',gap:6,paddingRight:10}}>
      <Btn sm>▶ Écouter</Btn>
      <Btn sm danger onClick={onReplace}>⇄ Remplacer</Btn>
      <Btn sm onClick={onDismiss}>✕</Btn>
    </div>
  </div>
);
