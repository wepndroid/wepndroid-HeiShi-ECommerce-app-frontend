import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../components/typography';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { useLocalSearchParams } from 'expo-router';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useChat } from '../hooks/useChat';
import { useLocalizedProduct, useLocalizedProducts } from '../hooks/useLocalizedProduct';
import { resalePrice } from '../hooks/useProductFilters';
import { publishListing, publishServiceListing, publishBundleListing, createResaleDraft, uploadListingImage, updateListing, fetchMyListingDetail } from '../services/listingsService';
import { listCompletedPurchases, userCanChatOnListing } from '../services/ordersService';
import { fetchListingDetail } from '../services/catalogService';
import { pickImagesFromLibrary, MAX_LISTING_PHOTOS } from '../services/mediaPicker';
import { FieldDateRow, FieldInputRow, FieldSelectRow, FormCard, FormSection, FormSwitchRow, StickyActions, Switch, TableNote, useStickyActionsBarInset } from '../components/FormUI';
import { BundleLineItemsEditor } from '../components/BundleUI';
import { createBundleLineItem, distributeEvenShares, sumBundleShares, bundleItemImageUrls, patchBundleItemImages, bundleMetaToLineItems, type BundleLineItem, type BundleMeta } from '../data/bundle';
import {
  clearPublishBundleDraft,
  clearPublishBundleResumeFlag,
  loadPublishBundleDraft,
  savePublishBundleDraft,
  type PublishBundleDraft,
} from '../data/publishBundleDraft';
import {
  clearPublishProductDraft,
  loadPublishProductDraft,
  savePublishProductDraft,
  type PublishProductDraft,
} from '../data/publishProductDraft';
import { useCatalogRevision } from '../utils/catalogSync';
import { ApiError } from '../api/client';
import { formatPickupDateLabel } from '../utils/pickupDate';
import { normalizeMediaUrls } from '../utils/mediaUrls';

function listingEditImageUrls(product: {
  imageUrl?: string;
  imageUrls?: string[];
}): string[] {
  const raw = product.imageUrls?.length
    ? product.imageUrls
    : product.imageUrl
      ? [product.imageUrl]
      : [];
  return normalizeMediaUrls(raw);
}

function bundleCoverUrlsForEdit(
  product: {
    imageUrl?: string;
    imageUrls?: string[];
    bundleMeta?: { coverImageUrls?: string[] } | null;
  },
): string[] {
  const fromMeta = normalizeMediaUrls(product.bundleMeta?.coverImageUrls);
  if (fromMeta.length) return fromMeta;
  return listingEditImageUrls(product);
}

function bundleLineItemsForEdit(meta: BundleMeta | null | undefined): BundleLineItem[] {
  if (!meta?.items.length) {
    return [createBundleLineItem(), createBundleLineItem()];
  }
  const items = bundleMetaToLineItems(meta);
  if (items.length >= 2) return items;
  return [...items, ...Array.from({ length: 2 - items.length }, () => createBundleLineItem())];
}
import { formatMessageTimeLabel } from '../utils/formatMessageTimeLabel';
import { allCityOptions, listingRegionFields, normalizeProfileCity } from '../data/region';
import { PublishPhotoUploadSection } from '../components/PublishPhotoUploadSection';
import { ChatCounterpartTitle, ChatListingBar } from '../components/ChatListingBar';
import { resolveDetailProduct } from '../data/detailProducts';
import { listConversations, openConversation } from '../services/messagesService';
import { blockUser, submitReport } from '../services/safetyService';
import { chatListingToProduct, buildChatListingFromId, chatListingFromConversation } from '../services/chatListingService';
import { OrderThumb } from '../components/ProductUI';
import { AppIcon, AppIconName } from '../components/AppIcon';
import { BackButton, EmptyState, IconButton, LoadingState, Notice, PillButton, ScreenScroll, SectionHead, TitleBar } from '../components/UI';
import { resolveServiceIcon, serviceTypeKeyFromIcon } from '../data/services';
import { useListingPhotos } from '../hooks/useListingPhotos';
import { useFormOptions } from '../hooks/useFormOptions';
import { findOptionLabel, findOptionKeyByLabel, formOptionLabel } from '../utils/formOptionLabel';
import { colors, fonts, formControls, publishScreenTokens, radius, searchBarSurface, searchBarTokens, screenHorizontalInset, spacing } from '../theme';
import {
  PUBLISH_CLEARANCE_BUNDLE_ART,
  PUBLISH_HUB_ART_SIZE,
  PUBLISH_SINGLE_ITEM_ART,
} from '../assets/publishHubArt';

const MORE_PUBLISH_OPTIONS: {
  key: string;
  titleKey: string;
  descKey: string;
  icon: AppIconName;
  bg: string;
  screen: 'publishService' | 'resale';
}[] = [
  {
    key: 'service',
    titleKey: 'screens.publish.serviceTitle',
    descKey: 'screens.publish.serviceDesc',
    icon: 'service',
    bg: '#fff0ec',
    screen: 'publishService',
  },
  {
    key: 'resale',
    titleKey: 'screens.publish.resaleTitle',
    descKey: 'screens.publish.resaleDesc',
    icon: 'box',
    bg: '#f2eaff',
    screen: 'resale',
  },
];

export function PublishScreen() {
  const { t } = useTranslation();
  const { nav, requireAuthNav } = useApp();
  useAuthGuard();

  return (
    <ScreenScroll screenId="publish">
      <TitleBar
        left={<BackButton onPress={() => nav('home')} />}
        center={t('screens.publish.title')}
        right={<IconButton icon="more" onPress={() => requireAuthNav('settings')} />}
        compact
      />
      <SectionHead compact title={t('screens.publish.sectionSingle')} />
      <Pressable style={styles.publishHubCard} onPress={() => requireAuthNav('uploadProduct')}>
        <View style={styles.uploadHero}>
          <Image
            source={PUBLISH_SINGLE_ITEM_ART}
            style={styles.publishHubArt}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          <View style={styles.uploadCenter}>
            <Text style={styles.publishHubTitle}>{t('screens.publish.heroTitle')}</Text>
            <Text style={styles.publishHubSub}>{t('screens.publish.heroSubtitle')}</Text>
            <View style={styles.publishHubBtn}>
              <AppIcon name="camera" size={14} color={colors.text} />
              <Text style={styles.publishHubBtnText}>{t('screens.publish.uploadBtn')}</Text>
            </View>
          </View>
        </View>
      </Pressable>

      <SectionHead compact title={t('screens.publish.sectionBundle')} />
      <Pressable style={styles.publishHubCard} onPress={() => requireAuthNav('publishBundle')}>
        <View style={styles.uploadHero}>
          <Image
            source={PUBLISH_CLEARANCE_BUNDLE_ART}
            style={styles.publishHubArt}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          <View style={styles.uploadCenter}>
            <Text style={styles.publishHubTitle}>{t('screens.publish.bundleHeroTitle')}</Text>
            <Text style={styles.publishHubSub}>{t('screens.publish.bundleHeroSubtitle')}</Text>
            <View style={styles.publishHubBtn}>
              <AppIcon name="upload" size={14} color={colors.text} />
              <Text style={styles.publishHubBtnText}>{t('screens.publish.bundleHeroBtn')}</Text>
            </View>
          </View>
        </View>
      </Pressable>

      <SectionHead compact title={t('screens.publish.sectionMore')} />
      <View style={styles.publishOptions}>
        {MORE_PUBLISH_OPTIONS.map((opt) => (
          <Pressable
            key={opt.key}
            style={[styles.optCard, { backgroundColor: opt.bg }]}
            onPress={() => requireAuthNav(opt.screen)}
          >
            <View style={styles.optBody}>
              <Text style={styles.optTitle}>{t(opt.titleKey)}</Text>
              <Text style={styles.optDesc}>{t(opt.descKey)}</Text>
            </View>
            <View style={styles.optMark}>
              <AppIcon name={opt.icon} size={28} color={colors.text} />
            </View>
          </Pressable>
        ))}
      </View>
      <View style={styles.steps}>
        {[
          { icon: 'camera' as AppIconName, titleKey: 'screens.publish.step1Title', subKey: 'screens.publish.step1Sub' },
          { icon: 'edit' as AppIconName, titleKey: 'screens.publish.step2Title', subKey: 'screens.publish.step2Sub' },
          { icon: 'send' as AppIconName, titleKey: 'screens.publish.step3Title', subKey: 'screens.publish.step3Sub' },
        ].map((step, index) => (
          <React.Fragment key={step.titleKey}>
            {index > 0 ? <Text style={styles.arrow}>→</Text> : null}
            <View style={styles.step}>
              <View style={styles.stepIco}>
                <AppIcon name={step.icon} size={18} color="#e8a500" />
              </View>
              <Text style={styles.stepStrong}>{t(step.titleKey)}</Text>
              <Text style={styles.stepSmall}>{t(step.subKey)}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>
      <Notice text={t('screens.publish.notice')} />
    </ScreenScroll>
  );
}

export function UploadProductScreen() {
  const { t, i18n } = useTranslation();
  const { toast, nav, region, isLoggedIn, authReady } = useApp();
  const params = useLocalSearchParams<{ listingId?: string; mode?: string }>();
  const editListingId =
    params.mode === 'edit' && params.listingId ? Number(params.listingId) : null;
  const isEditMode = editListingId != null && Number.isFinite(editListingId);
  useAuthGuard();
  const { options, loading } = useFormOptions();
  const { imageUrls, setImageUrls, uploading, addPhotosFromLibrary } = useListingPhotos(isLoggedIn, toast);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [categoryKey, setCategoryKey] = useState('');
  const [conditionKey, setConditionKey] = useState('');
  const [pickupMethodKey, setPickupMethodKey] = useState('');
  const [description, setDescription] = useState('');
  const [escrowEnabled, setEscrowEnabled] = useState(true);
  const [negotiableEnabled, setNegotiableEnabled] = useState(false);
  const [meetInPublic, setMeetInPublic] = useState(true);
  const [listingCityKey, setListingCityKey] = useState(() => normalizeProfileCity(region.city));
  const [submitting, setSubmitting] = useState(false);
  const [loadingListing, setLoadingListing] = useState(isEditMode);
  const [editBlocked, setEditBlocked] = useState<'sold' | null>(null);
  const productDraftLoadedRef = useRef(false);

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
    });
  }, [isEditMode, setImageUrls]);

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
    }),
    [
      categoryKey,
      conditionKey,
      description,
      escrowEnabled,
      imageUrls,
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
      })
      .finally(() => {
        if (!cancelled) setLoadingListing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authReady, editListingId, isEditMode, isLoggedIn, region.city, setImageUrls]);

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
        type: 'product' as const,
        title: listingTitle,
        description: listingDescription,
        price: listingPrice,
        categoryKey,
        conditionKey,
        tagKey: conditionKey,
        locationLabel: listingCityKey,
        ...listingRegionFields(listingCityKey),
        imageUrls,
        pickupMethods: pickupMethodKey ? [pickupMethodKey] : undefined,
        escrowSupported: escrowEnabled,
        negotiable: negotiableEnabled,
        meetInPublic,
      };
      if (isEditMode && editListingId) {
        await updateListing(
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
            escrowSupported: escrowEnabled,
            negotiable: negotiableEnabled,
            meetInPublic,
            ...(pickupMethodKey ? { pickupMethods: [pickupMethodKey] } : {}),
          },
          isLoggedIn,
        );
        toast(t('toast.listingUpdated', { title: listingTitle }));
      } else {
        await publishListing({ ...payload, pickupMethods: [pickupMethodKey] }, isLoggedIn);
        toast(t('toast.listingPublished', { title: listingTitle }));
        await clearPublishProductDraft();
      }
      setTimeout(() => nav('myListings'), 600);
    } catch (err) {
      if (err instanceof Error && err.message === 'listing_has_orders') {
        toast(t('toast.listingHasOpenOrder'));
      } else if (err instanceof Error && err.message === 'listing_edit_blocked') {
        toast(t('toast.listingEditBlocked'));
      } else {
        toast(t('toast.publishFailed'));
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
          type: 'product',
          title: listingTitle,
          description: listingDescription,
          price: listingPrice,
          categoryKey: categoryKey || 'misc',
          conditionKey: conditionKey || undefined,
          tagKey: conditionKey || undefined,
          locationLabel: listingCityKey,
          ...listingRegionFields(listingCityKey),
          imageUrls: imageUrls.filter(Boolean),
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
      <TitleBar
        center={isEditMode ? t('screens.uploadProduct.editTitle') : t('screens.uploadProduct.title')}
        left={<BackButton onPress={() => nav(isEditMode ? 'myListings' : 'publish')} />}
      />
      <PublishPhotoUploadSection
        title={t('screens.uploadProduct.photosTitle')}
        hint={t('screens.uploadProduct.photosHint')}
        tip={t('screens.uploadProduct.photoTip')}
        imageUrls={imageUrls}
        onAdd={handleAddProductPhotos}
        uploading={uploading}
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

export function PublishBundleScreen() {
  const { t, i18n } = useTranslation();
  const { toast, nav, region, isLoggedIn, authReady } = useApp();
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
        await updateListing(editListingId, bundlePayload, isLoggedIn);
        toast(t('toast.listingUpdated', { title: listingTitle }));
        setTimeout(() => nav('myListings'), 600);
      } else {
        await publishBundleListing(bundlePayload, isLoggedIn);
        toast(t('toast.listingPublished', { title: listingTitle }));
        await clearPublishBundleDraft();
        setTimeout(() => nav('home'), 600);
      }
    } catch {
      toast(t('toast.publishFailed'));
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
      <TitleBar
        center={
          isEditMode ? t('screens.uploadProduct.editTitle') : t('screens.publishBundle.title')
        }
        left={<BackButton onPress={() => nav(isEditMode ? 'myListings' : 'publish')} />}
      />
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

export function PublishServiceScreen() {
  const { t, i18n } = useTranslation();
  const { toast, nav, region, isLoggedIn, authReady } = useApp();
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
        setServiceName(product.apiTitle ?? '');
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
  }, [authReady, editListingId, i18n.language, isEditMode, isLoggedIn, options.serviceAreas, options.serviceTimeSlots, region.city, setImageUrls]);

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
        await updateListing(editListingId, payload, isLoggedIn);
        toast(t('toast.listingUpdated', { title }));
        setTimeout(() => nav('myServices'), 600);
      } else {
        await publishServiceListing(payload, isLoggedIn);
        toast(t('toast.serviceSubmitted'));
        setTimeout(() => nav('myServices'), 600);
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'listing_has_orders') {
        toast(t('toast.listingHasOpenOrder'));
      } else if (err instanceof Error && err.message === 'listing_edit_blocked') {
        toast(t('toast.listingEditBlocked'));
      } else {
        toast(t('toast.publishFailed'));
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

export function ResaleScreen() {
  const { t } = useTranslation();
  const { toast, nav, isLoggedIn, authReady } = useApp();
  useAuthGuard();
  const [purchases, setPurchases] = React.useState<Awaited<ReturnType<typeof listCompletedPurchases>>>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!authReady) return;
    setLoading(true);
    listCompletedPurchases(isLoggedIn)
      .then(setPurchases)
      .finally(() => setLoading(false));
  }, [authReady, isLoggedIn]);

  const handleResale = async (listingId: number, title: string, amount: number, imageUrl: string) => {
    try {
      await createResaleDraft(listingId, title, resalePrice(amount), imageUrl, isLoggedIn);
      toast(t('toast.resaleDraft'));
      setTimeout(() => nav('myListings'), 600);
    } catch (err) {
      if (err instanceof Error && err.message === 'resale_exists') {
        toast(t('toast.resaleExists'));
      } else if (err instanceof Error && err.message === 'resale_forbidden') {
        toast(t('toast.resaleForbidden'));
      } else {
        toast(t('toast.publishFailed'));
      }
    }
  };

  return (
    <ScreenScroll screenId="resale">
      <TitleBar center={t('screens.resale.title')} left={<BackButton onPress={() => nav('publish')} />} />
      <TableNote>{t('screens.resale.note')}</TableNote>
      {loading ? (
        <LoadingState compact />
      ) : purchases.length ? (
        purchases.map((order) => (
          <View key={order.id} style={styles.resaleItem}>
            <View style={styles.resaleMid}>
              <OrderThumb imageUrl={order.imageUrl} />
              <View style={styles.resaleInfo}>
                <Text style={styles.resaleTitle} numberOfLines={2}>
                  {order.title}
                </Text>
                <Text style={styles.resaleSub} numberOfLines={1}>
                  {t('screens.resale.suggestPrice', {
                    price: `${t('common.currencyPrefix')}${resalePrice(order.amount)}`,
                  })}
                </Text>
              </View>
              <PillButton
                label={t('screens.resale.action')}
                onPress={() => void handleResale(order.listingId, order.title, order.amount, order.imageUrl)}
                style={styles.resaleBtn}
              />
            </View>
          </View>
        ))
      ) : (
        <EmptyState text={t('screens.resale.empty')} />
      )}
    </ScreenScroll>
  );
}

export function ChatScreen({ conversationId }: { conversationId: string }) {
  const { t, i18n } = useTranslation();
  const {
    toast,
    chatTitle,
    chatListing,
    chatListingId,
    chatCounterpartKey,
    chatCounterpartAvatarUrl,
    openDetail,
    openSellerProfile,
    products,
    isLoggedIn,
    user,
    loadProduct,
  } = useApp();
  useAuthGuard();
  const catalogRevision = useCatalogRevision();
  const [conversationListing, setConversationListing] = React.useState<ReturnType<typeof chatListingFromConversation>>(null);
  const [conversationListingStatus, setConversationListingStatus] = React.useState<
    'active' | 'sold' | 'inactive' | 'draft' | undefined
  >();
  const [hasListingOrder, setHasListingOrder] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (chatListing) {
      setConversationListing(null);
      setConversationListingStatus(undefined);
      return;
    }
    if (!conversationId) {
      setConversationListing(null);
      setConversationListingStatus(undefined);
      return;
    }
    let cancelled = false;
    listConversations(isLoggedIn).then(async (rows) => {
      if (cancelled) return;
      const row = rows.find((r) => r.id === conversationId);
      if (row) {
        setConversationListing(chatListingFromConversation(row, products));
        setConversationListingStatus(row.listingStatus);
        return;
      }
      try {
        const conversation = await openConversation({ conversationId }, isLoggedIn);
        setConversationListing(chatListingFromConversation(conversation, products));
        setConversationListingStatus(conversation.listingStatus);
      } catch {
        setConversationListingStatus(undefined);
        if (chatListingId != null) {
          setConversationListing(buildChatListingFromId(chatListingId, products));
        } else {
          setConversationListing(null);
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [conversationId, chatListing, chatListingId, isLoggedIn, products]);

  const displayListing = React.useMemo(() => {
    if (chatListing) return chatListing;
    if (chatListingId != null) {
      const built = buildChatListingFromId(chatListingId, products);
      if (built) return built;
    }
    return conversationListing;
  }, [chatListing, chatListingId, products, conversationListing]);
  const listingProduct = React.useMemo(() => {
    if (!displayListing) return null;
    return (
      products.find((p) => p.id === displayListing.listingId) ??
      resolveDetailProduct(displayListing.listingId)
    );
  }, [displayListing, products]);

  React.useEffect(() => {
    const listingId = displayListing?.listingId;
    if (!listingId || listingProduct?.listingStatus) return;
    void loadProduct(listingId);
  }, [displayListing?.listingId, listingProduct?.listingStatus, loadProduct]);

  const listingStatus = listingProduct?.listingStatus ?? conversationListingStatus;
  const needsOrderForChat = listingStatus === 'sold' || listingStatus === 'inactive';

  React.useEffect(() => {
    const listingId = displayListing?.listingId;
    if (!isLoggedIn || !listingId || !needsOrderForChat) {
      setHasListingOrder(null);
      return;
    }
    void userCanChatOnListing(listingId, isLoggedIn).then(setHasListingOrder);
  }, [displayListing?.listingId, isLoggedIn, needsOrderForChat, catalogRevision]);

  const listingClosed =
    listingStatus === 'draft' || (needsOrderForChat && hasListingOrder === false);
  const productForI18n = React.useMemo(
    () => (displayListing ? listingProduct ?? chatListingToProduct(displayListing) : null),
    [displayListing, listingProduct],
  );
  const localizedListing = useLocalizedProduct(
    productForI18n ??
      chatListingToProduct({
        listingId: chatListingId ?? 0,
        title: chatTitle ?? '',
        price: 0,
        location: '',
        imageUrl: chatCounterpartAvatarUrl ?? '',
      }),
  );
  const { messages, send, sending, loading, loadError, reload, handleChatScroll, handleChatContentSizeChange } = useChat(
    conversationId,
    isLoggedIn,
    user?.id,
  );
  const [input, setInput] = useState('');
  const chatScrollRef = useRef<ScrollView>(null);
  const title = chatTitle || localizedListing.seller || t('common.messages');
  const counterpartKey = chatCounterpartKey || localizedListing.sellerKey;
  const counterpartAvatarUrl = chatCounterpartAvatarUrl;

  const showSafetyMenu = () => {
    if (!counterpartKey) return;
    const actions: Array<{ text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }> = [
      {
        text: t('screens.chat.reportUser'),
        onPress: () => {
          void submitReport(
            {
              targetType: 'user',
              targetId: counterpartKey,
              reason: 'chat',
            },
            isLoggedIn,
          )
            .then(() => toast(t('toast.reportSubmitted')))
            .catch(() => toast(t('toast.settingsUpdateFailed')));
        },
      },
    ];
    if (displayListing?.listingId) {
      actions.unshift({
        text: t('screens.chat.reportListing'),
        onPress: () => {
          void submitReport(
            {
              targetType: 'listing',
              targetId: String(displayListing.listingId),
              reason: 'chat',
            },
            isLoggedIn,
          )
            .then(() => toast(t('toast.reportSubmitted')))
            .catch(() => toast(t('toast.settingsUpdateFailed')));
        },
      });
    }
    actions.push(
      {
        text: t('screens.chat.blockUser'),
        style: 'destructive',
        onPress: () => {
          void blockUser(counterpartKey, isLoggedIn)
            .then(() => toast(t('toast.userBlocked')))
            .catch(() => toast(t('toast.settingsUpdateFailed')));
        },
      },
      { text: t('common.cancel'), style: 'cancel' },
    );
    Alert.alert(t('screens.chat.safetyTitle'), undefined, actions);
  };

  const handleSend = async () => {
    if (sending || !input.trim()) return;
    const result = await send(input);
    if (result === 'ok') {
      setInput('');
      toast(t('toast.messageSent'));
    } else if (result === 'user_blocked') {
      toast(t('toast.userBlocked'));
    } else if (result === 'blocked') {
      toast(t('toast.listingUnavailable'));
    } else {
      toast(t('toast.sendFailed'));
    }
  };

  const scrollChatToEnd = useCallback((animated: boolean) => {
    chatScrollRef.current?.scrollToEnd({ animated });
  }, []);

  React.useEffect(() => {
    if (!messages.length) return;
    requestAnimationFrame(() => scrollChatToEnd(false));
  }, [messages.length, conversationId, scrollChatToEnd]);

  return (
    <View style={styles.chatScreen}>
      <View style={styles.chatMain}>
        <View style={screenHorizontalInset}>
          <TitleBar
            left={<BackButton />}
            center={
              <ChatCounterpartTitle
                name={title}
                sellerKey={counterpartKey}
                seller={title}
                avatarUrl={counterpartAvatarUrl}
                sellerUserId={counterpartKey}
                onPress={counterpartKey ? () => openSellerProfile(counterpartKey) : undefined}
              />
            }
            right={<IconButton icon="more" onPress={showSafetyMenu} />}
          />
        </View>
        {displayListing ? (
          <View style={screenHorizontalInset}>
            <ChatListingBar
              title={localizedListing.title || displayListing.title}
              priceLabel={`${t('common.currencyPrefix')}${displayListing.price}`}
              location={displayListing.location}
              onPress={
                listingProduct ? () => openDetail(listingProduct) : undefined
              }
            />
          </View>
        ) : null}
        <View style={screenHorizontalInset}>
          <Notice
            text={t('screens.chat.safeNotice')}
            chevron
            flush
            onPress={showSafetyMenu}
          />
        </View>
        <ScrollView
          ref={chatScrollRef}
          style={styles.chatScroll}
          contentContainerStyle={styles.chatBody}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={200}
          onScroll={handleChatScroll}
          onContentSizeChange={() => {
            scrollChatToEnd(false);
            handleChatContentSizeChange();
          }}
        >
          <View style={[screenHorizontalInset, styles.chatMessages]}>
            {loading && !messages.length ? (
              <LoadingState text={t('screens.chat.messagesLoading')} />
            ) : loadError && !messages.length ? (
              <View style={styles.chatLoadFailedWrap}>
                <Text style={styles.chatLoadFailedText}>{t('screens.chat.messagesLoadFailed')}</Text>
                <PillButton label={t('common.retry')} variant="light" onPress={() => void reload()} />
              </View>
            ) : (
              messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.bubbleWrap,
                  msg.side === 'left' ? styles.bubbleWrapLeft : styles.bubbleWrapRight,
                ]}
              >
                <View
                  style={[styles.bubble, msg.side === 'left' ? styles.bubbleLeft : styles.bubbleRight]}
                >
                  <Text style={styles.bubbleText}>{msg.text}</Text>
                  <View style={styles.bubbleFooter}>
                    {msg.sentAt ? (
                      <Text style={styles.bubbleTime}>
                        {formatMessageTimeLabel(msg.sentAt, t, i18n.language)}
                      </Text>
                    ) : null}
                    {msg.side === 'right' ? (
                      <AppIcon
                        name={msg.ackRead ? 'checkmarkDone' : 'checkmark'}
                        size={13}
                        color={msg.ackRead ? colors.blue : colors.muted}
                      />
                    ) : null}
                  </View>
                </View>
              </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
      {listingClosed ? (
        <View style={screenHorizontalInset}>
          <Notice text={t('screens.chat.listingClosed')} flush />
        </View>
      ) : (
      <View style={styles.chatInputBar}>
        <View style={[searchBarSurface, styles.chatInputShell]}>
          <TextInput
            style={styles.chatInputField}
            placeholder={t('common.placeholders.chatInput')}
            placeholderTextColor={colors.searchHint}
            value={input}
            onChangeText={setInput}
          />
        </View>
        <Pressable
          style={[styles.chatSend, (!input.trim() || sending) && styles.chatSendDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || sending}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('common.send')}
        >
          <AppIcon name="send" size={24} color={colors.brand2} />
        </Pressable>
      </View>
      )}
    </View>
  );
}

const PUBLISH_HUB_BORDER = '#C4BAB0';

function PublishListingCityRow({
  listingCityKey,
  onSelect,
}: {
  listingCityKey: string;
  onSelect: (key: string) => void;
}) {
  const { t } = useTranslation();
  const cityOptions = useMemo(() => allCityOptions(), []);

  return (
    <FieldSelectRow
      icon="mapPin"
      label={t('screens.publish.listingCity')}
      options={cityOptions}
      selectedKey={listingCityKey}
      onSelect={onSelect}
      placeholder={t('common.placeholders.selectOption')}
    />
  );
}

function PublishFormShell({
  screenId,
  children,
  submitLabel,
  onSubmit,
  submitting,
  submitDisabled,
  draftLabel,
  onSaveDraft,
}: {
  screenId: 'uploadProduct' | 'publishBundle' | 'publishService';
  children: React.ReactNode;
  submitLabel: string;
  onSubmit: () => void | Promise<void>;
  submitting?: boolean;
  submitDisabled?: boolean;
  draftLabel?: string;
  onSaveDraft?: () => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const stickyBarInset = useStickyActionsBarInset();
  const disabled = submitting || submitDisabled;

  return (
    <View style={styles.publishShell}>
      <ScreenScroll screenId={screenId} contentBottomInset={stickyBarInset}>
        {children}
      </ScreenScroll>
      <StickyActions fixed>
        {draftLabel && onSaveDraft ? (
          <PillButton
            label={draftLabel}
            variant="light"
            full
            flex
            onPress={disabled ? undefined : () => void onSaveDraft()}
            style={[styles.publishDraftBtn, disabled ? styles.publishSubmitDisabled : undefined]}
          />
        ) : null}
        <PillButton
          label={submitting ? t('common.loading') : submitLabel}
          variant="brand"
          full
          flex
          onPress={disabled ? undefined : () => void onSubmit()}
          style={disabled ? styles.publishSubmitDisabled : undefined}
        />
      </StickyActions>
    </View>
  );
}

const styles = StyleSheet.create({
  publishShell: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  publishSubmitDisabled: {
    opacity: 0.55,
  },
  publishDraftBtn: {
    marginBottom: 8,
  },
  publishHubCard: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: PUBLISH_HUB_BORDER,
    borderRadius: radius.md,
    padding: 18,
    marginBottom: 14,
    backgroundColor: colors.paper,
  },
  uploadHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  publishHubArt: {
    width: PUBLISH_HUB_ART_SIZE,
    height: PUBLISH_HUB_ART_SIZE,
  },
  uploadCenter: {
    flex: 1,
    alignItems: 'center',
  },
  publishHubTitle: {
    fontSize: publishScreenTokens.hubTitleSize,
    fontWeight: fonts.weights.bold,
    marginBottom: 4,
    color: colors.text,
  },
  publishHubSub: {
    marginBottom: 10,
    color: colors.sub,
    fontSize: publishScreenTokens.hubSubSize,
  },
  publishHubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  publishHubBtnText: {
    fontSize: publishScreenTokens.hubBtnSize,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  publishOptions: {
    flexDirection: 'row',
    gap: 9,
    marginVertical: 12,
  },
  optCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: 12,
    minHeight: 124,
    justifyContent: 'space-between',
  },
  optBody: {
    flex: 1,
  },
  optTitle: {
    fontSize: publishScreenTokens.optTitleSize,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  optDesc: {
    marginTop: 5,
    color: '#777777',
    fontSize: publishScreenTokens.optDescSize,
  },
  optMark: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  steps: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
  },
  step: {
    flex: 1,
    alignItems: 'center',
  },
  stepIco: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },
  stepStrong: {
    fontSize: publishScreenTokens.stepTitleSize,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    textAlign: 'center',
  },
  stepSmall: {
    fontSize: publishScreenTokens.stepSubSize,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 11,
  },
  arrow: {
    color: '#e8a500',
    fontWeight: fonts.weights.bold,
    fontSize: publishScreenTokens.stepTitleSize,
    marginHorizontal: 2,
    marginTop: 11,
    lineHeight: 16,
  },
  itemsHeading: {
    fontSize: 15,
    fontWeight: fonts.weights.bold,
    marginTop: 4,
    marginBottom: 8,
    color: colors.text,
  },
  resaleItem: {
    backgroundColor: '#ffffff',
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  resaleMid: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  resaleInfo: {
    flex: 1,
    minWidth: 0,
  },
  resaleBtn: {
    backgroundColor: colors.brand,
    paddingVertical: 9,
    paddingHorizontal: 8,
    flexShrink: 0,
  },
  resaleTitle: {
    fontSize: 13,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  resaleSub: {
    marginTop: 5,
    color: '#777777',
    fontSize: 11,
  },
  chatScreen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  chatMain: {
    flex: 1,
  },
  chatScroll: {
    flex: 1,
  },
  chatBody: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  chatMessages: {
    gap: 10,
  },
  chatLoadFailedWrap: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  chatLoadFailedText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  bubbleWrap: {
    maxWidth: '78%',
  },
  bubbleWrapLeft: {
    alignSelf: 'flex-start',
  },
  bubbleWrapRight: {
    alignSelf: 'flex-end',
  },
  bubble: {
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingVertical: 9,
    paddingBottom: 7,
    borderRadius: radius.md,
  },
  bubbleLeft: {
    alignSelf: 'flex-start',
    backgroundColor: colors.paper,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  bubbleRight: {
    alignSelf: 'flex-end',
    backgroundColor: colors.paper,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.text,
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  bubbleTime: {
    fontSize: 10,
    lineHeight: 14,
    color: colors.muted,
  },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    paddingBottom: spacing.screenBottomNoNav,
    paddingHorizontal: spacing.screenPadding,
    backgroundColor: colors.bg,
  },
  chatInputShell: {
    flex: 1,
    minWidth: 0,
    height: searchBarTokens.height,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  chatInputField: {
    width: '100%',
    fontSize: searchBarTokens.fontSize,
    lineHeight: searchBarTokens.lineHeight,
    padding: 0,
  },
  chatSend: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    padding: 4,
  },
  chatSendDisabled: {
    opacity: 0.35,
  },
});
