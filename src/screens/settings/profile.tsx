import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, View } from 'react-native';
import { Text } from '../../components/typography';
import { useTranslation } from 'react-i18next';
import { regionData, getPrimaryAreas } from '../../data/region';
import { useAuthStore } from '../../store/authStore';
import { useRegionStore } from '../../store/regionStore';
import { toast } from '../../store/uiStore';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useAddresses } from '../../hooks/useAddresses';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useAvatarUpload } from '../../hooks/useAvatarUpload';
import {
  Chevron,
  DetailCard,
  FieldInputStacked,
  FieldRow,
  FieldSelectRow,
  FormCard,
  ListCard,
  ListRow,
  ListRowMain,
  TableNote,
} from '../../components/FormUI';
import { allCityOptions, formatLocationLabel, normalizeProfileCity } from '../../data/region';
import { normalizeAvatarUrl } from '../../utils/sellerAvatar';
import { ApiError } from '../../api/client';
import { PillButton } from '../../components/UI';
import { colors } from '../../theme';
import { SimplePage, styles } from './shared';

export function EditProfileScreen() {
  const { t, i18n } = useTranslation();
  useAuthGuard();
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const authReady = useAuthStore((s) => s.authReady);
  const updateUser = useAuthStore((s) => s.updateUser);
  const region = useRegionStore((s) => s.region);
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
        <View style={styles.profileTop}>
          <Pressable
            style={styles.profileAvatar}
            onPress={() => void handlePickAvatar()}
            disabled={uploading}
            accessibilityRole="button"
            accessibilityLabel={t('screens.editProfile.changeAvatar')}
          >
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
          </Pressable>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.nickname ?? user?.nickname ?? t('common.guest')}</Text>
            <Text style={styles.profileSub}>{t('screens.editProfile.changeAvatar')}</Text>
          </View>
        </View>
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
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const authReady = useAuthStore((s) => s.authReady);
  const region = useRegionStore((s) => s.region);
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
