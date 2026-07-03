import { Redirect } from 'expo-router';

export default function PublishJobRedirect() {
  return <Redirect href="/publish/product?kind=job" />;
}
