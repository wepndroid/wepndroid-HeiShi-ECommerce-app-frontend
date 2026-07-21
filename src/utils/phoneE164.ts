/** Convert supported local shorthand or an international number to canonical E.164. */
import { normalizePhone } from '../data/auth';

export function toE164Phone(phone: string): string {
  return normalizePhone(phone);
}
