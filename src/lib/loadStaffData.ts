import * as api from '../api';
import {
  mapPlayerFromApi,
  mapEventFromApi,
  mapInvoiceFromApi,
  mapSubscriptionFromApi,
  mapPendingRegistration,
} from './mappers';
import { safeLogoUrl } from './imageUtils';

export type StaffData = {
  players: ReturnType<typeof mapPlayerFromApi>[];
  events: ReturnType<typeof mapEventFromApi>[];
  invoices: ReturnType<typeof mapInvoiceFromApi>[];
  subscriptions: ReturnType<typeof mapSubscriptionFromApi>[];
  pendingRegistrations: ReturnType<typeof mapPendingRegistration>[];
  dashboard: {
    totalPlayers: number;
    totalCoaches: number;
    upcomingEvents: number;
    kpiRevenueTnd: number;
    pendingInvoicesCount: number;
    pendingAmountTnd: number;
    avgSpeed: number;
    avgTechnique: number;
    avgTactical: number;
  };
  monthlyRevenue: { month: string; collected: number; expected: number }[];
  recentActivity: { icon: string; title: string; detail: string; at: string }[];
  branding: { name: string; shortName: string; logoUrl: string };
};

export async function loadStaffData(): Promise<StaffData> {
  const [
    loadedPlayers,
    loadedEvents,
    loadedInvoices,
    loadedSubs,
    pending,
    stats,
    overview,
    profile,
  ] = await Promise.all([
    api.getPlayers(),
    api.getEvents(),
    api.getInvoices(),
    api.getPlayerSubscriptions(),
    api.getPendingRegistrations(),
    api.getDashboardStats(),
    api.getPaymentOverview(),
    api.getAcademyProfile(),
  ]);

  const players = loadedPlayers.map(mapPlayerFromApi);
  const brandingName = profile?.name || 'Chermiti Football Academy';
  const shortName =
    brandingName
      .split(/\s+/)
      .map((w: string) => w[0])
      .join('')
      .slice(0, 4)
      .toUpperCase() || 'CFA';

  return {
    players,
    events: loadedEvents.map(mapEventFromApi),
    invoices: loadedInvoices.map(mapInvoiceFromApi),
    subscriptions: loadedSubs.map(mapSubscriptionFromApi),
    pendingRegistrations: pending.map(mapPendingRegistration),
    dashboard: {
      totalPlayers: stats?.summary?.totalPlayers ?? players.length,
      totalCoaches: stats?.summary?.totalCoaches ?? 0,
      upcomingEvents: stats?.summary?.upcomingEvents ?? 0,
      kpiRevenueTnd: stats?.summary?.kpiRevenueTnd ?? 0,
      pendingInvoicesCount: stats?.summary?.pendingInvoicesCount ?? 0,
      pendingAmountTnd: stats?.summary?.pendingAmountTnd ?? 0,
      avgSpeed: stats?.summary?.avgSpeed ?? 0,
      avgTechnique: stats?.summary?.avgTechnique ?? 0,
      avgTactical: stats?.summary?.avgTactical ?? 0,
    },
    monthlyRevenue: overview?.monthlyRevenue ?? [],
    recentActivity: stats?.recentActivity ?? [],
    branding: {
      name: brandingName,
      shortName: shortName.length >= 2 ? shortName : 'CFA',
      logoUrl: safeLogoUrl(profile?.logo_url),
    },
  };
}
