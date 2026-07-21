import React, { useState, useCallback, useRef } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { Text, TextInput } from '../../components/typography';
import { useTranslation } from 'react-i18next';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useChat } from '../../hooks/useChat';
import { useLocalizedProduct } from '../../hooks/useLocalizedProduct';
import { updateListing, uploadListingImage } from '../../services/listingsService';
import { pickImagesFromLibrary, type PickedMedia } from '../../services/mediaPicker';
import { userCanChatOnListing } from '../../services/ordersService';
import { useCatalogRevision } from '../../utils/catalogSync';
import { formatMessageTimeLabel } from '../../utils/formatMessageTimeLabel';
import { ChatCounterpartTitle, ChatListingBar } from '../../components/ChatListingBar';
import { resolveDetailProduct } from '../../data/detailProducts';
import {
  acceptPrivateOffer,
  cancelPrivateOffer,
  createPrivateOffer,
  getPrivateOffer,
  listConversations,
  openConversation,
  rejectPrivateOffer,
} from '../../services/messagesService';
import { blockUser, submitReport } from '../../services/safetyService';
import { chatListingToProduct, buildChatListingFromId, chatListingFromConversation } from '../../services/chatListingService';
import { AppIcon } from '../../components/AppIcon';
import { BackButton, DismissibleModal, IconButton, LoadingState, Notice, PillButton, TitleBar } from '../../components/UI';
import { TableNote } from '../../components/FormUI';
import { colors, screenHorizontalInset, searchBarSurface, searchBarTokens } from '../../theme';
import { showTopBanner, toast } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useCatalogStore } from '../../store/catalogStore';
import { useChatStore } from '../../store/chatStore';
import { useFavoritesStore } from '../../store/favoritesStore';
import { nav } from '../../store/navigation';
import { styles } from './shared';

export function ChatScreen({ conversationId }: { conversationId: string }) {
  const { t, i18n } = useTranslation();
  const chatTitle = useChatStore((s) => s.chatTitle);
  const chatListing = useChatStore((s) => s.chatListing);
  const chatListingId = useChatStore((s) => s.chatListingId);
  const chatCounterpartKey = useChatStore((s) => s.chatCounterpartKey);
  const chatCounterpartAvatarUrl = useChatStore((s) => s.chatCounterpartAvatarUrl);
  const openDetail = useCatalogStore((s) => s.openDetail);
  const openSellerProfile = useCatalogStore((s) => s.openSellerProfile);
  const products = useCatalogStore((s) => s.products);
  const loadProduct = useCatalogStore((s) => s.loadProduct);
  const publishListingPriceChange = useCatalogStore((s) => s.publishListingPriceChange);
  const isSelfSeller = useFavoritesStore((s) => s.isSelfSeller);
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const user = useAuthStore((s) => s.user);
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
  const liveListingPrice = listingProduct?.price ?? displayListing?.price ?? 0;

  React.useEffect(() => {
    const listingId = displayListing?.listingId;
    if (!listingId) return;
    void loadProduct(listingId);
  }, [catalogRevision, displayListing?.listingId, loadProduct]);

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
  const isListingSeller = Boolean(
    listingProduct &&
      isSelfSeller(
        listingProduct.sellerKey,
        listingProduct.sellerUserId,
        localizedListing.seller,
      ),
  );
  const canEditListingPrice = isListingSeller && listingStatus === 'active';

  const handleSaveListingPrice = useCallback(
    async (newPrice: number) => {
      const listingId = displayListing?.listingId;
      if (!listingId) return;
      if (Math.abs(newPrice - liveListingPrice) < 0.001) return;
      try {
        await updateListing(listingId, { price: newPrice }, isLoggedIn);
        await publishListingPriceChange(listingId, newPrice);
        toast(t('toast.listingPriceUpdated'));
      } catch (err) {
        if (err instanceof Error && err.message === 'listing_has_orders') {
          toast(t('toast.listingHasOpenOrder'));
        } else if (err instanceof Error && err.message === 'listing_edit_blocked') {
          toast(t('toast.listingEditBlocked'));
        } else {
          toast(t('toast.publishFailed'));
        }
        throw err;
      }
    },
    [
      displayListing?.listingId,
      isLoggedIn,
      liveListingPrice,
      publishListingPriceChange,
      t,
      toast,
    ],
  );
  const { messages, send, sending, loading, loadError, reload, handleChatScroll, handleChatContentSizeChange } = useChat(
    conversationId,
    isLoggedIn,
    user?.id,
  );
  const handledPriceMessageRef = useRef<string | null>(null);
  React.useEffect(() => {
    const latest = [...messages].reverse().find((message) => message.kind === 'priceChange');
    if (!latest || latest.id === handledPriceMessageRef.current) return;
    handledPriceMessageRef.current = latest.id;
    if (latest.side === 'left' && latest.price != null) {
      showTopBanner(
        t('notifications.priceChangedBySeller', {
          price: `${t('common.currencyPrefix')}${latest.price}`,
        }),
      );
    }
    if (displayListing?.listingId) void loadProduct(displayListing.listingId);
  }, [displayListing?.listingId, loadProduct, messages, t]);
  const [input, setInput] = useState('');
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerShippingFee, setOfferShippingFee] = useState('0');
  const [offerSubmitting, setOfferSubmitting] = useState(false);
  const [safetyMenuOpen, setSafetyMenuOpen] = useState(false);
  const [reportUserOpen, setReportUserOpen] = useState(false);
  const [reportDescription, setReportDescription] = useState('');
  const [reportEvidence, setReportEvidence] = useState<PickedMedia[]>([]);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const chatScrollRef = useRef<ScrollView>(null);
  const viewedOfferIdsRef = useRef(new Set<string>());
  const title = chatTitle || localizedListing.seller || t('common.messages');
  const counterpartKey = chatCounterpartKey || localizedListing.sellerKey;
  const counterpartAvatarUrl = chatCounterpartAvatarUrl;

  React.useEffect(() => {
    const unseenOfferIds = messages
      .filter(
        (message) =>
          message.side === 'left' &&
          message.kind === 'privateOffer' &&
          message.privateOffer?.status === 'PENDING' &&
          !viewedOfferIdsRef.current.has(message.privateOffer.id),
      )
      .map((message) => message.privateOffer!.id);
    if (!unseenOfferIds.length) return;
    unseenOfferIds.forEach((offerId) => viewedOfferIdsRef.current.add(offerId));
    void Promise.all(unseenOfferIds.map((offerId) => getPrivateOffer(offerId)))
      .then(() => reload())
      .catch(() => {
        unseenOfferIds.forEach((offerId) => viewedOfferIdsRef.current.delete(offerId));
      });
  }, [messages, reload]);

  const closeSafetyMenu = useCallback(() => setSafetyMenuOpen(false), []);

  const showSafetyMenu = useCallback(() => {
    if (!counterpartKey) return;
    setSafetyMenuOpen(true);
  }, [counterpartKey]);

  const handleReportListing = useCallback(() => {
    if (!displayListing?.listingId) return;
    closeSafetyMenu();
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
  }, [closeSafetyMenu, displayListing?.listingId, isLoggedIn, t, toast]);

  const handleReportUser = useCallback(() => {
    if (!counterpartKey) return;
    closeSafetyMenu();
    setReportDescription('');
    setReportEvidence([]);
    setReportUserOpen(true);
  }, [closeSafetyMenu, counterpartKey]);

  const addReportEvidence = useCallback(async () => {
    const remaining = 3 - reportEvidence.length;
    if (remaining <= 0 || reportSubmitting) return;
    try {
      const picked = await pickImagesFromLibrary({ max: remaining });
      if (picked.length) {
        setReportEvidence((current) => [...current, ...picked].slice(0, 3));
      }
    } catch {
      toast(t('toast.settingsUpdateFailed'));
    }
  }, [reportEvidence.length, reportSubmitting, t, toast]);

  const submitUserReport = useCallback(async () => {
    const details = reportDescription.trim();
    if (!counterpartKey || !details || reportSubmitting) return;
    setReportSubmitting(true);
    try {
      const evidenceUrls: string[] = [];
      for (const asset of reportEvidence) {
        evidenceUrls.push(
          await uploadListingImage(asset.uri, isLoggedIn, asset.mimeType, asset.fileName),
        );
      }
      await submitReport(
        {
          targetType: 'user',
          targetId: counterpartKey,
          reason: 'chat',
          details,
          evidenceUrls,
        },
        isLoggedIn,
      );
      setReportUserOpen(false);
      setReportDescription('');
      setReportEvidence([]);
      toast(t('toast.reportSubmitted'));
    } catch {
      toast(t('toast.settingsUpdateFailed'));
    } finally {
      setReportSubmitting(false);
    }
  }, [counterpartKey, isLoggedIn, reportDescription, reportEvidence, reportSubmitting, t, toast]);

  const handleBlockUser = useCallback(() => {
    if (!counterpartKey) return;
    closeSafetyMenu();
    void blockUser(counterpartKey, isLoggedIn)
      .then(() => toast(t('toast.userBlocked')))
      .catch(() => toast(t('toast.settingsUpdateFailed')));
  }, [closeSafetyMenu, counterpartKey, isLoggedIn, t, toast]);

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

  const submitPrivateOffer = useCallback(async () => {
    const price = Number(offerPrice);
    const shippingFee = Number(offerShippingFee);
    if (
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isFinite(shippingFee) ||
      shippingFee < 0 ||
      offerSubmitting
    ) return;
    setOfferSubmitting(true);
    try {
      await createPrivateOffer(conversationId, {
        negotiatedPrice: price,
        shippingFee,
        expiresInMinutes: 24 * 60,
      });
      setOfferModalOpen(false);
      setOfferPrice('');
      setOfferShippingFee('0');
      await reload();
      toast(t('screens.chat.offerSent'));
    } catch {
      toast(t('screens.chat.offerFailed'));
    } finally {
      setOfferSubmitting(false);
    }
  }, [conversationId, offerPrice, offerShippingFee, offerSubmitting, reload, t, toast]);

  const actOnOffer = useCallback(
    async (offerId: string, action: 'accept' | 'reject' | 'cancel') => {
      if (offerSubmitting) return;
      setOfferSubmitting(true);
      try {
        if (action === 'accept') {
          await acceptPrivateOffer(offerId);
          await reload();
          toast(t('screens.chat.offerAccepted'));
          nav('orders');
          return;
        }
        else if (action === 'reject') await rejectPrivateOffer(offerId);
        else await cancelPrivateOffer(offerId);
        await reload();
        toast(t('screens.chat.offerUpdated'));
      } catch {
        toast(t('screens.chat.offerFailed'));
      } finally {
        setOfferSubmitting(false);
      }
    },
    [offerSubmitting, reload, t, toast],
  );

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
              priceLabel={`${t('common.currencyPrefix')}${liveListingPrice}`}
              price={liveListingPrice}
              currencyPrefix={t('common.currencyPrefix')}
              location={displayListing.location}
              canEditPrice={canEditListingPrice}
              onSavePrice={handleSaveListingPrice}
              onInvalidPrice={() => toast(t('screens.sold.adjustPriceInvalid'))}
              onPress={
                listingProduct ? () => openDetail(listingProduct) : undefined
              }
            />
            {liveListingPrice > 0 ? (
              <>
                <TableNote>{t('screens.chat.priceNegotiationHint')}</TableNote>
                {canEditListingPrice ? (
                  <Pressable
                    style={styles.privateOfferTrigger}
                    onPress={() => {
                      setOfferPrice(String(liveListingPrice));
                      setOfferModalOpen(true);
                    }}
                  >
                    <AppIcon name="cash" size={16} color={colors.text} />
                    <Text style={styles.privateOfferTriggerText}>
                      {t('screens.chat.sendPrivateOffer')}
                    </Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}
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
              messages.map((msg) => msg.kind === 'privateOffer' && msg.privateOffer ? (
                <View key={msg.id} style={styles.privateOfferCard}>
                  <View style={styles.privateOfferHeader}>
                    <AppIcon name="cash" size={18} color={colors.brand2} />
                    <Text style={styles.privateOfferTitle}>
                      {t('screens.chat.privateOffer')}
                    </Text>
                  </View>
                  <Text style={styles.privateOfferAmount}>
                    {msg.privateOffer.currency} {msg.privateOffer.totalAmount.toFixed(2)}
                  </Text>
                  <View style={styles.privateOfferDetails}>
                    <Text style={styles.privateOfferProduct} numberOfLines={2}>
                      {localizedListing.title}
                    </Text>
                    <View style={styles.privateOfferDetailRow}>
                      <Text style={styles.privateOfferDetailLabel}>
                        {t('screens.chat.originalPrice')}
                      </Text>
                      <Text style={styles.privateOfferDetailValue}>
                        {msg.privateOffer.currency} {msg.privateOffer.originalPrice.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.privateOfferDetailRow}>
                      <Text style={styles.privateOfferDetailLabel}>
                        {t('screens.chat.negotiatedPrice')}
                      </Text>
                      <Text style={styles.privateOfferDetailValue}>
                        {msg.privateOffer.currency} {msg.privateOffer.negotiatedPrice.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.privateOfferDetailRow}>
                      <Text style={styles.privateOfferDetailLabel}>
                        {t('screens.chat.shippingFee')}
                      </Text>
                      <Text style={styles.privateOfferDetailValue}>
                        {msg.privateOffer.shippingFee > 0
                          ? `${msg.privateOffer.currency} ${msg.privateOffer.shippingFee.toFixed(2)}`
                          : t('screens.chat.freeShipping')}
                      </Text>
                    </View>
                    <View style={styles.privateOfferDetailRow}>
                      <Text style={styles.privateOfferDetailLabel}>
                        {t('screens.chat.offerExpires')}
                      </Text>
                      <Text style={styles.privateOfferDetailValue}>
                        {new Date(msg.privateOffer.expirationTime).toLocaleString(i18n.language)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.privateOfferStatus}>
                    {t(`screens.chat.offerStatus.${msg.privateOffer.status}`)}
                  </Text>
                  {(['PENDING', 'VIEWED'] as const).includes(
                    msg.privateOffer.status as 'PENDING' | 'VIEWED',
                  ) ? (
                    <View style={styles.privateOfferActions}>
                      {msg.side === 'left' ? (
                        <>
                          <PillButton
                            label={t('screens.chat.rejectOffer')}
                            variant="light"
                            full
                            disabled={offerSubmitting}
                            onPress={() => void actOnOffer(msg.privateOffer!.id, 'reject')}
                          />
                          <PillButton
                            label={t('screens.chat.acceptOffer')}
                            variant="brand"
                            full
                            disabled={offerSubmitting}
                            onPress={() => void actOnOffer(msg.privateOffer!.id, 'accept')}
                          />
                        </>
                      ) : (
                        <PillButton
                          label={t('common.cancel')}
                          variant="light"
                          full
                          disabled={offerSubmitting}
                          onPress={() => void actOnOffer(msg.privateOffer!.id, 'cancel')}
                        />
                      )}
                    </View>
                  ) : null}
                </View>
              ) : msg.kind === 'priceChange' ? (
                <View key={msg.id} style={styles.priceChangeNotice}>
                  <AppIcon name="cash" size={16} color={colors.brand2} />
                  <Text style={styles.priceChangeNoticeText}>
                    {t('screens.chat.priceChangedMessage', {
                      price: `${t('common.currencyPrefix')}${msg.price ?? ''}`,
                    })}
                  </Text>
                </View>
              ) : (
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
      <DismissibleModal
        visible={offerModalOpen}
        onClose={() => {
          if (!offerSubmitting) setOfferModalOpen(false);
        }}
        placement="center"
        animationType="fade"
      >
        <View style={styles.privateOfferModal}>
          <Text style={styles.safetyMenuTitle}>{t('screens.chat.sendPrivateOffer')}</Text>
          <Text style={styles.privateOfferHelp}>{t('screens.chat.privateOfferHelp')}</Text>
          <TextInput
            style={styles.privateOfferInput}
            value={offerPrice}
            onChangeText={setOfferPrice}
            keyboardType="decimal-pad"
            placeholder={t('screens.chat.pricePlaceholder')}
            editable={!offerSubmitting}
          />
          <TextInput
            style={styles.privateOfferInput}
            value={offerShippingFee}
            onChangeText={setOfferShippingFee}
            keyboardType="decimal-pad"
            placeholder={t('screens.chat.shippingFeePlaceholder')}
            editable={!offerSubmitting}
          />
          <View style={styles.privateOfferActions}>
            <PillButton
              label={t('common.cancel')}
              variant="light"
              full
              disabled={offerSubmitting}
              onPress={() => setOfferModalOpen(false)}
            />
            <PillButton
              label={offerSubmitting ? t('common.loading') : t('screens.chat.sendPrivateOffer')}
              variant="brand"
              full
              disabled={
                !Number.isFinite(Number(offerPrice)) ||
                Number(offerPrice) <= 0 ||
                !Number.isFinite(Number(offerShippingFee)) ||
                Number(offerShippingFee) < 0 ||
                offerSubmitting
              }
              onPress={() => void submitPrivateOffer()}
            />
          </View>
        </View>
      </DismissibleModal>
      <DismissibleModal
        visible={safetyMenuOpen}
        onClose={closeSafetyMenu}
        placement="center"
        animationType="fade"
      >
        <View style={styles.safetyMenuCard}>
          <Text style={styles.safetyMenuTitle}>{t('screens.chat.safetyTitle')}</Text>
          {displayListing?.listingId ? (
            <Pressable style={styles.safetyMenuAction} onPress={handleReportListing}>
              <Text style={styles.safetyMenuActionText}>{t('screens.chat.reportListing')}</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.safetyMenuAction} onPress={handleReportUser}>
            <Text style={styles.safetyMenuActionText}>{t('screens.chat.reportUser')}</Text>
          </Pressable>
          <Pressable style={styles.safetyMenuAction} onPress={handleBlockUser}>
            <Text style={styles.safetyMenuActionDestructive}>{t('screens.chat.blockUser')}</Text>
          </Pressable>
          <Pressable style={styles.safetyMenuCancel} onPress={closeSafetyMenu}>
            <Text style={styles.safetyMenuCancelText}>{t('common.cancel')}</Text>
          </Pressable>
        </View>
      </DismissibleModal>
      <DismissibleModal
        visible={reportUserOpen}
        onClose={() => {
          if (!reportSubmitting) setReportUserOpen(false);
        }}
        placement="center"
        animationType="fade"
      >
        <View style={styles.reportUserCard}>
          <Text style={styles.safetyMenuTitle}>{t('screens.chat.reportUserTitle')}</Text>
          <TextInput
            style={styles.reportDescriptionInput}
            value={reportDescription}
            onChangeText={setReportDescription}
            placeholder={t('screens.chat.reportDescriptionPlaceholder')}
            multiline
            maxLength={1000}
            editable={!reportSubmitting}
          />
          <Text style={styles.reportUserHint}>{t('screens.chat.reportUserEvidenceHint')}</Text>
          <View style={styles.reportEvidenceRow}>
            {reportEvidence.map((asset, index) => (
              <Image
                key={`${asset.uri}-${index}`}
                source={{ uri: asset.uri }}
                style={styles.reportEvidenceImage}
              />
            ))}
            {reportEvidence.length < 3 ? (
              <Pressable
                style={styles.reportEvidenceAdd}
                onPress={() => void addReportEvidence()}
                disabled={reportSubmitting}
              >
                <AppIcon name="camera" size={22} color={colors.muted} />
                <Text style={styles.reportEvidenceAddText}>{t('screens.chat.addEvidence')}</Text>
              </Pressable>
            ) : null}
          </View>
          <View style={styles.reportUserActions}>
            <PillButton
              label={t('common.cancel')}
              variant="light"
              full
              disabled={reportSubmitting || !reportDescription.trim()}
              onPress={() => setReportUserOpen(false)}
            />
            <PillButton
              label={reportSubmitting ? t('common.loading') : t('screens.chat.submitReport')}
              variant="brand"
              full
              disabled={reportSubmitting}
              onPress={() => void submitUserReport()}
            />
          </View>
        </View>
      </DismissibleModal>
    </View>
  );
}
