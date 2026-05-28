import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  description: string | null;
  active: boolean;
  website_url: string | null;
}

interface BrandState {
  activeBrand: Brand | null;
  setActiveBrand: (brand: Brand) => void;
  clearActiveBrand: () => void;
}

export const useBrandStore = create<BrandState>()(
  persist(
    (set) => ({
      activeBrand: null,
      setActiveBrand: (brand) => set({ activeBrand: brand }),
      clearActiveBrand: () => set({ activeBrand: null }),
    }),
    {
      name: 'elixir-active-brand',
    },
  ),
);
