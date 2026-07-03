/** Convert CN/AU mobile input to E.164 for Supabase Auth. */
import { normalizePhone } from '../data/auth';

export function toE164Phone(phone: string): string {
  const normalized = normalizePhone(phone.trim());
  if (normalized.startsWith('+')) return normalized;
  if (/^1[3-9]\d{9}$/.test(normalized)) return `+86${normalized}`;
  if (normalized.startsWith('61')) return `+${normalized}`;
  if (normalized.startsWith('0')) return `+61${normalized.slice(1)}`;
  return normalized;
}
