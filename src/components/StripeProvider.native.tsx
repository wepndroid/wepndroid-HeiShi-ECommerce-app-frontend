import React from 'react';

type StripeProviderProps = {
  children: React.ReactNode;
};

export function StripeProvider({ children }: StripeProviderProps) {
  return <>{children}</>;
}
