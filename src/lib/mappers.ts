import { toDateOnlyString } from './dateUtils';
import { safePhotoUrl } from './imageUtils';

export const PLAN_LABELS: Record<string, string> = {
  monthly: 'Mensuel',
  quarterly: 'Trimestriel',
  semester: 'Semestriel',
  annual: 'Annuel',
};

export const PLAN_AMOUNTS: Record<string, number> = {
  monthly: 120,
  quarterly: 340,
  semester: 650,
  annual: 1200,
};

export const PLAN_COLORS: Record<string, string> = {
  monthly: '#38bdf8',
  quarterly: '#a78bfa',
  semester: '#f59e0b',
  annual: '#10b981',
};

const TEAM_ID_TO_NAME: Record<string, string> = {
  'team-u17': 'U17 Elite',
  'team-u15': 'U15 Pro',
  'team-u13': 'U13 Rookie',
};

export function mapPlayerFromApi(p: any) {
  return {
    id: p.id,
    name: p.full_name,
    dob: toDateOnlyString(p.dob),
    position: p.position || 'Midfielder',
    team: p.team || TEAM_ID_TO_NAME[p.team_id] || '—',
    xp: Number(p.xp_total) || 0,
    rank: p.rank || 'rookie',
    status: p.status || 'active',
    photoUrl: safePhotoUrl(p.photo_url),
  };
}

export function mapEventFromApi(ev: any) {
  const startRaw = ev.starts_at || ev.startsAt;
  const endRaw = ev.ends_at || ev.endsAt;
  const startDate = startRaw ? new Date(startRaw) : new Date();
  const endDate = endRaw ? new Date(endRaw) : startDate;
  return {
    id: ev.id,
    title: ev.title,
    type: String(ev.type || 'training').toLowerCase(),
    team: ev.team || TEAM_ID_TO_NAME[ev.team_id] || '—',
    location: ev.location || 'Pitch A',
    startsAt: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    endsAt: endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    date: startDate.toISOString().split('T')[0],
  };
}

export function mapInvoiceFromApi(inv: any) {
  const issuedDate = toDateOnlyString(inv.issued_at);
  const paidDate = inv.paid_at ? toDateOnlyString(inv.paid_at) : '';
  return {
    id: inv.id,
    playerId: inv.player_id,
    name: inv.full_name || inv.player_name || 'Player',
    amount: String(inv.amount),
    currency: inv.currency || 'TND',
    status: inv.status === 'completed' ? 'completed' : 'pending',
    date: issuedDate,
    paidDate,
    paid_manually: !!inv.paid_manually,
    admin_note: inv.admin_note,
    plan: inv.plan || null,
  };
}

export function parseInvoiceAmount(amount: string | number | undefined): number {
  if (amount == null || amount === '') return 0;
  const n = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/** Month bucket for "Collecté ce mois" — use payment date when paid, else issue date. */
export function invoiceCollectedInMonth(
  inv: { status: string; paidDate?: string; date?: string },
  yearMonth: string
): boolean {
  if (inv.status !== 'completed') return false;
  const bucket = inv.paidDate || inv.date || '';
  return bucket.startsWith(yearMonth);
}

export function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function mapSubscriptionFromApi(s: any) {
  return {
    id: s.id,
    playerId: s.player_id,
    playerName: s.player_name || s.full_name,
    parentName: s.parent_label || s.parent_email || '—',
    plan: s.plan || 'monthly',
    amount: Number(s.amount) || PLAN_AMOUNTS[s.plan] || 120,
    currency: s.currency || 'TND',
    status: s.status || 'pending',
    nextDue: s.next_due ? String(s.next_due).split('T')[0] : '',
    team: s.team || '—',
  };
}

export function mapPendingRegistration(p: any) {
  return {
    id: p.id,
    name: p.full_name,
    dob: toDateOnlyString(p.dob),
    position: p.position || 'Playmaker',
    team: p.team || 'U13 Rookie',
    status: p.status || 'pending',
    parentEmail: p.parent_email || '',
    parentName: p.parent_name || '',
    parentPhone: p.parent_phone || '',
  };
}

export function parseEvalScores(evalRow: any) {
  if (!evalRow) return null;
  try {
    const scores = typeof evalRow.scores === 'string' ? JSON.parse(evalRow.scores) : evalRow.scores;
    return {
      technical: scores.technique ?? scores.technical ?? 0,
      speed: scores.speed ?? 0,
      tactical: scores.tactics ?? scores.tactical ?? 0,
      notes: evalRow.notes || '',
      overall: evalRow.overall,
    };
  } catch {
    return null;
  }
}

export function isOverdue(dateStr: string) {
  if (!dateStr) return false;
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  return diffDays > 30;
}
