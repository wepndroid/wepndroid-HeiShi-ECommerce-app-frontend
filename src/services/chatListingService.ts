import { resolveDetailProduct } from '../data/detailProducts';
import { fetchListingDetail } from './catalogService';
import type { ChatListingContext, Product, UiConversation } from '../types';

function fromProduct(product: Product, titleOverride?: string): ChatListingContext {
  return {
    listingId: product.id,
    title: titleOverride ?? product.apiTitle ?? '',
    imageUrl: product.imageUrl,
    price: product.price,
    location: product.loc,
  };
}

export function chatListingToProduct(ctx: ChatListingContext): Product {
  return {
    id: ctx.listingId,
    price: ctx.price,
    catKey: 'misc',
    tagKey: '',
    sellerKey: '',
    seller: '',
    loc: ctx.location,
    height: '',
    imageUrl: ctx.imageUrl,
    apiTitle: ctx.title,
  };
}

export function buildChatListingFromId(
  listingId: number,
  products: Product[],
  titleOverride?: string,
): ChatListingContext | null {
  const product = products.find((p) => p.id === listingId) ?? resolveDetailProduct(listingId);
  if (!product) return null;
  return fromProduct(product, titleOverride);
}

export function chatListingFromConversation(
  conversation: UiConversation,
  products: Product[],
): ChatListingContext | null {
  const listingId = conversation.listingId;
  if (listingId == null) return null;

  const fromCatalog = buildChatListingFromId(listingId, products, conversation.listingTitle);
  if (fromCatalog) return fromCatalog;

  if (conversation.listingTitle) {
    return {
      listingId,
      title: conversation.listingTitle,
      imageUrl: conversation.listingImageUrl ?? '',
      price: conversation.listingPrice ?? 0,
      location: conversation.listingLocation ?? '',
    };
  }

  return null;
}

export async function resolveChatListing(
  conversation: UiConversation,
  params: { listingId?: number; listingTitle?: string },
  currentItem: Product,
  products: Product[],
): Promise<ChatListingContext | null> {
  const listingId = params.listingId ?? conversation.listingId;
  if (listingId == null) return null;

  if (currentItem.id === listingId) {
    return fromProduct(currentItem, params.listingTitle);
  }

  const cached = products.find((p) => p.id === listingId) ?? resolveDetailProduct(listingId);
  if (cached) {
    return fromProduct(cached, params.listingTitle ?? conversation.listingTitle);
  }

  if (conversation.listingTitle && conversation.listingImageUrl) {
    return {
      listingId,
      title: conversation.listingTitle,
      imageUrl: conversation.listingImageUrl,
      price: conversation.listingPrice ?? 0,
      location: conversation.listingLocation ?? '',
    };
  }

  const fetched = await fetchListingDetail(listingId);
  if (fetched) {
    return fromProduct(fetched, params.listingTitle ?? conversation.listingTitle);
  }

  return buildChatListingFromId(listingId, products, params.listingTitle ?? conversation.listingTitle);
}
