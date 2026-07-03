import { create } from 'zustand';
import i18n from '../i18n';
import {
  ALL_AREAS,
  DEFAULT_REGION,
  formatAreaLabel,
  regionLabel,
  RegionSelection,
} from '../data/region';
import { toast } from './uiStore';

// Selected region + region-sheet visibility. `regionLabelText` is derived via
// the `regionLabel` helper by consumers (kept out of state to avoid drift).
interface RegionState {
  region: RegionSelection;
  regionSheetVisible: boolean;
  setRegion: (region: RegionSelection) => void;
  openRegionSheet: () => void;
  closeRegionSheet: () => void;
}

export const useRegionStore = create<RegionState>((set) => ({
  region: DEFAULT_REGION,
  regionSheetVisible: false,
  setRegion: (next) => {
    set({ region: next });
    toast(
      next.area === ALL_AREAS
        ? i18n.t('toast.regionCity', { city: next.city })
        : i18n.t('toast.regionArea', { area: formatAreaLabel(next.area) }),
    );
  },
  openRegionSheet: () => set({ regionSheetVisible: true }),
  closeRegionSheet: () => set({ regionSheetVisible: false }),
}));

export { regionLabel };
