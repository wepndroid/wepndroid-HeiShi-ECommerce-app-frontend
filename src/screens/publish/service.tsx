import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams } from 'expo-router';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { publishServiceListing, updateListing, fetchMyListingDetail } from '../../services/listingsService';
import { fetchVerificationStatus } from '../../services/userService';
import { FieldInputRow, FieldSelectRow, FormCard, FormSection, FormSwitchRow } from '../../components/FormUI';
import { listingRegionFields, normalizeProfileCity } from '../../data/region';
import { PublishPhotoUploadSection } from '../../components/PublishPhotoUploadSection';
import { BackButton, EmptyState, LoadingState, Notice, ScreenScroll, TitleBar } from '../../components/UI';
import { resolveServiceIcon, serviceTypeKeyFromIcon } from '../../data/services';
import { useListingPhotos } from '../../hooks/useListingPhotos';
import { useFormOptions } from '../../hooks/useFormOptions';
import { findOptionLabel, findOptionKeyByLabel, formOptionLabel } from '../../utils/formOptionLabel';
import { nav } from '../../store/navigation';
import { toast } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useRegionStore } from '../../store/regionStore';
import { useCatalogStore } from '../../store/catalogStore';
import {
  PublishFormShell,
  PublishListingCityRow,
  listingEditImageUrls,
  publishErrorToast,
  toastAfterPublish,
} from './shared';

export function PublishServiceScreen() {
  const { t, i18n } = useTranslation();
  const region = useRegionStore((s) => s.region);
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const authReady = useAuthStore((s) => s.authReady);
  const publishListingPriceChange = useCatalogStore((s) => s.publishListingPriceChange);
  const params = useLocalSearchParams<{ listingId?: string; mode?: string }>();
  const editListingId =
    params.mode === 'edit' && params.listingId ? Number(params.listingId) : null;
  const isEditMode = editListingId != null && Number.isFinite(editListingId);
  useAuthGuard();
  const { options, loading } = useFormOptions();
  const { imageUrls, uploading, addPhotosFromLibrary, setImageUrls } = useListingPhotos(isLoggedIn, toast);
  const [serviceName, setServiceName] = useState('');
  const [serviceTypeKey, setServiceTypeKey] = useState('');
  const [price, setPrice] = useState('');
  const [serviceAreaKey, setServiceAreaKey] = useState('');
  const [serviceTimeKey, setServiceTimeKey] = useState('');
  const [intro, setIntro] = useState('');
  const [escrowEnabled, setEscrowEnabled] = useState(true);
  const [meetInPublic, setMeetInPublic] = useState(true);
  const [listingCityKey, setListingCityKey] = useState(() => normalizeProfileCity(region.city));
  const [submitting, setSubmitting] = useState(false);
  const [loadingListing, setLoadingListing] = useState(isEditMode);
  const [editBlocked, setEditBlocked] = useState<'sold' | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const editOriginalPriceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isEditMode || !editListingId || !authReady || !isLoggedIn) return;
    let cancelled = false;
    setLoadingListing(true);
    setEditBlocked(null);
    setRejectionReason(null);
    fetchMyListingDetail(editListingId, isLoggedIn)
      .then((product) => {
        if (cancelled || !product) return;
        if (product.listingStatus === 'sold') {
          setEditBlocked('sold');
          return;
        }
        setRejectionReason(
          product.reviewStatus === 'rejected'
            ? product.reviewNote || t('screens.myListings.rejectedNotice')
            : null,
        );
        setServiceName(product.apiTitle ?? '');
        editOriginalPriceRef.current = product.price ?? 0;
        setPrice(String(product.price ?? ''));
        setServiceTypeKey(serviceTypeKeyFromIcon(product.serviceIcon));
        const desc = product.apiDesc ?? '';
        const descParts = desc.split(' · ');
        const timeLabel = descParts[0]?.trim() ?? '';
        if (descParts.length > 1) {
          setIntro(descParts.slice(1).join(' · '));
        } else if (timeLabel && !options.serviceTimeSlots.some((slot) => slot.labelEn === timeLabel || slot.labelZh === timeLabel)) {
          setIntro(desc);
        } else {
          setIntro('');
        }
        if (timeLabel) {
          const timeKey =
            findOptionKeyByLabel(options.serviceTimeSlots, timeLabel, i18n.language) ||
            findOptionKeyByLabel(options.serviceTimeSlots, timeLabel, 'en');
          if (timeKey) setServiceTimeKey(timeKey);
        }
        const locParts = (product.loc ?? '').split(' · ');
        const areaLabel = locParts.length > 1 ? locParts.slice(1).join(' · ').trim() : '';
        if (areaLabel) {
          const areaKey =
            findOptionKeyByLabel(options.serviceAreas, areaLabel, i18n.language) ||
            findOptionKeyByLabel(options.serviceAreas, areaLabel, 'en');
          if (areaKey) setServiceAreaKey(areaKey);
        }
        setListingCityKey(normalizeProfileCity(locParts[0]?.trim() || product.loc || region.city));
        setEscrowEnabled(product.escrowSupported !== false);
        setMeetInPublic(product.meetInPublic !== false);
        setImageUrls(listingEditImageUrls(product));
      })
      .finally(() => {
        if (!cancelled) setLoadingListing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authReady, editListingId, i18n.language, isEditMode, isLoggedIn, options.serviceAreas, options.serviceTimeSlots, region.city, setImageUrls, t]);

  const handleServiceTypeSelect = (key: string) => {
    setServiceTypeKey(key);
    if (!serviceName.trim()) {
      const selected = options.serviceTypes.find((item) => item.key === key);
      if (selected) {
        setServiceName(formOptionLabel(selected, i18n.language));
      }
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!imageUrls.length) {
      toast(t('toast.photoRequired'));
      return;
    }
    if (!serviceTypeKey) {
      toast(t('toast.selectServiceType'));
      return;
    }
    if (!serviceAreaKey) {
      toast(t('toast.selectServiceArea'));
      return;
    }
    if (!serviceTimeKey) {
      toast(t('toast.selectServiceTime'));
      return;
    }
    // PRD §5.3.2: local services require real-name verification before publishing.
    if (!isEditMode) {
      const verification = await fetchVerificationStatus(isLoggedIn);
      if (!verification.identityVerified) {
        toast(t('toast.serviceVerifyRequired'));
        setTimeout(() => nav('authCenter'), 800);
        return;
      }
    }
    setSubmitting(true);
    try {
      const typeLabel = findOptionLabel(options.serviceTypes, serviceTypeKey, i18n.language);
      const areaLabel = findOptionLabel(options.serviceAreas, serviceAreaKey, i18n.language);
      const timeLabel = findOptionLabel(options.serviceTimeSlots, serviceTimeKey, i18n.language);
      const title = serviceName.trim() || typeLabel || t('screens.publishService.unnamed');
      const listingPrice = Math.max(0, Number.parseFloat(price) || 0);
      const introText = intro.trim();
      const payload = {
        type: 'service' as const,
        title,
        description: introText ? `${timeLabel} · ${introText}` : timeLabel,
        price: listingPrice,
        categoryKey: 'services',
        tagKey: 'localService',
        locationLabel: areaLabel ? `${listingCityKey} · ${areaLabel}` : listingCityKey,
        ...listingRegionFields(listingCityKey),
        imageUrls,
        serviceIcon: resolveServiceIcon(serviceTypeKey),
        escrowSupported: escrowEnabled,
        meetInPublic,
      };
      if (isEditMode && editListingId) {
        const updated = await updateListing(editListingId, payload, isLoggedIn);
        if (Math.abs(listingPrice - (editOriginalPriceRef.current ?? listingPrice)) > 0.001) {
          await publishListingPriceChange(editListingId, listingPrice);
        }
        editOriginalPriceRef.current = listingPrice;
        toastAfterPublish(toast, t, updated, title, 'toast.listingUpdated');
        setTimeout(() => nav('myServices'), 600);
      } else {
        const created = await publishServiceListing(payload, isLoggedIn);
        toastAfterPublish(toast, t, created, title, 'toast.serviceSubmitted');
        setTimeout(() => nav('myServices'), 600);
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'listing_has_orders') {
        toast(t('toast.listingHasOpenOrder'));
      } else if (err instanceof Error && err.message === 'listing_edit_blocked') {
        toast(t('toast.listingEditBlocked'));
      } else {
        publishErrorToast(toast, t, err);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (submitting || isEditMode) return;
    setSubmitting(true);
    try {
      const typeLabel = findOptionLabel(options.serviceTypes, serviceTypeKey, i18n.language);
      const areaLabel = findOptionLabel(options.serviceAreas, serviceAreaKey, i18n.language);
      const timeLabel = findOptionLabel(options.serviceTimeSlots, serviceTimeKey, i18n.language);
      const title = serviceName.trim() || typeLabel || t('screens.publishService.unnamed');
      const listingPrice = Math.max(0, Number.parseFloat(price) || 0);
      const introText = intro.trim();
      await publishServiceListing(
        {
          type: 'service',
          title,
          description: introText ? `${timeLabel || ''} · ${introText}`.replace(/^ · /, '') : timeLabel || title,
          price: listingPrice,
          categoryKey: 'services',
          tagKey: 'localService',
          locationLabel: areaLabel ? `${listingCityKey} · ${areaLabel}` : listingCityKey,
          ...listingRegionFields(listingCityKey),
          imageUrls: imageUrls.filter(Boolean),
          serviceIcon: resolveServiceIcon(serviceTypeKey || 'moving'),
          escrowSupported: escrowEnabled,
          meetInPublic,
          status: 'draft',
        },
        isLoggedIn,
      );
      toast(t('toast.listingDraftSaved', { title }));
      setTimeout(() => nav('myServices'), 600);
    } catch {
      toast(t('toast.publishFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!authReady) {
    return <LoadingState />;
  }
  if (!isLoggedIn) {
    return <LoadingState />;
  }
  if (loadingListing) {
    return <LoadingState />;
  }

  if (editBlocked === 'sold') {
    return (
      <ScreenScroll screenId="publishService">
        <TitleBar center={t('screens.myListings.editA11y')} left={<BackButton onPress={() => nav('myServices')} />} />
        <EmptyState text={t('toast.listingEditBlocked')} />
      </ScreenScroll>
    );
  }

  return (
    <PublishFormShell
      screenId="publishService"
      submitLabel={isEditMode ? t('common.save') : t('screens.publishService.submit')}
      draftLabel={isEditMode ? undefined : t('screens.publish.saveDraft')}
      onSaveDraft={isEditMode ? undefined : handleSaveDraft}
      onSubmit={handleSubmit}
      submitting={submitting}
    >
      <TitleBar
        center={isEditMode ? t('screens.myListings.editA11y') : t('screens.publishService.title')}
        left={<BackButton onPress={() => nav(isEditMode ? 'myServices' : 'publish')} />}
      />
      {rejectionReason ? (
        <Notice text={t('screens.myListings.rejectionReason', { reason: rejectionReason })} />
      ) : null}
      <PublishPhotoUploadSection
        title={t('screens.uploadProduct.photosTitle')}
        hint={t('screens.uploadProduct.photosHint')}
        imageUrls={imageUrls}
        onAdd={addPhotosFromLibrary}
        onRemove={(url) => setImageUrls((prev) => prev.filter((photo) => photo !== url))}
        uploading={uploading}
      />
      <FormCard roundedFields>
        <FormSection
          title={t('screens.publish.sectionProductInfo')}
          subtitle={t('screens.publish.sectionProductInfoSub')}
          first
        >
          <FieldInputRow
            icon="toolbox"
            label={t('common.fields.service')}
            value={serviceName}
            onChangeText={setServiceName}
            placeholder={t('screens.publishService.servicePlaceholder')}
          />
          <FieldSelectRow
            icon="grid"
            label={t('common.fields.serviceType')}
            options={options.serviceTypes}
            selectedKey={serviceTypeKey}
            onSelect={handleServiceTypeSelect}
            placeholder={t('common.placeholders.selectOption')}
            loading={loading}
          />
          <FieldInputRow
            icon="list"
            label={t('common.fields.intro')}
            value={intro}
            onChangeText={setIntro}
            placeholder={t('screens.publishService.introPlaceholder')}
            multiline
          />
        </FormSection>

        <FormSection
          title={t('screens.publish.sectionTradeInfo')}
          subtitle={t('screens.publish.sectionTradeInfoSub')}
        >
          <FieldInputRow
            icon="cash"
            label={t('common.fields.price')}
            value={price}
            onChangeText={setPrice}
            placeholder={t('screens.publishService.pricePlaceholder')}
            suffix={t('common.currencyPrefix')}
            numericKind="decimal"
            onInvalidInput={() => toast(t('toast.numberOnly'))}
          />
          <FieldSelectRow
            icon="mapPin"
            label={t('common.fields.area')}
            options={options.serviceAreas}
            selectedKey={serviceAreaKey}
            onSelect={setServiceAreaKey}
            placeholder={t('common.placeholders.selectOption')}
            loading={loading}
          />
          <FieldSelectRow
            icon="time"
            label={t('common.fields.time')}
            options={options.serviceTimeSlots}
            selectedKey={serviceTimeKey}
            onSelect={setServiceTimeKey}
            placeholder={t('common.placeholders.selectOption')}
            loading={loading}
          />
        </FormSection>

        <FormSection
          title={t('screens.publish.sectionSafetySettings')}
          subtitle={t('screens.publish.sectionSafetySettingsSub')}
        >
          <FormSwitchRow
            title={t('screens.publish.escrowEnabled')}
            hint={t('screens.publish.escrowEnabledHint')}
            on={escrowEnabled}
            onToggle={() => setEscrowEnabled((v) => !v)}
          />
          <FormSwitchRow
            title={t('screens.publish.meetInPublic')}
            hint={t('screens.publish.meetInPublicHint')}
            on={meetInPublic}
            onToggle={() => setMeetInPublic((v) => !v)}
          />
          <PublishListingCityRow listingCityKey={listingCityKey} onSelect={setListingCityKey} />
        </FormSection>
      </FormCard>
      <Notice text={t('screens.publishService.note')} />
    </PublishFormShell>
  );
}
