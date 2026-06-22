import { useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { SellerProfileScreen } from '../../screens/SellerProfileScreen';

export default function SellerProfileRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const userId = useMemo(() => {
    const raw = Array.isArray(id) ? id[0] : id;
    return raw?.trim() || null;
  }, [id]);

  if (!userId) return null;

  return <SellerProfileScreen userId={decodeURIComponent(userId)} />;
}