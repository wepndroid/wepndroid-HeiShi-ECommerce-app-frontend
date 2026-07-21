import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../api/client';
import { ensureAnonymousSession } from './anonymousSessionService';

const PENDING_ACTION_KEY = 'heymarket:pending-action-id';

export interface PendingActionContext {
  actionType: string;
  returnPath: string;
}

export async function createPendingAction(
  returnPath: string,
  actionType: string = 'authentication_gate',
): Promise<void> {
  const anonymousSessionId = await ensureAnonymousSession();
  const action = await apiRequest<{ id: string }>('/pending-actions', {
    auth: false,
    method: 'POST',
    body: {
      actionType,
      returnPath,
      anonymousSessionId,
    },
  });
  await AsyncStorage.setItem(PENDING_ACTION_KEY, action.id);
}

export async function consumePendingAction(): Promise<PendingActionContext | undefined> {
  const actionId = await AsyncStorage.getItem(PENDING_ACTION_KEY);
  if (!actionId) return undefined;
  try {
    const action = await apiRequest<PendingActionContext>(
      `/pending-actions/${encodeURIComponent(actionId)}/consume`,
      { method: 'POST' },
    );
    await AsyncStorage.removeItem(PENDING_ACTION_KEY);
    return action;
  } catch (error) {
    // Do not allow an unconsumed guest intent to survive logout/account changes
    // and later replay against a different user on the same device. The local
    // in-memory return path still restores navigation for this login attempt.
    await AsyncStorage.removeItem(PENDING_ACTION_KEY);
    return undefined;
  }
}
