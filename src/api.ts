const AUTH_URL = import.meta.env.VITE_API_AUTH_URL || 'https://academy-saas-backend.onrender.com/api/v1/auth';
const ACADEMY_URL = import.meta.env.VITE_API_ACADEMY_URL || 'https://academy-saas-backend.onrender.com/api/v1/academy';
const PLANNING_URL = import.meta.env.VITE_API_PLANNING_URL || 'https://academy-saas-backend.onrender.com/api/v1/planning';
const AI_URL = import.meta.env.VITE_API_AI_URL || 'https://academy-saas-backend.onrender.com/api/v1/ai';
const PAYMENT_URL = import.meta.env.VITE_API_PAYMENT_URL || 'https://academy-saas-backend.onrender.com/api/v1/payment';
const PEDAGOGY_URL = import.meta.env.VITE_API_PEDAGOGY_URL || 'https://academy-saas-backend.onrender.com/api/v1/pedagogy';
const ANALYTICS_URL = import.meta.env.VITE_API_ANALYTICS_URL || 'https://academy-saas-backend.onrender.com/api/v1/analytics';
const GAMIFICATION_URL = import.meta.env.VITE_API_GAMIFICATION_URL || 'https://academy-saas-backend.onrender.com/api/v1/gamification';
const PARENT_URL = import.meta.env.VITE_API_PARENT_URL || 'https://academy-saas-backend.onrender.com/api/v1/parent';
const TENANT = import.meta.env.VITE_DEFAULT_TENANT || 'demo';

const headers = () => ({
  'Content-Type': 'application/json',
  'x-tenant-id': TENANT,
  ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}),
});

async function apiFetch(url: string, opts?: RequestInit) {
  const res = await fetch(url, { ...opts, headers: { ...headers(), ...(opts?.headers || {}) } });
  if (!res.ok) {
    let detail = `API error ${res.status}`;
    try {
      const body = await res.json();
      if (body.hint) detail = body.hint;
      else if (body.error) detail = body.error;
    } catch { /* ignore */ }
    throw new Error(detail);
  }
  return res.json();
}

export type AccountType = 'staff' | 'parent' | 'child';

// Auth
export const login = (email: string, password: string, accountType: AccountType = 'staff') =>
  apiFetch(`${AUTH_URL}/login`, { method: 'POST', body: JSON.stringify({ email, password, accountType }) });

export const register = (email: string, password: string, role: string) =>
  apiFetch(`${AUTH_URL}/register`, { method: 'POST', body: JSON.stringify({ email, password, role }) });

// Academy
export const getPlayers = () => apiFetch(`${ACADEMY_URL}/players`);
export const createPlayer = (data: any) =>
  apiFetch(`${ACADEMY_URL}/players`, { method: 'POST', body: JSON.stringify(data) });
export const getTeams = () => apiFetch(`${ACADEMY_URL}/teams`);

// Planning
export const getEvents = () => apiFetch(`${PLANNING_URL}/calendar`);
export const createEvent = (data: any) =>
  apiFetch(`${PLANNING_URL}/events`, { method: 'POST', body: JSON.stringify(data) });

// AI
export const generateScoutingReport = (playerId: string) =>
  apiFetch(`${AI_URL}/scout-report`, { method: 'POST', body: JSON.stringify({ playerId }) });

export const generateTrainingPlan = (focusArea: string, duration: string, team: string) =>
  apiFetch(`${AI_URL}/generate-plan`, { method: 'POST', body: JSON.stringify({ focusArea, durationMinutes: Number(duration), ageGroup: team }) });

export const generateProgressReport = (playerId: string) =>
  apiFetch(`${AI_URL}/progress-report`, { method: 'POST', body: JSON.stringify({ playerId }) });

// Registrations
export const registerPublic = (data: {
  parentEmail: string;
  parentPassword: string;
  parentPhone?: string;
  parentName?: string;
  fullName: string;
  dob: string;
  position: string;
  team: string;
  createChildAccount?: boolean;
  childEmail?: string;
  childPassword?: string;
  useSamePasswordAsParent?: boolean;
}) => apiFetch(`${ACADEMY_URL}/public/register`, { method: 'POST', body: JSON.stringify(data) });

export const getParentDashboard = () => apiFetch(`${PARENT_URL}/dashboard`);
export const getParentCalendar = () => apiFetch(`${PARENT_URL}/calendar`);
export const getPlayerCalendar = () => apiFetch(`${PARENT_URL}/player/calendar`);
export const getParentChild = (playerId: string) => apiFetch(`${PARENT_URL}/children/${playerId}`);
export const createChildLogin = (
  playerId: string,
  data: { childEmail: string; childPassword?: string; useParentPassword?: boolean }
) =>
  apiFetch(`${PARENT_URL}/children/${playerId}/create-login`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getPendingRegistrations = () =>
  apiFetch(`${ACADEMY_URL}/registrations`);

export const approveRegistration = (id: string, teamName?: string) =>
  apiFetch(`${ACADEMY_URL}/registrations/${id}/approve`, { method: 'POST', body: JSON.stringify({ teamName }) });

export const rejectRegistration = (id: string) =>
  apiFetch(`${ACADEMY_URL}/registrations/${id}/reject`, { method: 'POST' });

// Payment
export const getInvoices = () => apiFetch(`${PAYMENT_URL}/invoices`);
export const getPlayerSubscriptions = () => apiFetch(`${PAYMENT_URL}/player-subscriptions`);
export const getPaymentOverview = () => apiFetch(`${PAYMENT_URL}/overview`);
export const triggerPayment = (invoiceId: string, method?: string, adminNote?: string) =>
  apiFetch(`${PAYMENT_URL}/invoices/${invoiceId}/pay`, { method: 'POST', body: JSON.stringify({ method, adminNote }) });
export const createInvoice = (data: { playerId: string; amount: string; currency?: string; plan?: string }) =>
  apiFetch(`${PAYMENT_URL}/invoices`, { method: 'POST', body: JSON.stringify(data) });

export const getDashboardStats = () => apiFetch(`${ANALYTICS_URL}/stats`);

export const awardXp = (playerId: string, xpAmount: number) =>
  apiFetch(`${GAMIFICATION_URL}/xp/award`, { method: 'POST', body: JSON.stringify({ playerId, xpAmount }) });

// Pedagogy
export const getPlayerEvaluations = (playerId: string) =>
  apiFetch(`${PEDAGOGY_URL}/evaluations/player/${playerId}`);

export const createEvaluation = (data: { playerId: string; scores: Record<string, number>; overall: number; notes: string }) =>
  apiFetch(`${PEDAGOGY_URL}/evaluations`, { method: 'POST', body: JSON.stringify(data) });

export const getExercises = (category?: string) =>
  apiFetch(`${PEDAGOGY_URL}/exercises${category ? `?category=${category}` : ''}`);

// Academy Profile (Settings)
export const getAcademyProfile = () =>
  apiFetch(`${ACADEMY_URL}/profile`);

export const updateAcademyProfile = (data: {
  name: string; logoUrl: string; primaryColor: string; secondaryColor: string; language: string;
}) => apiFetch(`${ACADEMY_URL}/profile`, { method: 'PUT', body: JSON.stringify(data) });

