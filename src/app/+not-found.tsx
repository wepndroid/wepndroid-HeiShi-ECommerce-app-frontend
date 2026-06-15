import { Redirect } from 'expo-router';
import { ROOT_PATH } from '../routing/paths';

export default function NotFound() {
  return <Redirect href={ROOT_PATH} />;
}
