// billchill components — shared atoms

// ───── Icons ─────────────────────────────────────────────────────
function BCIcon({ name, size = 22, color = 'currentColor', stroke = 1.6 }) {
  const paths = {
    plus:    <path d="M12 5v14M5 12h14" />,
    arrow:   <path d="M19 12H5M12 5l-7 7 7 7" />,
    arrowR:  <path d="M5 12h14M12 5l7 7-7 7" />,
    back:    <path d="M15 6l-6 6 6 6" />,
    close:   <path d="M6 6l12 12M18 6L6 18" />,
    check:   <path d="M5 12l5 5L20 7" />,
    share:   <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v13" />,
    bell:    <path d="M6 16V11a6 6 0 1112 0v5l2 2H4l2-2zM10 20a2 2 0 004 0" />,
    user:    <path d="M20 21a8 8 0 10-16 0M16 7a4 4 0 11-8 0 4 4 0 018 0z" />,
    users:   <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm9 0a3 3 0 100-6 3 3 0 000 6zm4 10v-2a4 4 0 00-3-3.87" />,
    dots:    <g><circle cx="5"  cy="12" r="1.4" fill={color} stroke="none"/><circle cx="12" cy="12" r="1.4" fill={color} stroke="none"/><circle cx="19" cy="12" r="1.4" fill={color} stroke="none"/></g>,
    receipt: <path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h4" />,
    split:   <path d="M4 9l6 6 6-6M4 15l6-6 6 6" />,
    even:    <path d="M4 12h16M4 7h16M4 17h16" />,
    settings:<path d="M12 9a3 3 0 100 6 3 3 0 000-6zM19.4 13a7.6 7.6 0 000-2l2-1.6-2-3.5-2.4 1a7.6 7.6 0 00-1.7-1L15 3h-4l-.3 2.4a7.6 7.6 0 00-1.7 1l-2.4-1-2 3.5L6.6 11a7.6 7.6 0 000 2l-2 1.6 2 3.5 2.4-1a7.6 7.6 0 001.7 1L11 21h4l.3-2.4a7.6 7.6 0 001.7-1l2.4 1 2-3.5L19.4 13z" />,
    archive: <path d="M3 7h18l-1.5 12a2 2 0 01-2 2H6.5a2 2 0 01-2-2L3 7zM3 3h18v4H3zM10 11h4" />,
    flame:   <path d="M12 21c4 0 7-3 7-7 0-5-4-7-4-12-3 2-7 5-7 10 0 1 1 2 2 2-1 1-1 3 0 4 1 1 1 3 2 3z" />,
    minus:   <path d="M5 12h14" />,
    swap:    <path d="M7 4l-3 3 3 3M4 7h11M17 14l3 3-3 3M20 17H9" />,
    activity:<path d="M3 12h4l3-8 4 16 3-8h4" />,
    home:    <path d="M3 11l9-8 9 8v9a2 2 0 01-2 2h-3v-7H8v7H5a2 2 0 01-2-2v-9z" />,
    calendar:<path d="M3 6h18v15a1 1 0 01-1 1H4a1 1 0 01-1-1zM3 6V4a1 1 0 011-1h16a1 1 0 011 1v2M8 1v4M16 1v4" />,
    sparkle: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M7 7l2 2M15 15l2 2M7 17l2-2M15 9l2-2" />,
    tag:     <path d="M3 12l9-9h8v8l-9 9zM15 9a1 1 0 100-2 1 1 0 000 2z" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

// ───── Money ─────────────────────────────────────────────────────
function useAnimatedNumber(target, ms = 480) {
  const [val, setVal] = React.useState(target);
  const fromRef = React.useRef(target);
  const toRef = React.useRef(target);
  const startRef = React.useRef(0);
  const rafRef = React.useRef(0);
  React.useEffect(() => {
    fromRef.current = val;
    toRef.current = target;
    startRef.current = performance.now();
    cancelAnimationFrame(rafRef.current);
    const tick = (t) => {
      const e = Math.min(1, (t - startRef.current) / ms);
      const k = 1 - Math.pow(1 - e, 3);
      setVal(fromRef.current + (toRef.current - fromRef.current) * k);
      if (e < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target]);
  return val;
}

function Money({ value, currency = '$', size = 64, color, weight = 400, animate = true, decimals = 2, family = 'serif' }) {
  const v = animate ? useAnimatedNumber(value) : value;
  const fixed = Math.abs(v).toFixed(decimals);
  const [whole, frac] = fixed.split('.');
  const isSerif = family === 'serif';
  const sign = v < 0 ? '−' : '';
  return (
    <span style={{
      fontFamily: isSerif ? "'Newsreader', serif" : "'Be Vietnam Pro', sans-serif",
      fontWeight: weight, fontSize: size, lineHeight: 1, color, fontVariantNumeric: 'tabular-nums',
      letterSpacing: isSerif ? '-0.005em' : '-0.02em',
      whiteSpace: 'nowrap', display: 'inline-block',
    }}>
      {sign && <span style={{ marginRight: '0.04em' }}>{sign}</span>}
      <span style={{ fontSize: size * 0.55, opacity: 0.7, marginRight: '0.06em' }}>{currency}</span>
      <span>{whole}</span>
      <span style={{ fontSize: size * 0.5, opacity: 0.55, marginLeft: '0.04em' }}>.{frac}</span>
    </span>
  );
}

// ───── Avatar ────────────────────────────────────────────────────
function Avatar({ name = '?', seed, size = 36, ring = false, theme }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const bg = bcAvatarColor(seed || name);
  return (
    <div style={{
      width: size, height: size, borderRadius: size,
      background: bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Be Vietnam Pro', sans-serif", fontWeight: 600, fontSize: size * 0.42,
      boxShadow: ring ? `0 0 0 2px ${theme?.bg || '#fff'}` : 'none',
      flexShrink: 0,
    }}>{initial}</div>
  );
}

function AvatarStack({ members, size = 28, max = 4, theme }) {
  const show = members.slice(0, max);
  const extra = members.length - show.length;
  return (
    <div style={{ display: 'flex' }}>
      {show.map((m, i) => (
        <div key={m.id} style={{ marginLeft: i === 0 ? 0 : -size * 0.32 }}>
          <Avatar name={m.display_name} seed={m.id} size={size} ring theme={theme} />
        </div>
      ))}
      {extra > 0 && (
        <div style={{
          marginLeft: -size * 0.32, width: size, height: size, borderRadius: size,
          background: theme.chip, color: theme.muted, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Be Vietnam Pro', sans-serif", fontWeight: 600, fontSize: size * 0.38,
          boxShadow: `0 0 0 2px ${theme.bg}`,
        }}>+{extra}</div>
      )}
    </div>
  );
}

// ───── Category badge ────────────────────────────────────────────
function CategoryBadge({ category, size = 40 }) {
  const c = BC_CATEGORIES[category] || BC_CATEGORIES.other;
  return (
    <div style={{
      width: size, height: size, borderRadius: 12,
      background: c.tint, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Newsreader', serif", fontWeight: 400, fontSize: size * 0.5,
      letterSpacing: '-0.02em', flexShrink: 0,
    }}>{c.glyph}</div>
  );
}

// ───── Chip ──────────────────────────────────────────────────────
function Chip({ children, active, onClick, theme, accent }) {
  return (
    <button onClick={onClick} className="bc-tap" style={{
      border: 'none', cursor: 'pointer',
      background: active ? theme.ink : theme.chip,
      color: active ? theme.bg : theme.ink,
      padding: '8px 14px', borderRadius: 999, fontSize: 13, fontFamily: 'Be Vietnam Pro',
      fontWeight: 500, letterSpacing: '-0.005em',
    }}>{children}</button>
  );
}

// ───── Button ────────────────────────────────────────────────────
function BCButton({ children, onClick, variant = 'primary', theme, accent, full, disabled, icon }) {
  const styles = {
    primary: { bg: theme.ink, fg: theme.bg },
    accent:  { bg: accent, fg: '#fff' },
    ghost:   { bg: 'transparent', fg: theme.ink, border: `1px solid ${theme.hair}` },
    quiet:   { bg: theme.chip, fg: theme.ink },
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled} className="bc-tap" style={{
      background: styles.bg, color: styles.fg, border: styles.border || 'none',
      padding: '15px 22px', borderRadius: 999, cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'Be Vietnam Pro', fontWeight: 500, fontSize: 16, letterSpacing: '-0.005em',
      width: full ? '100%' : 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      opacity: disabled ? 0.4 : 1,
    }}>
      {icon}
      {children}
    </button>
  );
}

// ───── Card ──────────────────────────────────────────────────────
function Card({ children, theme, style = {}, onClick, padded = true }) {
  return (
    <div onClick={onClick} className={onClick ? 'bc-tap' : ''} style={{
      background: theme.surface, borderRadius: 22,
      border: `1px solid ${theme.softhair}`,
      padding: padded ? 18 : 0, ...style,
      cursor: onClick ? 'pointer' : 'default',
    }}>{children}</div>
  );
}

// ───── Section label ─────────────────────────────────────────────
function SectionLabel({ children, theme, style }) {
  return (
    <div style={{
      fontFamily: 'Be Vietnam Pro', fontSize: 11, color: theme.muted, textTransform: 'uppercase',
      letterSpacing: '0.14em', fontWeight: 500, ...style,
    }}>{children}</div>
  );
}

// ───── Top bar ───────────────────────────────────────────────────
function BCTopBar({ left, right, title, subtitle, theme }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 16px 4px', minHeight: 48,
    }}>
      <div style={{ minWidth: 40, display: 'flex', alignItems: 'center' }}>{left}</div>
      <div style={{ textAlign: 'center', flex: 1 }}>
        {title && <div style={{
          fontFamily: 'Be Vietnam Pro', fontWeight: 500, fontSize: 15, color: theme.ink, letterSpacing: '-0.005em',
        }}>{title}</div>}
        {subtitle && <div style={{
          fontFamily: 'Be Vietnam Pro', fontSize: 11, color: theme.muted, marginTop: 2, letterSpacing: '0.04em',
        }}>{subtitle}</div>}
      </div>
      <div style={{ minWidth: 40, display: 'flex', justifyContent: 'flex-end', gap: 4 }}>{right}</div>
    </div>
  );
}

function IconBtn({ name, onClick, theme, variant = 'ghost', size = 22, badge }) {
  const bg = variant === 'ghost' ? 'transparent' : theme.chip;
  return (
    <button onClick={onClick} className="bc-tap" style={{
      width: 40, height: 40, borderRadius: 999, border: 'none', background: bg, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.ink, position: 'relative',
    }}>
      <BCIcon name={name} size={size} color={theme.ink} />
      {badge != null && (
        <span style={{
          position: 'absolute', top: 6, right: 6, minWidth: 14, height: 14, padding: '0 4px',
          background: theme.accent, color: '#fff', borderRadius: 999,
          fontFamily: 'Be Vietnam Pro', fontSize: 9, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 0 2px ${theme.bg}`,
        }}>{badge}</span>
      )}
    </button>
  );
}

// ───── Number pad ────────────────────────────────────────────────
function NumPad({ onKey, theme }) {
  const keys = ['1','2','3','4','5','6','7','8','9','.','0','del'];
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, padding: '0 12px 10px',
    }}>
      {keys.map((k) => (
        <button key={k} onClick={() => onKey(k)} className="bc-tap bc-key" style={{
          height: 52, border: 'none', background: 'transparent',
          fontFamily: "'Newsreader', serif", fontSize: 30, fontWeight: 400, color: theme.ink,
          borderRadius: 16, cursor: 'pointer', fontVariantNumeric: 'tabular-nums',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {k === 'del'
            ? <BCIcon name="back" size={20} color={theme.ink} stroke={1.6} />
            : k}
        </button>
      ))}
    </div>
  );
}

// ───── Big amount display ────────────────────────────────────────
function AmountDisplay({ value, currency, theme, size = 88 }) {
  const display = value || '0';
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
      <span style={{
        fontFamily: "'Newsreader', serif", fontSize: size * 0.58, color: theme.muted, marginRight: 6,
        fontVariantNumeric: 'tabular-nums',
      }}>{currency}</span>
      <span style={{
        fontFamily: "'Newsreader', serif", fontSize: size, color: theme.ink, lineHeight: 0.95,
        fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em',
      }}>
        {display.includes('.') ? display.split('.')[0] : display}
        {display.includes('.') && (
          <span style={{ fontSize: size * 0.58, color: theme.muted }}>.{display.split('.')[1]}</span>
        )}
      </span>
    </div>
  );
}

// ───── Tabs ──────────────────────────────────────────────────────
function BCTabs({ tabs, active, onChange, theme }) {
  return (
    <div style={{
      display: 'flex', gap: 4, padding: 4, background: theme.chip, borderRadius: 18, margin: '0 16px',
    }}>
      {tabs.map((t) => (
        <button key={t.k} onClick={() => onChange(t.k)} className="bc-tap" style={{
          flex: 1, border: 'none', cursor: 'pointer',
          background: active === t.k ? theme.bg : 'transparent',
          color: theme.ink, padding: '10px 12px', borderRadius: 14,
          fontFamily: 'Be Vietnam Pro', fontWeight: 500, fontSize: 13,
          letterSpacing: '-0.005em',
          boxShadow: active === t.k ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
          transition: 'background 160ms',
        }}>{t.label}</button>
      ))}
    </div>
  );
}

// ───── Bottom tab bar (Home/Activity/Profile) ────────────────────
function BCBottomBar({ active, onChange, theme, unread }) {
  const tabs = [
    { k: 'home', label: 'Groups', icon: 'home' },
    { k: 'activity', label: 'Activity', icon: 'activity', badge: unread },
    { k: 'profile', label: 'Profile', icon: 'user' },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 24, padding: '0 24px',
      display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 20,
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, padding: 6,
        background: theme.ink, color: theme.bg, borderRadius: 999, pointerEvents: 'auto',
        boxShadow: '0 14px 30px rgba(0,0,0,0.18), 0 4px 10px rgba(0,0,0,0.08)',
      }}>
        {tabs.map((t) => {
          const sel = active === t.k;
          return (
            <button key={t.k} onClick={() => onChange(t.k)} className="bc-tap" style={{
              border: 'none', cursor: 'pointer',
              background: sel ? theme.bg : 'transparent',
              color: sel ? theme.ink : 'rgba(245,241,234,0.8)',
              padding: sel ? '10px 18px' : '10px 14px', borderRadius: 999,
              fontFamily: 'Be Vietnam Pro', fontSize: 13, fontWeight: 500, letterSpacing: '-0.005em',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              transition: 'background 200ms, padding 200ms, color 200ms',
              position: 'relative', whiteSpace: 'nowrap',
            }}>
              <BCIcon name={t.icon} size={18} color={sel ? theme.ink : 'rgba(245,241,234,0.8)'} stroke={1.7} />
              {sel && <span>{t.label}</span>}
              {t.badge > 0 && !sel && (
                <span style={{
                  position: 'absolute', top: 6, right: 8, width: 7, height: 7,
                  borderRadius: 999, background: theme.accent,
                  boxShadow: `0 0 0 2px ${theme.ink}`,
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ───── FAB ───────────────────────────────────────────────────────
function FAB({ onClick, theme, accent, icon = 'plus', label }) {
  return (
    <button onClick={onClick} className="bc-tap" style={{
      background: accent, color: '#fff', border: 'none', cursor: 'pointer',
      padding: label ? '14px 22px 14px 18px' : 14, borderRadius: 999,
      display: 'inline-flex', alignItems: 'center', gap: 8,
      fontFamily: 'Be Vietnam Pro', fontWeight: 500, fontSize: 15, letterSpacing: '-0.005em',
      boxShadow: `0 14px 30px ${accent}55, 0 4px 10px rgba(0,0,0,0.12)`,
    }}>
      <BCIcon name={icon} size={20} color="#fff" stroke={2.2} />
      {label}
    </button>
  );
}

// ───── Time formatting ──────────────────────────────────────────
function bcRelativeTime(iso) {
  const now = new Date('2026-05-22T12:00:00Z');
  const t = new Date(iso);
  const diff = (now - t) / 1000; // seconds
  if (diff < 60) return 'now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h';
  if (diff < 86400 * 7) return Math.floor(diff / 86400) + 'd';
  return t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function bcShortDate(iso) {
  const t = new Date(iso);
  return t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

Object.assign(window, {
  BCIcon, Money, Avatar, AvatarStack, CategoryBadge, Chip, BCButton, Card,
  SectionLabel, BCTopBar, IconBtn, NumPad, AmountDisplay, BCTabs, BCBottomBar, FAB,
  useAnimatedNumber, bcRelativeTime, bcShortDate,
});
