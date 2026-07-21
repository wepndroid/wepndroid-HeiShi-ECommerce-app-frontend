import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams } from 'expo-router';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { publishListing, updateListing, fetchMyListingDetail } from '../../services/listingsService';
import { FieldInputRow, FieldSelectRow, FormCard, FormSection, FormSwitchRow } from '../../components/FormUI';
import {
  clearPublishProductDraft,
  loadPublishProductDraft,
  savePublishProductDraft,
  type PublishProductDraft,
} from '../../data/publishProductDraft';
import { normalizeMediaUrls } from '../../utils/mediaUrls';
import { listingRegionFields, normalizeProfileCity } from '../../data/region';
import { PublishPhotoUploadSection } from '../../components/PublishPhotoUploadSection';
import { BackButton, EmptyState, LoadingState, Notice, ScreenScroll, TitleBar } from '../../components/UI';
import { useListingPhotos } from '../../hooks/useListingPhotos';
import { useListingVideo } from '../../hooks/useListingVideo';
import { ListingVideoUpload } from '../../components/ListingVideo';
import { useFormOptions } from '../../hooks/useFormOptions';
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

export function UploadProductScreen({
  listingType = 'product',
  embedded = false,
}: {
  listingType?: 'product' | 'job' | 'rental';
  embedded?: boolean;
}) {
  const { t } = useTranslation();
  const region = useRegionStore((s) => s.region);
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const authReady = useAuthStore((s) => s.authReady);
  const publishListingPriceChange = useCatalogStore((s) => s.publishListingPriceChange);
  const params = useLocalSearchParams<{ listingId?: string; mode?: string; kind?: string }>();
  const paramKind =
    params.kind === 'job' || params.kind === 'rental' ? params.kind : listingType;
  const [listingKind, setListingKind] = useState<'product' | 'job' | 'rental'>(paramKind);
  const isJob = listingKind === 'job';
  const isRental = listingKind === 'rental';
  const isSpecialListing = isJob || isRental;
  const defaultCategory = isJob ? 'jobs' : isRental ? 'rentals' : '';
  const editListingId =
    params.mode === 'edit' && params.listingId ? Number(params.listingId) : null;
  const isEditMode = editListingId != null && Number.isFinite(editListingId);
  useAuthGuard();
  const { options, loading } = useFormOptions();
  const {
    imageUrls,
    setImageUrls,
    uploading,
    uploadProgress,
    addPhotosFromLibrary,
  } = useListingPhotos(isLoggedIn, toast);
  const {
    videoUrls,
    setVideoUrls,
    uploadingVideo,
    videoUploadProgress,
    addVideoFromLibrary,
  } = useListingVideo(isLoggedIn, toast);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [categoryKey, setCategoryKey] = useState('');
  const [conditionKey, setConditionKey] = useState('');
  const [pickupMethodKey, setPickupMethodKey] = useState('');
  const [description, setDescription] = useState('');
  const [escrowEnabled, setEscrowEnabled] = useState(!isSpecialListing);
  const [negotiableEnabled, setNegotiableEnabled] = useState(false);
  const [meetInPublic, setMeetInPublic] = useState(true);
  const [merchantPost, setMerchantPost] = useState(false);
  const [listingCityKey, setListingCityKey] = useState(() => normalizeProfileCity(region.city));
  const [submitting, setSubmitting] = useState(false);
  const [loadingListing, setLoadingListing] = useState(isEditMode);
  const [editBlocked, setEditBlocked] = useState<'sold' | null>(null);
  const productDraftLoadedRef = useRef(false);
  const editOriginalPriceRef = useRef<number | null>(null);

  useEffect(() => {
    if (isEditMode) return;
    if (params.kind === 'job' || params.kind === 'rental' || params.kind === 'product') {
      setListingKind(params.kind);
    }
  }, [isEditMode, params.kind]);

  const selectListingKind = useCallback((kind: 'product' | 'job' | 'rental') => {
    setListingKind(kind);
    if (kind === 'job') {
      setCategoryKey('jobs');
      setEscrowEnabled(false);
    } else if (kind === 'rental') {
      setCategoryKey('rentals');
      setEscrowEnabled(false);
    } else {
      setEscrowEnabled(true);
    }
  }, []);

  useEffect(() => {
    if (isSpecialListing && !categoryKey && defaultCategory) {
      setCategoryKey(defaultCategory);
    }
  }, [categoryKey, defaultCategory, isSpecialListing]);

  useEffect(() => {
    if (isEditMode || productDraftLoadedRef.current) return;
    productDraftLoadedRef.current = true;
    void loadPublishProductDraft().then((draft) => {
      if (!draft) return;
      setTitle(draft.title);
      setPrice(draft.price);
      setCategoryKey(draft.categoryKey);
      setConditionKey(draft.conditionKey);
      setPickupMethodKey(draft.pickupMethodKey);
      setDescription(draft.description);
      setEscrowEnabled(draft.escrowEnabled);
      setNegotiableEnabled(draft.negotiableEnabled);
      setMeetInPublic(draft.meetInPublic);
      setListingCityKey(draft.listingCityKey);
      setImageUrls(normalizeMediaUrls(draft.imageUrls));
      setVideoUrls(normalizeMediaUrls(draft.videoUrls));
    });
  }, [isEditMode, setImageUrls, setVideoUrls]);

  const buildProductDraft = useCallback(
    (resumeAfterPicker: boolean): PublishProductDraft => ({
      savedAt: Date.now(),
      resumeAfterPicker,
      title,
      price,
      categoryKey,
      conditionKey,
      pickupMethodKey,
      description,
      escrowEnabled,
      negotiableEnabled,
      meetInPublic,
      listingCityKey,
      imageUrls,
      videoUrls,
    }),
    [
      categoryKey,
      conditionKey,
      description,
      escrowEnabled,
      imageUrls,
      videoUrls,
      listingCityKey,
      meetInPublic,
      negotiableEnabled,
      pickupMethodKey,
      price,
      title,
    ],
  );

  const persistProductDraft = useCallback(
    async (resumeAfterPicker = false) => {
      if (isEditMode) return;
      await savePublishProductDraft(buildProductDraft(resumeAfterPicker));
    },
    [buildProductDraft, isEditMode],
  );

  const handleAddProductPhotos = async () => {
    await persistProductDraft(true);
    try {
      await addPhotosFromLibrary();
    } finally {
      await persistProductDraft(false);
    }
  };

  const handleAddProductVideo = async () => {
    await persistProductDraft(true);
    try {
      await addVideoFromLibrary();
    } finally {
      await persistProductDraft(false);
    }
  };

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
        setTitle(product.apiTitle ?? '');
        editOriginalPriceRef.current = product.price ?? 0;
        setPrice(String(product.price ?? ''));
        setDescription(product.apiDesc ?? '');
        setCategoryKey(product.catKey ?? '');
        setConditionKey(product.conditionKey ?? product.tagKey ?? '');
        setPickupMethodKey(product.pickupMethodKeys?.[0] ?? '');
        setListingCityKey(normalizeProfileCity(product.loc || region.city));
        setEscrowEnabled(product.escrowSupported !== false);
        setMeetInPublic(product.meetInPublic !== false);
        setNegotiableEnabled(Boolean(product.negotiable));
        setImageUrls(listingEditImageUrls(product));
        setVideoUrls(normalizeMediaUrls(product.videoUrls));
      })
      .finally(() => {
        if (!cancelled) setLoadingListing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    authReady,
    editListingId,
    isEditMode,
    isLoggedIn,
    region.city,
    setImageUrls,
    setVideoUrls,
  ]);

  const handleSubmit = async () => {
    if (submitting) return;
    if (!imageUrls.length) {
      toast(t('toast.photoRequired'));
      return;
    }
    if (!categoryKey) {
      toast(t('toast.selectCategory'));
      return;
    }
    if (!conditionKey) {
      toast(t('toast.selectCondition'));
      return;
    }
    if (!pickupMethodKey && !isEditMode) {
      toast(t('toast.selectTradeMethod'));
      return;
    }
    setSubmitting(true);
    try {
      const listingTitle = title.trim() || t('screens.uploadProduct.unnamed');
      const listingPrice = Math.max(0, Number.parseFloat(price) || 0);
      const listingDescription = description.trim() || t('screens.uploadProduct.descSample');
      const payload = {
        type: listingKind,
        title: listingTitle,
        description: listingDescription,
        price: listingPrice,
        categoryKey,
        conditionKey,
        tagKey: conditionKey,
        locationLabel: listingCityKey,
        ...listingRegionFields(listingCityKey),
        imageUrls,
        videoUrls,
        pickupMethods: pickupMethodKey ? [pickupMethodKey] : undefined,
        escrowSupported: escrowEnabled,
        negotiable: negotiableEnabled,
        meetInPublic,
        ...(isJob ? { merchantPost } : {}),
      };
      if (isEditMode && editListingId) {
        const updated = await updateListing(
          editListingId,
          {
            title: listingTitle,
            description: listingDescription,
            price: listingPrice,
            categoryKey,
            conditionKey,
            tagKey: conditionKey,
            locationLabel: listingCityKey,
            imageUrls,
            videoUrls,
            escrowSupported: escrowEnabled,
            negotiable: negotiableEnabled,
            meetInPublic,
            ...(pickupMethodKey ? { pickupMethods: [pickupMethodKey] } : {}),
          },
          isLoggedIn,
        );
        if (Math.abs(listingPrice - (editOriginalPriceRef.current ?? listingPrice)) > 0.001) {
          await publishListingPriceChange(editListingId, listingPrice);
        }
        editOriginalPriceRef.current = listingPrice;
        toastAfterPublish(toast, t, updated, listingTitle, 'toast.listingUpdated');
      } else {
        const created = await publishListing({ ...payload, pickupMethods: [pickupMethodKey] }, isLoggedIn);
        toastAfterPublish(toast, t, created, listingTitle);
        await clearPublishProductDraft();
      }
      setTimeout(() => nav('myListings'), 600);
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
      const listingTitle = title.trim() || t('screens.uploadProduct.unnamed');
      const listingPrice = Math.max(0, Number.parseFloat(price) || 0);
      const listingDescription = description.trim() || t('screens.uploadProduct.descSample');
      await publishListing(
        {
          type: listingKind,
          title: listingTitle,
          description: listingDescription,
          price: listingPrice,
          categoryKey: categoryKey || 'misc',
          conditionKey: conditionKey || undefined,
          tagKey: conditionKey || undefined,
          locationLabel: listingCityKey,
          ...listingRegionFields(listingCityKey),
          imageUrls: imageUrls.filter(Boolean),
          videoUrls: videoUrls.filter(Boolean),
          pickupMethods: pickupMethodKey ? [pickupMethodKey] : ['meetup'],
          escrowSupported: escrowEnabled,
          negotiable: negotiableEnabled,
          meetInPublic,
          status: 'draft',
        },
        isLoggedIn,
      );
      toast(t('toast.listingDraftSaved', { title: listingTitle }));
      await clearPublishProductDraft();
      setTimeout(() => nav('myListings'), 600);
    } catch {
      toast(t('toast.publishFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingListing) {
    return <LoadingState />;
  }

  if (editBlocked === 'sold') {
    return (
      <ScreenScroll screenId="uploadProduct">
        <TitleBar center={t('screens.uploadProduct.editTitle')} left={<BackButton />} />
        <EmptyState text={t('toast.listingEditBlocked')} />
      </ScreenScroll>
    );
  }

  return (
    <PublishFormShell
      screenId="uploadProduct"
      submitLabel={isEditMode ? t('screens.uploadProduct.saveEdit') : t('screens.uploadProduct.submit')}
      draftLabel={isEditMode ? undefined : t('screens.publish.saveDraft')}
      onSaveDraft={isEditMode ? undefined : handleSaveDraft}
      onSubmit={handleSubmit}
      submitting={submitting}
    >
      {!embedded ? (
        <TitleBar
          center={
            isEditMode
              ? t('screens.uploadProduct.editTitle')
              : isJob
                ? t('screens.publishJob.title')
                : isRental
                  ? t('screens.publishRental.title')
                  : t('screens.uploadProduct.title')
          }
          left={<BackButton onPress={() => nav(isEditMode ? 'myListings' : 'publish')} />}
        />
      ) : null}
      {isJob ? <Notice text={t('screens.publishJob.disclaimer')} /> : null}
      {isJob ? (
        <FormCard>
          <FormSwitchRow
            title={t('screens.publishJob.merchantPost')}
            hint={t('screens.publishJob.merchantPostSub')}
            on={merchantPost}
            onToggle={() => setMerchantPost((v) => !v)}
          />
        </FormCard>
      ) : null}
      {isRental ? <Notice text={t('screens.publishRental.disclaimer')} /> : null}
      <PublishPhotoUploadSection
        title={t('screens.uploadProduct.photosTitle')}
        hint={t('screens.uploadProduct.photosHint')}
        tip={t('screens.uploadProduct.photoTip')}
        imageUrls={imageUrls}
        onAdd={handleAddProductPhotos}
        uploading={uploading}
        uploadProgress={uploadProgress}
      />
      <ListingVideoUpload
        videoUrl={videoUrls[0]}
        uploading={uploadingVideo}
        uploadProgress={videoUploadProgress}
        onAdd={handleAddProductVideo}
        onRemove={() => setVideoUrls([])}
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
            placeholder={t('screens.uploadProduct.titlePlaceholder')}
          />
          <FieldSelectRow
            icon="grid"
            label={t('common.fields.category')}
            options={options.categories}
            selectedKey={categoryKey}
            onSelect={setCategoryKey}
            placeholder={t('common.placeholders.selectOption')}
            loading={loading}
          />
          <FieldSelectRow
            icon="diamond"
            label={t('screens.uploadProduct.condition')}
            options={options.conditions}
            selectedKey={conditionKey}
            onSelect={setConditionKey}
            placeholder={t('common.placeholders.selectOption')}
            loading={loading}
          />
          <FieldInputRow
            icon="list"
            label={t('common.fields.description')}
            value={description}
            onChangeText={setDescription}
            placeholder={t('screens.uploadProduct.descSample')}
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
            placeholder={t('screens.uploadProduct.pricePlaceholder')}
            suffix={t('common.currencyPrefix')}
            numericKind="decimal"
            onInvalidInput={() => toast(t('toast.numberOnly'))}
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
        </FormSection>

        <FormSection
          title={t('screens.publish.sectionSafetySettings')}
          subtitle={t('screens.publish.sectionSafetySettingsSub')}
        >
          <FormSwitchRow
            title={t('screens.publish.negotiableEnabled')}
            hint={t('screens.publish.negotiableEnabledHint')}
            on={negotiableEnabled}
            onToggle={() => setNegotiableEnabled((v) => !v)}
          />
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
