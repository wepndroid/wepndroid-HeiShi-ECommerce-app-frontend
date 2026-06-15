import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Text } from '../components/typography';
import { useTranslation } from 'react-i18next';
import { ScreenId } from '../types';
import { useApp } from '../context/AppContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { AppIcon, AppIconName } from '../components/AppIcon';
import { StatGrid } from '../components/StatGrid';
import { Logo } from '../components/UI';
import { useAddresses } from '../hooks/useAddresses';
import { useNotificationSettings } from '../hooks/useNotificationSettings';
import { usePaymentMethodsSettings, usePayoutMethods } from '../hooks/usePaymentSettings';
import { usePrivacySettings } from '../hooks/usePrivacySettings';
import { useCreditProfile, useReviewSummary, useVerificationStatus } from '../hooks/useTrustProfile';
import { useUserProfile } from '../hooks/useUserProfile';
import type { VerificationStatus } from '../services/userService';
import {
  Chevron,
  DetailCard,
  FieldRow,
  FormCard,
  ListCard,
  ListIcon,
  ListRow,
  SettingSectionTitle,
  Switch,
  TableNote,
} from '../components/FormUI';
import {
  IconButton,
  Notice,
  PillButton,
  ScreenScroll,
  SearchBar,
  TitleBar,
} from '../components/UI';
import { colors, fonts } from '../theme';

export function SettingsScreen() {
  const { t } = useTranslation();
  const { nav, toast, clearCache, cacheSize, isLoggedIn, logout } = useApp();

  return (
    <ScreenScroll screenId="settings">
      <TitleBar center={t('screens.settings.title')} />
      <SettingSectionTitle title={t('common.settingsSections.personal')} />
      <ListCard>
        <ListRow
          left={
            <>
              <ListIcon name="person" />
              <View>
                <Text style={styles.rowTitle}>{t('screens.settings.profileTitle')}</Text>
                <Text style={styles.rowSub}>{t('screens.settings.profileSub')}</Text>
              </View>
            </>
          }
          right={<Chevron />}
          onPress={() => (isLoggedIn ? nav('editProfile') : nav('login'))}
        />
        <ListRow
          left={
            <>
              <ListIcon name="location" />
              <View>
                <Text style={styles.rowTitle}>{t('screens.settings.addressTitle')}</Text>
                <Text style={styles.rowSub}>{t('screens.settings.addressSub')}</Text>
              </View>
            </>
          }
          right={<Chevron />}
          onPress={() => nav('address')}
        />
        <ListRow
          left={
            <>
              <ListIcon name="shield" />
              <View>
                <Text style={styles.rowTitle}>{t('screens.settings.securityTitle')}</Text>
                <Text style={styles.rowSub}>{t('screens.settings.securitySub')}</Text>
              </View>
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
              <View>
                <Text style={styles.rowTitle}>{t('screens.settings.paymentTitle')}</Text>
                <Text style={styles.rowSub}>{t('screens.settings.paymentSub')}</Text>
              </View>
            </>
          }
          right={<Chevron />}
          onPress={() => nav('paymentSettings')}
        />
        <ListRow
          left={
            <>
              <ListIcon name="wallet" />
              <View>
                <Text style={styles.rowTitle}>{t('screens.settings.payoutTitle')}</Text>
                <Text style={styles.rowSub}>{t('screens.settings.payoutSub')}</Text>
              </View>
            </>
          }
          right={<Chevron />}
          onPress={() => nav('payoutSettings')}
        />
        <ListRow
          left={
            <>
              <ListIcon name="bell" />
              <View>
                <Text style={styles.rowTitle}>{t('screens.settings.reminderTitle')}</Text>
                <Text style={styles.rowSub}>{t('screens.settings.reminderSub')}</Text>
              </View>
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
              <View>
                <Text style={styles.rowTitle}>{t('screens.settings.notificationsTitle')}</Text>
                <Text style={styles.rowSub}>{t('screens.settings.notificationsSub')}</Text>
              </View>
            </>
          }
          right={<Chevron />}
          onPress={() => nav('notificationSettings')}
        />
        <ListRow
          left={
            <>
              <ListIcon name="privacy" />
              <View>
                <Text style={styles.rowTitle}>{t('screens.settings.privacyTitle')}</Text>
                <Text style={styles.rowSub}>{t('screens.settings.privacySub')}</Text>
              </View>
            </>
          }
          right={<Chevron />}
          onPress={() => nav('privacySettings')}
        />
        <ListRow
          left={
            <>
              <ListIcon name="broom" />
              <View>
                <Text style={styles.rowTitle}>{t('screens.settings.cacheTitle')}</Text>
                <Text style={styles.rowSub}>{cacheSize}</Text>
              </View>
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
              <View>
                <Text style={styles.rowTitle}>{t('screens.settings.aboutTitle')}</Text>
                <Text style={styles.rowSub}>{t('screens.settings.aboutSub')}</Text>
              </View>
            </>
          }
          right={<Chevron />}
          onPress={() => nav('about')}
        />
        <ListRow
          left={
            <>
              <ListIcon name="document" />
              <View>
                <Text style={styles.rowTitle}>{t('screens.settings.agreementTitle')}</Text>
                <Text style={styles.rowSub}>{t('screens.settings.agreementSub')}</Text>
              </View>
            </>
          }
          right={<Chevron />}
          onPress={() => nav('agreement')}
        />
        <ListRow
          left={
            <>
              <ListIcon name="privacy" />
              <View>
                <Text style={styles.rowTitle}>{t('screens.settings.privacyPolicyTitle')}</Text>
                <Text style={styles.rowSub}>{t('screens.settings.privacyPolicySub')}</Text>
              </View>
            </>
          }
          right={<Chevron />}
          onPress={() => nav('privacyPolicy')}
        />
        <ListRow
          left={
            <>
              <ListIcon name="help" />
              <View>
                <Text style={styles.rowTitle}>{t('screens.settings.helpTitle')}</Text>
                <Text style={styles.rowSub}>{t('screens.settings.helpSub')}</Text>
              </View>
            </>
          }
          right={<Chevron />}
          onPress={() => nav('help')}
          border={false}
        />
      </ListCard>
      {isLoggedIn ? (
        <PillButton
          label={t('common.logout')}
          variant="warn"
          full
          onPress={() => void logout()}
          style={{ marginTop: 10 }}
        />
      ) : (
        <PillButton
          label={t('screens.login.submit')}
          variant="brand"
          full
          onPress={() => nav('login')}
          style={{ marginTop: 10 }}
        />
      )}
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
  const { isLoggedIn, authReady } = useApp();
  const { credit } = useCreditProfile(isLoggedIn, authReady);
  const { status } = useVerificationStatus(isLoggedIn, authReady);

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
      status: '0',
      border: false,
    },
  ] as const;

  return (
    <ScreenScroll screenId="creditProfile">
      <TitleBar center={t('screens.trust.title')} />
      <DetailCard>
        <View style={styles.profileTop}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{credit?.score ?? 86}</Text>
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
                <View>
                  <Text style={styles.rowTitle}>{t(row.titleKey)}</Text>
                  <Text style={styles.rowSub}>{t(row.subKey)}</Text>
                </View>
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
                >
                  {verificationStatusLabel(t, row.kind, status, isLoggedIn)}
                </Text>
              ) : (
                <Text style={styles.statusText}>{row.status}</Text>
              )
            }
            border={'border' in row ? row.border !== false : true}
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
      <TitleBar center={title} />
      {children}
    </ScreenScroll>
  );
}

export function EditProfileScreen() {
  const { t, i18n } = useTranslation();
  const { toast, user, isLoggedIn, authReady, updateUser } = useApp();
  const { profile, saving, save } = useUserProfile(user, authReady);
  const [nickname, setNickname] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [city, setCity] = React.useState('');

  React.useEffect(() => {
    if (!profile) return;
    setNickname(profile.nickname);
    setBio(profile.bio ?? '');
    setCity(profile.city ?? 'Melbourne');
  }, [profile]);

  const handleSave = async () => {
    try {
      const next = await save({
        nickname: nickname.trim(),
        bio: bio.trim(),
        city: city.trim(),
        language: i18n.language.startsWith('zh') ? 'zh' : 'en',
      });
      updateUser({ nickname: next.nickname });
      toast(t('toast.profileSaved'));
    } catch {
      toast(t('toast.publishFailed'));
    }
  };

  const avatarLetter = (profile?.nickname ?? user?.nickname ?? 'H').charAt(0).toUpperCase();

  return (
    <SimplePage screenId="editProfile" title={t('screens.editProfile.title')}>
      <DetailCard>
        <View style={styles.profileTop}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{avatarLetter}</Text>
          </View>
          <View>
            <Text style={styles.profileName}>{profile?.nickname ?? user?.nickname ?? 'Guest'}</Text>
            <Text style={styles.profileSub}>{t('screens.editProfile.changeAvatar')}</Text>
          </View>
        </View>
      </DetailCard>
      <FormCard>
        <View style={styles.editField}>
          <Text style={styles.editLabel}>{t('common.fields.nickname')}</Text>
          <TextInput
            style={styles.editInput}
            value={nickname}
            onChangeText={setNickname}
            placeholder={t('common.fields.nickname')}
            placeholderTextColor="#999999"
          />
        </View>
        <View style={styles.editField}>
          <Text style={styles.editLabel}>{t('common.fields.bio')}</Text>
          <TextInput
            style={styles.editInput}
            value={bio}
            onChangeText={setBio}
            placeholder={t('screens.editProfile.bioSample')}
            placeholderTextColor="#999999"
          />
        </View>
        <View style={styles.editField}>
          <Text style={styles.editLabel}>{t('common.fields.city')}</Text>
          <TextInput
            style={styles.editInput}
            value={city}
            onChangeText={setCity}
            placeholder="Melbourne"
            placeholderTextColor="#999999"
          />
        </View>
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
  const { toast, isLoggedIn, authReady } = useApp();
  const { addresses, add } = useAddresses(isLoggedIn, authReady);

  const defaultAddress = addresses.find((row) => row.isDefault) ?? addresses[0];
  const meetupAddresses = addresses.filter((row) => row.id !== defaultAddress?.id);

  const handleAdd = async () => {
    try {
      await add({
        label: t('screens.address.addSpot'),
        area: 'Melbourne CBD',
        meetupSpot: t('screens.address.addSpotSub'),
      });
      toast(t('toast.profileSaved'));
    } catch {
      toast(t('toast.publishFailed'));
    }
  };

  return (
    <SimplePage screenId="address" title={t('screens.address.title')}>
      <ListCard>
        {defaultAddress ? (
          <ListRow
            left={
              <View>
                <Text style={styles.rowTitle}>{t('screens.address.defaultArea')}</Text>
                <Text style={styles.rowSub}>{defaultAddress.area}</Text>
              </View>
            }
            right={<Chevron />}
          />
        ) : null}
        {meetupAddresses.map((row, index) => (
          <ListRow
            key={row.id}
            left={
              <View>
                <Text style={styles.rowTitle}>{row.label || t('screens.address.meetupSpot')}</Text>
                <Text style={styles.rowSub}>{row.meetupSpot ?? row.area}</Text>
              </View>
            }
            right={<Chevron />}
            border={index < meetupAddresses.length - 1}
          />
        ))}
        <ListRow
          left={
            <View>
              <Text style={styles.rowTitle}>{t('screens.address.addSpot')}</Text>
              <Text style={styles.rowSub}>{t('screens.address.addSpotSub')}</Text>
            </View>
          }
          right={<Chevron />}
          onPress={() => void handleAdd()}
          border={false}
        />
      </ListCard>
      <TableNote>{t('screens.address.note')}</TableNote>
    </SimplePage>
  );
}

export function AccountSafetyScreen() {
  const { t } = useTranslation();
  const { toast, nav, isLoggedIn, authReady } = useApp();
  const { status } = useVerificationStatus(isLoggedIn, authReady);

  return (
    <SimplePage screenId="accountSafety" title={t('screens.accountSafety.title')}>
      <ListCard>
        <ListRow
          left={
            <>
              <ListIcon name="phone" />
              <View>
                <Text style={styles.rowTitle}>{t('screens.trust.phoneTitle')}</Text>
                <Text style={styles.rowSub}>{t('screens.accountSafety.phoneSub')}</Text>
              </View>
            </>
          }
          right={
            <Text style={[styles.statusText, verificationStatusColor('phone', status, isLoggedIn) && { color: colors.green }]}>
              {verificationStatusLabel(t, 'phone', status, isLoggedIn)}
            </Text>
          }
        />
        <ListRow
          left={
            <>
              <ListIcon name="lock" />
              <View>
                <Text style={styles.rowTitle}>{t('screens.accountSafety.passwordTitle')}</Text>
                <Text style={styles.rowSub}>{t('screens.accountSafety.passwordSub')}</Text>
              </View>
            </>
          }
          right={<Chevron />}
          onPress={() => (isLoggedIn ? toast(t('toast.passwordUpdated')) : nav('login'))}
        />
        <ListRow
          left={
            <>
              <ListIcon name="wechat" />
              <View>
                <Text style={styles.rowTitle}>{t('screens.trust.wechatTitle')}</Text>
                <Text style={styles.rowSub}>{t('screens.trust.wechatSub')}</Text>
              </View>
            </>
          }
          right={
            <Text style={[styles.statusText, verificationStatusColor('wechat', status, isLoggedIn) && { color: colors.green }]}>
              {verificationStatusLabel(t, 'wechat', status, isLoggedIn)}
            </Text>
          }
        />
        <ListRow
          left={
            <>
              <ListIcon name="alipay" />
              <View>
                <Text style={styles.rowTitle}>{t('screens.trust.alipayTitle')}</Text>
                <Text style={styles.rowSub}>{t('screens.trust.alipaySub')}</Text>
              </View>
            </>
          }
          right={<Text style={styles.statusText}>{verificationStatusLabel(t, 'alipay', status, isLoggedIn)}</Text>}
        />
        <ListRow
          left={
            <>
              <ListIcon name="badge" />
              <View>
                <Text style={styles.rowTitle}>{t('screens.accountSafety.identityTitle')}</Text>
                <Text style={styles.rowSub}>{t('screens.accountSafety.identitySub')}</Text>
              </View>
            </>
          }
          right={<Text style={styles.statusText}>{verificationStatusLabel(t, 'identity', status, isLoggedIn)}</Text>}
          border={false}
        />
      </ListCard>
      <PillButton label={t('common.continueSetup')} variant="brand" full onPress={() => toast(t('toast.bindingFlow'))} />
    </SimplePage>
  );
}

export function NotificationSettingsScreen() {
  const { t } = useTranslation();
  const { isLoggedIn, authReady } = useApp();
  const { settings, toggle } = useNotificationSettings(isLoggedIn, authReady);

  return (
    <SimplePage screenId="notificationSettings" title={t('screens.notificationSettings.title')}>
      <ListCard>
        <ListRow
          left={
            <View>
              <Text style={styles.rowTitle}>{t('screens.notificationSettings.intentTitle')}</Text>
              <Text style={styles.rowSub}>{t('screens.notificationSettings.intentSub')}</Text>
            </View>
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
  const { toast, isLoggedIn, authReady } = useApp();
  const { settings, toggle } = usePrivacySettings(isLoggedIn, authReady);

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
          onPress={() => toast(t('toast.blocklistEmpty'))}
        />
        <ListRow
          left={<Text style={styles.rowTitle}>{t('screens.privacySettings.downloadData')}</Text>}
          right={<Chevron />}
          onPress={() => toast(t('toast.dataDownload'))}
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

  const faqs = [
    { titleKey: 'screens.help.q1Title', subKey: 'screens.help.q1Sub' },
    { titleKey: 'screens.help.q2Title', subKey: 'screens.help.q2Sub' },
    { titleKey: 'screens.help.q3Title', subKey: 'screens.help.q3Sub' },
    { titleKey: 'screens.help.q4Title', subKey: 'screens.help.q4Sub' },
  ] as const;

  return (
    <SimplePage screenId="help" title={t('screens.help.title')}>
      <SearchBar placeholder={t('common.placeholders.searchProblems')} readonly />
      <ListCard>
        {faqs.map((faq, index) => (
          <ListRow
            key={faq.titleKey}
            left={
              <View>
                <Text style={styles.rowTitle}>{t(faq.titleKey)}</Text>
                <Text style={styles.rowSub}>{t(faq.subKey)}</Text>
              </View>
            }
            right={<Chevron />}
            border={index < faqs.length - 1}
          />
        ))}
      </ListCard>
      <PillButton label={t('common.onlineSupport')} variant="brand" full onPress={() => toast(t('toast.supportContacted'))} />
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
              <View>
                <Text style={styles.rowTitle}>{t('screens.authCenter.phoneTitle')}</Text>
                <Text style={styles.rowSub}>{t('screens.authCenter.phoneSub')}</Text>
              </View>
            </>
          }
          right={
            <Text style={[styles.statusText, verificationStatusColor('phone', status, isLoggedIn) && { color: colors.green }]}>
              {verificationStatusLabel(t, 'phone', status, isLoggedIn)}
            </Text>
          }
        />
        <ListRow
          left={
            <>
              <ListIcon name="wechat" />
              <View>
                <Text style={styles.rowTitle}>{t('screens.trust.wechatTitle')}</Text>
                <Text style={styles.rowSub}>{t('screens.authCenter.wechatSub')}</Text>
              </View>
            </>
          }
          right={
            <Text style={[styles.statusText, verificationStatusColor('wechat', status, isLoggedIn) && { color: colors.green }]}>
              {verificationStatusLabel(t, 'wechat', status, isLoggedIn)}
            </Text>
          }
        />
        <ListRow
          left={
            <>
              <ListIcon name="business" />
              <View>
                <Text style={styles.rowTitle}>{t('screens.authCenter.businessTitle')}</Text>
                <Text style={styles.rowSub}>{t('screens.authCenter.businessSub')}</Text>
              </View>
            </>
          }
          right={
            <Text style={styles.statusText}>{verificationStatusLabel(t, 'business', status, isLoggedIn)}</Text>
          }
          border={false}
        />
      </ListCard>
    </SimplePage>
  );
}

export function SafetyCenterScreen() {
  const { t } = useTranslation();

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
              <View>
                <Text style={styles.rowTitle}>{t('screens.safetyCenter.reportsTitle')}</Text>
                <Text style={styles.rowSub}>{t('screens.safetyCenter.reportsSub')}</Text>
              </View>
            </>
          }
          right={<Chevron />}
        />
        <ListRow
          left={
            <>
              <ListIcon name="block" />
              <View>
                <Text style={styles.rowTitle}>{t('screens.safetyCenter.blocklistTitle')}</Text>
                <Text style={styles.rowSub}>{t('screens.safetyCenter.blocklistSub')}</Text>
              </View>
            </>
          }
          right={<Text style={styles.statusText}>{t('common.peopleCount', { count: 0 })}</Text>}
        />
        <ListRow
          left={
            <>
              <ListIcon name="document" />
              <View>
                <Text style={styles.rowTitle}>{t('screens.safetyCenter.rulesTitle')}</Text>
                <Text style={styles.rowSub}>{t('screens.safetyCenter.rulesSub')}</Text>
              </View>
            </>
          }
          right={<Chevron />}
          border={false}
        />
      </ListCard>
    </SimplePage>
  );
}

export function PaymentSettingsScreen() {
  const { t } = useTranslation();
  const { toast, isLoggedIn, authReady } = useApp();
  const { methods } = usePaymentMethodsSettings(isLoggedIn, authReady);

  return (
    <SimplePage screenId="paymentSettings" title={t('screens.paymentSettings.title')}>
      <ListCard>
        {methods.map((method, index) => (
          <ListRow
            key={method.id}
            left={
              <>
                <ListIcon name={method.type === 'apple_pay' ? 'apple' : method.type === 'paypal' ? 'paypal' : 'card'} />
                <View>
                  <Text style={styles.rowTitle}>{method.label}</Text>
                  <Text style={styles.rowSub}>
                    {method.last4 ? `**** ${method.last4}` : method.type === 'apple_pay' ? t('screens.paymentSettings.appleOn') : t('common.notBound')}
                  </Text>
                </View>
              </>
            }
            right={
              method.isDefault ? (
                <Text style={[styles.statusText, { color: colors.green }]}>{t('screens.paymentSettings.default')}</Text>
              ) : method.type === 'apple_pay' ? (
                <Switch on />
              ) : (
                <Chevron />
              )
            }
            border={index < methods.length - 1}
          />
        ))}
      </ListCard>
      <PillButton label={t('screens.paymentSettings.add')} variant="brand" full onPress={() => toast(t('toast.addPayment'))} />
    </SimplePage>
  );
}

export function PayoutSettingsScreen() {
  const { t } = useTranslation();
  const { toast, isLoggedIn, authReady } = useApp();
  const { methods } = usePayoutMethods(isLoggedIn, authReady);

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
                <View>
                  <Text style={styles.rowTitle}>{method.label}</Text>
                  <Text style={styles.rowSub}>
                    {method.last4 ? `**** ${method.last4}` : t('common.notBound')}
                  </Text>
                </View>
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
          />
        ))}
      </ListCard>
      <PillButton label={t('screens.payoutSettings.add')} variant="brand" full onPress={() => toast(t('toast.addPayout'))} />
    </SimplePage>
  );
}

export function TransactionReminderScreen() {
  const { t } = useTranslation();

  const rows = ['pay', 'ship', 'receive', 'dispute'] as const;
  return (
    <SimplePage screenId="transactionReminder" title={t('screens.transactionReminder.title')}>
      <ListCard>
        {rows.map((row, i) => (
          <ListRow
            key={row}
            left={<View><Text style={styles.rowTitle}>{t(`screens.transactionReminder.${row}Title`)}</Text><Text style={styles.rowSub}>{t(`screens.transactionReminder.${row}Sub`)}</Text></View>}
            right={<Switch on />}
            border={i < rows.length - 1}
          />
        ))}
      </ListCard>
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
          <Text style={styles.profileSub}>Version 0.9.1 Demo</Text>
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
  const { isLoggedIn, authReady } = useApp();
  const { credit } = useCreditProfile(isLoggedIn, authReady);

  return (
    <SimplePage screenId="creditProfile" title={t('screens.creditProfile.title')}>
      <DetailCard>
        <View style={{ alignItems: 'center' }}>
          <AppIcon name="badge" size={52} color={colors.brand} />
          <Text style={[styles.profileName, { marginTop: 6 }]}>
            {credit ? String(credit.score) : t('screens.creditProfile.score')}
          </Text>
          <Text style={[styles.profileSub, { textAlign: 'center' }]}>{t('screens.creditProfile.summary')}</Text>
        </View>
      </DetailCard>
      <StatGrid
        items={[
          {
            value: credit ? String(credit.trades) : t('screens.creditProfile.tradesValue'),
            label: t('screens.creditProfile.tradesLabel'),
          },
          {
            value: credit ? `${credit.completionRate}%` : t('screens.creditProfile.rateValue'),
            label: t('screens.creditProfile.rateLabel'),
          },
          {
            value: credit ? String(credit.violations) : t('screens.creditProfile.violationsValue'),
            label: t('screens.creditProfile.violationsLabel'),
          },
          {
            value: credit ? String(credit.rating) : t('screens.creditProfile.ratingValue'),
            label: t('screens.creditProfile.ratingLabel'),
          },
        ]}
        style={{ marginBottom: 12 }}
      />
    </SimplePage>
  );
}

export function ReviewManageScreen() {
  const { t } = useTranslation();
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
            ? t('screens.reviewManage.pending')
            : t('screens.reviewManage.pending')
        }
        variant="brand"
        full
        onPress={() =>
          toast(summary?.pendingCount ? t('screens.reviewManage.pending') : t('toast.noPendingReview'))
        }
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
  },
  statusText: {
    fontWeight: fonts.weights.bold,
    color: colors.text,
    fontSize: 13,
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
    backgroundColor: '#ffefbd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 22,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  profileName: {
    fontSize: 22,
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
  editField: {
    marginBottom: 14,
  },
  editLabel: {
    fontWeight: fonts.weights.bold,
    color: colors.text,
    fontSize: 13,
    marginBottom: 6,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#ececec',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
  },
});
