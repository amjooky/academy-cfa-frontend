// English locale — en.ts
// Translations is a plain interface (string values) so all locales can freely
// assign different string values without TypeScript literal-type conflicts.

export interface Translations {
  lang: { en: string; fr: string; ar: string };
  login: {
    title: string; subtitle: string;
    tabParent: string; tabChild: string; tabStaff: string;
    submitStaff: string; submitParent: string; submitChild: string;
    loading: string; invalidResponse: string; registerLink: string;
  };
  nav: {
    dashboard: string; myFamily: string; myProfile: string;
    rosters: string; payment: string;
    liveEngine: string; offlineMode: string; loggedInAs: string; signOut: string;
    season: string;
    roleAdmin: string; roleCoach: string; roleParent: string; rolePlayer: string;
  };
  pageTitle: {
    dashboardAdmin: string; dashboardParent: string; dashboardChild: string;
    rosters: string; payment: string;
  };
  pageSubtitle: { parent: string; child: string; staff: string };
  dashboard: {
    loading: string; noData: string; noDataHints: string[];
    activePlayers: string; fromRoster: string;
    coachStaff: string; registeredCoaches: string;
    upcomingSessions: string; noUpcoming: string; next: string;
    revenueCollected: string; pending: string;
    squadEval: string; speed: string; technique: string; tactical: string;
    recentActivity: string; noActivity: string;
    loadingFamily: string; enableChildLogin: string; createLogin: string;
    noChildren: string; subscription: string; due: string;
    noChildLogin: string; childLoginLabel: string; upcoming: string;
    childDashboardInfo: string;
    registeredChildAccounts: string;
    financialStatus: string;
    fullySettled: string;
    pendingBalance: string;
    activeAcademySubscriptions: string;
    upcomingSchedule: string;
    sessionsScheduled: string;
    onboardingTimeline: string;
    kycDocumentDossier: string;
    progressRatings: string;
    dossierDetails: string;
    upcomingTeamSchedule: string;
    sportsInsurance: string;
    identityVerification: string;
    liabilityWaiver: string;
    paySecurelyOnline: string;
    academySubscription: string;
  };
  roster: {
    pendingBoardTitle: string; pendingBoardDesc: string; applicationsPending: string;
    academyRoster: string; playerName: string; teamCategory: string;
    optimalPosition: string; accumulatedXp: string; currentRank: string; rewardsAction: string;
    enrollNewPlayer: string; fullName: string; fullNamePlaceholder: string;
    optimalPositionLabel: string; assignSquad: string; enrollBtn: string;
    positions: { Playmaker: string; Winger: string; 'Center Back': string; 'Defensive Midfielder': string; 'Left Back': string };
  };
  payment: {
    collectedThisMonth: string; invoicesPaid: string; pending: string;
    subscriptions: string; invoices: string; overdue: string; overdueSubscriptions: string;
    annualProjection: string; activeSubscribers: string;
    monthlyOverview: string; monthlyDesc: string; collected: string; expected: string;
    parentSubscriptions: string; subsActive: string; subsOverdue: string; subsPending: string;
    player: string; parentPayer: string; team: string; formula: string;
    amountPeriod: string; nextDue: string; status: string; action: string;
    markPaid: string; statusActive: string; statusOverdue: string; statusPending: string;
    invoiceHistory: string; invoiceHistoryDesc: string; issueInvoice: string;
    invoicePlayer: string; invoicePlan: string; invoiceAmount: string;
    invoiceDate: string; invoiceStatus: string; invoiceMethod: string; invoiceAction: string;
    statusPaid: string; daysLate: string; daysLeft: string; delayLabel: string;
  };
  enrollment: {
    title: string; subtitle: string; parentEmail: string; parentPassword: string;
    parentPhone: string; parentName: string; childName: string; childDob: string;
    childPosition: string; childTeam: string; submit: string; loading: string;
    backToLogin: string; successTitle: string; successDesc: string;
  };
  pendingCard: {
    dob: string; position: string; prefCategory: string; parentContact: string;
    assignSquad: string; approve: string; reject: string;
  };
  notifications: { title: string; markAllRead: string; clearAll: string; empty: string };
  common: {
    all: string; cancel: string; save: string; loading: string; noResults: string;
    rowsPerPage: string; of: string; results: string; signOut: string;
  };
  teams: { 'U17 Elite': string; 'U15 Pro': string; 'U13 Rookie': string };
  plans: { monthly: string; quarterly: string; semester: string; annual: string };
}

const en: Translations = {
  lang: { en: 'English', fr: 'Français', ar: 'العربية' },
  login: {
    title: 'Sign In',
    subtitle: 'Parent and child use separate accounts. Choose the correct tab.',
    tabParent: 'Parent',
    tabChild: 'Player',
    tabStaff: 'Staff',
    submitStaff: 'Sign in as Staff',
    submitParent: 'Sign in as Parent',
    submitChild: 'Sign in as Player',
    loading: 'Signing in…',
    invalidResponse: 'Invalid server response.',
    registerLink: 'Enroll a child (parent + player account) →',
  },
  nav: {
    dashboard: 'Dashboard',
    myFamily: 'My Family',
    myProfile: 'My Profile',
    rosters: 'Rosters',
    payment: 'Payment',
    liveEngine: 'LIVE ENGINE',
    offlineMode: 'OFFLINE MODE',
    loggedInAs: 'LOGGED IN AS',
    signOut: 'Sign Out',
    season: '📅 Season: 2026 Spring',
    roleAdmin: '👑 ADMIN',
    roleCoach: '⚽ COACH',
    roleParent: '👨‍👩‍👧 PARENT',
    rolePlayer: '🏃 PLAYER',
  },
  pageTitle: {
    dashboardAdmin: 'Academy Overview',
    dashboardParent: 'My Children & Academy',
    dashboardChild: 'My Academy Profile',
    rosters: 'Academy Rosters',
    payment: 'Revenue & Player Invoices',
  },
  pageSubtitle: {
    parent: 'View-only access to your linked children — calendar, progress, and billing.',
    child: 'Your personal training calendar and coach evaluations.',
    staff: 'Sports Academy Multi-tenant Dashboard Framework.',
  },
  dashboard: {
    loading: 'Loading data from database…',
    noData: 'No academy data in MySQL yet',
    noDataHints: [
      'Start MySQL in XAMPP Control Panel',
      'From the project root run: npm run db:reset',
      'Refresh this page and sign in on the Staff tab',
    ],
    activePlayers: 'ACTIVE PLAYERS',
    fromRoster: 'From MySQL roster',
    coachStaff: 'COACH STAFF',
    registeredCoaches: 'Registered coaches',
    upcomingSessions: 'UPCOMING SESSIONS',
    noUpcoming: 'No upcoming events',
    next: 'Next:',
    revenueCollected: 'REVENUE COLLECTED',
    pending: 'pending',
    squadEval: 'Squad Evaluation Averages (DB)',
    speed: 'Speed',
    technique: 'Technique',
    tactical: 'Tactical',
    recentActivity: 'Recent Activity Logs',
    noActivity: 'No recent activity in database.',
    loadingFamily: 'Loading your family data…',
    enableChildLogin: 'Enable Player login — your child can sign in on the Player tab to see their own calendar and evaluations.',
    createLogin: '+ Create login for',
    noChildren: 'No children linked to your account yet.',
    subscription: 'Subscription:',
    due: 'due',
    noChildLogin: 'No child login yet',
    childLoginLabel: 'Player login:',
    upcoming: 'Upcoming:',
    childDashboardInfo: 'Use Calendar for your sessions and Progress for coach evaluations.',
    registeredChildAccounts: 'Registered child accounts',
    financialStatus: 'Financial Status',
    fullySettled: 'Fully Settled',
    pendingBalance: 'Pending Balance',
    activeAcademySubscriptions: 'Active academy subscriptions',
    upcomingSchedule: 'Upcoming Schedule',
    sessionsScheduled: 'Scheduled matches and training',
    onboardingTimeline: 'Academy Onboarding Timeline',
    kycDocumentDossier: 'KYC Document Dossier',
    progressRatings: 'Progress Ratings',
    dossierDetails: 'Dossier Details',
    upcomingTeamSchedule: 'Upcoming Team Schedule',
    sportsInsurance: 'Required annually for sports insurance',
    identityVerification: 'Identity verification copy',
    liabilityWaiver: 'Academy liability waiver form',
    paySecurelyOnline: '💳 Pay Securely Online',
    academySubscription: 'Academy Subscription',
  },
  roster: {
    pendingBoardTitle: 'Pending Registrations Board',
    pendingBoardDesc: 'Review public online enrollment submissions. Parents are registered automatically as role PARENT.',
    applicationsPending: 'APPLICATIONS PENDING',
    academyRoster: 'Academy Roster',
    playerName: 'Player Name',
    teamCategory: 'Team Category',
    optimalPosition: 'Optimal Position',
    accumulatedXp: 'Accumulated XP',
    currentRank: 'Current Rank',
    rewardsAction: 'Rewards Action',
    enrollNewPlayer: 'Enroll New Player',
    fullName: 'Full Name',
    fullNamePlaceholder: 'e.g. Aissa Laidouni',
    optimalPositionLabel: 'Optimal Position',
    assignSquad: 'Assign Squad Category',
    enrollBtn: 'Enroll Player & Sync',
    positions: {
      Playmaker: 'Playmaker',
      Winger: 'Winger',
      'Center Back': 'Center Back',
      'Defensive Midfielder': 'Defensive Midfielder',
      'Left Back': 'Left Back',
    },
  },
  payment: {
    collectedThisMonth: 'Collected this month',
    invoicesPaid: 'invoices paid',
    pending: 'Pending',
    subscriptions: 'subscriptions',
    invoices: 'invoices',
    overdue: 'Overdue',
    overdueSubscriptions: 'overdue subscriptions',
    annualProjection: 'Annual projection',
    activeSubscribers: 'active subscribers',
    monthlyOverview: 'Monthly Revenue Overview — 2026',
    monthlyDesc: 'Collected vs expected revenue per month',
    collected: 'Collected',
    expected: 'Expected',
    parentSubscriptions: 'Parent Subscriptions',
    subsActive: 'active',
    subsOverdue: 'overdue',
    subsPending: 'pending',
    player: 'Player',
    parentPayer: 'Parent / Payer',
    team: 'Team',
    formula: 'Plan',
    amountPeriod: 'Amount / Period',
    nextDue: 'Next Due',
    status: 'Status',
    action: 'Action',
    markPaid: '✅ Mark as Paid',
    statusActive: '✓ ACTIVE',
    statusOverdue: '⏰ OVERDUE',
    statusPending: '⏳ PENDING',
    invoiceHistory: 'Invoice History',
    invoiceHistoryDesc: 'All issued invoices — click to mark as paid',
    issueInvoice: '+ Issue Invoice',
    invoicePlayer: 'Player',
    invoicePlan: 'Plan',
    invoiceAmount: 'Amount',
    invoiceDate: 'Date',
    invoiceStatus: 'Status',
    invoiceMethod: 'Method',
    invoiceAction: 'Action',
    statusPaid: 'PAID',
    daysLate: 'd late',
    daysLeft: 'd left',
    delayLabel: 'delay',
  },
  enrollment: {
    title: 'Online Enrollment',
    subtitle: 'Create a parent account and register your child in CFA.',
    parentEmail: 'Parent Email',
    parentPassword: 'Password',
    parentPhone: 'Phone (optional)',
    parentName: 'Parent Full Name (optional)',
    childName: "Child's Full Name",
    childDob: 'Date of Birth',
    childPosition: 'Preferred Position',
    childTeam: 'Preferred Squad',
    submit: 'Submit Registration',
    loading: 'Submitting…',
    backToLogin: '← Back to login',
    successTitle: 'Registration submitted!',
    successDesc: 'An admin will review your application. You will be notified once approved.',
  },
  pendingCard: {
    dob: 'DOB:',
    position: 'Position:',
    prefCategory: 'Pref. Category:',
    parentContact: 'PARENT CONTACT',
    assignSquad: 'Assign Squad Category',
    approve: 'Approve',
    reject: 'Reject',
  },
  notifications: {
    title: 'Notifications',
    markAllRead: 'Mark all read',
    clearAll: 'Clear all',
    empty: 'No notifications',
  },
  common: {
    all: 'All',
    cancel: 'Cancel',
    save: 'Save',
    loading: 'Loading…',
    noResults: 'No results.',
    rowsPerPage: 'Rows per page:',
    of: 'of',
    results: 'results',
    signOut: 'Sign Out',
  },
  teams: {
    'U17 Elite': 'U17 Elite',
    'U15 Pro': 'U15 Pro',
    'U13 Rookie': 'U13 Rookie',
  },
  plans: {
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    semester: 'Semester',
    annual: 'Annual',
  },
};

export default en;
