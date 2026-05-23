// billchill screens — group expense tracker (i18n-ready)

// ════════════════════════════════════════════════════════════════
// GROUPS HOME
// ════════════════════════════════════════════════════════════════
function GroupsHome({ state, theme, accent, T, lang, onOpenGroup, onNewGroup }) {
  const groups = state.groups.filter((g) => !g.archived_at)

  const rows = groups
    .map((g) => {
      const myBal = bcMyBalance(state, g.id)
      const members = bcGroupMembers(state, g.id)
      const expenses = bcGroupExpenses(state, g.id)
      const last = expenses.length ? expenses.reduce((a, b) => (a.created_at > b.created_at ? a : b)) : null
      return {
        g,
        myBal,
        members,
        lastTime: last?.created_at,
        expCount: expenses.length,
      }
    })
    .sort((a, b) => (b.lastTime || '').localeCompare(a.lastTime || ''))

  const totalOwed = rows.reduce((s, r) => s + Math.max(0, r.myBal), 0)
  const totalOwe = rows.reduce((s, r) => s + Math.max(0, -r.myBal), 0)
  const heroCurrency = bcCurrencySymbol(rows[0]?.g?.currency || 'USD')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <BCTopBar
        theme={theme}
        left={
          <div
            style={{
              fontFamily: "'Newsreader', serif",
              fontSize: 28,
              color: theme.ink,
              letterSpacing: '-0.015em',
              paddingLeft: 6,
              whiteSpace: 'nowrap',
            }}
          >
            {T('brand')}
          </div>
        }
        right={<IconBtn name="users" theme={theme} onClick={onNewGroup} />}
      />

      <div style={{ padding: '8px 16px 0' }}>
        <div
          style={{
            background: theme.ink,
            color: theme.bg,
            borderRadius: 28,
            padding: '20px 22px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              fontFamily: 'Be Vietnam Pro',
              fontSize: 11,
              color: 'rgba(245,241,234,0.55)',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              marginBottom: 6,
            }}
          >
            {T('home.your_balance')}
          </div>

          <div>
            <div
              style={{
                fontFamily: "'Newsreader', serif",
                fontSize: 60,
                lineHeight: 0.95,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.02em',
                color: totalOwed - totalOwe >= 0 ? '#E8DCC8' : '#F2A788',
              }}
            >
              <span style={{ fontSize: 32, opacity: 0.6, marginRight: 4 }}>{heroCurrency}</span>
              {(totalOwed - totalOwe).toFixed(2).split('.')[0]}
              <span style={{ fontSize: 32, opacity: 0.55 }}>.{(totalOwed - totalOwe).toFixed(2).split('.')[1]}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14, marginTop: 18 }}>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: 'Be Vietnam Pro',
                  fontSize: 11,
                  opacity: 0.5,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {T('home.owed_to_you')}
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 16,
                  fontWeight: 500,
                  marginTop: 4,
                  color: '#9CC8A8',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {heroCurrency}
                {totalOwed.toFixed(2)}
              </div>
            </div>
            <div style={{ width: 1, background: 'rgba(245,241,234,0.16)' }} />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: 'Be Vietnam Pro',
                  fontSize: 11,
                  opacity: 0.5,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {T('home.you_owe')}
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 16,
                  fontWeight: 500,
                  marginTop: 4,
                  color: '#F2A788',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {heroCurrency}
                {totalOwe.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '22px 22px 10px',
        }}
      >
        <SectionLabel theme={theme}>{T('home.groups_section')}</SectionLabel>
        <div
          style={{
            fontFamily: 'Be Vietnam Pro',
            fontSize: 12,
            color: theme.muted,
          }}
        >
          {T('home.active', [rows.length])}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 16px 140px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {rows.map((r) => (
          <GroupRow key={r.g.id} row={r} theme={theme} T={T} lang={lang} state={state} onClick={() => onOpenGroup(r.g.id)} />
        ))}
        {rows.length === 0 && (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: theme.muted,
              fontFamily: 'Be Vietnam Pro',
            }}
          >
            {T('home.empty')}
          </div>
        )}
      </div>
    </div>
  )
}

function GroupRow({ row, theme, T, lang, state, onClick }) {
  const { g, myBal, members, lastTime } = row
  const sym = bcCurrencySymbol(g.currency)
  const isOwed = myBal > 0.005
  const owes = myBal < -0.005
  const settled = !isOwed && !owes
  return (
    <Card theme={theme} onClick={onClick} padded={false} style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <GroupGlyph name={g.name} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'Be Vietnam Pro',
              fontWeight: 500,
              fontSize: 16,
              color: theme.ink,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {g.name}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 4,
            }}
          >
            <AvatarStack members={members} size={20} max={4} theme={theme} />
            {lastTime && (
              <div
                style={{
                  fontFamily: 'Be Vietnam Pro',
                  fontSize: 12,
                  color: theme.muted,
                }}
              >
                · {bcRelativeTimeL(lastTime, lang)}
              </div>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {settled ? (
            <div
              style={{
                fontFamily: 'Be Vietnam Pro',
                fontSize: 12,
                color: theme.muted,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {T('home.settled')}
            </div>
          ) : (
            <React.Fragment>
              <div
                style={{
                  fontFamily: 'Be Vietnam Pro',
                  fontSize: 10,
                  color: theme.muted,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {isOwed ? T('home.youre_owed') : T('home.you_owe_short')}
              </div>
              <div
                style={{
                  fontFamily: "'Newsreader', serif",
                  fontSize: 26,
                  lineHeight: 1,
                  color: isOwed ? theme.pos : theme.neg,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.01em',
                  marginTop: 2,
                }}
              >
                {sym}
                {Math.abs(myBal).toFixed(2)}
              </div>
            </React.Fragment>
          )}
        </div>
      </div>
    </Card>
  )
}

function GroupGlyph({ name, size = 44 }) {
  const ch = (name || '?').trim().charAt(0).toUpperCase()
  const tint = bcAvatarColor(name)
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 14,
        background: tint,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Newsreader', serif",
        fontSize: size * 0.55,
        letterSpacing: '-0.02em',
        flexShrink: 0,
      }}
    >
      {ch}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// GROUP DETAIL
// ════════════════════════════════════════════════════════════════
function GroupDetail({ state, theme, accent, T, lang, groupId, onBack, onAddExpense, onSettleUp }) {
  const g = state.groups.find((x) => x.id === groupId)
  const members = bcGroupMembers(state, groupId)
  const expenses = bcGroupExpenses(state, groupId)
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
  const settlements = bcGroupSettlements(state, groupId)
    .slice()
    .sort((a, b) => b.settled_at.localeCompare(a.settled_at))
  const myBal = bcMyBalance(state, groupId)
  const sym = bcCurrencySymbol(g.currency)
  const myMid = bcMyMemberId(state, groupId)
  const balances = bcMemberBalances(state, groupId)
  const simplified = bcSimplifySettlements(state, groupId)
  const [tab, setTab] = React.useState('expenses')

  const membersKey = members.length === 1 ? 'group.members_count_one' : 'group.members_count_other'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <BCTopBar
        theme={theme}
        title={g.name}
        subtitle={`${T(membersKey, [members.length])} · ${g.currency}`}
        left={<IconBtn name="back" theme={theme} onClick={onBack} />}
        right={<IconBtn name="dots" theme={theme} />}
      />

      <div style={{ padding: '6px 16px 0' }}>
        <Card
          theme={theme}
          padded={false}
          style={{
            padding: '16px 18px',
            background: theme.ink,
            color: theme.bg,
            border: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'Be Vietnam Pro',
                  fontSize: 11,
                  opacity: 0.55,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                }}
              >
                {myBal > 0.005 ? T('group.youre_owed') : myBal < -0.005 ? T('group.you_owe') : T('group.all_settled')}
              </div>
              <div style={{ marginTop: 6 }}>
                {Math.abs(myBal) < 0.005 ? (
                  <div
                    style={{
                      fontFamily: "'Newsreader', serif",
                      fontSize: 44,
                      lineHeight: 0.95,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {sym}0.00
                  </div>
                ) : (
                  <Money
                    value={Math.abs(myBal)}
                    currency={sym}
                    size={44}
                    color={myBal > 0 ? '#9CC8A8' : '#F2A788'}
                    family="serif"
                    animate={false}
                  />
                )}
              </div>
            </div>
            <button
              onClick={onSettleUp}
              className="bc-tap"
              style={{
                background: 'rgba(245,241,234,0.12)',
                color: theme.bg,
                border: 'none',
                padding: '12px 18px',
                borderRadius: 999,
                cursor: 'pointer',
                fontFamily: 'Be Vietnam Pro',
                fontWeight: 500,
                fontSize: 13,
                letterSpacing: '-0.005em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <BCIcon name="swap" size={14} color={theme.bg} stroke={1.8} />
              {T('group.settle_up')}
            </button>
          </div>
        </Card>
      </div>

      <div style={{ padding: '14px 0 8px' }}>
        <BCTabs
          theme={theme}
          active={tab}
          onChange={setTab}
          tabs={[
            {
              k: 'expenses',
              label: T('group.tab_expenses', [expenses.length]),
            },
            { k: 'balances', label: T('group.tab_balances') },
          ]}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 120px' }}>
        {tab === 'expenses' && (
          <ExpensesList
            expenses={expenses}
            settlements={settlements}
            state={state}
            theme={theme}
            currencySymbol={sym}
            myMid={myMid}
            T={T}
            lang={lang}
          />
        )}
        {tab === 'balances' && (
          <BalancesView
            members={members}
            balances={balances}
            simplified={simplified}
            state={state}
            theme={theme}
            currencySymbol={sym}
            myMid={myMid}
            T={T}
            onSettleUp={onSettleUp}
          />
        )}
      </div>

      {tab === 'expenses' && (
        <div
          style={{
            position: 'absolute',
            bottom: 96,
            right: 18,
            zIndex: 25,
          }}
        >
          <FAB onClick={onAddExpense} theme={theme} accent={accent} label={T('group.add_expense')} />
        </div>
      )}
    </div>
  )
}

function ExpensesList({ expenses, settlements, state, theme, currencySymbol, myMid, T, lang }) {
  const items = [
    ...expenses.map((e) => ({ kind: 'expense', t: e.created_at, e })),
    ...settlements.map((s) => ({ kind: 'settlement', t: s.settled_at, s })),
  ].sort((a, b) => b.t.localeCompare(a.t))

  const groups = []
  items.forEach((it) => {
    const day = it.t.slice(0, 10)
    const last = groups[groups.length - 1]
    if (last && last.day === day) last.items.push(it)
    else groups.push({ day, items: [it] })
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {groups.map((grp) => (
        <div key={grp.day}>
          <div
            style={{
              padding: '0 4px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <SectionLabel theme={theme}>{bcShortDateL(grp.day, lang)}</SectionLabel>
            <div style={{ flex: 1, height: 1, background: theme.softhair }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {grp.items.map((it) =>
              it.kind === 'expense' ? (
                <ExpenseRow key={it.e.id} expense={it.e} state={state} theme={theme} currencySymbol={currencySymbol} myMid={myMid} T={T} />
              ) : (
                <SettlementRow
                  key={it.s.id}
                  settlement={it.s}
                  state={state}
                  theme={theme}
                  currencySymbol={currencySymbol}
                  T={T}
                  lang={lang}
                />
              ),
            )}
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: theme.muted,
            fontFamily: 'Be Vietnam Pro',
          }}
        >
          {T('group.no_expenses')}
        </div>
      )}
    </div>
  )
}

function ExpenseRow({ expense, state, theme, currencySymbol, myMid, T }) {
  const payer = bcMember(state, expense.paid_by)
  const payerName = bcMemberName(state, payer, T)
  const splits = state.splits.filter((s) => s.expense_id === expense.id)
  const mySplit = splits.find((s) => s.member_id === myMid)
  const iPaid = expense.paid_by === myMid
  const lent = iPaid ? expense.amount - (mySplit?.share_amount || 0) : 0
  const owe = !iPaid ? mySplit?.share_amount || 0 : 0
  const sharesKey = splits.length === 1 ? 'group.paid_shares_one' : 'group.paid_shares_other'

  return (
    <Card theme={theme} padded={false} style={{ padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <CategoryBadge category={expense.category} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'Be Vietnam Pro',
              fontWeight: 500,
              fontSize: 14.5,
              color: theme.ink,
              letterSpacing: '-0.005em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {expense.description}
          </div>
          <div
            style={{
              fontFamily: 'Be Vietnam Pro',
              fontSize: 12,
              color: theme.muted,
              marginTop: 2,
            }}
          >
            {T(sharesKey, [payerName, splits.length])}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontFamily: "'Newsreader', serif",
              fontSize: 22,
              lineHeight: 1,
              color: theme.ink,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.01em',
            }}
          >
            {currencySymbol}
            {expense.amount.toFixed(2)}
          </div>
          {(lent > 0.005 || owe > 0.005) && (
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                marginTop: 3,
                color: iPaid ? theme.pos : theme.neg,
                letterSpacing: '0.02em',
              }}
            >
              {iPaid ? `+${currencySymbol}${lent.toFixed(2)}` : `−${currencySymbol}${owe.toFixed(2)}`}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

function SettlementRow({ settlement, state, theme, currencySymbol, T, lang }) {
  const from = bcMember(state, settlement.from_member)
  const to = bcMember(state, settlement.to_member)
  const fromName = bcMemberName(state, from, T)
  const toName = bcMemberName(state, to, T)
  return (
    <Card theme={theme} padded={false} style={{ padding: '12px 14px', background: theme.chip, border: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            background: theme.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.ink,
            border: `1px dashed ${theme.hair}`,
          }}
        >
          <BCIcon name="check" size={18} color={theme.ink} stroke={2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'Be Vietnam Pro',
              fontWeight: 500,
              fontSize: 14.5,
              color: theme.ink,
              letterSpacing: '-0.005em',
            }}
          >
            {T('group.paid_to', [fromName, toName])}
          </div>
          <div
            style={{
              fontFamily: 'Be Vietnam Pro',
              fontSize: 12,
              color: theme.muted,
              marginTop: 2,
            }}
          >
            {T('group.settlement_date', [bcShortDateL(settlement.settled_at, lang)])}
          </div>
        </div>
        <div
          style={{
            fontFamily: "'Newsreader', serif",
            fontSize: 22,
            lineHeight: 1,
            color: theme.ink,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.01em',
          }}
        >
          {currencySymbol}
          {settlement.amount.toFixed(2)}
        </div>
      </div>
    </Card>
  )
}

function BalancesView({ members, balances, simplified, state, theme, currencySymbol, myMid, T, onSettleUp }) {
  const transfersKey = simplified.length === 1 ? 'group.transfers_one' : 'group.transfers_other'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <div style={{ padding: '0 4px 8px' }}>
          <SectionLabel theme={theme}>{T('group.member_balances')}</SectionLabel>
        </div>
        <Card theme={theme} padded={false}>
          {members.map((m, i) => {
            const b = balances.get(m.id) || 0
            const isMe = m.id === myMid
            const name = bcMemberName(state, m, T)
            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderTop: i === 0 ? 'none' : `1px solid ${theme.softhair}`,
                }}
              >
                <Avatar name={name} seed={m.id} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'Be Vietnam Pro',
                      fontWeight: 500,
                      fontSize: 14.5,
                      color: theme.ink,
                    }}
                  >
                    {name}
                    {isMe && (
                      <span
                        style={{
                          fontSize: 10,
                          marginLeft: 8,
                          padding: '2px 7px',
                          borderRadius: 999,
                          background: theme.chip,
                          color: theme.muted,
                          letterSpacing: '0.08em',
                        }}
                      >
                        {T('group.you_label')}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontFamily: 'Be Vietnam Pro',
                      fontSize: 11,
                      color: theme.muted,
                      marginTop: 2,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {Math.abs(b) < 0.005 ? T('home.settled') : b > 0 ? T('group.is_owed') : T('group.owes')}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: "'Newsreader', serif",
                    fontSize: 22,
                    lineHeight: 1,
                    color: Math.abs(b) < 0.005 ? theme.muted : b > 0 ? theme.pos : theme.neg,
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {Math.abs(b) < 0.005 ? '·' : currencySymbol + Math.abs(b).toFixed(2)}
                </div>
              </div>
            )
          })}
        </Card>
      </div>

      {simplified.length > 0 && (
        <div>
          <div
            style={{
              padding: '0 4px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <SectionLabel theme={theme}>{T('group.simplified_payments')}</SectionLabel>
            <div
              style={{
                fontFamily: 'Be Vietnam Pro',
                fontSize: 11,
                color: theme.muted,
                letterSpacing: '0.04em',
              }}
            >
              {T(transfersKey, [simplified.length])}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {simplified.map((s, i) => {
              const from = bcMember(state, s.from)
              const to = bcMember(state, s.to)
              const fromName = bcMemberName(state, from, T)
              const toName = bcMemberName(state, to, T)
              const involvesMe = s.from === myMid || s.to === myMid
              return (
                <Card
                  key={i}
                  theme={theme}
                  padded={false}
                  style={{
                    padding: '12px 14px',
                    background: involvesMe ? theme.surface : theme.chip,
                    border: involvesMe ? `1px solid ${theme.softhair}` : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={fromName} seed={from?.id} size={32} />
                    <BCIcon name="arrowR" size={16} color={theme.muted} stroke={1.6} />
                    <Avatar name={toName} seed={to?.id} size={32} />
                    <div style={{ flex: 1, minWidth: 0, paddingLeft: 6 }}>
                      <div
                        style={{
                          fontFamily: 'Be Vietnam Pro',
                          fontWeight: 500,
                          fontSize: 14,
                          color: theme.ink,
                          letterSpacing: '-0.005em',
                        }}
                      >
                        {T('group.pays', [fromName, toName])}
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: "'Newsreader', serif",
                        fontSize: 22,
                        lineHeight: 1,
                        color: theme.ink,
                        fontVariantNumeric: 'tabular-nums',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {currencySymbol}
                      {s.amount.toFixed(2)}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
          <div style={{ marginTop: 12 }}>
            <BCButton
              variant="quiet"
              theme={theme}
              full
              onClick={onSettleUp}
              icon={<BCIcon name="swap" size={16} color={theme.ink} stroke={1.8} />}
            >
              {T('group.record_settlement')}
            </BCButton>
          </div>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// ADD EXPENSE
// ════════════════════════════════════════════════════════════════
function AddExpense({ state, theme, accent, T, lang, groupId, draft, setDraft, onBack, onSave }) {
  const g = state.groups.find((x) => x.id === groupId)
  const members = bcGroupMembers(state, groupId)
  const sym = bcCurrencySymbol(g.currency)
  const [step, setStep] = React.useState(draft.amountStr ? 'details' : 'amount')

  const onKey = (k) => {
    setDraft((d) => {
      let s = d.amountStr || ''
      if (k === 'del') s = s.slice(0, -1)
      else if (k === '.') {
        if (!s.includes('.') && s.length > 0) s += '.'
      } else {
        if (s.includes('.') && s.split('.')[1].length >= 2) return d
        if (s === '0' && k !== '.') s = k
        else s += k
      }
      return { ...d, amountStr: s }
    })
  }

  const amount = parseFloat(draft.amountStr) || 0

  if (step === 'amount') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <BCTopBar
          theme={theme}
          title={T('add.title')}
          subtitle={g.name}
          left={<IconBtn name="close" theme={theme} onClick={onBack} />}
          right={null}
        />

        <div style={{ padding: '8px 22px 0' }}>
          <input
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            placeholder={T('add.placeholder_what')}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: 'Be Vietnam Pro',
              fontWeight: 500,
              fontSize: 18,
              color: theme.ink,
              letterSpacing: '-0.01em',
              padding: '6px 0',
            }}
          />
          <div style={{ height: 1, background: theme.softhair, marginTop: 2 }} />
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px 24px',
          }}
        >
          <SectionLabel theme={theme}>{T('add.amount')}</SectionLabel>
          <div style={{ marginTop: 16 }}>
            <AmountDisplay value={draft.amountStr} currency={sym} theme={theme} size={88} />
          </div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 24,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {[10, 20, 50, 100].map((n) => (
              <Chip key={n} theme={theme} onClick={() => setDraft((d) => ({ ...d, amountStr: String(n) }))}>
                {sym}
                {n}
              </Chip>
            ))}
          </div>
        </div>

        <NumPad onKey={onKey} theme={theme} />

        <div style={{ padding: '4px 18px 18px' }}>
          <BCButton
            variant="accent"
            full
            theme={theme}
            accent={accent}
            disabled={!(amount > 0)}
            onClick={() => setStep('details')}
            icon={<BCIcon name="arrowR" size={18} color="#fff" stroke={2.2} />}
          >
            {T('add.continue')}
          </BCButton>
        </div>
      </div>
    )
  }

  const splitMode = draft.splitMode || 'even'
  const selected = draft.splitWith || members.map((m) => m.id)

  const toggleSplitMember = (mid) => {
    setDraft((d) => {
      const cur = d.splitWith || members.map((m) => m.id)
      const has = cur.includes(mid)
      const next = has ? cur.filter((x) => x !== mid) : [...cur, mid]
      return { ...d, splitWith: next.length ? next : cur }
    })
  }

  const perPerson = amount / Math.max(1, selected.length)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <BCTopBar
        theme={theme}
        title={T('add.title')}
        subtitle={g.name}
        left={<IconBtn name="back" theme={theme} onClick={() => setStep('amount')} />}
        right={null}
      />

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 16px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 12,
            padding: '4px 4px',
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontFamily: 'Be Vietnam Pro',
                fontWeight: 500,
                fontSize: 16,
                color: theme.ink,
                letterSpacing: '-0.005em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {draft.description || T('add.untitled')}
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: theme.muted,
                marginTop: 2,
                letterSpacing: '0.04em',
              }}
            >
              {bcShortDateL(draft.date || '2026-05-22', lang)}
            </div>
          </div>
          <div
            style={{
              fontFamily: "'Newsreader', serif",
              fontSize: 36,
              lineHeight: 1,
              color: theme.ink,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.015em',
            }}
          >
            {sym}
            {amount.toFixed(2)}
          </div>
        </div>

        <div>
          <div style={{ padding: '0 4px 8px' }}>
            <SectionLabel theme={theme}>{T('add.paid_by')}</SectionLabel>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              padding: '0 4px',
            }}
          >
            {members.map((m) => {
              const sel = m.id === draft.paid_by
              const name = bcMemberName(state, m, T)
              return (
                <button
                  key={m.id}
                  onClick={() => setDraft((d) => ({ ...d, paid_by: m.id }))}
                  className="bc-tap"
                  style={{
                    flexShrink: 0,
                    border: 'none',
                    cursor: 'pointer',
                    background: sel ? theme.ink : theme.chip,
                    color: sel ? theme.bg : theme.ink,
                    padding: '8px 14px 8px 8px',
                    borderRadius: 999,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontFamily: 'Be Vietnam Pro',
                    fontWeight: 500,
                    fontSize: 13,
                  }}
                >
                  <Avatar name={name} seed={m.id} size={24} />
                  {name}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <div style={{ padding: '0 4px 8px' }}>
            <SectionLabel theme={theme}>{T('add.category')}</SectionLabel>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              padding: '0 4px 4px',
            }}
          >
            {Object.entries(BC_CATEGORIES).map(([k, c]) => {
              const sel = draft.category === k
              return (
                <button
                  key={k}
                  onClick={() => setDraft((d) => ({ ...d, category: k }))}
                  className="bc-tap"
                  style={{
                    flexShrink: 0,
                    border: 'none',
                    cursor: 'pointer',
                    background: 'transparent',
                    padding: '4px 4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: sel ? c.tint : theme.chip,
                      color: sel ? '#fff' : c.tint,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: "'Newsreader', serif",
                      fontSize: 22,
                      letterSpacing: '-0.02em',
                      boxShadow: sel ? `0 4px 12px ${c.tint}55` : 'none',
                      transition: 'background 160ms, color 160ms, box-shadow 160ms',
                    }}
                  >
                    {c.glyph}
                  </div>
                  <div
                    style={{
                      fontFamily: 'Be Vietnam Pro',
                      fontSize: 11,
                      color: sel ? theme.ink : theme.muted,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {T('cat.' + k)}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <div
            style={{
              padding: '0 4px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <SectionLabel theme={theme}>{T('add.split_with')}</SectionLabel>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: theme.muted,
                letterSpacing: '0.04em',
              }}
            >
              {T('add.each', [sym + perPerson.toFixed(2)])}
            </div>
          </div>
          <Card theme={theme} padded={false}>
            {members.map((m, i) => {
              const has = selected.includes(m.id)
              const name = bcMemberName(state, m, T)
              return (
                <div
                  key={m.id}
                  onClick={() => toggleSplitMember(m.id)}
                  className="bc-tap"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderTop: i === 0 ? 'none' : `1px solid ${theme.softhair}`,
                    cursor: 'pointer',
                  }}
                >
                  <Avatar name={name} seed={m.id} size={32} />
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontFamily: 'Be Vietnam Pro',
                      fontWeight: 500,
                      fontSize: 14.5,
                      color: theme.ink,
                    }}
                  >
                    {name}
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12,
                      color: has ? theme.ink : theme.muted,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {has ? `${sym}${perPerson.toFixed(2)}` : '—'}
                  </div>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background: has ? accent : 'transparent',
                      border: has ? 'none' : `1.6px solid ${theme.hair}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 160ms',
                    }}
                  >
                    {has && <BCIcon name="check" size={14} color="#fff" stroke={2.4} />}
                  </div>
                </div>
              )
            })}
          </Card>
        </div>
      </div>

      <div style={{ padding: '4px 16px 16px' }}>
        <BCButton
          variant="accent"
          full
          theme={theme}
          accent={accent}
          disabled={!draft.paid_by || !draft.category || !selected.length || !(amount > 0)}
          onClick={() => onSave(selected, perPerson)}
          icon={<BCIcon name="check" size={18} color="#fff" stroke={2.2} />}
        >
          {T('add.save')}
        </BCButton>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// SETTLE UP
// ════════════════════════════════════════════════════════════════
function SettleUp({ state, theme, accent, T, groupId, onBack, onSave }) {
  const g = state.groups.find((x) => x.id === groupId)
  const members = bcGroupMembers(state, groupId)
  const sym = bcCurrencySymbol(g.currency)
  const myMid = bcMyMemberId(state, groupId)
  const simplified = bcSimplifySettlements(state, groupId)

  const suggestion = simplified.find((s) => s.from === myMid || s.to === myMid) || simplified[0]

  const [fromMid, setFromMid] = React.useState(suggestion?.from || myMid)
  const [toMid, setToMid] = React.useState(suggestion?.to || members.find((m) => m.id !== myMid)?.id)
  const [amountStr, setAmountStr] = React.useState(suggestion ? suggestion.amount.toFixed(2) : '')
  const [done, setDone] = React.useState(false)

  const onKey = (k) => {
    setAmountStr((s) => {
      if (k === 'del') return s.slice(0, -1)
      if (k === '.') {
        return !s.includes('.') && s.length > 0 ? s + '.' : s
      }
      if (s.includes('.') && s.split('.')[1].length >= 2) return s
      if (s === '0' && k !== '.') return k
      return s + k
    })
  }

  const amount = parseFloat(amountStr) || 0

  if (done) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px',
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 999,
            background: theme.pos,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 14px 30px ${theme.pos}55`,
          }}
        >
          <BCIcon name="check" size={36} color="#fff" stroke={2.4} />
        </div>
        <div
          style={{
            marginTop: 28,
            fontFamily: "'Newsreader', serif",
            fontSize: 40,
            color: theme.ink,
            letterSpacing: '-0.02em',
            textAlign: 'center',
            lineHeight: 1.05,
          }}
        >
          {T('settle.done_title')}
        </div>
        <div
          style={{
            marginTop: 10,
            fontFamily: 'Be Vietnam Pro',
            fontSize: 15,
            color: theme.muted,
            textAlign: 'center',
          }}
        >
          {T('settle.done_subtitle')}
        </div>
        <div style={{ marginTop: 40, width: '100%' }}>
          <BCButton variant="primary" full theme={theme} onClick={onBack}>
            {T('settle.back_to_group')}
          </BCButton>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <BCTopBar
        theme={theme}
        title={T('settle.title')}
        subtitle={g.name}
        left={<IconBtn name="close" theme={theme} onClick={onBack} />}
        right={null}
      />

      <div style={{ padding: '12px 16px 0' }}>
        <Card theme={theme} padded={false} style={{ padding: '14px 16px' }}>
          <SettleRow
            label={T('settle.from')}
            memberId={fromMid}
            onChange={setFromMid}
            members={members}
            state={state}
            theme={theme}
            T={T}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '2px 0',
            }}
          >
            <button
              onClick={() => {
                setFromMid(toMid)
                setToMid(fromMid)
              }}
              className="bc-tap"
              style={{
                border: 'none',
                background: theme.chip,
                color: theme.ink,
                cursor: 'pointer',
                width: 32,
                height: 32,
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BCIcon name="swap" size={14} color={theme.ink} stroke={1.8} />
            </button>
          </div>
          <SettleRow label={T('settle.to')} memberId={toMid} onChange={setToMid} members={members} state={state} theme={theme} T={T} />
        </Card>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px 24px',
        }}
      >
        <SectionLabel theme={theme}>{T('settle.amount')}</SectionLabel>
        <div style={{ marginTop: 14 }}>
          <AmountDisplay value={amountStr} currency={sym} theme={theme} size={72} />
        </div>
        {suggestion && (
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <Chip theme={theme} onClick={() => setAmountStr(suggestion.amount.toFixed(2))}>
              {T('settle.suggested', [sym + suggestion.amount.toFixed(2)])}
            </Chip>
          </div>
        )}
      </div>

      <NumPad onKey={onKey} theme={theme} />

      <div style={{ padding: '4px 16px 16px' }}>
        <BCButton
          variant="accent"
          full
          theme={theme}
          accent={accent}
          disabled={!fromMid || !toMid || fromMid === toMid || !(amount > 0)}
          onClick={() => {
            onSave({ from: fromMid, to: toMid, amount })
            setDone(true)
          }}
          icon={<BCIcon name="check" size={18} color="#fff" stroke={2.2} />}
        >
          {T('settle.record')}
        </BCButton>
      </div>
    </div>
  )
}

function SettleRow({ label, memberId, onChange, members, state, theme, T }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
      }}
    >
      <div
        style={{
          width: 36,
          fontFamily: 'Be Vietnam Pro',
          fontSize: 11,
          color: theme.muted,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
        }}
      >
        {label}
      </div>
      <div style={{ flex: 1, display: 'flex', gap: 8, overflowX: 'auto' }}>
        {members.map((mm) => {
          const sel = mm.id === memberId
          const name = bcMemberName(state, mm, T)
          return (
            <button
              key={mm.id}
              onClick={() => onChange(mm.id)}
              className="bc-tap"
              style={{
                flexShrink: 0,
                border: 'none',
                cursor: 'pointer',
                background: sel ? theme.ink : theme.chip,
                color: sel ? theme.bg : theme.ink,
                padding: '6px 12px 6px 6px',
                borderRadius: 999,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'Be Vietnam Pro',
                fontWeight: 500,
                fontSize: 13,
              }}
            >
              <Avatar name={name} seed={mm.id} size={22} />
              {name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// ACTIVITY
// ════════════════════════════════════════════════════════════════
function ActivityScreen({ state, theme, accent, T, lang, onMarkRead, onOpenGroup }) {
  const items = state.notifications.slice().sort((a, b) => b.created_at.localeCompare(a.created_at))
  const typeIcon = {
    expense_added: 'receipt',
    settlement_sent: 'check',
    reminder: 'bell',
    member_joined: 'users',
  }
  const typeLabel = {
    expense_added: T('activity.type_expense'),
    settlement_sent: T('activity.type_payment'),
    reminder: T('activity.type_reminder'),
    member_joined: T('activity.type_joined'),
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <BCTopBar
        theme={theme}
        left={
          <div
            style={{
              fontFamily: "'Newsreader', serif",
              fontSize: 28,
              color: theme.ink,
              paddingLeft: 6,
              letterSpacing: '-0.015em',
              whiteSpace: 'nowrap',
            }}
          >
            {T('activity.title')}
          </div>
        }
        right={<IconBtn name="check" theme={theme} onClick={onMarkRead} />}
      />

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 16px 140px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {items.map((n) => {
          const group = state.groups.find((g) => g.id === n.group_id)
          // Localize the "You" name in settlement params on the fly
          const localizedParams = { ...n.params }
          if (n.type === 'settlement_sent') {
            if (localizedParams.from === 'You') localizedParams.from = T('common.you')
            if (localizedParams.to === 'You') localizedParams.to = T('common.you')
          }
          const message = T('notif.' + n.type, localizedParams)
          return (
            <Card
              key={n.id}
              theme={theme}
              padded={false}
              onClick={() => n.group_id && onOpenGroup(n.group_id)}
              style={{
                padding: '14px 16px',
                background: n.is_read ? theme.surface : theme.bg,
                border: `1px solid ${theme.softhair}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    background: theme.chip,
                    color: theme.ink,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    position: 'relative',
                  }}
                >
                  <BCIcon name={typeIcon[n.type] || 'bell'} size={18} color={theme.ink} stroke={1.6} />
                  {!n.is_read && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -1,
                        right: -1,
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        background: accent,
                        boxShadow: `0 0 0 2px ${theme.bg}`,
                      }}
                    />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 6,
                      marginBottom: 4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'Be Vietnam Pro',
                        fontSize: 10,
                        color: theme.muted,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        fontWeight: 500,
                        flexShrink: 0,
                      }}
                    >
                      {typeLabel[n.type]}
                    </div>
                    {group && (
                      <div
                        style={{
                          fontFamily: 'Be Vietnam Pro',
                          fontSize: 11,
                          color: theme.muted,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        · {group.name}
                      </div>
                    )}
                    <div style={{ flex: 1 }} />
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 10,
                        color: theme.muted,
                        letterSpacing: '0.04em',
                        flexShrink: 0,
                      }}
                    >
                      {bcRelativeTimeL(n.created_at, lang).toUpperCase()}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: 'Be Vietnam Pro',
                      fontSize: 14.5,
                      color: theme.ink,
                      letterSpacing: '-0.005em',
                      lineHeight: 1.35,
                    }}
                  >
                    {message}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
        {items.length === 0 && (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: theme.muted,
              fontFamily: 'Be Vietnam Pro',
            }}
          >
            {T('activity.empty')}
          </div>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// PROFILE
// ════════════════════════════════════════════════════════════════
function ProfileScreen({ state, theme, accent, T, lang, currency, onSetCurrency, onSetLang, onLogout }) {
  const me = state.users.find((u) => u.id === 'u_me')
  const myName = T('common.you') // localize for display
  const myGroups = state.groups.filter((g) => state.members.some((m) => m.group_id === g.id && m.user_id === 'u_me'))
  const archived = state.groups.filter((g) => g.archived_at)

  const allExpenses = state.expenses
  const totalLent = allExpenses.filter((e) => bcMember(state, e.paid_by)?.user_id === 'u_me').reduce((s, e) => s + e.amount, 0)

  const rows = [
    {
      label: T('profile.language'),
      value: lang === 'vi' ? 'Tiếng Việt' : 'English',
    },
    { label: T('profile.default_currency'), value: currency },
    { label: T('profile.notifications'), value: T('profile.all_on') },
    { label: T('profile.appearance'), value: T('profile.auto') },
    { label: T('profile.connected_accounts'), value: '1' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <BCTopBar
        theme={theme}
        left={
          <div
            style={{
              fontFamily: "'Newsreader', serif",
              fontSize: 28,
              color: theme.ink,
              paddingLeft: 6,
              letterSpacing: '-0.015em',
              whiteSpace: 'nowrap',
            }}
          >
            {T('profile.title')}
          </div>
        }
        right={<IconBtn name="settings" theme={theme} />}
      />

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 16px 140px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <Card theme={theme}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar name={myName} seed={me.id} size={56} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontFamily: 'Be Vietnam Pro',
                  fontWeight: 500,
                  fontSize: 17,
                  color: theme.ink,
                  letterSpacing: '-0.005em',
                }}
              >
                {myName}
              </div>
              <div
                style={{
                  fontFamily: 'Be Vietnam Pro',
                  fontSize: 13,
                  color: theme.muted,
                  marginTop: 2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {me.email}
              </div>
            </div>
          </div>
        </Card>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
          }}
        >
          <Stat label={T('profile.stat_groups')} value={myGroups.length} theme={theme} />
          <Stat label={T('profile.stat_expenses')} value={allExpenses.length} theme={theme} />
          <Stat label={T('profile.stat_total_lent')} value={`$${totalLent.toFixed(0)}`} theme={theme} />
        </div>

        <div>
          <SectionLabel theme={theme} style={{ padding: '4px 4px 8px' }}>
            {T('profile.preferences')}
          </SectionLabel>
          <Card theme={theme} padded={false}>
            {rows.map((r, i) => (
              <div
                key={r.label}
                className="bc-tap"
                onClick={r.label === T('profile.language') ? () => onSetLang(lang === 'vi' ? 'en' : 'vi') : null}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderTop: i === 0 ? 'none' : `1px solid ${theme.softhair}`,
                  cursor: r.label === T('profile.language') ? 'pointer' : 'default',
                }}
              >
                <div
                  style={{
                    fontFamily: 'Be Vietnam Pro',
                    fontSize: 15,
                    color: theme.ink,
                  }}
                >
                  {r.label}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      fontFamily: 'Be Vietnam Pro',
                      fontSize: 14,
                      color: theme.muted,
                    }}
                  >
                    {r.value}
                  </div>
                  <BCIcon name="arrowR" size={14} color={theme.muted} stroke={1.6} />
                </div>
              </div>
            ))}
          </Card>
        </div>

        {archived.length > 0 && (
          <div>
            <SectionLabel theme={theme} style={{ padding: '4px 4px 8px' }}>
              {T('profile.archived_groups')}
            </SectionLabel>
            <Card theme={theme} padded={false}>
              {archived.map((g, i) => (
                <div
                  key={g.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderTop: i === 0 ? 'none' : `1px solid ${theme.softhair}`,
                  }}
                >
                  <GroupGlyph name={g.name} size={32} />
                  <div
                    style={{
                      flex: 1,
                      fontFamily: 'Be Vietnam Pro',
                      fontWeight: 500,
                      fontSize: 14,
                      color: theme.ink,
                    }}
                  >
                    {g.name}
                  </div>
                  <div
                    style={{
                      fontFamily: 'Be Vietnam Pro',
                      fontSize: 11,
                      color: theme.muted,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {T('profile.archived')}
                  </div>
                </div>
              ))}
            </Card>
          </div>
        )}

        <div
          style={{
            textAlign: 'center',
            padding: 12,
            fontFamily: 'Be Vietnam Pro',
            fontSize: 11,
            color: theme.muted,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          {T('common.app_footer')}
        </div>

        <button
          onClick={onLogout}
          className="bc-tap"
          style={{
            background: 'transparent',
            color: theme.neg,
            border: `1px solid ${theme.softhair}`,
            padding: '14px 22px',
            borderRadius: 999,
            cursor: 'pointer',
            fontFamily: 'Be Vietnam Pro',
            fontWeight: 500,
            fontSize: 15,
            letterSpacing: '-0.005em',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <BCIcon name="back" size={16} color={theme.neg} stroke={1.8} />
          {T('profile.logout')}
        </button>
      </div>
    </div>
  )
}

function Stat({ label, value, theme }) {
  return (
    <Card theme={theme} padded={false} style={{ padding: '14px 14px' }}>
      <div
        style={{
          fontFamily: 'Be Vietnam Pro',
          fontSize: 10,
          color: theme.muted,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'Newsreader', serif",
          fontSize: 30,
          color: theme.ink,
          lineHeight: 1.1,
          letterSpacing: '-0.015em',
          marginTop: 6,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
    </Card>
  )
}

Object.assign(window, {
  GroupsHome,
  GroupDetail,
  AddExpense,
  SettleUp,
  ActivityScreen,
  ProfileScreen,
  GroupGlyph,
})
