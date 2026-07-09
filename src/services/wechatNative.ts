declare const require: ((name: string) => any) | undefined;

export type WeChatAuthResult =
  | { code: string }
  | { error: 'unavailable' | 'cancelled' | 'denied' | 'failed' };

type WeChatModule = {
  registerApp?: (appId: string, universalLink?: string) => Promise<boolean> | boolean;
  isWXAppInstalled?: () => Promise<boolean> | boolean;
  sendAuthRequest?: (
    scope: string,
    state: string,
  ) => Promise<{
    code?: string;
    errCode?: number;
    errStr?: string;
  }>;
};

const WECHAT_APP_ID = (process.env?.EXPO_PUBLIC_WECHAT_APP_ID ?? '').trim();
const WECHAT_UNIVERSAL_LINK = (process.env?.EXPO_PUBLIC_WECHAT_UNIVERSAL_LINK ?? '').trim();
const WECHAT_SCOPE = 'snsapi_userinfo';
const WECHAT_STATE = 'heymarket_wechat_login';

function loadWeChatModule(): WeChatModule | null {
  try {
    if (typeof require !== 'function') return null;
    return require('react-native-wechat-lib') as WeChatModule;
  } catch {
    return null;
  }
}

export function isNativeWeChatLoginConfigured(): boolean {
  return Boolean(WECHAT_APP_ID && loadWeChatModule());
}

export async function requestWeChatAuthCode(): Promise<WeChatAuthResult> {
  if (!WECHAT_APP_ID) return { error: 'unavailable' };
  const wechat = loadWeChatModule();
  if (!wechat?.registerApp || !wechat.sendAuthRequest) {
    return { error: 'unavailable' };
  }

  try {
    const registered = await wechat.registerApp(
      WECHAT_APP_ID,
      WECHAT_UNIVERSAL_LINK || undefined,
    );
    if (registered === false) return { error: 'unavailable' };

    if (wechat.isWXAppInstalled) {
      const installed = await wechat.isWXAppInstalled();
      if (!installed) return { error: 'unavailable' };
    }

    const response = await wechat.sendAuthRequest(WECHAT_SCOPE, WECHAT_STATE);
    if (response?.code) return { code: response.code };
    if (response?.errCode === -2) return { error: 'cancelled' };
    if (response?.errCode === -4) return { error: 'denied' };
    return { error: 'failed' };
  } catch {
    return { error: 'failed' };
  }
}
