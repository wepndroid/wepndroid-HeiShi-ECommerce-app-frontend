import type { TFunction } from 'i18next';

/** Legacy sentinel from older notification mappers. */
export const MESSAGE_TIME_YESTERDAY = '__YESTERDAY__';

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function calendarDaysAgo(date: Date, now: Date): number {
  return Math.floor((startOfDay(now).getTime() - startOfDay(date).getTime()) / 86_400_000);
}

function parseMessageTimestamp(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const iso = new Date(trimmed);
  if (!Number.isNaN(iso.getTime())) {
    return iso;
  }

  const match = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/.exec(trimmed);
  if (!match) return null;

  const day = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10) - 1;
  const yearPart = match[3];
  const year = yearPart
    ? Number.parseInt(yearPart.length === 2 ? `20${yearPart}` : yearPart, 10)
    : new Date().getFullYear();
  const parsed = new Date(year, month, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Inbox / message list timestamp in informal relative form. */
export function formatMessageTimeLabel(
  raw: string | null | undefined,
  t: TFunction,
  _language: string,
): string {
  if (!raw) return '';

  if (raw === MESSAGE_TIME_YESTERDAY) {
    return t('common.timeDayAgo');
  }

  const date = parseMessageTimestamp(raw);
  if (!date) {
    return '';
  }

  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffMin = Math.floor(diffMs / 60_000);
  const calDays = calendarDaysAgo(date, now);

  if (calDays === 0) {
    if (diffMin < 1) {
      return t('common.timeNow');
    }
    if (diffMin < 60) {
      return t('common.timeMinutesAgo', { count: diffMin });
    }
    const hours = Math.max(1, Math.floor(diffMs / 3_600_000));
    return t('common.timeHoursAgo', { count: hours });
  }

  if (calDays === 1) {
    return t('common.timeDayAgo');
  }

  if (calDays < 7) {
    return t('common.timeDaysAgo', { count: calDays });
  }

  const weeks = Math.max(1, Math.floor(calDays / 7));
  if (calDays < 30) {
    return t('common.timeWeeksAgo', { count: weeks });
  }

  const months = Math.max(1, Math.floor(calDays / 30));
  if (calDays < 365) {
    return t('common.timeMonthsAgo', { count: months });
  }

  const years = Math.max(1, Math.floor(calDays / 365));
  return t('common.timeYearsAgo', { count: years });
}
