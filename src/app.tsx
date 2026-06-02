import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useI18n, LanguageSwitcher } from './lib/i18n/useI18n';
import * as api from './api';
import LoginScreen from './components/LoginScreen';
import LandingPage from './components/LandingPage';
import NotificationPanel, { Notification } from './components/NotificationPanel';
import SettingsTab from './components/SettingsTab';
import PublicRegistrationPage from './components/PublicRegistrationPage';
import PendingRegistrationCard from './components/PendingRegistrationCard';
import ApplicationTimeline from './components/ApplicationTimeline';
import MarkAsPaidModal from './components/MarkAsPaidModal';
import IssueInvoiceModal from './components/IssueInvoiceModal';
import TablePagination from './components/TablePagination';
import { usePagination } from './lib/usePagination';
import { loadStaffData } from './lib/loadStaffData';
import { loadParentData, type ParentChild } from './lib/loadParentData';
import {
  PLAN_LABELS,
  PLAN_AMOUNTS,
  PLAN_COLORS,
  mapPendingRegistration,
  mapEventFromApi,
  parseEvalScores,
  isOverdue,
  currentYearMonth,
  invoiceCollectedInMonth,
  parseInvoiceAmount,
} from './lib/mappers';
import {
  filterAndSortEvents,
  EVENT_TIMELINE_LABELS,
  type EventTimelineFilter,
} from './lib/eventFilters';
import { safeLogoUrl, handleImgFallback, DEFAULT_LOGO } from './lib/imageUtils';
import { getPedagogyEmptyMessage, getEvalHistoryEmptyMessage } from './lib/messages';
import { formatProgressReportText, buildOfflineProgressReport } from './lib/formatProgressReport';

function nextDueFromPlan(plan: string): string {
  const d = new Date();
  if (plan === 'annual') d.setFullYear(d.getFullYear() + 1);
  else if (plan === 'semester') d.setMonth(d.getMonth() + 6);
  else if (plan === 'quarterly') d.setMonth(d.getMonth() + 3);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
}

export default function App() {
  const { t, isRTL } = useI18n();
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const token = localStorage.getItem('token');
    return !!token && token !== 'demo-token';
  });
  const [user, setUser] = useState<{
    email: string;
    role: 'ACADEMY_ADMIN' | 'COACH' | 'PARENT' | 'PLAYER';
    children?: Array<{ id: string; full_name: string; team?: string; status?: string }>;
    playerProfile?: { id: string; full_name: string; team?: string; position?: string };
  }>(() => {
    try {
      const saved = localStorage.getItem('user');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return { email: '', role: 'ACADEMY_ADMIN' };
  });

  const isStaff = user.role === 'ACADEMY_ADMIN' || user.role === 'COACH';
  const isParent = user.role === 'PARENT';
  const isChild = user.role === 'PLAYER';

  const handleAuthSuccess = useCallback((authUser: typeof user, accessToken: string) => {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(authUser));
    setUser(authUser);
    setIsLoggedIn(true);
    setIsRegistering(false);
    setIsConnected(true);
    if (authUser.role === 'PLAYER') setActiveTab('pedagogy');
    else if (authUser.role === 'PARENT') setActiveTab('dashboard');
    else setActiveTab('dashboard');
  }, []);

  // Notification system
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const pushNotification = useCallback((n: Omit<Notification, 'id' | 'time' | 'read'>) => {
    setNotifications(prev => [{
      ...n,
      id: `notif-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    }, ...prev].slice(0, 30));
  }, []);
  const dismissNotification = (id: string) => setNotifications(p => p.filter(n => n.id !== id));
  const clearNotifications  = () => setNotifications([]);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'roster' | 'planning' | 'pedagogy' | 'payment' | 'ai' | 'settings'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('sidebar-open', sidebarOpen);
    return () => document.body.classList.remove('sidebar-open');
  }, [sidebarOpen]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [activeTab]);
  const [players, setPlayers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [academyBranding, setAcademyBranding] = useState({
    name: 'Chermiti Football Academy',
    shortName: 'CFA',
    logoUrl: '/logo-cfa.png',
  });
  const [invoices, setInvoices] = useState<any[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; collected: number; expected: number }[]>([]);
  const [recentActivity, setRecentActivity] = useState<{ icon: string; title: string; detail: string; at: string }[]>([]);
  const [dashboard, setDashboard] = useState({
    totalPlayers: 0,
    totalCoaches: 0,
    upcomingEvents: 0,
    kpiRevenueTnd: 0,
    pendingInvoicesCount: 0,
    pendingAmountTnd: 0,
    avgSpeed: 0,
    avgTechnique: 0,
    avgTactical: 0,
  });
  const [dataLoading, setDataLoading] = useState(false);
  const [parentChildren, setParentChildren] = useState<ParentChild[]>([]);
  const [parentSubscriptions, setParentSubscriptions] = useState<any[]>([]);
  // const [parentInvoices, setParentInvoices] = useState<any[]>([]);
  // const [parentEvaluations, setParentEvaluations] = useState<any[]>([]);
  const [childAccounts, setChildAccounts] = useState<{ playerId: string; playerName: string; hasLogin: boolean; childLoginEmail: string | null }[]>([]);
  const [selectedParentChild, setSelectedParentChild] = useState<ParentChild | null>(null);
  const [createLoginPlayerId, setCreateLoginPlayerId] = useState<string | null>(null);
  const [childLoginEmail, setChildLoginEmail] = useState('');
  const [childLoginPassword, setChildLoginPassword] = useState('');
  const [useSamePasswordForChild, setUseSamePasswordForChild] = useState(true);
  const [isCreatingChildLogin, setIsCreatingChildLogin] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  const [selectedAiPlayer, setSelectedAiPlayer] = useState<any | null>(null);
  const [scoutingReport, setScoutingReport] = useState<any>(null);
  const [aiPlan, setAiPlan] = useState<any>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [activeTeamFilter, setActiveTeamFilter] = useState('All');
  const [isConnected, setIsConnected] = useState(false);

  // Input form state variables
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPos, setNewPlayerPos] = useState('Playmaker');
  const [newPlayerTeam, setNewPlayerTeam] = useState('U17 Elite');
  
  // AI prompt state variables
  const [aiFocusArea, setAiFocusArea] = useState('technical');
  const [aiDuration, setAiDuration] = useState('60');

  // Attendance feedback state
  const [markedEvents, setMarkedEvents] = useState<string[]>([]);

  // Scheduling Event Modal state
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState('training');
  const [eventTeam, setEventTeam] = useState('U17 Elite');
  const [eventLoc, setEventLoc] = useState('');
  const [eventDate, setEventDate] = useState('2026-05-20');
  const [eventStartsAt, setEventStartsAt] = useState('16:00');
  const [eventEndsAt, setEventEndsAt] = useState('18:00');
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [eventTimelineFilter, setEventTimelineFilter] = useState<EventTimelineFilter>('upcoming');
  const [eventFilterFrom, setEventFilterFrom] = useState('');
  const [eventFilterTo, setEventFilterTo] = useState('');

  // Pedagogy evaluation state
  const [evalHistory, setEvalHistory] = useState<any[]>([]);
  const [isLoadingEval, setIsLoadingEval] = useState(false);
  const [evalSpeed, setEvalSpeed] = useState('7');
  const [evalTechnique, setEvalTechnique] = useState('7');
  const [evalTactics, setEvalTactics] = useState('7');
  const [evalNotes, setEvalNotes] = useState('');
  const [isSubmittingEval, setIsSubmittingEval] = useState(false);
  const [evalSubmitMsg, setEvalSubmitMsg] = useState('');

  // ── 100% Roadmap State declarations ────────────────────────
  const [playerDocuments, setPlayerDocuments] = useState<Record<string, Array<{ name: string; type: string; size: string; status: 'verified' | 'pending'; date: string }>>>({
    'p1': [
      { name: 'medical_certificate.pdf', type: 'PDF', size: '1.2 MB', status: 'verified', date: '2026-05-01' },
      { name: 'national_id_copy.jpg', type: 'IMAGE', size: '450 KB', status: 'verified', date: '2026-05-01' }
    ],
    'p2': [
      { name: 'medical_certificate.pdf', type: 'PDF', size: '1.4 MB', status: 'verified', date: '2026-05-02' }
    ],
    'p3': [
      { name: 'medical_certificate.pdf', type: 'PDF', size: '1.1 MB', status: 'pending', date: '2026-05-10' }
    ]
  });
  const [vaultPlayer, setVaultPlayer] = useState<any>(null);

  const [activeAttendanceEvent, setActiveAttendanceEvent] = useState<any>(null);
  const [attendanceStatuses, setAttendanceStatuses] = useState<Record<string, 'present' | 'absent' | 'excused'>>({});
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Online registration & Pending review board states
  const [isRegistering, setIsRegistering] = useState(false);
  const [pendingRegistrations, setPendingRegistrations] = useState<any[]>([]);

  // Landing page routing state
  const [showLanding, setShowLanding] = useState(true);
  const [loginInitialTab, setLoginInitialTab] = useState<'parent' | 'child' | 'staff'>('staff');

  // Payment modal state overrides
  const [selectedMarkAsPaidInvoice, setSelectedMarkAsPaidInvoice] = useState<any>(null);
  const [isMarkAsPaidLoading, setIsMarkAsPaidLoading] = useState(false);
  const [isIssueInvoiceOpen, setIsIssueInvoiceOpen] = useState(false);
  const [isIssueInvoiceLoading, setIsIssueInvoiceLoading] = useState(false);

  const fetchPendingRegistrations = useCallback(async () => {
    try {
      const data = await api.getPendingRegistrations();
      setPendingRegistrations(data.map(mapPendingRegistration));
    } catch (err) {
      console.warn('Failed to load pending registrations:', err);
      setPendingRegistrations([]);
    }
  }, []);

  const reloadStaffData = useCallback(async () => {
    setDataLoading(true);
    try {
      const data = await loadStaffData();
      setPlayers(data.players);
      setEvents(data.events);
      setInvoices(data.invoices);
      setSubscriptions(data.subscriptions);
      setPendingRegistrations(data.pendingRegistrations);
      setDashboard(data.dashboard);
      setMonthlyRevenue(data.monthlyRevenue);
      setRecentActivity(data.recentActivity);
      setAcademyBranding(data.branding);
      setSelectedPlayer((prev: any) => {
        if (prev && data.players.some(p => p.id === prev.id)) return prev;
        return data.players[0] || null;
      });
      setSelectedAiPlayer((prev: any) => {
        if (prev && data.players.some(p => p.id === prev.id)) return prev;
        return data.players[0] || null;
      });
      setIsConnected(true);
    } catch (err) {
      console.error('Failed to load staff data:', err);
      setIsConnected(false);
    } finally {
      setDataLoading(false);
    }
  }, []);

  // Document Vault Actions
  const handleUploadDocument = (fileName: string) => {
    if (!vaultPlayer) return;
    const newDoc = {
      name: fileName,
      type: fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.png') ? 'IMAGE' : 'PDF',
      size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
      status: 'pending' as const,
      date: new Date().toISOString().split('T')[0]
    };
    setPlayerDocuments(prev => ({
      ...prev,
      [vaultPlayer.id]: [...(prev[vaultPlayer.id] || []), newDoc]
    }));
    pushNotification({
      icon: '⚙️',
      title: 'Document Uploaded',
      body: `"${fileName}" uploaded to ${vaultPlayer.name}'s vault.`,
      type: 'system'
    });
  };

  const handleVerifyDocument = (docName: string) => {
    if (!vaultPlayer) return;
    setPlayerDocuments(prev => ({
      ...prev,
      [vaultPlayer.id]: (prev[vaultPlayer.id] || []).map(doc =>
        doc.name === docName ? { ...doc, status: 'verified' } : doc
      )
    }));
    pushNotification({
      icon: '⚙️',
      title: 'Document Verified',
      body: `"${docName}" in ${vaultPlayer.name}'s vault has been verified.`,
      type: 'system'
    });
  };

  // Roll-Call Submit Action
  const handleSubmitRollCall = () => {
    if (!activeAttendanceEvent) return;
    let presentCount = 0;
    setPlayers(prev => prev.map(p => {
      const status = attendanceStatuses[p.id] || 'absent';
      if (status === 'present') {
        presentCount++;
        const newXp = p.xp + 25;
        let newRank = p.rank;
        if (newXp >= 1000) newRank = 'legend';
        else if (newXp >= 500) newRank = 'elite';
        else if (newXp >= 200) newRank = 'pro';

        if (newRank !== p.rank) {
          pushNotification({
            icon: '🏆',
            title: 'Player Rank Up!',
            body: `${p.name} promoted to ${newRank.toUpperCase()} (XP: ${newXp})!`,
            type: 'xp'
          });
        }
        return { ...p, xp: newXp, rank: newRank };
      }
      return p;
    }));

    setMarkedEvents(prev => [...prev, activeAttendanceEvent.id]);
    pushNotification({
      icon: '📋',
      title: 'Roll Call Submitted',
      body: `Attendance marked for ${activeAttendanceEvent.title}. ${presentCount} present, +25 XP granted.`,
      type: 'eval'
    });
    setActiveAttendanceEvent(null);
  };

  const downloadProgressReportFile = (p: { name: string }, text: string) => {
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${p.name.replace(/\s+/g, '_')}_Progress_Report.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleExportPdfReport = async (p: any) => {
    setIsExportingPdf(true);
    pushNotification({
      icon: '⚙️',
      title: 'Generating Report',
      body: `AI is compiling the progress dossier for ${p.name}...`,
      type: 'system',
    });
    try {
      const data = await api.generateProgressReport(p.id);
      const text = formatProgressReportText({
        playerName: data.playerName || p.name,
        team: data.team || p.team,
        position: data.position || p.position,
        dob: data.dob,
        age: data.age,
        xp: data.xp ?? p.xp,
        rank: data.rank || p.rank,
        metrics: data.metrics,
        report: data.report,
        engine: data.engine,
        generatedAt: data.generatedAt,
      });
      downloadProgressReportFile(p, text);
      pushNotification({
        icon: '📋',
        title: 'Report Downloaded',
        body: `AI progress dossier downloaded for ${p.name}.`,
        type: 'eval',
      });
    } catch (err) {
      console.warn('AI progress report failed, using offline fallback:', err);
      const ped = getPlayerPedagogy(p);
      const offline = buildOfflineProgressReport(p, ped);
      downloadProgressReportFile(p, formatProgressReportText(offline));
      pushNotification({
        icon: '⚠️',
        title: 'Report Downloaded (Offline)',
        body: `Progress dossier for ${p.name} used local evaluation data — AI service was unavailable.`,
        type: 'system',
      });
    } finally {
      setIsExportingPdf(false);
    }
  };


  const reloadParentData = useCallback(async () => {
    setDataLoading(true);
    try {
      const data = await loadParentData();
      setParentChildren(data.children);
      setEvents(data.events);
      setParentSubscriptions(data.subscriptions);
      // setParentInvoices(data.invoices);
      // setParentEvaluations(data.recentEvaluations);
      setChildAccounts(data.childAccounts);
      setAcademyBranding(data.academyBranding);
      setSelectedParentChild(prev => {
        const next = prev && data.children.some(c => c.id === prev.id) ? prev : data.children[0] || null;
        if (next) {
          setSelectedPlayer({
            id: next.id,
            name: next.name,
            dob: next.dob,
            position: next.position,
            team: next.team,
            xp: next.xp,
            rank: next.rank,
          });
        }
        return next;
      });
      setIsConnected(true);
    } catch (err) {
      console.error('Failed to load parent data:', err);
      setIsConnected(false);
    } finally {
      setDataLoading(false);
    }
  }, []);

  const handleCreateChildLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createLoginPlayerId) return;
    setIsCreatingChildLogin(true);
    try {
      await api.createChildLogin(createLoginPlayerId, {
        childEmail: childLoginEmail.trim(),
        childPassword: useSamePasswordForChild ? undefined : childLoginPassword,
        useParentPassword: useSamePasswordForChild,
      });
      pushNotification({
        icon: '✅',
        title: 'Child login created',
        body: `${childLoginEmail} can sign in on the Enfant tab.`,
        type: 'enrollment',
      });
      setCreateLoginPlayerId(null);
      setChildLoginEmail('');
      setChildLoginPassword('');
      await reloadParentData();
    } catch (err: any) {
      pushNotification({ icon: '⚠️', title: 'Failed', body: String(err?.message || err), type: 'system' });
    } finally {
      setIsCreatingChildLogin(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn || !isStaff) return;
    reloadStaffData();
  }, [isLoggedIn, isStaff, reloadStaffData]);

  useEffect(() => {
    if (!isLoggedIn || !isParent) return;
    reloadParentData();
  }, [isLoggedIn, isParent, reloadParentData]);

  useEffect(() => {
    if (!isLoggedIn || !isChild || !user.playerProfile?.id) return;
    const p = user.playerProfile;
    setSelectedPlayer({
      id: p.id,
      name: p.full_name,
      dob: '',
      position: p.position || '—',
      team: p.team || '—',
      xp: 0,
      rank: 'rookie',
    });
    setDataLoading(true);
    api.getPlayerCalendar()
      .then(cal => setEvents(cal.map((ev: any) => mapEventFromApi(ev))))
      .catch(() => setEvents([]))
      .finally(() => {
        setDataLoading(false);
        setIsConnected(true);
      });
    api.getAcademyProfile()
      .then(profile => {
        if (profile?.name) {
          const short = profile.name.split(/\s+/).map((w: string) => w[0]).join('').slice(0, 4).toUpperCase() || 'CFA';
          setAcademyBranding({
            name: profile.name,
            shortName: short.length >= 2 ? short : 'CFA',
            logoUrl: safeLogoUrl(profile.logo_url),
          });
        }
      })
      .catch(() => { /* keep default */ });
  }, [isLoggedIn, isChild, user.playerProfile]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!selectedPlayer?.id || !token || token === 'demo-token') return;
    if (isStaff || isParent || isChild) {
      setIsLoadingEval(true);
      setEvalHistory([]);
      api.getPlayerEvaluations(selectedPlayer.id)
        .then(data => setEvalHistory(data))
        .catch(() => setEvalHistory([]))
        .finally(() => setIsLoadingEval(false));
    }
  }, [selectedPlayer?.id, isLoggedIn, isStaff, isParent, isChild]);

  // Submit new evaluation
  const handleSubmitEval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer?.id) return;
    setIsSubmittingEval(true);
    setEvalSubmitMsg('');
    const overall = Math.round((Number(evalSpeed) + Number(evalTechnique) + Number(evalTactics)) / 3);
    try {
      await api.createEvaluation({
        playerId: selectedPlayer.id,
        scores: { speed: Number(evalSpeed), technique: Number(evalTechnique), tactics: Number(evalTactics) },
        overall,
        notes: evalNotes
      });
      setEvalSubmitMsg('✅ Evaluation saved to database.');
      pushNotification({
        icon: '📋',
        title: 'Evaluation Submitted',
        body: `Assessment for ${selectedPlayer.name} saved (overall: ${overall}/10).`,
        type: 'eval'
      });
      const updated = await api.getPlayerEvaluations(selectedPlayer.id);
      setEvalHistory(updated);
      setEvalNotes('');
      await reloadStaffData();
    } catch (err) {
      setEvalSubmitMsg(`Failed: ${err instanceof Error ? err.message : 'save error'}`);
    }
    setIsSubmittingEval(false);
    setTimeout(() => setEvalSubmitMsg(''), 3000);
  };

  // Award XP Trigger
  const handleAwardXp = async (id: string, amount: number) => {
    const target = players.find(p => p.id === id);
    try {
      await api.awardXp(id, amount);
    } catch (err) {
      console.warn('Backend awardXp failed, updating state locally:', err);
    }
    setPlayers(prev => prev.map(p => {
      if (p.id === id) {
        const nextXp = p.xp + amount;
        let nextRank = 'rookie';
        if (nextXp >= 5000) nextRank = 'legend';
        else if (nextXp >= 3000) nextRank = 'elite';
        else if (nextXp >= 1500) nextRank = 'pro';
        else if (nextXp >= 500) nextRank = 'challenger';
        const ranked = nextRank !== p.rank;
        pushNotification({
          icon: ranked ? '🏆' : '⚡',
          title: ranked ? `Rank Up! ${target?.name}` : `+${amount} XP — ${target?.name}`,
          body: ranked
            ? `${target?.name} advanced from ${p.rank} → ${nextRank}!`
            : `Total XP: ${nextXp}`,
          type: 'xp'
        });
        return { ...p, xp: nextXp, rank: nextRank };
      }
      return p;
    }));
  };

  // Add new player CRUD
  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) {
      alert("Please enter the player's full name.");
      return;
    }
    try {
      await api.createPlayer({
        userId: '00000000-0000-0000-0000-000000000001',
        fullName: newPlayerName.trim(),
        dob: '2011-10-10',
        position: newPlayerPos,
        photoUrl: '',
        team: newPlayerTeam
      });
      await reloadStaffData();
      pushNotification({
        icon: '🎿',
        title: 'Player Enrolled',
        body: `${newPlayerName.trim()} joined ${newPlayerTeam}.`,
        type: 'enrollment'
      });
    } catch (err) {
      console.warn('Failed to create player:', err);
      pushNotification({ icon: '⚠️', title: 'Enrollment failed', body: String(err), type: 'enrollment' });
    }
    setNewPlayerName('');
  };

  // Dynamic AI Scouting generation
  const handleGenerateScoutingReport = async (p: any) => {
    setIsGeneratingReport(true);
    setScoutingReport(null);
    try {
      const data = await api.generateScoutingReport(p.id);
      setScoutingReport({
        name: data.playerName || p.name,
        avgSpeed: data.metrics?.speedRating || 7,
        avgTech: data.metrics?.technicalRating || 7,
        avgTactics: data.metrics?.tacticsRating || 7,
        position: data.aiAnalysis?.recommendedPosition || 'Midfielder',
        developmentPlan: data.aiAnalysis?.coachActionPlan || ['Regular agility drills.']
      });
    } catch (err) {
      console.warn('Backend Scouting Report failed, utilizing fallback simulation:', err);
      setTimeout(() => {
        let recommendedPosition = 'Central Defensive Midfielder';
        let actions = ['Weekly agility ladder drills.', 'Sustained endurance interval drills twice per week.'];
        if (p.xp > 4000) {
          recommendedPosition = 'Attacking Winger / Target Forward';
          actions = ['1v1 offensive counter-press situations.', 'Target practicing at bottom corners.'];
        }
        setScoutingReport({
          name: p.name,
          avgSpeed: Math.round(7 + Math.random() * 3),
          avgTech: Math.round(6 + Math.random() * 4),
          avgTactics: Math.round(5 + Math.random() * 5),
          position: recommendedPosition,
          developmentPlan: actions
        });
        setIsGeneratingReport(false);
      }, 1000);
      return;
    }
    setIsGeneratingReport(false);
  };

  // Dynamic AI Training generation
  const handleGenerateTrainingPlan = async () => {
    setIsGeneratingPlan(true);
    setAiPlan(null);
    try {
      const data = await api.generateTrainingPlan(aiFocusArea, aiDuration, newPlayerTeam);
      setAiPlan({
        focus: aiFocusArea,
        duration: aiDuration,
        stages: data.timeline?.map((t: any) => ({
          name: t.exerciseName,
          mins: `${t.duration} mins`,
          instructions: t.details
        })) || [],
        engine: data.engine || 'Qwen AI (Active)'
      });
    } catch (err) {
      console.warn('Backend generateTrainingPlan failed, utilizing simulation:', err);
      setTimeout(() => {
        const totalMin = Number(aiDuration) || 60;
        const warmUp = Math.round(totalMin * 0.15);
        const core = Math.round(totalMin * 0.50);
        const scrimmage = Math.round(totalMin * 0.25);
        const cooldown = totalMin - (warmUp + core + scrimmage);

        let coreTitle = `Core ${aiFocusArea.toUpperCase()} Drills`;
        let coreDesc = `Repetitive exercises focusing heavily on ${aiFocusArea} development.`;
        let scrimmageDesc = 'Restricted small-sided game applying today\'s key learnings.';

        if (aiFocusArea === 'technical') {
          coreTitle = 'Precision Triangle Passing & Dribbling';
          coreDesc = 'One-touch passing combinations in restricted grids, practicing dynamic escape dribbles under close guarding.';
          scrimmageDesc = 'Controlled 4v4 game where goals only count after a completed dribble beat in the third line.';
        } else if (aiFocusArea === 'tactical') {
          coreTitle = 'Defensive Low-Block & Central Pressing';
          coreDesc = 'Setting up defensive shape coordinates and practicing coordinated pressing movements when ball is played wide.';
          scrimmageDesc = 'Half-pitch tactical play where the defending team gets points for winning possession inside the press zone.';
        } else if (aiFocusArea === 'stamina') {
          coreTitle = 'High-Intensity Interval Sprints (Fartlek)';
          coreDesc = 'Repetitive speed bursts alternating with active recovery jogs, building physical aerobic recovery thresholds.';
          scrimmageDesc = 'High-tempo full-field scrimmage with rapid line changes to keep athletic intensity maximized.';
        }

        setAiPlan({
          focus: aiFocusArea,
          duration: aiDuration,
          stages: [
            { name: 'Warm-up stretching runs', mins: `${warmUp} mins`, instructions: 'Dynamic jog around field bounds' },
            { name: coreTitle, mins: `${core} mins`, instructions: coreDesc },
            { name: 'Scrimmage adaptation play', mins: `${scrimmage} mins`, instructions: scrimmageDesc },
            { name: 'Cooldown stretches', mins: `${cooldown} mins`, instructions: 'Static hamstrings release work' }
          ],
          engine: 'Simulation Fallback'
        });
        setIsGeneratingPlan(false);
      }, 1000);
      return;
    }
    setIsGeneratingPlan(false);
  };

  // Add Event trigger
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    const start = new Date(`${eventDate}T${eventStartsAt}:00`);
    const end = new Date(`${eventDate}T${eventEndsAt}:00`);
    if (end <= start) {
      pushNotification({ icon: '⚠️', title: 'Invalid times', body: 'End time must be after start time.', type: 'system' });
      return;
    }

    setIsSubmittingEvent(true);

    let resolvedTeamId = 'team-u17';
    if (eventTeam === 'U15 Pro') resolvedTeamId = 'team-u15';
    else if (eventTeam === 'U13 Rookie') resolvedTeamId = 'team-u13';

    const normalizedType = eventType.toLowerCase();
    const startsAtISO = start.toISOString();
    const endsAtISO = end.toISOString();

    try {
      await api.createEvent({
        title: eventTitle.trim(),
        type: normalizedType,
        teamId: resolvedTeamId,
        location: eventLoc || 'Pitch A',
        startsAt: startsAtISO,
        endsAt: endsAtISO
      });
      await reloadStaffData();
      pushNotification({ icon: '📅', title: 'Event scheduled', body: eventTitle.trim(), type: 'system' });
    } catch (err) {
      console.warn('Failed to create event:', err);
      pushNotification({ icon: '⚠️', title: 'Event failed', body: String(err), type: 'system' });
    }

    setEventTitle('');
    setEventType('training');
    setIsAddEventOpen(false);
    setIsSubmittingEvent(false);
  };

  // Mark Attendance trigger
  const handleMarkAttendance = (ev: any) => {
    setActiveAttendanceEvent(ev);
    const filtered = players.filter(p => ev.team === 'All' || p.team === ev.team);
    const defaults: Record<string, 'present' | 'absent' | 'excused'> = {};
    filtered.forEach(p => {
      defaults[p.id] = 'present';
    });
    setAttendanceStatuses(defaults);
  };


  const getPlayerPedagogy = (p: any) => {
    const latest = evalHistory[0];
    const parsed = parseEvalScores(latest);
    if (parsed) {
      return {
        technical: parsed.technical,
        speed: parsed.speed,
        tactical: parsed.tactical,
        notes: parsed.notes || 'No coach notes yet.',
      };
    }
    return {
      technical: dashboard.avgTechnique / 10 || 0,
      speed: dashboard.avgSpeed / 10 || 0,
      tactical: dashboard.avgTactical / 10 || 0,
      notes: p ? `No evaluation on file for ${p.name}. Submit an assessment below.` : 'Select a player.',
    };
  };



  const handleApproveRegistration = async (id: string, teamName: string) => {
    try {
      await api.approveRegistration(id, teamName);
      pushNotification({
        icon: '✅',
        title: 'Registration Approved',
        body: `Player approved and assigned to ${teamName}.`,
        type: 'enrollment'
      });
      await reloadStaffData();
    } catch (err) {
      console.warn('Failed to approve registration:', err);
      pushNotification({ icon: '⚠️', title: 'Approval failed', body: String(err), type: 'enrollment' });
    }
  };

  const handleRejectRegistration = async (id: string) => {
    try {
      await api.rejectRegistration(id);
      pushNotification({
        icon: '❌',
        title: 'Registration Rejected',
        body: 'Application has been rejected.',
        type: 'enrollment'
      });
      await reloadStaffData();
    } catch (err) {
      console.warn('Failed to reject registration:', err);
    }
  };

  const handleConfirmManualPayment = async (adminNote: string) => {
    if (!selectedMarkAsPaidInvoice) return;
    setIsMarkAsPaidLoading(true);
    const { id, name, source, subscriptionId, playerId } = selectedMarkAsPaidInvoice;

    const markSubscriptionPaid = () => {
      setSubscriptions(prev => prev.map(sub => {
        if (source === 'subscription' && sub.id === subscriptionId) {
          return { ...sub, status: 'active', nextDue: nextDueFromPlan(sub.plan) };
        }
        if (playerId && sub.playerId === playerId) {
          return { ...sub, status: 'active', nextDue: nextDueFromPlan(sub.plan) };
        }
        return sub;
      }));
    };

    const todayYm = currentYearMonth();
    const todayDate = `${todayYm}-${String(new Date().getDate()).padStart(2, '0')}`;

    try {
      let paidInvoiceId: string | null = null;
      if (source === 'subscription') {
        const matchingInvoice = invoices.find(
          inv =>
            inv.status !== 'completed' &&
            !String(inv.id).startsWith('sub-') &&
            ((playerId && inv.playerId === playerId) || inv.name === name)
        );
        if (matchingInvoice) {
          paidInvoiceId = matchingInvoice.id;
          await api.triggerPayment(matchingInvoice.id, 'ADMIN_OVERRIDE', adminNote);
        }
        markSubscriptionPaid();
      } else {
        paidInvoiceId = id;
        await api.triggerPayment(id, 'ADMIN_OVERRIDE', adminNote);
        const sub = subscriptions.find(s => s.playerId === playerId || s.playerName === name);
        if (sub) {
          setSubscriptions(prev => prev.map(s =>
            (s.playerId === playerId || s.playerName === name)
              ? { ...s, status: 'active', nextDue: nextDueFromPlan(s.plan) }
              : s
          ));
        }
      }

      if (paidInvoiceId) {
        setInvoices(prev => prev.map(inv =>
          inv.id === paidInvoiceId
            ? { ...inv, status: 'completed', paidDate: todayDate, paid_manually: true }
            : inv
        ));
      }

      pushNotification({
        icon: '💳',
        title: 'Payment Audited',
        body: `Payment recorded for ${name}. Subscription status updated to ACTIF.`,
        type: 'system'
      });

      await reloadStaffData();
      setSelectedMarkAsPaidInvoice(null);
    } catch (err) {
      console.warn('Failed to mark payment:', err);
      pushNotification({ icon: '⚠️', title: 'Payment failed', body: String(err), type: 'system' });
    } finally {
      setIsMarkAsPaidLoading(false);
    }
  };

  const handleIssueNewInvoice = async (playerId: string, amount: string, plan?: string) => {
    setIsIssueInvoiceLoading(true);
    const targetPlayer = players.find(p => p.id === playerId);
    const playerName = targetPlayer ? targetPlayer.name : 'Player';
    try {
      await api.createInvoice({ playerId, amount, plan });
      pushNotification({
        icon: '💳',
        title: 'Invoice Issued',
        body: `Issued invoice of ${amount} TND to ${playerName}.`,
        type: 'system'
      });
      await reloadStaffData();
      setIsIssueInvoiceOpen(false);
    } catch (err) {
      console.warn('Failed to issue invoice:', err);
      pushNotification({ icon: '⚠️', title: 'Invoice failed', body: String(err), type: 'system' });
    } finally {
      setIsIssueInvoiceLoading(false);
    }
  };

  const filteredRosterPlayers = useMemo(
    () => players.filter(p => activeTeamFilter === 'All' || p.team === activeTeamFilter),
    [players, activeTeamFilter],
  );
  const rosterPagination = usePagination(filteredRosterPlayers);

  const pedagogyPlayerList = useMemo(() => {
    if (isParent) return parentChildren;
    if (isChild && selectedPlayer) return [selectedPlayer];
    return players;
  }, [isParent, isChild, parentChildren, selectedPlayer, players]);
  const pedagogyPagination = usePagination(pedagogyPlayerList);

  const subscriptionsPagination = usePagination(subscriptions);
  const invoicesPagination = usePagination(invoices);

  const filteredPlanningEvents = useMemo(
    () => filterAndSortEvents(events, eventTimelineFilter, eventFilterFrom, eventFilterTo),
    [events, eventTimelineFilter, eventFilterFrom, eventFilterTo],
  );

  // ── Auth gate — must come after all hooks ──────────────────────────────
  if (isRegistering) {
    return (
      <PublicRegistrationPage
        onBackToLogin={() => { setIsRegistering(false); setShowLanding(true); }}
        onRegistered={handleAuthSuccess}
      />
    );
  }

  if (!isLoggedIn) {
    if (showLanding) {
      return (
        <LandingPage
          onSelectPortal={(portal) => {
            setLoginInitialTab(portal);
            setShowLanding(false);
          }}
          onSelectRegister={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setIsLoggedIn(false);
            setIsRegistering(true);
            setShowLanding(false);
          }}
        />
      );
    }
    return (
      <LoginScreen
        onLogin={handleAuthSuccess}
        initialAccountType={loginInitialTab}
        onBackToHome={() => setShowLanding(true)}
        onRegisterClick={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsLoggedIn(false);
          setIsRegistering(true);
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <button
          type="button"
          className="app-sidebar-overlay"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`app-sidebar${sidebarOpen ? ' app-sidebar--open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', paddingBottom: '0.5rem' }}>
          <img
            src={safeLogoUrl(academyBranding.logoUrl)}
            alt="CFA"
            onError={e => handleImgFallback(e, DEFAULT_LOGO)}
            style={{
              width: '48px', height: '48px',
              objectFit: 'contain',
              borderRadius: '10px',
              filter: 'drop-shadow(0 0 8px rgba(220,38,38,0.45))',
              flexShrink: 0,
            }}
          />
          <div>
            <h1 style={{
              fontSize: '1.3rem', fontWeight: 900,
              background: 'linear-gradient(135deg, #ffffff 0%, #dc2626 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.04em', margin: 0, lineHeight: 1.1,
            }}>{academyBranding.shortName}</h1>
            <p style={{ fontSize: '0.62rem', color: '#4b5563', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0.15rem 0 0' }}>{academyBranding.name}</p>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexGrow: 1 }}>
          <button type="button" onClick={() => setActiveTab('dashboard')} className={`app-nav-btn${activeTab === 'dashboard' ? ' app-nav-btn--active' : ''}`}>
            <span>📊</span> {isParent ? t.nav.myFamily : isChild ? t.nav.myProfile : t.nav.dashboard}
          </button>
          {/* Tabs visible to ADMIN or COACH */}
          {(user.role === 'ACADEMY_ADMIN' || user.role === 'COACH') && (
            <button type="button" onClick={() => { setActiveTab('roster'); fetchPendingRegistrations(); }} className={`app-nav-btn${activeTab === 'roster' ? ' app-nav-btn--active' : ''}`} style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span>👥</span> {t.nav.rosters}
              </div>
              {pendingRegistrations.length > 0 && (
                <span style={{
                  background: '#f472b6',
                  color: 'white',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.4rem',
                  borderRadius: '20px',
                  lineHeight: 1,
                  boxShadow: '0 0 8px rgba(244, 114, 182, 0.5)'
                }}>
                  {pendingRegistrations.length}
                </span>
              )}
            </button>
          )}

          {/* Calendar, Pedagogy, AI Scouting, and Settings are hidden to simplify the application.
              They can be re-enabled here in the future if required. */}
          {/*
          {(isStaff || isParent || isChild) && (
          <button type="button" onClick={() => setActiveTab('planning')} className={`app-nav-btn${activeTab === 'planning' ? ' app-nav-btn--active' : ''}`}>
            <span>📅</span> Calendar
          </button>
          )}

          <button type="button" onClick={() => setActiveTab('pedagogy')} className={`app-nav-btn${activeTab === 'pedagogy' ? ' app-nav-btn--active' : ''}`}>
            <span>⚽</span> {isParent || isChild ? 'Progress' : 'Pedagogy'}
          </button>
          */}

          {/* Tabs visible ONLY to ADMIN */}
          {user.role === 'ACADEMY_ADMIN' && (
            <button type="button" onClick={() => setActiveTab('payment')} className={`app-nav-btn${activeTab === 'payment' ? ' app-nav-btn--active' : ''}`}>
              <span>💳</span> {t.nav.payment}
            </button>
          )}

          {/*
          {(user.role === 'ACADEMY_ADMIN' || user.role === 'COACH') && (
            <button type="button" onClick={() => setActiveTab('ai')} className={`app-nav-btn${activeTab === 'ai' ? ' app-nav-btn--active' : ''}`} style={activeTab === 'ai' ? { borderLeft: '2px solid var(--accent-pink)', color: '#f472b6', background: 'rgba(244, 114, 182, 0.15)' } : { borderLeft: '2px solid transparent' }}>
              <span>🤖</span> AI Scouting
            </button>
          )}

          {user.role === 'ACADEMY_ADMIN' && (
            <button type="button" onClick={() => setActiveTab('settings')} className={`app-nav-btn${activeTab === 'settings' ? ' app-nav-btn--active' : ''}`} style={activeTab === 'settings' ? { color: '#e5e7eb', background: 'rgba(156,163,175,0.15)' } : undefined}>
              <span>⚙️</span> Settings
            </button>
          )}
          */}
        </nav>

        <div className="glass-card" style={{ padding: '1rem', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isConnected ? 'var(--accent-green)' : 'var(--accent-amber)' }}></div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isConnected ? 'var(--accent-green)' : 'var(--accent-amber)', letterSpacing: '0.02em' }}>
              {isConnected ? t.nav.liveEngine : t.nav.offlineMode}
            </span>
          </div>

          <div style={{ 
            padding: '0.75rem', borderRadius: '10px', 
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', flexDirection: 'column', gap: '0.25rem'
          }}>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.04em' }}>{t.nav.loggedInAs}</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.email}
            </span>
            <span style={{ 
              fontSize: '0.65rem', fontWeight: 800, alignSelf: 'flex-start',
              padding: '0.1rem 0.4rem', borderRadius: '20px', marginTop: '0.2rem',
              background: user.role === 'ACADEMY_ADMIN' ? 'rgba(99,102,241,0.15)' : user.role === 'COACH' ? 'rgba(56,189,248,0.15)' : user.role === 'PARENT' ? 'rgba(251,191,36,0.15)' : 'rgba(16,185,129,0.15)',
              color: user.role === 'ACADEMY_ADMIN' ? '#818cf8' : user.role === 'COACH' ? '#38bdf8' : user.role === 'PARENT' ? '#fbbf24' : '#34d399',
              border: `1px solid ${user.role === 'ACADEMY_ADMIN' ? 'rgba(99,102,241,0.3)' : user.role === 'COACH' ? 'rgba(56,189,248,0.3)' : user.role === 'PARENT' ? 'rgba(251,191,36,0.3)' : 'rgba(16,185,129,0.3)'}`
            }}>
              {user.role === 'ACADEMY_ADMIN' ? t.nav.roleAdmin : user.role === 'COACH' ? t.nav.roleCoach : user.role === 'PARENT' ? t.nav.roleParent : t.nav.rolePlayer}
            </span>
          </div>
        </div>
      </aside>

      {/* =========================================================
          MAIN APPLICATION WINDOW WORKSPACE
          ========================================================= */}
      <main className="app-main">
        <header className="app-header">
          <div className="app-header-title">
            <button
              type="button"
              className="app-menu-btn"
              aria-label="Open menu"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
            <div>
            <h2 style={{ fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
              {activeTab === 'dashboard' && (isParent ? t.pageTitle.dashboardParent : isChild ? t.pageTitle.dashboardChild : t.pageTitle.dashboardAdmin)}
              {activeTab === 'roster' && t.pageTitle.rosters}
              {activeTab === 'payment' && t.pageTitle.payment}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              {isParent
                ? t.pageSubtitle.parent
                : isChild
                  ? t.pageSubtitle.child
                  : t.pageSubtitle.staff}
            </p>
            </div>
          </div>

          <div className="app-header-actions">
            <span className="glass-card hide-xs" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600 }}>
              {t.nav.season}
            </span>
            <LanguageSwitcher />
            <NotificationPanel
              notifications={notifications}
              onDismiss={dismissNotification}
              onClearAll={clearNotifications}
            />
            <button
              onClick={() => { 
                localStorage.removeItem('token'); 
                localStorage.removeItem('user');
                setUser({ email: '', role: 'ACADEMY_ADMIN' });
                setIsLoggedIn(false); 
              }}
              title={t.nav.signOut}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '10px', padding: '0.5rem 0.75rem', color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; }}
            >
              {t.nav.signOut}
            </button>
          </div>
        </header>

        {/* =========================================================
            TAB PANEL 1: DASHBOARD ANALYTICS OVERVIEWS
            ========================================================= */}
        {activeTab === 'dashboard' && isParent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {dataLoading && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t.dashboard.loadingFamily}</p>}
            
            {/* Header KPI cards */}
            <div className="grid-auto-fit-sm" style={{ gap: '1.25rem' }}>
              <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid rgba(99,102,241,0.15)', background: 'rgba(99,102,241,0.02)' }}>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{t.nav.myFamily}</span>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.25rem 0', color: '#a5b4fc' }}>{parentChildren.length} {t.nav.rolePlayer}{parentChildren.length > 1 ? 's' : ''}</h3>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>{t.dashboard.registeredChildAccounts}</span>
              </div>
              <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid rgba(245,158,11,0.15)', background: 'rgba(245,158,11,0.02)' }}>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{t.dashboard.financialStatus}</span>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.25rem 0', color: parentSubscriptions.some(s => s.status === 'overdue') ? '#f87171' : '#34d399' }}>
                  {parentSubscriptions.some(s => s.status === 'overdue') ? t.dashboard.pendingBalance : t.dashboard.fullySettled}
                </h3>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>{t.dashboard.activeAcademySubscriptions}</span>
              </div>
              <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid rgba(16,185,129,0.15)', background: 'rgba(16,185,129,0.02)' }}>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{t.dashboard.upcomingSchedule}</span>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.25rem 0', color: '#34d399' }}>
                  {events.length > 0 ? `${events.length} Session${events.length > 1 ? 's' : ''}` : 'No Events'}
                </h3>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>{t.dashboard.sessionsScheduled}</span>
              </div>
            </div>

            {/* Child login configuration prompt */}
            {childAccounts.some(c => !c.hasLogin) && (
              <div className="glass-card animate-pulse-slow" style={{ padding: '1.25rem', border: '1px solid rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.03)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#fbbf24', fontWeight: 800 }}>🔑 {t.dashboard.enableChildLogin}</h4>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Provide separate secure portals for your child players to track points, skills, and metrics.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {childAccounts.filter(c => !c.hasLogin).map(c => (
                    <button
                      key={c.playerId}
                      type="button"
                      onClick={() => {
                        setCreateLoginPlayerId(c.playerId);
                        setChildLoginEmail('');
                      }}
                      className="glow-btn"
                      style={{
                        padding: '0.5rem 1rem', borderRadius: '8px', border: 'none',
                        background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', color: '#000', fontWeight: 800, cursor: 'pointer',
                        fontSize: '0.8rem',
                      }}
                    >
                      {t.dashboard.createLogin} {c.playerName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {parentChildren.length === 0 && !dataLoading ? (
              <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: 0 }}>{t.dashboard.noChildren}</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 300px) 1fr', gap: '2rem', alignItems: 'start' }} className="parent-grid-split">
                {/* Children selector list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>👨‍👩‍👦 {t.nav.myFamily}</h4>
                  {parentChildren.map(child => {
                    const isSelected = selectedParentChild?.id === child.id;
                    const sub = parentSubscriptions.find((s: any) => s.player_id === child.id);
                    return (
                      <button
                        key={child.id}
                        onClick={() => {
                          setSelectedParentChild(child);
                          setSelectedPlayer({
                            id: child.id,
                            name: child.name,
                            dob: child.dob,
                            position: child.position,
                            team: child.team,
                            xp: child.xp,
                            rank: child.rank,
                          });
                        }}
                        style={{
                          background: isSelected ? 'linear-gradient(135deg, rgba(220,38,38,0.15) 0%, rgba(220,38,38,0.03) 100%)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${isSelected ? 'rgba(220,38,38,0.4)' : 'rgba(255,255,255,0.06)'}`,
                          boxShadow: isSelected ? '0 0 15px rgba(220,38,38,0.1)' : 'none',
                          borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem',
                          cursor: 'pointer', textAlign: 'left', color: 'white', transition: 'all 0.3s ease'
                        }}
                      >
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '10px',
                          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                          border: `1px solid ${isSelected ? 'rgba(220,38,38,0.5)' : 'rgba(255,255,255,0.1)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem',
                          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.05)', flexShrink: 0
                        }}>
                          🏃‍♂️
                        </div>
                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                          <h5 style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{child.name}</h5>
                          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{child.team}</span>
                        </div>
                        {sub?.status === 'overdue' && (
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px #ef4444' }} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selected child detailed visual dossier */}
                {selectedParentChild && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Kid Profile Header Card */}
                    <div className="glass-card" style={{
                      padding: '2rem',
                      background: 'linear-gradient(135deg, rgba(220,38,38,0.07) 0%, rgba(30,41,59,0.4) 100%)',
                      border: '1px solid rgba(220,38,38,0.15)',
                      position: 'relative', overflow: 'hidden', display: 'flex', flexWrap: 'wrap', gap: '2rem', justifySelf: 'stretch'
                    }}>
                      <div style={{
                        position: 'absolute', right: '-40px', bottom: '-40px',
                        width: '180px', height: '180px', borderRadius: '50%',
                        background: 'rgba(220,38,38,0.1)', filter: 'blur(40px)', pointerEvents: 'none'
                      }} />

                      {/* Large Glowing Player Ring Badge */}
                      <div style={{
                        width: '90px', height: '90px', borderRadius: '24px',
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                        border: '2px solid rgba(220,38,38,0.5)',
                        boxShadow: '0 0 25px rgba(220,38,38,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', flexShrink: 0
                      }}>
                        ⚽
                      </div>

                      <div style={{ flexGrow: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'white' }}>{selectedParentChild.name}</h3>
                          <span style={{
                            background: selectedParentChild.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                            color: selectedParentChild.status === 'active' ? '#34d399' : '#fbbf24',
                            border: `1px solid ${selectedParentChild.status === 'active' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                            fontSize: '0.65rem', fontWeight: 850, textTransform: 'uppercase', padding: '0.15rem 0.5rem', borderRadius: '20px', letterSpacing: '0.05em'
                          }}>
                            {selectedParentChild.status === 'active' ? 'APPROVED' : 'UNDER REVIEW'}
                          </span>
                        </div>
                        
                        <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                          🎓 {selectedParentChild.team} · 🏟️ Position: <strong style={{ color: 'white' }}>{selectedParentChild.position}</strong>
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                          <span style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 700, background: 'rgba(251,191,36,0.1)', padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(251,191,36,0.2)' }}>
                            ⚡ Rank: {selectedParentChild.rank.toUpperCase()}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                            ⭐ Total Experience: <strong style={{ color: 'white' }}>{selectedParentChild.xp} XP</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Application timeline map */}
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 1.25rem' }}>{t.dashboard.onboardingTimeline}</h4>
                      <ApplicationTimeline status={selectedParentChild.status} />
                    </div>

                    {/* Financial status, Subscriptions & Paid log */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="grid-2-1">
                      {/* Subscription log */}
                      <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h4 style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>{t.dashboard.academySubscription}</h4>
                        {(() => {
                          const sub = parentSubscriptions.find((s: any) => s.player_id === selectedParentChild.id);
                          if (!sub) return <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>No active subscription profile set.</p>;
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '1rem', fontWeight: 800 }}>{sub.plan.toUpperCase()} MEMBERSHIP</span>
                                <span style={{
                                  background: sub.status === 'overdue' ? 'rgba(239,68,68,0.15)' : 'rgba(52,211,153,0.15)',
                                  color: sub.status === 'overdue' ? '#f87171' : '#34d399',
                                  fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', padding: '0.2rem 0.5rem', borderRadius: '4px', border: `1px solid ${sub.status === 'overdue' ? 'rgba(239,68,68,0.25)' : 'rgba(52,211,153,0.25)'}`
                                }}>{sub.status.toUpperCase()}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)' }}>{t.payment.invoiceAmount}</span>
                                <span style={{ fontWeight: 700 }}>{sub.amount} {sub.currency}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)' }}>{t.payment.nextDue}</span>
                                <span style={{ fontWeight: 700, color: sub.status === 'overdue' ? '#f87171' : 'white' }}>📅 {String(sub.next_due).split('T')[0]}</span>
                              </div>
                              {sub.status === 'overdue' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const dummyInvoice = invoices.find(i => i.playerId === selectedParentChild.id && i.status === 'pending') || {
                                      id: `inv-${selectedParentChild.id}`,
                                      name: selectedParentChild.name,
                                      amount: `${sub.amount} ${sub.currency}`,
                                      source: 'subscription',
                                      subscriptionId: sub.id,
                                      playerId: selectedParentChild.id
                                    };
                                    setSelectedMarkAsPaidInvoice(dummyInvoice);
                                  }}
                                  className="glow-btn animate-pulse-slow"
                                  style={{
                                    marginTop: '0.5rem', padding: '0.65rem', borderRadius: '8px', border: 'none',
                                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white', fontWeight: 800, cursor: 'pointer',
                                    fontSize: '0.8rem', boxShadow: '0 0 12px rgba(239,68,68,0.3)'
                                  }}
                                >
                                  {t.dashboard.paySecurelyOnline}
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Documents vault KYC tracker */}
                      <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h4 style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>{t.dashboard.kycDocumentDossier}</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {[
                            { code: 'medical', label: 'Medical Certificate (PDF)', desc: t.dashboard.sportsInsurance },
                            { code: 'identity', label: 'National ID copy (JPG)', desc: t.dashboard.identityVerification },
                            { code: 'consent', label: 'Parental Consent signed', desc: t.dashboard.liabilityWaiver }
                          ].map(docType => {
                            const playerDocs = playerDocuments[selectedParentChild.id] || [];
                            const docFound = playerDocs.find(d => d.name.toLowerCase().includes(docType.code) || (docType.code === 'medical' && d.name.includes('medical')));
                            return (
                              <div key={docType.code} style={{
                                padding: '0.65rem 0.75rem', borderRadius: '8px',
                                background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem'
                              }}>
                                <div style={{ minWidth: 0 }}>
                                  <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: 'white' }}>{docType.label}</p>
                                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{docType.desc}</span>
                                </div>
                                {docFound ? (
                                  docFound.status === 'verified' ? (
                                    <span style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.4rem', borderRadius: '4px' }}>VERIFIED</span>
                                  ) : (
                                    <span style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24', fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.4rem', borderRadius: '4px' }}>PENDING</span>
                                  )
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setVaultPlayer({ id: selectedParentChild.id, name: selectedParentChild.name, team: selectedParentChild.team });
                                    }}
                                    style={{
                                      background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc',
                                      fontSize: '0.65rem', fontWeight: 750, padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer'
                                    }}
                                  >
                                    Upload 📁
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Double bottom section for ratings and calendar */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem' }} className="grid-2-1">
                      
                      {/* Coach pedagogical radar ratings */}
                      <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>{t.dashboard.progressRatings}</h4>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPlayer({
                                id: selectedParentChild.id,
                                name: selectedParentChild.name,
                                dob: selectedParentChild.dob,
                                position: selectedParentChild.position,
                                team: selectedParentChild.team,
                                xp: selectedParentChild.xp,
                                rank: selectedParentChild.rank
                              });
                              setActiveTab('pedagogy');
                            }}
                            style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                          >
                            {t.dashboard.dossierDetails} ➔
                          </button>
                        </div>
                        {(() => {
                          const latest = evalHistory.filter(e => e.player_id === selectedParentChild.id || true)[0];
                          const parsed = parseEvalScores(latest);
                          const stats = parsed ? {
                            technical: parsed.technical,
                            speed: parsed.speed,
                            tactical: parsed.tactical,
                            notes: parsed.notes || 'Steady progress shown in recent practices.'
                          } : {
                            technical: dashboard.avgTechnique / 10 || 7.2,
                            speed: dashboard.avgSpeed / 10 || 7.5,
                            tactical: dashboard.avgTactical / 10 || 6.8,
                            notes: 'No evaluations filed for this quarter yet.'
                          };
                          
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                              {[
                                { label: t.dashboard.technique, val: stats.technical, color: 'linear-gradient(90deg, #38bdf8, #6366f1)' },
                                { label: t.dashboard.speed, val: stats.speed, color: 'linear-gradient(90deg, #a78bfa, #f472b6)' },
                                { label: t.dashboard.tactical, val: stats.tactical, color: 'linear-gradient(90deg, #fbbf24, #10b981)' }
                              ].map(row => (
                                <div key={row.label}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>{row.label}</span>
                                    <span style={{ fontWeight: 800, color: 'white' }}>{row.val} / 10</span>
                                  </div>
                                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${row.val * 10}%`, height: '100%', background: row.color }} />
                                  </div>
                                </div>
                              ))}
                              <div style={{
                                padding: '0.75rem', borderRadius: '8px',
                                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                                fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4, marginTop: '0.25rem'
                              }}>
                                💬 <em>"{stats.notes}"</em>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Scheduled Training sessions stream timeline */}
                      <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h4 style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>{t.dashboard.upcomingTeamSchedule}</h4>
                        {(() => {
                          const kidEvents = events.filter(e => e.team === selectedParentChild.team || e.team === 'All').slice(0, 3);
                          if (kidEvents.length === 0) return <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>No sessions planned currently.</p>;
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              {kidEvents.map(ev => (
                                <div key={ev.id} style={{
                                  padding: '0.75rem', borderRadius: '8px',
                                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem'
                                }}>
                                  <div>
                                    <span style={{
                                      fontSize: '0.62rem', fontWeight: 850, padding: '0.1rem 0.35rem', borderRadius: '4px', marginRight: '0.5rem', textTransform: 'uppercase',
                                      background: ev.type === 'match' ? 'rgba(244,114,182,0.15)' : 'rgba(56,189,248,0.15)',
                                      color: ev.type === 'match' ? 'var(--accent-pink)' : 'var(--accent-blue)',
                                    }}>{ev.type}</span>
                                    <strong style={{ fontSize: '0.82rem', color: 'white' }}>{ev.title}</strong>
                                    <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>🏟️ Pitch: {ev.location} · ⏰ {ev.startsAt} - {ev.endsAt}</p>
                                  </div>
                                  <div style={{ alignSelf: 'center', background: 'rgba(255,255,255,0.04)', padding: '0.35rem 0.5rem', borderRadius: '6px', textAlign: 'center', fontSize: '0.7rem', color: 'white', fontWeight: 700, flexShrink: 0 }}>
                                    {ev.date.split('-')[2]}<br/>
                                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                                      {new Date(ev.date).toLocaleDateString([], { month: 'short' })}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>

                    </div>

                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'dashboard' && isChild && selectedPlayer && (
          <div className="glass-card" style={{ padding: '2rem', maxWidth: '480px' }}>
            <h3 style={{ margin: '0 0 0.5rem' }}>{selectedPlayer.name}</h3>
            <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0' }}>Team: {selectedPlayer.team}</p>
            <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0' }}>Position: {selectedPlayer.position}</p>
            <p style={{ fontSize: '0.85rem', color: '#38bdf8', marginTop: '1rem' }}>
              {t.dashboard.childDashboardInfo}
            </p>
          </div>
        )}

        {activeTab === 'dashboard' && isStaff && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {dataLoading && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t.dashboard.loading}</p>
            )}
            {isConnected && !dataLoading && dashboard.totalPlayers === 0 && players.length === 0 && (
              <div className="glass-card" style={{
                padding: '1.5rem',
                border: '1px solid rgba(245,158,11,0.3)',
                background: 'rgba(245,158,11,0.08)',
              }}>
                <h4 style={{ margin: '0 0 0.75rem', color: '#fbbf24', fontSize: '1rem' }}>{t.dashboard.noData}</h4>
                <ol style={{ margin: 0, paddingLeft: isRTL ? 0 : '1.25rem', paddingRight: isRTL ? '1.25rem' : 0, color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  {t.dashboard.noDataHints.map((hint, i) => <li key={i}>{hint}</li>)}
                </ol>
              </div>
            )}
            <div className="grid-auto-fit-sm">
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t.dashboard.activePlayers}</span>
                <h3 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.5rem 0 0.25rem 0', color: 'var(--accent-blue)' }}>{dashboard.totalPlayers}</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.dashboard.fromRoster}</div>
              </div>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t.dashboard.coachStaff}</span>
                <h3 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.5rem 0 0.25rem 0', color: 'var(--accent-purple)' }}>{dashboard.totalCoaches}</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.dashboard.registeredCoaches}</div>
              </div>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t.dashboard.upcomingSessions}</span>
                <h3 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.5rem 0 0.25rem 0', color: 'var(--accent-amber)' }}>{dashboard.upcomingEvents}</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-blue)' }}>
                  {events[0] ? `${t.dashboard.next} ${events[0].title}` : t.dashboard.noUpcoming}
                </div>
              </div>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t.dashboard.revenueCollected}</span>
                <h3 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.5rem 0 0.25rem 0', color: 'var(--accent-green)' }}>{dashboard.kpiRevenueTnd} TND</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-amber)' }}>
                  {dashboard.pendingInvoicesCount} {t.dashboard.pending} · {dashboard.pendingAmountTnd} TND
                </div>
              </div>
            </div>

            <div className="grid-auto-fit-wide">
              <div className="glass-card" style={{ padding: '2rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>{t.dashboard.squadEval}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { label: t.dashboard.speed, pct: dashboard.avgSpeed, color: 'var(--accent-blue)' },
                    { label: t.dashboard.technique, pct: dashboard.avgTechnique, color: 'var(--accent-purple)' },
                    { label: t.dashboard.tactical, pct: dashboard.avgTactical, color: 'var(--accent-green)' },
                  ].map(row => (
                    <div key={row.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        <span>{row.label}</span>
                        <span>{row.pct}%</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, row.pct)}%`, height: '100%', background: row.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card" style={{ padding: '2rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>{t.dashboard.recentActivity}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {recentActivity.length === 0 && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t.dashboard.noActivity}</p>
                  )}
                  {recentActivity.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '1rem', borderBottom: idx < recentActivity.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', paddingBottom: '0.75rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                      <div>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.title}</p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {item.detail} · {item.at ? new Date(item.at).toLocaleString() : '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB PANEL 2: ROSTER PLAYER CRUD
            ========================================================= */}
        {activeTab === 'roster' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {pendingRegistrations.length > 0 && (
              <div className="glass-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>
                      {t.roster.pendingBoardTitle}
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      {t.roster.pendingBoardDesc}
                    </p>
                  </div>
                  <span style={{
                    background: 'rgba(244, 114, 182, 0.15)',
                    color: 'var(--accent-pink)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '0.25rem 0.6rem',
                    borderRadius: '20px',
                    boxShadow: '0 0 10px rgba(244, 114, 182, 0.5)'
                  }}>
                    {pendingRegistrations.length} {t.roster.applicationsPending}
                  </span>
                </div>
                
                <div className="grid-auto-fit">
                  {pendingRegistrations.map(reg => (
                    <PendingRegistrationCard
                      key={reg.id}
                      reg={reg}
                      onApprove={handleApproveRegistration}
                      onReject={handleRejectRegistration}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Roster Controls and Add Player Form */}
            <div className="grid-2-1">
              
              {/* Player list view */}
              <div className="glass-card" style={{ padding: '2rem' }}>
                <div className="toolbar-row">
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{t.roster.academyRoster}</h4>
                  <div className="filter-chips">
                    {['All', 'U17 Elite', 'U15 Pro', 'U13 Rookie'].map(t => (
                      <button key={t} onClick={() => { setActiveTeamFilter(t); rosterPagination.setPage(1); }} style={{
                        background: activeTeamFilter === t ? 'var(--accent-purple)' : 'rgba(255,255,255,0.05)',
                        border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', color: 'white',
                        fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s'
                      }}>{t}</button>
                    ))}
                  </div>
                </div>

                <div className="table-scroll">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '640px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      <th style={{ padding: '0.75rem 0' }}>{t.roster.playerName}</th>
                      <th>{t.roster.teamCategory}</th>
                      <th>{t.roster.optimalPosition}</th>
                      <th>{t.roster.accumulatedXp}</th>
                      <th>{t.roster.currentRank}</th>
                      <th>{t.roster.rewardsAction}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rosterPagination.sliced.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.9rem' }}>
                          <td style={{ padding: '1rem 0', fontWeight: 600 }}>{p.name}</td>
                          <td>{p.team}</td>
                          <td>
                            <span style={{
                              background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-blue)',
                              padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600
                            }}>{p.position}</span>
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>{p.xp} XP</td>
                          <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                            <span style={{
                              color: p.rank === 'legend' ? 'var(--accent-pink)' : p.rank === 'elite' ? 'var(--accent-purple)' : 'var(--text-secondary)'
                            }}>⭐ {p.rank}</span>
                          </td>
                          <td>
                            <button onClick={() => handleAwardXp(p.id, 250)} style={{
                              background: 'var(--accent-green)', border: 'none', padding: '0.35rem 0.6rem',
                              borderRadius: '4px', color: '#000', fontWeight: 700, fontSize: '0.75rem',
                              cursor: 'pointer', marginRight: '0.5rem'
                            }}>+250 XP</button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                </div>
                <TablePagination
                  page={rosterPagination.page}
                  totalPages={rosterPagination.totalPages}
                  pageSize={rosterPagination.pageSize}
                  total={rosterPagination.total}
                  startIndex={rosterPagination.startIndex}
                  endIndex={rosterPagination.endIndex}
                  onPageChange={rosterPagination.setPage}
                  onPageSizeChange={rosterPagination.setPageSize}
                />
              </div>

              {/* Add player form */}
              <div className="glass-card" style={{ padding: '2rem', height: 'fit-content' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>{t.roster.enrollNewPlayer}</h4>
                
                <form onSubmit={handleAddPlayer} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>{t.roster.fullName}</label>
                    <input type="text" required value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} placeholder={t.roster.fullNamePlaceholder} style={{
                      width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                      padding: '0.75rem', borderRadius: '8px', color: 'white', fontSize: '0.9rem'
                    }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>{t.roster.optimalPositionLabel}</label>
                    <select value={newPlayerPos} onChange={e => setNewPlayerPos(e.target.value)} style={{
                      width: '100%', background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.08)',
                      padding: '0.75rem', borderRadius: '8px', color: 'white', fontSize: '0.9rem'
                    }}>
                      <option value="Playmaker">Playmaker</option>
                      <option value="Winger">Winger</option>
                      <option value="Center Back">Center Back</option>
                      <option value="Defensive Midfielder">Defensive Midfielder</option>
                      <option value="Left Back">Left Back</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>{t.roster.assignSquad}</label>
                    <select value={newPlayerTeam} onChange={e => setNewPlayerTeam(e.target.value)} style={{
                      width: '100%', background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.08)',
                      padding: '0.75rem', borderRadius: '8px', color: 'white', fontSize: '0.9rem'
                    }}>
                      <option value="U17 Elite">U17 Elite</option>
                      <option value="U15 Pro">U15 Pro</option>
                      <option value="U13 Rookie">U13 Rookie</option>
                    </select>
                  </div>

                  <button type="submit" className="glow-btn" style={{
                    padding: '0.8rem', borderRadius: '8px', width: '100%'
                  }}>{t.roster.enrollBtn}</button>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* =========================================================
            TAB PANEL 3: PLANNING & EVENTS CALENDAR
            ========================================================= */}
        {activeTab === 'planning' && (isParent || isChild || isStaff) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-card" style={{ padding: '2rem' }}>
              <div className="toolbar-row" style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                  {isParent ? 'Sessions for your children\'s teams' : 'Events Calendar & Schedules'}
                </h4>
                {isStaff && (
                <button
                  onClick={() => {
                    setEventDate(new Date().toISOString().split('T')[0]);
                    setEventStartsAt('16:00');
                    setEventEndsAt('18:00');
                    setIsAddEventOpen(true);
                  }}
                  className="glow-btn"
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '8px' }}
                >+ Add Event</button>
                )}
              </div>

              <div className="toolbar-row" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div className="filter-chips">
                  {(Object.keys(EVENT_TIMELINE_LABELS) as EventTimelineFilter[]).map(key => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setEventTimelineFilter(key)}
                      style={{
                        background: eventTimelineFilter === key ? 'var(--accent-purple)' : 'rgba(255,255,255,0.05)',
                        border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', color: 'white',
                        fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      {EVENT_TIMELINE_LABELS[key]}
                    </button>
                  ))}
                </div>
                {eventTimelineFilter === 'custom' && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="date"
                      value={eventFilterFrom}
                      onChange={e => setEventFilterFrom(e.target.value)}
                      aria-label="From date"
                      style={{
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                        padding: '0.4rem 0.6rem', borderRadius: '8px', color: 'white', fontSize: '0.8rem',
                      }}
                    />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>→</span>
                    <input
                      type="date"
                      value={eventFilterTo}
                      onChange={e => setEventFilterTo(e.target.value)}
                      aria-label="To date"
                      style={{
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                        padding: '0.4rem 0.6rem', borderRadius: '8px', color: 'white', fontSize: '0.8rem',
                      }}
                    />
                  </div>
                )}
              </div>

              {filteredPlanningEvents.length === 0 && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  No events match this timeline filter.
                </p>
              )}

              <div className="grid-auto-fit">
                {filteredPlanningEvents.map(ev => (
                  <div key={ev.id} className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{
                        background: ev.type === 'match' ? 'rgba(244,114,182,0.15)' : ev.type === 'training' ? 'rgba(56,189,248,0.15)' : 'rgba(245,158,11,0.15)',
                        color: ev.type === 'match' ? 'var(--accent-pink)' : ev.type === 'training' ? 'var(--accent-blue)' : 'var(--accent-amber)',
                        padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase'
                      }}>{ev.type}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>📅 {ev.date}</span>
                    </div>

                    <h5 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>{ev.title}</h5>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>🏟️ Location: {ev.location}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>👥 Assigned: {ev.team}</p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>⏰ {ev.startsAt} - {ev.endsAt}</span>
                      {isStaff && (
                        markedEvents.includes(ev.id) ? (
                        <span style={{
                          background: 'rgba(16,185,129,0.15)', color: 'var(--accent-green)',
                          padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700
                        }}>Present ✅</span>
                      ) : (
                        <button
                          onClick={() => handleMarkAttendance(ev)}
                          style={{
                            background: 'var(--accent-blue)', border: 'none', color: '#000',
                            padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer',
                            fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem'
                          }}
                        >
                          Record Roll-Call
                        </button>
                      )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ADD EVENT MODAL OVERLAY */}
            {isAddEventOpen && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                zIndex: 1000, padding: '1rem'
              }}>
                <div className="glass-card" style={{
                  width: '100%', maxWidth: '500px', padding: '2rem',
                  border: '1px solid rgba(255,255,255,0.08)', position: 'relative'
                }}>
                  <button onClick={() => setIsAddEventOpen(false)} style={{
                    position: 'absolute', top: '1rem', right: '1rem',
                    background: 'transparent', border: 'none', color: 'white',
                    fontSize: '1.25rem', cursor: 'pointer'
                  }}>✕</button>

                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'white' }}>Schedule New Academy Event</h4>

                  <form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Event Title</label>
                      <input type="text" required value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="e.g. Friendly Match vs Monastir" style={{
                        width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                        padding: '0.75rem', borderRadius: '8px', color: 'white', fontSize: '0.9rem'
                      }} />
                    </div>

                    <div className="form-grid-2">
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Event Type</label>
                        <select value={eventType} onChange={e => setEventType(e.target.value)} style={{
                          width: '100%', background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.08)',
                          padding: '0.75rem', borderRadius: '8px', color: 'white', fontSize: '0.9rem'
                        }}>
                          <option value="training">Training</option>
                          <option value="match">Match</option>
                          <option value="exam">Exam</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Assigned Squad</label>
                        <select value={eventTeam} onChange={e => setEventTeam(e.target.value)} style={{
                          width: '100%', background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.08)',
                          padding: '0.75rem', borderRadius: '8px', color: 'white', fontSize: '0.9rem'
                        }}>
                          <option value="U17 Elite">U17 Elite</option>
                          <option value="U15 Pro">U15 Pro</option>
                          <option value="U13 Rookie">U13 Rookie</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Location / Pitch</label>
                      <input type="text" value={eventLoc} onChange={e => setEventLoc(e.target.value)} placeholder="e.g. Pitch A or Rades Stadium" style={{
                        width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                        padding: '0.75rem', borderRadius: '8px', color: 'white', fontSize: '0.9rem'
                      }} />
                    </div>

                    <div className="grid-event-datetime">
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Date</label>
                        <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} style={{
                          width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                          padding: '0.7rem 0.5rem', borderRadius: '8px', color: 'white', fontSize: '0.85rem'
                        }} />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Starts At</label>
                        <input type="time" value={eventStartsAt} onChange={e => setEventStartsAt(e.target.value)} style={{
                          width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                          padding: '0.7rem 0.5rem', borderRadius: '8px', color: 'white', fontSize: '0.85rem'
                        }} />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Ends At</label>
                        <input type="time" value={eventEndsAt} onChange={e => setEventEndsAt(e.target.value)} style={{
                          width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                          padding: '0.7rem 0.5rem', borderRadius: '8px', color: 'white', fontSize: '0.85rem'
                        }} />
                      </div>
                    </div>

                    <button type="submit" className="glow-btn" style={{
                      padding: '0.8rem', borderRadius: '8px', marginTop: '0.5rem',
                      background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))'
                    }} disabled={isSubmittingEvent}>
                      {isSubmittingEvent ? 'Scheduling event...' : 'Schedule Event & Sync'}
                    </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* =========================================================
            TAB PANEL 4: PEDAGOGY RADARS & ASSESSMENTS
            ========================================================= */}
        {activeTab === 'pedagogy' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {isParent && parentChildren.length > 0 && parentChildren.every(c => c.status === 'pending') && (
              <p style={{ fontSize: '0.85rem', color: '#fbbf24', margin: 0 }}>
                Enrollment is under review. See status on My Family — progress unlocks after approval.
              </p>
            )}
            <div className="grid-1-2">
              
              {/* Select Player List */}
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>
                  {isParent ? 'My Children' : isChild ? 'My Profile' : 'Academy Players'}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {pedagogyPagination.sliced.map((p: any) => (
                    <button key={p.id} onClick={() => {
                      setSelectedPlayer(p);
                      if (isParent) setSelectedParentChild(parentChildren.find(c => c.id === p.id) || null);
                    }} style={{
                      background: selectedPlayer?.id === p.id ? 'rgba(99,102,241,0.15)' : 'transparent',
                      border: selectedPlayer?.id === p.id ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
                      borderRadius: '8px', padding: '0.75rem', display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', cursor: 'pointer', textAlign: 'left', color: 'white', transition: 'all 0.2s'
                    }}>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.team}</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--accent-amber)', fontWeight: 700 }}>{p.xp ?? 0} XP</span>
                    </button>
                  ))}
                </div>
                <TablePagination
                  page={pedagogyPagination.page}
                  totalPages={pedagogyPagination.totalPages}
                  pageSize={pedagogyPagination.pageSize}
                  total={pedagogyPagination.total}
                  startIndex={pedagogyPagination.startIndex}
                  endIndex={pedagogyPagination.endIndex}
                  onPageChange={pedagogyPagination.setPage}
                  onPageSizeChange={pedagogyPagination.setPageSize}
                />
              </div>

              {/* Player Radar assessment indices */}
              <div className="glass-card" style={{ padding: '2rem' }}>
                {!selectedPlayer ? (
                  <p style={{ color: 'var(--text-secondary)' }}>
                    {getPedagogyEmptyMessage(
                      user.role,
                      isParent ? 'parent_pending'
                        : isChild ? 'no_player_selected'
                        : isStaff && players.length === 0 ? 'staff_empty_db'
                        : 'no_player_selected'
                    )}
                  </p>
                ) : isParent && selectedParentChild?.status === 'pending' ? (
                  <p style={{ color: 'var(--text-secondary)' }}>
                    {getPedagogyEmptyMessage('PARENT', 'parent_pending')}
                  </p>
                ) : (
                <>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                  {isParent || isChild ? 'Progress for' : 'Pedagogical Ratings for'} {selectedPlayer.name}
                </h4>
                
                {(() => {
                  const ped = getPlayerPedagogy(selectedPlayer);
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                          <span>Technical Control & Dribbling</span>
                          <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>{ped.technical} / 10</span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${ped.technical * 10}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple))' }}></div>
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                          <span>Sprinting Speed & Explosiveness</span>
                          <span style={{ color: 'var(--accent-purple)', fontWeight: 700 }}>{ped.speed} / 10</span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${ped.speed * 10}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-purple), var(--accent-pink))' }}></div>
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                          <span>Tactical Pressing & Team Play</span>
                          <span style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>{ped.tactical} / 10</span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${ped.tactical * 10}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-amber), var(--accent-green))' }}></div>
                        </div>
                      </div>

                      <div style={{
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '12px', padding: '1.25rem', marginTop: '1rem'
                      }}>
                        <h5 style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.95rem' }}>Coach Evaluator Notes:</h5>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                          "{ped.notes}"
                        </p>
                      </div>
                      <button
                        onClick={() => handleExportPdfReport(selectedPlayer)}
                        className="glow-btn"
                        style={{
                          marginTop: '0.75rem', padding: '0.75rem', borderRadius: '8px',
                          background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
                          fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
                        }}
                        disabled={isExportingPdf}
                      >
                        {isExportingPdf ? 'Generating AI report...' : 'Export Progress Report'}
                      </button>
                    </div>
                  );
                })()}
                </>
                )}
              </div>

            </div>

            {selectedPlayer && (
            <div className={isStaff ? 'grid-2-equal' : ''} style={isStaff ? undefined : { display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {isStaff && (
              <div className="glass-card" style={{ padding: '2rem' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem' }}>
                  📋 Submit Evaluation — {selectedPlayer.name}
                </h4>
                <form onSubmit={handleSubmitEval} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { label: 'Sprinting Speed & Explosiveness', value: evalSpeed, setter: setEvalSpeed },
                    { label: 'Technical Control & Dribbling', value: evalTechnique, setter: setEvalTechnique },
                    { label: 'Tactical Pressing & Team Play', value: evalTactics, setter: setEvalTactics },
                  ].map(({ label, value, setter }) => (
                    <div key={label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        <span>{label}</span>
                        <strong style={{ color: '#38bdf8' }}>{value} / 10</strong>
                      </div>
                      <input
                        type="range" min="1" max="10" value={value}
                        onChange={e => setter(e.target.value)}
                        style={{ width: '100%', accentColor: '#6366f1' }}
                      />
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                      Coach Notes (optional)
                    </label>
                    <textarea
                      value={evalNotes} onChange={e => setEvalNotes(e.target.value)}
                      placeholder="Observations, improvement areas..."
                      rows={3}
                      style={{
                        width: '100%', background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
                        color: 'white', padding: '0.75rem', fontSize: '0.85rem',
                        resize: 'vertical', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <button type="submit" className="glow-btn" style={{ padding: '0.75rem', borderRadius: '8px' }} disabled={isSubmittingEval}>
                    {isSubmittingEval ? 'Saving...' : 'Save Evaluation'}
                  </button>
                  {evalSubmitMsg && (
                    <p style={{ fontSize: '0.85rem', color: '#10b981', textAlign: 'center', fontWeight: 600 }}>
                      {evalSubmitMsg}
                    </p>
                  )}
                </form>
              </div>
              )}

              <div className="glass-card" style={{ padding: '2rem' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem' }}>
                  📁 Assessment History
                </h4>
                {isLoadingEval ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading evaluations...</p>
                ) : evalHistory.length === 0 ? (
                  <div style={{
                    textAlign: 'center', padding: '2rem 1rem',
                    background: 'rgba(255,255,255,0.02)', borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {getEvalHistoryEmptyMessage(user.role)}
                    </p>
                    {isStaff && (
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.4rem' }}>
                      Submit an evaluation using the form on the left.
                    </p>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '400px', overflowY: 'auto' }}>
                    {evalHistory.map((ev: any, i: number) => {
                      const scores = typeof ev.scores === 'string' ? JSON.parse(ev.scores) : ev.scores;
                      return (
                        <div key={ev.id || i} style={{
                          background: 'rgba(255,255,255,0.025)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '10px', padding: '1rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {ev.evaluated_at ? new Date(ev.evaluated_at).toLocaleDateString() : 'Local'}
                            </span>
                            <span style={{
                              background: 'rgba(99,102,241,0.15)', color: '#a78bfa',
                              fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px'
                            }}>
                              Overall: {ev.overall}/10
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {scores && Object.entries(scores).map(([k, v]) => (
                              <span key={k} style={{ fontSize: '0.78rem', color: '#38bdf8' }}>
                                {k}: <strong>{String(v)}</strong>
                              </span>
                            ))}
                          </div>
                          {ev.notes && (
                            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                              "{ev.notes}"
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            )}

          </div>
        )}



        {/* =========================================================
            TAB PANEL 5: PAYMENTS & SUBSCRIPTIONS
            ========================================================= */}
        {activeTab === 'payment' && (() => {
          const activeSubs   = subscriptions.filter(s => s.status === 'active');
          const overdueSubs  = subscriptions.filter(s => s.status === 'overdue');
          const pendingSubs  = subscriptions.filter(s => s.status === 'pending');
          const currentYm = currentYearMonth();
          const collectedThisMonth = invoices
            .filter(i => invoiceCollectedInMonth(i, currentYm))
            .reduce((sum, i) => sum + parseInvoiceAmount(i.amount), 0);
          const pendingAmount = invoices
            .filter(i => i.status === 'pending')
            .reduce((sum, i) => sum + parseInvoiceAmount(i.amount), 0);
          const overdueAmount = overdueSubs.reduce((sum, s) => sum + (s.amount || 0), 0);
          const collectedCountThisMonth = invoices.filter(i => invoiceCollectedInMonth(i, currentYm)).length;
          const annualProjection = subscriptions.reduce((sum, s) => {
            const m = s.plan === 'monthly' ? 12 : s.plan === 'quarterly' ? 4 : s.plan === 'semester' ? 2 : 1;
            return sum + s.amount * m;
          }, 0);

          return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* ── KPI Cards ── */}
            <div className="grid-4-kpi">
              {[
                { icon: '💰', label: 'Collecté ce mois', value: `${collectedThisMonth.toFixed(3)} TND`, sub: `${collectedCountThisMonth} factures payées`, color: '#10b981', glow: 'rgba(16,185,129,0.2)' },
                { icon: '⏳', label: 'En attente', value: `${pendingAmount.toFixed(3)} TND`, sub: `${pendingSubs.length} abonnements · ${invoices.filter(i=>i.status==='pending').length} factures`, color: '#f59e0b', glow: 'rgba(245,158,11,0.2)' },
                { icon: '🚨', label: 'En retard', value: `${overdueAmount.toFixed(3)} TND`, sub: `${overdueSubs.length} abonnement${overdueSubs.length !== 1 ? 's' : ''} en retard`, color: '#ef4444', glow: 'rgba(239,68,68,0.2)' },
                { icon: '📅', label: 'Projection annuelle', value: `${annualProjection.toFixed(0)} TND`, sub: `${subscriptions.length} abonnés actifs`, color: '#a78bfa', glow: 'rgba(167,139,250,0.2)' },
              ].map((kpi, i) => (
                <div key={i} className="glass-card" style={{
                  padding: '1.5rem', border: `1px solid ${kpi.color}25`,
                  boxShadow: `0 0 20px ${kpi.glow}`, position: 'relative', overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute', top: '-15px', right: '-15px',
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: kpi.glow, filter: 'blur(20px)'
                  }} />
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{kpi.icon}</div>
                  <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 0.35rem' }}>{kpi.label}</p>
                  <p style={{ fontSize: '1.35rem', fontWeight: 800, color: kpi.color, margin: '0 0 0.2rem' }}>{kpi.value}</p>
                  <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', margin: 0 }}>{kpi.sub}</p>
                </div>
              ))}
            </div>

            {/* ── Monthly Revenue Bar Chart ── */}
            <div className="glass-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{t.payment.monthlyOverview}</h4>
                  <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', margin: '0.25rem 0 0' }}>{t.payment.monthlyDesc}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.5)' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#10b981', display: 'inline-block' }} />
                    {t.payment.collected}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.5)' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', display: 'inline-block' }} />
                    {t.payment.expected}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', height: '140px' }}>
                {monthlyRevenue.map((m, idx) => {
                  const now = new Date();
                  const isFuture = idx > now.getMonth();
                  const pct = m.expected > 0 ? (m.collected / m.expected) * 100 : 0;
                  return (
                    <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', height: '100%' }}>
                      <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative' }}>
                        {/* Expected bar (bg) */}
                        <div style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          height: '100%', background: 'rgba(255,255,255,0.04)',
                          borderRadius: '4px 4px 0 0', border: '1px solid rgba(255,255,255,0.06)'
                        }} />
                        {/* Collected bar */}
                        <div style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          height: `${isFuture ? 0 : pct}%`,
                          background: pct < 60 ? 'linear-gradient(to top,#ef4444,#f87171)'
                                    : pct < 90 ? 'linear-gradient(to top,#f59e0b,#fcd34d)'
                                    : 'linear-gradient(to top,#10b981,#34d399)',
                          borderRadius: '4px 4px 0 0',
                          transition: 'height 0.6s ease',
                          boxShadow: isFuture ? 'none' : '0 0 8px rgba(16,185,129,0.3)'
                        }} />
                      </div>
                      <span style={{ fontSize: '0.62rem', color: isFuture ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{m.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Subscription Management Table ── */}
            <div className="glass-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{t.payment.parentSubscriptions}</h4>
                  <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', margin: '0.25rem 0 0' }}>
                    {activeSubs.length} {t.payment.subsActive} · {overdueSubs.length} {t.payment.subsOverdue} · {pendingSubs.length} {t.payment.subsPending}
                  </p>
                </div>
                <div className="filter-chips">
                  {Object.entries(PLAN_LABELS).map(([key, label]) => (
                    <span key={key} style={{
                      fontSize: '0.68rem', fontWeight: 700, padding: '0.2rem 0.6rem',
                      borderRadius: '20px', background: `${PLAN_COLORS[key]}18`,
                      color: PLAN_COLORS[key], border: `1px solid ${PLAN_COLORS[key]}30`
                    }}>{label} — {PLAN_AMOUNTS[key]} TND</span>
                  ))}
                </div>
              </div>

              <div className="table-scroll">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '560px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      <th style={{ padding: '0.75rem 0.5rem' }}>{t.payment.player}</th>
                      <th>{t.payment.parentPayer}</th>
                      <th>{t.payment.team}</th>
                      <th>{t.payment.formula}</th>
                      <th>{t.payment.amountPeriod}</th>
                      <th>{t.payment.nextDue}</th>
                      <th>{t.payment.status}</th>
                      <th>{t.payment.action}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptionsPagination.sliced.map(sub => {
                      const dueDate = new Date(sub.nextDue);
                      const daysUntil = Math.ceil((dueDate.getTime() - Date.now()) / 86400000);
                      const isLate = daysUntil < 0;
                      const isUrgent = daysUntil >= 0 && daysUntil <= 7;
                      return (
                        <tr key={sub.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.875rem' }}>
                          <td style={{ padding: '1rem 0.5rem', fontWeight: 700, color: 'white' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{
                                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                                background: `linear-gradient(135deg, ${PLAN_COLORS[sub.plan]}, ${PLAN_COLORS[sub.plan]}88)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.8rem', fontWeight: 900, color: '#000'
                              }}>{sub.playerName.charAt(0)}</div>
                              {sub.playerName}
                            </div>
                          </td>
                          <td style={{ color: 'rgba(255,255,255,0.6)' }}>{sub.parentName}</td>
                          <td>
                            <span style={{
                              fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.5rem',
                              borderRadius: '4px', background: 'rgba(56,189,248,0.1)', color: '#38bdf8'
                            }}>{sub.team}</span>
                          </td>
                          <td>
                            <span style={{
                              fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.65rem',
                              borderRadius: '20px',
                              background: `${PLAN_COLORS[sub.plan]}18`,
                              color: PLAN_COLORS[sub.plan],
                              border: `1px solid ${PLAN_COLORS[sub.plan]}35`
                            }}>{PLAN_LABELS[sub.plan]}</span>
                          </td>
                          <td style={{ fontWeight: 700, color: PLAN_COLORS[sub.plan] }}>
                            {sub.amount.toFixed(3)} {sub.currency}
                          </td>
                          <td style={{ color: isLate ? '#f87171' : isUrgent ? '#fcd34d' : 'rgba(255,255,255,0.6)', fontWeight: isLate || isUrgent ? 700 : 400 }}>
                            {sub.nextDue}
                            {isLate && <span style={{ fontSize: '0.68rem', marginLeft: '0.4rem', color: '#f87171' }}>({Math.abs(daysUntil)}j retard)</span>}
                            {isUrgent && !isLate && <span style={{ fontSize: '0.68rem', marginLeft: '0.4rem', color: '#fcd34d' }}>({daysUntil}j restants)</span>}
                          </td>
                          <td>
                            {sub.status === 'active' && (
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '4px', background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>{t.payment.statusActive}</span>
                            )}
                            {sub.status === 'overdue' && (
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '4px', background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>{t.payment.statusOverdue}</span>
                            )}
                            {sub.status === 'pending' && (
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '4px', background: 'rgba(245,158,11,0.12)', color: '#fcd34d' }}>{t.payment.statusPending}</span>
                            )}
                          </td>
                          <td>
                            {(sub.status === 'overdue' || sub.status === 'pending') && (
                              <button
                                onClick={() => setSelectedMarkAsPaidInvoice({
                                  id: sub.id,
                                  name: sub.playerName,
                                  amount: sub.amount.toFixed(3),
                                  currency: sub.currency,
                                  date: sub.nextDue,
                                  source: 'subscription',
                                  subscriptionId: sub.id,
                                  playerId: sub.playerId,
                                })}
                                style={{
                                  background: 'linear-gradient(135deg,#10b981,#059669)',
                                  border: 'none', padding: '0.35rem 0.75rem',
                                  borderRadius: '6px', color: '#000', fontWeight: 800,
                                  fontSize: '0.72rem', cursor: 'pointer',
                                  boxShadow: '0 0 10px rgba(16,185,129,0.2)'
                                }}
                              >{t.payment.markPaid}</button>
                            )}
                            {sub.status === 'active' && (
                              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)' }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <TablePagination
                page={subscriptionsPagination.page}
                totalPages={subscriptionsPagination.totalPages}
                pageSize={subscriptionsPagination.pageSize}
                total={subscriptionsPagination.total}
                startIndex={subscriptionsPagination.startIndex}
                endIndex={subscriptionsPagination.endIndex}
                onPageChange={subscriptionsPagination.setPage}
                onPageSizeChange={subscriptionsPagination.setPageSize}
              />
            </div>

            {/* ── Invoice History ── */}
            <div className="glass-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{t.payment.invoiceHistory}</h4>
                  <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', margin: '0.25rem 0 0' }}>{t.payment.invoiceHistoryDesc}</p>
                </div>
                <button
                  onClick={() => setIsIssueInvoiceOpen(true)}
                  className="glow-btn"
                  style={{
                    padding: '0.5rem 1.25rem', borderRadius: '8px',
                    background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-pink))'
                  }}
                >{t.payment.issueInvoice}</button>
              </div>

              <div className="table-scroll">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '720px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    <th>Méthode</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoicesPagination.sliced.map(inv => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.875rem' }}>
                      <td style={{ padding: '0.875rem 0', fontWeight: 600 }}>{inv.name}</td>
                      <td>
                        {(inv as any).plan ? (
                          <span style={{
                            fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '12px',
                            background: `${PLAN_COLORS[(inv as any).plan] || '#6b7280'}18`,
                            color: PLAN_COLORS[(inv as any).plan] || '#6b7280'
                          }}>{PLAN_LABELS[(inv as any).plan] || (inv as any).plan}</span>
                        ) : <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>}
                      </td>
                      <td style={{ fontWeight: 700 }}>{inv.amount} {inv.currency}</td>
                      <td style={{ color: 'rgba(255,255,255,0.6)' }}>{inv.date}</td>
                      <td>
                        {inv.status === 'completed' ? (
                          <span style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>{t.payment.statusPaid}</span>
                        ) : isOverdue(inv.date) ? (
                          <span style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', border: '1px solid rgba(239,68,68,0.2)', fontWeight: 700 }}>{t.payment.statusOverdue}</span>
                        ) : (
                          <span style={{ color: '#fcd34d', background: 'rgba(245,158,11,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>{t.payment.statusPending}</span>
                        )}
                      </td>
                      <td>
                        {inv.status === 'completed' ? (
                          inv.paid_manually ? (
                            <div>
                              <span style={{ color: '#10b981', background: 'rgba(16,185,129,0.12)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>ADMIN OVERRIDE</span>
                              {inv.admin_note && (
                                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem', fontStyle: 'italic' }} title={inv.admin_note}>
                                  📝 {inv.admin_note.length > 25 ? inv.admin_note.substring(0, 22) + '...' : inv.admin_note}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#38bdf8', background: 'rgba(56,189,248,0.12)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>KONNECT</span>
                          )
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
                        )}
                      </td>
                      <td>
                        {inv.status === 'pending' && (
                          <button
                            onClick={() => {
                              const pl = players.find(p => p.name === inv.name);
                              setSelectedMarkAsPaidInvoice({
                                ...inv,
                                source: 'invoice',
                                playerId: pl?.id,
                              });
                            }}
                            style={{
                              background: '#10b981', border: 'none',
                              padding: '0.3rem 0.65rem', borderRadius: '6px',
                              color: '#000', fontWeight: 800, fontSize: '0.72rem',
                              cursor: 'pointer', boxShadow: '0 0 10px rgba(16,185,129,0.15)'
                            }}
                          >{t.payment.markPaid}</button>
                        )}
                        {inv.status === 'completed' && (
                          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              <TablePagination
                page={invoicesPagination.page}
                totalPages={invoicesPagination.totalPages}
                pageSize={invoicesPagination.pageSize}
                total={invoicesPagination.total}
                startIndex={invoicesPagination.startIndex}
                endIndex={invoicesPagination.endIndex}
                onPageChange={invoicesPagination.setPage}
                onPageSizeChange={invoicesPagination.setPageSize}
              />
            </div>

          </div>
          );
        })()}

        {/* =========================================================
            TAB PANEL 6: AI SCOUTING ADVISER
            ========================================================= */}
        {activeTab === 'ai' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="grid-2-equal">
              
              {/* Dynamic Player AI Scouting report compiler */}
              <div className="glass-card" style={{ padding: '2rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>AI Scouting Report Compiler</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Select Target Academy Player</label>
                    <select
                      value={selectedAiPlayer ? selectedAiPlayer.id : ''}
                      onChange={e => {
                        const selected = players.find(p => p.id === e.target.value);
                        if (selected) setSelectedAiPlayer(selected);
                      }}
                      style={{
                        width: '100%', background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.08)',
                        padding: '0.75rem', borderRadius: '8px', color: 'white', fontSize: '0.9rem'
                      }}
                    >
                      {players.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.team})</option>
                      ))}
                    </select>
                  </div>
                  
                  <button onClick={() => handleGenerateScoutingReport(selectedAiPlayer)} className="glow-btn" style={{
                    padding: '0.8rem', borderRadius: '8px', background: 'linear-gradient(135deg, var(--accent-pink), var(--accent-purple))'
                  }} disabled={isGeneratingReport}>
                    {isGeneratingReport ? 'AI Model processing...' : 'Generate AI Scouting Assessment'}
                  </button>
                </div>

                {/* Scouting report display */}
                {scoutingReport && (
                  <div style={{
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(244,114,182,0.25)',
                    borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem'
                  }}>
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-pink)', fontWeight: 700 }}>AI RECOMMENDATION ANALYSIS</span>
                      <h5 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginTop: '0.25rem' }}>{scoutingReport.name}</h5>
                    </div>

                    <div className="grid-3-equal" style={{ textAlign: 'center' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>SPEED</span>
                        <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-blue)' }}>{scoutingReport.avgSpeed} / 10</p>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>TECHNICAL</span>
                        <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-purple)' }}>{scoutingReport.avgTech} / 10</p>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>TACTICAL</span>
                        <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{scoutingReport.avgTactics} / 10</p>
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Optimal Pitch Recommendation:</span>
                      <strong style={{ color: 'var(--accent-green)', fontSize: '1rem' }}>{scoutingReport.position}</strong>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Development Action Plan:</span>
                      <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {scoutingReport.developmentPlan.map((act: string, idx: number) => (
                          <li key={idx}>{act}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Dynamic Training Plan Generator */}
              <div className="glass-card" style={{ padding: '2rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>AI Dynamic Plan Generator</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Select Focus Area</label>
                    <select value={aiFocusArea} onChange={e => setAiFocusArea(e.target.value)} style={{
                      width: '100%', background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.08)',
                      padding: '0.75rem', borderRadius: '8px', color: 'white', fontSize: '0.9rem'
                    }}>
                      <option value="technical">Technical (Dribbling & Ball Control)</option>
                      <option value="tactical">Tactical (Offensive setups & Central pressing)</option>
                      <option value="stamina">Stamina (Fartlek run & Speed sprints)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Session Duration (Minutes)</label>
                    <input type="number" value={aiDuration} onChange={e => setAiDuration(e.target.value)} placeholder="60" style={{
                      width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                      padding: '0.75rem', borderRadius: '8px', color: 'white', fontSize: '0.9rem'
                    }} />
                  </div>

                  <button onClick={handleGenerateTrainingPlan} className="glow-btn" style={{
                    padding: '0.8rem', borderRadius: '8px'
                  }} disabled={isGeneratingPlan}>
                    {isGeneratingPlan ? 'Processing custom plan...' : 'Generate Training Plan'}
                  </button>
                </div>

                {/* Training plan display */}
                {aiPlan && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                    border: '1px solid rgba(56,189,248,0.2)',
                    borderRadius: '16px',
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      borderBottom: '1px solid rgba(255,255,255,0.08)', 
                      paddingBottom: '1rem' 
                    }}>
                      <div>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          color: '#38bdf8', 
                          fontWeight: 800, 
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          background: 'rgba(56, 189, 248, 0.1)',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '4px'
                        }}>
                          AI Dynamic Recommendation
                        </span>
                        <h5 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', marginTop: '0.5rem', marginBottom: '0.25rem' }}>
                          Custom {aiPlan.focus.toUpperCase()} Session
                        </h5>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Tailored training architecture for {aiPlan.duration} minutes total duration
                        </p>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        padding: '0.3rem 0.6rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        color: '#10b981',
                        fontWeight: 600
                      }}>
                        <span style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
                        {aiPlan.engine || 'Qwen AI (Active)'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative', paddingLeft: '0.5rem' }}>
                      {/* Vertical line connecting stages */}
                      <div style={{
                        position: 'absolute',
                        left: '11px',
                        top: '15px',
                        bottom: '15px',
                        width: '2px',
                        background: 'linear-gradient(to bottom, #38bdf8 0%, #6366f1 100%)',
                        opacity: 0.3
                      }}></div>

                      {aiPlan.stages.map((st: any, idx: number) => (
                        <div key={idx} style={{ 
                          display: 'flex', 
                          gap: '1.5rem', 
                          position: 'relative',
                          zIndex: 1
                        }}>
                          {/* Timeline bullet */}
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
                            color: '#0d0a25',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            flexShrink: 0,
                            boxShadow: '0 0 12px rgba(56, 189, 248, 0.5)',
                            marginTop: '4px'
                          }}>
                            {idx + 1}
                          </div>

                          <div className="glass-card" style={{ 
                            flexGrow: 1, 
                            padding: '1.25rem', 
                            background: 'rgba(255, 255, 255, 0.015)',
                            border: '1px solid rgba(255, 255, 255, 0.04)',
                            borderRadius: '12px',
                            transition: 'all 0.3s ease'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'white' }}>{st.name}</span>
                              <span style={{ 
                                fontSize: '0.75rem', 
                                color: '#38bdf8', 
                                fontWeight: 700,
                                background: 'rgba(56, 189, 248, 0.1)',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                border: '1px solid rgba(56, 189, 248, 0.15)'
                              }}>
                                {st.mins}
                              </span>
                            </div>
                            <p style={{ 
                              fontSize: '0.825rem', 
                              color: 'rgba(255, 255, 255, 0.65)', 
                              lineHeight: '1.4', 
                              margin: 0 
                            }}>
                              {st.instructions}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* =========================================================
            TAB PANEL 7: SETTINGS
            ========================================================= */}
        {activeTab === 'settings' && (
          <SettingsTab
            pushNotification={pushNotification}
            onProfileSaved={(profile) => {
              const short = profile.name.split(/\s+/).map(w => w[0]).join('').slice(0, 4).toUpperCase() || 'CFA';
              setAcademyBranding({
                name: profile.name,
                shortName: short.length >= 2 ? short : 'CFA',
                logoUrl: safeLogoUrl(profile.logoUrl),
              });
            }}
          />
        )}

      </main>

      {/* =========================================================
          DYNAMIC MODAL 1: DOCUMENT VAULT & KYC MANAGER
          ========================================================= */}
      {vaultPlayer && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 5, 10, 0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 2000, padding: '1rem'
        }}>
          <div className="glass-card" style={{
            width: '100%', maxWidth: '550px', padding: '2rem',
            border: '1px solid rgba(255,255,255,0.08)', position: 'relative',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <button onClick={() => setVaultPlayer(null)} style={{
              position: 'absolute', top: '1.25rem', right: '1.25rem',
              background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)',
              fontSize: '1.25rem', cursor: 'pointer', transition: 'all 0.2s'
            }} onMouseEnter={e => e.currentTarget.style.color = '#fff'}>✕</button>

            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', fontWeight: 800 }}>SECURE DOCUMENT VAULT</span>
              <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', marginTop: '0.25rem' }}>{vaultPlayer.name}'s Dossier</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Squad category: {vaultPlayer.team}</p>
            </div>

            {/* List of files */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Digitized Certificates & IDs:</span>
              {(!playerDocuments[vaultPlayer.id] || playerDocuments[vaultPlayer.id].length === 0) ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>No files uploaded yet.</p>
                </div>
              ) : (
                playerDocuments[vaultPlayer.id].map((doc, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>{doc.name}</p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{doc.type} • {doc.size}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {doc.status === 'verified' ? (
                        <span style={{
                          background: 'rgba(16,185,129,0.12)', color: 'var(--accent-green)',
                          padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700
                        }}>✅ Verified</span>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <span style={{
                            background: 'rgba(245,158,11,0.12)', color: 'var(--accent-amber)',
                            padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700
                          }}>⏳ Pending</span>
                          <button
                            onClick={() => handleVerifyDocument(doc.name)}
                            style={{
                              background: 'var(--accent-purple)', border: 'none', color: 'white',
                              padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem',
                              fontWeight: 700, cursor: 'pointer'
                            }}
                          >
                            Approve
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Simulated Drag & Drop Widget */}
            <div style={{
              border: '2px dashed rgba(99,102,241,0.25)', borderRadius: '12px',
              padding: '2rem 1.5rem', textAlign: 'center', background: 'rgba(99,102,241,0.02)',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            onClick={() => {
              const files = ['medical_certificate_2026.pdf', 'parental_consent_signed.pdf', 'passport_scan.jpg'];
              const randomFile = files[Math.floor(Math.random() * files.length)];
              handleUploadDocument(randomFile);
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-purple)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)'}
            >
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📤</span>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>Drag & Drop file or click to browse</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Supports PDF, JPG or PNG (Max 5MB)</p>
              <span style={{
                display: 'inline-block', marginTop: '1rem', background: 'rgba(255,255,255,0.05)',
                padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, color: '#38bdf8'
              }}>Click to simulate upload</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          DYNAMIC MODAL 2: INTERACTIVE ROLL CALL GRID
          ========================================================= */}
      {activeAttendanceEvent && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 5, 10, 0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 2000, padding: '1rem'
        }}>
          <div className="glass-card" style={{
            width: '100%', maxWidth: '600px', padding: '2.25rem',
            border: '1px solid rgba(255,255,255,0.08)', position: 'relative',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <button onClick={() => setActiveAttendanceEvent(null)} style={{
              position: 'absolute', top: '1.25rem', right: '1.25rem',
              background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)',
              fontSize: '1.25rem', cursor: 'pointer'
            }}>✕</button>

            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', fontWeight: 800 }}>ATTENDANCE REGISTER</span>
              <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', marginTop: '0.25rem' }}>{activeAttendanceEvent.title}</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Squad assigned: {activeAttendanceEvent.team} • Location: {activeAttendanceEvent.location}</p>
            </div>

            {/* List of squad players with status controllers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              {players
                .filter(p => activeAttendanceEvent.team === 'All' || p.team === activeAttendanceEvent.team)
                .map(p => {
                  const currentStatus = attendanceStatuses[p.id] || 'present';
                  return (
                    <div key={p.id} style={{
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'white' }}>{p.name}</span>
                      
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {[
                          { key: 'present', label: 'Present ✅', activeBg: 'var(--accent-green)', activeColor: '#000', idleBg: 'rgba(52,211,153,0.06)', idleColor: '#34d399' },
                          { key: 'absent', label: 'Absent ❌', activeBg: 'var(--accent-pink)', activeColor: '#fff', idleBg: 'rgba(244,114,182,0.06)', idleColor: '#f472b6' },
                          { key: 'excused', label: 'Excused 💤', activeBg: 'var(--accent-amber)', activeColor: '#000', idleBg: 'rgba(245,158,11,0.06)', idleColor: '#fbbf24' }
                        ].map(btn => {
                          const isActive = currentStatus === btn.key;
                          return (
                            <button
                              key={btn.key}
                              onClick={() => setAttendanceStatuses(prev => ({ ...prev, [p.id]: btn.key as any }))}
                              style={{
                                background: isActive ? btn.activeBg : btn.idleBg,
                                border: 'none',
                                color: isActive ? btn.activeColor : btn.idleColor,
                                padding: '0.35rem 0.6rem', borderRadius: '6px',
                                fontSize: '0.75rem', fontWeight: isActive ? 800 : 600,
                                cursor: 'pointer', transition: 'all 0.15s'
                              }}
                            >
                              {btn.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>

            <button
              onClick={handleSubmitRollCall}
              className="glow-btn"
              style={{
                width: '100%', padding: '0.85rem', borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--accent-green), var(--accent-blue))',
                color: '#000', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer'
              }}
            >
              Submit Roll-Call & Grant Squad XP (+25 XP)
            </button>
          </div>
        </div>
      )}

      {selectedMarkAsPaidInvoice && (
        <MarkAsPaidModal
          invoice={selectedMarkAsPaidInvoice}
          onClose={() => setSelectedMarkAsPaidInvoice(null)}
          onConfirm={handleConfirmManualPayment}
          isLoading={isMarkAsPaidLoading}
        />
      )}

      {createLoginPlayerId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: '1rem',
        }}>
          <div className="glass-card" style={{ maxWidth: '420px', width: '100%', padding: '2rem' }}>
            <h4 style={{ margin: '0 0 1rem', color: 'white' }}>Create Enfant login</h4>
            <form onSubmit={handleCreateChildLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="email"
                required
                placeholder="child@email.com"
                value={childLoginEmail}
                onChange={e => setChildLoginEmail(e.target.value)}
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
              />
              <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input type="checkbox" checked={useSamePasswordForChild} onChange={e => setUseSamePasswordForChild(e.target.checked)} />
                Same password as my parent account
              </label>
              {!useSamePasswordForChild && (
                <input
                  type="password"
                  required
                  placeholder="Child password"
                  value={childLoginPassword}
                  onChange={e => setChildLoginPassword(e.target.value)}
                  style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                />
              )}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" onClick={() => setCreateLoginPlayerId(null)} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'white', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isCreatingChildLogin} className="glow-btn" style={{ flex: 1, padding: '0.75rem', borderRadius: '8px' }}>
                  {isCreatingChildLogin ? 'Creating…' : 'Create login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isIssueInvoiceOpen && (
        <IssueInvoiceModal
          players={players}
          onClose={() => setIsIssueInvoiceOpen(false)}
          onConfirm={handleIssueNewInvoice}
          isLoading={isIssueInvoiceLoading}
        />
      )}

    </div>
  );
}

