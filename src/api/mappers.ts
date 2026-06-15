import { ALL_AREAS, RegionSelection } from '../data/region';
import type {
  FeedQuery,
  ListingDetailDto,
  ListingSummaryDto,
  LocalServiceDto,
  OrderDto,
  ConversationDto,
  ChatMessageDto,
} from './types';
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
  return {
    id: dto.id,
    price: dto.price,
    catKey: dto.categoryKey as ProductCatKey,
    tagKey: dto.tagKey,
    sellerKey: dto.seller.id,
    seller: dto.seller.nickname,
    loc: dto.locationLabel,
    height: '',
    imageUrl: dto.imageUrl,
    apiTitle: dto.title,
    apiDesc: dto.description,
    apiVisual: dto.title,
  };
}

export function mapDetailDtoToProduct(dto: ListingDetailDto): Product {
  return {
    ...mapListingToProduct(dto),
    imageUrl: dto.images[0] ?? dto.imageUrl,
  };
}

export function mapServiceDtoToLocalService(dto: LocalServiceDto): LocalService {
  return {
    id: dto.id,
    titleKey: '',
    priceKey: '',
    listPrice: dto.priceFrom,
    sellerKey: dto.seller.id,
    seller: dto.seller.nickname,
    descKey: '',
    area: dto.area,
    icon: dto.icon,
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
    map.set(product.id, product);
  }
  return [...map.values()];
}

export function mapOrderDtoToUiOrder(dto: OrderDto): UiOrder {
  return {
    id: dto.id,
    listingId: dto.listingId,
    title: dto.listingTitle,
    imageUrl: dto.listingImageUrl,
    sellerName: dto.seller.nickname,
    amount: dto.amount,
    status: dto.status === 'cancelled' ? 'completed' : dto.status,
  };
}

export function mapConversationDtoToUi(dto: ConversationDto): UiConversation {
  return {
    id: dto.id,
    counterpartName: dto.counterpart.nickname,
    lastMessage: dto.lastMessage?.text ?? '',
    timeLabel: dto.lastMessage?.sentAt ?? '',
    unreadCount: dto.unreadCount,
    listingId: dto.listing?.id,
  };
}

export function mapChatMessageDtoToUi(dto: ChatMessageDto, currentUserId?: string): UiChatMessage {
  return {
    id: dto.id,
    text: dto.text,
    side: currentUserId && dto.senderId === currentUserId ? 'right' : 'left',
  };
}

export function mapListingDtoToUiListing(dto: ListingSummaryDto): UiListing {
  return {
    id: dto.id,
    title: dto.title,
    imageUrl: dto.imageUrl,
    price: dto.price,
    status: dto.status === 'draft' ? 'draft' : dto.status === 'inactive' ? 'inactive' : 'active',
  };
}

export function mockFeedQuery(tab: HomeTabKey, categoryKey?: ProductCatKey): Pick<FeedQuery, 'tab' | 'categoryKey'> {
  return {
    tab,
    categoryKey: categoryKey,
  };
}
