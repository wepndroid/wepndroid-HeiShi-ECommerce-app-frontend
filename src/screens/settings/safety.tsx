import React from 'react';
import { View } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Text } from '../../components/typography';
import { useTranslation } from 'react-i18next';
import { toast } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { AppIcon } from '../../components/AppIcon';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useBlocklist } from '../../hooks/useBlocklist';
import { fetchReports, unblockUser, type SafetyReportRow } from '../../services/safetyService';
import { Chevron, DetailCard, ListCard, ListIcon, ListRow, ListRowMain } from '../../components/FormUI';
import { EmptyHint, EmptyState, PillButton } from '../../components/UI';
import { SimplePage, styles } from './shared';

export function SafetyCenterScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const authReady = useAuthStore((s) => s.authReady);
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
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const authReady = useAuthStore((s) => s.authReady);
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
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const authReady = useAuthStore((s) => s.authReady);
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
