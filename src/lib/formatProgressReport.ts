export interface ProgressReportPayload {
  playerName: string;
  team?: string;
  position?: string;
  dob?: string | null;
  age?: number | null;
  xp?: number;
  rank?: string;
  metrics?: {
    speedRating?: number;
    technicalRating?: number;
    tacticsRating?: number;
  };
  report: {
    summary: string;
    strengths: string[];
    areasToImprove: string[];
    developmentPlanRecommendations: string[];
  };
  engine?: string;
  generatedAt?: string;
}

export function formatProgressReportText(data: ProgressReportPayload): string {
  const lines: string[] = [
    '==================================================',
    '   ATHLETICA SOCCER ACADEMY — PLAYER DOSSIER',
    '==================================================',
    '',
    `Player Name: ${data.playerName}`,
    `Assigned Squad: ${data.team || '—'}`,
    `Optimal Position: ${data.position || '—'}`,
    data.dob ? `Date of Birth: ${data.dob}` : '',
    data.age != null ? `Age: ${data.age}` : '',
    `Accumulated XP: ${data.xp ?? 0} XP`,
    `Current Rank: ${(data.rank || 'rookie').toUpperCase()}`,
    `Generated At: ${data.generatedAt ? new Date(data.generatedAt).toLocaleString() : new Date().toLocaleString()}`,
    data.engine ? `Report Engine: ${data.engine}` : '',
    '',
    '--------------------------------------------------',
    'PERFORMANCE METRICS',
    `  Speed / Stamina: ${data.metrics?.speedRating ?? '—'} / 10`,
    `  Technical:       ${data.metrics?.technicalRating ?? '—'} / 10`,
    `  Tactical:        ${data.metrics?.tacticsRating ?? '—'} / 10`,
    '',
    '--------------------------------------------------',
    'EXECUTIVE SUMMARY',
    data.report.summary,
    '',
    '--------------------------------------------------',
    'STRENGTHS',
    ...data.report.strengths.map((s) => `* ${s}`),
    '',
    '--------------------------------------------------',
    'AREAS TO IMPROVE',
    ...data.report.areasToImprove.map((s) => `* ${s}`),
    '',
    '--------------------------------------------------',
    'DEVELOPMENT PLAN RECOMMENDATIONS:',
    ...data.report.developmentPlanRecommendations.map((s) => `* ${s}`),
    '==================================================',
  ];
  return lines.filter((l) => l !== undefined).join('\n');
}

export function buildOfflineProgressReport(player: {
  name: string;
  team?: string;
  position?: string;
  dob?: string;
  xp?: number;
  rank?: string;
}, pedagogy: { technical: number; speed: number; tactical: number; notes: string }): ProgressReportPayload {
  const recs: string[] = [];
  if (pedagogy.technical < 7) {
    recs.push('Increase technical control drills: rondos, tight-space first touch, and weak-foot repetitions.');
  }
  if (pedagogy.speed < 7) {
    recs.push('Add repeat-sprint and acceleration work (10–20m) with full recovery between reps.');
  }
  if (pedagogy.tactical < 7) {
    recs.push('Practice pressing triggers and defensive shape in small-sided games with coach freeze resets.');
  }
  if (pedagogy.notes && pedagogy.notes !== 'No coach notes yet.') {
    recs.push(`Follow up on latest coach note: "${pedagogy.notes.slice(0, 100)}${pedagogy.notes.length > 100 ? '…' : ''}"`);
  }
  while (recs.length < 3) {
    recs.push('Maintain consistent weekly training attendance and self-review scores with coaching staff.');
  }

  const strengths: string[] = [];
  if (pedagogy.technical >= 7) strengths.push('Solid technical control and dribbling under pressure.');
  if (pedagogy.speed >= 7) strengths.push('Good sprint explosiveness in transitions.');
  if (pedagogy.tactical >= 7) strengths.push('Strong tactical pressing and team play awareness.');
  if (strengths.length === 0) strengths.push('Active participation and coachable mindset in squad sessions.');

  const areas: string[] = [];
  if (pedagogy.technical < 7) areas.push('Technical ball control and passing consistency.');
  if (pedagogy.speed < 7) areas.push('Sprint speed and repeated high-intensity efforts.');
  if (pedagogy.tactical < 7) areas.push('Tactical positioning and coordinated pressing.');

  return {
    playerName: player.name,
    team: player.team,
    position: player.position,
    dob: player.dob,
    xp: player.xp,
    rank: player.rank,
    metrics: {
      speedRating: Math.round(pedagogy.speed),
      technicalRating: Math.round(pedagogy.technical),
      tacticsRating: Math.round(pedagogy.tactical),
    },
    report: {
      summary: `${player.name} (${player.team || 'squad TBD'}) — offline summary based on latest evaluations: speed ${pedagogy.speed}/10, technique ${pedagogy.technical}/10, tactics ${pedagogy.tactical}/10.`,
      strengths,
      areasToImprove: areas.length ? areas : ['Continue building consistency across all three pillars.'],
      developmentPlanRecommendations: recs.slice(0, 5),
    },
    engine: 'Offline fallback (AI service unavailable)',
    generatedAt: new Date().toISOString(),
  };
}
