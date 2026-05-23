// billchill — main App

function App() {
  const [tw, setTweak] = useTweaks(window.__BC_DEFAULTS)
  const theme = bcTheme(tw.dark, tw.accent)
  const accent = tw.accent
  const lang = tw.lang || 'en'
  const T = React.useMemo(() => bcMakeT(lang), [lang])

  const [state, setState] = React.useState({
    users: BC_USERS,
    groups: BC_GROUPS,
    members: BC_MEMBERS,
    expenses: BC_EXPENSES,
    splits: BC_SPLITS,
    settlements: BC_SETTLEMENTS,
    notifications: BC_NOTIFICATIONS,
  })

  const [tab, setTab] = React.useState('home')
  const [route, setRoute] = React.useState({ name: 'tab' })

  const [draft, setDraft] = React.useState({
    description: '',
    amountStr: '',
    paid_by: null,
    category: 'food',
    date: '2026-05-22',
    splitMode: 'even',
    splitWith: null,
  })

  const openGroup = (gid) => setRoute({ name: 'group', groupId: gid })
  const backToTab = () => setRoute({ name: 'tab' })

  const startAddExpense = (gid) => {
    const myMid = bcMyMemberId(state, gid)
    setDraft({
      description: '',
      amountStr: '',
      paid_by: myMid,
      category: 'food',
      date: '2026-05-22',
      splitMode: 'even',
      splitWith: null,
    })
    setRoute({ name: 'add', groupId: gid })
  }

  const startSettle = (gid) => {
    setRoute({ name: 'settle', groupId: gid })
  }

  const saveExpense = (splitWith, perPerson) => {
    const gid = route.groupId
    const g = state.groups.find((x) => x.id === gid)
    const amount = parseFloat(draft.amountStr) || 0
    const eid = 'e_' + Date.now()
    const exp = {
      id: eid,
      group_id: gid,
      paid_by: draft.paid_by,
      amount,
      currency: g.currency,
      description: draft.description || T('add.untitled'),
      category: draft.category,
      date: draft.date,
      created_at: new Date().toISOString(),
      created_by: 'u_me',
    }
    const splits = splitWith.map((mid, i) => ({
      id: `s_${eid}_${i}`,
      expense_id: eid,
      member_id: mid,
      share_amount: Math.round(perPerson * 100) / 100,
    }))
    const payer = bcMember(state, draft.paid_by)
    const actorName = payer.user_id === 'u_me' ? 'You' : payer.display_name // localized at render
    const sym = bcCurrencySymbol(g.currency)
    const notif = {
      id: 'n_' + Date.now(),
      user_id: 'u_me',
      group_id: gid,
      type: 'expense_added',
      params: {
        actor: actorName,
        what: exp.description,
        amount: `${sym}${amount.toFixed(2)}`,
      },
      is_read: false,
      created_at: exp.created_at,
    }
    setState((s) => ({
      ...s,
      expenses: [exp, ...s.expenses],
      splits: [...splits, ...s.splits],
      notifications: [notif, ...s.notifications],
    }))
    setRoute({ name: 'group', groupId: gid })
  }

  const saveSettlement = ({ from, to, amount }) => {
    const gid = route.groupId
    const g = state.groups.find((x) => x.id === gid)
    const sid = 'st_' + Date.now()
    const st = {
      id: sid,
      group_id: gid,
      from_member: from,
      to_member: to,
      amount,
      currency: g.currency,
      settled_at: new Date().toISOString(),
      created_by: 'u_me',
    }
    const fromM = bcMember(state, from)
    const toM = bcMember(state, to)
    const sym = bcCurrencySymbol(g.currency)
    const notif = {
      id: 'n_' + Date.now(),
      user_id: 'u_me',
      group_id: gid,
      type: 'settlement_sent',
      params: {
        from: fromM.user_id === 'u_me' ? 'You' : fromM.display_name,
        to: toM.user_id === 'u_me' ? 'You' : toM.display_name,
        amount: `${sym}${amount.toFixed(2)}`,
      },
      is_read: false,
      created_at: st.settled_at,
    }
    setState((s) => ({
      ...s,
      settlements: [st, ...s.settlements],
      notifications: [notif, ...s.notifications],
    }))
  }

  const markAllRead = () => {
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) => ({ ...n, is_read: true })),
    }))
  }

  const unread = state.notifications.filter((n) => !n.is_read).length

  // Auth gating
  const loggedIn = tw.loggedIn !== false
  const [showAuth, setShowAuth] = React.useState(false)

  const onLogin = () => setShowAuth(true)
  const onAuthSuccess = () => {
    setShowAuth(false)
    setTweak('loggedIn', true)
  }
  const onDemo = () => setTweak('loggedIn', true)
  const onLogout = () => {
    setTweak('loggedIn', false)
    setTab('home')
    setRoute({ name: 'tab' })
  }

  // Pick screen
  let screen = null
  let screenLabel = ''
  if (route.name === 'tab') {
    if (tab === 'home') {
      screenLabel = '01 Groups'
      screen = <GroupsHome state={state} theme={theme} accent={accent} T={T} lang={lang} onOpenGroup={openGroup} onNewGroup={() => {}} />
    } else if (tab === 'activity') {
      screenLabel = '06 Activity'
      screen = (
        <ActivityScreen
          state={state}
          theme={theme}
          accent={accent}
          T={T}
          lang={lang}
          onMarkRead={markAllRead}
          onOpenGroup={(gid) => {
            setTab('home')
            openGroup(gid)
          }}
        />
      )
    } else if (tab === 'profile') {
      screenLabel = '07 Profile'
      screen = (
        <ProfileScreen
          state={state}
          theme={theme}
          accent={accent}
          T={T}
          lang={lang}
          currency={tw.currency}
          onSetCurrency={(v) => setTweak('currency', v)}
          onSetLang={(v) => setTweak('lang', v)}
          onLogout={onLogout}
        />
      )
    }
  } else if (route.name === 'group') {
    screenLabel = '02 Group'
    screen = (
      <GroupDetail
        state={state}
        theme={theme}
        accent={accent}
        T={T}
        lang={lang}
        groupId={route.groupId}
        onBack={backToTab}
        onAddExpense={() => startAddExpense(route.groupId)}
        onSettleUp={() => startSettle(route.groupId)}
      />
    )
  } else if (route.name === 'add') {
    screenLabel = '03 Add expense'
    screen = (
      <AddExpense
        state={state}
        theme={theme}
        accent={accent}
        T={T}
        lang={lang}
        groupId={route.groupId}
        draft={draft}
        setDraft={setDraft}
        onBack={() => setRoute({ name: 'group', groupId: route.groupId })}
        onSave={saveExpense}
      />
    )
  } else if (route.name === 'settle') {
    screenLabel = '04 Settle up'
    screen = (
      <SettleUp
        state={state}
        theme={theme}
        accent={accent}
        T={T}
        groupId={route.groupId}
        onBack={() => setRoute({ name: 'group', groupId: route.groupId })}
        onSave={saveSettlement}
      />
    )
  }

  const showBottomBar = route.name === 'tab' && loggedIn

  const inner = (
    <div
      data-screen-label={loggedIn ? screenLabel : '00 Landing'}
      data-bc-route={loggedIn ? route.name : 'landing'}
      data-bc-tab={tab}
      data-bc-lang={lang}
      data-bc-logged-in={loggedIn ? 'true' : 'false'}
      style={{
        position: 'absolute',
        inset: 0,
        background: theme.bg,
        color: theme.ink,
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 50,
        paddingBottom: 28,
        fontFamily: "'Be Vietnam Pro', sans-serif",
      }}
    >
      {loggedIn ? screen : <LandingScreen theme={theme} accent={accent} T={T} lang={lang} onLogin={onLogin} onDemo={onDemo} />}
      {showBottomBar && <BCBottomBarLocalized active={tab} onChange={setTab} theme={theme} unread={unread} T={T} />}
      {showAuth && <AuthSheet theme={theme} accent={accent} T={T} onClose={() => setShowAuth(false)} onSuccess={onAuthSuccess} />}
    </div>
  )

  return (
    <React.Fragment>
      {tw.showFrame ? (
        <IOSDevice dark={tw.dark}>{inner}</IOSDevice>
      ) : (
        <div
          style={{
            width: 402,
            height: 874,
            borderRadius: 32,
            overflow: 'hidden',
            position: 'relative',
            background: theme.bg,
            boxShadow: '0 30px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)',
          }}
        >
          {inner}
        </div>
      )}

      <TweaksPanel title="Tweaks" noDeckControls>
        <TweakSection label="Language">
          <TweakRadio
            label="App language"
            value={lang}
            options={[
              { label: 'English', value: 'en' },
              { label: 'Tiếng Việt', value: 'vi' },
            ]}
            onChange={(v) => setTweak('lang', v)}
          />
        </TweakSection>

        <TweakSection label="Brand">
          <TweakColor
            label="Accent"
            value={tw.accent}
            options={['#E5572F', '#3F6E55', '#7B5E8C', '#B7873A']}
            onChange={(v) => setTweak('accent', v)}
          />
        </TweakSection>

        <TweakSection label="Appearance">
          <TweakToggle label="Dark mode" value={tw.dark} onChange={(v) => setTweak('dark', v)} />
          <TweakToggle label="Device frame" value={tw.showFrame} onChange={(v) => setTweak('showFrame', v)} />
        </TweakSection>

        <TweakSection label="Auth">
          <TweakToggle label="Signed in" value={loggedIn} onChange={(v) => setTweak('loggedIn', v)} />
        </TweakSection>

        <TweakSection label="Jump to">
          <TweakSelect
            label="Screen"
            value={JSON.stringify({ route: route.name, tab })}
            options={[
              {
                label: 'Groups (home)',
                value: JSON.stringify({ route: 'tab', tab: 'home' }),
              },
              {
                label: 'Group — Rome trip',
                value: JSON.stringify({
                  route: 'group',
                  tab: 'home',
                  gid: 'g_rome',
                }),
              },
              {
                label: 'Group — Apt 4B',
                value: JSON.stringify({
                  route: 'group',
                  tab: 'home',
                  gid: 'g_apt',
                }),
              },
              {
                label: 'Add expense',
                value: JSON.stringify({
                  route: 'add',
                  tab: 'home',
                  gid: 'g_rome',
                }),
              },
              {
                label: 'Settle up',
                value: JSON.stringify({
                  route: 'settle',
                  tab: 'home',
                  gid: 'g_rome',
                }),
              },
              {
                label: 'Activity',
                value: JSON.stringify({ route: 'tab', tab: 'activity' }),
              },
              {
                label: 'Profile',
                value: JSON.stringify({ route: 'tab', tab: 'profile' }),
              },
            ]}
            onChange={(v) => {
              const parsed = JSON.parse(v)
              setTab(parsed.tab)
              if (parsed.route === 'tab') setRoute({ name: 'tab' })
              else if (parsed.route === 'group') setRoute({ name: 'group', groupId: parsed.gid })
              else if (parsed.route === 'add') {
                startAddExpense(parsed.gid)
              } else if (parsed.route === 'settle') {
                startSettle(parsed.gid)
              }
            }}
          />
        </TweakSection>
      </TweaksPanel>
    </React.Fragment>
  )
}

// Wrap the BCBottomBar with localized labels
function BCBottomBarLocalized({ active, onChange, theme, unread, T }) {
  // Patch labels into the existing component's tabs via closure
  const tabs = [
    { k: 'home', label: T('nav.groups'), icon: 'home' },
    {
      k: 'activity',
      label: T('nav.activity'),
      icon: 'activity',
      badge: unread,
    },
    { k: 'profile', label: T('nav.profile'), icon: 'user' },
  ]
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 24,
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: 6,
          background: theme.ink,
          color: theme.bg,
          borderRadius: 999,
          pointerEvents: 'auto',
          boxShadow: '0 14px 30px rgba(0,0,0,0.18), 0 4px 10px rgba(0,0,0,0.08)',
        }}
      >
        {tabs.map((t) => {
          const sel = active === t.k
          return (
            <button
              key={t.k}
              onClick={() => onChange(t.k)}
              className="bc-tap"
              style={{
                border: 'none',
                cursor: 'pointer',
                background: sel ? theme.bg : 'transparent',
                color: sel ? theme.ink : 'rgba(245,241,234,0.8)',
                padding: sel ? '10px 18px' : '10px 14px',
                borderRadius: 999,
                fontFamily: 'Be Vietnam Pro',
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: '-0.005em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'background 200ms, padding 200ms, color 200ms',
                position: 'relative',
                whiteSpace: 'nowrap',
              }}
            >
              <BCIcon name={t.icon} size={18} color={sel ? theme.ink : 'rgba(245,241,234,0.8)'} stroke={1.7} />
              {sel && <span>{t.label}</span>}
              {t.badge > 0 && !sel && (
                <span
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 8,
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    background: theme.accent,
                    boxShadow: `0 0 0 2px ${theme.ink}`,
                  }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(<App />)
