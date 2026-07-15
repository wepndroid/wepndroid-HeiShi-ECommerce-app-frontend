import { ALL_AREAS, RegionSelection } from '../data/region';
import { resolveDemoSellerKey, sellerKeyFromUserId } from '../data/catalogDemo';
import type {
  FeedQuery,
  ListingDetailDto,
  ListingSummaryDto,
  LocalServiceDto,
  OrderDto,
  ConversationDto,
  ChatMessageDto,
  BundleMetaDto,
} from './types';
import { parseBundleMeta } from '../data/bundle';
import { collectMediaUrls, normalizeMediaUrl } from '../utils/mediaUrls';
import type { Product, ProductCatKey, HomeTabKey, UiOrder, UiConversation, UiChatMessage, UiListing } from '../types';
import type { LocalService } from '../data/services';

export function regionToFeedQuery(
  region: RegionSelection,
): Pick<FeedQuery, 'regionState' | 'regionCity' | 'regionArea'> {
  return {
    regionState: region.state,
    regionCity: region.city,
    regionArea: region.area === ALL_AREAS ? undefined : region.area,
  };
}

/** Map backend listing DTO → UI Product model used by existing screens. */
export function mapListingToProduct(dto: ListingSummaryDto): Product {
  const demoSellerKey =
    resolveDemoSellerKey(dto.id) ?? sellerKeyFromUserId(dto.seller.id) ?? dto.seller.id;
  const images = collectMediaUrls(dto.images, dto.imageUrl);
  return {
    id: dto.id,
    price: dto.price,
    catKey: dto.categoryKey as ProductCatKey,
    tagKey: dto.tagKey,
    sellerKey: demoSellerKey,
    seller: dto.seller.nickname,
    sellerAvatarUrl: normalizeMediaUrl(dto.seller.avatarUrl),
    sellerUserId: dto.seller.id,
    loc: dto.locationLabel,
    height: '',
    imageUrl: images[0] ?? normalizeMediaUrl(dto.imageUrl) ?? '',
    imageUrls: images,
    apiTitle: dto.title,
    apiDesc: dto.description,
    apiVisual: dto.title,
    listingType: dto.type,
    listingStatus: dto.status,
    reviewStatus: dto.reviewStatus,
    reviewNote: dto.reviewNote,
    favoriteCount: dto.favoriteCount,
    isPinned: dto.isPinned,
    isRecommended: dto.isRecommended,
    sellerPhoneVerified: dto.seller.phoneVerified,
    sellerIdentityVerified: dto.seller.identityVerified,
    sellerCompletedOrders: dto.seller.completedOrderCount,
    sellerPositiveRatingRate: dto.seller.positiveRatingRate,
  };
}

function mapBundleMetaDto(dto?: BundleMetaDto | null, listingUrls?: string[]) {
  return parseBundleMeta(dto ?? null, listingUrls);
}

export function mapDetailDtoToProduct(dto: ListingDetailDto): Product {
  const images = collectMediaUrls(dto.images, dto.imageUrl);
  return {
    ...mapListingToProduct(dto),
    favoriteCount: dto.favoriteCount ?? 0,
    bundleMeta: mapBundleMetaDto(dto.bundleMeta, images) ?? undefined,
    conditionKey: dto.conditionKey,
    pickupMethodKeys: dto.pickupMethods,
    purchaseAvailable: dto.purchaseAvailable ?? dto.status === 'active',
    serviceIcon: dto.serviceIcon,
    escrowSupported: dto.escrowSupported,
    meetInPublic: dto.meetInPublic,
    escrowFee: dto.escrowFee,
    negotiable: dto.negotiable,
  };
}

export function mapServiceDtoToLocalService(dto: LocalServiceDto): LocalService {
  const demoSellerKey = resolveDemoSellerKey(dto.id) ?? sellerKeyFromUserId(dto.seller.id);
  return {
    id: dto.id,
    titleKey: '',
    priceKey: '',
    listPrice: dto.priceFrom,
    sellerKey: demoSellerKey ?? dto.seller.id,
    seller: dto.seller.nickname,
    descKey: '',
    area: dto.area,
    icon: dto.icon,
    imageUrl: normalizeMediaUrl(dto.imageUrl) ?? dto.imageUrl ?? '',
    apiTitle: dto.title,
    apiDesc: dto.description,
    apiPriceLabel: `A$${dto.priceFrom}`,
  };
}

/** When backend returns localized strings, prefer them over i18n keys. */
export function mapListingToLocalizedFields(dto: ListingSummaryDto) {
  return {
    title: dto.title,
    desc: dto.description ?? '',
    seller: dto.seller.nickname,
  };
}

export function mergeProducts(existing: Product[], incoming: Product[]): Product[] {
  const map = new Map(existing.map((p) => [p.id, p]));
  for (const product of incoming) {
    const prev = map.get(product.id);
    const prevCount = prev?.imageUrls?.length ?? 0;
    const nextCount = product.imageUrls?.length ?? 0;
    let merged: Product;
    if (prev && prevCount > nextCount) {
      merged = {
        ...product,
        imageUrls: prev.imageUrls,
        imageUrl: prev.imageUrl ?? product.imageUrl,
      };
    } else {
      merged = product;
    }
    if (prev?.bundleMeta && !merged.bundleMeta) {
      merged = { ...merged, bundleMeta: prev.bundleMeta };
    }
    if (prev) {
      if (product.purchaseAvailable !== undefined) {
        merged = { ...merged, purchaseAvailable: product.purchaseAvailable };
      }
    }
    map.set(product.id, merged);
  }
  return [...map.values()];
}

export function mapOrderDtoToUiOrder(dto: OrderDto): UiOrder {
  return {
    id: dto.id,
    listingId: dto.listingId,
    title: dto.listingTitle,
    imageUrl: normalizeMediaUrl(dto.listingImageUrl) ?? dto.listingImageUrl,
    sellerName: dto.seller.nickname,
    buyerId: dto.buyer?.id,
    buyerName: dto.buyer?.nickname,
    amount: dto.amount,
    status: dto.status,
    deliveryMethod: dto.deliveryMethod,
    paymentMethodId: dto.paymentMethodId,
    escrowFee: dto.escrowFee,
    bundleItemId: dto.bundleItemId,
    couponId: dto.couponId,
    discountAmount: dto.discountAmount,
    displayAmountCny: dto.displayAmountCny,
    viewerHasReviewed: dto.viewerHasReviewed ?? false,
  };
}

export function mapConversationDtoToUi(dto: ConversationDto): UiConversation {
  return {
    id: dto.id,
    counterpartName: dto.counterpart.nickname,
    counterpartKey: dto.counterpart.id,
    counterpartAvatarUrl: normalizeMediaUrl(dto.counterpart.avatarUrl),
    lastMessage: dto.lastMessage?.text ?? '',
    timeLabel: dto.lastMessage?.sentAt ?? '',
    unreadCount: dto.unreadCount,
    markedAsUnread: dto.markedAsUnread ?? false,
    listingId: dto.listing?.id,
    listingTitle: dto.listing?.title,
    listingImageUrl: normalizeMediaUrl(dto.listing?.imageUrl),
    listingPrice: dto.listing?.price,
    listingLocation: dto.listing?.locationLabel,
    listingStatus: dto.listing?.status,
  };
}

export function mapChatMessageDtoToUi(dto: ChatMessageDto, currentUserId?: string): UiChatMessage {
  const ackRead =
    dto.ackRead ??
    (dto as ChatMessageDto & { ack_read?: boolean }).ack_read ??
    false;
  return {
    id: dto.id,
    text: dto.text,
    side: currentUserId && dto.senderId === currentUserId ? 'right' : 'left',
    sentAt: dto.sentAt,
    senderId: dto.senderId,
    ackRead,
    kind: dto.kind,
    price: dto.price,
  };
}

export function mapListingDtoToUiListing(dto: ListingSummaryDto): UiListing {
  const images = collectMediaUrls(dto.images, dto.imageUrl);
  return {
    id: dto.id,
    title: dto.title,
    imageUrl: images[0] ?? normalizeMediaUrl(dto.imageUrl) ?? dto.imageUrl,
    imageUrls: images,
    listingType: dto.type,
    price: dto.price,
    status:
      dto.status === 'draft'
        ? 'draft'
        : dto.status === 'inactive'
          ? 'inactive'
            : dto.status === 'sold'
              ? 'sold'
              : 'active',
    reviewStatus: dto.reviewStatus,
    reviewNote: dto.reviewNote,
  };
}

export function mockFeedQuery(tab: HomeTabKey, categoryKey?: ProductCatKey): Pick<FeedQuery, 'tab' | 'categoryKey'> {
  return {
    tab,
    categoryKey: categoryKey,
  };
}
