import { Redirect } from 'expo-router';

export default function PublishRentalRedirect() {
  return <Redirect href="/publish/product?kind=rental" />;
}
