import React from 'react';
import type { RegionSelection } from '../data/region';
import i18n from '../i18n';
import {
  fetchSearchSuggestions,
  searchCatalog,
  type SearchSuggestion,
} from '../services/catalogService';
import type { Product } from '../types';

export function useSearch(
  region: RegionSelection,
  query: string,
  imageResults: Product[] | null,
  imageLoading: boolean,
) {
  const [results, setResults] = React.useState<Product[]>([]);
  const [suggestions, setSuggestions] = React.useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const isImageMode = imageResults != null || imageLoading;

  React.useEffect(() => {
    let cancelled = false;
    fetchSearchSuggestions(region)
      .then((items) => {
        if (!cancelled) setSuggestions(items);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [region.state, region.city, region.area, i18n.language]);

  React.useEffect(() => {
    if (isImageMode) return undefined;

    let cancelled = false;
    setLoading(true);
    searchCatalog(region, query.trim())
      .then((items) => {
        if (!cancelled) setResults(items);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [region.state, region.city, region.area, query, isImageMode, i18n.language]);

  return {
    results: imageResults ?? results,
    suggestions,
    loading: imageLoading || (isImageMode ? false : loading),
    isImageMode,
  };
}
