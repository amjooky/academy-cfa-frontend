export type EventTimelineFilter =
  | 'upcoming'
  | 'this_week'
  | 'this_month'
  | 'past'
  | 'all'
  | 'custom';

export const EVENT_TIMELINE_LABELS: Record<EventTimelineFilter, string> = {
  upcoming: 'Upcoming',
  this_week: 'This week',
  this_month: 'This month',
  past: 'Past',
  all: 'All',
  custom: 'Custom range',
};

type TimelineEvent = { date: string; startsAt?: string };

function sortKey(ev: TimelineEvent): string {
  return `${ev.date}T${ev.startsAt || '00:00'}`;
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfWeek(d: Date): Date {
  const start = startOfWeek(d);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function filterAndSortEvents<T extends TimelineEvent>(
  events: T[],
  filter: EventTimelineFilter,
  dateFrom?: string,
  dateTo?: string,
): T[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toDateStr(today);

  let filtered = events;

  switch (filter) {
    case 'upcoming':
      filtered = events.filter(ev => ev.date >= todayStr);
      break;
    case 'past':
      filtered = events.filter(ev => ev.date < todayStr);
      break;
    case 'this_week': {
      const from = toDateStr(startOfWeek(today));
      const to = toDateStr(endOfWeek(today));
      filtered = events.filter(ev => ev.date >= from && ev.date <= to);
      break;
    }
    case 'this_month': {
      const from = toDateStr(new Date(today.getFullYear(), today.getMonth(), 1));
      const to = toDateStr(new Date(today.getFullYear(), today.getMonth() + 1, 0));
      filtered = events.filter(ev => ev.date >= from && ev.date <= to);
      break;
    }
    case 'custom': {
      filtered = events.filter(ev => {
        if (dateFrom && ev.date < dateFrom) return false;
        if (dateTo && ev.date > dateTo) return false;
        return true;
      });
      break;
    }
    case 'all':
    default:
      filtered = events;
  }

  const ascending = filter !== 'past';
  return [...filtered].sort((a, b) => {
    const cmp = sortKey(a).localeCompare(sortKey(b));
    return ascending ? cmp : -cmp;
  });
}
