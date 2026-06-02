export type PedagogyEmptyContext =
  | 'no_player_selected'
  | 'parent_pending'
  | 'parent_no_evals'
  | 'child_no_evals'
  | 'staff_empty_db';

export function getPedagogyEmptyMessage(
  role: string,
  context: PedagogyEmptyContext
): string {
  if (role === 'PARENT') {
    if (context === 'parent_pending' || context === 'no_player_selected') {
      return "Your child's progress will appear here once their enrollment is approved.";
    }
    if (context === 'parent_no_evals') {
      return 'No evaluations yet. Your coach will publish assessments after sessions.';
    }
  }
  if (role === 'PLAYER') {
    if (context === 'child_no_evals' || context === 'no_player_selected') {
      return 'No evaluations yet. Your coach will publish assessments after your sessions.';
    }
  }
  if (role === 'ACADEMY_ADMIN' || role === 'COACH') {
    if (context === 'staff_empty_db') {
      return 'Database is empty. From the project root run: npm run db:reset (with XAMPP MySQL running).';
    }
    if (context === 'no_player_selected') {
      return 'Select a player from the roster to view pedagogical ratings.';
    }
  }
  return 'No data available.';
}

export function getEvalHistoryEmptyMessage(role: string): string {
  if (role === 'PARENT') {
    return 'No evaluations published yet. Check back after your child\'s next training session.';
  }
  if (role === 'PLAYER') {
    return 'No evaluations published yet. Your coach will add assessments after sessions.';
  }
  return 'No evaluations yet for this player.';
}
