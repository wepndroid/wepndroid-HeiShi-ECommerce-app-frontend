/** ISO calendar date for bundle pickup deadline (YYYY-MM-DD). */
export function formatPickupDateIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parsePickupDateIso(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatPickupDateLabel(iso: string, language: string): string {
  const parsed = parsePickupDateIso(iso);
  if (!parsed) return iso;
  const locale = language.startsWith('zh') ? 'zh-CN' : 'en-AU';
  return parsed.toLocaleDateString(locale, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function buildPickupDateOptions(minDate: Date, count = 365): string[] {
  const options: string[] = [];
  const cursor = new Date(minDate);
  cursor.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i += 1) {
    options.push(formatPickupDateIso(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return options;
}

export function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/** Default pickup date when none selected — one week from today. */
export function defaultPickupDate(): Date {
  const date = startOfToday();
  date.setDate(date.getDate() + 7);
  return date;
}
