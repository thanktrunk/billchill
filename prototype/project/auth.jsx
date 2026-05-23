// billchill — Landing + Auth screens

// ════════════════════════════════════════════════════════════════
// LANDING — shown when not signed in
// ════════════════════════════════════════════════════════════════
function LandingScreen({ theme, accent, T, lang, onLogin, onDemo }) {
  // Tagline supports a manual line break for typographic rhythm
  const tagline = T('landing.tagline').split('\n')

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: theme.bg,
        color: theme.ink,
      }}
    >
      {/* Top — brand */}
      <div
        style={{
          padding: '4px 22px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            fontFamily: "'Newsreader', serif",
            fontSize: 28,
            color: theme.ink,
            letterSpacing: '-0.015em',
          }}
        >
          {T('brand')}
        </div>
        <div
          style={{
            fontFamily: 'Be Vietnam Pro',
            fontSize: 11,
            color: theme.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
          }}
        >
          {lang === 'vi' ? 'VN' : 'EN'}
        </div>
      </div>

      {/* Visual hero — abstract ledger illustration */}
      <div style={{ padding: '24px 22px 0' }}>
        <LedgerHero theme={theme} accent={accent} />
      </div>

      {/* Tagline */}
      <div style={{ padding: '28px 26px 0' }}>
        <div
          style={{
            fontFamily: "'Newsreader', serif",
            fontSize: 40,
            lineHeight: 1.02,
            color: theme.ink,
            letterSpacing: '-0.025em',
          }}
        >
          {tagline.map((line, i) => (
            <div
              key={i}
              style={{
                fontStyle: i === 1 ? 'italic' : 'normal',
                color: i === 1 ? accent : theme.ink,
                whiteSpace: 'nowrap',
              }}
            >
              {line}
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 14,
            fontFamily: 'Be Vietnam Pro',
            fontSize: 15,
            color: theme.muted,
            letterSpacing: '-0.005em',
            lineHeight: 1.45,
            maxWidth: 320,
          }}
        >
          {T('landing.subhead')}
        </div>
      </div>

      {/* Features — three small rows */}
      <div style={{ flex: 1 }} />
      <div
        style={{
          padding: '12px 26px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <FeatureRow
          theme={theme}
          accent={accent}
          glyph="L"
          tint={theme.ink}
          title={T('landing.feature_ledger_t')}
          body={T('landing.feature_ledger_b')}
        />
        <FeatureRow
          theme={theme}
          accent={accent}
          glyph="S"
          tint="#3F6E55"
          title={T('landing.feature_smart_t')}
          body={T('landing.feature_smart_b')}
        />
        <FeatureRow
          theme={theme}
          accent={accent}
          glyph="¤"
          tint="#B7873A"
          title={T('landing.feature_multi_t')}
          body={T('landing.feature_multi_b')}
        />
      </div>

      {/* CTAs */}
      <div
        style={{
          padding: '24px 22px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <button
          onClick={onLogin}
          className="bc-tap"
          style={{
            background: theme.ink,
            color: theme.bg,
            border: 'none',
            cursor: 'pointer',
            padding: '16px 22px',
            borderRadius: 999,
            fontFamily: 'Be Vietnam Pro',
            fontWeight: 500,
            fontSize: 16,
            letterSpacing: '-0.005em',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          {T('landing.cta_login')}
          <BCIcon name="arrowR" size={18} color={theme.bg} stroke={2.2} />
        </button>
        <button
          onClick={onDemo}
          className="bc-tap"
          style={{
            background: 'transparent',
            color: theme.ink,
            border: 'none',
            cursor: 'pointer',
            padding: '10px 22px',
            fontFamily: 'Be Vietnam Pro',
            fontWeight: 500,
            fontSize: 13,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
          }}
        >
          {T('landing.cta_demo')}
        </button>
        <div
          style={{
            marginTop: 4,
            fontFamily: 'Be Vietnam Pro',
            fontSize: 11,
            color: theme.muted,
            textAlign: 'center',
            lineHeight: 1.4,
            letterSpacing: '-0.005em',
          }}
        >
          {T('landing.legal')}
        </div>
      </div>
    </div>
  )
}

function FeatureRow({ theme, accent, glyph, tint, title, body }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          flexShrink: 0,
          background: tint,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Newsreader', serif",
          fontSize: 20,
        }}
      >
        {glyph}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontFamily: 'Be Vietnam Pro',
            fontWeight: 500,
            fontSize: 14,
            color: theme.ink,
            letterSpacing: '-0.005em',
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: 'Be Vietnam Pro',
            fontSize: 12,
            color: theme.muted,
            marginTop: 2,
          }}
        >
          {body}
        </div>
      </div>
    </div>
  )
}

// Decorative hero — three stacked "receipts" / cards
function LedgerHero({ theme, accent }) {
  return (
    <div style={{ position: 'relative', height: 168 }}>
      {/* Receipt 3 (back) */}
      <div
        style={{
          position: 'absolute',
          left: 20,
          top: 16,
          width: 220,
          height: 132,
          background: theme.surface,
          border: `1px solid ${theme.softhair}`,
          borderRadius: 16,
          transform: 'rotate(-6deg)',
          padding: 14,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <ReceiptLine theme={theme} w="60%" />
        <ReceiptLine theme={theme} w="42%" />
        <ReceiptLine theme={theme} w="50%" />
        <div style={{ flex: 1 }} />
        <div
          style={{
            fontFamily: "'Newsreader', serif",
            fontSize: 22,
            color: '#3F6E55',
            letterSpacing: '-0.01em',
            alignSelf: 'flex-end',
          }}
        >
          $84.30
        </div>
      </div>
      {/* Receipt 2 (mid) */}
      <div
        style={{
          position: 'absolute',
          right: 12,
          top: 6,
          width: 230,
          height: 138,
          background: theme.surface,
          border: `1px solid ${theme.softhair}`,
          borderRadius: 16,
          transform: 'rotate(4deg)',
          padding: 14,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          boxShadow: '0 6px 18px rgba(0,0,0,0.04)',
        }}
      >
        <ReceiptLine theme={theme} w="70%" />
        <ReceiptLine theme={theme} w="55%" />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 4,
          }}
        >
          <Avatar name="S" seed="hero-s" size={20} />
          <Avatar name="J" seed="hero-j" size={20} />
          <Avatar name="N" seed="hero-n" size={20} />
        </div>
        <div style={{ flex: 1 }} />
        <div
          style={{
            fontFamily: "'Newsreader', serif",
            fontSize: 28,
            color: theme.ink,
            letterSpacing: '-0.015em',
          }}
        >
          €88.50
        </div>
      </div>
      {/* Receipt 1 (front) — accent */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 0,
          width: 200,
          height: 110,
          transform: 'translateX(-50%) rotate(-1.5deg)',
          background: accent,
          color: '#fff',
          borderRadius: 16,
          padding: 14,
          boxSizing: 'border-box',
          boxShadow: `0 14px 30px ${accent}40`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            fontFamily: 'Be Vietnam Pro',
            fontSize: 10,
            color: 'rgba(255,255,255,0.7)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}
        >
          Settle up
        </div>
        <div
          style={{
            fontFamily: "'Newsreader', serif",
            fontSize: 36,
            marginTop: 4,
            letterSpacing: '-0.02em',
          }}
        >
          $1,270.22
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BCIcon name="check" size={12} color="#fff" stroke={2.6} />
          </div>
          <div
            style={{
              fontFamily: 'Be Vietnam Pro',
              fontSize: 12,
              color: 'rgba(255,255,255,0.85)',
              letterSpacing: '-0.005em',
            }}
          >
            4 people · 1 transfer
          </div>
        </div>
      </div>
    </div>
  )
}

function ReceiptLine({ theme, w }) {
  return <div style={{ width: w, height: 6, borderRadius: 6, background: theme.chip }} />
}

// ════════════════════════════════════════════════════════════════
// AUTH MODAL — Auth0-style bottom sheet
// ════════════════════════════════════════════════════════════════
function AuthSheet({ theme, accent, T, onClose, onSuccess }) {
  const [stage, setStage] = React.useState('idle') // idle | signingIn
  const [email, setEmail] = React.useState('')
  const [provider, setProvider] = React.useState(null)

  const start = (prov) => {
    setProvider(prov)
    setStage('signingIn')
    setTimeout(onSuccess, 1500)
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={stage === 'idle' ? onClose : null}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(15,15,15,0.45)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          animation: 'bcFadeIn 220ms cubic-bezier(.2,.7,.2,1) both',
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          background: theme.bg,
          color: theme.ink,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingBottom: 32,
          animation: 'bcSheetUp 320ms cubic-bezier(.2,.8,.2,1)',
        }}
      >
        <style>{`
          @keyframes bcSheetUp { from { transform: translateY(40px); opacity: 0.001; } to { transform: translateY(0); opacity: 1; } }
          @keyframes bcFadeIn { from { opacity: 0.001; } to { opacity: 1; } }
        `}</style>

        {/* Grabber */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '10px 0 6px',
          }}
        >
          <div
            style={{
              width: 38,
              height: 4,
              borderRadius: 999,
              background: theme.hair,
            }}
          />
        </div>

        {stage === 'idle' ? (
          <React.Fragment>
            <div
              style={{
                padding: '4px 24px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "'Newsreader', serif",
                    fontSize: 30,
                    color: theme.ink,
                    letterSpacing: '-0.02em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {T('auth.title')}
                </div>
                <div
                  style={{
                    fontFamily: 'Be Vietnam Pro',
                    fontSize: 11,
                    color: theme.muted,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    marginTop: 6,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {T('auth.subhead')}
                </div>
              </div>
              <button
                onClick={onClose}
                className="bc-tap"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  border: 'none',
                  background: theme.chip,
                  cursor: 'pointer',
                  color: theme.ink,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BCIcon name="close" size={16} color={theme.ink} stroke={2} />
              </button>
            </div>

            {/* Email */}
            <div style={{ padding: '22px 22px 0' }}>
              <div
                style={{
                  background: theme.surface,
                  border: `1px solid ${theme.softhair}`,
                  borderRadius: 16,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <BCIcon name="receipt" size={18} color={theme.muted} stroke={1.6} />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={T('auth.email_placeholder')}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontFamily: 'Be Vietnam Pro',
                    fontSize: 15,
                    color: theme.ink,
                    letterSpacing: '-0.005em',
                  }}
                />
              </div>

              <button
                onClick={() => start('email')}
                className="bc-tap"
                style={{
                  marginTop: 12,
                  width: '100%',
                  background: accent,
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '14px 22px',
                  borderRadius: 999,
                  fontFamily: 'Be Vietnam Pro',
                  fontWeight: 500,
                  fontSize: 15,
                  letterSpacing: '-0.005em',
                }}
              >
                {T('auth.continue_email')}
              </button>
            </div>

            {/* Divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '20px 24px 14px',
              }}
            >
              <div style={{ flex: 1, height: 1, background: theme.softhair }} />
              <div
                style={{
                  fontFamily: 'Be Vietnam Pro',
                  fontSize: 11,
                  color: theme.muted,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {T('auth.divider')}
              </div>
              <div style={{ flex: 1, height: 1, background: theme.softhair }} />
            </div>

            {/* Providers */}
            <div
              style={{
                padding: '0 22px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <SsoButton theme={theme} icon={<GoogleMark />} label={T('auth.continue_google')} onClick={() => start('google')} />
              <SsoButton
                theme={theme}
                icon={<AppleMark color={theme.ink} />}
                label={T('auth.continue_apple')}
                onClick={() => start('apple')}
              />
            </div>

            {/* Auth0 footer */}
            <div
              style={{
                marginTop: 22,
                padding: '12px 24px 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontFamily: 'Be Vietnam Pro',
                fontSize: 11,
                color: theme.muted,
                letterSpacing: '0.06em',
                whiteSpace: 'nowrap',
              }}
            >
              <span>SECURED BY</span>
              <Auth0Mark color={theme.muted} />
            </div>
          </React.Fragment>
        ) : (
          <SigningInState theme={theme} accent={accent} T={T} provider={provider} email={email} />
        )}
      </div>
    </div>
  )
}

function SsoButton({ theme, icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bc-tap"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: theme.surface,
        color: theme.ink,
        border: `1px solid ${theme.softhair}`,
        borderRadius: 16,
        padding: '12px 14px',
        cursor: 'pointer',
        fontFamily: 'Be Vietnam Pro',
        fontWeight: 500,
        fontSize: 15,
        letterSpacing: '-0.005em',
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
    </button>
  )
}

function SigningInState({ theme, accent, T, provider, email }) {
  return (
    <div
      style={{
        padding: '20px 24px 28px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 22,
      }}
    >
      <BcSpinner color={accent} />
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontFamily: "'Newsreader', serif",
            fontSize: 26,
            color: theme.ink,
            letterSpacing: '-0.02em',
          }}
        >
          {T('auth.signing_in')}
        </div>
        <div
          style={{
            marginTop: 6,
            fontFamily: 'Be Vietnam Pro',
            fontSize: 13,
            color: theme.muted,
          }}
        >
          {provider === 'email' && email ? email : provider === 'google' ? 'Google' : provider === 'apple' ? 'Apple ID' : ''}
        </div>
      </div>
    </div>
  )
}

function BcSpinner({ color }) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" style={{ animation: 'bcSpin 900ms linear infinite' }}>
      <style>{`@keyframes bcSpin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="20" cy="20" r="16" stroke={color} strokeOpacity="0.18" strokeWidth="3" fill="none" />
      <path d="M20 4 A 16 16 0 0 1 36 20" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  )
}

// Minimal brand marks (no external assets)
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.92v2.32A9 9 0 009 18z"
        fill="#34A853"
      />
      <path d="M3.98 10.72A5.4 5.4 0 013.68 9c0-.6.1-1.18.3-1.72V4.96H.92A9 9 0 000 9c0 1.45.34 2.83.92 4.04l3.06-2.32z" fill="#FBBC05" />
      <path
        d="M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58A9 9 0 009 0 9 9 0 00.92 4.96L3.98 7.28C4.68 5.16 6.66 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  )
}
function AppleMark({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill={color}>
      <path d="M13.5 9.6c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.8-3.2.8-.7 0-1.7-.8-2.8-.7-1.4 0-2.7.8-3.5 2.1-1.5 2.6-.4 6.4 1.1 8.5.7 1 1.5 2.2 2.7 2.1 1.1 0 1.5-.7 2.8-.7s1.7.7 2.8.7c1.2 0 2-1 2.7-2 .8-1.2 1.1-2.3 1.2-2.4-.1-.1-2.3-.9-2.6-3.6zM11.6 3.4c.6-.7 1-1.7.9-2.7-.8 0-1.9.6-2.5 1.3-.5.6-1 1.6-.9 2.6.9.1 1.9-.5 2.5-1.2z" />
    </svg>
  )
}
function Auth0Mark({ color = '#000' }) {
  // simplified Auth0 wordmark — letter form
  return (
    <span
      style={{
        fontFamily: 'Be Vietnam Pro',
        fontWeight: 700,
        fontSize: 11,
        color,
        letterSpacing: '0.02em',
      }}
    >
      auth0
    </span>
  )
}

Object.assign(window, {
  LandingScreen,
  AuthSheet,
  BcSpinner,
})
