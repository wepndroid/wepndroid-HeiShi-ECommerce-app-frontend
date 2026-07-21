import React from 'react';
import { Linking, StyleSheet } from 'react-native';
import { Text } from '../../components/typography';
import { BackButton, ScreenScroll, TitleBar } from '../../components/UI';
import type { VerificationStatus } from '../../services/userService';
import type { ScreenId } from '../../types';
import { colors, fonts } from '../../theme';

export const SUPPORT_EMAIL = 'support@heishi.app';

export type BindKind = 'phone' | 'wechat' | 'alipay' | 'identity' | 'business';

export function nextBindKind(status: VerificationStatus | null): BindKind | null {
  if (!status?.phoneVerified) return 'phone';
  if (!status?.wechatBound) return 'wechat';
  if (!status.alipayBound) return 'alipay';
  if (!status.identityVerified) {
    if (status.submissionStatus === 'pending') {
      if (!status.businessVerified) return 'business';
      return null;
    }
    return 'identity';
  }
  if (!status.businessVerified) return 'business';
  return null;
}

export function openSupportEmail() {
  void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('HeyMarket support')}`);
}

export function verificationStatusLabel(
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
  if (kind === 'identity') {
    if (status.identityVerified) return t('common.completed');
    if (status.submissionStatus === 'pending') return t('common.pendingReview');
    if (status.submissionStatus === 'rejected') return t('common.rejected');
    return t('common.notEnabled');
  }
  return status.businessVerified ? t('common.completed') : t('common.notEnabled');
}

export function verificationStatusColor(
  kind: 'phone' | 'wechat' | 'alipay' | 'identity' | 'business',
  status: VerificationStatus | null,
  isLoggedIn: boolean,
) {
  if (!status || !isLoggedIn) return undefined;
  if (kind === 'phone') return status.phoneVerified ? colors.green : undefined;
  if (kind === 'wechat') return status.wechatBound ? colors.green : undefined;
  if (kind === 'alipay') return status.alipayBound ? colors.green : undefined;
  if (kind === 'identity') {
    if (status.identityVerified || status.submissionStatus === 'pending') return colors.green;
    if (status.submissionStatus === 'rejected') return colors.brand2;
    return undefined;
  }
  return status.businessVerified ? colors.green : undefined;
}

export function SimplePage({ screenId, title, children }: { screenId: ScreenId; title: string; children: React.ReactNode }) {
  return (
    <ScreenScroll screenId={screenId}>
      <TitleBar center={title} left={<BackButton />} />
      {children}
    </ScreenScroll>
  );
}

export const styles = StyleSheet.create({
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
  profileInfo: {
    flex: 1,
    minWidth: 0,
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
