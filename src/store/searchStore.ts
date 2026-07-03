import { create } from 'zustand';
import type { Product } from '../types';

// Search box value + visual (image) search session. Mirrors the AppContext slice.
interface SearchState {
  searchValue: string;
  imageSearchResults: Product[] | null;
  imageSearchPreviewUri: string | null;
  imageSearchLoading: boolean;
  imageSearchError: boolean;
  setSearchValue: (v: string) => void;
  setImageSearchLoading: (loading: boolean) => void;
  setImageSearchError: (failed: boolean) => void;
  setImageSearchSession: (items: Product[], previewUri: string, suggestedQuery: string) => void;
  clearImageSearch: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  searchValue: '',
  imageSearchResults: null,
  imageSearchPreviewUri: null,
  imageSearchLoading: false,
  imageSearchError: false,
  setSearchValue: (v) => set({ searchValue: v }),
  setImageSearchLoading: (loading) => set({ imageSearchLoading: loading }),
  setImageSearchError: (failed) => set({ imageSearchError: failed }),
  setImageSearchSession: (items, previewUri, suggestedQuery) =>
    set({
      imageSearchResults: items,
      imageSearchPreviewUri: previewUri,
      imageSearchLoading: false,
      imageSearchError: false,
      ...(suggestedQuery ? { searchValue: suggestedQuery } : {}),
    }),
  clearImageSearch: () =>
    set({
      imageSearchResults: null,
      imageSearchPreviewUri: null,
      imageSearchLoading: false,
      imageSearchError: false,
    }),
}));
