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
  images?: string[];
  seller: {
    id: string;
    nickname: string;
    avatarUrl?: string;
    verified?: boolean;
  };
  status: 'active' | 'draft' | 'sold' | 'inactive';
  createdAt: string;
  favoriteCount?: number;
}

export interface ListingDetailDto extends ListingSummaryDto {
  images: string[];
  conditionKey?: string;
  negotiable?: boolean;
  escrowSupported?: boolean;
  pickupMethods?: string[];
  viewCount?: number;
  favoriteCount?: number;
  bundleMeta?: BundleMetaDto;
  purchaseAvailable?: boolean;
  serviceIcon?: 'truck' | 'broom' | 'cameraService';
  meetInPublic?: boolean;
  escrowFee?: number;
}

export interface BundleItemDto {
  id: string;
  title: string;
  sharePrice: number;
  separatePrice?: number;
  imageUrl?: string;
  imageUrls?: string[];
  status: 'available' | 'onHold' | 'sold';
}

export interface BundleMetaDto {
  fullPrice: number;
  pickupDeadline?: string;
  allowSeparateSale: boolean;
  pickupWindow?: string;
  totalItems: number;
  coverImageUrls?: string[];
  items: BundleItemDto[];
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

export interface ImageSearchResponseDto {
  suggestedQuery: string;
  matchCount: number;
  items: ListingSummaryDto[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
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
  verificationCode: string;
  city: string;
  avatarUrl?: string;
}

export interface SyncProfileRequest {
  nickname: string;
  phone?: string;
  city: string;
  avatarUrl: string;
}

export interface SendRegisterCodeRequest {
  phone: string;
}

export interface SendRegisterCodeResponse {
  expiresIn: number;
  resendAfter: number;
  devCode?: string;
}

export interface OrderDto {
  id: number;
  listingId: number;
  listingTitle: string;
  listingImageUrl: string;
  seller: { id: string; nickname: string };
  buyer?: { id: string; nickname: string; avatarUrl?: string };
  status: 'pendingPay' | 'pendingShip' | 'pendingReceive' | 'pendingReview' | 'completed' | 'cancelled';
  amount: number;
  escrowFee: number;
  currency: 'AUD';
  deliveryMethod?: string;
  paymentMethodId?: string;
  bundleItemId?: string;
  couponId?: string;
  discountAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  listingId: number;
  deliveryMethod: string;
  paymentMethodId?: string;
  bundleItemId?: string;
  couponId?: string;
}

export interface OrderReviewDto {
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface FavoriteDto {
  listingId: number;
  createdAt: string;
}

export interface ConversationDto {
  id: string;
  counterpart: { id: string; nickname: string; avatarUrl?: string };
  listing?: {
    id: number;
    title: string;
    imageUrl?: string;
    price?: number;
    locationLabel?: string;
    currency?: 'AUD';
    status?: 'active' | 'draft' | 'sold' | 'inactive';
  };
  lastMessage?: { text: string; sentAt: string };
  unreadCount: number;
  markedAsUnread?: boolean;
}

export interface ChatMessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  sentAt: string;
  ackRead?: boolean;
}

export type NotificationCategory = 'system' | 'order' | 'follow';

export interface InboxNotificationDto {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  createdAt: string;
  unread: boolean;
  actionType?: string;
  actionRef?: string;
}

export interface NotificationGroupDto {
  category: NotificationCategory;
  unreadCount: number;
  previewTitle: string;
  previewBody: string;
  lastAt?: string | null;
}

export interface UserProfileUpdateRequest {
  nickname?: string;
  bio?: string;
  city?: string;
  language?: 'en' | 'zh';
  avatarUrl?: string;
}

/** Public seller profile — excludes phone, payment, and address data. */
export interface PublicUserProfileDto {
  id: string;
  nickname: string;
  avatarUrl?: string;
  bio?: string;
  city?: string;
  memberSince: string;
  rating: number;
  reviewCount: number;
  listingCount: number;
  followerCount: number;
  phoneVerified: boolean;
  identityVerified: boolean;
  businessVerified: boolean;
  wechatLinked: boolean;
  alipayLinked: boolean;
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
  avatarUrl?: string;
  followedAt: string;
}

export interface NotificationSettingsDto {
  intentAlerts: boolean;
  chatMessages: boolean;
  reviewResults: boolean;
  marketing: boolean;
}

export interface TransactionReminderSettingsDto {
  payAlerts: boolean;
  shipAlerts: boolean;
  receiveAlerts: boolean;
  disputeAlerts: boolean;
}

export interface PrivacySettingsDto {
  findByPhone: boolean;
  showWechatBadge: boolean;
  personalization: boolean;
}

export interface DataExportDto {
  exportedAt: string;
  profile: AuthUserDto;
  notificationSettings: NotificationSettingsDto;
  privacySettings: PrivacySettingsDto;
  transactionReminderSettings: TransactionReminderSettingsDto;
  addresses: AddressDto[];
  verification: {
    phoneVerified: boolean;
    wechatBound: boolean;
    alipayBound: boolean;
    identityVerified: boolean;
    businessVerified: boolean;
  };
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
  imageUrl?: string;
  seller: { id: string; nickname: string };
}

export interface CreateListingRequest {
  type: 'product' | 'service' | 'bundle';
  title: string;
  description: string;
  price: number;
  categoryKey: string;
  conditionKey?: string;
  tagKey?: string;
  locationLabel: string;
  regionState?: string;
  regionCity?: string;
  imageUrls: string[];
  pickupMethods?: string[];
  bundleItems?: { id?: string; title: string; sharePrice: number; separatePrice?: number; imageUrl?: string; imageUrls?: string[] }[];
  pickupDeadline?: string;
  allowSeparateSale?: boolean;
  pickupWindow?: string;
  serviceIcon?: 'truck' | 'broom' | 'cameraService';
  status?: 'active' | 'draft';
  escrowSupported?: boolean;
  negotiable?: boolean;
  meetInPublic?: boolean;
}

export interface UploadImageResponse {
  url: string;
  key: string;
}

export interface FormOptionDto {
  key: string;
  labelEn: string;
  labelZh: string;
}

export interface ListingFormOptionsDto {
  categories: FormOptionDto[];
  conditions: FormOptionDto[];
  pickupMethods: FormOptionDto[];
  deliveryMethods: FormOptionDto[];
  serviceTypes: FormOptionDto[];
  serviceAreas: FormOptionDto[];
  serviceTimeSlots: FormOptionDto[];
}
