/** Keep calendar dates stable — avoid UTC shift (e.g. 2010-11-03 → 2010-11-02). */
export function toDateOnlyString(raw: unknown): string {
  if (raw == null || raw === '') return '';
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    const iso = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (iso) return iso[1];
  }
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    const y = raw.getFullYear();
    const m = String(raw.getMonth() + 1).padStart(2, '0');
    const d = String(raw.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(raw);
  const head = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return head ? head[1] : s.split('T')[0] || '';
}

export function normalizeDobForSubmit(dob: string): string {
  const m = dob.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  if (!m) return dob.trim();
  return m[1];
}
