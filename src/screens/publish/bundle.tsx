import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams } from 'expo-router';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { publishBundleListing, uploadListingImage, updateListing, fetchMyListingDetail } from '../../services/listingsService';
import { pickImagesFromLibrary, MAX_LISTING_PHOTOS } from '../../services/mediaPicker';
import { FieldDateRow, FieldInputRow, FieldSelectRow, FormCard, FormSection, FormSwitchRow } from '../../components/FormUI';
import { BundleLineItemsEditor } from '../../components/BundleUI';
import { createBundleLineItem, distributeEvenShares, sumBundleShares, bundleItemImageUrls, patchBundleItemImages } from '../../data/bundle';
import {
  clearPublishBundleDraft,
  clearPublishBundleResumeFlag,
  loadPublishBundleDraft,
  savePublishBundleDraft,
  type PublishBundleDraft,
} from '../../data/publishBundleDraft';
import { ApiError } from '../../api/client';
import { formatPickupDateLabel } from '../../utils/pickupDate';
import { normalizeMediaUrls } from '../../utils/mediaUrls';
import { listingRegionFields, normalizeProfileCity } from '../../data/region';
import { PublishPhotoUploadSection } from '../../components/PublishPhotoUploadSection';
import { BackButton, EmptyState, LoadingState, Notice, ScreenScroll, TitleBar } from '../../components/UI';
import { useListingPhotos } from '../../hooks/useListingPhotos';
import { useFormOptions } from '../../hooks/useFormOptions';
import { findOptionLabel, findOptionKeyByLabel } from '../../utils/formOptionLabel';
import { Text } from '../../components/typography';
import { nav } from '../../store/navigation';
import { toast } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useRegionStore } from '../../store/regionStore';
import { useCatalogStore } from '../../store/catalogStore';
import {
  PublishFormShell,
  PublishListingCityRow,
  bundleCoverUrlsForEdit,
  bundleLineItemsForEdit,
  publishErrorToast,
  styles,
  toastAfterPublish,
} from './shared';

export function PublishBundleScreen({ embedded = false }: { embedded?: boolean } = {}) {
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
  const { imageUrls, uploading, addPhotosFromLibrary, setImageUrls } = useListingPhotos(
    isLoggedIn,
    toast,
    MAX_LISTING_PHOTOS,
  );
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [pickupDeadline, setPickupDeadline] = useState('');
  const [pickupWindowKey, setPickupWindowKey] = useState('');
  const [pickupMethodKey, setPickupMethodKey] = useState('');
  const [allowSeparateSale, setAllowSeparateSale] = useState(true);
  const [description, setDescription] = useState('');
  const [escrowEnabled, setEscrowEnabled] = useState(true);
  const [meetInPublic, setMeetInPublic] = useState(true);
  const [listingCityKey, setListingCityKey] = useState(() => normalizeProfileCity(region.city));
  const [bundleItems, setBundleItems] = useState(() => [
    createBundleLineItem(),
    createBundleLineItem(),
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingListing, setLoadingListing] = useState(isEditMode);
  const [editBlocked, setEditBlocked] = useState<'sold' | null>(null);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const draftLoadedRef = useRef(false);
  const editOriginalPriceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isEditMode || !editListingId || !authReady || !isLoggedIn) return;
    let cancelled = false;
    setLoadingListing(true);
    setEditBlocked(null);
    fetchMyListingDetail(editListingId, isLoggedIn)
      .then((product) => {
        if (cancelled || !product) return;
        if (product.listingStatus === 'sold') {
          setEditBlocked('sold');
          return;
        }
        const meta = product.bundleMeta;
        setTitle(product.apiTitle ?? '');
        editOriginalPriceRef.current = meta?.fullPrice ?? product.price ?? 0;
        setPrice(String(meta?.fullPrice ?? product.price ?? ''));
        setDescription(product.apiDesc ?? '');
        setPickupDeadline(meta?.pickupDeadline ?? '');
        setAllowSeparateSale(meta?.allowSeparateSale !== false);
        setListingCityKey(normalizeProfileCity(product.loc || region.city));
        setEscrowEnabled(product.escrowSupported !== false);
        setMeetInPublic(product.meetInPublic !== false);
        if (meta?.pickupWindow) {
          const windowKey =
            findOptionKeyByLabel(options.serviceTimeSlots, meta.pickupWindow, i18n.language) ||
            findOptionKeyByLabel(options.serviceTimeSlots, meta.pickupWindow, 'en');
          if (windowKey) setPickupWindowKey(windowKey);
        }
        setImageUrls(bundleCoverUrlsForEdit(product));
        setBundleItems(bundleLineItemsForEdit(meta));
        setPickupMethodKey(product.pickupMethodKeys?.[0] ?? '');
      })
      .finally(() => {
        if (!cancelled) setLoadingListing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authReady, editListingId, i18n.language, isEditMode, isLoggedIn, options.serviceTimeSlots, region.city, setImageUrls]);

  const buildDraft = useCallback(
    (resumeAfterPicker: boolean): PublishBundleDraft => ({
      savedAt: Date.now(),
      resumeAfterPicker,
      title,
      price,
      pickupDeadline,
      pickupWindowKey,
      pickupMethodKey,
      allowSeparateSale,
      description,
      listingCityKey,
      coverImageUrls: imageUrls,
      bundleItems,
    }),
    [
      allowSeparateSale,
      bundleItems,
      description,
      imageUrls,
      listingCityKey,
      pickupDeadline,
      pickupMethodKey,
      pickupWindowKey,
      price,
      title,
    ],
  );

  const persistDraft = useCallback(
    async (resumeAfterPicker = false) => {
      await savePublishBundleDraft(buildDraft(resumeAfterPicker));
    },
    [buildDraft],
  );

  useEffect(() => {
    if (isEditMode || draftLoadedRef.current) return;
    draftLoadedRef.current = true;
    void loadPublishBundleDraft().then((draft) => {
      if (!draft) return;
      setTitle(draft.title);
      setPrice(draft.price);
      setPickupDeadline(draft.pickupDeadline);
      setPickupWindowKey(draft.pickupWindowKey);
      setPickupMethodKey(draft.pickupMethodKey);
      setAllowSeparateSale(draft.allowSeparateSale);
      setDescription(draft.description);
      setListingCityKey(draft.listingCityKey);
      setImageUrls(normalizeMediaUrls(draft.coverImageUrls));
      setBundleItems(
        draft.bundleItems.map((item) => ({
          ...item,
          ...patchBundleItemImages(normalizeMediaUrls(bundleItemImageUrls(item))),
        })),
      );
      void clearPublishBundleResumeFlag();
    });
  }, [setImageUrls]);

  const handleAddCoverPhotos = async () => {
    await persistDraft(true);
    try {
      await addPhotosFromLibrary();
    } finally {
      await persistDraft(false);
    }
  };

  const handleAddItemPhotos = async (itemId: string) => {
    if (uploadingItemId || uploading) return;
    const item = bundleItems.find((row) => row.id === itemId);
    const current = bundleItemImageUrls(item ?? {});
    const remaining = MAX_LISTING_PHOTOS - current.length;
    if (remaining <= 0) {
      toast(t('toast.photoLimit', { count: MAX_LISTING_PHOTOS }));
      return;
    }
    setUploadingItemId(itemId);
    await persistDraft(true);
    try {
      const picked = await pickImagesFromLibrary({
        max: remaining,
        allowsMultiple: remaining > 1,
      });
      if (!picked.length) return;
      const uploaded: string[] = [];
      for (const asset of picked) {
        const url = await uploadListingImage(
          asset.uri,
          isLoggedIn,
          asset.mimeType,
          asset.fileName,
        );
        uploaded.push(url);
      }
      setBundleItems((prev) =>
        prev.map((row) => {
          if (row.id !== itemId) return row;
          return { ...row, ...patchBundleItemImages([...bundleItemImageUrls(row), ...uploaded]) };
        }),
      );
      toast(t('toast.photoAdded'));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        toast(t('toast.loginRequired'));
      } else if (error instanceof Error && error.message === 'permission_denied') {
        toast(t('toast.mediaPermissionDenied'));
      } else if (error instanceof Error && error.message === 'LISTING_UPLOAD_REQUIRES_AUTH') {
        toast(t('toast.loginRequired'));
      } else {
        toast(t('toast.uploadFailed'));
      }
    } finally {
      setUploadingItemId(null);
      await persistDraft(false);
    }
  };

  const handleRemoveItemPhoto = (itemId: string, url: string) => {
    setBundleItems((prev) =>
      prev.map((row) => {
        if (row.id !== itemId) return row;
        return {
          ...row,
          ...patchBundleItemImages(bundleItemImageUrls(row).filter((photo) => photo !== url)),
        };
      }),
    );
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!imageUrls.length) {
      toast(t('toast.photoRequired'));
      return;
    }
    if (!pickupDeadline.trim()) {
      toast(t('toast.pickupDeadlineRequired'));
      return;
    }
    if (!pickupMethodKey) {
      toast(t('toast.selectTradeMethod'));
      return;
    }
    const normalizedItems = bundleItems
      .map((item) => ({
        ...item,
        title: item.title.trim(),
      }))
      .filter((item) => item.title);
    if (normalizedItems.length < 2) {
      toast(t('toast.bundleMinItems'));
      return;
    }
    if (normalizedItems.some((item) => !bundleItemImageUrls(item).length)) {
      toast(t('toast.bundleItemPhotoRequired'));
      return;
    }
    const bundlePrice = Math.max(0, Number.parseFloat(price) || 0);
    if (!bundlePrice) {
      toast(t('toast.numberOnly'));
      return;
    }
    const shareTotal = sumBundleShares(normalizedItems);
    if (Math.abs(shareTotal - bundlePrice) > 0.02) {
      toast(
        t('toast.bundlePriceMismatch', {
          shareTotal: shareTotal.toFixed(2),
          bundlePrice: bundlePrice.toFixed(2),
        }),
      );
      return;
    }
    setSubmitting(true);
    try {
      const listingTitle = title.trim() || t('screens.publishBundle.unnamed');
      const pickupWindow = findOptionLabel(options.serviceTimeSlots, pickupWindowKey, i18n.language);
      const listingDescription =
        description.trim() ||
        `${t('screens.publishBundle.pickupBy', {
          date: formatPickupDateLabel(pickupDeadline.trim(), i18n.language),
        })}${pickupWindow ? ` · ${pickupWindow}` : ''}`;
      const coverImageUrls = imageUrls.filter(Boolean);
      const bundlePayload = {
        type: 'bundle' as const,
        title: listingTitle,
        description: listingDescription,
        price: bundlePrice,
        categoryKey: 'home',
        tagKey: 'bundleSet',
        locationLabel: listingCityKey,
        ...listingRegionFields(listingCityKey),
        imageUrls: coverImageUrls,
        pickupMethods: [pickupMethodKey],
        bundleItems: normalizedItems.map((item) => {
          const photos = bundleItemImageUrls(item);
          return {
            id: item.id,
            title: item.title,
            sharePrice: item.sharePrice,
            separatePrice: allowSeparateSale ? item.separatePrice : undefined,
            imageUrl: photos[0],
            imageUrls: photos,
          };
        }),
        pickupDeadline: pickupDeadline.trim(),
        allowSeparateSale,
        pickupWindow: pickupWindowKey || undefined,
        escrowSupported: escrowEnabled,
        meetInPublic,
      };
      if (isEditMode && editListingId) {
        const updated = await updateListing(editListingId, bundlePayload, isLoggedIn);
        if (Math.abs(bundlePrice - (editOriginalPriceRef.current ?? bundlePrice)) > 0.001) {
          await publishListingPriceChange(editListingId, bundlePrice);
        }
        editOriginalPriceRef.current = bundlePrice;
        toastAfterPublish(toast, t, updated, listingTitle, 'toast.listingUpdated');
        setTimeout(() => nav('myListings'), 600);
      } else {
        const created = await publishBundleListing(bundlePayload, isLoggedIn);
        toastAfterPublish(toast, t, created, listingTitle);
        await clearPublishBundleDraft();
        setTimeout(() => nav('home'), 600);
      }
    } catch (err) {
      publishErrorToast(toast, t, err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (submitting || isEditMode) return;
    setSubmitting(true);
    try {
      const listingTitle = title.trim() || t('screens.publishBundle.unnamed');
      const pickupWindow = findOptionLabel(options.serviceTimeSlots, pickupWindowKey, i18n.language);
      const listingDescription =
        description.trim() ||
        `${t('screens.publishBundle.pickupBy', {
          date: formatPickupDateLabel(pickupDeadline.trim(), i18n.language),
        })}${pickupWindow ? ` · ${pickupWindow}` : ''}`;
      const normalizedItems = bundleItems
        .map((item) => ({ ...item, title: item.title.trim() }))
        .filter((item) => item.title);
      const bundlePrice = Math.max(0, Number.parseFloat(price) || 0);
      const hasCompleteBundle =
        normalizedItems.length >= 2 &&
        bundlePrice > 0 &&
        Math.abs(sumBundleShares(normalizedItems) - bundlePrice) <= 0.02 &&
        normalizedItems.every((item) => bundleItemImageUrls(item).length);
      await publishBundleListing(
        {
          type: 'bundle',
          title: listingTitle,
          description: listingDescription,
          price: bundlePrice,
          categoryKey: 'home',
          tagKey: 'bundleSet',
          locationLabel: listingCityKey,
          ...listingRegionFields(listingCityKey),
          imageUrls: imageUrls.filter(Boolean),
          pickupMethods: pickupMethodKey ? [pickupMethodKey] : ['meetup'],
          ...(hasCompleteBundle
            ? {
                bundleItems: normalizedItems.map((item) => {
                  const photos = bundleItemImageUrls(item);
                  return {
                    id: item.id,
                    title: item.title,
                    sharePrice: item.sharePrice,
                    separatePrice: allowSeparateSale ? item.separatePrice : undefined,
                    imageUrl: photos[0],
                    imageUrls: photos,
                  };
                }),
              }
            : {}),
          pickupDeadline: pickupDeadline.trim() || undefined,
          allowSeparateSale,
          pickupWindow: pickupWindowKey || undefined,
          escrowSupported: escrowEnabled,
          meetInPublic,
          status: 'draft',
        },
        isLoggedIn,
      );
      toast(t('toast.listingDraftSaved', { title: listingTitle }));
      await clearPublishBundleDraft();
      setTimeout(() => nav('myListings'), 600);
    } catch {
      toast(t('toast.publishFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePriceChange = (nextPrice: string) => {
    const prevParsed = Number.parseFloat(price) || 0;
    setPrice(nextPrice);
    const parsed = Number.parseFloat(nextPrice);
    if (!Number.isFinite(parsed) || parsed <= 0 || bundleItems.length < 2) return;
    const allEmptyShares = bundleItems.every((item) => !item.sharePrice);
    if (allEmptyShares || prevParsed <= 0) {
      setBundleItems(distributeEvenShares(bundleItems, parsed));
    }
  };

  const bundlePriceValue = Math.max(0, Number.parseFloat(price) || 0);
  const sharesMatchPrice =
    bundlePriceValue > 0 &&
    Math.abs(sumBundleShares(bundleItems) - bundlePriceValue) <= 0.02;

  if (loadingListing) {
    return <LoadingState />;
  }

  if (editBlocked === 'sold') {
    return (
      <ScreenScroll screenId="publishBundle">
        <TitleBar
          center={t('screens.uploadProduct.editTitle')}
          left={<BackButton onPress={() => nav('myListings')} />}
        />
        <EmptyState text={t('toast.listingEditBlocked')} />
      </ScreenScroll>
    );
  }

  return (
    <PublishFormShell
      screenId="publishBundle"
      submitLabel={
        isEditMode ? t('screens.uploadProduct.saveEdit') : t('screens.publishBundle.submit')
      }
      draftLabel={isEditMode ? undefined : t('screens.publish.saveDraft')}
      onSaveDraft={isEditMode ? undefined : handleSaveDraft}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitDisabled={bundlePriceValue > 0 && !sharesMatchPrice}
    >
      {!embedded ? (
        <TitleBar
          center={
            isEditMode ? t('screens.uploadProduct.editTitle') : t('screens.publishBundle.title')
          }
          left={<BackButton onPress={() => nav(isEditMode ? 'myListings' : 'publish')} />}
        />
      ) : null}
      <PublishPhotoUploadSection
        title={t('screens.publishBundle.photosTitle')}
        hint={t('screens.publishBundle.photosHint')}
        imageUrls={imageUrls}
        onAdd={handleAddCoverPhotos}
        onRemove={(url) => setImageUrls((prev) => prev.filter((photo) => photo !== url))}
        uploading={uploading}
        maxPhotos={1}
      />
      <FormCard roundedFields>
        <FormSection
          title={t('screens.publish.sectionProductInfo')}
          subtitle={t('screens.publish.sectionProductInfoSub')}
          first
        >
          <FieldInputRow
            icon="edit"
            label={t('common.fields.title')}
            value={title}
            onChangeText={setTitle}
            placeholder={t('products.bundle.title')}
          />
          <FieldInputRow
            icon="cash"
            label={t('screens.publishBundle.bundlePrice')}
            value={price}
            onChangeText={handlePriceChange}
            placeholder={t('screens.publishBundle.bundlePriceSample')}
            suffix={t('common.currencyPrefix')}
            numericKind="decimal"
            onInvalidInput={() => toast(t('toast.numberOnly'))}
          />
          <Text style={styles.itemsHeading}>{t('screens.publishBundle.itemsTitle')}</Text>
          <BundleLineItemsEditor
            items={bundleItems}
            bundlePrice={bundlePriceValue}
            onChange={setBundleItems}
            onInvalidNumber={() => toast(t('toast.numberOnly'))}
            uploadingItemId={uploadingItemId}
            onAddItemPhotos={handleAddItemPhotos}
            onRemoveItemPhoto={handleRemoveItemPhoto}
          />
          <FieldInputRow
            icon="list"
            label={t('common.fields.description')}
            value={description}
            onChangeText={setDescription}
            placeholder={t('screens.publishBundle.notesPlaceholder')}
            multiline
          />
        </FormSection>

        <FormSection
          title={t('screens.publish.sectionTradeInfo')}
          subtitle={t('screens.publish.sectionTradeInfoSub')}
        >
          <FieldDateRow
            icon="time"
            label={t('screens.publishBundle.pickupDeadline')}
            value={pickupDeadline}
            onChange={setPickupDeadline}
          />
          <FieldSelectRow
            icon="time"
            label={t('screens.publishBundle.pickupWindow')}
            options={options.serviceTimeSlots}
            selectedKey={pickupWindowKey}
            onSelect={setPickupWindowKey}
            placeholder={t('common.placeholders.selectOption')}
            loading={loading}
          />
          <FieldSelectRow
            icon="trade"
            label={t('common.fields.tradeMethod')}
            options={options.pickupMethods}
            selectedKey={pickupMethodKey}
            onSelect={setPickupMethodKey}
            placeholder={t('common.placeholders.selectOption')}
            loading={loading}
          />
          <FormSwitchRow
            title={t('screens.publishBundle.allowSeparate')}
            hint={t('screens.publishBundle.allowSeparateHint')}
            on={allowSeparateSale}
            onToggle={() => setAllowSeparateSale((v) => !v)}
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
      <Notice text={t('screens.publish.notice')} />
    </PublishFormShell>
  );
}
