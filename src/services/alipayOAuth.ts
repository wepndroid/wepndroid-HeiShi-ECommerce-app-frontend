import * as Linking from 'expo-linking';
import { authApi } from '../api/endpoints/auth';

export type AlipayAuthResult =
  | { authCode: string; oauthState: string }
  | { error: 'unavailable' | 'cancelled' | 'invalidCallback' | 'failed' };

export async function requestAlipayAuthCode(): Promise<AlipayAuthResult> {
  let authorization: Awaited<ReturnType<typeof authApi.alipayAuthorize>>;
  try {
    authorization = await authApi.alipayAuthorize();
  } catch {
    return { error: 'unavailable' };
  }

  return new Promise<AlipayAuthResult>((resolve) => {
    let settled = false;
    const finish = (result: AlipayAuthResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      subscription.remove();
      resolve(result);
    };
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (!url.startsWith(authorization.redirectUri)) return;
      const parsed = Linking.parse(url);
      const authCode = String(
        parsed.queryParams?.auth_code ?? parsed.queryParams?.authCode ?? '',
      ).trim();
      const state = String(parsed.queryParams?.state ?? '').trim();
      if (parsed.queryParams?.error || parsed.queryParams?.error_description) {
        finish({ error: 'cancelled' });
        return;
      }
      if (!authCode || state !== authorization.state) {
        finish({ error: 'invalidCallback' });
        return;
      }
      finish({ authCode, oauthState: state });
    });
    const timeout = setTimeout(() => finish({ error: 'cancelled' }), 10 * 60_000);
    void Linking.openURL(authorization.authorizationUrl).catch(() => {
      finish({ error: 'failed' });
    });
  });
}
