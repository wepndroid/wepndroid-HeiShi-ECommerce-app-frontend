import React from 'react';
import type { RegionSelection } from '../data/region';
import {
  fetchSearchSuggestions,
  searchCatalog,
  type SearchSuggestion,
} from '../services/catalogService';
import type { Product } from '../types';

export function useSearch(region: RegionSelection, query: string) {
  const [results, setResults] = React.useState<Product[]>([]);
  const [suggestions, setSuggestions] = React.useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = React.useState(false);

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
  }, [region.state, region.city, region.area]);

  React.useEffect(() => {
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
  }, [region.state, region.city, region.area, query]);

  return { results, suggestions, loading };
}
