import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../components/typography';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { useAvatarUpload } from '../hooks/useAvatarUpload';
import { useUserProfile } from '../hooks/useUserProfile';
import { regionProducts } from '../hooks/useProductFilters';
import { AppIcon } from '../components/AppIcon';
import { IconButton, Logo, PillButton, ScreenScroll, SectionHead } from '../components/UI';
import { Banner } from '../components/ProductUI';
import { ListCard, ShortcutGrid } from '../components/FormUI';
import { AmazingSurface } from '../components/AmazingSurface';
import { profilePageBannerForLanguage } from '../assets/profileBanner';
import { colors, fonts, cardShadow } from '../theme';

export { MessagesScreen } from './MessagesScreen';

export function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { nav, user, isLoggedIn, authReady, toast } = useApp();
  const { profile, save } = useUserProfile(user, authReady);
  const { pickAndUpload, uploading } = useAvatarUpload(isLoggedIn);

  const hasCustomAvatar = Boolean(profile?.avatarUrl);

  const handlePickAvatar = async () => {
    if (!isLoggedIn) {
      nav('login');
      return;
    }
    try {
      const url = await pickAndUpload();
      if (!url) return;
      await save({ avatarUrl: url });
      toast(t('toast.profileSaved'));
    } catch (error) {
      if (error instanceof Error && error.message === 'permission_denied') {
        toast(t('toast.mediaPermissionDenied'));
      } else {
        toast(t('toast.uploadFailed'));
      }
    }
  };

  return (
    <ScreenScroll screenId="profile">
      <View style={styles.top}>
        <View style={styles.topRow}>
          <View style={styles.logoSlot}>
            <Logo />
          </View>
          <View style={styles.topRight}>
            <IconButton icon="messages" dot onPress={() => nav('messages')} />
            <IconButton icon="settings" onPress={() => nav('settings')} />
          </View>
        </View>
      </View>
      <AmazingSurface style={styles.profileCard} preserveShadow highlight={false}>
        <View style={styles.profileTop}>
          <View style={styles.profileMain}>
            <View style={styles.profileAvatarShell}>
              <Pressable
                style={styles.profileAvatar}
                onPress={() => void handlePickAvatar()}
                disabled={uploading}
                accessibilityRole="button"
                accessibilityLabel={t('screens.editProfile.changeAvatar')}
              >
                {isLoggedIn && user && hasCustomAvatar ? (
                  <Image
                    source={{ uri: profile!.avatarUrl! }}
                    style={styles.profileAvatarImage}
                    resizeMode="cover"
                  />
                ) : isLoggedIn && user ? (
                  <AppIcon name="camera" size={26} color={colors.muted} />
                ) : (
                  <AppIcon name="person" size={34} color={colors.text} />
                )}
                {isLoggedIn && uploading ? (
                  <View style={styles.avatarOverlay}>
                    <ActivityIndicator color={colors.brand} />
                  </View>
                ) : null}
              </Pressable>
            </View>
            <View style={styles.profileInfo}>
              {isLoggedIn && user ? (
                <>
                  <Text style={styles.profileName}>{user.nickname}</Text>
                  <Text style={styles.profileSub}>
                    {t('screens.profile.idLineLoggedIn', { id: user.heishiId })}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.profileName}>{t('screens.profile.guestTitle')}</Text>
                  <Text style={styles.profileSub}>{t('screens.profile.guestSub')}</Text>
                </>
              )}
            </View>
          </View>
          {isLoggedIn ? (
            <PillButton
              label={t('common.edit')}
              variant="light"
              onPress={() => nav('editProfile')}
              full
              style={styles.profileEditBtn}
            />
          ) : (
            <View style={styles.authActions}>
              <PillButton
                label={t('screens.login.submit')}
                variant="brand"
                onPress={() => nav('login')}
                style={styles.authBtn}
              />
              <PillButton
                label={t('screens.register.submit')}
                variant="light"
                onPress={() => nav('register')}
                style={styles.authBtn}
              />
            </View>
          )}
        </View>
      </AmazingSurface>
      <SectionHead
        title={t('screens.profile.myTrade')}
        action={t('screens.profile.allOrders')}
        onAction={() => nav('orders')}
      />
      <ShortcutGrid
        compact
        items={[
          { icon: 'upload', label: t('screens.profile.myListings'), onPress: () => nav('myListings') },
          { icon: 'sold', label: t('screens.profile.sold'), onPress: () => nav('sold') },
          { icon: 'orders', label: t('screens.profile.orders'), onPress: () => nav('orders') },
          { icon: 'service', label: t('screens.profile.myServices'), onPress: () => nav('myServices') },
        ]}
      />
      <View style={styles.tradesBannerSpacer}>
        <Banner
          variant="promo"
          artwork
          artworkSource={profilePageBannerForLanguage(i18n.language)}
          title={t('screens.profile.bannerTitle')}
          subtitle={t('screens.profile.bannerSubtitle')}
        />
      </View>
      <SectionHead title={t('screens.profile.tools')} />
      <ShortcutGrid
        compact
        items={[
          { icon: 'id', label: t('screens.profile.authCenter'), onPress: () => nav('authCenter') },
          { icon: 'badge', label: t('screens.profile.creditProfile'), onPress: () => nav('creditProfile') },
          { icon: 'review', label: t('screens.profile.reviewManage'), onPress: () => nav('reviewManage') },
          { icon: 'shield', label: t('screens.profile.safetyCenter'), onPress: () => nav('safetyCenter') },
        ]}
      />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingVertical: 12,
  },
  messageBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  messageAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brand3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageAvatarText: {
    fontSize: 16,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  unread: {
    position: 'absolute',
    right: -2,
    top: -3,
    backgroundColor: colors.brand2,
    borderRadius: 999,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: fonts.weights.bold,
  },
  messageInfo: {
    flex: 1,
    minWidth: 0,
  },
  messageTitle: {
    fontSize: 14,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  messageMsg: {
    marginTop: 5,
    color: '#888888',
    fontSize: 12,
  },
  time: {
    fontSize: 11,
    color: '#aaaaaa',
    flexShrink: 0,
  },
  top: {
    marginTop: 2,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  logoSlot: {
    flexShrink: 1,
    minWidth: 0,
    marginRight: 8,
  },
  topRight: {
    flexDirection: 'row',
    gap: 8,
    flexShrink: 0,
  },
  profileCard: {
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
  },
  profileTop: {
    gap: 12,
  },
  profileMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  profileEditBtn: {
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 10,
  },
  authActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  authBtn: {
    flex: 1,
  },
  profileAvatarShell: {
    borderRadius: 34,
    backgroundColor: colors.paper,
    ...cardShadow,
  },
  profileAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileAvatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
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
  tradesBannerSpacer: {
    marginTop: 20,
  },
});
