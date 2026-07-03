import React, { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Text } from '../../components/typography';
import { useTranslation } from 'react-i18next';
import { nav } from '../../store/navigation';
import { toast } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { Chevron, ListCard, ListIcon, ListRow, ListRowMain, SettingSectionTitle } from '../../components/FormUI';
import { BackButton, PillButton, ScreenScroll, TitleBar } from '../../components/UI';
import { styles } from './shared';

export function SettingsScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const cacheSize = useSettingsStore((s) => s.cacheSize);
  const clearCache = useSettingsStore((s) => s.clearCache);
  const refreshCacheSize = useSettingsStore((s) => s.refreshCacheSize);
  const logout = useAuthStore((s) => s.logout);

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
