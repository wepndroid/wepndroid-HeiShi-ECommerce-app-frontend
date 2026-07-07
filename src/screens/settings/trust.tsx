import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Text } from '../../components/typography';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { AppIcon, AppIconName } from '../../components/AppIcon';
import { StatGrid } from '../../components/StatGrid';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { fetchReports } from '../../services/safetyService';
import { useCreditProfile, useVerificationStatus } from '../../hooks/useTrustProfile';
import { Chevron, DetailCard, ListCard, ListIcon, ListRow, ListRowMain } from '../../components/FormUI';
import { BackButton, EmptyState, Notice, PillButton, ScreenScroll, TitleBar } from '../../components/UI';
import { nav } from '../../store/navigation';
import { colors } from '../../theme';
import { SimplePage, styles, verificationStatusColor, verificationStatusLabel } from './shared';

export function TrustScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const authReady = useAuthStore((s) => s.authReady);
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

export function AuthCenterScreen() {
  const { t } = useTranslation();
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const authReady = useAuthStore((s) => s.authReady);
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
          onPress={() => (isLoggedIn ? nav('accountSafety') : nav('login'))}
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
          right={
            <Text
              style={[styles.statusText, verificationStatusColor('alipay', status, isLoggedIn) && { color: colors.green }]}
              numberOfLines={1}
            >
              {verificationStatusLabel(t, 'alipay', status, isLoggedIn)}
            </Text>
          }
          onPress={() => (isLoggedIn ? nav('accountSafety') : nav('login'))}
        />
        <ListRow
          left={
            <>
              <ListIcon name="badge" />
              <ListRowMain>
                <Text style={styles.rowTitle} numberOfLines={1}>{t('screens.accountSafety.identityTitle')}</Text>
                <Text style={styles.rowSub} numberOfLines={2}>{t('screens.authCenter.identitySub')}</Text>
              </ListRowMain>
            </>
          }
          right={
            <Text
              style={[
                styles.statusText,
                verificationStatusColor('identity', status, isLoggedIn) && {
                  color: verificationStatusColor('identity', status, isLoggedIn),
                },
              ]}
              numberOfLines={1}
            >
              {verificationStatusLabel(t, 'identity', status, isLoggedIn)}
            </Text>
          }
          onPress={() => (isLoggedIn ? nav('accountSafety') : nav('login'))}
          border={false}
        />
      </ListCard>
      <PillButton
        label={t('common.continueSetup')}
        variant="brand"
        full
        onPress={() => (isLoggedIn ? nav('accountSafety') : nav('login'))}
      />
    </SimplePage>
  );
}

export function CreditProfileScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const authReady = useAuthStore((s) => s.authReady);
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
