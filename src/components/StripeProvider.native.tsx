import React from 'react';

type StripeProviderProps = {
  children: React.ReactElement | React.ReactElement[];
};

const publishableKey = (process.env?.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '').trim();
let RNStripeProvider:
  | React.ComponentType<{
      children: React.ReactElement | React.ReactElement[];
      publishableKey: string;
      merchantIdentifier?: string;
      urlScheme?: string;
      setReturnUrlSchemeOnAndroid?: boolean;
    }>
  | null = null;

try {
  RNStripeProvider = require('@stripe/stripe-react-native').StripeProvider;
} catch {
  RNStripeProvider = null;
}

export function StripeProvider({ children }: StripeProviderProps) {
  if (!publishableKey || !RNStripeProvider) {
    return <>{children}</>;
  }

  return (
    <RNStripeProvider
      publishableKey={publishableKey}
      merchantIdentifier="merchant.com.heishi.mvp"
      urlScheme="heishi"
      setReturnUrlSchemeOnAndroid
    >
      {children}
    </RNStripeProvider>
  );
}
