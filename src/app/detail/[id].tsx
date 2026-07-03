import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCatalogStore } from '../../store/catalogStore';
import { EmptyState, LoadingState, PillButton } from '../../components/UI';
import { DetailScreen } from '../../screens/DetailScreens';

export default function DetailRoute() {
  const { id, context } = useLocalSearchParams<{ id: string; context?: string | string[] }>();
  const loadProduct = useCatalogStore((s) => s.loadProduct);
  const currentItem = useCatalogStore((s) => s.currentItem);
  const { t } = useTranslation();
  const [missing, setMissing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [detailReady, setDetailReady] = useState(false);
  const loadProductRef = useRef(loadProduct);
  loadProductRef.current = loadProduct;

  const productId = useMemo(() => {
    const raw = Array.isArray(id) ? id[0] : id;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }, [id]);

  const orderContext = useMemo(() => {
    const raw = Array.isArray(context) ? context[0] : context;
    return raw === 'order';
  }, [context]);

  const runLoad = () => {
    if (productId == null) return;
    setMissing(false);
    setLoadError(false);
    setDetailReady(false);
    void loadProductRef.current(productId).then((result) => {
      if (result === 'not_found') setMissing(true);
      if (result === 'error') setLoadError(true);
      setDetailReady(true);
    });
  };

  useLayoutEffect(() => {
    if (productId == null) return;
    let cancelled = false;
    setMissing(false);
    setLoadError(false);
    setDetailReady(false);
    void loadProductRef.current(productId).then((result) => {
      if (cancelled) return;
      if (result === 'not_found') setMissing(true);
      if (result === 'error') setLoadError(true);
      setDetailReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (productId == null) {
    return <EmptyState text={t('common.listingNotFound')} />;
  }
  if (loadError) {
    return (
      <>
        <EmptyState text={t('common.listingLoadFailed')} />
        <PillButton label={t('common.retry')} variant="light" full onPress={runLoad} />
      </>
    );
  }
  if (missing) {
    return <EmptyState text={t('common.listingNotFound')} />;
  }
  if (!detailReady || currentItem.id !== productId) {
    return <LoadingState />;
  }

  return <DetailScreen orderContext={orderContext} />;
}
