import { safetyApi } from '../api';
import { API_USE_MOCK_FALLBACK } from '../api/config';

export interface BlocklistUser {
  userId: string;
  nickname: string;
}

export interface SafetyReportRow {
  id: string;
  targetType: string;
  status: string;
  createdAt: string;
}

export async function fetchBlocklist(isLoggedIn: boolean): Promise<BlocklistUser[]> {
  if (isLoggedIn) {
    try {
      return await safetyApi.getBlocklist();
    } catch {
      if (!API_USE_MOCK_FALLBACK) throw new Error('blocklist_load_failed');
    }
  }
  return [];
}

export async function unblockUser(userId: string, isLoggedIn: boolean): Promise<void> {
  if (!isLoggedIn) throw new Error('login_required');
  try {
    await safetyApi.unblockUser(userId);
  } catch {
    if (!API_USE_MOCK_FALLBACK) throw new Error('blocklist_unblock_failed');
  }
}

export async function blockUser(userId: string, isLoggedIn: boolean): Promise<void> {
  if (!isLoggedIn) throw new Error('login_required');
  try {
    await safetyApi.blockUser(userId);
  } catch {
    if (!API_USE_MOCK_FALLBACK) throw new Error('block_failed');
  }
}

export async function submitReport(
  body: { targetType: 'listing' | 'user'; targetId: string; reason: string; details?: string },
  isLoggedIn: boolean,
): Promise<void> {
  if (!isLoggedIn) throw new Error('login_required');
  try {
    await safetyApi.submitReport(body);
  } catch {
    if (!API_USE_MOCK_FALLBACK) throw new Error('report_failed');
  }
}

export async function fetchReports(isLoggedIn: boolean): Promise<SafetyReportRow[]> {
  if (!isLoggedIn) return [];
  try {
    const items: SafetyReportRow[] = [];
    let page = 1;
    let hasMore = true;
    while (hasMore && page <= 25) {
      const result = await safetyApi.listReports({ page, pageSize: 50 });
      items.push(...result.items);
      hasMore = result.hasMore;
      page += 1;
    }
    return items;
  } catch {
    if (!API_USE_MOCK_FALLBACK) throw new Error('reports_load_failed');
  }
  return [];
}
