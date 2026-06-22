/**
 * Remote product photos (Pexels, free to use).
 * Each URL is verified (HTTP 200) and matched to the product title/content.
 */
export const productImageUrls = {
  /** 漫步者 W820NB 降噪耳机 */
  1: 'https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&w=800',
  /** SMEG 风格电水壶 */
  2: 'https://images.pexels.com/photos/4229710/pexels-photo-4229710.jpeg?auto=compress&cs=tinysrgb&w=800',
  /** Keychron K2 机械键盘 */
  3: 'https://images.pexels.com/photos/5472358/pexels-photo-5472358.jpeg?auto=compress&cs=tinysrgb&w=800',
  /** 富士 instax mini 40 拍立得 */
  4: 'https://images.pexels.com/photos/6964061/pexels-photo-6964061.jpeg?auto=compress&cs=tinysrgb&w=800',
  /** 北欧折叠书桌 */
  5: 'https://images.pexels.com/photos/2343474/pexels-photo-2343474.jpeg?auto=compress&cs=tinysrgb&w=800',
  /** 墨尔本演唱会门票 */
  6: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800',
  /** PTE口语陪练 1v1 */
  7: 'https://images.pexels.com/photos/3782179/pexels-photo-3782179.jpeg?auto=compress&cs=tinysrgb&w=800',
  /** 尤克里里初学套装 */
  8: 'https://images.pexels.com/photos/8414510/pexels-photo-8414510.jpeg?auto=compress&cs=tinysrgb&w=800',
  /** 二手自行车头盔 */
  9: 'https://images.pexels.com/photos/2254065/pexels-photo-2254065.jpeg?auto=compress&cs=tinysrgb&w=800',
  /** Dyson Supersonic 吹风机 */
  10: 'https://images.pexels.com/photos/3992209/pexels-photo-3992209.jpeg?auto=compress&cs=tinysrgb&w=800',
  /** 摩托车头盔与手套 */
  11: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=800',
  /** Marketing 教材资料 */
  12: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=800',
} as const;

export function productImageUrl(id: number): string {
  return productImageUrls[id as keyof typeof productImageUrls] ?? productImageUrls[1];
}

/** Demo gallery — primary photo plus distinct alternates for swipe preview. */
export function productGalleryUrls(id: number): string[] {
  const primary = productImageUrl(id);
  const altA = productImageUrl(((id % 12) + 1) || 1);
  const altB = productImageUrl(((id + 4) % 12) + 1);
  return [...new Set([primary, altA, altB])];
}
