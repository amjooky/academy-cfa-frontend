import * as api from '../api';
import { mapEventFromApi } from './mappers';
import { safeLogoUrl } from './imageUtils';
import { toDateOnlyString } from './dateUtils';

export type ParentChild = {
  id: string;
  name: string;
  dob: string;
  position: string;
  team: string;
  status: string;
  xp: number;
  rank: string;
  hasLogin: boolean;
  childLoginEmail: string | null;
};

export type ParentData = {
  children: ParentChild[];
  events: ReturnType<typeof mapEventFromApi>[];
  subscriptions: any[];
  invoices: any[];
  recentEvaluations: any[];
  academyBranding: { name: string; shortName: string; logoUrl: string };
  childAccounts: { playerId: string; playerName: string; hasLogin: boolean; childLoginEmail: string | null }[];
};

function mapChildFromApi(p: any): ParentChild {
  return {
    id: p.id,
    name: p.full_name,
    dob: toDateOnlyString(p.dob),
    position: p.position || '—',
    team: p.team || '—',
    status: p.status || 'pending',
    xp: Number(p.xp_total) || 0,
    rank: p.rank || 'rookie',
    hasLogin: !!p.user_id,
    childLoginEmail: p.child_login_email || null,
  };
}

export async function loadParentData(): Promise<ParentData> {
  const [dashboard, calendar] = await Promise.all([
    api.getParentDashboard(),
    api.getParentCalendar(),
  ]);

  const profile = dashboard?.academyProfile;
  const brandingName = profile?.name || 'Chermiti Football Academy';
  const shortName =
    brandingName
      .split(/\s+/)
      .map((w: string) => w[0])
      .join('')
      .slice(0, 4)
      .toUpperCase() || 'CFA';

  const children = (dashboard?.children || []).map(mapChildFromApi);

  return {
    children,
    events: (calendar || []).map(mapEventFromApi),
    subscriptions: dashboard?.subscriptions || [],
    invoices: dashboard?.invoices || [],
    recentEvaluations: dashboard?.recentEvaluations || [],
    academyBranding: {
      name: brandingName,
      shortName: shortName.length >= 2 ? shortName : 'CFA',
      logoUrl: safeLogoUrl(profile?.logo_url),
    },
    childAccounts: dashboard?.childAccounts || [],
  };
}
