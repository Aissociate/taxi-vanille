// Phone.jsx — sketchy wireframe phone frame for Android wireframes
// Looks hand-drawn but readable. Width 360, height 740 by default.

const PhoneFrame = ({ width = 360, height = 740, label, sublabel, children, screenBg = '#ffffff', notch = true }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: width + 24,
        height: height + 24,
        border: '2px solid var(--wf-stroke)',
        borderRadius: '36px 38px 36px 39px / 39px 36px 38px 36px',
        padding: 12,
        background: '#fff',
        boxShadow: '0 18px 40px rgba(25, 20, 20, 0.07)',
        position: 'relative',
      }}>
        {/* speaker line */}
        <div style={{
          position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)',
          width: 60, height: 4, borderRadius: 4, background: 'var(--wf-stroke-3)',
        }} />
        {/* power btn */}
        <div style={{ position: 'absolute', right: -4, top: 110, width: 4, height: 50, background: 'var(--wf-stroke-3)', borderRadius: 2 }} />
        {/* volume */}
        <div style={{ position: 'absolute', left: -4, top: 90, width: 4, height: 36, background: 'var(--wf-stroke-3)', borderRadius: 2 }} />
        <div style={{ position: 'absolute', left: -4, top: 140, width: 4, height: 60, background: 'var(--wf-stroke-3)', borderRadius: 2 }} />

        <div style={{
          width, height,
          borderRadius: '24px 25px 24px 26px / 26px 24px 25px 24px',
          overflow: 'hidden',
          background: screenBg,
          border: '1.25px solid var(--wf-stroke-3)',
          position: 'relative',
        }}>
          {/* status bar */}
          <div style={{
            height: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 14px',
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.04em',
            color: 'var(--wf-stroke-2)',
            background: 'transparent',
            position: 'relative',
          }}>
            <span>9:41</span>
            {notch && (
              <div style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', width: 14, height: 14, borderRadius: '50%', background: 'var(--wf-stroke)' }} />
            )}
            <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span>4G</span>
              <svg width="14" height="9" viewBox="0 0 14 9"><rect x="0.5" y="0.5" width="11" height="8" rx="1" fill="none" stroke="currentColor"/><rect x="2" y="2" width="8" height="5" fill="currentColor"/><rect x="12" y="3" width="1.5" height="3" fill="currentColor"/></svg>
            </span>
          </div>
          <div style={{ height: 'calc(100% - 22px)', overflow: 'hidden', position: 'relative' }}>
            {children}
          </div>
        </div>
      </div>
      {(label || sublabel) && (
        <div style={{ textAlign: 'center', maxWidth: width + 40 }}>
          {label && <div className="wf-variation-tag">{label}</div>}
          {sublabel && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--wf-stroke-2)', marginTop: 2, lineHeight: 1.45 }}>{sublabel}</div>}
        </div>
      )}
    </div>
  );
};

// Bottom incident bar — global to all course screens
const IncidentBar = ({ compact = false, variant = 'banner' }) => {
  if (variant === 'fab') {
    return (
      <div style={{
        position: 'absolute', right: 14, bottom: 18,
        width: 64, height: 64, borderRadius: '50%',
        background: 'var(--wf-danger)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 11,
        letterSpacing: '0.08em',
        boxShadow: '0 8px 18px rgba(209,58,42,0.4)',
        textAlign: 'center', lineHeight: 1.05,
      }}>
        <span>⚠<br/>SOS</span>
      </div>
    );
  }
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      height: compact ? 44 : 56,
      background: 'var(--wf-danger)', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 10,
      fontFamily: 'var(--font-sans)', fontWeight: 700,
      fontSize: compact ? 13 : 15, letterSpacing: '0.04em',
    }}>
      <span style={{ fontSize: 18 }}>⚠</span>
      <span>SIGNALER UN INCIDENT</span>
    </div>
  );
};

Object.assign(window, { PhoneFrame, IncidentBar });
