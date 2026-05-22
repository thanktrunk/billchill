// Design tokens + seed data for billchill (Splitwise-style group expenses)

const BC_PALETTES = {
  paper: {
    bg: '#F0EADE',
    surface: '#FBF7EE',
    ink: '#1A1A1A',
    muted: '#6B6359',
    hair: 'rgba(26,26,26,0.10)',
    softhair: 'rgba(26,26,26,0.08)',
    chip: 'rgba(26,26,26,0.06)',
    pos: '#3F6E55',  // they owe you (green)
    neg: '#E5572F',  // you owe them (orange — same as accent default)
  },
  ink: {
    bg: '#15130F',
    surface: '#1F1C16',
    ink: '#F5F1EA',
    muted: '#9A9285',
    hair: 'rgba(245,241,234,0.10)',
    softhair: 'rgba(245,241,234,0.06)',
    chip: 'rgba(245,241,234,0.06)',
    pos: '#7FB397',
    neg: '#F08158',
  },
};

function bcTheme(dark, accent) {
  const p = dark ? BC_PALETTES.ink : BC_PALETTES.paper;
  return { ...p, accent };
}

// Member avatar colors — stable hash by member id
const BC_AVATAR_COLORS = [
  '#E5572F', '#3F6E55', '#B7873A', '#7B5E8C',
  '#4A6B7C', '#A4452C', '#5B6E3F', '#8C5E3E',
];
function bcAvatarColor(seed) {
  let s = typeof seed === 'string' ? seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : seed;
  return BC_AVATAR_COLORS[Math.abs(s) % BC_AVATAR_COLORS.length];
}

// Expense categories (subset — matches what real splitting apps use)
const BC_CATEGORIES = {
  food:        { label: 'Food',        glyph: 'F', tint: '#E5572F' },
  drinks:      { label: 'Drinks',      glyph: 'D', tint: '#7B5E8C' },
  transport:   { label: 'Transport',   glyph: 'T', tint: '#4A6B7C' },
  lodging:     { label: 'Lodging',     glyph: 'L', tint: '#B7873A' },
  groceries:   { label: 'Groceries',   glyph: 'G', tint: '#3F6E55' },
  fun:         { label: 'Fun',         glyph: 'E', tint: '#A4452C' },
  utilities:   { label: 'Utilities',   glyph: 'U', tint: '#5B6E3F' },
  other:       { label: 'Other',       glyph: '·', tint: '#6B6359' },
};

// Currency display
function bcCurrencySymbol(code) {
  return ({ USD: '$', EUR: '€', GBP: '£', JPY: '¥' })[code] || code;
}

// ═════════════════════════════════════════════════════════════════
// SEED DATA — modeled directly on the ERD
// ═════════════════════════════════════════════════════════════════

const BC_USERS = [
  { id: 'u_me',    auth0_id: 'a|me',    display_name: 'You',   email: 'you@billchill.app', avatar_url: null },
  { id: 'u_sam',   auth0_id: 'a|sam',   display_name: 'Sam Bui',   email: null, avatar_url: null },
  { id: 'u_jules', auth0_id: 'a|jules', display_name: 'Jules T.',  email: null, avatar_url: null },
  { id: 'u_nico',  auth0_id: 'a|nico',  display_name: 'Nicolò',    email: null, avatar_url: null },
  { id: 'u_reb',   auth0_id: 'a|reb',   display_name: 'Reb Park',  email: null, avatar_url: null },
  { id: 'u_mo',    auth0_id: 'a|mo',    display_name: 'Mo',        email: null, avatar_url: null },
];

const BC_GROUPS = [
  { id: 'g_rome', name: 'Rome trip',  currency: 'EUR', created_by: 'u_me', created_at: '2026-04-22', archived_at: null },
  { id: 'g_apt',  name: 'Apt 4B',     currency: 'USD', created_by: 'u_me', created_at: '2026-01-04', archived_at: null },
  { id: 'g_book', name: 'Book club',  currency: 'USD', created_by: 'u_reb', created_at: '2026-02-14', archived_at: null },
  { id: 'g_sushi',name: 'Sushi Sat',  currency: 'USD', created_by: 'u_sam', created_at: '2025-11-08', archived_at: '2025-11-15' },
];

const BC_MEMBERS = [
  // Rome trip — 4 people
  { id: 'm_rome_me',    group_id: 'g_rome', user_id: 'u_me',    display_name: 'You',     default_share: 1, is_active: true },
  { id: 'm_rome_sam',   group_id: 'g_rome', user_id: 'u_sam',   display_name: 'Sam',     default_share: 1, is_active: true },
  { id: 'm_rome_jules', group_id: 'g_rome', user_id: 'u_jules', display_name: 'Jules',   default_share: 1, is_active: true },
  { id: 'm_rome_nico',  group_id: 'g_rome', user_id: 'u_nico',  display_name: 'Nicolò',  default_share: 1, is_active: true },
  // Apt 4B — 3 people (one is a placeholder, no user_id)
  { id: 'm_apt_me',     group_id: 'g_apt',  user_id: 'u_me',    display_name: 'You',     default_share: 1, is_active: true },
  { id: 'm_apt_reb',    group_id: 'g_apt',  user_id: 'u_reb',   display_name: 'Reb',     default_share: 1, is_active: true },
  { id: 'm_apt_mo',     group_id: 'g_apt',  user_id: 'u_mo',    display_name: 'Mo',      default_share: 1, is_active: true },
  // Book club — 5 people
  { id: 'm_book_me',    group_id: 'g_book', user_id: 'u_me',    display_name: 'You',     default_share: 1, is_active: true },
  { id: 'm_book_reb',   group_id: 'g_book', user_id: 'u_reb',   display_name: 'Reb',     default_share: 1, is_active: true },
  { id: 'm_book_jules', group_id: 'g_book', user_id: 'u_jules', display_name: 'Jules',   default_share: 1, is_active: true },
  { id: 'm_book_sam',   group_id: 'g_book', user_id: 'u_sam',   display_name: 'Sam',     default_share: 1, is_active: true },
  { id: 'm_book_kira',  group_id: 'g_book', user_id: null,      display_name: 'Kira',    default_share: 1, is_active: true },
];

const BC_EXPENSES = [
  // Rome trip
  { id: 'e_1', group_id: 'g_rome', paid_by: 'm_rome_me',   amount: 420.00, currency: 'EUR', description: 'Trastevere apartment, 3 nights', category: 'lodging',   date: '2026-04-26', created_at: '2026-04-26T18:02:00Z', created_by: 'u_me' },
  { id: 'e_2', group_id: 'g_rome', paid_by: 'm_rome_sam',  amount: 88.50,  currency: 'EUR', description: 'Dinner — Da Enzo',               category: 'food',      date: '2026-04-27', created_at: '2026-04-27T22:10:00Z', created_by: 'u_sam' },
  { id: 'e_3', group_id: 'g_rome', paid_by: 'm_rome_jules',amount: 32.00,  currency: 'EUR', description: 'Taxi from Termini',              category: 'transport', date: '2026-04-26', created_at: '2026-04-26T11:55:00Z', created_by: 'u_jules' },
  { id: 'e_4', group_id: 'g_rome', paid_by: 'm_rome_me',   amount: 64.20,  currency: 'EUR', description: 'Vatican tickets',                category: 'fun',       date: '2026-04-28', created_at: '2026-04-28T09:14:00Z', created_by: 'u_me' },
  { id: 'e_5', group_id: 'g_rome', paid_by: 'm_rome_nico', amount: 23.40,  currency: 'EUR', description: 'Aperol & snacks',                category: 'drinks',    date: '2026-04-27', created_at: '2026-04-27T19:30:00Z', created_by: 'u_nico' },
  { id: 'e_6', group_id: 'g_rome', paid_by: 'm_rome_sam',  amount: 18.00,  currency: 'EUR', description: 'Gelato run',                     category: 'food',      date: '2026-04-28', created_at: '2026-04-28T21:08:00Z', created_by: 'u_sam' },

  // Apt 4B
  { id: 'e_10', group_id: 'g_apt', paid_by: 'm_apt_me',  amount: 1840.00, currency: 'USD', description: 'May rent',                  category: 'lodging',   date: '2026-05-01', created_at: '2026-05-01T08:00:00Z', created_by: 'u_me' },
  { id: 'e_11', group_id: 'g_apt', paid_by: 'm_apt_reb', amount: 84.30,   currency: 'USD', description: 'Electric — Apr',            category: 'utilities', date: '2026-05-04', created_at: '2026-05-04T14:00:00Z', created_by: 'u_reb' },
  { id: 'e_12', group_id: 'g_apt', paid_by: 'm_apt_mo',  amount: 132.50,  currency: 'USD', description: 'Costco run',                category: 'groceries', date: '2026-05-09', created_at: '2026-05-09T17:42:00Z', created_by: 'u_mo' },
  { id: 'e_13', group_id: 'g_apt', paid_by: 'm_apt_me',  amount: 39.99,   currency: 'USD', description: 'Internet',                  category: 'utilities', date: '2026-05-10', created_at: '2026-05-10T11:00:00Z', created_by: 'u_me' },

  // Book club
  { id: 'e_20', group_id: 'g_book', paid_by: 'm_book_reb', amount: 76.20, currency: 'USD', description: '5 copies of Piranesi',     category: 'fun',       date: '2026-05-12', created_at: '2026-05-12T19:00:00Z', created_by: 'u_reb' },
  { id: 'e_21', group_id: 'g_book', paid_by: 'm_book_me',  amount: 42.00, currency: 'USD', description: 'Wine for May meeting',      category: 'drinks',    date: '2026-05-18', created_at: '2026-05-18T18:30:00Z', created_by: 'u_me' },
];

// Splits — for even splits, share_amount = amount / count
// For Rome dinner Da Enzo (e_2) — Nicolò didn't drink, smaller share
function evenSplit(expenseId, amount, memberIds) {
  const each = amount / memberIds.length;
  return memberIds.map((mid, i) => ({
    id: `s_${expenseId}_${i}`, expense_id: expenseId, member_id: mid, share_amount: Math.round(each * 100) / 100,
  }));
}

const BC_SPLITS = [
  ...evenSplit('e_1',  420.00, ['m_rome_me','m_rome_sam','m_rome_jules','m_rome_nico']),
  // e_2 dinner uneven
  { id: 's_e2_0', expense_id: 'e_2', member_id: 'm_rome_me',    share_amount: 24.00 },
  { id: 's_e2_1', expense_id: 'e_2', member_id: 'm_rome_sam',   share_amount: 26.00 },
  { id: 's_e2_2', expense_id: 'e_2', member_id: 'm_rome_jules', share_amount: 26.00 },
  { id: 's_e2_3', expense_id: 'e_2', member_id: 'm_rome_nico',  share_amount: 12.50 },

  ...evenSplit('e_3',  32.00,  ['m_rome_me','m_rome_sam','m_rome_jules','m_rome_nico']),
  ...evenSplit('e_4',  64.20,  ['m_rome_me','m_rome_sam','m_rome_jules','m_rome_nico']),
  ...evenSplit('e_5',  23.40,  ['m_rome_me','m_rome_sam','m_rome_jules','m_rome_nico']),
  ...evenSplit('e_6',  18.00,  ['m_rome_me','m_rome_sam','m_rome_jules','m_rome_nico']),

  ...evenSplit('e_10', 1840.00,['m_apt_me','m_apt_reb','m_apt_mo']),
  ...evenSplit('e_11', 84.30,  ['m_apt_me','m_apt_reb','m_apt_mo']),
  ...evenSplit('e_12', 132.50, ['m_apt_me','m_apt_reb','m_apt_mo']),
  ...evenSplit('e_13', 39.99,  ['m_apt_me','m_apt_reb','m_apt_mo']),

  ...evenSplit('e_20', 76.20,  ['m_book_me','m_book_reb','m_book_jules','m_book_sam','m_book_kira']),
  ...evenSplit('e_21', 42.00,  ['m_book_me','m_book_reb','m_book_jules','m_book_sam','m_book_kira']),
];

const BC_SETTLEMENTS = [
  { id: 'st_1', group_id: 'g_rome', from_member: 'm_rome_jules', to_member: 'm_rome_me', amount: 50.00, currency: 'EUR', settled_at: '2026-05-01T10:00:00Z', created_by: 'u_jules' },
  { id: 'st_2', group_id: 'g_apt',  from_member: 'm_apt_mo',     to_member: 'm_apt_me',  amount: 200.00, currency: 'USD', settled_at: '2026-05-12T16:30:00Z', created_by: 'u_mo'  },
];

const BC_NOTIFICATIONS = [
  { id: 'n_1', user_id: 'u_me', group_id: 'g_rome', type: 'expense_added',  params: { actor: 'Sam',  what: 'Dinner — Da Enzo',        amount: '€88.50' }, is_read: false, created_at: '2026-04-27T22:10:00Z' },
  { id: 'n_2', user_id: 'u_me', group_id: 'g_apt',  type: 'settlement_sent',params: { from: 'Mo',   to: 'You',                       amount: '$200.00' }, is_read: false, created_at: '2026-05-12T16:30:00Z' },
  { id: 'n_3', user_id: 'u_me', group_id: 'g_book', type: 'expense_added',  params: { actor: 'Reb', what: '5 copies of Piranesi',    amount: '$76.20' }, is_read: true,  created_at: '2026-05-12T19:00:00Z' },
  { id: 'n_4', user_id: 'u_me', group_id: 'g_rome', type: 'reminder',       params: { name: 'Nicolò',                                amount: '€40.60' }, is_read: true,  created_at: '2026-05-08T09:00:00Z' },
  { id: 'n_5', user_id: 'u_me', group_id: 'g_rome', type: 'member_joined',  params: { name: 'Nicolò', group: 'Rome trip' },                              is_read: true,  created_at: '2026-04-22T08:00:00Z' },
];

// ── Derived selectors ─────────────────────────────────────────────
function bcGroupMembers(state, groupId) {
  return state.members.filter((m) => m.group_id === groupId && m.is_active);
}
function bcGroupExpenses(state, groupId) {
  return state.expenses.filter((e) => e.group_id === groupId);
}
function bcGroupSettlements(state, groupId) {
  return state.settlements.filter((s) => s.group_id === groupId);
}
function bcMember(state, memberId) {
  return state.members.find((m) => m.id === memberId);
}
function bcMyMemberId(state, groupId) {
  return state.members.find((m) => m.group_id === groupId && m.user_id === 'u_me')?.id;
}

// Net balance per member in a group (positive = group owes them; negative = they owe group)
function bcMemberBalances(state, groupId) {
  const members = bcGroupMembers(state, groupId);
  const bal = new Map(members.map((m) => [m.id, 0]));
  bcGroupExpenses(state, groupId).forEach((e) => {
    bal.set(e.paid_by, (bal.get(e.paid_by) || 0) + e.amount);
    state.splits.filter((s) => s.expense_id === e.id).forEach((s) => {
      bal.set(s.member_id, (bal.get(s.member_id) || 0) - s.share_amount);
    });
  });
  bcGroupSettlements(state, groupId).forEach((st) => {
    bal.set(st.from_member, (bal.get(st.from_member) || 0) + st.amount);
    bal.set(st.to_member,   (bal.get(st.to_member)   || 0) - st.amount);
  });
  return bal; // Map<memberId, number>
}

// My net balance in a group (positive = you're owed, negative = you owe)
function bcMyBalance(state, groupId) {
  const myMid = bcMyMemberId(state, groupId);
  if (!myMid) return 0;
  return bcMemberBalances(state, groupId).get(myMid) || 0;
}

// Simplify balances into a list of suggested payments
function bcSimplifySettlements(state, groupId) {
  const bal = Array.from(bcMemberBalances(state, groupId).entries())
    .map(([mid, v]) => ({ mid, v: Math.round(v * 100) / 100 }))
    .filter((x) => Math.abs(x.v) > 0.01);
  const debtors = bal.filter((x) => x.v < 0).sort((a, b) => a.v - b.v);  // most negative first
  const creditors = bal.filter((x) => x.v > 0).sort((a, b) => b.v - a.v); // most positive first
  const out = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(-debtors[i].v, creditors[j].v);
    out.push({ from: debtors[i].mid, to: creditors[j].mid, amount: Math.round(pay * 100) / 100 });
    debtors[i].v += pay;
    creditors[j].v -= pay;
    if (Math.abs(debtors[i].v) < 0.01) i++;
    if (Math.abs(creditors[j].v) < 0.01) j++;
  }
  return out;
}

Object.assign(window, {
  BC_PALETTES, bcTheme, BC_AVATAR_COLORS, bcAvatarColor, BC_CATEGORIES, bcCurrencySymbol,
  BC_USERS, BC_GROUPS, BC_MEMBERS, BC_EXPENSES, BC_SPLITS, BC_SETTLEMENTS, BC_NOTIFICATIONS,
  bcGroupMembers, bcGroupExpenses, bcGroupSettlements, bcMember, bcMyMemberId,
  bcMemberBalances, bcMyBalance, bcSimplifySettlements, evenSplit,
});
