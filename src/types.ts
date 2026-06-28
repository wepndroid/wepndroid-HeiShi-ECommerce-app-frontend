import type { BundleMeta } from './data/bundle';

export type ProductHeight = '' | 'tall' | 'short';

export type LoadProductResult = 'ok' | 'not_found' | 'error';

export type ProductCatKey =
  | 'digital'
  | 'home'
  | 'fashion'
  | 'beauty'
  | 'tickets'
  | 'services'
  | 'misc'
  | 'motorcycle'
  | 'textbooks';

export type ScreenId =
  | 'home'
  | 'category'
  | 'search'
  | 'detail'
  | 'order'
  | 'publish'
  | 'uploadProduct'
  | 'publishBundle'
  | 'publishService'
  | 'resale'
  | 'messages'
  | 'chat'
  | 'profile'
  | 'settings'
  | 'editProfile'
  | 'address'
  | 'accountSafety'
  | 'paymentSettings'
  | 'payoutSettings'
  | 'transactionReminder'
  | 'notificationSettings'
  | 'privacySettings'
  | 'about'
  | 'agreement'
  | 'privacyPolicy'
  | 'help'
  | 'login'
  | 'register'
  | 'authCenter'
  | 'creditProfile'
  | 'reviewManage'
  | 'safetyCenter'
  | 'orders'
  | 'myListings'
  | 'sold'
  | 'myServices'
  | 'favorites'
  | 'history'
  | 'following'
  | 'coupons'
  | 'messageGroup'
  | 'sellerProfile';

export type NotificationCategory = 'system' | 'order' | 'follow';

export type TabScreenId = 'home' | 'category' | 'publish' | 'messages' | 'profile';

export type HomeTabKey =
  | 'recommended'
  | 'newArrivals'
  | 'digital'
  | 'services'
  | 'tickets';

export interface Product {
  id: number;
  price: number;
  catKey: ProductCatKey;
  tagKey: string;
  sellerKey: string;
  seller: string;
  /** Seller profile photo when provided by API; fallback generated from sellerKey. */
  sellerAvatarUrl?: string;
  /** Backend user id for the seller — used to resolve the signed-in user's avatar. */
  sellerUserId?: string;
  loc: string;
  height: ProductHeight;
  imageUrl: string;
  /** All listing photos for detail gallery (first item matches imageUrl when set). */
  imageUrls?: string[];
  /** When set, detail copy comes from these i18n keys instead of products.items.{id}.* */
  titleKey?: string;
  descKey?: string;
  visualKey?: string;
  /** When set, prefer these API strings over i18n keys (catalog integration). */
  apiTitle?: string;
  apiDesc?: string;
  apiVisual?: string;
  /** Total favorites/likes on this listing (from API). */
  favoriteCount?: number;
  listingType?: 'product' | 'service' | 'bundle';
  bundleMeta?: BundleMeta;
  listingStatus?: 'active' | 'sold' | 'inactive' | 'draft';
  purchaseAvailable?: boolean;
  conditionKey?: string;
  pickupMethodKeys?: string[];
  serviceIcon?: 'truck' | 'broom' | 'cameraService';
  escrowSupported?: boolean;
  negotiable?: boolean;
  meetInPublic?: boolean;
  escrowFee?: number;
}

export type ChatMessage = {
  id: number | string;
  textKey?: string;
  text?: string;
  side: 'left' | 'right';
};

/** Conversation row for messages inbox UI. */
export interface UiConversation {
  id: string;
  counterpartName: string;
  counterpartKey: string;
  counterpartAvatarUrl?: string;
  lastMessage: string;
  timeLabel: string;
  unreadCount: number;
  markedAsUnread?: boolean;
  verified?: boolean;
  listingId?: number;
  listingTitle?: string;
  listingImageUrl?: string;
  listingPrice?: number;
  listingLocation?: string;
  listingStatus?: 'active' | 'sold' | 'inactive' | 'draft';
}

/** Product/service context shown at the top of a chat thread. */
export interface ChatListingContext {
  listingId: number;
  title: string;
  imageUrl: string;
  price: number;
  location: string;
}

/** Chat bubble for conversation thread UI. */
export interface UiChatMessage {
  id: string;
  text: string;
  side: 'left' | 'right';
  sentAt: string;
  senderId?: string;
  /** True when the recipient has read an outgoing message (never set for incoming). */
  ackRead: boolean;
}

/** Grouped inbox row on the messages tab (system / order / follow). */
export interface UiNotificationGroup {
  category: NotificationCategory;
  unreadCount: number;
  previewTitle: string;
  previewBody: string;
  timeLabel: string;
  icon: 'bell' | 'package' | 'star';
}

/** Single notification inside a group detail screen. */
export interface UiInboxNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  timeLabel: string;
  unread: boolean;
  actionType?: string;
  actionRef?: string;
}

/** Seller listing row for My Listings screen. */
export interface UiListing {
  id: number;
  title: string;
  imageUrl: string;
  imageUrls?: string[];
  listingType?: 'product' | 'service' | 'bundle';
  price: number;
  status: 'active' | 'draft' | 'inactive' | 'sold';
}

export type OrderFilterKey =
  | 'all'
  | 'pendingShip'
  | 'pendingReceive'
  | 'pendingReview'
  | 'completed';

export type OrderStatus =
  | 'pendingPay'
  | 'pendingShip'
  | 'pendingReceive'
  | 'pendingReview'
  | 'completed'
  | 'cancelled';

export type DemoOrder = {
  id: number;
  productId: number;
  status: OrderStatus;
};

/** Order row for orders list UI (from API or local demo). */
export interface UiOrder {
  id: number;
  listingId: number;
  title: string;
  imageUrl: string;
  sellerName: string;
  buyerId?: string;
  buyerName?: string;
  amount: number;
  status: OrderStatus;
  deliveryMethod?: string;
  paymentMethodId?: string;
  escrowFee?: number;
  bundleItemId?: string;
  couponId?: string;
  discountAmount?: number;
}
