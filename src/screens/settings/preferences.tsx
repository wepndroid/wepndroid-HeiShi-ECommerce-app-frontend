import React from 'react';
import { router } from 'expo-router';
import { Text } from '../../components/typography';
import { useTranslation } from 'react-i18next';
import { toast } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useNotificationSettings } from '../../hooks/useNotificationSettings';
import { useTransactionReminderSettings } from '../../hooks/useTransactionReminderSettings';
import { usePrivacySettings } from '../../hooks/usePrivacySettings';
import { shareUserDataExport } from '../../services/settingsService';
import {
  listNotificationPreferences,
  updateNotificationPreference,
  type NotificationPreference,
  type NotificationRoleContext,
} from '../../services/notificationPreferencesService';
import { Chevron, ListCard, ListRow, ListRowMain, SettingSectionTitle, Switch } from '../../components/FormUI';
import { SimplePage, styles } from './shared';

export function NotificationSettingsScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const authReady = useAuthStore((s) => s.authReady);
  const { settings, toggle } = useNotificationSettings(isLoggedIn, authReady, () =>
    toast(t('toast.settingsUpdateFailed')),
  );
  const [rolePreferences, setRolePreferences] = React.useState<NotificationPreference[]>([]);
  const [savingPreference, setSavingPreference] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isLoggedIn || !authReady) return;
    void listNotificationPreferences()
      .then(setRolePreferences)
      .catch(() => toast(t('toast.settingsUpdateFailed')));
  }, [authReady, isLoggedIn, t]);

  const roleRows: Array<{ role: NotificationRoleContext; categories: string[] }> = [
    {
      role: 'buyer',
      categories: [
        'product_recommendation', 'chat_message', 'order_update', 'payment_update',
        'delivery_update', 'refund_update', 'dispute', 'account_security',
        'platform_notice', 'marketing',
      ],
    },
    {
      role: 'seller',
      categories: [
        'product_recommendation', 'chat_message', 'order_update', 'payment_update',
        'delivery_update', 'refund_update', 'payout', 'dispute', 'moderation',
        'account_security', 'platform_notice', 'marketing',
      ],
    },
  ];

  const preferenceFor = (role: NotificationRoleContext, category: string) =>
    rolePreferences.find(
      (row) => row.userRoleContext === role && row.category === category,
    );

  const toggleRolePreference = async (
    role: NotificationRoleContext,
    category: string,
  ) => {
    const current = preferenceFor(role, category);
    const key = `${role}:${category}`;
    if (savingPreference) return;
    setSavingPreference(key);
    try {
      const updated = await updateNotificationPreference({
        userRoleContext: role,
        category,
        inAppEnabled: current?.inAppEnabled ?? true,
        pushEnabled: !(current?.pushEnabled ?? true),
        smsEnabled: current?.smsEnabled ?? false,
      });
      setRolePreferences((rows) => [
        ...rows.filter(
          (row) => !(row.userRoleContext === role && row.category === category),
        ),
        updated,
      ]);
    } catch {
      toast(t('toast.settingsUpdateFailed'));
    } finally {
      setSavingPreference(null);
    }
  };

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
      {roleRows.map(({ role, categories }) => (
        <React.Fragment key={role}>
          <SettingSectionTitle
            title={t(`screens.notificationSettings.${role}Notifications`)}
          />
          <ListCard>
            {categories.map((category, index) => {
              const preference = preferenceFor(role, category);
              return (
                <ListRow
                  key={category}
                  left={
                    <ListRowMain>
                      <Text style={styles.rowTitle}>
                        {t(`screens.notificationSettings.categories.${category}`)}
                      </Text>
                      {preference?.mandatory ? (
                        <Text style={styles.rowSub}>
                          {t('screens.notificationSettings.mandatoryInApp')}
                        </Text>
                      ) : null}
                    </ListRowMain>
                  }
                  right={
                    <Switch
                      on={preference?.pushEnabled ?? true}
                      onToggle={() => void toggleRolePreference(role, category)}
                    />
                  }
                  border={index < categories.length - 1}
                />
              );
            })}
          </ListCard>
        </React.Fragment>
      ))}
    </SimplePage>
  );
}

export function PrivacySettingsScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const authReady = useAuthStore((s) => s.authReady);
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

export function TransactionReminderScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const authReady = useAuthStore((s) => s.authReady);
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
