import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleProp, TextStyle } from 'react-native';
import { colors } from '../theme';

export type AppIconName =
  | 'search'
  | 'camera'
  | 'messages'
  | 'settings'
  | 'more'
  | 'bell'
  | 'heart'
  | 'heartOutline'
  | 'phone'
  | 'laptop'
  | 'sofa'
  | 'shirt'
  | 'sparkles'
  | 'headphones'
  | 'cart'
  | 'shoppingBags'
  | 'location'
  | 'shield'
  | 'chat'
  | 'chatBubble'
  | 'send'
  | 'upload'
  | 'box'
  | 'resale'
  | 'service'
  | 'cameraAlt'
  | 'edit'
  | 'cash'
  | 'grid'
  | 'diamond'
  | 'list'
  | 'time'
  | 'truck'
  | 'broom'
  | 'cameraService'
  | 'star'
  | 'ticket'
  | 'mic'
  | 'book'
  | 'bike'
  | 'wind'
  | 'scooter'
  | 'package'
  | 'sold'
  | 'orders'
  | 'coupon'
  | 'follow'
  | 'badge'
  | 'review'
  | 'warning'
  | 'block'
  | 'megaphone'
  | 'lock'
  | 'card'
  | 'wallet'
  | 'info'
  | 'document'
  | 'privacy'
  | 'help'
  | 'person'
  | 'key'
  | 'id'
  | 'store'
  | 'toolbox'
  | 'check'
  | 'chevronBack'
  | 'chevronForward'
  | 'trash'
  | 'home'
  | 'compass'
  | 'add'
  | 'personCircle'
  | 'mapPin'
  | 'pay'
  | 'apple'
  | 'paypal'
  | 'wechat'
  | 'alipay'
  | 'bank'
  | 'business'
  | 'trade';

type IconDef =
  | { set: 'ion'; name: keyof typeof Ionicons.glyphMap }
  | { set: 'mci'; name: keyof typeof MaterialCommunityIcons.glyphMap };

const ICONS: Record<AppIconName, IconDef> = {
  search: { set: 'ion', name: 'search-outline' },
  camera: { set: 'ion', name: 'camera-outline' },
  messages: { set: 'ion', name: 'chatbubble-ellipses-outline' },
  settings: { set: 'ion', name: 'settings-outline' },
  more: { set: 'ion', name: 'ellipsis-horizontal' },
  bell: { set: 'ion', name: 'notifications-outline' },
  heart: { set: 'ion', name: 'heart' },
  heartOutline: { set: 'ion', name: 'heart-outline' },
  phone: { set: 'ion', name: 'phone-portrait-outline' },
  laptop: { set: 'ion', name: 'laptop-outline' },
  sofa: { set: 'mci', name: 'sofa-outline' },
  shirt: { set: 'ion', name: 'shirt-outline' },
  sparkles: { set: 'ion', name: 'sparkles-outline' },
  headphones: { set: 'ion', name: 'headset-outline' },
  cart: { set: 'ion', name: 'bag-handle-outline' },
  shoppingBags: { set: 'mci', name: 'shopping-outline' },
  location: { set: 'ion', name: 'location-outline' },
  shield: { set: 'ion', name: 'shield-checkmark-outline' },
  chat: { set: 'ion', name: 'chatbubbles-outline' },
  chatBubble: { set: 'ion', name: 'chatbubble-outline' },
  send: { set: 'mci', name: 'send' },
  upload: { set: 'ion', name: 'cloud-upload-outline' },
  box: { set: 'ion', name: 'cube-outline' },
  resale: { set: 'ion', name: 'repeat-outline' },
  service: { set: 'ion', name: 'briefcase-outline' },
  cameraAlt: { set: 'ion', name: 'camera-outline' },
  edit: { set: 'ion', name: 'create-outline' },
  cash: { set: 'ion', name: 'cash-outline' },
  grid: { set: 'ion', name: 'grid-outline' },
  diamond: { set: 'ion', name: 'diamond-outline' },
  list: { set: 'ion', name: 'list-outline' },
  time: { set: 'ion', name: 'time-outline' },
  truck: { set: 'mci', name: 'truck-outline' },
  broom: { set: 'mci', name: 'broom' },
  cameraService: { set: 'ion', name: 'camera-outline' },
  star: { set: 'ion', name: 'star-outline' },
  ticket: { set: 'ion', name: 'ticket-outline' },
  mic: { set: 'ion', name: 'mic-outline' },
  book: { set: 'ion', name: 'book-outline' },
  bike: { set: 'mci', name: 'bike' },
  wind: { set: 'mci', name: 'hair-dryer' },
  scooter: { set: 'mci', name: 'scooter' },
  package: { set: 'ion', name: 'cube-outline' },
  sold: { set: 'ion', name: 'bag-check-outline' },
  orders: { set: 'ion', name: 'receipt-outline' },
  coupon: { set: 'ion', name: 'pricetag-outline' },
  follow: { set: 'ion', name: 'people-outline' },
  badge: { set: 'ion', name: 'ribbon-outline' },
  review: { set: 'ion', name: 'star-half-outline' },
  warning: { set: 'ion', name: 'warning-outline' },
  block: { set: 'ion', name: 'ban-outline' },
  megaphone: { set: 'ion', name: 'megaphone-outline' },
  lock: { set: 'ion', name: 'lock-closed-outline' },
  card: { set: 'ion', name: 'card-outline' },
  wallet: { set: 'ion', name: 'wallet-outline' },
  info: { set: 'ion', name: 'information-circle-outline' },
  document: { set: 'ion', name: 'document-text-outline' },
  privacy: { set: 'ion', name: 'lock-closed-outline' },
  help: { set: 'ion', name: 'help-circle-outline' },
  person: { set: 'ion', name: 'person-outline' },
  key: { set: 'ion', name: 'key-outline' },
  id: { set: 'ion', name: 'id-card-outline' },
  store: { set: 'ion', name: 'storefront-outline' },
  toolbox: { set: 'ion', name: 'construct-outline' },
  check: { set: 'ion', name: 'checkmark-circle' },
  chevronBack: { set: 'ion', name: 'chevron-back' },
  chevronForward: { set: 'ion', name: 'chevron-forward' },
  trash: { set: 'ion', name: 'trash-outline' },
  home: { set: 'ion', name: 'home-outline' },
  compass: { set: 'ion', name: 'compass-outline' },
  add: { set: 'ion', name: 'add' },
  personCircle: { set: 'ion', name: 'person-circle-outline' },
  mapPin: { set: 'ion', name: 'location-outline' },
  pay: { set: 'ion', name: 'card-outline' },
  apple: { set: 'ion', name: 'logo-apple' },
  paypal: { set: 'ion', name: 'logo-paypal' },
  wechat: { set: 'ion', name: 'logo-wechat' },
  alipay: { set: 'ion', name: 'wallet-outline' },
  bank: { set: 'mci', name: 'bank-outline' },
  business: { set: 'ion', name: 'business-outline' },
  trade: { set: 'ion', name: 'swap-horizontal-outline' },
};

export function AppIcon({
  name,
  size = 20,
  color = colors.text,
  style,
}: {
  name: AppIconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  const def = ICONS[name];
  if (def.set === 'mci') {
    return <MaterialCommunityIcons name={def.name} size={size} color={color} style={style} />;
  }
  return <Ionicons name={def.name} size={size} color={color} style={style} />;
}
