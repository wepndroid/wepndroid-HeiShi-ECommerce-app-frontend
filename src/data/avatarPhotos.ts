/** Real portrait photos (Pexels) — keyed by seller slug or user id. */
export const PERSON_AVATAR_URLS: Record<string, string> = {
  mia: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
  sunny: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg',
  lucas: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
  xiaoyu: 'https://images.pexels.com/photos/12392920/pexels-photo-12392920.jpeg',
  amy: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
  ticketShop: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg',
  pte: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg',
  luna: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg',
  coffee: 'https://images.pexels.com/photos/1462630/pexels-photo-1462630.jpeg',
  allen: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg',
  lily: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg',
  riderY: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg',
  shop: 'https://images.pexels.com/photos/3777946/pexels-photo-3777946.jpeg',
  campusShop: 'https://images.pexels.com/photos/3777946/pexels-photo-3777946.jpeg',
  books: 'https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg',
  '12345678': 'https://images.pexels.com/photos/6457305/pexels-photo-6457305.jpeg',
  default: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
};

export function avatarKeyFromId(key: string): string {
  if (!key) return 'default';
  if (key in PERSON_AVATAR_URLS) return key;
  if (key.startsWith('seller-')) {
    const slug = key.slice('seller-'.length);
    if (slug in PERSON_AVATAR_URLS) return slug;
  }
  return 'default';
}

export function personAvatarUrlForKey(key: string, displaySize = 128): string {
  const resolved = PERSON_AVATAR_URLS[avatarKeyFromId(key)];
  const size = Math.min(Math.max(Math.round(displaySize * 2), 80), 256);
  return `${resolved}?auto=compress&cs=tinysrgb&w=${size}&h=${size}&fit=crop`;
}