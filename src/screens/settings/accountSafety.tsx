import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { Text } from '../../components/typography';
import { useTranslation } from 'react-i18next';
import { nav } from '../../store/navigation';
import { toast } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { bindVerification, submitIdentityVerification } from '../../services/userService';
import { uploadListingImage } from '../../services/listingsService';
import { pickImagesFromLibrary } from '../../services/mediaPicker';
import { changePasswordWithAuth } from '../../services/authService';
import { useVerificationStatus } from '../../hooks/useTrustProfile';
import {
  Chevron,
  FieldInputStacked,
  FormCard,
  ListCard,
  ListIcon,
  ListRow,
  ListRowMain,
  SettingSectionTitle,
  TableNote,
} from '../../components/FormUI';
import { ApiError } from '../../api/client';
import { PillButton } from '../../components/UI';
import { colors } from '../../theme';
import { SimplePage, nextBindKind, styles, verificationStatusColor, verificationStatusLabel } from './shared';

export function AccountSafetyScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const authReady = useAuthStore((s) => s.authReady);
  const { status, refresh } = useVerificationStatus(isLoggedIn, authReady);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showIdentityForm, setShowIdentityForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [legalName, setLegalName] = useState('');
  const [idFrontUrl, setIdFrontUrl] = useState('');
  const [idBackUrl, setIdBackUrl] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [abn, setAbn] = useState('');
  const [businessRegUrl, setBusinessRegUrl] = useState('');
  const [uploadingIdSide, setUploadingIdSide] = useState<'front' | 'back' | 'business' | null>(null);
  const [submittingIdentity, setSubmittingIdentity] = useState(false);

  const identityPending = status?.submissionStatus === 'pending' && !status.identityVerified;
  const verificationComplete = !!status?.identityVerified && !!status?.businessVerified;
  // A user can submit while there is no pending review and they are not already
  // fully verified — this also lets an identity-verified user add business docs.
  const canSubmitIdentity =
    isLoggedIn && status?.submissionStatus !== 'pending' && !verificationComplete;

  const handleUploadIdPhoto = async (side: 'front' | 'back' | 'business') => {
    if (!isLoggedIn || uploadingIdSide) return;
    setUploadingIdSide(side);
    try {
      const picked = await pickImagesFromLibrary({ max: 1, allowsMultiple: false });
      if (!picked.length) return;
      const asset = picked[0];
      const url = await uploadListingImage(asset.uri, isLoggedIn, asset.mimeType, asset.fileName);
      if (side === 'front') setIdFrontUrl(url);
      else if (side === 'back') setIdBackUrl(url);
      else setBusinessRegUrl(url);
      toast(t('toast.photoAdded'));
    } catch (error) {
      if (error instanceof Error && error.message === 'permission_denied') {
        toast(t('toast.mediaPermissionDenied'));
      } else if (error instanceof ApiError && error.status === 401) {
        toast(t('toast.loginRequired'));
      } else {
        toast(t('toast.uploadFailed'));
      }
    } finally {
      setUploadingIdSide(null);
    }
  };

  const handleSubmitIdentity = async () => {
    if (submittingIdentity || !canSubmitIdentity) return;
    const name = legalName.trim();
    if (!name || !idFrontUrl) {
      toast(t('toast.identityFormIncomplete'));
      return;
    }
    setSubmittingIdentity(true);
    try {
      await submitIdentityVerification(
        {
          legalName: name,
          idFrontUrl,
          idBackUrl: idBackUrl || undefined,
          businessName: businessName.trim() || undefined,
          businessRegUrl: businessRegUrl || undefined,
          abn: abn.trim() || undefined,
        },
        isLoggedIn,
      );
      refresh();
      setShowIdentityForm(false);
      setLegalName('');
      setIdFrontUrl('');
      setIdBackUrl('');
      setBusinessName('');
      setAbn('');
      setBusinessRegUrl('');
      toast(t('toast.verificationSubmitted'));
    } catch {
      toast(t('toast.settingsUpdateFailed'));
    } finally {
      setSubmittingIdentity(false);
    }
  };

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
    if (next === 'identity') {
      setShowIdentityForm(true);
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
            .catch((err) => {
              if (err instanceof Error && err.message === 'verification_use_submit') {
                setShowIdentityForm(true);
                return;
              }
              toast(t('toast.settingsUpdateFailed'));
            });
        },
      },
    ]);
  };

  const openIdentityForm = () => {
    if (!isLoggedIn) {
      nav('login');
      return;
    }
    if (verificationComplete || identityPending) return;
    setShowIdentityForm(true);
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
          onPress={canSubmitIdentity ? openIdentityForm : undefined}
          border={false}
        />
      </ListCard>
      {identityPending ? (
        <TableNote>{t('screens.accountSafety.identityPendingHint')}</TableNote>
      ) : null}
      {showIdentityForm && canSubmitIdentity ? (
        <FormCard>
          <SettingSectionTitle title={t('screens.accountSafety.identityFormTitle')} />
          <FieldInputStacked
            label={t('screens.accountSafety.identityLegalName')}
            value={legalName}
            onChangeText={setLegalName}
            placeholder={t('screens.accountSafety.identityLegalName')}
          />
          <View style={localStyles.buttonStack}>
            <PillButton
              label={
                idFrontUrl
                  ? `${t('screens.accountSafety.identityIdFront')} — ${t('screens.accountSafety.identityUploaded')}`
                  : t('screens.accountSafety.identityIdFront')
              }
              variant="light"
              full
              onPress={() => void handleUploadIdPhoto('front')}
            />
            <PillButton
              label={
                idBackUrl
                  ? `${t('screens.accountSafety.identityIdBack')} — ${t('screens.accountSafety.identityUploaded')}`
                  : t('screens.accountSafety.identityIdBack')
              }
              variant="light"
              full
              onPress={() => void handleUploadIdPhoto('back')}
            />
          </View>
          <SettingSectionTitle title={t('screens.accountSafety.businessSectionTitle')} />
          <FieldInputStacked
            label={t('screens.accountSafety.businessName')}
            value={businessName}
            onChangeText={setBusinessName}
            placeholder={t('screens.accountSafety.businessName')}
          />
          <FieldInputStacked
            label={t('screens.accountSafety.businessAbn')}
            value={abn}
            onChangeText={setAbn}
            placeholder={t('screens.accountSafety.businessAbn')}
          />
          <View style={localStyles.buttonStack}>
            <PillButton
              label={
                businessRegUrl
                  ? `${t('screens.accountSafety.businessReg')} — ${t('screens.accountSafety.identityUploaded')}`
                  : t('screens.accountSafety.businessReg')
              }
              variant="light"
              full
              onPress={() => void handleUploadIdPhoto('business')}
            />
          </View>
          {uploadingIdSide ? <ActivityIndicator style={{ marginVertical: 8 }} /> : null}
          <View style={localStyles.actionStack}>
            <PillButton
              label={t('screens.accountSafety.identitySubmit')}
              variant="brand"
              full
              onPress={() => void handleSubmitIdentity()}
            />
            <PillButton label={t('common.cancel')} variant="light" full onPress={() => setShowIdentityForm(false)} />
          </View>
        </FormCard>
      ) : null}
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

const localStyles = StyleSheet.create({
  buttonStack: {
    gap: 8,
  },
  actionStack: {
    gap: 8,
    marginTop: 2,
  },
});
