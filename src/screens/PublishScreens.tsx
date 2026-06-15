import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../components/typography';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useChat } from '../hooks/useChat';
import { useLocalizedProduct, useLocalizedProducts } from '../hooks/useLocalizedProduct';
import { resalePrice } from '../hooks/useProductFilters';
import { publishListing, publishServiceListing, createResaleDraft, uploadListingImage } from '../services/listingsService';
import { FieldRow, FormCard, TableNote } from '../components/FormUI';
import { OrderThumb } from '../components/ProductUI';
import { AppIcon, AppIconName } from '../components/AppIcon';
import { BackButton, IconButton, Notice, PillButton, ScreenScroll, TitleBar } from '../components/UI';
import { colors, fonts, radius, spacing } from '../theme';

const PUBLISH_OPTIONS: {
  key: string;
  titleKey: string;
  descKey: string;
  icon: AppIconName;
  bg: string;
  screen: 'uploadProduct' | 'publishService' | 'resale';
}[] = [
  {
    key: 'one',
    titleKey: 'screens.publish.idleTitle',
    descKey: 'screens.publish.idleDesc',
    icon: 'sofa',
    bg: '#fff5d9',
    screen: 'uploadProduct',
  },
  {
    key: 'two',
    titleKey: 'screens.publish.serviceTitle',
    descKey: 'screens.publish.serviceDesc',
    icon: 'service',
    bg: '#fff0ec',
    screen: 'publishService',
  },
  {
    key: 'three',
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
      <Pressable style={styles.uploadMain} onPress={() => requireAuthNav('uploadProduct')}>
        <View style={styles.uploadHero}>
          <AppIcon name="cameraAlt" size={52} color="#b87000" />
          <View style={styles.uploadCenter}>
            <Text style={styles.uploadTitle}>{t('screens.publish.heroTitle')}</Text>
            <Text style={styles.uploadSub}>{t('screens.publish.heroSubtitle')}</Text>
            <View style={styles.uploadBtn}>
              <AppIcon name="camera" size={16} color={colors.text} />
              <Text style={styles.uploadBtnText}>{t('screens.publish.uploadBtn')}</Text>
            </View>
          </View>
        </View>
      </Pressable>
      <View style={styles.publishOptions}>
        {PUBLISH_OPTIONS.map((opt) => (
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

function PhotoGrid({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.photoGrid}>
      <Pressable style={styles.photoSlot} onPress={onAdd}>
        <AppIcon name="add" size={28} color="#c17a00" />
        <Text style={styles.photoSlotSmall}>{t('common.photo.upload')}</Text>
      </Pressable>
      {Array.from({ length: 8 }).map((_, i) => (
        <View key={i} style={[styles.photoSlot, styles.photoSlotEmpty]} />
      ))}
    </View>
  );
}

export function UploadProductScreen() {
  const { t } = useTranslation();
  const { toast, nav, region, deliveryMethod, isLoggedIn } = useApp();
  useAuthGuard();
  const [title, setTitle] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleAddPhoto = async () => {
    try {
      const url = await uploadListingImage(undefined, isLoggedIn);
      setImageUrls((prev) => [...prev, url]);
      toast(t('toast.photoAdded'));
    } catch {
      toast(t('toast.publishFailed'));
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const listingTitle = title.trim() || t('screens.uploadProduct.unnamed');
      await publishListing(
        {
          type: 'product',
          title: listingTitle,
          description: t('screens.uploadProduct.descSample'),
          price: 89,
          categoryKey: 'digital',
          conditionKey: 'lightlyUsed',
          tagKey: 'lightlyUsed',
          locationLabel: region.city,
          imageUrls: imageUrls.length ? imageUrls : [await uploadListingImage(undefined, isLoggedIn)],
          pickupMethods: [deliveryMethod || t('screens.order.pickup')],
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
    <ScreenScroll screenId="uploadProduct">
      <TitleBar center={t('screens.uploadProduct.title')} left={<BackButton onPress={() => nav('publish')} />} />
      <View style={styles.uploadMain}>
        <Text style={styles.photoTitle}>{t('screens.uploadProduct.photosTitle')}</Text>
        <Text style={styles.photoSub}>{t('screens.uploadProduct.photosHint')}</Text>
        <PhotoGrid onAdd={handleAddPhoto} />
        <Text style={styles.photoTip}>{t('screens.uploadProduct.photoTip')}</Text>
      </View>
      <FormCard>
        <Text style={styles.formH2}>{t('screens.uploadProduct.previewTitle')}</Text>
        <FieldRow icon="edit" label={t('common.fields.title')} value={title || t('screens.uploadProduct.titlePlaceholder')} />
        <FieldRow icon="cash" label={t('common.fields.price')} value="89" suffix={t('common.currencyPrefix')} />
        <FieldRow icon="grid" label={t('common.fields.category')} value={t('homeCats.digital')} />
        <FieldRow icon="diamond" label={t('screens.uploadProduct.condition')} value={t('tags.lightlyUsed')} />
        <FieldRow icon="trade" label={t('common.fields.tradeMethod')} value={t('screens.order.pickup')} />
        <FieldRow icon="list" label={t('common.fields.description')} value={t('screens.uploadProduct.descSample')} />
      </FormCard>
      <Notice text={t('screens.publish.notice')} />
      <PillButton
        label={t('screens.uploadProduct.submit')}
        variant="brand"
        full
        onPress={handleSubmit}
      />
    </ScreenScroll>
  );
}

export function PublishServiceScreen() {
  const { t } = useTranslation();
  const { toast, nav, region, isLoggedIn } = useApp();
  useAuthGuard();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await publishServiceListing(
        {
          type: 'service',
          title: t('services.moving.title'),
          description: t('services.moving.desc'),
          price: 60,
          categoryKey: 'services',
          tagKey: 'localService',
          locationLabel: `${region.city} / Clayton`,
          imageUrls: [],
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
    <ScreenScroll screenId="publishService">
      <TitleBar center={t('screens.publishService.title')} left={<BackButton onPress={() => nav('publish')} />} />
      <FormCard>
        <Text style={styles.formH2}>{t('screens.publishService.formTitle')}</Text>
        <FieldRow icon="toolbox" label={t('common.fields.service')} value={t('services.moving.title')} />
        <FieldRow icon="cash" label={t('common.fields.price')} value="60" suffix={t('common.currencyPrefix')} />
        <FieldRow icon="mapPin" label={t('common.fields.area')} value="Clayton / Box Hill" />
        <FieldRow icon="time" label={t('common.fields.time')} value={t('screens.publishService.timeSample')} />
        <FieldRow icon="list" label={t('common.fields.intro')} value={t('services.moving.desc')} />
      </FormCard>
      <Notice text={t('screens.publishService.note')} />
      <PillButton label={t('screens.publishService.submit')} variant="brand" full onPress={handleSubmit} />
    </ScreenScroll>
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
  const { toast, chatConversationId, chatTitle, currentItem, isLoggedIn, user } = useApp();
  useAuthGuard();
  const item = useLocalizedProduct(currentItem);
  const { messages, send } = useChat(chatConversationId, isLoggedIn, user?.id);
  const [input, setInput] = useState('');
  const [inputHeight, setInputHeight] = useState(0);
  const title = chatTitle || item.seller;

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
      <TitleBar
        center={title}
        right={<IconButton icon="more" onPress={() => toast(t('toast.reportBlock'))} />}
      />
      <ScrollView
        style={styles.chatScroll}
        contentContainerStyle={inputHeight > 0 ? { paddingBottom: inputHeight } : undefined}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.chatBody}>
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
      <View
        style={styles.chatInput}
        onLayout={(event) => setInputHeight(event.nativeEvent.layout.height)}
      >
        <TextInput
          style={styles.chatInputField}
          placeholder={t('common.placeholders.chatInput')}
          value={input}
          onChangeText={setInput}
          placeholderTextColor="#999999"
        />
        <Pressable style={styles.chatSend} onPress={handleSend}>
          <Text style={styles.chatSendText}>{t('common.send')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  uploadMain: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#f2c45b',
    borderRadius: 26,
    padding: 18,
    marginBottom: 14,
    backgroundColor: '#fffdf5',
  },
  uploadHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  uploadCenter: {
    flex: 1,
    alignItems: 'center',
  },
  uploadTitle: {
    fontSize: 22,
    fontWeight: fonts.weights.bold,
    marginBottom: 8,
    color: colors.text,
  },
  uploadSub: {
    marginBottom: 15,
    color: '#666666',
    fontSize: 14,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    paddingHorizontal: 24,
    paddingVertical: 11,
  },
  uploadBtnText: {
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
    backgroundColor: '#fff4d4',
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
  photoTitle: {
    fontSize: 18,
    fontWeight: fonts.weights.bold,
    marginBottom: 4,
    color: colors.text,
  },
  photoSub: {
    color: '#777777',
    fontSize: 13,
    marginBottom: 14,
  },
  photoTip: {
    marginTop: 14,
    color: '#987b45',
    fontSize: 12,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoSlot: {
    width: '31%',
    height: 82,
    borderRadius: 16,
    backgroundColor: '#fff8e5',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#f4ca67',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoSlotEmpty: {
    backgroundColor: '#fff8e5',
  },
  photoSlotSmall: {
    fontSize: 11,
    color: '#8a8a8a',
    marginTop: 4,
  },
  formH2: {
    fontSize: 16,
    fontWeight: fonts.weights.bold,
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
    paddingHorizontal: spacing.screenPadding,
  },
  chatScroll: {
    flex: 1,
  },
  chatBody: {
    gap: 10,
    paddingTop: 10,
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 18,
  },
  bubbleLeft: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
  },
  bubbleRight: {
    alignSelf: 'flex-end',
    backgroundColor: colors.brand3,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.text,
  },
  chatInput: {
    position: 'absolute',
    left: spacing.screenPadding,
    right: spacing.screenPadding,
    bottom: 0,
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    paddingBottom: spacing.screenBottomNoNav,
    backgroundColor: colors.bg,
  },
  chatInputField: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
  },
  chatSend: {
    borderRadius: radius.pill,
    backgroundColor: '#111111',
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
  chatSendText: {
    color: '#ffffff',
    fontWeight: fonts.weights.bold,
  },
});
