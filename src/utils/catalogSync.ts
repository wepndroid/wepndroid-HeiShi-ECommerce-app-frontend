import { useSyncExternalStore } from 'react';

let revision = 0;
const listeners = new Set<() => void>();

export function getCatalogRevision(): number {
  return revision;
}

/** Bump after listing create/update/delete so feeds and search refetch. */
export function invalidateCatalog(): void {
  revision += 1;
  listeners.forEach((listener) => listener());
}

function subscribeCatalogRevision(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useCatalogRevision(): number {
  return useSyncExternalStore(subscribeCatalogRevision, getCatalogRevision, getCatalogRevision);
}