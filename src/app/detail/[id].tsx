import { useLayoutEffect, useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { DetailScreen } from '../../screens/DetailScreens';

export default function DetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loadProduct, currentItem } = useApp();

  const productId = useMemo(() => {
    const raw = Array.isArray(id) ? id[0] : id;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }, [id]);

  useLayoutEffect(() => {
    if (productId != null) {
      loadProduct(productId);
    }
  }, [productId, loadProduct]);

  if (productId == null || currentItem.id !== productId) {
    return null;
  }

  return <DetailScreen />;
}
