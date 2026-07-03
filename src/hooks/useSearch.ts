import React from 'react';
import type { RegionSelection } from '../data/region';
import i18n from '../i18n';
import {
  fetchSearchSuggestions,
  searchCatalog,
  type SearchSuggestion,
} from '../services/catalogService';
import type { Product } from '../types';
import { useCatalogRevision } from '../utils/catalogSync';

export function useSearch(
  region: RegionSelection,
  query: string,
  imageResults: Product[] | null,
  imageLoading: boolean,
) {
  const [results, setResults] = React.useState<Product[]>([]);
  const [suggestions, setSuggestions] = React.useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [debouncedQuery, setDebouncedQuery] = React.useState(query);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const isImageMode = imageResults != null || imageLoading;
  const catalogRevision = useCatalogRevision();

  const reload = React.useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  React.useEffect(() => {
    let cancelled = false;
    fetchSearchSuggestions(region, debouncedQuery)
      .then((items) => {
        if (!cancelled) setSuggestions(items);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [region.state, region.city, region.area, debouncedQuery, i18n.language, catalogRevision]);

  React.useEffect(() => {
    if (isImageMode) return undefined;

    let cancelled = false;
    setLoading(true);
    setError(false);
    searchCatalog(region, debouncedQuery.trim())
      .then((items) => {
        if (!cancelled) {
          setResults(items);
          setError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    region.state,
    region.city,
    region.area,
    debouncedQuery,
    isImageMode,
    i18n.language,
    catalogRevision,
    refreshKey,
  ]);

  return {
    results: imageResults ?? results,
    suggestions,
    loading: imageLoading || (isImageMode ? false : loading),
    error: isImageMode ? false : error,
    reload,
    isImageMode,
  };
}
