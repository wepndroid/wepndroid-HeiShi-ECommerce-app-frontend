import {
  consumePriceChangeNotice,
  peekPriceChangeNotice,
  savePriceChangeNotice,
} from '../data/priceChangeNotify';
import { listConversations } from './messagesService';

export { consumePriceChangeNotice, peekPriceChangeNotice };

export async function queuePriceChangeNoticesForListing(
  listingId: number,
  newPrice: number,
  sellerUserId: string,
  isLoggedIn: boolean,
): Promise<void> {
  const conversations = await listConversations(isLoggedIn);
  await Promise.all(
    conversations
      .filter((row) => row.listingId === listingId)
      .map((row) =>
        savePriceChangeNotice(row.id, {
          listingId,
          newPrice,
          sellerUserId,
          createdAt: Date.now(),
        }),
      ),
  );
}
