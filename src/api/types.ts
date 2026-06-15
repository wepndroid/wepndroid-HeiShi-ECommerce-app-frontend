/** Shared API DTOs — mirror backend contracts (Documents/DOC-002). */

export interface ApiErrorBody {
  code?: string;
  message: string;
  details?: unknown;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export interface RegionDto {
  state: string;
  stateName: string;
  cities: {
    name: string;
    cn: string;
    areas: string[];
  }[];
}

export interface ListingSummaryDto {
  id: number;
  type: 'product' | 'service' | 'bundle';
  title: string;
  description?: string;
  price: number;
  currency: 'AUD';
  categoryKey: string;
  tagKey: string;
  locationLabel: string;
  imageUrl: string;
  seller: {
    id: string;
    nickname: string;
    avatarUrl?: string;
    verified?: boolean;
  };
  status: 'active' | 'draft' | 'sold' | 'inactive';
  createdAt: string;
}

export interface ListingDetailDto extends ListingSummaryDto {
  images: string[];
  conditionKey?: string;
  negotiable?: boolean;
  escrowSupported?: boolean;
  pickupMethods?: string[];
  viewCount?: number;
  favoriteCount?: number;
}

export interface FeedQuery {
  regionState?: string;
  regionCity?: string;
  regionArea?: string;
  tab?: 'recommended' | 'newArrivals' | 'digital' | 'services' | 'tickets';
  categoryKey?: string;
  page?: number;
  pageSize?: number;
}

export interface SearchQuery extends FeedQuery {
  q?: string;
  sort?: 'relevance' | 'priceAsc' | 'priceDesc' | 'newest';
}

export interface AuthUserDto {
  id: string;
  nickname: string;
  phone: string;
  avatarUrl?: string;
  bio?: string;
  city?: string;
  language?: 'en' | 'zh';
  heishiId: string;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUserDto;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface RegisterRequest {
  nickname: string;
  phone: string;
  password: string;
}

export interface OrderDto {
  id: number;
  listingId: number;
  listingTitle: string;
  listingImageUrl: string;
  seller: { id: string; nickname: string };
  status: 'pendingPay' | 'pendingShip' | 'pendingReceive' | 'pendingReview' | 'completed' | 'cancelled';
  amount: number;
  escrowFee: number;
  currency: 'AUD';
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  listingId: number;
  deliveryMethod: string;
  paymentMethodId?: string;
}

export interface FavoriteDto {
  listingId: number;
  createdAt: string;
}

export interface ConversationDto {
  id: string;
  counterpart: { id: string; nickname: string; avatarUrl?: string };
  listing?: { id: number; title: string; imageUrl?: string };
  lastMessage?: { text: string; sentAt: string };
  unreadCount: number;
}

export interface ChatMessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  sentAt: string;
}

export interface UserProfileUpdateRequest {
  nickname?: string;
  bio?: string;
  city?: string;
  language?: 'en' | 'zh';
  avatarUrl?: string;
}

export interface AddressDto {
  id: string;
  label: string;
  area: string;
  meetupSpot?: string;
  isDefault?: boolean;
}

export interface PaymentMethodDto {
  id: string;
  type: 'card' | 'apple_pay' | 'paypal';
  label: string;
  last4?: string;
  isDefault?: boolean;
}

export interface PayoutMethodDto {
  id: string;
  type: 'bank' | 'paypal';
  label: string;
  last4?: string;
  isDefault?: boolean;
}

export interface CouponDto {
  id: string;
  amount: number;
  currency: 'AUD';
  description: string;
  expiresAt?: string;
  status: 'available' | 'used' | 'expired';
}

export interface FollowDto {
  userId: string;
  nickname: string;
  subtitle?: string;
  followedAt: string;
}

export interface NotificationSettingsDto {
  intentAlerts: boolean;
  chatMessages: boolean;
  reviewResults: boolean;
  marketing: boolean;
}

export interface PrivacySettingsDto {
  findByPhone: boolean;
  showWechatBadge: boolean;
  personalization: boolean;
}

export interface CreditProfileDto {
  score: number;
  trades: number;
  completionRate: number;
  violations: number;
  rating: number;
}

export interface ReviewSummaryDto {
  score: number;
  pendingCount: number;
}

export interface LocalServiceDto {
  id: number;
  title: string;
  description: string;
  priceFrom: number;
  currency: 'AUD';
  area: string;
  icon: 'truck' | 'broom' | 'cameraService';
  seller: { id: string; nickname: string };
}

export interface CreateListingRequest {
  type: 'product' | 'service';
  title: string;
  description: string;
  price: number;
  categoryKey: string;
  conditionKey?: string;
  tagKey?: string;
  locationLabel: string;
  imageUrls: string[];
  pickupMethods?: string[];
}

export interface UploadImageResponse {
  url: string;
  key: string;
}
