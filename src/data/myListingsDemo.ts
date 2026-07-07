import i18n from '../i18n';
import { productImageUrls } from './productImages';
import type { UiListing } from '../types';

/** Demo seller listings when API returns empty (UI verification). */
export function demoMyListings(
  status?: 'active' | 'draft' | 'inactive',
): UiListing[] {
  const rows: UiListing[] = [
    {
      id: 9001,
      title: i18n.t('demoMyListings.activeProduct.title'),
      imageUrl: productImageUrls[3],
      price: 79,
      status: 'active',
      listingType: 'product',
      reviewStatus: 'approved',
    },
    {
      id: 9002,
      title: i18n.t('demoMyListings.pendingProduct.title'),
      imageUrl: productImageUrls[5],
      price: 45,
      status: 'active',
      listingType: 'product',
      reviewStatus: 'pendingReview',
    },
    {
      id: 9006,
      title: 'Rejected listing',
      imageUrl: productImageUrls[9],
      price: 66,
      status: 'active',
      listingType: 'product',
      reviewStatus: 'rejected',
      reviewNote: 'Counterfeit / replica items are not allowed.',
    },
    {
      id: 9003,
      title: i18n.t('demoMyListings.draftProduct.title'),
      imageUrl: productImageUrls[8],
      price: 55,
      status: 'draft',
      listingType: 'product',
      reviewStatus: 'draft',
    },
    {
      id: 9004,
      title: i18n.t('demoMyListings.activeService.title'),
      imageUrl: productImageUrls[7],
      price: 35,
      status: 'active',
      listingType: 'service',
      reviewStatus: 'approved',
    },
    {
      id: 9005,
      title: i18n.t('demoMyListings.activeService2.title'),
      imageUrl: productImageUrls[15],
      price: 80,
      status: 'active',
      listingType: 'service',
      reviewStatus: 'approved',
    },
  ];
  if (!status) return rows;
  return rows.filter((row) => row.status === status);
}
