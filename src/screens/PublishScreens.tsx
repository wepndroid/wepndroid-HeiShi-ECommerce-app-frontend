import React, { useMemo, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../components/typography';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useChat } from '../hooks/useChat';
import { useLocalizedProduct, useLocalizedProducts } from '../hooks/useLocalizedProduct';
import { resalePrice } from '../hooks/useProductFilters';
import { publishListing, publishServiceListing, publishBundleListing, createResaleDraft, uploadListingImage } from '../services/listingsService';
import { pickImagesFromLibrary, MAX_LISTING_PHOTOS } from '../services/mediaPicker';
import { FieldInputRow, FieldSelectRow, FormCard, FormSection, FormSwitchRow, StickyActions, Switch, TableNote, useStickyActionsBarInset } from '../components/FormUI';
import { BundleLineItemsEditor } from '../components/BundleUI';
import { createBundleLineItem, distributeEvenShares, sumBundleShares, bundleItemImageUrls, patchBundleItemImages } from '../data/bundle';
import { allCityOptions, normalizeProfileCity } from '../data/region';
import { PublishPhotoUploadSection } from '../components/PublishPhotoUploadSection';
import { ChatListingBar } from '../components/ChatListingBar';
import { resolveDetailProduct } from '../data/detailProducts';
import { chatListingToProduct } from '../services/chatListingService';
import { OrderThumb } from '../components/ProductUI';
import { AppIcon, AppIconName } from '../components/AppIcon';
import { BackButton, IconButton, Notice, PillButton, ScreenScroll, SectionHead, TitleBar } from '../components/UI';
import { useListingPhotos } from '../hooks/useListingPhotos';
import { useFormOptions } from '../hooks/useFormOptions';
import { findOptionLabel, formOptionLabel } from '../utils/formOptionLabel';
import { colors, fonts, formControls, radius, searchBarSurface, screenHorizontalInset, spacing } from '../theme';
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
        right={<IconButton icon="more" onPress={() => nav('settings')} />}
      />
      <SectionHead title={t('screens.publish.sectionSingle')} />
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

      <SectionHead title={t('screens.publish.sectionBundle')} />
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

      <SectionHead title={t('screens.publish.sectionMore')} />
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
  const { toast, nav, region, isLoggedIn } = useApp();
  useAuthGuard();
  const { options, loading } = useFormOptions();
  const { imageUrls, uploading, addPhotosFromLibrary } = useListingPhotos(isLoggedIn, toast);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [categoryKey, setCategoryKey] = useState('');
  const [conditionKey, setConditionKey] = useState('');
  const [pickupMethodKey, setPickupMethodKey] = useState('');
  const [description, setDescription] = useState('');
  const [escrowEnabled, setEscrowEnabled] = useState(true);
  const [meetInPublic, setMeetInPublic] = useState(true);
  const [listingCityKey, setListingCityKey] = useState(() => normalizeProfileCity(region.city));
  const [submitting, setSubmitting] = useState(false);

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
    if (!pickupMethodKey) {
      toast(t('toast.selectTradeMethod'));
      return;
    }
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
          categoryKey,
          conditionKey,
          tagKey: conditionKey,
          locationLabel: listingCityKey,
          imageUrls,
          pickupMethods: [pickupMethodKey],
        },
        isLoggedIn,
      );
      toast(t('toast.listingPublished', { title: listingTitle }));
      setTimeout(() => nav('myListings'), 600);
    } catch {
      toast(t('toast.publishFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublishFormShell
      screenId="uploadProduct"
      submitLabel={t('screens.uploadProduct.submit')}
      onSubmit={handleSubmit}
      submitting={submitting}
    >
      <TitleBar center={t('screens.uploadProduct.title')} left={<BackButton onPress={() => nav('publish')} />} />
      <PublishPhotoUploadSection
        title={t('screens.uploadProduct.photosTitle')}
        hint={t('screens.uploadProduct.photosHint')}
        tip={t('screens.uploadProduct.photoTip')}
        imageUrls={imageUrls}
        onAdd={addPhotosFromLibrary}
        uploading={uploading}
      />
      <FormCard>
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
  const { toast, nav, region, isLoggedIn } = useApp();
  useAuthGuard();
  const { options, loading } = useFormOptions();
  const { imageUrls, uploading, addPhotosFromLibrary, setImageUrls } = useListingPhotos(isLoggedIn, toast, 1);
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
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);

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
      if (error instanceof Error && error.message === 'permission_denied') {
        toast(t('toast.mediaPermissionDenied'));
      } else {
        toast(t('toast.uploadFailed'));
      }
    } finally {
      setUploadingItemId(null);
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
      toast(t('toast.bundlePriceMismatch'));
      return;
    }
    setSubmitting(true);
    try {
      const listingTitle = title.trim() || t('screens.publishBundle.unnamed');
      const pickupWindow = findOptionLabel(options.serviceTimeSlots, pickupWindowKey, i18n.language);
      const listingDescription =
        description.trim() ||
        `${t('screens.publishBundle.pickupBy', { date: pickupDeadline.trim() })}${pickupWindow ? ` · ${pickupWindow}` : ''}`;
      const itemPhotoUrls = normalizedItems.flatMap((item) => bundleItemImageUrls(item));
      const coverUrl = imageUrls[0];
      const allImageUrls = [...new Set([coverUrl, ...itemPhotoUrls].filter(Boolean))];
      await publishBundleListing(
        {
          type: 'bundle',
          title: listingTitle,
          description: listingDescription,
          price: bundlePrice,
          categoryKey: 'home',
          tagKey: 'bundleSet',
          locationLabel: listingCityKey,
          imageUrls: allImageUrls,
          pickupMethods: [pickupMethodKey],
          bundleItems: normalizedItems.map((item) => {
            const photos = bundleItemImageUrls(item);
            return {
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
        },
        isLoggedIn,
      );
      toast(t('toast.bundleSubmitted'));
      setTimeout(() => nav('myListings'), 600);
    } catch {
      toast(t('toast.publishFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePriceChange = (nextPrice: string) => {
    setPrice(nextPrice);
    const parsed = Number.parseFloat(nextPrice);
    if (Number.isFinite(parsed) && parsed > 0 && bundleItems.length >= 2) {
      const allEmptyShares = bundleItems.every((item) => !item.sharePrice);
      if (allEmptyShares) {
        setBundleItems(distributeEvenShares(bundleItems, parsed));
      }
    }
  };

  return (
    <PublishFormShell
      screenId="publishBundle"
      submitLabel={t('screens.publishBundle.submit')}
      onSubmit={handleSubmit}
      submitting={submitting}
    >
      <TitleBar center={t('screens.publishBundle.title')} left={<BackButton onPress={() => nav('publish')} />} />
      <PublishPhotoUploadSection
        title={t('screens.publishBundle.photosTitle')}
        hint={t('screens.publishBundle.photosHint')}
        imageUrls={imageUrls}
        onAdd={addPhotosFromLibrary}
        onRemove={(url) => setImageUrls((prev) => prev.filter((photo) => photo !== url))}
        uploading={uploading}
        maxPhotos={1}
      />
      <FormCard>
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
          <Text style={styles.itemsHeading}>{t('screens.publishBundle.itemsTitle')}</Text>
          <BundleLineItemsEditor
            items={bundleItems}
            bundlePrice={Math.max(0, Number.parseFloat(price) || 0)}
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
          <FieldInputRow
            icon="cash"
            label={t('screens.publishBundle.bundlePrice')}
            value={price}
            onChangeText={handlePriceChange}
            placeholder="260"
            suffix={t('common.currencyPrefix')}
            numericKind="decimal"
            onInvalidInput={() => toast(t('toast.numberOnly'))}
          />
          <FieldInputRow
            icon="time"
            label={t('screens.publishBundle.pickupDeadline')}
            value={pickupDeadline}
            onChangeText={setPickupDeadline}
            placeholder="2026-06-28"
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
  const { toast, nav, region, isLoggedIn } = useApp();
  useAuthGuard();
  const { options, loading } = useFormOptions();
  const { imageUrls, uploading, addPhotosFromLibrary } = useListingPhotos(isLoggedIn, toast);
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
      const introText = intro.trim() || t('screens.publishService.introPlaceholder');
      await publishServiceListing(
        {
          type: 'service',
          title,
          description: `${timeLabel} · ${introText}`,
          price: listingPrice,
          categoryKey: 'services',
          tagKey: 'localService',
          locationLabel: areaLabel ? `${listingCityKey} · ${areaLabel}` : listingCityKey,
          imageUrls,
        },
        isLoggedIn,
      );
      toast(t('toast.serviceSubmitted'));
      setTimeout(() => nav('myServices'), 600);
    } catch {
      toast(t('toast.publishFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublishFormShell
      screenId="publishService"
      submitLabel={t('screens.publishService.submit')}
      onSubmit={handleSubmit}
      submitting={submitting}
    >
      <TitleBar center={t('screens.publishService.title')} left={<BackButton onPress={() => nav('publish')} />} />
      <PublishPhotoUploadSection
        title={t('screens.uploadProduct.photosTitle')}
        hint={t('screens.uploadProduct.photosHint')}
        imageUrls={imageUrls}
        onAdd={addPhotosFromLibrary}
        uploading={uploading}
      />
      <FormCard>
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
  const { products, toast, nav, isLoggedIn } = useApp();
  useAuthGuard();
  const localized = useLocalizedProducts(products.slice(0, 6));

  const handleResale = async (item: (typeof localized)[number]) => {
    try {
      await createResaleDraft(item.id, item.title, resalePrice(item.price), item.imageUrl, isLoggedIn);
      toast(t('toast.resaleDraft'));
      setTimeout(() => nav('myListings'), 600);
    } catch {
      toast(t('toast.publishFailed'));
    }
  };

  return (
    <ScreenScroll screenId="resale">
      <TitleBar center={t('screens.resale.title')} left={<BackButton onPress={() => nav('publish')} />} />
      <TableNote>{t('screens.resale.note')}</TableNote>
      {localized.map((item) => (
        <View key={item.id} style={styles.resaleItem}>
          <View style={styles.resaleMid}>
            <OrderThumb imageUrl={item.imageUrl} />
            <View style={styles.resaleInfo}>
              <Text style={styles.resaleTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.resaleSub} numberOfLines={1}>
                {t('screens.resale.suggestPrice', {
                  price: `${item.pricePrefix}${resalePrice(item.price)}`,
                })}
              </Text>
            </View>
            <PillButton
              label={t('screens.resale.action')}
              onPress={() => handleResale(item)}
              style={styles.resaleBtn}
            />
          </View>
        </View>
      ))}
    </ScreenScroll>
  );
}

export function ChatScreen() {
  const { t } = useTranslation();
  const {
    toast,
    chatConversationId,
    chatTitle,
    chatListing,
    requireAuthNav,
    openDetail,
    products,
    isLoggedIn,
    user,
  } = useApp();
  useAuthGuard();
  const listingProduct = React.useMemo(() => {
    if (!chatListing) return null;
    return (
      products.find((p) => p.id === chatListing.listingId) ??
      resolveDetailProduct(chatListing.listingId)
    );
  }, [chatListing, products]);
  const productForI18n = React.useMemo(
    () =>
      chatListing
        ? listingProduct ?? chatListingToProduct(chatListing)
        : products[0],
    [chatListing, listingProduct, products],
  );
  const localizedListing = useLocalizedProduct(productForI18n);
  const { messages, send } = useChat(chatConversationId, isLoggedIn, user?.id);
  const [input, setInput] = useState('');
  const title = chatTitle || localizedListing.seller;

  const handleSend = async () => {
    const ok = await send(input);
    if (ok) {
      setInput('');
      toast(t('toast.messageSent'));
    } else {
      toast(t('toast.sendFailed'));
    }
  };

  return (
    <View style={styles.chatScreen}>
      <View style={styles.chatMain}>
        <View style={screenHorizontalInset}>
          <TitleBar
            center={title}
            right={<IconButton icon="more" onPress={() => toast(t('toast.reportBlock'))} />}
          />
        </View>
        {chatListing ? (
          <View style={screenHorizontalInset}>
            <ChatListingBar
              imageUrl={chatListing.imageUrl}
              title={localizedListing.title || chatListing.title}
              priceLabel={`${t('common.currencyPrefix')}${chatListing.price}`}
              metaLine={t('screens.chat.listingMeta')}
              locationLine={chatListing.location}
              onBuyNow={() => requireAuthNav('order')}
              onPress={() => {
                if (listingProduct) openDetail(listingProduct);
              }}
            />
          </View>
        ) : null}
        <ScrollView
          style={styles.chatScroll}
          contentContainerStyle={styles.chatBody}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[screenHorizontalInset, styles.chatMessages]}>
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[styles.bubble, msg.side === 'left' ? styles.bubbleLeft : styles.bubbleRight]}
              >
                <Text style={styles.bubbleText}>{msg.text}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
      <View style={[styles.chatInputBar, screenHorizontalInset]}>
        <TextInput
          style={[searchBarSurface, styles.chatInputField]}
          placeholder={t('common.placeholders.chatInput')}
          value={input}
          onChangeText={setInput}
          placeholderTextColor={formControls.placeholderColor}
        />
        <Pressable
          style={[styles.chatSend, !input.trim() && styles.chatSendDisabled]}
          onPress={handleSend}
          disabled={!input.trim()}
          accessibilityRole="button"
          accessibilityLabel={t('common.send')}
        >
          <AppIcon name="send" size={22} color={colors.paper} />
        </Pressable>
      </View>
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
}: {
  screenId: 'uploadProduct' | 'publishBundle' | 'publishService';
  children: React.ReactNode;
  submitLabel: string;
  onSubmit: () => void | Promise<void>;
  submitting?: boolean;
}) {
  const { t } = useTranslation();
  const stickyBarInset = useStickyActionsBarInset();

  return (
    <View style={styles.publishShell}>
      <ScreenScroll screenId={screenId} contentBottomInset={stickyBarInset}>
        {children}
      </ScreenScroll>
      <StickyActions fixed>
        <PillButton
          label={submitting ? t('common.loading') : submitLabel}
          variant="brand"
          full
          flex
          onPress={submitting ? undefined : () => void onSubmit()}
          style={submitting ? styles.publishSubmitDisabled : undefined}
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
  publishHubCard: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: PUBLISH_HUB_BORDER,
    borderRadius: 26,
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
    fontSize: 14,
    fontWeight: fonts.weights.bold,
    marginBottom: 4,
    color: colors.text,
  },
  publishHubSub: {
    marginBottom: 10,
    color: colors.sub,
    fontSize: 12,
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
    fontSize: 12,
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
    borderRadius: 20,
    padding: 12,
    minHeight: 124,
    justifyContent: 'space-between',
  },
  optBody: {
    flex: 1,
  },
  optTitle: {
    fontSize: 14,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  optDesc: {
    marginTop: 5,
    color: '#777777',
    fontSize: 11,
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
    backgroundColor: colors.brand3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },
  stepStrong: {
    fontSize: 11,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    textAlign: 'center',
  },
  stepSmall: {
    fontSize: 9,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 12,
  },
  arrow: {
    color: '#e8a500',
    fontWeight: fonts.weights.bold,
    marginHorizontal: 2,
    marginTop: 11,
    lineHeight: 18,
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
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 18,
  },
  bubbleLeft: {
    alignSelf: 'flex-start',
    backgroundColor: colors.paper,
  },
  bubbleRight: {
    alignSelf: 'flex-end',
    backgroundColor: colors.paper,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.text,
  },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    paddingBottom: spacing.screenBottomNoNav,
    backgroundColor: colors.bg,
  },
  chatInputField: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  chatSend: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.brand2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  chatSendDisabled: {
    opacity: 0.45,
  },
});
