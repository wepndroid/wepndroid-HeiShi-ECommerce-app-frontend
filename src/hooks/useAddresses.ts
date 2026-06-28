import React from 'react';
import { useFocusEffect } from 'expo-router';
import type { AddressDto } from '../api/types';
import { createAddress, listAddresses, removeAddress, updateAddress } from '../services/userService';

export function useAddresses(isLoggedIn: boolean, authReady: boolean) {
  const [addresses, setAddresses] = React.useState<AddressDto[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(() => {
    if (!authReady) return;
    setLoading(true);
    listAddresses(isLoggedIn)
      .then(setAddresses)
      .finally(() => setLoading(false));
  }, [authReady, isLoggedIn]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const add = React.useCallback(
    async (body: Omit<AddressDto, 'id'>) => {
      const next = await createAddress(body, isLoggedIn);
      setAddresses((prev) => [...prev, next]);
      return next;
    },
    [isLoggedIn],
  );

  const remove = React.useCallback(
    async (id: string) => {
      await removeAddress(id, isLoggedIn);
      setAddresses((prev) => prev.filter((row) => row.id !== id));
    },
    [isLoggedIn],
  );

  const update = React.useCallback(
    async (id: string, patch: Partial<Omit<AddressDto, 'id'>>) => {
      const next = await updateAddress(id, patch, isLoggedIn);
      setAddresses((prev) =>
        prev.map((row) => {
          if (row.id === id) return next;
          if (patch.isDefault) return { ...row, isDefault: false };
          return row;
        }),
      );
      return next;
    },
    [isLoggedIn],
  );

  return { addresses, loading, refresh, add, remove, update };
}
