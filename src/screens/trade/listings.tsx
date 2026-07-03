import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Text } from '../../components/typography';
import { useTranslation } from 'react-i18next';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useMyListings } from '../../hooks/useMyListings';
import { deleteListing, updateListing } from '../../services/listingsService';
import { TableNote } from '../../components/FormUI';
import { AmazingSurface } from '../../components/AmazingSurface';
import { OrderThumb } from '../../components/ProductUI';
import { PillButton, ScreenScroll, TitleBar, EmptyState, LoadingState } from '../../components/UI';
import { AppIcon } from '../../components/AppIcon';
import { colors } from '../../theme';
import { UiListing } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useCatalogStore } from '../../store/catalogStore';
import { requireAuthNav } from '../../store/navigation';
import { toast } from '../../store/uiStore';
import { styles, uiListingToProduct } from './shared';

export function MyListingsScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const authReady = useAuthStore((s) => s.authReady);
  const openDetail = useCatalogStore((s) => s.openDetail);
  const products = useCatalogStore((s) => s.products);
  const user = useAuthStore((s) => s.user);
  const [statusIndex, setStatusIndex] = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const statuses: Array<'active' | 'draft' | 'inactive' | undefined> = ['active', 'draft', 'inactive'];
  const status = statuses[statusIndex];
  const { listings, loading, error, refresh } = useMyListings(status, isLoggedIn, authReady);
  const productListings = useMemo(
    () => listings.filter((listing) => listing.listingType !== 'service'),
    [listings],
  );

  const openListingDetail = useCallback(
    (listing: UiListing) => {
      const fromCatalog = products.find((p) => p.id === listing.id);
      openDetail(fromCatalog ?? uiListingToProduct(listing, user?.id, user?.nickname));
    },
    [openDetail, products, user?.id, user?.nickname],
  );

  const confirmDeleteListing = useCallback(
    (listingId: number, title: string) => {
      Alert.alert(t('screens.myListings.deleteTitle'), t('screens.myListings.deleteBody', { title }), [
        { text: t('screens.myListings.cancel'), style: 'cancel' },
        {
          text: t('screens.myListings.deleteConfirm'),
          style: 'destructive',
          onPress: () => {
            setDeletingId(listingId);
            void deleteListing(listingId, isLoggedIn)
              .then(() => {
                toast(t('toast.listingDeleted'));
                refresh();
              })
              .catch(() => toast(t('toast.listingDeleteFailed')))
              .finally(() => setDeletingId(null));
          },
        },
      ]);
    },
    [isLoggedIn, refresh, t],
  );

  const openEditListing = useCallback(
    (listing: UiListing) => {
      if (listing.listingType === 'bundle') {
        router.push(`/publish/bundle?mode=edit&listingId=${listing.id}`);
        return;
      }
      if (listing.listingType === 'service') {
        router.push(`/publish/service?mode=edit&listingId=${listing.id}`);
        return;
      }
      if (listing.listingType && listing.listingType !== 'product') {
        toast(t('toast.editListingTypeUnsupported'));
        return;
      }
      router.push(`/publish/product?mode=edit&listingId=${listing.id}`);
    },
    [t],
  );

  const relistListing = useCallback(
    (listingId: number) => {
      void updateListing(listingId, { status: 'active' }, isLoggedIn)
        .then(() => {
          toast(t('toast.listingRelisted'));
          refresh();
        })
        .catch(() => toast(t('toast.publishFailed')));
    },
    [isLoggedIn, refresh, t],
  );

  return (
    <ScreenScroll screenId="myListings">
      <TitleBar center={t('screens.myListings.title')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {[t('screens.myListings.active'), t('screens.myListings.draft'), t('screens.myListings.inactive')].map((chip, i) => (
          <Pressable key={chip} style={[styles.chip, i === statusIndex && styles.chipActive]} onPress={() => setStatusIndex(i)}>
            <Text style={[styles.chipText, i === statusIndex && styles.chipTextActive]} numberOfLines={1}>
              {chip}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {loading ? (
        <LoadingState />
      ) : error ? (
        <>
          <EmptyState text={t('screens.myListings.loadFailed')} />
          <PillButton label={t('common.retry')} variant="light" full onPress={refresh} />
        </>
      ) : productListings.length ? (
        productListings.map((listing) => (
          <AmazingSurface key={listing.id} style={styles.orderItem}>
            <View style={styles.listingRow}>
              <Pressable
                style={styles.listingTapArea}
                onPress={() => openListingDetail(listing)}
                accessibilityRole="button"
              >
                <View style={styles.orderMid}>
                  <OrderThumb imageUrl={listing.imageUrl} />
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderTitle} numberOfLines={2}>
                      {listing.title}
                    </Text>
                    {listing.reviewStatus === 'pendingReview' && status === 'active' ? (
                      <Text style={styles.reviewPendingBadge}>{t('screens.myListings.reviewPending')}</Text>
                    ) : null}
                    <Text style={styles.price}>
                      {t('common.currencyPrefix')}
                      {listing.price}
                    </Text>
                  </View>
                </View>
              </Pressable>
              {status === 'inactive' ? (
                <Pressable
                  style={styles.editBtn}
                  onPress={() => relistListing(listing.id)}
                  accessibilityRole="button"
                  accessibilityLabel={t('screens.myListings.relistA11y')}
                  hitSlop={8}
                >
                  <AppIcon name="upload" size={18} color={colors.sub} />
                </Pressable>
              ) : listing.listingType === 'product' || listing.listingType === 'bundle' || !listing.listingType ? (
                <Pressable
                  style={styles.editBtn}
                  onPress={() => openEditListing(listing)}
                  accessibilityRole="button"
                  accessibilityLabel={t('screens.myListings.editA11y')}
                  hitSlop={8}
                >
                  <AppIcon name="edit" size={18} color={colors.sub} />
                </Pressable>
              ) : null}
              <Pressable
                style={[styles.deleteBtn, deletingId === listing.id && styles.deleteBtnDisabled]}
                onPress={() => confirmDeleteListing(listing.id, listing.title)}
                disabled={deletingId === listing.id}
                accessibilityRole="button"
                accessibilityLabel={t('screens.myListings.deleteA11y')}
                hitSlop={8}
              >
                <AppIcon name="trash" size={18} color={colors.sub} />
              </Pressable>
            </View>
          </AmazingSurface>
        ))
      ) : (
        <EmptyState text={t('screens.myListings.empty')} />
      )}
      <PillButton label={t('screens.myListings.goPublish')} variant="brand" full onPress={() => requireAuthNav('publish')} />
    </ScreenScroll>
  );
}

export function MyServicesScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const isLoggedIn = useAuthStore((s) => s.user != null);
  const authReady = useAuthStore((s) => s.authReady);
  const openDetail = useCatalogStore((s) => s.openDetail);
  const products = useCatalogStore((s) => s.products);
  const user = useAuthStore((s) => s.user);
  const [statusIndex, setStatusIndex] = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const statuses: Array<'active' | 'draft' | 'inactive' | undefined> = ['active', 'draft', 'inactive'];
  const status = statuses[statusIndex];
  const { listings, loading, error, refresh } = useMyListings(status, isLoggedIn, authReady);
  const serviceListings = useMemo(
    () => listings.filter((listing) => listing.listingType === 'service'),
    [listings],
  );

  const openListingDetail = useCallback(
    (listing: UiListing) => {
      const fromCatalog = products.find((p) => p.id === listing.id);
      openDetail(fromCatalog ?? uiListingToProduct(listing, user?.id, user?.nickname));
    },
    [openDetail, products, user?.id, user?.nickname],
  );

  const openEditService = useCallback((listing: UiListing) => {
    router.push(`/publish/service?mode=edit&listingId=${listing.id}`);
  }, []);

  const relistListing = useCallback(
    (listingId: number) => {
      void updateListing(listingId, { status: 'active' }, isLoggedIn)
        .then(() => {
          toast(t('toast.listingRelisted'));
          refresh();
        })
        .catch(() => toast(t('toast.publishFailed')));
    },
    [isLoggedIn, refresh, t],
  );

  const confirmDeleteListing = useCallback(
    (listingId: number, title: string) => {
      Alert.alert(t('screens.myListings.deleteTitle'), t('screens.myListings.deleteBody', { title }), [
        { text: t('screens.myListings.cancel'), style: 'cancel' },
        {
          text: t('screens.myListings.deleteConfirm'),
          style: 'destructive',
          onPress: () => {
            setDeletingId(listingId);
            void deleteListing(listingId, isLoggedIn)
              .then(() => {
                toast(t('toast.listingDeleted'));
                refresh();
              })
              .catch(() => toast(t('toast.listingDeleteFailed')))
              .finally(() => setDeletingId(null));
          },
        },
      ]);
    },
    [isLoggedIn, refresh, t],
  );

  return (
    <ScreenScroll screenId="myServices">
      <TitleBar center={t('screens.myServices.title')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {[t('screens.myListings.active'), t('screens.myListings.draft'), t('screens.myListings.inactive')].map((chip, i) => (
          <Pressable key={chip} style={[styles.chip, i === statusIndex && styles.chipActive]} onPress={() => setStatusIndex(i)}>
            <Text style={[styles.chipText, i === statusIndex && styles.chipTextActive]} numberOfLines={1}>
              {chip}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {loading ? (
        <LoadingState />
      ) : error ? (
        <>
          <EmptyState text={t('screens.myListings.loadFailed')} />
          <PillButton label={t('common.retry')} variant="light" full onPress={refresh} />
        </>
      ) : serviceListings.length ? (
        serviceListings.map((listing) => (
          <AmazingSurface key={listing.id} style={styles.orderItem}>
            <View style={styles.listingRow}>
              <Pressable
                style={styles.listingTapArea}
                onPress={() => openListingDetail(listing)}
                accessibilityRole="button"
              >
                <View style={styles.orderMid}>
                  <OrderThumb imageUrl={listing.imageUrl} />
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderTitle} numberOfLines={2}>
                      {listing.title}
                    </Text>
                    {listing.reviewStatus === 'pendingReview' && status === 'active' ? (
                      <Text style={styles.reviewPendingBadge}>{t('screens.myListings.reviewPending')}</Text>
                    ) : null}
                    <Text style={styles.price}>
                      {t('common.currencyPrefix')}
                      {listing.price}
                    </Text>
                  </View>
                </View>
              </Pressable>
              {status === 'inactive' ? (
                <Pressable
                  style={styles.editBtn}
                  onPress={() => relistListing(listing.id)}
                  accessibilityRole="button"
                  accessibilityLabel={t('screens.myListings.relistA11y')}
                  hitSlop={8}
                >
                  <AppIcon name="upload" size={18} color={colors.sub} />
                </Pressable>
              ) : (
                <Pressable
                  style={styles.editBtn}
                  onPress={() => openEditService(listing)}
                  accessibilityRole="button"
                  accessibilityLabel={t('screens.myListings.editA11y')}
                  hitSlop={8}
                >
                  <AppIcon name="edit" size={18} color={colors.sub} />
                </Pressable>
              )}
              <Pressable
                style={[styles.deleteBtn, deletingId === listing.id && styles.deleteBtnDisabled]}
                onPress={() => confirmDeleteListing(listing.id, listing.title)}
                disabled={deletingId === listing.id}
                accessibilityRole="button"
                accessibilityLabel={t('screens.myListings.deleteA11y')}
                hitSlop={8}
              >
                <AppIcon name="trash" size={18} color={colors.sub} />
              </Pressable>
            </View>
          </AmazingSurface>
        ))
      ) : (
        <EmptyState text={t('screens.myServices.empty')} />
      )}
      <TableNote>{t('screens.myServices.note')}</TableNote>
      <PillButton label={t('screens.myServices.publish')} variant="brand" full onPress={() => requireAuthNav('publishService')} />
    </ScreenScroll>
  );
}
