import { Redirect, useLocalSearchParams } from 'expo-router';
import { PublishBundleScreen } from '../../screens/PublishScreens';

export default function PublishBundleRoute() {
  const params = useLocalSearchParams<{ mode?: string; listingId?: string }>();
  if (params.mode === 'edit' && params.listingId) {
    return <PublishBundleScreen />;
  }
  return <Redirect href="/publish/product?tab=bundle" />;
}
