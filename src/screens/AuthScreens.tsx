import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../components/typography';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { nav } from '../store/navigation';
import { toast } from '../store/uiStore';
import {
  AuthErrorKey,
  hasRegisterAvatar,
  validateRegisterAvatarStep,
  validateRegisterPhoneStep,
} from '../data/auth';
import {
  sendRegisterCode,
  sendLoginCode,
  loginWithOtp,
  loginWithOAuth,
  registerWithOAuth,
} from '../services/authService';
import { isSupabaseAuthConfigured } from '../api/supabase';
import { pickImagesFromLibrary, type PickedMedia } from '../services/mediaPicker';
import { AppIcon } from '../components/AppIcon';
import { DetailCard, FieldInputStacked, FieldSelectRow, FormCard } from '../components/FormUI';
import { allCityOptions, DEFAULT_REGION } from '../data/region';
import { BackButton, Logo, Notice, PillButton, ScreenScroll, TitleBar } from '../components/UI';
import { colors, fonts, radius } from '../theme';
import { NumericInputKind } from '../utils/numericInput';
import { OAUTH_LOGO_APPLE, OAUTH_LOGO_GOOGLE, OAUTH_LOGO_WECHAT } from '../assets/oauthLogos';

const OAUTH_LOGOS: Record<'google' | 'apple' | 'wechat', number> = {
  google: OAUTH_LOGO_GOOGLE,
  apple: OAUTH_LOGO_APPLE,
  wechat: OAUTH_LOGO_WECHAT,
};

function OAuthButton({
  provider,
  label,
  disabled,
  onPress,
}: {
  provider: 'google' | 'apple' | 'wechat';
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.oauthButton, disabled && styles.oauthButtonDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Image source={OAUTH_LOGOS[provider]} style={styles.oauthButtonLogo} resizeMode="contain" />
    </Pressable>
  );
}

function AuthField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'none',
  numericKind,
  onInvalidInput,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'phone-pad';
  autoCapitalize?: 'none' | 'words';
  numericKind?: NumericInputKind;
  onInvalidInput?: () => void;
}) {
  return (
    <FieldInputStacked
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      numericKind={numericKind}
      onInvalidInput={onInvalidInput}
    />
  );
}

function authErrorMessage(t: (key: string) => string, error: AuthErrorKey) {
  return t(`screens.auth.errors.${error}`);
}

export function LoginScreen() {
  const { t } = useTranslation();
  const login = useAuthStore((s) => s.login);
  const setUser = useAuthStore((s) => s.setUser);
  const [loginMode, setLoginMode] = useState<'password' | 'sms'>('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [oauthSubmitting, setOauthSubmitting] = useState(false);
  const [resendAfter, setResendAfter] = useState(0);
  const socialConfigured = isSupabaseAuthConfigured();

  useEffect(() => {
    if (resendAfter <= 0) return undefined;
    const timer = setTimeout(() => setResendAfter((value) => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [resendAfter]);

  const handleOAuth = async (provider: 'google' | 'apple' | 'wechat') => {
    if (oauthSubmitting) return;
    setOauthSubmitting(true);
    const result = await loginWithOAuth(provider);
    setOauthSubmitting(false);
    if ('pending' in result && result.pending) {
      toast(t('toast.oauthContinueInBrowser'));
      return;
    }
    if ('error' in result) {
      toast(authErrorMessage(t, result.error));
      return;
    }
    if ('user' in result) {
      setUser(result.user);
      toast(t('toast.loginSuccess'));
      nav('profile');
    }
  };

  useEffect(() => {
    if (!socialConfigured) return;
    const sub = Linking.addEventListener('url', () => {
      toast(t('toast.loginSuccess'));
      nav('profile');
    });
    return () => sub.remove();
  }, [nav, socialConfigured, t, toast]);

  const handleLogin = async () => {
    if (submitting) return;
    setSubmitting(true);
    if (loginMode === 'sms') {
      const result = await loginWithOtp(phone, verificationCode);
      setSubmitting(false);
      if ('error' in result) {
        toast(authErrorMessage(t, result.error));
        return;
      }
      toast(t('toast.loginSuccess'));
      nav('profile');
      return;
    }
    const result = await login(phone, password);
    setSubmitting(false);
    if ('error' in result && result.error) {
      toast(authErrorMessage(t, result.error));
      return;
    }
    toast(t('toast.loginSuccess'));
    nav('profile');
  };

  const handleSendLoginCode = async () => {
    if (submitting || resendAfter > 0) return;
    setSubmitting(true);
    const result = await sendLoginCode(phone);
    setSubmitting(false);
    if ('error' in result) {
      toast(authErrorMessage(t, result.error));
      return;
    }
    setResendAfter(result.resendAfter);
    toast(t('screens.login.codeSent'));
    if (result.devCode) {
      toast(t('screens.register.devCodeHint', { code: result.devCode }));
    }
  };

  return (
    <ScreenScroll screenId="login">
      <TitleBar center={t('screens.login.title')} left={<BackButton />} />
      <View style={styles.hero}>
        <Logo size={34} />
        <Text style={styles.heroTitle}>{t('screens.login.headline')}</Text>
        <Text style={styles.heroSub}>{t('screens.login.subtitle')}</Text>
      </View>
      <View style={styles.loginModeRow}>
        <PillButton
          label={t('screens.login.modePassword')}
          variant={loginMode === 'password' ? 'brand' : 'light'}
          onPress={() => setLoginMode('password')}
        />
        <PillButton
          label={t('screens.login.modeSms')}
          variant={loginMode === 'sms' ? 'brand' : 'light'}
          onPress={() => setLoginMode('sms')}
        />
      </View>
      <FormCard>
        <AuthField
          label={t('screens.login.phoneLabel')}
          value={phone}
          onChangeText={setPhone}
          placeholder={t('screens.login.phonePlaceholder')}
          numericKind="phone"
          onInvalidInput={() => toast(t('toast.numberOnly'))}
        />
        {loginMode === 'password' ? (
          <AuthField
            label={t('screens.login.passwordLabel')}
            value={password}
            onChangeText={setPassword}
            placeholder={t('screens.login.passwordPlaceholder')}
            secureTextEntry
          />
        ) : (
          <>
            <AuthField
              label={t('screens.login.codeLabel')}
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholder={t('screens.login.codePlaceholder')}
              numericKind="integer"
              onInvalidInput={() => toast(t('toast.numberOnly'))}
            />
            <PillButton
              label={
                resendAfter > 0
                  ? t('screens.login.resendIn', { seconds: resendAfter })
                  : t('screens.login.sendCode')
              }
              variant="light"
              full
              onPress={() => void handleSendLoginCode()}
            />
          </>
        )}
      </FormCard>
      {loginMode === 'password' ? <Notice text={t('screens.login.demoHint')} /> : null}
      <PillButton
        label={t('screens.login.submit')}
        variant="brand"
        full
        onPress={() => void handleLogin()}
      />
      <Text style={styles.oauthDivider}>{t('screens.login.orContinueWith')}</Text>
      <View style={styles.oauthRow}>
        <OAuthButton
          provider="google"
          label={t('screens.login.google')}
          disabled={oauthSubmitting}
          onPress={() => void handleOAuth('google')}
        />
        <OAuthButton
          provider="apple"
          label={t('screens.login.apple')}
          disabled={oauthSubmitting}
          onPress={() => void handleOAuth('apple')}
        />
        <OAuthButton
          provider="wechat"
          label={t('screens.login.wechat')}
          disabled={oauthSubmitting}
          onPress={() => void handleOAuth('wechat')}
        />
      </View>
      <Pressable style={styles.linkRow} onPress={() => nav('register')}>
        <Text style={styles.linkText}>{t('screens.login.toRegister')}</Text>
      </Pressable>
    </ScreenScroll>
  );
}

type RegisterStep = 'phone' | 'verify';

export function RegisterScreen() {
  const { t } = useTranslation();
  const register = useAuthStore((s) => s.register);
  const setUser = useAuthStore((s) => s.setUser);
  const [step, setStep] = useState<RegisterStep>('phone');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState(DEFAULT_REGION.city);
  const cityOptions = React.useMemo(() => allCityOptions(), []);
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resendAfter, setResendAfter] = useState(0);
  const [pickedAvatar, setPickedAvatar] = useState<PickedMedia | null>(null);
  const [pickingAvatar, setPickingAvatar] = useState(false);
  const [oauthSubmitting, setOauthSubmitting] = useState(false);
  const pickedAvatarRef = useRef<PickedMedia | null>(null);

  const handleOAuth = async (provider: 'google' | 'apple' | 'wechat') => {
    if (oauthSubmitting) return;
    setOauthSubmitting(true);
    const result = await registerWithOAuth(provider, { nickname, city });
    setOauthSubmitting(false);
    if ('pending' in result && result.pending) {
      toast(t('toast.oauthContinueInBrowser'));
      return;
    }
    if ('error' in result) {
      toast(authErrorMessage(t, result.error));
      return;
    }
    if ('user' in result) {
      setUser(result.user);
      toast(t('toast.registerSuccess'));
      nav('profile');
    }
  };

  const getPickedAvatar = () => pickedAvatarRef.current ?? pickedAvatar;

  const syncPickedAvatar = (next: PickedMedia | null) => {
    pickedAvatarRef.current = next;
    setPickedAvatar(next);
  };

  const handlePickAvatar = async () => {
    if (pickingAvatar) return;
    setPickingAvatar(true);
    try {
      const picked = await pickImagesFromLibrary({ max: 1 });
      if (!picked.length) return;
      const asset = picked[0];
      if (!asset.uri?.trim()) return;
      syncPickedAvatar(asset);
    } catch {
      toast(t('toast.mediaPermissionDenied'));
    } finally {
      setPickingAvatar(false);
    }
  };

  useEffect(() => {
    if (resendAfter <= 0) return undefined;
    const timer = setTimeout(() => setResendAfter((value) => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [resendAfter]);

  const validatePhoneStepFields = (): AuthErrorKey | null => {
    if (!nickname.trim()) return 'nicknameRequired';
    return validateRegisterPhoneStep({ phone, city });
  };

  const requestRegisterCode = async (): Promise<{ ok: true; resendAfter: number; devCode?: string } | { ok: false; error: AuthErrorKey }> => {
    const fieldError = validatePhoneStepFields();
    if (fieldError) return { ok: false, error: fieldError };

    setSubmitting(true);
    try {
      const result = await sendRegisterCode(phone);
      if ('error' in result) return { ok: false, error: result.error };
      return { ok: true, resendAfter: result.resendAfter, devCode: result.devCode };
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdvanceToVerify = async () => {
    if (submitting) return;
    const result = await requestRegisterCode();
    if (!result.ok) {
      toast(authErrorMessage(t, result.error));
      return;
    }
    setStep('verify');
    setResendAfter(result.resendAfter);
    toast(t('screens.register.codeSent'));
    if (result.devCode) {
      toast(t('screens.register.devCodeHint', { code: result.devCode }));
    }
  };

  const handleResendCode = async () => {
    if (submitting || resendAfter > 0) return;
    const result = await requestRegisterCode();
    if (!result.ok) {
      toast(authErrorMessage(t, result.error));
      return;
    }
    setResendAfter(result.resendAfter);
    toast(t('screens.register.codeSent'));
    if (result.devCode) {
      toast(t('screens.register.devCodeHint', { code: result.devCode }));
    }
  };

  const handleRegister = async () => {
    if (submitting) return;
    const avatar = getPickedAvatar();
    if (!hasRegisterAvatar(avatar?.uri)) {
      toast(authErrorMessage(t, 'avatarRequired'));
      setStep('verify');
      return;
    }

    setSubmitting(true);
    const result = await register({
      nickname,
      phone,
      password,
      confirmPassword,
      verificationCode,
      avatarUri: avatar!.uri,
      avatarMimeType: avatar!.mimeType,
      avatarFileName: avatar!.fileName,
      city,
    });
    setSubmitting(false);
    if ('error' in result && result.error) {
      toast(authErrorMessage(t, result.error));
      if (result.error === 'avatarRequired') {
        setStep('verify');
      }
      return;
    }
    toast(t('toast.registerSuccess'));
    nav('profile');
  };

  const handleBack = () => {
    setStep('phone');
    setVerificationCode('');
  };

  const avatarUri = getPickedAvatar()?.uri ?? '';
  const avatarReady = hasRegisterAvatar(avatarUri);

  const avatarPickerBlock = (
    <>
      <Text style={styles.avatarLabel}>{t('screens.register.avatarLabel')}</Text>
      <Pressable
        style={[styles.avatarPicker, !avatarReady && styles.avatarPickerEmpty]}
        onPress={() => void handlePickAvatar()}
        disabled={pickingAvatar}
        accessibilityRole="button"
        accessibilityLabel={t('screens.register.avatarAction')}
      >
        {avatarReady ? (
          <Image source={{ uri: avatarUri }} style={styles.avatarImage} resizeMode="cover" />
        ) : (
          <AppIcon name="person" size={28} color={colors.sub} />
        )}
        {pickingAvatar ? (
          <View style={styles.avatarOverlay}>
            <ActivityIndicator color={colors.brand} />
          </View>
        ) : null}
      </Pressable>
      <Text style={[styles.avatarHint, avatarReady && styles.avatarHintReady]}>
        {avatarReady ? t('screens.register.avatarReady') : t('screens.register.avatarHint')}
      </Text>
    </>
  );

  return (
    <ScreenScroll screenId="register">
      <TitleBar
        center={step === 'phone' ? t('screens.register.title') : t('screens.register.verifyTitle')}
        left={step === 'verify' ? <BackButton onPress={handleBack} /> : <BackButton />}
      />
      <DetailCard>
        <Text style={styles.heroTitle}>
          {step === 'phone' ? t('screens.register.headline') : t('screens.register.verifyHeadline')}
        </Text>
        <Text style={styles.heroSub}>
          {step === 'phone'
            ? t('screens.register.subtitle')
            : t('screens.register.verifySubtitle', { phone })}
        </Text>
      </DetailCard>

      {step === 'phone' ? (
        <>
          <FormCard>
            {avatarPickerBlock}
            <AuthField
              label={t('screens.register.nicknameLabel')}
              value={nickname}
              onChangeText={setNickname}
              placeholder={t('screens.register.nicknamePlaceholder')}
              autoCapitalize="words"
            />
            <AuthField
              label={t('screens.register.phoneLabel')}
              value={phone}
              onChangeText={setPhone}
              placeholder={t('screens.register.phonePlaceholder')}
              numericKind="phone"
              onInvalidInput={() => toast(t('toast.numberOnly'))}
            />
            <FieldSelectRow
              icon="location"
              label={t('screens.register.cityLabel')}
              options={cityOptions}
              selectedKey={city}
              onSelect={setCity}
              placeholder={t('screens.register.cityPlaceholder')}
              stacked
            />
          </FormCard>
          <Notice text={t('screens.register.notice')} />
          <PillButton
            label={t('screens.register.sendCode')}
            variant="brand"
            full
            disabled={submitting || pickingAvatar}
            onPress={() => void handleAdvanceToVerify()}
          />
        </>
      ) : (
        <>
          {avatarReady ? (
            <FormCard>
              <View style={styles.verifyAvatarRow}>
                <Image source={{ uri: avatarUri }} style={styles.verifyAvatarImage} resizeMode="cover" />
                <View style={styles.verifyAvatarCopy}>
                  <Text style={styles.verifyAvatarTitle}>{t('screens.register.avatarReady')}</Text>
                  <Text style={styles.verifyAvatarSub}>{nickname.trim()}</Text>
                </View>
              </View>
            </FormCard>
          ) : (
            <FormCard>{avatarPickerBlock}</FormCard>
          )}
          <FormCard>
            <AuthField
              label={t('screens.register.codeLabel')}
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholder={t('screens.register.codePlaceholder')}
              numericKind="integer"
              onInvalidInput={() => toast(t('toast.numberOnly'))}
            />
            <AuthField
              label={t('screens.register.passwordLabel')}
              value={password}
              onChangeText={setPassword}
              placeholder={t('screens.register.passwordPlaceholder')}
              secureTextEntry
            />
            <AuthField
              label={t('screens.register.confirmPasswordLabel')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={t('screens.register.confirmPasswordPlaceholder')}
              secureTextEntry
            />
          </FormCard>
          <Pressable
            style={styles.linkRow}
            disabled={resendAfter > 0 || submitting}
            onPress={() => void handleResendCode()}
          >
            <Text style={[styles.linkText, resendAfter > 0 && styles.linkTextMuted]}>
              {resendAfter > 0
                ? t('screens.register.resendIn', { seconds: resendAfter })
                : t('screens.register.resendCode')}
            </Text>
          </Pressable>
          <PillButton
            label={t('screens.register.submit')}
            variant="brand"
            full
            disabled={submitting}
            onPress={() => void handleRegister()}
          />
        </>
      )}

      <Text style={styles.oauthDivider}>{t('screens.register.orContinueWith')}</Text>
      <View style={styles.oauthRow}>
        <OAuthButton
          provider="google"
          label={t('screens.login.google')}
          disabled={oauthSubmitting}
          onPress={() => void handleOAuth('google')}
        />
        <OAuthButton
          provider="apple"
          label={t('screens.login.apple')}
          disabled={oauthSubmitting}
          onPress={() => void handleOAuth('apple')}
        />
        <OAuthButton
          provider="wechat"
          label={t('screens.login.wechat')}
          disabled={oauthSubmitting}
          onPress={() => void handleOAuth('wechat')}
        />
      </View>

      <Pressable style={styles.linkRow} onPress={() => nav('login')}>
        <Text style={styles.linkText}>{t('screens.register.toLogin')}</Text>
      </Pressable>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    marginBottom: 14,
    gap: 6,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 13,
    lineHeight: 20,
    color: '#777777',
    textAlign: 'center',
  },
  loginModeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  linkRow: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 14,
    color: colors.brand2,
    fontWeight: fonts.weights.medium,
  },
  linkTextMuted: {
    color: colors.sub,
  },
  oauthDivider: {
    marginTop: 16,
    marginBottom: 10,
    textAlign: 'center',
    color: colors.sub,
    fontSize: 13,
  },
  oauthRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 4,
  },
  oauthButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.paper,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  oauthButtonDisabled: {
    opacity: 0.5,
  },
  oauthButtonLogo: {
    width: 24,
    height: 24,
  },
  avatarLabel: {
    fontSize: 13,
    fontWeight: fonts.weights.medium,
    color: colors.text,
    marginBottom: 8,
  },
  avatarPicker: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    overflow: 'hidden',
    marginBottom: 8,
  },
  avatarPickerEmpty: {
    borderStyle: 'dashed',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  avatarHint: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.sub,
    textAlign: 'center',
    marginBottom: 14,
  },
  avatarHintReady: {
    color: colors.brand2,
  },
  verifyAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  verifyAvatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceMuted,
  },
  verifyAvatarCopy: {
    flex: 1,
    minWidth: 0,
  },
  verifyAvatarTitle: {
    fontSize: 14,
    fontWeight: fonts.weights.medium,
    color: colors.text,
  },
  verifyAvatarSub: {
    marginTop: 2,
    fontSize: 12,
    color: colors.sub,
  },
});
