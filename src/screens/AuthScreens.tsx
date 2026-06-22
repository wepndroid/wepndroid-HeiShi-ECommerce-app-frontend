import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../components/typography';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { AuthErrorKey } from '../data/auth';
import { DetailCard, FormCard } from '../components/FormUI';
import { BackButton, Logo, Notice, PillButton, ScreenScroll, TitleBar } from '../components/UI';
import { colors, fonts, radius } from '../theme';
import { filterNumericInput, numericKeyboardType, NumericInputKind } from '../utils/numericInput';

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
  const resolvedKeyboardType = numericKind ? numericKeyboardType(numericKind) : keyboardType;

  const handleChangeText = (text: string) => {
    if (!numericKind) {
      onChangeText(text);
      return;
    }
    const { value: filtered, rejected } = filterNumericInput(text, numericKind);
    if (rejected) {
      onInvalidInput?.();
    }
    onChangeText(filtered);
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999999"
        secureTextEntry={secureTextEntry}
        keyboardType={resolvedKeyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
    </View>
  );
}

function authErrorMessage(t: (key: string) => string, error: AuthErrorKey) {
  return t(`screens.auth.errors.${error}`);
}

export function LoginScreen() {
  const { t } = useTranslation();
  const { nav, login, toast } = useApp();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (submitting) return;
    setSubmitting(true);
    const result = await login(phone, password);
    setSubmitting(false);
    if ('error' in result && result.error) {
      toast(authErrorMessage(t, result.error));
      return;
    }
    toast(t('toast.loginSuccess'));
    nav('profile');
  };

  return (
    <ScreenScroll screenId="login">
      <TitleBar center={t('screens.login.title')} left={<BackButton />} />
      <View style={styles.hero}>
        <Logo size={34} />
        <Text style={styles.heroTitle}>{t('screens.login.headline')}</Text>
        <Text style={styles.heroSub}>{t('screens.login.subtitle')}</Text>
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
        <AuthField
          label={t('screens.login.passwordLabel')}
          value={password}
          onChangeText={setPassword}
          placeholder={t('screens.login.passwordPlaceholder')}
          secureTextEntry
        />
      </FormCard>
      <Notice text={t('screens.login.demoHint')} />
      <PillButton
        label={t('screens.login.submit')}
        variant="brand"
        full
        onPress={() => void handleLogin()}
      />
      <Pressable style={styles.linkRow} onPress={() => nav('register')}>
        <Text style={styles.linkText}>{t('screens.login.toRegister')}</Text>
      </Pressable>
    </ScreenScroll>
  );
}

export function RegisterScreen() {
  const { t } = useTranslation();
  const { nav, register, toast } = useApp();
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    if (submitting) return;
    setSubmitting(true);
    const result = await register({ nickname, phone, password, confirmPassword });
    setSubmitting(false);
    if ('error' in result && result.error) {
      toast(authErrorMessage(t, result.error));
      return;
    }
    toast(t('toast.registerSuccess'));
    nav('profile');
  };

  return (
    <ScreenScroll screenId="register">
      <TitleBar center={t('screens.register.title')} left={<BackButton />} />
      <DetailCard>
        <Text style={styles.heroTitle}>{t('screens.register.headline')}</Text>
        <Text style={styles.heroSub}>{t('screens.register.subtitle')}</Text>
      </DetailCard>
      <FormCard>
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
      <Notice text={t('screens.register.notice')} />
      <PillButton
        label={t('screens.register.submit')}
        variant="brand"
        full
        onPress={() => void handleRegister()}
      />
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
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: fonts.weights.medium,
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
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
});
