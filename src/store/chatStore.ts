import { create } from 'zustand';
import { router, type Href } from 'expo-router';
import i18n from '../i18n';
import { ApiError } from '../api/client';
import { screenPath } from '../routing/paths';
import { listConversations, openConversation } from '../services/messagesService';
import {
  buildChatListingFromId,
  chatListingFromConversation,
  resolveChatListing,
} from '../services/chatListingService';
import type { ChatListingContext, UiConversation } from '../types';
import { useAuthStore } from './authStore';
import { useCatalogStore } from './catalogStore';
import { nav } from './navigation';
import { toast } from './uiStore';

interface OpenChatParams {
  conversationId?: string;
  listingId?: number;
  counterpartUserId?: string;
  counterpartName?: string;
  listingTitle?: string;
}

// Active chat conversation session (metadata + resolved listing context).
interface ChatState {
  chatTitle: string;
  chatConversationId: string | null;
  chatListing: ChatListingContext | null;
  chatListingId: number | null;
  chatCounterpartKey: string;
  chatCounterpartAvatarUrl?: string;
  applyChatSession: (
    conversation: UiConversation,
    listing: ChatListingContext | null,
    listingId: number | null | undefined,
    params?: { counterpartName?: string },
  ) => void;
  openChat: (params: OpenChatParams) => Promise<void>;
  hydrateChatFromConversationId: (conversationId: string) => Promise<void>;
  patchListingPrice: (listingId: number, newPrice: number) => void;
  reset: () => void;
}

async function resolveListingForChat(
  conversation: UiConversation,
  params: { listingId?: number; listingTitle?: string },
): Promise<{ listing: ChatListingContext | null; listingId: number | null | undefined }> {
  const { currentItem, products } = useCatalogStore.getState();
  let listing = await resolveChatListing(conversation, params, currentItem, products);
  if (!listing) {
    listing = chatListingFromConversation(conversation, products);
  }
  const listingId = params.listingId ?? conversation.listingId;
  if (!listing && listingId != null) {
    listing =
      buildChatListingFromId(listingId, products, params.listingTitle ?? conversation.listingTitle) ??
      chatListingFromConversation(conversation, products) ??
      (conversation.listingTitle
        ? {
            listingId,
            title: conversation.listingTitle,
            imageUrl: conversation.listingImageUrl ?? '',
            price: conversation.listingPrice ?? 0,
            location: conversation.listingLocation ?? '',
          }
        : null);
  }
  return { listing, listingId };
}

export const useChatStore = create<ChatState>((set, get) => ({
  chatTitle: '',
  chatConversationId: null,
  chatListing: null,
  chatListingId: null,
  chatCounterpartKey: '',
  chatCounterpartAvatarUrl: undefined,

  applyChatSession: (conversation, listing, listingId, params) => {
    set({
      chatConversationId: conversation.id,
      chatTitle: params?.counterpartName ?? conversation.counterpartName,
      chatCounterpartKey: conversation.counterpartKey,
      chatCounterpartAvatarUrl: conversation.counterpartAvatarUrl,
      chatListing: listing,
      chatListingId: listing?.listingId ?? listingId ?? conversation.listingId ?? null,
    });
  },

  openChat: async (params) => {
    const { authReady, user } = useAuthStore.getState();
    if (!authReady) return;
    if (!user) {
      toast(i18n.t('toast.loginRequired'));
      nav('login');
      return;
    }
    try {
      const conversation = await openConversation(params, user != null);
      const { listing, listingId } = await resolveListingForChat(conversation, params);
      get().applyChatSession(conversation, listing, listingId, params);
      if (listing?.listingId) void useCatalogStore.getState().loadProduct(listing.listingId);
      router.push(screenPath('chat', { chatId: conversation.id }) as Href);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INVALID_STATE') {
        toast(i18n.t('toast.listingUnavailable'));
      } else {
        toast(i18n.t('toast.chatLoadFailed'));
      }
    }
  },

  hydrateChatFromConversationId: async (conversationId) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    const state = get();
    if (
      state.chatConversationId === conversationId &&
      state.chatTitle &&
      (state.chatListing || state.chatListingId != null)
    ) {
      return;
    }
    try {
      const conversations = await listConversations(user != null);
      const existing = conversations.find((c) => c.id === conversationId);
      const conversation = existing ?? (await openConversation({ conversationId }, user != null));
      const { listing, listingId } = await resolveListingForChat(conversation, {});
      get().applyChatSession(conversation, listing, listingId);
      if (listing?.listingId) void useCatalogStore.getState().loadProduct(listing.listingId);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INVALID_STATE') {
        toast(i18n.t('toast.listingUnavailable'));
      } else {
        toast(i18n.t('toast.chatLoadFailed'));
      }
    }
  },

  patchListingPrice: (listingId, newPrice) => {
    set((state) => ({
      chatListing:
        state.chatListing?.listingId === listingId
          ? { ...state.chatListing, price: newPrice }
          : state.chatListing,
    }));
  },

  reset: () =>
    set({
      chatTitle: '',
      chatConversationId: null,
      chatListing: null,
      chatListingId: null,
      chatCounterpartKey: '',
      chatCounterpartAvatarUrl: undefined,
    }),
}));
