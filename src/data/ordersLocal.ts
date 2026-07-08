import AsyncStorage from '@react-native-async-storage/async-storage';
import { demoOrders, demoSalesOrders, filterOrders } from './orders';
import type { OrderFilterKey, OrderStatus, Product, UiOrder } from '../types';
import { ESCROW_FEE } from '../hooks/useProductFilters';

const LOCAL_ORDERS_KEY = 'localOrders';
const STATUS_OVERRIDES_KEY = 'orderStatusOverrides';
const AMOUNT_OVERRIDES_KEY = 'orderAmountOverrides';

export interface LocalOrderRecord {
  id: number;
  listingId: number;
  listingTitle: string;
  listingImageUrl: string;
  sellerName: string;
  amount: number;
  escrowFee: number;
  status: OrderStatus;
  deliveryMethod: string;
}

async function loadLocalOrderRecords(): Promise<LocalOrderRecord[]> {
  const raw = await AsyncStorage.getItem(LOCAL_ORDERS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as LocalOrderRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveLocalOrderRecords(orders: LocalOrderRecord[]) {
  await AsyncStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
}

async function loadStatusOverrides(): Promise<Record<number, OrderStatus>> {
  const raw = await AsyncStorage.getItem(STATUS_OVERRIDES_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<number, OrderStatus>;
  } catch {
    return {};
  }
}

async function saveStatusOverride(orderId: number, status: OrderStatus) {
  const overrides = await loadStatusOverrides();
  overrides[orderId] = status;
  await AsyncStorage.setItem(STATUS_OVERRIDES_KEY, JSON.stringify(overrides));
}

async function loadAmountOverrides(): Promise<Record<number, number>> {
  const raw = await AsyncStorage.getItem(AMOUNT_OVERRIDES_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<number, number>;
  } catch {
    return {};
  }
}

export async function updateLocalOrderAmount(orderId: number, amount: number) {
  const records = await loadLocalOrderRecords();
  const index = records.findIndex((o) => o.id === orderId);
  if (index >= 0) {
    records[index] = { ...records[index], amount };
    await saveLocalOrderRecords(records);
    return;
  }
  const overrides = await loadAmountOverrides();
  overrides[orderId] = amount;
  await AsyncStorage.setItem(AMOUNT_OVERRIDES_KEY, JSON.stringify(overrides));
}

export function mapLocalOrderToUi(order: LocalOrderRecord): UiOrder {
  return {
    id: order.id,
    listingId: order.listingId,
    title: order.listingTitle,
    imageUrl: order.listingImageUrl,
    sellerName: order.sellerName,
    amount: order.amount,
    status: order.status,
  };
}

function mapDemoOrderToUi(
  order: (typeof demoOrders)[number],
  product: Product | undefined,
  title: string,
  sellerName: string,
  status: OrderStatus,
): UiOrder | null {
  if (!product) return null;
  return {
    id: order.id,
    listingId: order.productId,
    title,
    imageUrl: product.imageUrl,
    sellerName,
    amount: product.price,
    status,
  };
}

export async function listLocalOrders(
  filter: OrderFilterKey,
  products: Product[],
  resolveTitle: (product: Product) => string,
  resolveSeller: (product: Product) => string,
): Promise<UiOrder[]> {
  return mergeDemoOrders(filter, products, resolveTitle, resolveSeller, demoOrders);
}

export async function listLocalSalesOrders(
  filter: OrderFilterKey,
  products: Product[],
  resolveTitle: (product: Product) => string,
  resolveSeller: (product: Product) => string,
): Promise<UiOrder[]> {
  return mergeDemoOrders(filter, products, resolveTitle, resolveSeller, demoSalesOrders);
}

async function mergeDemoOrders(
  filter: OrderFilterKey,
  products: Product[],
  resolveTitle: (product: Product) => string,
  resolveSeller: (product: Product) => string,
  demoSource: typeof demoOrders,
): Promise<UiOrder[]> {
  const overrides = await loadStatusOverrides();
  const amountOverrides = await loadAmountOverrides();
  const localRecords = await loadLocalOrderRecords();

  const demoUi = demoSource
    .map((order) => {
      const product = products.find((p) => p.id === order.productId);
      const status = overrides[order.id] ?? order.status;
      const mapped = mapDemoOrderToUi(
        order,
        product,
        product ? resolveTitle(product) : '',
        product ? resolveSeller(product) : '',
        status,
      );
      if (!mapped) return null;
      const amount = amountOverrides[order.id];
      return amount != null ? { ...mapped, amount } : mapped;
    })
    .filter((row): row is UiOrder => row != null);

  const localUi = localRecords.map(mapLocalOrderToUi);
  const merged = [...localUi, ...demoUi.filter((d) => !localUi.some((l) => l.id === d.id))];
  return filterOrders(
    merged.map((o) => ({ id: o.id, productId: o.listingId, status: o.status })),
    filter,
  )
    .map((filtered) => merged.find((o) => o.id === filtered.id))
    .filter((row): row is UiOrder => row != null);
}

export async function createLocalOrder(input: {
  listingId: number;
  deliveryMethod: string;
  product: Product;
  title: string;
  sellerName: string;
}): Promise<UiOrder> {
  const records = await loadLocalOrderRecords();
  const id = (Date.now() % 900_000) + 1000;
  const record: LocalOrderRecord = {
    id,
    listingId: input.listingId,
    listingTitle: input.title,
    listingImageUrl: input.product.imageUrl,
    sellerName: input.sellerName,
    amount: input.product.price,
    escrowFee: ESCROW_FEE,
    status: 'pendingPay',
    deliveryMethod: input.deliveryMethod,
  };
  await saveLocalOrderRecords([record, ...records]);
  return mapLocalOrderToUi(record);
}

export async function updateLocalOrderStatus(orderId: number, status: OrderStatus) {
  const records = await loadLocalOrderRecords();
  const index = records.findIndex((o) => o.id === orderId);
  if (index >= 0) {
    records[index] = { ...records[index], status };
    await saveLocalOrderRecords(records);
    return;
  }
  await saveStatusOverride(orderId, status);
}

export async function applyLocalOrderAction(
  orderId: number,
  currentStatus: OrderStatus,
  action: 'pay' | 'ship' | 'remindShip' | 'confirmReceive' | 'submitReview' | 'cancel' | 'dispute' | 'refund',
): Promise<OrderStatus> {
  let next = currentStatus;
  switch (action) {
    case 'pay':
      if (currentStatus === 'pendingPay') next = 'pendingShip';
      break;
    case 'ship':
      if (currentStatus === 'pendingShip') next = 'pendingReceive';
      break;
    case 'remindShip':
      break;
    case 'confirmReceive':
      if (currentStatus === 'pendingReceive') next = 'pendingReview';
      break;
    case 'submitReview':
      if (currentStatus === 'pendingReview') next = 'completed';
      break;
    case 'cancel':
      if (currentStatus === 'pendingPay') next = 'cancelled';
      break;
    case 'dispute':
    case 'refund':
      next = 'refundInProgress';
      break;
  }
  await updateLocalOrderStatus(orderId, next);
  return next;
}
