import { Platform } from 'react-native';
import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

export type GoogleAuthResult =
  | { idToken: string }
  | {
      error:
        | 'unavailable'
        | 'cancelled'
        | 'playServicesUnavailable'
        | 'inProgress'
        | 'configuration'
        | 'tokenMissing'
        | 'failed';
      code?: string;
      message?: string;
    };

const GOOGLE_WEB_CLIENT_ID = (process.env?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '').trim();

let configured = false;

function ensureGoogleConfigured(): boolean {
  if (!GOOGLE_WEB_CLIENT_ID) return false;
  if (!configured) {
    GoogleSignin.configure({
      scopes: ['openid', 'profile', 'email'],
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: false,
    });
    configured = true;
  }
  return true;
}

export function isNativeGoogleLoginConfigured(): boolean {
  return Platform.OS !== 'web' && Boolean(GOOGLE_WEB_CLIENT_ID);
}

export async function requestGoogleIdToken(): Promise<GoogleAuthResult> {
  if (!isNativeGoogleLoginConfigured()) return { error: 'unavailable' };
  if (!ensureGoogleConfigured()) return { error: 'unavailable' };

  try {
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }

    const response = await GoogleSignin.signIn();
    if (isCancelledResponse(response)) return { error: 'cancelled' };
    if (!isSuccessResponse(response) || !response.data.idToken) {
      return { error: 'tokenMissing' };
    }
    return { idToken: response.data.idToken };
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) return { error: 'cancelled' };
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { error: 'playServicesUnavailable' };
      }
      if (error.code === statusCodes.IN_PROGRESS) return { error: 'inProgress' };
      const message = error.message ?? '';
      if (
        error.code === 'DEVELOPER_ERROR'
        || error.code === '10'
        || message.includes('DEVELOPER_ERROR')
        || message.includes('status code: 10')
        || message.includes('Web client')
        || message.includes('server client ID')
      ) {
        return { error: 'configuration', code: error.code, message };
      }
      return { error: 'failed', code: error.code, message };
    }
    return {
      error: 'failed',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
