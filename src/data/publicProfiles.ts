import type { PublicUserProfileDto } from '../api/types';
import { personAvatarUrlForKey } from './avatarPhotos';
import { sellerKeyFromUserId } from './catalogDemo';
import { resolveSellerUserId } from './follows';
import { products } from './products';

const DEMO_BIOS: Record<string, string> = {
  mia: 'Melbourne seller · Fast meetups · Digital & photo gear',
  sunny: 'Home & lifestyle items · CBD pickup available',
  lucas: 'Keyboards & tech accessories · Carlton area',
  xiaoyu: 'Cameras & film gear · Box Hill meetups',
  amy: 'Furniture & home essentials · Burwood',
  ticketShop: 'Event tickets · Southbank handoff',
  pte: 'PTE coaching & study services · Online & in-person',
  luna: 'Music & hobby gear · Docklands',
  coffee: 'Outdoor & safety gear · Richmond',
  allen: 'Moving help & motorcycle gear · Doncaster',
  lily: 'Textbooks & cleaning services · Clayton',
};

const DEMO_RATINGS: Record<string, { rating: number; reviewCount: number }> = {
  mia: { rating: 4.9, reviewCount: 18 },
  sunny: { rating: 4.8, reviewCount: 12 },
  lucas: { rating: 4.7, reviewCount: 9 },
  xiaoyu: { rating: 4.9, reviewCount: 14 },
  amy: { rating: 4.6, reviewCount: 7 },
  ticketShop: { rating: 4.5, reviewCount: 22 },
  pte: { rating: 5.0, reviewCount: 31 },
  luna: { rating: 4.8, reviewCount: 6 },
  coffee: { rating: 4.7, reviewCount: 4 },
  allen: { rating: 4.9, reviewCount: 11 },
  lily: { rating: 4.8, reviewCount: 8 },
};

function resolveSellerKey(userId: string): string | null {
  const fromId = sellerKeyFromUserId(userId);
  if (fromId) return fromId;
  const match = products.find((p) => resolveSellerUserId(p.sellerKey) === userId);
  return match?.sellerKey ?? null;
}

export function mockPublicProfile(userId: string): PublicUserProfileDto | null {
  const sellerKey = resolveSellerKey(userId);
  if (!sellerKey) return null;

  const sample = products.find((p) => p.sellerKey === sellerKey);
  if (!sample) return null;

  const ratingInfo = DEMO_RATINGS[sellerKey] ?? { rating: 4.7, reviewCount: 5 };
  const listingCount = products.filter((p) => p.sellerKey === sellerKey).length;

  return {
    id: userId,
    nickname: sample.seller,
    avatarUrl: personAvatarUrlForKey(sellerKey, 144),
    bio: DEMO_BIOS[sellerKey] ?? `Local seller in ${sample.loc}`,
    city: 'Melbourne',
    memberSince: '2024-03-01T00:00:00Z',
    rating: ratingInfo.rating,
    reviewCount: ratingInfo.reviewCount,
    listingCount,
    followerCount: 10 + listingCount * 4,
    phoneVerified: true,
    identityVerified: sellerKey.length % 2 === 0,
    businessVerified: sellerKey === 'pte' || sellerKey === 'ticketShop',
    wechatLinked: sellerKey === 'mia' || sellerKey === 'sunny',
    alipayLinked: true,
  };
}

export function mockPublicListingProducts(userId: string) {
  const sellerKey = resolveSellerKey(userId);
  if (!sellerKey) return [];
  return products.filter((p) => p.sellerKey === sellerKey);
}