import React, { useState, useCallback, useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text, TextInput } from '../../components/typography';
import { useTranslation } from 'react-i18next';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useChat } from '../../hooks/useChat';
import { useLocalizedProduct } from '../../hooks/useLocalizedProduct';
import { updateListing } from '../../services/listingsService';
import { userCanChatOnListing } from '../../services/ordersService';
import { useCatalogRevision } from '../../utils/catalogSync';
import { formatMessageTimeLabel } from '../../utils/formatMessageTimeLabel';
import { ChatCounterpartTitle, ChatListingBar } from '../../components/ChatListingBar';
import { resolveDetailProduct } from '../../data/detailProducts';
import { listConversations, openConversation } from '../../services/messagesService';
import { blockUser, submitReport } from '../../services/safetyService';
import { chatListingToProduct, buildChatListingFromId, chatListingFromConversation } from '../../services/chatListingService';
import { AppIcon } from '../../components/AppIcon';
import { BackButton, DismissibleModal, IconButton, LoadingState, Notice, PillButton, TitleBar } from '../../components/UI';
import { TableNote } from '../../components/FormUI';
import { colors, screenHorizontalInset, searchBarSurface, searchBarTokens } from '../../theme';
import { toast } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useCatalogStore } from '../../store/catalogStore';
import { useChatStore } from '../../store/chatStore';
import { useFavoritesStore } from '../../store/favoritesStore';
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
  const showPriceChangeBannerForConversation = useCatalogStore((s) => s.showPriceChangeBannerForConversation);
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
    if (!conversationId) return;
    void showPriceChangeBannerForConversation(conversationId);
    const timer = setInterval(() => {
      void showPriceChangeBannerForConversation(conversationId);
    }, 4000);
    return () => clearInterval(timer);
  }, [catalogRevision, conversationId, showPriceChangeBannerForConversation]);

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
  const [input, setInput] = useState('');
  const [safetyMenuOpen, setSafetyMenuOpen] = useState(false);
  const chatScrollRef = useRef<ScrollView>(null);
  const title = chatTitle || localizedListing.seller || t('common.messages');
  const counterpartKey = chatCounterpartKey || localizedListing.sellerKey;
  const counterpartAvatarUrl = chatCounterpartAvatarUrl;

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
  }, [closeSafetyMenu, counterpartKey, isLoggedIn, t, toast]);

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
              <TableNote>{t('screens.chat.priceNegotiationHint')}</TableNote>
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
    </View>
  );
}
