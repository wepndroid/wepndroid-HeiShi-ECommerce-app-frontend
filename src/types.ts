export type ProductHeight = '' | 'tall' | 'short';

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
  | 'coupons';

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
  loc: string;
  height: ProductHeight;
  imageUrl: string;
  /** When set, detail copy comes from these i18n keys instead of products.items.{id}.* */
  titleKey?: string;
  descKey?: string;
  visualKey?: string;
  /** When set, prefer these API strings over i18n keys (catalog integration). */
  apiTitle?: string;
  apiDesc?: string;
  apiVisual?: string;
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
  lastMessage: string;
  timeLabel: string;
  unreadCount: number;
  verified?: boolean;
  listingId?: number;
}

/** Chat bubble for conversation thread UI. */
export interface UiChatMessage {
  id: string;
  text: string;
  side: 'left' | 'right';
}

/** Seller listing row for My Listings screen. */
export interface UiListing {
  id: number;
  title: string;
  imageUrl: string;
  price: number;
  status: 'active' | 'draft' | 'inactive';
}

export type OrderFilterKey =
  | 'all'
  | 'pendingPay'
  | 'pendingShip'
  | 'pendingReceive'
  | 'pendingReview';

export type OrderStatus = Exclude<OrderFilterKey, 'all'> | 'completed';

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
  amount: number;
  status: OrderStatus;
}
