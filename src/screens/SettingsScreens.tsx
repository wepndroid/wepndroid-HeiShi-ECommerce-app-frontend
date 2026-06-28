import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Text, TextInput } from '../components/typography';
import { useTranslation } from 'react-i18next';
import { regionData, getPrimaryAreas } from '../data/region';
import { useApp } from '../context/AppContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { AppIcon, AppIconName } from '../components/AppIcon';
import { StatGrid } from '../components/StatGrid';
import { Logo } from '../components/UI';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useAddresses } from '../hooks/useAddresses';
import { useNotificationSettings } from '../hooks/useNotificationSettings';
import { useTransactionReminderSettings } from '../hooks/useTransactionReminderSettings';
import { useBlocklist } from '../hooks/useBlocklist';
import { addPaymentMethod, removePaymentMethod, setDefaultPaymentMethod } from '../services/paymentsService';
import { addPayoutMethod, bindVerification, removePayoutMethod, setDefaultPayoutMethod } from '../services/userService';
import { changePasswordWithAuth } from '../services/authService';
import { shareUserDataExport } from '../services/settingsService';
import { fetchReports, unblockUser, type SafetyReportRow } from '../services/safetyService';
import { usePaymentMethodsSettings, usePayoutMethods } from '../hooks/usePaymentSettings';
import { usePrivacySettings } from '../hooks/usePrivacySettings';
import { useCreditProfile, useReviewSummary, useVerificationStatus } from '../hooks/useTrustProfile';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAvatarUpload } from '../hooks/useAvatarUpload';
import type { VerificationStatus } from '../services/userService';
import type { ScreenId } from '../types';
import {
  Chevron,
  DetailCard,
  FieldInputStacked,
  FieldRow,
  FieldSelectRow,
  FormCard,
  ListCard,
  ListIcon,
  ListRow,
  ListRowMain,
  SettingSectionTitle,
  Switch,
  TableNote,
} from '../components/FormUI';
import { allCityOptions, formatLocationLabel, normalizeProfileCity } from '../data/region';
import { normalizeAvatarUrl } from '../utils/sellerAvatar';
import { ApiError } from '../api/client';
import {
  BackButton,
  IconButton,
  EmptyHint,
  EmptyState,
  Notice,
  PillButton,
  ScreenScroll,
  SearchBar,
  TitleBar,
} from '../components/UI';
import { colors, fonts } from '../theme';

const SUPPORT_EMAIL = 'support@heishi.app';

type BindKind = 'wechat' | 'alipay' | 'identity' | 'business';

function nextBindKind(status: VerificationStatus | null): BindKind | null {
  if (!status?.wechatBound) return 'wechat';
  if (!status.alipayBound) return 'alipay';
  if (!status.identityVerified) return 'identity';
  if (!status.businessVerified) return 'business';
  return null;
}

function openSupportEmail() {
  void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('HeyMarket support')}`);
}

export function SettingsScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const { nav, toast, clearCache, cacheSize, refreshCacheSize, logout } = useApp();

  useFocusEffect(
    useCallback(() => {
      void refreshCacheSize();
    }, [refreshCacheSize]),
  );

  return (
    <ScreenScroll screenId="settings">
      <TitleBar center={t('screens.settings.title')} left={<BackButton />} />
      <SettingSectionTitle title={t('common.settingsSections.personal')} />
      <ListCard>
        <ListRow
          left={
            <>
              <ListIcon name="person" />
              <ListRowMain>
                <Text style={styles.rowTitle} numberOfLines={1}>{t('screens.settings.profileTitle')}</Text>
                <Text style={styles.rowSub} numberOfLines={2}>{t('screens.settings.profileSub')}</Text>
              </ListRowMain>
            </>
          }
          right={<Chevron />}
          onPress={() => nav('editProfile')}
        />
        <ListRow
          left={
            <>
              <ListIcon name="location" />
              <ListRowMain>
                <Text style={styles.rowTitle} numberOfLines={1}>{t('screens.settings.addressTitle')}</Text>
                <Text style={styles.rowSub} numberOfLines={2}>{t('screens.settings.addressSub')}</Text>
              </ListRowMain>
            </>
          }
          right={<Chevron />}
          onPress={() => nav('address')}
        />
        <ListRow
          left={
            <>
              <ListIcon name="shield" />
              <ListRowMain>
                <Text style={styles.rowTitle} numberOfLines={1}>{t('screens.settings.securityTitle')}</Text>
                <Text style={styles.rowSub} numberOfLines={2}>{t('screens.settings.securitySub')}</Text>
              </ListRowMain>
            </>
          }
          right={<Chevron />}
          onPress={() => nav('accountSafety')}
          border={false}
        />
      </ListCard>
      <SettingSectionTitle title={t('common.settingsSections.trade')} />
      <ListCard>
        <ListRow
          left={
            <>
              <ListIcon name="card" />
              <ListRowMain>
                <Text style={styles.rowTitle} numberOfLines={1}>{t('screens.settings.paymentTitle')}</Text>
                <Text style={styles.rowSub} numberOfLines={2}>{t('screens.settings.paymentSub')}</Text>
              </ListRowMain>
            </>
          }
          right={<Chevron />}
          onPress={() => nav('paymentSettings')}
        />
        <ListRow
          left={
            <>
              <ListIcon name="wallet" />
              <ListRowMain>
                <Text style={styles.rowTitle} numberOfLines={1}>{t('screens.settings.payoutTitle')}</Text>
                <Text style={styles.rowSub} numberOfLines={2}>{t('screens.settings.payoutSub')}</Text>
              </ListRowMain>
            </>
          }
          right={<Chevron />}
          onPress={() => nav('payoutSettings')}
        />
        <ListRow
          left={
            <>
              <ListIcon name="bell" />
              <ListRowMain>
                <Text style={styles.rowTitle} numberOfLines={1}>{t('screens.settings.reminderTitle')}</Text>
                <Text style={styles.rowSub} numberOfLines={2}>{t('screens.settings.reminderSub')}</Text>
              </ListRowMain>
            </>
          }
          right={<Chevron />}
          onPress={() => nav('transactionReminder')}
          border={false}
        />
      </ListCard>
      <SettingSectionTitle title={t('common.settingsSections.notificationsPrivacy')} />
      <ListCard>
        <ListRow
          left={
            <>
              <ListIcon name="chat" />
              <ListRowMain>
                <Text style={styles.rowTitle} numberOfLines={1}>{t('screens.settings.notificationsTitle')}</Text>
                <Text style={styles.rowSub} numberOfLines={2}>{t('screens.settings.notificationsSub')}</Text>
              </ListRowMain>
            </>
          }
          right={<Chevron />}
          onPress={() => nav('notificationSettings')}
        />
        <ListRow
          left={
            <>
              <ListIcon name="privacy" />
              <ListRowMain>
                <Text style={styles.rowTitle} numberOfLines={1}>{t('screens.settings.privacyTitle')}</Text>
                <Text style={styles.rowSub} numberOfLines={2}>{t('screens.settings.privacySub')}</Text>
              </ListRowMain>
            </>
          }
          right={<Chevron />}
          onPress={() => nav('privacySettings')}
        />
        <ListRow
          left={
            <>
              <ListIcon name="broom" />
              <ListRowMain>
                <Text style={styles.rowTitle} numberOfLines={1}>{t('screens.settings.cacheTitle')}</Text>
                <Text style={styles.rowSub} numberOfLines={2}>{cacheSize}</Text>
              </ListRowMain>
            </>
          }
          right={<Chevron />}
          onPress={() => void clearCache()}
          border={false}
        />
      </ListCard>
      <SettingSectionTitle title={t('common.settingsSections.about')} />
      <ListCard>
        <ListRow
          left={
            <>
              <ListIcon name="info" />
              <ListRowMain>
                <Text style={styles.rowTitle} numberOfLines={1}>{t('screens.settings.aboutTitle')}</Text>
                <Text style={styles.rowSub} numberOfLines={2}>{t('screens.settings.aboutSub')}</Text>
              </ListRowMain>
            </>
          }
          right={<Chevron />}
          onPress={() => nav('about')}
        />
        <ListRow
          left={
            <>
              <ListIcon name="document" />
              <ListRowMain>
                <Text style={styles.rowTitle} numberOfLines={1}>{t('screens.settings.agreementTitle')}</Text>
                <Text style={styles.rowSub} numberOfLines={2}>{t('screens.settings.agreementSub')}</Text>
              </ListRowMain>
            </>
          }
          right={<Chevron />}
          onPress={() => nav('agreement')}
        />
        <ListRow
          left={
            <>
              <ListIcon name="privacy" />
              <ListRowMain>
                <Text style={styles.rowTitle} numberOfLines={1}>{t('screens.settings.privacyPolicyTitle')}</Text>
                <Text style={styles.rowSub} numberOfLines={2}>{t('screens.settings.privacyPolicySub')}</Text>
              </ListRowMain>
            </>
          }
          right={<Chevron />}
          onPress={() => nav('privacyPolicy')}
        />
        <ListRow
          left={
            <>
              <ListIcon name="help" />
              <ListRowMain>
                <Text style={styles.rowTitle} numberOfLines={1}>{t('screens.settings.helpTitle')}</Text>
                <Text style={styles.rowSub} numberOfLines={2}>{t('screens.settings.helpSub')}</Text>
              </ListRowMain>
            </>
          }
          right={<Chevron />}
          onPress={() => nav('help')}
          border={false}
        />
      </ListCard>
      <PillButton
        label={t('common.logout')}
        variant="warn"
        full
        onPress={() => void logout()}
        style={{ marginTop: 10 }}
      />
    </ScreenScroll>
  );
}

function verificationStatusLabel(
  t: (key: string) => string,
  kind: 'phone' | 'wechat' | 'alipay' | 'identity' | 'business',
  status: VerificationStatus | null,
  isLoggedIn: boolean,
) {
  if (!status || !isLoggedIn) {
    return kind === 'phone' ? t('common.notEnabled') : t('common.notBound');
  }
  if (kind === 'phone') return status.phoneVerified ? t('common.completed') : t('common.notEnabled');
  if (kind === 'wechat') return status.wechatBound ? t('common.bound') : t('common.notBound');
  if (kind === 'alipay') return status.alipayBound ? t('common.bound') : t('common.notBound');
  if (kind === 'identity') return status.identityVerified ? t('common.completed') : t('common.notEnabled');
  return status.businessVerified ? t('common.completed') : t('common.notEnabled');
}

function verificationStatusColor(
  kind: 'phone' | 'wechat' | 'alipay' | 'identity' | 'business',
  status: VerificationStatus | null,
  isLoggedIn: boolean,
) {
  if (!status || !isLoggedIn) return undefined;
  if (kind === 'phone') return status.phoneVerified ? colors.green : undefined;
  if (kind === 'wechat') return status.wechatBound ? colors.green : undefined;
  if (kind === 'alipay') return status.alipayBound ? colors.green : undefined;
  if (kind === 'identity') return status.identityVerified ? colors.green : undefined;
  return status.businessVerified ? colors.green : undefined;
}

export function TrustScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const { isLoggedIn, authReady } = useApp();
  const { credit } = useCreditProfile(isLoggedIn, authReady);
  const { status } = useVerificationStatus(isLoggedIn, authReady);
  const [reportCount, setReportCount] = React.useState(0);

  React.useEffect(() => {
    if (!authReady || !isLoggedIn) {
      setReportCount(0);
      return;
    }
    fetchReports(isLoggedIn)
      .then((rows) => setReportCount(rows.length))
      .catch(() => setReportCount(0));
  }, [authReady, isLoggedIn]);

  const rows = [
    {
      icon: 'phone' as AppIconName,
      titleKey: 'screens.trust.phoneTitle',
      subKey: 'screens.trust.phoneSub',
      kind: 'phone' as const,
    },
    {
      icon: 'wechat' as AppIconName,
      titleKey: 'screens.trust.wechatTitle',
      subKey: 'screens.trust.wechatSub',
      kind: 'wechat' as const,
    },
    {
      icon: 'alipay' as AppIconName,
      titleKey: 'screens.trust.alipayTitle',
      subKey: 'screens.trust.alipaySub',
      kind: 'alipay' as const,
    },
    {
      icon: 'warning' as AppIconName,
      titleKey: 'screens.trust.reportsTitle',
      subKey: 'screens.trust.reportsSub',
      status: String(reportCount),
      border: false,
      onPress: () => router.push('/safety/reports'),
    },
  ] as const;

  return (
    <ScreenScroll screenId="creditProfile">
      <TitleBar center={t('screens.trust.title')} left={<BackButton />} />
      <DetailCard>
        <View style={styles.profileTop}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{credit?.score ?? '—'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{t('screens.trust.scoreLabel')}</Text>
            <Text style={styles.profileSub}>{t('screens.trust.scoreDesc')}</Text>
          </View>
        </View>
      </DetailCard>
      <ListCard>
        {rows.map((row) => (
          <ListRow
            key={row.titleKey}
            left={
              <>
                <ListIcon name={row.icon} />
                <ListRowMain>
                  <Text style={styles.rowTitle} numberOfLines={1}>{t(row.titleKey)}</Text>
                  <Text style={styles.rowSub} numberOfLines={2}>{t(row.subKey)}</Text>
                </ListRowMain>
              </>
            }
            right={
              'kind' in row ? (
                <Text
                  style={[
                    styles.statusText,
                    verificationStatusColor(row.kind, status, isLoggedIn) && {
                      color: verificationStatusColor(row.kind, status, isLoggedIn),
                    },
                  ]}
                  numberOfLines={1}
                >
                  {verificationStatusLabel(t, row.kind, status, isLoggedIn)}
                </Text>
              ) : (
                <Text style={styles.statusText} numberOfLines={1}>{row.status}</Text>
              )
            }
            border={'border' in row ? row.border !== false : true}
            onPress={'onPress' in row ? row.onPress : undefined}
          />
        ))}
      </ListCard>
      <Notice text={t('screens.trust.notice')} />
    </ScreenScroll>
  );
}

function SimplePage({ screenId, title, children }: { screenId: ScreenId; title: string; children: React.ReactNode }) {
  return (
    <ScreenScroll screenId={screenId}>
      <TitleBar center={title} left={<BackButton />} />
      {children}
    </ScreenScroll>
  );
}

export function EditProfileScreen() {
  const { t, i18n } = useTranslation();
  useAuthGuard();
  const { toast, user, isLoggedIn, authReady, updateUser, region } = useApp();
  const { profile, saving, save } = useUserProfile(user, authReady);
  const { pickAndUpload, uploading } = useAvatarUpload(isLoggedIn);
  const cityOptions = React.useMemo(() => allCityOptions(), []);
  const [nickname, setNickname] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [city, setCity] = React.useState(() => normalizeProfileCity(region.city));
  const [avatarUrl, setAvatarUrl] = React.useState<string | undefined>();

  React.useEffect(() => {
    if (!profile) return;
    setNickname(profile.nickname);
    setBio(profile.bio ?? '');
    setCity(normalizeProfileCity(profile.city));
    setAvatarUrl(profile.avatarUrl);
  }, [profile]);

  const handlePickAvatar = async () => {
    try {
      const url = await pickAndUpload();
      if (!url) return;
      const next = await save({ avatarUrl: url });
      const persisted = next.avatarUrl ?? url;
      setAvatarUrl(persisted);
      updateUser({ avatarUrl: persisted });
      toast(t('toast.profileSaved'));
    } catch (error) {
      if (error instanceof Error && error.message === 'permission_denied') {
        toast(t('toast.mediaPermissionDenied'));
      } else if (error instanceof ApiError && error.status === 401) {
        toast(t('toast.loginRequired'));
      } else {
        toast(t('toast.avatarUploadFailed'));
      }
    }
  };

  const handleSave = async () => {
    try {
      const next = await save({
        nickname: nickname.trim(),
        bio: bio.trim(),
        city,
        language: i18n.language.startsWith('zh') ? 'zh' : 'en',
        avatarUrl,
      });
      updateUser({ nickname: next.nickname, avatarUrl: next.avatarUrl });
      toast(t('toast.profileSaved'));
    } catch {
      toast(t('toast.publishFailed'));
    }
  };

  const avatarLetter = (profile?.nickname ?? user?.nickname ?? 'H').charAt(0).toUpperCase();
  const displayAvatarUrl = normalizeAvatarUrl(avatarUrl);

  return (
    <SimplePage screenId="editProfile" title={t('screens.editProfile.title')}>
      <DetailCard>
        <Pressable
          style={styles.profileTop}
          onPress={() => void handlePickAvatar()}
          disabled={uploading}
          accessibilityRole="button"
          accessibilityLabel={t('screens.editProfile.changeAvatar')}
        >
          <View style={styles.profileAvatar}>
            {displayAvatarUrl ? (
              <Image
                key={displayAvatarUrl}
                source={{ uri: displayAvatarUrl }}
                style={styles.profileAvatarImage}
              />
            ) : (
              <Text style={styles.profileAvatarText}>{avatarLetter}</Text>
            )}
            {uploading ? (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color={colors.brand} />
              </View>
            ) : null}
          </View>
          <View>
            <Text style={styles.profileName}>{profile?.nickname ?? user?.nickname ?? t('common.guest')}</Text>
            <Text style={styles.profileSub}>{t('screens.editProfile.changeAvatar')}</Text>
          </View>
        </Pressable>
      </DetailCard>
      <FormCard>
        <FieldInputStacked
          label={t('common.fields.nickname')}
          value={nickname}
          onChangeText={setNickname}
          placeholder={t('common.fields.nickname')}
        />
        <FieldInputStacked
          label={t('common.fields.bio')}
          value={bio}
          onChangeText={setBio}
          placeholder={t('screens.editProfile.bioSample')}
          multiline
        />
        <FieldSelectRow
          stacked
          label={t('common.fields.city')}
          options={cityOptions}
          selectedKey={city}
          onSelect={setCity}
          placeholder={t('common.placeholders.selectOption')}
        />
        <FieldRow
          label={t('common.fields.language')}
          value={i18n.language.startsWith('zh') ? t('common.chinese') : t('common.english')}
        />
      </FormCard>
      <LanguageSwitcher />
      <PillButton
        label={saving ? t('common.save') : t('common.save')}
        variant="brand"
        full
        onPress={() => void handleSave()}
      />
    </SimplePage>
  );
}

export function AddressScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const { toast, user, isLoggedIn, authReady, region } = useApp();
  const { profile } = useUserProfile(user, authReady);
  const { addresses, add, update, remove } = useAddresses(isLoggedIn, authReady);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [area, setArea] = useState('');
  const [meetupSpot, setMeetupSpot] = useState('');

  const profileCity = normalizeProfileCity(profile?.city ?? region.city);
  const areaOptions = React.useMemo(() => {
    for (const group of regionData) {
      const city = group.cities.find((row) => row.name === profileCity);
      if (city) return getPrimaryAreas(city);
    }
    return [profileCity];
  }, [profileCity]);

  const resetEditor = () => {
    setEditingId(null);
    setLabel('');
    setArea(areaOptions[0] ?? profileCity);
    setMeetupSpot('');
  };

  const startAdd = () => {
    resetEditor();
    setEditingId('new');
    setLabel(t('screens.address.addSpot'));
  };

  const startEdit = (row: { id: string; label: string; area: string; meetupSpot?: string }) => {
    setEditingId(row.id);
    setLabel(row.label);
    setArea(row.area);
    setMeetupSpot(row.meetupSpot ?? '');
  };

  const handleSave = async () => {
    const trimmedLabel = label.trim();
    const trimmedArea = area.trim();
    if (!trimmedLabel || !trimmedArea) {
      toast(t('toast.addressFieldsRequired'));
      return;
    }
    try {
      if (editingId === 'new') {
        await add({
          label: trimmedLabel,
          area: trimmedArea,
          meetupSpot: meetupSpot.trim() || undefined,
          isDefault: addresses.length === 0,
        });
      } else if (editingId) {
        await update(editingId, {
          label: trimmedLabel,
          area: trimmedArea,
          meetupSpot: meetupSpot.trim() || undefined,
        });
      }
      toast(t('toast.profileSaved'));
      resetEditor();
    } catch {
      toast(t('toast.publishFailed'));
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(t('screens.address.deleteTitle'), t('screens.address.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          void remove(id)
            .then(() => {
              toast(t('toast.profileSaved'));
              resetEditor();
            })
            .catch(() => toast(t('toast.publishFailed')));
        },
      },
    ]);
  };

  return (
    <SimplePage screenId="address" title={t('screens.address.title')}>
      <ListCard>
        {addresses.map((row, index) => (
          <ListRow
            key={row.id}
            left={
              <ListRowMain>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {row.label}
                  {row.isDefault ? ` · ${t('screens.paymentSettings.default')}` : ''}
                </Text>
                <Text style={styles.rowSub} numberOfLines={2}>
                  {formatLocationLabel(row.area)}
                  {row.meetupSpot ? ` — ${row.meetupSpot}` : ''}
                </Text>
              </ListRowMain>
            }
            right={<Chevron />}
            border={index < addresses.length - 1}
            onPress={() => startEdit(row)}
          />
        ))}
        <ListRow
          left={
            <ListRowMain>
              <Text style={styles.rowTitle} numberOfLines={1}>{t('screens.address.addSpot')}</Text>
              <Text style={styles.rowSub} numberOfLines={2}>{t('screens.address.addSpotSub')}</Text>
            </ListRowMain>
          }
          right={<Chevron />}
          onPress={startAdd}
          border={false}
        />
      </ListCard>
      {editingId ? (
        <FormCard>
          <FieldInputStacked
            label={t('screens.address.labelField')}
            value={label}
            onChangeText={setLabel}
            placeholder={t('screens.address.labelPlaceholder')}
          />
          <ListRow
            left={<Text style={styles.rowTitle}>{t('screens.address.areaField')}</Text>}
            right={<Text style={styles.statusText}>{formatLocationLabel(area)}</Text>}
            onPress={() => {
              Alert.alert(
                t('screens.address.areaField'),
                undefined,
                [
                  ...areaOptions.map((option) => ({
                    text: formatLocationLabel(option),
                    onPress: () => setArea(option),
                  })),
                  { text: t('common.cancel'), style: 'cancel' },
                ],
              );
            }}
          />
          <FieldInputStacked
            label={t('screens.address.meetupField')}
            value={meetupSpot}
            onChangeText={setMeetupSpot}
            placeholder={t('screens.address.meetupPlaceholder')}
          />
          <PillButton label={t('common.save')} variant="brand" full onPress={() => void handleSave()} />
          {editingId !== 'new' ? (
            <>
              <PillButton
                label={t('screens.address.setDefault')}
                variant="light"
                full
                onPress={() =>
                  void update(editingId, { isDefault: true }).then(() => toast(t('toast.profileSaved')))
                }
              />
              <PillButton
                label={t('common.delete')}
                variant="light"
                full
                onPress={() => handleDelete(editingId)}
              />
            </>
          ) : null}
          <PillButton label={t('common.cancel')} variant="light" full onPress={resetEditor} />
        </FormCard>
      ) : null}
      <TableNote>{t('screens.address.note')}</TableNote>
    </SimplePage>
  );
}

export function AccountSafetyScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const { toast, nav, isLoggedIn, authReady } = useApp();
  const { status, refresh } = useVerificationStatus(isLoggedIn, authReady);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submittingPassword, setSubmittingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (submittingPassword) return;
    if (newPassword !== confirmPassword) {
      toast(t('screens.auth.errors.passwordMismatch'));
      return;
    }
    setSubmittingPassword(true);
    const result = await changePasswordWithAuth(currentPassword, newPassword);
    setSubmittingPassword(false);
    if ('error' in result) {
      toast(t(`screens.auth.errors.${result.error}`));
      return;
    }
    setShowPasswordForm(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    toast(t('toast.passwordUpdated'));
  };

  const handleContinueSetup = () => {
    const next = nextBindKind(status);
    if (!next) {
      toast(t('toast.verificationComplete'));
      return;
    }
    const title = t(`screens.accountSafety.bindConfirm.${next}`);
    Alert.alert(title, t('screens.accountSafety.bindConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        onPress: () => {
          void bindVerification(next, isLoggedIn)
            .then(() => {
              refresh();
              toast(t('toast.verificationBound'));
            })
            .catch(() => toast(t('toast.settingsUpdateFailed')));
        },
      },
    ]);
  };

  return (
    <SimplePage screenId="accountSafety" title={t('screens.accountSafety.title')}>
      <ListCard>
        <ListRow
          left={
            <>
              <ListIcon name="phone" />
              <ListRowMain>
                <Text style={styles.rowTitle} numberOfLines={1}>{t('screens.trust.phoneTitle')}</Text>
                <Text style={styles.rowSub} numberOfLines={2}>{t('screens.accountSafety.phoneSub')}</Text>
              </ListRowMain>
            </>
          }
          right={
            <Text style={[styles.statusText, verificationStatusColor('phone', status, isLoggedIn) && { color: colors.green }]} numberOfLines={1}>
              {verificationStatusLabel(t, 'phone', status, isLoggedIn)}
            </Text>
          }
        />
        <ListRow
          left={
            <>
              <ListIcon name="lock" />
              <ListRowMain>
                <Text style={styles.rowTitle} numberOfLines={1}>{t('screens.accountSafety.passwordTitle')}</Text>
                <Text style={styles.rowSub} numberOfLines={2}>{t('screens.accountSafety.passwordSub')}</Text>
              </ListRowMain>
            </>
          }
          right={<Chevron />}
          onPress={() => (isLoggedIn ? setShowPasswordForm((open) => !open) : nav('login'))}
        />
        <ListRow
          left={
            <>
              <ListIcon name="wechat" />
              <ListRowMain>
                <Text style={styles.rowTitle} numberOfLines={1}>{t('screens.trust.wechatTitle')}</Text>
                <Text style={styles.rowSub} numberOfLines={2}>{t('screens.trust.wechatSub')}</Text>
              </ListRowMain>
            </>
          }
          right={
            <Text style={[styles.statusText, verificationStatusColor('wechat', status, isLoggedIn) && { color: colors.green }]} numberOfLines={1}>
              {verificationStatusLabel(t, 'wechat', status, isLoggedIn)}
            </Text>
          }
        />
        <ListRow
          left={
            <>
              <ListIcon name="alipay" />
              <ListRowMain>
                <Text style={styles.rowTitle} numberOfLines={1}>{t('screens.trust.alipayTitle')}</Text>
                <Text style={styles.rowSub} numberOfLines={2}>{t('screens.trust.alipaySub')}</Text>
              </ListRowMain>
            </>
          }
          right={<Text style={styles.statusText} numberOfLines={1}>{verificationStatusLabel(t, 'alipay', status, isLoggedIn)}</Text>}
        />
        <ListRow
          left={
            <>
              <ListIcon name="badge" />
              <ListRowMain>
                <Text style={styles.rowTitle} numberOfLines={1}>{t('screens.accountSafety.identityTitle')}</Text>
                <Text style={styles.rowSub} numberOfLines={2}>{t('screens.accountSafety.identitySub')}</Text>
              </ListRowMain>
            </>
          }
          right={<Text style={styles.statusText} numberOfLines={1}>{verificationStatusLabel(t, 'identity', status, isLoggedIn)}</Text>}
          border={false}
        />
      </ListCard>
      {showPasswordForm ? (
        <FormCard>
          <FieldInputStacked
            label={t('screens.accountSafety.currentPassword')}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder={t('screens.login.passwordPlaceholder')}
            secureTextEntry
          />
          <FieldInputStacked
            label={t('screens.accountSafety.newPassword')}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder={t('screens.register.passwordPlaceholder')}
            secureTextEntry
          />
          <FieldInputStacked
            label={t('screens.accountSafety.confirmPassword')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder={t('screens.register.confirmPasswordPlaceholder')}
            secureTextEntry
          />
          <PillButton
            label={t('screens.accountSafety.savePassword')}
            variant="brand"
            full
            onPress={() => void handleChangePassword()}
          />
        </FormCard>
      ) : null}
      <PillButton label={t('common.continueSetup')} variant="brand" full onPress={handleContinueSetup} />
    </SimplePage>
  );
}

export function NotificationSettingsScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const { isLoggedIn, authReady, toast } = useApp();
  const { settings, toggle } = useNotificationSettings(isLoggedIn, authReady, () =>
    toast(t('toast.settingsUpdateFailed')),
  );

  return (
    <SimplePage screenId="notificationSettings" title={t('screens.notificationSettings.title')}>
      <ListCard>
        <ListRow
          left={
            <ListRowMain>
              <Text style={styles.rowTitle} numberOfLines={1}>{t('screens.notificationSettings.intentTitle')}</Text>
              <Text style={styles.rowSub} numberOfLines={2}>{t('screens.notificationSettings.intentSub')}</Text>
            </ListRowMain>
          }
          right={<Switch on={settings?.intentAlerts} onToggle={() => void toggle('intentAlerts')} />}
        />
        <ListRow
          left={<Text style={styles.rowTitle}>{t('screens.notificationSettings.chat')}</Text>}
          right={<Switch on={settings?.chatMessages} onToggle={() => void toggle('chatMessages')} />}
        />
        <ListRow
          left={<Text style={styles.rowTitle}>{t('screens.notificationSettings.review')}</Text>}
          right={<Switch on={settings?.reviewResults} onToggle={() => void toggle('reviewResults')} />}
        />
        <ListRow
          left={<Text style={styles.rowTitle}>{t('screens.notificationSettings.marketing')}</Text>}
          right={<Switch on={settings?.marketing} onToggle={() => void toggle('marketing')} />}
          border={false}
        />
      </ListCard>
    </SimplePage>
  );
}

export function PrivacySettingsScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const { toast, isLoggedIn, authReady } = useApp();
  const { settings, toggle } = usePrivacySettings(isLoggedIn, authReady, () =>
    toast(t('toast.settingsUpdateFailed')),
  );

  return (
    <SimplePage screenId="privacySettings" title={t('screens.privacySettings.title')}>
      <ListCard>
        <ListRow
          left={<Text style={styles.rowTitle}>{t('screens.privacySettings.findByPhone')}</Text>}
          right={<Switch on={settings?.findByPhone} onToggle={() => void toggle('findByPhone')} />}
        />
        <ListRow
          left={<Text style={styles.rowTitle}>{t('screens.privacySettings.showWechatBadge')}</Text>}
          right={<Switch on={settings?.showWechatBadge} onToggle={() => void toggle('showWechatBadge')} />}
        />
        <ListRow
          left={<Text style={styles.rowTitle}>{t('screens.privacySettings.personalization')}</Text>}
          right={<Switch on={settings?.personalization} onToggle={() => void toggle('personalization')} />}
        />
        <ListRow
          left={<Text style={styles.rowTitle}>{t('screens.privacySettings.blocklist')}</Text>}
          right={<Chevron />}
          onPress={() => router.push('/safety/blocklist')}
        />
        <ListRow
          left={<Text style={styles.rowTitle}>{t('screens.privacySettings.downloadData')}</Text>}
          right={<Chevron />}
          onPress={() => {
            void shareUserDataExport(isLoggedIn)
              .then(() => toast(t('toast.dataDownloadReady')))
              .catch(() => toast(t('toast.settingsUpdateFailed')));
          }}
          border={false}
        />
      </ListCard>
    </SimplePage>
  );
}

export function AgreementScreen() {
  const { t } = useTranslation();

  return (
    <SimplePage screenId="agreement" title={t('screens.agreement.title')}>
      <TableNote>{`${t('screens.agreement.s1Title')}\n${t('screens.agreement.s1Body')}`}</TableNote>
      <TableNote>{`${t('screens.agreement.s2Title')}\n${t('screens.agreement.s2Body')}`}</TableNote>
      <TableNote>{`${t('screens.agreement.s3Title')}\n${t('screens.agreement.s3Body')}`}</TableNote>
    </SimplePage>
  );
}

export function PrivacyPolicyScreen() {
  const { t } = useTranslation();

  return (
    <SimplePage screenId="privacyPolicy" title={t('screens.privacyPolicy.title')}>
      <TableNote>{`${t('screens.privacyPolicy.cTitle')}\n${t('screens.privacyPolicy.cBody')}`}</TableNote>
      <TableNote>{`${t('screens.privacyPolicy.uTitle')}\n${t('screens.privacyPolicy.uBody')}`}</TableNote>
      <TableNote>{`${t('screens.privacyPolicy.sTitle')}\n${t('screens.privacyPolicy.sBody')}`}</TableNote>
    </SimplePage>
  );
}

export function HelpScreen() {
  const { t } = useTranslation();
  const { toast } = useApp();
  const [query, setQuery] = useState('');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const faqs = [
    { titleKey: 'screens.help.q1Title', answerKey: 'screens.help.q1Answer' },
    { titleKey: 'screens.help.q2Title', answerKey: 'screens.help.q2Answer' },
    { titleKey: 'screens.help.q3Title', answerKey: 'screens.help.q3Answer' },
    { titleKey: 'screens.help.q4Title', answerKey: 'screens.help.q4Answer' },
  ] as const;

  const normalizedQuery = query.trim().toLowerCase();

  const filteredFaqs = useMemo(() => {
    if (!normalizedQuery) return faqs;
    return faqs.filter((faq) => {
      const title = t(faq.titleKey).toLowerCase();
      const answer = t(faq.answerKey).toLowerCase();
      return title.includes(normalizedQuery) || answer.includes(normalizedQuery);
    });
  }, [faqs, normalizedQuery, t]);

  return (
    <SimplePage screenId="help" title={t('screens.help.title')}>
      <SearchBar
        placeholder={t('common.placeholders.searchProblems')}
        value={query}
        onChangeText={setQuery}
      />
      {!filteredFaqs.length && normalizedQuery ? (
        <EmptyHint text={t('screens.help.noSearchResults')} />
      ) : null}
      <ListCard>
        {filteredFaqs.map((faq, index) => {
          const expanded = expandedKey === faq.titleKey;
          return (
            <ListRow
              key={faq.titleKey}
              onPress={() => setExpandedKey(expanded ? null : faq.titleKey)}
              left={
                <ListRowMain>
                  <Text style={styles.rowTitle}>{t(faq.titleKey)}</Text>
                  {expanded ? (
                    <Text style={styles.helpAnswer}>{t(faq.answerKey)}</Text>
                  ) : null}
                </ListRowMain>
              }
              right={
                <View style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}>
                  <Chevron />
                </View>
              }
              border={index < filteredFaqs.length - 1}
            />
          );
        })}
      </ListCard>
      <PillButton label={t('common.onlineSupport')} variant="brand" full onPress={openSupportEmail} />
    </SimplePage>
  );
}

export function AuthCenterScreen() {
  const { t } = useTranslation();
  const { isLoggedIn, authReady } = useApp();
  const { status } = useVerificationStatus(isLoggedIn, authReady);

  return (
    <SimplePage screenId="authCenter" title={t('screens.authCenter.title')}>
      <DetailCard>
        <View style={styles.profileTop}>
          <View style={styles.profileAvatar}>
            <AppIcon name="shield" size={24} color="#b87000" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{t('screens.authCenter.headline')}</Text>
            <Text style={styles.profileSub}>{t('screens.authCenter.sub')}</Text>
          </View>
        </View>
      </DetailCard>
      <ListCard>
        <ListRow
          left={
            <>
              <ListIcon name="phone" />
              <ListRowMain>
                <Text style={styles.rowTitle} numberOfLines={1}>{t('screens.authCenter.phoneTitle')}</Text>
                <Text style={styles.rowSub} numberOfLines={2}>{t('screens.authCenter.phoneSub')}</Text>
              </ListRowMain>
            </>
          }
          right={
            <Text style={[styles.statusText, verificationStatusColor('phone', status, isLoggedIn) && { color: colors.green }]} numberOfLines={1}>
              {verificationStatusLabel(t, 'phone', status, isLoggedIn)}
            </Text>
          }
        />
        <ListRow
          left={
            <>
              <ListIcon name="wechat" />
              <ListRowMain>
                <Text style={styles.rowTitle} numberOfLines={1}>{t('screens.trust.wechatTitle')}</Text>
                <Text style={styles.rowSub} numberOfLines={2}>{t('screens.authCenter.wechatSub')}</Text>
              </ListRowMain>
            </>
          }
          right={
            <Text style={[styles.statusText, verificationStatusColor('wechat', status, isLoggedIn) && { color: colors.green }]} numberOfLines={1}>
              {verificationStatusLabel(t, 'wechat', status, isLoggedIn)}
            </Text>
          }
        />
        <ListRow
          left={
            <>
              <ListIcon name="business" />
              <ListRowMain>
                <Text style={styles.rowTitle} numberOfLines={1}>{t('screens.authCenter.businessTitle')}</Text>
                <Text style={styles.rowSub} numberOfLines={2}>{t('screens.authCenter.businessSub')}</Text>
              </ListRowMain>
            </>
          }
          right={
            <Text style={styles.statusText} numberOfLines={1}>{verificationStatusLabel(t, 'business', status, isLoggedIn)}</Text>
          }
          border={false}
        />
      </ListCard>
    </SimplePage>
  );
}

export function SafetyCenterScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const { isLoggedIn, authReady } = useApp();
  const { entries: blocklist } = useBlocklist(isLoggedIn, authReady);

  return (
    <SimplePage screenId="safetyCenter" title={t('screens.safetyCenter.title')}>
      <DetailCard>
        <View style={styles.profileTop}>
          <View style={styles.profileAvatar}>
            <AppIcon name="lock" size={24} color="#b87000" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{t('screens.safetyCenter.headline')}</Text>
            <Text style={styles.profileSub}>{t('screens.safetyCenter.sub')}</Text>
          </View>
        </View>
      </DetailCard>
      <ListCard>
        <ListRow
          left={
            <>
              <ListIcon name="warning" />
              <ListRowMain>
                <Text style={styles.rowTitle} numberOfLines={1}>{t('screens.safetyCenter.reportsTitle')}</Text>
                <Text style={styles.rowSub} numberOfLines={2}>{t('screens.safetyCenter.reportsSub')}</Text>
              </ListRowMain>
            </>
          }
          right={<Chevron />}
          onPress={() => router.push('/safety/reports')}
        />
        <ListRow
          left={
            <>
              <ListIcon name="block" />
              <ListRowMain>
                <Text style={styles.rowTitle} numberOfLines={1}>{t('screens.safetyCenter.blocklistTitle')}</Text>
                <Text style={styles.rowSub} numberOfLines={2}>{t('screens.safetyCenter.blocklistSub')}</Text>
              </ListRowMain>
            </>
          }
          right={<Text style={styles.statusText}>{t('common.peopleCount', { count: blocklist.length })}</Text>}
          onPress={() => router.push('/safety/blocklist')}
        />
        <ListRow
          left={
            <>
              <ListIcon name="document" />
              <ListRowMain>
                <Text style={styles.rowTitle} numberOfLines={1}>{t('screens.safetyCenter.rulesTitle')}</Text>
                <Text style={styles.rowSub} numberOfLines={2}>{t('screens.safetyCenter.rulesSub')}</Text>
              </ListRowMain>
            </>
          }
          right={<Chevron />}
          onPress={() => router.push('/safety/trade-rules')}
          border={false}
        />
      </ListCard>
    </SimplePage>
  );
}

export function BlocklistScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const { toast, isLoggedIn, authReady } = useApp();
  const { entries, loading, error, refresh } = useBlocklist(isLoggedIn, authReady);

  const handleUnblock = async (userId: string) => {
    try {
      await unblockUser(userId, isLoggedIn);
      toast(t('toast.blocklistUnblocked'));
      refresh();
    } catch {
      toast(t('toast.settingsUpdateFailed'));
    }
  };

  return (
    <SimplePage screenId="safetyCenter" title={t('screens.blocklist.title')}>
      {loading ? (
        <EmptyHint text={t('common.loading')} />
      ) : error ? (
        <>
          <EmptyState text={t('screens.blocklist.loadFailed')} />
          <PillButton label={t('common.retry')} variant="light" full onPress={refresh} />
        </>
      ) : entries.length ? (
        <ListCard>
          {entries.map((entry, index) => (
            <ListRow
              key={entry.userId}
              left={<Text style={styles.rowTitle}>{entry.nickname}</Text>}
              right={
                <PillButton
                  label={t('screens.blocklist.unblock')}
                  variant="light"
                  onPress={() => void handleUnblock(entry.userId)}
                />
              }
              border={index < entries.length - 1}
            />
          ))}
        </ListCard>
      ) : (
        <EmptyState text={t('screens.blocklist.empty')} />
      )}
    </SimplePage>
  );
}

export function ReportsScreen() {
  const { t, i18n } = useTranslation();
  useAuthGuard();
  const { isLoggedIn, authReady } = useApp();
  const [reports, setReports] = React.useState<SafetyReportRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const refresh = React.useCallback(() => {
    if (!authReady) return;
    setLoading(true);
    setError(false);
    fetchReports(isLoggedIn)
      .then(setReports)
      .catch(() => {
        setError(true);
        setReports([]);
      })
      .finally(() => setLoading(false));
  }, [authReady, isLoggedIn]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const formatTarget = (row: SafetyReportRow) => {
    if (row.targetType === 'listing') return t('screens.reports.targetListing');
    if (row.targetType === 'user') return t('screens.reports.targetUser');
    return row.targetType;
  };

  const formatStatus = (status: string) => {
    if (status === 'pending') return t('screens.reports.statusPending');
    if (status === 'resolved') return t('screens.reports.statusResolved');
    return status;
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(i18n.language.startsWith('zh') ? 'zh-CN' : 'en-AU');
    } catch {
      return iso;
    }
  };

  return (
    <SimplePage screenId="safetyCenter" title={t('screens.reports.title')}>
      {loading ? (
        <EmptyHint text={t('common.loading')} />
      ) : error ? (
        <>
          <EmptyState text={t('screens.reports.loadFailed')} />
          <PillButton label={t('common.retry')} variant="light" full onPress={refresh} />
        </>
      ) : reports.length ? (
        <ListCard>
          {reports.map((row, index) => (
            <ListRow
              key={row.id}
              left={
                <>
                  <Text style={styles.rowTitle}>{formatTarget(row)}</Text>
                  <Text style={styles.rowSub}>{formatDate(row.createdAt)}</Text>
                </>
              }
              right={<Text style={styles.statusText}>{formatStatus(row.status)}</Text>}
              border={index < reports.length - 1}
            />
          ))}
        </ListCard>
      ) : (
        <EmptyState text={t('screens.reports.empty')} />
      )}
    </SimplePage>
  );
}

export function PaymentSettingsScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const { toast, isLoggedIn, authReady } = useApp();
  const { methods, refresh } = usePaymentMethodsSettings(isLoggedIn, authReady);
  const applePayMethod = methods.find((method) => method.type === 'apple_pay');
  const applePayOn = Boolean(applePayMethod);

  const addAndRefresh = async (type: 'card' | 'paypal') => {
    try {
      await addPaymentMethod(type, isLoggedIn);
      toast(t('toast.paymentAdded'));
      refresh();
    } catch {
      toast(t('toast.settingsUpdateFailed'));
    }
  };

  const handleAddPayment = () => {
    Alert.alert(t('screens.paymentSettings.addChooseTitle'), undefined, [
      { text: t('screens.paymentSettings.addCard'), onPress: () => void addAndRefresh('card') },
      { text: t('screens.paymentSettings.addPaypal'), onPress: () => void addAndRefresh('paypal') },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const handleApplePayToggle = async () => {
    try {
      if (applePayOn && applePayMethod) {
        await removePaymentMethod(applePayMethod.id, isLoggedIn);
        toast(t('toast.paymentRemoved'));
      } else {
        await addPaymentMethod('apple_pay', isLoggedIn);
        toast(t('toast.paymentAdded'));
      }
      refresh();
    } catch {
      toast(t('toast.settingsUpdateFailed'));
    }
  };

  const handlePaymentRowPress = (method: (typeof methods)[number]) => {
    if (method.type === 'apple_pay') return;
    Alert.alert(method.label, undefined, [
      ...(method.isDefault
        ? []
        : [
            {
              text: t('screens.paymentSettings.setDefault'),
              onPress: () => {
                void setDefaultPaymentMethod(method.id, isLoggedIn)
                  .then(() => {
                    toast(t('toast.paymentDefaultUpdated'));
                    refresh();
                  })
                  .catch(() => toast(t('toast.settingsUpdateFailed')));
              },
            },
          ]),
      {
        text: t('screens.paymentSettings.remove'),
        style: 'destructive',
        onPress: () => {
          void removePaymentMethod(method.id, isLoggedIn)
            .then(() => {
              toast(t('toast.paymentRemoved'));
              refresh();
            })
            .catch(() => toast(t('toast.settingsUpdateFailed')));
        },
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  return (
    <SimplePage screenId="paymentSettings" title={t('screens.paymentSettings.title')}>
      <ListCard>
        {methods.map((method, index) => (
          <ListRow
            key={method.id}
            left={
              <>
                <ListIcon name={method.type === 'apple_pay' ? 'apple' : method.type === 'paypal' ? 'paypal' : 'card'} />
                <ListRowMain>
                  <Text style={styles.rowTitle} numberOfLines={1}>{method.label}</Text>
                  <Text style={styles.rowSub} numberOfLines={2}>
                    {method.last4 ? `**** ${method.last4}` : method.type === 'apple_pay' ? (applePayOn ? t('screens.paymentSettings.appleOn') : t('common.notBound')) : t('common.notBound')}
                  </Text>
                </ListRowMain>
              </>
            }
            right={
              method.type === 'apple_pay' ? (
                <Switch on={applePayOn} onToggle={() => void handleApplePayToggle()} />
              ) : method.isDefault ? (
                <Text style={[styles.statusText, { color: colors.green }]}>{t('screens.paymentSettings.default')}</Text>
              ) : (
                <Chevron />
              )
            }
            border={index < methods.length - 1}
            onPress={method.type === 'apple_pay' ? undefined : () => handlePaymentRowPress(method)}
          />
        ))}
      </ListCard>
      <PillButton label={t('screens.paymentSettings.add')} variant="brand" full onPress={handleAddPayment} />
    </SimplePage>
  );
}

export function PayoutSettingsScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const { toast, isLoggedIn, authReady } = useApp();
  const { methods, refresh } = usePayoutMethods(isLoggedIn, authReady);

  const addAndRefresh = async (type: 'bank' | 'paypal') => {
    try {
      await addPayoutMethod(type, isLoggedIn);
      toast(t('toast.payoutAdded'));
      refresh();
    } catch {
      toast(t('toast.settingsUpdateFailed'));
    }
  };

  const handleAddPayout = () => {
    Alert.alert(t('screens.payoutSettings.addChooseTitle'), undefined, [
      { text: t('screens.payoutSettings.addBank'), onPress: () => void addAndRefresh('bank') },
      { text: t('screens.payoutSettings.addPaypal'), onPress: () => void addAndRefresh('paypal') },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const handlePayoutRowPress = (method: (typeof methods)[number]) => {
    Alert.alert(method.label, undefined, [
      ...(method.isDefault
        ? []
        : [
            {
              text: t('screens.paymentSettings.setDefault'),
              onPress: () => {
                void setDefaultPayoutMethod(method.id, isLoggedIn)
                  .then(() => {
                    toast(t('toast.payoutDefaultUpdated'));
                    refresh();
                  })
                  .catch(() => toast(t('toast.settingsUpdateFailed')));
              },
            },
          ]),
      {
        text: t('screens.paymentSettings.remove'),
        style: 'destructive',
        onPress: () => {
          void removePayoutMethod(method.id, isLoggedIn)
            .then(() => {
              toast(t('toast.payoutRemoved'));
              refresh();
            })
            .catch(() => toast(t('toast.settingsUpdateFailed')));
        },
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  return (
    <SimplePage screenId="payoutSettings" title={t('screens.payoutSettings.title')}>
      <TableNote>{t('screens.payoutSettings.note')}</TableNote>
      <ListCard>
        {methods.map((method, index) => (
          <ListRow
            key={method.id}
            left={
              <>
                <ListIcon name={method.type === 'bank' ? 'bank' : 'paypal'} />
                <ListRowMain>
                  <Text style={styles.rowTitle} numberOfLines={1}>{method.label}</Text>
                  <Text style={styles.rowSub} numberOfLines={2}>
                    {method.last4 ? `**** ${method.last4}` : t('common.notBound')}
                  </Text>
                </ListRowMain>
              </>
            }
            right={
              method.isDefault ? (
                <Text style={[styles.statusText, { color: colors.green }]}>{t('screens.paymentSettings.default')}</Text>
              ) : (
                <Chevron />
              )
            }
            border={index < methods.length - 1}
            onPress={() => handlePayoutRowPress(method)}
          />
        ))}
      </ListCard>
      <PillButton label={t('screens.payoutSettings.add')} variant="brand" full onPress={handleAddPayout} />
    </SimplePage>
  );
}

export function TransactionReminderScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const { isLoggedIn, authReady, toast } = useApp();
  const { settings, toggle } = useTransactionReminderSettings(isLoggedIn, authReady, () =>
    toast(t('toast.settingsUpdateFailed')),
  );
  const rows = [
    { key: 'payAlerts', label: 'pay' },
    { key: 'shipAlerts', label: 'ship' },
    { key: 'receiveAlerts', label: 'receive' },
    { key: 'disputeAlerts', label: 'dispute' },
  ] as const;

  return (
    <SimplePage screenId="transactionReminder" title={t('screens.transactionReminder.title')}>
      <ListCard>
        {rows.map((row, i) => (
          <ListRow
            key={row.key}
            left={
              <ListRowMain>
                <Text style={styles.rowTitle} numberOfLines={1}>{t(`screens.transactionReminder.${row.label}Title`)}</Text>
                <Text style={styles.rowSub} numberOfLines={2}>{t(`screens.transactionReminder.${row.label}Sub`)}</Text>
              </ListRowMain>
            }
            right={
              <Switch
                on={settings?.[row.key]}
                onToggle={() => void toggle(row.key)}
              />
            }
            border={i < rows.length - 1}
          />
        ))}
      </ListCard>
    </SimplePage>
  );
}

export function TradeRulesScreen() {
  const { t } = useTranslation();

  return (
    <SimplePage screenId="safetyCenter" title={t('screens.tradeRules.title')}>
      <TableNote>{`${t('screens.tradeRules.s1Title')}\n${t('screens.tradeRules.s1Body')}`}</TableNote>
      <TableNote>{`${t('screens.tradeRules.s2Title')}\n${t('screens.tradeRules.s2Body')}`}</TableNote>
      <TableNote>{`${t('screens.tradeRules.s3Title')}\n${t('screens.tradeRules.s3Body')}`}</TableNote>
      <TableNote>{`${t('screens.tradeRules.s4Title')}\n${t('screens.tradeRules.s4Body')}`}</TableNote>
    </SimplePage>
  );
}

export function AboutScreen() {
  const { t } = useTranslation();

  return (
    <SimplePage screenId="about" title={t('screens.about.title')}>
      <DetailCard>
        <View style={{ alignItems: 'center' }}>
          <Logo size={28} />
          <Text style={[styles.profileSub, { textAlign: 'center', marginTop: 8 }]}>{t('screens.about.tagline')}</Text>
          <Text style={styles.profileSub}>{t('screens.settings.versionDemo')}</Text>
        </View>
      </DetailCard>
      <ListCard>
        <ListRow left={<Text style={styles.rowTitle}>{t('screens.about.website')}</Text>} right={<Text style={styles.statusText}>heishi.app</Text>} />
        <ListRow left={<Text style={styles.rowTitle}>{t('screens.about.email')}</Text>} right={<Text style={styles.statusText}>support@heishi.app</Text>} />
        <ListRow left={<Text style={styles.rowTitle}>{t('screens.about.copyright')}</Text>} right={<Text style={styles.statusText}>© HeiShi</Text>} border={false} />
      </ListCard>
    </SimplePage>
  );
}

export function CreditProfileScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const { isLoggedIn, authReady } = useApp();
  const { credit, loading, error, refresh } = useCreditProfile(isLoggedIn, authReady);
  const emptyValue = loading ? '…' : '—';

  return (
    <SimplePage screenId="creditProfile" title={t('screens.creditProfile.title')}>
      {error ? (
        <>
          <EmptyState text={t('screens.creditProfile.loadFailed')} />
          <PillButton label={t('common.retry')} variant="light" full onPress={refresh} />
        </>
      ) : (
        <>
      <DetailCard>
        <View style={{ alignItems: 'center' }}>
          <AppIcon name="badge" size={52} color={colors.brand} />
          <Text style={[styles.profileName, { marginTop: 6 }]}>
            {credit ? String(credit.score) : emptyValue}
          </Text>
          <Text style={[styles.profileSub, { textAlign: 'center' }]}>{t('screens.creditProfile.summary')}</Text>
        </View>
      </DetailCard>
      <StatGrid
        items={[
          {
            value: credit ? String(credit.trades) : emptyValue,
            label: t('screens.creditProfile.tradesLabel'),
          },
          {
            value: credit ? `${credit.completionRate}%` : emptyValue,
            label: t('screens.creditProfile.rateLabel'),
          },
          {
            value: credit ? String(credit.violations) : emptyValue,
            label: t('screens.creditProfile.violationsLabel'),
          },
          {
            value: credit ? String(credit.rating) : emptyValue,
            label: t('screens.creditProfile.ratingLabel'),
          },
        ]}
        style={{ marginBottom: 12 }}
      />
        </>
      )}
    </SimplePage>
  );
}

export function ReviewManageScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const { toast, isLoggedIn, authReady } = useApp();
  const { summary } = useReviewSummary(isLoggedIn, authReady);

  return (
    <SimplePage screenId="reviewManage" title={t('screens.reviewManage.title')}>
      <DetailCard>
        <View style={styles.profileTop}>
          <View style={styles.profileAvatar}><AppIcon name="review" size={28} color={colors.text} /></View>
          <View>
            <Text style={styles.profileName}>
              {summary ? String(summary.score) : t('screens.reviewManage.score')}
            </Text>
            <Text style={styles.profileSub}>{t('screens.reviewManage.summary')}</Text>
          </View>
        </View>
      </DetailCard>
      <PillButton
        label={
          summary?.pendingCount
            ? t('screens.reviewManage.pendingCount', { count: summary.pendingCount })
            : t('screens.reviewManage.pending')
        }
        variant="brand"
        full
        onPress={() => {
          if (summary?.pendingCount) {
            router.push('/profile/orders?filter=pendingReview');
          } else {
            toast(t('toast.noPendingReview'));
          }
        }}
      />
    </SimplePage>
  );
}

export {
  MyListingsScreen,
  FavoritesScreen,
  HistoryScreen,
  OrdersScreen,
  SoldScreen,
  MyServicesScreen,
  FollowingScreen,
  CouponsScreen,
} from './TradeScreens';

const styles = StyleSheet.create({
  rowTitle: {
    fontWeight: fonts.weights.bold,
    color: colors.text,
    fontSize: 14,
  },
  rowSub: {
    color: '#999999',
    marginTop: 3,
    fontSize: 12,
    lineHeight: 16,
    flexShrink: 1,
  },
  helpAnswer: {
    color: '#666666',
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    flexShrink: 1,
  },
  statusText: {
    fontWeight: fonts.weights.bold,
    color: colors.text,
    fontSize: 13,
    textAlign: 'right',
    flexShrink: 0,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  profileAvatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  profileAvatarText: {
    fontSize: 18,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  profileName: {
    fontSize: 17,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  profileSub: {
    marginTop: 4,
    color: '#777777',
    fontSize: 12,
    lineHeight: 17,
  },
  tabs: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  tab: {
    fontSize: 15,
    color: '#676767',
    fontWeight: fonts.weights.medium,
  },
  tabActive: {
    color: colors.text,
    fontWeight: fonts.weights.bold,
  },
  bundleDesc: {
    marginTop: 8,
    marginBottom: 12,
    color: '#777777',
    fontSize: 13,
  },
});
